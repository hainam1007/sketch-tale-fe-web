import { ApiError } from "../../../lib/api/errors";
import { apiRequest } from "../../../lib/api/httpClient";
import { moduleApiModes } from "../../../lib/api/featureApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requiredCheckoutMode() {
  if (import.meta.env.VITE_API_MODE !== "real" || moduleApiModes.parentPayment !== "real") {
    throw new ApiError({
      status: 503,
      code: "PARENT_PAYMENT_API_DISABLED",
      message: "Thanh toán PayOS chưa được bật trong cấu hình hiện tại.",
    });
  }
}

function checkoutUrlFrom(response) {
  const rawUrl = response?.checkoutUrl ?? response?.CheckoutUrl;
  if (typeof rawUrl !== "string") {
    throw new ApiError({
      status: 502,
      code: "PAYMENT_CHECKOUT_URL_MISSING",
      message: "Backend chưa trả liên kết thanh toán PayOS.",
    });
  }

  let checkoutUrl;
  try {
    checkoutUrl = new URL(rawUrl);
  } catch {
    throw new ApiError({
      status: 502,
      code: "PAYMENT_CHECKOUT_URL_INVALID",
      message: "Backend trả liên kết thanh toán không hợp lệ.",
    });
  }

  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "pay.payos.vn") {
    throw new ApiError({
      status: 502,
      code: "PAYMENT_CHECKOUT_HOST_INVALID",
      message: "Liên kết thanh toán không thuộc cổng PayOS được chấp nhận.",
    });
  }

  return checkoutUrl.toString();
}

export const parentPaymentService = {
  async createCheckout({ plan, user, signal } = {}) {
    requiredCheckoutMode();

    const subscriptionPlanId = plan?.backendId;
    if (typeof subscriptionPlanId !== "string" || !uuidPattern.test(subscriptionPlanId)) {
      throw new ApiError({
        status: 400,
        code: "PAYMENT_PLAN_ID_INVALID",
        message: "Không tìm thấy mã gói hợp lệ để tạo thanh toán.",
      });
    }
    if (!Number.isFinite(plan.price) || plan.price <= 0) {
      throw new ApiError({
        status: 400,
        code: "PAYMENT_PLAN_NOT_PAYABLE",
        message: "Gói này chưa có mức giá thanh toán hợp lệ.",
      });
    }

    const buyerName = user?.fullName ?? user?.displayName ?? user?.name;
    const buyerEmail = user?.email;
    const response = await apiRequest({
      path: "/payments/create-checkout",
      method: "POST",
      body: {
        subscriptionPlanId,
        ...(typeof buyerName === "string" && buyerName.trim() && buyerName !== buyerEmail
          ? { buyerName: buyerName.trim() }
          : {}),
        ...(typeof buyerEmail === "string" && buyerEmail.trim()
          ? { buyerEmail: buyerEmail.trim() }
          : {}),
        description: `Dang ky goi ${plan.name}`.slice(0, 25),
      },
      signal,
      forceReal: true,
    });

    return { checkoutUrl: checkoutUrlFrom(response) };
  },
};
