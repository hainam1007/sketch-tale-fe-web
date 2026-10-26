import { useState } from "react";
import {
  LockKey,
  PencilSimple,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminModerationCatalogService } from "../services/adminModerationCatalogService";
import "../admin.css";

const enumFields = ["status", "matchType", "severityLevel", "action"];
const numericValues = {
  status: [0, 1, 2, 3, 4],
  matchType: [0, 1, 2],
  severityLevel: [0, 1, 2, 3],
  action: [0, 1, 2],
};
const titles = { charTypes: "Loại nhân vật", prohibitedThemes: "Chủ đề cấm" };
const fields = {
  charTypes: ["name", "description", "status"],
  prohibitedThemes: [
    "name",
    "description",
    "matchType",
    "severityLevel",
    "action",
    "status",
  ],
};
const labels = {
  name: "Tên",
  description: "Mô tả",
  status: "Trạng thái",
  matchType: "Cách khớp",
  severityLevel: "Mức độ",
  action: "Hành động xử lý",
};
const enumLabels = {
  status: {
    0: "Bản nháp",
    1: "Chờ duyệt",
    2: "Đang áp dụng",
    3: "Ngưng áp dụng",
    4: "Lưu trữ",
  },
  matchType: {
    0: "Khớp chính xác",
    1: "Có chứa từ khóa",
    2: "Biểu thức chính quy",
  },
  severityLevel: {
    0: "Thấp",
    1: "Trung bình",
    2: "Cao",
    3: "Chặn ngay",
  },
  action: {
    0: "Từ chối nội dung",
    1: "Chuyển kiểm duyệt",
    2: "Che nội dung",
  },
};

function emptyValues(kind) {
  return Object.fromEntries(fields[kind].map((field) => [field, ""]));
}

function valuesFrom(kind, item) {
  const values = emptyValues(kind);
  for (const field of fields[kind])
    values[field] = item?.[field] == null ? "" : String(item[field]);
  return values;
}

