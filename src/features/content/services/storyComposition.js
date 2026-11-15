import { migrateSequenceToClips } from "../utils/storyAnimation.js";
import { ANIMATION_PRESET_BY_ID } from "../utils/storyAnimationPresets.js";

export const STORY_COMPOSITION_VERSION = 1;
export const STORY_COMPOSITION_MAX_BYTES = 1_000_000;
export const STORY_COMPOSITION_MAX_IMAGES = 100;
export const STORY_COMPOSITION_MAX_AUDIO_TRACKS = 32;
export const STORY_COMPOSITION_MAX_ANIMATIONS = 200;
export const STORY_COMPOSITION_MAX_SUBTITLES = 500;

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isTime = (value) => Number.isSafeInteger(value) && value >= 0;
const validAnchor = (value) => ["center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(value);

function isDurableAssetUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase());
  } catch { return false; }
}

export function parseStoryComposition(raw) {
  if (raw == null || raw === "") return { kind: "legacy", value: null, issues: [] };
  if (typeof raw !== "string") return { kind: "invalid", value: null, raw, issues: [{ code: "composition.not_string", message: "Dữ liệu bố cục trang không đúng định dạng văn bản." }] };
  if (new TextEncoder().encode(raw).byteLength > STORY_COMPOSITION_MAX_BYTES) {
    return { kind: "invalid", value: null, raw, issues: [{ code: "composition.too_large", message: "Dữ liệu bố cục trang vượt giới hạn 1 MB của trình chỉnh sửa." }] };
  }
  let value;
  try { value = JSON.parse(raw); }
  catch { return { kind: "invalid", value: null, raw, issues: [{ code: "composition.invalid_json", message: "Dữ liệu bố cục trang bị lỗi. Hãy khôi phục hoặc xuất bản sao trước khi sửa." }] }; }
  if (!isRecord(value) || !Number.isInteger(value.schemaVersion)) {
    return { kind: "invalid", value, raw, issues: [{ code: "composition.invalid_version", message: "Dữ liệu bố cục không có phiên bản được hỗ trợ." }] };
  }
  if (value.schemaVersion > STORY_COMPOSITION_VERSION || value.schemaVersion < 1) {
    return { kind: "unsupported", value, raw, issues: [{ code: "composition.unsupported_version", message: `Bố cục phiên bản ${value.schemaVersion} chưa được trình chỉnh sửa này hỗ trợ. Dữ liệu gốc được giữ nguyên.` }] };
  }
  return { kind: "supported", value, raw, issues: validateStoryComposition(value) };
}

