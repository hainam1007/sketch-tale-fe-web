# Swagger and frontend connection audit ? 2026-10-21

Source: [live Swagger](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json) and the saved [OpenAPI snapshot](../../artifacts/swagger-audit-2026-10-21.json). This status reflects the current working tree after the implementation in this turn. It records code paths, not successful runtime behavior.

## Current status

| Status | Operations | Meaning |
| --- | ---: | --- |
| CONNECTED | 68 | A UI/hook/HTTP flow calls a real documented endpoint. |
| SERVICE_ONLY | 7 | Service exists, with no UI consumer yet. |
| UNUSED | 34 | No real caller found, or endpoint is intentionally deferred. |
| ALTERNATIVE | 2 | Frontend uses another endpoint because Swagger routes collide. |
| **Total** | **111** | Counted by method + path. |

Newly connected in this implementation: CRUD list/create/update/delete for char-types and prohibited-themes; read-only list/detail for content reports; soft-delete page in the content editor; audit DTO mapping from auditAction. This follow-up also connects Parent Library to active stories and loads fresh detail records before editing moderation catalog entries.

Content-report UI uses GET list/detail only. It does not expose status mutation until the live workflow semantics are verified. Parent profile operations remain deferred: the last source audit reports missing owner scoping on profile endpoints. Parent dashboard, progress, approvals, library, recommendations, exports, family reports and checkout still have missing contracts or remain mock.

The 16 routes for char-types, prohibited-themes and content-reports are now in the HTTP allowlist. Each area has its own mode; content reports inherit the Admin mode unless `VITE_ADMIN_REPORTS_API_MODE` is set, and the moderation catalogs use the configured Admin catalog mode.

## Remaining areas

| Area | Remaining work |
| --- | --- |
| Parent/Child profiles | Backend ownership and response contract must be confirmed before enabling real list/detail/update. Existing profile API implementation is marked deferred in the earlier backend audit. |
| Parent catalog/recommendation | Adapt published-story and theme catalog only after confirming response scope; recommendation API is absent. |
| Subscription lifecycle | Read-by-parent can be implemented after verifying ownership; CRUD is not checkout/payment. |
| Upload | Separate upload endpoints have no matching UI consumer that persists the returned asset on a profile/page. |
| Role delete | Backend relationship/cascade behavior needs confirmation before adding a delete action. |
| Report workflow | Status transitions and effects are not documented in Swagger; current new UI is read-only. |
| Auth/service-only/lookup endpoints | Add consumers only when product flow needs them; no coverage-only calls. |

## Full operation list

CONNECTED means a caller exists in code; it does not certify that an authenticated backend request succeeds.

