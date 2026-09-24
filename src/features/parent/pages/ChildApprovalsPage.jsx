import { useState } from "react";
import { Check, CheckCircle, ShieldCheck, X, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams } from "react-router-dom";
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
  const [status, setStatus] = useState("pending");
  const [selectedId, setSelectedId] = useState(null);
  const approvalsQuery = useQuery({ queryKey: queryKeys.childApprovals(user.id, childId, { status }), queryFn: ({ signal }) => childrenService.listApprovals({ childId, status, signal }) });
  const mutation = useMutation({ mutationFn: ({ approvalId, action, revision, note }) => childrenService.updateApproval({ childId, approvalId, action, revision, note }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-approvals", user.id, childId] }) });

  if (approvalsQuery.isLoading) return <LoadingState label="Đang tải yêu cầu phê duyệt" />;
  if (approvalsQuery.isError) return <ErrorState title="Không thể tải phê duyệt" message={approvalsQuery.error.message} onRetry={() => approvalsQuery.refetch()} />;
  const selected = approvalsQuery.data.items.find((item) => item.id === selectedId) || approvalsQuery.data.items[0];

  return <div className="parent-approval-page"><div className="parent-feature-heading"><div><p className="workspace-eyebrow">PHÊ DUYỆT / {child.displayName.toUpperCase()}</p><h2>Chọn điều gì được đồng hành cùng bé</h2><p>Mỗi quyết định gắn với đúng phiên bản đang chờ duyệt; vai nhạy cảm luôn có quyền riêng.</p></div><span className="parent-feature-icon"><ShieldCheck size={27} aria-hidden="true" /></span></div><div className="approval-filter-row"><div className="approval-status-tabs">{[["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]].map(([value, label]) => <button className={status === value ? "active" : ""} type="button" key={value} onClick={() => { setStatus(value); setSelectedId(null); }}>{label}</button>)}</div><span className="approval-count">{approvalsQuery.data.total} yêu cầu</span></div>{approvalsQuery.data.items.length ? <div className="approval-layout"><div className="approval-list">{approvalsQuery.data.items.map((item) => <button className={`approval-list-item ${selected?.id === item.id ? "active" : ""}`} type="button" key={item.id} onClick={() => setSelectedId(item.id)}><img src={item.proposedAssetUrl} alt="" width="54" height="54" /><span><strong>{item.name}</strong><small>{item.kind === "sensitive_role" ? "Vai nhạy cảm" : "Nhân vật"} · v{item.version}</small></span><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></button>)}</div>{selected && <ApprovalDetail item={selected} mutation={mutation} onAction={(action) => mutation.mutate({ approvalId: selected.id, action, revision: selected.revision })} />}</div> : <EmptyState icon={CheckCircle} title={status === "pending" ? "Không có yêu cầu chờ duyệt" : "Chưa có lịch sử ở trạng thái này"} message={`Hồ sơ ${child.displayName} không có mục nào trong nhóm này.`} />}</div>;
}

function ApprovalDetail({ item, mutation, onAction }) {
  return <article className="approval-detail-card"><div className="approval-detail-heading"><div><span className="workspace-eyebrow">{item.kind === "sensitive_role" ? "SENSITIVE ROLE" : "CHARACTER VERSION"}</span><h3>{item.name}</h3><p>Phiên bản v{item.version} · revision {item.revision}</p></div><StatusBadge value={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "gold"} /></div><div className="approval-image-compare"><figure><img src={item.originalAssetUrl} alt="Phiên bản hiện tại" /><figcaption>Đang dùng</figcaption></figure><span aria-hidden="true">→</span><figure><img src={item.proposedAssetUrl} alt="Phiên bản đề xuất" /><figcaption>Đề xuất mới</figcaption></figure></div><p className="approval-description">{item.description}</p>{item.sensitive && <div className="approval-sensitive-note"><WarningCircle size={17} aria-hidden="true" /><span>Đây là vai nhạy cảm. Approve sẽ cấp quyền cho đúng phiên bản này, không tự mở quyền cho phiên bản khác.</span></div>}{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{item.status === "pending" && <div className="approval-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => onAction("reject")} disabled={mutation.isPending}><X size={17} aria-hidden="true" /> Từ chối</button><button className="workspace-button" type="button" onClick={() => onAction("approve")} disabled={mutation.isPending}><Check size={17} aria-hidden="true" /> {mutation.isPending ? "Đang gửi..." : "Phê duyệt phiên bản"}</button></div>}{item.status === "approved" && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> Phiên bản đã được duyệt.</p>}</article>;
}
