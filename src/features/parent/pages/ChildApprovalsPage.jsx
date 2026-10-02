import { useState } from "react";
import { Check, CheckCircle, ShieldCheck, X, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

export default function ChildApprovalsPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = APPROVAL_STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "pending";
  const selectedId = searchParams.get("approvalId");
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const invalidateApprovals = () => queryClient.invalidateQueries({ queryKey: ["child-approvals", user.id, childId] });
  const approvalsQuery = useQuery({
    queryKey: queryKeys.childApprovals(user.id, childId, { status }),
    queryFn: ({ signal }) => childrenService.listApprovals({ childId, status, signal }),
  });
  const versionMutation = useMutation({
    mutationFn: ({ approvalId, action, revision, note }) => childrenService.updateApproval({ childId, approvalId, action, revision, note }),
    onSuccess: invalidateApprovals,
  });
  const permissionMutation = useMutation({
    mutationFn: ({ approvalId, action, permissionRevision }) => childrenService.updateSensitiveRolePermission({ childId, approvalId, action, permissionRevision }),
    onSuccess: invalidateApprovals,
  });

  if (approvalsQuery.isLoading) return <LoadingState label="Đang tải yêu cầu phê duyệt" />;
  if (approvalsQuery.isError) return <ErrorState title="Không thể tải phê duyệt" message={approvalsQuery.error.message} onRetry={() => approvalsQuery.refetch()} />;
  const selected = approvalsQuery.data.items.find((item) => item.id === selectedId) || approvalsQuery.data.items[0];

  function changeStatus(value) {
    const next = new URLSearchParams(searchParams);
    next.set("status", value);
    next.delete("approvalId");
    setSearchParams(next);
    setRejecting(false);
  }

  function selectApproval(id) {
    const next = new URLSearchParams(searchParams);
    next.set("approvalId", id);
    setSearchParams(next);
  }

  function submitDecision(action, note = "") {
    if (!selected) return;
    versionMutation.mutate({ approvalId: selected.id, action, revision: selected.revision, note }, {
      onSuccess: () => { setRejecting(false); setRejectNote(""); },
    });
  }

  function submitPermission(action) {
    if (!selected?.sensitive) return;
    permissionMutation.mutate({ approvalId: selected.id, action, permissionRevision: selected.permissionRevision || 1 });
  }

  return (
    <div className="parent-approval-page">
      <div className="parent-feature-heading">
        <div><p className="workspace-eyebrow">PHÊ DUYỆT / {child.displayName.toUpperCase()}</p><h2>Chọn điều gì được đồng hành cùng bé</h2><p>Mỗi quyết định gắn với đúng phiên bản đang chờ duyệt; vai nhạy cảm có quyền riêng cho từng nhân vật.</p></div>
        <span className="parent-feature-icon"><ShieldCheck size={27} aria-hidden="true" /></span>
      </div>
      <div className="approval-filter-row">
        <div className="approval-status-tabs" aria-label="Trạng thái phê duyệt">
          {[['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối']].map(([value, label]) => <button aria-selected={status === value} className={status === value ? "active" : ""} type="button" key={value} onClick={() => changeStatus(value)}>{label}</button>)}
        </div>
        <span className="approval-count">{approvalsQuery.data.total} yêu cầu</span>
      </div>
      {approvalsQuery.data.items.length ? (
        <div className="approval-layout">
          <div className="approval-list" aria-label="Danh sách yêu cầu phê duyệt">
            {approvalsQuery.data.items.map((item) => <button className={`approval-list-item ${selected?.id === item.id ? "active" : ""}`} type="button" key={item.id} onClick={() => selectApproval(item.id)}><img src={item.proposedAssetUrl} alt="" width="54" height="54" /><span><strong>{item.name}</strong><small>{item.kind === "sensitive_role" ? "Vai nhạy cảm" : "Nhân vật"} · phiên bản {item.version}</small></span><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></button>)}
          </div>
          {selected && <ApprovalDetail item={selected} versionMutation={versionMutation} permissionMutation={permissionMutation} rejecting={rejecting} setRejecting={setRejecting} rejectNote={rejectNote} setRejectNote={setRejectNote} onDecision={submitDecision} onPermission={submitPermission} />}
        </div>
      ) : <EmptyState icon={CheckCircle} title={status === "pending" ? "Không có yêu cầu chờ duyệt" : "Chưa có lịch sử ở trạng thái này"} message={`Hồ sơ ${child.displayName} không có mục nào trong nhóm này.`} />}
    </div>
  );
}

