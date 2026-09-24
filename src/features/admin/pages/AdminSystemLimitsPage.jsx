import { useState } from "react";
import { FloppyDisk, Gauge, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const fields = [["maxAssetSizeMb", "Asset tối đa (MB)"], ["maxStoryPages", "Số page tối đa / story"], ["maxSlotsPerRole", "Số slot tối đa / role"], ["aiGenerationsPerMinute", "AI generation / phút"], ["parentChildProfileLimit", "Hồ sơ bé tối đa / account"]];

export default function AdminSystemLimitsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const limitsQuery = useQuery({ queryKey: queryKeys.adminSystemLimits(user.id), queryFn: ({ signal }) => adminService.getSystemLimits({ signal }) });
  const [draft, setDraft] = useState(null);
  const mutation = useMutation({ mutationFn: adminService.updateSystemLimits, onSuccess: (next) => { queryClient.setQueryData(queryKeys.adminSystemLimits(user.id), next); setDraft(null); } });
  if (limitsQuery.isLoading) return <LoadingState label="Đang tải giới hạn hệ thống" />;
  if (limitsQuery.isError) return <ErrorState title="Không thể tải giới hạn" message={limitsQuery.error.message} onRetry={() => limitsQuery.refetch()} />;
  const values = draft || Object.fromEntries(fields.map(([key]) => [key, limitsQuery.data[key]]));
  const dirty = JSON.stringify(values) !== JSON.stringify(Object.fromEntries(fields.map(([key]) => [key, limitsQuery.data[key]])));
  return <div className="workspace-dashboard admin-limits-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / SYSTEM LIMITS</p><h1>Giới hạn hệ thống</h1><p>Giới hạn chung, entitlement và quota Parent là ba lớp khác nhau; màn này chỉ sửa constraint hệ thống.</p></div><Gauge size={43} className="admin-heading-icon" aria-hidden="true" /></div><form className="admin-limits-card" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ ...values, revision: limitsQuery.data.revision }); }}><div className="admin-limit-grid">{fields.map(([key, label]) => <label className="admin-limit-field" htmlFor={`limit-${key}`} key={key}><span>{label}</span><input id={`limit-${key}`} type="number" min="1" value={values[key]} onChange={(event) => setDraft((current) => ({ ...(current || values), [key]: Number(event.target.value) }))} /></label>)}</div>{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status">Đã lưu giới hạn hệ thống.</p>}<div className="admin-limits-actions"><span>Revision {limitsQuery.data.revision} · cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(limitsQuery.data.updatedAt))}</span><button className="workspace-button" type="submit" disabled={!dirty || mutation.isPending}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : "Lưu giới hạn"}</button></div></form></div>;
}