export function validateStoryComposition(value) {
  if (!isRecord(value) || value.schemaVersion !== STORY_COMPOSITION_VERSION) return [{ code: "composition.version", message: "Phiên bản bố cục không hợp lệ." }];
  const issues = [];
  const rows = [
    ["subtitles", STORY_COMPOSITION_MAX_SUBTITLES],
    ["imageObjects", STORY_COMPOSITION_MAX_IMAGES],
    ["audioTracks", STORY_COMPOSITION_MAX_AUDIO_TRACKS],
    ["animationClips", STORY_COMPOSITION_MAX_ANIMATIONS],
  ];
  for (const [key, limit] of rows) {
    if (key === "subtitles" && value[key] === null) continue;
    if (!Object.hasOwn(value, key) || !Array.isArray(value[key])) issues.push({ code: `composition.${key}.type`, message: `Danh sách ${key} không hợp lệ.` });
    else if (Array.isArray(value[key]) && value[key].length > limit) issues.push({ code: `composition.${key}.limit`, message: `Số lượng ${key} vượt giới hạn ${limit}.` });
  }
  if (!isRecord(value.background)) issues.push({ code: "composition.background.type", message: "Cấu hình ảnh nền không hợp lệ." });
  else {
    if (!value.background.mode || !["native", "inherit", "asset", "none"].includes(value.background.mode)) issues.push({ code: "composition.background.mode", message: "Kiểu ảnh nền không được hỗ trợ." });
    if (value.background.mode === "asset" && (typeof value.background.assetId !== "string" || !value.background.assetId)) issues.push({ code: "composition.background.asset_id", fieldPath: "background.assetId", message: "Ảnh nền cần tham chiếu đến một tệp ảnh." });
    if (![value.background.offsetX ?? 0, value.background.offsetY ?? 0, value.background.scale ?? 1].every(isFiniteNumber) || Number(value.background.scale ?? 1) < 1 || Number(value.background.scale ?? 1) > 3 || Math.abs(Number(value.background.offsetX ?? 0)) > 100 || Math.abs(Number(value.background.offsetY ?? 0)) > 100) issues.push({ code: "composition.background.transform", fieldPath: "background", message: "Căn chỉnh ảnh nền không hợp lệ." });
  }
  if (value.stage != null && (!isRecord(value.stage) || value.stage.aspectRatio !== "16:9" || value.stage.coordinates !== "percent" || value.stage.anchor !== "center")) issues.push({ code: "composition.stage.invalid", fieldPath: "stage", message: "Kích thước hoặc hệ tọa độ khung hình chưa được hỗ trợ." });
  if (value.extensions != null && !isRecord(value.extensions)) issues.push({ code: "composition.extensions.type", fieldPath: "extensions", message: "Phần mở rộng bố cục không hợp lệ." });
  if (Array.isArray(value.subtitles)) value.subtitles.forEach((cue, index) => {
    if (!isRecord(cue) || typeof cue.id !== "string" || !cue.id || typeof cue.text !== "string" || !cue.text.trim() || !isTime(cue.startMs) || !Number.isSafeInteger(cue.durationMs) || cue.durationMs <= 0) issues.push({ code: "composition.subtitle.invalid", entityId: cue?.id || String(index), fieldPath: `subtitles.${index}`, message: "Phụ đề cần mã, nội dung và thời gian nguyên mili giây hợp lệ." });
  });
  for (const [key, entries] of [["subtitles", value.subtitles], ["imageObjects", value.imageObjects], ["audioTracks", value.audioTracks], ["animationClips", value.animationClips]]) {
    if (!Array.isArray(entries)) continue;
    const ids = new Set();
    entries.forEach((entry, index) => {
      const id = entry?.id;
      if (typeof id !== "string" || !id) return;
      if (ids.has(id)) issues.push({ code: `composition.${key}.duplicate_id`, entityId: id, fieldPath: `${key}.${index}.id`, message: `Mã ${key} bị trùng.` });
      ids.add(id);
    });
  }
  if (Array.isArray(value.imageObjects)) value.imageObjects.forEach((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id || typeof item.assetId !== "string" || !item.assetId || ![item.x, item.y, item.scale, item.rotation ?? 0, item.layer ?? 1].every(isFiniteNumber) || item.x < 0 || item.x > 100 || item.y < 0 || item.y > 100 || item.scale <= 0 || !Number.isInteger(item.layer ?? 1) || (item.anchor != null && !validAnchor(item.anchor)) || (item.flip != null && typeof item.flip !== "boolean")) issues.push({ code: "composition.image.invalid", entityId: item?.id || String(index), fieldPath: `imageObjects.${index}`, message: "Ảnh phụ có vị trí hoặc tư liệu không hợp lệ." });
  });
  if (!Array.isArray(value.assets)) issues.push({ code: "composition.assets.type", message: "Danh mục tư liệu của trang không hợp lệ." });
  const assetIds = new Set((Array.isArray(value.assets) ? value.assets : []).map((asset) => asset?.id));
  const assetById = new Map((Array.isArray(value.assets) ? value.assets : []).map((asset) => [asset?.id, asset]));
  if (value.background?.mode === "asset" && value.background.assetId && (!assetIds.has(value.background.assetId) || assetById.get(value.background.assetId)?.kind !== "image")) issues.push({ code: "composition.background.asset_missing", entityId: value.background.assetId, fieldPath: "background.assetId", message: "Không tìm thấy tệp ảnh nền được tham chiếu." });
  if (Array.isArray(value.imageObjects)) value.imageObjects.forEach((item, index) => {
    if (item?.assetId && (!assetIds.has(item.assetId) || assetById.get(item.assetId)?.kind !== "image")) issues.push({ code: "composition.image.asset_missing", entityId: item.id || String(index), fieldPath: `imageObjects.${index}.assetId`, message: "Không tìm thấy tệp ảnh phụ được tham chiếu." });
  });
  if (Array.isArray(value.audioTracks)) value.audioTracks.forEach((track, index) => {
    if (!isRecord(track) || typeof track.id !== "string" || !track.id || typeof track.assetId !== "string" || !track.assetId || !["voiceover", "music", "effect"].includes(track.type) || !isTime(track.startMs ?? 0) || (track.durationMs != null && (!Number.isSafeInteger(track.durationMs) || track.durationMs <= 0)) || !isFiniteNumber(track.volume ?? 1) || Number(track.volume ?? 1) < 0 || Number(track.volume ?? 1) > 1) issues.push({ code: "composition.audio.invalid", entityId: track?.id || String(index), fieldPath: `audioTracks.${index}`, message: "Track âm thanh có thời điểm, thời lượng, âm lượng hoặc tệp không hợp lệ." });
  });
  if (Array.isArray(value.audioTracks)) value.audioTracks.forEach((track, index) => {
    if (track?.assetId && (!assetIds.has(track.assetId) || assetById.get(track.assetId)?.kind !== "audio")) issues.push({ code: "composition.audio.asset_missing", entityId: track.id || String(index), fieldPath: `audioTracks.${index}.assetId`, message: "Không tìm thấy tệp âm thanh được tham chiếu." });
  });
  if (Array.isArray(value.animationClips)) value.animationClips.forEach((clip, index) => {
    const validKind = ["preset", "keyframes", "path"].includes(clip?.kind);
    if (!isRecord(clip) || typeof clip.id !== "string" || !clip.id || typeof clip.targetId !== "string" || !clip.targetId || !validKind || !isTime(clip.startMs) || !Number.isSafeInteger(clip.durationMs) || clip.durationMs <= 0) {
      issues.push({ code: "composition.animation.invalid", entityId: clip?.id || String(index), fieldPath: `animationClips.${index}`, message: "Chuyển động cần mục tiêu, kiểu và thời gian hợp lệ." });
      return;
    }
    if (clip.kind === "path" && (!Array.isArray(clip.points) || clip.points.length < 2 || clip.points.length > 160 || clip.points.some((point) => !isFiniteNumber(point?.x) || !isFiniteNumber(point?.y) || Number(point.x) < 0 || Number(point.x) > 100 || Number(point.y) < 0 || Number(point.y) > 100))) issues.push({ code: "composition.animation.path", entityId: clip.id, fieldPath: `animationClips.${index}.points`, message: "Đường chuyển động cần ít nhất hai điểm trong khung hình." });
    if (clip.kind === "keyframes" && (!Array.isArray(clip.keyframes) || !clip.keyframes.length || clip.keyframes.some((frame) => !isRecord(frame) || !isTime(frame.timeMs) || Number(frame.timeMs) > Number(clip.durationMs) || !["x", "y", "scale", "rotation", "opacity"].some((key) => frame[key] != null) || ["x", "y", "scale", "rotation", "opacity"].some((key) => frame[key] != null && (!isFiniteNumber(frame[key]) || (key === "x" || key === "y") && (Number(frame[key]) < 0 || Number(frame[key]) > 100) || key === "scale" && (Number(frame[key]) < 0.1 || Number(frame[key]) > 5) || key === "opacity" && (Number(frame[key]) < 0 || Number(frame[key]) > 1) || key === "rotation" && Math.abs(Number(frame[key])) > 3600))))) issues.push({ code: "composition.animation.keyframes", entityId: clip.id, fieldPath: `animationClips.${index}.keyframes`, message: "Keyframe phải có thời điểm và thuộc tính hợp lệ trong thời lượng chuyển động." });
    if (clip.kind === "preset" && (!clip.preset || !ANIMATION_PRESET_BY_ID[clip.preset])) issues.push({ code: "composition.animation.preset", entityId: clip.id, fieldPath: `animationClips.${index}.preset`, message: "Chuyển động preset cần tên hiệu ứng được hỗ trợ." });
    if (clip.easing != null && !["linear", "ease-in", "ease-out", "ease-in-out"].includes(clip.easing)) issues.push({ code: "composition.animation.easing", entityId: clip.id, fieldPath: `animationClips.${index}.easing`, message: "Kiểu tăng giảm tốc chưa được hỗ trợ." });
    if (clip.params != null && !isRecord(clip.params)) issues.push({ code: "composition.animation.params", entityId: clip.id, fieldPath: `animationClips.${index}.params`, message: "Thông số chuyển động không hợp lệ." });
  });
  if (Array.isArray(value.assets)) {
    const seen = new Map();
    for (const [index, asset] of (value.assets || []).entries()) {
      if (!isRecord(asset) || typeof asset.id !== "string" || !asset.id || !["image", "audio"].includes(asset.kind) || !isDurableAssetUrl(asset.url) || (asset.mimeType != null && typeof asset.mimeType !== "string") || (asset.size != null && (!isFiniteNumber(asset.size) || asset.size < 0)) || (asset.durationMs != null && (!Number.isSafeInteger(asset.durationMs) || asset.durationMs <= 0))) {
        issues.push({ code: "composition.asset.invalid", entityId: asset?.id || String(index), fieldPath: `assets.${index}`, message: "Tư liệu cần mã ổn định và URL có thể truy cập sau khi tải lại." });
        continue;
      }
      const previous = seen.get(asset.id);
      if (previous) issues.push({ code: previous.url !== asset.url || previous.kind !== asset.kind ? "composition.asset.conflict" : "composition.asset.duplicate_id", entityId: asset.id, fieldPath: `assets.${index}`, message: previous.url !== asset.url || previous.kind !== asset.kind ? "Một mã tư liệu đang trỏ tới nhiều tệp khác nhau." : "Danh mục tư liệu có mã bị lặp." });
      seen.set(asset.id, asset);
    }
  }
  if (value.slotExtensions != null && !isRecord(value.slotExtensions)) issues.push({ code: "composition.slot_extensions.type", message: "Cấu hình nhân vật trang không hợp lệ." });
  if (isRecord(value.slotExtensions)) for (const [slotId, extension] of Object.entries(value.slotExtensions)) {
    if (!slotId || !isRecord(extension) || (extension.rotation != null && !isFiniteNumber(extension.rotation)) || (extension.layer != null && !Number.isInteger(extension.layer)) || (extension.anchor != null && !validAnchor(extension.anchor)) || (extension.assetId != null && typeof extension.assetId !== "string") || (extension.assetId && (!assetIds.has(extension.assetId) || assetById.get(extension.assetId)?.kind !== "image"))) issues.push({ code: "composition.slot_extension.invalid", entityId: slotId, fieldPath: `slotExtensions.${slotId}`, message: "Tùy chọn bổ sung của vị trí nhân vật không hợp lệ." });
  }
  if (value.quizExtensions != null && !isRecord(value.quizExtensions)) issues.push({ code: "composition.quiz_extensions.type", message: "Cấu hình câu hỏi trang không hợp lệ." });
  if (isRecord(value.quizExtensions)) for (const [quizId, extension] of Object.entries(value.quizExtensions)) {
    if (!quizId || !isRecord(extension) || (extension.feedback != null && typeof extension.feedback !== "string")) issues.push({ code: "composition.quiz_extension.invalid", entityId: quizId, fieldPath: `quizExtensions.${quizId}`, message: "Lời giải thích câu hỏi không hợp lệ." });
  }
  return issues;
}

