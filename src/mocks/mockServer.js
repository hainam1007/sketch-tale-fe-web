import { ApiError } from "../lib/api/errors";
import { multiRoleStoryFixture } from "../features/content/data/contentFixtures";

const DATABASE_KEY = "sketchtale.mock.database.v1";
const SESSION_KEY = "sketchtale.session.v1";

const seedDatabase = {
  users: [
    {
      id: "user-parent-01",
      email: "parent@example.com",
      name: "Linh Nguyễn",
      role: "parent",
      plan: "Free",
      status: "active",
    },
    {
      id: "user-parent-02",
      email: "parent.pro@example.com",
      name: "Minh Trần",
      role: "parent",
      plan: "Pro",
      status: "active",
    },
    {
      id: "user-parent-03",
      email: "family@example.com",
      name: "Thảo Lê",
      role: "parent",
      plan: "Family",
      status: "active",
    },
    {
      id: "user-content-01",
      email: "content@example.com",
      name: "An Phạm",
      role: "content_manager",
      plan: "Internal",
      status: "active",
    },
    {
      id: "user-admin-01",
      email: "admin@example.com",
      name: "Quản trị SketchTale",
      role: "admin",
      plan: "Internal",
      status: "active",
    },
  ],
  passwords: {
    "parent@example.com": "parent123",
    "parent.pro@example.com": "parent123",
    "family@example.com": "family123",
    "content@example.com": "content123",
    "admin@example.com": "admin123",
  },
  children: {
    "user-parent-01": [],
    "user-parent-02": [
      {
        id: "child-minh-01",
        displayName: "Mây",
        birthDate: "2021-05-14",
        avatar: "seed",
        createdAt: "2026-09-01T08:00:00.000Z",
      },
      {
        id: "child-minh-02",
        displayName: "Nắng",
        birthDate: "2020-11-02",
        avatar: "rabbit",
        createdAt: "2026-09-02T08:00:00.000Z",
      },
    ],
    "user-parent-03": [
      {
        id: "child-family-01",
        displayName: "Bông",
        birthDate: "2022-03-18",
        avatar: "rabbit",
        createdAt: "2026-09-03T08:00:00.000Z",
      },
    ],
  },
  entitlements: {
    "user-parent-01": {
      plan: "Free",
      childProfileLimit: 1,
      usedChildProfiles: 0,
      resetAt: null,
      timezone: "Asia/Ho_Chi_Minh",
    },
    "user-parent-02": {
      plan: "Pro",
      childProfileLimit: 3,
      usedChildProfiles: 2,
      resetAt: "2026-10-01T00:00:00.000+07:00",
      timezone: "Asia/Ho_Chi_Minh",
    },
    "user-parent-03": {
      plan: "Family",
      childProfileLimit: null,
      usedChildProfiles: 1,
      resetAt: null,
      timezone: "Asia/Ho_Chi_Minh",
    },
  },
  categories: ["Thiên nhiên", "Gia đình", "Khám phá", "Cảm xúc"],
  childSettings: {
    "child-minh-01": { readingTimeLimitMinutes: 30, allowedCategories: ["Thiên nhiên", "Khám phá"], revision: 1, updatedAt: "2026-09-03T08:00:00.000Z" },
    "child-minh-02": { readingTimeLimitMinutes: null, allowedCategories: [], revision: 1, updatedAt: "2026-09-03T08:00:00.000Z" },
  },
  approvals: {
    "child-minh-01": [
      { id: "approval-character-01", kind: "character", name: "Mầm xanh", status: "pending", version: 3, revision: 3, sensitive: false, originalAssetUrl: "/images/seed.webp", proposedAssetUrl: "/images/hero.webp", description: "Phiên bản màu mới cho nhân vật chính.", updatedAt: "2026-09-12T08:00:00.000Z" },
      { id: "approval-role-01", kind: "sensitive_role", name: "Bạn đêm", status: "pending", version: 2, revision: 2, sensitive: true, permissionGranted: false, originalAssetUrl: "/images/hero.webp", proposedAssetUrl: "/images/seed.webp", description: "Vai nhạy cảm cần quyền riêng theo nhân vật.", updatedAt: "2026-09-13T08:00:00.000Z" },
    ],
    "child-minh-02": [],
  },
  library: {
    "child-minh-01": [
      { id: "library-story-01", sourceId: "story-first-spark", type: "story", title: "Hạt mầm đầu tiên", description: "Một chuyến đi nhỏ bắt đầu từ nét vẽ xanh non.", imageUrl: "/images/hero.webp", favorite: true, hidden: false, status: "ready", updatedAt: "2026-09-10T08:00:00.000Z" },
      { id: "library-character-01", type: "character", title: "Mầm xanh", description: "Nhân vật đã được duyệt để đồng hành cùng bé.", imageUrl: "/images/seed.webp", favorite: false, hidden: false, status: "approved", updatedAt: "2026-09-11T08:00:00.000Z" },
    ],
    "child-minh-02": [],
    "child-family-01": [
      { id: "library-family-story-01", sourceId: "story-first-spark", type: "story", title: "Hạt mầm đầu tiên", description: "Một chuyến đi nhỏ bắt đầu từ nét vẽ xanh non.", imageUrl: "/images/hero.webp", favorite: true, hidden: false, status: "ready", updatedAt: "2026-09-10T08:00:00.000Z" },
    ],
  },
  progress: {
    "child-minh-01": {
      ranges: {
        "7d": {
          label: "7 ngày gần đây",
          hasData: true,
          summary: { readingMinutes: 78, storiesCompleted: 3, vocabularyReviewed: 14, quizAccuracy: 86 },
          days: [
            { date: "2026-09-12", label: "12/09", readingMinutes: 12, storiesCompleted: 0, vocabularyReviewed: 2, quizAccuracy: 80 },
            { date: "2026-09-13", label: "13/09", readingMinutes: 18, storiesCompleted: 1, vocabularyReviewed: 4, quizAccuracy: 100 },
            { date: "2026-09-14", label: "14/09", readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, quizAccuracy: null },
            { date: "2026-09-15", label: "15/09", readingMinutes: 9, storiesCompleted: 0, vocabularyReviewed: 1, quizAccuracy: 67 },
            { date: "2026-09-16", label: "16/09", readingMinutes: 16, storiesCompleted: 1, vocabularyReviewed: 3, quizAccuracy: 80 },
            { date: "2026-09-17", label: "17/09", readingMinutes: 23, storiesCompleted: 1, vocabularyReviewed: 4, quizAccuracy: 100 },
            { date: "2026-09-18", label: "18/09", readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, quizAccuracy: null },
          ],
          latestActivity: { title: "Hạt mầm đầu tiên", type: "Đọc truyện", date: "2026-09-17T19:25:00.000Z" },
        },
        "30d": {
          label: "30 ngày gần đây",
          hasData: true,
          summary: { readingMinutes: 246, storiesCompleted: 8, vocabularyReviewed: 39, quizAccuracy: 84 },
          days: [
            { date: "2026-08-20", label: "20/08", readingMinutes: 21, storiesCompleted: 1, vocabularyReviewed: 5, quizAccuracy: 80 },
            { date: "2026-08-27", label: "27/08", readingMinutes: 38, storiesCompleted: 1, vocabularyReviewed: 7, quizAccuracy: 86 },
            { date: "2026-09-03", label: "03/09", readingMinutes: 32, storiesCompleted: 1, vocabularyReviewed: 6, quizAccuracy: 75 },
            { date: "2026-09-10", label: "10/09", readingMinutes: 54, storiesCompleted: 2, vocabularyReviewed: 8, quizAccuracy: 88 },
            { date: "2026-09-17", label: "17/09", readingMinutes: 23, storiesCompleted: 1, vocabularyReviewed: 4, quizAccuracy: 100 },
          ],
          latestActivity: { title: "Hạt mầm đầu tiên", type: "Đọc truyện", date: "2026-09-17T19:25:00.000Z" },
        },
      },
    },
    "child-minh-02": {
      ranges: {
        "7d": { label: "7 ngày gần đây", hasData: false, summary: { readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, quizAccuracy: null }, days: [], latestActivity: null },
        "30d": { label: "30 ngày gần đây", hasData: false, summary: { readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, quizAccuracy: null }, days: [], latestActivity: null },
      },
    },
  },
  parentDashboards: {
    "user-parent-01": {
      ranges: {
        "7d": { summary: { readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, pendingApprovals: 0 }, childHighlights: [], recentActivities: [], errors: [] },
        "30d": { summary: { readingMinutes: 0, storiesCompleted: 0, vocabularyReviewed: 0, pendingApprovals: 0 }, childHighlights: [], recentActivities: [], errors: [] },
      },
    },
    "user-parent-02": {
      ranges: {
        "7d": {
          summary: { readingMinutes: 78, storiesCompleted: 3, vocabularyReviewed: 14, pendingApprovals: 2 },
          childHighlights: [{ childId: "child-minh-01", displayName: "Mây", readingMinutes: 78, storiesCompleted: 3, lastReadAt: "2026-09-17T19:25:00.000Z" }, { childId: "child-minh-02", displayName: "Nắng", readingMinutes: 0, storiesCompleted: 0, lastReadAt: null }],
          recentActivities: [{ id: "activity-01", type: "reading", title: "Mây vừa đọc Hạt mầm đầu tiên", detail: "23 phút đọc", createdAt: "2026-09-17T19:25:00.000Z" }, { id: "activity-02", type: "approval", title: "Có 2 phiên bản đang chờ duyệt", detail: "Góc của bố mẹ", createdAt: "2026-09-17T18:10:00.000Z" }],
          errors: [],
        },
        "30d": {
          summary: { readingMinutes: 246, storiesCompleted: 8, vocabularyReviewed: 39, pendingApprovals: 2 },
          childHighlights: [{ childId: "child-minh-01", displayName: "Mây", readingMinutes: 246, storiesCompleted: 8, lastReadAt: "2026-09-17T19:25:00.000Z" }, { childId: "child-minh-02", displayName: "Nắng", readingMinutes: 0, storiesCompleted: 0, lastReadAt: null }],
          recentActivities: [{ id: "activity-01", type: "reading", title: "Mây vừa đọc Hạt mầm đầu tiên", detail: "23 phút đọc", createdAt: "2026-09-17T19:25:00.000Z" }, { id: "activity-03", type: "reading", title: "Mây đã hoàn thành 8 truyện", detail: "Trong 30 ngày gần đây", createdAt: "2026-09-17T17:00:00.000Z" }],
          errors: [],
        },
      },
    },
  },
  exports: {
    "user-parent-01": [],
    "user-parent-02": [
      {
        id: "export-pro-completed",
        childId: "child-minh-01",
        storyId: "story-first-spark",
        storyTitle: "Hạt mầm đầu tiên",
        format: "video",
        status: "completed",
        progress: 100,
        fileName: "hat-mam-dau-tien.mp4",
        downloadUrl: "/mock-downloads/hat-mam-dau-tien.mp4",
        downloadExpiresAt: "2026-10-10T00:00:00.000Z",
        error: null,
        retryable: false,
        revision: 1,
        createdAt: "2026-09-16T09:20:00.000Z",
        updatedAt: "2026-09-16T09:42:00.000Z",
      },
      {
        id: "export-pro-processing",
        childId: "child-minh-01",
        storyId: "story-first-spark",
        storyTitle: "Hạt mầm đầu tiên",
        format: "video",
        status: "processing",
        progress: 68,
        fileName: "hat-mam-dau-tien-processing.mp4",
        downloadUrl: null,
        downloadExpiresAt: null,
        error: null,
        retryable: false,
        revision: 1,
        createdAt: "2026-09-18T08:20:00.000Z",
        updatedAt: "2026-09-18T08:28:00.000Z",
      },
      {
        id: "export-pro-expired",
        childId: "child-minh-01",
        storyId: "story-first-spark",
        storyTitle: "Hạt mầm đầu tiên",
        format: "pdf",
        status: "completed",
        progress: 100,
        fileName: "hat-mam-dau-tien.pdf",
        downloadUrl: "/mock-downloads/hat-mam-dau-tien.pdf",
        downloadExpiresAt: "2026-09-01T00:00:00.000Z",
        error: null,
        retryable: true,
        revision: 2,
        createdAt: "2026-08-28T09:20:00.000Z",
        updatedAt: "2026-08-28T09:42:00.000Z",
      },
      {
        id: "export-pro-failed",
        childId: "child-minh-02",
        storyId: "story-first-spark",
        storyTitle: "Hạt mầm đầu tiên",
        format: "video",
        status: "failed",
        progress: null,
        fileName: "hat-mam-dau-tien-video.mp4",
        downloadUrl: null,
        downloadExpiresAt: null,
        error: "Provider video tạm thời không phản hồi.",
        retryable: true,
        revision: 1,
        createdAt: "2026-09-17T13:20:00.000Z",
        updatedAt: "2026-09-17T13:24:00.000Z",
      },
    ],
    "user-parent-03": [],
  },
  exportUsage: {
    "user-parent-01": { used: 0 },
    "user-parent-02": { used: 4 },
    "user-parent-03": { used: 0 },
  },
  familyReports: {
    "user-parent-01": { available: false, status: "unavailable", reason: "Báo cáo học tập Family chỉ dành cho gói Family.", settings: null, lastReport: null, deliveryStatus: "not_configured" },
    "user-parent-02": { available: false, status: "unavailable", reason: "Báo cáo học tập Family chỉ dành cho gói Family.", settings: null, lastReport: null, deliveryStatus: "not_configured" },
    "user-parent-03": {
      available: true,
      status: "ready",
      reason: null,
      settings: { enabled: true, schedule: "monthly", timezone: "Asia/Ho_Chi_Minh", revision: 1 },
      lastReport: { period: "2026-08", status: "ready", generatedAt: "2026-09-01T08:00:00.000Z", expiresAt: "2026-10-01T00:00:00.000Z", fileName: "bao-cao-gia-dinh-2026-08.pdf" },
      deliveryStatus: "backend_owned",
    },
  },
  contentStatistics: {
    ranges: {
      "7d": { summary: { publishedStories: 1, draftStories: 1, totalReads: 42, completionRate: 68, activeReaders: 12 }, topStories: [{ id: "story-first-spark", title: "Hạt mầm đầu tiên", reads: 42, completionRate: 68, status: "published" }], trend: [{ label: "12/09", reads: 4 }, { label: "14/09", reads: 7 }, { label: "16/09", reads: 13 }, { label: "18/09", reads: 18 }], errors: [] },
      "30d": { summary: { publishedStories: 1, draftStories: 2, totalReads: 126, completionRate: 71, activeReaders: 29 }, topStories: [{ id: "story-first-spark", title: "Hạt mầm đầu tiên", reads: 126, completionRate: 71, status: "published" }], trend: [{ label: "20/08", reads: 18 }, { label: "27/08", reads: 29 }, { label: "03/09", reads: 35 }, { label: "10/09", reads: 44 }], errors: [] },
    },
  },
  adminStatistics: {
    ranges: {
      "7d": { summary: { activeUsers: 4, lockedUsers: 0, characters: 12, readingMinutes: 324 }, trend: [{ label: "12/09", users: 2, characters: 1, readingMinutes: 38 }, { label: "14/09", users: 3, characters: 2, readingMinutes: 61 }, { label: "16/09", users: 4, characters: 4, readingMinutes: 98 }, { label: "18/09", users: 4, characters: 5, readingMinutes: 127 }], errors: [] },
      "30d": { summary: { activeUsers: 4, lockedUsers: 0, characters: 37, readingMinutes: 1086 }, trend: [{ label: "20/08", users: 2, characters: 5, readingMinutes: 166 }, { label: "27/08", users: 3, characters: 8, readingMinutes: 231 }, { label: "03/09", users: 4, characters: 11, readingMinutes: 305 }, { label: "10/09", users: 4, characters: 13, readingMinutes: 384 }], errors: [] },
    },
  },
  auditEvents: [
    { id: "audit-01", actor: "admin@example.com", actorName: "Quản trị SketchTale", action: "report.resolved", targetType: "report", target: "Hạt mầm đầu tiên", status: "success", createdAt: "2026-09-18T08:30:00.000Z" },
    { id: "audit-02", actor: "admin@example.com", actorName: "Quản trị SketchTale", action: "permission.updated", targetType: "user", target: "An Phạm", status: "success", createdAt: "2026-09-17T10:10:00.000Z" },
    { id: "audit-03", actor: "admin@example.com", actorName: "Quản trị SketchTale", action: "monitoring.retry", targetType: "job", target: "asset-upload-previous", status: "success", createdAt: "2026-09-16T14:00:00.000Z" },
    { id: "audit-04", actor: "content@example.com", actorName: "An Phạm", action: "story.published", targetType: "story", target: "Hạt mầm đầu tiên", status: "success", createdAt: "2026-09-14T16:20:00.000Z" },
  ],
  reports: [
    { id: "report-01", status: "open", targetType: "story", targetId: "story-first-spark", targetTitle: "Hạt mầm đầu tiên", reason: "Hình ảnh chưa khớp với nội dung page.", evidence: "Page 2 có background khác với mô tả.", reporter: "parent.pro@example.com", assignee: null, notes: [], revision: 1, createdAt: "2026-09-14T08:00:00.000Z", updatedAt: "2026-09-14T08:00:00.000Z" },
    { id: "report-02", status: "under_review", targetType: "story", targetId: "story-first-spark", targetTitle: "Hạt mầm đầu tiên", reason: "Cần xem lại narration.", evidence: "Narration ở page 1 quá ngắn.", reporter: "parent@example.com", assignee: "admin@example.com", notes: [{ text: "Đã chuyển Content Manager kiểm tra.", author: "admin@example.com", createdAt: "2026-09-15T08:00:00.000Z" }], revision: 2, createdAt: "2026-09-13T08:00:00.000Z", updatedAt: "2026-09-15T08:00:00.000Z" },
  ],
  systemLimits: { maxAssetSizeMb: 5, maxStoryPages: 12, maxSlotsPerRole: 8, aiGenerationsPerMinute: 10, parentChildProfileLimit: 5, revision: 1, updatedAt: "2026-09-10T08:00:00.000Z" },
  restrictions: [
    { id: "restriction-01", type: "keyword", value: "bạo lực", scope: "story", status: "active", reason: "Không phù hợp độ tuổi 3–6", updatedAt: "2026-09-10T08:00:00.000Z" },
    { id: "restriction-02", type: "topic", value: "nội dung kinh dị", scope: "story", status: "active", reason: "Cần kiểm duyệt thủ công", updatedAt: "2026-09-10T08:00:00.000Z" },
  ],
  monitoring: [
    { id: "job-ai-01", type: "AI generation", status: "processing", progress: 68, target: "story-first-spark / page-2", usage: "3.2s", error: null, updatedAt: "2026-09-18T08:20:00.000Z" },
    { id: "job-ai-02", type: "Asset processing", status: "failed", progress: null, target: "asset-upload-previous", usage: "—", error: "Provider timeout", updatedAt: "2026-09-18T08:15:00.000Z" },
    { id: "job-ai-03", type: "AI generation", status: "completed", progress: 100, target: "story-first-spark / page-1", usage: "2.4s", error: null, updatedAt: "2026-09-17T08:20:00.000Z" },
  ],
  assets: [
    {
      id: "asset-cover-meo",
      name: "meo-tren-trang-sach.webp",
      kind: "image",
      size: 248000,
      url: "/images/hero.webp",
      createdAt: "2026-09-05T08:00:00.000Z",
    },
    {
      id: "asset-seed-character",
      name: "nhan-vat-mam-xanh.webp",
      kind: "image",
      size: 182000,
      url: "/images/seed.webp",
      createdAt: "2026-09-06T08:00:00.000Z",
    },
  ],
  stories: [
    {
      id: "story-first-spark",
      title: "Hạt mầm đầu tiên",
      description: "Một chuyến đi nhỏ bắt đầu từ nét vẽ xanh non.",
      category: "Thiên nhiên",
      status: "published",
      coverAssetId: "asset-seed-character",
      pagesCount: 4,
      updatedAt: "2026-09-10T08:00:00.000Z",
      revision: 3,
      publishedVersionId: "version-seed-1",
      draftDirty: false,
      pages: [
        {
          id: "page-seed-1",
          order: 1,
          title: "Bắt đầu từ một hạt mầm",
          text: "Mầm xanh nằm im trong lòng đất, chờ một câu chuyện bắt đầu.",
          backgroundAssetId: "asset-seed-character",
          narration: "Mầm xanh nằm im trong lòng đất.",
        },
        {
          id: "page-seed-2",
          order: 2,
          title: "Khu vườn thức giấc",
          text: "Một giọt mưa chạm xuống. Cả khu vườn khẽ mở mắt.",
          backgroundAssetId: "asset-cover-meo",
          narration: "Một giọt mưa chạm xuống.",
        },
      ],
      roles: [
        {
          id: "role-seed",
          name: "Mầm xanh",
          custom: true,
          sensitive: false,
          defaultAssetId: "asset-seed-character",
          slots: [{ id: "slot-seed-1", pageId: "page-seed-1", x: 50, y: 55, scale: 1, flip: false, layer: 1 }],
        },
      ],
      vocabulary: [
        { id: "vocab-seed-1", pageId: "page-seed-1", word: "hạt mầm", meaning: "một hạt nhỏ có thể lớn thành cây", audioUrl: "" },
      ],
      quizzes: [
        { id: "quiz-seed-1", pageId: "page-seed-2", question: "Điều gì chạm xuống khu vườn?", options: ["Một giọt mưa", "Một chiếc lá", "Một ngôi sao"], correctIndex: 0, feedback: "Đúng rồi, một giọt mưa đã đánh thức khu vườn." },
      ],
      versions: [{ id: "version-seed-1", version: 1, publishedAt: "2026-09-10T08:00:00.000Z", revision: 2 }],
    },
    multiRoleStoryFixture,
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDatabase() {
  try {
    const stored = sessionStorage.getItem(DATABASE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Storage can be disabled in privacy mode; the in-memory seed is enough.
  }
  return clone(seedDatabase);
}

function writeDatabase(database) {
  try {
    sessionStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  } catch {
    // Keep the mock usable when storage is unavailable.
  }
}

function currentUser(database) {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    return database.users.find((user) => user.id === session.userId) || null;
  } catch {
    return null;
  }
}

function requireUser(database) {
  const user = currentUser(database);
  if (!user) {
    throw new ApiError({
      status: 401,
      code: "SESSION_REQUIRED",
      message: "Phiên làm việc đã hết. Vui lòng đăng nhập lại.",
    });
  }
  if (user.status === "locked") {
    throw new ApiError({
      status: 423,
      code: "ACCOUNT_LOCKED",
      message: "Tài khoản đang bị khóa. Liên hệ quản trị viên để được hỗ trợ.",
    });
  }
  return user;
}

function requireParent(user) {
  if (user.role !== "parent") {
    throw new ApiError({
      status: 403,
      code: "FORBIDDEN",
      message: "Tài khoản này không có quyền truy cập khu vực Parent.",
    });
  }
}

function requireRole(user, role, message) {
  if (user.role !== role) {
    throw new ApiError({ status: 403, code: "FORBIDDEN", message });
  }
}

function publicUser(user, actor) {
  const { id, email, name, role, plan, status, updatedAt } = user;
  const isSelf = actor?.id === id;
  const allowedActions = isSelf
    ? status === "locked" ? ["view", "unlock"] : ["view"]
    : ["view", "lock", "unlock", "change_role"];
  return { id, email, name, role, plan, status, updatedAt, revision: user.revision || 1, allowedActions };
}

function appendAuditEvent(database, { actor, action, targetType, target, status = "success" }) {
  database.auditEvents.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actor: actor.email,
    actorName: actor.name,
    action,
    targetType,
    target,
    status,
    createdAt: new Date().toISOString(),
  });
}

