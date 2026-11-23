import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, DotsThree, EyeSlash, FloppyDisk, Rocket, WarningCircle } from "@phosphor-icons/react";
import { Link, NavLink, Outlet, useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState } from "../../../components/feedback/States";
import DismissButton from "../../../components/feedback/DismissButton";
import { consumeApprovedContentEditorNavigation, isContentEditorDirty } from "../hooks/useEditorSaveState";
import StatusBadge from "../../../components/ui/StatusBadge";
import PublishIssues from "../components/PublishIssues";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { clearContentMockOverlay, readContentMockOverlay } from "../services/contentMockOverlay";
import { featureApiModes } from "../../../lib/api/featureApi";
import "../editor-usability.css";

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
  const [publishConfirming, setPublishConfirming] = useState(false);
  const publishAttemptRef = useRef(false);
  const blocker = useBlocker(editorDirty);
  const blockerRef = useRef(null);
  const confirmToast = useConfirmToast();
  const storyQuery = useQuery({ queryKey: queryKeys.story(user.id, storyId), queryFn: ({ signal }) => contentService.getEditor({ storyId, signal }) });
  const storyMutationScope = `content-story-${storyId}`;
  const hasPendingStoryWork = () => queryClient.isMutating({
    predicate: (mutation) => mutation.options.scope?.id === storyMutationScope && mutation.options.meta?.contentOperation !== "publish",
  }) > 0 || queryClient.isMutating({ mutationKey: ["content-upload", storyId] }) > 0;
  const pendingStoryWork = useIsMutating({
    predicate: (mutation) => mutation.options.scope?.id === storyMutationScope && mutation.options.meta?.contentOperation !== "publish",
  });
  const pendingAssetUploads = useIsMutating({ mutationKey: ["content-upload", storyId] });
  const hasPendingContentWork = pendingStoryWork > 0 || pendingAssetUploads > 0;

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
  const publishMutation = useMutation({
    mutationFn: () => {
      if (isContentEditorDirty() || hasPendingStoryWork()) throw new Error("Còn thay đổi, thao tác lưu hoặc tải tư liệu chưa hoàn tất. Hãy chờ xong rồi kiểm tra lại trước khi xuất bản.");
      return contentService.publishStory({ storyId, revision: storyQuery.data?.revision });
    },
    scope: { id: storyMutationScope },
    meta: { contentOperation: "publish" },
    retry: false,
    onSuccess: async (story) => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), story);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stories", user.id] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) }),
      ]);
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
  const localOnlyChanges = featureApiModes.content === "real" ? story.localOnlyChanges : null;
  const hasLocalOnlyChanges = Boolean(localOnlyChanges?.hasChanges);
  const hasUnverifiedComposition = featureApiModes.content === "real" && Boolean(story.hasUnverifiedComposition);
  const visibleValidation = validation?.revision !== undefined && validation.revision !== story.revision ? null : validation;
  const actionError = publishMutation.error || hideMutation.error;
  const mutationOutcomeBlocked = [publishMutation, hideMutation].some(({ error }) => error?.mutationAccepted || error?.mutationOutcomeUnknown);
  const publishStatusBlocked = !["draft", "pending", "published", "archived"].includes(story.status);
  const busy = publishMutation.isPending || hideMutation.isPending || publishConfirming;

  async function publish() {
    if (publishAttemptRef.current || publishMutation.isPending || mutationOutcomeBlocked) return;
    if (hasLocalOnlyChanges) return setValidation({ type: "error", message: "Một số thay đổi mới chỉ được lưu trên thiết bị, chưa đồng bộ lên máy chủ. Cần đồng bộ đầy đủ trước khi xuất bản." });
    if (hasUnverifiedComposition) return setValidation({ type: "error", message: "Có trang chứa bố cục lỗi, tham chiếu không hợp lệ hoặc chưa tải đủ vị trí nhân vật. Hãy xử lý các trang đó trước khi xuất bản." });
    if (editorDirty || isContentEditorDirty() || hasPendingStoryWork()) return setValidation({ type: "error", message: "Hãy chờ thao tác lưu/tải lên hoàn tất và lưu mọi thay đổi trước khi xuất bản." });
    if (publishStatusBlocked) return setValidation({ type: "error", message: "Trạng thái truyện hiện tại không được xuất bản. Chỉ Draft, Pending, Active hoặc Archived được chuyển qua luồng publish." });
    publishAttemptRef.current = true;
    setPublishConfirming(true);
    let keepAttemptBlocked = false;
    try {
      const approved = await confirmToast({ title: "Xuất bản truyện?", message: "Truyện sẽ hiển thị với người đọc sau khi xuất bản.", confirmLabel: "Xuất bản" });
      if (!approved) return;
      if (isContentEditorDirty() || hasPendingStoryWork()) {
        setValidation({ type: "error", message: "Có thay đổi, thao tác lưu hoặc tải tư liệu phát sinh trong lúc xác nhận. Chưa gửi lệnh xuất bản; hãy lưu xong rồi thử lại." });
        return;
      }
      await publishMutation.mutateAsync();
    } catch (error) {
      keepAttemptBlocked = Boolean(error?.mutationAccepted || error?.mutationOutcomeUnknown);
    } finally {
      setPublishConfirming(false);
      if (keepAttemptBlocked) publishAttemptRef.current = true;
      else publishAttemptRef.current = false;
    }
  }

  async function hide() {
    if (mutationOutcomeBlocked) return;
    if (hasLocalOnlyChanges) return setValidation({ type: "error", message: "Hãy đồng bộ hoặc bỏ thay đổi chỉ lưu trên thiết bị trước khi ẩn truyện." });
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi ẩn truyện." });
    if (await confirmToast({ title: "Ẩn truyện?", message: `Ẩn “${story.title}” khỏi danh mục truyện?`, confirmLabel: "Ẩn truyện", tone: "danger" }) && !isContentEditorDirty()) hideMutation.mutate();
  }

  function downloadLocalBackup() {
    const backup = {
      exportedAt: new Date().toISOString(),
      storyId,
      note: "Bản sao chỉ chứa dữ liệu chỉnh sửa local và ID asset. File nhị phân asset lưu trong IndexedDB không được đính kèm.",
      overlay: readContentMockOverlay(user.id, storyId),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `story-${storyId}-local-changes.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function discardLocalChanges() {
    if (!await confirmToast({
      title: "Bỏ thay đổi chỉ lưu trên thiết bị?",
      message: "Thao tác này xóa overlay chỉnh sửa local của truyện khỏi trình duyệt. File asset trong thư viện không bị xóa.",
      confirmLabel: "Bỏ thay đổi local",
      tone: "danger",
    })) return;
    try {
      clearContentMockOverlay(user.id, storyId);
      setValidation({ type: "success", message: "Đã bỏ các thay đổi chỉ lưu trên thiết bị. Dữ liệu backend đang được tải lại." });
      await queryClient.invalidateQueries({ queryKey: queryKeys.story(user.id, storyId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) });
    } catch {
      setValidation({ type: "error", message: "Không thể xóa thay đổi local khỏi trình duyệt. Dữ liệu chưa bị thay đổi." });
    }
  }

  return <section className={`story-editor-shell${isStudio ? " story-editor-shell-studio" : ""}`}>
    <div className="story-editor-back"><Link className="workspace-button workspace-button-quiet story-editor-back-button" to="/content/stories"><ArrowLeft size={16} aria-hidden="true" /> Quay lại kho truyện</Link></div>
    <header className="story-editor-header">
      <div>
        <p className="workspace-eyebrow">CHỈNH SỬA TRUYỆN</p>
        <div className="story-editor-title-row"><h1>{story.title}</h1><StatusBadge value={story.status} tone={story.status === "published" ? "success" : story.status === "hidden" ? "danger" : story.status === "unknown" ? "neutral" : "gold"} /></div>
        <div className="story-editor-meta">
          <span>{story.pages.length} trang · {story.roles.length} nhân vật</span>
          {story.versionHistoryAvailable !== false && <span>{story.versions.length} phiên bản đã xuất bản</span>}
          {story.draftDirty && !editorDirty && <span className="story-draft-chip">Bản nháp có thay đổi chưa xuất bản</span>}
          {(!hasLocalOnlyChanges || busy || actionError || editorDirty) && <span className={`story-editor-save-status${actionError ? " story-editor-save-status-error" : editorDirty || hasLocalOnlyChanges ? " story-editor-save-status-dirty" : ""}`} role="status" aria-live="polite"><FloppyDisk size={15} aria-hidden="true" /> {busy ? "Đang xử lý..." : actionError ? "Cần xử lý lỗi" : editorDirty ? "Chưa lưu thay đổi" : "Bản nháp đã lưu"}</span>}
        </div>
      </div>
      <div className="story-editor-actions">
        <button className="workspace-button" type="button" onClick={publish} disabled={busy || mutationOutcomeBlocked || editorDirty || hasPendingContentWork || hasLocalOnlyChanges || hasUnverifiedComposition || publishStatusBlocked} title={hasLocalOnlyChanges ? "Có thay đổi chỉ lưu trên thiết bị." : hasUnverifiedComposition ? "Có bố cục hoặc tham chiếu cần xử lý." : mutationOutcomeBlocked ? "Tải lại truyện để kiểm tra trạng thái thao tác trước khi tiếp tục." : publishStatusBlocked ? "Trạng thái hiện tại không được xuất bản." : hasPendingContentWork ? "Chờ lưu và tải tư liệu hoàn tất." : undefined}><Rocket size={17} aria-hidden="true" /> {publishMutation.isPending ? "Đang xuất bản..." : publishConfirming ? "Đang xác nhận..." : "Xuất bản"}</button>
        {(story.status === "published" || hasLocalOnlyChanges) && <details className="story-editor-more"><summary aria-label="Thao tác khác" title="Thao tác khác"><DotsThree size={23} aria-hidden="true" /></summary><div>{story.status === "published" && <><button className="workspace-button workspace-button-danger" type="button" onClick={hide} disabled={busy || editorDirty || hasLocalOnlyChanges || mutationOutcomeBlocked}><EyeSlash size={17} aria-hidden="true" /> Ẩn truyện</button><small>Gỡ truyện khỏi danh mục của người đọc.</small></>}{hasLocalOnlyChanges && <><button className="workspace-button workspace-button-quiet" type="button" onClick={downloadLocalBackup}>Tải bản sao JSON</button><button className="workspace-button workspace-button-danger" type="button" onClick={discardLocalChanges}>Bỏ thay đổi local</button><small>Bản sao JSON không đính kèm file ảnh hoặc âm thanh.</small></>}</div></details>}
      </div>
    </header>
    {story.status === "unknown" && <p className="editor-help" role="status">Truyện chưa thể xuất bản lúc này. Vui lòng thử lại sau.</p>}
    {publishStatusBlocked && story.status !== "unknown" && <p className="editor-help" role="status">Truyện Inactive không thể xuất bản. Truyện Pending/Archived có thể chuyển Active, nếu toàn bộ trang, vai, vị trí nhân vật và câu hỏi cần đọc đang Draft hoặc Active.</p>}
    <nav className="story-editor-tabs" aria-label="Các phần chỉnh sửa truyện">{tabs.map(([suffix, label]) => {
      const count = ({ "/pages": story.pages.length, "/roles": story.roles.length, "/vocabulary": story.vocabulary?.length, "/quizzes": story.quizzes?.length })[suffix];
      return <NavLink key={suffix} to={`/content/stories/${storyId}${suffix}`} end={!suffix}>{label}{count !== undefined && <span className="story-tab-count" aria-label={`${count} mục`}>{count}</span>}</NavLink>;
    })}</nav>
    {visibleValidation && !(hasLocalOnlyChanges && visibleValidation.message.includes("chỉ được lưu trên thiết bị")) && <div className={`story-action-message ${visibleValidation.type === "error" ? "story-action-error" : "story-action-success"}`} role="status">{visibleValidation.type === "error" ? <WarningCircle size={17} aria-hidden="true" /> : <CheckCircle size={17} aria-hidden="true" />} {visibleValidation.message}{visibleValidation.type === "error" && <DismissButton onClick={() => setValidation(null)} />}</div>}
    <PublishIssues error={actionError} />
    <div inert={publishMutation.isPending}>
      <Outlet context={{ story, assets: [], queryKey: queryKeys.story(user.id, storyId), setEditorDirty, refetchStory: storyQuery.refetch, onPublish: publish, isPublishing: publishMutation.isPending, publishError: actionError, validation: visibleValidation }} />
    </div>
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
