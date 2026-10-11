import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowDown, ArrowLeft, ArrowUp, BookOpenText, CheckCircle, Eye, FloppyDisk, Image as ImageIcon, MagicWand, Plus, SpeakerHigh, Stack, Trash, UploadSimple, UserPlus, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { EditorField, EditorMutationMessage } from "../components/StoryEditorParts";
import PublishIssues from "../components/PublishIssues";
import AssetPicker from "../components/AssetPicker";
import StoryPageRenderer from "../components/StoryPageRenderer";
import StoryAnimationEditor from "../components/StoryAnimationEditor";
import { useContentAssets, useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { animationDuration, clipsConflict, createId, evaluateSlotAnimation, pageAnimationClips } from "../utils/storyAnimation";
import { normalizeStoryAudioTracks, stopStoryAudio, syncStoryAudio } from "../utils/storyAudio";

const emptyPage = { title: "", text: "", backgroundAssetId: "", narration: "", audioTracks: [], sequence: [], animationClips: [] };
const emptySlot = { pageId: "", x: 50, y: 50, scale: 1, rotation: 0, flip: false, layer: 1, anchor: "center", assetId: "" };
const storyTools = [["pages", "Trang", BookOpenText], ["scene", "Cảnh", ImageIcon], ["audio", "Âm thanh", SpeakerHigh], ["motion", "Chuyển động", MagicWand], ["layers", "Lớp", Stack]];

function pageValues(page) {
  return page ? {
    title: page.title || "", text: page.text || "", backgroundAssetId: page.backgroundAssetId || "", narration: page.narration || "",
    audioTracks: normalizeStoryAudioTracks(page.audioTracks || []), sequence: page.sequence || [], animationClips: pageAnimationClips(page),
  } : emptyPage;
}

function slotValues(slot) {
  return slot ? { pageId: slot.pageId, x: slot.x, y: slot.y, scale: slot.scale, rotation: Number(slot.rotation || 0), flip: Boolean(slot.flip), layer: slot.layer, anchor: slot.anchor || "center", assetId: slot.assetId || "" } : emptySlot;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validatePageDraft(values, pageSlots, assets, measuredAudioDurations = {}) {
  const slots = new Set(pageSlots.map(({ slot }) => slot.id));
  const validEasing = new Set(["linear", "ease-in", "ease-out", "ease-in-out"]);
  const validPresets = new Set(["appear", "move", "jump", "spin", "walk"]);
  if (!values.title?.trim()) return "Hãy nhập tên trang.";
  const audioTracks = Array.isArray(values.audioTracks) ? values.audioTracks : [];
  if (audioTracks.some((track, index) => {
    const asset = assets.find((item) => item.id === track.assetId && item.kind === "audio");
    const trimStart = Number(track.trimStartMs || 0);
    const duration = Number(track.durationMs || 0);
    const sourceDuration = Number(asset?.duration || 0) * 1000 || Number(measuredAudioDurations[track.id]) || 0;
    return !track.id || audioTracks.some((other, otherIndex) => otherIndex !== index && other.id === track.id) || !asset || !["voiceover", "music", "effect"].includes(track.type || "voiceover") || !Number.isFinite(Number(track.startMs || 0)) || Number(track.startMs || 0) < 0 || !Number.isFinite(trimStart) || trimStart < 0 || (track.durationMs !== undefined && (!Number.isFinite(duration) || duration <= 0)) || (sourceDuration > 0 && (trimStart >= sourceDuration || (duration > 0 && trimStart + duration > sourceDuration + 1))) || !Number.isFinite(Number(track.volume ?? 1)) || Number(track.volume ?? 1) < 0 || Number(track.volume ?? 1) > 1;
  })) return "Hãy kiểm tra tệp, thời điểm, đoạn cắt và âm lượng của từng track âm thanh.";
  if ((values.sequence || []).some((item) => !slots.has(item.slotId) || !validPresets.has(item.preset) || !Number.isFinite(Number(item.durationMs || 900)) || Number(item.durationMs || 900) < 200 || Number(item.durationMs || 900) > 5000)) return "Hãy chọn nhân vật còn trên trang và thời lượng từ 200 đến 5000 ms cho mỗi hoạt động cũ.";
  const clips = pageAnimationClips(values);
  if (clips.some((clip, index) => !clip.id || clips.some((other, otherIndex) => otherIndex !== index && other.id === clip.id))) return "Mỗi chuyển động cần có một mã riêng. Hãy xóa clip trùng rồi tạo lại.";
  if (clips.some((clip) => {
    if (!slots.has(clip.targetId) || !Number.isFinite(Number(clip.startMs)) || Number(clip.startMs) < 0 || !Number.isFinite(Number(clip.durationMs)) || Number(clip.durationMs) <= 0 || (clip.easing && !validEasing.has(clip.easing))) return true;
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

function PageFields({ values, onChange, assets, prefix }) {
  return <div className="editor-form-grid">
    <EditorField label="Tên trang" name={`${prefix}-title`} value={values.title} onChange={(value) => onChange("title", value)} maxLength={120} placeholder="Ví dụ: Bobby gặp chú bướm" />
    <div className="editor-field"><AssetPicker assets={assets} id={`story-editor-${prefix}-background`} label="Ảnh nền" value={values.backgroundAssetId} onChange={(value) => onChange("backgroundAssetId", value)} /></div>
    <div className="editor-field editor-field-wide"><label htmlFor={`${prefix}-text`}>Nội dung truyện</label><textarea id={`${prefix}-text`} rows="4" value={values.text} onChange={(event) => onChange("text", event.target.value)} placeholder="Viết nội dung trang này..." /></div>
    <div className="editor-field editor-field-wide"><label htmlFor={`${prefix}-narration`}>Lời kể (tuỳ chọn)</label><textarea id={`${prefix}-narration`} rows="2" value={values.narration} onChange={(event) => onChange("narration", event.target.value)} placeholder="Lời đọc hiển thị cùng trang." /></div>
  </div>;
}

function SlotFields({ values, assets, onChange, onDelete, isSaving }) {
  return <div className="editor-form slot-properties-form">
    <div className="editor-field"><AssetPicker assets={assets} id="story-editor-character-pose" label="Tư thế / ảnh nhân vật" value={values.assetId} onChange={(value) => onChange("assetId", value)} allowEmpty /></div>
    <div className="editor-form-grid story-slot-position-fields">
      <EditorField label="Vị trí ngang (%)" name="selected-slot-x" type="number" min="0" max="100" step="0.5" value={values.x} onChange={(value) => onChange("x", value)} />
      <EditorField label="Vị trí dọc (%)" name="selected-slot-y" type="number" min="0" max="100" step="0.5" value={values.y} onChange={(value) => onChange("y", value)} />
      <EditorField label="Kích thước" name="selected-slot-scale" type="number" min="0.1" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
      <EditorField label="Góc xoay (°)" name="selected-slot-rotation" type="number" min="-3600" max="3600" step="1" value={values.rotation} onChange={(value) => onChange("rotation", value)} />
      <EditorField label="Lớp hiển thị" name="selected-slot-layer" type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
    </div>
    <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật nhân vật</label>
    <div className="editor-form-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => onDelete()} disabled={isSaving}><Trash size={16} aria-hidden="true" /> Gỡ khỏi trang</button></div>
  </div>;
}

function AudioSequence({ values, assets, audioDurations, onChange, onUpload, onDuration, isUploading, uploadError }) {
  const audioAssets = assets.filter((asset) => asset.kind === "audio" && asset.url && asset.processingStatus !== "failed");
  function updateTrack(index, patch) {
    onChange(values.map((track, trackIndex) => trackIndex === index ? { ...track, ...patch } : track));
  }
  return <section className="story-sequence-section" aria-labelledby="story-audio-title">
    <div className="story-sequence-heading"><div><h4 id="story-audio-title">Âm thanh trang này</h4><p>Đặt thời điểm, cắt đoạn và âm lượng; các track có thể phát chồng nhau.</p></div><div className="story-sequence-add-audio"><label className="sr-only" htmlFor="story-add-audio">Thêm âm thanh</label><select id="story-add-audio" value="" onChange={(event) => {
      const assetId = event.target.value;
      if (!assetId) return;
      const asset = audioAssets.find((item) => item.id === assetId);
      onChange([...values, { id: uid("audio"), assetId, name: asset?.name || "Âm thanh", type: "voiceover", startMs: 0, trimStartMs: 0, ...(Number(asset?.duration) > 0 ? { durationMs: Math.round(Number(asset.duration) * 1000) } : {}), volume: 1 }]);
      event.target.value = "";
    }} disabled={!audioAssets.length}>
      <option value="">{audioAssets.length ? "+ Chọn âm thanh" : "Chưa có âm thanh trong kho"}</option>
      {audioAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
    </select><label className="workspace-button workspace-button-quiet story-audio-upload"><input type="file" hidden accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/aac" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload(file); }} /><UploadSimple size={15} aria-hidden="true" />{isUploading ? "Đang tải…" : "Tải âm thanh lên"}</label></div></div>
    {uploadError && <p className="editor-field-error" role="alert">{uploadError}</p>}
    {values.length ? <ol className="story-audio-track-list">{values.map((track, index) => {
      const asset = assets.find((item) => item.id === track.assetId);
      const fullDurationMs = Number(asset?.duration) > 0 ? Number(asset.duration) * 1000 : Number(audioDurations?.[track.id]) || 0;
      const durationValue = Number(track.durationMs) > 0 ? Number(track.durationMs) : Math.max(0, fullDurationMs - Number(track.trimStartMs || 0));
      return <li className="story-audio-track" key={track.id}>
        <span className="story-audio-track-order">{String(index + 1).padStart(2, "0")}</span>
        <div className="story-audio-track-main"><strong>{asset?.name || track.name || "Âm thanh không khả dụng"}</strong><label><span className="sr-only">Loại âm thanh</span><select value={track.type || "voiceover"} onChange={(event) => updateTrack(index, { type: event.target.value })}><option value="voiceover">Lời kể</option><option value="music">Nhạc nền</option><option value="effect">Hiệu ứng</option></select></label>{asset?.url ? <audio controls preload="metadata" src={asset.url} aria-label={`Nghe ${asset.name}`} onLoadedMetadata={(event) => { const length = event.currentTarget.duration; if (Number.isFinite(length) && length > 0) onDuration?.(track.id, Math.round(length * 1000)); }} /> : <small className="editor-field-error">Không tải được tệp. Hãy chọn âm thanh khác trong thư viện.</small>}
          <div className="story-audio-timing"><label>Bắt đầu (s)<input type="number" min="0" step="0.1" value={(Number(track.startMs || 0) / 1000).toFixed(1)} onChange={(event) => updateTrack(index, { startMs: Math.max(0, Number(event.target.value) * 1000 || 0) })} /></label><label>Cắt đầu (s)<input type="number" min="0" max={fullDurationMs ? Math.max(0, fullDurationMs - 100) / 1000 : undefined} step="0.1" value={(Number(track.trimStartMs || 0) / 1000).toFixed(1)} onChange={(event) => { const trimStartMs = Math.max(0, Math.min(fullDurationMs ? fullDurationMs - 100 : Infinity, Number(event.target.value) * 1000 || 0)); const remaining = Math.max(100, fullDurationMs - trimStartMs); const durationMs = Number(track.durationMs) > 0 ? Math.min(Number(track.durationMs), remaining) : remaining; updateTrack(index, { trimStartMs, ...(fullDurationMs ? { durationMs } : {}) }); }} /></label><label>Thời lượng (s)<input type="number" min="0.1" max={fullDurationMs ? Math.max(0.1, (fullDurationMs - Number(track.trimStartMs || 0)) / 1000) : undefined} step="0.1" placeholder={fullDurationMs ? (Math.max(0, fullDurationMs - Number(track.trimStartMs || 0)) / 1000).toFixed(1) : "Tự động"} value={durationValue ? (durationValue / 1000).toFixed(1) : ""} onChange={(event) => updateTrack(index, { durationMs: event.target.value ? Math.max(100, Number(event.target.value) * 1000 || 100) : undefined })} /></label><label className="story-audio-volume">Âm lượng <span>{Math.round((Number(track.volume ?? 1)) * 100)}%</span><input type="range" min="0" max="100" step="1" value={Math.round((Number(track.volume ?? 1)) * 100)} onChange={(event) => updateTrack(index, { volume: Number(event.target.value) / 100 })} /></label></div>
        </div>
        <div className="story-audio-track-actions"><button className="icon-button icon-button-danger" type="button" aria-label={`Gỡ ${asset?.name || track.name}`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><X size={16} aria-hidden="true" /></button></div>
      </li>;
    })}</ol> : <p className="story-sequence-empty">Chưa có âm thanh. Hãy tải tệp lên kho tư liệu rồi thêm vào đây.</p>}
  </section>;
}

export default function StoryPagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { story, storyId, setEditorDirty, onPublish, onValidate, isPublishing, isValidating, publishError, validation } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const [searchParams] = useSearchParams();
  const initialPage = story.pages.find((page) => page.id === searchParams.get("pageId")) || story.pages[0];
  const initialSlot = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === searchParams.get("slotId") && slot.pageId === initialPage?.id);
  const [selectedPageId, setSelectedPageId] = useState(initialPage?.id || "");
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlot?.id || "");
  const [selectedClipId, setSelectedClipId] = useState("");
  const [selectedPathPoint, setSelectedPathPoint] = useState(null);
  const [activeTool, setActiveTool] = useState("motion");
  const [recordingKeyframes, setRecordingKeyframes] = useState(false);
  const [animationProperty, setAnimationProperty] = useState("x");
  const [animationTab, setAnimationTab] = useState("effects");
  const [animationError, setAnimationError] = useState("");
  const [pageDrafts, setPageDrafts] = useState({});
  const [slotDrafts, setSlotDrafts] = useState({});
  const [undoCount, setUndoCount] = useState(0);
  const [roleToAdd, setRoleToAdd] = useState("");
  const [localError, setLocalError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [audioDurations, setAudioDurations] = useState({});
  const audioPlayersRef = useRef(new Map());
  const playStartRef = useRef(0);
  const playheadStartRef = useRef(0);
  const workspaceRef = useRef(null);
  const draftStateRef = useRef({ pageDrafts: {}, slotDrafts: {} });
  const undoStackRef = useRef([]);
  const undoGroupRef = useRef({ key: "", started: false });
  const lastUndoEditRef = useRef({ key: "", at: 0 });

  function commitDraftChange(update, { key = "", recordUndo = true } = {}) {
    const current = draftStateRef.current;
    const next = update(current);
    if (JSON.stringify(current) === JSON.stringify(next)) return;

    if (recordUndo) {
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
    draftStateRef.current = previous;
    setPageDrafts(previous.pageDrafts);
    setSlotDrafts(previous.slotDrafts);
    setUndoCount(undoStackRef.current.length);
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
  }

  function rebaseUndoHistory(transform) {
    const rebased = [];
    for (const snapshot of undoStackRef.current) {
      const next = transform(snapshot);
      if (!rebased.length || JSON.stringify(rebased.at(-1)) !== JSON.stringify(next)) rebased.push(next);
    }
    if (rebased.length && JSON.stringify(rebased.at(-1)) === JSON.stringify(draftStateRef.current)) rebased.pop();
    undoStackRef.current = rebased;
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
    setUndoCount(rebased.length);
  }

  function clearUndoHistory() {
    undoStackRef.current = [];
    undoGroupRef.current = { key: "", started: false };
    lastUndoEditRef.current = { key: "", at: 0 };
    setUndoCount(0);
  }

  const mutation = useStoryEditorMutation(({ action, pageId, roleId, slotId, payload, revision }) => {
    if (action === "add") return contentService.addPage({ storyId, revision, ...payload });
    if (action === "update") return contentService.updatePage({ storyId, pageId, revision, ...payload });
    if (action === "delete") return contentService.deletePage({ storyId, pageId, revision });
    if (action === "add-slot") return contentService.addSlot({ storyId, roleId, revision, ...payload });
    if (action === "delete-slot") return contentService.deleteSlot({ storyId, roleId, slotId, revision });
    if (action === "update-slot") return contentService.updateSlot({ storyId, roleId, slotId, revision, ...payload });
    return contentService.reorderPages({ storyId, pageIds: payload, revision });
  });
  const uploadAudioMutation = useMutation({
    mutationFn: async ({ file, pageId }) => ({ asset: await contentService.uploadAsset({ file }), pageId }),
    onSuccess: async ({ asset, pageId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
      commitDraftChange((current) => {
        const page = story.pages.find((item) => item.id === pageId);
        if (!page) return current;
        const draft = current.pageDrafts[pageId] || pageValues(page);
        const track = { id: uid("audio"), assetId: asset.id, name: asset.name, type: "voiceover", startMs: 0, trimStartMs: 0, ...(Number(asset.duration) > 0 ? { durationMs: Math.round(Number(asset.duration) * 1000) } : {}), volume: 1 };
        return { ...current, pageDrafts: { ...current.pageDrafts, [pageId]: { ...draft, audioTracks: [...(draft.audioTracks || []), track] } } };
      }, { key: `page:${pageId}:audioTracks` });
    },
  });
  const assets = assetsQuery.data?.items || [];
  const selectedPage = story.pages.find((page) => page.id === selectedPageId) || story.pages[0];
  const selectedPageKey = selectedPage?.id;
  const pageDraft = selectedPage ? pageDrafts[selectedPage.id] || pageValues(selectedPage) : emptyPage;
  const animationClips = pageAnimationClips(pageDraft);
  const pageDurationMs = animationDuration(pageDraft, audioDurations);
  const selectedSlotRecord = useMemo(() => story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === selectedSlotId), [selectedSlotId, story.roles]);
  const slotDraft = selectedSlotRecord ? slotDrafts[selectedSlotRecord.slot.id] || slotValues(selectedSlotRecord.slot) : emptySlot;
  const pageSlots = useMemo(() => story.roles.flatMap((role) => (role.slots || []).filter((slot) => slot.pageId === selectedPage?.id).map((slot) => ({ role, slot }))), [selectedPage?.id, story.roles]);
  const selectedSlotPosition = selectedSlotRecord ? evaluateSlotAnimation({ ...selectedSlotRecord.slot, ...slotDraft }, animationClips, playheadMs) : null;
  const selectedPathClip = animationClips.find((clip) => clip.id === selectedClipId && clip.kind === "path");
  const selectedPathPointIndex = selectedPathPoint?.clipId === selectedClipId ? selectedPathPoint.index : -1;
  const dirty = Object.entries(pageDrafts).some(([id, values]) => JSON.stringify(values) !== JSON.stringify(pageValues(story.pages.find((page) => page.id === id))))
    || Object.entries(slotDrafts).some(([id, values]) => {
      const original = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === id);
      return original && JSON.stringify(values) !== JSON.stringify(slotValues(original));
    });
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  const composedStory = useMemo(() => ({
    ...story,
    pages: story.pages.map((page) => ({ ...page, ...(pageDrafts[page.id] || {}) })),
    roles: story.roles.map((role) => ({ ...role, slots: (role.slots || []).map((slot) => ({ ...slot, ...(slotDrafts[slot.id] || {}) })) })),
  }), [pageDrafts, slotDrafts, story]);
  const composedPage = composedStory.pages.find((page) => page.id === selectedPage?.id);

  useEffect(() => () => {
    stopStoryAudio(audioPlayersRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    playStartRef.current = performance.now();
    playheadStartRef.current = playheadMs;
    let frame = 0;
    const duration = animationDuration(pageDraft, audioDurations);
    const tick = (now) => {
      const current = playheadStartRef.current + now - playStartRef.current;
      if (current >= duration) {
        setPlayheadMs(duration);
        setIsPlaying(false);
        syncPreviewAudio(duration, false);
        return;
      }
      setPlayheadMs(current);
      syncPreviewAudio(current, true);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isPlaying, selectedPage?.id, pageDurationMs, pageDraft.audioTracks, assets]);

  useEffect(() => {
    if (isPlaying) return;
    syncStoryAudio(audioPlayersRef.current, pageDraft.audioTracks || [], assets, playheadMs, false, (name) => setLocalError(`Không phát được ${name}.`), (id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length }));
  }, [isPlaying, selectedPage?.id, pageDraft.audioTracks, assets, playheadMs]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return undefined;
    function handleUndoShortcut(event) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z" || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select"))) return;
      if (!undoStackRef.current.length) return;
      event.preventDefault();
      undoDraftChange();
    }
    workspace.addEventListener("keydown", handleUndoShortcut);
    return () => workspace.removeEventListener("keydown", handleUndoShortcut);
  }, []);

  useEffect(() => {
    if (!selectedPageKey) return;
    try { localStorage.setItem("sketchtale.content.lastPage.v1", JSON.stringify({ storyId, pageId: selectedPageKey })); } catch { /* storage can be unavailable in private browsing */ }
  }, [selectedPageKey, storyId]);

  function updatePageField(name, value) {
    if (!selectedPage) return;
    const pageId = selectedPage.id;
    commitDraftChange((current) => ({ ...current, pageDrafts: { ...current.pageDrafts, [pageId]: { ...pageValues(selectedPage), ...current.pageDrafts[pageId], [name]: value } } }), { key: `page:${pageId}:${name}` });
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
    stopPreview();
    setSelectedPageId(page.id);
    setSelectedSlotId("");
    setSelectedClipId("");
    setSelectedPathPoint(null);
    setPlayheadMs(0);
    setIsDrawingPath(false);
    setRecordingKeyframes(false);
    setAnimationError("");
    setLocalError("");
  }

  function selectSlot(slotId) {
    setSelectedSlotId(slotId);
    if (activeTool !== "motion" && activeTool !== "scene" && activeTool !== "layers") setActiveTool("scene");
    setLocalError("");
  }

  function addPage() {
    const number = story.pages.length + 1;
    if (isPlaying) stopPreview();
    mutation.mutate({ action: "add", payload: { ...emptyPage, title: `Trang ${number}` } }, { onSuccess: (nextStory) => {
      const next = nextStory.pages.at(-1);
      if (next) {
        setSelectedPageId(next.id); setSelectedSlotId(""); setSelectedClipId(""); setSelectedPathPoint(null);
        setPlayheadMs(0); setIsDrawingPath(false); setRecordingKeyframes(false); setAnimationError("");
      }
    } });
  }

  async function saveAllDrafts() {
    if (mutation.isPending) return;
    const pendingPages = Object.entries(draftStateRef.current.pageDrafts).filter(([pageId, values]) => {
      const original = story.pages.find((page) => page.id === pageId);
      return original && JSON.stringify(values) !== JSON.stringify(pageValues(original));
    });
    const pendingSlots = Object.entries(draftStateRef.current.slotDrafts).filter(([slotId, values]) => {
      const original = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === slotId);
      return original && JSON.stringify(values) !== JSON.stringify(slotValues(original));
    });
    for (const [pageId, values] of pendingPages) {
      const slots = story.roles.flatMap((role) => (role.slots || []).filter((slot) => slot.pageId === pageId).map((slot) => ({ role, slot })));
      const error = validatePageDraft(values, slots, assets, audioDurations);
      if (error) { setSelectedPageId(pageId); setActiveTool("scene"); setLocalError(error); return; }
    }
    for (const [slotId, values] of pendingSlots) {
      const error = validateSlotDraft(values);
      if (error) {
        const record = story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === slotId);
        if (record) { setSelectedPageId(record.slot.pageId); setSelectedSlotId(slotId); setActiveTool("scene"); }
        setLocalError(error); return;
      }
    }
    setLocalError("");
    try {
      for (const [pageId, values] of pendingPages) {
        await mutation.mutateAsync({ action: "update", pageId, payload: values });
        if (JSON.stringify(draftStateRef.current.pageDrafts[pageId]) !== JSON.stringify(values)) continue;
        commitDraftChange((current) => { const nextPages = { ...current.pageDrafts }; delete nextPages[pageId]; return { ...current, pageDrafts: nextPages }; }, { recordUndo: false });
        rebaseUndoHistory((snapshot) => { const pageSnapshots = { ...snapshot.pageDrafts }; delete pageSnapshots[pageId]; return { ...snapshot, pageDrafts: pageSnapshots }; });
      }
      for (const [slotId, values] of pendingSlots) {
        const record = story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === slotId);
        if (!record) continue;
        const payload = normalizedSlotDraft(values);
        await mutation.mutateAsync({ action: "update-slot", roleId: record.role.id, slotId, payload });
        if (JSON.stringify(draftStateRef.current.slotDrafts[slotId]) !== JSON.stringify(values)) continue;
        commitDraftChange((current) => { const nextSlots = { ...current.slotDrafts }; delete nextSlots[slotId]; return { ...current, slotDrafts: nextSlots }; }, { recordUndo: false });
        rebaseUndoHistory((snapshot) => { const slotSnapshots = { ...snapshot.slotDrafts }; delete slotSnapshots[slotId]; return { ...snapshot, slotDrafts: slotSnapshots }; });
      }
    } catch (error) {
      setLocalError(error?.message || "Không lưu được toàn bộ thay đổi. Những phần chưa lưu vẫn còn trong bản nháp.");
    }
  }

  function uploadAudio(file) {
    if (selectedPage) uploadAudioMutation.mutate({ file, pageId: selectedPage.id });
  }

  function addCharacter() {
    const role = story.roles.find((item) => item.id === roleToAdd);
    if (!role || !selectedPage) return;
    mutation.mutate({ action: "add-slot", roleId: role.id, payload: { ...emptySlot, pageId: selectedPage.id, assetId: role.defaultAssetId || "" } }, { onSuccess: (nextStory) => {
      const nextRole = nextStory.roles.find((item) => item.id === role.id);
      const slot = [...(nextRole?.slots || [])].reverse().find((item) => item.pageId === selectedPage.id);
      if (slot) { setSelectedSlotId(slot.id); setRoleToAdd(""); }
    } });
  }

  function deleteSelectedSlot(slotId = selectedSlotRecord?.slot.id) {
    const targetSlotId = typeof slotId === "string" ? slotId : selectedSlotRecord?.slot.id;
    const record = story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === targetSlotId);
    if (!record) return;
    const { role, slot } = record;
    if (!window.confirm(`Xóa ${role.name} khỏi trang này và gỡ các chuyển động của nhân vật?`)) return;
    if (isPlaying) stopPreview();
    mutation.mutate({ action: "delete-slot", roleId: role.id, slotId: slot.id }, { onSuccess: (nextStory) => {
      const nextPage = nextStory.pages.find((page) => page.id === slot.pageId);
      const hadPageDraft = Boolean(draftStateRef.current.pageDrafts[slot.pageId]);
      commitDraftChange((current) => {
        const nextSlots = { ...current.slotDrafts };
        delete nextSlots[slot.id];
        let nextPages = current.pageDrafts;
        const pageState = nextPage ? { ...pageValues(nextPage), ...current.pageDrafts[slot.pageId] } : null;
        if (nextPage && pageState) {
          const sequence = (pageState.sequence || []).filter((item) => item.slotId !== slot.id);
          const animationClips = pageAnimationClips(pageState).filter((item) => item.targetId !== slot.id);
          if (sequence.length !== (pageState.sequence || []).length || animationClips.length !== pageAnimationClips(pageState).length || hadPageDraft) {
            nextPages = { ...current.pageDrafts, [slot.pageId]: { ...pageState, sequence, animationClips } };
          }
        }
        return { ...current, pageDrafts: nextPages, slotDrafts: nextSlots };
      }, { recordUndo: false });
      clearUndoHistory();
      if (selectedSlotId === slot.id) setSelectedSlotId("");
      if (animationClips.some((clip) => clip.targetId === slot.id && clip.id === selectedClipId)) {
        setSelectedClipId("");
        setSelectedPathPoint(null);
      }
    } });
  }

  function deletePage(page) {
    const pageHasDraft = pageDrafts[page.id] && JSON.stringify(pageDrafts[page.id]) !== JSON.stringify(pageValues(page));
    if (pageHasDraft && !window.confirm("Xóa trang này sẽ bỏ chỉnh sửa chưa lưu của riêng trang. Bạn muốn tiếp tục?")) return;
    if (!window.confirm(`Xóa “${page.title}” khỏi truyện? Nhân vật đang đặt trên trang này cũng sẽ được gỡ.`)) return;
    if (isPlaying) stopPreview();
    mutation.mutate({ action: "delete", pageId: page.id }, { onSuccess: (nextStory) => {
      const current = draftStateRef.current;
      const removedSlotIds = story.roles.flatMap((role) => role.slots || []).filter((slot) => slot.pageId === page.id).map((slot) => slot.id);
      const nextPages = { ...current.pageDrafts };
      delete nextPages[page.id];
      commitDraftChange(() => ({
        pageDrafts: nextPages,
        slotDrafts: Object.fromEntries(Object.entries(current.slotDrafts).filter(([slotId]) => !removedSlotIds.includes(slotId))),
      }), { recordUndo: false });
      clearUndoHistory();
      const nextPage = nextStory.pages[Math.max(0, page.order - 2)] || nextStory.pages[0];
      setSelectedPageId(nextPage?.id || ""); setSelectedSlotId("");
      setSelectedClipId(""); setSelectedPathPoint(null); setPlayheadMs(0); setIsDrawingPath(false); setRecordingKeyframes(false); setAnimationError("");
    } });
  }

  function movePage(index, direction) {
    const next = [...story.pages]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    mutation.mutate({ action: "reorder", payload: next.map((page) => page.id) });
  }

  function stopPreview() {
    stopStoryAudio(audioPlayersRef.current);
    setIsPlaying(false);
  }

  function syncPreviewAudio(time, playing) {
    syncStoryAudio(audioPlayersRef.current, pageDraft.audioTracks || [], assets, time, playing, (name) => setLocalError(`Không phát được ${name}.`), (id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length }));
  }

  function playPreview() {
    if (!selectedPage) return;
    setLocalError("");
    if (isPlaying) { syncPreviewAudio(playheadMs, false); setIsPlaying(false); return; }
    const startAt = playheadMs >= animationDuration(pageDraft, audioDurations) ? 0 : playheadMs;
    if (startAt === 0) setPlayheadMs(0);
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

  function deleteSelectedPathPoint() {
    if (!selectedPage || !selectedPathClip || selectedPathPointIndex < 0 || selectedPathClip.points.length <= 2) return;
    const nextPoints = selectedPathClip.points.filter((_, index) => index !== selectedPathPointIndex);
    updatePageField("animationClips", animationClips.map((clip) => clip.id === selectedPathClip.id ? { ...clip, points: nextPoints } : clip));
    setSelectedPathPoint(null);
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
    selectedSlotId,
    onSlotSelect: selectSlot,
    playheadMs,
    onPlayheadChange: (value) => { if (isPlaying) stopPreview(); setPlayheadMs(value); },
    isPlaying,
    onTogglePlayback: playPreview,
    selectedClipId,
    onClipSelect: (id) => { setSelectedClipId(id); setSelectedPathPoint(null); },
    selectedPathPointIndex,
    onPathPointSelect: (index) => setSelectedPathPoint({ clipId: selectedClipId, index }),
    onPathPointChange: updatePathPoint,
    onPathPointDelete: deleteSelectedPathPoint,
    onPathPointAdd: addPathPoint,
    onPathStart: () => { if (isPlaying) stopPreview(); setIsDrawingPath(true); },
    onDeleteSlot: deleteSelectedSlot,
    isDeletingSlot: mutation.isPending,
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

  return <section className="story-editor-panel story-studio-page">
    <header className="story-studio-topbar">
      <Link className="story-studio-back" to="/content/stories" onClick={(event) => { if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Rời trình dựng sẽ bỏ các thay đổi này. Bạn có muốn tiếp tục?")) event.preventDefault(); }}><ArrowLeft size={17} aria-hidden="true" /><span>Truyện</span></Link>
      <div className="story-studio-identity"><small>STORY EDITOR</small><strong title={story.title}>{story.title}</strong><span className={dirty ? "is-dirty" : ""} role="status">{dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</span></div>
      <div className="story-studio-topbar-actions">
        <button className="workspace-button workspace-button-quiet story-studio-undo" type="button" title="Hoàn tác thay đổi chưa lưu (Ctrl+Z / ⌘Z)" aria-label="Hoàn tác thay đổi chưa lưu" disabled={!undoCount || mutation.isPending} onClick={undoDraftChange}><ArrowCounterClockwise size={16} aria-hidden="true" /> Hoàn tác</button>
        <button className="workspace-button workspace-button-quiet" type="button" onClick={saveAllDrafts} disabled={!dirty || mutation.isPending}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu…" : "Lưu tất cả"}</button>
        <Link className="workspace-button workspace-button-quiet" to={`/content/stories/${storyId}/preview`} target="_blank" rel="noreferrer"><Eye size={16} aria-hidden="true" /> Bản đã lưu</Link>
        <Link className="workspace-button workspace-button-quiet story-studio-manage" to={`/content/stories/${storyId}`} onClick={(event) => { if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Rời trình dựng sẽ bỏ các thay đổi này. Bạn có muốn tiếp tục?")) event.preventDefault(); }}>Quản lý truyện</Link>
        <button className="workspace-button workspace-button-quiet story-studio-validate" type="button" onClick={onValidate} disabled={!onValidate || dirty || isPublishing || isValidating}><CheckCircle size={16} aria-hidden="true" />{isValidating ? "Đang kiểm tra…" : "Kiểm tra"}</button>
        <button className="workspace-button" type="button" onClick={onPublish} disabled={!onPublish || dirty || isPublishing || isValidating}><CheckCircle size={16} aria-hidden="true" />{isPublishing ? "Đang xuất bản…" : "Xuất bản"}</button>
      </div>
    </header>
    <p className="story-studio-mobile-notice">Chỉnh sửa animation đầy đủ cần màn hình rộng. Bạn vẫn có thể chọn trang và xem cảnh tại đây.</p>
    {validation && <p className={`story-studio-validation${validation.type === "error" ? " is-error" : ""}`} role="status">{validation.message}</p>}
    <PublishIssues error={publishError} />
    <EditorMutationMessage mutation={mutation} />
    {localError && <div className="editor-mutation-message editor-mutation-error" role="alert">{localError}</div>}
    {assetsQuery.isLoading && <p className="editor-help">Đang tải thư viện tư liệu…</p>}
    <div className={`story-studio-workspace${activeTool ? "" : " has-no-panel"}`} ref={workspaceRef}>
      <nav className="story-tool-rail" aria-label="Công cụ dựng truyện">
        {storyTools.map(([id, label, Icon]) => <button key={id} type="button" className={activeTool === id ? "active" : ""} aria-pressed={activeTool === id} onClick={() => { setActiveTool((current) => { const next = current === id ? "" : id; if (next !== "motion") setIsDrawingPath(false); return next; }); }}><Icon size={21} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>
      <aside className={`story-studio-panel${activeTool ? "" : " is-collapsed"}`} aria-label={`${activeTool === "motion" ? "Chuyển động" : activeTool === "audio" ? "Âm thanh" : activeTool === "pages" ? "Các trang" : activeTool === "layers" ? "Lớp nhân vật" : "Thuộc tính cảnh"}`}>
        {activeTool === "pages" && <>
          <div className="story-studio-panel-heading"><span className="workspace-eyebrow">TRUYỆN</span><h3>Các trang <small>{story.pages.length}</small></h3></div>
          {story.pages.length ? story.pages.map((page, index) => <div className={`story-composer-page-item${page.id === selectedPage?.id ? " active" : ""}`} key={page.id}><button className="story-composer-page-select" type="button" aria-current={page.id === selectedPage?.id ? "page" : undefined} onClick={() => selectPage(page)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{pageDrafts[page.id]?.title || page.title || "Trang chưa đặt tên"}</strong><small>{(pageDrafts[page.id]?.text ?? page.text)?.slice(0, 54) || "Bổ sung nội dung"}</small></button><div className="story-composer-page-actions"><button className="icon-button" type="button" aria-label={`Đưa trang ${index + 1} lên`} disabled={index === 0 || mutation.isPending} onClick={() => movePage(index, -1)}><ArrowUp size={15} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label={`Đưa trang ${index + 1} xuống`} disabled={index === story.pages.length - 1 || mutation.isPending} onClick={() => movePage(index, 1)}><ArrowDown size={15} aria-hidden="true" /></button></div></div>) : <div className="editor-empty"><p>Truyện chưa có trang.</p><button className="workspace-button" type="button" onClick={addPage}><Plus size={16} aria-hidden="true" /> Tạo trang đầu tiên</button></div>}
          <Link className="workspace-text-link story-composer-library-link" to="/content/assets">Mở kho tư liệu</Link>
        </>}
        {activeTool === "scene" && selectedPage && <><div className="story-studio-panel-heading"><span className="workspace-eyebrow">CẢNH</span><h3>{selectedSlotRecord ? selectedSlotRecord.role.name : "Nội dung trang"}</h3></div>{selectedSlotRecord ? <SlotFields values={slotDraft} assets={assets} onChange={updateSlotField} onDelete={deleteSelectedSlot} isSaving={mutation.isPending} /> : <PageFields values={pageDraft} assets={assets} onChange={updatePageField} prefix={`page-${selectedPage.id}`} />}</>}
        {activeTool === "audio" && selectedPage && <><div className="story-studio-panel-heading"><span className="workspace-eyebrow">ÂM THANH</span><h3>Âm thanh trang này</h3></div><AudioSequence values={pageDraft.audioTracks || []} assets={assets} audioDurations={audioDurations} onDuration={(id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length })} onChange={(value) => updatePageField("audioTracks", value)} onUpload={uploadAudio} isUploading={uploadAudioMutation.isPending} uploadError={uploadAudioMutation.error?.message} /></>}
        {activeTool === "layers" && <><div className="story-studio-panel-heading"><span className="workspace-eyebrow">ĐỐI TƯỢNG</span><h3>Nhân vật trên trang</h3></div>{pageSlots.length ? <ul className="story-studio-layer-list">{pageSlots.map(({ role, slot }) => <li key={slot.id}><button type="button" className={selectedSlotId === slot.id ? "active" : ""} onClick={() => selectSlot(slot.id)}><span>{role.name}</span><small>Lớp {slot.layer}</small></button><button className="icon-button icon-button-danger story-studio-layer-remove" type="button" aria-label={`Xóa ${role.name} khỏi trang`} title={`Xóa ${role.name} khỏi trang`} disabled={mutation.isPending} onClick={() => deleteSelectedSlot(slot.id)}><Trash size={15} aria-hidden="true" /></button></li>)}</ul> : <p className="editor-help">Trang chưa có nhân vật.</p>}<label className="story-studio-add-character"><span>Thêm nhân vật</span><select aria-label="Chọn nhân vật để thêm" value={roleToAdd} onChange={(event) => setRoleToAdd(event.target.value)}><option value="">Chọn nhân vật…</option>{story.roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select><button className="workspace-button" type="button" disabled={!roleToAdd || mutation.isPending} onClick={addCharacter}><Plus size={16} aria-hidden="true" /> Thêm</button></label></>}
        {activeTool === "motion" && <StoryAnimationEditor {...animationEditorProps} showPanel showTimeline={false} />}
      </aside>
      <div className="story-studio-canvas">
        {selectedPage && composedPage ? <>
          <div className="story-pages-canvas-toolbar"><span>Trang {selectedPage.order}</span><div className="story-canvas-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setActiveTool("layers")}><UserPlus size={16} aria-hidden="true" /> Nhân vật</button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa ${selectedPage.title}`} disabled={mutation.isPending} onClick={() => deletePage(selectedPage)}><Trash size={16} aria-hidden="true" /></button></div></div>
          {isDrawingPath && <div className="story-path-mode-banner"><span>Đang vẽ đường đi cho {selectedSlotRecord?.role.name || "nhân vật đã chọn"}. Kéo trên cảnh, rồi thả để lưu đường.</span><button type="button" className="workspace-button workspace-button-quiet" onClick={() => setIsDrawingPath(false)}>Hủy</button></div>}
        <div className="story-canvas-stage-wrap"><StoryPageRenderer story={composedStory} page={composedPage} assets={assets} selectedSlotId={selectedSlotId} onSlotSelect={selectSlot} onSlotPositionStart={(slotId) => beginCanvasTransform(slotId)} onSlotPositionEnd={(slotId) => endUndoGroup(activeTool === "motion" ? `page:${selectedPage.id}:transform-keyframe` : `slot:${slotId}:transform`)} onSlotTransformChange={activeTool !== "motion" || recordingKeyframes ? changeCanvasTransform : undefined} isPlaying={isPlaying} playToken={playToken} playheadMs={playheadMs} isDrawingPath={isDrawingPath} pathStartPoint={selectedSlotPosition ? { x: selectedSlotPosition.x, y: selectedSlotPosition.y } : undefined} onPathCommit={commitPath} onPathCancel={() => setIsDrawingPath(false)} onPathPointChange={activeTool === "motion" ? updatePathPoint : undefined} onPathPointStart={(clipId, index) => beginUndoGroup(`page:${selectedPage.id}:path:${clipId}:point:${index}`)} onPathPointEnd={(clipId, index) => endUndoGroup(`page:${selectedPage.id}:path:${clipId}:point:${index}`)} onPathPointSelect={(index) => setSelectedPathPoint({ clipId: selectedClipId, index })} selectedPathPointIndex={selectedPathPointIndex} selectedAnimationClipId={selectedClipId} /></div>
          {!story.roles.length && <div className="story-composer-first-character"><span>Để thêm nhân vật, hãy tạo bộ nhân vật trong Vai nhân vật trước.</span><Link className="workspace-text-link" to={`/content/stories/${storyId}/roles`}>Tạo nhân vật <UserPlus size={15} aria-hidden="true" /></Link></div>}
          <div className="story-filmstrip" aria-label="Chọn trang truyện">{story.pages.map((page, index) => <button type="button" key={page.id} className={selectedPage.id === page.id ? "active" : ""} aria-current={selectedPage.id === page.id ? "page" : undefined} onClick={() => selectPage(page)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{pageDrafts[page.id]?.title || page.title || "Trang chưa đặt tên"}</strong></button>)}<button type="button" className="story-filmstrip-add" onClick={addPage} disabled={mutation.isPending}><Plus size={17} aria-hidden="true" /> Thêm trang</button></div>
        </> : <div className="editor-empty"><p>Thêm trang đầu tiên để bắt đầu dựng truyện.</p><button className="workspace-button" type="button" onClick={addPage}><Plus size={16} aria-hidden="true" /> Tạo trang đầu tiên</button></div>}
      </div>
      <StoryAnimationEditor {...animationEditorProps} showPanel={false} />
    </div>
  </section>;
}
