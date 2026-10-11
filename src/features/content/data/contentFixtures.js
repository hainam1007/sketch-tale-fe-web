/**
 * Contract fixture used by the content preview spike and integration tests.
 * It intentionally exercises stable page IDs, multiple roles, layered slots,
 * a missing optional audio reference, vocabulary and quiz relationships.
 */
export const multiRoleStoryFixture = {
  id: "story-contract-multi-role",
  title: "Khu vườn đom đóm",
  description: "Một câu chuyện mẫu về tình bạn và ánh sáng trong khu vườn.",
  category: "Thiên nhiên",
  status: "draft",
  coverAssetId: "asset-cover-meo",
  pagesCount: 3,
  updatedAt: "2026-09-18T08:00:00.000Z",
  revision: 1,
  publishedVersionId: null,
  draftDirty: false,
  pages: [
    {
      id: "page-contract-1",
      order: 1,
      title: "Khu vườn thức giấc",
      text: "Một giọt mưa ấm áp lăn qua khu vườn đang say ngủ.",
      backgroundAssetId: "asset-cover-meo",
      narration: "Khu vườn thức giấc khi giọt mưa đầu tiên chạm xuống.",
    },
    {
      id: "page-contract-2",
      order: 2,
      title: "Hai người bạn cùng đến",
      text: "Mầm Non và Bướm Đêm cùng lần theo ánh sáng nhỏ giữa những tán lá.",
      backgroundAssetId: "asset-seed-character",
      narration: "Hai người bạn cùng lần theo ánh sáng.",
    },
    {
      id: "page-contract-3",
      order: 3,
      title: "Ánh sáng sẻ chia",
      text: "Khu vườn bừng sáng hơn khi mỗi người bạn đều tìm thấy chỗ của mình.",
      backgroundAssetId: "asset-cover-meo",
      narration: "Mỗi người bạn góp thêm một ánh sáng nhỏ.",
    },
  ],
  roles: [
    {
      id: "role-contract-sprout",
      name: "Mầm Non",
      custom: true,
      sensitive: false,
      defaultAssetId: "asset-seed-character",
      slots: [
        { id: "slot-contract-sprout-1", pageId: "page-contract-1", x: 28, y: 54, scale: 0.9, flip: false, layer: 2 },
        { id: "slot-contract-sprout-2", pageId: "page-contract-2", x: 34, y: 58, scale: 0.75, flip: false, layer: 2 },
        { id: "slot-contract-sprout-3", pageId: "page-contract-3", x: 42, y: 56, scale: 0.82, flip: true, layer: 3 },
      ],
    },
    {
      id: "role-contract-moth",
      name: "Bướm Đêm",
      custom: true,
      sensitive: false,
      defaultAssetId: "asset-cover-meo",
      slots: [
        { id: "slot-contract-moth-1", pageId: "page-contract-2", x: 70, y: 43, scale: 0.58, flip: false, layer: 1 },
        { id: "slot-contract-moth-2", pageId: "page-contract-3", x: 69, y: 47, scale: 0.62, flip: false, layer: 1 },
      ],
    },
  ],
  vocabulary: [
    { id: "vocab-contract-1", pageId: "page-contract-1", word: "ánh sáng dịu", meaning: "Ánh sáng ấm áp, không quá chói.", audioUrl: "" },
    { id: "vocab-contract-2", pageId: "page-contract-2", word: "mầm cây", meaning: "Cây non vừa bắt đầu mọc lên.", audioUrl: "" },
  ],
  quizzes: [
    {
      id: "quiz-contract-1",
      pageId: "page-contract-3",
      question: "Điều gì giúp khu vườn sáng hơn?",
      options: ["Một người bạn", "Tất cả người bạn", "Không có ai"],
      correctIndex: 1,
      feedback: "Đúng rồi! Mỗi người bạn đều góp thêm một ánh sáng nhỏ.",
      audioUrl: "",
    },
  ],
  versions: [],
};

