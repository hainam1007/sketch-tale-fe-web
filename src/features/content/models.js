/**
 * Frontend-owned content contract.
 *
 * The API adapter may translate these shapes to the backend contract. Keep
 * the editor and preview dependent on these stable IDs instead of array
 * indexes so a later API change does not leak through every page.
 */

export const CONTENT_ROLE = "content_manager";

export const STORY_STATUSES = Object.freeze(["draft", "published", "hidden"]);
export const ASSET_KINDS = Object.freeze(["image", "audio"]);

/**
 * Permissions are deliberately explicit. Parent and admin do not inherit
 * authoring permissions from this map; the backend remains authoritative.
 */
export const CONTENT_PERMISSION_MATRIX = Object.freeze({
  [CONTENT_ROLE]: Object.freeze({
    read: true,
    edit: true,
    publish: true,
    hide: true,
    upload: true,
    statistics: true,
  }),
  parent: Object.freeze({ read: false, edit: false, publish: false, hide: false, upload: false, statistics: false }),
  admin: Object.freeze({ read: false, edit: false, publish: false, hide: false, upload: false, statistics: false }),
});

/** @typedef {"read"|"edit"|"publish"|"hide"|"upload"|"statistics"} ContentPermission */

/**
 * @param {{ role?: string }|string|null|undefined} userOrRole
 * @param {ContentPermission} permission
 */
export function canContent(userOrRole, permission) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return Boolean(CONTENT_PERMISSION_MATRIX[role]?.[permission]);
}

/**
 * @typedef {Object} StoryDraft
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} categoryId
 * @property {string|null} coverAssetId
 * @property {"draft"|"published"|"hidden"} status
 * @property {number} revision
 * @property {string|null} publishedVersionId
 * @property {boolean} draftDirty
 * @property {string} updatedAt
 * @property {PageDraft[]} pages
 * @property {RoleDraft[]} roles
 * @property {VocabularyEntry[]} vocabulary
 * @property {QuizDraft[]} quizzes
 * @property {PublishedVersion[]} versions
 */

/**
 * @typedef {Object} PageDraft
 * @property {string} id
 * @property {number} order
 * @property {string} title
 * @property {string} text
 * @property {string|null} backgroundAssetId
 * @property {string} narration
 */

/**
 * @typedef {Object} RoleDraft
 * @property {string} id
 * @property {string} name
 * @property {boolean} custom
 * @property {boolean} sensitive
 * @property {string|null} defaultAssetId
 * @property {SlotDraft[]} slots
 */

/**
 * @typedef {Object} SlotDraft
 * @property {string} id
 * @property {string} pageId
 * @property {string} roleId
 * @property {number} x
 * @property {number} y
 * @property {number} scale
 * @property {boolean} flip
 * @property {number} layer
 * @property {string|null} [anchor]
 */

/**
 * @typedef {Object} VocabularyEntry
 * @property {string} id
 * @property {string} pageId
 * @property {string} word
 * @property {string} meaning
 * @property {string} audioUrl
 */

/**
 * @typedef {Object} QuizDraft
 * @property {string} id
 * @property {string} pageId
 * @property {string} question
 * @property {string[]} options
 * @property {number} correctIndex
 * @property {string} feedback
 * @property {string} audioUrl
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {"image"|"audio"} kind
 * @property {string} mimeType
 * @property {number} size
 * @property {string} url
 * @property {string} [name]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration]
 * @property {"ready"|"processing"|"failed"} [processingStatus]
 */

/**
 * @typedef {Object} PublishedVersion
 * @property {string} id
 * @property {number} version
 * @property {number} revision
 * @property {string} publishedAt
 * @property {Object} snapshot
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} code
 * @property {string} message
 * @property {string} tab
 * @property {string|null} entityId
 * @property {string|null} fieldPath
 */

/**
 * Normalize server data at the feature boundary. This is intentionally
 * conservative: unknown fields are preserved for forward compatibility.
 * @param {Partial<StoryDraft>|null|undefined} story
 * @returns {StoryDraft|null}
 */
