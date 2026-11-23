import { featureApiModes, featureApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";
import { SESSION_KEY } from "../../../mocks/mockServer";
import { deleteAsset, listAssets, uploadAsset } from "./assetService";
import { mergeContentMockOverlay, mergeMockStoryDraft, readContentMockOverlay, reconcileContentMockOverlay, removeMockSlot, removeMockQuizDraft, removeMockStoryDraftFields, saveMockPageOrder, saveMockSlotDraft, saveMockStoryDraft, summarizeLocalOnlyChanges } from "./contentMockOverlay";
import { normalizeStory } from "../models";
import { API_STRING_PLACEHOLDER, DEFAULT_STORY_PAGE_BACKGROUND_URL, EMPTY_STORY_COMPOSITION_JSON, hydratePageFromComposition, isApiStringPlaceholder, normalizeApiPageBackground, normalizeApiPageComposition, normalizeApiPageText, parseStoryComposition, serializeCompositionString } from "./storyComposition";
import { mapVocabularyDto } from "./vocabularyContract";

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

const commonStatusCodes = Object.freeze({ draft: 0, pending: 1, active: 2, published: 2, inactive: 3, archived: 4, hidden: 3 });

function backendStatusCode(value) {
  if (Number.isInteger(value) && value >= 0 && value <= 4) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (Object.hasOwn(commonStatusCodes, normalized)) return commonStatusCodes[normalized];
    if (/^[0-4]$/.test(normalized)) return Number(normalized);
  }
  return null;
}

function publicationLifecycleIssues(story) {
  const storyStatus = backendStatusCode(story?.backendStatus);
  const issues = [];
  if (![0, 1, 2, 4].includes(storyStatus)) {
    const label = storyStatus === 1 ? "Pending" : storyStatus === 4 ? "Archived" : storyStatus === 3 ? "Inactive" : "chưa xác định";
    issues.push(`Truyện đang ở trạng thái ${label}; chỉ Draft, Pending, Active hoặc Archived được phép xuất bản.`);
  }

  const groups = [
    ["trang", story?.publicationState?.pages || []],
    ["nhân vật", story?.publicationState?.roles || []],
    ["vị trí nhân vật", story?.publicationState?.slots || []],
    ["câu hỏi", story?.publicationState?.quizzes || []],
  ];
  for (const [label, rows] of groups) {
    for (const row of rows) {
      const status = backendStatusCode(row.status);
      if ([0, 2, 3].includes(status)) continue;
      const stateLabel = status === 1 ? "Pending" : status === 4 ? "Archived" : "chưa xác định";
      issues.push(`${label} ${row.id || "không rõ ID"} đang ở trạng thái ${stateLabel}; Backend chỉ chuyển Draft sang Active khi xuất bản.`);
    }
  }
  return issues;
}

function publicationReadbackIssues(story) {
  const issues = [];
  if (story?.status !== "published") issues.push("Trạng thái truyện chưa phải Active.");
  const groups = [
    ["trang", story?.publicationState?.pages || []],
    ["nhân vật", story?.publicationState?.roles || []],
    ["vị trí nhân vật", story?.publicationState?.slots || []],
    ["câu hỏi", story?.publicationState?.quizzes || []],
  ];
  for (const [label, rows] of groups) {
    for (const row of rows) {
      if (backendStatusCode(row.status) === 3) continue;
      if (backendStatusCode(row.status) !== 2) issues.push(`${label} ${row.id || "không rõ ID"} chưa được đọc lại ở trạng thái Active.`);
    }
  }
  return issues;
}

function normalizeBackendStory(story, { includeLocalChanges = true } = {}) {
  const status = ({ 0: "draft", 1: "pending", 2: "published", 3: "hidden", 4: "archived" })[story.status]
    || ({ draft: "draft", pending: "pending", active: "published", published: "published", inactive: "hidden", hidden: "hidden", archived: "archived" })[String(story.status).toLowerCase()]
    || "unknown";

  const normalized = {
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
  };
  return includeLocalChanges ? mergeMockStoryDraft(normalized, activeUserId(), story.id) : normalized;
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
  if (!creating && payload.ageGroup == null) {
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
  };
  if (!creating) fields.AgeGroup = payload.ageGroup;
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
  const sourceRawText = String(payload.text ?? payload.rawText ?? "");
  const rawText = String(normalizeApiPageText(sourceRawText));
  const isPlaceholder = isApiStringPlaceholder(sourceRawText);
  if (!creating && !rawText.trim() && !isPlaceholder) {
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
    RawText: (creating || isPlaceholder) && !rawText.trim() ? API_STRING_PLACEHOLDER : rawText,
  };
  // New pages start empty; the API still receives string fields in multipart form.
  if (creating) {
    fields.BackgroundUrl = String(normalizeApiPageBackground(payload.backgroundUrl ?? DEFAULT_STORY_PAGE_BACKGROUND_URL));
    const compositionJson = normalizeApiPageComposition(payload.compositionJson);
    fields.CompositionJson = typeof compositionJson === "string" && compositionJson.trim()
      ? compositionJson
      : EMPTY_STORY_COMPOSITION_JSON;
  }
  if (!creating) fields.Status = payload.status;
  const form = backendFormData(fields);
  if (!creating && Object.hasOwn(payload, "compositionJson")) {
    form.append("CompositionJson", String(payload.compositionJson ?? ""));
  }
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
    if (error?.mutationAccepted || error?.mutationOutcomeUnknown) throw error;
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
  const rawText = normalizeApiPageText(page.rawText ?? page.RawText);
  const backgroundUrl = normalizeApiPageBackground(page.backgroundUrl ?? page.BackgroundUrl);
  const compositionJson = normalizeApiPageComposition(page.compositionJson ?? page.CompositionJson);
  const normalized = {
    ...page,
    rawText,
    backgroundUrl,
    compositionJson,
    order: Number(page.pageNumber) || 1,
    text: rawText,
    backgroundAssetId: backgroundUrl ? `page-background:${page.id}` : null,
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
  const parsed = parseStoryComposition(compositionJson);
  return hydratePageFromComposition(normalized, parsed);
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
  };
}