export default function AdminModerationCatalogPage({ kind }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ["admin-moderation-catalog", user.id, kind];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      adminModerationCatalogService.list({ kind, signal }),
  });
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [draftOverride, setDraftOverride] = useState(() => emptyValues(kind));
  const [hasDraftEdits, setHasDraftEdits] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [formError, setFormError] = useState("");
  const detail = useQuery({
    queryKey: ["admin-moderation-catalog-item", user.id, kind, editor?.id],
    queryFn: ({ signal }) =>
      adminModerationCatalogService.get({ kind, id: editor.id, signal }),
    enabled: Boolean(editor?.id),
  });

  const draft =
    editor?.id && detail.data && !hasDraftEdits
      ? valuesFrom(kind, detail.data)
      : draftOverride;
  function setDraft(update) {
    setHasDraftEdits(true);
    setDraftOverride(typeof update === "function" ? update(draft) : update);
  }

  const toggleMutation = useMutation({
    mutationFn: ({ item, nextStatus }) =>
      adminModerationCatalogService.update({
        kind,
        id: item.id,
        payload: {
          ...item,
          status: nextStatus === "active" ? 2 : 3,
        },
      }),
    onMutate: ({ item }) =>
      setPendingIds((current) => new Set(current).add(item.id)),
    onSettled: (_data, _error, variables) =>
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(variables.item.id);
        return next;
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey });
    },
  });

  const save = useMutation({
    mutationFn: () =>
      editor?.id
        ? adminModerationCatalogService.update({
            kind,
            id: editor.id,
            payload: toPayload(draft),
          })
        : adminModerationCatalogService.create({
            kind,
            payload: toPayload(draft),
          }),
    onSuccess: async () => {
      setEditor(null);
      await client.invalidateQueries({ queryKey });
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      adminModerationCatalogService.remove({ kind, id: deleteTarget.id }),
    onSuccess: async () => {
      setDeleteTarget(null);
      await client.invalidateQueries({ queryKey });
    },
  });

  function openEditor(item) {
    setFormError("");
    setDraftOverride(valuesFrom(kind, item));
    setHasDraftEdits(false);
    setEditor(item || { id: null });
    save.reset();
  }

  function submit(event) {
    event.preventDefault();
    if (!draft.name?.trim()) {
      setFormError("Nhập tên trước khi lưu.");
      return;
    }
    if (
      fields[kind].some(
        (field) => enumFields.includes(field) && draft[field] === "",
      )
    ) {
      setFormError("Chọn giá trị enum cho tất cả các trường bắt buộc.");
      return;
    }
    if (
      fields[kind].some(
        (field) =>
          enumFields.includes(field) &&
          draft[field] !== "" &&
          !numericValues[field].includes(Number(draft[field])),
      )
    ) {
      setFormError("Một mã enum không hợp lệ.");
      return;
    }
    setFormError("");
    save.mutate();
  }

  if (query.isLoading)
    return (
      <LoadingState
        label={`Đang tải ${titles[kind].toLocaleLowerCase("vi")}`}
      />
    );
  if (query.isError && !query.data)
    return (
      <ErrorState
        title={`Không thể tải ${titles[kind].toLocaleLowerCase("vi")}`}
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  const items = (query.data || []).filter((item) =>
    `${item.name || ""} ${item.description || ""}`
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi")),
  );

  return (
    <div className="workspace-dashboard admin-restrictions-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / DANH MỤC KIỂM DUYỆT</p>
          <h1>{titles[kind]}</h1>
          <p>
            {kind === "prohibitedThemes"
              ? "Quản lý danh mục các chủ đề bị cấm và chính sách kiểm duyệt nội dung."
              : "Quản lý danh mục loại nhân vật phục vụ tạo truyện và hình ảnh."}
          </p>
        </div>
      </div>
      <section className="admin-filter-panel">
        <div className="admin-filter-title">
          <label className="admin-search">
            <span className="sr-only">Tìm danh mục</span>
            <input
              placeholder="Tìm theo tên hoặc mô tả"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <strong>{items.length} mục</strong>
          <button
            className="workspace-button"
            type="button"
            onClick={() => openEditor(null)}
          >
            <Plus size={16} aria-hidden="true" /> Thêm mục
          </button>
        </div>
      </section>
      {items.length ? (
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <caption className="sr-only">Danh sách {titles[kind]}</caption>
            <thead>
              <tr>
                <th>{kind === "prohibitedThemes" ? "Chủ đề" : "Tên mục"}</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th className="admin-action-header">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="admin-catalog-primary">{item.name || "Chưa đặt tên"}</strong>
                  </td>
                  <td>
                    <span className="admin-table-desc" title={item.description}>
                      {item.description || "Chưa có mô tả chi tiết."}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      value={String(item.status ?? "unknown")}
                      label={
                        item.status === 2
                          ? "Đang áp dụng"
                          : item.status === 3
                            ? "Ngưng áp dụng"
                            : (enumLabels.status[item.status] || "Đang áp dụng")
                      }
                      tone={item.status === 2 ? "success" : "neutral"}
                    />
                  </td>
                  <td className="admin-catalog-td-actions">
                    <div className="admin-action-icons">
                      <button
                        className="admin-icon-btn"
                        type="button"
                        title={`Sửa ${item.name || "mục"}`}
                        aria-label={`Sửa ${item.name || "mục"}`}
                        onClick={() => openEditor(item)}
                      >
                        <PencilSimple size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-btn is-danger"
                        type="button"
                        title={`Khóa / Xóa ${item.name || "mục"}`}
                        aria-label={`Khóa ${item.name || "mục"}`}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <LockKey size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === 2}
                        className={`admin-switch-btn ${item.status === 2 ? "is-active" : ""}`}
                        title={item.status === 2 ? "Nhấn để ngưng áp dụng" : "Nhấn để áp dụng"}
                        aria-label={item.status === 2 ? `Ngưng áp dụng ${item.name}` : `Áp dụng ${item.name}`}
                        disabled={pendingIds.has(item.id)}
                        onClick={() =>
                          toggleMutation.mutate({
                            item,
                            nextStatus: item.status === 2 ? "disabled" : "active",
                          })
                        }
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
          title={
            search
              ? "Không có kết quả phù hợp"
              : `Chưa có ${titles[kind].toLocaleLowerCase("vi")}`
          }
          message={
            search
              ? "Thử từ khóa khác hoặc xóa nội dung tìm kiếm."
              : "Danh sách hiện không có mục nào."
          }
        />
      )}
      {(toggleMutation.isError || save.isError || remove.isError) && (
        <p className="admin-mutation-error" role="alert">
          <WarningCircle size={16} aria-hidden="true" />{" "}
          {(toggleMutation.error || save.error || remove.error).message}
        </p>
      )}
      {toggleMutation.isSuccess && (
        <p className="workspace-inline-success" role="status">
          Đã cập nhật trạng thái mục.
        </p>
      )}
      {editor && (
        <ModerationCatalogEditor
          kind={kind}
          editor={editor}
          detail={detail}
          draft={draft}
          setDraft={setDraft}
          save={save}
          formError={formError}
          onClose={() => setEditor(null)}
          onSubmit={submit}
        />
      )}
      {deleteTarget && (
        <div className="admin-overlay" role="presentation">
          <section
            className="admin-editor-panel admin-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="moderation-delete-title"
          >
            <h2 id="moderation-delete-title">Khóa / Xóa {titles[kind]?.toLowerCase() || "mục"}?</h2>
            <p>Xóa hoặc vô hiệu hóa “{deleteTarget.name || "mục chưa đặt tên"}” khỏi hệ thống.</p>
            {remove.isError && (
              <p className="admin-mutation-error" role="alert">
                {remove.error.message}
              </p>
            )}
            <div className="admin-dialog-actions">
              <button
                className="workspace-button workspace-button-quiet"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={remove.isPending}
              >
                Hủy
              </button>
              <button
                className="workspace-button workspace-button-danger"
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                <LockKey size={16} aria-hidden="true" />
                {remove.isPending ? "Đang xử lý…" : "Xác nhận khóa"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ModerationCatalogEditor({
  kind,
  editor,
  detail,
  draft,
  setDraft,
  save,
  formError,
  onClose,
  onSubmit,
}) {
  const detailUnavailable = Boolean(
    editor.id && (!detail.isSuccess || detail.isFetching),
  );
  return (
    <div className="admin-overlay" role="presentation">
      <section
        className="admin-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="moderation-editor-title"
      >
        <div className="admin-dialog-heading">
          <div>
            <p className="workspace-eyebrow">
              QUẢN TRỊ / {titles[kind].toLocaleUpperCase("vi")}
            </p>
            <h2 id="moderation-editor-title">
              {editor.id ? "S\u1eeda m\u1ee5c" : "Th\u00eam m\u1ee5c"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Đóng biểu mẫu"
            onClick={onClose}
            disabled={save.isPending}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {editor.id && detail.isFetching && (
          <p role="status">Đang tải bản ghi mới nhất…</p>
        )}
        {editor.id && detail.isError && (
          <p className="admin-mutation-error" role="alert">
            Không tải được bản ghi mới nhất: {detail.error.message}{" "}
            <button
              type="button"
              className="workspace-button workspace-button-quiet"
              onClick={() => detail.refetch()}
            >
              Thử lại
            </button>
          </p>
        )}
        <form onSubmit={onSubmit}>
          <fieldset
            className="admin-editor-fields"
            disabled={save.isPending || detailUnavailable}
          >
            <legend className="sr-only">{titles[kind]}</legend>
            {fields[kind].map((field) => (
              <label className="admin-catalog-field" key={field}>
                <span>
                  {labels[field]}
                  {(field === "name" || enumFields.includes(field)) && " *"}
                </span>
                {field === "description" ? (
                  <textarea
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                ) : enumFields.includes(field) ? (
                  <select
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Chọn {labels[field].toLowerCase()}</option>
                    {numericValues[field].map((code) => (
                      <option value={code} key={code}>
                        {enumLabels[field]?.[code] || code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required={field === "name"}
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </fieldset>
          {formError && (
            <p className="admin-field-error" role="alert">
              {formError}
            </p>
          )}
          <div className="admin-dialog-actions">
            <button
              className="workspace-button workspace-button-quiet"
              type="button"
              onClick={onClose}
              disabled={save.isPending}
            >
              Hủy
            </button>
            <button
              className="workspace-button"
              type="submit"
              disabled={save.isPending || detailUnavailable}
            >
              {save.isPending ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function toPayload(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      enumFields.includes(key) && value !== "" ? Number(value) : value,
    ]),
  );
}
