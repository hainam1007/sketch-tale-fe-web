import { FloppyDisk } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StoryForm from "../components/StoryForm";

export default function StoryMetadataPage() {
  const { user } = useAuth();
  const { storyId } = useParams();
  const { story, setEditorDirty } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: () => contentService.listAssets() });
  const categoriesQuery = useQuery({ queryKey: queryKeys.contentCategories(user.id), queryFn: () => contentService.listCategories(), staleTime: 300_000 });
  const mutation = useMutation({
    mutationFn: (payload) => contentService.updateStory({ storyId, revision: story.revision, ...payload }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), updated);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) });
    },
  });
  if (assetsQuery.isLoading || categoriesQuery.isLoading) return <LoadingState label="Đang tải asset cover" />;
  if (assetsQuery.isError) return <ErrorState title="Không thể tải asset cover" message={assetsQuery.error.message} onRetry={() => assetsQuery.refetch()} />;
  if (categoriesQuery.isError) return <ErrorState title="Không thể tải category" message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />;
  return <div className="story-editor-panel"><div className="story-editor-panel-heading"><div><p className="workspace-eyebrow">METADATA</p><h2>Thông tin story</h2><p>Thay đổi metadata chỉ cập nhật draft hiện tại; version đã publish vẫn giữ snapshot.</p></div>{mutation.isSuccess && <span className="story-save-state"><FloppyDisk size={16} aria-hidden="true" /> Đã lưu</span>}</div><StoryForm assets={assetsQuery.data.items} categories={categoriesQuery.data.items} initialValues={{ title: story.title, description: story.description, category: story.category, coverAssetId: story.coverAssetId || "" }} isSaving={mutation.isPending} serverError={mutation.error} onSubmit={mutation.mutate} onDirtyChange={setEditorDirty} onCancel={() => navigate("/content/stories")} /></div>;
}

