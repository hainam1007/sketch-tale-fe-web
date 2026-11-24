import { useMemo, useRef, useState } from "react";
import { BezierCurve, Clock, Minus, Pause, Play, Plus, Trash } from "@phosphor-icons/react";
import DismissButton from "../../../components/feedback/DismissButton";
import { clipsConflict, createId } from "../utils/storyAnimation";
import { ANIMATION_PRESETS } from "../utils/storyAnimationPresets";
import { compactAudioFilename } from "../utils/storyAudio";

const presetOptions = ANIMATION_PRESETS.map(({ id, label, description, glyph }) => [id, label, description, glyph]);
function seconds(value) { return (Number(value || 0) / 1000).toFixed(2); }

function TimelineClip({ clip, width, onSelect, onMove, onResize, selected }) {
  const dragRef = useRef(null);
  const [delta, setDelta] = useState(0);
  const [edge, setEdge] = useState("");
  const baseLeft = Number(clip.startMs || 0) / 1000 * width;
  const baseWidth = Math.max(24, Number(clip.durationMs || 900) / 1000 * width);
  return <button
    className={`story-timeline-clip ${clip.mediaType || ""}${selected ? " is-selected" : ""}${clip.kind === "path" ? " is-path" : ""}`}
    type="button"
    style={{ left: `${Math.max(0, baseLeft + (edge === "start" ? delta : 0))}px`, width: `${Math.max(24, baseWidth + (edge === "start" ? -delta : edge === "end" ? delta : 0))}px`, transform: edge ? undefined : `translateX(${delta}px)` }}
    title={`${clip.name || (clip.kind === "path" ? "Đường đi" : clip.kind === "keyframes" ? "Chuyển động" : presetOptions.find(([key]) => key === clip.preset)?.[1] || "Hiệu ứng")} · ${seconds(clip.startMs)}–${seconds(Number(clip.startMs || 0) + Number(clip.durationMs || 900))} giây`}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const handle = event.target.closest("[data-resize-edge]");
      dragRef.current = { pointerId: event.pointerId, x: event.clientX, original: Number(clip.startMs || 0), duration: Number(clip.durationMs || 900), edge: handle?.dataset.resizeEdge || "move" };
      setEdge(dragRef.current.edge === "move" ? "" : dragRef.current.edge);
      onSelect(clip.id);
    }}
    onPointerMove={(event) => {
      if (dragRef.current?.pointerId === event.pointerId) setDelta(event.clientX - dragRef.current.x);
    }}
    onPointerUp={(event) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      const pointerDelta = event.clientX - dragRef.current.x;
      const step = Math.round(pointerDelta / width * 1000 / 100) * 100;
      const drag = dragRef.current;
      dragRef.current = null;
      setDelta(0);
      setEdge("");
      if (drag.edge === "start") {
        const nextStart = Math.max(0, Math.min(drag.original + drag.duration - 100, drag.original + step));
        onResize(clip.id, { startMs: nextStart, durationMs: drag.original + drag.duration - nextStart });
      } else if (drag.edge === "end") onResize(clip.id, { durationMs: Math.max(100, drag.duration + step) });
      else onMove(clip.id, Math.max(0, drag.original + step));
    }}
    onKeyDown={(event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const amount = (event.shiftKey ? 1000 : 100) * (event.key === "ArrowLeft" ? -1 : 1);
      onMove(clip.id, Math.max(0, Math.round((Number(clip.startMs || 0) + amount) / 100) * 100));
    }}
    onPointerCancel={() => { dragRef.current = null; setDelta(0); setEdge(""); }}
    onClick={() => onSelect(clip.id)}
  ><span>{clip.name || (clip.kind === "path" ? "Đường đi" : clip.kind === "keyframes" ? "Chuyển động" : presetOptions.find(([key]) => key === clip.preset)?.[1] || "Hiệu ứng")}</span><i className="story-timeline-resize-handle is-start" data-resize-edge="start" aria-hidden="true" /><i className="story-timeline-resize-handle is-end" data-resize-edge="end" aria-hidden="true" /></button>;
}

