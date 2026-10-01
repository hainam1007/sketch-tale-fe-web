import { ArrowRight, Baby, Bell, BookOpen, CheckCircle, Clock, Plus, Sparkle } from "@phosphor-icons/react";
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
  const children = childrenQuery.data?.items || [];
  const hasChildren = children.length > 0;
  const hasRecentActivities = Boolean(dashboard?.recentActivities?.length);
  const hasChildHighlights = Boolean(dashboard?.childHighlights?.length);
  const pendingApprovals = dashboard?.summary?.pendingApprovals || 0;

  function activityChildId(activity) {
    if (activity.childId) return activity.childId;
    const match = children.find((child) => activity.title?.startsWith(child.displayName));
    return match?.id || children[0]?.id || "";
  }

  const approvalChildId = activityChildId(dashboard?.recentActivities?.find((activity) => activity.type === "approval") || {});
  const approvalTarget = approvalChildId ? `/parent/children/${approvalChildId}/approvals` : "/parent/children";

  return (
    <div className="parent-page">
      <header className="workspace-page-heading parent-page-heading">
        <div>
          <p className="workspace-eyebrow">GÓC CỦA GIA ĐÌNH</p>
          <h1>Chào {user.name.split(" ")[0]} 👋</h1>
          <p>Một chút tiến bộ mỗi ngày cũng tạo nên cả một câu chuyện.</p>
        </div>
        <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm hồ sơ bé</Link>
      </header>

      <div className="parent-overview-grid">
        <section className={`parent-welcome-panel ${hasChildren ? "parent-welcome-panel-populated" : ""}`} aria-labelledby="parent-onboarding-title">
          <div className="parent-welcome-copy">
            <span className="parent-panel-kicker"><Sparkle size={16} weight="fill" aria-hidden="true" /> {hasChildren ? "GIA ĐÌNH ĐANG TIẾN BỘ" : "BƯỚC ĐẦU NHẸ NHÀNG"}</span>
            <h2 id="parent-onboarding-title">{hasChildren ? (pendingApprovals ? "Có nội dung đang chờ bạn xem." : "Mỗi ngày một câu chuyện nhỏ.") : "Hãy tạo hồ sơ đầu tiên cho bé."}</h2>
            <p>{hasChildren ? (pendingApprovals ? "Xem từng phiên bản và quyết định điều gì phù hợp với bé." : "Theo dõi nhịp đọc và những nội dung mỗi bé đã chọn giữ lại.") : "SketchTale dùng hồ sơ bé để lưu nhân vật, truyện và hành trình đọc."}</p>
            {hasChildren && pendingApprovals ? <Link to={approvalTarget} className="parent-text-link">Xem yêu cầu chờ duyệt <ArrowRight size={17} aria-hidden="true" /></Link> : null}
            {!hasChildren ? <Link to="/parent/children/new" className="workspace-button workspace-button-quiet parent-secondary-action"><Plus size={17} aria-hidden="true" /> Tạo hồ sơ bé</Link> : null}
          </div>
          <div className="parent-welcome-illustration" aria-hidden="true">{hasChildren ? <CheckCircle size={70} weight="duotone" /> : <Baby size={70} weight="duotone" />}</div>
        </section>

        <section className="parent-stat-panel" aria-labelledby="parent-plan-title">
          <span className="parent-panel-kicker">GÓI HIỆN TẠI</span>
          {entitlementQuery.isLoading ? <LoadingState label="Đang tải hạn mức" /> : entitlementQuery.isError ? <ErrorState message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} /> : <>
            <div className="parent-plan-line"><strong id="parent-plan-title">{entitlementQuery.data.plan}</strong><StatusBadge value={entitlementQuery.data.plan} tone="gold" /></div>
            <p className="parent-usage-label">Hồ sơ bé đã dùng</p>
            <div className="parent-usage"><strong>{entitlementQuery.data.usedChildProfiles}</strong><span>/ {entitlementQuery.data.childProfileLimit ?? "∞"}</span></div>
            <div className="parent-progress" aria-label={`${entitlementQuery.data.usedChildProfiles} trên ${entitlementQuery.data.childProfileLimit ?? "không giới hạn"} hồ sơ đã dùng`}><span style={{ width: `${entitlementQuery.data.childProfileLimit ? Math.min(100, entitlementQuery.data.usedChildProfiles / entitlementQuery.data.childProfileLimit * 100) : 8}%` }} /></div>
            <Link to="/parent/plan" className="parent-text-link">Xem gói và hạn mức <ArrowRight size={17} aria-hidden="true" /></Link>
          </>}
        </section>
      </div>

      <section className="parent-dashboard-section" aria-labelledby="reading-overview-title">
        <div className="parent-section-heading">
          <div><p className="workspace-eyebrow">TỔNG QUAN ĐỌC</p><h2 id="reading-overview-title">Nhịp đọc của gia đình</h2></div>
          <label className="data-range-control"><span>Khoảng thời gian</span><select id="parent-dashboard-range" aria-label="Khoảng thời gian dashboard" value={range} onChange={changeRange}>{rangeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </div>

        {dashboardQuery.isLoading && <LoadingState label="Đang tổng hợp dữ liệu gia đình" />}
        {dashboardQuery.isError && <ErrorState title="Không thể tải tổng quan" message={dashboardQuery.error.message} onRetry={() => dashboardQuery.refetch()} />}
        {dashboard && <>
          <div className="workspace-stat-grid parent-dashboard-stat-grid">
            <MetricCard icon={Clock} label="Phút đọc" value={dashboard.summary.readingMinutes} unit="phút" zeroCopy="Bắt đầu sau khi bé đọc truyện" />
            <MetricCard icon={BookOpen} label="Truyện hoàn thành" value={dashboard.summary.storiesCompleted} unit="truyện" zeroCopy="Chưa có dữ liệu" />
            <MetricCard icon={Sparkle} label="Từ vựng đã ôn" value={dashboard.summary.vocabularyReviewed} unit="từ" zeroCopy="Sẽ hiện sau buổi đọc đầu tiên" />
            <MetricCard icon={CheckCircle} label="Chờ bố mẹ duyệt" value={pendingApprovals} unit="phiên bản" zeroCopy="Mọi thứ đã được xem" />
          </div>

          {dashboard.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}

          {pendingApprovals > 0 && <AttentionSection count={pendingApprovals} target={approvalTarget} />}

          <div className="parent-dashboard-columns">
            <section className="analytics-card" aria-labelledby="recent-activity-title">
              <div className="analytics-card-heading"><div><h3 id="recent-activity-title">Hoạt động gần đây</h3><p>Những sự kiện mới nhất trong gia đình.</p></div></div>
              {hasRecentActivities ? <div className="activity-list">{dashboard.recentActivities.map((activity) => { const id = activityChildId(activity); const target = activity.type === "approval" ? `/parent/children/${id}/approvals` : `/parent/children/${id}/progress?range=${range}`; return <Link className="activity-item" to={target} key={activity.id}><span className="activity-icon"><CheckCircle size={17} aria-hidden="true" /></span><span><strong>{activity.title}</strong><small>{activity.detail} · {formatDateTime(activity.createdAt)}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>; })}</div> : <EmptyState icon={Clock} title="Chưa có hoạt động" message="Hoạt động đọc và học của bé sẽ xuất hiện tại đây." />}
            </section>

            <section className="analytics-card" aria-labelledby="child-progress-title">
              <div className="analytics-card-heading"><div><h3 id="child-progress-title">Theo từng bé</h3><p>Tóm tắt trong khoảng thời gian đã chọn.</p></div></div>
              {hasChildHighlights ? <div className="child-highlight-list">{dashboard.childHighlights.map((item) => <Link className="child-highlight-item" to={`/parent/children/${item.childId}/progress?range=${range}`} key={item.childId}><span><strong>{item.displayName}</strong><small>{item.lastReadAt ? `Đọc gần nhất ${formatDateTime(item.lastReadAt)}` : "Chưa có lượt đọc"}</small></span><b>{item.readingMinutes}<small> phút</small></b></Link>)}</div> : <EmptyState icon={Baby} title="Chưa có hồ sơ bé" message="Tạo hồ sơ để bắt đầu theo dõi tiến độ." />}
            </section>
          </div>
        </>}
      </section>

      <section className="parent-section-block" aria-labelledby="children-title">
        <div className="parent-section-heading"><div><p className="workspace-eyebrow">HỒ SƠ BÉ</p><h2 id="children-title">Những người kể chuyện nhỏ</h2></div>{hasChildren ? <Link to="/parent/children">Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link> : null}</div>
        {childrenQuery.isLoading ? <LoadingState label="Đang tải hồ sơ" /> : childrenQuery.isError ? <ErrorState message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} /> : children.length ? <div className="parent-mini-children">{children.slice(0, 3).map((child) => <ChildProfileCard child={child} summary={dashboard?.childHighlights?.find((item) => item.childId === child.id)} key={child.id} />)}</div> : <EmptyState icon={Baby} title="Chưa có hồ sơ bé" message="Hồ sơ bé sẽ xuất hiện tại đây sau khi bạn tạo hồ sơ đầu tiên." />}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, zeroCopy }) {
  const isZero = value === 0;
  return <article className={`workspace-stat-card parent-metric-card ${isZero ? "is-zero" : ""}`}><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><div className="parent-metric-value"><strong>{value}</strong><small>{unit}</small></div><p>{isZero ? zeroCopy : "Trong khoảng thời gian đã chọn"}</p></article>;
}

function AttentionSection({ count, target }) {
  return <section className="parent-attention-panel" aria-labelledby="attention-title"><div className="parent-attention-heading"><div className="parent-attention-icon"><Bell size={19} aria-hidden="true" /></div><div><p className="workspace-eyebrow">CẦN BỐ MẸ CHÚ Ý</p><h3 id="attention-title">Có việc đang chờ bạn xử lý</h3></div></div><Link className="parent-attention-item" to={target}><span><strong>{count} phiên bản đang chờ duyệt</strong><small>Xem và quyết định nội dung phù hợp cho bé.</small></span><ArrowRight size={17} aria-hidden="true" /></Link></section>;
}

function ChildProfileCard({ child, summary }) {
  return <Link to={`/parent/children/${child.id}`} className="parent-mini-child"><img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="50" height="50" /><span><strong>{child.displayName}</strong><small>{formatAge(child.birthDate)}</small><small className="parent-mini-child-stats">{summary?.readingMinutes || 0} phút đọc · {summary?.storiesCompleted || 0} truyện</small></span><ArrowRight size={18} aria-hidden="true" /></Link>;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatAge(value) {
  if (!value) return "Mở hồ sơ";
  const birthDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} tuổi`;
}
