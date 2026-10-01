import { Funnel, MagnifyingGlass, Prohibit, ToggleLeft, ToggleRight, WarningCircle, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, EmptyState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function AdminRestrictionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingId, setPendingId] = useState(null);
  const restrictionsQuery = useQuery({ queryKey: queryKeys.adminRestrictions(user.id), queryFn: ({ signal }) => adminService.listRestrictions({ signal }) });
  const mutation = useMutation({ mutationFn: ({ restrictionId, status, revision }) => adminService.updateRestriction({ restrictionId, status, revision }), onMutate: ({ restrictionId }) => setPendingId(restrictionId), onSettled: () => setPendingId(null), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminRestrictions(user.id) }) });
  const items = restrictionsQuery.data?.items || [];
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";
  const filtered = items.filter((item) => (!search || `${item.value} ${item.reason}`.toLowerCase().includes(search.toLowerCase())) && (type === "all" || item.type === type) && (status === "all" || item.status === status));
  function updateFilter(key, value) { const next = new URLSearchParams(searchParams); if (value && value !== "all") next.set(key, value); else next.delete(key); setSearchParams(next, { replace: key === "search" }); }
  if (restrictionsQuery.isLoading) return <LoadingState label="Đang tải nội dung hạn chế" />;
  if (restrictionsQuery.isError) return <ErrorState title="Không thể tải nội dung hạn chế" message={restrictionsQuery.error.message} onRetry={() => restrictionsQuery.refetch()} />;
  return <div className="workspace-dashboard admin-restrictions-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / RESTRICTIONS</p><h1>Từ khóa và chủ đề hạn chế</h1><p>Bật hoặc tắt các rule đang được dùng để hỗ trợ kiểm tra nội dung trước khi publish.</p></div><Prohibit size={43} className="admin-heading-icon" aria-hidden="true" /></div><section className="admin-filter-panel"><div className="admin-filter-title"><Funnel size={17} aria-hidden="true" /><strong>Bộ lọc rule</strong><span className="admin-filter-result-count">{filtered.length} kết quả</span></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm từ khóa hoặc lý do</span><MagnifyingGlass size={18} aria-hidden="true" /><input aria-label="Tìm rule" value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm từ khóa hoặc lý do" /></label><label><span className="sr-only">Lọc loại rule</span><select aria-label="Lọc loại rule" value={type} onChange={(event) => updateFilter("type", event.target.value)}><option value="all">Tất cả loại</option>{[...new Set(items.map((item) => item.type))].map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span className="sr-only">Lọc trạng thái rule</span><select aria-label="Lọc trạng thái rule" value={status} onChange={(event) => updateFilter("status", event.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang áp dụng</option><option value="disabled">Đã tắt</option></select></label>{(search || type !== "all" || status !== "all") && <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={() => setSearchParams({})}><X size={16} aria-hidden="true" /> Xóa lọc</button>}</div></section>{filtered.length ? <div className="restriction-list">{filtered.map((item) => <article className="restriction-card" key={item.id}><div className="restriction-card-main"><span className="admin-report-type">{item.type} · {item.scope}</span><h2>{item.value}</h2><p>{item.reason}</p><small>Cập nhật {formatDate(item.updatedAt)}</small></div><div className="restriction-card-action"><StatusBadge value={item.status} label={item.status === "active" ? "Đang áp dụng" : "Đã tắt"} tone={item.status === "active" ? "danger" : "neutral"} /><button className="icon-button" type="button" aria-label={item.status === "active" ? `Tắt hạn chế ${item.value}` : `Bật hạn chế ${item.value}`} onClick={() => mutation.mutate({ restrictionId: item.id, status: item.status === "active" ? "disabled" : "active", revision: item.revision })} disabled={pendingId === item.id}><span className="sr-only">{pendingId === item.id ? "Đang cập nhật" : ""}</span>{item.status === "active" ? <ToggleRight size={24} aria-hidden="true" /> : <ToggleLeft size={24} aria-hidden="true" />}</button></div></article>)}</div> : <EmptyState icon={Prohibit} title={items.length ? "Không có rule phù hợp" : "Chưa có rule hạn chế"} message={items.length ? "Thử đổi từ khóa hoặc bộ lọc." : "Rule sẽ xuất hiện khi Backend cung cấp catalog."} />}{mutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}</p>}{mutation.isSuccess && <p className="workspace-inline-success" role="status">Đã cập nhật trạng thái hạn chế.</p>}</div>;
}

function formatDate(value) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)); }
