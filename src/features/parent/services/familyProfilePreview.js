import { featureApiModes } from "../../../lib/api/featureApi";

export const previewProfiles = [
  {
    id: "preview-may",
    name: "Mây",
    age: "6 tuổi",
    avatar: "/images/seed.webp",
    recentStory: "Khu vườn của Mây",
    readingMinutes: 46,
    storiesCompleted: 3,
  },
  {
    id: "preview-nang",
    name: "Nắng",
    age: "4 tuổi",
    avatar: "/images/rabbit.webp",
    recentStory: "Chú thỏ tìm bạn",
    readingMinutes: 32,
    storiesCompleted: 2,
  },
];

export const showFamilyProfilePreview = import.meta.env.DEV && featureApiModes.parent === "mock";
export const getFamilyProfilePreview = (childId) =>
  showFamilyProfilePreview ? previewProfiles.find((profile) => profile.id === childId) || null : null;
