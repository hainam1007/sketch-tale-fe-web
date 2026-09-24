import {
  ArrowClockwise,
  CheckCircle,
  DownloadSimple,
  FileArrowDown,
  Gear,
  Info,
  Lightning,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { queryKeys } from "../../../lib/api/queryKeys";
import { childrenService } from "../services/childrenService";

const formatLabels = { pdf: "PDF đọc cùng bé", video: "Video kỷ niệm" };

export default function ParentExportsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ childId: "", storyId: "", format: "pdf" });
  const [formMessage, setFormMessage] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState({});
  const [downloadErrorId, setDownloadErrorId] = useState(null);
  const [reportDraft, setReportDraft] = useState({ enabled: true, schedule: "monthly" });
  const [reportMessage, setReportMessage] = useState(null);

  const childrenQuery = useQuery({
    queryKey: queryKeys.children(user.id),
    queryFn: ({ signal }) => childrenService.list({ signal }),
  });
  const exportsQuery = useQuery({
    queryKey: queryKeys.exports(user.id),
    queryFn: ({ signal }) => childrenService.listExports({ signal }),
  });
  const selectedChildId = form.childId;
  const libraryQuery = useQuery({
    queryKey: queryKeys.childLibrary(user.id, selectedChildId, { type: "story" }),
    queryFn: ({ signal }) => childrenService.listLibrary({ childId: selectedChildId, type: "story", signal }),
    enabled: Boolean(selectedChildId),
  });
  const reportQuery = useQuery({
    queryKey: queryKeys.familyReport(user.id),
    queryFn: ({ signal }) => childrenService.familyReport({ signal }),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => childrenService.createExport(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exports(user.id) });
      setFormMessage({ type: "success", text: data.deduplicated ? "Yêu cầu đã tồn tại; không tạo bản trùng." : "Export đã được tạo và đang chờ hệ thống xử lý." });
    },
    onError: (error) => setFormMessage({ type: "error", text: error.message }),
  });
  const retryMutation = useMutation({
    mutationFn: ({ exportId, revision }) => childrenService.retryExport({ exportId, revision }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exports(user.id) }),
  });
  const downloadMutation = useMutation({
    mutationFn: ({ exportId }) => childrenService.downloadExport({ exportId }),
    onMutate: ({ exportId }) => setDownloadErrorId(exportId),
    onSuccess: (data, variables) => {
      setDownloadLinks((current) => ({ ...current, [variables.exportId]: data }));
      setDownloadErrorId(null);
    },
  });
  const reportMutation = useMutation({
    mutationFn: (payload) => childrenService.updateFamilyReportSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.familyReport(user.id), data);
      setReportMessage({ type: "success", text: "Đã lưu cài đặt báo cáo. Việc tạo và gửi email vẫn do backend quản lý." });
    },
    onError: (error) => setReportMessage({ type: "error", text: error.message }),
  });

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value, ...(name === "childId" ? { storyId: "" } : {}) }));
    setFormMessage(null);
  }

  function submitExport(event) {
    event.preventDefault();
    if (!form.childId || !form.storyId) {
      setFormMessage({ type: "error", text: "Chọn hồ sơ bé và truyện trước khi tạo export." });
      return;
    }
    createMutation.mutate({ ...form, idempotencyKey: `${form.childId}:${form.storyId}:${form.format}:${Date.now()}` });
  }

  function saveReport(event) {
    event.preventDefault();
    if (!reportQuery.data?.settings) return;
    reportMutation.mutate({ ...reportDraft, revision: reportQuery.data.settings.revision });
  }

  const children = childrenQuery.data?.items || [];
  const stories = libraryQuery.data?.items || [];
  const jobs = exportsQuery.data?.items || [];
  const quota = exportsQuery.data?.quota;
  const report = reportQuery.data;

  return (
    <div className="parent-page export-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">GIA ĐÌNH / EXPORT</p>
          <h1>Giữ lại những trang đã cùng nhau đọc.</h1>
          <p>Tạo file từ dữ liệu server, theo dõi trạng thái xử lý và chỉ tải xuống khi link còn hiệu lực.</p>
        </div>
        <span className="parent-feature-icon"><FileArrowDown size={29} aria-hidden="true" /></span>
      </div>

      <section className="export-quota-card" aria-label="Hạn mức export">
        <div className="export-quota-icon"><Lightning size={21} weight="fill" aria-hidden="true" /></div>
        <div>
          <span className="export-kicker">HẠN MỨC TỪ ENTITLEMENT SERVER</span>
          <strong>{quota ? quota.limit === null ? `${quota.used} lượt đã tạo · không giới hạn` : `${quota.used} / ${quota.limit} lượt trong chu kỳ` : "Đang tải hạn mức…"}</strong>
          <p>{quota?.plan === "Free" ? "Gói Free vẫn có thể xuất PDF; xuất video cần gói Pro hoặc Family." : "Quota được tính ở server để tránh tạo file trùng hoặc vượt giới hạn."}</p>
        </div>
        {quota?.remaining !== null && quota?.remaining !== undefined && <span className={quota.remaining === 0 ? "export-quota-warning" : "export-quota-remaining"}>Còn {quota.remaining}</span>}
      </section>

      <div className="export-layout">
        <section className="export-create-card" aria-labelledby="export-create-title">
          <div className="export-section-heading">
            <span className="export-section-icon"><FileArrowDown size={20} aria-hidden="true" /></span>
            <div><p className="workspace-eyebrow">TẠO YÊU CẦU</p><h2 id="export-create-title">Xuất một câu chuyện</h2></div>
          </div>
          <p className="export-muted-copy">Một yêu cầu chỉ được tính quota một lần. Bạn có thể rời trang và quay lại theo dõi job sau.</p>
          <form onSubmit={submitExport}>
            <div className="export-form-grid">
              <label className="export-field" htmlFor="export-child"><span>Hồ sơ bé</span><select id="export-child" name="childId" value={form.childId} onChange={updateForm} disabled={childrenQuery.isLoading}><option value="">Chọn hồ sơ bé</option>{children.map((child) => <option key={child.id} value={child.id}>{child.displayName}</option>)}</select></label>
              <label className="export-field" htmlFor="export-story"><span>Truyện trong thư viện</span><select id="export-story" name="storyId" value={form.storyId} onChange={updateForm} disabled={!selectedChildId || libraryQuery.isLoading}><option value="">{libraryQuery.isLoading ? "Đang tải thư viện…" : "Chọn truyện"}</option>{stories.map((story) => <option key={story.id} value={story.sourceId || story.id}>{story.title}</option>)}</select></label>
              <label className="export-field" htmlFor="export-format"><span>Định dạng</span><select id="export-format" name="format" value={form.format} onChange={updateForm}><option value="pdf">{formatLabels.pdf}</option><option value="video">{formatLabels.video}</option></select></label>
            </div>
            <p className="export-field-note"><Info size={15} aria-hidden="true" /> Video có thể mất thời gian xử lý; tiến độ chỉ hiển thị khi server trả về giá trị thật.</p>
            {formMessage && <div className={formMessage.type === "error" ? "export-alert" : "export-success"} role={formMessage.type === "error" ? "alert" : "status"}>{formMessage.type === "error" ? <WarningCircle size={17} aria-hidden="true" /> : <CheckCircle size={17} aria-hidden="true" />}<span>{formMessage.text}</span></div>}
            <button className="workspace-button" type="submit" disabled={createMutation.isPending || childrenQuery.isLoading || !children.length}>{createMutation.isPending ? <><SpinnerGap className="workspace-spinner" size={17} aria-hidden="true" /> Đang tạo…</> : <><FileArrowDown size={17} aria-hidden="true" /> Tạo export</>}</button>
          </form>
        </section>

        <section className="family-report-card" aria-labelledby="family-report-title">
          <div className="export-section-heading">
            <span className="export-section-icon export-section-icon-dark"><Gear size={20} aria-hidden="true" /></span>
            <div><p className="workspace-eyebrow">BÁO CÁO HỌC TẬP</p><h2 id="family-report-title">Báo cáo học tập Family</h2></div>
          </div>
          {reportQuery.isLoading && <LoadingState label="Đang tải trạng thái báo cáo" />}
          {reportQuery.isError && <ErrorState title="Không thể tải trạng thái báo cáo" message={reportQuery.error.message} onRetry={() => reportQuery.refetch()} />}
          {report && !report.available && <div className="report-unavailable"><StatusBadge value="unavailable" tone="neutral" /><p>{report.reason}</p><small>Frontend không hiển thị thao tác gửi email khi service backend chưa bật.</small></div>}
          {report?.available && <>
            <div className="report-ready-line"><StatusBadge value={report.status} tone="success" /><span>Trạng thái do service báo cáo trả về.</span></div>
            <p className="export-muted-copy">Cài đặt chu kỳ chỉ điều khiển cấu hình. Backend chịu trách nhiệm tạo báo cáo và gửi email, nên UI không giả lập trạng thái đã gửi.</p>
            <form className="report-settings-form" onSubmit={saveReport}>
              <label className="report-toggle"><input type="checkbox" checked={reportDraft.enabled} onChange={(event) => setReportDraft((current) => ({ ...current, enabled: event.target.checked }))} /> <span>Bật báo cáo định kỳ</span></label>
              <label className="export-field" htmlFor="report-schedule"><span>Chu kỳ</span><select id="report-schedule" value={reportDraft.schedule} onChange={(event) => setReportDraft((current) => ({ ...current, schedule: event.target.value }))}><option value="monthly">Hàng tháng</option><option value="quarterly">Mỗi quý</option></select></label>
              {reportMessage && <div className={reportMessage.type === "error" ? "export-alert" : "export-success"} role={reportMessage.type === "error" ? "alert" : "status"}>{reportMessage.type === "error" ? <WarningCircle size={17} aria-hidden="true" /> : <CheckCircle size={17} aria-hidden="true" />}<span>{reportMessage.text}</span></div>}
              <button className="workspace-button workspace-button-quiet" type="submit" disabled={reportMutation.isPending}>{reportMutation.isPending ? "Đang lưu…" : "Lưu cài đặt"}</button>
            </form>
            {report.lastReport && <div className="report-last"><span><CheckCircle size={17} aria-hidden="true" /><strong>Bản gần nhất: {report.lastReport.period}</strong></span><small>{report.lastReport.fileName} · tạo bởi backend</small></div>}
          </>}
        </section>
      </div>

      <section className="export-history-section" aria-labelledby="export-history-title">
        <div className="parent-section-heading"><div><p className="workspace-eyebrow">THEO DÕI JOB</p><h2 id="export-history-title">Các bản xuất của gia đình</h2></div><span className="export-history-count">{exportsQuery.data ? `${jobs.length} yêu cầu` : "Đang tải…"}</span></div>
        {exportsQuery.isLoading && <LoadingState label="Đang tải lịch sử export" />}
        {exportsQuery.isError && <ErrorState title="Không thể tải lịch sử export" message={exportsQuery.error.message} onRetry={() => exportsQuery.refetch()} />}
        {exportsQuery.data && !jobs.length && <div className="export-empty"><DownloadSimple size={28} aria-hidden="true" /><strong>Chưa có bản xuất nào</strong><p>Tạo export đầu tiên từ form bên trên để lưu lại câu chuyện của gia đình.</p></div>}
        {exportsQuery.data && jobs.length > 0 && <div className="export-job-list">{jobs.map((job) => <ExportJobCard key={job.id} job={job} childList={children} downloadLink={downloadLinks[job.id]} downloadError={downloadErrorId === job.id ? downloadMutation.error : null} isDownloading={downloadMutation.isPending && downloadErrorId === job.id} isRetrying={retryMutation.isPending && retryMutation.variables?.exportId === job.id} onDownload={() => downloadMutation.mutate({ exportId: job.id })} onRetry={() => retryMutation.mutate({ exportId: job.id, revision: job.revision })} />)}</div>}
      </section>
    </div>
  );
}

