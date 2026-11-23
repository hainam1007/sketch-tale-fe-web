import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowLeft, CaretLeft, CaretRight, CheckCircle, Eye, Image as ImageIcon, MagicWand, Plus, SpeakerHigh, Stack, TextT, Trash, UploadSimple, UserPlus, X } from "@phosphor-icons/react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import DismissButton from "../../../components/feedback/DismissButton";
import { EditorField, EditorMutationMessage } from "../components/StoryEditorParts";
import PublishIssues from "../components/PublishIssues";
import AssetPicker from "../components/AssetPicker";
import StoryPageRenderer from "../components/StoryPageRenderer";
import StoryAnimationEditor from "../components/StoryAnimationEditor";
import { useContentAssets, useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { validateAssetFile } from "../services/assetService";
import { mergeContentMockOverlay, removeMockPage, removeMockPageDraftFields, removeMockSlotDraftFields, saveMockPageDraft, saveMockSlotDraft } from "../services/contentMockOverlay";
import { featureApiModes } from "../../../lib/api/featureApi";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ANIMATION_PRESETS } from "../utils/storyAnimationPresets";
import { animationDuration, clipsConflict, createId, evaluateSlotAnimation, pageAnimationClips } from "../utils/storyAnimation";
import { compactAudioFilename, normalizeStoryAudioTracks, stopStoryAudio, syncStoryAudio } from "../utils/storyAudio";
import { parseStoryComposition, serializeCompositionString } from "../services/storyComposition";
import { readEditorRecovery, writeEditorRecovery } from "../services/editorRecovery";

const emptyPage = { text: "", backgroundAssetId: "", backgroundUrl: "", backgroundMode: "none", backgroundOffsetX: 0, backgroundOffsetY: 0, backgroundScale: 1, narration: "", subtitles: null, imageObjects: [], audioTracks: [], sequence: [], animationClips: [] };
const emptySlot = { pageId: "", x: 50, y: 50, scale: 1, rotation: 0, flip: false, layer: 1, anchor: "center", assetId: "" };
const EMPTY_ASSETS = [];
const STORY_ROLE_TYPES = [[0, "Nhân vật chính"], [1, "Bạn đồng hành"], [2, "Nhân vật hỗ trợ"], [3, "Khác"]];
const storyTools = [["images", "Hình ảnh", ImageIcon], ["audio", "Âm thanh", SpeakerHigh], ["subtitles", "Phụ đề", TextT], ["motion", "Chuyển động", MagicWand], ["layers", "Asset", Stack]];

function compactAssetName(name = "") {
  const fileName = String(name || "");
  if (fileName.length <= 24) return fileName;
  const extensionIndex = fileName.lastIndexOf(".");
  if (extensionIndex <= 0) return `${fileName.slice(0, 8)}...`;
  return `${fileName.slice(0, 6)}...${fileName.slice(extensionIndex)}`;
}

function pageValues(page) {
  return page ? {
    subtitles: page.subtitles ?? null, imageObjects: page.imageObjects || [], text: page.text || "", backgroundAssetId: page.backgroundAssetId || "",
    backgroundUrl: page.backgroundUrl || "",
    backgroundMode: page.backgroundMode || page.compositionData?.background?.mode || (page.backgroundUrl ? "native" : "none"),
    backgroundOffsetX: Number.isFinite(Number(page.backgroundOffsetX)) ? Math.max(-100, Math.min(100, Number(page.backgroundOffsetX))) : 0,
    backgroundOffsetY: Number.isFinite(Number(page.backgroundOffsetY)) ? Math.max(-100, Math.min(100, Number(page.backgroundOffsetY))) : 0,
    backgroundScale: Number.isFinite(Number(page.backgroundScale)) ? Math.max(1, Math.min(3, Number(page.backgroundScale))) : 1,
    narration: page.narration || "",
    status: page.status,
    audioTracks: normalizeStoryAudioTracks(page.audioTracks || []), sequence: page.sequence || [], animationClips: pageAnimationClips(page),
    ...(typeof page.compositionJson === "string" ? { compositionJson: page.compositionJson } : {}),
    compositionState: page.compositionState || "legacy",
    compositionData: page.compositionData || null,
  } : emptyPage;
}

function slotValues(slot) {
  return slot ? { pageId: slot.pageId, x: slot.x, y: slot.y, scale: slot.scale, rotation: Number(slot.rotation || 0), flip: Boolean(slot.flip), layer: slot.layer, anchor: slot.anchor || "center", assetId: slot.assetId || "" } : emptySlot;
}

function reorderWithHiddenPages(visiblePageIds, serverPageIds) {
  const visibleIds = new Set(visiblePageIds);
  const visibleServerIds = serverPageIds.filter((pageId) => visibleIds.has(pageId));
  if (visibleServerIds.length !== visiblePageIds.length || visibleIds.size !== visiblePageIds.length) return null;
  let nextVisibleIndex = 0;
  return serverPageIds.map((pageId) => visibleIds.has(pageId) ? visiblePageIds[nextVisibleIndex++] : pageId);
}

function readLegacyStoryDraft(key, story) {
  const empty = { pageDrafts: {}, slotDrafts: {}, shouldClear: false };
  try {
    const candidate = JSON.parse(localStorage.getItem(key) || "null");
    if (!candidate) return empty;
    const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
    const isCompatible = candidate.version === 1
      && candidate.revision === story.revision
      && isRecord(candidate.pageDrafts)
      && isRecord(candidate.slotDrafts)
      && Object.values(candidate.pageDrafts).every(isRecord)
      && Object.values(candidate.slotDrafts).every(isRecord);
    if (!isCompatible) return empty;

    const pageDrafts = Object.fromEntries(Object.entries(candidate.pageDrafts).map(([pageId, values]) => [
      pageId,
      Object.fromEntries(Object.entries(values).filter(([key]) => key !== "title")),
    ]).filter(([pageId, values]) => {
      const original = story.pages.find((page) => page.id === pageId);
      return original && JSON.stringify(values) !== JSON.stringify(pageValues(original));
    }));
    const slotDrafts = Object.fromEntries(Object.entries(candidate.slotDrafts).filter(([slotId, values]) => {
      const original = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === slotId);
      return original && (values?.__deleted || JSON.stringify(values) !== JSON.stringify(slotValues(original)));
    }));
    const hasChanges = Object.keys(pageDrafts).length || Object.keys(slotDrafts).length;
    return { pageDrafts, slotDrafts, shouldClear: !hasChanges };
  } catch {
    return empty;
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validatePageDraft(values, pageSlots, assets, measuredAudioDurations = {}, skipSlotReferenceValidation = false) {
  if ((values.subtitles || []).some((cue) => !cue.id || !Number.isFinite(cue.startMs) || cue.startMs < 0 || !Number.isFinite(cue.durationMs) || cue.durationMs < 100)) return "Kiểm tra thời gian phụ đề.";
  if ((values.imageObjects || []).some((item) => !item.id || !assets.some((asset) => asset.id === item.assetId && asset.kind === "image") || validateSlotDraft(item))) return "Kiểm tra ảnh phụ và vị trí trên trang.";
  const slots = new Set([...pageSlots.map(({ slot }) => slot.id), ...(values.imageObjects || []).map((item) => item.id)]);
  const validEasing = new Set(["linear", "ease-in", "ease-out", "ease-in-out"]);
  const validPresets = new Set(ANIMATION_PRESETS.map(({ id }) => id));
  const audioTracks = Array.isArray(values.audioTracks) ? values.audioTracks : [];
  if (audioTracks.some((track, index) => {
    const asset = assets.find((item) => item.id === track.assetId && item.kind === "audio");
    const duration = Number(track.durationMs || 0);
    const sourceDuration = Number(asset?.duration || 0) * 1000 || Number(measuredAudioDurations[track.id]) || 0;
    return !track.id || audioTracks.some((other, otherIndex) => otherIndex !== index && other.id === track.id) || !asset || !Number.isFinite(Number(track.startMs || 0)) || Number(track.startMs || 0) < 0 || (track.durationMs !== undefined && (!Number.isFinite(duration) || duration <= 0)) || (sourceDuration > 0 && duration > sourceDuration + 1) || !Number.isFinite(Number(track.volume ?? 1)) || Number(track.volume ?? 1) < 0 || Number(track.volume ?? 1) > 1;
  })) return "Hãy kiểm tra tệp, thời điểm, thời lượng và âm lượng của từng track âm thanh.";
  if ((values.sequence || []).some((item) => (!skipSlotReferenceValidation && !slots.has(item.slotId)) || !validPresets.has(item.preset) || !Number.isFinite(Number(item.durationMs || 900)) || Number(item.durationMs || 900) < 200 || Number(item.durationMs || 900) > 5000)) return "Hãy chọn nhân vật còn trên trang và thời lượng từ 200 đến 5000 ms cho mỗi hoạt động cũ.";
  const clips = pageAnimationClips(values);
  if (clips.some((clip, index) => !clip.id || clips.some((other, otherIndex) => otherIndex !== index && other.id === clip.id))) return "Mỗi chuyển động cần có một mã riêng. Hãy kiểm tra lại dữ liệu chuyển động.";
  if (clips.some((clip) => {
    if ((!skipSlotReferenceValidation && !slots.has(clip.targetId)) || !Number.isFinite(Number(clip.startMs)) || Number(clip.startMs) < 0 || !Number.isFinite(Number(clip.durationMs)) || Number(clip.durationMs) <= 0 || (clip.easing && !validEasing.has(clip.easing))) return true;
    if (clip.kind === "preset") return !validPresets.has(clip.preset);
    if (clip.kind === "path") {
      const points = Array.isArray(clip.points) ? clip.points : [];
      return points.length < 2 || points.length > 160 || points.some((point) => !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y)) || Number(point.x) < 0 || Number(point.x) > 100 || Number(point.y) < 0 || Number(point.y) > 100) || points.every((point, index) => index === 0 || Math.hypot(Number(point.x) - Number(points[index - 1].x), Number(point.y) - Number(points[index - 1].y)) < 0.01);
    }
    if (clip.kind !== "keyframes") return true;
    const frames = Array.isArray(clip.keyframes) ? clip.keyframes : [];
    if (!frames.length || frames.some((frame) => !Number.isFinite(Number(frame.timeMs)) || Number(frame.timeMs) < 0 || Number(frame.timeMs) > Number(clip.durationMs) || (frame.easing && !validEasing.has(frame.easing)) || ["x", "y", "scale", "rotation", "opacity"].some((property) => frame[property] !== undefined && !Number.isFinite(Number(frame[property]))) || ["x", "y"].some((property) => frame[property] !== undefined && (Number(frame[property]) < 0 || Number(frame[property]) > 100)) || (frame.scale !== undefined && (Number(frame.scale) < 0.1 || Number(frame.scale) > 5)) || (frame.rotation !== undefined && Math.abs(Number(frame.rotation)) > 3600) || (frame.opacity !== undefined && (Number(frame.opacity) < 0 || Number(frame.opacity) > 1)))) return true;
    return frames.some((frame, index) => frames.some((other, otherIndex) => otherIndex > index && Math.abs(Number(frame.timeMs) - Number(other.timeMs)) < 1));
  })) return "Một chuyển động không còn nhân vật hoặc có thời điểm, đường đi hay keyframe không hợp lệ.";
  if (clips.some((clip) => clipsConflict(clips, clip, clip.id))) return "Có hai clip cùng điều khiển một thuộc tính trong cùng thời gian. Hãy chỉnh lại trước khi lưu.";
  return "";
}

function normalizedSlotDraft(values) {
  return { ...values, x: Number(values.x), y: Number(values.y), scale: Number(values.scale), rotation: Number(values.rotation || 0), layer: Number(values.layer) };
}

function validateSlotDraft(values) {
  const slot = normalizedSlotDraft(values);
  return ![slot.x, slot.y, slot.scale, slot.rotation, slot.layer].every(Number.isFinite) || slot.x < 0 || slot.x > 100 || slot.y < 0 || slot.y > 100 || slot.scale < 0.1 || slot.scale > 5 || Math.abs(slot.rotation) > 3600 || slot.layer < 1 || !Number.isInteger(slot.layer)
    ? "Vị trí phải từ 0–100%, kích thước từ 0,1–5, góc xoay trong ±3600° và lớp hiển thị là số nguyên dương."
    : "";
}

