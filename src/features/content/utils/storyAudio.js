/** Keep each story audio track aligned to the editor/reader playhead. */
export function audioTrackDurationMs(track, measuredDurations = {}) {
  const stored = Number(track?.durationMs);
  const measured = Number(measuredDurations?.[track?.id]);
  return Number.isFinite(stored) && stored > 0 ? stored : Number.isFinite(measured) && measured > 0 ? measured : 0;
}

export function normalizeStoryAudioTracks(tracks = []) {
  let nextStartMs = 0;
  return (Array.isArray(tracks) ? tracks : []).map((track, index) => {
    const startMs = Number.isFinite(Number(track.startMs)) && Number(track.startMs) >= 0 ? Number(track.startMs) : nextStartMs;
    const durationMs = Number(track.durationMs) > 0 ? Number(track.durationMs) : 3000;
    nextStartMs = Math.max(nextStartMs, startMs + durationMs);
    return {
      ...track,
      id: track.id || `legacy-audio-${index + 1}`,
      startMs,
      trimStartMs: Math.max(0, Number(track.trimStartMs) || 0),
      volume: Number.isFinite(Number(track.volume)) ? Number(track.volume) : 1,
    };
  });
}

export function compactAudioFilename(value, maxLength = 20) {
  const filename = String(value || "");
  if (filename.length <= maxLength) return filename;

  const extensionIndex = filename.lastIndexOf(".");
  const hasExtension = extensionIndex > 0 && filename.length - extensionIndex <= 8;
  const stem = hasExtension ? filename.slice(0, extensionIndex) : filename;
  const extension = hasExtension ? filename.slice(extensionIndex) : "";
  const suffix = hasExtension ? `${stem.slice(-2)}${extension}` : filename.slice(-5);
  const prefixLength = Math.max(5, maxLength - suffix.length - 3);
  return `${filename.slice(0, prefixLength)}...${suffix}`;
}

export function syncStoryAudio(players, tracks = [], assets = [], timeMs = 0, isPlaying = false, onError, onDuration, muted = false) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const liveIds = new Set(tracks.map((track) => track.id));
  for (const [id, player] of players) {
    const track = tracks.find((item) => item.id === id);
    const asset = track && assetById.get(track.assetId);
    if (!liveIds.has(id) || !asset?.url || player.dataset.storyAssetUrl !== asset.url) {
      player.pause();
      players.delete(id);
    }
  }

  for (const track of tracks) {
    const asset = assetById.get(track.assetId);
    if (!asset?.url) continue;
    let player = players.get(track.id);
    if (!player) {
      player = new Audio(asset.url);
      player.preload = "auto";
      player.dataset.storyAssetUrl = asset.url;
      player.dataset.storyDurationReported = "false";
      player.dataset.storyPendingPlay = "false";
      player.onerror = () => onError?.(asset.name || track.name || "Âm thanh");
      player.onloadedmetadata = () => {
        if (Number.isFinite(player.duration) && player.duration > 0 && player.dataset.storyDurationReported !== "true") {
          player.dataset.storyDurationReported = "true";
          onDuration?.(track.id, Math.round(player.duration * 1000));
        }
      };
      players.set(track.id, player);
    }

    const startMs = Math.max(0, Number(track.startMs) || 0);
    const trimStartMs = Math.max(0, Number(track.trimStartMs) || 0);
    const sourceDurationMs = Number(asset.duration) > 0 ? Number(asset.duration) * 1000 : Number(player.duration) > 0 ? player.duration * 1000 : 0;
    const requestedDurationMs = Number(track.durationMs) > 0 ? Number(track.durationMs) : Math.max(0, sourceDurationMs - trimStartMs);
    const endMs = requestedDurationMs > 0 ? startMs + requestedDurationMs : Infinity;
    const beforeTrack = timeMs < startMs;
    const afterTrack = timeMs >= endMs;
    const expectedSeconds = trimStartMs / 1000 + Math.max(0, timeMs - startMs) / 1000;
    player.volume = Math.max(0, Math.min(1, Number.isFinite(Number(track.volume)) ? Number(track.volume) : 1));
    player.muted = muted;

    if (!isPlaying || beforeTrack || afterTrack) {
      player.pause();
      player.dataset.storyPendingPlay = "false";
      if (beforeTrack && player.readyState >= 1 && Math.abs(player.currentTime - trimStartMs / 1000) > 0.25) {
        try { player.currentTime = trimStartMs / 1000; } catch { /* metadata can still be settling */ }
      }
      continue;
    }
    if (player.ended) continue;
    if (player.paused && player.dataset.storyPendingPlay !== "true") {
      if (player.readyState >= 1) {
        try { player.currentTime = Math.min(expectedSeconds, Math.max(0, player.duration - 0.02)); } catch { /* wait for the next clock tick */ }
      }
      player.dataset.storyPendingPlay = "true";
      player.play().then(() => { player.dataset.storyPendingPlay = "false"; }).catch((error) => {
        player.dataset.storyPendingPlay = "false";
        if (error?.name !== "AbortError") onError?.(asset.name || track.name || "Âm thanh");
      });
    } else if (!player.paused && player.readyState >= 1 && Math.abs(player.currentTime - expectedSeconds) > 0.4) {
      try { player.currentTime = Math.min(expectedSeconds, Math.max(0, player.duration - 0.02)); } catch { /* wait for the next clock tick */ }
    }
  }
}

export function stopStoryAudio(players) {
  for (const player of players.values()) player.pause();
  players.clear();
}
