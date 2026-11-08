import { ApiError } from "../../../lib/api/errors";
import { apiRequest } from "../../../lib/api/httpClient";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { getParentProfileForUser } from "./parentProfileService";

const statusNames = ["pending_payment", "active", "expired", "cancelled"];

function normalizeStatus(value) {
  if (Number.isInteger(value)) return statusNames[value] || "unknown";
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return statusNames.includes(normalized) ? normalized : "unknown";
}

function mapSubscription(value) {
  const id = value?.id ?? value?.Id;
  const plan = value?.plan ?? value?.Plan;
  const subscriptionPlanId = value?.subscriptionPlanId ?? value?.SubscriptionPlanId;
  if (typeof id !== "string" || typeof subscriptionPlanId !== "string") {
    throw new ApiError({
      status: 502,
      code: "PARENT_SUBSCRIPTION_RESPONSE_INVALID",
      message: "Backend trả thông tin đăng ký gói không đúng định dạng.",
    });
  }

  return {
    id,
    parentProfileId: value?.parentProfileId ?? value?.ParentProfileId ?? null,
    subscriptionPlanId,
    status: normalizeStatus(value?.status ?? value?.Status),
    startDate: value?.startDate ?? value?.StartDate ?? null,
    endDate: value?.endDate ?? value?.EndDate ?? null,
    planName: plan?.name ?? plan?.Name ?? null,
  };
}

export const parentSubscriptionService = {
  async listForCurrentParent({ user, signal } = {}) {
    if (moduleApiModes.parentSubscription !== "real") {
      throw new ApiError({
        status: 503,
        code: "PARENT_SUBSCRIPTION_API_DISABLED",
        message: "API trạng thái gói Parent chưa được bật trong cấu hình này.",
      });
    }

    const parentProfile = await getParentProfileForUser(user, signal);
    const parentProfileId =
      parentProfile?.id ??
      parentProfile?.Id ??
      parentProfile?.parentProfileId ??
      parentProfile?.ParentProfileId;
    if (!parentProfileId) {
      throw new ApiError({
        status: 502,
        code: "PARENT_PROFILE_ID_MISSING",
        message: "Không tìm thấy ParentProfile ID trong hồ sơ đăng nhập.",
      });
    }

    const response = await apiRequest({
      path: `/subscriptions/parent-profile/${encodeURIComponent(parentProfileId)}`,
      signal,
      forceReal: true,
    });
    const rows = Array.isArray(response) ? response : response?.items;
    if (!Array.isArray(rows)) {
      throw new ApiError({
        status: 502,
        code: "PARENT_SUBSCRIPTION_LIST_INVALID",
        message: "Backend không trả danh sách đăng ký gói đúng định dạng.",
      });
    }
    return rows.map(mapSubscription);
  },
};