function ImageFields({ values, assets, prefix, hasBackground, onBackgroundChange, onUploadBackground, uploadDisabled }) {
  const selectedBackground = assets.find((asset) => asset.id === values.backgroundAssetId);

  function selectBackground(value, asset) {
    const backgroundMode = !value
      ? "none"
      : value === `page-background:${prefix.replace(/^page-/, "")}`
        ? "native"
        : "asset";
    const backgroundUrl = backgroundMode === "native" ? asset?.url || values.backgroundUrl || "" : "";
    onBackgroundChange(value === values.backgroundAssetId
      ? { backgroundAssetId: value, backgroundMode, backgroundUrl }
      : { backgroundAssetId: value, backgroundMode, backgroundUrl, backgroundOffsetX: 0, backgroundOffsetY: 0, backgroundScale: 1 });
  }

  return <section className="story-background-section" aria-label="Thư viện ảnh trang">
    <div className="story-background-section-body" id={`story-background-picker-${prefix}`}>
      <AssetPicker assets={assets} id={`story-editor-${prefix}-background`} label="Thư viện ảnh" category="background" value={values.backgroundAssetId} onChange={selectBackground} uploadFile={onUploadBackground} disabled={uploadDisabled} emptyLabel="Kho ảnh chưa có hình nào." presentation="gallery" showUploadHint={false} />
      <BackgroundTransformControls values={values} onChange={onBackgroundChange} disabled={!hasBackground} />
    </div>
  </section>;
}

function BackgroundTransformControls({ values, onChange, disabled }) {
  const scale = Number(values.backgroundScale || 1);
  return <section className="story-background-controls" aria-label="Căn chỉnh ảnh nền">
    <div className="story-background-controls-heading"><strong>Căn chỉnh trên khung</strong><button className="workspace-text-link" type="button" onClick={() => onChange({ backgroundOffsetX: 0, backgroundOffsetY: 0, backgroundScale: 1 })} disabled={disabled || (scale === 1 && !values.backgroundOffsetX && !values.backgroundOffsetY)}>Đặt lại</button></div>

    <label><span><strong>Thu phóng</strong><output>{Math.round(scale * 100)}%</output></span><input type="range" min="1" max="3" step="0.01" value={scale} onChange={(event) => onChange({ backgroundScale: Number(event.target.value) })} disabled={disabled} /></label>
    <label><span><strong>Căn ngang</strong><output>{Math.round(Number(values.backgroundOffsetX || 0))}%</output></span><input type="range" min="-100" max="100" step="1" value={values.backgroundOffsetX || 0} onChange={(event) => onChange({ backgroundOffsetX: Number(event.target.value) })} disabled={disabled} /></label>
    <label><span><strong>Căn dọc</strong><output>{Math.round(Number(values.backgroundOffsetY || 0))}%</output></span><input type="range" min="-100" max="100" step="1" value={values.backgroundOffsetY || 0} onChange={(event) => onChange({ backgroundOffsetY: Number(event.target.value) })} disabled={disabled} /></label>
  </section>;
}
function SlotFields({ values, assets, onChange }) {
  return <div className="editor-form slot-properties-form">
    <div className="editor-field"><AssetPicker assets={assets} id="story-editor-character-pose" label="Ảnh đang chọn" category={values.id?.startsWith("image-") ? "background" : "character"} value={values.assetId} onChange={(value) => onChange("assetId", value)} allowEmpty={false} emptyLabel="" showUploadHint={false} /></div>
    <div className="editor-form-grid story-slot-position-fields">
      <EditorField label="Vị trí ngang (%)" name="selected-slot-x" type="number" min="0" max="100" step="0.5" value={values.x} onChange={(value) => onChange("x", value)} />
      <EditorField label="Vị trí dọc (%)" name="selected-slot-y" type="number" min="0" max="100" step="0.5" value={values.y} onChange={(value) => onChange("y", value)} />
      <EditorField label="Kích thước" name="selected-slot-scale" type="number" min="0.1" max="5" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
      <EditorField label="Góc xoay (°)" name="selected-slot-rotation" type="number" min="-3600" max="3600" step="1" value={values.rotation} onChange={(value) => onChange("rotation", value)} />
      <EditorField label="Lớp hiển thị" name="selected-slot-layer" type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
    </div>
    <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật ảnh</label>
  </div>;
}