function normalizeBackendVocabulary(entry, pageId) {
  return mapVocabularyDto(entry, pageId);
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
    wordVi: payload.word,
    meaning: payload.meaning,
    audioUrl: payload.audioUrl ?? "",
  };
}

function vocabularyReadbackError() {
  const error = new ApiError({
    status: 503,
    code: "CONTENT_VOCABULARY_READBACK_MISMATCH",
    message: "Từ vựng đã được gửi nhưng dữ liệu đọc lại chưa khớp. Biểu mẫu được giữ nguyên; hãy tải lại nội dung để kiểm tra trước khi thử lại.",
  });
  error.mutationAccepted = true;
  return error;
}

function verifyVocabularyReadback(story, apiResult, expected, vocabularyId) {
  const id = vocabularyId || apiResult?.id || apiResult?.Id;
  const saved = typeof id === "string" ? story.vocabulary.find((item) => item.id === id) : null;
  if (!saved
    || saved.pageId !== expected.pageId
    || saved.word !== expected.word
    || saved.meaning !== expected.meaning
    || saved.audioUrl !== expected.audioUrl) {
    throw vocabularyReadbackError();
  }
  return story;
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

async function getBackendPage({ pageId, signal }) {
  const response = await contentRequest({ path: `/storypage-template/page/${pageId}`, signal });
  if (!response || response.id !== pageId || !(response.compositionJson == null || typeof response.compositionJson === "string")) {
    throw new ApiError({
      status: 502,
      code: "CONTENT_PAGE_RESPONSE_INVALID",
      message: "Không thể xác nhận dữ liệu trang trước khi lưu. Tải lại truyện rồi thử lại.",
    });
  }
  // Keep the editor's composition field parseable even when older APIs omit it.
  return { ...response, compositionJson: normalizeApiPageComposition(response.compositionJson) };
}

function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJsonValue(value[key])]));
  }
  return value;
}

function sameCompositionValue(left, right) {
  const normalizeEmpty = (value) => value == null || value === "" ? null : value;
  const normalizedLeft = normalizeEmpty(left);
  const normalizedRight = normalizeEmpty(right);
  if (normalizedLeft === null || normalizedRight === null) return normalizedLeft === normalizedRight;
  if (typeof normalizedLeft !== "string" || typeof normalizedRight !== "string") return false;
  try {
    return JSON.stringify(stableJsonValue(JSON.parse(normalizedLeft)))
      === JSON.stringify(stableJsonValue(JSON.parse(normalizedRight)));
  } catch {
    return normalizedLeft === normalizedRight;
  }
}

function acceptedPageReadbackError(pageId, cause, mismatch = false) {
  const error = new ApiError({
    status: 503,
    code: mismatch ? "CONTENT_PAGE_READBACK_MISMATCH" : "CONTENT_PAGE_READBACK_FAILED",
    message: mismatch
      ? "Máy chủ đã nhận cập nhật trang nhưng dữ liệu đọc lại không khớp. Bản chỉnh sửa vẫn được giữ; hãy tải lại trang trước khi lưu tiếp."
      : "Máy chủ đã nhận cập nhật trang nhưng chưa thể xác nhận dữ liệu đọc lại. Bản chỉnh sửa vẫn được giữ; hãy tải lại trang trước khi lưu tiếp.",
    requestId: cause?.requestId || "frontend-content-page-readback",
  });
  error.mutationAccepted = true;
  error.pageId = pageId;
  if (cause) error.cause = cause;
  return error;
}

async function writeBackendPageAndVerify({ pageId, payload, currentPage }) {
  const baseline = currentPage || await getBackendPage({ pageId });
  const mode = payload.compositionMode || "preserve";
  if (payload.expectedCompositionJson !== undefined
    && !sameCompositionValue(baseline.compositionJson, payload.expectedCompositionJson)) {
    throw new ApiError({ status: 409, code: "CONTENT_COMPOSITION_CONFLICT", message: "Bố cục trang đã được thay đổi ở nơi khác. Bản đang sửa vẫn được giữ lại; hãy tải lại trước khi lưu tiếp." });
  }
  if (mode === "replace" && !Object.hasOwn(payload, "compositionJson")) {
    throw new ApiError({ status: 422, code: "CONTENT_COMPOSITION_REPLACEMENT_MISSING", message: "Thiếu dữ liệu bố cục mới; chưa gửi cập nhật trang." });
  }

  const updatePayload = { text: baseline.rawText, status: baseline.status, ...payload };
  if (isApiStringPlaceholder(baseline.rawText) && !String(updatePayload.text ?? "").trim()) {
    updatePayload.text = API_STRING_PLACEHOLDER;
  }
  const expectedComposition = mode === "replace" ? payload.compositionJson ?? "" : baseline.compositionJson;
  if (mode === "replace") updatePayload.compositionJson = expectedComposition;
  else if (baseline.compositionJson == null || baseline.compositionJson === "") delete updatePayload.compositionJson;
  else updatePayload.compositionJson = baseline.compositionJson;
  delete updatePayload.compositionMode;
  delete updatePayload.expectedCompositionJson;

  await contentRequest({
    path: `/storypage-template/${pageId}`,
    method: "PUT",
    body: backendPageFormData(updatePayload),
  });

  let savedPage;
  try {
    savedPage = await getBackendPage({ pageId });
  } catch (error) {
    throw acceptedPageReadbackError(pageId, error);
  }
  const expectedText = String(updatePayload.text ?? updatePayload.rawText ?? "");
  const expectedStatus = updatePayload.status;
  const textMatches = savedPage.rawText === expectedText;
  const statusMatches = expectedStatus == null || String(savedPage.status) === String(expectedStatus);
  if (!textMatches || !statusMatches || !sameCompositionValue(savedPage.compositionJson, expectedComposition)) {
    throw acceptedPageReadbackError(pageId, undefined, true);
  }
  return savedPage;
}

