import { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  DownloadSimple,
  Eye,
  EyeSlash,
  Heart,
  MagnifyingGlass,
  SpinnerGap,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../components/feedback/States";

const exportStatusLabels = {
  queued: "Đang chờ xử lý",
  processing: "Đang tạo bản xuất",
  completed: "Đã sẵn sàng",
  failed: "Xuất bản chưa thành công",
  expired: "Link tải đã hết hạn",
};

export default function ChildLibraryPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [publishFormat, setPublishFormat] = useState("pdf");
  const [publishMessage, setPublishMessage] = useState("");
  const [downloadLinks, setDownloadLinks] = useState({});

  const type = ["all", "story", "character"].includes(searchParams.get("type"))
    ? searchParams.get("type")
    : "all";
  const search = searchParams.get("q") || "";
  const libraryQuery = useQuery({
    queryKey: queryKeys.childLibrary(user.id, childId, { type, search }),
    queryFn: ({ signal }) =>
      childrenService.listLibrary({ childId, type, search, signal }),
  });
  const exportsQuery = useQuery({
    queryKey: queryKeys.exports(user.id, { childId }),
    queryFn: ({ signal }) => childrenService.listExports({ childId, signal }),
  });
  const mutation = useMutation({
    mutationFn: ({ itemId, action }) =>
      childrenService.updateLibraryItem({ childId, itemId, action }),
    onMutate: ({ itemId }) => setPendingItemId(itemId),
    onSettled: () => setPendingItemId(null),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["child-library", user.id, childId],
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: (itemId) =>
      childrenService.deleteLibraryItem({ childId, itemId }),
    onMutate: (itemId) => setPendingItemId(itemId),
    onSettled: () => setPendingItemId(null),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({
        queryKey: ["child-library", user.id, childId],
      });
    },
  });
  const publishMutation = useMutation({
    mutationFn: ({ storyId, format }) =>
      childrenService.createExport({
        childId,
        storyId,
        format,
        idempotencyKey: `${childId}:${storyId}:${format}:${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      }),
    onSuccess: () => {
      setPublishMessage(
        "Đã gửi yêu cầu xuất bản. Tiến độ sẽ hiện trên truyện này.",
      );
      setPublishTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.exports(user.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.exports(user.id, { childId }),
      });
    },
  });
  const downloadMutation = useMutation({
    mutationFn: ({ exportId }) => childrenService.downloadExport({ exportId }),
    onSuccess: (data, variables) =>
      setDownloadLinks((current) => ({
        ...current,
        [variables.exportId]: data,
      })),
  });

  const items = libraryQuery.data?.items || [];
  const jobs = exportsQuery.data?.items || [];
  const quota = exportsQuery.data?.quota;
  const videoUnavailable =
    !quota ||
    quota.plan === "Free" ||
    (quota.limit !== null && quota.remaining <= 0);

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    if (!value && name === "type") next.delete("q");
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function latestExport(storyId) {
    return jobs.find((job) => job.storyId === storyId);
  }

  function submitPublish(event) {
    event.preventDefault();
    if (!publishTarget) return;
    const storyId = publishTarget.sourceId || publishTarget.id;
    publishMutation.mutate({ storyId, format: publishFormat });
  }

  return (
    <div className="parent-library-page">
      <div className="parent-feature-heading">
        <div>
          <p className="workspace-eyebrow">
            THƯ VIỆN / {child.displayName.toUpperCase()}
          </p>
          <h2>Thư viện của {child.displayName}</h2>
          <p>
            Thao tác ở đây chỉ ảnh hưởng tới thư viện của {child.displayName},
            không sửa truyện gốc.
          </p>
        </div>
        <span className="parent-feature-icon">
          <BookOpen size={27} aria-hidden="true" />
        </span>
      </div>

      <div className="library-toolbar">
        <label className="library-search">
          <MagnifyingGlass size={17} aria-hidden="true" />
          <span className="sr-only">Tìm trong thư viện</span>
          <input
            value={search}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Tìm truyện hoặc nhân vật"
          />
        </label>
        <div
          className="library-type-tabs"
          role="tablist"
          aria-label="Loại nội dung"
        >
          {[
            ["all", "Tất cả"],
            ["story", "Truyện"],
            ["character", "Nhân vật"],
          ].map(([value, label]) => (
            <button
              aria-selected={type === value}
              className={type === value ? "active" : ""}
              type="button"
              role="tab"
              key={value}
              onClick={() => updateFilter("type", value === "all" ? "" : value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {publishMessage && (
        <p className="library-publish-message" role="status">
          <CheckCircle size={18} aria-hidden="true" /> {publishMessage}
        </p>
      )}

      <div className="library-results" aria-busy={libraryQuery.isFetching}>
        {libraryQuery.isError ? (
          <ErrorState
            title="Không thể tải thư viện"
            message={libraryQuery.error.message}
            onRetry={() => libraryQuery.refetch()}
          />
        ) : libraryQuery.isLoading ? (
          <LoadingState label="Đang tải thư viện của bé" />
        ) : items.length ? (
          <div className="library-grid">
            {items.map((item) => {
              const storyId = item.sourceId || item.id;
              const exportJob =
                item.type === "story" ? latestExport(storyId) : null;
              const exportInProgress = ["queued", "processing"].includes(
                exportJob?.status,
              );
              return (
                <article
                  className={`library-card ${item.hidden ? "is-hidden" : ""}`}
                  key={item.id}
                >
                  <img
                    src={item.imageUrl}
                    alt={`Ảnh ${item.title}`}
                    width="240"
                    height="150"
                  />
                  <div className="library-card-body">
                    <div className="library-card-kicker">
                      <span>
                        {item.type === "story" ? "TRUYỆN" : "NHÂN VẬT"}
                      </span>
                      {item.favorite && (
                        <span className="library-card-favorite">
                          <Heart size={14} weight="fill" aria-hidden="true" />
                          Đã yêu thích
                        </span>
                      )}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.hidden && (
                      <small className="library-hidden-note">
                        Đang ẩn khỏi thư viện chính
                      </small>
                    )}
                    {exportJob && (
                      <small className="library-export-status" role="status">
                        Bản xuất {exportJob.format.toUpperCase()} ·{" "}
                        {exportJob.downloadExpired
                          ? exportStatusLabels.expired
                          : exportStatusLabels[exportJob.status] ||
                            exportJob.status}
                      </small>
                    )}
                    <div className="library-card-actions">
                      {item.type === "story" && (
                        <button
                          className="workspace-button workspace-button-quiet library-publish-button"
                          type="button"
                          disabled={exportInProgress}
                          onClick={() => {
                            setPublishTarget(item);
                            setPublishFormat("pdf");
                            setPublishMessage("");
                            publishMutation.reset();
                          }}
                        >
                          <UploadSimple size={16} aria-hidden="true" />
                          {exportInProgress
                            ? "Đang xuất bản"
                            : exportJob
                              ? "Xuất bản lại"
                              : "Xuất bản"}
                        </button>
                      )}
                      {exportJob?.status === "completed" &&
                        !exportJob.downloadExpired &&
                        (downloadLinks[exportJob.id] ? (
                          <a
                            className="workspace-button workspace-button-quiet library-download-button"
                            href={downloadLinks[exportJob.id].url}
                            download={downloadLinks[exportJob.id].fileName}
                          >
                            <DownloadSimple size={16} aria-hidden="true" />
                            Tải bản xuất
                          </a>
                        ) : (
                          <button
                            className="workspace-button workspace-button-quiet library-download-button"
                            type="button"
                            onClick={() =>
                              downloadMutation.mutate({
                                exportId: exportJob.id,
                              })
                            }
                            disabled={downloadMutation.isPending}
                          >
                            <DownloadSimple size={16} aria-hidden="true" />
                            {downloadMutation.isPending &&
                            downloadMutation.variables?.exportId ===
                              exportJob.id
                              ? "Đang lấy link..."
                              : "Tải bản xuất"}
                          </button>
                        ))}
                      <button
                        className="icon-button"
                        type="button"
                        aria-pressed={item.favorite}
                        aria-label={
                          item.favorite
                            ? `Bỏ yêu thích ${item.title}`
                            : `Yêu thích ${item.title}`
                        }
                        disabled={pendingItemId === item.id}
                        onClick={() =>
                          mutation.mutate({
                            itemId: item.id,
                            action: "favorite",
                          })
                        }
                      >
                        <Heart
                          size={17}
                          weight={item.favorite ? "fill" : "regular"}
                        />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-pressed={item.hidden}
                        aria-label={
                          item.hidden
                            ? `Hiện lại ${item.title}`
                            : `Ẩn ${item.title}`
                        }
                        disabled={pendingItemId === item.id}
                        onClick={() =>
                          mutation.mutate({
                            itemId: item.id,
                            action: item.hidden ? "unhide" : "hide",
                          })
                        }
                      >
                        {item.hidden ? (
                          <Eye size={17} />
                        ) : (
                          <EyeSlash size={17} />
                        )}
                      </button>
                      <button
                        className="icon-button icon-button-danger"
                        type="button"
                        aria-label={`Xóa ${item.title}`}
                        disabled={pendingItemId === item.id}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={search ? "Không tìm thấy nội dung" : "Thư viện đang trống"}
            message={
              search
                ? "Thử tìm bằng một từ khác hoặc xóa bộ lọc."
                : `Chưa có truyện hoặc nhân vật nào dành cho ${child.displayName}.`
            }
            action={
              search ? (
                <button
                  className="workspace-button workspace-button-quiet"
                  type="button"
                  onClick={() => {
                    updateFilter("q", "");
                    updateFilter("type", "");
                  }}
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
          />
        )}
      </div>

      {(mutation.isError || deleteMutation.isError) && (
        <p className="admin-mutation-error" role="alert">
          <WarningCircle size={16} aria-hidden="true" />
          {(mutation.error || deleteMutation.error).message}
        </p>
      )}

      {downloadMutation.isError && (
        <p className="admin-mutation-error" role="alert">
          <WarningCircle size={16} aria-hidden="true" />
          {downloadMutation.error.message}
        </p>
      )}

      {publishTarget && (
        <div className="parent-dialog-backdrop" role="presentation">
          <form
            className="parent-dialog library-publish-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-publish-title"
            onSubmit={submitPublish}
          >
            <h2 id="library-publish-title">Xuất bản câu chuyện</h2>
            <p>{publishTarget.title}</p>
            <label className="library-publish-format">
              Định dạng
              <select
                value={publishFormat}
                onChange={(event) => setPublishFormat(event.target.value)}
              >
                <option value="pdf">PDF đọc cùng bé</option>
                <option value="video" disabled={videoUnavailable}>
                  Video kỷ niệm
                  {quota?.plan === "Free"
                    ? " (không có trong gói hiện tại)"
                    : quota && videoUnavailable
                      ? " (đã hết lượt)"
                      : ""}
                </option>
              </select>
            </label>
            {publishFormat === "video" && quota && quota.limit > 0 && (
              <small className="library-publish-quota">
                Còn {quota.remaining} lượt xuất video trong chu kỳ này.
              </small>
            )}
            {exportsQuery.isError && (
              <p className="export-field-help export-field-error" role="status">
                Không tải được hạn mức video; bạn vẫn có thể xuất PDF.
              </p>
            )}
            {publishMutation.isError && (
              <p className="export-alert" role="alert">
                <WarningCircle size={17} aria-hidden="true" />
                {publishMutation.error.message}
              </p>
            )}
            <div className="parent-dialog-actions">
              <button
                className="workspace-button workspace-button-quiet"
                type="button"
                onClick={() => setPublishTarget(null)}
                disabled={publishMutation.isPending}
              >
                Hủy
              </button>
              <button
                className="workspace-button"
                type="submit"
                disabled={
                  publishMutation.isPending ||
                  (publishFormat === "video" &&
                    (exportsQuery.isLoading || videoUnavailable))
                }
              >
                {publishMutation.isPending ? (
                  <>
                    <SpinnerGap className="workspace-spinner" size={17} />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <UploadSimple size={17} aria-hidden="true" />
                    Xuất bản
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="parent-dialog-backdrop" role="presentation">
          <div
            className="parent-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-library-title"
          >
            <h2 id="delete-library-title">Xóa nội dung khỏi thư viện?</h2>
            <p>
              Xóa <strong>{deleteTarget.title}</strong> khỏi thư viện của{" "}
              {child.displayName}. Nội dung gốc không bị thay đổi.
            </p>
            <div className="parent-dialog-actions">
              <button
                className="workspace-button workspace-button-quiet"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Giữ lại
              </button>
              <button
                className="workspace-button workspace-button-danger"
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa khỏi thư viện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
