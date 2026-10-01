import { useState } from "react";
import { Check, CheckCircle, ShieldCheck, X, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function ChildApprovalsPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = ["pending", "approved", "rejected"].includes(searchParams.get("status")) ? searchParams.get("status") : "pending";
  const selectedId = searchParams.get("approvalId");
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const approvalsQuery = useQuery({ queryKey: queryKeys.childApprovals(user.id, childId, { status }), queryFn: ({ signal }) => childrenService.listApprovals({ childId, status, signal }) });
  const mutation = useMutation({ mutationFn: ({ approvalId, action, revision, note }) => childrenService.updateApproval({ childId, approvalId, action, revision, note }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-approvals", user.id, childId] }) });

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
    mutation.mutate({ approvalId: selected.id, action, revision: selected.revision, note }, {
      onSuccess: () => { setRejecting(false); setRejectNote(""); },
    });
  }

  return <div className="parent-approval-page"><div className="parent-feature-heading"><div><p className="workspace-eyebrow">PHÊ DUYỆT / {child.displayName.toUpperCase()}</p><h2>Chọn điều gì được đồng hành cùng bé</h2><p>Mỗi quyết định gắn với đúng phiên bản đang chờ duyệt; vai nhạy cảm luôn có quyền riêng.</p></div><span className="parent-feature-icon"><ShieldCheck size={27} aria-hidden="true" /></span></div><div className="approval-filter-row"><div className="approval-status-tabs" aria-label="Trạng thái phê duyệt">{[["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]].map(([value, label]) => <button aria-selected={status === value} className={status === value ? "active" : ""} type="button" key={value} onClick={() => changeStatus(value)}>{label}</button>)}</div><span className="approval-count">{approvalsQuery.data.total} yêu cầu</span></div>{approvalsQuery.data.items.length ? <div className="approval-layout"><div className="approval-list" aria-label="Danh sách yêu cầu phê duyệt">{approvalsQuery.data.items.map((item) => <button className={`approval-list-item ${selected?.id === item.id ? "active" : ""}`} type="button" key={item.id} onClick={() => selectApproval(item.id)}><img src={item.proposedAssetUrl} alt="" width="54" height="54" /><span><strong>{item.name}</strong><small>{item.kind === "sensitive_role" ? "Vai nhạy cảm" : "Nhân vật"} · phiên bản {item.version}</small></span><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></button>)}</div>{selected && <ApprovalDetail item={selected} mutation={mutation} rejecting={rejecting} setRejecting={setRejecting} rejectNote={rejectNote} setRejectNote={setRejectNote} onDecision={submitDecision} />}</div> : <EmptyState icon={CheckCircle} title={status === "pending" ? "Không có yêu cầu chờ duyệt" : "Chưa có lịch sử ở trạng thái này"} message={`Hồ sơ ${child.displayName} không có mục nào trong nhóm này.`} />}</div>;
}

function ApprovalDetail({ item, mutation, rejecting, setRejecting, rejectNote, setRejectNote, onDecision }) {
  return <article className="approval-detail-card"><div className="approval-detail-heading"><div><span className="workspace-eyebrow">{item.kind === "sensitive_role" ? "QUYỀN VAI NHẠY CẢM" : "PHIÊN BẢN NHÂN VẬT"}</span><h3>{item.name}</h3><p>Phiên bản {item.version} · đã gửi {formatDate(item.updatedAt)}</p></div><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></div><div className="approval-image-compare"><figure><img src={item.originalAssetUrl} alt="Tranh hiện tại" /><figcaption>Tranh hiện tại</figcaption></figure><span aria-hidden="true">→</span><figure><img src={item.proposedAssetUrl} alt="Phiên bản đề xuất" /><figcaption>Phiên bản đề xuất</figcaption></figure></div><p className="approval-description">{item.description}</p>{item.sensitive && <div className="approval-sensitive-note"><WarningCircle size={17} aria-hidden="true" /><span>Đây là quyền vai nhạy cảm. Cho phép mục này chỉ áp dụng cho đúng nhân vật và phiên bản đang xem.</span></div>}{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{item.status === "pending" && !rejecting && <div className="approval-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setRejecting(true)} disabled={mutation.isPending}><X size={17} aria-hidden="true" /> Từ chối phiên bản</button><button className="workspace-button" type="button" onClick={() => onDecision("approve")} disabled={mutation.isPending}><Check size={17} aria-hidden="true" /> {mutation.isPending ? "Đang gửi..." : item.sensitive ? "Cho phép vai này" : "Phê duyệt phiên bản"}</button></div>}{item.status === "pending" && rejecting && <div className="approval-reject-form"><label htmlFor="approval-reject-note">Lý do hoặc ghi chú <span>(không bắt buộc nếu chưa có quy định)</span></label><textarea id="approval-reject-note" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows="3" placeholder="Ví dụ: Màu sắc chưa giống tranh bé vẽ" /><div className="approval-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setRejecting(false); setRejectNote(""); }} disabled={mutation.isPending}>Giữ lại</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => onDecision("reject", rejectNote)} disabled={mutation.isPending}><X size={17} aria-hidden="true" /> Xác nhận từ chối</button></div></div>}{item.status === "approved" && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> {item.sensitive ? "Đã cho phép vai nhạy cảm cho phiên bản này." : "Phiên bản đã được duyệt."}</p>}{item.status === "rejected" && <p className="approval-rejected-note" role="status"><X size={17} aria-hidden="true" /> Phiên bản này đã bị từ chối.</p>}</article>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}
