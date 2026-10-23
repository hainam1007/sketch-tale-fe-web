import { apiRequest } from "../../../lib/api/httpClient";

function profile(value) {
  const id = value?.id ?? value?.childProfileId;
  if (!id || typeof value.nickName !== "string")
    throw new Error("Chưa đọc được dữ liệu hồ sơ bé. Vui lòng thử lại sau.");
  return { ...value, id: String(id) };
}

export const parentProfileService = {
  async list({ signal } = {}) {
    const data = await apiRequest({
      path: "/child-profiles",
      signal,
      forceReal: true,
    });
    const items = Array.isArray(data) ? data : data?.items;
    if (!Array.isArray(items))
      throw new Error(
        "Chưa đọc được danh sách hồ sơ bé. Vui lòng thử lại sau.",
      );
    return items.map(profile);
  },
  async get({ childId, signal }) {
    return profile(
      await apiRequest({
        path: `/child-profiles/${encodeURIComponent(childId)}`,
        signal,
        forceReal: true,
      }),
    );
  },
  async update({ childId, nickName, dailyTimeLimit, dailyCharacterLimit }) {
    // Only send editable fields documented by UpdateChildProfileDto.
    await apiRequest({
      path: `/child-profiles/${encodeURIComponent(childId)}`,
      method: "PUT",
      body: { nickName, dailyTimeLimit, dailyCharacterLimit },
      forceReal: true,
    });
  },
};
