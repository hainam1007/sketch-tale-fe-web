import { FloppyDisk, MagnifyingGlass, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels } from "../models";

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissionsKey = queryKeys.adminPermissions(user.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const permissionsQuery = useQuery({ queryKey: permissionsKey, queryFn: ({ signal }) => adminService.getPermissions({ signal }) });
  const [drafts, setDrafts] = useState({});
  const [reasons, setReasons] = useState({});
  const mutation = useMutation({
    mutationFn: ({ userId, role, revision, reason }) => adminService.updatePermission({ userId, role, revision, reason }),
    onSuccess: (updated) => {
      queryClient.setQueryData(permissionsKey, (current) => current ? { ...current, users: current.users.map((item) => item.id === updated.id ? updated : item) } : current);
      queryClient.setQueryData(queryKeys.adminUser(user.id, updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
      setDrafts((current) => { const next = { ...current }; delete next[updated.id]; return next; });
      setReasons((current) => { const next = { ...current }; delete next[updated.id]; return next; });
    },
  });

  const roleOptions = useMemo(() => {
    const values = permissionsQuery.data?.roles || [];
    return values.map((value) => ({ value, label: adminRoleLabels[value] || value }));
  }, [permissionsQuery.data?.roles]);

  if (permissionsQuery.isLoading) return <LoadingState label="Đang tải permission catalog" />;
  if (permissionsQuery.isError) return <ErrorState title="Không thể tải permissions" message={permissionsQuery.error.message} onRetry={() => permissionsQuery.refetch()} />;
  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "all";
  const items = permissionsQuery.data.users.filter((item) => (!search || `${item.name} ${item.email}`.toLowerCase().includes(search.toLowerCase())) && (roleFilter === "all" || item.role === roleFilter));
  function updateFilter(key, value) { const next = new URLSearchParams(searchParams); if (value && value !== "all") next.set(key, value); else next.delete(key); setSearchParams(next, { replace: key === "search" }); }

  return (
    <div className="workspace-dashboard admin-permissions-page">
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / PERMISSIONS</p><h1>Quyền theo tài khoản</h1><p>Role chỉ là input được server cho phép; không thể tự nâng quyền, tự đổi role hoặc hạ admin cuối cùng.</p></div><ShieldCheck size={43} className="admin-heading-icon" aria-hidden="true" /></div>
      <section className="admin-filter-panel"><div className="admin-filter-title"><ShieldCheck size={17} aria-hidden="true" /><strong>Tìm tài khoản</strong></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm tên hoặc email</span><MagnifyingGlass size={18} aria-hidden="true" /><input value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm tên hoặc email" /></label><label><span className="sr-only">Lọc role</span><select aria-label="Lọc role" value={roleFilter} onChange={(event) => updateFilter("role", event.target.value)}><option value="all">Tất cả role</option>{roleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>{(search || roleFilter !== "all") && <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={() => setSearchParams({})}><X size={16} aria-hidden="true" /> Xóa lọc</button>}</div></section>
      <div className="admin-permission-table-wrap"><table className="admin-permission-table"><caption className="sr-only">Danh sách quyền tài khoản</caption><thead><tr><th>Tài khoản</th><th>Role hiện tại</th><th>Role mới</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map((item) => {
        const nextRole = drafts[item.id] || item.role;
        const dirty = nextRole !== item.role;
        const isSelf = item.id === user.id;
        const canChange = !isSelf && Array.isArray(item.allowedActions) && item.allowedActions.includes("change_role") && roleOptions.length > 0;
        return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.email || "Không có email"}</small></td><td>{adminRoleLabels[item.role] || item.role}</td><td><select aria-label={`Role mới của ${item.name}`} value={nextRole} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} disabled={!canChange || mutation.isPending}>{roleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></td><td><StatusBadge value={item.status} tone={item.status === "locked" ? "danger" : "success"} /></td><td><label className="admin-inline-reason"><span className="sr-only">Lý do đổi role của {item.name}</span><input value={reasons[item.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Lý do" disabled={!canChange || mutation.isPending} /></label><button className="workspace-button workspace-button-quiet" type="button" disabled={!dirty || !canChange || mutation.isPending} onClick={() => mutation.mutate({ userId: item.id, role: nextRole, revision: item.revision, reason: reasons[item.id] || "" })}><FloppyDisk size={15} aria-hidden="true" /> Lưu</button></td></tr>;
      })}</tbody></table></div>
      {mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}
      {mutation.isSuccess && <p className="workspace-inline-success" role="status">Server đã cập nhật role và permission.</p>}
    </div>
  );
}
