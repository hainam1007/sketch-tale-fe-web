import { useMemo, useRef, useState } from "react";
import { BezierCurve, Clock, Diamond, Minus, Pause, Play, Plus, Trash } from "@phosphor-icons/react";
import { evaluateSlotAnimation, clipsConflict, createId } from "../utils/storyAnimation";
import { compactAudioFilename } from "../utils/storyAudio";

const presetOptions = [["appear", "Xuất hiện", "Mờ dần và phóng nhẹ"], ["move", "Di chuyển", "Lướt ngang qua cảnh"], ["jump", "Nhảy", "Bật lên rồi hạ xuống"], ["spin", "Xoay", "Quay một vòng"], ["walk", "Nhún bước", "Chuyển động tại chỗ"]];
const propertyLabels = { x: "Vị trí ngang", y: "Vị trí dọc", scale: "Kích thước", rotation: "Góc xoay", opacity: "Độ trong suốt" };
const propertyUnits = { x: "%", y: "%", scale: "×", rotation: "°", opacity: "%" };

function seconds(value) { return (Number(value || 0) / 1000).toFixed(2); }

function TimelineClip({ clip, width, onSelect, onMove, onResize, selected }) {
  const dragRef = useRef(null);
  const [delta, setDelta] = useState(0);
  const [edge, setEdge] = useState("");
  const baseLeft = Number(clip.startMs || 0) / 1000 * width;
  const baseWidth = Math.max(24, Number(clip.durationMs || 900) / 1000 * width);
  return <button
    className={`story-timeline-clip ${clip.mediaType || ""}${selected ? " is-selected" : ""}${clip.kind === "path" ? " is-path" : clip.kind === "keyframes" ? " is-keyframes" : ""}`}
    type="button"
    style={{ left: `${Math.max(0, baseLeft + (edge === "start" ? delta : 0))}px`, width: `${Math.max(24, baseWidth + (edge === "start" ? -delta : edge === "end" ? delta : 0))}px`, transform: edge ? undefined : `translateX(${delta}px)` }}
    title={`${clip.name || (clip.kind === "path" ? "Đường đi" : clip.kind === "keyframes" ? "Keyframe" : presetOptions.find(([key]) => key === clip.preset)?.[1] || "Hiệu ứng")} · ${seconds(clip.startMs)}–${seconds(Number(clip.startMs || 0) + Number(clip.durationMs || 900))} giây`}
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
  ><span>{clip.name || (clip.kind === "path" ? "Đường đi" : clip.kind === "keyframes" ? "Mốc chuyển động" : presetOptions.find(([key]) => key === clip.preset)?.[1] || "Hiệu ứng")}</span><i className="story-timeline-resize-handle is-start" data-resize-edge="start" aria-hidden="true" /><i className="story-timeline-resize-handle is-end" data-resize-edge="end" aria-hidden="true" /></button>;
}

