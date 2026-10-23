import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { useOutletContext, useParams } from "react-router-dom";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { featureApiModes } from "../../../lib/api/featureApi";

export function useStoryEditorData() {
  const context = useOutletContext();
  const { story, queryKey, setEditorDirty } = context || {};
  const { storyId } = useParams();
  return { ...context, story, storyId, queryKey, setEditorDirty };
}

export function useStoryEditorMutation(mutationFn) {
  const { user } = useAuth();
  const { storyId, queryKey } = useStoryEditorData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => mutationFn({ ...variables, revision: variables.revision ?? queryClient.getQueryData(queryKey)?.revision }),
    scope: { id: `content-story-${storyId}` },
    retry: false,
    onSuccess: (nextStory) => {
      queryClient.setQueryData(queryKey, nextStory);
      queryClient.invalidateQueries({ queryKey: ["stories", user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.storyPreview(user.id, storyId) });
    },
  });
}

export function useContentAssets() {
  const { story } = useStoryEditorData();
  const { user } = useAuth();
  const assetsQuery = useQuery({
    queryKey: queryKeys.assets(user.id),
    queryFn: ({ signal }) => contentService.listAssets({ signal }),
    staleTime: 60_000,
  });
  const realAssets = useMemo(() => {
    const items = [];
    if (story?.coverImageUrl) items.push({ id: story.coverAssetId || `story-cover:${story.id}`, name: `${story.title || "Truyện"} · Ảnh bìa`, kind: "image", mimeType: "image/*", size: 0, url: story.coverImageUrl, readOnly: true });
    for (const page of story?.pages || []) {
      if (page.backgroundUrl) items.push({ id: page.backgroundAssetId || `page-background:${page.id}`, name: `${story.title || "Truyện"} · Trang ${page.order} · Ảnh nền`, kind: "image", mimeType: "image/*", size: 0, url: page.backgroundUrl, readOnly: true });
      if (page.audioNarrationUrl) items.push({ id: `page-audio:${page.id}`, name: `${story.title || "Truyện"} · Trang ${page.order} · Lời kể`, kind: "audio", mimeType: "audio/*", size: 0, url: page.audioNarrationUrl, readOnly: true });
    }
    const mockAssets = (assetsQuery.data?.items || []).filter((asset) => asset.source === "mock");
    const mockImageAssets = mockAssets.filter((asset) => asset.kind === "image" && asset.url);
    for (const role of story?.roles || []) {
      if (!role.defaultAssetUrl) continue;
      const roleName = (role.name || "").trim().toLocaleLowerCase();
      const matchingPoses = roleName ? mockImageAssets.filter((asset) => asset.name.toLocaleLowerCase().includes(roleName)) : [];
      const fallback = matchingPoses.find((asset) => /stand|front|đứng|thẳng/i.test(`${asset.id} ${asset.name}`)) || matchingPoses[0];
      items.push({
        id: role.defaultAssetId || `role-default:${role.id}`,
        name: `${story.title || "Truyện"} · ${role.name || "Nhân vật"}`,
        kind: "image",
        mimeType: "image/*",
        size: 0,
        url: role.defaultAssetUrl,
        ...(fallback ? { fallbackUrl: fallback.url, fallbackName: fallback.name } : {}),
        readOnly: true,
      });
    }
    items.push(...mockAssets);
    return [...new Map(items.map((asset) => [asset.id, asset])).values()];
  }, [assetsQuery.data?.items, story]);
  if (featureApiModes.content !== "real") return assetsQuery;
  return {
    ...assetsQuery,
    data: { items: realAssets, total: realAssets.length, page: 1, pageSize: realAssets.length || 1, totalPages: 1 },
    isLoading: assetsQuery.isLoading,
    isError: assetsQuery.isError,
    error: assetsQuery.error,
  };
}
