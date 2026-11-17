import {
  MagnifyingGlass,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import AdminDialog from "../components/AdminDialog";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../admin.css";

const ranges = [
  ["7d", "7 ngày gần đây"],
  ["30d", "30 ngày gần đây"],
  ["all", "Tất cả thời gian"],
];

function parseAuditTime(value) {
  if (!value) return 0;
  const normalized = typeof value === "string" ? value : value;
  return Date.parse(normalized) || 0;
}

function formatDateTime(value) {
  if (!value) return "Thời gian chưa xác định";
  const normalized = typeof value === "string" ? value : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? "Thời gian chưa xác định"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

function roleLabel(role) {
  switch (String(role || "").toLowerCase().replace(/[\s_-]/g, "")) {
    case "admin":
      return "Quản trị viên";
    case "editor":
    case "contentmanager":
      return "Biên tập viên";
    case "parent":
      return "Phụ huynh";
    case "child":
      return "Trẻ em";
    default:
      return "";
  }
}

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [scopeDraft, setScopeDraft] = useState("all");
  const [valueDraft, setValueDraft] = useState("");
  const scope = searchParams.get("scope") || "all";
  const scopeValue = searchParams.get("value") || "";
  const rawPage = Number(searchParams.get("page"));
  const rawPageSize = Number(searchParams.get("pageSize"));
  const requestedRange = searchParams.get("range");
  const filters = {
    role: searchParams.get("role") || "all",
    action: searchParams.get("action") || "all",
    range: ranges.some(([value]) => value === requestedRange)
      ? requestedRange
      : "30d",
    search: searchParams.get("search") || "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: [10, 25, 50].includes(rawPageSize) ? rawPageSize : 10,
  };

  const auditQuery = useQuery({
    queryKey: [...queryKeys.adminAudit(user.id), scope, scopeValue],
    queryFn: ({ signal }) => adminService.listAudit({ signal, scope, value: scopeValue }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-audit-detail", user.id, selected?.id],
    queryFn: ({ signal }) =>
      adminService.getAudit({ auditId: selected.id, signal }),
    enabled: Boolean(selected?.id),
    retry: false,
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    const isDefault =
      ((key === "role" || key === "action") && value === "all") ||
      (key === "range" && value === "30d") ||
      (key === "pageSize" && value === "10") ||
      (key === "page" && value === "1");
    if (value && !isDefault) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: key === "search" });
  }

  if (auditQuery.isLoading)
    return <LoadingState label="Đang tải nhật ký thao tác" />;
  if (auditQuery.isError && !auditQuery.data)
    return (
      <ErrorState
        title="Không thể tải nhật ký thao tác"
        message={auditQuery.error.message}
        onRetry={() => auditQuery.refetch()}
      />
    );

  const rows = Array.isArray(auditQuery.data) ? auditQuery.data : [];
  const actions = [...new Set(rows.map((item) => item.action).filter(Boolean))];
  const cutoff =
    filters.range === "all"
      ? 0
      : Date.now() - (filters.range === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;

  const filtered = rows.filter((item) => {
    const createdAt = parseAuditTime(item.createdAt);
    const searchTarget = `${item.actorName || ""} ${item.actorEmail || ""} ${item.createBy || ""} ${item.action || ""} ${item.entityName || ""} ${item.primaryKey || ""}`.toLowerCase();
    const q = filters.search.trim().toLowerCase();

    const matchesRole = filters.role === "all" || item.actorRole === filters.role;

    const matchesAction = filters.action === "all" || item.action === filters.action;
    const matchesRange = filters.range === "all" || (Number.isFinite(createdAt) && createdAt >= cutoff);
    const matchesSearch = !q || searchTarget.includes(q);

    return matchesRole && matchesAction && matchesRange && matchesSearch;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const items = [...filtered]
    .sort(
      (a, b) => parseAuditTime(b.createdAt) - parseAuditTime(a.createdAt),
    )
    .slice(
      (currentPage - 1) * filters.pageSize,
      currentPage * filters.pageSize,
    );

  const detail = detailQuery.data
    ? { ...selected, ...detailQuery.data }
    : selected;

  return (
    <div className="workspace-dashboard audit-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / AUDIT VIEWER</p>
          <h1>Nhật ký thao tác</h1>
          <p>Theo dõi lịch sử thay đổi hệ thống và hoạt động của người dùng.</p>
        </div>
        <ShieldCheck
          size={43}
          className="admin-heading-icon"
          aria-hidden="true"
        />
      </div>

      <form className="audit-filter-panel" onSubmit={(event) => {
        event.preventDefault();
        const next = new URLSearchParams(searchParams);
        next.set("scope", scopeDraft); next.set("value", valueDraft.trim()); next.delete("page");
        setSearchParams(next);
      }}>
        <label>Phạm vi tra cứu<select value={scopeDraft} onChange={(event) => setScopeDraft(event.target.value)}><option value="all">Tất cả</option><option value="user">Actor ID</option><option value="entity">Tên entity</option><option value="target">Target ID</option></select></label>
        <label>Giá trị tra cứu<input value={valueDraft} onChange={(event) => setValueDraft(event.target.value)} required={scopeDraft !== "all"} /></label>
        <button className="workspace-button" type="submit">Tra cứu</button>
      </form>
      <div className="audit-filter-panel">
        <label>
          <span>Vai trò người thực hiện</span>
          <select
            aria-label="Lọc vai trò"
            value={filters.role}
            onChange={(event) => updateFilter("role", event.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="parent">Phụ huynh (Parent)</option>
            <option value="editor">Biên tập viên (Editor)</option>
          </select>
        </label>
        <label>
          <span>Hành động</span>
          <select
            aria-label="Lọc action"
            value={filters.action}
            onChange={(event) => updateFilter("action", event.target.value)}
          >
            <option value="all">Tất cả hành động</option>
            {actions.map((action) => (
              <option value={action} key={action}>
                {action}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Khoảng thời gian</span>
          <select
            aria-label="Khoảng thời gian audit"
            value={filters.range}
            onChange={(event) => updateFilter("range", event.target.value)}
          >
            {ranges.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="audit-search">
          <span>Tìm kiếm</span>
          <div>
            <MagnifyingGlass size={15} aria-hidden="true" />
            <input
              aria-label="Tìm audit"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Tìm theo tên, email hoặc đối tượng..."
            />
          </div>
        </label>
        <label>
          <span>Số dòng</span>
          <select
            aria-label="Số dòng audit"
            value={String(filters.pageSize)}
            onChange={(event) => updateFilter("pageSize", event.target.value)}
          >
            <option value="10">10 / trang</option>
            <option value="25">25 / trang</option>
            <option value="50">50 / trang</option>
          </select>
        </label>
      </div>

      <section className="analytics-card audit-table-card">
        <div className="analytics-card-heading">
          <div>
            <h2>Thao tác đã ghi nhận</h2>
            <p aria-live="polite">{total} thao tác phù hợp bộ lọc.</p>
            <button
              className="workspace-button workspace-button-quiet"
              onClick={() => setSearchParams({ range: "all" })}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
        {items.length ? (
          <>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <caption className="sr-only">Danh sách nhật ký thao tác</caption>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Tên người thực hiện</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Hành động</th>
                    <th>Đối tượng</th><th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}

                      style={{ cursor: "pointer" }}
                      title="Nhấn để xem chi tiết thao tác"
                    >
                      <td>
                        <span className="admin-date-cell">{formatDateTime(item.createdAt)}</span>
                      </td>
                      <td>
                        <strong className="admin-catalog-primary">{item.actorName}</strong>
                      </td>
                      <td>
                        <span className="admin-user-email">{item.actorEmail}</span>
                      </td>
                      <td>
                        {item.actorRole && roleLabel(item.actorRole) && (
                          <span className={`admin-badge-rule role-${String(item.actorRole).toLowerCase()}`}>
                            {roleLabel(item.actorRole)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge-action action-${(item.action || "").toLowerCase()}`}>
                          {item.action || "Chưa xác định"}
                        </span>
                      </td>
                      <td>
                        <strong title={item.primaryKey ? `ID: ${item.primaryKey}` : undefined}>
                          {item.entityName || "Dữ liệu hệ thống"}
                        </strong>
                      </td>
                    <td><button type="button" className="workspace-button workspace-button-quiet" onClick={() => setSelected(item)}>Xem</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-table-footer">
              <p className="admin-table-footnote">
                {total
                  ? `${(currentPage - 1) * filters.pageSize + 1}–${Math.min(currentPage * filters.pageSize, total)} / ${total} thao tác`
                  : "0 thao tác"}
              </p>
              <nav className="admin-pagination" aria-label="Phân trang audit">
                <button
                  type="button"
                  className="workspace-button workspace-button-quiet"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilter("page", String(currentPage - 1))}
                >
                  Trước
                </button>
                <span>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="workspace-button workspace-button-quiet"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilter("page", String(currentPage + 1))}
                >
                  Sau
                </button>
              </nav>
            </div>
          </>
        ) : (
          <div className="workspace-state workspace-state-empty">
            <ShieldCheck size={29} aria-hidden="true" />
            <strong>Không có thao tác phù hợp</strong>
            <p>Thử đổi vai trò, hành động hoặc nội dung tìm kiếm.</p>
          </div>
        )}
      </section>

      {selected && (
        <AdminDialog
          className="audit-detail-dialog"
          labelledBy="audit-detail-title"
          onClose={() => setSelected(null)}
        >
          <div className="admin-dialog-heading">
            <div>
              <p className="workspace-eyebrow">AUDIT EVENT</p>
              <h2 id="audit-detail-title">Chi tiết thao tác</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Đóng chi tiết audit"
              onClick={() => setSelected(null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {detailQuery.isFetching && <p role="status">Đang tải chi tiết…</p>}
          {detailQuery.isError && (
            <p role="alert">{detailQuery.error.message}</p>
          )}
          <dl className="audit-detail-meta">
            <div>
              <dt>Thời gian</dt>
              <dd>{formatDateTime(detail?.createdAt)}</dd>
            </div>
            <div>
              <dt>Người thực hiện</dt>
              <dd>
                <strong>{detail?.actorName}</strong>
                {detail?.actorEmail && (
                  <span style={{ marginLeft: 8, color: "var(--color-text-muted)" }}>
                    ({detail.actorEmail})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Vai trò</dt>
              <dd>
                {detail?.actorRole && roleLabel(detail.actorRole) && (
                  <span className={`admin-badge-rule role-${String(detail.actorRole).toLowerCase()}`}>
                    {roleLabel(detail.actorRole)}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Hành động</dt>
              <dd>
                <code>{detail?.action || "Chưa xác định"}</code>
              </dd>
            </div>
            <div>
              <dt>Đối tượng thao tác</dt>
              <dd>
                <strong>{detail?.entityName || "Dữ liệu hệ thống"}</strong>
                {detail?.primaryKey && (
                  <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 4 }}>
                    ID: {detail.primaryKey}
                  </small>
                )}
              </dd>
            </div>
          </dl>
          <pre>
            {JSON.stringify(
              {
                oldValues: parseValue(detail?.oldValues),
                newValues: parseValue(detail?.newValues),
                changedColumns: parseValue(detail?.changedColumns),
              },
              null,
              2,
            )}
          </pre>
          <div className="admin-dialog-actions">
            <button
              className="workspace-button workspace-button-quiet"
              type="button"
              onClick={() => setSelected(null)}
            >
              Đóng
            </button>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}

function parseValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