export default function StoryAnimationEditor({ page, slots, imageObjects = [], assets, audioDurations, clips, onChange, onAudioChange, selectedMedia, onMediaSelect, onSubtitleChange, selectedSlotId, onSlotSelect, playheadMs, onPlayheadChange, isPlaying, onTogglePlayback, selectedClipId, onClipSelect, onPathStart, selectedPathPointIndex = -1, onPathPointChange, onPathPointAdd, pageDurationMs, showPanel = true, showTimeline = true, recording = false, onRecordingChange, property = "x", onPropertyChange, tab = "effects", onTabChange, animationError = "", onAnimationErrorChange }) {
  const [zoom, setZoom] = useState(100);
  const timelineRef = useRef(null);
  const target = slots.find(({ slot }) => slot.id === selectedSlotId);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId);
  const durationMs = Math.max(pageDurationMs || 3000, ...clips.map((clip) => Number(clip.startMs || 0) + Number(clip.durationMs || 0)), 3000);
  const width = zoom;
  const selectedKeyframe = selectedClip?.kind === "keyframes" ? [...(selectedClip.keyframes || [])].sort((a, b) => Number(a.timeMs) - Number(b.timeMs)).find((frame) => Math.abs(Number(frame.timeMs) + Number(selectedClip.startMs || 0) - playheadMs) < 80) : null;
  const selectedPathPoint = selectedClip?.kind === "path" && selectedPathPointIndex >= 0 ? selectedClip.points?.[selectedPathPointIndex] : null;
  const currentValue = target ? evaluateSlotAnimation(target.slot, clips, playheadMs)[property] : 0;
  const audioById = useMemo(() => new Map((assets || []).map((asset) => [asset.id, asset])), [assets]);

  function addPreset(preset) {
    if (!target) return onAnimationErrorChange("Hãy chọn nhân vật trên canvas hoặc trong track trước.");
    const candidate = { id: createId("clip"), targetId: target.slot.id, kind: "preset", preset, startMs: playheadMs, durationMs: 900, easing: "ease-in-out", params: { distance: 12 } };
    if (clipsConflict(clips, candidate)) return onAnimationErrorChange("Hiệu ứng này trùng thuộc tính với một clip khác. Hãy chỉnh lại thời điểm hoặc thông số của hiệu ứng khác.");
    onAnimationErrorChange(""); onChange([...clips, candidate]); onClipSelect(candidate.id);
  }

  function setKeyframe() {
    if (!target) return onAnimationErrorChange("Hãy chọn nhân vật trước khi tạo keyframe.");
    let clip = clips.find((item) => item.kind === "keyframes" && item.targetId === target.slot.id);
    const frameTime = Math.max(0, playheadMs - Number(clip?.startMs || 0));
    if (!clip) clip = { id: createId("keyframes"), targetId: target.slot.id, kind: "keyframes", startMs: 0, durationMs: Math.max(3000, pageDurationMs || 0), keyframes: [] };
    const value = evaluateSlotAnimation(target.slot, clips, playheadMs)[property];
    const nextFrame = { id: createId("frame"), timeMs: frameTime, [property]: Number(value) };
    const existing = (clip.keyframes || []).find((frame) => Math.abs(Number(frame.timeMs) - frameTime) < 60);
    const nextFrames = existing
      ? clip.keyframes.map((frame) => frame.id === existing.id ? { ...frame, [property]: nextFrame[property] } : frame)
      : [...(clip.keyframes || []), nextFrame];
    const nextClip = { ...clip, durationMs: Math.max(Number(clip.durationMs || 0), frameTime + 100), keyframes: nextFrames };
    const nextClips = clips.some((item) => item.id === clip.id) ? clips.map((item) => item.id === clip.id ? nextClip : item) : [...clips, nextClip];
    if (clipsConflict(clips, nextClip, clip.id)) return onAnimationErrorChange("Thuộc tính này đang được clip khác điều khiển trong cùng khoảng thời gian.");
    onAnimationErrorChange(""); onChange(nextClips); onClipSelect(clip.id);
  }

  function updateSelectedFrame(value) {
    if (!selectedClip || !selectedKeyframe || !Number.isFinite(Number(value))) return;
    const normalized = property === "opacity" ? Math.max(0, Math.min(100, Number(value))) / 100 : Number(value);
    onChange(clips.map((clip) => clip.id !== selectedClip.id ? clip : { ...clip, keyframes: clip.keyframes.map((frame) => frame.id === selectedKeyframe.id ? { ...frame, [property]: normalized } : frame) }));
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
      <div className="story-animation-panel-heading"><div><span className="workspace-eyebrow">CHUYỂN ĐỘNG</span><h3>{target?.role.name || "Chọn nhân vật"}</h3></div><span className="story-animation-time"><Clock size={15} aria-hidden="true" /> {seconds(playheadMs)} s</span></div>
      {selectedClip && <button type="button" className="workspace-button workspace-button-danger story-animation-delete-button" aria-label="Xóa chuyển động đã chọn" title="Xóa chuyển động đã chọn" onClick={deleteSelectedClip}><Trash size={16} aria-hidden="true" /> Xóa chuyển động</button>}
      <div className="story-animation-tabs" role="tablist" aria-label="Công cụ chuyển động">
        {[ ["effects", "Hiệu ứng"], ["keyframes", "Keyframe"], ["path", "Đường đi"] ].map(([id, label]) => <button key={id} id={`story-animation-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="story-animation-tabpanel" type="button" onClick={() => onTabChange(id)}>{label}</button>)}
      </div>
      <div className="story-animation-tabpanel" id="story-animation-tabpanel" role="tabpanel" aria-labelledby={`story-animation-tab-${tab}`}>
        {tab === "effects" && <>
          <div className="story-preset-grid">{presetOptions.map(([id, label]) => <button type="button" key={id} onClick={() => addPreset(id)} disabled={!target} aria-label={`Thêm hiệu ứng ${label}`}><span className={`story-preset-glyph preset-${id}`} aria-hidden="true">✦</span><strong>{label}</strong></button>)}</div>
          {selectedClip?.kind === "preset" && <div className="story-animation-fields"><label>Thời điểm (giây)<input type="number" min="0" step="0.1" value={seconds(selectedClip.startMs)} onChange={(event) => moveClip(selectedClip.id, Math.max(0, Number(event.target.value) * 1000 || 0))} /></label><label>Thời lượng (giây)<input type="number" min="0.1" step="0.1" value={seconds(selectedClip.durationMs)} onChange={(event) => updateClip(selectedClip.id, { durationMs: Math.max(100, Number(event.target.value) * 1000 || 100) })} /></label><label>Nhân vật<select value={selectedClip.targetId} onChange={(event) => updateClip(selectedClip.id, { targetId: event.target.value })}>{slots.map(({ role, slot }) => <option value={slot.id} key={slot.id}>{role.name}</option>)}</select></label><label>Chuyển động<select value={selectedClip.easing || "ease-in-out"} onChange={(event) => updateClip(selectedClip.id, { easing: event.target.value })}><option value="linear">Đều</option><option value="ease-in">Nhanh dần</option><option value="ease-out">Chậm dần</option><option value="ease-in-out">Nhanh rồi chậm</option></select></label></div>}
        </>}
        {tab === "keyframes" && <>
          <label className="story-record-toggle"><input type="checkbox" checked={recording} onChange={(event) => onRecordingChange(event.target.checked)} /> Ghi keyframe</label>
          <label className="story-animation-field">Thuộc tính<select value={property} onChange={(event) => onPropertyChange(event.target.value)}>{Object.entries(propertyLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <div className="story-keyframe-value"><label>{propertyLabels[property]} ({propertyUnits[property]})<input type="number" step={property === "rotation" ? 1 : 0.1} min={property === "opacity" ? 0 : property === "scale" ? 0.1 : ["x", "y"].includes(property) ? 0 : -3600} max={property === "opacity" ? 100 : property === "scale" ? 5 : ["x", "y"].includes(property) ? 100 : 3600} value={Number(property === "opacity" ? (selectedKeyframe?.[property] ?? currentValue) * 100 : (selectedKeyframe?.[property] ?? currentValue)).toFixed(1)} disabled={!target || !recording || !selectedKeyframe} onChange={(event) => updateSelectedFrame(event.target.value)} /></label><div className="story-keyframe-actions"><button type="button" className="workspace-button" disabled={!target || !recording} onClick={setKeyframe}><Diamond size={16} aria-hidden="true" /> Đặt mốc tại {seconds(playheadMs)} s</button> </div></div>
          {selectedKeyframe && <label className="story-animation-field">Chuyển động giữa mốc này và mốc sau<select value={selectedKeyframe.easing || "linear"} onChange={(event) => onChange(clips.map((clip) => clip.id !== selectedClip.id ? clip : { ...clip, keyframes: clip.keyframes.map((frame) => frame.id === selectedKeyframe.id ? { ...frame, easing: event.target.value } : frame) }))}><option value="linear">Đều</option><option value="ease-in">Nhanh dần</option><option value="ease-out">Chậm dần</option><option value="ease-in-out">Nhanh rồi chậm</option></select></label>}
        </>}
        {tab === "path" && <>
          <button type="button" className="workspace-button story-draw-path-button" disabled={!target} onClick={onPathStart}><BezierCurve size={17} aria-hidden="true" /> Vẽ đường trên canvas</button>
          {selectedClip?.kind === "path" && <div className="story-animation-fields"><label>Thời điểm (giây)<input type="number" min="0" step="0.1" value={seconds(selectedClip.startMs)} onChange={(event) => moveClip(selectedClip.id, Math.max(0, Number(event.target.value) * 1000 || 0))} /></label><label>Thời lượng (giây)<input type="number" min="0.1" step="0.1" value={seconds(selectedClip.durationMs)} onChange={(event) => updateClip(selectedClip.id, { durationMs: Math.max(100, Number(event.target.value) * 1000 || 100) })} /></label><label>Chuyển động<select value={selectedClip.easing || "ease-in-out"} onChange={(event) => updateClip(selectedClip.id, { easing: event.target.value })}><option value="linear">Đều</option><option value="ease-in">Nhanh dần</option><option value="ease-out">Chậm dần</option><option value="ease-in-out">Nhanh rồi chậm</option></select></label>{selectedPathPoint && <div className="story-path-point-fields"><strong>Điểm {selectedPathPointIndex + 1}</strong><label>X (%)<input type="number" min="0" max="100" step="0.1" value={Number(selectedPathPoint.x).toFixed(1)} onChange={(event) => onPathPointChange?.(selectedClip.id, selectedPathPointIndex, { x: event.target.value })} /></label><label>Y (%)<input type="number" min="0" max="100" step="0.1" value={Number(selectedPathPoint.y).toFixed(1)} onChange={(event) => onPathPointChange?.(selectedClip.id, selectedPathPointIndex, { y: event.target.value })} /></label></div>}<button type="button" className="workspace-button workspace-button-quiet" disabled={selectedClip.points.length >= 160} onClick={() => onPathPointAdd?.(selectedClip.id)}><Plus size={15} aria-hidden="true" /> Thêm điểm trên đường</button><button type="button" className="workspace-button workspace-button-quiet" onClick={() => updateClip(selectedClip.id, { points: [...selectedClip.points].reverse() })}>Đảo chiều đường đi</button></div>}
        </>}
        {animationError && <p className="story-animation-error" role="alert">{animationError}</p>}
      </div>
    </div>}
    {showTimeline && <div className="story-timeline">
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
                {slotClips.map((clip) => <TimelineClip key={clip.id} clip={clip} width={width} selected={clip.id === selectedClipId} onSelect={(id) => { onClipSelect(id); onSlotSelect(clip.targetId); onTabChange(clip.kind === "path" ? "path" : clip.kind === "keyframes" ? "keyframes" : "effects"); }} onMove={moveClip} onResize={updateClip} />)}
                {slotClips.filter((clip) => clip.kind === "keyframes").flatMap((clip) => (clip.keyframes || []).map((frame) => <button key={frame.id} className="story-timeline-keyframe" type="button" aria-label={`Keyframe của ${role.name} tại ${seconds(Number(clip.startMs || 0) + Number(frame.timeMs))} giây`} style={{ left: `${(Number(clip.startMs || 0) + Number(frame.timeMs)) / 1000 * width}px` }} onClick={() => { onClipSelect(clip.id); onSlotSelect(clip.targetId); onPlayheadChange(Number(clip.startMs || 0) + Number(frame.timeMs)); onTabChange("keyframes"); }} />))}
              </div>
            </div>;
          })}
          {imageObjects.map((item) => <div className={`story-timeline-track${selectedSlotId === item.id ? " is-active" : ""}`} key={item.id}><button type="button" className="story-timeline-track-label" onClick={() => onSlotSelect(item.id)}>{item.name}<small>Ảnh phụ</small></button><div className="story-timeline-lane"><button type="button" className="story-timeline-clip is-image" style={{ left: 0, width: `${durationMs / 1000 * width}px` }} onClick={() => onSlotSelect(item.id)}>{item.name}</button></div></div>)}
          {(page.audioTracks || []).map((track) => { const asset = audioById.get(track.assetId); const audioName = asset?.name || track.name || "Âm thanh"; const fullLength = Number(track.durationMs) || Number(asset?.duration) * 1000 || Number(audioDurations?.[track.id]) || 3000; const length = Number(track.durationMs) > 0 ? Number(track.durationMs) : Math.max(100, fullLength - Number(track.trimStartMs || 0)); return <div className="story-timeline-track story-timeline-audio-track" key={track.id}><span className="story-timeline-track-label"><span className="story-timeline-audio-name" title={audioName}>{compactAudioFilename(audioName)}</span><small>{track.type === "music" ? "Nhạc nền" : track.type === "effect" ? "Hiệu ứng" : "Lời kể"}</small></span><div className="story-timeline-lane"><TimelineClip clip={{ ...track, durationMs: length, name: audioName, mediaType: "is-audio" }} width={width} selected={selectedMedia?.id === track.id} onSelect={(id) => onMediaSelect("audioTracks", id)} onMove={(id, startMs) => onAudioChange(id, { startMs })} onResize={(id, patch) => {
                  const trim = Number(track.trimStartMs || 0);
                  const source = Number(asset?.duration) * 1000 || Number(audioDurations?.[track.id]) || trim + length;
                  if (patch.startMs !== undefined) {
                    const delta = Math.max(-trim, Math.min(length - 100, patch.startMs - Number(track.startMs || 0)));
                    onAudioChange(id, { startMs: Number(track.startMs || 0) + delta, trimStartMs: trim + delta, durationMs: length - delta });
                  } else onAudioChange(id, { durationMs: Math.min(source - trim, patch.durationMs) });
                }} /></div></div>; })}
          {(page.subtitles || []).map((cue, index) => <div className="story-timeline-track" key={cue.id}><button type="button" className="story-timeline-track-label" onClick={() => onMediaSelect("subtitles", cue.id)}>T · Phụ đề {index + 1}<small>{seconds(cue.startMs)}–{seconds(cue.startMs + cue.durationMs)} s</small></button><div className="story-timeline-lane"><TimelineClip clip={{ ...cue, name: cue.text || "Phụ đề", mediaType: "is-subtitle" }} width={width} selected={selectedMedia?.id === cue.id} onSelect={(id) => onMediaSelect("subtitles", id)} onMove={(id, startMs) => onSubtitleChange(id, { startMs })} onResize={onSubtitleChange} /></div></div>)}
          <div className="story-timeline-playhead" style={{ left: `${184 + playheadMs / 1000 * width}px` }} aria-hidden="true" />
        </div>
      </div>
      {!slots.length && <p className="story-timeline-empty">Thêm nhân vật vào trang để tạo track chuyển động.</p>}
    </div>}
  </>;
}
