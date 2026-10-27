import { featureApiModes, featureApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";
import { SESSION_KEY } from "../../../mocks/mockServer";
import { deleteAsset, listAssets, uploadAsset } from "./assetService";
import { mergeContentMockOverlay, mergeMockStoryDraft, removeMockSlot, removeMockQuizDraft, saveMockPageOrder, saveMockQuizDraft, saveMockSlotDraft, saveMockStoryDraft } from "./contentMockOverlay";
import { normalizeStory } from "../models";

const contentRequest = (options) => featureApiRequest("content", options);

function activeUserId() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return session?.userId || session?.user?.id || "unknown";
  } catch {
    return "unknown";
  }
}

function isBackendUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function requireBackendUserId() {
  const userId = activeUserId();
  if (!isBackendUuid(userId)) {
    throw new ApiError({ status: 401, code: "CONTENT_SLOT_USER_ID_UNAVAILABLE", message: "Không thể lưu vị trí nhân vật vì phiên đăng nhập chưa có User ID hợp lệ. Hãy đăng nhập lại." });
  }
  return userId;
}

function normalizeBackendStory(story) {
  const status = ({ 0: "draft", 1: "pending", 2: "published", 3: "hidden", 4: "archived" })[story.status]
    || ({ draft: "draft", pending: "pending", active: "published", published: "published", inactive: "hidden", hidden: "hidden", archived: "archived" })[String(story.status).toLowerCase()]
    || "unknown";

  return mergeMockStoryDraft({
    ...story,
    id: story.id,
    title: story.title || "",
    description: story.description || "",
    categoryId: story.educationThemeId || "",
    category: story.educationThemeName || "",
    backendStatus: story.status,
    ageGroup: story.ageGroup,
    coverAssetId: null,
    coverImageUrl: story.coverImageUrl || "",
    pagesCount: Number(story.totalPageNumbers) || 0,
    updatedAt: story.updatedAt || story.createdAt,
    status,
  }, activeUserId(), story.id);
}

function responseRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  throw new ApiError({
    status: 502,
    code: "CONTENT_RESPONSE_SHAPE_INVALID",
    message: "Không thể đọc dữ liệu truyện. Hãy tải lại hoặc liên hệ nhóm hỗ trợ.",
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

function backendFormData(fields) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(name, String(value));
  }
  return form;
}

function backendStoryFormData(payload, { creating = false } = {}) {
  if (payload.ageGroup == null) {
    throw new ApiError({
      status: 501,
      code: "CONTENT_STORY_ENUM_UNCONFIRMED",
      message: "Hãy chọn nhóm tuổi trước khi lưu truyện.",
    });
  }
  const fields = {
    EducationThemeId: payload.category,
    Title: payload.title,
    Description: payload.description,
    AgeGroup: payload.ageGroup,
  };
  if (!creating && payload.status != null) {
    const status = ({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, draft: 0, pending: 1, active: 2, published: 2, inactive: 3, hidden: 3, archived: 4 })[String(payload.status).toLowerCase()];
    if (status === undefined) {
      throw new ApiError({ status: 501, code: "CONTENT_STORY_STATUS_UNAVAILABLE", message: "Trạng thái truyện hiện tại chưa được ánh xạ sang CommonStatus. Không có dữ liệu nào được gửi." });
    }
    fields.Status = status;
  }
  const form = backendFormData(fields);
  if (payload.coverFile instanceof Blob) {
    form.append("file", payload.coverFile, payload.coverFile.name || "cover-image");
  }
  return form;
}

function backendPageFormData(payload, { creating = false } = {}) {
  const rawText = String(payload.text ?? payload.rawText ?? "");
  if (!rawText.trim()) {
    throw new ApiError({
      status: 422,
      code: "CONTENT_PAGE_RAW_TEXT_REQUIRED",
      message: "Nhập nội dung cho trang rồi lưu lại.",
    });
  }
  if (!creating && payload.status == null) {
    throw new ApiError({
      status: 501,
      code: "CONTENT_PAGE_STATUS_UNAVAILABLE",
      message: "Chưa thể lưu trang này lúc này. Hãy tải lại truyện rồi thử lại.",
    });
  }
  const fields = {
    RawText: rawText,
  };
  if (!creating) fields.Status = payload.status;
  const form = backendFormData(fields);
  if (payload.backgroundFile instanceof Blob) form.append("file", payload.backgroundFile, payload.backgroundFile.name || "background-image");
  if (payload.audioFile instanceof Blob) form.append("audioFile", payload.audioFile, payload.audioFile.name || "page-audio");
  return form;
}

