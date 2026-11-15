import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import StoryForm from "../components/StoryForm";
import { featureApiModes } from "../../../lib/api/featureApi";

export default function StoryMetadataPage() {
  const { user } = useAuth();
  const { storyId } = useParams();
  const { story, setEditorDirty } = useOutletContext();
  const [formVersion, setFormVersion] = useState(0);
  const reportDirty = useCallback((dirty) => { setEditorDirty(dirty); }, [setEditorDirty]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }) });
  const categoriesQuery = useQuery({ queryKey: queryKeys.contentCategories(user.id), queryFn: () => contentService.listCategories(), staleTime: 300_000 });
  const mutation = useMutation({
    mutationFn: (payload) => contentService.updateStory({ storyId, revision: story.revision, ...payload }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.story(user.id, storyId), updated);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) });
      setFormVersion((current) => current + 1);
    },
  });
  return <div className="story-editor-panel"><div className="story-editor-panel-heading"><div><h2>Thông tin truyện</h2><p>Cập nhật tên, mô tả, danh mục và ảnh bìa của truyện.</p></div></div><StoryForm navigationGuarded key={formVersion} assets={assetsQuery.data?.items} assetsLoading={assetsQuery.isLoading} assetsError={assetsQuery.error?.message} categories={categoriesQuery.data?.items || []} categoriesLoading={categoriesQuery.isLoading} categoriesError={categoriesQuery.error?.message} onRetryCategories={() => categoriesQuery.refetch()} initialValues={{ title: story.title, description: story.description, category: story.categoryId || story.category, coverAssetId: story.coverAssetId || "", coverImageUrl: story.coverImageUrl || "", ageGroup: story.ageGroup, status: featureApiModes.content === "real" ? story.backendStatus : story.status }} isSaving={mutation.isPending} serverError={mutation.error} onSubmit={mutation.mutate} onDirtyChange={reportDirty} onCancel={() => navigate(`/content/stories/${storyId}/pages`)} /></div>;
}

