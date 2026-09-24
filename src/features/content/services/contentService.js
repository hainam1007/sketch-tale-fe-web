import { apiRequest } from "../../../lib/api/httpClient";
import { deleteAsset, listAssets, uploadAsset } from "./assetService";

function revisionBody(payload, revision) {
  return revision === undefined ? payload : { ...payload, revision };
}

export const contentService = {
  listStories: ({ search = "", status = "all", category = "all", sort = "updated_desc", page = 1, pageSize = 10, signal } = {}) => {
    const params = new URLSearchParams({ search, status, category, sort, page: String(page), pageSize: String(pageSize) });
    return apiRequest({ path: `/content/stories?${params}`, signal });
  },
  listCategories: ({ signal } = {}) => apiRequest({ path: "/content/catalog/categories", signal }),
  getStory: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}`, signal }),
  createStory: (payload) => apiRequest({ path: "/content/stories", method: "POST", body: payload }),
  updateStory: ({ storyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  getEditor: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}`, signal }),
  listPages: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}/pages`, signal }),
  addPage: ({ storyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/pages`, method: "POST", body: revisionBody(payload, revision) }),
  updatePage: ({ storyId, pageId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deletePage: ({ storyId, pageId, revision }) => apiRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "DELETE", body: revisionBody({}, revision) }),
  reorderPages: ({ storyId, pageIds, revision }) => apiRequest({ path: `/content/stories/${storyId}/pages/reorder`, method: "PATCH", body: revisionBody({ pageIds }, revision) }),
  listRoles: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}/roles`, signal }),
  addRole: ({ storyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/roles`, method: "POST", body: revisionBody(payload, revision) }),
  updateRole: ({ storyId, roleId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteRole: ({ storyId, roleId, revision }) => apiRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "DELETE", body: revisionBody({}, revision) }),
  addSlot: ({ storyId, roleId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots`, method: "POST", body: revisionBody(payload, revision) }),
  updateSlot: ({ storyId, roleId, slotId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteSlot: ({ storyId, roleId, slotId, revision }) => apiRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "DELETE", body: revisionBody({}, revision) }),
  listVocabulary: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}/vocabulary`, signal }),
  addVocabulary: ({ storyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/vocabulary`, method: "POST", body: revisionBody(payload, revision) }),
  updateVocabulary: ({ storyId, vocabularyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteVocabulary: ({ storyId, vocabularyId, revision }) => apiRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "DELETE", body: revisionBody({}, revision) }),
  listQuizzes: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}/quizzes`, signal }),
  addQuiz: ({ storyId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/quizzes`, method: "POST", body: revisionBody(payload, revision) }),
  updateQuiz: ({ storyId, quizId, revision, ...payload }) => apiRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteQuiz: ({ storyId, quizId, revision }) => apiRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "DELETE", body: revisionBody({}, revision) }),
  previewStory: ({ storyId, signal }) => apiRequest({ path: `/content/stories/${storyId}/preview`, signal }),
  validateStory: ({ storyId, revision }) => apiRequest({ path: `/content/stories/${storyId}/validate`, method: "POST", body: revisionBody({}, revision) }),
  publishStory: ({ storyId, revision }) => apiRequest({ path: `/content/stories/${storyId}/publish`, method: "POST", body: { revision } }),
  hideStory: ({ storyId, revision }) => apiRequest({ path: `/content/stories/${storyId}/hide`, method: "POST", body: { revision } }),
  listAssets,
  getStatistics: ({ range = "7d", signal } = {}) => apiRequest({ path: `/content/statistics?range=${range}`, signal }),
  uploadAsset,
  deleteAsset,
};
