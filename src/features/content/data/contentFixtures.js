/**
 * Contract fixture used by the content preview spike and integration tests.
 * It intentionally exercises stable page IDs, multiple roles, layered slots,
 * a missing optional audio reference, vocabulary and quiz relationships.
 */
export const multiRoleStoryFixture = {
  id: "story-contract-multi-role",
  title: "The Lantern Garden",
  description: "A multi-page story fixture for validating the Mobile content contract.",
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
      title: "The garden wakes",
      text: "A warm drop of rain rolls across the sleeping garden.",
      backgroundAssetId: "asset-cover-meo",
      narration: "The garden wakes with the first drop of rain.",
    },
    {
      id: "page-contract-2",
      order: 2,
      title: "Two friends arrive",
      text: "Sprout and Moon moth follow the little light between the leaves.",
      backgroundAssetId: "asset-seed-character",
      narration: "Two friends follow the light.",
    },
    {
      id: "page-contract-3",
      order: 3,
      title: "A shared glow",
      text: "The garden shines brighter when every friend finds a place.",
      backgroundAssetId: "asset-cover-meo",
      narration: "Every friend adds a little glow.",
    },
  ],
  roles: [
    {
      id: "role-contract-sprout",
      name: "Sprout",
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
      name: "Moon moth",
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
    { id: "vocab-contract-1", pageId: "page-contract-1", word: "glow", meaning: "a soft warm light", audioUrl: "" },
    { id: "vocab-contract-2", pageId: "page-contract-2", word: "sprout", meaning: "a young plant", audioUrl: "" },
  ],
  quizzes: [
    {
      id: "quiz-contract-1",
      pageId: "page-contract-3",
      question: "What makes the garden shine brighter?",
      options: ["One friend", "Every friend", "No one"],
      correctIndex: 1,
      feedback: "That is right. Every friend adds a little glow.",
      audioUrl: "",
    },
  ],
  versions: [],
};