| Operation | Status |
| --- | --- |
| `GET /api/audit-logs` | CONNECTED |
| `GET /api/audit-logs/{id}` | CONNECTED |
| `GET /api/audit-logs/user-id/{id}` | UNUSED |
| `GET /api/audit-logs/entity-name/{name}` | UNUSED |
| `GET /api/audit-logs/entity-id/{id}` | UNUSED |
| `POST /api/auth/register/parent` | CONNECTED |
| `POST /api/auth/register/child` | CONNECTED |
| `POST /api/auth/login` | CONNECTED |
| `POST /api/auth/login/child` | SERVICE_ONLY |
| `POST /api/auth/forgot-password` | CONNECTED |
| `POST /api/auth/reset-password` | CONNECTED |
| `POST /api/auth/change-password` | CONNECTED |
| `GET /api/auth/profile` | CONNECTED |
| `GET /api/auth/confirm-email` | CONNECTED |
| `POST /api/auth/confirm-email` | SERVICE_ONLY |
| `POST /api/auth/resend-confirmation-email` | CONNECTED |
| `POST /api/auth/logout` | CONNECTED |
| `POST /api/auth/refresh-token` | CONNECTED |
| `GET /api/auth/current-role` | SERVICE_ONLY |
| `GET /api/story-pages/{pageId}/slots` | CONNECTED |
| `POST /api/story-pages/{pageId}/slot` | CONNECTED |
| `PUT /api/story-slots/{id}` | CONNECTED |
| `DELETE /api/story-slots/{id}` | CONNECTED |
| `GET /api/char-types` | CONNECTED |
| `POST /api/char-types` | CONNECTED |
| `GET /api/char-types/{id}` | CONNECTED |
| `PATCH /api/char-types/{id}` | CONNECTED |
| `DELETE /api/char-types/{id}` | CONNECTED |
| `GET /api/child-profiles` | UNUSED |
| `GET /api/child-profiles/{id}` | UNUSED |
| `PUT /api/child-profiles/{id}` | UNUSED |
| `GET /api/child-profiles/{id}/nickname` | UNUSED |
| `GET /api/child-profiles/{id}/target-age-group` | UNUSED |
| `GET /api/child-profiles/{id}/daily-time-limit` | UNUSED |
| `GET /api/child-profiles/{id}/daily-character-limit` | UNUSED |
| `GET /api/content-reports` | CONNECTED |
| `POST /api/content-reports` | UNUSED |
| `GET /api/content-reports/{id}` | CONNECTED |
| `PATCH /api/content-reports/{id}` | UNUSED |
| `DELETE /api/content-reports/{id}` | UNUSED |
| `GET /api/content-reports/users/{userId}` | UNUSED |
| `GET /api/credit-costs` | CONNECTED |
| `POST /api/credit-costs` | CONNECTED |
| `GET /api/credit-costs/{id}` | SERVICE_ONLY |
| `PATCH /api/credit-costs/{id}` | CONNECTED |
| `DELETE /api/credit-costs/{id}` | CONNECTED |
| `GET /api/education-themes` | CONNECTED |
| `POST /api/education-themes` | CONNECTED |
| `GET /api/education-themes/{id}` | SERVICE_ONLY |
| `PATCH /api/education-themes/{id}` | CONNECTED |
| `DELETE /api/education-themes/{id}` | CONNECTED |
| `GET /api/parent-profiles` | UNUSED |
| `GET /api/parent-profiles/{id}` | UNUSED |
| `PUT /api/parent-profiles/{id}` | UNUSED |
| `PATCH /api/parent-profiles/{id}/mark-trial-plan-used` | UNUSED |
| `GET /api/prohibited-themes` | CONNECTED |
| `POST /api/prohibited-themes` | CONNECTED |
| `GET /api/prohibited-themes/{id}` | CONNECTED |
| `PATCH /api/prohibited-themes/{id}` | CONNECTED |
| `DELETE /api/prohibited-themes/{id}` | CONNECTED |
| `GET /api/restricted-keywords` | CONNECTED |
| `POST /api/restricted-keywords` | CONNECTED |
| `GET /api/restricted-keywords/{id}` | SERVICE_ONLY |
| `PATCH /api/restricted-keywords/{id}` | CONNECTED |
| `DELETE /api/restricted-keywords/{id}` | CONNECTED |
| `GET /api/storypage-template/pages/{storyId}` | ALTERNATIVE |
| `GET /api/storypage-template/pages/{id}` | ALTERNATIVE |
| `GET /api/storypage-template/all-pages/{storyId}` | CONNECTED |
| `POST /api/storypage-template/{storyId}/page` | CONNECTED |
| `PUT /api/storypage-template/{id}` | CONNECTED |
| `DELETE /api/storypage-template/story-pages/{id}` | CONNECTED |
| `GET /api/story-template/{storyId}/all-quizzes` | CONNECTED |
| `GET /api/story-template/{storyId}/quizzes` | UNUSED |
| `GET /api/story-quizz/{id}` | UNUSED |
| `POST /api/story-template/{storyId}/quizz` | CONNECTED |
| `PUT /api/story-quiz/{id}/with-image` | CONNECTED |
| `DELETE /api/story-quiz/{id}` | CONNECTED |
| `GET /api/story-template/{storyId}/roles` | CONNECTED |
| `GET /api/story-template/{storyId}/all-roles` | CONNECTED |
| `GET /api/role/{id}` | UNUSED |
| `POST /api/story-template/{storyId}/role` | CONNECTED |
| `PUT /api/story-role/{id}` | CONNECTED |
| `DELETE /api/story-role/{id}` | UNUSED |
| `GET /api/story-template/all-stories` | CONNECTED |
| `GET /api/story-template/stories` | CONNECTED |
| `GET /api/story-template/stories/education-theme/{id}` | UNUSED |
| `GET /api/story-template/stories/{id}` | CONNECTED |
| `POST /api/story-template` | CONNECTED |
| `PUT /api/story-template/{id}` | CONNECTED |
| `DELETE /api/story-template/{id}` | CONNECTED |
| `POST /api/story-template/{id}/publish` | CONNECTED |
| `GET /api/subscriptions` | UNUSED |
| `POST /api/subscriptions` | UNUSED |
| `PATCH /api/subscriptions` | UNUSED |
| `GET /api/subscriptions/{id}` | UNUSED |
| `DELETE /api/subscriptions/{id}` | UNUSED |
| `GET /api/subscriptions/parent-profile/{id}` | UNUSED |
| `GET /api/subscriptions/subscription-plan/{id}` | UNUSED |
| `GET /api/subscription-plans` | CONNECTED |
| `POST /api/subscription-plans` | CONNECTED |
| `GET /api/subscription-plans/{id}` | SERVICE_ONLY |
| `PATCH /api/subscription-plans/{id}` | CONNECTED |
| `DELETE /api/subscription-plans/{id}` | CONNECTED |
| `GET /api/subscription-plans/code/{plan-code}` | UNUSED |
| `POST /api/upload/background-image` | UNUSED |
| `POST /api/upload/avatar` | UNUSED |
| `GET /api/story-pages/{pageId}/vocabularies` | CONNECTED |
| `POST /api/story-pages/{pageId}/vocabularies` | CONNECTED |
| `GET /api/story-vocabulary/{id}` | UNUSED |
| `PUT /api/story-vocabulary/{id}` | CONNECTED |
| `DELETE /api/story-vocabulary/{id}` | CONNECTED |
