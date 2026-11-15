import { featureApiModes, featureApiRequest, isFeatureMockMode } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";
import { mockRequest } from "../../../mocks/mockServer";
import { getLocalAssetNamespace, getLocalAsset, listLocalAssets, localAssetUrl, putLocalAsset, removeLocalAsset } from "./localAssetStore";

const contentRequest = (options) => featureApiRequest("content", options);

export const MAX_ASSET_SIZE = 5 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
export const IMAGE_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const AUDIO_MIME_TYPES = Object.freeze(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac"]);

export const ASSET_CATEGORIES = Object.freeze({ CHARACTER: "character", BACKGROUND: "background" });

export function assetCategory(asset) {
  if (asset?.category === ASSET_CATEGORIES.CHARACTER || asset?.category === ASSET_CATEGORIES.BACKGROUND) return asset.category;
  const identity = `${asset?.id || ""} ${asset?.name || ""}`.toLocaleLowerCase();
  if (/^asset-bobby-(garden|hallway|living-room)$/.test(asset?.id || "")) return ASSET_CATEGORIES.BACKGROUND;
  return /role-default|asset-bobby|bobby|nhan-vat|nhân vật|character|pose/.test(identity) ? ASSET_CATEGORIES.CHARACTER : ASSET_CATEGORIES.BACKGROUND;
}

function responseRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  throw new ApiError({ status: 502, code: "CONTENT_ASSET_RESPONSE_INVALID", message: "Không thể đọc danh sách tư liệu. Hãy tải lại trang." });
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

async function listBackendAssets(signal) {
  const stories = responseRows(await contentRequest({ path: "/story-template/all-stories", signal }));
  const assets = [];

  for (const story of stories) {
    if (story.coverImageUrl) {
      assets.push({
        id: `story-cover:${story.id}`,
        name: `${story.title || "Truyện"} · Ảnh bìa`,
        kind: "image",
        category: ASSET_CATEGORIES.BACKGROUND,
        mimeType: "image/*",
        size: 0,
        url: story.coverImageUrl,
        readOnly: true,
      });
    }
  }

  const pageGroups = await mapWithConcurrency(stories, 4, async (story) => {
    const pages = responseRows(await contentRequest({ path: `/storypage-template/all-pages/${story.id}`, signal }));
    return pages.flatMap((page) => {
      const items = [];
      if (page.backgroundUrl) {
        items.push({
          id: `page-background:${page.id}`,
          name: `${story.title || "Truyện"} · Trang ${page.pageNumber} · Ảnh nền`,
          kind: "image",
          category: ASSET_CATEGORIES.BACKGROUND,
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
  });
  const roleGroups = await mapWithConcurrency(stories, 4, async (story) => {
    const roles = responseRows(await contentRequest({ path: `/story-template/${story.id}/all-roles`, signal }));
    return roles.flatMap((role) => role.defaultAssetUrl ? [{
      id: `role-default:${role.id}`,
      category: ASSET_CATEGORIES.CHARACTER,
      name: `${story.title || "Truyện"} · ${role.roleName || "Nhân vật"}`,
      kind: "image",
      mimeType: "image/*",
      size: 0,
      url: role.defaultAssetUrl,
      readOnly: true,
    }] : []);
  });

  const uniqueAssets = new Map();
  for (const asset of [...assets, ...pageGroups.flat(), ...roleGroups.flat()]) {
    if (!uniqueAssets.has(asset.id)) uniqueAssets.set(asset.id, asset);
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

export async function getAssetFileForStoryUpload(asset) {
  if (!asset?.id) throw new Error("Không tìm thấy ảnh đã chọn.");
  let blob = (await getLocalAsset(asset.id))?.blob;
  if (!blob && asset.url) {
    const response = await fetch(asset.url);
    if (!response.ok) throw new Error("Không thể tải file ảnh đã chọn. Hãy tải ảnh lên lại.");
    blob = await response.blob();
  }
  if (!blob) throw new Error("File ảnh không còn khả dụng. Hãy tải ảnh lên lại.");

  const type = blob.type || asset.mimeType;
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[type];
  const safeName = String(asset.name || "anh-bia").split(/[\\/]/).pop().replace(/[<>:\"|?*\x00-\x1F]/g, "-").trim() || "anh-bia";
  const fileName = /\.(png|jpe?g|webp|gif)$/i.test(safeName) ? safeName : `${safeName}.${extension || "webp"}`;
  const file = new File([blob], fileName, { type, lastModified: Date.now() });
  const errors = validateAssetFile(file, "image");
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return file;
}

/**
 * Upload bytes through the configured Content Manager adapter.
 * AbortController cancellation is supported in both modes.
 */
export function uploadAsset({ file, signal, category = ASSET_CATEGORIES.BACKGROUND }) {
  const kind = file?.type?.startsWith("audio/") ? "audio" : "image";
  const validationErrors = validateAssetFile(file, kind);
  if (Object.keys(validationErrors).length) {
    const error = new Error(Object.values(validationErrors)[0]);
    error.fieldErrors = validationErrors;
    return Promise.reject(error);
  }
  const body = new FormData();
  body.append("file", file);
  body.append("name", file.name);
  body.append("kind", kind);
  if (kind === "image") body.append("category", category);
  body.append("mimeType", file.type);
  body.append("size", String(file.size));
  const namespace = getLocalAssetNamespace();
  const useMockAdapter = featureApiModes.content === "real" || isFeatureMockMode("content");
  if (featureApiModes.content === "real" && kind === "image") {
    const backendBody = new FormData();
    backendBody.append("file", file, file.name || "image");
    const uploadPath = "/upload/background-image";
    return contentRequest({ path: uploadPath, method: "POST", body: backendBody, signal }).then(async (response) => {
      const url = response?.imageUrl ?? response?.ImageUrl;
      if (typeof url !== "string" || !url.trim()) {
        throw new ApiError({ status: 502, code: "CONTENT_ASSET_UPLOAD_RESPONSE_INVALID", message: "Backend không trả về đường dẫn ảnh đã tải lên." });
      }
      const id = `cloudinary-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
      const asset = {
        id,
        name: file.name || "image",
        kind,
        category,
        size: file.size,
        mimeType: file.type,
        url,
        source: "cloudinary",
        uploadedToBackend: true,
        readOnly: true,
        createdAt: new Date().toISOString(),
      };
      await putLocalAsset(id, file, namespace, category, { name: asset.name, kind, size: file.size, mimeType: file.type, remoteUrl: url, uploadedToBackend: true });
      return asset;
    });
  }

  const request = useMockAdapter ? mockRequest : contentRequest;
  return request({ path: "/content/assets", method: "POST", body, signal }).then(async (asset) => {
    if (!useMockAdapter) return asset;
    try {
      await putLocalAsset(asset.id, file, namespace, category);
      return { ...asset, category, url: await localAssetUrl(asset.id, namespace), local: true, source: "mock", processingStatus: "ready" };
    } catch (error) {
      await request({ path: `/content/assets/${asset.id}`, method: "DELETE" }).catch(() => undefined);
      throw new Error(`Không thể lưu file local: ${error.message}`);
    }
  });
}

export async function listAssets({ signal } = {}) {
  if (featureApiModes.content === "real") {
    const backend = await listBackendAssets(signal);
    const { items: mockItems } = await listMockAssets({ signal });
    const uploadedAssets = (await listLocalAssets()).filter((record) => record.uploadedToBackend && record.remoteUrl).map((record) => ({
      id: record.assetId,
      name: record.name || "image",
      kind: record.kind || "image",
      category: record.category || ASSET_CATEGORIES.BACKGROUND,
      size: record.size || record.blob?.size || 0,
      mimeType: record.mimeType || record.blob?.type || "image/*",
      url: record.remoteUrl,
      source: "cloudinary",
      uploadedToBackend: true,
      readOnly: true,
      createdAt: new Date(record.updatedAt || Date.now()).toISOString(),
    }));
    const uniqueAssets = new Map([...backend.items.map((asset) => ({ ...asset, category: assetCategory(asset) })), ...mockItems, ...uploadedAssets].map((asset) => [asset.id, asset]));
    const items = [...uniqueAssets.values()];
    return { ...backend, items, total: items.length, pageSize: items.length || 1, totalPages: 1 };
  }
  const response = await contentRequest({ path: "/content/assets", signal });
  if (!isFeatureMockMode("content")) return response;
  const items = await Promise.all((response.items || []).map(async (asset) => {
    if (!asset.id) return { ...asset, source: "mock" };
    const localRecord = await getLocalAsset(asset.id);
    const url = localRecord?.blob ? await localAssetUrl(asset.id) : "";
    if (url) return { ...asset, category: localRecord.category || asset.category || assetCategory(asset), url, local: true, source: "mock", processingStatus: "ready" };
    if (asset.id.startsWith("asset-upload-")) return { ...asset, category: asset.category || assetCategory(asset), url: "", local: true, source: "mock", processingStatus: "failed", error: "File local không còn tồn tại. Hãy upload lại ảnh." };
    return { ...asset, category: asset.category || assetCategory(asset), source: "mock" };
  }));
  return { ...response, items };
}

export async function deleteAsset(asset) {
  if (!asset?.id) throw new Error("Không tìm thấy ảnh cần xóa.");
  if (featureApiModes.content === "real" && asset.source === "cloudinary") {
    throw new ApiError({ status: 501, code: "CONTENT_ASSET_REGISTRY_UNAVAILABLE", message: "Tư liệu đã tải lên máy chủ đang được dùng ở chế độ chỉ đọc. Backend chưa có API thư viện để xóa an toàn." });
  }
  const request = asset.local || asset.source === "mock" ? mockRequest : contentRequest;
  const removed = await request({ path: `/content/assets/${asset.id}`, method: "DELETE" });
  if (asset.local || asset.source === "mock") await removeLocalAsset(asset.id);
  return removed;
}

export async function listMockAssets({ signal } = {}) {
  const response = await mockRequest({ path: "/content/assets", signal });
  const items = await Promise.all((response.items || []).map(async (asset) => {
    if (!asset.id) return { ...asset, source: "mock" };
    const localRecord = await getLocalAsset(asset.id);
    const url = localRecord?.blob ? await localAssetUrl(asset.id) : "";
    if (url) return { ...asset, category: localRecord.category || asset.category || assetCategory(asset), url, local: true, source: "mock", processingStatus: "ready" };
    if (asset.id.startsWith("asset-upload-")) return { ...asset, category: asset.category || assetCategory(asset), url: "", local: true, source: "mock", processingStatus: "failed", error: "File local không còn tồn tại. Hãy upload lại ảnh." };
    return { ...asset, category: asset.category || assetCategory(asset), source: "mock" };
  }));
  return { ...response, items };
}