function backendRoleFormData(payload, { creating = false } = {}) {
  if (payload.storyRoleType == null) {
    throw new ApiError({
      status: 501,
      code: "CONTENT_ROLE_ENUM_UNAVAILABLE",
      message: "Chọn loại nhân vật trước khi lưu.",
    });
  }
  const fields = {
    StoryRoleType: payload.storyRoleType,
    RoleName: payload.name ?? payload.roleName,
    Description: payload.description,
    AllowCustomCharacter: Boolean(payload.custom ?? payload.allowCustomCharacter),
    RequiresParentApproval: Boolean(payload.sensitive ?? payload.requiresParentApproval),
  };
  if (!creating && payload.status != null) fields.Status = payload.status;
  if (payload.defaultAssetUrl) fields.DefaultAssetUrl = payload.defaultAssetUrl;
  const form = backendFormData(fields);
  if (payload.defaultAssetFile instanceof Blob) form.append("file", payload.defaultAssetFile, payload.defaultAssetFile.name || "role-image");
  return form;
}

async function mutateBackendStoryAndRefresh(storyId, performMutation, { decorate } = {}) {
  let result;
  try {
    result = await performMutation();
  } catch (error) {
    const localContractBlock = ["CONTENT_OPERATION_NOT_SUPPORTED", "CONTENT_STORY_ENUM_UNCONFIRMED", "CONTENT_PAGE_STATUS_UNAVAILABLE", "CONTENT_ROLE_ENUM_UNAVAILABLE", "CONTENT_SLOT_STATUS_UNAVAILABLE", "CONTENT_SLOT_USER_ID_UNAVAILABLE", "CONTENT_SLOT_RESOURCE_ID_UNAVAILABLE", "CONTENT_SLOT_VALUES_INVALID"].includes(error?.code);
    if (!localContractBlock && (error?.code === "NETWORK_ERROR" || (Number(error?.status) >= 500 && Number(error?.status) <= 599))) {
      const unknown = new ApiError({
        status: 503,
        code: "CONTENT_MUTATION_OUTCOME_UNKNOWN",
        message: "Không nhận được kết quả cuối cùng. Thay đổi có thể đã được lưu. Hãy tải lại trang để kiểm tra trước khi thử lại.",
      });
      unknown.mutationOutcomeUnknown = true;
      unknown.storyId = storyId;
      throw unknown;
    }
    throw error;
  }

  const resolvedStoryId = storyId || result?.id;
  if (!resolvedStoryId) {
    const accepted = new ApiError({
      status: 502,
      code: "CONTENT_MUTATION_REFRESH_FAILED",
      message: "Chưa thể xác nhận kết quả tạo truyện. Hãy tải lại kho truyện để kiểm tra trước khi thử lại.",
    });
    accepted.mutationAccepted = true;
    throw accepted;
  }

  let story;
  try {
    story = await getBackendEditor({ storyId: resolvedStoryId });
  } catch (error) {
    const accepted = new ApiError({
      status: 503,
      code: "CONTENT_MUTATION_REFRESH_FAILED",
      message: "Chưa thể làm mới truyện sau thao tác. Hãy tải lại trang để kiểm tra trước khi thử lại.",
      requestId: error?.requestId || "frontend-content-reconcile",
    });
    accepted.mutationAccepted = true;
    accepted.storyId = resolvedStoryId;
    if (!storyId) accepted.createdStoryId = resolvedStoryId;
    throw accepted;
  }
  return decorate ? decorate(story, result) : story;
}