function remoteAsset(asset) {
  if (!asset?.id || !asset?.url || !["image", "audio"].includes(asset.kind)) return null;
  if (asset.source === "mock" || asset.local || (asset.source === "cloudinary" && !asset.uploadedToBackend)) return null;
  if (!isDurableAssetUrl(asset.url)) return null;
  return { id: String(asset.id), kind: asset.kind, name: asset.name || "", url: asset.url, mimeType: asset.mimeType || "", size: Number(asset.size) || 0, ...(asset.duration ? { durationMs: Math.round(Number(asset.duration) * 1000) } : {}) };
}

export function serializeStoryComposition(page, assets = [], previous = null) {
  const byId = new Map((assets || []).map((asset) => [asset.id, asset]));
  const audioTracks = Array.isArray(page.audioTracks) ? page.audioTracks : [];
  const imageObjects = Array.isArray(page.imageObjects) ? page.imageObjects : [];
  const backgroundAssetId = page.backgroundAssetId || "";
  const requestedBackgroundMode = page.backgroundMode || page.compositionData?.background?.mode;
  const slotExtensions = Object.hasOwn(page, "slotExtensions")
    ? (isRecord(page.slotExtensions) ? page.slotExtensions : {})
    : (isRecord(previous?.slotExtensions) ? previous.slotExtensions : {});
  const preserveRows = (rows, oldRows) => rows.map((row) => ({
    ...(Array.isArray(oldRows) ? oldRows.find((old) => old.id === row.id) : {}), ...row,
  }));
  const referencedIds = new Set([
    ...audioTracks.map((item) => item.assetId),
    ...imageObjects.map((item) => item.assetId),
    ...Object.values(slotExtensions).map((item) => item?.assetId),
    ...(backgroundAssetId && (requestedBackgroundMode === "asset" || (!requestedBackgroundMode && !String(backgroundAssetId).startsWith("page-background:"))) ? [backgroundAssetId] : []),
  ].filter(Boolean));
  const manifest = new Map((Array.isArray(previous?.assets) ? previous.assets : []).map((asset) => [asset.id, asset]));
  for (const id of referencedIds) {
    const current = remoteAsset(byId.get(id));
    if (current) manifest.set(id, { ...(manifest.get(id) || {}), ...current });
  }
  const retainedIds = new Set(referencedIds);
  const assetsManifest = [...manifest.values()].filter((asset) => retainedIds.has(asset.id));
  const background = requestedBackgroundMode === "none"
    ? { mode: "none", assetId: null, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 }
    : requestedBackgroundMode === "inherit"
      ? { mode: "inherit", assetId: null, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 }
      : requestedBackgroundMode === "asset"
        ? { mode: "asset", assetId: backgroundAssetId || null, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 }
        : backgroundAssetId && !String(backgroundAssetId).startsWith("page-background:")
    ? { mode: "asset", assetId: backgroundAssetId, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 }
        : requestedBackgroundMode === "native" || page.backgroundUrl
      ? { mode: "native", assetId: null, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 }
      : { mode: "none", assetId: null, offsetX: Number(page.backgroundOffsetX) || 0, offsetY: Number(page.backgroundOffsetY) || 0, scale: Number(page.backgroundScale) || 1 };
  const preserved = isRecord(previous) ? { ...previous } : {};
  delete preserved.sequence;
  return {
    ...preserved,
    schemaVersion: STORY_COMPOSITION_VERSION,
    stage: { aspectRatio: "16:9", coordinates: "percent", anchor: "center", ...(isRecord(previous?.stage) ? previous.stage : {}) },
    background: { ...(isRecord(previous?.background) ? previous.background : {}), ...background },
    subtitles: page.subtitles == null ? null : preserveRows(page.subtitles, previous?.subtitles),
    imageObjects: preserveRows(imageObjects, previous?.imageObjects),
    animationClips: preserveRows(Array.isArray(page.animationClips) ? page.animationClips : [], previous?.animationClips),
    audioTracks: preserveRows(audioTracks, previous?.audioTracks),
    slotExtensions,
    quizExtensions: Object.hasOwn(page, "quizExtensions")
      ? (isRecord(page.quizExtensions) ? page.quizExtensions : {})
      : (isRecord(previous?.quizExtensions) ? previous.quizExtensions : {}),
    assets: assetsManifest,
    extensions: isRecord(previous?.extensions) ? previous.extensions : {},
  };
}

