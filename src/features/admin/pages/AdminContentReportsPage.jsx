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

const emptyActorId = "00000000-0000-0000-0000-000000000000";

function displayActorId(value) {
  return value && value !== emptyActorId ? `ID: ${value.slice(0, 8)}…` : "";
}

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
        timeZone: "UTC",
      }).format(date);
}

function formatEntityDateTime(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
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
    return <LoadingState label="Đang tải báo cáo nội dung" />;
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
                      {item.reporterName && (
                        <span className="admin-user-initial" aria-hidden="true">
                          {item.reporterName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <strong>{item.reporterName}</strong>
                        <small>{displayActorId(item.createBy)}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-user-email">{item.reporterEmail}</span>
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
                    <span>{formatEntityDateTime(item.updatedAt)}</span>
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
  const [suspendTargetOwner, setSuspendTargetOwner] = useState(false);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [decisionNote, setDecisionNote] = useState("");

  const query = useQuery({
    queryKey: ["backend-content-report", user.id, reportId],
    queryFn: ({ signal }) =>
      adminService.getContentReport({ reportId, signal }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ nextStatus, suspendOwner = false, restoreOwner = false }) =>
      adminService.updateContentReportStatus({
        reportId,
        status: nextStatus,
        suspendTargetOwner: suspendOwner,
        restoreTargetOwner: restoreOwner,
        decisionNote,
        suspensionDays,
      }),
    onSuccess: async (_, variables) => {
      setFeedback(variables.restoreOwner
        ? "Đã mở khóa tài khoản chủ truyện. Người dùng có thể đăng nhập lại."
        : variables.nextStatus === 2
        ? `${Number(item?.targetType) === 1 ? "Đã ẩn truyện" : "Đã giải quyết báo cáo"} và chuyển sang "${reportStatusLabels[variables.nextStatus]}"${variables.suspendOwner ? `; tài khoản chủ truyện bị khóa ${suspensionDays} ngày` : ""}.`
        : variables.nextStatus === 3
          ? "Đã bác bỏ báo cáo; nội dung được giữ nguyên."
          : "Đã nhận báo cáo để xem xét.");
      setErrorFeedback("");
      await queryClient.invalidateQueries({ queryKey: ["backend-content-report", user.id, reportId] });
      queryClient.invalidateQueries({ queryKey: ["backend-content-reports", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
    onError: (err) => {
      setErrorFeedback(err.message || "Không thể cập nhật trạng thái báo cáo.");
      setFeedback("");
      if (err.status === 409) {
        queryClient.invalidateQueries({ queryKey: ["backend-content-report", user.id, reportId] });
      }
    },
  });

  if (query.isLoading)
    return <LoadingState label="Đang tải chi tiết báo cáo" />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        title="Không thể mở báo cáo"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );

  const item = query.data;
  const unknownOutcome = updateMutation.isError && (!updateMutation.error.status || updateMutation.error.status >= 500);
  if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string")
    return (
      <ErrorState
        title="Dữ liệu báo cáo không hợp lệ"
        message="Không thể đọc thông tin báo cáo. Vui lòng thử lại."
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
            <dd><strong>{formatTargetType(item.targetType)}</strong>{item.targetTitle && <span> · {item.targetTitle}</span>}</dd>
          </div>
          <div>
            <dt>Lý do khiếu nại</dt>
            <dd>{item.reason || "Chưa có mô tả chi tiết."}</dd>
          </div>
          <div>
            <dt>Người gửi báo cáo</dt>
            <dd>
              <strong>{item.reporterName}</strong>
              {item.reporterEmail && (
                <span style={{ display: "block", color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>
                  {item.reporterEmail}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Thời gian gửi</dt>
            <dd>{formatEntityDateTime(item.createdAt)}</dd>
          </div>
          <div>
            <dt>Thời gian cập nhật</dt>
            <dd>{formatEntityDateTime(item.updatedAt)}</dd>
          </div>
        </dl>

        {item.targetTitle && (
          <section className="admin-report-target-preview" aria-label="Xem trước nội dung bị báo cáo">
            {item.targetCoverImageUrl && <img src={item.targetCoverImageUrl} alt={`Bìa truyện ${item.targetTitle}`} />}
            <div><p className="workspace-eyebrow">NỘI DUNG BỊ BÁO CÁO · CHỈ ĐỌC</p><h2>{item.targetTitle}</h2><p>{item.targetDescription || "Không có mô tả truyện."}</p>{item.targetOwnerId && <small>Tài khoản chịu trách nhiệm: {item.targetOwnerName || displayActorId(item.targetOwnerId)}{item.targetOwnerEmail ? ` · ${item.targetOwnerEmail}` : ""} · {item.targetOwnerLockedOut ? "đang bị khóa" : "đang hoạt động"}{item.suspensionEndsAt ? ` · khóa đến ${formatDateTime(item.suspensionEndsAt)}` : ""}</small>}</div>
          </section>
        )}

        {Number(item.targetType) === 1 && (
          <section className="admin-report-story-pages" aria-label="Các trang truyện bị báo cáo">
            <h2>Nội dung truyện</h2>
            {item.targetPagesError && <p className="admin-refresh-note" role="status">Chưa tải được phần nội dung truyện: {item.targetPagesError}</p>}
            {!item.targetPagesError && item.targetPages?.length === 0 && <p>Truyện không có trang nào để xem xét.</p>}
            {item.targetPages?.map((page) => (
              <article className="admin-report-story-page" key={page.id || page.pageNumber}>
                <h3>Trang {page.pageNumber ?? "?"}</h3>
                {page.backgroundUrl && <img src={page.backgroundUrl} alt={`Hình nền trang ${page.pageNumber ?? ""}`} loading="lazy" />}
                <p>{page.rawText || "Trang này không có nội dung văn bản."}</p>
                {page.audioNarrationUrl && <audio controls preload="none" src={page.audioNarrationUrl}>Trình duyệt không hỗ trợ phát âm thanh.</audio>}
              </article>
            ))}
          </section>
        )}

        {Number(item.status) === 1 && item.reviewerId && <p className="admin-report-review-owner">Đang được tiếp nhận bởi {displayActorId(item.reviewerId)} · {formatDateTime(item.reviewedAt)}</p>}
        {item.decisionNote && <section className="admin-report-decision-note"><strong>Ghi chú quyết định</strong><p>{item.decisionNote}</p>{item.reviewerId && <small>Người xử lý: {displayActorId(item.reviewerId)} · {formatDateTime(item.reviewedAt)}</small>}</section>}

        {query.isError && <p role="alert">Chưa đọc lại được báo cáo; dữ liệu hiển thị có thể cũ. <button type="button" onClick={() => query.refetch()}>Đọc lại trạng thái</button></p>}
        {feedback && <SuccessState>{feedback}</SuccessState>}
        {errorFeedback && <p className="admin-mutation-error" role="alert">{errorFeedback}</p>}
        {unknownOutcome && <p role="alert">Chưa xác định kết quả thao tác. Đọc lại trạng thái trước khi quyết định xử lý tiếp; không tự gửi lại. <button type="button" disabled={query.isFetching} onClick={async () => { const result = await query.refetch(); if (!result.isError) { updateMutation.reset(); setErrorFeedback(""); } }}>Đối chiếu trạng thái</button></p>}

        <div className="admin-report-actions-box">
          <div className="admin-report-actions-info">
            <h3>Xử lý khiếu nại nội dung</h3>
          </div>
          <div className="admin-report-actions-buttons">
            {item.status === 0 && <button className="workspace-button" type="button" disabled={unknownOutcome || query.isError || query.isFetching || updateMutation.isPending} onClick={() => updateMutation.mutate({ nextStatus: 1 })}><Eye size={16} aria-hidden="true" /> Nhận xử lý</button>}
            {Number(item.status) === 2 && item.canRestoreTargetOwner && item.targetOwnerLockedOut && <button className="workspace-button workspace-button-quiet" type="button" disabled={unknownOutcome || query.isError || query.isFetching || updateMutation.isPending} onClick={() => updateMutation.mutate({ nextStatus: 2, restoreOwner: true })}>Mở khóa tài khoản chủ truyện</button>}
            {item.status === 1 && <>
              <label className="admin-report-decision-field" htmlFor="report-decision-note">Ghi chú (bắt buộc)<textarea id="report-decision-note" rows={2} maxLength={1000} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} /></label>
              {Number(item.targetType) === 1 && <div className="admin-report-suspension-options">
                <label><input type="checkbox" checked={suspendTargetOwner} disabled={!item.targetOwnerCanBeSuspended} onChange={(event) => setSuspendTargetOwner(event.target.checked)} /> Tạm khóa tài khoản chủ truyện</label>
                {!item.targetOwnerId && <small>Không thể xác định tác giả từ dữ liệu truyện; tài khoản không bị khóa.</small>}
                {item.targetOwnerId && item.targetOwnerLockedOut && <small>Tài khoản chủ truyện đang bị khóa bởi quyết định khác; không thể ghi đè thời hạn khóa này.</small>}
                {item.targetOwnerId && !item.targetOwnerLockedOut && !item.targetOwnerCanBeSuspended && <small>Tài khoản tạo truyện không thuộc vai Content Manager đủ điều kiện tạm khóa.</small>}
                {suspendTargetOwner && <label>Thời hạn <select value={suspensionDays} onChange={(event) => setSuspensionDays(Number(event.target.value))}><option value={1}>1 ngày</option><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></label>}
              </div>}
              <button className="workspace-button" type="button" disabled={unknownOutcome || query.isError || query.isFetching || updateMutation.isPending || !decisionNote.trim()} onClick={() => updateMutation.mutate({ nextStatus: 2, suspendOwner: suspendTargetOwner })}><Check size={16} aria-hidden="true" /> {updateMutation.isPending ? "Đang xử lý…" : "Ẩn truyện"}</button>
              <button className="workspace-button workspace-button-quiet" type="button" disabled={unknownOutcome || query.isError || query.isFetching || updateMutation.isPending || !decisionNote.trim()} onClick={() => updateMutation.mutate({ nextStatus: 3 })}><X size={16} aria-hidden="true" /> Từ chối</button>
            </>}
            {[2, 3].includes(Number(item.status)) && <p className="admin-report-closed-note">Báo cáo đã kết thúc; trạng thái và biện pháp xử lý được giữ theo quyết định trước đó.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

