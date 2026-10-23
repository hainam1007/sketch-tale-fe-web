import { subtitleAt } from "../utils/storySubtitles";
import { useEffect, useRef, useState } from "react";
import { evaluateSlotAnimation, pageAnimationClips } from "../utils/storyAnimation";

/**
 * Render one page using every role/slot attached to that page.
 * Coordinates are percentages of the stage and layer is the z-order.
 * Missing assets stay visible as an error state; a fallback image would hide
 * a contract problem that must be fixed before publish.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBackgroundOverflow(imageWidth, imageHeight, stageWidth, stageHeight, scale) {
  if (!imageWidth || !imageHeight || !stageWidth || !stageHeight) return { x: 0, y: 0 };
  const coverScale = Math.max(stageWidth / imageWidth, stageHeight / imageHeight);
  return {
    x: Math.max(0, (imageWidth * coverScale * scale - stageWidth) / 2),
    y: Math.max(0, (imageHeight * coverScale * scale - stageHeight) / 2),
  };
}

export default function StoryPageRenderer({ story, page, assets, onSlotSelect, onSlotPositionStart, onSlotPositionEnd, onSlotPositionChange, onSlotTransformChange, onBackgroundTransformChange, onBackgroundTransformStart, onBackgroundTransformEnd, selectedSlotId, isPlaying = false, playToken = 0, playheadMs, isDrawingPath = false, pathStartPoint, onPathCommit, onPathCancel, onPathPointChange, onPathPointStart, onPathPointEnd, onPathPointSelect, selectedPathPointIndex, selectedAnimationClipId, showPageText = true }) {
  const stageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const backgroundGestureRef = useRef(null);
  const [drawPoints, setDrawPoints] = useState([]);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [backgroundSize, setBackgroundSize] = useState({ width: 0, height: 0 });
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const drawingPointerRef = useRef(null);
  const canvasGestureRef = useRef(null);
  useEffect(() => { if (!isDrawingPath) setDrawPoints([]); }, [isDrawingPath]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [page?.id]);

  const assetById = new Map((assets || []).map((asset) => [asset.id, asset]));
  const background = assetById.get(page?.backgroundAssetId || story.coverAssetId)
    || (page?.backgroundUrl ? { url: page.backgroundUrl } : null)
    || (story.coverImageUrl ? { url: story.coverImageUrl } : null);
  useEffect(() => {
    setBackgroundSize({ width: Number(background?.width) || 0, height: Number(background?.height) || 0 });
  }, [background?.url, background?.width, background?.height]);
  if (!page) return null;

  const placements = (story.roles || [])
    .flatMap((role) => (role.slots || [])
      .filter((slot) => slot.pageId === page.id)
      .map((slot) => ({ role, slot })))
    .concat((page.imageObjects || []).map((slot) => ({ role: { id: slot.id, name: slot.name || "Ảnh phụ" }, slot })))
    .sort((left, right) => Number(left.slot.layer || 0) - Number(right.slot.layer || 0));
  const clips = pageAnimationClips(page);

  const backgroundScale = clamp(Number(page.backgroundScale) || 1, 1, 3);
  const backgroundOffsetX = clamp(Number(page.backgroundOffsetX) || 0, -100, 100);
  const backgroundOffsetY = clamp(Number(page.backgroundOffsetY) || 0, -100, 100);
  const backgroundImageWidth = backgroundSize.width || Number(background?.width) || 0;
  const backgroundImageHeight = backgroundSize.height || Number(background?.height) || 0;
  const backgroundOverflow = getBackgroundOverflow(backgroundImageWidth, backgroundImageHeight, stageSize.width, stageSize.height, backgroundScale);
  const backgroundTranslateX = stageSize.width ? backgroundOffsetX / 100 * backgroundOverflow.x / stageSize.width * 100 : 0;
  const backgroundTranslateY = stageSize.height ? backgroundOffsetY / 100 * backgroundOverflow.y / stageSize.height * 100 : 0;
  const canTransformBackground = Boolean(background?.url && onBackgroundTransformChange && !isPlaying);

  const beginBackgroundGesture = (event) => {
    if (event.button !== 0 || !canTransformBackground || !stageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = stageRef.current.getBoundingClientRect();
    const imageWidth = backgroundImageRef.current?.naturalWidth || backgroundImageWidth;
    const imageHeight = backgroundImageRef.current?.naturalHeight || backgroundImageHeight;
    const overflow = getBackgroundOverflow(imageWidth, imageHeight, bounds.width, bounds.height, backgroundScale);
    event.currentTarget.setPointerCapture(event.pointerId);
    backgroundGestureRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: backgroundOffsetX,
      startY: backgroundOffsetY,
      maxX: overflow.x,
      maxY: overflow.y,
    };
    setIsDraggingBackground(true);
    onBackgroundTransformStart?.();
  };

  const moveBackgroundGesture = (event) => {
    const gesture = backgroundGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const nextX = gesture.maxX ? clamp(gesture.startX + (event.clientX - gesture.startClientX) / gesture.maxX * 100, -100, 100) : gesture.startX;
    const nextY = gesture.maxY ? clamp(gesture.startY + (event.clientY - gesture.startClientY) / gesture.maxY * 100, -100, 100) : gesture.startY;
    onBackgroundTransformChange?.({ backgroundOffsetX: Math.round(nextX), backgroundOffsetY: Math.round(nextY) });
  };

  const endBackgroundGesture = (event) => {
    if (backgroundGestureRef.current?.pointerId !== event.pointerId) return;
    backgroundGestureRef.current = null;
    setIsDraggingBackground(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onBackgroundTransformEnd?.();
  };

  return (
    <div ref={stageRef} className={`story-preview-stage${isPlaying ? " story-preview-stage-playing" : ""}${onSlotSelect || onSlotPositionChange || onSlotTransformChange ? " story-preview-stage-editable" : ""}${canTransformBackground ? " story-preview-stage-background-editable" : ""}${isDraggingBackground ? " story-preview-stage-background-dragging" : ""}`}>
      {background?.url && <div className="story-preview-background-viewport" role="presentation" onPointerDown={beginBackgroundGesture} onPointerMove={moveBackgroundGesture} onPointerUp={endBackgroundGesture} onPointerCancel={endBackgroundGesture} onLostPointerCapture={endBackgroundGesture}>
        <div className="story-preview-background-pan" style={{ transform: `translate(${backgroundTranslateX}%, ${backgroundTranslateY}%)` }}>
          <img ref={backgroundImageRef} className="story-preview-background-image" src={background.url} alt="" draggable="false" onLoad={(event) => setBackgroundSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} style={{ transform: `scale(${backgroundScale})` }} />
        </div>
      </div>}

      {!background && <div className="story-preview-missing-asset" role="alert">Chưa chọn ảnh nền</div>}
      <div className="story-preview-stage-copy">
        <span>SKETCHTALE{story.category ? ` · ${story.category}` : ""}</span>
        {showPageText && subtitleAt(page, playheadMs || 0) && <p>{subtitleAt(page, playheadMs || 0)}</p>}

      </div>
      {placements.map(({ role, slot }) => {
        const roleAsset = assetById.get(slot.assetId || role.defaultAssetId)
          || (role.defaultAssetUrl ? { url: role.defaultAssetUrl } : null);
        const roleName = (role.name || "").trim().toLocaleLowerCase();
        const localRoleFallback = roleName && (assets || []).find((asset) => asset.source === "mock" && asset.kind === "image" && asset.url && asset.name.toLocaleLowerCase().includes(roleName));
        const fallbackUrl = roleAsset?.fallbackUrl || localRoleFallback?.url;
        const motions = (page.sequence || []).map((item, index) => ({ item, index })).filter(({ item }) => item.slotId === slot.id);
        const motionNames = { appear: "story-appear", move: "story-move", jump: "story-jump", spin: "story-spin", walk: "story-walk" };
        const motionDelay = (index) => (page.sequence || []).slice(0, index).reduce((total, item) => total + Number(item.durationMs || 900), 0);
        const anchor = slot.anchor || "center";
        const translate = anchor === "top-left" ? "translate(0, 0)" : anchor === "top-right" ? "translate(-100%, 0)" : anchor === "bottom-left" ? "translate(0, -100%)" : anchor === "bottom-right" ? "translate(-100%, -100%)" : "translate(-50%, -50%)";
        const animated = Number.isFinite(playheadMs) ? evaluateSlotAnimation(slot, clips, playheadMs) : null;
        const x = animated?.x ?? slot.x;
        const y = animated?.y ?? slot.y;
        const scale = animated?.scale ?? slot.scale ?? 1;
        const transform = translate;
        const visualTransform = slot.flip ? "scaleX(-1)" : undefined;
        const canTransform = Boolean(onSlotTransformChange) && !isDrawingPath;
        const handleKeyboardTransform = (event, mode) => {
          const step = event.shiftKey ? 0.25 : 0.05;
          let patch;
          if (mode === "scale" && ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(event.key)) {
            const direction = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : -1;
            patch = { scale: Math.round(Math.max(0.1, Math.min(5, Number(scale) + direction * step)) * 100) / 100 };
          } else if (mode === "rotate" && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
            const direction = event.key === "ArrowRight" ? 1 : -1;
            patch = { rotation: Math.round(((animated?.rotation ?? slot.rotation ?? 0) + direction * (event.shiftKey ? 15 : 5)) * 2) / 2 };
          }
          if (!patch) return;
          event.preventDefault();
          onSlotPositionStart?.(slot.id);
          onSlotTransformChange?.(slot.id, patch);
          onSlotPositionEnd?.(slot.id);
        };
        const beginGesture = (event, mode = "move") => {
          if (event.button !== 0 || !stageRef.current) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.stopPropagation();
          const wrapper = event.currentTarget.closest(".story-preview-slot");
          const bounds = stageRef.current.getBoundingClientRect();
          const rect = wrapper?.getBoundingClientRect();
          if (!wrapper || !rect) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const startRotation = animated?.rotation ?? slot.rotation ?? 0;
          const corner = event.currentTarget.dataset.corner;
          let resize = null;
          if (mode === "scale" && corner) {
            const cornerX = corner.endsWith("left") ? -1 : 1;
            const cornerY = corner.startsWith("top") ? -1 : 1;
            const halfWidth = wrapper.offsetWidth / 2;
            const halfHeight = wrapper.offsetHeight / 2;
            const radians = startRotation * Math.PI / 180;
            const rotate = (x, y) => ({ x: x * Math.cos(radians) - y * Math.sin(radians), y: x * Math.sin(radians) + y * Math.cos(radians) });
            const diagonal = rotate(cornerX * halfWidth, cornerY * halfHeight);
            const handleRect = event.currentTarget.getBoundingClientRect();
            resize = {
              cornerX,
              cornerY,
              halfWidth,
              halfHeight,
              oppositeX: centerX - diagonal.x,
              oppositeY: centerY - diagonal.y,
              pointerOffsetX: event.clientX - (handleRect.left + handleRect.width / 2),
              pointerOffsetY: event.clientY - (handleRect.top + handleRect.height / 2),
              radians,
              startDistance: Math.max(1, Math.hypot(diagonal.x * 2, diagonal.y * 2)),
            };
          }
          canvasGestureRef.current = {
            pointerId: event.pointerId,
            mode,
            captureTarget: event.currentTarget,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: x,
            startY: y,
            startScale: scale,
            startRotation,
            centerX,
            centerY,
            startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
            startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
            stageWidth: bounds.width,
            stageHeight: bounds.height,
            stageLeft: bounds.left,
            stageTop: bounds.top,
            anchor: slot.anchor || "center",
            resize,
          };
          onSlotPositionStart?.(slot.id);
          onSlotSelect?.(slot.id);
        };
        return (
          <div
            className={`story-preview-slot${roleAsset?.url ? "" : " story-preview-slot-missing"}${selectedSlotId === slot.id ? " story-preview-slot-selected" : ""}`}
            key={`${slot.id}-${isPlaying ? playToken : "idle"}`}
            style={{ left: `${x}%`, top: `${y}%`, width: `${(onSlotSelect ? 19 : 24) * Math.max(0.1, Number(scale) || 1)}%`, transform: `${transform} rotate(${animated?.rotation ?? slot.rotation ?? 0}deg)`, transformOrigin: "center", opacity: animated?.opacity ?? 1, zIndex: Number(slot.layer || 0) + 1, touchAction: canTransform || isDrawingPath ? "none" : undefined, animationName: Number.isFinite(playheadMs) ? undefined : isPlaying ? motions.map(({ item }) => motionNames[item.preset]).filter(Boolean).join(", ") : undefined, animationDuration: motions.map(({ item }) => `${item.durationMs || 900}ms`).join(", "), animationDelay: motions.map(({ index }) => `${motionDelay(index)}ms`).join(", "), animationFillMode: "both" }}
            aria-label={`Vị trí của nhân vật ${role.name}`}
            data-role-id={role.id}
            data-slot-id={slot.id}
            role={onSlotSelect ? "group" : undefined}
            tabIndex={onSlotSelect ? 0 : undefined}
            data-motion={isPlaying ? motions.map(({ item }) => item.preset).join(" ") : ""}
            onClick={onSlotSelect && !isDrawingPath ? () => onSlotSelect(slot.id) : undefined}
            onPointerDown={canTransform ? (event) => beginGesture(event) : undefined}
            onPointerMove={canTransform ? (event) => {
              const gesture = canvasGestureRef.current;
              if (!gesture || gesture.pointerId !== event.pointerId || !stageRef.current) return;
              if (gesture.mode === "move") {
                const nextX = Math.max(0, Math.min(100, gesture.startX + (event.clientX - gesture.startClientX) / gesture.stageWidth * 100));
                const nextY = Math.max(0, Math.min(100, gesture.startY + (event.clientY - gesture.startClientY) / gesture.stageHeight * 100));
                (onSlotTransformChange || ((id, patch) => onSlotPositionChange?.(id, patch.x, patch.y)))(slot.id, { x: Math.round(nextX * 2) / 2, y: Math.round(nextY * 2) / 2 });
              } else if (gesture.mode === "scale") {
                const resize = gesture.resize;
                if (!resize) return;
                const pointerX = event.clientX - resize.pointerOffsetX;
                const pointerY = event.clientY - resize.pointerOffsetY;
                const ratio = Math.hypot(pointerX - resize.oppositeX, pointerY - resize.oppositeY) / resize.startDistance;
                const nextScale = Math.max(0.1, Math.min(5, gesture.startScale * ratio));
                const appliedRatio = nextScale / gesture.startScale;
                const localX = resize.cornerX * resize.halfWidth * appliedRatio;
                const localY = resize.cornerY * resize.halfHeight * appliedRatio;
                const nextCenterX = resize.oppositeX + localX * Math.cos(resize.radians) - localY * Math.sin(resize.radians);
                const nextCenterY = resize.oppositeY + localX * Math.sin(resize.radians) + localY * Math.cos(resize.radians);
                const anchorOffset = { "top-left": [-1, -1], "top-right": [1, -1], "bottom-left": [-1, 1], "bottom-right": [1, 1], center: [0, 0] }[gesture.anchor] || [0, 0];
                const halfWidth = resize.halfWidth * appliedRatio;
                const halfHeight = resize.halfHeight * appliedRatio;
                const nextX = Math.max(0, Math.min(100, (nextCenterX + anchorOffset[0] * halfWidth - gesture.stageLeft) / gesture.stageWidth * 100));
                const nextY = Math.max(0, Math.min(100, (nextCenterY + anchorOffset[1] * halfHeight - gesture.stageTop) / gesture.stageHeight * 100));
                onSlotTransformChange?.(slot.id, { x: Math.round(nextX * 2) / 2, y: Math.round(nextY * 2) / 2, scale: Math.round(nextScale * 100) / 100 });
              } else {
                const angle = Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX) * 180 / Math.PI;
                const nextRotation = gesture.startRotation + angle - gesture.startAngle;
                onSlotTransformChange?.(slot.id, { rotation: Math.round(nextRotation * 2) / 2 });
              }
            } : undefined}
            onPointerUp={canTransform ? (event) => {
              const gesture = canvasGestureRef.current;
              if (gesture?.pointerId !== event.pointerId) return;
              canvasGestureRef.current = null;
              if (gesture.captureTarget?.hasPointerCapture(event.pointerId)) gesture.captureTarget.releasePointerCapture(event.pointerId);
              onSlotPositionEnd?.(slot.id);
            } : undefined}
            onPointerCancel={canTransform ? (event) => { if (canvasGestureRef.current?.pointerId === event.pointerId) canvasGestureRef.current = null; onSlotPositionEnd?.(slot.id); } : undefined}
            onLostPointerCapture={canTransform ? (event) => { if (canvasGestureRef.current?.pointerId === event.pointerId) { canvasGestureRef.current = null; onSlotPositionEnd?.(slot.id); } } : undefined}
            onKeyDown={onSlotSelect ? (event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSlotSelect(slot.id); } } : undefined}
          >
            <span className="story-preview-slot-visual" style={{ transform: visualTransform }}>{roleAsset?.url ? <AssetImage src={roleAsset.url} fallbackSrc={fallbackUrl} alt={role.name} missingLabel={role.name} /> : <span>{role.name}<small>Thiếu ảnh</small></span>}</span>
            {canTransform && selectedSlotId === slot.id && <>
              <button className="story-canvas-transform-handle story-canvas-rotate-handle" type="button" aria-label={`Xoay ${role.name}`} title="Kéo để xoay; dùng ← hoặc → để chỉnh chính xác" onKeyDown={(event) => handleKeyboardTransform(event, "rotate")} onPointerDown={(event) => beginGesture(event, "rotate")} />
              <button className="story-canvas-transform-handle story-canvas-scale-handle is-top-left" data-corner="top-left" type="button" aria-label={`Phóng to hoặc thu nhỏ ${role.name} từ góc trên trái`} title="Kéo góc hoặc dùng phím mũi tên để đổi kích thước" onKeyDown={(event) => handleKeyboardTransform(event, "scale")} onPointerDown={(event) => beginGesture(event, "scale")} />
              <button className="story-canvas-transform-handle story-canvas-scale-handle is-top-right" data-corner="top-right" type="button" aria-label={`Phóng to hoặc thu nhỏ ${role.name} từ góc trên phải`} title="Kéo góc hoặc dùng phím mũi tên để đổi kích thước" onKeyDown={(event) => handleKeyboardTransform(event, "scale")} onPointerDown={(event) => beginGesture(event, "scale")} />
              <button className="story-canvas-transform-handle story-canvas-scale-handle is-bottom-left" data-corner="bottom-left" type="button" aria-label={`Phóng to hoặc thu nhỏ ${role.name} từ góc dưới trái`} title="Kéo góc hoặc dùng phím mũi tên để đổi kích thước" onKeyDown={(event) => handleKeyboardTransform(event, "scale")} onPointerDown={(event) => beginGesture(event, "scale")} />
              <button className="story-canvas-transform-handle story-canvas-scale-handle is-bottom-right" data-corner="bottom-right" type="button" aria-label={`Phóng to hoặc thu nhỏ ${role.name} từ góc dưới phải`} title="Kéo góc hoặc dùng phím mũi tên để đổi kích thước" onKeyDown={(event) => handleKeyboardTransform(event, "scale")} onPointerDown={(event) => beginGesture(event, "scale")} />
            </>}
          </div>
        );
      })}
      {onPathPointChange && clips.filter((clip) => clip.kind === "path").map((clip) => <svg className={`story-animation-path${clip.id === selectedAnimationClipId ? " is-selected" : ""}`} key={clip.id} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={(clip.points || []).map((point) => `${point.x},${point.y}`).join(" ")} /></svg>)}
      {clips.filter((clip) => clip.kind === "path" && clip.id === selectedAnimationClipId && onPathPointChange).flatMap((clip) => (clip.points || []).map((point, index) => <button className={`story-path-point${selectedPathPointIndex === index ? " is-selected" : ""}`} key={`${clip.id}-${index}`} type="button" aria-label={`Điểm ${index + 1} trên đường đi`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => onPathPointSelect?.(index)} onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); onPathPointSelect?.(index); onPathPointStart?.(clip.id, index);
      }} onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId) || !stageRef.current) return;
        const bounds = stageRef.current.getBoundingClientRect();
        onPathPointChange(clip.id, index, { x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)) });
      }} onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onPathPointEnd?.(clip.id, index);
      }} onPointerCancel={() => onPathPointEnd?.(clip.id, index)} />))}
      {isDrawingPath && <svg className="story-path-drawing-layer" viewBox="0 0 100 100" preserveAspectRatio="none" onPointerDown={(event) => {
        if (event.button !== 0 || !stageRef.current) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drawingPointerRef.current = event.pointerId;
        const bounds = stageRef.current.getBoundingClientRect();
        const point = { x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)) };
        const start = pathStartPoint && Math.hypot(point.x - pathStartPoint.x, point.y - pathStartPoint.y) > 1 ? pathStartPoint : point;
        setDrawPoints([start, point]);
      }} onPointerMove={(event) => {
        if (drawingPointerRef.current !== event.pointerId || !stageRef.current) return;
        const bounds = stageRef.current.getBoundingClientRect();
        const point = { x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)) };
        setDrawPoints((current) => {
          const last = current.at(-1);
          if (current.length >= 160 || (last && Math.hypot((point.x - last.x) * bounds.width / 100, (point.y - last.y) * bounds.height / 100) < 3)) return current;
          return [...current, point];
        });
      }} onPointerUp={(event) => {
        if (drawingPointerRef.current !== event.pointerId) return;
        drawingPointerRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        const bounds = stageRef.current?.getBoundingClientRect();
        const lastPoint = bounds ? { x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)) } : null;
        const points = lastPoint && drawPoints.length < 160 ? [...drawPoints, lastPoint] : drawPoints;
        if (points.length > 1) onPathCommit?.(points);
        setDrawPoints([]);
      }} onPointerCancel={() => { drawingPointerRef.current = null; setDrawPoints([]); onPathCancel?.(); }}><polyline points={drawPoints.map((point) => `${point.x},${point.y}`).join(" ")} /></svg>}
      {isDrawingPath && <PathPointsRef points={drawPoints} />}
      {!placements.length && !isDrawingPath && <div className="story-preview-no-slots">Chưa có nhân vật trên trang này</div>}
    </div>
  );
}

function PathPointsRef({ points }) {
  return points.length > 0 ? <div className="story-path-helper" aria-live="polite">{points.length < 2 ? "Kéo chuột để vẽ đường đi" : `Đường đi · ${points.length} điểm`}</div> : null;
}

function AssetImage({ src, fallbackSrc, alt, missingLabel }) {
  const [errorCount, setErrorCount] = useState(0);
  useEffect(() => setErrorCount(0), [src, fallbackSrc]);
  const imageSrc = errorCount === 0 ? src : errorCount === 1 ? fallbackSrc : "";
  if (!imageSrc) return <span>{missingLabel}<small>Không tải được ảnh nhân vật</small></span>;
  return <img src={imageSrc} alt={alt} onError={() => setErrorCount((count) => Math.min(count + 1, 2))} />;
}
