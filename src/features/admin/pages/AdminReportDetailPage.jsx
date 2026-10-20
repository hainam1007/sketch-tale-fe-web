import { useState } from "react";
import { ArrowLeft, CheckCircle, ClipboardText, Flag, Note, WarningCircle } from "@phosphor-icons/react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const labels = { start_review: "Nhận xử lý", resolve: "Đánh dấu đã giải quyết", reject: "Từ chối báo cáo", reopen: "Mở lại báo cáo" };
const tones = { resolved: "success", rejected: "danger", under_review: "gold", open: "neutral" };

export default function AdminReportDetailPage() {
  const { user } = useAuth();
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const backTo = requestedReturnTo === "/admin/reports" || requestedReturnTo?.startsWith("/admin/reports?") ? requestedReturnTo : "/admin/reports";
  const queryClient = useQueryClient();
  const [noteDraft, setNoteDraft] = useState({ reportId, note: "", revision: null });
  const [pendingAction, setPendingAction] = useState(null);
  const note = noteDraft.reportId === reportId ? noteDraft.note : "";
  const noteRevision = noteDraft.reportId === reportId ? noteDraft.revision : null;
  const reportQuery = useQuery({ queryKey: queryKeys.adminReport(user.id, reportId), queryFn: ({ signal }) => adminService.getReport({ reportId, signal }) });
  const mutation = useMutation({
    mutationFn: ({ targetId, action, revision, submittedNote }) => adminService.updateReport({ reportId: targetId, action, revision, note: submittedNote }),
    onSuccess: async (next, variables) => {
      queryClient.setQueryData(queryKeys.adminReport(user.id, variables.targetId), next);
      setNoteDraft((current) => current.reportId === variables.targetId ? { reportId: variables.targetId, note: "", revision: null } : current);
      setPendingAction(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-reports", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
    },
  });

  if (reportQuery.isLoading) return <LoadingState label="Đang tải chi tiết báo cáo" />;
  if (reportQuery.isError) return <ErrorState title="Không thể mở báo cáo" message={reportQuery.error.message} onRetry={() => reportQuery.refetch()} />;
  const report = reportQuery.data;
  const actions = Array.isArray(report.allowedActions) ? report.allowedActions.filter((action) => Object.hasOwn(labels, action)) : [];
  const isConflict = mutation.error?.code === "REVISION_CONFLICT";

  function requestAction(action) {
    mutation.reset();
    setPendingAction({ reportId, action, revision: noteRevision ?? report.revision });
  }
  function confirmAction() {
    mutation.mutate({ targetId: pendingAction.reportId, action: pendingAction.action, revision: pendingAction.revision, submittedNote: note });
  }
  async function refreshAfterConflict() {
    const result = await reportQuery.refetch();
    if (result.data) setNoteDraft((current) => current.reportId === reportId ? { reportId, note: current.note, revision: result.data.revision } : current);
    mutation.reset();
    setPendingAction(null);
  }

  return <div className="workspace-dashboard admin-report-detail-page">
    <div className="admin-detail-back"><Link to={backTo}><ArrowLeft size={17} aria-hidden="true" /> Quay lại hàng đợi</Link></div>
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / CHI TIẾT BÁO CÁO</p><h1>{report.targetTitle}</h1><p>{report.reason}</p></div><StatusBadge value={report.status} tone={tones[report.status] || "neutral"} /></div>
    <div className="admin-report-detail-grid"><section className="admin-report-detail-card">
      <div className="admin-report-detail-section"><div className="admin-report-section-heading"><Flag size={18} aria-hidden="true" /><h2>Target và bằng chứng</h2></div><dl className="admin-user-meta"><div><dt>Loại target</dt><dd>{report.targetType}</dd></div><div><dt>Target ID</dt><dd>{report.targetId}</dd></div><div><dt>Người gửi</dt><dd>{report.reporter}</dd></div></dl><p className="report-evidence">{report.evidence || "Không có nội dung bằng chứng."}</p><div className="admin-report-target-preview"><ClipboardText size={17} aria-hidden="true" /><div><strong>Preview chỉ đọc</strong><p>Chỉ dữ liệu được Backend trả về trong phạm vi quyền Admin mới xuất hiện ở đây. Trình chỉnh sửa nội dung không mở từ màn hình này.</p></div></div></div>
      <div className="admin-report-detail-section"><div className="admin-report-section-heading"><Note size={18} aria-hidden="true" /><h2>Lịch sử xử lý</h2></div>{report.notes?.length ? <div className="report-note-list">{report.notes.map((item, index) => <div className="report-note" key={`${item.createdAt}-${index}`}><strong>{item.author}</strong><p>{item.text}</p><small>{formatDateTime(item.createdAt)}</small></div>)}</div> : <p className="editor-help">Chưa có ghi chú xử lý.</p>}</div>
    </section><aside className="admin-report-action-card"><h2>Thao tác kiểm soát</h2><p>Trạng thái báo cáo mô tả quy trình xử lý; không tự động ẩn truyện hoặc khóa tài khoản.</p><label htmlFor="report-note">Ghi chú xử lý</label><textarea id="report-note" rows="5" value={note} onChange={(event) => setNoteDraft({ reportId, note: event.target.value, revision: noteRevision ?? report.revision })} placeholder="Ghi lại quyết định hoặc bước tiếp theo..." />
      {mutation.isError && mutation.variables?.targetId === reportId && <div className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}{isConflict && <button className="admin-conflict-refresh" type="button" onClick={() => reportQuery.refetch()}>Tải bản mới</button>}</div>}
      {isConflict && mutation.variables?.targetId === reportId && <div className="admin-conflict-panel"><strong>Báo cáo đã thay đổi</strong><p>Đối chiếu trạng thái mới: {report.status}. Giữ ghi chú hiện tại và xác nhận lại trên revision mới nếu quyết định vẫn phù hợp.</p><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setNoteDraft({ reportId, note, revision: report.revision })}>Dùng revision mới</button></div>}
      {mutation.isSuccess && mutation.variables?.targetId === reportId && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> Server đã cập nhật báo cáo.</p>}
      {actions.length === 0 && <p className="admin-field-note">Backend chưa cung cấp thao tác được phép cho báo cáo này. Màn hình hiện ở chế độ chỉ đọc.</p>}
      <div className="admin-report-actions">{actions.map((action) => <button className={`workspace-button ${action === "reject" ? "workspace-button-danger" : action === "reopen" ? "workspace-button-quiet" : ""}`} type="button" key={action} disabled={mutation.isPending} onClick={() => requestAction(action)}>{labels[action]}</button>)}</div>
    </aside></div>
    {pendingAction?.reportId === reportId && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="report-action-confirm-title"><p className="workspace-eyebrow">XÁC NHẬN QUYẾT ĐỊNH</p><h2 id="report-action-confirm-title">{labels[pendingAction.action]}?</h2><p>Báo cáo: <strong>{report.targetTitle}</strong></p><p>Trạng thái: {report.status} · revision {pendingAction.revision}</p>{note.trim() && <div className="admin-report-confirm-note"><strong>Ghi chú sẽ được lưu cùng quyết định</strong><p>{note}</p></div>}{mutation.isError && mutation.variables?.targetId === reportId && <><p className="admin-mutation-error" role="alert">{mutation.error.message}{isConflict && " Tải trạng thái mới và xác nhận lại sau khi xem xét."}</p>{isConflict && <button className="workspace-button workspace-button-quiet" type="button" disabled={reportQuery.isFetching} onClick={refreshAfterConflict}>Tải trạng thái mới</button>}</>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={mutation.isPending} onClick={() => setPendingAction(null)}>Quay lại</button><button className={`workspace-button ${pendingAction.action === "reject" ? "workspace-button-danger" : ""}`} type="button" disabled={mutation.isPending} onClick={confirmAction}>{mutation.isPending ? "Đang gửi…" : labels[pendingAction.action]}</button></div></section></div>}
  </div>;
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Thời gian chưa xác định" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}
