import { Funnel, MagnifyingGlass, UserCircle, X } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels, ADMIN_PAGE_SIZE, adminUserStatusLabels, normalizeAdminListResponse, normalizePage, normalizePageSize } from "../models";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => ({
    search: searchParams.get("search") || "",
    role: searchParams.get("role") || "all",
    status: searchParams.get("status") || "all",
    page: normalizePage(searchParams.get("page")),
    pageSize: normalizePageSize(searchParams.get("pageSize")),
    sort: searchParams.get("sort") || "name_asc",
  }), [searchParams]);
  const usersQuery = useQuery({
    queryKey: queryKeys.adminUsers(user.id, filters),
    queryFn: ({ signal }) => adminService.listUsers({ ...filters, signal }),
    select: normalizeAdminListResponse,
    placeholderData: (previous) => previous,
  });

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const data = usersQuery.data || { items: [], total: 0, page: 1, pageSize: ADMIN_PAGE_SIZE, totalPages: 1 };

  return (
    <div className="workspace-dashboard admin-users-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / TÀI KHOẢN</p>
          <h1>Quản lý tài khoản</h1>
          <p>Tra cứu Parent và Content Manager, kiểm tra trạng thái trước khi xử lý quyền truy cập.</p>
        </div>
      </div>
      <section className="admin-filter-panel">
        <div className="admin-filter-title"><Funnel size={18} aria-hidden="true" /><strong>Bộ lọc tài khoản</strong></div>
        <div className="admin-filter-fields">
          <label className="admin-search">
            <span className="sr-only">Tìm theo tên hoặc email</span>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm tên hoặc email" />
          </label>
          <label>
            <span className="sr-only">Lọc theo vai trò</span>
            <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
              <option value="all">Tất cả vai trò</option>
              <option value="parent">{adminRoleLabels.parent}</option>
              <option value="content_manager">{adminRoleLabels.content_manager}</option>
              <option value="admin">{adminRoleLabels.admin}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Lọc theo trạng thái</span>
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">{adminUserStatusLabels.active}</option>
              <option value="locked">{adminUserStatusLabels.locked}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sắp xếp tài khoản</span>
            <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
              <option value="name_asc">Tên A–Z</option>
              <option value="email_asc">Email A–Z</option>
            </select>
          </label>
          {(filters.search || filters.role !== "all" || filters.status !== "all") && (
            <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={clearFilters}>
              <X size={16} aria-hidden="true" /> Xóa lọc
            </button>
          )}
        </div>
      </section>
      {usersQuery.isLoading ? <LoadingState label="Đang tải danh sách tài khoản" /> : usersQuery.isError ? <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} /> : <UserTable data={data} onPageChange={(page) => updateFilter("page", String(page))} />}
    </div>
  );
}

function UserTable({ data, onPageChange }) {
  if (!data.items.length) return <div className="workspace-state workspace-state-empty"><UserCircle size={29} aria-hidden="true" /><strong>Không có tài khoản phù hợp</strong><p>Thử đổi từ khóa hoặc bộ lọc trạng thái.</p></div>;
  return (
    <div className="admin-users-table-wrap">
      <table className="admin-users-table">
        <caption className="sr-only">Danh sách tài khoản</caption>
        <thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{data.items.map((item) => <tr key={item.id}>
          <td><div className="admin-user-cell"><span className="admin-user-initial">{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td>
          <td>{adminRoleLabels[item.role] || item.role}</td>
          <td><StatusBadge value={item.status} label={adminUserStatusLabels[item.status]} tone={item.status === "locked" ? "danger" : "success"} /></td>
          <td><Link className="admin-view-link" to={`/admin/users/${item.id}`}>Xem chi tiết <span className="sr-only">{item.name}</span></Link></td>
        </tr>)}</tbody>
      </table>
      <div className="admin-table-footer">
        <p className="admin-table-footnote">{data.total} tài khoản phù hợp · mọi thay đổi trạng thái đều do server xác nhận.</p>
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return <nav className="admin-pagination" aria-label="Phân trang tài khoản"><button type="button" className="workspace-button workspace-button-quiet" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</button><span>Trang {page} / {totalPages}</span><button type="button" className="workspace-button workspace-button-quiet" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</button></nav>;
}