function ApprovalDetail({ item, versionMutation, permissionMutation, rejecting, setRejecting, rejectNote, setRejectNote, onDecision, onPermission }) {
  const isBusy = versionMutation.isPending || permissionMutation.isPending;
  const mutationError = versionMutation.error || permissionMutation.error;
  return (
    <article className="approval-detail-card">
      <div className="approval-detail-heading"><div><span className="workspace-eyebrow">{item.kind === "sensitive_role" ? "QUYỀN VAI NHẠY CẢM" : "PHIÊN BẢN NHÂN VẬT"}</span><h3>{item.name}</h3><p>Phiên bản {item.version} · đã gửi {formatDate(item.updatedAt)}</p></div><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></div>
      <div className="approval-image-compare"><figure><img src={item.originalAssetUrl} alt="Tranh hiện tại" /><figcaption>Tranh hiện tại</figcaption></figure><span aria-hidden="true">→</span><figure><img src={item.proposedAssetUrl} alt="Phiên bản đề xuất" /><figcaption>Phiên bản đề xuất</figcaption></figure></div>
      <p className="approval-description">{item.description}</p>
      {item.sensitive && <div className="approval-sensitive-note"><WarningCircle size={17} aria-hidden="true" /><span>Đây là vai nhạy cảm. Duyệt phiên bản và cho phép vai là hai quyết định riêng; quyền chỉ áp dụng cho hồ sơ của bé này.</span></div>}
      {mutationError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutationError.message}</p>}
      {item.sensitive && <div className="approval-permission-row"><span><strong>Quyền vai:</strong> {item.permissionGranted ? "Đã cho phép" : "Chưa cho phép"}</span><button className="workspace-button workspace-button-quiet" type="button" onClick={() => onPermission(item.permissionGranted ? "revoke" : "allow")} disabled={isBusy}>{permissionMutation.isPending ? "Đang cập nhật..." : item.permissionGranted ? "Thu hồi quyền vai" : "Cho phép vai này"}</button></div>}
      {item.status === "pending" && !rejecting && <div className="approval-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setRejecting(true)} disabled={isBusy}><X size={17} aria-hidden="true" /> Từ chối phiên bản</button><button className="workspace-button" type="button" onClick={() => onDecision("approve")} disabled={isBusy}><Check size={17} aria-hidden="true" /> {versionMutation.isPending ? "Đang gửi..." : "Phê duyệt phiên bản"}</button></div>}
      {item.status === "pending" && rejecting && <div className="approval-reject-form"><label htmlFor="approval-reject-note">Lý do hoặc ghi chú <span>(không bắt buộc nếu chưa có quy định)</span></label><textarea id="approval-reject-note" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows="3" placeholder="Ví dụ: Màu sắc chưa giống tranh bé vẽ" /><div className="approval-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setRejecting(false); setRejectNote(""); }} disabled={isBusy}>Giữ lại</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => onDecision("reject", rejectNote)} disabled={isBusy}><X size={17} aria-hidden="true" /> Xác nhận từ chối</button></div></div>}
      {item.status === "approved" && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> Phiên bản đã được duyệt.</p>}
      {item.status === "rejected" && <p className="approval-rejected-note" role="status"><X size={17} aria-hidden="true" /> Phiên bản này đã bị từ chối.</p>}
    </article>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}
