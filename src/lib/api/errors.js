/**
 * Normalized error shape shared by mock and real API adapters.
 */
export class ApiError extends Error {
  constructor({ status = 500, code = "UNKNOWN_ERROR", message, fieldErrors = {}, requestId = "local" }) {
    super(message || "Có lỗi xảy ra. Vui lòng thử lại.");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;
  if (error?.name === "AbortError") return error;
  return new ApiError({
    status: error?.status || 500,
    code: error?.code || "NETWORK_ERROR",
    message: error?.message || "Không thể kết nối máy chủ. Vui lòng thử lại.",
  });
}
