import { useState } from "react";
import { Flag, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { parentContentReportService } from "../services/parentContentReportService";
import "../parent-content-reports.css";

const REPORT_REASON_MAX = 1000;

export default function ParentContentReportAction({ story }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: (text) => parentContentReportService.create({ targetId: story.id, reason: text }),
    onSuccess: async () => {
      setSent(true);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["parent-content-reports", user?.id] });
    },
    onError: (requestError) => setError(requestError.message || "Không thể gửi báo cáo."),
  });
  const unknownOutcome = mutation.isError && (!mutation.error?.status || mutation.error.status >= 500);

  if (!story?.id || moduleApiModes.parentCatalog !== "real") return null;

  function submit(event) {
    event.preventDefault();
    if (unknownOutcome) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do báo cáo.");
      return;
    }
    if (trimmed.length > REPORT_REASON_MAX) {
      setError(`Lý do không được dài quá ${REPORT_REASON_MAX} ký tự.`);
      return;
    }
    setError("");
    mutation.mutate(trimmed);
  }

  return (
    <>
      <button className="workspace-button workspace-button-quiet parent-report-trigger" type="button" disabled={moduleApiModes.parentContentReports !== "real"} title={moduleApiModes.parentContentReports !== "real" ? "Báo cáo nội dung chưa được bật cho môi trường này." : undefined} onClick={() => { if (sent) { setSent(false); setReason(""); mutation.reset(); } setOpen(true); setError(""); }}>
        <Flag size={17} aria-hidden="true" /> Báo cáo nội dung
      </button>
      {open && (
        <div className="parent-report-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !mutation.isPending) setOpen(false); }}>
          <section className="parent-report-dialog" role="dialog" aria-modal="true" aria-labelledby="parent-report-title">
            <button className="parent-report-close" type="button" aria-label="Đóng" disabled={mutation.isPending} onClick={() => setOpen(false)}><X size={20} /></button>
            {sent ? (
              <div className="parent-report-result" role="status">
                <p className="workspace-eyebrow">ĐÃ TIẾP NHẬN</p>
                <h2 id="parent-report-title">Cảm ơn bạn đã báo cáo</h2>
                <p>Quản trị viên sẽ xem xét “{story.title || "truyện này"}”. Bạn có thể theo dõi trạng thái trong mục báo cáo nội dung.</p>
                <Link className="workspace-button" to="/parent/content-reports">Xem báo cáo của tôi</Link>
                <button className="workspace-button workspace-button-quiet" type="button" onClick={() => setOpen(false)}>Đóng</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="workspace-eyebrow">BÁO CÁO NỘI DUNG</p>
                <h2 id="parent-report-title">Báo cáo truyện này</h2>
                <p className="parent-report-target">{story.title || "Truyện đang xem"}</p>
                <label htmlFor="parent-report-reason">Vì sao nội dung này không phù hợp?</label>
                <textarea
                  id="parent-report-reason"
                  autoFocus
                  rows={5}
                  maxLength={REPORT_REASON_MAX}
                  value={reason}
                  onChange={(event) => { setReason(event.target.value); setError(""); }}
                  placeholder="Mô tả nội dung bạn muốn quản trị viên xem xét..."
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "parent-report-error" : "parent-report-count"}
                />
                {error && <p className="parent-report-error" id="parent-report-error" role="alert">{error}{unknownOutcome ? <> Kết quả gửi chưa xác định; hãy <Link to="/parent/content-reports">đối chiếu báo cáo của tôi</Link> trước khi gửi lại.</> : mutation.error?.status === 409 ? <> <Link to="/parent/content-reports">Xem báo cáo đang xử lý</Link>.</> : ""}</p>}
                <small id="parent-report-count">{reason.trim().length}/{REPORT_REASON_MAX} ký tự</small>
                <div className="parent-report-dialog-actions">
                  <button className="workspace-button workspace-button-quiet" type="button" disabled={mutation.isPending} onClick={() => setOpen(false)}>Hủy</button>
                  <button className="workspace-button" type="submit" disabled={mutation.isPending || unknownOutcome || moduleApiModes.parentContentReports !== "real"}>
                    {mutation.isPending ? "Đang gửi…" : "Gửi báo cáo"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
