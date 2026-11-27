import { moduleApiRequest } from "../../../lib/api/featureApi";

export const parentContentReportService = {
  listMine: async ({ userId, signal }) => {
    if (!userId) throw new Error("Không xác định được tài khoản phụ huynh.");
    const reports = await moduleApiRequest("parentContentReports", {
      path: `/content-reports/users/${encodeURIComponent(userId)}`,
      signal,
    });
    if (!Array.isArray(reports)) throw new Error("Backend trả danh sách báo cáo không hợp lệ.");
    return reports;
  },

  create: async ({ targetId, reason, signal }) => {
    const report = await moduleApiRequest("parentContentReports", {
      path: "/content-reports",
      method: "POST",
      body: { targetType: 1, targetId, reason: reason.trim() },
      signal,
    });
    if (!report || typeof report !== "object" || typeof report.id !== "string") {
      throw new Error("Không xác định được kết quả gửi báo cáo; hãy đối chiếu danh sách của bạn trước khi gửi lại.");
    }
    return report;
  },
};
