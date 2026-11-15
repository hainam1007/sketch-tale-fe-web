import { ApiError } from "../../../lib/api/errors";

export const parentSubscriptionService = {
  async listForCurrentParent() {
    throw new ApiError({
      status: 503,
      code: "PARENT_SUBSCRIPTION_OWNER_SCOPE_UNAVAILABLE",
      message: "Backend chưa xác nhận quyền đọc đăng ký gói theo tài khoản phụ huynh.",
    });
  },
};
