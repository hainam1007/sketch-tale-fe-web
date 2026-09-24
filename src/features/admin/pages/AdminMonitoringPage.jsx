import { ArrowClockwise, ChartLineUp, Stop, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function AdminMonitoringPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const monitoringQuery = useQuery({ queryKey: queryKeys.adminMonitoring(user.id), queryFn: ({ signal }) => adminService.getMonitoring({ signal }) });
  const mutation = useMutation({ mutationFn: ({ jobId, action }) => adminService.monitorAction({ jobId, action }), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminMonitoring(user.id) }) });
  if (monitoringQuery.isLoading) return <LoadingState label="Đang tải monitoring" />;
  if (monitoringQuery.isError) return <ErrorState title="Không thể tải monitoring" message={monitoringQuery.error.message} onRetry={() => monitoringQuery.refetch()} />;
  return <div className="workspace-dashboard admin-monitoring-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / MONITORING</p><h1>Tình trạng tác vụ vận hành</h1><p>Retry/cancel chỉ hiện khi server trả về trạng thái cho phép; không tự replay tác vụ chưa rõ kết quả.</p></div><ChartLineUp size={43} className="admin-heading-icon" aria-hidden="true" /></div><div className="monitoring-summary">{[["processing", "Đang chạy"], ["failed", "Lỗi"], ["completed", "Hoàn tất"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{monitoringQuery.data.items.filter((item) => item.status === key).length}</strong></div>)}</div><div className="monitoring-list">{monitoringQuery.data.items.map((job) => <article className="monitoring-card" key={job.id}><div className="monitoring-card-heading"><div><span className="admin-report-type">{job.type}</span><h2>{job.target}</h2><p>{job.id} · usage {job.usage}</p></div><StatusBadge value={job.status} tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : job.status === "processing" ? "gold" : "neutral"} /></div>{job.progress !== null && <div className="monitoring-progress"><div><span>Progress</span><strong>{job.progress}%</strong></div><span><i style={{ width: `${job.progress}%` }} /></span></div>}{job.error && <p className="monitoring-error"><WarningCircle size={16} aria-hidden="true" /> {job.error}</p>}<div className="monitoring-actions">{job.status === "failed" && <button className="workspace-button workspace-button-quiet" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ jobId: job.id, action: "retry" })}><ArrowClockwise size={16} aria-hidden="true" /> Retry</button>}{job.status === "processing" && <button className="workspace-button workspace-button-danger" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ jobId: job.id, action: "cancel" })}><Stop size={16} aria-hidden="true" /> Cancel</button>}</div></article>)}</div>{mutation.isError && <p className="admin-mutation-error" role="alert">{mutation.error.message}</p>}</div>;
}
