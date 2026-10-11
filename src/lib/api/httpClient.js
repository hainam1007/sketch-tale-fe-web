import { mockRequest } from "../../mocks/mockServer";
import { ApiError, normalizeApiError } from "./errors";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const useMock = import.meta.env.VITE_API_MODE !== "real";
export const ACCESS_TOKEN_KEY = "sketchtale.access-token.v1";

export function hasAccessToken() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

async function realRequest({ path, method, body, signal }) {
  let response;
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      signal,
      credentials: "omit",
      headers: {
        ...(body && !isMultipart ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    throw normalizeApiError(error);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload?.code || "HTTP_ERROR",
      message: payload?.message,
      fieldErrors: payload?.fieldErrors,
      requestId: payload?.requestId,
    });
  }
  return payload?.data ?? payload;
}

/**
 * Single HTTP boundary for feature services. VITE_API_MODE=real switches to
 * the backend without changing pages or hooks.
 */
export async function apiRequest({ path, method = "GET", body, signal }) {
  try {
    if (useMock) return await mockRequest({ path, method, body, signal });
    return await realRequest({ path, method, body, signal });
  } catch (error) {
    const normalized = normalizeApiError(error);
    if (typeof window !== "undefined" && [401, 423].includes(normalized.status)) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("sketchtale:auth-invalid", { detail: normalized }));
    }
    throw normalized;
  }
}
