export const ANIMATION_PROPERTIES = ["x", "y", "scale", "rotation", "opacity"];

export function createId(prefix = "animation") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function migrateSequenceToClips(sequence = []) {
  let startMs = 0;
  return sequence.map((item, index) => {
    const clip = {
      id: item.id || `legacy-animation-${index + 1}`,
      targetId: item.slotId,
      kind: "preset",
      preset: item.preset,
      startMs,
      durationMs: Number(item.durationMs) || 900,
      params: item.params || {},
    };
    startMs += clip.durationMs;
    return clip;
  });
}

export function pageAnimationClips(page) {
  return Array.isArray(page?.animationClips) ? page.animationClips : migrateSequenceToClips(page?.sequence || []);
}

function ease(progress, easing = "linear") {
  const t = Math.max(0, Math.min(1, progress));
  if (easing === "ease-in") return t * t;
  if (easing === "ease-out") return 1 - (1 - t) ** 2;
  if (easing === "ease-in-out") return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  return t;
}

function interpolateKeyframes(keyframes, property, localTime, fallback) {
  const points = keyframes
    .filter((frame) => Number.isFinite(Number(frame.timeMs)) && Number.isFinite(Number(frame[property])))
    .sort((left, right) => Number(left.timeMs) - Number(right.timeMs));
  if (!points.length) return fallback;
  if (localTime < Number(points[0].timeMs)) return fallback;
  if (localTime === Number(points[0].timeMs)) return Number(points[0][property]);
  const last = points.at(-1);
  if (localTime >= Number(last.timeMs)) return Number(last[property]);
  const nextIndex = points.findIndex((point) => Number(point.timeMs) >= localTime);
  const from = points[nextIndex - 1];
  const to = points[nextIndex];
  const duration = Number(to.timeMs) - Number(from.timeMs);
  const progress = duration > 0 ? (localTime - Number(from.timeMs)) / duration : 1;
  const amount = ease(progress, from.easing);
  return Number(from[property]) + (Number(to[property]) - Number(from[property])) * amount;
}

function pointOnPath(points, progress) {
  if (!points?.length) return null;
  if (points.length === 1) return { x: Number(points[0].x), y: Number(points[0].y) };
  const lengths = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const dx = Number(points[index].x) - Number(points[index - 1].x);
    const dy = Number(points[index].y) - Number(points[index - 1].y);
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    total += length;
  }
  if (total <= 0) return { x: Number(points[0].x), y: Number(points[0].y) };
  let remaining = total * Math.max(0, Math.min(1, progress));
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (remaining <= length || index === lengths.length - 1) {
      const amount = length > 0 ? remaining / length : 0;
      const from = points[index];
      const to = points[index + 1];
      return { x: Number(from.x) + (Number(to.x) - Number(from.x)) * amount, y: Number(from.y) + (Number(to.y) - Number(from.y)) * amount };
    }
    remaining -= length;
  }
  return { x: Number(points.at(-1).x), y: Number(points.at(-1).y) };
}

export function evaluateSlotAnimation(slot, clips = [], playheadMs = 0) {
  const base = { x: Number(slot.x) || 0, y: Number(slot.y) || 0, scale: Number(slot.scale) || 1, rotation: Number(slot.rotation) || 0, opacity: 1 };
  const state = { ...base };
  const related = clips.filter((clip) => clip.targetId === slot.id).sort((left, right) => Number(left.startMs || 0) - Number(right.startMs || 0));

  for (const clip of related) {
    const start = Math.max(0, Number(clip.startMs) || 0);
    const duration = Math.max(1, Number(clip.durationMs) || 900);
    const local = playheadMs - start;
    if (local < 0) continue;
    if (clip.kind === "keyframes") {
      for (const property of ANIMATION_PROPERTIES) {
        state[property] = interpolateKeyframes(clip.keyframes || [], property, local, state[property]);
      }
      continue;
    }
    if (clip.kind === "path") {
      const progress = ease(local / duration, clip.easing);
      const point = pointOnPath(clip.points, progress);
      if (point && local >= 0) { state.x = point.x; state.y = point.y; }
      continue;
    }
    if (clip.kind !== "preset") continue;
    if (local < 0) continue;
    const progress = ease(local / duration, clip.easing);
    const amount = Math.max(0, Math.min(1, progress));
    const distance = Number(clip.params?.distance) || 12;
    if (clip.preset === "appear") { state.opacity = amount; state.scale *= 0.88 + amount * 0.12; }
    if (clip.preset === "move") state.x = Math.max(0, Math.min(100, state.x + amount * distance));
    if (clip.preset === "jump") state.y -= Math.sin(amount * Math.PI) * distance;
    if (clip.preset === "spin") state.rotation += amount * 360;
    if (clip.preset === "walk") state.y -= Math.abs(Math.sin(amount * Math.PI * 4)) * 2;
  }
  return state;
}

export function animationDuration(page, audioDurations = {}) {
  const motionEnd = pageAnimationClips(page).reduce((end, clip) => Math.max(end, Number(clip.startMs || 0) + Number(clip.durationMs || 0)), 0);
  const audioEnd = (page?.audioTracks || []).reduce((end, track) => {
    const fullLength = Number(track.durationMs || audioDurations[track.id] || 3000);
    const playableLength = Number(track.durationMs) > 0 ? Number(track.durationMs) : Math.max(0, fullLength - Number(track.trimStartMs || 0));
    return Math.max(end, Number(track.startMs || 0) + playableLength);
  }, 0);
  return Math.max(3000, motionEnd, audioEnd);
}

export function clipsConflict(clips, candidate, excludeId) {
  const intervalsFor = (clip) => {
    const start = Number(clip.startMs || 0);
    const end = start + Number(clip.durationMs || 0);
    if (clip.kind === "path") return [["x", start, end], ["y", start, end]];
    if (clip.kind === "preset") return (({ move: ["x"], jump: ["y"], spin: ["rotation"], appear: ["opacity", "scale"], walk: ["y"] }[clip.preset]) || []).map((property) => [property, start, end]);
    if (clip.kind !== "keyframes") return [];
    return ANIMATION_PROPERTIES.flatMap((property) => {
      const times = (clip.keyframes || []).filter((frame) => Number.isFinite(Number(frame[property]))).map((frame) => Number(frame.timeMs)).sort((left, right) => left - right);
      return times.length ? [[property, start + times[0], end]] : [];
    });
  };
  const candidateIntervals = intervalsFor(candidate);
  return clips.some((clip) => {
    if (clip.id === excludeId || clip.targetId !== candidate.targetId) return false;
    return candidateIntervals.some(([candidateProperty, candidateStart, candidateEnd]) => intervalsFor(clip).some(([existingProperty, existingStart, existingEnd]) => candidateProperty === existingProperty && candidateStart < existingEnd && existingStart < candidateEnd));
  });
}
