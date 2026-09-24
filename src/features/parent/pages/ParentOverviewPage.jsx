import { ArrowRight, Baby, BookOpen, CheckCircle, Clock, Plus, Sparkle } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const rangeOptions = [["7d", "7 ngày gần đây"], ["30d", "30 ngày gần đây"]];

export default function ParentOverviewPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") || "7d";
  const simulate = searchParams.get("simulate") || "";
  const childrenQuery = useQuery({ queryKey: queryKeys.children(user.id), queryFn: ({ signal }) => childrenService.list({ signal }) });
  const entitlementQuery = useQuery({ queryKey: queryKeys.entitlement(user.id), queryFn: ({ signal }) => childrenService.entitlement({ signal }) });
  const dashboardQuery = useQuery({ queryKey: queryKeys.parentDashboard(user.id, range, simulate), queryFn: ({ signal }) => childrenService.dashboard({ range, simulate, signal }) });

  function changeRange(event) {
    const next = new URLSearchParams(searchParams);
    next.set("range", event.target.value);
    setSearchParams(next);
  }

  const dashboard = dashboardQuery.data;
  const hasRecentActivities = Boolean(dashboard?.recentActivities?.length);
  const hasChildHighlights = Boolean(dashboard?.childHighlights?.length);

  return (
    <div className="parent-page">
      <div className="workspace-page-heading">
        <div><p className="workspace-eyebrow">GÓC CỦA GIA ĐÌNH</p><h1>Chào {user.name.split(" ")[0]},<br />mình cùng mở một trang nhé.</h1><p>Theo dõi những nhân vật, câu chuyện và khoảnh khắc đang lớn lên cùng bé.</p></div>
        <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm hồ sơ bé</Link>
      </div>
      <div className="parent-overview-grid">
        <section className="parent-welcome-panel">
          <div><span className="parent-panel-kicker"><Sparkle size={16} weight="fill" aria-hidden="true" /> BƯỚC ĐẦU NHẸ NHÀNG</span><h2>Hồ sơ bé là nơi bắt đầu câu chuyện riêng.</h2><p>Tạo hồ sơ đầu tiên để SketchTale có thể ghi nhớ sở thích và hành trình đọc của bé.</p><Link to="/parent/children" className="parent-text-link">Xem danh sách hồ sơ <ArrowRight size={17} aria-hidden="true" /></Link></div>
          <div className="parent-welcome-illustration"><Baby size={78} weight="duotone" aria-hidden="true" /></div>
        </section>
        <section className="parent-stat-panel">
          <span className="parent-panel-kicker">GÓI HIỆN TẠI</span>
          {entitlementQuery.isLoading ? <LoadingState label="Đang tải hạn mức" /> : entitlementQuery.isError ? <ErrorState message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} /> : <><div className="parent-plan-line"><strong>{entitlementQuery.data.plan}</strong><StatusBadge value={entitlementQuery.data.plan} tone="gold" /></div><p className="parent-usage-label">Hồ sơ bé đã dùng</p><div className="parent-usage"><strong>{entitlementQuery.data.usedChildProfiles}</strong><span>/ {entitlementQuery.data.childProfileLimit ?? "∞"}</span></div><div className="parent-progress"><span style={{ width: `${entitlementQuery.data.childProfileLimit ? Math.min(100, entitlementQuery.data.usedChildProfiles / entitlementQuery.data.childProfileLimit * 100) : 8}%` }} /></div><Link to="/parent/plan" className="parent-text-link">Xem gói và hạn mức <ArrowRight size={17} aria-hidden="true" /></Link></>}
        </section>
      </div>

      <section className="parent-dashboard-section">
        <div className="parent-section-heading"><div><p className="workspace-eyebrow">TỔNG QUAN ĐỌC</p><h2>Nhịp đọc của gia đình</h2></div><label className="data-range-control"><span>Khoảng thời gian</span><select id="parent-dashboard-range" aria-label="Khoảng thời gian dashboard" value={range} onChange={changeRange}>{rangeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
        {dashboardQuery.isLoading && <LoadingState label="Đang tổng hợp dữ liệu gia đình" />}
        {dashboardQuery.isError && <ErrorState title="Không thể tải tổng quan" message={dashboardQuery.error.message} onRetry={() => dashboardQuery.refetch()} />}
        {dashboard && <>
          <div className="workspace-stat-grid parent-dashboard-stat-grid">
            <article className="workspace-stat-card"><span className="workspace-stat-icon"><Clock size={21} aria-hidden="true" /></span><span className="workspace-stat-label">Phút đọc</span><strong>{dashboard.summary.readingMinutes}</strong><small>phút</small></article>
            <article className="workspace-stat-card"><span className="workspace-stat-icon"><BookOpen size={21} aria-hidden="true" /></span><span className="workspace-stat-label">Truyện hoàn thành</span><strong>{dashboard.summary.storiesCompleted}</strong><small>truyện</small></article>
            <article className="workspace-stat-card"><span className="workspace-stat-icon"><Sparkle size={21} aria-hidden="true" /></span><span className="workspace-stat-label">Từ vựng đã ôn</span><strong>{dashboard.summary.vocabularyReviewed}</strong><small>từ</small></article>
            <article className="workspace-stat-card"><span className="workspace-stat-icon"><CheckCircle size={21} aria-hidden="true" /></span><span className="workspace-stat-label">Chờ bố mẹ duyệt</span><strong>{dashboard.summary.pendingApprovals}</strong><small>phiên bản</small></article>
          </div>
          {dashboard.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}
          <div className="parent-dashboard-columns">
            <section className="analytics-card"><div className="analytics-card-heading"><div><h3>Hoạt động gần đây</h3><p>Chỉ hiển thị những sự kiện API đã trả về.</p></div></div>{hasRecentActivities && <div className="activity-list">{dashboard.recentActivities.map((activity) => <Link className="activity-item" to={activity.type === "approval" ? "/parent/children/child-minh-01/approvals" : "/parent/children/child-minh-01/progress"} key={activity.id}><span className="activity-icon"><CheckCircle size={17} aria-hidden="true" /></span><span><strong>{activity.title}</strong><small>{activity.detail} · {formatDateTime(activity.createdAt)}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div>}{!hasRecentActivities && <EmptyState title="Chưa có hoạt động" message="Hoạt động sẽ xuất hiện sau khi bé bắt đầu đọc." />}</section>
            <section className="analytics-card"><div className="analytics-card-heading"><div><h3>Theo từng bé</h3><p>Tóm tắt từ aggregate endpoint, không tự cộng record trên browser.</p></div></div>{hasChildHighlights && <div className="child-highlight-list">{dashboard.childHighlights.map((item) => <Link className="child-highlight-item" to={`/parent/children/${item.childId}/progress?range=${range}`} key={item.childId}><span><strong>{item.displayName}</strong><small>{item.lastReadAt ? `Đọc gần nhất ${formatDateTime(item.lastReadAt)}` : "Chưa có lượt đọc"}</small></span><b>{item.readingMinutes}<small> phút</small></b></Link>)}</div>}{!hasChildHighlights && <EmptyState icon={Baby} title="Chưa có hồ sơ bé" message="Tạo hồ sơ để bắt đầu theo dõi tiến độ." action={<Link className="workspace-button workspace-button-quiet" to="/parent/children/new">Tạo hồ sơ bé</Link>} />}</section>
          </div>
        </>}
      </section>

      <section className="parent-section-block">
        <div className="parent-section-heading"><div><p className="workspace-eyebrow">HỒ SƠ BÉ</p><h2>Những người kể chuyện nhỏ</h2></div><Link to="/parent/children">Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link></div>
        {childrenQuery.isLoading ? <LoadingState label="Đang tải hồ sơ" /> : childrenQuery.isError ? <ErrorState message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} /> : childrenQuery.data.items.length ? <div className="parent-mini-children">{childrenQuery.data.items.slice(0, 3).map((child) => <Link to={`/parent/children/${child.id}`} className="parent-mini-child" key={child.id}><img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="50" height="50" /><span><strong>{child.displayName}</strong><small>Khám phá hồ sơ</small></span><CheckCircle size={19} aria-hidden="true" /></Link>)}</div> : <EmptyState icon={Baby} title="Chưa có hồ sơ bé" message="Bắt đầu bằng một cái tên thân thương." action={<Link className="workspace-button" to="/parent/children/new">Tạo hồ sơ đầu tiên</Link>} />}
      </section>
    </div>
  );
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
