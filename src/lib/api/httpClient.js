import { mockRequest } from "../../mocks/mockServer";
import { ApiError, normalizeApiError } from "./errors";

const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";
const useMock = import.meta.env.VITE_API_MODE !== "real";

async function realRequest({ path, method, body, signal }) {
  let response;
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      signal,
      credentials: "include",
      headers: body && !isMultipart ? { "Content-Type": "application/json" } : undefined,
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
      window.dispatchEvent(new CustomEvent("sketchtale:auth-invalid", { detail: normalized }));
    }
    throw normalized;
  }
}
