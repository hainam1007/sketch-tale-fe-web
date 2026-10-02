import { FloppyDisk, Gauge, WarningCircle, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const fields = [["maxAssetSizeMb", "Dung lượng tài sản tối đa", "MB"], ["maxStoryPages", "Số trang tối đa mỗi truyện", "trang"], ["maxSlotsPerRole", "Số vị trí tối đa mỗi vai", "slot"], ["aiGenerationsPerMinute", "Lượt tạo AI tối đa mỗi phút", "lượt/phút"], ["parentChildProfileLimit", "Hồ sơ trẻ tối đa mỗi Parent", "hồ sơ"]];

export default function AdminSystemLimitsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const limitsQuery = useQuery({ queryKey: queryKeys.adminSystemLimits(user.id), queryFn: ({ signal }) => adminService.getSystemLimits({ signal }) });
  const [draft, setDraft] = useState(null);
  const [localErrors, setLocalErrors] = useState({});
  const mutation = useMutation({ mutationFn: adminService.updateSystemLimits, onSuccess: (next) => { queryClient.setQueryData(queryKeys.adminSystemLimits(user.id), next); setDraft(null); setLocalErrors({}); } });
  if (limitsQuery.isLoading) return <LoadingState label="Đang tải giới hạn hệ thống" />;
  if (limitsQuery.isError) return <ErrorState title="Không thể tải giới hạn" message={limitsQuery.error.message} onRetry={() => limitsQuery.refetch()} />;
  const source = limitsQuery.data;
  const baseline = Object.fromEntries(fields.map(([key]) => [key, String(source[key] ?? "")]));
  const values = draft || baseline;
  const dirty = fields.some(([key]) => values[key] !== baseline[key]);

  function updateValue(key, value) { setDraft((current) => ({ ...(current || baseline), [key]: value })); setLocalErrors((current) => ({ ...current, [key]: "" })); }
  function reset() { setDraft(null); setLocalErrors({}); mutation.reset(); }
  function submit(event) {
    event.preventDefault();
    const errors = {};
    fields.forEach(([key]) => { if (!/^\d+$/.test(values[key]) || Number(values[key]) <= 0) errors[key] = "Nhập số nguyên dương."; });
    if (Object.keys(errors).length) { setLocalErrors(errors); return; }
    mutation.mutate({ ...Object.fromEntries(fields.map(([key]) => [key, Number(values[key])])), revision: source.revision });
  }
  const serverErrors = mutation.error?.fieldErrors || {};
  return <div className="workspace-dashboard admin-limits-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / SYSTEM LIMITS</p><h1>Giới hạn hệ thống</h1><p>Thay đổi constraint chung và xem lại giá trị trước khi áp dụng.</p></div><Gauge size={43} className="admin-heading-icon" aria-hidden="true" /></div><form className="admin-limits-card" onSubmit={submit} noValidate><div className="admin-limit-grid">{fields.map(([key, label, unit]) => <label className="admin-limit-field" htmlFor={`limit-${key}`} key={key}><span>{label} <small>({unit})</small></span><input id={`limit-${key}`} type="text" inputMode="numeric" value={values[key]} aria-invalid={Boolean(localErrors[key] || serverErrors[key])} aria-describedby={`${key}-error`} onChange={(event) => updateValue(key, event.target.value)} /><small id={`${key}-error`} className="admin-field-error">{localErrors[key] || serverErrors[key] || `Giá trị hiện tại: ${baseline[key]} ${unit}`}</small></label>)}</div>{dirty && <div className="admin-limits-diff"><strong>Thay đổi chưa lưu</strong>{fields.filter(([key]) => values[key] !== baseline[key]).map(([key, label, unit]) => <span key={key}>{label}: {baseline[key]} → {values[key]} {unit}</span>)}</div>}{mutation.error && !Object.keys(serverErrors).length && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status">Đã lưu giới hạn hệ thống.</p>}<div className="admin-limits-actions"><span>Revision {source.revision} · cập nhật {formatDate(source.updatedAt)}</span><div><button className="workspace-button workspace-button-quiet" type="button" onClick={reset} disabled={!dirty || mutation.isPending}><X size={16} aria-hidden="true" /> Hủy thay đổi</button><button className="workspace-button" type="submit" disabled={!dirty || mutation.isPending}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : "Lưu giới hạn"}</button></div></div></form></div>;
}

function formatDate(value) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)); }
