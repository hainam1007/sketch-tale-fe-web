// Half-open intervals prevent adjacent captions appearing together at a boundary.
export function subtitleAt(page, timeMs = 0) {
  if (!Array.isArray(page?.subtitles)) return page?.text || "";
  return page.subtitles.filter((cue) => timeMs >= cue.startMs && timeMs < cue.startMs + cue.durationMs).map((cue) => cue.text).filter(Boolean).join("\n");
}
