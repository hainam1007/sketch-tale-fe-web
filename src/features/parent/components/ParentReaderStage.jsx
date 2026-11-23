import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SpeakerHigh, SpeakerX } from "@phosphor-icons/react";
import StoryPageRenderer from "../../content/components/StoryPageRenderer";
import { animationDuration } from "../../content/utils/storyAnimation";
import { syncStoryAudio, stopStoryAudio } from "../../content/utils/storyAudio";
import { subtitleAt } from "../../content/utils/storySubtitles";

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

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
  function togglePlayback() {
    setError("");
    if (!playing && time >= duration) { position.current = 0; setTime(0); }
    sync(position.current, !playing);
    setPlaying(value => !value);
  }
  const progress = duration ? Math.min(100, time / duration * 100) : 0;
  return <section className="parent-reader-playback" aria-label={`Trang ${page.pageNumber}`}>
    <div className="parent-video-player">
      <button className="parent-video-screen" type="button" onClick={togglePlayback} aria-label={playing ? "Tạm dừng truyện" : "Phát truyện"}>
        <StoryPageRenderer story={story} page={page} assets={page.assets} playheadMs={time} isPlaying={playing} showBranding={false} showPageText={false} stageSubtitle={subtitleAt(page, time)} />
      </button>
      <div className="parent-reader-controls" aria-label="Điều khiển trình phát">
        <input
          className="parent-reader-progress"
          type="range"
          aria-label="Tiến độ truyện"
          min="0"
          max={duration}
          step="50"
          value={time}
          style={{ "--playback-progress": `${progress}%` }}
          onChange={event => seek(Number(event.target.value))}
        />
        <div className="parent-reader-control-row">
          <button type="button" className="parent-reader-icon-button" onClick={togglePlayback} aria-label={playing ? "Tạm dừng" : "Phát"} title={playing ? "Tạm dừng" : "Phát"}>
            {playing ? <Pause size={22} weight="fill" aria-hidden="true" /> : <Play size={22} weight="fill" aria-hidden="true" />}
          </button>
          <span className="parent-reader-time" aria-live="off">{formatTime(time)} <span>/</span> {formatTime(duration)}</span>
          <div className="parent-reader-volume">
            <button type="button" className="parent-reader-icon-button" onClick={() => {
              if (muted || volume === 0) { if (volume === 0) setVolume(0.5); setMuted(false); }
              else setMuted(true);
            }} aria-label={muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"} title={muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"}>
              {muted || volume === 0 ? <SpeakerX size={21} aria-hidden="true" /> : <SpeakerHigh size={21} aria-hidden="true" />}
            </button>
            <input type="range" aria-label="Âm lượng" min="0" max="1" step="0.05" value={muted ? 0 : volume} style={{ "--volume-progress": `${muted ? 0 : volume * 100}%` }} onChange={event => { const next = Number(event.target.value); setMuted(false); setVolume(next); }} />
          </div>
        </div>
      </div>
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