function normalizeBackendPage(page) {
  return {
    ...page,
    order: Number(page.pageNumber) || 1,
    text: page.rawText || "",
    backgroundAssetId: page.backgroundUrl ? `page-background:${page.id}` : null,
    narration: page.audioNarrationUrl || "",
    ...(page.audioNarrationUrl ? {
      audioTracks: [{
        id: `page-audio-track:${page.id}`,
        assetId: `page-audio:${page.id}`,
        name: "Lời kể",
        type: "voiceover",
        startMs: 0,
      }],
    } : {}),
  };
}

function normalizeBackendRole(role) {
  return {
    ...role,
    name: role.roleName || "",
    custom: Boolean(role.allowCustomCharacter),
    sensitive: Boolean(role.requiresParentApproval),
    defaultAssetId: role.defaultAssetUrl ? `role-default:${role.id}` : "",
    slots: [],
  };
}

function normalizeBackendSlot(slot, requestedPageId) {
  const pageId = slot.storyPageId || requestedPageId;
  const roleId = slot.storyRoleTemplateId;
  const x = Number(slot.posX);
  const y = Number(slot.posY);
  const scale = Number(slot.scale);
  if (!slot.id || !pageId || !roleId || slot.posX == null || slot.posY == null || slot.scale == null || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100 || !Number.isFinite(scale) || scale <= 0) {
    throw new ApiError({ status: 502, code: "CONTENT_SLOT_RESPONSE_INVALID", message: "Không thể hiển thị vị trí nhân vật này. Hãy tải lại truyện trước khi chỉnh sửa." });
  }
  return {
    ...slot,
    id: slot.id,
    pageId,
    roleId,
    x,
    y,
    scale,
    flip: Boolean(slot.flipHorizontal),
    rotation: 0,
    layer: 1,
    anchor: "center",
    assetId: "",
    backendStatus: slot.status,
    source: "backend",
  };
}

function backendSlotGeometry(payload) {
  const x = Number(payload.x);
  const y = Number(payload.y);
  const scale = Number(payload.scale);
  if (![x, y, scale].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || scale < 0.1 || scale > 5) {
    throw new ApiError({ status: 422, code: "CONTENT_SLOT_VALUES_INVALID", message: "Vị trí ngang/dọc phải từ 0–100%, kích thước phải từ 0,1 đến 5. Không có dữ liệu nào được gửi." });
  }
  return { x, y, scale };
}

function backendSlotCreateBody(roleId, payload) {
  if (!isBackendUuid(roleId) || !isBackendUuid(payload.pageId)) {
    throw new ApiError({ status: 501, code: "CONTENT_SLOT_RESOURCE_ID_UNAVAILABLE", message: "Không thể đặt vị trí nhân vật này lúc này. Hãy tải lại truyện rồi thử lại." });
  }
  const { x, y, scale } = backendSlotGeometry(payload);
  return {
    storyRoleTemplateId: roleId,
    posX: x,
    posY: y,
    scale,
    flipHorizontal: Boolean(payload.flip),
    createdAt: new Date().toISOString(),
    createBy: requireBackendUserId(),
  };
}

function backendSlotUpdateBody(payload) {
  const { x, y, scale } = backendSlotGeometry(payload);
  const status = Number(payload.backendStatus);
  if (!Number.isInteger(status)) {
    throw new ApiError({ status: 501, code: "CONTENT_SLOT_STATUS_UNAVAILABLE", message: "Không thể bảo toàn trạng thái hiện tại của vị trí nhân vật. Tải lại truyện trước khi lưu." });
  }
  return {
    posX: x,
    posY: y,
    scale,
    flipHorizontal: Boolean(payload.flip),
    status,
    updateBy: requireBackendUserId(),
  };
}

function normalizeBackendVocabulary(entry, pageId) {
  return {
    ...entry,
    id: entry.id,
    pageId: entry.storyPageTemplateId || pageId,
    word: entry.word || "",
    meaning: entry.meaning || "",
    audioUrl: entry.audioUrl || "",
  };
}

