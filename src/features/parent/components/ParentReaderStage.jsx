import { useCallback, useEffect, useRef, useState } from "react";
import StoryPageRenderer from "../../content/components/StoryPageRenderer";
import { animationDuration } from "../../content/utils/storyAnimation";
import { syncStoryAudio, stopStoryAudio } from "../../content/utils/storyAudio";
import { subtitleAt } from "../../content/utils/storySubtitles";

// Key this component by page and session to dispose playback on navigation.
export default function ParentReaderStage({ story, page, onFinished }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [durations, setDurations] = useState({});
  const [error, setError] = useState("");
  const players = useRef(new Map());
  const position = useRef(0);
  const mounted = useRef(true);
  const duration = animationDuration(page, durations);
  const sync = useCallback((next, play) => {
    syncStoryAudio(players.current, (page.audioTracks || []).map(track => ({ ...track, volume: (track.volume ?? 1) * volume })), page.assets || [], next, play,
      () => { if (mounted.current) { setError("Không phát được âm thanh. Hãy kiểm tra kết nối rồi phát lại."); setPlaying(false); } },
      (id, ms) => { if (mounted.current) setDurations(current => current[id] === ms ? current : { ...current, [id]: ms }); }, muted);
  }, [page, volume, muted]);
  useEffect(() => {
    mounted.current = true;
    const audio = players.current;
    return () => {
      mounted.current = false;
      for (const player of audio.values()) { player.onerror = null; player.onloadedmetadata = null; }
      stopStoryAudio(audio);
    };
  }, []);
  useEffect(() => {
    sync(position.current, playing);
    if (!playing) return;
    const start = performance.now(), offset = position.current;
    let frame;
    function tick(now) {
      const next = Math.min(duration, offset + now - start);
      position.current = next;
      setTime(next);
      sync(next, next < duration);
      if (next < duration) frame = requestAnimationFrame(tick);
      else { setPlaying(false); onFinished?.(); }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, sync, onFinished]);
  function seek(next) {
    position.current = next;
    setTime(next);
    setPlaying(false);
    sync(next, false);
  }
  return <section className="parent-reader-playback" aria-label={`Trang ${page.pageNumber}`}>
    <StoryPageRenderer story={story} page={page} assets={page.assets} playheadMs={time} isPlaying={playing} showBranding={false} showPageText={false} stageSubtitle={subtitleAt(page, time)} />
    <div className="parent-reader-controls">
      <button type="button" className="workspace-button" onClick={() => {
        setError("");
        if (time >= duration) { position.current = 0; setTime(0); }
        sync(position.current, !playing);
        setPlaying(value => !value);
      }}>{playing ? "Tạm dừng" : "Phát trang"}</button>
      <button type="button" className="workspace-button workspace-button-quiet" onClick={() => seek(0)}>Về đầu trang</button>
      <label>Vị trí phát<input type="range" aria-label="Vị trí phát" min="0" max={duration} step="50" value={time} onChange={event => seek(Number(event.target.value))} /></label>
      <label><input type="checkbox" checked={muted} onChange={event => setMuted(event.target.checked)} /> Tắt tiếng</label>
      <label>Âm lượng<input type="range" aria-label="Âm lượng" min="0" max="1" step="0.1" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label>
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
