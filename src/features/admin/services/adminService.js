import { moduleApiRequest } from "../../../lib/api/featureApi";
import { apiRequest } from "../../../lib/api/httpClient";

function mutationBody(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function normalizeAudit(item) {
  return item && typeof item === "object" ? { ...item, action: item.auditAction ?? item.action ?? null } : item;
}

export function resolveUserFromDirectory(userId, usersMap = {}) {
  if (!userId || userId === "00000000-0000-0000-0000-000000000000") {
    return { name: "", email: "", role: "" };
  }
  const auditInfo = usersMap[String(userId).toLowerCase()];
  if (!auditInfo) return { name: "", email: "", role: "" };
  const email = auditInfo.email || "";
  const fullName = [auditInfo.firstName, auditInfo.lastName].filter((value) => typeof value === "string" && value.trim()).join(" ");
  const name = fullName || auditInfo.username || auditInfo.userName || "";
  return { name, email, role: auditInfo.role || "" };
}

function indexUserDirectory(users) {
  const usersMap = {};
  if (!Array.isArray(users)) return usersMap;
  for (const user of users) {
    if (typeof user?.id !== "string" || !user.id || user.id === "00000000-0000-0000-0000-000000000000") continue;
    usersMap[user.id.toLowerCase()] = {
      id: user.id,
      username: typeof user.username === "string" ? user.username : "",
      firstName: typeof user.firstName === "string" ? user.firstName : "",
      lastName: typeof user.lastName === "string" ? user.lastName : "",
      email: typeof user.email === "string" ? user.email : "",
      role: typeof user.role === "string" ? user.role : "",
    };
  }
  return usersMap;
}

async function loadUserDirectory(signal) {
  const response = await apiRequest({ path: "/users", signal, forceReal: true });
  return indexUserDirectory(collectionItems(response, "tài khoản"));
}

function collectionItems(response, label) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items) && (response.total == null || response.total === response.items.length) && !(response.totalPages > 1) && !response.hasNextPage) return response.items;
  throw new Error(`Backend trả danh sách ${label} không đúng định dạng.`);
}

function mapAdminUser(user, profile = null) {
  profile = user?.parentProfile ?? profile;
  if (!user || typeof user !== "object" || Array.isArray(user) || typeof user.id !== "string") {
    throw new Error("Backend trả tài khoản không có ID hợp lệ.");
  }
  const firstName = typeof user.firstName === "string" ? user.firstName.trim() : "";
  const lastName = typeof user.lastName === "string" ? user.lastName.trim() : "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || user.username || user.email || `Người dùng ${user.id.slice(0, 8)}`;
  const locked = typeof user.isLockedOut === "boolean" ? user.isLockedOut : typeof user.isLocked === "boolean" ? user.isLocked : null;
  const status = locked === null
    ? (user.status === "active" || user.status === "locked" ? user.status : "unknown")
    : locked ? "locked" : "active";
  return {
    ...user,
    id: user.id,
    userId: user.id,
    profileId: profile?.id || null,
    name,
    email: typeof user.email === "string" ? user.email : "",
    role: typeof user.role === "string" ? user.role : "",
    status,
    plan: profile ? (profile.currentPlan || profile.subscriptionPlan?.name || null) : null,
    subscriptionPlanId: profile?.subscriptionPlanId || null,
    subscriptionPlan: profile?.subscriptionPlan || null,
    remainingMonthlyCredit: profile?.remainingMonthlyCredit ?? null,
    remainingChildProfile: profile?.remainingChildProfile ?? null,
    trialPlusPlan: profile ? Boolean(profile.trialPlusPlan) : false,
    profileCreatedAt: profile?.createdAt || null,
    updatedAt: user.updatedAt || profile?.updatedAt || null,
  };
}

async function listParentProfiles(signal) {
  const response = await apiRequest({ path: "/parent-profiles", signal, forceReal: true });
  return collectionItems(response, "hồ sơ phụ huynh");
}

function indexParentProfiles(profiles) {
  return new Map(profiles.filter((profile) => typeof profile?.userId === "string").map((profile) => [profile.userId, profile]));
}

async function findParentProfile(userId, signal) {
  try {
    return { profile: indexParentProfiles(await listParentProfiles(signal)).get(userId) || null, error: null };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { profile: null, error: error.message || "Không tải được hồ sơ Parent." };
  }
}

