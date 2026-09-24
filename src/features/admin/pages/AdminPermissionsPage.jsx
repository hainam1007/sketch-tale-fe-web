import { FloppyDisk, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels, adminRoleOptions } from "../models";

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissionsKey = queryKeys.adminPermissions(user.id);
  const permissionsQuery = useQuery({ queryKey: permissionsKey, queryFn: ({ signal }) => adminService.getPermissions({ signal }) });
  const [drafts, setDrafts] = useState({});
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: ({ userId, role, revision }) => adminService.updatePermission({ userId, role, revision, reason }),
    onSuccess: (updated) => {
      queryClient.setQueryData(permissionsKey, (current) => current ? { ...current, users: current.users.map((item) => item.id === updated.id ? updated : item) } : current);
      queryClient.setQueryData(queryKeys.adminUser(user.id, updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
      setDrafts((current) => { const next = { ...current }; delete next[updated.id]; return next; });
      setReason("");
    },
  });

  const roleOptions = useMemo(() => {
    const values = permissionsQuery.data?.roles || adminRoleOptions.map((item) => item.value);
    return values.map((value) => ({ value, label: adminRoleLabels[value] || value }));
  }, [permissionsQuery.data?.roles]);

  if (permissionsQuery.isLoading) return <LoadingState label="Đang tải permission catalog" />;
  if (permissionsQuery.isError) return <ErrorState title="Không thể tải permissions" message={permissionsQuery.error.message} onRetry={() => permissionsQuery.refetch()} />;
  const items = permissionsQuery.data.users;

  return (
    <div className="workspace-dashboard admin-permissions-page">
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / PERMISSIONS</p><h1>Quyền theo tài khoản</h1><p>Role chỉ là input được server cho phép; không thể tự nâng quyền, tự đổi role hoặc hạ admin cuối cùng.</p></div><ShieldCheck size={43} className="admin-heading-icon" aria-hidden="true" /></div>
      <label className="admin-permission-reason" htmlFor="admin-permission-reason"><span>Lý do thay đổi role <small>(tuỳ chọn trong mock)</small></span><input id="admin-permission-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: phân công lại quyền vận hành..." /></label>
      <div className="admin-permission-table-wrap"><table className="admin-permission-table"><caption className="sr-only">Danh sách quyền tài khoản</caption><thead><tr><th>Tài khoản</th><th>Role hiện tại</th><th>Role mới</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map((item) => {
        const nextRole = drafts[item.id] || item.role;
        const dirty = nextRole !== item.role;
        const isSelf = item.id === user.id;
        const canChange = !isSelf && (!item.allowedActions || item.allowedActions.includes("change_role"));
        return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.email}</small></td><td>{adminRoleLabels[item.role] || item.role}</td><td><select aria-label={`Role mới của ${item.name}`} value={nextRole} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} disabled={!canChange || mutation.isPending}>{roleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></td><td><StatusBadge value={item.status} tone={item.status === "locked" ? "danger" : "success"} /></td><td><button className="workspace-button workspace-button-quiet" type="button" disabled={!dirty || !canChange || mutation.isPending} onClick={() => mutation.mutate({ userId: item.id, role: nextRole, revision: item.revision })}><FloppyDisk size={15} aria-hidden="true" /> Lưu</button></td></tr>;
      })}</tbody></table></div>
      {mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}
      {mutation.isSuccess && <p className="workspace-inline-success" role="status">Server đã cập nhật role và permission.</p>}
    </div>
  );
}