function ensureContentCollections(database) {
  database.users.forEach((user) => {
    user.status ||= "active";
    user.revision ||= 1;
  });
  database.assets ||= clone(seedDatabase.assets);
  database.stories ||= clone(seedDatabase.stories);
  database.categories ||= clone(seedDatabase.categories);
  database.childSettings ||= clone(seedDatabase.childSettings);
  database.approvals ||= clone(seedDatabase.approvals);
  database.library ||= clone(seedDatabase.library);
  database.progress ||= clone(seedDatabase.progress);
  database.parentDashboards ||= clone(seedDatabase.parentDashboards);
  database.exports ||= clone(seedDatabase.exports);
  database.exportUsage ||= clone(seedDatabase.exportUsage);
  database.familyReports ||= clone(seedDatabase.familyReports);
  database.contentStatistics ||= clone(seedDatabase.contentStatistics);
  database.adminStatistics ||= clone(seedDatabase.adminStatistics);
  database.auditEvents ||= clone(seedDatabase.auditEvents);
  database.reports ||= clone(seedDatabase.reports);
  database.systemLimits ||= clone(seedDatabase.systemLimits);
  database.restrictions ||= clone(seedDatabase.restrictions);
  database.monitoring ||= clone(seedDatabase.monitoring);
  if (!database.stories.some((story) => story.id === multiRoleStoryFixture.id)) {
    database.stories.push(clone(multiRoleStoryFixture));
  }
  Object.values(database.children).flat().forEach((child) => {
    database.childSettings[child.id] ||= { readingTimeLimitMinutes: null, allowedCategories: [], revision: 1, updatedAt: new Date().toISOString() };
    database.approvals[child.id] ||= [];
    database.library[child.id] ||= [];
  });
}