function normalizeBackendQuiz(quiz) {
  let options = Array.isArray(quiz.options) && (quiz.options.length || !quiz.optionsJson) ? quiz.options : null;
  if (!options && typeof quiz.optionsJson === "string" && quiz.optionsJson.trim()) {
    try {
      const parsed = JSON.parse(quiz.optionsJson);
      if (Array.isArray(parsed)) options = parsed;
    } catch {
      throw new ApiError({
        status: 502,
        code: "CONTENT_QUIZ_OPTIONS_INVALID",
        message: "Danh sách đáp án không hợp lệ. Hãy tải lại câu hỏi.",
      });
    }
  }
  if (!options && Array.isArray(quiz.options)) options = quiz.options;
  return {
    ...quiz,
    id: quiz.id,
    pageId: "",
    question: quiz.questionText || "",
    options: options || [],
    correctIndex: Number.isInteger(quiz.correctOptionIndex) ? quiz.correctOptionIndex : null,
    feedback: "",
    audioUrl: quiz.questionAudioUrl || "",
    questionPicUrl: quiz.questionPicUrl || "",
  };
}

async function listBackendVocabularyForPage(pageId, signal) {
  const response = await contentRequest({ path: `/story-pages/${pageId}/vocabularies`, signal });
  return responseRows(response).map((entry) => normalizeBackendVocabulary(entry, pageId));
}

async function listBackendQuizzes(storyId, signal) {
  const response = await contentRequest({ path: `/story-template/${storyId}/all-quizzes`, signal });
  return responseRows(response).map(normalizeBackendQuiz);
}

function backendVocabularyBody(payload) {
  return {
    word: payload.word,
    meaning: payload.meaning,
    audioUrl: payload.audioUrl ?? "",
  };
}

function backendQuizFormData(payload, { creating = false } = {}) {
  const form = new FormData();
  form.append("QuestionText", payload.question ?? "");
  (payload.options || []).forEach((option) => form.append("Options", option));
  if (payload.correctIndex != null) form.append("CorrectOptionIndex", String(payload.correctIndex));
  if (!creating && payload.status != null) form.append("Status", String(payload.status));
  if (payload.questionFile instanceof Blob) form.append("file", payload.questionFile, payload.questionFile.name || "question-image");
  if (payload.audioFile instanceof Blob) form.append("audioFile", payload.audioFile, payload.audioFile.name || "question-audio");
  return form;
}

async function getBackendStory({ storyId, signal }) {
  const story = await contentRequest({ path: `/story-template/stories/${storyId}`, signal });
  return normalizeBackendStory(story);
}

async function getBackendEditor({ storyId, signal }) {
  const [story, pageResponse, roleResponse, quizResponse] = await Promise.all([
    contentRequest({ path: `/story-template/stories/${storyId}`, signal }),
    // `GET /storypage-template/pages/{id}` is duplicated in the backend with
    // the same route template for story and page IDs. Use the Content Manager
    // all-pages route to avoid ASP.NET's ambiguous route match (500).
    contentRequest({ path: `/storypage-template/all-pages/${storyId}`, signal }),
    contentRequest({ path: `/story-template/${storyId}/roles`, signal }),
    contentRequest({ path: `/story-template/${storyId}/all-quizzes`, signal }),
  ]);
  // The authorized all-pages endpoint includes inactive pages. The editor lists
  // editable drafts/pending/active pages and hides soft-deleted or archived rows.
  const backendPages = responseRows(pageResponse).filter((page) => ![3, 4].includes(Number(page.status)));
  const pages = backendPages.map(normalizeBackendPage);
  const roles = responseRows(roleResponse).map(normalizeBackendRole);
  const slotGroups = await mapWithConcurrency(pages, 4, async (page) => {
    const response = await contentRequest({ path: `/story-pages/${page.id}/slots`, signal });
    return responseRows(response).map((slot) => normalizeBackendSlot(slot, page.id));
  });
  const slotsByRoleId = new Map(roles.map((role) => [role.id, []]));
  for (const slot of slotGroups.flat()) {
    const roleSlots = slotsByRoleId.get(slot.roleId);
    if (!roleSlots) {
      throw new ApiError({ status: 502, code: "CONTENT_SLOT_ROLE_NOT_FOUND", message: "Có vị trí nhân vật không khớp với danh sách nhân vật của truyện. Hãy tải lại hoặc liên hệ nhóm hỗ trợ." });
    }
    roleSlots.push(slot);
  }
  const rolesWithSlots = roles.map((role) => ({ ...role, slots: slotsByRoleId.get(role.id) || [] }));
  const vocabularyGroups = await mapWithConcurrency(backendPages, 4, (page) => listBackendVocabularyForPage(page.id, signal));
  const vocabulary = vocabularyGroups.flat();
  const quizzes = responseRows(quizResponse).map(normalizeBackendQuiz);
  const backendStory = normalizeBackendStory(story);
    const normalized = normalizeStory({
    ...backendStory,
    category: story.educationThemeName || "",
    coverAssetId: backendStory.coverAssetId || (story.coverImageUrl ? `story-cover:${story.id}` : null),
    pages,
    roles: rolesWithSlots,
    vocabulary,
    quizzes,
    versions: [],
    revision: story.revision,
  });

  // The current Backend DTO does not expose a draft revision or version history.
  return mergeContentMockOverlay({ ...normalized, revision: story.revision ?? null, versionHistoryAvailable: false }, activeUserId(), storyId);
}

