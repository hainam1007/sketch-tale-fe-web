import { ApiError } from "../../../lib/api/errors";
import { hydratePageFromComposition, parseStoryComposition } from "../../content/services/storyComposition";

export const readField = (row, key) => row?.[key] ?? row?.[key[0].toUpperCase() + key.slice(1)];
const sameId = (a, b) => typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
const active = row => readField(row, "status") === 2 || String(readField(row, "status")).toLowerCase() === "active";
function invalid(message) { throw new ApiError({ status: 502, code: "PARENT_READER_DATA_INVALID", message }); }

// Pure read model. No authoring API, browser drafts, asset store or demo overlay.
export function buildParentReader(story, roleRows, slotsByPage) {
  if (!Array.isArray(roleRows)) invalid("Không đọc được danh sách vai trong truyện.");
  const roles = roleRows.filter(active).map(row => {
    if (!sameId(readField(row, "storyTemplateId"), story.id) || typeof readField(row, "id") !== "string") invalid("Vai không thuộc truyện đang đọc.");
    return { id: readField(row, "id"), name: readField(row, "roleName"), defaultAssetUrl: readField(row, "defaultAssetUrl") || "", slots: [] };
  });
  const pages = story.pages.map(page => {
    const parsed = parseStoryComposition(page.compositionJson);
    if (!["supported", "legacy"].includes(parsed.kind) || parsed.issues.length) invalid(`Trang ${page.pageNumber}: bố cục bị lỗi hoặc chưa được hỗ trợ. Không thể hiển thị đầy đủ trang này.`);
    const nativeAudioId = `page-audio:${page.id}`;
    const model = hydratePageFromComposition({
      ...page, backgroundUrl: page.imageUrl,
      audioTracks: page.audioUrl ? [{ id: `page-audio-track:${page.id}`, assetId: nativeAudioId, name: "Lời kể", type: "voiceover", startMs: 0, volume: 1 }] : [],
    }, parsed);
    const assets = [...(parsed.value?.assets || [])];
    const addNative = asset => { if (!assets.some(item => item.id === asset.id)) assets.push(asset); };
    if (page.audioUrl) addNative({ id: nativeAudioId, kind: "audio", name: "Lời kể", url: page.audioUrl });
    if (story.imageUrl) addNative({ id: "story-cover:inherit", kind: "image", url: story.imageUrl });
    const rows = slotsByPage[page.id];
    if (!Array.isArray(rows)) invalid(`Không đọc được vị trí nhân vật ở trang ${page.pageNumber}.`);
    const slotIds = new Set();
    for (const row of rows.filter(active)) {
      const role = roles.find(item => sameId(item.id, readField(row, "storyRoleTemplateId")));
      const id = readField(row, "id");
      if (!role || typeof id !== "string" || !sameId(readField(row, "storyPageId"), page.id)) invalid("Vị trí nhân vật không khớp với trang và vai đã phát hành.");
      const x = readField(row, "posX"), y = readField(row, "posY"), scale = readField(row, "scale");
      if (![x, y, scale].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || scale <= 0 || slotIds.has(id)) invalid("Vị trí nhân vật không hợp lệ.");
      slotIds.add(id);
      const extension = model.slotExtensions?.[id] || {};
      role.slots.push({ id, pageId: page.id, x, y, scale, flip: Boolean(readField(row, "flipHorizontal")), ...extension });
    }
    const targets = new Set([...slotIds, ...(model.imageObjects || []).map(image => image.id)]);
    if (Object.keys(model.slotExtensions || {}).some(id => !slotIds.has(id)) || (model.animationClips || []).some(clip => !targets.has(clip.targetId))) invalid("Bố cục tham chiếu nhân vật hoặc ảnh chưa được phát hành.");
    return { ...model, assets };
  });
  return { ...story, roles, pages };
}
