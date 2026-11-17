import { ApiError } from "../../../lib/api/errors";
import { apiRequest } from "../../../lib/api/httpClient";
import { getTokenPair } from "../../../lib/api/authTokenStorage";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emptyUuid = "00000000-0000-0000-0000-000000000000";
const knownStatuses = new Set(["pending_payment", "active", "expired", "cancelled"]);

function apiError(code, message, status = 502) {
  return new ApiError({ status, code, message });
}

function field(value, camel, pascal) {
  return value?.[camel] ?? value?.[pascal];
}

function sameId(left, right) {
  return typeof left === "string" && typeof right === "string" && left.toLowerCase() === right.toLowerCase();
}

function isUsableId(value) {
  return typeof value === "string" && uuidPattern.test(value) && value.toLowerCase() !== emptyUuid;
}

function normalizeStatus(value) {
  if (Number.isInteger(value)) {
    return ["pending_payment", "active", "expired", "cancelled"][value] ?? null;
  }
  const normalized = String(value ?? "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
  return knownStatuses.has(normalized) ? normalized : null;
}

function mapSubscription(value, expectedParentProfileId) {
  const id = field(value, "id", "Id");
  const parentProfileId = field(value, "parentProfileId", "ParentProfileId");
  const status = normalizeStatus(field(value, "status", "Status"));
  const plan = field(value, "plan", "Plan");
  if (!isUsableId(id) || !sameId(parentProfileId, expectedParentProfileId)) {
    throw apiError(
      "PARENT_SUBSCRIPTION_OWNER_MISMATCH",
      "Backend trả về đăng ký không thuộc hồ sơ phụ huynh hiện tại.",
    );
  }
  if (!status) {
    throw apiError("PARENT_SUBSCRIPTION_RESPONSE_INVALID", "Backend trả về trạng thái đăng ký không hợp lệ.");
  }

  return {
    id,
    parentProfileId,
    subscriptionPlanId: field(value, "subscriptionPlanId", "SubscriptionPlanId") ?? null,
    status,
    startDate: field(value, "startDate", "StartDate") ?? null,
    endDate: field(value, "endDate", "EndDate") ?? null,
    planName: field(plan, "name", "Name") ?? null,
  };
}

function assertSameSession(initialPair) {
  const currentPair = getTokenPair();
  const same = initialPair?.sessionId
    ? currentPair?.sessionId === initialPair.sessionId
    : currentPair?.accessToken === initialPair?.accessToken;
  if (!initialPair?.accessToken || !same) {
    throw apiError("SESSION_CHANGED", "Tài khoản đã thay đổi trong lúc tải gói. Hãy tải lại trang.", 409);
  }
}

export const parentSubscriptionService = {
  async listForCurrentParent({ user, signal } = {}) {
    if (user?.role && String(user.role).toLowerCase() !== "parent") {
      throw apiError("PARENT_SUBSCRIPTION_PARENT_REQUIRED", "Chỉ tài khoản phụ huynh mới xem được đăng ký gói.", 403);
    }
    const userId = user?.id ?? user?.userId;
    if (!isUsableId(userId)) {
      throw apiError("PARENT_SUBSCRIPTION_USER_ID_MISSING", "Không tìm thấy tài khoản phụ huynh đang đăng nhập.", 400);
    }

    const initialPair = getTokenPair();
    const profileResponse = await apiRequest({ path: "/auth/profile", signal, forceReal: true });
    assertSameSession(initialPair);
    const profile = profileResponse?.user ?? profileResponse;
    const profileUserId = field(profile, "id", "Id") ?? field(profile, "userId", "UserId");
    const profileRole = String(field(profile, "role", "Role") ?? "").toLowerCase();
    if (!sameId(profileUserId, userId) || (profileRole && profileRole !== "parent")) {
      throw apiError("PARENT_SUBSCRIPTION_PROFILE_MISMATCH", "Hồ sơ đăng nhập không khớp với phụ huynh đang xem.", 403);
    }

    const parentProfile = field(profile, "parentProfile", "ParentProfile");
    const nestedParentProfileId = field(parentProfile, "parentProfileId", "ParentProfileId");
    // In the current BE model ParentProfile.Id is the User.Id (the profile
    // repository resolves it with p.Id == userId). The DTO mapping does not
    // populate ParentProfileDto.ParentProfileId, so use the already verified
    // authenticated profile ID when that DTO field is missing or Guid.Empty.
    const parentProfileId = isUsableId(nestedParentProfileId) ? nestedParentProfileId : profileUserId;
    if (!isUsableId(parentProfileId)) {
      throw apiError("PARENT_SUBSCRIPTION_PARENT_PROFILE_MISSING", "Hồ sơ tài khoản chưa có mã ParentProfile để tải đăng ký.");
    }

    const rows = await apiRequest({
      path: `/subscriptions/parent-profile/${encodeURIComponent(parentProfileId)}`,
      signal,
      forceReal: true,
    });
    assertSameSession(initialPair);
    if (!Array.isArray(rows)) {
      throw apiError("PARENT_SUBSCRIPTION_LIST_INVALID", "Backend trả về danh sách đăng ký không đúng định dạng.");
    }
    return rows.map((row) => mapSubscription(row, parentProfileId));
  },
};