async function validateBackendStory({ storyId, signal }) {
  const story = await getBackendEditor({ storyId, signal });
  const issues = [];
  if (!story.title.trim()) issues.push("Tên truyện");
  if (!story.categoryId) issues.push("Danh mục");
  if (!story.pages.length) issues.push("Ít nhất một trang");
  return {
    valid: issues.length === 0,
    issues,
    message: issues.length
      ? `Cần bổ sung: ${issues.join(", ")}.`
      : "Đã kiểm tra các thông tin truyện.",
    revision: story.revision,
  };
}

async function listBackendStories({ search, status, category, sort, page, pageSize, signal }) {
  const response = await contentRequest({ path: "/story-template/all-stories", signal });
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
  const response = await contentRequest({ path: "/story-template/all-stories", signal });
  const rows = (Array.isArray(response) ? response : response?.items || []).map(normalizeBackendStory);
  return {
    summary: {
      publishedStories: rows.filter((story) => story.status === "published").length,
      draftStories: rows.filter((story) => story.status === "draft").length,
    },
    trend: [],
    topStories: [],
    errors: [{ section: "analytics", message: "Một số thống kê hiện chưa thể hiển thị." }],
  };
}

function revisionBody(payload, revision) {
  return revision == null ? payload : { ...payload, revision };
}

