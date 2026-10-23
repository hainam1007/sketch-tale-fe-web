# Remaining operation matrix ? 2026-10-21

Current code status derived from the Swagger snapshot and the frontend working tree. Read the detailed [handoff](LUNA_API_HANDOFF_2026-10-21.md) and [plan](API_CONNECTION_PLAN_2026-10-21.md).

Legend: CONNECTED = UI calls real documented endpoint; SERVICE_ONLY = service exists without a UI consumer; UNUSED = no caller or intentionally deferred; ALTERNATIVE = frontend uses another documented endpoint. Runtime verification remains separate.

| # | Operation | Current status | Remaining work |
| --- | --- | --- | --- |
| 1 | `GET /api/audit-logs/user-id/{id}` | UNUSED | Deferred until a product consumer needs it. |
| 2 | `GET /api/audit-logs/entity-name/{name}` | UNUSED | Deferred until a product consumer needs it. |
| 3 | `GET /api/audit-logs/entity-id/{id}` | UNUSED | Deferred until a product consumer needs it. |
| 4 | `POST /api/auth/login/child` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 5 | `POST /api/auth/confirm-email` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 6 | `GET /api/auth/current-role` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 7 | `GET /api/char-types/{id}` | CONNECTED | Load the latest record before opening its edit form. |
| 8 | `GET /api/child-profiles` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 9 | `GET /api/child-profiles/{id}` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 10 | `PUT /api/child-profiles/{id}` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 11 | `GET /api/child-profiles/{id}/nickname` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 12 | `GET /api/child-profiles/{id}/target-age-group` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 13 | `GET /api/child-profiles/{id}/daily-time-limit` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 14 | `GET /api/child-profiles/{id}/daily-character-limit` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 15 | `POST /api/content-reports` | UNUSED | Confirm workflow semantics before mutation; list/detail are already read-only connected. |
| 16 | `PATCH /api/content-reports/{id}` | UNUSED | Confirm workflow semantics before mutation; list/detail are already read-only connected. |
| 17 | `DELETE /api/content-reports/{id}` | UNUSED | Confirm workflow semantics before mutation; list/detail are already read-only connected. |
| 18 | `GET /api/content-reports/users/{userId}` | UNUSED | Confirm workflow semantics before mutation; list/detail are already read-only connected. |
| 19 | `GET /api/credit-costs/{id}` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 20 | `GET /api/education-themes/{id}` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 21 | `GET /api/parent-profiles` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 22 | `GET /api/parent-profiles/{id}` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 23 | `PUT /api/parent-profiles/{id}` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 24 | `PATCH /api/parent-profiles/{id}/mark-trial-plan-used` | UNUSED | Keep real profile mode disabled until ownership and response shape are confirmed. |
| 25 | `GET /api/prohibited-themes/{id}` | CONNECTED | Load the latest record before opening its edit form. |
| 26 | `GET /api/restricted-keywords/{id}` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 27 | `GET /api/storypage-template/pages/{storyId}` | ALTERNATIVE | Continue using all-pages until the duplicate Swagger route is fixed. |
| 28 | `GET /api/storypage-template/pages/{id}` | ALTERNATIVE | Continue using all-pages until the duplicate Swagger route is fixed. |
| 29 | `GET /api/story-template/{storyId}/quizzes` | UNUSED | Deferred until a product consumer needs it. |
| 30 | `GET /api/story-quizz/{id}` | UNUSED | Deferred until a product consumer needs it. |
| 31 | `GET /api/role/{id}` | UNUSED | Deferred until a product consumer needs it. |
| 32 | `DELETE /api/story-role/{id}` | UNUSED | Confirm relation/cascade behavior before adding a destructive UI action. |
| 33 | `GET /api/story-template/stories` | CONNECTED | Parent Library lists the backend's active stories when its module is set to real. |
| 34 | `GET /api/story-template/stories/education-theme/{id}` | UNUSED | Deferred until a product consumer needs it. |
| 35 | `GET /api/subscriptions` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 36 | `POST /api/subscriptions` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 37 | `PATCH /api/subscriptions` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 38 | `GET /api/subscriptions/{id}` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 39 | `DELETE /api/subscriptions/{id}` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 40 | `GET /api/subscriptions/parent-profile/{id}` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 41 | `GET /api/subscriptions/subscription-plan/{id}` | UNUSED | Do not use CRUD as payment; verify Parent ownership before reading subscriptions. |
| 42 | `GET /api/subscription-plans/{id}` | SERVICE_ONLY | Service exists; wire only when product flow requires it. |
| 43 | `GET /api/subscription-plans/code/{plan-code}` | UNUSED | Deferred until a product consumer needs it. |
| 44 | `POST /api/upload/background-image` | UNUSED | Needs a consumer that persists the returned URL/asset ID. |
| 45 | `POST /api/upload/avatar` | UNUSED | Needs a consumer that persists the returned URL/asset ID. |
| 46 | `GET /api/story-vocabulary/{id}` | UNUSED | Deferred until a product consumer needs it. |

Total operations not called by UI: 43. Service-only and alternate routes are included; not all require a UI caller. Current totals: 68 CONNECTED, 7 SERVICE_ONLY, 34 UNUSED, 2 ALTERNATIVE (111 operations).
