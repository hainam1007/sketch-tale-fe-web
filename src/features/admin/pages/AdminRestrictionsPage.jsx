import { Funnel, MagnifyingGlass, PencilSimple, Plus, Prohibit, ToggleLeft, ToggleRight, Trash, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, EmptyState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const keywordEnums = {
  matchType: [[0, "Khớp chính xác"], [1, "Có chứa"], [2, "Biểu thức chính quy"]],
  severityLevel: [[0, "Thấp"], [1, "Trung bình"], [2, "Cao"], [3, "Chặn ngay"]],
  action: [[0, "Từ chối"], [1, "Chuyển kiểm duyệt"], [2, "Che nội dung"]],
};
const blankKeyword = { keyword: "", description: "", matchType: "", severityLevel: "", action: "", status: "2" };

function mapKeyword(item) {
  const status = Number(item.status);
  return { ...item, source: "backend", type: "Từ khóa", scope: "Toàn nội dung", value: item.keyword || "", reason: item.description || "", updatedAt: item.updatedAt || item.createdAt, status: status === 2 ? "active" : status === 3 ? "disabled" : "other", backendStatus: status };
}

export default function AdminRestrictionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [editor, setEditor] = useState(null);
  const [formValues, setFormValues] = useState(blankKeyword);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const demoQuery = useQuery({ queryKey: queryKeys.adminRestrictions(user.id), queryFn: ({ signal }) => adminService.listRestrictions({ signal }) });
  const keywordQuery = useQuery({ queryKey: ["admin-restricted-keywords", user.id], queryFn: ({ signal }) => adminService.listRestrictedKeywords({ signal }) });
  const keywordItems = (keywordQuery.data || []).map(mapKeyword);
  const demoItems = demoQuery.data?.items || [];
  const items = [...keywordItems, ...demoItems];
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";
  const filtered = useMemo(() => items.filter((item) =>
    (!search || `${item.value} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))
    && (type === "all" || item.type === type)
    && (status === "all" || item.status === status)), [items, search, type, status]);
  const toggleMutation = useMutation({
    mutationFn: ({ item, nextStatus }) => item.source === "backend"
      ? adminService.updateRestrictedKeyword({ keywordId: item.id, payload: { keyword: item.keyword, description: item.description, matchType: item.matchType, severityLevel: item.severityLevel, action: item.action, status: nextStatus === "active" ? 2 : 3 } })
      : adminService.updateRestriction({ restrictionId: item.id, status: nextStatus, revision: item.revision }),
    onMutate: ({ item }) => setPendingIds((current) => new Set(current).add(item.id)),
    onSettled: (_data, _error, variables) => setPendingIds((current) => { const next = new Set(current); next.delete(variables.item.id); return next; }),
    onSuccess: (_result, { item }) => {
      queryClient.invalidateQueries({ queryKey: item.source === "backend" ? ["admin-restricted-keywords", user.id] : queryKeys.adminRestrictions(user.id) });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { keyword: formValues.keyword.trim(), description: formValues.description.trim(), matchType: Number(formValues.matchType), severityLevel: Number(formValues.severityLevel), action: Number(formValues.action), status: Number(formValues.status) };
      return editor?.id
        ? adminService.updateRestrictedKeyword({ keywordId: editor.id, payload })
        : adminService.createRestrictedKeyword({ payload });
    },
    onSuccess: async () => {
      setEditor(null);
      setFormValues(blankKeyword);
      await queryClient.invalidateQueries({ queryKey: ["admin-restricted-keywords", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });
  const deleteMutation = useMutation({ mutationFn: () => adminService.deleteRestrictedKeyword({ keywordId: deleteTarget.id }), onSuccess: async () => { setDeleteTarget(null); await queryClient.invalidateQueries({ queryKey: ["admin-restricted-keywords", user.id] }); queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] }); } });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: key === "search" });
  }
  function openEditor(item) {
    setFormError("");
    setFormValues(item ? { keyword: item.keyword || "", description: item.description || "", matchType: String(item.matchType ?? ""), severityLevel: String(item.severityLevel ?? ""), action: String(item.action ?? ""), status: String(item.backendStatus ?? 2) } : blankKeyword);
    setEditor(item || { id: null });
  }
  function saveKeyword(event) {
    event.preventDefault();
    if (!formValues.keyword.trim() || ["matchType", "severityLevel", "action", "status"].some((key) => formValues[key] === "")) {
      setFormError("Nhập từ khóa và chọn đầy đủ các quy tắc kiểm duyệt.");
      return;
    }
    setFormError("");
    saveMutation.mutate();
  }

  if (demoQuery.isLoading || keywordQuery.isLoading) return <LoadingState label="Đang tải nội dung hạn chế" />;
  if (demoQuery.isError && keywordQuery.isError) return <ErrorState title="Không thể tải nội dung hạn chế" message={keywordQuery.error.message} onRetry={() => { demoQuery.refetch(); keywordQuery.refetch(); }} />;
  return <div className="workspace-dashboard admin-restrictions-page">
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / NỘI DUNG HẠN CHẾ</p><h1>Từ khóa và chủ đề hạn chế</h1><p>Từ khóa được lưu trên backend; các rule chủ đề chưa có API tiếp tục dùng dữ liệu mô phỏng.</p></div><Prohibit size={43} className="admin-heading-icon" aria-hidden="true" /></div>
    <p className="admin-demo-banner" role="status"><span aria-hidden="true" /> Rule chủ đề · Dữ liệu mô phỏng</p>
    {keywordQuery.isError && <p className="admin-mutation-error" role="alert">Không thể tải từ khóa backend: {keywordQuery.error.message}</p>}
    {demoQuery.isError && <p className="admin-mutation-error" role="alert">Không thể tải rule chủ đề mô phỏng: {demoQuery.error.message}</p>}
    <section className="admin-filter-panel"><div className="admin-filter-title"><Funnel size={17} aria-hidden="true" /><strong>Bộ lọc rule</strong><span className="admin-filter-result-count">{filtered.length} kết quả</span><button className="workspace-button" type="button" onClick={() => openEditor(null)}><Plus size={16} aria-hidden="true" /> Thêm từ khóa</button></div><div className="admin-filter-fields"><label className="admin-search"><span className="sr-only">Tìm từ khóa hoặc lý do</span><MagnifyingGlass size={18} aria-hidden="true" /><input aria-label="Tìm rule" value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm từ khóa hoặc lý do" /></label><label><span className="sr-only">Lọc loại rule</span><select aria-label="Lọc loại rule" value={type} onChange={(event) => updateFilter("type", event.target.value)}><option value="all">Tất cả loại</option><option value="Từ khóa">Từ khóa</option>{[...new Set(demoItems.map((item) => item.type).filter(Boolean))].map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span className="sr-only">Lọc trạng thái rule</span><select aria-label="Lọc trạng thái rule" value={status} onChange={(event) => updateFilter("status", event.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang áp dụng</option><option value="disabled">Đã tắt</option></select></label>{(search || type !== "all" || status !== "all") && <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={() => setSearchParams({})}><X size={16} aria-hidden="true" /> Xóa lọc</button>}</div></section>
    {filtered.length ? <div className="restriction-list">{filtered.map((item) => <article className="restriction-card" key={`${item.source || "demo"}:${item.id}`}><div className="restriction-card-main"><span className="admin-report-type">{item.type || "Từ khóa"} · {item.scope || "Toàn nội dung"}</span><h2>{item.value || "Chưa đặt tên"}</h2><p>{item.reason || "Chưa có mô tả"}</p><small>{item.source === "backend" ? "Backend" : "Dữ liệu mô phỏng"}{item.updatedAt ? ` · Cập nhật ${formatDate(item.updatedAt)}` : ""}</small>{item.source === "backend" && <small>{labelFor(keywordEnums.matchType, item.matchType)} · {labelFor(keywordEnums.severityLevel, item.severityLevel)} · {labelFor(keywordEnums.action, item.action)}</small>}</div><div className="restriction-card-action"><StatusBadge value={item.status} label={item.status === "active" ? "Đang áp dụng" : item.status === "disabled" ? "Đã tắt" : `Trạng thái ${item.backendStatus ?? "chưa rõ"}`} tone={item.status === "active" ? "danger" : "neutral"} />{item.source === "backend" ? <><button className="icon-button" type="button" aria-label={`Sửa từ khóa ${item.value}`} onClick={() => openEditor(item)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa từ khóa ${item.value}`} onClick={() => setDeleteTarget(item)}><Trash size={17} aria-hidden="true" /></button></> : null}<button className="icon-button" type="button" aria-label={item.status === "active" ? `Tắt hạn chế ${item.value}` : `Bật hạn chế ${item.value}`} onClick={() => toggleMutation.mutate({ item, nextStatus: item.status === "active" ? "disabled" : "active" })} disabled={pendingIds.has(item.id) || (item.source !== "backend" && !item.allowedActions?.includes("toggle")) || item.status === "other"}><span className="sr-only">{pendingIds.has(item.id) ? "Đang cập nhật" : ""}</span>{item.status === "active" ? <ToggleRight size={24} aria-hidden="true" /> : <ToggleLeft size={24} aria-hidden="true" />}</button></div></article>)}</div> : <EmptyState icon={Prohibit} title={items.length ? "Không có rule phù hợp" : "Chưa có rule hạn chế"} message={items.length ? "Thử đổi từ khóa hoặc bộ lọc." : "Chưa có rule nào trong danh sách cấu hình."} />}
    {(toggleMutation.isError || saveMutation.isError || deleteMutation.isError) && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {(toggleMutation.error || saveMutation.error || deleteMutation.error).message}</p>}
    {toggleMutation.isSuccess && <p className="workspace-inline-success" role="status">Đã cập nhật rule.</p>}
    {editor && <div className="admin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saveMutation.isPending) setEditor(null); }}><section className="admin-editor-panel" role="dialog" aria-modal="true" aria-labelledby="keyword-editor-title"><div className="admin-dialog-heading"><div><p className="workspace-eyebrow">BACKEND / TỪ KHÓA HẠN CHẾ</p><h2 id="keyword-editor-title">{editor.id ? "Sửa từ khóa" : "Thêm từ khóa"}</h2></div><button className="icon-button" type="button" aria-label="Đóng biểu mẫu từ khóa" onClick={() => setEditor(null)} disabled={saveMutation.isPending}><X size={18} aria-hidden="true" /></button></div><form onSubmit={saveKeyword}><div className="admin-editor-fields"><label className="admin-catalog-field"><span>Từ khóa <b>*</b></span><input autoFocus value={formValues.keyword} onChange={(event) => setFormValues((current) => ({ ...current, keyword: event.target.value }))} /></label><label className="admin-catalog-field"><span>Mô tả</span><textarea value={formValues.description} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} /></label>{Object.entries(keywordEnums).map(([key, options]) => <label className="admin-catalog-field" key={key}><span>{{ matchType: "Cách khớp", severityLevel: "Mức độ", action: "Hành động" }[key]} <b>*</b></span><select value={formValues[key]} onChange={(event) => setFormValues((current) => ({ ...current, [key]: event.target.value }))}><option value="">Chọn giá trị</option>{options.map(([value, label]) => <option value={value} key={value}>{label} · {value}</option>)}</select></label>)}<label className="admin-catalog-field"><span>Trạng thái <b>*</b></span><select value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value }))}><option value="2">Đang áp dụng · 2</option><option value="3">Đã tắt · 3</option></select></label></div>{formError && <p className="admin-field-error" role="alert">{formError}</p>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setEditor(null)} disabled={saveMutation.isPending}>Hủy</button><button className="workspace-button" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Đang lưu…" : "Lưu từ khóa"}</button></div></form></section></div>}
    {deleteTarget && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="keyword-delete-title"><h2 id="keyword-delete-title">Xóa từ khóa hạn chế?</h2><p>Xóa “{deleteTarget.keyword}” khỏi danh sách backend.</p>{deleteMutation.isError && <p role="alert">{deleteMutation.error.message}</p>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Giữ lại</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Đang xóa…" : "Xóa từ khóa"}</button></div></section></div>}
  </div>;
}

function labelFor(options, value) { return options.find(([code]) => code === value)?.[1] || `Mã ${value ?? "không rõ"}`; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "ngày chưa rõ" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date); }
