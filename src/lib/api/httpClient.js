import { mockRequest } from "../../mocks/mockServer";
import { ApiError, normalizeApiError } from "./errors";
import { assertDocumentedBackendRoute } from "./backendRoutes";
import {
  clearTokens,
  getAccessToken,
  getTokenPair,
  hasAccessToken,
  setTokenPair,
  ACCESS_TOKEN_KEY,
} from "./authTokenStorage";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const useMock = import.meta.env.VITE_API_MODE !== "real";
export { ACCESS_TOKEN_KEY, getAccessToken, hasAccessToken };
export const clearAccessToken = clearTokens;

const refreshInFlight = new Map();

function dispatchInvalidSession(error) {
  clearTokens();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sketchtale:auth-invalid", { detail: error }));
  }
}

function tokenFrom(payload, ...keys) {
  for (const key of keys) {
    const value = payload?.[key] ?? payload?.data?.[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function withRefreshLock(action) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(`sketchtale-auth-refresh:${apiBaseUrl}`, action);
  }
  return action();
}

async function refreshTokens(failedAccessToken, failedSessionId) {
  const currentPair = getTokenPair();
  if (!currentPair?.refreshToken) {
    throw new ApiError({ status: 401, code: "REFRESH_TOKEN_MISSING", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
  }
  if (currentPair.accessToken !== failedAccessToken) {
    if (currentPair.sessionId === failedSessionId) return currentPair.accessToken;
    throw new ApiError({ status: 409, code: "SESSION_CHANGED", message: "Tài khoản đã thay đổi trong lúc gửi yêu cầu. Hãy tải lại trang." });
  }
  if (refreshInFlight.has(failedAccessToken)) return refreshInFlight.get(failedAccessToken);

  const pending = withRefreshLock(async () => {
    const pair = getTokenPair();
    if (!pair?.refreshToken) {
      throw new ApiError({ status: 401, code: "REFRESH_TOKEN_MISSING", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }
    if (pair.accessToken !== failedAccessToken) {
      if (pair.sessionId === failedSessionId) return pair.accessToken;
      throw new ApiError({ status: 409, code: "SESSION_CHANGED", message: "Tài khoản đã thay đổi trong lúc gửi yêu cầu. Hãy tải lại trang." });
    }

    const payload = await realRequest({
      path: "/auth/refresh-token",
      method: "POST",
      body: { refreshToken: pair.refreshToken },
      skipAuth: true,
      skipRefresh: true,
      accessToken: pair.accessToken,
    });
    const accessToken = tokenFrom(payload, "token", "accessToken", "access_token", "jwt", "jwtToken");
    const refreshToken = tokenFrom(payload, "refreshToken", "refresh_token");
    if (!accessToken || !refreshToken) {
      throw new ApiError({ status: 502, code: "INVALID_REFRESH_RESPONSE", message: "Backend chưa trả về đầy đủ cặp token mới." });
    }

    const latestPair = getTokenPair();
    if (!latestPair || latestPair.accessToken !== pair.accessToken || latestPair.refreshToken !== pair.refreshToken) {
      if (latestPair?.accessToken) return latestPair.accessToken;
      throw new ApiError({ status: 401, code: "SESSION_CHANGED", message: "Phiên đăng nhập đã thay đổi. Vui lòng thử lại." });
    }

    setTokenPair({ accessToken, refreshToken }, pair.rememberSession, pair.sessionId);
    return accessToken;
  });

  refreshInFlight.set(failedAccessToken, pending);
  try {
    return await pending;
  } finally {
    if (refreshInFlight.get(failedAccessToken) === pending) refreshInFlight.delete(failedAccessToken);
  }
}

function tokenExpirationTime(accessToken) {
  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    return Number.isFinite(claims.exp) ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function refreshAccessTokenIfNeeded(bufferMs = 120_000) {
  const pair = getTokenPair();
  if (!pair?.accessToken || !pair.refreshToken) return false;
  const expiresAt = tokenExpirationTime(pair.accessToken);
  if (!expiresAt || expiresAt - Date.now() > bufferMs) return false;

  try {
    await refreshTokens(pair.accessToken, pair.sessionId);
    return true;
  } catch (error) {
    const currentPair = getTokenPair();
    if (
      [401, 423].includes(error?.status) &&
      currentPair?.accessToken === pair.accessToken &&
      currentPair.sessionId === pair.sessionId
    ) {
      dispatchInvalidSession(error);
    }
    throw error;
  }
}

async function realRequest({ path, method, body, signal, skipAuth = false, accessToken }) {
  assertDocumentedBackendRoute(method, path);
  let response;
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const requestToken = accessToken === undefined ? (skipAuth ? null : getAccessToken()) : accessToken;
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      signal,
      credentials: "omit",
      headers: {
        ...(body && !isMultipart ? { "Content-Type": "application/json" } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
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
export async function apiRequest({ path, method = "GET", body, signal, forceReal = false, skipAuth = false, skipRefresh = false }) {
  try {
    if (useMock && !forceReal) return await mockRequest({ path, method, body, signal });

    const requestPair = skipAuth ? null : getTokenPair();
    const requestToken = requestPair?.accessToken || null;
    try {
      return await realRequest({ path, method, body, signal, skipAuth, accessToken: requestToken });
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 423 && requestToken && !skipAuth) {
        const currentPair = getTokenPair();
        if (currentPair?.accessToken === requestToken && currentPair.sessionId === requestPair.sessionId) dispatchInvalidSession(normalized);
        throw normalized;
      }
      if (normalized.status !== 401 || !requestToken || skipAuth || skipRefresh) throw normalized;

      try {
        await refreshTokens(requestToken, requestPair.sessionId);
      } catch (refreshError) {
        const refreshFailure = normalizeApiError(refreshError);
        const currentPair = getTokenPair();
        if ([401, 423].includes(refreshFailure.status) && currentPair?.accessToken === requestToken && currentPair.sessionId === requestPair.sessionId) {
          dispatchInvalidSession(refreshFailure);
        }
        throw refreshFailure;
      }

      if (signal?.aborted) throw Object.assign(new Error("Request cancelled."), { name: "AbortError" });
      const retryPair = getTokenPair();
      if (retryPair && retryPair.sessionId !== requestPair.sessionId) {
        throw new ApiError({ status: 409, code: "SESSION_CHANGED", message: "Tài khoản đã thay đổi trong lúc gửi yêu cầu. Hãy tải lại trang." });
      }
      const retryToken = retryPair?.accessToken;
      if (!retryToken) {
        dispatchInvalidSession(normalized);
        throw normalized;
      }
      try {
        return await realRequest({ path, method, body, signal, accessToken: retryToken, skipRefresh: true });
      } catch (retryError) {
        const retryFailure = normalizeApiError(retryError);
        const currentPair = getTokenPair();
        if ([401, 423].includes(retryFailure.status) && currentPair?.accessToken === retryToken && currentPair.sessionId === retryPair.sessionId) {
          dispatchInvalidSession(retryFailure);
        }
        throw retryFailure;
      }
    }
  } catch (error) {
    throw normalizeApiError(error);
  }
}