export function normalizeStory(story) {
  if (!story) return null;
  const pages = [...(story.pages || [])]
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
    .map((page, index) => normalizePage({ ...page, order: index + 1 }));
  const roles = (story.roles || []).map((role) => normalizeRole(role));
  return {
    ...story,
    title: story.title || "",
    description: story.description || "",
    categoryId: story.categoryId || story.category || "",
    coverAssetId: story.coverAssetId || null,
    status: STORY_STATUSES.includes(story.status) ? story.status : "draft",
    revision: Number(story.revision || 1),
    publishedVersionId: story.publishedVersionId || null,
    draftDirty: Boolean(story.draftDirty),
    pages,
    pagesCount: pages.length,
    roles,
    vocabulary: (story.vocabulary || []).map(normalizeVocabulary),
    quizzes: (story.quizzes || []).map(normalizeQuiz),
    versions: story.versions || [],
  };
}

/** @param {Partial<PageDraft>} page @returns {PageDraft} */
export function normalizePage(page) {
  return {
    ...page,
    id: page.id || "",
    order: Number(page.order || 1),
    title: page.title || "",
    text: page.text || "",
    backgroundAssetId: page.backgroundAssetId || null,
    narration: page.narration || "",
  };
}

/** @param {Partial<RoleDraft>} role @returns {RoleDraft} */
export function normalizeRole(role) {
  const roleId = role.id || "";
  return {
    ...role,
    id: roleId,
    name: role.name || "",
    custom: role.custom !== false,
    sensitive: Boolean(role.sensitive),
    defaultAssetId: role.defaultAssetId || null,
    slots: (role.slots || []).map((slot) => normalizeSlot({ ...slot, roleId: slot.roleId || roleId })),
  };
}

/** @param {Partial<SlotDraft>} slot @returns {SlotDraft} */
export function normalizeSlot(slot) {
  return {
    ...slot,
    id: slot.id || "",
    pageId: slot.pageId || "",
    roleId: slot.roleId || "",
    x: Number.isFinite(Number(slot.x)) ? Number(slot.x) : 0,
    y: Number.isFinite(Number(slot.y)) ? Number(slot.y) : 0,
    scale: Number.isFinite(Number(slot.scale)) && Number(slot.scale) > 0 ? Number(slot.scale) : 1,
    flip: Boolean(slot.flip),
    layer: Number.isFinite(Number(slot.layer)) ? Number(slot.layer) : 0,
    anchor: slot.anchor || null,
  };
}

/** @param {Partial<VocabularyEntry>} entry @returns {VocabularyEntry} */
export function normalizeVocabulary(entry) {
  return { ...entry, id: entry.id || "", pageId: entry.pageId || "", word: entry.word || "", meaning: entry.meaning || "", audioUrl: entry.audioUrl || "" };
}

/** @param {Partial<QuizDraft>} quiz @returns {QuizDraft} */
export function normalizeQuiz(quiz) {
  const options = Array.isArray(quiz.options) ? quiz.options : [];
  return { ...quiz, id: quiz.id || "", pageId: quiz.pageId || "", question: quiz.question || "", options, correctIndex: Number.isInteger(quiz.correctIndex) ? quiz.correctIndex : 0, feedback: quiz.feedback || "", audioUrl: quiz.audioUrl || "" };
}

/**
 * Return only the mutable content that is captured in a published snapshot.
 * @param {StoryDraft} story
 */
export function storySnapshot(story) {
  const normalized = normalizeStory(story);
  return {
    title: normalized.title,
    description: normalized.description,
    categoryId: normalized.categoryId,
    coverAssetId: normalized.coverAssetId,
    pages: normalized.pages,
    roles: normalized.roles,
    vocabulary: normalized.vocabulary,
    quizzes: normalized.quizzes,
    revision: normalized.revision,
  };
}