async function getBackendEditor({ storyId, signal, includeLocalChanges = true }) {
  const [story, pageResponse, roleResponse, quizResponse] = await Promise.all([
    contentRequest({ path: `/story-template/stories/${storyId}`, signal }),
    // `GET /storypage-template/pages/{id}` is duplicated in the backend with
    // the same route template for story and page IDs. Use the Content Manager
    // all-pages route to avoid ASP.NET's ambiguous route match (500).
    contentRequest({ path: `/storypage-template/all-pages/${storyId}`, signal }),
    contentRequest({ path: `/story-template/${storyId}/all-roles`, signal }),
    contentRequest({ path: `/story-template/${storyId}/all-quizzes`, signal }),
  ]);
  // The authorized all-pages endpoint includes inactive pages. The editor lists
  // editable drafts/pending/active pages and hides soft-deleted or archived rows.
  const allBackendPages = responseRows(pageResponse);
  if (story?.id !== storyId || allBackendPages.some((page) => page.storyTemplateId !== storyId)) {
    throw new ApiError({ status: 502, code: "CONTENT_STORY_RESPONSE_MISMATCH", message: "Dữ liệu trả về không thuộc truyện đang mở." });
  }
  // Reorder excludes Inactive rows but includes Archived rows. Keep this full
  // server order so the UI can move visible pages without dropping hidden IDs.
  const reorderablePageIds = allBackendPages.filter((page) => Number(page.status) !== 3).map((page) => page.id);
  const backendPages = allBackendPages.filter((page) => ![3, 4].includes(Number(page.status)));
  const pages = backendPages.map(normalizeBackendPage);
  const allRoleRows = responseRows(roleResponse);
  const roles = allRoleRows.filter((role) => ![3, 4].includes(Number(role.status))).map(normalizeBackendRole);
  if (roles.some((role) => role.storyTemplateId !== storyId)) throw new ApiError({ status: 502, code: "CONTENT_ROLE_STORY_MISMATCH", message: "Vai nhân vật không thuộc truyện đang mở." });
  const allQuizRows = responseRows(quizResponse);
  const quizRows = allQuizRows.filter((quiz) => ![3, 4].includes(Number(quiz.status)));
  const slotLoadErrors = new Set();
  const slotGroups = await mapWithConcurrency(pages, 4, async (page) => {
    try {
      const response = await contentRequest({ path: `/story-pages/${page.id}/slots`, signal });
      const slots = responseRows(response).map((slot) => normalizeBackendSlot(slot, page.id));
      if (slots.some((slot) => slot.pageId !== page.id)) throw new Error("Slot không thuộc trang.");
      return slots;
    } catch (error) {
      if (signal?.aborted || error?.name === "AbortError") throw error;
      slotLoadErrors.add(page.id);
      return [];
    }
  });
  const slotsByRoleId = new Map(roles.map((role) => [role.id, []]));
  for (const slot of slotGroups.flat()) {
    const roleSlots = slotsByRoleId.get(slot.roleId);
    if (!roleSlots) {
      slotLoadErrors.add(slot.pageId);
      continue;
    }
    roleSlots.push(slot);
  }
  const pagesWithSlotState = pages.map((page) => {
    const slotIds = new Set(slotGroups.flat().filter((slot) => slot.pageId === page.id).map((slot) => slot.id));
    const targets = new Set([...slotIds, ...(page.imageObjects || []).map((item) => item.id)]);
    const issues = [...(page.compositionIssues || [])];
    for (const clip of page.animationClips || []) if (!targets.has(clip.targetId)) issues.push({ code: "composition.target_missing", entityId: clip.id, message: "Chuyển động tham chiếu đối tượng không thuộc trang." });
    for (const id of Object.keys(page.compositionData?.slotExtensions || {})) if (!slotIds.has(id)) issues.push({ code: "composition.slot_missing", entityId: id, message: "Tùy chọn nhân vật tham chiếu vị trí không thuộc trang." });
    for (const id of Object.keys(page.compositionData?.quizExtensions || {})) if (!quizRows.some((quiz) => quiz.id === id)) issues.push({ code: "composition.quiz_missing", entityId: id, message: "Bố cục tham chiếu câu hỏi không thuộc truyện." });
    return ({
    ...page,
    compositionIssues: issues,
    ...(page.compositionData?.background?.mode === "inherit" && story.coverImageUrl ? { backgroundAssetId: `story-cover:${story.id}` } : {}),
    slotsUnavailable: slotLoadErrors.has(page.id),
    ...(slotLoadErrors.has(page.id) ? { compositionIssues: [...issues, { code: "composition.slots.unavailable", message: "Không thể kiểm tra vị trí nhân vật của trang. Tải lại truyện trước khi tiếp tục." }] } : {}),
  }); });
  const rolesWithSlots = roles.map((role) => ({
    ...role,
    slots: (slotsByRoleId.get(role.id) || []).map((slot) => {
      const extension = pagesWithSlotState.find((page) => page.id === slot.pageId)?.slotExtensions?.[slot.id];
      return extension ? { ...slot, ...extension, id: slot.id, pageId: slot.pageId, roleId: slot.roleId, source: "backend" } : slot;
    }),
  }));
  const vocabularyGroups = await mapWithConcurrency(backendPages, 4, (page) => listBackendVocabularyForPage(page.id, signal));
  const vocabulary = vocabularyGroups.flat();
  const quizzes = quizRows.map(normalizeBackendQuiz);
  const quizExtensionOwners = new Map();
  for (const page of pagesWithSlotState) {
    for (const [quizId, extension] of Object.entries(page.quizExtensions || {})) {
      if (quizExtensionOwners.has(quizId)) {
        page.compositionIssues = [...(page.compositionIssues || []), { code: "composition.quiz.duplicate", entityId: quizId, message: "Câu hỏi đang được gắn với nhiều trang." }];
        continue;
      }
      quizExtensionOwners.set(quizId, { pageId: page.id, extension });
    }
  }
  const quizzesWithExtensions = quizzes.map((quiz) => {
    const owner = quizExtensionOwners.get(quiz.id);
    return owner ? { ...quiz, pageId: owner.pageId, feedback: owner.extension?.feedback || "" } : quiz;
  });
  const slotsByPageId = new Map(pagesWithSlotState.map((page) => [page.id, new Set(slotGroups.flat().filter((slot) => slot.pageId === page.id).map((slot) => slot.id))]));
  const knownQuizIds = new Set(quizRows.map((quiz) => quiz.id));
  for (const page of pagesWithSlotState) {
    const knownSlotIds = slotsByPageId.get(page.id) || new Set();
    const staleSlots = Object.keys(page.slotExtensions || {}).filter((slotId) => !knownSlotIds.has(slotId));
    const knownTargets = new Set([...knownSlotIds, ...(page.imageObjects || []).map((item) => item.id)]);
    const staleAnimationTargets = (page.animationClips || []).map((clip) => clip.targetId).filter((targetId) => !knownTargets.has(targetId));
    const staleQuizIds = Object.keys(page.quizExtensions || {}).filter((quizId) => !knownQuizIds.has(quizId));
    if (staleSlots.length || staleAnimationTargets.length || staleQuizIds.length) page.compositionIssues = [...(page.compositionIssues || []), {
      code: "composition.reference.slot_missing",
      entityId: staleSlots[0] || staleAnimationTargets[0] || staleQuizIds[0],
      message: staleQuizIds.length ? "Bố cục còn lời giải thích tham chiếu câu hỏi không tồn tại." : "Bố cục còn tùy chọn hoặc chuyển động tham chiếu nhân vật không tồn tại trên trang này.",
    }];
  }
  const backendStory = normalizeBackendStory(story, { includeLocalChanges: false });
    const normalized = normalizeStory({
    ...backendStory,
    reorderablePageIds,
    category: story.educationThemeName || "",
    coverAssetId: backendStory.coverAssetId || (story.coverImageUrl ? `story-cover:${story.id}` : null),
    pages: pagesWithSlotState,
    roles: rolesWithSlots,
    vocabulary,
    quizzes: quizzesWithExtensions,
    versions: [],
    revision: story.revision,
  });

  // Clear only local recovery fields whose values are confirmed by this server read.
  if (includeLocalChanges) reconcileContentMockOverlay(activeUserId(), storyId, normalized);
  // The current Backend DTO does not expose a draft revision or version history.
  const localOnly = includeLocalChanges ? summarizeLocalOnlyChanges(activeUserId(), storyId) : { hasChanges: false, sections: [], changeCount: 0 };
  const editorStory = { ...normalized, revision: story.revision ?? null, versionHistoryAvailable: false };
  const withLocalChanges = includeLocalChanges
    ? mergeContentMockOverlay(editorStory, activeUserId(), storyId)
    : editorStory;
  return {
    ...withLocalChanges,
    publicationState: {
      pages: allBackendPages.filter((row) => backendStatusCode(row.status) !== 3).map((row) => ({ id: row.id, status: row.status, pageNumber: row.pageNumber })),
      roles: allRoleRows.filter((row) => backendStatusCode(row.status) !== 3).map((row) => ({ id: row.id, status: row.status })),
      slots: slotGroups.flat().filter((row) => backendStatusCode(row.status) !== 3).map((row) => ({ id: row.id, status: row.status, pageId: row.pageId })),
      quizzes: allQuizRows.filter((row) => backendStatusCode(row.status) !== 3).map((row) => ({ id: row.id, status: row.status })),
    },
    localOnlyChanges: featureApiModes.content === "real" ? localOnly : { hasChanges: false, sections: [], changeCount: 0 },
    hasUnverifiedComposition: featureApiModes.content === "real" && pagesWithSlotState.some((page) => ["invalid", "unsupported"].includes(page.compositionState) || (page.compositionIssues || []).length > 0),
  };
}

