import { Funnel, MagnifyingGlass, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { normalizeAdminListResponse, normalizePage, normalizePageSize, ADMIN_PAGE_SIZE } from "../models";

const statusTone = { resolved: "success", rejected: "danger", under_review: "gold", open: "neutral" };
const statusLabels = { all: "Tất cả trạng thái", open: "Mở", under_review: "Đang xem xét", resolved: "Đã giải quyết", rejected: "Từ chối" };

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => ({
    status: searchParams.get("status") || "all",
    search: searchParams.get("search") || "",
    page: normalizePage(searchParams.get("page")),
    pageSize: normalizePageSize(searchParams.get("pageSize")),
    sort: searchParams.get("sort") || "updated_desc",
  }), [searchParams]);
  const reportsQuery = useQuery({
    queryKey: queryKeys.adminReports(user.id, filters),
    queryFn: ({ signal }) => adminService.listReports({ ...filters, signal }),
    select: normalizeAdminListResponse,
    placeholderData: (previous) => previous,
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "pageSize" && value === String(ADMIN_PAGE_SIZE)) && !(key === "sort" && value === "updated_desc")) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: key === "search" });
  }

  function clearFilters() { setSearchParams({}); }

  const data = reportsQuery.data || { items: [], total: 0, page: 1, totalPages: 1, pageSize: ADMIN_PAGE_SIZE };
  return <div className="workspace-dashboard admin-reports-page">
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / MODERATION</p><h1>Hàng đợi báo cáo nội dung</h1><p>Đọc bằng chứng, ghi quyết định và theo dõi trạng thái xử lý từng báo cáo.</p></div><WarningCircle size={42} className="admin-heading-icon" aria-hidden="true" /></div>
    <section className="admin-filter-panel"><div className="admin-filter-title"><Funnel size={18} aria-hidden="true" /><strong>Lọc báo cáo</strong><span className="admin-filter-result-count">{data.total} kết quả</span></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm báo cáo</span><MagnifyingGlass size={18} aria-hidden="true" /><input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm target, lý do hoặc người gửi" /></label><label><span className="sr-only">Lọc trạng thái</span><select aria-label="Lọc trạng thái" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span className="sr-only">Sắp xếp báo cáo</span><select aria-label="Sắp xếp báo cáo" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="updated_desc">Cập nhật mới nhất</option><option value="created_asc">Cũ nhất trước</option></select></label><label><span className="sr-only">Số dòng mỗi trang</span><select aria-label="Số dòng mỗi trang" value={String(filters.pageSize)} onChange={(event) => updateFilter("pageSize", event.target.value)}><option value="10">10 / trang</option><option value="25">25 / trang</option><option value="50">50 / trang</option></select></label>{(filters.search || filters.status !== "all" || filters.page !== 1 || filters.sort !== "updated_desc") && <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={clearFilters}><X size={16} aria-hidden="true" /> Xóa lọc</button>}</div></section>
    {reportsQuery.isLoading ? <LoadingState label="Đang tải hàng đợi báo cáo" /> : reportsQuery.isError ? <ErrorState title="Không thể tải báo cáo" message={reportsQuery.error.message} onRetry={() => reportsQuery.refetch()} /> : <ReportList data={data} onPageChange={(page) => updateFilter("page", String(page))} />}
  </div>;
}

function ReportList({ data, onPageChange }) {
  if (!data.items.length) return <div className="workspace-state workspace-state-empty"><WarningCircle size={29} aria-hidden="true" /><strong>Không có báo cáo phù hợp</strong><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>;
  return <><div className="admin-report-list">{data.items.map((report) => <Link className="admin-report-item" to={`/admin/reports/${report.id}`} key={report.id}><div className="admin-report-item-main"><span className="admin-report-type">{report.targetType} · {report.id}</span><h2>{report.targetTitle}</h2><p>{report.reason}</p><small>Gửi bởi {report.reporter} · {report.assignee || "Chưa phân công"} · cập nhật {formatDate(report.updatedAt)}</small></div><StatusBadge value={report.status} label={statusLabels[report.status] || report.status} tone={statusTone[report.status] || "neutral"} /></Link>)}</div><div className="admin-table-footer"><p className="admin-table-footnote">{data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} / ${data.total} báo cáo` : "0 báo cáo"}</p><nav className="admin-pagination" aria-label="Phân trang báo cáo"><button type="button" className="workspace-button workspace-button-quiet" disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)}>Trước</button><span>Trang {data.page} / {data.totalPages}</span><button type="button" className="workspace-button workspace-button-quiet" disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)}>Sau</button></nav></div></>;
}

function formatDate(value) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)); }
