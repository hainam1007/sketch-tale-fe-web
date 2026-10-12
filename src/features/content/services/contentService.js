import { featureApiModes, featureApiRequest } from "../../../lib/api/featureApi";
import { deleteAsset, listAssets, uploadAsset } from "./assetService";

const contentRequest = (options) => featureApiRequest("content", options);

const backendStoryStatuses = ["draft", "published", "hidden"];

function normalizeBackendStory(story) {
  const rawStatus = story.status;
  const stringStatus = String(rawStatus ?? "").toLowerCase();
  const status = ["draft", "published", "hidden"].includes(stringStatus)
    ? stringStatus
    : stringStatus === "active"
      ? "published"
      : stringStatus === "inactive"
        ? "hidden"
        : backendStoryStatuses[Number(rawStatus)] || "draft";

  return {
    ...story,
    id: story.id,
    title: story.title || "",
    description: story.description || "",
    categoryId: story.educationThemeId || "",
    category: story.educationThemeName || "",
    coverAssetId: null,
    coverImageUrl: story.coverImageUrl || "",
    pagesCount: Number(story.totalPageNumbers) || 0,
    updatedAt: story.updatedAt || story.createdAt,
    status,
  };
}

async function listBackendStories({ search, status, category, sort, page, pageSize, signal }) {
  const response = await contentRequest({ path: "/story-template/getallstories", signal });
  const rows = Array.isArray(response) ? response : response?.items || [];
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = rows
    .map(normalizeBackendStory)
    .filter((story) => !normalizedSearch || `${story.title} ${story.description}`.toLowerCase().includes(normalizedSearch))
    .filter((story) => status === "all" || story.status === status)
    .filter((story) => category === "all" || story.categoryId === category)
    .sort((left, right) => {
      if (sort === "title_asc") return left.title.localeCompare(right.title);
      if (sort === "title_desc") return right.title.localeCompare(left.title);
      if (sort === "status_asc") return left.status.localeCompare(right.status);
      return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
    });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function getBackendStatistics(signal) {
  const response = await contentRequest({ path: "/story-template/getallstories", signal });
  const rows = (Array.isArray(response) ? response : response?.items || []).map(normalizeBackendStory);
  return {
    summary: {
      publishedStories: rows.filter((story) => story.status === "published").length,
      draftStories: rows.filter((story) => story.status === "draft").length,
    },
    trend: [],
    topStories: [],
    errors: [{ section: "analytics", message: "Backend hiện chưa cung cấp API lượt đọc, người đọc hoạt động hoặc xu hướng theo ngày; các số liệu đó chưa thể hiển thị." }],
  };
}

function revisionBody(payload, revision) {
  return revision === undefined ? payload : { ...payload, revision };
}

export const contentService = {
  listStories: ({ search = "", status = "all", category = "all", sort = "updated_desc", page = 1, pageSize = 10, signal } = {}) => {
    if (featureApiModes.content === "real") {
      return listBackendStories({ search, status, category, sort, page, pageSize, signal });
    }
    const params = new URLSearchParams({ search, status, category, sort, page: String(page), pageSize: String(pageSize) });
    return contentRequest({ path: `/content/stories?${params}`, signal });
  },
  listCategories: async ({ signal } = {}) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: "/content/catalog/categories", signal });
    const response = await contentRequest({ path: "/education-themes", signal });
    const rows = Array.isArray(response) ? response : response?.items || [];
    return { items: rows.map((theme) => ({ id: theme.id, label: theme.name || "Chưa đặt tên" })) };
  },
  getStory: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}`, signal }),
  createStory: (payload) => contentRequest({ path: "/content/stories", method: "POST", body: payload }),
  updateStory: ({ storyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  getEditor: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}`, signal }),
  listPages: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}/pages`, signal }),
  addPage: ({ storyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/pages`, method: "POST", body: revisionBody(payload, revision) }),
  updatePage: ({ storyId, pageId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deletePage: ({ storyId, pageId, revision }) => contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "DELETE", body: revisionBody({}, revision) }),
  reorderPages: ({ storyId, pageIds, revision }) => contentRequest({ path: `/content/stories/${storyId}/pages/reorder`, method: "PATCH", body: revisionBody({ pageIds }, revision) }),
  listRoles: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}/roles`, signal }),
  addRole: ({ storyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/roles`, method: "POST", body: revisionBody(payload, revision) }),
  updateRole: ({ storyId, roleId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteRole: ({ storyId, roleId, revision }) => contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "DELETE", body: revisionBody({}, revision) }),
  addSlot: ({ storyId, roleId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots`, method: "POST", body: revisionBody(payload, revision) }),
  updateSlot: ({ storyId, roleId, slotId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteSlot: ({ storyId, roleId, slotId, revision }) => contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "DELETE", body: revisionBody({}, revision) }),
  listVocabulary: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}/vocabulary`, signal }),
  addVocabulary: ({ storyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/vocabulary`, method: "POST", body: revisionBody(payload, revision) }),
  updateVocabulary: ({ storyId, vocabularyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteVocabulary: ({ storyId, vocabularyId, revision }) => contentRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "DELETE", body: revisionBody({}, revision) }),
  listQuizzes: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}/quizzes`, signal }),
  addQuiz: ({ storyId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/quizzes`, method: "POST", body: revisionBody(payload, revision) }),
  updateQuiz: ({ storyId, quizId, revision, ...payload }) => contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "PATCH", body: revisionBody(payload, revision) }),
  deleteQuiz: ({ storyId, quizId, revision }) => contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "DELETE", body: revisionBody({}, revision) }),
  previewStory: ({ storyId, signal }) => contentRequest({ path: `/content/stories/${storyId}/preview`, signal }),
  validateStory: ({ storyId, revision }) => contentRequest({ path: `/content/stories/${storyId}/validate`, method: "POST", body: revisionBody({}, revision) }),
  publishStory: ({ storyId, revision }) => contentRequest({ path: `/content/stories/${storyId}/publish`, method: "POST", body: { revision } }),
  hideStory: ({ storyId, revision }) => contentRequest({ path: `/content/stories/${storyId}/hide`, method: "POST", body: { revision } }),
  listAssets,
  getStatistics: ({ range = "7d", signal } = {}) => featureApiModes.content === "real"
    ? getBackendStatistics(signal)
    : contentRequest({ path: `/content/statistics?range=${range}`, signal }),
  uploadAsset,
  deleteAsset,
};
