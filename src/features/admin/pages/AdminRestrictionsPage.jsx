import { Funnel, LockKey, MagnifyingGlass, PencilSimple, Plus, Prohibit, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { ErrorState, LoadingState, EmptyState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import "../admin.css";

const keywordEnums = {
  matchType: [[0, "Khớp chính xác"], [1, "Có chứa"], [2, "Biểu thức chính quy"]],
  severityLevel: [[0, "Thấp"], [1, "Trung bình"], [2, "Cao"], [3, "Chặn ngay"]],
  action: [[0, "Từ chối"], [1, "Chuyển kiểm duyệt"], [2, "Che nội dung"]],
};
const blankKeyword = { keyword: "", description: "", matchType: "", severityLevel: "", action: "", status: "2" };

function mapKeyword(item) {
  const status = Number(item.status);
  return {
    ...item,
    type: "Từ khóa",
    scope: "Toàn nội dung",
    value: item.keyword || "",
    reason: item.description || "",
    updatedAt: item.updatedAt || item.createdAt,
    status: status === 2 ? "active" : status === 3 ? "disabled" : "other",
    backendStatus: status,
  };
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

  const keywordQuery = useQuery({
    queryKey: ["admin-restricted-keywords", user.id],
    queryFn: ({ signal }) => adminService.listRestrictedKeywords({ signal }),
  });

  const items = useMemo(() => (keywordQuery.data || []).map(mapKeyword), [keywordQuery.data]);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  const filtered = useMemo(() => items.filter((item) =>
    (!search || `${item.value} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))
    && (status === "all" || item.status === status)
  ), [items, search, status]);

  const toggleMutation = useMutation({
    mutationFn: ({ item, nextStatus }) =>
      adminService.updateRestrictedKeyword({
        keywordId: item.id,
        payload: {
          keyword: item.keyword,
          description: item.description,
          matchType: item.matchType,
          severityLevel: item.severityLevel,
          action: item.action,
          status: nextStatus === "active" ? 2 : 3,
        },
      }),
    onMutate: ({ item }) => setPendingIds((current) => new Set(current).add(item.id)),
    onSettled: (_data, _error, variables) => setPendingIds((current) => {
      const next = new Set(current);
      next.delete(variables.item.id);
      return next;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restricted-keywords", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        keyword: formValues.keyword.trim(),
        description: formValues.description.trim(),
        matchType: Number(formValues.matchType),
        severityLevel: Number(formValues.severityLevel),
        action: Number(formValues.action),
        status: Number(formValues.status),
      };
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

  const deleteMutation = useMutation({
    mutationFn: () => adminService.deleteRestrictedKeyword({ keywordId: deleteTarget.id }),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-restricted-keywords", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: key === "search" });
  }

  function openEditor(item) {
    setFormError("");
    setFormValues(item ? {
      keyword: item.keyword || "",
      description: item.description || "",
      matchType: String(item.matchType ?? ""),
      severityLevel: String(item.severityLevel ?? ""),
      action: String(item.action ?? ""),
      status: String(item.backendStatus ?? 2),
    } : blankKeyword);
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

  if (keywordQuery.isLoading) return <LoadingState label="Đang tải từ khóa hạn chế" />;
  if (keywordQuery.isError) return <ErrorState title="Không thể tải từ khóa hạn chế" message={keywordQuery.error.message} onRetry={() => keywordQuery.refetch()} />;

  return (
    <div className="workspace-dashboard admin-restrictions-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / TỪ KHÓA HẠN CHẾ</p>
          <h1>Từ khóa hạn chế</h1>
          <p>Quản lý các quy tắc phát hiện và xử lý nội dung nhạy cảm được kết nối trực tiếp với API backend.</p>
        </div>
        <Prohibit size={43} className="admin-heading-icon" aria-hidden="true" />
      </div>

      <section className="admin-filter-panel">
        <div className="admin-filter-title">
          <Funnel size={17} aria-hidden="true" />
          <strong>Bộ lọc từ khóa</strong>
          <span className="admin-filter-result-count">{filtered.length} kết quả</span>
          <button className="workspace-button" type="button" onClick={() => openEditor(null)}>
            <Plus size={16} aria-hidden="true" /> Thêm từ khóa
          </button>
        </div>
        <div className="admin-filter-fields">
          <label className="admin-search">
            <span className="sr-only">Tìm từ khóa hoặc lý do</span>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input aria-label="Tìm rule" value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tìm từ khóa hoặc lý do" />
          </label>
          <label>
            <span className="sr-only">Lọc trạng thái rule</span>
            <select aria-label="Lọc trạng thái rule" value={status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang áp dụng</option>
              <option value="disabled">Ngưng áp dụng</option>
            </select>
          </label>
          {(search || status !== "all") && (
            <button className="workspace-button workspace-button-quiet admin-clear-filter" type="button" onClick={() => setSearchParams({})}>
              <X size={16} aria-hidden="true" /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {filtered.length ? (
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <caption className="sr-only">Danh sách từ khóa hạn chế</caption>
            <thead>
              <tr>
                <th>Từ khóa</th>
                <th>Mô tả / Mục đích</th>
                <th>Trạng thái</th>
                <th className="admin-action-header">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="admin-keyword-cell">
                      <strong className="admin-catalog-primary">{item.value}</strong>
                      <small>{item.scope}</small>
                    </div>
                  </td>
                  <td>
                    <span className="admin-table-desc" title={item.reason}>
                      {item.reason || "Chưa có mô tả chi tiết."}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      value={item.status}
                      label={item.status === "active" ? "Đang áp dụng" : "Ngưng áp dụng"}
                      tone={item.status === "active" ? "success" : "neutral"}
                    />
                  </td>
                  <td className="admin-catalog-td-actions">
                    <div className="admin-action-icons">
                      <button
                        className="admin-icon-btn"
                        type="button"
                        title="Sửa từ khóa"
                        aria-label={`Sửa từ khóa ${item.value}`}
                        onClick={() => openEditor(item)}
                      >
                        <PencilSimple size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-btn is-danger"
                        type="button"
                        title="Khóa / Xóa từ khóa"
                        aria-label={`Khóa từ khóa ${item.value}`}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <LockKey size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === "active"}
                        className={`admin-switch-btn ${item.status === "active" ? "is-active" : ""}`}
                        title={item.status === "active" ? "Nhấn để ngưng áp dụng" : "Nhấn để áp dụng"}
                        aria-label={item.status === "active" ? `Ngưng áp dụng ${item.value}` : `Áp dụng ${item.value}`}
                        disabled={pendingIds.has(item.id) || item.status === "other"}
                        onClick={() => toggleMutation.mutate({ item, nextStatus: item.status === "active" ? "disabled" : "active" })}
                      >
                        <span className="admin-switch-slider" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Prohibit}
          title={items.length ? "Không có từ khóa phù hợp" : "Chưa có từ khóa hạn chế"}
          message={items.length ? "Thử đổi từ khóa hoặc bộ lọc." : "Chưa có từ khóa nào được thiết lập trong hệ thống backend."}
        />
      )}

      {(toggleMutation.isError || saveMutation.isError || deleteMutation.isError) && (
        <p className="admin-mutation-error" role="alert">
          <WarningCircle size={16} aria-hidden="true" /> {(toggleMutation.error || saveMutation.error || deleteMutation.error).message}
        </p>
      )}
      {toggleMutation.isSuccess && <p className="workspace-inline-success" role="status">Đã cập nhật trạng thái từ khóa.</p>}

      {editor && (
        <div className="admin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saveMutation.isPending) setEditor(null); }}>
          <section className="admin-editor-panel" role="dialog" aria-modal="true" aria-labelledby="keyword-editor-title">
            <div className="admin-dialog-heading">
              <div>
                <p className="workspace-eyebrow">API BACKEND / TỪ KHÓA HẠN CHẾ</p>
                <h2 id="keyword-editor-title">{editor.id ? "Sửa từ khóa" : "Thêm từ khóa"}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Đóng biểu mẫu từ khóa" onClick={() => setEditor(null)} disabled={saveMutation.isPending}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={saveKeyword}>
              <div className="admin-editor-fields">
                <label className="admin-catalog-field">
                  <span>Từ khóa <b>*</b></span>
                  <input autoFocus value={formValues.keyword} onChange={(event) => setFormValues((current) => ({ ...current, keyword: event.target.value }))} />
                </label>
                <label className="admin-catalog-field">
                  <span>Mô tả</span>
                  <textarea value={formValues.description} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} />
                </label>
                {Object.entries(keywordEnums).map(([key, options]) => (
                  <label className="admin-catalog-field" key={key}>
                    <span>{{ matchType: "Cách khớp", severityLevel: "Mức độ", action: "Hành động" }[key]} <b>*</b></span>
                    <select value={formValues[key]} onChange={(event) => setFormValues((current) => ({ ...current, [key]: event.target.value }))}>
                      <option value="">Chọn giá trị</option>
                      {options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                ))}
                <label className="admin-catalog-field">
                  <span>Trạng thái <b>*</b></span>
                  <select value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value }))}>
                    <option value="2">Đang áp dụng</option>
                    <option value="3">Ngưng áp dụng</option>
                  </select>
                </label>
              </div>
              {formError && <p className="admin-field-error" role="alert">{formError}</p>}
              <div className="admin-dialog-actions">
                <button className="workspace-button workspace-button-quiet" type="button" onClick={() => setEditor(null)} disabled={saveMutation.isPending}>Hủy</button>
                <button className="workspace-button" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Đang lưu…" : "Lưu từ khóa"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-overlay" role="presentation">
          <section className="admin-editor-panel admin-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="keyword-delete-title">
            <h2 id="keyword-delete-title">Khóa / Xóa từ khóa hạn chế?</h2>
            <p>Xóa hoặc vô hiệu hóa “{deleteTarget.keyword}” khỏi hệ thống kiểm duyệt backend.</p>
            {deleteMutation.isError && <p role="alert">{deleteMutation.error.message}</p>}
            <div className="admin-dialog-actions">
              <button className="workspace-button workspace-button-quiet" type="button" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Hủy</button>
              <button className="workspace-button workspace-button-danger" type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                <LockKey size={16} aria-hidden="true" />
                {deleteMutation.isPending ? "Đang xử lý…" : "Xác nhận khóa"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function labelFor(options, value) { return options.find(([code]) => code === value)?.[1] || "Chưa xác định"; }
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