function ownedChild(database, user, childId) {
  requireParent(user);
  const children = database.children[user.id] || [];
  const child = children.find((item) => item.id === childId);
  if (child) return child;
  const belongsToAnotherAccount = Object.values(database.children).some((list) => list.some((item) => item.id === childId));
  throw new ApiError({ status: belongsToAnotherAccount ? 403 : 404, code: belongsToAnotherAccount ? "FORBIDDEN" : "NOT_FOUND", message: belongsToAnotherAccount ? "Hồ sơ này không thuộc tài khoản của bạn." : "Không tìm thấy hồ sơ bé." });
}

function validateChildSettings(body, categories) {
  const errors = {};
  const minutes = body?.readingTimeLimitMinutes;
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 180)) errors.readingTimeLimitMinutes = "Chọn số phút từ 0 đến 180 hoặc Không giới hạn.";
  if (!Array.isArray(body?.allowedCategories) || body.allowedCategories.some((category) => !categories.includes(category))) errors.allowedCategories = "Category không hợp lệ.";
  if (Object.keys(errors).length) fieldError("Cài đặt chưa hợp lệ.", errors);
}

function validateAsset(body) {
  const errors = {};
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!body?.name) errors.name = "Chọn một file ảnh.";
  if (body?.mimeType && !allowed.includes(body.mimeType)) errors.mimeType = "Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF.";
  if (!Number.isFinite(Number(body?.size)) || Number(body.size) <= 0) errors.size = "Kích thước asset chưa hợp lệ.";
  if (Number(body?.size) > 5 * 1024 * 1024) errors.size = "File ảnh tối đa 5MB.";
  if (Object.keys(errors).length) fieldError("Asset chưa hợp lệ.", errors);
}

