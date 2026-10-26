import { Coins, Eye, Funnel, LockKey, LockKeyOpen, MagnifyingGlass, UserCircle, X } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { ADMIN_PAGE_SIZE, normalizeAdminListResponse, normalizePage } from "../models";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => ({
    search: searchParams.get("search") || "",
    plan: searchParams.get("plan") || "all",
    page: normalizePage(searchParams.get("page")),
    pageSize: ADMIN_PAGE_SIZE,
    sort: "createdAt_desc",
  }), [searchParams]);

  const usersQuery = useQuery({
    queryKey: queryKeys.adminUsers(user.id, filters),
    queryFn: ({ signal }) => adminService.listUsers({ ...filters, signal }),
    select: normalizeAdminListResponse,
    placeholderData: (previous) => previous,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, profileId }) => adminService.toggleUserStatus({ userId, profileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, profileId, role }) => adminService.updateUserRole({ userId, profileId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
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

  function handleToggleStatus(userId, profileId) {
    toggleStatusMutation.mutate({ userId, profileId });
  }

  function handleRoleChange(userId, profileId, role) {
    updateRoleMutation.mutate({ userId, profileId, role });
  }

  const data = usersQuery.data || { items: [], total: 0, page: 1, pageSize: ADMIN_PAGE_SIZE, totalPages: 1 };

  return (
    <div className="workspace-dashboard admin-users-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / QUẢN LÝ NGƯỜI DÙNG</p>
          <h1>Tài khoản Người dùng</h1>
          <p>Xem thông tin tài khoản, email, gói dịch vụ, phân quyền và khóa/mở khóa trực tiếp.</p>
        </div>
      </div>

      <section className="admin-filter-panel">
        <div className="admin-filter-title">
          <Funnel size={18} aria-hidden="true" />
          <strong>Bộ lọc hồ sơ</strong>
        </div>
        <div className="admin-filter-fields">
          <label className="admin-search">
            <span className="sr-only">Tìm theo tên hoặc email</span>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Tìm kiếm theo tên người dùng hoặc email"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo gói dịch vụ</span>
            <select value={filters.plan} onChange={(event) => updateFilter("plan", event.target.value)}>
              <option value="all">Tất cả gói</option>
              <option value="free">Gói Free</option>
              <option value="plus">Gói Plus</option>
              <option value="pro">Gói Pro</option>
            </select>
          </label>
          {(filters.search || filters.plan !== "all") && (
            <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={clearFilters}>
              <X size={16} aria-hidden="true" /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {usersQuery.isFetching && usersQuery.data && <p className="admin-refresh-note" role="status">Đang đồng bộ danh sách…</p>}
      {usersQuery.isLoading ? (
        <LoadingState label="Đang tải danh sách người dùng" />
      ) : usersQuery.isError && !usersQuery.data ? (
        <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />
      ) : (
        <>
          <UserTable
            data={data}
            returnTo={`/admin/users?${searchParams.toString()}`}
            onPageChange={(page) => updateFilter("page", String(page))}
            onToggleStatus={handleToggleStatus}
            onRoleChange={handleRoleChange}
            isToggling={toggleStatusMutation.isPending}
            isUpdatingRole={updateRoleMutation.isPending}
          />
          {usersQuery.isError && <p className="admin-refresh-note" role="status">Lần làm mới chưa thành công; đang hiển thị dữ liệu gần nhất.</p>}
        </>
      )}
    </div>
  );
}

function UserTable({ data, returnTo, onPageChange, onToggleStatus, onRoleChange, isToggling, isUpdatingRole }) {
  if (!data.items.length) {
    return (
      <div className="workspace-state workspace-state-empty">
        <UserCircle size={29} aria-hidden="true" />
        <strong>Không có hồ sơ phù hợp</strong>
        <p>Thử đổi từ khóa hoặc bộ lọc gói cước.</p>
      </div>
    );
  }

  return (
    <div className="admin-users-table-wrap">
      <table className="admin-users-table">
        <caption className="sr-only">Danh sách tài khoản người dùng</caption>
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Email</th>
            <th>Gói cước</th>
            <th>Credit khả dụng</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th className="admin-action-header">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => {
            const isLocked = item.status === "locked";
            return (
              <tr key={item.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-initial">
                      {item.name?.slice(0, 1)?.toUpperCase() || "U"}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>ID: {item.userId?.slice(0, 8) || item.id?.slice(0, 8)}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="admin-user-email">{item.email || "—"}</span>
                </td>
                <td>
                  <StatusBadge
                    value={item.plan || "Free"}
                    label={item.plan || "Free"}
                    tone={item.plan?.toLowerCase().includes("pro") ? "success" : item.plan?.toLowerCase().includes("plus") ? "accent" : "neutral"}
                  />
                </td>
                <td>
                  <span className="admin-credit-display">
                    <Coins size={16} aria-hidden="true" />
                    <strong>{item.remainingMonthlyCredit}</strong> Credit
                  </span>
                </td>
                <td>
                  <select
                    className="admin-role-select"
                    aria-label={`Sửa vai trò của ${item.name}`}
                    value={item.role || "parent"}
                    onChange={(e) => onRoleChange(item.userId, item.id, e.target.value)}
                    disabled={isUpdatingRole}
                  >
                    <option value="parent">Phụ huynh</option>
                    <option value="content_manager">Content Manager</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </td>
                <td>
                  <StatusBadge
                    value={isLocked ? "locked" : "active"}
                    label={isLocked ? "Đã khóa" : "Hoạt động"}
                    tone={isLocked ? "danger" : "success"}
                  />
                </td>
                <td>
                  <div className="admin-action-icons">
                    <Link
                      className="admin-icon-btn"
                      to={`/admin/users/${item.id}?returnTo=${encodeURIComponent(returnTo)}`}
                      title="Xem chi tiết & gán gói"
                      aria-label={`Xem chi tiết và gán gói cho ${item.name}`}
                    >
                      <Eye size={18} aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      className={`admin-icon-btn ${isLocked ? "is-danger" : ""}`}
                      title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                      aria-label={isLocked ? `Mở khóa tài khoản ${item.name}` : `Khóa tài khoản ${item.name}`}
                      onClick={() => onToggleStatus(item.userId, item.id)}
                      disabled={isToggling}
                    >
                      {isLocked ? (
                        <LockKey size={18} aria-hidden="true" />
                      ) : (
                        <LockKeyOpen size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="admin-table-footer">
        <p className="admin-table-footnote">
          {data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} / ${data.total}` : "0"} người dùng.
        </p>
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="Phân trang tài khoản">
      <button type="button" className="workspace-button workspace-button-quiet" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Trước
      </button>
      <span>Trang {page} / {totalPages}</span>
      <button type="button" className="workspace-button workspace-button-quiet" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Sau
      </button>
    </nav>
  );
}

