import { moduleApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";

const approvalStatusValues = Object.freeze({
  pending: 1,
  approved: 2,
  rejected: 3,
});

export const parentApprovalService = {
  async list({ childId, status = "all", page = 1, pageSize = 20, signal }) {
    const statusQuery = status === "all" ? "" : `&status=${approvalStatusValues[status]}`;
    const response = await moduleApiRequest("parentApprovals", {
      path: `/user-story-character-mappings/child/${encodeURIComponent(childId)}?page=${page}&pageSize=${pageSize}${statusQuery}`,
      signal,
    });
    if (!Array.isArray(response?.items) || !Number.isInteger(response.total) || response.total < 0 || response.items.some((item) => typeof item?.id !== "string")) {
      throw new ApiError({ status: 502, code: "PARENT_APPROVAL_RESPONSE_INVALID", message: "Dữ liệu phê duyệt chưa đúng định dạng. Vui lòng tải lại." });
    }
    return response;
  },

  updateStatus({ mappingId, status }) {
    const parentApprovalStatus = approvalStatusValues[status];
    if (!parentApprovalStatus || status === "pending") {
      throw new Error("Trạng thái phê duyệt không hợp lệ.");
    }
    return moduleApiRequest("parentApprovals", {
      path: `/user-story-character-mappings/${encodeURIComponent(mappingId)}`,
      method: "PATCH",
      body: { parentApprovalStatus },
    });
  },
};