function decorateStoryCoverAsset(story, storyId, payload) {
  if (payload.coverAssetId) {
    saveMockStoryDraft(activeUserId(), storyId, { coverAssetId: payload.coverAssetId });
  } else if (payload.coverFile) {
    saveMockStoryDraft(activeUserId(), storyId, { coverAssetId: "" });
  }
  return mergeContentMockOverlay(story, activeUserId(), storyId);
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
  getStory: (params) => featureApiModes.content === "real"
    ? getBackendStory(params)
    : contentRequest({ path: `/content/stories/${params.storyId}`, signal: params.signal }),
  createStory: async (payload) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: "/content/stories", method: "POST", body: payload });
    return mutateBackendStoryAndRefresh(undefined, () => contentRequest({ path: "/story-template", method: "POST", body: backendStoryFormData(payload, { creating: true }) }), {
      decorate: (story) => decorateStoryCoverAsset(story, story.id, payload),
    });
  },
  updateStory: async ({ storyId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}`, method: "PATCH", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}`, method: "PUT", body: backendStoryFormData(payload) }), {
      decorate: (story) => decorateStoryCoverAsset(story, storyId, payload),
    });
  },
  getEditor: (params) => featureApiModes.content === "real"
    ? getBackendEditor(params)
    : contentRequest({ path: `/content/stories/${params.storyId}`, signal: params.signal }),
  listPages: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages`, signal });
    const response = await contentRequest({ path: `/storypage-template/all-pages/${storyId}`, signal });
    return { items: responseRows(response).filter((page) => ![3, 4].includes(Number(page.status))).map(normalizeBackendPage) };
  },
  addPage: async ({ storyId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages`, method: "POST", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/storypage-template/${storyId}/page`, method: "POST", body: backendPageFormData(payload, { creating: true }) }));
  },
  updatePage: async ({ storyId, pageId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "PATCH", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/storypage-template/${pageId}`, method: "PUT", body: backendPageFormData(payload) }));
  },
  deletePage: ({ storyId, pageId, revision }) => featureApiModes.content === "real"
    ? mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/storypage-template/story-pages/${pageId}`, method: "DELETE" }))
    : contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "DELETE", body: revisionBody({}, revision) }),
  reorderPages: async ({ storyId, pageIds, revision }) => featureApiModes.content === "real"
    ? (saveMockPageOrder(activeUserId(), storyId, pageIds), getBackendEditor({ storyId }))
    : contentRequest({ path: `/content/stories/${storyId}/pages/reorder`, method: "PATCH", body: revisionBody({ pageIds }, revision) }),
  listRoles: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles`, signal });
    const response = await contentRequest({ path: `/story-template/${storyId}/roles`, signal });
    return { items: responseRows(response).map(normalizeBackendRole) };
  },
  addRole: async ({ storyId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles`, method: "POST", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}/role`, method: "POST", body: backendRoleFormData(payload, { creating: true }) }));
  },
  updateRole: async ({ storyId, roleId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "PATCH", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-role/${roleId}`, method: "PUT", body: backendRoleFormData(payload) }));
  },
  addSlot: async ({ storyId, roleId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots`, method: "POST", body: revisionBody(payload, revision) });
    const story = await mutateBackendStoryAndRefresh(storyId, () => contentRequest({
      path: `/story-pages/${payload.pageId}/slot`,
      method: "POST",
      body: backendSlotCreateBody(roleId, payload),
    }));
    const createdSlot = story.roles.find((role) => role.id === roleId)?.slots.find((slot) => slot.pageId === payload.pageId && slot.source === "backend");
    if (!createdSlot) {
      const accepted = new ApiError({ status: 503, code: "CONTENT_MUTATION_REFRESH_FAILED", message: "Vị trí nhân vật đã được tạo nhưng danh sách chưa thể làm mới. Hãy tải lại truyện để kiểm tra." });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      throw accepted;
    }
    const mockFields = {
      layer: Number(payload.layer) || 1,
      ...(payload.rotation === undefined ? {} : { rotation: Number(payload.rotation) || 0 }),
      ...(payload.anchor ? { anchor: payload.anchor } : {}),
      ...(payload.assetId ? { assetId: payload.assetId } : {}),
    };
    try {
      saveMockSlotDraft(activeUserId(), storyId, createdSlot.id, mockFields);
    } catch {
      const accepted = new ApiError({ status: 503, code: "CONTENT_MUTATION_REFRESH_FAILED", message: "Vị trí nhân vật đã được tạo nhưng chưa thể lưu đầy đủ tùy chọn. Hãy tải lại truyện để kiểm tra." });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      throw accepted;
    }
    return mergeContentMockOverlay(story, activeUserId(), storyId);
  },
  updateSlot: async ({ storyId, roleId, slotId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "PATCH", body: revisionBody(payload, revision) });
    if (slotId.startsWith("mock-slot:")) {
      saveMockSlotDraft(activeUserId(), storyId, slotId, payload);
      return getBackendEditor({ storyId });
    }
    if (!isBackendUuid(slotId)) throw new ApiError({ status: 501, code: "CONTENT_SLOT_RESOURCE_ID_UNAVAILABLE", message: "Vị trí này không còn khả dụng để lưu. Hãy tải lại truyện trước khi tiếp tục." });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({
      path: `/story-slots/${slotId}`,
      method: "PUT",
      body: backendSlotUpdateBody(payload),
    }));
  },
  deleteSlot: async ({ storyId, roleId, slotId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots/${slotId}`, method: "DELETE", body: revisionBody({}, revision) });
    if (slotId.startsWith("mock-slot:")) {
      removeMockSlot(activeUserId(), storyId, slotId);
      return getBackendEditor({ storyId });
    }
    if (!isBackendUuid(slotId)) throw new ApiError({ status: 501, code: "CONTENT_SLOT_RESOURCE_ID_UNAVAILABLE", message: "Vị trí này không còn khả dụng để xóa. Hãy tải lại truyện trước khi tiếp tục." });
    const story = await mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-slots/${slotId}`, method: "DELETE" }));
    removeMockSlot(activeUserId(), storyId, slotId);
    return mergeContentMockOverlay(story, activeUserId(), storyId);
  },
  listVocabulary: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary`, signal });
    const editor = await getBackendEditor({ storyId, signal });
    return { items: editor.vocabulary };
  },
  addVocabulary: async ({ storyId, revision, pageId, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary`, method: "POST", body: revisionBody({ pageId, ...payload }, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-pages/${pageId}/vocabularies`, method: "POST", body: backendVocabularyBody(payload) }));
  },
  updateVocabulary: async ({ storyId, vocabularyId, revision, pageId, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "PATCH", body: revisionBody({ pageId, ...payload }, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-vocabulary/${vocabularyId}`, method: "PUT", body: backendVocabularyBody(payload) }));
  },
  deleteVocabulary: async ({ storyId, vocabularyId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "DELETE", body: revisionBody({}, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-vocabulary/${vocabularyId}`, method: "DELETE" }));
  },
  listQuizzes: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes`, signal });
    return { items: await listBackendQuizzes(storyId, signal) };
  },
  addQuiz: async ({ storyId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes`, method: "POST", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}/quizz`, method: "POST", body: backendQuizFormData(payload, { creating: true }) }), {
      decorate: (story, result) => {
        if (result?.id && (payload.pageId || payload.feedback)) saveMockQuizDraft(activeUserId(), storyId, result.id, { pageId: payload.pageId || "", feedback: payload.feedback || "" });
        return mergeContentMockOverlay(story, activeUserId(), storyId);
      },
    });
  },
  updateQuiz: async ({ storyId, quizId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "PATCH", body: revisionBody(payload, revision) });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-quiz/${quizId}/with-image`, method: "PUT", body: backendQuizFormData(payload) }), {
      decorate: (story) => {
        saveMockQuizDraft(activeUserId(), storyId, quizId, { pageId: payload.pageId || "", feedback: payload.feedback || "" });
        return mergeContentMockOverlay(story, activeUserId(), storyId);
      },
    });
  },
  deleteQuiz: async ({ storyId, quizId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "DELETE", body: revisionBody({}, revision) });
    return mutateBackendStoryAndRefresh(storyId, async () => {
      const result = await contentRequest({ path: `/story-quiz/${quizId}`, method: "DELETE" });
      removeMockQuizDraft(activeUserId(), storyId, quizId);
      return result;
    });
  },
  previewStory: ({ storyId, signal }) => featureApiModes.content === "real"
    ? getBackendEditor({ storyId, signal })
    : contentRequest({ path: `/content/stories/${storyId}/preview`, signal }),
  validateStory: ({ storyId, revision }) => featureApiModes.content === "real"
    ? validateBackendStory({ storyId })
    : contentRequest({ path: `/content/stories/${storyId}/validate`, method: "POST", body: revisionBody({}, revision) }),
  publishStory: async ({ storyId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/publish`, method: "POST", body: { revision } });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}/publish`, method: "POST" }), {
      decorate: (story, publishResult) => {
        if (story.status !== "published") {
          const unconfirmed = new ApiError({
            status: 503,
            code: "CONTENT_PUBLISH_STATUS_UNCONFIRMED",
            message: "Chưa thể xác nhận kết quả xuất bản. Hãy tải lại truyện để kiểm tra trước khi tiếp tục.",
          });
          unconfirmed.mutationAccepted = true;
          unconfirmed.storyId = storyId;
          throw unconfirmed;
        }
        return { ...story, publishMessage: publishResult?.message || "" };
      },
    });
  },
  hideStory: ({ storyId, revision }) => featureApiModes.content === "real"
    ? contentRequest({ path: `/story-template/${storyId}`, method: "DELETE" })
    : contentRequest({ path: `/content/stories/${storyId}/hide`, method: "POST", body: { revision } }),
  listAssets,
  deleteAsset,
  getStatistics: ({ range = "7d", signal } = {}) => featureApiModes.content === "real"
    ? getBackendStatistics(signal)
    : contentRequest({ path: `/content/statistics?range=${range}`, signal }),
  uploadAsset,
};
