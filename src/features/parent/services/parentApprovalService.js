import { moduleApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";

function read(value, camel, pascal = `${camel[0].toUpperCase()}${camel.slice(1)}`) {
  return value?.[camel] ?? value?.[pascal];
}

function mapCharacter(value) {
  const id = read(value, "characterId") ?? read(value, "id");
  const childId = read(value, "childProfileId");
  if (typeof id !== "string" || typeof childId !== "string") {
    throw new ApiError({ status: 502, code: "PARENT_APPROVAL_RESPONSE_INVALID", message: "Backend trả về yêu cầu phê duyệt không đúng định dạng." });
  }
  return {
    id,
    childProfileId: childId,
    childNickName: read(value, "childNickName") ?? "",
    characterName: read(value, "characterName") ?? "",
    defaultPronoun: read(value, "defaultPronoun") ?? "",
    characterImageUrl: read(value, "finalImageUrl") ?? "",
    originalDrawingImageUrl: read(value, "originalDrawingUrl") ?? "",
    aiPromptUsed: read(value, "aiPromptUsed") ?? "",
    parentApprovalStatus: read(value, "status"),
    createdAt: read(value, "createdAt"),
  };
}

export const parentApprovalService = {
  async listCharactersForChild({ childId, signal }) {
    if (typeof childId !== "string" || !childId) {
      throw new ApiError({ status: 400, code: "CHILD_PROFILE_ID_MISSING", message: "Chưa chọn hồ sơ bé để xem nhân vật." });
    }
    const response = await moduleApiRequest("parentApprovals", {
      path: `/characters/child-profiles/${encodeURIComponent(childId)}`,
      signal,
    });
    if (!Array.isArray(response)) {
      throw new ApiError({ status: 502, code: "PARENT_CHARACTERS_RESPONSE_INVALID", message: "Backend trả về danh sách nhân vật không đúng định dạng." });
    }
    const items = response.map(mapCharacter);
    if (items.some((item) => item.childProfileId.toLowerCase() !== childId.toLowerCase())) {
      throw new ApiError({ status: 502, code: "PARENT_CHARACTERS_CHILD_MISMATCH", message: "Danh sách nhân vật không khớp hồ sơ bé đang xem." });
    }
    return items;
  },
  async list({ childId, status = "pending", signal }) {
    if (status !== "pending") return { items: [], total: 0 };
    const response = await moduleApiRequest("parentApprovals", { path: "/characters/pending-approval", signal });
    if (!Array.isArray(response)) {
      throw new ApiError({ status: 502, code: "PARENT_APPROVAL_RESPONSE_INVALID", message: "Dữ liệu phê duyệt chưa đúng định dạng. Vui lòng tải lại." });
    }
    const items = response.map(mapCharacter).filter((item) => item.childProfileId.toLowerCase() === childId.toLowerCase());
    return { items, total: items.length };
  },

  async get({ characterId, childId, signal }) {
    const response = await moduleApiRequest("parentApprovals", { path: `/characters/${encodeURIComponent(characterId)}`, signal });
    const character = mapCharacter(response);
    if (character.id.toLowerCase() !== characterId.toLowerCase() || (childId && character.childProfileId.toLowerCase() !== childId.toLowerCase())) {
      throw new ApiError({ status: 502, code: "PARENT_APPROVAL_ID_MISMATCH", message: "Chi tiết nhân vật không khớp với bé và yêu cầu đang chọn." });
    }
    return character;
  },

  updateStatus({ characterId, status }) {
    if (status !== "approved" && status !== "rejected") throw new Error("Trạng thái phê duyệt không hợp lệ.");
    return moduleApiRequest("parentApprovals", {
      path: `/characters/${encodeURIComponent(characterId)}/${status === "approved" ? "approve" : "reject"}`,
      method: "PUT",
    });
  },
};