async function persistBackendQuizExtension({ storyId: _storyId, quizId, fromPageId = "", toPageId = "", feedback = "" }) {
  // Add the destination first. If cleanup of the old page fails, the quiz stays
  // attached to at least one page and the duplicate-owner check blocks publish.
  const targets = [...new Set([toPageId, fromPageId].filter(Boolean))];
  for (const pageId of targets) {
    const serverPage = await getBackendPage({ pageId });
    const parsed = parseStoryComposition(serverPage.compositionJson);
    if (["invalid", "unsupported"].includes(parsed.kind) || parsed.issues.length) {
      const error = new Error(parsed.issues[0]?.message || "Không thể cập nhật liên kết câu hỏi trong bố cục trang.");
      error.code = "CONTENT_COMPOSITION_INVALID";
      throw error;
    }
    const page = normalizeBackendPage(serverPage);
    const quizExtensions = { ...(parsed.value?.quizExtensions || {}) };
    if (pageId === toPageId) quizExtensions[quizId] = { feedback: String(feedback || "") };
    else delete quizExtensions[quizId];
    const assets = serverPage.audioNarrationUrl ? [{ id: `page-audio:${pageId}`, name: "Lời kể", kind: "audio", mimeType: "audio/*", size: 0, url: serverPage.audioNarrationUrl, source: "backend", readOnly: true }] : [];
    const encoded = serializeCompositionString({ ...page, quizExtensions }, assets, parsed.value);
    if (!encoded.ok) throw new Error(encoded.issues[0]?.message || "Không thể lưu liên kết câu hỏi.");
    if (!String(serverPage.rawText || "").trim()) throw new Error("Không thể lưu liên kết câu hỏi vì trang chưa có nội dung. Hãy thêm nội dung trang rồi lưu lại.");
    await writeBackendPageAndVerify({
      pageId,
      currentPage: serverPage,
      payload: { text: serverPage.rawText, status: serverPage.status, compositionJson: encoded.json, compositionMode: "replace", expectedCompositionJson: serverPage.compositionJson ?? null },
    });
  }
}