function AudioSequence({ values, assets, audioDurations, onChange, onUpload, onDuration, isUploading, uploadError }) {
  const audioAssets = assets.filter((asset) => asset.kind === "audio" && asset.url && asset.processingStatus !== "failed");
  function updateTrack(index, patch) {
    onChange(values.map((track, trackIndex) => trackIndex === index ? { ...track, ...patch } : track));
  }
  return <section className="story-sequence-section" aria-label="Âm thanh trang này">
    <div className="story-sequence-heading"><div className="story-sequence-add-audio"><label className="sr-only" htmlFor="story-add-audio">Thêm âm thanh</label><select id="story-add-audio" value="" onChange={(event) => {
      const assetId = event.target.value;
      if (!assetId) return;
      const asset = audioAssets.find((item) => item.id === assetId);
      onChange([...values, { id: uid("audio"), assetId, name: asset?.name || "Âm thanh", type: "voiceover", startMs: 0, ...(Number(asset?.duration) > 0 ? { durationMs: Math.round(Number(asset.duration) * 1000) } : {}), volume: 1 }]);
      event.target.value = "";
    }} disabled={!audioAssets.length}>
      <option value="">{audioAssets.length ? "+ Chọn âm thanh" : "Chưa có âm thanh trong kho"}</option>
      {audioAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
    </select><label className="workspace-button workspace-button-quiet story-audio-upload"><input type="file" hidden accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/aac" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload(file); }} /><UploadSimple size={15} aria-hidden="true" />{isUploading ? "Đang tải…" : "Tải âm thanh lên"}</label></div></div>
    {uploadError && <p className="editor-field-error" role="alert">{uploadError}</p>}
    {values.length ? <ol className="story-audio-track-list">{values.map((track, index) => {
      const asset = assets.find((item) => item.id === track.assetId);
      const audioName = asset?.name || track.name || "Âm thanh không khả dụng";
      const fullDurationMs = Number(asset?.duration) > 0 ? Number(asset.duration) * 1000 : Number(audioDurations?.[track.id]) || 0;
      const durationValue = Number(track.durationMs) > 0 ? Number(track.durationMs) : fullDurationMs;
      return <li className="story-audio-track" key={track.id}>
        <span className="story-audio-track-order">{String(index + 1).padStart(2, "0")}</span>
        <div className="story-audio-track-main"><div className="story-audio-track-heading"><strong title={audioName}>{compactAudioFilename(audioName)}</strong><div className="story-audio-track-actions"><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa âm thanh ${audioName}`} title="Xóa âm thanh" onClick={() => onChange(values.filter((_, trackIndex) => trackIndex !== index))}><Trash size={17} aria-hidden="true" /></button></div></div>{asset?.url ? <audio controls preload="metadata" src={asset.url} aria-label={`Nghe ${asset.name}`} onLoadedMetadata={(event) => { const length = event.currentTarget.duration; if (Number.isFinite(length) && length > 0) onDuration?.(track.id, Math.round(length * 1000)); }} /> : <small className="editor-field-error">Không tải được tệp. Hãy chọn âm thanh khác trong thư viện.</small>}
          <div className="story-audio-timing"><label>Bắt đầu (s)<input type="number" min="0" step="0.1" value={(Number(track.startMs || 0) / 1000).toFixed(1)} onChange={(event) => updateTrack(index, { startMs: Math.max(0, Number(event.target.value) * 1000 || 0) })} /></label><label>Thời lượng (s)<input type="number" min="0.1" max={fullDurationMs ? Math.max(0.1, fullDurationMs / 1000) : undefined} step="0.1" placeholder={fullDurationMs ? (fullDurationMs / 1000).toFixed(1) : "Tự động"} value={durationValue ? (durationValue / 1000).toFixed(1) : ""} onChange={(event) => updateTrack(index, { durationMs: event.target.value ? Math.max(100, Number(event.target.value) * 1000 || 100) : undefined })} /></label><label className="story-audio-volume">Âm lượng <span>{Math.round((Number(track.volume ?? 1)) * 100)}%</span><input type="range" min="0" max="100" step="1" value={Math.round((Number(track.volume ?? 1)) * 100)} onChange={(event) => updateTrack(index, { volume: Number(event.target.value) / 100 })} /></label></div>
        </div>

      </li>;
    })}</ol> : <p className="story-sequence-empty">Chưa có âm thanh</p>}
  </section>;
}

export default function StoryPagesPage() {
  const { user } = useAuth();
  const confirmToast = useConfirmToast();
  const queryClient = useQueryClient();
  const { story, storyId, setEditorDirty, refetchStory, onPublish, isPublishing, publishError, validation } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const pendingAssetUploads = useIsMutating({ mutationKey: ["content-upload", storyId] });
  const [assetsErrorDismissed, setAssetsErrorDismissed] = useState(false);
  const [dismissedSlotWarningPageId, setDismissedSlotWarningPageId] = useState("");
  useEffect(() => setAssetsErrorDismissed(false), [assetsQuery.error]);
  const [searchParams] = useSearchParams();
  const recoveryMigrationKey = `sketchtale.story-draft.v1:${user.id}:${storyId}`;
  const recoveryKey = `sketchtale.story-draft.v2:${user.id}:${storyId}`;
  const [recovery] = useState(() => readEditorRecovery(recoveryKey, story));
  const [legacyRecovery] = useState(() => readLegacyStoryDraft(recoveryMigrationKey, story));
  const recoveredDrafts = recovery && !recovery.conflict ? recovery : legacyRecovery;
  const initialPage = story.pages.find((page) => page.id === searchParams.get("pageId")) || story.pages[0];
  const initialSlot = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === searchParams.get("slotId") && slot.pageId === initialPage?.id);
  const [selectedPageId, setSelectedPageId] = useState(initialPage?.id || "");
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlot?.id || "");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState("");
  const [selectedPathPoint, setSelectedPathPoint] = useState(null);
  const [activeTool, setActiveTool] = useState("images");
  const [recordingKeyframes, setRecordingKeyframes] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(true);
  const [animationProperty, setAnimationProperty] = useState("x");
  const [animationTab, setAnimationTab] = useState("effects");
  const [animationError, setAnimationError] = useState("");
  const [pageDrafts, setPageDrafts] = useState(recoveredDrafts.pageDrafts);
  const [slotDrafts, setSlotDrafts] = useState(recoveredDrafts.slotDrafts);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [roleToAdd, setRoleToAdd] = useState("");
  const [quickCharacterOpen, setQuickCharacterOpen] = useState(false);
  const [quickCharacterName, setQuickCharacterName] = useState("");
  const [quickCharacterType, setQuickCharacterType] = useState("0");
  const [quickCharacterAssetId, setQuickCharacterAssetId] = useState("");
  const [quickCharacterFile, setQuickCharacterFile] = useState(null);
  const [quickCharacterPreviewUrl, setQuickCharacterPreviewUrl] = useState("");
  const [quickCharacterError, setQuickCharacterError] = useState("");
  const [quickCharacterBusy, setQuickCharacterBusy] = useState(false);
  const [quickCharacterNeedsReload, setQuickCharacterNeedsReload] = useState(false);
  const [pendingRoleToPlace, setPendingRoleToPlace] = useState(null);
  const [localError, setLocalError] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState("");
  const [dropTargetPageId, setDropTargetPageId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [playheadMs, setPlayheadMs] = useState(0);
  const playheadRef = useRef(0);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [audioDurations, setAudioDurations] = useState({});
  const audioPlayersRef = useRef(new Map());
  const playStartRef = useRef(0);
  const playheadStartRef = useRef(0);
  const workspaceRef = useRef(null);
  const emptyPageActionRef = useRef(null);
  const focusEmptyPageAfterDeleteRef = useRef(false);
  const keyboardDeleteActionsRef = useRef({});
  const draftStateRef = useRef({ pageDrafts: recoveredDrafts.pageDrafts, slotDrafts: recoveredDrafts.slotDrafts });
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const undoGroupRef = useRef({ key: "", started: false });
  const lastUndoEditRef = useRef({ key: "", at: 0 });
  const draggedPageRef = useRef("");
  const saveCycleInProgressRef = useRef(false);
  const saveAllDraftsRef = useRef(null);

  function commitDraftChange(update, { key = "", recordUndo = true } = {}) {
    const current = draftStateRef.current;
    const next = update(current);
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    setLocalError("");

    if (recordUndo) {
      redoStackRef.current = [];
      setRedoCount(0);
      const now = Date.now();
      const activeGroup = undoGroupRef.current;
      const isActiveGroup = key && activeGroup.key === key;
      const startsNewGroup = !isActiveGroup && (lastUndoEditRef.current.key !== key || now - lastUndoEditRef.current.at > 650);
      if (isActiveGroup ? !activeGroup.started : startsNewGroup) {
        undoStackRef.current = [...undoStackRef.current, current].slice(-100);
        if (isActiveGroup) activeGroup.started = true;
      }
      lastUndoEditRef.current = { key, at: now };
    }

    draftStateRef.current = next;
    setPageDrafts(next.pageDrafts);
    setSlotDrafts(next.slotDrafts);
    setUndoCount(undoStackRef.current.length);
  }

  function beginUndoGroup(key) {
    undoGroupRef.current = { key, started: false };
  }

  function endUndoGroup(key) {
    if (undoGroupRef.current.key !== key) return;
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
  }

  function undoDraftChange() {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(draftStateRef.current);
    setRedoCount(redoStackRef.current.length);
    draftStateRef.current = previous;
    setPageDrafts(previous.pageDrafts);
    setSlotDrafts(previous.slotDrafts);
    setUndoCount(undoStackRef.current.length);
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
  }

  function redoDraftChange() {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(draftStateRef.current);
    draftStateRef.current = next;
    setPageDrafts(next.pageDrafts);
    setSlotDrafts(next.slotDrafts);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
  }

  function rebaseUndoHistory(transform) {
    const rebase = (stack) => {
      const rebased = [];
      for (const snapshot of stack) {
        const next = transform(snapshot);
        if (!rebased.length || JSON.stringify(rebased.at(-1)) !== JSON.stringify(next)) rebased.push(next);
      }
      return rebased;
    };
    const rebasedUndo = rebase(undoStackRef.current);
    if (rebasedUndo.length && JSON.stringify(rebasedUndo.at(-1)) === JSON.stringify(draftStateRef.current)) rebasedUndo.pop();
    const rebasedRedo = rebase(redoStackRef.current);
    undoStackRef.current = rebasedUndo;
    redoStackRef.current = rebasedRedo;
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
    setUndoCount(rebasedUndo.length);
    setRedoCount(rebasedRedo.length);
  }

  const mutation = useStoryEditorMutation(({ action, pageId, roleId, slotId, payload, revision }) => {
    if (action === "add") return contentService.addPage({ storyId, revision, ...payload });
    if (action === "update") return contentService.updatePage({ storyId, pageId, revision, ...payload });
    if (action === "delete-page") return contentService.deletePage({ storyId, pageId, revision });
    if (action === "add-role") return contentService.addRole({ storyId, revision, ...payload });
    if (action === "add-slot") return contentService.addSlot({ storyId, roleId, revision, ...payload });
    if (action === "update-slot") return contentService.updateSlot({ storyId, roleId, slotId, revision, ...payload });
    if (action === "delete-slot") return contentService.deleteSlot({ storyId, roleId, slotId, revision });
    return contentService.reorderPages({ storyId, pageIds: payload, revision });
  });
  const uploadAudioMutation = useMutation({
    scope: { id: `content-story-${storyId}` },
    retry: false,
    mutationFn: async ({ file, pageId }) => {
      const page = (queryClient.getQueryData(queryKeys.story(user.id, storyId)) || story).pages.find((item) => item.id === pageId);
      if (!page) throw new Error("Không tìm thấy trang cần thêm âm thanh.");
      const hasServerNarration = Boolean(page.audioNarrationUrl);
      if (featureApiModes.content === "real" && !hasServerNarration) {
        const nextStory = await contentService.updatePage({
          storyId, pageId,
          ...(typeof page.compositionJson === "string" ? { compositionJson: page.compositionJson, compositionMode: "preserve", expectedCompositionJson: page.compositionJson } : {}),
          audioFile: file,
        });
        const saved = nextStory.pages.find((item) => item.id === pageId);
        if (!saved?.audioNarrationUrl) throw new Error("Máy chủ chưa trả về đường dẫn lời kể sau khi tải lên.");
        return { asset: { id: `page-audio:${pageId}`, name: file.name, kind: "audio", mimeType: file.type || "audio/*", size: file.size, url: saved.audioNarrationUrl, source: "backend", readOnly: true }, pageId, story: nextStory, serverSaved: true };
      }
      return { asset: await contentService.uploadAsset({ file }), pageId, serverSaved: false };
    },
    onSuccess: async ({ asset, pageId, story: savedStory, serverSaved }) => {
      queryClient.setQueryData(queryKeys.assets(user.id), (current) => current ? { ...current, items: [...(current.items || []).filter((item) => item.id !== asset.id), asset] } : current);
      if (savedStory) queryClient.setQueryData(queryKeys.story(user.id, storyId), savedStory);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
      commitDraftChange((current) => {
        const page = (savedStory || story).pages.find((item) => item.id === pageId);
        if (!page) return current;
        const draft = current.pageDrafts[pageId] || pageValues(page);
        const track = { id: serverSaved ? `page-audio-track:${pageId}` : uid("audio"), assetId: asset.id, name: asset.name, type: "voiceover", startMs: 0, ...(Number(asset.duration) > 0 ? { durationMs: Math.round(Number(asset.duration) * 1000) } : {}), volume: 1 };
        const tracks = (draft.audioTracks || []).filter((item) => item.assetId !== asset.id);
        return { ...current, pageDrafts: { ...current.pageDrafts, [pageId]: { ...draft, audioTracks: [...tracks, track] } } };
      }, { key: `page:${pageId}:audioTracks` });
    },
  });
  const assets = assetsQuery.data?.items || EMPTY_ASSETS;
  const mutationOutcomeBlocked = Boolean(mutation.error?.mutationAccepted || mutation.error?.mutationOutcomeUnknown || uploadAudioMutation.error?.mutationAccepted || uploadAudioMutation.error?.mutationOutcomeUnknown);
  const publishOutcomeBlocked = Boolean(publishError?.mutationAccepted || publishError?.mutationOutcomeUnknown);
  const selectedPage = story.pages.find((page) => page.id === selectedPageId) || story.pages[0];
  const slotsUnavailable = Boolean(selectedPage?.slotsUnavailable);
  const selectedPageIndex = selectedPage ? story.pages.findIndex((page) => page.id === selectedPage.id) : -1;
  useEffect(() => {
    if (!quickCharacterFile) {
      setQuickCharacterPreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(quickCharacterFile);
    setQuickCharacterPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [quickCharacterFile]);
  useEffect(() => {
    if (story.pages.length || !focusEmptyPageAfterDeleteRef.current) return;
    focusEmptyPageAfterDeleteRef.current = false;
    emptyPageActionRef.current?.focus();
  }, [story.pages.length]);
  const selectedPageKey = selectedPage?.id;
  const selectedPageDraft = selectedPage ? pageDrafts[selectedPage.id] : undefined;
  const pageDraft = useMemo(() => selectedPageDraft || pageValues(selectedPage), [selectedPage, selectedPageDraft]);
  const selectedImage = (pageDraft.imageObjects || []).find((item) => item.id === selectedSlotId);
  const animationClips = pageAnimationClips(pageDraft);
  const pageDurationMs = animationDuration(pageDraft, audioDurations);
  const selectedSlotRecord = useMemo(() => story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === selectedSlotId && !slotDrafts[slot.id]?.__deleted), [selectedSlotId, slotDrafts, story.roles]);
  const slotDraft = selectedSlotRecord ? slotDrafts[selectedSlotRecord.slot.id] || slotValues(selectedSlotRecord.slot) : emptySlot;
  const pageSlots = useMemo(() => story.roles.flatMap((role) => (role.slots || []).filter((slot) => slot.pageId === selectedPage?.id && !slotDrafts[slot.id]?.__deleted).map((slot) => ({ role, slot }))), [selectedPage?.id, slotDrafts, story.roles]);
  const selectedSlotPosition = selectedSlotRecord ? evaluateSlotAnimation({ ...selectedSlotRecord.slot, ...slotDraft }, animationClips, playheadMs) : null;
  const selectedPathPointIndex = selectedPathPoint?.clipId === selectedClipId ? selectedPathPoint.index : -1;
  const dirty = pendingAssetUploads > 0 || mutation.isPending || isAutoSaving || quickCharacterBusy || quickCharacterOpen || uploadAudioMutation.isPending || Object.entries(pageDrafts).some(([id, values]) => JSON.stringify(values) !== JSON.stringify(pageValues(story.pages.find((page) => page.id === id))))
    || Object.entries(slotDrafts).some(([id, values]) => {
      const original = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === id);
      return original && (values?.__deleted || JSON.stringify(values) !== JSON.stringify(slotValues(original)));
    });
  useEditorSaveState({ dirty, isSaving: mutation.isPending || uploadAudioMutation.isPending, error: mutation.error || uploadAudioMutation.error, onDirtyChange: setEditorDirty });

  useEffect(() => {
    // A conflicting snapshot needs explicit reconciliation; never overwrite it.
    if (recovery?.conflict) return;
    try { writeEditorRecovery(recoveryKey, story, { pageDrafts, slotDrafts }); }
    catch { setLocalError("Không thể lưu bản khôi phục trên thiết bị. Giữ trang mở và lưu lên máy chủ trước khi rời trang."); }
  }, [recoveryKey, recovery?.conflict, story, pageDrafts, slotDrafts]);

  useEffect(() => {
    if (!legacyRecovery.shouldClear) return;
    try {
      const recovery = localStorage.getItem(recoveryMigrationKey);
      if (recovery) localStorage.setItem(`${recoveryMigrationKey}:backup`, recovery);
      localStorage.removeItem(recoveryMigrationKey);
    } catch { /* retain recovery if backup cannot be written */ }
  }, [legacyRecovery.shouldClear, recoveryMigrationKey]);

  const composedStory = useMemo(() => ({
    ...story,
    pages: story.pages.map((page) => ({ ...page, ...(pageDrafts[page.id] || {}) })),
    roles: story.roles.map((role) => ({ ...role, slots: (role.slots || []).filter((slot) => !slotDrafts[slot.id]?.__deleted).map((slot) => ({ ...slot, ...(slotDrafts[slot.id] || {}) })) })),
  }), [pageDrafts, slotDrafts, story]);
  const composedPage = composedStory.pages.find((page) => page.id === selectedPage?.id);

  const syncPreviewAudio = useCallback((time, playing) => {
    syncStoryAudio(audioPlayersRef.current, pageDraft.audioTracks || [], assets, time, playing, undefined, (id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length }));
  }, [pageDraft.audioTracks, assets]);

  function updatePlayhead(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    playheadRef.current = next;
    setPlayheadMs(next);
  }

  useEffect(() => () => {
    stopStoryAudio(audioPlayersRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    playStartRef.current = performance.now();
    playheadStartRef.current = playheadRef.current;
    let frame = 0;
    const duration = pageDurationMs;
    const tick = (now) => {
      const current = playheadStartRef.current + now - playStartRef.current;
      if (current >= duration) {
        playheadRef.current = duration;
        setPlayheadMs(duration);
        setIsPlaying(false);
        syncPreviewAudio(duration, false);
        return;
      }
      playheadRef.current = current;
      setPlayheadMs(current);
      syncPreviewAudio(current, true);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isPlaying, selectedPage?.id, pageDurationMs, pageDraft.audioTracks, assets, syncPreviewAudio]);

  useEffect(() => {
    if (isPlaying) return;
    syncPreviewAudio(playheadMs, false);
  }, [isPlaying, selectedPage?.id, pageDraft.audioTracks, assets, playheadMs, syncPreviewAudio]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return undefined;
    function handleUndoShortcut(event) {
      const target = event.target;
      const isEditing = target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
      if ((event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase()) && !event.altKey) {
        if (mutation.isPending || isEditing) return;
        event.preventDefault();
        if (event.shiftKey || event.key.toLowerCase() === "y") redoDraftChange();
        else undoDraftChange();
        return;
      }
      if (mutation.isPending || mutationOutcomeBlocked || isEditing || event.ctrlKey || event.metaKey || event.altKey || !["Backspace", "Delete"].includes(event.key)) return;
      if (selectedMedia) {
        event.preventDefault();
        keyboardDeleteActionsRef.current.updatePageField(selectedMedia.field, (pageDraft[selectedMedia.field] || []).filter((item) => item.id !== selectedMedia.id));
        setSelectedMedia(null);
        return;
      }
      if ((pageDraft.imageObjects || []).some((item) => item.id === selectedSlotId)) {
        event.preventDefault();
        keyboardDeleteActionsRef.current.updatePageField("imageObjects", pageDraft.imageObjects.filter((item) => item.id !== selectedSlotId));
        setSelectedSlotId(""); return;
      }
      const selectedClip = animationClips.find((clip) => clip.id === selectedClipId);
      if (selectedClip) {
        event.preventDefault();
        keyboardDeleteActionsRef.current.updatePageField("animationClips", animationClips.filter((clip) => clip.id !== selectedClip.id));
        setSelectedClipId("");
        setSelectedPathPoint(null);
        setAnimationError("");
      } else if (selectedSlotRecord?.slot.pageId === selectedPage?.id) {
        event.preventDefault();
        keyboardDeleteActionsRef.current.removeCharacterFromDraft(selectedSlotRecord);
      }
    }
    workspace.addEventListener("keydown", handleUndoShortcut);
    return () => workspace.removeEventListener("keydown", handleUndoShortcut);
  }, [mutation.isPending, mutationOutcomeBlocked, selectedClipId, selectedSlotRecord, selectedPage?.id, animationClips, pageDrafts, selectedMedia, selectedSlotId, pageDraft]);

  useEffect(() => {
    if (!selectedPageKey) return;
    try { localStorage.setItem("sketchtale.content.lastPage.v1", JSON.stringify({ storyId, pageId: selectedPageKey })); } catch { /* storage can be unavailable in private browsing */ }
  }, [selectedPageKey, storyId]);

  function updatePageField(name, value) {
    if (!selectedPage) return;
    const pageId = selectedPage.id;
    commitDraftChange((current) => ({ ...current, pageDrafts: { ...current.pageDrafts, [pageId]: { ...pageValues(selectedPage), ...current.pageDrafts[pageId], [name]: value } } }), { key: `page:${pageId}:${name}` });
  }

  function updateBackgroundTransform(patch) {
    if (!selectedPage) return;
    const pageId = selectedPage.id;
    commitDraftChange((current) => ({ ...current, pageDrafts: { ...current.pageDrafts, [pageId]: { ...pageValues(selectedPage), ...current.pageDrafts[pageId], ...patch } } }), { key: `page:${pageId}:backgroundTransform` });
  }

  async function uploadPageBackground(file) {
    if (!selectedPage) throw new Error("Hãy chọn trang trước khi tải ảnh nền lên.");
    const pageId = selectedPage.id;
    const parsed = parseStoryComposition(selectedPage.compositionJson);
    if (["invalid", "unsupported"].includes(parsed.kind) || parsed.issues.length) throw new Error(parsed.issues[0]?.message || "Không thể thay ảnh nền vì bố cục trang cần được khôi phục trước.");
    const backgroundComposition = serializeCompositionString({
      ...pageValues(selectedPage),
      backgroundAssetId: `page-background:${pageId}`,
      backgroundMode: "native",
      backgroundUrl: selectedPage.backgroundUrl || "",
    }, assets, parsed.value);
    if (!backgroundComposition.ok) throw new Error(backgroundComposition.issues[0]?.message || "Không thể chuẩn bị bố cục ảnh nền.");
    const nextStory = await mutation.mutateAsync({
      action: "update",
      pageId,
      payload: {
        text: selectedPage.text || "",
        status: selectedPage.status,
        compositionJson: backgroundComposition.json,
        compositionMode: "replace",
        expectedCompositionJson: selectedPage.compositionJson ?? null,
        backgroundFile: file,
      },
    });
    const savedPage = nextStory.pages.find((page) => page.id === pageId);
    if (!savedPage?.backgroundUrl) {
      throw new Error("Máy chủ chưa trả về ảnh nền sau khi tải lên. Hãy tải lại truyện để kiểm tra trạng thái.");
    }
    return {
      id: savedPage.backgroundAssetId || `page-background:${pageId}`,
      name: file.name || `Ảnh nền trang ${savedPage.order || ""}`.trim(),
      kind: "image",
      category: "background",
      mimeType: file.type || "image/*",
      size: file.size || 0,
      url: savedPage.backgroundUrl,
      readOnly: true,
      source: "backend",
    };
  }

  function beginBackgroundTransform() {
    if (selectedPage) beginUndoGroup(`page:${selectedPage.id}:backgroundTransform`);
  }

  function endBackgroundTransform() {
    if (selectedPage) endUndoGroup(`page:${selectedPage.id}:backgroundTransform`);
  }

  function updateAudioTrack(trackId, patch) {
    updatePageField("audioTracks", (pageDraft.audioTracks || []).map((track) => track.id === trackId ? { ...track, ...patch } : track));
  }

  function updateSlotField(name, value) {
    if (!selectedSlotRecord) return;
    const slotId = selectedSlotRecord.slot.id;
    commitDraftChange((current) => ({ ...current, slotDrafts: { ...current.slotDrafts, [slotId]: { ...slotValues(selectedSlotRecord.slot), ...current.slotDrafts[slotId], [name]: value } } }), { key: `slot:${slotId}:${name}` });
  }

  function selectPage(page) {
    setSelectedMedia(null);
    stopPreview();
    setSelectedPageId(page.id);
    setSelectedSlotId("");
    setSelectedClipId("");
    setSelectedPathPoint(null);
    updatePlayhead(0);
    setIsDrawingPath(false);
    setRecordingKeyframes(false);
    setAnimationError("");
    setLocalError("");
  }

  function selectPageBackground(event) {
    if (event.button !== 0 || isPlaying || isDrawingPath || activeTool === "motion") return;
    if (event.target.closest('[data-slot-id], button, input, select, textarea, [role="button"]')) return;
    setSelectedSlotId("");
    setSelectedClipId("");
    setSelectedPathPoint(null);
    setSelectedMedia(null);
    setActiveTool("images");
  }

  function selectSlot(slotId) {
    setSelectedMedia(null);
    setSelectedSlotId(slotId);
    if (selectedClipId && !animationClips.some((clip) => clip.id === selectedClipId && clip.targetId === slotId)) setSelectedClipId("");
    if (activeTool !== "motion" && activeTool !== "images" && activeTool !== "layers") setActiveTool("images");
    setLocalError("");
  }

  function removeCharacterFromDraft(record) {
    if (!record || !selectedPage) return;
    const { slot } = record;
    const pageId = selectedPage.id;
    commitDraftChange((current) => {
      const currentPage = current.pageDrafts[pageId] || pageValues(selectedPage);
      return {
        ...current,
        pageDrafts: {
          ...current.pageDrafts,
          [pageId]: {
            ...pageValues(selectedPage),
            ...currentPage,
            sequence: (currentPage.sequence || []).filter((item) => item.slotId !== slot.id),
            animationClips: pageAnimationClips(currentPage).filter((clip) => clip.targetId !== slot.id),
          },
        },
        slotDrafts: { ...current.slotDrafts, [slot.id]: { __deleted: true } },
      };
    }, { key: `slot:${slot.id}:delete` });
    setSelectedSlotId("");
    setSelectedClipId("");
    setSelectedPathPoint(null);
    setAnimationError("");
  }

  useEffect(() => {
    keyboardDeleteActionsRef.current = { updatePageField, removeCharacterFromDraft };
  });

  function addPage() {
    if (mutation.isPending || mutationOutcomeBlocked) return;
    if (isPlaying) stopPreview();
    mutation.mutate({ action: "add", payload: { ...emptyPage, text: "", backgroundUrl: "", compositionJson: "", currentStory: story } }, { onSuccess: (nextStory) => {
      const next = nextStory.pages.at(-1);
      if (next) {
        setSelectedPageId(next.id); setSelectedSlotId(""); setSelectedClipId(""); setSelectedPathPoint(null);
        updatePlayhead(0); setIsDrawingPath(false); setRecordingKeyframes(false); setAnimationError("");
      }
    } });
  }

  async function saveAllDrafts() {
    if (saveCycleInProgressRef.current || mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked) return;
    const pendingPages = Object.entries(draftStateRef.current.pageDrafts).filter(([pageId, values]) => {
      const original = story.pages.find((page) => page.id === pageId);
      return original && JSON.stringify(values) !== JSON.stringify(pageValues(original));
    });
    const pendingSlots = Object.entries(draftStateRef.current.slotDrafts).filter(([slotId, values]) => {
      const original = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === slotId);
      return original && (values?.__deleted || JSON.stringify(values) !== JSON.stringify(slotValues(original)));
    });
    for (const [pageId, values] of pendingPages) {
      const slots = story.roles.flatMap((role) => (role.slots || []).filter((slot) => slot.pageId === pageId).map((slot) => ({ role, slot })));
        const error = validatePageDraft(values, slots, assets, audioDurations, Boolean(story.pages.find((page) => page.id === pageId)?.slotsUnavailable));
      if (error) { setSelectedPageId(pageId); setActiveTool("images"); setLocalError(error); return; }
    }
    for (const [slotId, values] of pendingSlots) {
      if (values?.__deleted) continue;
      const error = validateSlotDraft(values);
      if (error) {
        const record = story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === slotId);
        if (record) { setSelectedPageId(record.slot.pageId); setSelectedSlotId(slotId); setActiveTool("images"); }
        setLocalError(error); return;
      }
    }
    setLocalError("");
    saveCycleInProgressRef.current = true;
    setIsAutoSaving(true);
    try {
      for (const [pageId, values] of pendingPages) {
        const originalPage = story.pages.find((page) => page.id === pageId);
        const original = pageValues(originalPage);
        if (featureApiModes.content === "real") {
          const mockFields = {};
          let apiChanged = false;
          let compositionChanged = false;
          const remoteAudio = (tracks) => (tracks || []).filter((track) => {
            const asset = assets.find((item) => item.id === track.assetId);
            return Boolean(asset?.url && asset.source !== "mock" && !asset.local && !/^(blob:|data:)/i.test(asset.url));
          });
          const remoteOriginalAudio = remoteAudio(original.audioTracks);
          const remoteDraftAudio = remoteAudio(values.audioTracks);
          const hasLocalAudio = remoteDraftAudio.length !== (values.audioTracks || []).length;
          const compositionKeys = ["subtitles", "imageObjects", "backgroundAssetId", "backgroundMode", "backgroundUrl", "backgroundOffsetX", "backgroundOffsetY", "backgroundScale", "audioTracks", "sequence", "animationClips", "narration"];
          for (const [key, value] of Object.entries(values)) {
            if (JSON.stringify(value) === JSON.stringify(original[key])) continue;
            if (key === "text" || key === "status") apiChanged = true;
            else if (key === "audioTracks") {
              if (JSON.stringify(remoteDraftAudio) !== JSON.stringify(remoteOriginalAudio)) compositionChanged = true;
              if (hasLocalAudio) mockFields.audioTracks = value;
            } else if (compositionKeys.includes(key)) compositionChanged = true;
            else if (!["compositionJson", "compositionState", "compositionData"].includes(key)) mockFields[key] = value;
          }
          let compositionJson = originalPage?.compositionJson;
          if (compositionChanged) {
            const parsed = parseStoryComposition(originalPage?.compositionJson);
            if (["invalid", "unsupported"].includes(parsed.kind) || parsed.issues.length) {
              throw new Error(parsed.issues[0]?.message || "Không thể ghi đè bố cục chưa được hỗ trợ.");
            }
            const encoded = serializeCompositionString({ ...values, audioTracks: remoteDraftAudio }, assets, parsed.value);
            if (!encoded.ok) {
              const issue = encoded.issues[0];
              setSelectedPageId(pageId);
              if (issue?.code?.startsWith("composition.animation")) {
                setActiveTool("motion");
                setSelectedClipId(issue.entityId || "");
              }
              throw new Error(`Trang ${originalPage.order}: ${issue?.message || "Bố cục trang chưa hợp lệ."}`);
            }
            compositionJson = encoded.json;
            apiChanged = true;
          }
          if (apiChanged) {
            await mutation.mutateAsync({
              action: "update",
              pageId,
              payload: {
                text: values.text,
                status: values.status,
                ...(compositionChanged ? { compositionJson, compositionMode: "replace", expectedCompositionJson: originalPage?.compositionJson ?? null } : {}),
                ...(!compositionChanged && typeof originalPage?.compositionJson === "string" ? { compositionJson: originalPage.compositionJson, compositionMode: "preserve", expectedCompositionJson: originalPage.compositionJson } : {}),
              },
            });
          }
          if (compositionChanged) {
            removeMockPageDraftFields(user.id, storyId, pageId, compositionKeys.filter((key) => key !== "audioTracks"));
            await refetchStory?.();
          }
          if (Object.hasOwn(original, "audioTracks") && !hasLocalAudio && JSON.stringify(remoteDraftAudio) === JSON.stringify(remoteOriginalAudio)) {
            removeMockPageDraftFields(user.id, storyId, pageId, ["audioTracks"]);
          }
          if (Object.keys(mockFields).length) {
            saveMockPageDraft(user.id, storyId, pageId, mockFields);
            queryClient.setQueryData(queryKeys.story(user.id, storyId), (cached) => cached ? mergeContentMockOverlay(cached, user.id, storyId) : cached);
          }
          if (apiChanged && Object.keys(mockFields).length) await refetchStory?.();
        } else {
          await mutation.mutateAsync({ action: "update", pageId, payload: values });
        }
        if (JSON.stringify(draftStateRef.current.pageDrafts[pageId]) !== JSON.stringify(values)) continue;
        commitDraftChange((current) => { const nextPages = { ...current.pageDrafts }; delete nextPages[pageId]; return { ...current, pageDrafts: nextPages }; }, { recordUndo: false });
        rebaseUndoHistory((snapshot) => {
          const pageSnapshots = { ...snapshot.pageDrafts };
          if (!Object.prototype.hasOwnProperty.call(pageSnapshots, pageId)) pageSnapshots[pageId] = original;
          if (JSON.stringify(pageSnapshots[pageId]) === JSON.stringify(values)) delete pageSnapshots[pageId];
          return { ...snapshot, pageDrafts: pageSnapshots };
        });
      }
      for (const [slotId, values] of pendingSlots) {
        const record = story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === slotId);
        if (!record) continue;
        if (values?.__deleted) {
          await mutation.mutateAsync({ action: "delete-slot", roleId: record.role.id, slotId });
          if (draftStateRef.current.slotDrafts[slotId]?.__deleted) {
            commitDraftChange((current) => { const nextSlots = { ...current.slotDrafts }; delete nextSlots[slotId]; return { ...current, slotDrafts: nextSlots }; }, { recordUndo: false });
            rebaseUndoHistory((snapshot) => { const slotSnapshots = { ...snapshot.slotDrafts }; delete slotSnapshots[slotId]; return { ...snapshot, slotDrafts: slotSnapshots }; });
          }
          continue;
        }
        const payload = normalizedSlotDraft(values);
        const original = slotValues(record.slot);
        if (featureApiModes.content === "real") {
        let nextStory = queryClient.getQueryData(queryKeys.story(user.id, storyId)) || story;
        if (record.slot.source === "backend") {
          const backendKeys = ["x", "y", "scale", "flip"];
          const mockKeys = ["rotation", "layer", "anchor", "assetId"];
          const backendChanged = backendKeys.some((key) => JSON.stringify(payload[key]) !== JSON.stringify(original[key]));
          const mockFields = Object.fromEntries(mockKeys.filter((key) => JSON.stringify(payload[key]) !== JSON.stringify(original[key])).map((key) => [key, payload[key]]));
          if (backendChanged) {
            nextStory = await mutation.mutateAsync({ action: "update-slot", roleId: record.role.id, slotId, payload: {
              x: payload.x,
              y: payload.y,
              scale: payload.scale,
              flip: payload.flip,
              backendStatus: record.slot.backendStatus,
            } });
          }
          if (Object.keys(mockFields).length) {
            const page = nextStory.pages.find((item) => item.id === record.slot.pageId);
            const parsed = parseStoryComposition(page?.compositionJson);
            if (page && !["invalid", "unsupported"].includes(parsed.kind) && !parsed.issues.length) {
              const slotExtensions = { ...(parsed.value?.slotExtensions || {}) };
              slotExtensions[slotId] = { ...slotExtensions[slotId], ...mockFields };
              const encoded = serializeCompositionString({ ...pageValues(page), slotExtensions }, assets, parsed.value);
              if (!encoded.ok) throw new Error(encoded.issues[0]?.message || "Không thể lưu tùy chọn vị trí nhân vật.");
              nextStory = await mutation.mutateAsync({ action: "update", pageId: page.id, payload: { text: page.text, status: page.status,
                compositionJson: encoded.json, compositionMode: "replace", expectedCompositionJson: page.compositionJson ?? null,
              } });
              removeMockSlotDraftFields(user.id, storyId, slotId, Object.keys(mockFields));
              queryClient.setQueryData(queryKeys.story(user.id, storyId), mergeContentMockOverlay(nextStory, user.id, storyId));
            } else {
              saveMockSlotDraft(user.id, storyId, slotId, mockFields);
              queryClient.setQueryData(queryKeys.story(user.id, storyId), (cached) => cached ? mergeContentMockOverlay(cached, user.id, storyId) : cached);
            }
          }
        } else {
          saveMockSlotDraft(user.id, storyId, slotId, payload);
          queryClient.setQueryData(queryKeys.story(user.id, storyId), (cached) => cached ? mergeContentMockOverlay(cached, user.id, storyId) : cached);
        }
        } else {
          await mutation.mutateAsync({ action: "update-slot", roleId: record.role.id, slotId, payload });
        }
        if (JSON.stringify(draftStateRef.current.slotDrafts[slotId]) !== JSON.stringify(values)) continue;
        commitDraftChange((current) => { const nextSlots = { ...current.slotDrafts }; delete nextSlots[slotId]; return { ...current, slotDrafts: nextSlots }; }, { recordUndo: false });
        rebaseUndoHistory((snapshot) => {
          const slotSnapshots = { ...snapshot.slotDrafts };
          if (!Object.prototype.hasOwnProperty.call(slotSnapshots, slotId)) slotSnapshots[slotId] = original;
          if (JSON.stringify(slotSnapshots[slotId]) === JSON.stringify(payload)) delete slotSnapshots[slotId];
          return { ...snapshot, slotDrafts: slotSnapshots };
        });
      }
      // Unmatched legacy recovery is retained for manual recovery. Never erase it
      // because an unrelated save completed or a newer edit arrived in flight.
      if (!Object.keys(draftStateRef.current.pageDrafts).length && !Object.keys(draftStateRef.current.slotDrafts).length && (Object.keys(legacyRecovery.pageDrafts).length || Object.keys(legacyRecovery.slotDrafts).length)) {
        try {
          const recovery = localStorage.getItem(recoveryMigrationKey);
          if (recovery) localStorage.setItem(`${recoveryMigrationKey}:backup`, recovery);
          localStorage.removeItem(recoveryMigrationKey);
        } catch { /* keep recovery when backup cannot be written */ }
      }
    } catch (error) {
      setLocalError(error?.message || "Không lưu được thay đổi. Kiểm tra kết nối rồi thử lưu lại.");
    } finally {
      saveCycleInProgressRef.current = false;
      setIsAutoSaving(false);
    }
  }

  useEffect(() => { saveAllDraftsRef.current = saveAllDrafts; });

  useEffect(() => {
    if (!dirty || localError || isAutoSaving || mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked) return undefined;
    let timeoutId;
    const reset = () => { window.clearTimeout(timeoutId); timeoutId = window.setTimeout(() => { void saveAllDraftsRef.current?.(); }, 60_000); };
    reset();
    const events = ["pointerdown", "pointermove", "keydown", "wheel"];
    events.forEach((name) => window.addEventListener(name, reset, { passive: true }));
    return () => { window.clearTimeout(timeoutId); events.forEach((name) => window.removeEventListener(name, reset)); };
  }, [dirty, pageDrafts, slotDrafts, localError, isAutoSaving, mutation.isPending, uploadAudioMutation.isPending, mutationOutcomeBlocked]);

  function uploadAudio(file) {
    if (selectedPage) uploadAudioMutation.mutate({ file, pageId: selectedPage.id });
  }

  function addCharacter() {
    if (mutation.isPending || mutationOutcomeBlocked) return;
    const role = story.roles.find((item) => item.id === roleToAdd);
    if (!role || !selectedPage) return;
    setLocalError("");
    const existingSlotIds = new Set((role.slots || []).map((slot) => slot.id));
    mutation.mutate({ action: "add-slot", roleId: role.id, payload: { ...emptySlot, pageId: selectedPage.id, assetId: role.defaultAssetId || "" } }, { onSuccess: (nextStory) => {
      const nextRole = nextStory.roles.find((item) => item.id === role.id);
      const slot = (nextRole?.slots || []).find((item) => item.pageId === selectedPage.id && !existingSlotIds.has(item.id));
      if (slot) { setSelectedSlotId(slot.id); setRoleToAdd(""); }
    } });
  }

  function openQuickCharacterDialog() {
    if (!selectedPage || slotsUnavailable || mutation.isPending || mutationOutcomeBlocked) return;
    setQuickCharacterName("");
    setQuickCharacterType("0");
    setQuickCharacterAssetId("");
    setQuickCharacterFile(null);
    setQuickCharacterError("");
    setPendingRoleToPlace(null);
    setQuickCharacterOpen(true);
  }

  function closeQuickCharacterDialog() {
    if (quickCharacterBusy) return;
    setQuickCharacterOpen(false);
    setQuickCharacterError("");
    setQuickCharacterFile(null);
    setPendingRoleToPlace(null);
  }

  function selectQuickCharacterFile(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    const errors = validateAssetFile(file, "image");
    if (Object.keys(errors).length) {
      setQuickCharacterError(Object.values(errors)[0]);
      setQuickCharacterFile(null);
      return;
    }
    setQuickCharacterError("");
    setQuickCharacterFile(file);
  }

  async function submitQuickCharacter(event) {
    event.preventDefault();
    if (!selectedPage || slotsUnavailable || mutation.isPending || mutationOutcomeBlocked || quickCharacterNeedsReload) return;
    if (!pendingRoleToPlace && !quickCharacterName.trim()) {
      setQuickCharacterError("Nhập tên nhân vật.");
      return;
    }
    if (!pendingRoleToPlace && quickCharacterName.trim().length > 60) {
      setQuickCharacterError("Tên nhân vật tối đa 60 ký tự.");
      return;
    }

    setQuickCharacterBusy(true);
    setQuickCharacterError("");
    try {
      let role = pendingRoleToPlace;
      if (!role) {
        const previousRoleIds = new Set(story.roles.map((item) => item.id));
        const nextStory = await mutation.mutateAsync({
          action: "add-role",
          payload: {
            name: quickCharacterName.trim(),
            custom: true,
            sensitive: false,
            storyRoleType: Number(quickCharacterType),
            defaultAssetId: featureApiModes.content === "real" ? "" : quickCharacterAssetId,
            defaultAssetFile: featureApiModes.content === "real" ? quickCharacterFile || undefined : undefined,
          },
        });
        role = nextStory.roles.find((item) => !previousRoleIds.has(item.id));
        if (!role) {
          setQuickCharacterNeedsReload(true);
          throw new Error("Nhân vật đã được tạo nhưng chưa tải lại được danh sách. Hãy tải lại truyện để kiểm tra trước khi tạo thêm.");
        }
        setPendingRoleToPlace(role);
      }

      const nextStory = await mutation.mutateAsync({
        action: "add-slot",
        roleId: role.id,
        payload: { ...emptySlot, pageId: selectedPage.id, assetId: role.defaultAssetId || quickCharacterAssetId || "" },
      });
      const placedRole = nextStory.roles.find((item) => item.id === role.id);
      const slot = [...(placedRole?.slots || [])].reverse().find((item) => item.pageId === selectedPage.id);
      if (!slot) throw new Error("Nhân vật đã được tạo nhưng chưa xác nhận được vị trí trên trang. Hãy thử đặt lại.");
      setSelectedSlotId(slot.id);
      setRoleToAdd("");
      setQuickCharacterOpen(false);
      setPendingRoleToPlace(null);
      setQuickCharacterName("");
      setQuickCharacterFile(null);
      setQuickCharacterAssetId("");
    } catch (error) {
      setQuickCharacterError(error?.message || "Không thể tạo hoặc đặt nhân vật lên trang.");
    } finally {
      setQuickCharacterBusy(false);
    }
  }

  function reorderPages(draggedId, targetId) {
    const fromIndex = story.pages.findIndex((page) => page.id === draggedId);
    const toIndex = story.pages.findIndex((page) => page.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || mutation.isPending || mutationOutcomeBlocked) return;
    const next = [...story.pages];
    const [movedPage] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, movedPage);
    const visiblePageIds = next.map((page) => page.id);
    const serverPageIds = featureApiModes.content === "real" ? story.reorderablePageIds : visiblePageIds;
    const orderedPageIds = reorderWithHiddenPages(visiblePageIds, serverPageIds || []);
    if (!orderedPageIds) {
      setLocalError("Không thể xác định đầy đủ thứ tự trang từ dữ liệu máy chủ. Hãy tải lại truyện rồi thử lại.");
      return;
    }
    mutation.mutate({ action: "reorder", payload: orderedPageIds });
  }

  function moveSelectedPage(offset) {
    if (!selectedPage || mutation.isPending || mutationOutcomeBlocked) return;
    const target = story.pages[selectedPageIndex + offset];
    if (target) reorderPages(selectedPage.id, target.id);
  }

  async function deleteSelectedPage() {
    if (!selectedPage || mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked) return;
    const pageId = selectedPage.id;
    const currentIndex = selectedPageIndex;
    const persistedSlots = story.roles.flatMap((role) => (role.slots || [])
      .filter((slot) => slot.pageId === pageId)
      .map((slot) => ({ role, slot })));
    const affectedVocabulary = story.vocabulary.filter((item) => item.pageId === pageId);
    const affectedQuizzes = story.quizzes.filter((item) => item.pageId === pageId);
    if (featureApiModes.content === "real" && affectedQuizzes.length) {
      setLocalError("Trang này đang có câu hỏi gắn kèm. Hãy chuyển câu hỏi sang trang khác hoặc xóa câu hỏi rồi mới xóa trang.");
      return;
    }
    const affectedImageIds = new Set();
    if (pageDraft.backgroundAssetId) affectedImageIds.add(pageDraft.backgroundAssetId);
    else if (selectedPage.backgroundUrl) affectedImageIds.add(`page-background:${pageId}`);
    persistedSlots.forEach(({ role, slot }) => {
      const slotAssetId = slotDrafts[slot.id]?.assetId ?? slot.assetId ?? role.defaultAssetId ?? (role.defaultAssetUrl ? `role-default:${role.id}` : "");
      if (slotAssetId) affectedImageIds.add(slotAssetId);
    });
    const pageHasUnsavedChanges = Boolean(pageDrafts[pageId] && JSON.stringify(pageDrafts[pageId]) !== JSON.stringify(pageValues(selectedPage)))
      || persistedSlots.some(({ slot }) => {
        const draft = slotDrafts[slot.id];
        return draft && (draft.__deleted || JSON.stringify(draft) !== JSON.stringify(slotValues(slot)));
      });
    const pageLabel = `Trang ${selectedPageIndex + 1}`;
    const message = `${pageLabel} có ${persistedSlots.length} nhân vật, ${pageAnimationClips(pageDraft).length} chuyển động, ${(pageDraft.audioTracks || []).length} track âm thanh, ${affectedVocabulary.length} từ vựng, ${affectedQuizzes.length} câu hỏi và ${affectedImageIds.size} ảnh tham chiếu. Backend sẽ chuyển trang sang Inactive; Swagger không xác nhận dữ liệu liên quan có bị xóa theo hay không. Tệp trong thư viện dùng chung vẫn được giữ.${pageHasUnsavedChanges ? " Thay đổi chưa lưu của trang này cũng sẽ bị bỏ." : ""}`;
    if (!await confirmToast({ title: "Xóa trang hiện tại?", message, confirmLabel: "Xóa trang", tone: "danger" })) return;

    focusEmptyPageAfterDeleteRef.current = story.pages.length === 1;
    stopPreview();
    setLocalError("");
    mutation.mutate({ action: "delete-page", pageId }, { onSuccess: (nextStory) => {
      const deletedSlotIds = persistedSlots.map(({ slot }) => slot.id);
      const deletedQuizIds = affectedQuizzes.map((quiz) => quiz.id);
      try { removeMockPage(user.id, storyId, pageId, deletedSlotIds, deletedQuizIds); } catch { /* local overlay cleanup is best effort */ }
      const stripPageData = (snapshot) => {
        const nextPageDrafts = { ...snapshot.pageDrafts };
        delete nextPageDrafts[pageId];
        const nextSlotDrafts = { ...snapshot.slotDrafts };
        deletedSlotIds.forEach((slotId) => delete nextSlotDrafts[slotId]);
        return { ...snapshot, pageDrafts: nextPageDrafts, slotDrafts: nextSlotDrafts };
      };
      commitDraftChange(stripPageData, { recordUndo: false });
      rebaseUndoHistory(stripPageData);
      const nextPage = nextStory.pages[Math.min(currentIndex, nextStory.pages.length - 1)];
      setSelectedPageId(nextPage?.id || "");
      setSelectedSlotId("");
      setSelectedClipId("");
      setSelectedPathPoint(null);
      setActiveTool("images");
      setIsDrawingPath(false);
      setRecordingKeyframes(false);
      setAnimationError("");
      updatePlayhead(0);
    } });
  }

  function stopPreview() {
    stopStoryAudio(audioPlayersRef.current);
    setIsPlaying(false);
  }

  function playPreview() {
    if (!selectedPage) return;
    setLocalError("");
    if (isPlaying) { syncPreviewAudio(playheadMs, false); setIsPlaying(false); return; }
    const startAt = playheadMs >= animationDuration(pageDraft, audioDurations) ? 0 : playheadMs;
    if (startAt === 0) updatePlayhead(0);
    setPlayToken((token) => token + 1);
    syncPreviewAudio(startAt, true);
    setIsPlaying(true);
  }

  function commitPath(points) {
    const slot = pageSlots.find(({ slot: item }) => item.id === selectedSlotId)?.slot || pageSlots[0]?.slot;
    setIsDrawingPath(false);
    const cleanPoints = points.reduce((result, point) => {
      const next = { x: Math.round(Number(point.x) * 100) / 100, y: Math.round(Number(point.y) * 100) / 100 };
      const last = result.at(-1);
      if (!last || Math.hypot(next.x - last.x, next.y - last.y) > 0.2) result.push(next);
      return result;
    }, []);
    const length = cleanPoints.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - cleanPoints[index].x, point.y - cleanPoints[index].y), 0);
    if (!slot || cleanPoints.length < 2 || length < 1) { setAnimationError("Hãy chọn nhân vật và kéo một đường đi rõ ràng trên cảnh."); return; }
    const clip = { id: createId("path"), targetId: slot.id, kind: "path", startMs: playheadMs, durationMs: 2000, easing: "ease-in-out", points: cleanPoints };
    if (clipsConflict(animationClips, clip)) { setAnimationError("Nhân vật đã có chuyển động vị trí ở thời điểm này. Hãy đổi thời điểm hoặc chọn nhân vật khác."); return; }
    commitDraftChange((current) => ({ ...current, pageDrafts: { ...current.pageDrafts, [selectedPage.id]: { ...pageValues(selectedPage), ...current.pageDrafts[selectedPage.id], animationClips: [...pageAnimationClips(current.pageDrafts[selectedPage.id] || selectedPage), clip] } } }), { key: `page:${selectedPage.id}:animationClips` });
    setSelectedClipId(clip.id);
    setActiveTool("motion");
    setAnimationError("");
  }

  function updatePathPoint(clipId, pointIndex, patch) {
    if (!selectedPage) return;
    const source = draftStateRef.current.pageDrafts[selectedPage.id] || selectedPage;
    const clips = pageAnimationClips(source);
    const point = clips.find((clip) => clip.id === clipId)?.points?.[pointIndex];
    if (!point) return;
    const nextPoint = { ...point, x: Math.round(Math.max(0, Math.min(100, Number(patch.x ?? point.x))) * 100) / 100, y: Math.round(Math.max(0, Math.min(100, Number(patch.y ?? point.y))) * 100) / 100 };
    commitDraftChange((current) => ({ ...current, pageDrafts: { ...current.pageDrafts, [selectedPage.id]: { ...pageValues(selectedPage), ...current.pageDrafts[selectedPage.id], animationClips: pageAnimationClips(current.pageDrafts[selectedPage.id] || selectedPage).map((clip) => clip.id !== clipId ? clip : { ...clip, points: clip.points.map((item, index) => index === pointIndex ? nextPoint : item) }) } } }), { key: `page:${selectedPage.id}:path:${clipId}:point:${pointIndex}` });
  }

  function addPathPoint(clipId) {
    if (!selectedPage) return;
    const clip = animationClips.find((item) => item.id === clipId && item.kind === "path");
    if (!clip || clip.points.length >= 160) return;
    const afterIndex = selectedPathPoint?.clipId === clipId ? selectedPathPoint.index : clip.points.length - 2;
    const nextIndex = Math.max(0, Math.min(clip.points.length - 2, afterIndex));
    const first = clip.points[nextIndex];
    const second = clip.points[nextIndex + 1];
    const point = { x: Math.round((Number(first.x) + Number(second.x)) / 2 * 100) / 100, y: Math.round((Number(first.y) + Number(second.y)) / 2 * 100) / 100 };
    const points = [...clip.points];
    points.splice(nextIndex + 1, 0, point);
    updatePageField("animationClips", animationClips.map((item) => item.id === clipId ? { ...item, points } : item));
    setSelectedPathPoint({ clipId, index: nextIndex + 1 });
  }

  function commitTransformKeyframe(slotId, patch) {
    if (!selectedPage) return;
    const record = pageSlots.find(({ slot }) => slot.id === slotId);
    if (!record) return;
    const source = draftStateRef.current.pageDrafts[selectedPage.id] || selectedPage;
    const clips = pageAnimationClips(source);
    let clip = clips.find((item) => item.kind === "keyframes" && item.targetId === slotId);
    if (!clip) clip = { id: createId("keyframes"), targetId: slotId, kind: "keyframes", startMs: 0, durationMs: Math.max(3000, playheadMs + 100), keyframes: [] };
    const timeMs = Math.max(0, Math.round(playheadMs / 100) * 100);
    const existing = clip.keyframes.find((frame) => Math.abs(Number(frame.timeMs) - timeMs) < 60);
    const frame = { ...(existing || { id: createId("frame") }), timeMs, ...patch };
    const keyframes = existing ? clip.keyframes.map((item) => item.id === existing.id ? frame : item) : [...clip.keyframes, frame];
    const nextClip = { ...clip, durationMs: Math.max(Number(clip.durationMs || 0), timeMs + 100), keyframes };
    if (clipsConflict(clips, nextClip, clip.id)) return setAnimationError("Thuộc tính này đang được hiệu ứng khác điều khiển ở thời điểm đã chọn.");
    setAnimationError("");
    const nextClips = clips.some((item) => item.id === clip.id) ? clips.map((item) => item.id === clip.id ? nextClip : item) : [...clips, nextClip];
    commitDraftChange((state) => ({ ...state, pageDrafts: { ...state.pageDrafts, [selectedPage.id]: { ...pageValues(selectedPage), ...state.pageDrafts[selectedPage.id], animationClips: nextClips } } }), { key: `page:${selectedPage.id}:transform-keyframe` });
  }

  function beginCanvasTransform(slotId) {
    if (isPlaying) stopPreview();
    selectSlot(slotId);
    beginUndoGroup(activeTool === "motion" ? `page:${selectedPage?.id}:transform-keyframe` : `slot:${slotId}:transform`);
  }

  function changeCanvasTransform(slotId, patch) {
    if ((pageDraft.imageObjects || []).some((item) => item.id === slotId)) {
      commitDraftChange((current) => {
        const draft = current.pageDrafts[selectedPage.id] || pageValues(selectedPage);
        return { ...current, pageDrafts: { ...current.pageDrafts, [selectedPage.id]: { ...draft, imageObjects: draft.imageObjects.map((item) => item.id === slotId ? { ...item, ...patch } : item) } } };
      }, { key: `slot:${slotId}:transform` });
      return;
    }
    if (activeTool === "motion") {
      if (recordingKeyframes) {
        const record = pageSlots.find(({ slot }) => slot.id === slotId);
        if (!record) return;
        const rounded = Object.fromEntries(Object.entries(patch).map(([property, value]) => [property, property === "x" || property === "y" ? Math.round(Number(value) * 2) / 2 : Math.round(Number(value) * 100) / 100]));
        commitTransformKeyframe(slotId, rounded);
      }
      return;
    }
    commitDraftChange((current) => {
      const slot = story.roles.flatMap((role) => role.slots || []).find((item) => item.id === slotId);
      return slot ? { ...current, slotDrafts: { ...current.slotDrafts, [slotId]: { ...slotValues(slot), ...current.slotDrafts[slotId], ...patch } } } : current;
    }, { key: `slot:${slotId}:transform` });
  }

  const animationEditorProps = {
    page: pageDraft,
    slots: pageSlots,
    assets,
    audioDurations,
    clips: animationClips,
    onChange: (value) => updatePageField("animationClips", value),
    onAudioChange: updateAudioTrack,
    selectedMedia,
    onMediaSelect: (field, id) => { setSelectedMedia({ field, id }); setSelectedClipId(""); setSelectedSlotId(""); setActiveTool(field === "subtitles" ? "subtitles" : "audio"); },
    onSubtitleChange: (id, patch) => updatePageField("subtitles", (pageDraft.subtitles || []).map((cue) => cue.id === id ? { ...cue, ...patch } : cue)),
    selectedSlotId,
    onSlotSelect: selectSlot,
    playheadMs,
    onPlayheadChange: (value) => { if (isPlaying) stopPreview(); updatePlayhead(value); },
    isPlaying,
    onTogglePlayback: playPreview,
    selectedClipId,
    onClipSelect: (id) => { setSelectedMedia(null); setSelectedClipId(id); setSelectedPathPoint(null); },
    selectedPathPointIndex,
    onPathPointChange: updatePathPoint,
    onPathPointAdd: addPathPoint,
    onPathStart: () => { if (isPlaying) stopPreview(); setIsDrawingPath(true); },

    pageDurationMs,
    recording: recordingKeyframes,
    onRecordingChange: setRecordingKeyframes,
    property: animationProperty,
    onPropertyChange: setAnimationProperty,
    tab: animationTab,
    onTabChange: setAnimationTab,
    animationError,
    onAnimationErrorChange: setAnimationError,
  };

  const isSaving = isAutoSaving || mutation.isPending || uploadAudioMutation.isPending;
  const hasSaveError = Boolean(localError || mutation.error || uploadAudioMutation.error);
  const hasLocalOnlyChanges = featureApiModes.content === "real" && Boolean(story.localOnlyChanges?.hasChanges);
  const saveStatus = isSaving ? "Đang lưu…" : hasSaveError ? "Lỗi lưu" : dirty ? "Chờ tự lưu…" : "Đã lưu";
  const inspectorTitle = activeTool === "images" ? "Hình ảnh" : activeTool === "audio" ? "Âm thanh" : activeTool === "subtitles" ? "Phụ đề" : activeTool === "motion" ? "Chuyển động" : "Asset trên trang";
  const addImageAssetToPage = (assetId, asset) => {
    if (!assetId) return;
    const item = { ...emptySlot, id: uid("image"), assetId, name: asset?.name || "Ảnh phụ", layer: (pageDraft.imageObjects || []).length + 1 };
    updatePageField("imageObjects", [...(pageDraft.imageObjects || []), item]);
    selectSlot(item.id);
  };

  return <section className="story-editor-panel story-studio-page">
    {recovery?.conflict && <p role="alert" className="editor-field-error">Có bản khôi phục khác dữ liệu máy chủ. Bản gốc được giữ trên thiết bị, chưa tự áp dụng hoặc ghi đè. Hãy đối chiếu dữ liệu trước khi tiếp tục.</p>}
    <header className="story-studio-topbar">
      <Link className="story-studio-back" to="/content/stories" aria-label="Quay lại kho truyện"><ArrowLeft size={17} aria-hidden="true" /><span>Truyện</span></Link>
      <div className="story-studio-identity"><small>STORY EDITOR</small><strong title={story.title}>{story.title}</strong>{(!hasLocalOnlyChanges || dirty || isSaving || hasSaveError) && <span className={dirty || isSaving || hasSaveError ? "is-dirty" : ""} role="status" aria-live="polite">{saveStatus}</span>}</div>
      <div className="story-studio-topbar-actions"><button type="button" className="workspace-button workspace-button-quiet" onClick={() => void saveAllDrafts()} disabled={!dirty || isSaving || mutationOutcomeBlocked}>Lưu ngay</button>
        <button className="workspace-button workspace-button-quiet story-studio-undo" type="button" title="Hoàn tác thay đổi gần nhất (Ctrl+Z / ⌘Z)" aria-label="Hoàn tác thay đổi gần nhất" disabled={!undoCount || mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked} onClick={undoDraftChange}><ArrowCounterClockwise size={16} aria-hidden="true" /> Hoàn tác</button>
        <button className="workspace-button workspace-button-quiet" type="button" title="Làm lại (Ctrl+Shift+Z / Ctrl+Y)" disabled={!redoCount || mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked} onClick={redoDraftChange}>Làm lại</button>
        <Link className="workspace-button workspace-button-quiet" to={`/content/stories/${storyId}/preview`} target="_blank" rel="noreferrer"><Eye size={16} aria-hidden="true" /> Xem trước</Link>
        <details className="story-studio-section-menu"><summary className="workspace-button workspace-button-quiet">Đi tới mục</summary><nav aria-label="Chuyển phần chỉnh sửa"><Link to={`/content/stories/${storyId}/pages`}>Dựng truyện</Link><Link to={`/content/stories/${storyId}`}>Thông tin truyện</Link><Link to={`/content/stories/${storyId}/roles`}>Nhân vật</Link><Link to={`/content/stories/${storyId}/vocabulary`}>Từ vựng</Link><Link to={`/content/stories/${storyId}/quizzes`}>Câu hỏi</Link><Link to={`/content/stories/${storyId}/preview`}>Xem thử</Link></nav></details>
        <button className="workspace-button" type="button" onClick={onPublish} disabled={!onPublish || publishOutcomeBlocked || dirty || isPublishing || story.hasUnverifiedComposition}><CheckCircle size={16} aria-hidden="true" />{isPublishing ? "Đang xuất bản…" : "Xuất bản"}</button>
      </div>
    </header>

    {validation && !(hasLocalOnlyChanges && validation.message.includes("chỉ được lưu trên thiết bị")) && <p className={`story-studio-validation${validation.type === "error" ? " is-error" : ""}`} role="status">{validation.message}</p>}
    <PublishIssues error={publishError} />
    <EditorMutationMessage mutation={mutation} showSuccess={false} />
    {localError && <div className="editor-mutation-message editor-mutation-error" role="alert"><span>{localError}</span><button className="workspace-button workspace-button-quiet story-retry-button" type="button" onClick={() => { setLocalError(""); void saveAllDraftsRef.current?.(); }} disabled={mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked}>Thử lại</button><DismissButton onClick={() => setLocalError("")} /></div>}
    {assetsQuery.isLoading && <p className="editor-help">Đang tải thư viện tư liệu…</p>}
    {assetsQuery.isError && !assetsErrorDismissed && <div className="editor-mutation-message editor-mutation-error" role="alert"><span>Không thể tải thư viện tư liệu: {assetsQuery.error?.message}</span><button className="workspace-text-link" type="button" onClick={() => { setAssetsErrorDismissed(false); void assetsQuery.refetch(); }}>Thử lại</button><DismissButton onClick={() => setAssetsErrorDismissed(true)} /></div>}
    <div className={`story-studio-workspace${activeTool && selectedPage ? "" : " has-no-panel"}${timelineCollapsed ? " is-timeline-collapsed" : ""}`} ref={workspaceRef} inert={Boolean(mutationOutcomeBlocked)}>
      <nav className="story-tool-rail" aria-label="Công cụ dựng truyện">
        {storyTools.map(([id, label, Icon]) => <button key={id} type="button" className={activeTool === id ? "active" : ""} aria-pressed={activeTool === id} aria-controls="story-inspector" disabled={!selectedPage} onClick={() => { setActiveTool((current) => { const next = current === id ? "" : id; if (next !== "motion") setIsDrawingPath(false); return next; }); }}><Icon size={21} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>
      <aside id="story-inspector" className={`story-studio-panel${activeTool && selectedPage ? "" : " is-collapsed"}`} aria-label={`${activeTool === "motion" ? "Chuyển động" : activeTool === "audio" ? "Âm thanh" : activeTool === "subtitles" ? "Phụ đề" : activeTool === "layers" ? "Asset" : "Hình ảnh"}`}>
        {activeTool && <div className="story-inspector-header"><h2>{inspectorTitle}</h2><button type="button" className="icon-button story-inspector-close" aria-label="Đóng bảng công cụ" onClick={() => { workspaceRef.current?.querySelector('.story-tool-rail button[aria-pressed="true"]')?.focus(); setActiveTool(""); setIsDrawingPath(false); }}><X size={15} aria-hidden="true" /></button></div>}
        {activeTool === "images" && selectedPage && <ImageFields key={selectedPage.id} values={pageDraft} assets={assets} hasBackground={Boolean(pageDraft.backgroundMode !== "none" && (assets.some((asset) => asset.id === pageDraft.backgroundAssetId && asset.url) || selectedPage.backgroundUrl))} onBackgroundChange={updateBackgroundTransform} onUploadBackground={uploadPageBackground} uploadDisabled={mutation.isPending || mutationOutcomeBlocked} prefix={`page-${selectedPage.id}`} />}
        
        {activeTool === "images" && selectedPage && (selectedImage || selectedSlotRecord) && <div className="story-image-object-fields"><div className="story-studio-panel-heading story-inspector-section-heading"><h3>{selectedImage?.name || selectedSlotRecord?.role.name}</h3></div>{selectedImage ? <SlotFields values={selectedImage} assets={assets} onChange={(name, value) => changeCanvasTransform(selectedImage.id, { [name]: value })} /> : <SlotFields key={selectedSlotRecord.slot.id} values={slotDraft} assets={assets} onChange={updateSlotField} />}</div>}
        {activeTool === "audio" && selectedPage && <AudioSequence values={pageDraft.audioTracks || []} assets={assets} audioDurations={audioDurations} onDuration={(id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length })} onChange={(value) => updatePageField("audioTracks", value)} onUpload={uploadAudio} isUploading={uploadAudioMutation.isPending} uploadError={uploadAudioMutation.error?.message} />}
        {activeTool === "subtitles" && selectedPage && <section className="story-subtitle-editor" aria-label="Chỉnh sửa phụ đề">
          <div className="story-subtitle-actions"><button type="button" className="workspace-button" onClick={() => { const cue = { id: uid("subtitle"), text: "", startMs: Math.round(playheadMs), durationMs: 2000 }; updatePageField("subtitles", [...(pageDraft.subtitles || []), cue]); setSelectedMedia({ field: "subtitles", id: cue.id }); }}> <Plus size={16} /> Thêm phụ đề</button></div>
          <label className="story-source-text">Nội dung truyện<textarea aria-label="Nội dung truyện" rows="5" value={pageDraft.text || ""} onChange={(event) => updatePageField("text", event.target.value)} /></label>
          <small>Nội dung truyện và phụ đề được lưu riêng. Chỉnh từng phụ đề bên dưới để khớp với lời kể.</small>
          {!pageDraft.subtitles?.length && <button type="button" className="workspace-button" disabled={!pageDraft.text?.trim()} onClick={() => updatePageField("subtitles", [{ id: uid("subtitle"), text: pageDraft.text || "", startMs: 0, durationMs: pageDurationMs }])}>Đặt thời gian cho phụ đề</button>}
          {(pageDraft.subtitles || []).map((cue, index) => <article key={cue.id} className={`story-cue${selectedMedia?.id === cue.id ? " is-selected" : ""}`}>
            <div className="story-cue-heading"><button type="button" onClick={() => { setSelectedMedia({ field: "subtitles", id: cue.id }); updatePlayhead(cue.startMs); }}>Phụ đề {index + 1}</button><button type="button" className="icon-button" aria-label={`Xóa phụ đề ${index + 1}`} onClick={() => updatePageField("subtitles", pageDraft.subtitles.filter((item) => item.id !== cue.id))}><Trash size={16} /></button></div>
            <textarea aria-label={`Nội dung phụ đề ${index + 1}`} rows="2" value={cue.text} onChange={(event) => animationEditorProps.onSubtitleChange(cue.id, { text: event.target.value })} />
            <div className="story-cue-timing"><label>Từ (s)<input type="number" min="0" step="0.1" value={cue.startMs / 1000} onChange={(event) => animationEditorProps.onSubtitleChange(cue.id, { startMs: Math.max(0, Number(event.target.value) * 1000) })} /></label><label>Đến (s)<input type="number" min={(cue.startMs + 100) / 1000} step="0.1" value={(cue.startMs + cue.durationMs) / 1000} onChange={(event) => animationEditorProps.onSubtitleChange(cue.id, { durationMs: Math.max(100, Number(event.target.value) * 1000 - cue.startMs) })} /></label></div>
          </article>)}
        </section>}

        {activeTool === "layers" && <>
          {selectedPage && <div className="story-add-image"><AssetPicker assets={assets} label="Ảnh từ kho Asset" category="" id={`overlay-${selectedPage.id}`} allowEmpty={false} allowUpload={false} showUploadHint={false} emptyLabel="Chọn ảnh để thêm vào trang." onChange={addImageAssetToPage} /></div>}
          {pageDraft.imageObjects?.length > 0 && <div className="story-inspector-image-objects" aria-label="Ảnh phụ trên trang">{pageDraft.imageObjects.map((item) => <button className="workspace-button workspace-button-quiet story-inspector-asset-name" type="button" key={item.id} title={item.name} onClick={() => selectSlot(item.id)}>{compactAssetName(item.name)}</button>)}</div>}{pageSlots.length ? <ul className="story-studio-layer-list">{pageSlots.map(({ role, slot }) => <li key={slot.id}><button type="button" className={selectedSlotId === slot.id ? "active" : ""} onClick={() => selectSlot(slot.id)}><span>{role.name}</span><small>Lớp {slot.layer}</small></button></li>)}</ul> : <p className="editor-help">{selectedPage.slotsUnavailable ? "Không tải được vị trí nhân vật của trang này." : "Trang chưa có nhân vật."}</p>}<label className="story-studio-add-character"><span>Thêm nhân vật</span><select aria-label="Chọn nhân vật để thêm" disabled={slotsUnavailable} value={roleToAdd} onChange={(event) => setRoleToAdd(event.target.value)}><option value="">Chọn nhân vật…</option>{story.roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select><button className="workspace-button" type="button" disabled={!roleToAdd || mutation.isPending || mutationOutcomeBlocked || slotsUnavailable} onClick={addCharacter}><Plus size={16} aria-hidden="true" /> Thêm</button></label></>}
        {activeTool === "layers" && <button className="workspace-button workspace-button-quiet story-quick-character-trigger" type="button" onClick={openQuickCharacterDialog} disabled={!selectedPage || slotsUnavailable || mutation.isPending || mutationOutcomeBlocked}><UserPlus size={16} aria-hidden="true" /> Tạo nhân vật mới</button>}
        {activeTool === "motion" && <StoryAnimationEditor {...animationEditorProps} showPanel showTimeline={false} />}
      </aside>
      <div className="story-studio-canvas">
        {selectedPage && composedPage ? <>
          <div className="story-pages-canvas-toolbar"><span className="story-canvas-page-label">Trang {selectedPageIndex + 1} / {story.pages.length}</span><div className="story-canvas-actions"><div className="story-page-order-actions" aria-label="Sắp xếp trang"><button className="workspace-button workspace-button-quiet" type="button" aria-label="Đưa trang trước" title="Đưa trang trước" disabled={selectedPageIndex <= 0 || mutation.isPending || mutationOutcomeBlocked} onClick={() => moveSelectedPage(-1)}><CaretLeft size={15} aria-hidden="true" /> Trước</button><button className="workspace-button workspace-button-quiet" type="button" aria-label="Đưa trang sau" title="Đưa trang sau" disabled={selectedPageIndex < 0 || selectedPageIndex >= story.pages.length - 1 || mutation.isPending || mutationOutcomeBlocked} onClick={() => moveSelectedPage(1)}><CaretRight size={15} aria-hidden="true" /> Sau</button></div><button className="workspace-button workspace-button-quiet workspace-button-danger story-page-delete" type="button" aria-label="Xóa trang hiện tại" title="Xóa trang hiện tại" disabled={mutation.isPending || uploadAudioMutation.isPending || mutationOutcomeBlocked} onClick={deleteSelectedPage}><Trash size={15} aria-hidden="true" /> Xóa trang</button><button className="workspace-button workspace-button-quiet story-timeline-toggle" type="button" aria-expanded={!timelineCollapsed} onClick={() => setTimelineCollapsed((value) => !value)}>{timelineCollapsed ? "Mở timeline" : "Thu gọn timeline"}</button><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setActiveTool("layers")}><UserPlus size={16} aria-hidden="true" /> Nhân vật</button></div></div>
          {selectedPage.slotsUnavailable && dismissedSlotWarningPageId !== selectedPage.id && <div className="story-slot-load-warning" role="status"><span>Không tải được vị trí nhân vật của trang này. Bạn vẫn có thể chỉnh sửa các phần khác của truyện.</span><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setDismissedSlotWarningPageId(""); void refetchStory?.(); }}>Thử tải lại</button><DismissButton onClick={() => setDismissedSlotWarningPageId(selectedPage.id)} /></div>}{isDrawingPath && <div className="story-path-mode-banner"><span>Đang vẽ đường đi cho {selectedSlotRecord?.role.name || "nhân vật đã chọn"}. Kéo trên cảnh, rồi thả để lưu đường.</span><button type="button" className="workspace-button workspace-button-quiet" onClick={() => setIsDrawingPath(false)}>Hủy</button></div>}
        <div className="story-canvas-stage-wrap" onPointerDownCapture={selectPageBackground}><StoryPageRenderer story={composedStory} page={composedPage} assets={assets} showBranding={false} selectedSlotId={selectedSlotId} onSlotSelect={(slotId) => { setSelectedClipId(""); setSelectedPathPoint(null); selectSlot(slotId); }} onSlotPositionStart={(slotId) => beginCanvasTransform(slotId)} onSlotPositionEnd={(slotId) => endUndoGroup(activeTool === "motion" ? `page:${selectedPage.id}:transform-keyframe` : `slot:${slotId}:transform`)} onSlotTransformChange={activeTool !== "motion" || recordingKeyframes ? changeCanvasTransform : undefined} onBackgroundTransformChange={activeTool === "images" && !selectedSlotRecord && !selectedImage ? updateBackgroundTransform : undefined} onBackgroundTransformStart={beginBackgroundTransform} onBackgroundTransformEnd={endBackgroundTransform} isPlaying={isPlaying} playToken={playToken} playheadMs={playheadMs} isDrawingPath={isDrawingPath} pathStartPoint={selectedSlotPosition ? { x: selectedSlotPosition.x, y: selectedSlotPosition.y } : undefined} onPathCommit={commitPath} onPathCancel={() => setIsDrawingPath(false)} onPathPointChange={activeTool === "motion" ? updatePathPoint : undefined} onPathPointStart={(clipId, index) => beginUndoGroup(`page:${selectedPage.id}:path:${clipId}:point:${index}`)} onPathPointEnd={(clipId, index) => endUndoGroup(`page:${selectedPage.id}:path:${clipId}:point:${index}`)} onPathPointSelect={(index) => setSelectedPathPoint({ clipId: selectedClipId, index })} selectedPathPointIndex={selectedPathPointIndex} selectedAnimationClipId={selectedClipId} /></div>
          {!story.roles.length && <div className="story-composer-first-character"><button className="workspace-text-link" type="button" onClick={openQuickCharacterDialog} disabled={!selectedPage || slotsUnavailable || mutation.isPending || mutationOutcomeBlocked}>Tạo nhân vật <UserPlus size={15} aria-hidden="true" /></button></div>}
          <div className="story-filmstrip" aria-label="Chọn và kéo thả để sắp xếp trang truyện">{story.pages.map((page, index) => <button type="button" key={page.id} draggable={!mutation.isPending && !mutationOutcomeBlocked} className={`${selectedPage.id === page.id ? "active" : ""}${draggedPageId === page.id ? " is-dragging" : ""}${dropTargetPageId === page.id ? " is-drop-target" : ""}`} aria-current={selectedPage.id === page.id ? "page" : undefined} aria-label={`Chọn trang ${index + 1}${selectedPage.id === page.id ? ", đang mở" : ""}. Kéo để sắp xếp.`} onClick={() => selectPage(page)} onDragStart={(event) => { draggedPageRef.current = page.id; setDraggedPageId(page.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", page.id); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTargetPageId(page.id); }} onDrop={(event) => { event.preventDefault(); const draggedId = draggedPageRef.current || event.dataTransfer.getData("text/plain"); reorderPages(draggedId, page.id); draggedPageRef.current = ""; setDraggedPageId(""); setDropTargetPageId(""); }} onDragEnd={() => { draggedPageRef.current = ""; setDraggedPageId(""); setDropTargetPageId(""); }}><span className="story-page-thumbnail" aria-hidden="true"><StoryPageRenderer story={composedStory} page={{ ...composedStory.pages.find((item) => item.id === page.id), animationClips: [], sequence: [] }} assets={assets} playheadMs={0} isThumbnail /></span></button>)}<button type="button" className="story-filmstrip-add" onClick={addPage} disabled={mutation.isPending || mutationOutcomeBlocked} aria-label="Thêm trang" title="Thêm trang"><Plus size={22} aria-hidden="true" /></button></div>
        </> : <div className="editor-empty"><p>Thêm trang đầu tiên để bắt đầu dựng truyện.</p><button ref={emptyPageActionRef} className="workspace-button" type="button" onClick={addPage} disabled={mutation.isPending || mutationOutcomeBlocked} aria-busy={mutation.isPending}>{mutation.isPending ? "Đang tạo trang…" : <><Plus size={16} aria-hidden="true" /> Tạo trang đầu tiên</>}</button></div>}
      </div>
      <StoryAnimationEditor {...animationEditorProps} showPanel={false} showTimeline={!timelineCollapsed} />
    </div>
    {quickCharacterOpen && <div className="asset-picker-dialog-backdrop story-character-create-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") closeQuickCharacterDialog(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeQuickCharacterDialog(); }}>
      <section className="asset-picker-dialog story-character-create-dialog" role="dialog" aria-modal="true" aria-labelledby="story-quick-character-title">
        <div className="asset-picker-dialog-heading"><div><p className="workspace-eyebrow">NHÂN VẬT TRONG TRUYỆN</p><h2 id="story-quick-character-title">Tạo nhân vật</h2><p>Nhân vật sẽ được thêm vào truyện và đặt lên Trang {selectedPageIndex + 1}.</p></div><button className="icon-button" type="button" onClick={closeQuickCharacterDialog} aria-label="Đóng hộp tạo nhân vật" disabled={quickCharacterBusy}><X size={18} aria-hidden="true" /></button></div>
        <form className="story-character-quick-form" onSubmit={submitQuickCharacter}>
          {pendingRoleToPlace ? <div className="story-character-quick-created" role="status"><strong>{pendingRoleToPlace.name}</strong> đã được tạo. Thử đặt nhân vật này lên trang hiện tại.</div> : <>
            <label><span>Tên nhân vật <strong aria-hidden="true">*</strong></span><input autoFocus required maxLength={60} value={quickCharacterName} onChange={(event) => setQuickCharacterName(event.target.value)} placeholder="Ví dụ: Mèo Mướp" disabled={quickCharacterBusy} /></label>
            <label><span>Loại nhân vật <strong aria-hidden="true">*</strong></span><select required value={quickCharacterType} onChange={(event) => setQuickCharacterType(event.target.value)} disabled={quickCharacterBusy}>{STORY_ROLE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {featureApiModes.content === "real" ? <><label><span>Ảnh nhân vật (không bắt buộc)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectQuickCharacterFile} disabled={quickCharacterBusy} /><small>Ảnh tải lên dùng làm tư thế mặc định. PNG, JPG, WEBP, GIF · tối đa 5 MB.{quickCharacterFile ? ` Đã chọn: ${quickCharacterFile.name}` : ""}</small></label>{quickCharacterPreviewUrl && <div className="story-character-quick-preview"><img src={quickCharacterPreviewUrl} alt={`Xem trước ảnh nhân vật ${quickCharacterName.trim() || "mới"}`} /><span>Xem trước ảnh</span></div>}</> : <div className="story-character-quick-asset"><AssetPicker assets={assets} id="story-quick-character-asset" label="Ảnh mặc định" category="character" value={quickCharacterAssetId} allowUpload={false} allowLocalAssets onChange={(assetId) => setQuickCharacterAssetId(assetId)} /></div>}
          </>}
          {quickCharacterError && <p className="editor-field-error" role="alert">{quickCharacterError}</p>}
          {quickCharacterNeedsReload && <p className="editor-help" role="status">Tải lại truyện để đồng bộ danh sách nhân vật trước khi tiếp tục.</p>}
          <div className="asset-picker-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={closeQuickCharacterDialog} disabled={quickCharacterBusy}>Hủy</button><button className="workspace-button" type="submit" disabled={quickCharacterBusy || mutation.isPending || mutationOutcomeBlocked || slotsUnavailable || quickCharacterNeedsReload}>{quickCharacterBusy ? "Đang lưu…" : pendingRoleToPlace ? "Thử đặt lên trang" : "Tạo và đặt lên trang"}</button></div>
        </form>
      </section>
    </div>}
  </section>;
}
