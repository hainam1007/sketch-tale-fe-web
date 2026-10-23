import { useMemo } from "react";
import { MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

function enumCode(value) {
  return `Mã ${value ?? "chưa rõ"}`;
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
          `${item.id || ""} ${item.targetId || ""} ${item.reason || ""} ${item.createBy || ""}`
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
          <p className="workspace-eyebrow">ADMIN / BACKEND REPORTS</p>
          <h1>Báo cáo nội dung</h1>
          <p>Tra cứu báo cáo theo nội dung, người gửi và trạng thái.</p>
        </div>
        <WarningCircle
          size={42}
          className="admin-heading-icon"
          aria-hidden="true"
        />
      </div>
      <div className="admin-source-note is-live">
        <span className="admin-source-indicator" />
        Báo cáo từ hệ thống · Chỉ đọc
        <button
          className="workspace-button workspace-button-quiet"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          {query.isFetching ? "Đang tải…" : "Làm mới"}
        </button>
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
              placeholder="Tìm theo ID đối tượng, lý do hoặc người gửi"
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
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={value}>
                  Trạng thái · Mã {value}
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
        <div className="admin-report-list">
          {rows.slice((currentPage - 1) * 10, currentPage * 10).map((item) => (
            <Link
              className="admin-report-item"
              to={`/admin/reports/${item.id}`}
              key={item.id}
            >
              <div className="admin-report-item-main">
                <span className="admin-report-type">
                  Loại đối tượng · {enumCode(item.targetType)} · {item.id}
                </span>
                <h2>{item.targetId || "Chưa có ID đối tượng"}</h2>
                <p>{item.reason || "Chưa có lý do được cung cấp."}</p>
                <small>
                  Gửi bởi {item.createBy || "Chưa xác định"} ·{" "}
                  {formatDate(item.createdAt)}
                </small>
              </div>
              <StatusBadge
                value={String(item.status ?? "unknown")}
                label={`Trạng thái · ${enumCode(item.status)}`}
                tone="neutral"
              />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={WarningCircle}
          title={
            search ? "Không có báo cáo phù hợp" : "Chưa có báo cáo nội dung"
          }
          message={
            search
              ? "Thử tìm bằng ID đối tượng, lý do hoặc người gửi."
              : "Danh sách backend hiện không có báo cáo."
          }
        />
      )}
      {rows.length > 0 && (
        <nav
          className="admin-pagination admin-report-pagination"
          aria-label="Phân trang báo cáo"
        >
          <button
            className="workspace-button workspace-button-quiet"
            disabled={currentPage <= 1}
            onClick={() => setFilter("page", String(currentPage - 1))}
          >
            Trước
          </button>
          <span aria-live="polite">
            Trang {currentPage} / {totalPages} · {rows.length} báo cáo
          </span>
          <button
            className="workspace-button workspace-button-quiet"
            disabled={currentPage >= totalPages}
            onClick={() => setFilter("page", String(currentPage + 1))}
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}

export function AdminContentReportDetailPage() {
  const { user } = useAuth();
  const { reportId } = useParams();
  const query = useQuery({
    queryKey: ["backend-content-report", user.id, reportId],
    queryFn: ({ signal }) =>
      adminService.getContentReport({ reportId, signal }),
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
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item) ||
    typeof item.id !== "string"
  )
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
        <Link to="/admin/reports">← Quay lại báo cáo</Link>
      </div>
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / CHI TIẾT BÁO CÁO</p>
          <h1>{item.targetId || "Báo cáo nội dung"}</h1>
          <p>{item.reason || "Chưa có lý do được cung cấp."}</p>
        </div>
        <StatusBadge
          value={String(item.status ?? "unknown")}
          label={`Trạng thái · ${enumCode(item.status)}`}
          tone="neutral"
        />
      </div>
      <section className="admin-report-detail-card">
        <dl className="admin-user-meta">
          <div>
            <dt>Báo cáo ID</dt>
            <dd>{item.id || "—"}</dd>
          </div>
          <div>
            <dt>Loại đối tượng · mã backend</dt>
            <dd>{enumCode(item.targetType)}</dd>
          </div>
          <div>
            <dt>Target ID</dt>
            <dd>{item.targetId || "—"}</dd>
          </div>
          <div>
            <dt>Người tạo</dt>
            <dd>{item.createBy || "—"}</dd>
          </div>
          <div>
            <dt>Tạo lúc</dt>
            <dd>{formatDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt>Cập nhật lúc</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
        <p className="admin-report-target-preview">
          Chỉ đọc. Swagger hiện mô tả PATCH cập nhật DTO, nhưng chưa xác nhận ý
          nghĩa trạng thái hoặc tác động kiểm duyệt.
        </p>
      </section>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Thời gian chưa xác định"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}
