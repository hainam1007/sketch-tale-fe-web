import { featureApiModes, featureApiRequest, isFeatureMockMode } from "../../../lib/api/featureApi";
import { getLocalAssetNamespace, localAssetUrl, putLocalAsset, removeLocalAsset } from "./localAssetStore";

const contentRequest = (options) => featureApiRequest("content", options);

export const MAX_ASSET_SIZE = 5 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
export const IMAGE_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const AUDIO_MIME_TYPES = Object.freeze(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac"]);

function responseRows(response) {
  if (Array.isArray(response)) return response;
  return response?.items || [];
}

async function listBackendAssets(signal) {
  const stories = responseRows(await contentRequest({ path: "/story-template/getallstories", signal }));
  const assets = [];

  for (const story of stories) {
    if (story.coverImageUrl) {
      assets.push({
        id: `story-cover:${story.id}`,
        name: `${story.title || "Truyện"} · Ảnh bìa`,
        kind: "image",
        mimeType: "image/*",
        size: 0,
        url: story.coverImageUrl,
        readOnly: true,
      });
    }
  }

  const pageGroups = await Promise.all(stories.map(async (story) => {
    const pages = responseRows(await contentRequest({ path: `/storypage-template/pages/${story.id}`, signal }));
    return pages.flatMap((page) => {
      const items = [];
      if (page.backgroundUrl) {
        items.push({
          id: `page-background:${page.id}`,
          name: `${story.title || "Truyện"} · Trang ${page.pageNumber} · Ảnh nền`,
          kind: "image",
          mimeType: "image/*",
          size: 0,
          url: page.backgroundUrl,
          readOnly: true,
        });
      }
      if (page.audioNarrationUrl) {
        items.push({
          id: `page-audio:${page.id}`,
          name: `${story.title || "Truyện"} · Trang ${page.pageNumber} · Lời kể`,
          kind: "audio",
          mimeType: "audio/*",
          size: 0,
          url: page.audioNarrationUrl,
          readOnly: true,
        });
      }
      return items;
    });
  }));

  const uniqueAssets = new Map();
  for (const asset of [...assets, ...pageGroups.flat()]) {
    if (!uniqueAssets.has(asset.url)) uniqueAssets.set(asset.url, asset);
  }
  const items = [...uniqueAssets.values()];
  return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
}

export function validateAssetFile(file, kind = file?.type?.startsWith("audio/") ? "audio" : "image") {
  const errors = {};
  const allowedTypes = kind === "audio" ? AUDIO_MIME_TYPES : IMAGE_MIME_TYPES;
  const maxSize = kind === "audio" ? MAX_AUDIO_SIZE : MAX_ASSET_SIZE;
  if (!file) errors.file = kind === "audio" ? "Chọn một file âm thanh." : "Chọn một file ảnh.";
  else {
    if (!allowedTypes.includes(file.type)) errors.mimeType = kind === "audio" ? "Chỉ hỗ trợ MP3, WAV, OGG, WEBM hoặc AAC." : "Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF.";
    if (!Number.isFinite(file.size) || file.size <= 0) errors.size = "Kích thước asset chưa hợp lệ.";
    if (file.size > maxSize) errors.size = kind === "audio" ? "File âm thanh tối đa 25MB." : "File ảnh tối đa 5MB.";
  }
  return errors;
}

/**
 * Upload bytes through the configured Content Manager adapter.
 * AbortController cancellation is supported in both modes.
 */
export function uploadAsset({ file, signal }) {
  const kind = file?.type?.startsWith("audio/") ? "audio" : "image";
  const validationErrors = validateAssetFile(file, kind);
  if (Object.keys(validationErrors).length) {
    const error = new Error(Object.values(validationErrors)[0]);
    error.fieldErrors = validationErrors;
    return Promise.reject(error);
  }
  if (featureApiModes.content === "real") {
    return Promise.reject(new Error("Backend chưa có API thư viện asset dùng chung; hiện chưa thể upload từ màn này."));
  }
  const body = new FormData();
  body.append("file", file);
  body.append("name", file.name);
  body.append("kind", kind);
  body.append("mimeType", file.type);
  body.append("size", String(file.size));
  const namespace = getLocalAssetNamespace();
  return contentRequest({ path: "/content/assets", method: "POST", body, signal }).then(async (asset) => {
    if (!isFeatureMockMode("content")) return asset;
    try {
      await putLocalAsset(asset.id, file, namespace);
      return { ...asset, url: await localAssetUrl(asset.id, namespace), local: true, processingStatus: "ready" };
    } catch (error) {
      await contentRequest({ path: `/content/assets/${asset.id}`, method: "DELETE" }).catch(() => undefined);
      throw new Error(`Không thể lưu file local: ${error.message}`);
    }
  });
}

export async function listAssets({ signal } = {}) {
  if (featureApiModes.content === "real") return listBackendAssets(signal);
  const response = await contentRequest({ path: "/content/assets", signal });
  if (!isFeatureMockMode("content")) return response;
  const items = await Promise.all((response.items || []).map(async (asset) => {
    if (!asset.id) return asset;
    const url = await localAssetUrl(asset.id);
    if (url) return { ...asset, url, local: true, processingStatus: "ready" };
    if (asset.id.startsWith("asset-upload-")) return { ...asset, url: "", local: true, processingStatus: "failed", error: "File local không còn tồn tại. Hãy upload lại asset." };
    return asset;
  }));
  return { ...response, items };
}

export async function deleteAsset({ assetId }) {
  if (featureApiModes.content === "real") {
    throw new Error("Backend hiện chưa có API xóa hoặc quản lý thư viện tư liệu.");
  }
  await contentRequest({ path: `/content/assets/${assetId}`, method: "DELETE" });
  if (isFeatureMockMode("content")) await removeLocalAsset(assetId);
}
