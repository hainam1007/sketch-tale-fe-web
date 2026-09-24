import { apiRequest } from "../../../lib/api/httpClient";
import { getLocalAssetNamespace, localAssetUrl, putLocalAsset, removeLocalAsset } from "./localAssetStore";

export const MAX_ASSET_SIZE = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function validateAssetFile(file) {
  const errors = {};
  if (!file) errors.file = "Chọn một file ảnh.";
  else {
    if (!IMAGE_MIME_TYPES.includes(file.type)) errors.mimeType = "Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF.";
    if (!Number.isFinite(file.size) || file.size <= 0) errors.size = "Kích thước asset chưa hợp lệ.";
    if (file.size > MAX_ASSET_SIZE) errors.size = "File ảnh tối đa 5MB.";
  }
  return errors;
}

/**
 * Upload the bytes as multipart. The server, not the browser mock, owns the
 * final URL and processing state. AbortController cancellation is supported.
 */
export function uploadAsset({ file, signal }) {
  const validationErrors = validateAssetFile(file);
  if (Object.keys(validationErrors).length) {
    const error = new Error(Object.values(validationErrors)[0]);
    error.fieldErrors = validationErrors;
    return Promise.reject(error);
  }
  const body = new FormData();
  body.append("file", file);
  body.append("name", file.name);
  body.append("kind", "image");
  body.append("mimeType", file.type);
  body.append("size", String(file.size));
  const namespace = getLocalAssetNamespace();
  return apiRequest({ path: "/content/assets", method: "POST", body, signal }).then(async (asset) => {
    if (import.meta.env.VITE_API_MODE === "real") return asset;
    try {
      await putLocalAsset(asset.id, file, namespace);
      return { ...asset, url: await localAssetUrl(asset.id, namespace), local: true, processingStatus: "ready" };
    } catch (error) {
      await apiRequest({ path: `/content/assets/${asset.id}`, method: "DELETE" }).catch(() => undefined);
      throw new Error(`Không thể lưu file local: ${error.message}`);
    }
  });
}

export async function listAssets({ signal } = {}) {
  const response = await apiRequest({ path: "/content/assets", signal });
  if (import.meta.env.VITE_API_MODE === "real") return response;
  const items = await Promise.all((response.items || []).map(async (asset) => {
    if (!asset.id || asset.kind !== "image") return asset;
    const url = await localAssetUrl(asset.id);
    if (url) return { ...asset, url, local: true, processingStatus: "ready" };
    if (asset.id.startsWith("asset-upload-")) return { ...asset, url: "", local: true, processingStatus: "failed", error: "File local không còn tồn tại. Hãy upload lại asset." };
    return asset;
  }));
  return { ...response, items };
}

export async function deleteAsset({ assetId }) {
  await apiRequest({ path: `/content/assets/${assetId}`, method: "DELETE" });
  await removeLocalAsset(assetId);
}
