import { useMemo, useState } from "react";
import { Check, Eye, MagnifyingGlass, WarningCircle, X } from "@phosphor-icons/react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  SuccessState,
} from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import "../admin.css";

const reportStatusLabels = {
  0: "Chờ xử lý",
  1: "Đang xem xét",
  2: "Đã giải quyết",
  3: "Bác bỏ / Không vi phạm",
};

const reportStatusTones = {
  0: "warning",
  1: "neutral",
  2: "success",
  3: "danger",
};

const targetTypeLabels = {
  0: "Nhân vật",
  1: "Truyện",
  2: "Nội dung / Lời thoại",
};

function formatTargetType(value) {
  return targetTypeLabels[value] || `Đối tượng #${value}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

export default function AdminContentReportsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["backend-content-reports", user.id],
    queryFn: ({ signal }) => adminService.listContentReports({ signal }),
  });
  const search = searchParams.get("search") || "";
  const requestedStatus = searchParams.get("status");
  const status = ["0", "1", "2", "3"].includes(requestedStatus) ? requestedStatus : "all";
  const rows = useMemo(
    () =>
      (query.data || []).filter(
        (item) =>
          `${item.id || ""} ${item.targetId || ""} ${item.reason || ""} ${item.createBy || ""} ${item.reporterName || ""} ${item.reporterEmail || ""}`
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")) &&
          (status === "all" || String(item.status) === status),
      ),
    [query.data, search, status],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / 10));
  const rawPage = Number(searchParams.get("page"));
  const currentPage = Math.min(
    totalPages,
    Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  );

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: key === "search" });
  }

  if (query.isLoading)
    return <LoadingState label="Đang tải báo cáo nội dung backend" />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        title="Không thể tải báo cáo nội dung"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );

  return (
    <div className="workspace-dashboard admin-reports-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / KIỂM DUYỆT</p>
          <h1>Báo cáo vi phạm nội dung</h1>
          <p>Xem xét khiếu nại từ người dùng và đưa ra quyết định xử lý vi phạm.</p>
        </div>
        <WarningCircle
          size={42}
          className="admin-heading-icon"
          aria-hidden="true"
        />
      </div>

      <section className="admin-filter-panel">
        <div className="admin-filter-fields">
          <label className="admin-search">
            <span className="sr-only">Tìm báo cáo</span>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              aria-label="Tìm báo cáo nội dung"
              value={search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Tìm kiếm theo tên, email, lý do hoặc loại nội dung"
            />
          </label>
          <label>
            <span className="sr-only">Trạng thái báo cáo</span>
            <select
              aria-label="Trạng thái báo cáo"
              value={status}
              onChange={(event) => setFilter("status", event.target.value)}
            >
              <option value="all">Mọi trạng thái</option>
              {[0, 1, 2, 3].map((val) => (
                <option key={val} value={val}>
                  {reportStatusLabels[val]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="workspace-button workspace-button-quiet"
            onClick={() => setSearchParams({})}
          >
            Xóa bộ lọc
          </button>
          <span className="admin-filter-result-count">
            {rows.length} kết quả
          </span>
        </div>
      </section>

      {query.isError && (
        <p className="admin-refresh-note" role="status">
          Không thể làm mới; đang hiển thị dữ liệu đã tải trước đó.
        </p>
      )}

      {rows.length ? (
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <caption className="sr-only">Danh sách báo cáo vi phạm nội dung</caption>
            <thead>
              <tr>
                <th>Người gửi</th>
                <th>Email</th>
                <th>Loại nội dung</th>
                <th>Nội dung khiếu nại</th>
                <th>Thời gian gửi</th>
                <th>Thời gian cập nhật</th>
                <th>Trạng thái</th>
                <th className="admin-action-header">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((currentPage - 1) * 10, currentPage * 10).map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="admin-user-cell">
                      <span className="admin-user-initial">
                        {item.reporterName?.slice(0, 1)?.toUpperCase() || "U"}
                      </span>
                      <span>
                        <strong>{item.reporterName || "Người dùng"}</strong>
                        <small>ID: {item.createBy?.slice(0, 8) || "—"}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-user-email">{item.reporterEmail || "—"}</span>
                  </td>
                  <td>
                    <span className="admin-report-type-badge">
                      {formatTargetType(item.targetType)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-report-reason-col">
                      <strong title={item.reason}>
                        {item.reason || `Báo cáo vi phạm ${formatTargetType(item.targetType).toLowerCase()}`}
                      </strong>
                      {item.targetId && (
                        <small>Mã đối tượng: {item.targetId.slice(0, 8)}…</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span>{formatDate(item.createdAt)}</span>
                  </td>
                  <td>
                    <span>{formatDateTime(item.updatedAt)}</span>
                  </td>
                  <td>
                    <StatusBadge
                      value={String(item.status ?? "unknown")}
                      label={reportStatusLabels[item.status] || `Mã ${item.status}`}
                      tone={reportStatusTones[item.status] || "neutral"}
                    />
                  </td>
                  <td>
                    <div className="admin-action-icons">
                      <Link
                        className="admin-icon-btn"
                        to={`/admin/reports/${item.id}`}
                        title="Xem chi tiết & xử lý"
                        aria-label={`Xem chi tiết báo cáo ${item.id}`}
                      >
                        <Eye size={18} aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-table-footer">
            <p className="admin-table-footnote">
              {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, rows.length)} / {rows.length} báo cáo.
            </p>
            <nav
              className="admin-pagination admin-report-pagination"
              aria-label="Phân trang báo cáo"
            >
              <button
                type="button"
                className="workspace-button workspace-button-quiet"
                disabled={currentPage <= 1}
                onClick={() => setFilter("page", String(currentPage - 1))}
              >
                Trước
              </button>
              <span aria-live="polite">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="workspace-button workspace-button-quiet"
                disabled={currentPage >= totalPages}
                onClick={() => setFilter("page", String(currentPage + 1))}
              >
                Sau
              </button>
            </nav>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={WarningCircle}
          title={
            search ? "Không có báo cáo phù hợp" : "Chưa có báo cáo nội dung"
          }
          message={
            search
              ? "Thử tìm bằng tên, email, lý do hoặc loại nội dung."
              : "Danh sách hiện không có báo cáo nào."
          }
        />
      )}
    </div>
  );
}

export function AdminContentReportDetailPage() {
  const { user } = useAuth();
  const { reportId } = useParams();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState("");
  const [errorFeedback, setErrorFeedback] = useState("");

  const query = useQuery({
    queryKey: ["backend-content-report", user.id, reportId],
    queryFn: ({ signal }) =>
      adminService.getContentReport({ reportId, signal }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ nextStatus }) =>
      adminService.updateContentReportStatus({
        reportId,
        status: nextStatus,
        targetType: query.data?.targetType,
        targetId: query.data?.targetId,
        reason: query.data?.reason,
      }),
    onSuccess: (_, variables) => {
      setFeedback(`Đã chuyển trạng thái báo cáo sang: "${reportStatusLabels[variables.nextStatus]}".`);
      setErrorFeedback("");
      queryClient.invalidateQueries({ queryKey: ["backend-content-report", user.id, reportId] });
      queryClient.invalidateQueries({ queryKey: ["backend-content-reports", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
    onError: (err) => {
      setErrorFeedback(err.message || "Không thể cập nhật trạng thái báo cáo.");
      setFeedback("");
    },
  });

  if (query.isLoading)
    return <LoadingState label="Đang tải chi tiết báo cáo" />;
  if (query.isError)
    return (
      <ErrorState
        title="Không thể mở báo cáo"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );

  const item = query.data;
  if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string")
    return (
      <ErrorState
        title="Dữ liệu báo cáo không hợp lệ"
        message="Backend không trả một báo cáo hợp lệ."
        onRetry={() => query.refetch()}
      />
    );

  return (
    <div className="workspace-dashboard admin-report-detail-page">
      <div className="admin-detail-back">
        <Link to="/admin/reports">← Quay lại danh sách báo cáo</Link>
      </div>

      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / CHI TIẾT BÁO CÁO</p>
          <h1>Báo cáo vi phạm: {item.reason || formatTargetType(item.targetType)}</h1>
          <p>Nội dung khiếu nại đối với {formatTargetType(item.targetType).toLowerCase()}</p>
        </div>
        <StatusBadge
          value={String(item.status ?? "unknown")}
          label={reportStatusLabels[item.status] || "Chưa xác định"}
          tone={reportStatusTones[item.status] || "neutral"}
        />
      </div>

      <section className="admin-report-detail-card">
        <dl className="admin-user-meta">
          <div>
            <dt>Loại nội dung bị báo cáo</dt>
            <dd><strong>{formatTargetType(item.targetType)}</strong></dd>
          </div>
          <div>
            <dt>Lý do khiếu nại</dt>
            <dd>{item.reason || "Chưa có mô tả chi tiết."}</dd>
          </div>
          <div>
            <dt>Người gửi báo cáo</dt>
            <dd>
              <strong>{item.reporterName || "Người dùng"}</strong>
              {item.reporterEmail && item.reporterEmail !== "—" && (
                <span style={{ display: "block", color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>
                  {item.reporterEmail}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Thời gian gửi</dt>
            <dd>{formatDateTime(item.createdAt)}</dd>
          </div>
          <div>
            <dt>Thời gian cập nhật</dt>
            <dd>{formatDateTime(item.updatedAt)}</dd>
          </div>
        </dl>

        {feedback && <SuccessState>{feedback}</SuccessState>}
        {errorFeedback && <p className="admin-mutation-error" role="alert">{errorFeedback}</p>}

        <div className="admin-report-actions-box">
          <div className="admin-report-actions-info">
            <h3>Xử lý khiếu nại nội dung</h3>
            <p>Chọn hành động giải quyết hoặc bác bỏ báo cáo vi phạm:</p>
          </div>
          <div className="admin-report-actions-buttons">
            <button
              className="workspace-button"
              type="button"
              disabled={updateMutation.isPending || item.status === 2}
              onClick={() => updateMutation.mutate({ nextStatus: 2 })}
            >
              <Check size={16} aria-hidden="true" />
              {updateMutation.isPending ? "Đang xử lý…" : "Đã giải quyết vi phạm"}
            </button>

            <button
              className="workspace-button workspace-button-quiet"
              type="button"
              disabled={updateMutation.isPending || item.status === 3}
              onClick={() => updateMutation.mutate({ nextStatus: 3 })}
            >
              <X size={16} aria-hidden="true" />
              Bác bỏ khiếu nại
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

