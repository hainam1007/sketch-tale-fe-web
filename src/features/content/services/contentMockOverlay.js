const STORAGE_PREFIX = "sketchtale.content-overlay.v1";

function storageKey(userId, storyId) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(userId || "unknown")}:${encodeURIComponent(storyId || "unknown")}`;
}

export function readContentMockOverlay(userId, storyId) {
  try {
    const raw = localStorage.getItem(storageKey(userId, storyId));
    if (!raw) return { storyDraft: {}, pageDrafts: {}, slotDrafts: {}, quizDrafts: {}, slots: [], pageOrder: [] };
    const parsed = JSON.parse(raw);
    return {
      storyDraft: parsed.storyDraft || {},
      pageDrafts: parsed.pageDrafts || {},
      slotDrafts: parsed.slotDrafts || {},
      quizDrafts: parsed.quizDrafts || {},
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
      pageOrder: Array.isArray(parsed.pageOrder) ? parsed.pageOrder : [],
    };
  } catch {
    return { storyDraft: {}, pageDrafts: {}, slotDrafts: {}, quizDrafts: {}, slots: [], pageOrder: [] };
  }
}

function updateOverlay(userId, storyId, update) {
  const current = readContentMockOverlay(userId, storyId);
  const next = update(current);
  localStorage.setItem(storageKey(userId, storyId), JSON.stringify(next));
  return next;
}

export function saveMockStoryDraft(userId, storyId, fields) {
  return updateOverlay(userId, storyId, (current) => ({
    ...current,
    storyDraft: { ...current.storyDraft, ...fields },
  }));
}

export function mergeMockStoryDraft(story, userId, storyId) {
  const { storyDraft } = readContentMockOverlay(userId, storyId);
  return { ...story, ...storyDraft };
}

export function saveMockPageDraft(userId, storyId, pageId, fields) {
  return updateOverlay(userId, storyId, (current) => ({
    ...current,
    pageDrafts: { ...current.pageDrafts, [pageId]: { ...current.pageDrafts[pageId], ...fields } },
  }));
}

export function saveMockSlotDraft(userId, storyId, slotId, fields) {
  return updateOverlay(userId, storyId, (current) => ({
    ...current,
    slotDrafts: { ...current.slotDrafts, [slotId]: { ...current.slotDrafts[slotId], ...fields } },
  }));
}

export function removeMockSlot(userId, storyId, slotId) {
  return updateOverlay(userId, storyId, (current) => {
    const slotDrafts = { ...current.slotDrafts };
    delete slotDrafts[slotId];
    const pageDrafts = Object.fromEntries(Object.entries(current.pageDrafts).map(([pageId, value]) => {
      const draft = value && typeof value === "object" ? value : {};
      return [pageId, {
        ...draft,
        ...(Array.isArray(draft.sequence) ? { sequence: draft.sequence.filter((item) => item.slotId !== slotId) } : {}),
        ...(Array.isArray(draft.animationClips) ? { animationClips: draft.animationClips.filter((item) => item.targetId !== slotId) } : {}),
      }];
    }));
    return {
      ...current,
      pageDrafts,
      slotDrafts,
      slots: current.slots.filter((slot) => slot.id !== slotId),
    };
  });
}

export function saveMockQuizDraft(userId, storyId, quizId, fields) {
  return updateOverlay(userId, storyId, (current) => ({
    ...current,
    quizDrafts: { ...current.quizDrafts, [quizId]: { ...current.quizDrafts[quizId], ...fields } },
  }));
}

export function removeMockQuizDraft(userId, storyId, quizId) {
  return updateOverlay(userId, storyId, (current) => {
    const quizDrafts = { ...current.quizDrafts };
    delete quizDrafts[quizId];
    return { ...current, quizDrafts };
  });
}

export function addMockSlot(userId, storyId, roleId, payload) {
  const overlay = updateOverlay(userId, storyId, (current) => {
    if (current.slots.some((slot) => slot.roleId === roleId && slot.pageId === payload.pageId)) {
      throw new Error("Nhân vật này đã được thêm vào trang đã chọn.");
    }
    const id = `mock-slot:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 9)}`;
    return {
      ...current,
      slots: [...current.slots, { ...payload, id, roleId, source: "mock" }],
    };
  });
  return overlay;
}

export function saveMockPageOrder(userId, storyId, pageIds) {
  return updateOverlay(userId, storyId, (current) => ({ ...current, pageOrder: [...pageIds] }));
}

export function removeMockPage(userId, storyId, pageId, slotIds = [], quizIds = []) {
  const deletedQuizzes = new Set(quizIds);
  return updateOverlay(userId, storyId, (current) => {
    const deletedSlots = new Set([
      ...slotIds,
      ...current.slots.filter((slot) => slot.pageId === pageId).map((slot) => slot.id),
    ]);
    const pageDrafts = { ...current.pageDrafts };
    delete pageDrafts[pageId];
    const slotDrafts = { ...current.slotDrafts };
    deletedSlots.forEach((slotId) => delete slotDrafts[slotId]);
    const quizDrafts = { ...current.quizDrafts };
    deletedQuizzes.forEach((quizId) => delete quizDrafts[quizId]);
    return {
      ...current,
      pageDrafts,
      slotDrafts,
      quizDrafts,
      slots: current.slots.filter((slot) => slot.pageId !== pageId),
      pageOrder: current.pageOrder.filter((id) => id !== pageId),
    };
  });
}

export function mergeContentMockOverlay(story, userId, storyId) {
  const overlay = readContentMockOverlay(userId, storyId);
  let pages = story.pages.map((page) => ({ ...page, ...(overlay.pageDrafts[page.id] || {}) }));
  if (overlay.pageOrder.length) {
    const byId = new Map(pages.map((page) => [page.id, page]));
    pages = [
      ...overlay.pageOrder.map((id) => byId.get(id)).filter(Boolean),
      ...pages.filter((page) => !overlay.pageOrder.includes(page.id)),
    ].map((page, index) => ({ ...page, order: index + 1 }));
  }
  const roles = story.roles.map((role) => {
    const existing = (role.slots || []).map((slot) => {
      const draft = overlay.slotDrafts[slot.id] || {};
      if (slot.source !== "backend") return { ...slot, ...draft };
      const mockOnlyFields = Object.fromEntries(["rotation", "layer", "anchor", "assetId"].filter((field) => Object.prototype.hasOwnProperty.call(draft, field)).map((field) => [field, draft[field]]));
      return { ...slot, ...mockOnlyFields };
    });
    const added = overlay.slots.filter((slot) => slot.roleId === role.id).map((slot) => ({
      ...slot,
      ...(overlay.slotDrafts[slot.id] || {}),
      x: Number(overlay.slotDrafts[slot.id]?.x ?? slot.x ?? 50),
      y: Number(overlay.slotDrafts[slot.id]?.y ?? slot.y ?? 50),
      scale: Number(overlay.slotDrafts[slot.id]?.scale ?? slot.scale ?? 1),
      flip: Boolean(overlay.slotDrafts[slot.id]?.flip ?? slot.flip),
      layer: Number(overlay.slotDrafts[slot.id]?.layer ?? slot.layer ?? 1),
    }));
    return { ...role, slots: [...existing, ...added] };
  });
  const quizzes = story.quizzes.map((quiz) => ({ ...quiz, ...(overlay.quizDrafts[quiz.id] || {}) }));
  const hasData = Object.keys(overlay.storyDraft).length > 0 || Object.keys(overlay.pageDrafts).length > 0 || Object.keys(overlay.slotDrafts).length > 0 || Object.keys(overlay.quizDrafts).length > 0 || overlay.slots.length > 0 || overlay.pageOrder.length > 0;
  return { ...story, ...overlay.storyDraft, pages, roles, quizzes, mockOverlay: { hasData, source: "mock" } };
}
