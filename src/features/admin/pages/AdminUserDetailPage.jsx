import { ArrowLeft, LockKey, LockKeyOpen, ShieldCheck, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, SuccessState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels, adminUserStatusLabels, isConflictError, isPolicyError } from "../models";

export default function AdminUserDetailPage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const backTo = (requestedReturnTo === "/admin/users" || requestedReturnTo?.startsWith("/admin/users?")) ? requestedReturnTo : "/admin/users";
  const queryClient = useQueryClient();
  const [reasonDraft, setReasonDraft] = useState({ userId, value: "" });
  const [confirmAction, setConfirmAction] = useState(null);
  const reason = reasonDraft.userId === userId ? reasonDraft.value : "";
  const userQuery = useQuery({ queryKey: queryKeys.adminUser(user.id, userId), queryFn: ({ signal }) => adminService.getUser({ userId, signal }) });
  const mutation = useMutation({
    mutationFn: ({ targetId, status, revision, submittedReason }) => adminService.updateUserStatus({ userId: targetId, status, revision, reason: submittedReason }),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(queryKeys.adminUser(user.id, variables.targetId), updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-permissions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
      setReasonDraft({ userId: variables.targetId, value: "" });
      setConfirmAction((current) => current?.targetId === variables.targetId ? null : current);
    },
  });
  if (userQuery.isLoading) return <LoadingState label="Đang tải thông tin tài khoản" />;
  if (userQuery.isError) return <ErrorState title="Không thể mở tài khoản" message={userQuery.error.message} onRetry={() => userQuery.refetch()} />;
  const target = userQuery.data;
  const nextStatus = target.status === "locked" ? "active" : "locked";
  const isSelf = target.id === user.id;
  const actionName = nextStatus === "locked" ? "lock" : "unlock";
  const canChange = !isSelf && Array.isArray(target.allowedActions) && target.allowedActions.includes(actionName);

  function changeStatus() {
    setConfirmAction({ targetId: userId, status: nextStatus, revision: target.revision });
  }

  async function refreshAfterConflict() {
    await userQuery.refetch();
    mutation.reset();
    setConfirmAction(null);
  }

  return (
    <div className="workspace-dashboard admin-user-detail">
      <div className="admin-detail-back"><Link to={backTo}><ArrowLeft size={17} aria-hidden="true" /> Quay lại danh sách</Link></div>
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / TÀI KHOẢN</p><h1>Chi tiết tài khoản</h1><p>Xem trạng thái và thực hiện thao tác có kiểm soát từ server.</p></div><StatusBadge value={target.status || "unknown"} label={adminUserStatusLabels[target.status] || target.status || "Chưa xác định"} tone={target.status === "locked" ? "danger" : target.status === "active" ? "success" : "neutral"} /></div>
      <section className="admin-user-detail-card">
        <div className="admin-detail-identity"><span className="admin-detail-avatar"><UserCircle size={49} weight="duotone" aria-hidden="true" /></span><div><span className="workspace-eyebrow">{adminRoleLabels[target.role] || target.role}</span><h2>{target.name}</h2><p>{target.email}</p></div></div>
        <dl className="admin-user-meta"><div><dt>Gói / loại tài khoản</dt><dd>{target.plan}</dd></div><div><dt>ID tài khoản</dt><dd>{target.id}</dd></div><div><dt>Trạng thái</dt><dd>{adminUserStatusLabels[target.status] || target.status}</dd></div><div><dt>Revision</dt><dd>{target.revision}</dd></div></dl>
        <div className="admin-detail-actions">
          <label className="admin-action-reason" htmlFor="admin-user-action-reason"><span>Lý do thao tác <small>(tuỳ chọn)</small></span><input id="admin-user-action-reason" value={reason} onChange={(event) => setReasonDraft({ userId, value: event.target.value })} placeholder="Ví dụ: xử lý yêu cầu hỗ trợ..." /></label>
          {mutation.isSuccess && mutation.variables?.targetId === userId && <SuccessState>Server đã cập nhật trạng thái.</SuccessState>}
          {mutation.isError && mutation.variables?.targetId === userId && <p className="admin-mutation-error" role="alert">{mutation.error.message}{isPolicyError(mutation.error) && " Đây là giới hạn chính sách, không thể vượt qua bằng cách tải lại."}</p>}
          <button className={`workspace-button ${target.status === "locked" ? "" : "workspace-button-danger"}`} type="button" disabled={!canChange || mutation.isPending} onClick={changeStatus}>{target.status === "locked" ? <LockKeyOpen size={18} aria-hidden="true" /> : <LockKey size={18} aria-hidden="true" />}{mutation.isPending ? "Đang cập nhật..." : target.status === "locked" ? "Mở khóa tài khoản" : "Khóa tài khoản"}</button>
          {isSelf && <small><ShieldCheck size={15} aria-hidden="true" /> Không thể tự khóa tài khoản quản trị.</small>}
        </div>
      </section>
      {confirmAction?.targetId === userId && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="user-status-confirm-title"><p className="workspace-eyebrow">XÁC NHẬN THAO TÁC</p><h2 id="user-status-confirm-title">{confirmAction.status === "locked" ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}</h2><p><strong>{target.name || "Chưa có tên"}</strong> · {target.email || target.id}</p><p>Trạng thái hiện tại: {adminUserStatusLabels[target.status] || target.status || "Chưa xác định"} → {adminUserStatusLabels[confirmAction.status]}</p><p>Lý do: {reason.trim() || "Chưa cung cấp"}</p>{mutation.isError && mutation.variables?.targetId === userId && <><p className="admin-mutation-error" role="alert">{mutation.error.message}{isConflictError(mutation.error) && " Tải trạng thái mới và xem lại trước khi gửi tiếp."}</p>{isConflictError(mutation.error) && <button className="workspace-button workspace-button-quiet" type="button" disabled={userQuery.isFetching} onClick={refreshAfterConflict}>Tải trạng thái mới</button>}</>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={mutation.isPending} onClick={() => setConfirmAction(null)}>Quay lại</button><button className={`workspace-button ${confirmAction.status === "locked" ? "workspace-button-danger" : ""}`} type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ targetId: userId, status: confirmAction.status, revision: confirmAction.revision, submittedReason: reason })}>{mutation.isPending ? "Đang cập nhật…" : confirmAction.status === "locked" ? "Xác nhận khóa" : "Xác nhận mở khóa"}</button></div></section></div>}
    </div>
  );
}