async function removeBackendSlotCompositionReference(storyId, slotId, pageId) {
  const serverPage = await getBackendPage({ pageId });
  const parsed = parseStoryComposition(serverPage.compositionJson);
  if (parsed.kind !== "supported" || parsed.issues.length) return;
  const page = normalizeBackendPage(serverPage);
  const slotExtensions = { ...(parsed.value.slotExtensions || {}) };
  const hadSlotExtension = Object.hasOwn(slotExtensions, slotId);
  delete slotExtensions[slotId];
  const animationClips = (page.animationClips || []).filter((clip) => clip.targetId !== slotId);
  const sequence = (page.sequence || []).filter((item) => item.slotId !== slotId);
  if (!hadSlotExtension && animationClips.length === (page.animationClips || []).length && sequence.length === (page.sequence || []).length) return;
  const encoded = serializeCompositionString({ ...page, slotExtensions, animationClips, sequence }, [], parsed.value);
  if (!encoded.ok) throw new Error(encoded.issues[0]?.message || "Không thể dọn tùy chọn của nhân vật đã xóa.");
  if (!String(serverPage.rawText || "").trim()) throw new Error("Nhân vật đã xóa nhưng trang không có nội dung để cập nhật bố cục.");
  await writeBackendPageAndVerify({
    pageId,
    currentPage: serverPage,
    payload: { text: serverPage.rawText, status: serverPage.status, compositionJson: encoded.json, compositionMode: "replace", expectedCompositionJson: serverPage.compositionJson ?? null },
  });
}

function acceptedQuizCompositionError(error, storyId) {
  const accepted = new ApiError({ status: 503, code: "CONTENT_QUIZ_COMPOSITION_SYNC_FAILED", message: "Thao tác câu hỏi đã hoàn tất một phần, nhưng liên kết trang hoặc lời giải thích chưa đồng bộ. Hãy tải lại truyện trước khi thử tiếp." });
  accepted.mutationAccepted = true;
  accepted.storyId = storyId;
  accepted.cause = error;
  return accepted;
}

