import { ApiError } from "./errors";

// Routes from the SketchTale OpenAPI snapshot dated 2026-10-19.
// Swagger includes the /api base path; apiRequest paths do not.
// Keep this allowlist in sync so stale or mock-only paths are stopped early.
const documentedRoutes = [
  "GET /audit-logs",
  "GET /audit-logs/:id",
  "GET /audit-logs/user-id/:id",
  "GET /audit-logs/entity-name/:name",
  "GET /audit-logs/entity-id/:id",
  "POST /auth/register/parent",
  "POST /auth/register/child",
  "POST /auth/login",
  "POST /auth/login/child",
  "POST /auth/forgot-password",
  "POST /auth/reset-password",
  "POST /auth/change-password",
  "GET /auth/profile",
  "GET /auth/confirm-email",
  "POST /auth/confirm-email",
  "POST /auth/resend-confirmation-email",
  "POST /auth/logout",
  "GET /story-pages/:pageId/slots",
  "POST /story-pages/:pageId/slot",
  "PUT /story-slots/:id",
  "DELETE /story-slots/:id",
  "GET /child-profiles",
  "GET /child-profiles/:id",
  "PUT /child-profiles/:id",
  "GET /child-profiles/:id/nickname",
  "GET /child-profiles/:id/target-age-group",
  "GET /child-profiles/:id/daily-time-limit",
  "GET /child-profiles/:id/daily-character-limit",
  "GET /credit-costs",
  "POST /credit-costs",
  "GET /credit-costs/:id",
  "PATCH /credit-costs/:id",
  "DELETE /credit-costs/:id",
  "GET /education-themes",
  "POST /education-themes",
  "GET /education-themes/:id",
  "PATCH /education-themes/:id",
  "DELETE /education-themes/:id",
  "GET /restricted-keywords",
  "POST /restricted-keywords",
  "GET /restricted-keywords/:id",
  "PATCH /restricted-keywords/:id",
  "DELETE /restricted-keywords/:id",
  "GET /parent-profiles",
  "GET /parent-profiles/:id",
  "PUT /parent-profiles/:id",
  "PATCH /parent-profiles/:id/mark-trial-plan-used",
  "GET /storypage-template/pages/:storyId",
  "GET /storypage-template/pages/:id",
  "GET /storypage-template/all-pages/:storyId",
  "POST /storypage-template/:storyId/page",
  "PUT /storypage-template/:id",
  "DELETE /storypage-template/story-pages/:id",
  "GET /story-template/:storyId/all-quizzes",
  "GET /story-template/:storyId/quizzes",
  "GET /story-quizz/:id",
  "DELETE /story-quiz/:id",
  "POST /story-template/:storyId/quizz",
  "PUT /story-quiz/:id/with-image",
  "GET /story-template/:storyId/roles",
  "GET /story-template/:storyId/all-roles",
  "GET /role/:id",
  "POST /story-template/:storyId/role",
  "PUT /story-role/:id",
  "DELETE /story-role/:id",
  "GET /story-template/all-stories",
  "GET /story-template/stories",
  "GET /story-template/stories/education-theme/:id",
  "GET /story-template/stories/:id",
  "PUT /story-template/:id",
  "DELETE /story-template/:id",
  "POST /story-template",
  "POST /story-template/:id/publish",
  "GET /subscriptions",
  "POST /subscriptions",
  "PATCH /subscriptions",
  "GET /subscriptions/:id",
  "DELETE /subscriptions/:id",
  "GET /subscriptions/parent-profile/:parentProfileId",
  "GET /subscriptions/subscription-plan/:subscriptionPlanId",
  "GET /subscription-plans",
  "POST /subscription-plans",
  "GET /subscription-plans/:id",
  "PATCH /subscription-plans/:id",
  "DELETE /subscription-plans/:id",
  "GET /subscription-plans/code/:plan-code",
  "POST /upload/background-image",
  "POST /upload/avatar",
  "GET /story-pages/:pageId/vocabularies",
  "POST /story-pages/:pageId/vocabularies",
  "GET /story-vocabulary/:id",
  "PUT /story-vocabulary/:id",
  "DELETE /story-vocabulary/:id"
];

function matchesRouteTemplate(template, pathname) {
  const pattern = template
    .split("/")
    .map((part) => part.startsWith(":") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("/");
  return new RegExp(`^${pattern}$`).test(pathname);
}

export function assertDocumentedBackendRoute(method, path) {
  const pathname = String(path || "").split("?", 1)[0].replace(/\/$/, "") || "/";
  const normalizedPath = pathname.replace(/^\/api(?=\/)/, "");
  const normalizedMethod = String(method || "GET").toUpperCase();
  const isDocumented = documentedRoutes.some((route) => {
    const [routeMethod, ...routeParts] = route.split(" ");
    return routeMethod === normalizedMethod && matchesRouteTemplate(routeParts.join(" "), normalizedPath);
  });

  if (!isDocumented) {
    throw new ApiError({
      status: 501,
      code: "API_ROUTE_NOT_DOCUMENTED",
      message: `Backend chưa khai báo API ${normalizedMethod} ${normalizedPath}; request đã được chặn trước khi gửi.`,
      requestId: "frontend-route-guard",
    });
  }
}
