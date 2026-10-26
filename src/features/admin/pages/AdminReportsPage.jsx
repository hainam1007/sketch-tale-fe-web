import { Funnel, MagnifyingGlass, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { normalizeAdminListResponse, normalizePage, ADMIN_PAGE_SIZE, ADMIN_REPORT_STATUSES } from "../models";

const statusTone = { resolved: "success", rejected: "danger", under_review: "gold", open: "neutral" };
const statusLabels = { all: "Tất cả trạng thái", open: "Mở", under_review: "Đang xem xét", resolved: "Đã giải quyết", rejected: "Từ chối" };

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const requestedSort = searchParams.get("sort");
  const filters = useMemo(() => ({
    status: requestedStatus === "all" || ADMIN_REPORT_STATUSES.includes(requestedStatus) ? requestedStatus : "all",
    search: searchParams.get("search") || "",
    page: normalizePage(searchParams.get("page")),
    pageSize: [10, 25, 50].includes(Number(searchParams.get("pageSize"))) ? Number(searchParams.get("pageSize")) : ADMIN_PAGE_SIZE,
    sort: ["updated_desc", "created_asc"].includes(requestedSort) ? requestedSort : "updated_desc",
  }), [searchParams, requestedStatus, requestedSort]);
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
    {reportsQuery.isFetching && reportsQuery.data && <p className="admin-refresh-note" role="status">Đang đồng bộ hàng đợi…</p>}
    {reportsQuery.isLoading ? <LoadingState label="Đang tải hàng đợi báo cáo" /> : reportsQuery.isError && !reportsQuery.data ? <ErrorState title="Không thể tải báo cáo" message={reportsQuery.error.message} onRetry={() => reportsQuery.refetch()} /> : <><ReportList data={data} returnTo={`/admin/reports?${searchParams.toString()}`} onPageChange={(page) => updateFilter("page", String(page))} />{reportsQuery.isError && <p className="admin-refresh-note" role="status">Lần làm mới chưa thành công; đang hiển thị dữ liệu gần nhất.</p>}</>}
  </div>;
}

function ReportList({ data, returnTo, onPageChange }) {
  if (!data.items.length) return <div className="workspace-state workspace-state-empty"><WarningCircle size={29} aria-hidden="true" /><strong>Không có báo cáo phù hợp</strong><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>;
  return <><div className="admin-report-list">{data.items.map((report) => <Link className="admin-report-item" to={`/admin/reports/${report.id}?returnTo=${encodeURIComponent(returnTo)}`} key={report.id}><div className="admin-report-item-main"><span className="admin-report-type">{report.targetType || "Báo cáo"} · {report.id}</span><h2>{report.targetTitle || "Đối tượng chưa có tiêu đề"}</h2><p>{report.reason || "Chưa có lý do được cung cấp."}</p><small>Gửi bởi {report.reporter || "Chưa xác định"} · {report.assignee || "Chưa phân công"} · cập nhật {formatDate(report.updatedAt)}</small></div><StatusBadge value={report.status || "unknown"} label={statusLabels[report.status] || report.status || "Chưa xác định"} tone={statusTone[report.status] || "neutral"} /></Link>)}</div><div className="admin-table-footer"><p className="admin-table-footnote">{data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} / ${data.total} báo cáo` : "0 báo cáo"}</p><nav className="admin-pagination" aria-label="Phân trang báo cáo"><button type="button" className="workspace-button workspace-button-quiet" disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)}>Trước</button><span>Trang {data.page} / {data.totalPages}</span><button type="button" className="workspace-button workspace-button-quiet" disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)}>Sau</button></nav></div></>;
}

function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Thời gian chưa xác định" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(date); }
