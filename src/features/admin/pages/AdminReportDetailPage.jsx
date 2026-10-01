import { ArrowLeft, CheckCircle, ClipboardText, Flag, Note, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const reportQuery = useQuery({ queryKey: queryKeys.adminReport(user.id, reportId), queryFn: ({ signal }) => adminService.getReport({ reportId, signal }) });
  const mutation = useMutation({
    mutationFn: ({ action }) => adminService.updateReport({ reportId, action, revision: reportQuery.data.revision, note }),
    onSuccess: (next) => { queryClient.setQueryData(queryKeys.adminReport(user.id, reportId), next); queryClient.invalidateQueries({ queryKey: ["admin-reports", user.id] }); queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] }); setNote(""); },
  });

  if (reportQuery.isLoading) return <LoadingState label="Đang tải chi tiết báo cáo" />;
  if (reportQuery.isError) return <ErrorState title="Không thể mở báo cáo" message={reportQuery.error.message} onRetry={() => reportQuery.refetch()} />;
  const report = reportQuery.data;
  const actions = report.allowedActions || (report.status === "open" ? ["start_review"] : report.status === "under_review" ? ["resolve", "reject"] : ["reopen"]);

  return <div className="workspace-dashboard admin-report-detail-page">
    <div className="admin-detail-back"><Link to="/admin/reports"><ArrowLeft size={17} aria-hidden="true" /> Quay lại hàng đợi</Link></div>
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / REPORT DETAIL</p><h1>{report.targetTitle}</h1><p>{report.reason}</p></div><StatusBadge value={report.status} tone={tones[report.status] || "neutral"} /></div>
    <div className="admin-report-detail-grid"><section className="admin-report-detail-card">
      <div className="admin-report-detail-section"><div className="admin-report-section-heading"><Flag size={18} aria-hidden="true" /><h2>Target và bằng chứng</h2></div><dl className="admin-user-meta"><div><dt>Loại target</dt><dd>{report.targetType}</dd></div><div><dt>Target ID</dt><dd>{report.targetId}</dd></div><div><dt>Người gửi</dt><dd>{report.reporter}</dd></div></dl><p className="report-evidence">{report.evidence}</p><div className="admin-report-target-preview"><ClipboardText size={17} aria-hidden="true" /><div><strong>Preview chỉ đọc</strong><p>Target được hiển thị trong phạm vi dữ liệu Admin được cấp. Trình chỉnh sửa nội dung không mở từ màn hình này.</p></div></div></div>
      <div className="admin-report-detail-section"><div className="admin-report-section-heading"><Note size={18} aria-hidden="true" /><h2>Lịch sử xử lý</h2></div>{report.notes?.length ? <div className="report-note-list">{report.notes.map((item, index) => <div className="report-note" key={`${item.createdAt}-${index}`}><strong>{item.author}</strong><p>{item.text}</p><small>{formatDateTime(item.createdAt)}</small></div>)}</div> : <p className="editor-help">Chưa có ghi chú xử lý.</p>}</div>
    </section><aside className="admin-report-action-card"><h2>Thao tác kiểm soát</h2><p>Trạng thái báo cáo mô tả quy trình xử lý; không tự động ẩn story hoặc khóa tài khoản.</p><label htmlFor="report-note">Ghi chú</label><textarea id="report-note" rows="5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi lại quyết định hoặc bước tiếp theo..." />{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> Server đã cập nhật report.</p>}<div className="admin-report-actions">{actions.map((action) => <button className={`workspace-button ${action === "reject" ? "workspace-button-danger" : action === "reopen" ? "workspace-button-quiet" : ""}`} type="button" key={action} disabled={mutation.isPending} onClick={() => mutation.mutate({ action })}>{labels[action] || action}</button>)}</div></aside></div>
  </div>;
}

function formatDateTime(value) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
