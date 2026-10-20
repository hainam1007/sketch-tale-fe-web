import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StoryForm from "../components/StoryForm";

export default function StoryEditorPage({ mode = "edit" }) {
  const { user } = useAuth();
  const { storyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = mode === "new";
  const storyQuery = useQuery({ queryKey: queryKeys.story(user.id, storyId || "new"), queryFn: () => contentService.getStory({ storyId }), enabled: !isNew });
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }) });
  const categoriesQuery = useQuery({ queryKey: queryKeys.contentCategories(user.id), queryFn: () => contentService.listCategories(), staleTime: 300_000 });
  const mutation = useMutation({ mutationFn: (payload) => isNew ? contentService.createStory(payload) : contentService.updateStory({ storyId, ...payload }), onSuccess: async (story) => { queryClient.setQueryData(queryKeys.story(user.id, story.id), story); await queryClient.invalidateQueries({ queryKey: ["stories", user.id] }); navigate(`/content/stories/${story.id}/pages`); } });
  if (storyQuery.isLoading || categoriesQuery.isLoading) return <LoadingState label="Đang mở story editor" />;
  if (storyQuery.isError) return <ErrorState title="Không thể mở story" message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />;
  if (categoriesQuery.isError) return <ErrorState title="Không thể tải category" message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />;
  const story = storyQuery.data;
  const initialValues = story ? { title: story.title, description: story.description, category: story.categoryId || story.category, coverAssetId: story.coverAssetId || "", coverImageUrl: story.coverImageUrl || "", ageGroup: story.ageGroup, status: story.backendStatus } : undefined;
  return <div className="workspace-dashboard content-editor-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">NỘI DUNG / {isNew ? "TRUYỆN MỚI" : "CHỈNH SỬA TRUYỆN"}</p><h1>{isNew ? "Tạo truyện mới" : story.title}</h1><p>{isNew ? "Bắt đầu với thông tin truyện và ảnh bìa. Bạn có thể thêm trang và nhân vật sau." : "Cập nhật thông tin và tiếp tục hoàn thiện câu chuyện."}</p></div></div><StoryForm assets={assetsQuery.data?.items} assetsLoading={assetsQuery.isLoading} assetsError={assetsQuery.error?.message} categories={categoriesQuery.data.items} initialValues={initialValues} isSaving={mutation.isPending} serverError={mutation.error} onSubmit={mutation.mutate} onCancel={() => navigate("/content/stories")} /></div>;
}