export default function StoryAnimationEditor({ page, slots, assets, audioDurations, clips, onChange, onAudioChange, selectedMedia, onMediaSelect, onSubtitleChange, selectedSlotId, onSlotSelect, playheadMs, onPlayheadChange, isPlaying, onTogglePlayback, selectedClipId, onClipSelect, onPathStart, selectedPathPointIndex = -1, onPathPointChange, onPathPointAdd, pageDurationMs, showPanel = true, showTimeline = true, tab = "effects", onTabChange, animationError = "", onAnimationErrorChange }) {
  const [zoom, setZoom] = useState(100);
  const [effectSearch, setEffectSearch] = useState("");
  const normalizeSearch = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const visiblePresets = presetOptions.filter(([, label, description]) => normalizeSearch(`${label} ${description}`).includes(normalizeSearch(effectSearch.trim())));
  const timelineRef = useRef(null);
  const target = slots.find(({ slot }) => slot.id === selectedSlotId);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId);
  const durationMs = Math.max(pageDurationMs || 3000, ...clips.map((clip) => Number(clip.startMs || 0) + Number(clip.durationMs || 0)), 3000);
  const width = zoom;
  const selectedPathPoint = selectedClip?.kind === "path" && selectedPathPointIndex >= 0 ? selectedClip.points?.[selectedPathPointIndex] : null;
  const activeTab = tab === "path" ? "path" : "effects";
  const audioById = useMemo(() => new Map((assets || []).map((asset) => [asset.id, asset])), [assets]);

  function addPreset(preset) {
    if (!target) return onAnimationErrorChange("Hãy chọn nhân vật trên canvas hoặc trong track trước.");
    const candidate = { id: createId("clip"), targetId: target.slot.id, kind: "preset", preset, startMs: playheadMs, durationMs: 900, easing: "ease-in-out", params: { distance: 12 } };
    if (clipsConflict(clips, candidate)) return onAnimationErrorChange("Hiệu ứng này trùng thuộc tính với một clip khác. Hãy chỉnh lại thời điểm hoặc thông số của hiệu ứng khác.");
    onAnimationErrorChange(""); onChange([...clips, candidate]); onClipSelect(candidate.id);
  }

  function moveClip(id, startMs) {
    const clip = clips.find((item) => item.id === id);
    if (!clip) return;
    const next = { ...clip, startMs };
    if (clipsConflict(clips, next, id)) return onAnimationErrorChange("Không thể đặt clip chồng lên một clip đang điều khiển cùng thuộc tính.");
    onAnimationErrorChange(""); onChange(clips.map((item) => item.id === id ? next : item));
  }

  function updateClip(id, patch) {
    const clip = clips.find((item) => item.id === id);
    if (!clip) return;
    const next = { ...clip, ...patch };
    if (clipsConflict(clips, next, id)) return onAnimationErrorChange("Thay đổi này làm clip trùng thuộc tính với một chuyển động khác.");
    onAnimationErrorChange(""); onChange(clips.map((item) => item.id === id ? next : item));
  }

  function deleteSelectedClip() {
    if (!selectedClip) return;
    onChange(clips.filter((clip) => clip.id !== selectedClip.id));
    onClipSelect("");
    onAnimationErrorChange("");
  }

  function seekFromPointer(event) {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(width * durationMs / 1000, event.clientX - rect.left + timelineRef.current.scrollLeft - 184));
    onPlayheadChange(Math.min(durationMs, Math.round((x / width * 1000) / 100) * 100));
  }

  return <>
    {showPanel && <div className="story-animation-panel">
      <div className="story-animation-panel-heading"><div><h3>{target?.role.name || "Chọn nhân vật"}</h3></div><span className="story-animation-time"><Clock size={15} aria-hidden="true" /> {seconds(playheadMs)} s</span></div>
      {selectedClip && <button type="button" className="workspace-button workspace-button-danger story-animation-delete-button" aria-label="Xóa chuyển động đã chọn" title="Xóa chuyển động đã chọn" onClick={deleteSelectedClip}><Trash size={16} aria-hidden="true" /> Xóa chuyển động</button>}
      <div className="story-animation-tabs" role="tablist" aria-label="Công cụ chuyển động">
        {[ ["effects", "Hiệu ứng"], ["path", "Đường đi"] ].map(([id, label]) => <button key={id} id={`story-animation-tab-${id}`} role="tab" aria-selected={activeTab === id} aria-controls="story-animation-tabpanel" type="button" onClick={() => onTabChange(id)}>{label}</button>)}
      </div>
      <div className="story-animation-tabpanel" id="story-animation-tabpanel" role="tabpanel" aria-labelledby={`story-animation-tab-${activeTab}`}>
        {activeTab === "effects" && <>
          <input className="story-effect-search" type="search" aria-label="Tìm hiệu ứng" value={effectSearch} onChange={(event) => setEffectSearch(event.target.value)} placeholder="Tìm hiệu ứng…" />

          <div className="story-preset-grid">{visiblePresets.map(([id, label, description, glyph]) => <button type="button" key={id} onClick={() => addPreset(id)} disabled={!target} aria-label={`Thêm hiệu ứng ${label}`}><span className={`story-preset-glyph preset-${id}`} aria-hidden="true">{glyph}</span><strong>{label}</strong></button>)}</div>
          {!visiblePresets.length && <p className="editor-help" role="status">Không tìm thấy hiệu ứng. Thử từ khóa khác.</p>}
          {selectedClip?.kind === "preset" && <div className="story-animation-fields"><label>Thời điểm (giây)<input type="number" min="0" step="0.1" value={seconds(selectedClip.startMs)} onChange={(event) => moveClip(selectedClip.id, Math.max(0, Number(event.target.value) * 1000 || 0))} /></label><label>Thời lượng (giây)<input type="number" min="0.1" step="0.1" value={seconds(selectedClip.durationMs)} onChange={(event) => updateClip(selectedClip.id, { durationMs: Math.max(100, Number(event.target.value) * 1000 || 100) })} /></label><label>Nhân vật<select value={selectedClip.targetId} onChange={(event) => updateClip(selectedClip.id, { targetId: event.target.value })}>{slots.map(({ role, slot }) => <option value={slot.id} key={slot.id}>{role.name}</option>)}</select></label><label>Chuyển động<select value={selectedClip.easing || "ease-in-out"} onChange={(event) => updateClip(selectedClip.id, { easing: event.target.value })}><option value="linear">Đều</option><option value="ease-in">Nhanh dần</option><option value="ease-out">Chậm dần</option><option value="ease-in-out">Nhanh rồi chậm</option></select></label></div>}
        </>}
        {activeTab === "path" && <>
          <button type="button" className="workspace-button story-draw-path-button" disabled={!target} onClick={onPathStart}><BezierCurve size={17} aria-hidden="true" /> Vẽ đường trên canvas</button>
          {selectedClip?.kind === "path" && <div className="story-animation-fields"><label>Thời điểm (giây)<input type="number" min="0" step="0.1" value={seconds(selectedClip.startMs)} onChange={(event) => moveClip(selectedClip.id, Math.max(0, Number(event.target.value) * 1000 || 0))} /></label><label>Thời lượng (giây)<input type="number" min="0.1" step="0.1" value={seconds(selectedClip.durationMs)} onChange={(event) => updateClip(selectedClip.id, { durationMs: Math.max(100, Number(event.target.value) * 1000 || 100) })} /></label><label>Chuyển động<select value={selectedClip.easing || "ease-in-out"} onChange={(event) => updateClip(selectedClip.id, { easing: event.target.value })}><option value="linear">Đều</option><option value="ease-in">Nhanh dần</option><option value="ease-out">Chậm dần</option><option value="ease-in-out">Nhanh rồi chậm</option></select></label>{selectedPathPoint && <div className="story-path-point-fields"><strong>Điểm {selectedPathPointIndex + 1}</strong><label>X (%)<input type="number" min="0" max="100" step="0.1" value={Number(selectedPathPoint.x).toFixed(1)} onChange={(event) => onPathPointChange?.(selectedClip.id, selectedPathPointIndex, { x: event.target.value })} /></label><label>Y (%)<input type="number" min="0" max="100" step="0.1" value={Number(selectedPathPoint.y).toFixed(1)} onChange={(event) => onPathPointChange?.(selectedClip.id, selectedPathPointIndex, { y: event.target.value })} /></label></div>}<button type="button" className="workspace-button workspace-button-quiet" disabled={selectedClip.points.length >= 160} onClick={() => onPathPointAdd?.(selectedClip.id)}><Plus size={15} aria-hidden="true" /> Thêm điểm trên đường</button><button type="button" className="workspace-button workspace-button-quiet" onClick={() => updateClip(selectedClip.id, { points: [...selectedClip.points].reverse() })}>Đảo chiều đường đi</button></div>}
        </>}
        {animationError && <p className="story-animation-error" role="alert"><span>{animationError}</span><DismissButton onClick={() => onAnimationErrorChange?.("")} /></p>}
      </div>
    </div>}
    {showTimeline && <div id="story-timeline" className="story-timeline">
      <div className="story-timeline-transport"><div className="story-timeline-heading"><strong>Dòng thời gian</strong><span className="story-timecode">{seconds(playheadMs)} / {seconds(durationMs)} s</span></div><div className="story-timeline-actions"><button type="button" className="icon-button" aria-label={isPlaying ? "Tạm dừng" : "Phát thử"} onClick={onTogglePlayback}>{isPlaying ? <Pause size={17} /> : <Play size={17} />}</button><button type="button" className="icon-button" aria-label="Thu nhỏ timeline" onClick={() => setZoom((value) => Math.max(40, value - 20))}><Minus size={16} /></button><span>{zoom}%</span><button type="button" className="icon-button" aria-label="Phóng to timeline" onClick={() => setZoom((value) => Math.min(200, value + 20))}><Plus size={16} /></button></div></div>
      <div className="story-timeline-scroll" ref={timelineRef}>
        <div className="story-timeline-content" style={{ width: `${184 + durationMs / 1000 * width}px`, minWidth: "100%", "--timeline-second": `${width}px` }}>
          <div className="story-timeline-ruler" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); seekFromPointer(event); }} onPointerMove={(event) => { if (event.buttons) seekFromPointer(event); }}>
            {Array.from({ length: Math.floor(durationMs / 1000) + 1 }, (_, second) => <span key={second} style={{ left: `${184 + second * width}px` }}>{second.toFixed(0)} s</span>)}
          </div>
          {slots.map(({ role, slot }) => {
            const slotClips = clips.filter((clip) => clip.targetId === slot.id);
            return <div className={`story-timeline-track${slot.id === selectedSlotId ? " is-active" : ""}`} key={slot.id}>
              <button className="story-timeline-track-label" type="button" onClick={() => onSlotSelect(slot.id)}>{role.name}<small>{slotClips.length} chuyển động</small></button>
              <div className="story-timeline-lane" onPointerDown={(event) => { if (event.target === event.currentTarget) seekFromPointer(event); }}>
                {slotClips.map((clip) => <TimelineClip key={clip.id} clip={clip} width={width} selected={clip.id === selectedClipId} onSelect={(id) => { onClipSelect(id); onSlotSelect(clip.targetId); onTabChange(clip.kind === "path" ? "path" : "effects"); }} onMove={moveClip} onResize={updateClip} />)}
              </div>
            </div>;
          })}
          {(page.audioTracks || []).map((track) => {
            const asset = audioById.get(track.assetId);
            const audioName = asset?.name || track.name || "Âm thanh";
            const sourceLength = Number(asset?.duration) * 1000 || Number(audioDurations?.[track.id]) || Number(track.durationMs) || 3000;
            const length = Number(track.durationMs) > 0 ? Number(track.durationMs) : sourceLength;
            return <div className="story-timeline-track story-timeline-audio-track" key={track.id}>
              <span className="story-timeline-track-label"><span className="story-timeline-audio-name" title={audioName}>{compactAudioFilename(audioName)}</span><small>Âm thanh</small></span>
              <div className="story-timeline-lane"><TimelineClip
                clip={{ ...track, durationMs: length, name: audioName, mediaType: "is-audio" }}
                width={width}
                selected={selectedMedia?.id === track.id}
                onSelect={(id) => onMediaSelect("audioTracks", id)}
                onMove={(id, startMs) => onAudioChange(id, { startMs })}
                onResize={(id, patch) => {
                  const next = {};
                  if (patch.startMs !== undefined) next.startMs = patch.startMs;
                  if (patch.durationMs !== undefined) next.durationMs = Math.min(sourceLength, patch.durationMs);
                  onAudioChange(id, next);
                }}
              /></div>
            </div>;
          })}
          {(page.subtitles || []).map((cue, index) => <div className="story-timeline-track" key={cue.id}><button type="button" className="story-timeline-track-label" onClick={() => onMediaSelect("subtitles", cue.id)}>T · Phụ đề {index + 1}<small>{seconds(cue.startMs)}–{seconds(cue.startMs + cue.durationMs)} s</small></button><div className="story-timeline-lane"><TimelineClip clip={{ ...cue, name: cue.text || "Phụ đề", mediaType: "is-subtitle" }} width={width} selected={selectedMedia?.id === cue.id} onSelect={(id) => onMediaSelect("subtitles", id)} onMove={(id, startMs) => onSubtitleChange(id, { startMs })} onResize={onSubtitleChange} /></div></div>)}
          <div className="story-timeline-playhead" style={{ left: `${184 + playheadMs / 1000 * width}px` }} aria-hidden="true" />
        </div>
      </div>
      {!slots.length && !(page.audioTracks || []).length && !(page.subtitles || []).length && <p className="story-timeline-empty">Thêm nhân vật vào trang để tạo track chuyển động.</p>}
    </div>}
  </>;
}