function validateStory(body) {
  const errors = {};
  if (!body?.title?.trim()) errors.title = "Nhập tên truyện.";
  else if (body.title.trim().length > 80) errors.title = "Tên truyện tối đa 80 ký tự.";
  if (!body?.category?.trim()) errors.category = "Chọn một category.";
  if (Object.keys(errors).length) fieldError("Story chưa đủ thông tin.", errors);
}

function ensureStoryShape(story) {
  story.pages ||= [];
  story.roles ||= [];
  story.vocabulary ||= [];
  story.quizzes ||= [];
  story.versions ||= [];
  story.revision ||= 1;
  if (story.status === "published" && story.versions.length && !story.publishedVersionId) {
    story.publishedVersionId = story.versions.at(-1).id;
  }
  story.versions = story.versions.map((version) => version.snapshot ? version : { ...version, snapshot: storySnapshot(story) });
  story.draftDirty ||= false;
  story.pagesCount = story.pages.length;
  return story;
}

function storyResponse(story) {
  return clone(ensureStoryShape(story));
}

function findStory(database, storyId) {
  const index = database.stories.findIndex((story) => story.id === storyId);
  if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy story." });
  return { story: ensureStoryShape(database.stories[index]), index };
}

function mutationPayload(body = {}) {
  const { revision: _revision, ...payload } = body || {};
  return payload;
}

function assertStoryRevision(story, expectedRevision) {
  if (expectedRevision !== undefined && expectedRevision !== null && Number(expectedRevision) !== Number(story.revision)) {
    throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Story đã có thay đổi mới. Tải lại bản mới nhất trước khi lưu." });
  }
}

function storyMutation(story, { expectedRevision, publishing = false, trackDraft = true } = {}) {
  assertStoryRevision(story, expectedRevision);
  story.revision = (story.revision || 1) + 1;
  story.updatedAt = new Date().toISOString();
  story.pagesCount = story.pages?.length || 0;
  if (trackDraft && story.publishedVersionId && !publishing) story.draftDirty = true;
}

function storySnapshot(story) {
  return clone({
    title: story.title,
    description: story.description,
    category: story.category,
    coverAssetId: story.coverAssetId,
    pages: story.pages,
    roles: story.roles,
    vocabulary: story.vocabulary,
    quizzes: story.quizzes,
    revision: story.revision,
  });
}

function validatePage(body) {
  const errors = {};
  if (!body?.title?.trim()) errors.title = "Nhập tiêu đề trang.";
  if (!body?.text?.trim()) errors.text = "Nhập nội dung trang.";
  if (Object.keys(errors).length) fieldError("Trang chưa đủ thông tin.", errors);
}

function validateRole(body) {
  if (!body?.name?.trim()) fieldError("Vai chưa đủ thông tin.", { name: "Nhập tên vai." });
}

function validateVocabulary(body) {
  const errors = {};
  if (!body?.word?.trim()) errors.word = "Nhập từ vựng.";
  if (!body?.meaning?.trim()) errors.meaning = "Nhập nghĩa của từ.";
  if (!body?.pageId) errors.pageId = "Chọn trang chứa từ vựng.";
  if (Object.keys(errors).length) fieldError("Từ vựng chưa đủ thông tin.", errors);
}

function validateQuiz(body) {
  const errors = {};
  if (!body?.question?.trim()) errors.question = "Nhập câu hỏi.";
  if (!Array.isArray(body?.options) || body.options.length < 2 || body.options.some((option) => !option?.trim())) errors.options = "Cần ít nhất hai đáp án không rỗng.";
  if (!Number.isInteger(body?.correctIndex) || body.correctIndex < 0 || body.correctIndex >= body.options.length) errors.correctIndex = "Chọn đúng một đáp án.";
  if (!body?.pageId) errors.pageId = "Chọn trang chứa quiz.";
  if (Object.keys(errors).length) fieldError("Quiz chưa đủ thông tin.", errors);
}

function validateForPublish(story) {
  const errors = {};
  if (!story.title?.trim()) errors.title = "Story cần có tên.";
  if (!story.category?.trim()) errors.category = "Story cần có category.";
  if (!story.pages?.length) errors.pages = "Story cần ít nhất một trang.";
  story.pages?.forEach((page, index) => {
    if (!page.text?.trim()) errors[`pages.${index}.text`] = `Trang ${index + 1} chưa có nội dung.`;
  });
  story.roles?.forEach((role, index) => {
    role.slots?.forEach((slot, slotIndex) => {
      if (slot.x < 0 || slot.x > 100 || slot.y < 0 || slot.y > 100) errors[`roles.${index}.slots.${slotIndex}`] = "Tọa độ slot phải nằm trong khoảng 0–100.";
    });
  });
  story.quizzes?.forEach((quiz, index) => {
    if (!Number.isInteger(quiz.correctIndex)) errors[`quizzes.${index}.correctIndex`] = "Quiz cần có một đáp án đúng.";
  });
  return errors;
}

function fieldError(message, fieldErrors) {
  throw new ApiError({
    status: 422,
    code: "VALIDATION_ERROR",
    message,
    fieldErrors,
  });
}

