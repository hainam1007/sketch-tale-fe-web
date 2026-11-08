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

function parentProfileIdFrom(user) {
  const parentProfile = user?.parentProfile ?? user?.ParentProfile;
  return (
    parentProfile?.id ??
    parentProfile?.Id ??
    parentProfile?.parentProfileId ??
    parentProfile?.ParentProfileId ??
    null
  );
}

function userIdFrom(user) {
  return user?.id ?? user?.Id ?? user?.userId ?? user?.UserId ?? null;
}

export async function getParentProfileForUser(user, signal) {
  const profileId = parentProfileIdFrom(user);
  if (profileId) {
    return apiRequest({
      path: `/parent-profiles/${encodeURIComponent(profileId)}`,
      signal,
      forceReal: true,
    });
  }

  const userId = userIdFrom(user);
  if (!userId) {
    throw new ApiError({
      status: 502,
      code: "PARENT_USER_ID_MISSING",
      message: "Không tìm thấy User ID trong hồ sơ đăng nhập.",
    });
  }

  const response = await apiRequest({ path: "/parent-profiles", signal, forceReal: true });
  const profiles = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(profiles)) {
    throw new ApiError({
      status: 502,
      code: "PARENT_PROFILE_LIST_INVALID",
      message: "Backend không trả danh sách ParentProfile đúng định dạng.",
    });
  }

  const profile = profiles.find((item) => {
    const profileUserId = item?.userId ?? item?.UserId;
    return typeof profileUserId === "string" && profileUserId.toLowerCase() === String(userId).toLowerCase();
  });
  if (!profile) {
    throw new ApiError({
      status: 404,
      code: "PARENT_PROFILE_NOT_FOUND",
      message: "Không tìm thấy hồ sơ Parent gắn với tài khoản đang đăng nhập.",
    });
  }
  return profile;
}

async function getProfile(childId, signal) {
  requireLiveApi();
  const response = await apiRequest({
    path: `/child-profiles/${encodeURIComponent(childId)}`,
    signal,
    forceReal: true,
  });
  return mapProfile(response);
}

export const parentProfileService = {
  async list({ signal } = {}) {
    requireLiveApi();
    // ChildProfileController scopes this collection to the authenticated
    // parent (or returns the child's own profile). Avoid enumerating all
    // ParentProfiles and trying to infer ownership on the client.
    const response = await apiRequest({ path: "/child-profiles", signal, forceReal: true });
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
