import { ApiError } from "../../../lib/api/errors";
import { apiRequest } from "../../../lib/api/httpClient";
import { moduleApiModes } from "../../../lib/api/featureApi";

function unavailable() {
  return new ApiError({
    status: 503,
    code: "PARENT_PROFILE_API_DISABLED",
    message:
      "API hồ sơ gia đình hiện chưa được bật trong cấu hình này.",
  });
}

function requireLiveApi() {
  if (moduleApiModes.parentProfile !== "real") throw unavailable();
}

function mapProfile(value) {
  const id = value?.id ?? value?.Id ?? value?.childProfileId ?? value?.ChildProfileId;
  const nickName = value?.nickName ?? value?.NickName;
  if (typeof id !== "string" || typeof nickName !== "string") {
    throw new ApiError({
      status: 502,
      code: "PARENT_PROFILE_RESPONSE_INVALID",
      message: "Backend trả về hồ sơ bé không đúng định dạng.",
    });
  }

  return {
    ...value,
    id,
    nickName,
    displayName: nickName,
    targetAgeGroup: value.targetAgeGroup ?? value.TargetAgeGroup ?? "",
    readingLevel: value.readingLevel ?? value.ReadingLevel ?? "",
    dailyTimeLimit: value.dailyTimeLimit ?? value.DailyTimeLimit ?? null,
    remainingTimeLimit: value.remainingTimeLimit ?? value.RemainingTimeLimit ?? null,
    dailyCharacterLimit: value.dailyCharacterLimit ?? value.DailyCharacterLimit ?? null,
    remainingCharacterLimit: value.remainingCharacterLimit ?? value.RemainingCharacterLimit ?? null,
  };
}

async function getProfile(childId, signal) {
  requireLiveApi();
  const response = await apiRequest({
    path: `/child-profiles/${encodeURIComponent(childId)}`,
    signal,
    forceReal: true,
  });
  const profile = mapProfile(response);
  if (profile.id.toLowerCase() !== childId.toLowerCase()) {
    throw new ApiError({ status: 502, code: "PARENT_PROFILE_ID_MISMATCH", message: "Backend trả về hồ sơ không đúng bé đang chọn." });
  }
  return profile;
}

export const parentProfileService = {
  async list({ user, signal } = {}) {
    requireLiveApi();
    const parentId = user?.id ?? user?.userId;
    if (typeof parentId !== "string" || !parentId.trim()) {
      throw new ApiError({
        status: 400,
        code: "PARENT_PROFILE_PARENT_ID_MISSING",
        message: "Không tìm thấy mã tài khoản phụ huynh để tải danh sách hồ sơ bé.",
      });
    }
    const query = new URLSearchParams({ parentId });
    const response = await apiRequest({ path: `/parent-profiles/child?${query}`, signal, forceReal: true });
    const rows = Array.isArray(response)
      ? response
      : response?.items ?? response?.childProfiles ?? response?.ChildProfiles;
    if (!Array.isArray(rows)) {
      throw new ApiError({ status: 502, code: "PARENT_PROFILE_LIST_INVALID", message: "Backend trả về danh sách hồ sơ bé không đúng định dạng." });
    }
    return rows.map(mapProfile);
  },
  get: ({ childId, signal }) => getProfile(childId, signal),
  async update({ childId, ...payload }) {
    requireLiveApi();
    await apiRequest({
      path: `/child-profiles/${encodeURIComponent(childId)}`,
      method: "PUT",
      body: {
        nickName: payload.nickName,
        targetAgeGroup: payload.targetAgeGroup,
        readingLevel: payload.readingLevel,
        dailyTimeLimit: payload.dailyTimeLimit,
        dailyCharacterLimit: payload.dailyCharacterLimit,
      },
      forceReal: true,
    });
    try {
      return await getProfile(childId);
    } catch {
      throw new ApiError({ status: 502, code: "PARENT_PROFILE_READ_AFTER_WRITE_FAILED", message: "Đã gửi cập nhật hồ sơ nhưng chưa tải lại được dữ liệu đã lưu. Hãy tải lại trang để kiểm tra trước khi sửa tiếp." });
    }
  },
};
