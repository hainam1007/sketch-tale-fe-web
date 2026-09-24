import { Prohibit, ToggleLeft, ToggleRight, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function AdminRestrictionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restrictionsQuery = useQuery({ queryKey: queryKeys.adminRestrictions(user.id), queryFn: ({ signal }) => adminService.listRestrictions({ signal }) });
  const mutation = useMutation({ mutationFn: ({ restrictionId, status }) => adminService.updateRestriction({ restrictionId, status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminRestrictions(user.id) }) });
  if (restrictionsQuery.isLoading) return <LoadingState label="Đang tải restrictions" />;
  if (restrictionsQuery.isError) return <ErrorState title="Không thể tải restrictions" message={restrictionsQuery.error.message} onRetry={() => restrictionsQuery.refetch()} />;
  return <div className="workspace-dashboard admin-restrictions-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / RESTRICTIONS</p><h1>Từ khóa và chủ đề hạn chế</h1><p>Trạng thái áp dụng do server kiểm soát và được dùng để hỗ trợ validate nội dung trước publish.</p></div><Prohibit size={43} className="admin-heading-icon" aria-hidden="true" /></div><div className="restriction-list">{restrictionsQuery.data.items.map((item) => <article className="restriction-card" key={item.id}><div className="restriction-card-main"><span className="admin-report-type">{item.type} · {item.scope}</span><h2>{item.value}</h2><p>{item.reason}</p><small>Cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</small></div><div className="restriction-card-action"><StatusBadge value={item.status} tone={item.status === "active" ? "danger" : "neutral"} /><button className="icon-button" type="button" aria-label={item.status === "active" ? `Tắt restriction ${item.value}` : `Bật restriction ${item.value}`} onClick={() => mutation.mutate({ restrictionId: item.id, status: item.status === "active" ? "disabled" : "active" })} disabled={mutation.isPending}>{item.status === "active" ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}</button></div></article>)}</div>{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status">Đã cập nhật trạng thái restriction.</p>}</div>;
}
