import { useState } from "react";
import { ArrowLeft, CheckCircle, EyeSlash, FloppyDisk, Rocket } from "@phosphor-icons/react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import PublishIssues from "../components/PublishIssues";

const tabs = [["", "Thông tin"], ["/pages", "Dựng truyện"], ["/roles", "Nhân vật"], ["/vocabulary", "Từ vựng"], ["/quizzes", "Câu hỏi"], ["/preview", "Xem trước"]];

function allowNavigation(event, dirty) {
  if (!dirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
  return window.confirm("Bạn có thay đổi chưa lưu. Rời trang sẽ bỏ thay đổi đó?");
}

function GuardedLink({ dirty, onClick, ...props }) {
  return <Link {...props} onClick={(event) => { if (!allowNavigation(event, dirty)) { event.preventDefault(); return; } onClick?.(event); }} />;
}

function GuardedNavLink({ dirty, onClick, ...props }) {
  return <NavLink {...props} onClick={(event) => { if (!allowNavigation(event, dirty)) { event.preventDefault(); return; } onClick?.(event); }} />;
}

export default function StoryEditorLayout() {
  const { user } = useAuth();
  const { storyId } = useParams();
  const location = useLocation();
  const isStudio = location.pathname.replace(/\/$/, "").endsWith("/pages");
  const queryClient = useQueryClient();
  const [validation, setValidation] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const storyQuery = useQuery({ queryKey: queryKeys.story(user.id, storyId), queryFn: ({ signal }) => contentService.getEditor({ storyId, signal }) });
  const validateMutation = useMutation({
    mutationFn: () => contentService.validateStory({ storyId, revision: storyQuery.data?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (result) => setValidation({ type: "success", message: result.message, revision: result.revision }),
    onError: () => setValidation(null),
  });
  const publishMutation = useMutation({
    mutationFn: () => contentService.publishStory({ storyId, revision: storyQuery.data?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (story) => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), story);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) });
      setValidation({ type: "success", message: `Đã xuất bản phiên bản ${story.versions.at(-1)?.version || "mới"}.` });
    },
    onError: () => setValidation(null),
  });
  const hideMutation = useMutation({
    mutationFn: () => contentService.hideStory({ storyId, revision: storyQuery.data?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (story) => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), story);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      setValidation({ type: "success", message: "Truyện đã được ẩn khỏi danh mục." });
    },
    onError: () => setValidation(null),
  });

  if (storyQuery.isLoading) return <LoadingState label="Đang mở trình chỉnh sửa truyện" />;
  if (storyQuery.isError) return <ErrorState title="Không thể mở truyện" message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />;

  const story = storyQuery.data;
  const visibleValidation = validation?.revision !== undefined && validation.revision !== story.revision ? null : validation;
  const actionError = validateMutation.error || publishMutation.error || hideMutation.error;
  const busy = validateMutation.isPending || publishMutation.isPending || hideMutation.isPending;

  function validate() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi thông tin truyện trước khi kiểm tra." });
    validateMutation.mutate();
  }

  function publish() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi xuất bản." });
    if (window.confirm("Xuất bản sẽ tạo phiên bản mới từ bản nháp hiện tại. Bạn muốn tiếp tục?")) publishMutation.mutate();
  }

  function hide() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi ẩn truyện." });
    if (window.confirm(`Ẩn “${story.title}” khỏi danh mục?`)) hideMutation.mutate();
  }

  return <section className={`story-editor-shell${isStudio ? " story-editor-shell-studio" : ""}`}>
    <div className="story-editor-back"><GuardedLink dirty={editorDirty} to="/content/stories"><ArrowLeft size={17} aria-hidden="true" /> Quay lại kho truyện</GuardedLink></div>
    <header className="story-editor-header">
      <div>
        <p className="workspace-eyebrow">NỘI DUNG / CHỈNH SỬA TRUYỆN</p>
        <div className="story-editor-title-row"><h1>{story.title}</h1><StatusBadge value={story.status} tone={story.status === "published" ? "success" : story.status === "hidden" ? "danger" : "gold"} /></div>
        <p>Lần chỉnh sửa {story.revision} · {story.pages.length} trang · {story.roles.length} nhân vật · Bản nháp và bản đã xuất bản được quản lý riêng.</p>
        <div className="story-editor-meta">
          <span>{story.versions.length} phiên bản đã xuất bản</span>
          {story.draftDirty && <span className="story-draft-chip">Bản nháp có thay đổi chưa xuất bản</span>}
          {editorDirty && <span className="story-draft-chip">Có thay đổi chưa lưu</span>}
          <span className={`story-editor-save-status${actionError ? " story-editor-save-status-error" : editorDirty ? " story-editor-save-status-dirty" : ""}`} role="status" aria-live="polite"><FloppyDisk size={15} aria-hidden="true" /> {busy ? "Đang xử lý..." : actionError ? "Cần xử lý lỗi" : editorDirty ? "Chưa lưu thay đổi" : "Bản nháp đã lưu"}</span>
        </div>
      </div>
      <div className="story-editor-actions">
        <button className="workspace-button workspace-button-quiet" type="button" onClick={validate} disabled={busy || editorDirty}><CheckCircle size={17} aria-hidden="true" /> Kiểm tra</button>
        <button className="workspace-button" type="button" onClick={publish} disabled={busy || editorDirty}><Rocket size={17} aria-hidden="true" /> {publishMutation.isPending ? "Đang xuất bản..." : "Xuất bản"}</button>
        {story.status === "published" && <button className="workspace-button workspace-button-danger" type="button" onClick={hide} disabled={busy || editorDirty}><EyeSlash size={17} aria-hidden="true" /> Ẩn truyện</button>}
      </div>
    </header>
    <nav className="story-editor-tabs" aria-label="Các phần chỉnh sửa truyện">{tabs.map(([suffix, label]) => <GuardedNavLink dirty={editorDirty} key={suffix} to={`/content/stories/${storyId}${suffix}`} end={!suffix}>{label}</GuardedNavLink>)}</nav>
    {visibleValidation && <div className={`story-action-message ${visibleValidation.type === "error" ? "story-action-error" : "story-action-success"}`} role="status"><CheckCircle size={17} aria-hidden="true" /> {visibleValidation.message}</div>}
    <PublishIssues error={actionError} />
    <Outlet context={{ story, assets: [], queryKey: queryKeys.story(user.id, storyId), setEditorDirty, onPublish: publish, onValidate: validate, isPublishing: publishMutation.isPending, isValidating: validateMutation.isPending, publishError: actionError, validation: visibleValidation }} />
  </section>;
}
