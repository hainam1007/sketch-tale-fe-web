import { useState } from "react";
import { ArrowClockwise, ChartLineUp, Funnel, MagnifyingGlass, Stop, WarningCircle, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const statusLabels = { all: "Tất cả trạng thái", processing: "Đang chạy", failed: "Thất bại", completed: "Hoàn tất", cancelled: "Đã hủy", cancelling: "Đang hủy" };

export default function AdminMonitoringPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [cancelTarget, setCancelTarget] = useState(null);
  const monitoringQuery = useQuery({
    queryKey: queryKeys.adminMonitoring(user.id),
    queryFn: ({ signal }) => adminService.getMonitoring({ signal }),
    refetchInterval: (query) => query.state.data?.items?.some((item) => ["processing", "cancelling"].includes(item.status)) ? 15000 : false,
    refetchIntervalInBackground: false,
  });
  const mutation = useMutation({
    mutationFn: ({ jobId, action, revision }) => adminService.monitorAction({ jobId, action, revision }),
    onMutate: ({ jobId }) => setPendingIds((current) => new Set(current).add(jobId)),
    onSettled: (_data, _error, variables) => setPendingIds((current) => { const next = new Set(current); next.delete(variables.jobId); return next; }),
    onSuccess: async () => {
      setCancelTarget(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminMonitoring(user.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });
  const items = monitoringQuery.data?.items || [];
  const search = searchParams.get("search") || "";
  const status = Object.hasOwn(statusLabels, searchParams.get("status")) ? searchParams.get("status") : "all";
  const filtered = items.filter((item) => (!search || `${item.id} ${item.target} ${item.type}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi"))) && (status === "all" || item.status === status));

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: key === "search" });
  }
  function execute(job, action) {
    mutation.reset();
    mutation.mutate({ jobId: job.id, action, revision: job.revision });
  }

  if (monitoringQuery.isLoading) return <LoadingState label="Đang tải tác vụ vận hành" />;
  if (monitoringQuery.isError) return <ErrorState title="Không thể tải giám sát tác vụ" message={monitoringQuery.error.message} onRetry={() => monitoringQuery.refetch()} />;

  return <div className="workspace-dashboard admin-monitoring-page">
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / GIÁM SÁT</p><h1>Tình trạng tác vụ vận hành</h1><p>Tác vụ đang chạy được cập nhật định kỳ; các thao tác phụ thuộc trạng thái và quyền do Backend trả về.</p></div><button className="workspace-button workspace-button-quiet" type="button" onClick={() => monitoringQuery.refetch()} disabled={monitoringQuery.isFetching}><ArrowClockwise size={17} aria-hidden="true" /> {monitoringQuery.isFetching ? "Đang làm mới" : "Làm mới"}</button></div>
    {monitoringQuery.isFetching && <p className="admin-refresh-note" role="status">Đang đồng bộ danh sách…</p>}
    <div className="monitoring-summary">{[["processing", "Đang chạy"], ["failed", "Lỗi"], ["completed", "Hoàn tất"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{items.filter((item) => item.status === key).length}</strong></div>)}</div>
    <section className="admin-filter-panel"><div className="admin-filter-title"><Funnel size={17} aria-hidden="true" /><strong>Lọc tác vụ</strong><span className="admin-filter-result-count">{filtered.length} kết quả</span></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm tác vụ</span><MagnifyingGlass size={18} aria-hidden="true" /><input aria-label="Tìm tác vụ" value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm mã, loại hoặc đối tượng" /></label><label><span className="sr-only">Lọc trạng thái</span><select aria-label="Lọc trạng thái tác vụ" value={status} onChange={(event) => updateFilter("status", event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>{(search || status !== "all") && <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={() => setSearchParams({})}><X size={16} aria-hidden="true" /> Xóa lọc</button>}</div></section>
    <section aria-label="Danh sách tác vụ">{filtered.length ? <div className="monitoring-list">{filtered.map((job) => {
      const progress = Number.isFinite(job.progress) ? Math.max(0, Math.min(100, job.progress)) : null;
      const busy = pendingIds.has(job.id);
      const canRetry = job.allowedActions?.includes("retry") && job.status === "failed";
      const canCancel = job.allowedActions?.includes("cancel") && job.status === "processing";
      return <article className="monitoring-card" key={job.id}><div className="monitoring-card-heading"><div><span className="admin-report-type">{job.type}</span><h2>{job.target}</h2><p>{job.id} · usage {job.usage === 0 ? "0" : job.usage || "Chưa có"} · cập nhật {formatDate(job.updatedAt)}</p></div><StatusBadge value={job.status} tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : ["processing", "cancelling"].includes(job.status) ? "gold" : "neutral"} /></div>{progress !== null ? <div className="monitoring-progress"><div><span>Tiến độ</span><strong>{progress}%</strong></div><span role="progressbar" aria-label={`Tiến độ ${job.target}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></span></div> : <p className="admin-job-no-progress">Chưa có dữ liệu tiến độ.</p>}{job.error && <p className="monitoring-error"><WarningCircle size={16} aria-hidden="true" /> {job.error}</p>}<div className="monitoring-actions">{canRetry && <button className="workspace-button workspace-button-quiet" type="button" disabled={busy || !job.revision} onClick={() => execute(job, "retry")}><ArrowClockwise size={16} aria-hidden="true" /> {busy ? "Đang gửi…" : "Thử lại"}</button>}{canCancel && <button className="workspace-button workspace-button-danger" type="button" disabled={busy || !job.revision} onClick={() => setCancelTarget(job)}><Stop size={16} aria-hidden="true" /> {busy ? "Đang xử lý…" : "Hủy tác vụ"}</button>}{!canRetry && !canCancel && <span className="admin-job-readonly">Chỉ xem</span>}</div></article>;
    })}</div> : <EmptyState icon={ChartLineUp} title={items.length ? "Không có tác vụ phù hợp" : "Chưa có tác vụ"} message={items.length ? "Thử đổi từ khóa hoặc bộ lọc." : "Tác vụ sẽ xuất hiện khi hệ thống phát sinh xử lý."} />}</section>
    {mutation.isError && <p className="admin-mutation-error" role="alert">{mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status">Đã nhận phản hồi cho thao tác tác vụ.</p>}
    {cancelTarget && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-job-title"><p className="workspace-eyebrow">XÁC NHẬN TÁC ĐỘNG</p><h2 id="cancel-job-title">Hủy tác vụ này?</h2><p><strong>{cancelTarget.target}</strong> · {cancelTarget.id}</p><p>Backend sẽ kiểm tra lại trạng thái trước khi chấp nhận yêu cầu.</p>{mutation.isError && <p className="admin-mutation-error" role="alert">{mutation.error.message}</p>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={mutation.isPending} onClick={() => setCancelTarget(null)}>Giữ tác vụ</button><button className="workspace-button workspace-button-danger" type="button" disabled={mutation.isPending} onClick={() => execute(cancelTarget, "cancel")}>{mutation.isPending ? "Đang gửi…" : "Xác nhận hủy"}</button></div></section></div>}
  </div>;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Thời gian chưa xác định" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}
