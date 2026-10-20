# Đối chiếu Swagger và frontend — 19/10/2026

Đã tải Swagger trực tiếp HTTP 200: https://sketch-tale-be.onrender.com/swagger/v1/swagger.json và đối chiếu service + caller UI/hook trong working tree. Không sửa code ứng dụng hoặc snapshot baseline. Không gọi mutation/backend bằng JWT và không chạy E2E; “đã nối” dưới đây là xác minh code, chưa nghiệm thu runtime.

## Kết quả

| Trạng thái | Số operation | Ý nghĩa |
| --- | ---: | --- |
| CONNECTED | 53 | Có service gọi thật và caller UI/hook. |
| SERVICE_ONLY | 4 | Có hàm get nhưng UI dùng list, chưa gọi hàm get riêng. |
| UNUSED | 24 | Swagger có, chưa có caller; không phải tất cả đều cần cho web. |
| DEFERRED_PROFILE | 11 | Parent/Child profile có API nhưng chưa nối, chờ xử lý ownership/flow theo audit trước. |
| BLOCKED_ROUTE | 2 | Hai GET pages trùng hình dạng URL, FE dùng all-pages thay thế. |
| **Tổng** | **94** | Đếm theo method + path Swagger. |

## Phát hiện mới và ưu tiên

1. **Lệch DTO Audit:** schema `AuditLogDto` đổi `action` thành `auditAction`. `AdminAuditPage.jsx` vẫn đọc `item.action` và `detail.action`, service chưa map. Cột hành động, tìm kiếm và bộ lọc có thể sai/rỗng. Hai GET audit đã nối nhưng chưa tương thích field mới.
2. **Swagger tăng từ 93 lên 94 operation:** thêm `GET /api/auth/current-role`, chưa có caller và chưa có trong `src/lib/api/backendRoutes.js`; nếu gọi qua client hiện tại sẽ bị guard chặn. Auth hiện lấy role qua profile.
3. Phần khai báo 93 operation cũ không đổi; schema AuditLogDto thay đổi như trên. Hai GET `/storypage-template/pages/{storyId}` và `/pages/{id}` vẫn có cùng hình dạng. Lỗi ambiguous route đã ghi nhận trước; FE dùng `/all-pages/{storyId}`. Chưa gọi lại route lỗi trong lượt này.
4. Parent/Child ownership và register-child response thiếu ID là kết luận từ [backend audit trước](luna-extramax/backend-source-audit-2026-10-19.md), chưa xác minh lại source deploy hiện tại. Swagger không chứng minh quyền truy cập đã được sửa. Cần xác minh/sửa ownership và hoàn thiện ID/list scoped trước khi nối màn quản lý hồ sơ.
5. `DELETE /story-template/{id}` **đã nối cho thao tác ẩn truyện**. Chỉ DELETE page/role còn chưa có consumer; tài liệu cũ gộp story vào nhóm chưa dùng dễ gây hiểu nhầm.

## Chức năng còn thiếu contract trong Swagger

Thiếu ở đây là thiếu theo nhu cầu UI/contract frontend, không khẳng định backend không có triển khai nội bộ.

| Nhóm | Thiếu hoặc chưa đủ |
| --- | --- |
| Admin | Users/khóa tài khoản, permissions, reports/moderation workflow, overview/statistics, monitoring/job actions, system limits, topic rules. Restricted keywords và audit đã có. |
| Parent | Link tài khoản bé có sẵn/unlink; progress/dashboard; approvals/sensitive-role; thư viện cá nhân/recommendations; export/retry/download; family reports/settings; entitlement/usage tổng hợp. |
| Parent settings | Profile PUT/lookup có sẵn nên không gọi toàn bộ settings là thiếu API. Cấu hình mở rộng ngoài DTO chưa có contract; profile đang chưa nối vì ownership. |
| Subscription/payment | 7 operation subscription có sẵn nhưng chưa nối. Checkout/payment/callback, xác nhận thanh toán, renew/cancel theo nghiệp vụ thanh toán và lịch sử giao dịch chưa có contract tương ứng. Không dùng CRUD thay checkout. |
| Content editor | Reorder, page title theo overlay; slot rotation/layer/ảnh riêng; animation/timeline/keyframe/path; audio tracks/timing; quiz-page/feedback. Slot X/Y/scale/flip đã nối thật. |
| Version/publish | Revision/concurrency conflict, immutable snapshots/versions/history, validation API riêng. Preview dựng từ API, validate kiểm tra tại frontend, publish đã nối. |
| Asset library | Kho tài sản có ID/metadata/durable URL và quản lý tái sử dụng. Upload avatar/background có sẵn nhưng chưa gọi; Content upload media qua multipart story/page/role/quiz; kho asset độc lập vẫn local. |
| Content analytics | Metrics đọc truyện/quiz/completion chưa có API; số đếm truyện có thể tính từ list thật. |
| Profile chung | Chưa có update hồ sơ tài khoản chung; GET auth/profile và đổi mật khẩu đã nối. |

