import { mockPublicService } from "./mockPublicService";
import { apiRequest } from "../../../lib/api/httpClient";
import { ApiError } from "../../../lib/api/errors";

function normalizeBackendPlan(plan) {
  const price = typeof plan.price === "number" && Number.isFinite(plan.price) ? plan.price : null;
  const styleKey = String(plan.code || plan.name || plan.id || "plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const highlights = [];
  if (Number.isInteger(plan.childProfileLimit)) highlights.push(`Tối đa ${plan.childProfileLimit} hồ sơ trẻ em`);
  if (Number.isInteger(plan.monthlyCreditLimit)) highlights.push(`${plan.monthlyCreditLimit} credit mỗi tháng`);
  if (typeof plan.accessFullStories === "boolean") highlights.push(plan.accessFullStories ? "Truy cập toàn bộ truyện" : "Thư viện truyện theo cấu hình gói");
  if (typeof plan.canExportStory === "boolean") highlights.push(plan.canExportStory ? "Có quyền xuất truyện" : "Không bao gồm quyền xuất truyện");
  if (Number.isInteger(plan.durationDays)) highlights.push(`Thời hạn ${plan.durationDays} ngày`);
  if (Number.isInteger(plan.freeTrialDays) && plan.freeTrialDays > 0) highlights.push(`Dùng thử ${plan.freeTrialDays} ngày`);
  if (!highlights.length) highlights.push("Quyền lợi chưa có thông tin từ danh mục gói.");

  return {
    id: String(plan.code || plan.id || styleKey),
    styleKey: styleKey || "plan",
    name: plan.name || "Gói SketchTale",
    price,
    currency: null,
    durationDays: Number.isInteger(plan.durationDays) ? plan.durationDays : null,
    profileLimit: Number.isInteger(plan.childProfileLimit) ? plan.childProfileLimit : null,
    monthlyCreditLimit: Number.isInteger(plan.monthlyCreditLimit) ? plan.monthlyCreditLimit : null,
    accessFullStories: typeof plan.accessFullStories === "boolean" ? plan.accessFullStories : null,
    canExportStory: typeof plan.canExportStory === "boolean" ? plan.canExportStory : null,
    freeTrialDays: Number.isInteger(plan.freeTrialDays) ? plan.freeTrialDays : null,
    highlights,
    limits: highlights,
    audience: "Quyền lợi theo cấu hình hiện tại của gói.",
    isActive: plan.isActive === true,
  };
}

async function getPlanAvailability({ signal } = {}) {
  if (import.meta.env.VITE_API_MODE !== "real") return mockPublicService.getPlanAvailability();

  const response = await apiRequest({ path: "/subscription-plans", signal });
  const rows = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(rows)) {
    throw new ApiError({
      status: 502,
      code: "PUBLIC_PLAN_RESPONSE_INVALID",
      message: "Chưa thể hiển thị danh sách gói do dữ liệu backend không đúng định dạng.",
    });
  }
  const plans = rows.filter((plan) => plan.isActive === true).map(normalizeBackendPlan).sort((left, right) => {
    if (left.price === null) return right.price === null ? 0 : 1;
    if (right.price === null) return -1;
    return left.price - right.price;
  });
  return {
    source: "backend",
    published: plans.length > 0,
    checkoutEnabled: false,
    plans,
    message: "Quyền lợi và thời hạn được đọc từ cấu hình backend. Đơn vị giá chưa được công bố; thanh toán chưa được kết nối.",
  };
}

export const publicService = {
  ...mockPublicService,
  getPlanAvailability,
};
