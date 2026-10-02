import {
  ArrowRight,
  BookOpen,
  CalendarDots,
  CheckCircle,
  Clock,
  Gear,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";

const rangeOptions = [
  ["7d", "7 ngày gần đây"],
  ["30d", "30 ngày gần đây"],
];

export default function ChildDashboardPage() {
  const { user } = useAuth();
  const { child } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") === "30d" ? "30d" : "7d";
  const simulate = searchParams.get("simulate") || "";
  const dashboardQuery = useQuery({
    queryKey: queryKeys.childDashboard(user.id, child.id, range, simulate),
    queryFn: ({ signal }) => childrenService.dashboard({ childId: child.id, range, simulate, signal }),
  });

  if (dashboardQuery.isLoading) return <LoadingState label={`Đang tải tổng quan của ${child.displayName}`} />;
  if (dashboardQuery.isError) return <ErrorState title="Không thể tải tổng quan" message={dashboardQuery.error.message} onRetry={() => dashboardQuery.refetch()} />;

  const dashboard = dashboardQuery.data;
  const summary = dashboard.summary || {};
  const pendingApprovals = dashboard.pendingApprovals ?? summary.pendingApprovals ?? 0;
  const activities = dashboard.recentActivities || [];
  const settings = dashboard.settingsSummary || {};

  function changeRange(event) {
    const next = new URLSearchParams(searchParams);
    next.set("range", event.target.value);
    setSearchParams(next);
  }

  return (
    <div className="child-dashboard-page" data-child-id={child.id}>
      <header className="child-dashboard-intro">
        <div>
          <p className="workspace-eyebrow"><CalendarDots size={15} aria-hidden="true" /> HÀNH TRÌNH CỦA {child.displayName.toUpperCase()}</p>
          <h2>Tổng quan của {child.displayName}</h2>
          <p>Một góc riêng để theo dõi những gì {child.displayName} đang đọc, học và cần bố mẹ xem.</p>
        </div>
        <label className="child-dashboard-range">
          <span>Khoảng thời gian</span>
          <select aria-label={`Khoảng thời gian của ${child.displayName}`} value={range} onChange={changeRange}>
            {rangeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </header>

      <section className="child-dashboard-action-grid" aria-label="Việc cần bố mẹ xem">
        <article className={`child-dashboard-focus ${pendingApprovals ? "has-action" : "is-clear"}`}>
          <div className="child-dashboard-focus-icon"><CheckCircle size={24} weight="fill" aria-hidden="true" /></div>
          <div>
            <span className="child-dashboard-kicker">CẦN BỐ MẸ XEM</span>
            <h3>{pendingApprovals ? `${pendingApprovals} yêu cầu đang chờ` : "Không có yêu cầu đang chờ"}</h3>
            <p>{pendingApprovals ? "Xem từng phiên bản hoặc quyền vai trước khi bé dùng trong truyện." : "Mọi nội dung của bé hiện đã được xem qua."}</p>
          </div>
          {pendingApprovals > 0 && <Link className="workspace-button workspace-button-quiet" to={`/parent/children/${child.id}/approvals?status=pending`}>Xem yêu cầu <ArrowRight size={16} aria-hidden="true" /></Link>}
        </article>
        <article className="child-dashboard-settings-card">
          <div className="child-dashboard-card-heading"><span className="child-dashboard-icon"><Gear size={20} aria-hidden="true" /></span><div><span className="child-dashboard-kicker">ĐANG ÁP DỤNG</span><h3>Cài đặt của {child.displayName}</h3></div></div>
          <p>{settings.readingTimeLimitMinutes === null || settings.readingTimeLimitMinutes === undefined ? "Không giới hạn thời gian mỗi ngày" : `${settings.readingTimeLimitMinutes} phút đọc mỗi ngày`}</p>
          <Link className="child-dashboard-text-link" to={`/parent/children/${child.id}/settings`}>Điều chỉnh cài đặt <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
      </section>

      {dashboard.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><WarningCircle size={17} aria-hidden="true" /><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}

      <section className="child-dashboard-section" aria-labelledby="child-dashboard-progress-title">
        <div className="child-dashboard-section-heading"><div><p className="workspace-eyebrow">HÀNH TRÌNH HỌC TẬP</p><h3 id="child-dashboard-progress-title">Những bước nhỏ của {child.displayName}</h3></div><Link className="child-dashboard-text-link" to={`/parent/children/${child.id}/progress?range=${range}`}>Xem tiến độ <ArrowRight size={15} aria-hidden="true" /></Link></div>
        <div className="child-dashboard-stat-grid">
          <DashboardMetric icon={Clock} label="Phút đọc" value={summary.readingMinutes ?? 0} unit="phút" />
          <DashboardMetric icon={BookOpen} label="Truyện hoàn thành" value={summary.storiesCompleted ?? 0} unit="truyện" />
          <DashboardMetric icon={Sparkle} label="Từ đã ôn" value={summary.vocabularyReviewed ?? 0} unit="từ" />
          <DashboardMetric icon={CheckCircle} label="Quiz" value={summary.quizAccuracy === null || summary.quizAccuracy === undefined ? "Chưa có" : `${summary.quizAccuracy}%`} unit="" />
        </div>
        <p className="child-dashboard-period">Số liệu trong {rangeOptions.find(([value]) => value === range)?.[1].toLowerCase()} · {dashboard.period?.timezone || "Asia/Ho_Chi_Minh"}</p>
      </section>

      <section className="child-dashboard-section" aria-labelledby="child-dashboard-activity-title">
        <div className="child-dashboard-section-heading"><div><p className="workspace-eyebrow">HOẠT ĐỘNG GẦN ĐÂY</p><h3 id="child-dashboard-activity-title">Những gì {child.displayName} vừa làm</h3></div><Link className="child-dashboard-text-link" to={`/parent/children/${child.id}/library`}>Mở thư viện <ArrowRight size={15} aria-hidden="true" /></Link></div>
        {activities.length ? <div className="child-dashboard-activity-list">{activities.slice(0, 5).map((activity) => <Link className="child-dashboard-activity" key={activity.id} to={activity.type === "approval" ? `/parent/children/${child.id}/approvals?approvalId=${activity.resourceId || ""}` : `/parent/children/${child.id}/progress?range=${range}`}><span className="child-dashboard-activity-icon">{activity.type === "approval" ? <CheckCircle size={18} aria-hidden="true" /> : <BookOpen size={18} aria-hidden="true" />}</span><span><strong>{activity.title}</strong><small>{activity.detail}</small></span><time>{formatDate(activity.createdAt)}</time><ArrowRight size={16} aria-hidden="true" /></Link>)}</div> : <div className="child-dashboard-empty"><BookOpen size={26} aria-hidden="true" /><strong>Chưa có hoạt động trong khoảng này</strong><span>Khi {child.displayName} đọc truyện hoặc làm quiz, hoạt động sẽ xuất hiện ở đây.</span></div>}
      </section>
    </div>
  );
}

function DashboardMetric({ icon: Icon, label, value, unit }) {
  return <article className="child-dashboard-metric"><span className="child-dashboard-metric-icon"><Icon size={19} aria-hidden="true" /></span><span>{label}</span><strong>{value}</strong>{unit && <small>{unit}</small>}</article>;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}
