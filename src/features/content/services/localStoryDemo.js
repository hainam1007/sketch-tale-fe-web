import { getLocalAsset, putLocalAsset, localAssetUrl } from "./localAssetStore";

const snapshotId = (storyId) => `demo-story:${storyId}`;

// A separate snapshot keeps the demo independent from API reads and editor drafts.
export async function saveLocalStoryDemo(story, assets, userId) {
  if (typeof indexedDB === "undefined") throw new Error("Trình duyệt không hỗ trợ lưu bản demo.");
  const copy = structuredClone(story);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const required = new Set();
  const add = (id, url, kind, name) => {
    if (!id && !url) return "";
    const key = id || `demo-media:${url}`;
    if (!byId.get(key)?.url && url) byId.set(key, { id: key, url, kind, name });
    required.add(key);
    return key;
  };
  for (const page of copy.pages) {
    page.backgroundAssetId = add(page.backgroundAssetId, page.backgroundUrl, "image", "Ảnh nền");
    for (const image of page.imageObjects || []) add(image.assetId, null, "image", image.name);
    for (const track of page.audioTracks || []) add(track.assetId, null, "audio", track.name);
  }
  for (const role of copy.roles || []) {
    for (const slot of role.slots || []) {
      slot.assetId = add(slot.assetId || role.defaultAssetId, role.defaultAssetUrl, "image", role.name);
    }
  }
  const media = [];
  for (const id of required) {
    const asset = byId.get(id);
    if (!asset?.url) throw new Error(`Thiếu tệp ${asset?.name || id}. Hãy chọn lại tư liệu trước khi lưu demo.`);
    const existing = await getLocalAsset(id, userId);
    let blob = existing?.blob;
    if (!blob) {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`Không tải được ${asset.name || id} để lưu demo (${response.status}).`);
      blob = await response.blob();
    }
    const mediaId = `demo-media:${globalThis.crypto.randomUUID()}`;
    await putLocalAsset(mediaId, blob, userId, asset.category);
    media.push({ ...asset, url: undefined, fallbackUrl: undefined, mediaId });
  }
  const snapshot = { version: 1, savedAt: new Date().toISOString(), story: copy, media };
  await putLocalAsset(snapshotId(story.id), new Blob([JSON.stringify(snapshot)], { type: "application/json" }), userId);
  return snapshot.savedAt;
}

export async function readLocalStoryDemo(storyId, userId) {
  const record = await getLocalAsset(snapshotId(storyId), userId);
  if (!record?.blob) throw new Error("Chưa có bản demo trên máy. Mở Dựng truyện và bấm Lưu demo trên máy.");
  const snapshot = JSON.parse(await record.blob.text());
  if (snapshot.version !== 1 || snapshot.story?.id !== storyId) throw new Error("Bản demo không hợp lệ.");
  const assets = await Promise.all(snapshot.media.map(async (asset) => {
    const url = await localAssetUrl(asset.mediaId, userId);
    if (!url) throw new Error(`Không tìm thấy tệp demo: ${asset.name || asset.id}.`);
    return { ...asset, url };
  }));
  return { ...snapshot.story, localDemo: { savedAt: snapshot.savedAt, assets } };
}
