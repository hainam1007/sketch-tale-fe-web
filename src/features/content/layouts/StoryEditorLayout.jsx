import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, EyeSlash, FloppyDisk, Rocket, WarningCircle } from "@phosphor-icons/react";
import { Link, NavLink, Outlet, useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState } from "../../../components/feedback/States";
import { consumeApprovedContentEditorNavigation, isContentEditorDirty } from "../hooks/useEditorSaveState";
import StatusBadge from "../../../components/ui/StatusBadge";
import PublishIssues from "../components/PublishIssues";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";

const tabs = [["", "Thông tin"], ["/pages", "Dựng truyện"], ["/roles", "Nhân vật"], ["/vocabulary", "Từ vựng"], ["/quizzes", "Câu hỏi"], ["/preview", "Xem trước"]];

export default function StoryEditorLayout() {
  const { user } = useAuth();
  const { storyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudio = location.pathname.replace(/\/$/, "").endsWith("/pages");
  const queryClient = useQueryClient();
  const [validation, setValidation] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const blocker = useBlocker(editorDirty);
  const blockerRef = useRef(null);
  const confirmToast = useConfirmToast();
  const storyQuery = useQuery({ queryKey: queryKeys.story(user.id, storyId), queryFn: ({ signal }) => contentService.getEditor({ storyId, signal }) });

  useEffect(() => { blockerRef.current = blocker; }, [blocker]);

  useEffect(() => {
    const currentBlocker = blockerRef.current;
    if (currentBlocker?.state !== "blocked") return;
    if (consumeApprovedContentEditorNavigation()) { currentBlocker.proceed(); return; }
    if (isStudio) {
      let active = true;
      let timerId;
      const startedAt = Date.now();
      const waitForAutosave = async () => {
        if (!active) return;
        const latestBlocker = blockerRef.current;
        if (latestBlocker?.state !== "blocked") return;
        if (!isContentEditorDirty()) { latestBlocker.proceed(); return; }
        if (Date.now() - startedAt >= 10_000) {
          const approved = await confirmToast({ title: "Tự động lưu chưa hoàn tất", message: "Một số thay đổi chưa được lưu. Nếu rời trang lúc này, các thay đổi đó sẽ bị bỏ.", confirmLabel: "Rời trang", cancelLabel: "Ở lại", tone: "danger" });
          if (!active) return;
          const current = blockerRef.current;
          if (current?.state !== "blocked") return;
          if (approved) current.proceed();
          else current.reset();
          return;
        }
        timerId = window.setTimeout(waitForAutosave, 100);
      };
      timerId = window.setTimeout(waitForAutosave, 50);
      return () => { active = false; window.clearTimeout(timerId); };
    }
    let active = true;
    confirmToast({ title: "Rời trang này?", message: "Bạn có thay đổi chưa lưu. Nếu rời trang, các thay đổi này sẽ bị bỏ.", confirmLabel: "Rời trang", cancelLabel: "Ở lại", tone: "danger" }).then((approved) => {
      if (!active) return;
      const latestBlocker = blockerRef.current;
      if (latestBlocker?.state !== "blocked") return;
      if (approved) latestBlocker.proceed();
      else latestBlocker.reset();
    });
    return () => { active = false; };
  }, [blocker.state, blocker.location?.key, confirmToast, isStudio]);
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
      setValidation({ type: "success", message: story.publishMessage || `Đã xuất bản truyện “${story.title}”.` });
    },
    onError: () => setValidation(null),
  });
  const hideMutation = useMutation({
    mutationFn: () => contentService.hideStory({ storyId, revision: storyQuery.data?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), (current) => current ? { ...current, status: "hidden", backendStatus: 3 } : current);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      navigate("/content/stories", { replace: true });
    },
    onError: () => setValidation(null),
  });

  if (storyQuery.isLoading) return <StoryEditorLoadingState isStudio={isStudio} label="Đang mở trình chỉnh sửa truyện" />;
  if (storyQuery.isError) return <ErrorState title="Không thể mở truyện" message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />;

  const story = storyQuery.data;
  const visibleValidation = validation?.revision !== undefined && validation.revision !== story.revision ? null : validation;
  const actionError = validateMutation.error || publishMutation.error || hideMutation.error;
  const mutationOutcomeBlocked = [validateMutation, publishMutation, hideMutation].some(({ error }) => error?.mutationAccepted || error?.mutationOutcomeUnknown);
  const busy = validateMutation.isPending || publishMutation.isPending || hideMutation.isPending;

  function validate() {
    if (mutationOutcomeBlocked) return;
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi thông tin truyện trước khi kiểm tra." });
    validateMutation.mutate();
  }

  async function publish() {
    if (mutationOutcomeBlocked) return;
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi xuất bản." });
    if (storyQuery.data?.status === "unknown") return setValidation({ type: "error", message: "Chưa thể xuất bản truyện này lúc này. Vui lòng thử lại sau." });
    if (await confirmToast({ title: "Xuất bản truyện?", message: "Truyện sẽ hiển thị với người đọc sau khi xuất bản.", confirmLabel: "Xuất bản" })) publishMutation.mutate();
  }

  async function hide() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi ẩn truyện." });
    if (await confirmToast({ title: "Ẩn truyện?", message: `Ẩn “${story.title}” khỏi danh mục truyện?`, confirmLabel: "Ẩn truyện", tone: "danger" })) hideMutation.mutate();
  }

  return <section className={`story-editor-shell${isStudio ? " story-editor-shell-studio" : ""}`}>
    <div className="story-editor-back"><Link to="/content/stories"><ArrowLeft size={17} aria-hidden="true" /> Quay lại kho truyện</Link></div>
    <header className="story-editor-header">
      <div>
        <p className="workspace-eyebrow">NỘI DUNG / CHỈNH SỬA TRUYỆN</p>
        <div className="story-editor-title-row"><h1>{story.title}</h1><StatusBadge value={story.status} tone={story.status === "published" ? "success" : story.status === "hidden" ? "danger" : story.status === "unknown" ? "neutral" : "gold"} /></div>
        <p>{story.pages.length} trang · {story.roles.length} nhân vật.</p>
        <div className="story-editor-meta">
          {story.versionHistoryAvailable !== false && <span>{story.versions.length} phiên bản đã xuất bản</span>}
          {story.draftDirty && !editorDirty && <span className="story-draft-chip">Bản nháp có thay đổi chưa xuất bản</span>}
          <span className={`story-editor-save-status${actionError ? " story-editor-save-status-error" : editorDirty ? " story-editor-save-status-dirty" : ""}`} role="status" aria-live="polite"><FloppyDisk size={15} aria-hidden="true" /> {busy ? "Đang xử lý..." : actionError ? "Cần xử lý lỗi" : editorDirty ? "Chưa lưu thay đổi" : "Bản nháp đã lưu"}</span>
        </div>
      </div>
      <div className="story-editor-actions">
        <button className="workspace-button workspace-button-quiet" type="button" onClick={validate} disabled={busy || mutationOutcomeBlocked || editorDirty}><CheckCircle size={17} aria-hidden="true" /> Kiểm tra</button>
        <button className="workspace-button" type="button" onClick={publish} disabled={busy || mutationOutcomeBlocked || editorDirty || story.status === "unknown"} title={mutationOutcomeBlocked ? "Tải lại truyện để kiểm tra trạng thái thao tác trước khi tiếp tục." : story.status === "unknown" ? "Truyện chưa thể xuất bản lúc này." : undefined}><Rocket size={17} aria-hidden="true" /> {publishMutation.isPending ? "Đang xuất bản..." : "Xuất bản"}</button>
        {story.status === "published" && <button className="workspace-button workspace-button-danger" type="button" onClick={hide} disabled={busy || editorDirty}><EyeSlash size={17} aria-hidden="true" /> Ẩn truyện</button>}
      </div>
    </header>
    {story.status === "unknown" && <p className="editor-help" role="status">Truyện chưa thể xuất bản lúc này. Vui lòng thử lại sau.</p>}
    <nav className="story-editor-tabs" aria-label="Các phần chỉnh sửa truyện">{tabs.map(([suffix, label]) => <NavLink key={suffix} to={`/content/stories/${storyId}${suffix}`} end={!suffix}>{label}</NavLink>)}</nav>
    {visibleValidation && <div className={`story-action-message ${visibleValidation.type === "error" ? "story-action-error" : "story-action-success"}`} role="status">{visibleValidation.type === "error" ? <WarningCircle size={17} aria-hidden="true" /> : <CheckCircle size={17} aria-hidden="true" />} {visibleValidation.message}</div>}
    <PublishIssues error={actionError} />
    <Outlet context={{ story, assets: [], queryKey: queryKeys.story(user.id, storyId), setEditorDirty, onPublish: publish, onValidate: validate, isPublishing: publishMutation.isPending, isValidating: validateMutation.isPending, publishError: actionError, validation: visibleValidation }} />
  </section>;
}

