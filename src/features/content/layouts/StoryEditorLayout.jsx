import { useState } from "react";
import { ArrowLeft, CheckCircle, EyeSlash, Rocket } from "@phosphor-icons/react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import PublishIssues from "../components/PublishIssues";

const tabs = [["", "Metadata"], ["/pages", "Pages"], ["/roles", "Roles / Slots"], ["/vocabulary", "Vocabulary"], ["/quizzes", "Quiz"], ["/preview", "Preview"]];

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
  const queryClient = useQueryClient();
  const [validation, setValidation] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const storyQuery = useQuery({ queryKey: queryKeys.story(user.id, storyId), queryFn: ({ signal }) => contentService.getEditor({ storyId, signal }) });
  const validateMutation = useMutation({
    mutationFn: () => contentService.validateStory({ storyId, revision: storyQuery.data?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (result) => setValidation({ type: "success", message: result.message }),
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
      setValidation({ type: "success", message: `Đã publish version ${story.versions.at(-1)?.version || "mới"}.` });
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
      setValidation({ type: "success", message: "Story đã được ẩn khỏi catalog." });
    },
    onError: () => setValidation(null),
  });

  if (storyQuery.isLoading) return <LoadingState label="Đang mở story editor" />;
  if (storyQuery.isError) return <ErrorState title="Không thể mở story" message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />;

  const story = storyQuery.data;
  const actionError = validateMutation.error || publishMutation.error || hideMutation.error;
  const busy = validateMutation.isPending || publishMutation.isPending || hideMutation.isPending;

  function validate() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi metadata trước khi kiểm tra." });
    validateMutation.mutate();
  }

  function publish() {
    if (editorDirty) return setValidation({ type: "error", message: "Hãy lưu thay đổi trước khi publish." });
    if (window.confirm("Publish story sẽ tạo version mới từ draft hiện tại. Tiếp tục?")) publishMutation.mutate();
  }

  return <section className="story-editor-shell"><div className="story-editor-back"><GuardedLink dirty={editorDirty} to="/content/stories"><ArrowLeft size={17} aria-hidden="true" /> Quay lại kho truyện</GuardedLink></div><header className="story-editor-header"><div><p className="workspace-eyebrow">CONTENT / STORY EDITOR</p><div className="story-editor-title-row"><h1>{story.title}</h1><StatusBadge value={story.status} tone={story.status === "published" ? "success" : story.status === "hidden" ? "danger" : "gold"} /></div><p>Revision {story.revision} · {story.pages.length} pages · {story.roles.length} roles · draft và version publish được quản lý tách biệt.</p><div className="story-editor-meta"><span>{story.versions.length} published version</span>{story.draftDirty && <span className="story-draft-chip">Draft có thay đổi chưa publish</span>}{editorDirty && <span className="story-draft-chip">Form có thay đổi chưa lưu</span>}</div></div><div className="story-editor-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={validate} disabled={busy || editorDirty}><CheckCircle size={17} aria-hidden="true" /> Kiểm tra</button><button className="workspace-button" type="button" onClick={publish} disabled={busy || editorDirty}><Rocket size={17} aria-hidden="true" /> {publishMutation.isPending ? "Đang publish..." : "Publish version"}</button>{story.status === "published" && <button className="workspace-button workspace-button-danger" type="button" onClick={() => hideMutation.mutate()} disabled={busy || editorDirty}><EyeSlash size={17} aria-hidden="true" /> Ẩn story</button>}</div></header><nav className="story-editor-tabs" aria-label="Các phần của story editor">{tabs.map(([suffix, label]) => <GuardedNavLink dirty={editorDirty} key={suffix} to={`/content/stories/${storyId}${suffix}`} end={!suffix}>{label}</GuardedNavLink>)}</nav>{validation && <div className={`story-action-message ${validation.type === "error" ? "story-action-error" : "story-action-success"}`} role="status"><CheckCircle size={17} aria-hidden="true" /> {validation.message}</div>}<PublishIssues error={actionError} /><Outlet context={{ story, assets: [], queryKey: queryKeys.story(user.id, storyId), setEditorDirty }} /></section>;
}