function validateChild(body) {
  if (!body?.displayName?.trim()) {
    fieldError("Hồ sơ chưa đủ thông tin.", {
      displayName: "Nhập tên hiển thị cho bé.",
    });
  }
  if (body.displayName.trim().length > 40) {
    fieldError("Tên hiển thị quá dài.", {
      displayName: "Tên bé tối đa 40 ký tự.",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate || "")) {
    fieldError("Ngày sinh chưa đúng.", {
      birthDate: "Chọn ngày sinh hợp lệ.",
    });
  }
}

function delay(signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 160);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function childResponse(child) {
  return { ...child };
}

function exportQuota(database, user) {
  const entitlement = database.entitlements[user.id] || { plan: user.plan };
  const used = database.exportUsage[user.id]?.used || 0;
  const limit = entitlement.plan === "Family" ? null : entitlement.plan === "Pro" ? 5 : 0;
  return {
    plan: entitlement.plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetAt: entitlement.resetAt || null,
    timezone: entitlement.timezone || "Asia/Ho_Chi_Minh",
  };
}

function ownedExport(database, user, exportId) {
  requireParent(user);
  const items = database.exports[user.id] || [];
  const item = items.find((candidate) => candidate.id === exportId);
  if (!item) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy yêu cầu export." });
  return item;
}

function exportIsExpired(item) {
  return Boolean(item.downloadExpiresAt && new Date(item.downloadExpiresAt).getTime() <= Date.now());
}

export async function mockRequest({ path, method = "GET", body, signal }) {
  await delay(signal);
  const database = readDatabase();

  if (path === "/auth/login" && method === "POST") {
    const email = body?.email?.trim().toLowerCase();
    const user = database.users.find((candidate) => candidate.email === email);
    if (!user || database.passwords[email] !== body?.password) {
      throw new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu chưa đúng. Bạn có thể dùng tài khoản demo bên dưới.",
      });
    }
    if (user.status === "locked") {
      throw new ApiError({
        status: 423,
        code: "ACCOUNT_LOCKED",
        message: "Tài khoản đang bị khóa. Liên hệ quản trị viên để được hỗ trợ.",
      });
    }
    return { user: clone(user), token: `mock-${user.id}` };
  }

  if (path === "/auth/me" && method === "GET") {
    const user = requireUser(database);
    return { user: clone(user) };
  }

  if (path === "/auth/logout" && method === "POST") return { ok: true };

  const user = requireUser(database);
  ensureContentCollections(database);

  const queryString = path.includes("?") ? path.slice(path.indexOf("?") + 1) : "";
  const pathname = path.split("?")[0];

  if (pathname === "/admin/users" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem tài khoản.");
    const params = new URLSearchParams(queryString);
    const search = params.get("search")?.toLowerCase() || "";
    const role = params.get("role") || "all";
    const status = params.get("status") || "all";
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 10)));
    const sort = params.get("sort") || "name_asc";
    const items = database.users
      .filter((candidate) => !search || `${candidate.name} ${candidate.email}`.toLowerCase().includes(search))
      .filter((candidate) => role === "all" || candidate.role === role)
      .filter((candidate) => status === "all" || candidate.status === status)
      .sort((left, right) => sort === "email_asc" ? left.email.localeCompare(right.email) : left.name.localeCompare(right.name));
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { items: items.slice((page - 1) * pageSize, page * pageSize).map((item) => publicUser(item, user)), total, page, pageSize, totalPages };
  }

  const adminUserMatch = pathname.match(/^\/admin\/users\/([^/]+)$/);
  if (adminUserMatch) {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể quản lý tài khoản.");
    const targetIndex = database.users.findIndex((candidate) => candidate.id === adminUserMatch[1]);
    if (targetIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy tài khoản." });
    if (method === "GET") return publicUser(database.users[targetIndex], user);
    if (method === "PATCH") {
      if (database.users[targetIndex].id === user.id && body?.status === "locked") {
        throw new ApiError({ status: 409, code: "SELF_LOCK_NOT_ALLOWED", message: "Không thể tự khóa tài khoản quản trị đang đăng nhập." });
      }
      if (!["active", "locked"].includes(body?.status)) {
        fieldError("Trạng thái tài khoản chưa hợp lệ.", { status: "Chọn trạng thái active hoặc locked." });
      }
      const target = database.users[targetIndex];
      if (body?.revision !== undefined && body.revision !== target.revision) {
        throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Tài khoản đã được cập nhật. Hãy tải lại trước khi thao tác." });
      }
      database.users[targetIndex] = { ...target, status: body.status, revision: (target.revision || 1) + 1, updatedAt: new Date().toISOString() };
      appendAuditEvent(database, { actor: user, action: body.status === "locked" ? "user.locked" : "user.unlocked", targetType: "user", target: target.email });
      writeDatabase(database);
      return publicUser(database.users[targetIndex], user);
    }
  }

  if (pathname === "/admin/reports" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem báo cáo.");
    const params = new URLSearchParams(queryString);
    const status = params.get("status") || "all";
    const search = params.get("search")?.toLowerCase() || "";
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 10)));
    const items = database.reports
      .filter((report) => (status === "all" || report.status === status) && (!search || `${report.targetTitle} ${report.reason} ${report.reporter}`.toLowerCase().includes(search)))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { items: items.slice((page - 1) * pageSize, page * pageSize).map(clone), total, page, pageSize, totalPages };
  }

  const reportMatch = pathname.match(/^\/admin\/reports\/([^/]+)$/);
  if (reportMatch) {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xử lý báo cáo.");
    const reportIndex = database.reports.findIndex((report) => report.id === reportMatch[1]);
    if (reportIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy báo cáo." });
    if (method === "GET") return clone(database.reports[reportIndex]);
    if (method === "PATCH") {
      const report = database.reports[reportIndex];
      if (body?.revision !== undefined && body.revision !== report.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Báo cáo đã được cập nhật. Hãy tải lại trước khi xử lý." });
      const nextStatus = { start_review: "under_review", resolve: "resolved", reject: "rejected", reopen: "open" }[body?.action];
      if (!nextStatus) fieldError("Thao tác báo cáo chưa hợp lệ.", { action: "Chọn thao tác được phép." });
      const allowedActions = {
        open: ["start_review"],
        under_review: ["resolve", "reject"],
        resolved: ["reopen"],
        rejected: ["reopen"],
      }[report.status] || [];
      if (!allowedActions.includes(body.action)) {
        throw new ApiError({ status: 422, code: "INVALID_REPORT_TRANSITION", message: "Trạng thái hiện tại không cho phép thao tác này." });
      }
      report.status = nextStatus;
      report.assignee = user.email;
      if (body.note?.trim()) report.notes = [...(report.notes || []), { text: body.note.trim(), author: user.email, createdAt: new Date().toISOString() }];
      report.revision += 1;
      report.updatedAt = new Date().toISOString();
      appendAuditEvent(database, { actor: user, action: `report.${nextStatus}`, targetType: "report", target: report.targetTitle });
      writeDatabase(database);
      return clone(report);
    }
  }

  if (pathname === "/admin/permissions" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem permission.");
    return { users: database.users.map((item) => publicUser(item, user)), roles: ["parent", "content_manager", "admin"], roleCatalog: ["parent", "content_manager", "admin"] };
  }

  const permissionMatch = pathname.match(/^\/admin\/permissions\/([^/]+)$/);
  if (permissionMatch && method === "PATCH") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể sửa permission.");
    const index = database.users.findIndex((candidate) => candidate.id === permissionMatch[1]);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy tài khoản." });
    if (database.users[index].id === user.id) throw new ApiError({ status: 409, code: "SELF_ROLE_CHANGE_NOT_ALLOWED", message: "Không thể tự đổi role của tài khoản đang đăng nhập." });
    if (!["parent", "content_manager", "admin"].includes(body?.role)) fieldError("Role chưa hợp lệ.", { role: "Chọn role được server hỗ trợ." });
    if (database.users[index].role === "admin" && body.role !== "admin" && database.users.filter((candidate) => candidate.role === "admin").length === 1) throw new ApiError({ status: 409, code: "LAST_ADMIN_NOT_ALLOWED", message: "Không thể hạ role của admin cuối cùng." });
    const target = database.users[index];
    if (body?.revision !== undefined && body.revision !== target.revision) {
      throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Role đã được cập nhật. Hãy tải lại trước khi lưu." });
    }
    database.users[index] = { ...target, role: body.role, revision: (target.revision || 1) + 1, updatedAt: new Date().toISOString() };
    appendAuditEvent(database, { actor: user, action: "permission.updated", targetType: "user", target: target.name });
    writeDatabase(database);
    return publicUser(database.users[index], user);
  }

  if (pathname === "/admin/system-limits" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem giới hạn hệ thống.");
    return clone(database.systemLimits);
  }
  if (pathname === "/admin/system-limits" && method === "PATCH") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể sửa giới hạn hệ thống.");
    const numericFields = ["maxAssetSizeMb", "maxStoryPages", "maxSlotsPerRole", "aiGenerationsPerMinute", "parentChildProfileLimit"];
    const errors = {};
    numericFields.forEach((field) => { if (!Number.isInteger(body?.[field]) || body[field] <= 0) errors[field] = "Giá trị phải là số nguyên dương."; });
    if (Object.keys(errors).length) fieldError("Giới hạn chưa hợp lệ.", errors);
    if (body?.revision && body.revision !== database.systemLimits.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Giới hạn hệ thống đã thay đổi. Hãy tải lại trước khi lưu." });
    database.systemLimits = { ...database.systemLimits, ...Object.fromEntries(numericFields.map((field) => [field, body[field]])), revision: database.systemLimits.revision + 1, updatedAt: new Date().toISOString() };
    writeDatabase(database);
    return clone(database.systemLimits);
  }

  if (pathname === "/admin/restrictions" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem restrictions.");
    return { items: clone(database.restrictions) };
  }
  const restrictionMatch = pathname.match(/^\/admin\/restrictions\/([^/]+)$/);
  if (restrictionMatch && method === "PATCH") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể sửa restrictions.");
    const index = database.restrictions.findIndex((item) => item.id === restrictionMatch[1]);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy restriction." });
    if (!["active", "disabled"].includes(body?.status)) fieldError("Trạng thái restriction chưa hợp lệ.", { status: "Chọn active hoặc disabled." });
    database.restrictions[index] = { ...database.restrictions[index], status: body.status, updatedAt: new Date().toISOString() };
    writeDatabase(database);
    return clone(database.restrictions[index]);
  }

  if (pathname === "/admin/monitoring" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem monitoring.");
    return { items: clone(database.monitoring) };
  }
  const monitoringMatch = pathname.match(/^\/admin\/monitoring\/([^/]+)$/);
  if (monitoringMatch && method === "PATCH") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể thao tác monitoring.");
    const index = database.monitoring.findIndex((item) => item.id === monitoringMatch[1]);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy tác vụ monitoring." });
    const job = database.monitoring[index];
    if (body?.action === "retry" && job.status === "failed") Object.assign(job, { status: "processing", progress: 0, error: null });
    else if (body?.action === "cancel" && job.status === "processing") Object.assign(job, { status: "cancelled", error: null });
    else fieldError("Thao tác monitoring chưa hợp lệ.", { action: "Chỉ retry tác vụ failed hoặc cancel tác vụ processing." });
    job.updatedAt = new Date().toISOString();
    writeDatabase(database);
    return clone(job);
  }

  if (pathname === "/admin/statistics" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem statistics.");
    const range = new URLSearchParams(queryString).get("range") || "7d";
    const source = database.adminStatistics.ranges[range] || database.adminStatistics.ranges["7d"];
    return clone({ range, ...source });
  }

  if (pathname === "/admin/audit" && method === "GET") {
    requireRole(user, "admin", "Chỉ quản trị viên mới có thể xem audit.");
    const params = new URLSearchParams(queryString);
    const actor = params.get("actor") || "all";
    const action = params.get("action") || "all";
    const search = params.get("search")?.toLowerCase() || "";
    const range = params.get("range") || "30d";
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 10)));
    const days = range === "7d" ? 7 : range === "30d" ? 30 : null;
    const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
    const items = database.auditEvents.filter((item) => (!cutoff || new Date(item.createdAt).getTime() >= cutoff) && (actor === "all" || item.actor === actor) && (action === "all" || item.action === action) && (!search || `${item.actorName} ${item.action} ${item.target}`.toLowerCase().includes(search)));
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { range, items: clone(items.slice((page - 1) * pageSize, page * pageSize)), total, page, pageSize, totalPages, filters: { actors: [...new Set(database.auditEvents.map((item) => item.actor))], actions: [...new Set(database.auditEvents.map((item) => item.action))] } };
  }

  if (pathname === "/content/stories" && method === "GET") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xem story.");
    const params = new URLSearchParams(queryString);
    const search = params.get("search")?.toLowerCase() || "";
    const status = params.get("status") || "all";
    const category = params.get("category") || "all";
    const sort = params.get("sort") || "updated_desc";
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 10)));
    const items = database.stories
      .filter((story) => !search || `${story.title} ${story.description}`.toLowerCase().includes(search))
      .filter((story) => status === "all" || story.status === status)
      .filter((story) => category === "all" || story.category === category || story.categoryId === category)
      .sort((left, right) => {
        if (sort === "title_asc") return left.title.localeCompare(right.title);
        if (sort === "title_desc") return right.title.localeCompare(left.title);
        if (sort === "status_asc") return left.status.localeCompare(right.status);
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { items: items.slice((page - 1) * pageSize, page * pageSize).map(clone), total, page, pageSize, totalPages };
  }

  if (pathname === "/content/catalog/categories" && method === "GET") {
    requireRole(user, "content_manager", "Chi Content Manager moi co the xem category story.");
    return { items: clone(database.categories).map((category) => typeof category === "string" ? { id: category, label: category } : category) };
  }

  if (pathname === "/content/assets" && method === "GET") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xem asset.");
    return { items: clone(database.assets), total: database.assets.length };
  }

  const assetDetailMatch = pathname.match(/^\/content\/assets\/([^/]+)$/);
  if (assetDetailMatch && method === "DELETE") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xóa asset.");
    const assetIndex = database.assets.findIndex((asset) => asset.id === assetDetailMatch[1]);
    if (assetIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy asset." });
    const referenced = database.stories.some((story) => story.coverAssetId === assetDetailMatch[1] || story.pages?.some((page) => page.backgroundAssetId === assetDetailMatch[1]) || story.roles?.some((role) => role.defaultAssetId === assetDetailMatch[1] || role.slots?.some((slot) => slot.assetId === assetDetailMatch[1])));
    if (referenced) throw new ApiError({ status: 409, code: "ASSET_IN_USE", message: "Asset đang được story tham chiếu, không thể xóa." });
    const [removed] = database.assets.splice(assetIndex, 1);
    writeDatabase(database);
    return clone(removed);
  }

  if (pathname === "/content/statistics" && method === "GET") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xem statistics.");
    const range = new URLSearchParams(queryString).get("range") || "7d";
    const source = database.contentStatistics.ranges[range] || database.contentStatistics.ranges["7d"];
    return clone({ range, ...source });
  }

  if (pathname === "/content/assets" && method === "POST") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể tải asset.");
    const uploadPayload = body instanceof FormData ? {
      name: body.get("name"),
      kind: body.get("kind"),
      mimeType: body.get("mimeType"),
      size: Number(body.get("size")),
    } : body;
    validateAsset(uploadPayload);
    const asset = {
      id: `asset-upload-${Date.now()}`,
      name: uploadPayload.name,
      kind: uploadPayload.kind || "image",
      size: uploadPayload.size || 0,
      mimeType: uploadPayload.mimeType || "image/webp",
      url: "/images/hero.webp",
      createdAt: new Date().toISOString(),
    };
    database.assets.unshift(asset);
    writeDatabase(database);
    return clone(asset);
  }

  const storyActionMatch = pathname.match(/^\/content\/stories\/([^/]+)\/(preview|validate|publish|hide)$/);
  if (storyActionMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể thao tác story.");
    const { story } = findStory(database, storyActionMatch[1]);
    const action = storyActionMatch[2];
    if (action === "preview" && method === "GET") return storyResponse(story);
    if (action === "validate" && method === "POST") {
      assertStoryRevision(story, body?.revision);
      const errors = validateForPublish(story);
      if (Object.keys(errors).length) throw new ApiError({ status: 422, code: "PUBLISH_VALIDATION_FAILED", message: "Story chưa đủ điều kiện publish.", fieldErrors: errors });
      return { valid: true, revision: story.revision, message: "Story đã vượt qua kiểm tra publish." };
    }
    if (action === "publish" && method === "POST") {
      assertStoryRevision(story, body?.revision);
      if (body?.revision && body.revision !== story.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Story đã có thay đổi mới. Tải lại trước khi publish." });
      const errors = validateForPublish(story);
      if (Object.keys(errors).length) throw new ApiError({ status: 422, code: "PUBLISH_VALIDATION_FAILED", message: "Story chưa đủ điều kiện publish.", fieldErrors: errors });
      story.status = "published";
      storyMutation(story, { expectedRevision: body?.revision, publishing: true });
      const version = { id: `version-${Date.now()}`, version: story.versions.length + 1, publishedAt: new Date().toISOString(), revision: story.revision, snapshot: storySnapshot(story) };
      story.versions.push(version);
      story.publishedVersionId = version.id;
      story.draftDirty = false;
      writeDatabase(database);
      return storyResponse(story);
    }
    if (action === "hide" && method === "POST") {
      assertStoryRevision(story, body?.revision);
      story.status = "hidden";
      storyMutation(story, { expectedRevision: body?.revision, trackDraft: false });
      writeDatabase(database);
      return storyResponse(story);
    }
  }

  const reorderPagesMatch = pathname.match(/^\/content\/stories\/([^/]+)\/pages\/reorder$/);
  if (reorderPagesMatch && method === "PATCH") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể sắp xếp page.");
    const { story } = findStory(database, reorderPagesMatch[1]);
    assertStoryRevision(story, body?.revision);
    const pageById = new Map(story.pages.map((page) => [page.id, page]));
    if (!Array.isArray(body?.pageIds) || body.pageIds.some((id) => !pageById.has(id))) fieldError("Thứ tự page chưa hợp lệ.", { pageIds: "Danh sách page không khớp story." });
    story.pages = body.pageIds.map((id, index) => ({ ...pageById.get(id), order: index + 1 }));
    storyMutation(story, { expectedRevision: body?.revision });
    writeDatabase(database);
    return storyResponse(story);
  }

  const slotMatch = pathname.match(/^\/content\/stories\/([^/]+)\/roles\/([^/]+)\/slots(?:\/([^/]+))?$/);
  if (slotMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể quản lý slot.");
    const { story } = findStory(database, slotMatch[1]);
    const role = story.roles.find((candidate) => candidate.id === slotMatch[2]);
    if (!role) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy vai." });
    role.slots ||= [];
    if (method === "POST" && !slotMatch[3]) {
      assertStoryRevision(story, body?.revision);
      const page = story.pages.find((candidate) => candidate.id === body?.pageId);
      if (!page) fieldError("Slot chưa đủ thông tin.", { pageId: "Chọn một page có trong story." });
      const x = Number(body.x); const y = Number(body.y); const scale = Number(body.scale || 1);
      if ([x, y, scale].some((value) => !Number.isFinite(value)) || x < 0 || x > 100 || y < 0 || y > 100 || scale <= 0) fieldError("Tọa độ slot chưa hợp lệ.", { coordinates: "X/Y trong khoảng 0–100, scale lớn hơn 0." });
      role.slots.push({ id: `slot-${Date.now()}`, pageId: body.pageId, x, y, scale, flip: Boolean(body.flip), layer: Number(body.layer || 1) });
      storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
    }
    if (method === "PATCH" && slotMatch[3]) {
      assertStoryRevision(story, body?.revision);
      const slotIndex = role.slots.findIndex((slot) => slot.id === slotMatch[3]);
      if (slotIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy slot." });
      const next = { ...role.slots[slotIndex], ...mutationPayload(body) };
      const x = Number(next.x); const y = Number(next.y); const scale = Number(next.scale);
      if ([x, y, scale].some((value) => !Number.isFinite(value)) || x < 0 || x > 100 || y < 0 || y > 100 || scale <= 0) fieldError("Tọa độ slot chưa hợp lệ.", { coordinates: "X/Y trong khoảng 0–100, scale lớn hơn 0." });
      if (!story.pages.some((page) => page.id === next.pageId)) fieldError("Slot chưa hợp lệ.", { pageId: "Chọn một page có trong story." });
      role.slots[slotIndex] = { ...next, x, y, scale, flip: Boolean(next.flip), layer: Number(next.layer || 1) };
      storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
    }
    if (method === "DELETE" && slotMatch[3]) {
      assertStoryRevision(story, body?.revision);
      role.slots = role.slots.filter((slot) => slot.id !== slotMatch[3]);
      storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
    }
  }

  const pageDetailMatch = pathname.match(/^\/content\/stories\/([^/]+)\/pages\/([^/]+)$/);
  if (pageDetailMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể sửa page.");
    const { story } = findStory(database, pageDetailMatch[1]);
    const pageIndex = story.pages.findIndex((page) => page.id === pageDetailMatch[2]);
    if (pageIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy page." });
    if (method === "PATCH") { assertStoryRevision(story, body?.revision); validatePage(body); story.pages[pageIndex] = { ...story.pages[pageIndex], ...mutationPayload(body), title: body.title.trim(), text: body.text.trim() }; storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story); }
    if (method === "DELETE") { assertStoryRevision(story, body?.revision); story.pages.splice(pageIndex, 1); story.pages.forEach((page, index) => { page.order = index + 1; }); story.roles.forEach((role) => { role.slots = (role.slots || []).filter((slot) => slot.pageId !== pageDetailMatch[2]); }); storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story); }
  }

  const roleDetailMatch = pathname.match(/^\/content\/stories\/([^/]+)\/roles\/([^/]+)$/);
  if (roleDetailMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể sửa vai.");
    const { story } = findStory(database, roleDetailMatch[1]);
    const roleIndex = story.roles.findIndex((role) => role.id === roleDetailMatch[2]);
    if (roleIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy vai." });
    if (method === "PATCH") { assertStoryRevision(story, body?.revision); validateRole(body); story.roles[roleIndex] = { ...story.roles[roleIndex], ...mutationPayload(body), name: body.name.trim() }; storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story); }
    if (method === "DELETE") { assertStoryRevision(story, body?.revision); story.roles.splice(roleIndex, 1); storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story); }
  }

  const vocabularyDetailMatch = pathname.match(/^\/content\/stories\/([^/]+)\/vocabulary\/([^/]+)$/);
  if (vocabularyDetailMatch && (method === "PATCH" || method === "DELETE")) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xóa từ vựng.");
    const { story } = findStory(database, vocabularyDetailMatch[1]);
    assertStoryRevision(story, body?.revision);
    const vocabularyIndex = story.vocabulary.findIndex((item) => item.id === vocabularyDetailMatch[2]);
    if (vocabularyIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy từ vựng." });
    if (method === "PATCH") {
      validateVocabulary(body);
      story.vocabulary[vocabularyIndex] = { ...story.vocabulary[vocabularyIndex], ...mutationPayload(body), word: body.word.trim(), meaning: body.meaning.trim(), audioUrl: body.audioUrl?.trim() || "" };
    } else {
      story.vocabulary.splice(vocabularyIndex, 1);
    }
    storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
  }

  const quizDetailMatch = pathname.match(/^\/content\/stories\/([^/]+)\/quizzes\/([^/]+)$/);
  if (quizDetailMatch && (method === "PATCH" || method === "DELETE")) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể xóa quiz.");
    const { story } = findStory(database, quizDetailMatch[1]);
    assertStoryRevision(story, body?.revision);
    const quizIndex = story.quizzes.findIndex((item) => item.id === quizDetailMatch[2]);
    if (quizIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy quiz." });
    if (method === "PATCH") {
      validateQuiz(body);
      story.quizzes[quizIndex] = { ...story.quizzes[quizIndex], ...mutationPayload(body), pageId: body.pageId, question: body.question.trim(), options: body.options.map((option) => option.trim()), correctIndex: body.correctIndex, feedback: body.feedback?.trim() || "", audioUrl: body.audioUrl?.trim() || "" };
    } else {
      story.quizzes.splice(quizIndex, 1);
    }
    storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
  }

  const storyCollectionMatch = pathname.match(/^\/content\/stories\/([^/]+)\/(pages|roles|vocabulary|quizzes)$/);
  if (storyCollectionMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể quản lý nội dung story.");
    const { story } = findStory(database, storyCollectionMatch[1]);
    const collection = storyCollectionMatch[2];
    if (method === "GET") return { items: clone(story[collection]) };
    if (method === "POST") {
      assertStoryRevision(story, body?.revision);
      let item;
      if (collection === "pages") { validatePage(body); item = { id: `page-${Date.now()}`, order: story.pages.length + 1, title: body.title.trim(), text: body.text.trim(), backgroundAssetId: body.backgroundAssetId || null, narration: body.narration?.trim() || "" }; }
      if (collection === "roles") { validateRole(body); item = { id: `role-${Date.now()}`, name: body.name.trim(), custom: body.custom !== false, sensitive: Boolean(body.sensitive), defaultAssetId: body.defaultAssetId || null, slots: [] }; }
      if (collection === "vocabulary") { validateVocabulary(body); item = { id: `vocab-${Date.now()}`, pageId: body.pageId, word: body.word.trim(), meaning: body.meaning.trim(), audioUrl: body.audioUrl?.trim() || "" }; }
      if (collection === "quizzes") { validateQuiz(body); item = { id: `quiz-${Date.now()}`, pageId: body.pageId, question: body.question.trim(), options: body.options.map((option) => option.trim()), correctIndex: body.correctIndex, feedback: body.feedback?.trim() || "", audioUrl: body.audioUrl?.trim() || "" }; }
      story[collection].push(item); storyMutation(story, { expectedRevision: body?.revision }); writeDatabase(database); return storyResponse(story);
    }
  }

  const storyMatch = pathname.match(/^\/content\/stories\/([^/]+)$/);
  if (storyMatch) {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể quản lý story.");
    const storyIndex = database.stories.findIndex((story) => story.id === storyMatch[1]);
    if (storyIndex < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy story." });
    if (method === "GET") return storyResponse(database.stories[storyIndex]);
    if (method === "PATCH") {
      validateStory(body);
      const next = { ...database.stories[storyIndex], ...mutationPayload(body), title: body.title.trim() };
      storyMutation(next, { expectedRevision: body?.revision });
      database.stories[storyIndex] = next;
      writeDatabase(database);
      return storyResponse(next);
    }
  }

  if (pathname === "/content/stories" && method === "POST") {
    requireRole(user, "content_manager", "Chỉ Content Manager mới có thể tạo story.");
    validateStory(body);
    const story = {
      id: `story-${Date.now()}`,
      title: body.title.trim(),
      description: body.description?.trim() || "",
      category: body.category.trim(),
      status: "draft",
      coverAssetId: body.coverAssetId || database.assets[0]?.id || null,
      pagesCount: 0,
      revision: 1,
      pages: [],
      roles: [],
      vocabulary: [],
      quizzes: [],
      versions: [],
      publishedVersionId: null,
      draftDirty: false,
      updatedAt: new Date().toISOString(),
    };
    database.stories.unshift(story);
    writeDatabase(database);
    return storyResponse(story);
  }

  if (pathname === "/catalog/categories" && method === "GET") {
    requireParent(user);
    return { items: clone(database.categories) };
  }

  if (pathname === "/parent/dashboard" && method === "GET") {
    requireParent(user);
    const params = new URLSearchParams(queryString);
    const range = params.get("range") || "7d";
    const simulate = params.get("simulate");
    const source = database.parentDashboards[user.id] || seedDatabase.parentDashboards["user-parent-01"];
    const dashboard = clone(source.ranges[range] || source.ranges["7d"]);
    if (simulate === "recent-error") {
      dashboard.recentActivities = [];
      dashboard.errors = [{ section: "recentActivities", message: "Hoạt động gần đây tạm thời chưa tải được." }];
    }
    return { range, ...dashboard };
  }

  if (pathname === "/parent/exports" && method === "GET") {
    requireParent(user);
    const params = new URLSearchParams(queryString);
    const status = params.get("status") || "all";
    const items = (database.exports[user.id] || [])
      .filter((item) => status === "all" || item.status === status)
      .map((item) => ({ ...clone(item), downloadExpired: exportIsExpired(item) }));
    return { items, total: items.length, quota: exportQuota(database, user) };
  }

  if (pathname === "/parent/exports" && method === "POST") {
    requireParent(user);
    const child = ownedChild(database, user, body?.childId);
    const format = body?.format || "pdf";
    if (!body?.storyId || !database.stories.some((story) => story.id === body.storyId)) {
      fieldError("Không thể tạo export.", { storyId: "Story không tồn tại hoặc chưa được cấp quyền." });
    }
    if (!["pdf", "video"].includes(format)) {
      fieldError("Định dạng export chưa hợp lệ.", { format: "Chọn PDF hoặc video." });
    }
    if (format === "video" && user.plan === "Free") {
      throw new ApiError({ status: 403, code: "EXPORT_FORMAT_UNAVAILABLE", message: "Gói Free chưa hỗ trợ xuất video. Hãy chọn PDF hoặc nâng cấp gói." });
    }
    const items = database.exports[user.id] || [];
    const idempotencyKey = body?.idempotencyKey?.trim();
    const existing = idempotencyKey && items.find((item) => item.idempotencyKey === idempotencyKey);
    if (existing) return { job: clone(existing), quota: exportQuota(database, user), deduplicated: true };
    const story = database.stories.find((candidate) => candidate.id === body.storyId);
    const job = {
      id: `export-${user.id}-${Date.now()}`,
      childId: child.id,
      storyId: story.id,
      storyTitle: story.title,
      format,
      status: "queued",
      progress: 0,
      fileName: `${story.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.${format === "video" ? "mp4" : "pdf"}`,
      downloadUrl: null,
      downloadExpiresAt: null,
      error: null,
      retryable: false,
      idempotencyKey: idempotencyKey || null,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    database.exports[user.id] = [job, ...items];
    database.exportUsage[user.id] ||= { used: 0 };
    database.exportUsage[user.id].used += 1;
    writeDatabase(database);
    return { job: clone(job), quota: exportQuota(database, user), deduplicated: false };
  }

  const exportDownloadMatch = pathname.match(/^\/parent\/exports\/([^/]+)\/download$/);
  if (exportDownloadMatch && method === "GET") {
    const item = ownedExport(database, user, exportDownloadMatch[1]);
    if (item.status !== "completed") throw new ApiError({ status: 409, code: "EXPORT_NOT_READY", message: "Export chưa sẵn sàng để tải xuống." });
    if (exportIsExpired(item)) throw new ApiError({ status: 410, code: "FILE_EXPIRED", message: "Link tải đã hết hạn. Hãy tạo lại export để nhận file mới." });
    return { url: item.downloadUrl, expiresAt: item.downloadExpiresAt, fileName: item.fileName };
  }

  const exportMatch = pathname.match(/^\/parent\/exports\/([^/]+)$/);
  if (exportMatch) {
    const item = ownedExport(database, user, exportMatch[1]);
    if (method === "GET") return { ...clone(item), downloadExpired: exportIsExpired(item) };
    if (method === "PATCH") {
      if (body?.revision && body.revision !== item.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Export đã có phiên bản mới. Hãy tải lại danh sách." });
      if (body?.action !== "retry") fieldError("Thao tác export chưa hợp lệ.", { action: "Chọn retry để tạo lại file." });
      if (!(item.status === "failed" || (item.status === "completed" && exportIsExpired(item)))) {
        throw new ApiError({ status: 409, code: "EXPORT_NOT_RETRYABLE", message: "Export này chưa cần tạo lại." });
      }
      item.status = "queued";
      item.progress = 0;
      item.downloadUrl = null;
      item.downloadExpiresAt = null;
      item.error = null;
      item.retryable = false;
      item.revision += 1;
      item.updatedAt = new Date().toISOString();
      writeDatabase(database);
      return clone(item);
    }
  }

  if (pathname === "/parent/family-report" && method === "GET") {
    requireParent(user);
    return clone(database.familyReports[user.id] || { available: false, status: "unavailable", reason: "Báo cáo học tập chưa được cấu hình cho tài khoản này.", settings: null, lastReport: null, deliveryStatus: "not_configured" });
  }

  if (pathname === "/parent/family-report/settings" && method === "PATCH") {
    requireParent(user);
    const report = database.familyReports[user.id];
    if (!report?.available) throw new ApiError({ status: 403, code: "FAMILY_REPORT_UNAVAILABLE", message: report?.reason || "Báo cáo học tập Family chưa khả dụng." });
    if (body?.revision && body.revision !== report.settings.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Cài đặt báo cáo đã thay đổi. Hãy tải lại trước khi lưu." });
    if (typeof body?.enabled !== "boolean" || !["monthly", "quarterly"].includes(body?.schedule)) {
      fieldError("Cài đặt báo cáo chưa hợp lệ.", { schedule: "Chọn chu kỳ monthly hoặc quarterly.", enabled: "Chọn trạng thái bật hoặc tắt." });
    }
    report.settings = { ...report.settings, enabled: body.enabled, schedule: body.schedule, revision: report.settings.revision + 1 };
    writeDatabase(database);
    return clone(report);
  }

  const progressMatch = pathname.match(/^\/children\/([^/]+)\/progress$/);
  if (progressMatch && method === "GET") {
    ownedChild(database, user, progressMatch[1]);
    const params = new URLSearchParams(queryString);
    const range = params.get("range") || "30d";
    const progress = database.progress[progressMatch[1]] || seedDatabase.progress["child-minh-02"];
    return clone({ range, ...(progress.ranges[range] || progress.ranges["30d"]) });
  }

  const settingsMatch = pathname.match(/^\/children\/([^/]+)\/settings$/);
  if (settingsMatch) {
    ownedChild(database, user, settingsMatch[1]);
    const childId = settingsMatch[1];
    if (method === "GET") return clone({ ...database.childSettings[childId], categories: database.categories });
    if (method === "PATCH") {
      validateChildSettings(body, database.categories);
      const current = database.childSettings[childId] || { revision: 1 };
      const settings = { readingTimeLimitMinutes: body.readingTimeLimitMinutes, allowedCategories: body.allowedCategories, revision: current.revision + 1, updatedAt: new Date().toISOString() };
      database.childSettings[childId] = settings;
      writeDatabase(database);
      return clone({ ...settings, categories: database.categories });
    }
  }

  const approvalsMatch = pathname.match(/^\/children\/([^/]+)\/approvals(?:\/([^/]+))?$/);
  if (approvalsMatch) {
    ownedChild(database, user, approvalsMatch[1]);
    const childId = approvalsMatch[1];
    const approvalId = approvalsMatch[2];
    const items = database.approvals[childId] || [];
    if (method === "GET" && !approvalId) {
      const status = new URLSearchParams(queryString).get("status") || "all";
      const filtered = items.filter((item) => status === "all" || item.status === status);
      return { items: clone(filtered), total: filtered.length };
    }
    const index = items.findIndex((item) => item.id === approvalId);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy yêu cầu phê duyệt." });
    if (method === "GET") return clone(items[index]);
    if (method === "PATCH") {
      const approval = items[index];
      if (body?.revision && body.revision !== approval.revision) throw new ApiError({ status: 409, code: "REVISION_CONFLICT", message: "Yêu cầu đã có phiên bản mới. Hãy tải lại trước khi phê duyệt." });
      if (!["approve", "reject"].includes(body?.action)) fieldError("Thao tác phê duyệt chưa hợp lệ.", { action: "Chọn approve hoặc reject." });
      approval.status = body.action === "approve" ? "approved" : "rejected";
      approval.permissionGranted = approval.sensitive && body.action === "approve";
      approval.revision += 1;
      approval.reviewedBy = user.email;
      approval.reviewNote = body.note?.trim() || "";
      approval.updatedAt = new Date().toISOString();
      writeDatabase(database);
      return clone(approval);
    }
  }

  const libraryMatch = pathname.match(/^\/children\/([^/]+)\/library(?:\/([^/]+))?$/);
  if (libraryMatch) {
    ownedChild(database, user, libraryMatch[1]);
    const childId = libraryMatch[1];
    const itemId = libraryMatch[2];
    const items = database.library[childId] || [];
    if (method === "GET" && !itemId) {
      const params = new URLSearchParams(queryString);
      const type = params.get("type") || "all";
      const search = params.get("search")?.toLowerCase() || "";
      const filtered = items.filter((item) => (type === "all" || item.type === type) && (!search || `${item.title} ${item.description}`.toLowerCase().includes(search)));
      return { items: clone(filtered), total: filtered.length };
    }
    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy nội dung trong thư viện." });
    if (method === "PATCH") {
      if (!["favorite", "hide", "unhide"].includes(body?.action)) fieldError("Thao tác thư viện chưa hợp lệ.", { action: "Chọn favorite, hide hoặc unhide." });
      const item = items[index];
      if (body.action === "favorite") item.favorite = !item.favorite;
      if (body.action === "hide") item.hidden = true;
      if (body.action === "unhide") item.hidden = false;
      item.updatedAt = new Date().toISOString();
      writeDatabase(database);
      return clone(item);
    }
    if (method === "DELETE") {
      const [removed] = items.splice(index, 1);
      writeDatabase(database);
      return clone(removed);
    }
  }

  if (path === "/children" && method === "GET") {
    requireParent(user);
    const items = (database.children[user.id] || []).map(childResponse);
    return { items, total: items.length };
  }

  if (path === "/entitlements" && method === "GET") {
    requireParent(user);
    const entitlement = database.entitlements[user.id];
    return clone({
      ...entitlement,
      usedChildProfiles: (database.children[user.id] || []).length,
    });
  }

  const childMatch = path.match(/^\/children\/([^/]+)$/);
  if (childMatch) {
    requireParent(user);
    const childId = childMatch[1];
    const children = database.children[user.id] || [];
    const index = children.findIndex((child) => child.id === childId);
    if (index < 0) {
      const belongsToAnotherAccount = Object.values(database.children).some((list) =>
        list.some((child) => child.id === childId),
      );
      throw new ApiError({
        status: belongsToAnotherAccount ? 403 : 404,
        code: belongsToAnotherAccount ? "FORBIDDEN" : "NOT_FOUND",
        message: belongsToAnotherAccount
          ? "Hồ sơ này không thuộc tài khoản của bạn."
          : "Không tìm thấy hồ sơ bé.",
      });
    }
    if (method === "GET") return childResponse(children[index]);
    if (method === "PATCH") {
      validateChild(body);
      const next = {
        ...children[index],
        displayName: body.displayName.trim(),
        birthDate: body.birthDate,
        avatar: body.avatar || children[index].avatar,
        updatedAt: new Date().toISOString(),
      };
      children[index] = next;
      writeDatabase(database);
      return childResponse(next);
    }
  }

  if (path === "/children" && method === "POST") {
    requireParent(user);
    validateChild(body);
    const children = database.children[user.id] || [];
    const entitlement = database.entitlements[user.id];
    if (children.length >= entitlement.childProfileLimit) {
      throw new ApiError({
        status: 409,
        code: "CHILD_QUOTA_EXCEEDED",
        message: `Gói ${entitlement.plan} đã dùng hết số hồ sơ bé cho phép.`,
      });
    }
    const child = {
      id: `child-${user.id}-${Date.now()}`,
      displayName: body.displayName.trim(),
      birthDate: body.birthDate,
      avatar: body.avatar || "seed",
      createdAt: new Date().toISOString(),
    };
    database.children[user.id] = [...children, child];
    database.childSettings[child.id] = { readingTimeLimitMinutes: null, allowedCategories: [], revision: 1, updatedAt: new Date().toISOString() };
    database.approvals[child.id] = [];
    database.library[child.id] = [];
    writeDatabase(database);
    return childResponse(child);
  }

  throw new ApiError({ status: 404, code: "NOT_FOUND", message: "API demo không có tài nguyên này." });
}

export { SESSION_KEY };
