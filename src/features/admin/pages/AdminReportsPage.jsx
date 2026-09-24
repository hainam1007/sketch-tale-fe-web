import { Funnel, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const reportsQuery = useQuery({ queryKey: queryKeys.adminReports(user.id, filters), queryFn: ({ signal }) => adminService.listReports({ ...filters, signal }) });
  if (reportsQuery.isLoading) return <LoadingState label="Đang tải hàng đợi báo cáo" />;
  if (reportsQuery.isError) return <ErrorState title="Không thể tải báo cáo" message={reportsQuery.error.message} onRetry={() => reportsQuery.refetch()} />;
  return <div className="workspace-dashboard admin-reports-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / MODERATION</p><h1>Hàng đợi báo cáo nội dung</h1><p>Phân biệt trạng thái xử lý báo cáo với hành động lên target; mọi thay đổi đều cần server xác nhận.</p></div><WarningCircle size={42} className="admin-heading-icon" aria-hidden="true" /></div><section className="admin-filter-panel"><div className="admin-filter-title"><Funnel size={18} aria-hidden="true" /><strong>Lọc báo cáo</strong></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm báo cáo</span><MagnifyingGlass size={18} aria-hidden="true" /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Tìm target, lý do hoặc người gửi" /></label><label><span className="sr-only">Lọc trạng thái</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="all">Tất cả trạng thái</option><option value="open">Mở</option><option value="under_review">Đang xem xét</option><option value="resolved">Đã giải quyết</option><option value="rejected">Từ chối</option></select></label></div></section>{reportsQuery.data.items.length ? <div className="admin-report-list">{reportsQuery.data.items.map((report) => <Link className="admin-report-item" to={`/admin/reports/${report.id}`} key={report.id}><div className="admin-report-item-main"><span className="admin-report-type">{report.targetType} · {report.id}</span><h2>{report.targetTitle}</h2><p>{report.reason}</p><small>Gửi bởi {report.reporter} · cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(report.updatedAt))}</small></div><StatusBadge value={report.status} tone={report.status === "resolved" ? "success" : report.status === "rejected" ? "danger" : report.status === "under_review" ? "gold" : "neutral"} /></Link>)}</div> : <div className="workspace-state workspace-state-empty"><WarningCircle size={29} aria-hidden="true" /><strong>Không có báo cáo phù hợp</strong><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>}</div>;
}
