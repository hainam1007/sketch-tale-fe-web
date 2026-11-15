import { Check, Coins, Eye, Funnel, LockKey, LockKeyOpen, MagnifyingGlass, Plus, UserCircle, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { ADMIN_PAGE_SIZE, adminRoleLabels, normalizeAdminListResponse, normalizePage } from "../models";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({ username: "", password: "", email: "", role: "parent" });
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason] = useState("");

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
    mutationFn: ({ userId, isLocked, reason }) => adminService.toggleUserStatus({ userId, isLocked, reason }),
    onSuccess: async () => {
      setPendingStatus(null);
      setStatusReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload) => adminService.createUser({ payload }),
    onSuccess: async () => {
      setCreateDraft({ username: "", password: "", email: "", role: "parent" });
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
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

  function handleToggleStatus(item) {
    setStatusReason("");
    toggleStatusMutation.reset();
    setPendingStatus({ userId: item.userId, isLocked: item.status !== "locked", name: item.name });
  }

  function confirmStatusChange() {
    if (!pendingStatus) return;
    toggleStatusMutation.mutate({ ...pendingStatus, reason: statusReason.trim() });
  }

  function submitCreateUser(event) {
    event.preventDefault();
    const username = createDraft.username.trim();
    const password = createDraft.password;
    if (!username || password.length < 6 || !createDraft.role) return;
    const payload = { username, password, role: createDraft.role };
    if (createDraft.email.trim()) payload.email = createDraft.email.trim();
    createUserMutation.mutate(payload);
  }

  const data = usersQuery.data || { items: [], total: 0, page: 1, pageSize: ADMIN_PAGE_SIZE, totalPages: 1 };

  return (
    <>
    <div className="workspace-dashboard admin-users-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / QUẢN LÝ NGƯỜI DÙNG</p>
          <h1>Tài khoản Người dùng</h1>
          <p>Danh sách tài khoản từ Backend; hồ sơ gói dịch vụ chỉ hiện khi tài khoản có Parent profile.</p>
        </div>
        <button className="workspace-button" type="button" onClick={() => { setCreateOpen((value) => !value); createUserMutation.reset(); }}>
          {createOpen ? <X size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
          {createOpen ? "Đóng" : "Tạo tài khoản"}
        </button>
      </div>

      {createOpen && <section className="admin-filter-panel" aria-labelledby="admin-create-user-title">
        <div className="admin-filter-title"><Plus size={17} aria-hidden="true" /><strong id="admin-create-user-title">Tạo tài khoản</strong></div>
        <form className="admin-filter-fields" onSubmit={submitCreateUser}>
          <label><span>Tên đăng nhập *</span><input autoComplete="off" required minLength={1} value={createDraft.username} onChange={(event) => setCreateDraft((current) => ({ ...current, username: event.target.value }))} /></label>
          <label><span>Mật khẩu *</span><input type="password" autoComplete="new-password" required minLength={6} value={createDraft.password} onChange={(event) => setCreateDraft((current) => ({ ...current, password: event.target.value }))} /></label>
          <label><span>Email</span><input type="email" autoComplete="off" value={createDraft.email} onChange={(event) => setCreateDraft((current) => ({ ...current, email: event.target.value }))} /></label>
          <label><span>Vai trò *</span><select value={createDraft.role} onChange={(event) => setCreateDraft((current) => ({ ...current, role: event.target.value }))}><option value="parent">Phụ huynh</option><option value="child">Trẻ em</option><option value="content_manager">Content Manager</option><option value="admin">Quản trị viên</option></select></label>
          <button className="workspace-button" type="submit" disabled={createUserMutation.isPending || !createDraft.username.trim() || createDraft.password.length < 6}>{createUserMutation.isPending ? "Đang tạo…" : <><Check size={16} aria-hidden="true" /> Tạo tài khoản</>}</button>
        </form>
        {createUserMutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {createUserMutation.error.message}</p>}
        {createUserMutation.isSuccess && <p className="workspace-inline-success" role="status">Backend đã tạo tài khoản.</p>}
      </section>}

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
            isToggling={toggleStatusMutation.isPending}
          />
          {data.warnings?.map((warning) => <p className="admin-refresh-note" role="status" key={warning}>{warning}</p>)}
          {usersQuery.isError && <p className="admin-refresh-note" role="status">Lần làm mới chưa thành công; đang hiển thị dữ liệu gần nhất.</p>}
        </>
      )}
    </div>
    {pendingStatus && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-user-status-confirm-title"><p className="workspace-eyebrow">CẬP NHẬT TRẠNG THÁI</p><h2 id="admin-user-status-confirm-title">{pendingStatus.isLocked ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</h2><p><strong>{pendingStatus.name}</strong></p><label className="admin-catalog-field"><span>Lý do (không bắt buộc)</span><textarea rows={3} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} /></label>{toggleStatusMutation.isError && <p className="admin-mutation-error" role="alert">{toggleStatusMutation.error.message}</p>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={toggleStatusMutation.isPending} onClick={() => setPendingStatus(null)}>Hủy</button><button className="workspace-button workspace-button-danger" type="button" disabled={toggleStatusMutation.isPending} onClick={confirmStatusChange}>{toggleStatusMutation.isPending ? "Đang lưu…" : pendingStatus.isLocked ? "Xác nhận khóa" : "Xác nhận mở khóa"}</button></div></section></div>}
    </>
  );
}

function UserTable({ data, returnTo, onPageChange, onToggleStatus, isToggling }) {
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
                    value={item.plan || "unavailable"}
                    label={item.plan || "Không áp dụng"}
                    tone={item.plan?.toLowerCase().includes("pro") ? "success" : item.plan?.toLowerCase().includes("plus") ? "accent" : "neutral"}
                  />
                </td>
                <td>
                  <span className="admin-credit-display">
                    <Coins size={16} aria-hidden="true" />
                    <strong>{item.remainingMonthlyCredit ?? "—"}</strong> {item.remainingMonthlyCredit === null ? "" : "Credit"}
                  </span>
                </td>
                <td>
                  <span>{adminRoleLabels[item.role] || item.role || "Chưa có dữ liệu"}</span>
                </td>
                <td>
                  <StatusBadge
                    value={item.status || "unknown"}
                    label={isLocked ? "Đã khóa" : item.status === "active" ? "Hoạt động" : "Chưa có dữ liệu"}
                    tone={isLocked ? "danger" : item.status === "active" ? "success" : "neutral"}
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
                      onClick={() => onToggleStatus(item)}
                      disabled={isToggling || item.status === "unknown"}
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

