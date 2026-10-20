import { mockRequest } from "../../mocks/mockServer";
import { ApiError, normalizeApiError } from "./errors";
import { assertDocumentedBackendRoute } from "./backendRoutes";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const useMock = import.meta.env.VITE_API_MODE !== "real";
export const ACCESS_TOKEN_KEY = "sketchtale.access-token.v1";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(accessToken, rememberSession = true) {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  (rememberSession ? localStorage : sessionStorage).setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

async function realRequest({ path, method, body, signal }) {
  assertDocumentedBackendRoute(method, path);
  let response;
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const accessToken = getAccessToken();
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

  const responseText = await response.text().catch(() => "");
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/plain") && !responseText.trimStart().startsWith("<")) {
        payload = responseText;
      }
    }
  }
  if (!response.ok) {
    const problem = payload?.error && typeof payload.error === "object" ? payload.error : payload;
    throw new ApiError({
      status: response.status,
      code: problem?.code || "HTTP_ERROR",
      message: problem?.message || problem?.detail || problem?.title || (typeof payload === "string" ? payload : undefined),
      fieldErrors: problem?.fieldErrors || problem?.errors,
      requestId: problem?.requestId || response.headers.get("x-request-id") || undefined,
    });
  }
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
}

/**
 * Single HTTP boundary for feature services. VITE_API_MODE=real switches to
 * the backend without changing pages or hooks.
 */
export async function apiRequest({ path, method = "GET", body, signal, forceReal = false }) {
  try {
    if (useMock && !forceReal) return await mockRequest({ path, method, body, signal });
    return await realRequest({ path, method, body, signal });
  } catch (error) {
    const normalized = normalizeApiError(error);
    if (typeof window !== "undefined" && [401, 423].includes(normalized.status)) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent("sketchtale:auth-invalid", { detail: normalized }));
    }
    throw normalized;
  }
}