function StoryEditorLoadingState({ isStudio, label }) {
  return <section className={`story-editor-loading${isStudio ? " story-editor-loading-shell-studio" : ""}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
    <header className="story-editor-loading-header">
      <div>
        <span className="story-editor-loading-kicker"><BookOpen size={15} aria-hidden="true" /> SKETCH TALE / STORY STUDIO</span>
        <h1>Đang mở không gian sáng tác</h1>
        <p>Đang tải bản thảo, trang truyện và công cụ chỉnh sửa.</p>
      </div>
      <div className="story-editor-loading-status" aria-hidden="true"><span><img src="/images/SketchTale_Mascot_Loading.webp" alt="" /></span><div><strong>Đang tải truyện</strong><small>Chuẩn bị nội dung và tư liệu</small></div></div>
    </header>
    <nav className="story-editor-loading-tabs" aria-hidden="true">
      {["Thông tin", "Dựng truyện", "Nhân vật", "Từ vựng", "Câu hỏi", "Xem trước"].map((tab, index) => <span className={(isStudio ? index === 1 : index === 0) ? "active" : ""} key={tab}>{tab}</span>)}
    </nav>
    {isStudio ? <div className="story-editor-loading-studio">
      <aside className="story-editor-loading-pages" aria-hidden="true"><div className="story-editor-loading-section-title"><i /> <i /></div><div className="story-editor-loading-page-card active"><i /><span><i /><i /></span></div><div className="story-editor-loading-page-card"><i /><span><i /><i /></span></div><div className="story-editor-loading-page-card"><i /><span><i /><i /></span></div><div className="story-editor-loading-add"><i /> <i /></div></aside>
      <div className="story-editor-loading-stage-panel" aria-hidden="true"><div className="story-editor-loading-toolbar"><i /><span><i /><i /><i /></span></div><div className="story-editor-loading-stage"><span className="story-editor-loading-sun" /><span className="story-editor-loading-hill" /><i /></div><div className="story-editor-loading-filmstrip"><i className="active" /><i /><i /><i /></div></div>
      <aside className="story-editor-loading-inspector" aria-hidden="true"><div className="story-editor-loading-section-title"><i /><i /></div><i className="story-editor-loading-field" /><i className="story-editor-loading-field short" /><i className="story-editor-loading-field" /><i className="story-editor-loading-field" /><i className="story-editor-loading-control" /></aside>
    </div> : <div className="story-editor-loading-metadata" aria-hidden="true"><div><i className="story-editor-loading-field" /><i className="story-editor-loading-textarea" /><div className="story-editor-loading-field-row"><i /><i /></div></div><aside><i className="story-editor-loading-cover" /><i className="story-editor-loading-field short" /></aside></div>}
  </section>;
}