export function hydratePageFromComposition(page, parsed) {
  if (parsed?.kind !== "supported" || parsed.issues.length) return { ...page, compositionState: parsed?.kind || "legacy", compositionIssues: parsed?.issues || [] };
  const composition = parsed.value;
  const background = composition.background || {};
  const backgroundFields = background.mode === "none"
    ? { backgroundUrl: "", backgroundAssetId: "" }
    : background.mode === "asset"
      ? { backgroundUrl: "", backgroundAssetId: background.assetId || "" }
      : background.mode === "inherit"
        ? { backgroundUrl: "", backgroundAssetId: "story-cover:inherit" }
        : {};
  return {
    ...page,
    ...backgroundFields,
    backgroundMode: background.mode || "native",
    backgroundOffsetX: Number(background.offsetX) || 0,
    backgroundOffsetY: Number(background.offsetY) || 0,
    backgroundScale: Number(background.scale) || 1,
    subtitles: composition.subtitles === null ? null : (composition.subtitles || []),
    imageObjects: composition.imageObjects || [],
    animationClips: Array.isArray(composition.animationClips) && composition.animationClips.length
      ? composition.animationClips
      : migrateSequenceToClips(composition.sequence || []),
    sequence: [],
    audioTracks: Array.isArray(composition.audioTracks) ? composition.audioTracks : (page.audioTracks || []),
    slotExtensions: composition.slotExtensions || {},
    quizExtensions: composition.quizExtensions || {},
    compositionData: composition,
    compositionState: "supported",
    compositionIssues: [],
  };
}

export function serializeCompositionString(page, assets, previous) {
  const composition = serializeStoryComposition(page, assets, previous);
  const issues = validateStoryComposition(composition);
  if (issues.length) return { ok: false, issues, value: composition };
  const json = JSON.stringify(composition);
  if (new TextEncoder().encode(json).byteLength > STORY_COMPOSITION_MAX_BYTES) return { ok: false, value: composition, issues: [{ code: "composition.too_large", message: "Dữ liệu bố cục trang vượt giới hạn 1 MB." }] };
  return { ok: true, json, value: composition, issues: [] };
}