async function validateBackendStory({ storyId, signal, story: currentStory }) {
  const story = currentStory || await getBackendEditor({ storyId, signal });
  const issues = publicationLifecycleIssues(story);
  if (!story.title.trim()) issues.push("Tên truyện");
  if (!story.coverImageUrl?.trim() || isApiStringPlaceholder(story.coverImageUrl)) issues.push("Ảnh bìa");
  if (!story.categoryId) issues.push("Danh mục");
  if (!story.pages.length) issues.push("Ít nhất một trang");
  if (story.hasUnverifiedComposition) issues.push(...story.pages.flatMap((page) => (page.compositionIssues || []).map((issue) => issue.message)));
  if (story.pages.some((page) => page.slotsUnavailable)) issues.push("Không thể tải đầy đủ vị trí nhân vật");
  if (story.quizzes.some((quiz) => !Number.isInteger(quiz.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex >= (quiz.options || []).length)) issues.push("Mỗi câu hỏi cần có một đáp án đúng hợp lệ");
  if (story.localOnlyChanges?.hasChanges) issues.push("Còn thay đổi chỉ lưu trên thiết bị");
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
  const rows = responseRows(response);
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
  const rows = responseRows(response).map(normalizeBackendStory);
  return {
    summary: {
      publishedStories: rows.filter((story) => story.status === "published").length,
      draftStories: rows.filter((story) => story.status === "draft").length,
    },
    trend: [],
    topStories: [],
    analyticsAvailable: false,
    errors: [{ section: "analytics", message: "Swagger hiện chưa có API thống kê lượt đọc." }],
  };
}

function revisionBody(payload, revision) {
  return revision == null ? payload : { ...payload, revision };
}

function decorateStoryCoverAsset(story, storyId, payload) {
  if (payload.coverFile instanceof Blob) {
    if (!story.coverImageUrl) {
      const accepted = new ApiError({ status: 503, code: "CONTENT_COVER_READBACK_MISSING", message: "Thông tin truyện đã được lưu nhưng máy chủ chưa trả về ảnh bìa để xác nhận. Hãy tải lại truyện trước khi tiếp tục." });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      throw accepted;
    }
    removeMockStoryDraftFields(activeUserId(), storyId, ["coverAssetId", "coverImageUrl"]);
  } else if (payload.coverAssetId) {
    saveMockStoryDraft(activeUserId(), storyId, { coverAssetId: payload.coverAssetId });
  }
  return mergeContentMockOverlay(mergeMockStoryDraft(story, activeUserId(), storyId), activeUserId(), storyId);
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
    const rows = responseRows(response);
    return { items: rows.map((theme) => ({
      id: theme.id ?? theme.Id,
      label: theme.nameVi || theme.name || theme.NameVi || theme.Name || "Chưa đặt tên",
    })) };
  },
  getStory: (params) => featureApiModes.content === "real"
    ? getBackendStory(params)
    : contentRequest({ path: `/content/stories/${params.storyId}`, signal: params.signal }),
  createStory: async (payload) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: "/content/stories", method: "POST", body: payload });
    const createdStory = await mutateBackendStoryAndRefresh(undefined, () => contentRequest({ path: "/story-template", method: "POST", body: backendStoryFormData(payload, { creating: true }) }), {
      decorate: (story) => decorateStoryCoverAsset(story, story.id, payload),
    });
    if (payload.ageGroup == null) return createdStory;

    try {
      return await mutateBackendStoryAndRefresh(createdStory.id, () => contentRequest({
        path: `/story-template/${createdStory.id}`,
        method: "PUT",
        body: backendStoryFormData({
          category: createdStory.categoryId,
          title: createdStory.title,
          description: createdStory.description,
          ageGroup: payload.ageGroup,
          status: createdStory.backendStatus,
        }),
      }), {
        decorate: (story) => decorateStoryCoverAsset(story, story.id, payload),
      });
    } catch (error) {
      const accepted = new ApiError({
        status: 503,
        code: "CONTENT_CREATE_AGE_GROUP_UPDATE_FAILED",
        message: "Truyện đã được tạo nhưng chưa lưu được nhóm tuổi. Mở truyện để kiểm tra trước khi tiếp tục.",
        requestId: error?.requestId || "frontend-content-create-age-group",
      });
      accepted.mutationAccepted = true;
      accepted.storyId = createdStory.id;
      accepted.createdStoryId = createdStory.id;
      throw accepted;
    }
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
  getSavedPageRawText: async ({ storyId, pageId, signal }) => {
    if (featureApiModes.content === "real") {
      const page = await getBackendPage({ pageId, signal });
      const pageStoryId = page.storyTemplateId ?? page.StoryTemplateId;
      const rawText = Object.hasOwn(page, "rawText") ? page.rawText : page.RawText;
      if (pageStoryId !== storyId || typeof rawText !== "string") {
        throw new ApiError({ status: 502, code: "CONTENT_PAGE_RAW_TEXT_UNAVAILABLE", message: "Không thể xác nhận RawText đã lưu của trang. Tải lại trang trước khi thêm hoặc đổi từ vựng." });
      }
      return rawText;
    }
    const story = await contentRequest({ path: `/content/stories/${storyId}`, signal });
    const page = story?.pages?.find((item) => item.id === pageId);
    const rawText = page?.rawText ?? page?.RawText ?? page?.text;
    if (!page || (rawText != null && typeof rawText !== "string")) {
      throw new ApiError({ status: 502, code: "CONTENT_PAGE_RAW_TEXT_UNAVAILABLE", message: "Không thể xác nhận nội dung đã lưu của trang. Tải lại truyện trước khi thêm hoặc đổi từ vựng." });
    }
    return rawText ?? "";
  },
  listPages: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages`, signal });
    const response = await contentRequest({ path: `/storypage-template/all-pages/${storyId}`, signal });
    return { items: responseRows(response).filter((page) => ![3, 4].includes(Number(page.status))).map(normalizeBackendPage) };
  },
  addPage: async ({ storyId, revision, currentStory, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages`, method: "POST", body: revisionBody(payload, revision) });
    const createdPage = await contentRequest({ path: `/storypage-template/${storyId}/page`, method: "POST", body: backendPageFormData(payload, { creating: true }) });
    if (!currentStory || currentStory.id !== storyId || !createdPage?.id || (createdPage.storyTemplateId && createdPage.storyTemplateId !== storyId)) {
      // The POST has already succeeded. Reconcile from its response without ever
      // retrying the create request, in case this backend returns an unexpected DTO.
      return mutateBackendStoryAndRefresh(storyId, async () => createdPage);
    }

    const page = normalizeBackendPage(createdPage);
    return normalizeStory({
      ...currentStory,
      pages: [...(currentStory.pages || []).filter((item) => item.id !== page.id), page],
      reorderablePageIds: [...new Set([...(currentStory.reorderablePageIds || currentStory.pages?.map((item) => item.id) || []), page.id])],
      totalPageNumbers: Math.max(Number(currentStory.totalPageNumbers) || 0, Number(createdPage.pageNumber) || 0, (currentStory.pages || []).length + 1),
    });
  },
  updatePage: async ({ storyId, pageId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "PATCH", body: revisionBody(payload, revision) });
    const currentPage = await getBackendPage({ pageId });
    if (currentPage.storyTemplateId !== storyId) throw new ApiError({ status: 409, code: "CONTENT_PAGE_STORY_MISMATCH", message: "Trang không thuộc truyện đang sửa. Chưa gửi cập nhật." });
    return mutateBackendStoryAndRefresh(storyId, () => writeBackendPageAndVerify({ pageId, payload, currentPage }));
  },
  deletePage: ({ storyId, pageId, revision }) => featureApiModes.content === "real"
    ? mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/storypage-template/story-pages/${pageId}`, method: "DELETE" }))
    : contentRequest({ path: `/content/stories/${storyId}/pages/${pageId}`, method: "DELETE", body: revisionBody({}, revision) }),
  reorderPages: async ({ storyId, pageIds, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/pages/reorder`, method: "PATCH", body: revisionBody({ pageIds }, revision) });
    const story = await mutateBackendStoryAndRefresh(storyId, () => contentRequest({
      path: `/storypage-template/${storyId}/reorder-pages`,
      method: "PUT",
      body: { orderedPageIds: pageIds },
    }));
    if (!readContentMockOverlay(activeUserId(), storyId).pageOrder.length) return story;

    try {
      saveMockPageOrder(activeUserId(), storyId, []);
      return await getBackendEditor({ storyId });
    } catch (error) {
      const accepted = new ApiError({
        status: 503,
        code: "CONTENT_MUTATION_REFRESH_FAILED",
        message: "Thứ tự đã được cập nhật trên máy chủ nhưng bản sắp xếp local cũ chưa thể gỡ. Hãy tải lại hoặc bỏ thay đổi local để xem thứ tự mới.",
        requestId: error?.requestId || "frontend-content-reorder-reconcile",
      });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      throw accepted;
    }
  },
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
  deleteRole: ({ storyId, roleId, revision }) => featureApiModes.content === "real"
    ? mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-role/${roleId}`, method: "DELETE" }))
    : contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}`, method: "DELETE", body: revisionBody({}, revision) }),
  addSlot: async ({ storyId, roleId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/roles/${roleId}/slots`, method: "POST", body: revisionBody(payload, revision) });
    let createdSlotId = "";
    const story = await mutateBackendStoryAndRefresh(storyId, () => contentRequest({
      path: `/story-pages/${payload.pageId}/slot`,
      method: "POST",
      body: backendSlotCreateBody(roleId, payload),
    }), { decorate: (nextStory, result) => { createdSlotId = result?.id || ""; return nextStory; } });
    const createdSlot = createdSlotId
      ? story.roles.find((role) => role.id === roleId)?.slots.find((slot) => slot.id === createdSlotId)
      : null;
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
      const page = story.pages.find((item) => item.id === payload.pageId);
      const parsed = parseStoryComposition(page?.compositionJson);
      if (!page || ["invalid", "unsupported"].includes(parsed.kind) || parsed.issues.length) throw new Error("Bố cục trang chưa hợp lệ.");
      let assets = [
        ...story.pages.flatMap((item) => item.compositionData?.assets || []),
        ...story.roles.filter((role) => role.defaultAssetUrl).map((role) => ({ id: role.defaultAssetId, kind: "image", url: role.defaultAssetUrl })),
      ];
      if (mockFields.assetId && !assets.some((asset) => asset.id === mockFields.assetId)) assets = (await listAssets()).items;
      const slotExtensions = { ...(parsed.value?.slotExtensions || {}), [createdSlot.id]: mockFields };
      const encoded = serializeCompositionString({ ...page, slotExtensions }, assets, parsed.value);
      if (!encoded.ok) throw new Error(encoded.issues[0]?.message || "Không thể lưu tùy chọn nhân vật.");
      await writeBackendPageAndVerify({ pageId: page.id, payload: {
        text: page.text, status: page.status, compositionJson: encoded.json,
        compositionMode: "replace", expectedCompositionJson: page.compositionJson ?? null,
      } });
      return await getBackendEditor({ storyId });
    } catch {
      const accepted = new ApiError({ status: 503, code: "CONTENT_MUTATION_REFRESH_FAILED", message: "Vị trí nhân vật đã được tạo nhưng chưa thể lưu đầy đủ tùy chọn. Hãy tải lại truyện để kiểm tra." });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      throw accepted;
    }
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
    const before = await getBackendEditor({ storyId });
    const pageId = before.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === slotId)?.pageId || "";
    await mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-slots/${slotId}`, method: "DELETE" }));
    try { if (pageId) await removeBackendSlotCompositionReference(storyId, slotId, pageId); }
    catch (error) {
      const accepted = new ApiError({ status: 503, code: "CONTENT_SLOT_COMPOSITION_CLEANUP_FAILED", message: "Nhân vật đã được xóa nhưng bố cục chưa dọn được chuyển động/tùy chọn tham chiếu. Tải lại truyện để kiểm tra trước khi xuất bản." });
      accepted.mutationAccepted = true;
      accepted.storyId = storyId;
      accepted.cause = error;
      throw accepted;
    }
    removeMockSlot(activeUserId(), storyId, slotId);
    return getBackendEditor({ storyId });
  },
  listVocabulary: async ({ storyId, signal }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary`, signal });
    const editor = await getBackendEditor({ storyId, signal });
    return { items: editor.vocabulary };
  },
  addVocabulary: async ({ storyId, revision, pageId, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary`, method: "POST", body: revisionBody({ pageId, ...payload }, revision) });
    const body = backendVocabularyBody(payload);
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-pages/${pageId}/vocabularies`, method: "POST", body }), {
      decorate: (story, result) => verifyVocabularyReadback(story, result, { pageId, word: body.wordVi, meaning: body.meaning, audioUrl: body.audioUrl }),
    });
  },
  updateVocabulary: async ({ storyId, vocabularyId, revision, pageId, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/vocabulary/${vocabularyId}`, method: "PATCH", body: revisionBody({ pageId, ...payload }, revision) });
    const body = backendVocabularyBody(payload);
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-vocabulary/${vocabularyId}`, method: "PUT", body }), {
      decorate: (story) => verifyVocabularyReadback(story, null, { pageId, word: body.wordVi, meaning: body.meaning, audioUrl: body.audioUrl }, vocabularyId),
    });
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
    if (String(payload.feedback || "").trim() && !payload.pageId) {
      throw new ApiError({ status: 422, code: "CONTENT_QUIZ_FEEDBACK_PAGE_REQUIRED", message: "Lời giải thích chỉ được lưu khi câu hỏi gắn với một trang. Hãy chọn trang hoặc bỏ lời giải thích." });
    }
    let createdId = "";
    const story = await mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}/quizz`, method: "POST", body: backendQuizFormData(payload, { creating: true }) }), {
      decorate: (nextStory, result) => { createdId = result?.id || ""; return nextStory; },
    });
    if (!createdId) {
      if (payload.pageId || payload.feedback) throw acceptedQuizCompositionError(new Error("Backend không trả về ID câu hỏi."), storyId);
      return story;
    }
    try {
      if (payload.pageId || payload.feedback) await persistBackendQuizExtension({ storyId, quizId: createdId, toPageId: payload.pageId || "", feedback: payload.feedback || "" });
      removeMockQuizDraft(activeUserId(), storyId, createdId);
      return await getBackendEditor({ storyId });
    } catch (error) { throw acceptedQuizCompositionError(error, storyId); }
  },
  updateQuiz: async ({ storyId, quizId, revision, ...payload }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "PATCH", body: revisionBody(payload, revision) });
    if (String(payload.feedback || "").trim() && !payload.pageId) {
      throw new ApiError({ status: 422, code: "CONTENT_QUIZ_FEEDBACK_PAGE_REQUIRED", message: "Lời giải thích chỉ được lưu khi câu hỏi gắn với một trang. Hãy chọn trang hoặc bỏ lời giải thích." });
    }
    const before = await getBackendEditor({ storyId });
    const previous = before.quizzes.find((item) => item.id === quizId);
    await mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-quiz/${quizId}/with-image`, method: "PUT", body: backendQuizFormData(payload) }));
    try {
      const fromPageId = previous?.pageId || "";
      const toPageId = payload.pageId || "";
      if (fromPageId !== toPageId || (payload.feedback || "") !== (previous?.feedback || "")) {
        await persistBackendQuizExtension({ storyId, quizId, fromPageId, toPageId, feedback: payload.feedback || "" });
      }
      removeMockQuizDraft(activeUserId(), storyId, quizId);
      return await getBackendEditor({ storyId });
    } catch (error) { throw acceptedQuizCompositionError(error, storyId); }
  },
  deleteQuiz: async ({ storyId, quizId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/quizzes/${quizId}`, method: "DELETE", body: revisionBody({}, revision) });
    const before = await getBackendEditor({ storyId });
    const pageId = before.quizzes.find((item) => item.id === quizId)?.pageId || "";
    await mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-quiz/${quizId}`, method: "DELETE" }));
    try {
      if (pageId) await persistBackendQuizExtension({ storyId, quizId, fromPageId: pageId });
      removeMockQuizDraft(activeUserId(), storyId, quizId);
      return getBackendEditor({ storyId });
    } catch (error) { throw acceptedQuizCompositionError(error, storyId); }
  },
  previewStory: ({ storyId, signal }) => featureApiModes.content === "real"
    ? getBackendEditor({ storyId, signal, includeLocalChanges: false })
    : contentRequest({ path: `/content/stories/${storyId}/preview`, signal }),
  validateStory: ({ storyId, revision }) => featureApiModes.content === "real"
    ? validateBackendStory({ storyId })
    : contentRequest({ path: `/content/stories/${storyId}/validate`, method: "POST", body: revisionBody({}, revision) }),
  publishStory: async ({ storyId, revision }) => {
    if (featureApiModes.content !== "real") return contentRequest({ path: `/content/stories/${storyId}/publish`, method: "POST", body: { revision } });
    const current = await getBackendEditor({ storyId });
    if (current.localOnlyChanges?.hasChanges) throw new ApiError({ status: 422, code: "CONTENT_LOCAL_CHANGES_PENDING", message: "Còn thay đổi chỉ lưu trên thiết bị. Đồng bộ hoặc bỏ phần đó trước khi xuất bản." });
    if (current.hasUnverifiedComposition) throw new ApiError({ status: 422, code: "CONTENT_COMPOSITION_INVALID", message: "Có bố cục lỗi hoặc tham chiếu media/nhân vật chưa hợp lệ. Sửa các trang đó trước khi xuất bản." });
    const validation = await validateBackendStory({ storyId, story: current });
    if (!validation.valid) throw new ApiError({ status: 422, code: "CONTENT_PUBLISH_INVALID", message: validation.message });
    return mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}/publish`, method: "POST" }), {
      decorate: (story, publishResult) => {
        const readbackIssues = publicationReadbackIssues(story);
        if (readbackIssues.length) {
          const unconfirmed = new ApiError({
            status: 503,
            code: "CONTENT_PUBLISH_READBACK_INCOMPLETE",
            message: `Backend đã nhận lệnh xuất bản nhưng dữ liệu đọc lại chưa đầy đủ: ${readbackIssues.join(" ")} Hãy tải lại truyện để kiểm tra trước khi tiếp tục.`,
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
    ? mutateBackendStoryAndRefresh(storyId, () => contentRequest({ path: `/story-template/${storyId}`, method: "DELETE" }))
    : contentRequest({ path: `/content/stories/${storyId}/hide`, method: "POST", body: { revision } }),
  listAssets,
  deleteAsset,
  getStatistics: ({ range = "7d", signal } = {}) => featureApiModes.content === "real"
    ? getBackendStatistics(signal)
    : contentRequest({ path: `/content/statistics?range=${range}`, signal }),
  uploadAsset,
};

// Serialize the complete preflight/write/read-back operation, including callers
// outside React Query (media and composition extensions). This is per browser
// module only; the server still needs a revision/ETag for cross-client conflicts.
const storyWrites = new Map();
for (const name of ["updateStory", "addPage", "updatePage", "deletePage", "reorderPages", "addRole", "updateRole", "deleteRole", "addSlot", "updateSlot", "deleteSlot", "addVocabulary", "updateVocabulary", "deleteVocabulary", "addQuiz", "updateQuiz", "deleteQuiz", "publishStory", "hideStory"]) {
  const operation = contentService[name];
  contentService[name] = (params) => {
    if (featureApiModes.content !== "real") return operation(params);
    const key = `${activeUserId()}:${params.storyId}`;
    const next = (storyWrites.get(key) || Promise.resolve()).then(() => operation(params));
    const tail = next.catch(() => undefined);
    storyWrites.set(key, tail);
    void tail.then(() => { if (storyWrites.get(key) === tail) storyWrites.delete(key); });
    return next;
  };
}
