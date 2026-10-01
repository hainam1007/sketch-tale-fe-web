import { ArrowClockwise, ChartLineUp, ClockCounterClockwise, Flag, Gauge, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { queryKeys } from "../../../lib/api/queryKeys";
import { adminService } from "../services/adminService";

const statusTone = { open: "neutral", under_review: "gold", failed: "danger", processing: "gold" };

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const overviewQuery = useQuery({
    queryKey: queryKeys.adminOverview(user.id),
    queryFn: ({ signal }) => adminService.getOverview({ signal }),
    staleTime: 30_000,
  });

  if (overviewQuery.isLoading) return <LoadingState label="Đang tải tổng quan quản trị" />;
  if (overviewQuery.isError) return <ErrorState title="Không thể tải tổng quan" message={overviewQuery.error.message} onRetry={() => overviewQuery.refetch()} />;

  const data = overviewQuery.data;
  return (
    <div className="workspace-dashboard admin-overview-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / TỔNG QUAN</p>
          <h1>Phòng điều hành</h1>
          <p>Theo dõi việc cần xử lý và đi thẳng đến đúng màn hình quản trị.</p>
        </div>
        <button className="workspace-button workspace-button-quiet" type="button" onClick={() => overviewQuery.refetch()} disabled={overviewQuery.isFetching}>
          <ArrowClockwise size={17} aria-hidden="true" /> {overviewQuery.isFetching ? "Đang cập nhật" : "Làm mới"}
        </button>
      </div>

      <section className="workspace-stat-grid admin-overview-stat-grid" aria-label="Chỉ số cần xử lý">
        <OverviewStat icon={Flag} label="Báo cáo chờ xử lý" value={data.counts.reportsOpen} to="/admin/reports?status=open" tone="gold" />
        <OverviewStat icon={ShieldCheck} label="Đang xem xét" value={data.counts.reportsUnderReview} to="/admin/reports?status=under_review" tone="gold" />
        <OverviewStat icon={WarningCircle} label="Tác vụ lỗi" value={data.counts.jobsFailed} to="/admin/monitoring?status=failed" tone="danger" />
        <OverviewStat icon={ChartLineUp} label="Tác vụ đang chạy" value={data.counts.jobsProcessing} to="/admin/monitoring?status=processing" tone="success" />
      </section>

      <div className="admin-overview-grid">
        <section className="analytics-card">
          <div className="analytics-card-heading"><div><p className="workspace-eyebrow">CẦN XỬ LÝ</p><h2>Hàng đợi ưu tiên</h2><p>Những mục gần nhất từ report và monitoring.</p></div><Flag size={25} aria-hidden="true" /></div>
          {data.queue.length ? <div className="admin-overview-queue">{data.queue.map((item) => <Link className="admin-overview-queue-item" key={`${item.kind}-${item.id}`} to={item.to}><div><span className="admin-report-type">{item.kindLabel}</span><strong>{item.title}</strong><small>{item.meta}</small></div><StatusBadge value={item.status} tone={statusTone[item.status] || "neutral"} /></Link>)}</div> : <div className="workspace-state workspace-state-empty"><Flag size={27} aria-hidden="true" /><strong>Không có việc cần xử lý</strong><p>Mọi hàng đợi đang trong trạng thái ổn định.</p></div>}
          <Link className="admin-overview-section-link" to="/admin/reports">Mở hàng đợi báo cáo <span aria-hidden="true">→</span></Link>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-heading"><div><p className="workspace-eyebrow">GẦN ĐÂY</p><h2>Hoạt động hệ thống</h2><p>{formatDateTime(data.generatedAt)}</p></div><ClockCounterClockwise size={25} aria-hidden="true" /></div>
          {data.recentAudit.length ? <div className="admin-overview-audit">{data.recentAudit.map((item) => <div className="admin-overview-audit-item" key={item.id}><span className="admin-overview-audit-icon"><ClockCounterClockwise size={15} aria-hidden="true" /></span><div><strong>{item.action}</strong><small>{item.actorName} · {item.target}</small><time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></div></div>)}</div> : <div className="workspace-state workspace-state-empty"><ClockCounterClockwise size={27} aria-hidden="true" /><strong>Chưa có hoạt động</strong><p>Audit sẽ xuất hiện sau các thao tác thay đổi dữ liệu.</p></div>}
          <Link className="admin-overview-section-link" to="/admin/audit">Mở nhật ký thao tác <span aria-hidden="true">→</span></Link>
        </section>
      </div>

      <section className="admin-overview-quick-links" aria-label="Truy cập nhanh">
        <Link to="/admin/users"><Gauge size={19} aria-hidden="true" /><span><strong>Tài khoản</strong><small>Tra cứu và kiểm soát trạng thái</small></span></Link>
        <Link to="/admin/permissions"><ShieldCheck size={19} aria-hidden="true" /><span><strong>Phân quyền</strong><small>Đổi vai trò theo catalog</small></span></Link>
        <Link to="/admin/statistics"><ChartLineUp size={19} aria-hidden="true" /><span><strong>Số liệu vận hành</strong><small>Xem metric theo khoảng thời gian</small></span></Link>
      </section>
    </div>
  );
}

function OverviewStat({ icon: Icon, label, value, to, tone }) {
  return <Link className={`admin-overview-stat admin-overview-stat-${tone}`} to={to}><span className="workspace-stat-icon"><Icon size={20} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{value}</strong><span className="admin-overview-stat-link">Xem danh sách →</span></Link>;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