function ExportJobCard({ job, childList, downloadLink, downloadError, isDownloading, isRetrying, onDownload, onRetry }) {
  const child = childList.find((item) => item.id === job.childId);
  const expired = job.downloadExpired;
  const status = expired ? "expired" : job.status;
  const tone = status === "completed" ? "success" : status === "failed" || status === "expired" ? "danger" : "neutral";
  const canRetry = job.status === "failed" || expired;
  return <article className="export-job-card" data-export-id={job.id}>
    <div className="export-job-main">
      <div className="export-job-title-row"><div><span className="export-job-format">{formatLabels[job.format] || job.format}</span><h3>{job.storyTitle}</h3></div><StatusBadge value={status} tone={tone} /></div>
      <p className="export-job-meta">{child?.displayName || "Hồ sơ đã lưu"} · {job.fileName}</p>
      {job.progress !== null && job.status !== "completed" && <div className="export-progress-wrap"><div className="export-progress-label"><span>Tiến độ server trả về</span><strong>{job.progress}%</strong></div><div className="export-progress"><span style={{ width: `${job.progress}%` }} /></div></div>}
      {job.error && <p className="export-job-error"><WarningCircle size={16} aria-hidden="true" /> {job.error}</p>}
      {expired && <p className="export-job-error"><WarningCircle size={16} aria-hidden="true" /> Link tải đã hết hạn; tạo lại sẽ phát sinh một job mới.</p>}
      <small className="export-job-date">Cập nhật {formatDate(job.updatedAt)}</small>
    </div>
    <div className="export-job-actions">
      {job.status === "completed" && !expired && !downloadLink && <button className="workspace-button workspace-button-quiet" type="button" onClick={onDownload} disabled={isDownloading}><DownloadSimple size={16} aria-hidden="true" /> {isDownloading ? "Đang lấy link…" : "Tải file"}</button>}
      {downloadLink && <a className="workspace-button workspace-button-quiet" href={downloadLink.url} download={downloadLink.fileName}><DownloadSimple size={16} aria-hidden="true" /> Tải file</a>}
      {canRetry && <button className="workspace-button" type="button" onClick={onRetry} disabled={isRetrying}><ArrowClockwise size={16} aria-hidden="true" /> {isRetrying ? "Đang tạo lại…" : "Tạo lại export"}</button>}
      {job.status === "queued" && <span className="export-job-waiting"><SpinnerGap size={16} aria-hidden="true" /> Đang chờ worker</span>}
      {downloadError && <span className="export-action-error" role="alert">{downloadError.message}</span>}
    </div>
  </article>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
