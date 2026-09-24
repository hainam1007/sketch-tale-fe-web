import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { useOutletContext, useParams } from "react-router-dom";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";

export function useStoryEditorData() {
  const { story, queryKey, setEditorDirty } = useOutletContext();
  const { storyId } = useParams();
  return { story, storyId, queryKey, setEditorDirty };
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
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.assets(user.id),
    queryFn: ({ signal }) => contentService.listAssets({ signal }),
    staleTime: 60_000,
  });
}
