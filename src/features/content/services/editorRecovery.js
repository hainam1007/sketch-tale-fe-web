export function recoveryBaseline(story) {
  return JSON.stringify({
    pages: story.pages.map(({ id, text, status, compositionJson, backgroundUrl, audioNarrationUrl }) => ({ id, text, status, compositionJson, backgroundUrl, audioNarrationUrl })),
    roles: story.roles.map(({ id, slots }) => ({ id, slots })),
  });
}

export function readEditorRecovery(key, story) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.version !== 2 || saved.baseline !== recoveryBaseline(story) || !saved.pageDrafts || !saved.slotDrafts) return { raw, conflict: true };
    return { ...saved, raw, conflict: false };
  } catch { return { conflict: true }; }
}

export function writeEditorRecovery(key, story, drafts) {
  const previous = localStorage.getItem(key);
  // Back up before replacement/removal; failed storage writes keep the old copy.
  if (previous) localStorage.setItem(`${key}:backup`, previous);
  if (!Object.keys(drafts.pageDrafts).length && !Object.keys(drafts.slotDrafts).length) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify({ version: 2, baseline: recoveryBaseline(story), ...drafts }));
}