export const adminService = {
  // 1. Quản lý tài khoản (users endpoint); hồ sơ Parent được ghép theo userId khi có.
  listUsers: async ({ search = "", plan = "all", page = 1, pageSize = 50, sort = "createdAt_desc", signal } = {}) => {
    const [usersRes, profilesRes] = await Promise.allSettled([
      apiRequest({ path: "/users", signal, forceReal: true }),
      listParentProfiles(signal),
    ]);
    if (usersRes.status === "rejected") throw usersRes.reason;
    if (profilesRes.status === "rejected" && plan !== "all") {
      throw new Error("Không thể lọc theo gói vì chưa tải được hồ sơ Parent.");
    }
    const users = collectionItems(usersRes.value, "tài khoản");
    const profiles = profilesRes.status === "fulfilled" ? profilesRes.value : [];
    const profileMap = indexParentProfiles(profiles);
    let items = users.map((item) => mapAdminUser(item, profileMap.get(item?.id)));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        String(item.username || "").toLowerCase().includes(q) ||
        String(item.plan || "").toLowerCase().includes(q)
      );
    }

    if (plan && plan !== "all") {
      items = items.filter((item) => String(item.plan || "").toLowerCase() === plan.toLowerCase());
    }

    if (sort === "credit_desc") {
      items.sort((a, b) => b.remainingMonthlyCredit - a.remainingMonthlyCredit);
    } else if (sort === "credit_asc") {
      items.sort((a, b) => a.remainingMonthlyCredit - b.remainingMonthlyCredit);
    } else if (sort === "createdAt_asc") {
      items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(totalPages, Math.max(1, Number.isInteger(page) ? page : 1));
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);
    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages,
      warnings: profilesRes.status === "rejected" ? ["Chưa tải được dữ liệu gói Parent."] : [],
    };
  },

  getUser: async ({ userId, signal }) => {
    const [userRes, profileRes] = await Promise.all([
      apiRequest({ path: `/users/${encodeURIComponent(userId)}`, signal, forceReal: true }),
      findParentProfile(userId, signal),
    ]);
    const mapped = mapAdminUser(userRes, profileRes.profile);
    return { ...mapped, parentProfile: userRes.parentProfile ?? profileRes.profile, profileLookupError: profileRes.error, allowedActions: [] };
  },

  createUser: ({ payload, signal }) =>
    apiRequest({ path: "/users", method: "POST", body: { ...payload, role: ({ parent: "Parent", admin: "Admin", content_manager: "ContentManager", child: "Child" })[payload.role] || payload.role }, signal, forceReal: true }),

  updateUser: ({ userId, payload, signal }) =>
    apiRequest({ path: "/users/" + encodeURIComponent(userId), method: "PUT", body: mutationBody(payload), signal, forceReal: true }),

  toggleUserStatus: ({ userId, isLocked, reason = "", signal }) =>
    apiRequest({
      path: `/users/${encodeURIComponent(userId)}/status`,
      method: "PATCH",
      body: { isLocked: Boolean(isLocked), reason },
      signal,
      forceReal: true,
    }),

  updateParentProfilePlan: async ({ profileId, subscriptionPlanId, signal }) => {
    return apiRequest({
      path: `/parent-profiles/${encodeURIComponent(profileId)}`,
      method: "PUT",
      body: { subscriptionPlanId },
      signal,
      forceReal: true,
    });
  },

  markTrialPlanUsed: async ({ profileId, signal }) => {
    return apiRequest({
      path: `/parent-profiles/${encodeURIComponent(profileId)}/mark-trial-plan-used`,
      method: "PATCH",
      signal,
      forceReal: true,
    });
  },

  // 2. Báo cáo nội dung vi phạm (Real API /content-reports)
  listContentReports: async ({ signal } = {}) => {
    const [reportsResult, usersResult] = await Promise.allSettled([
      moduleApiRequest("adminReports", { path: "/content-reports", signal }),
      loadUserDirectory(signal),
    ]);
    if (reportsResult.status === "rejected") throw reportsResult.reason;
    const items = collectionItems(reportsResult.value, "báo cáo");
    if (items.some((item) => !item || typeof item.id !== "string")) throw new Error("Báo cáo không có ID hợp lệ.");
    const usersMap = usersResult.status === "fulfilled" ? usersResult.value : {};
    return items.map((item) => ({
      ...item,
      reporterName: resolveUserFromDirectory(item.createBy, usersMap).name,
      reporterEmail: resolveUserFromDirectory(item.createBy, usersMap).email,
    }));
  },

  getContentReport: async ({ reportId, signal }) => {
    const [reportResult, usersResult] = await Promise.allSettled([
      moduleApiRequest("adminReports", { path: `/content-reports/${encodeURIComponent(reportId)}`, signal }),
      loadUserDirectory(signal),
    ]);
    if (reportResult.status === "rejected") throw reportResult.reason;
    const item = reportResult.value;
    if (!item || typeof item !== "object" || Array.isArray(item) || item.id !== reportId) {
      throw new Error("Backend trả chi tiết báo cáo không hợp lệ.");
    }
    const usersMap = usersResult.status === "fulfilled" ? usersResult.value : {};
    const reporter = resolveUserFromDirectory(item.createBy, usersMap);
    return { ...item, reporterName: reporter.name, reporterEmail: reporter.email };
  },

  updateContentReportStatus: async ({ reportId, status, reason = "", targetType = 0, targetId, signal }) => {
    return moduleApiRequest("adminReports", {
      path: `/content-reports/${encodeURIComponent(reportId)}`,
      method: "PATCH",
      body: mutationBody({ status: Number(status), reason, targetType: Number(targetType), targetId }),
      signal,
      forceReal: true,
    });
  },

  deleteContentReport: async ({ reportId, signal }) => {
    return moduleApiRequest("adminReports", {
      path: `/content-reports/${encodeURIComponent(reportId)}`,
      method: "DELETE",
      signal,
      forceReal: true,
    });
  },

  listReports: ({ signal } = {}) => adminService.listContentReports({ signal }),
  getReport: ({ reportId, signal }) => adminService.getContentReport({ reportId, signal }),
  updateReport: ({ reportId, signal, ...payload }) => adminService.updateContentReportStatus({ reportId, signal, ...payload }),

  // 3. Nhật ký kiểm toán (Real API /audit-logs)
  listAudit: async ({ scope = "", value = "", signal } = {}) => {
    const scopes = { user: "user-id", entity: "entity-name", target: "entity-id" };
    const scopePath = scopes[scope];
    const filterValue = value.trim();
    if (!scopePath || !filterValue) {
      throw new Error("Hãy chọn phạm vi và nhập giá trị trước khi tải nhật ký.");
    }
    const path = `/audit-logs/${scopePath}/${encodeURIComponent(filterValue)}`;
    const [auditResult, usersResult] = await Promise.allSettled([
      apiRequest({ path, signal, forceReal: true }),
      loadUserDirectory(signal),
    ]);
    if (auditResult.status === "rejected") throw auditResult.reason;
    const response = auditResult.value;
    let rawItems = [];
    if (Array.isArray(response)) rawItems = response;
    else if (Array.isArray(response?.items)) rawItems = response.items;
    else throw new Error("Backend trả nhật ký thao tác không đúng định dạng.");

    const usersMap = usersResult.status === "fulfilled" ? usersResult.value : {};
    return rawItems.map((item) => {
      const normalized = normalizeAudit(item);
      const userInfo = resolveUserFromDirectory(normalized.createBy, usersMap);
      return {
        ...normalized,
        actorName: userInfo.name,
        actorEmail: userInfo.email,
        actorRole: userInfo.role,
      };
    });
  },
  getAudit: async ({ auditId, signal }) => {
    const [auditResult, usersResult] = await Promise.allSettled([
      apiRequest({ path: `/audit-logs/${encodeURIComponent(auditId)}`, signal, forceReal: true }),
      loadUserDirectory(signal),
    ]);
    if (auditResult.status === "rejected") throw auditResult.reason;
    const raw = auditResult.value;
    const normalized = normalizeAudit(raw);
    const usersMap = usersResult.status === "fulfilled" ? usersResult.value : {};
    const userInfo = resolveUserFromDirectory(normalized.createBy, usersMap);
    return {
      ...normalized,
      actorName: userInfo.name,
      actorEmail: userInfo.email,
      actorRole: userInfo.role,
    };
  },

  // 4. Nội dung hạn chế (Real API /restricted-keywords)
  listRestrictedKeywords: async ({ signal } = {}) => {
    const response = await apiRequest({ path: "/restricted-keywords", signal, forceReal: true });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items) && (response.total == null || response.total === response.items.length) && !(response.totalPages > 1) && !response.hasNextPage) return response.items;
    throw new Error("Backend trả danh sách từ khóa hạn chế không đúng định dạng.");
  },
  getRestrictedKeyword: ({ keywordId, signal }) =>
    apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, signal, forceReal: true }),
  createRestrictedKeyword: ({ payload, signal }) =>
    apiRequest({ path: "/restricted-keywords", method: "POST", body: payload, signal, forceReal: true }),
  updateRestrictedKeyword: ({ keywordId, payload, signal }) =>
    apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, method: "PATCH", body: payload, signal, forceReal: true }),
  deleteRestrictedKeyword: ({ keywordId, signal }) =>
    apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, method: "DELETE", signal, forceReal: true }),

  listRestrictions: ({ signal } = {}) => adminService.listRestrictedKeywords({ signal }),
  updateRestriction: ({ restrictionId, payload, signal }) =>
    adminService.updateRestrictedKeyword({ keywordId: restrictionId, payload, signal }),

  // 5. Subscription & Subscription Plans (Real API /subscriptions & /subscription-plans)
  listSubscriptions: async ({ signal } = {}) => {
    const response = await apiRequest({ path: "/subscriptions", signal, forceReal: true });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items) && (response.total == null || response.total === response.items.length) && !(response.totalPages > 1) && !response.hasNextPage) return response.items;
    throw new Error("Backend trả danh sách không đúng định dạng.");
  },
  getSubscription: ({ subscriptionId, signal }) =>
    apiRequest({ path: `/subscriptions/${encodeURIComponent(subscriptionId)}`, signal, forceReal: true }),
  listSubscriptionsByParent: ({ parentProfileId, signal }) =>
    apiRequest({ path: `/subscriptions/parent-profile/${encodeURIComponent(parentProfileId)}`, signal, forceReal: true }),
  listSubscriptionsByPlan: ({ planId, signal }) =>
    apiRequest({ path: `/subscriptions/subscription-plan/${encodeURIComponent(planId)}`, signal, forceReal: true }),
  listSubscriptionPlans: async ({ signal } = {}) => {
    const response = await apiRequest({ path: "/subscription-plans", signal, forceReal: true });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items) && (response.total == null || response.total === response.items.length) && !(response.totalPages > 1) && !response.hasNextPage) return response.items;
    throw new Error("Backend trả danh sách không đúng định dạng.");
  },

  // Admin overview counts; revenue and credit aggregates are not in the API yet.
  getOverview: async ({ signal } = {}) => {
    const [reportsResult, usersResult, plansResult] = await Promise.allSettled([
      apiRequest({ path: "/content-reports", signal, forceReal: true }),
      apiRequest({ path: "/users", signal, forceReal: true }),
      apiRequest({ path: "/subscription-plans", signal, forceReal: true }),
    ]);
    const readItems = (result, label) => {
      if (result.status === "rejected") return { items: null, error: result.reason?.message || "Không tải được: " + label };
      try { return { items: collectionItems(result.value, label), error: null }; }
      catch (error) { return { items: null, error: error.message }; }
    };
    const reports = readItems(reportsResult, "reports");
    const users = readItems(usersResult, "users");
    const plans = readItems(plansResult, "subscription plans");
    const errors = [["reports", reports], ["users", users], ["plans", plans]]
      .filter(([, result]) => result.error)
      .map(([section, result]) => ({ section, message: result.error }));
    const reportItems = reports.items || [];
    const planItems = plans.items || [];
    const reportsOpen = reports.items ? reportItems.filter((report) => Number(report.status) === 0).length : null;
    const reportsUnderReview = reports.items ? reportItems.filter((report) => Number(report.status) === 1).length : null;
    const activePlans = plans.items && planItems.every((plan) => typeof plan.isActive === "boolean")
      ? planItems.filter((plan) => plan.isActive).length
      : null;
    const queue = reports.items
      ? reportItems.filter((report) => [0, 1].includes(Number(report.status))).slice(0, 10).map((report) => ({
          id: report.id,
          kind: "report",
          kindLabel: ({ 0: "Báo cáo nhân vật", 1: "Báo cáo truyện", 2: "Báo cáo nội dung" })[report.targetType] || "",
          title: report.reason || "",
          meta: report.createdAt && !Number.isNaN(Date.parse(report.createdAt)) ? "Tạo lúc " + new Date(report.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "",
          status: Number(report.status) === 0 ? "open" : "under_review",
          to: "/admin/reports/" + report.id,
        }))
      : [];
    return {
      generatedAt: null,
      fetchedAt: new Date().toISOString(),
      errors,
      counts: { reportsOpen, reportsUnderReview, totalUsers: users.items?.length ?? null, activePlans },
      revenue: { total: null, growthPercent: null, subscriptionTotal: null, creditUsed: null, activeSubscriptionsCount: null, monthlyTrend: [], packages: [], recentSubscriptions: [] },
      queue,
      recentAudit: [],
    };
  },
};
