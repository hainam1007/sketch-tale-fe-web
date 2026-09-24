import { ArrowLeft, LockKey, LockKeyOpen, ShieldCheck, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, SuccessState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels, adminUserStatusLabels, isConflictError } from "../models";

export default function AdminUserDetailPage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const userQuery = useQuery({ queryKey: queryKeys.adminUser(user.id, userId), queryFn: ({ signal }) => adminService.getUser({ userId, signal }) });
  const mutation = useMutation({
    mutationFn: ({ status, revision }) => adminService.updateUserStatus({ userId, status, revision, reason }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.adminUser(user.id, userId), updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-permissions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
      setReason("");
    },
  });

  if (userQuery.isLoading) return <LoadingState label="Đang tải thông tin tài khoản" />;
  if (userQuery.isError) return <ErrorState title="Không thể mở tài khoản" message={userQuery.error.message} onRetry={() => userQuery.refetch()} />;
  const target = userQuery.data;
  const nextStatus = target.status === "locked" ? "active" : "locked";
  const isSelf = target.id === user.id;
  const actionName = nextStatus === "locked" ? "lock" : "unlock";
  const canChange = !isSelf && (!target.allowedActions || target.allowedActions.includes(actionName));

  function changeStatus() {
    if (nextStatus === "locked" && !window.confirm(`Khóa tài khoản ${target.name}?`)) return;
    mutation.mutate({ status: nextStatus, revision: target.revision });
  }

  return (
    <div className="workspace-dashboard admin-user-detail">
      <div className="admin-detail-back"><Link to="/admin/users"><ArrowLeft size={17} aria-hidden="true" /> Quay lại danh sách</Link></div>
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / TÀI KHOẢN</p><h1>Chi tiết tài khoản</h1><p>Xem trạng thái và thực hiện thao tác có kiểm soát từ server.</p></div><StatusBadge value={target.status} tone={target.status === "locked" ? "danger" : "success"} /></div>
      <section className="admin-user-detail-card">
        <div className="admin-detail-identity"><span className="admin-detail-avatar"><UserCircle size={49} weight="duotone" aria-hidden="true" /></span><div><span className="workspace-eyebrow">{adminRoleLabels[target.role] || target.role}</span><h2>{target.name}</h2><p>{target.email}</p></div></div>
        <dl className="admin-user-meta"><div><dt>Gói / loại tài khoản</dt><dd>{target.plan}</dd></div><div><dt>ID tài khoản</dt><dd>{target.id}</dd></div><div><dt>Trạng thái</dt><dd>{adminUserStatusLabels[target.status] || target.status}</dd></div><div><dt>Revision</dt><dd>{target.revision}</dd></div></dl>
        <div className="admin-detail-actions">
          <label className="admin-action-reason" htmlFor="admin-user-action-reason"><span>Lý do thao tác <small>(tuỳ chọn trong mock)</small></span><input id="admin-user-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: xử lý yêu cầu hỗ trợ..." /></label>
          {mutation.isSuccess && <SuccessState>Server đã cập nhật trạng thái.</SuccessState>}
          {mutation.isError && <p className="admin-mutation-error" role="alert">{mutation.error.message}{isConflictError(mutation.error) && " Hãy tải lại dữ liệu trước khi thao tác tiếp."}</p>}
          <button className={`workspace-button ${target.status === "locked" ? "" : "workspace-button-danger"}`} type="button" disabled={!canChange || mutation.isPending} onClick={changeStatus}>{target.status === "locked" ? <LockKeyOpen size={18} aria-hidden="true" /> : <LockKey size={18} aria-hidden="true" />}{mutation.isPending ? "Đang cập nhật..." : target.status === "locked" ? "Mở khóa tài khoản" : "Khóa tài khoản"}</button>
          {isSelf && <small><ShieldCheck size={15} aria-hidden="true" /> Không thể tự khóa tài khoản quản trị.</small>}
        </div>
      </section>
    </div>
  );
}