Public FAQ/editorial/sample local không tự động là lỗi thiếu API. Parent catalog/category hiện mock dù có API story-template/education-themes liên quan; cần adapter và chốt scope. Không tính chúng là backend hoàn toàn thiếu catalog.

Ưu tiên: sửa mapping Audit; xác minh profile ownership và register-child; nối DELETE page/role nếu UI cần; chốt lifecycle subscription, upload riêng và Parent catalog; bổ sung contract mock còn thiếu rồi kiểm thử bằng phiên đúng role. GET lookup không nhất thiết cần màn mới nếu list đã đủ.

## Bảng đủ 94 operation

Source tính từ root repo. CONNECTED không đồng nghĩa API đã chạy thành công với dữ liệu thật. DEFERRED_PROFILE bao gồm lookup/mark-trial chưa có caller; lỗi ownership cụ thể cần xem audit trước.

| Operation | Trạng thái | Source | Ghi chú |
| --- | --- | --- | --- |
| `GET /api/audit-logs` | CONNECTED | `src/features/admin/services/adminService.js` | Đã gọi thật nhưng UI chưa map action → auditAction. |
| `GET /api/audit-logs/{id}` | CONNECTED | `src/features/admin/services/adminService.js` | Đã gọi thật nhưng UI chưa map action → auditAction. |
| `GET /api/audit-logs/user-id/{id}` | UNUSED | `?` | Màn Audit hiện lọc list tại client, chưa dùng endpoint lọc riêng. |
| `GET /api/audit-logs/entity-name/{name}` | UNUSED | `?` | Màn Audit hiện lọc list tại client, chưa dùng endpoint lọc riêng. |
| `GET /api/audit-logs/entity-id/{id}` | UNUSED | `?` | Màn Audit hiện lọc list tại client, chưa dùng endpoint lọc riêng. |
| `POST /api/auth/register/parent` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/register/child` | CONNECTED | `src/features/auth/authService.js` | NewChildPage gọi thật; chưa đưa tài khoản mới vào list vì thiếu ID/đọc list scoped. |
| `POST /api/auth/login` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/login/child` | UNUSED | `?` | Child mobile ngoài phạm vi web hiện tại. |
| `POST /api/auth/forgot-password` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/reset-password` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/change-password` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/auth/profile` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/auth/confirm-email` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/confirm-email` | UNUSED | `?` | FE dùng GET confirm-email. |
| `POST /api/auth/resend-confirmation-email` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/auth/logout` | CONNECTED | `src/features/auth/authService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/auth/current-role` | UNUSED | `?` | API mới; chưa caller, chưa allowlist; auth hiện dùng profile. |
| `GET /api/story-pages/{pageId}/slots` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/story-pages/{pageId}/slot` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `PUT /api/story-slots/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/story-slots/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/child-profiles` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/child-profiles/{id}` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `PUT /api/child-profiles/{id}` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/child-profiles/{id}/nickname` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/child-profiles/{id}/target-age-group` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/child-profiles/{id}/daily-time-limit` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/child-profiles/{id}/daily-character-limit` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/credit-costs` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/credit-costs` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/credit-costs/{id}` | SERVICE_ONLY | `src/features/admin/services/adminCatalogService.js` | Có hàm get nhưng không thấy caller UI; UI dùng list. |
| `PATCH /api/credit-costs/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/credit-costs/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/education-themes` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/education-themes` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/education-themes/{id}` | SERVICE_ONLY | `src/features/admin/services/adminCatalogService.js` | Có hàm get nhưng không thấy caller UI; UI dùng list. |
| `PATCH /api/education-themes/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/education-themes/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/parent-profiles` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/parent-profiles/{id}` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `PUT /api/parent-profiles/{id}` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `PATCH /api/parent-profiles/{id}/mark-trial-plan-used` | DEFERRED_PROFILE | `docs/api-integration/luna-extramax/backend-source-audit-2026-10-19.md` | API có; chưa nối. Xem audit ownership trước và xác minh lại deploy. |
| `GET /api/restricted-keywords` | CONNECTED | `src/features/admin/services/adminService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/restricted-keywords` | CONNECTED | `src/features/admin/services/adminService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/restricted-keywords/{id}` | SERVICE_ONLY | `src/features/admin/services/adminService.js` | Có hàm get nhưng không thấy caller UI; UI dùng list. |
| `PATCH /api/restricted-keywords/{id}` | CONNECTED | `src/features/admin/services/adminService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/restricted-keywords/{id}` | CONNECTED | `src/features/admin/services/adminService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/storypage-template/pages/{storyId}` | BLOCKED_ROUTE | `src/features/content/services/contentService.js` | Hai GET cùng hình dạng URL; FE dùng all-pages thay thế. |
| `GET /api/storypage-template/pages/{id}` | BLOCKED_ROUTE | `src/features/content/services/contentService.js` | Hai GET cùng hình dạng URL; FE dùng all-pages thay thế. |
| `GET /api/storypage-template/all-pages/{storyId}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/storypage-template/{storyId}/page` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `PUT /api/storypage-template/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/storypage-template/story-pages/{id}` | UNUSED | `?` | Chưa có service/caller xóa role/page trong editor. |
| `GET /api/story-template/{storyId}/all-quizzes` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/story-template/{storyId}/quizzes` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `GET /api/story-quizz/{id}` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `POST /api/story-template/{storyId}/quizz` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `PUT /api/story-quiz/{id}/with-image` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/story-quiz/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/story-template/{storyId}/roles` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/story-template/{storyId}/all-roles` | CONNECTED | `src/features/content/services/assetService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/role/{id}` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `POST /api/story-template/{storyId}/role` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `PUT /api/story-role/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/story-role/{id}` | UNUSED | `?` | Chưa có service/caller xóa role/page trong editor. |
| `GET /api/story-template/all-stories` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/story-template/stories` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `GET /api/story-template/stories/education-theme/{id}` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `GET /api/story-template/stories/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/story-template` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `PUT /api/story-template/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/story-template/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Đã dùng cho hideStory/nút ẩn truyện. |
| `POST /api/story-template/{id}/publish` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/subscriptions` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `POST /api/subscriptions` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `PATCH /api/subscriptions` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `GET /api/subscriptions/{id}` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `DELETE /api/subscriptions/{id}` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `GET /api/subscriptions/parent-profile/{id}` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `GET /api/subscriptions/subscription-plan/{id}` | UNUSED | `?` | Chưa tích hợp subscription lifecycle; không thay checkout bằng CRUD. |
| `GET /api/subscription-plans` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/subscription-plans` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/subscription-plans/{id}` | SERVICE_ONLY | `src/features/admin/services/adminCatalogService.js` | Có hàm get nhưng không thấy caller UI; UI dùng list. |
| `PATCH /api/subscription-plans/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/subscription-plans/{id}` | CONNECTED | `src/features/admin/services/adminCatalogService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/subscription-plans/code/{plan-code}` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `POST /api/upload/background-image` | UNUSED | `?` | Chưa caller; media Content dùng multipart, asset library vẫn local. |
| `POST /api/upload/avatar` | UNUSED | `?` | Chưa caller; media Content dùng multipart, asset library vẫn local. |
| `GET /api/story-pages/{pageId}/vocabularies` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `POST /api/story-pages/{pageId}/vocabularies` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `GET /api/story-vocabulary/{id}` | UNUSED | `?` | Chưa có caller; có thể là lookup/endpoint thay thế hoặc ngoài scope web. |
| `PUT /api/story-vocabulary/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
| `DELETE /api/story-vocabulary/{id}` | CONNECTED | `src/features/content/services/contentService.js` | Có service real và caller UI/hook; chưa nghiệm thu live có JWT. |
