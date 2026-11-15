# Kiến trúc và cấu hình

Đối chiếu source ngày 14/11/2026. FE: React 19, Vite 8, JavaScript/JSX, React Router 7, TanStack Query, CSS, Playwright, oxlint. BE: ASP.NET Core, Application/Domain/Infrastructure, EF Core, Identity/JWT, Cloudinary, PayOS.

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/app` | Router, providers, guards, workspace layouts |
| `src/features/{auth,parent,content,admin,public}` | Pages, components, services theo nghiệp vụ |
| `src/lib/api` | HTTP/token/errors, allowlist, mode, query keys |
| `src/lib/permissions` | Chuẩn hóa role; không thay quyền BE |
| `src/mocks` | Mock capability; không thay thế khi real request lỗi |
| `tests`, `scripts` | Playwright, công cụ asset/performance |
| BE `sketch_tale.API/Controllers` | Method/path/auth/request binding |
| BE `sketch_tale.Application/{DTOs,Services,Mappings}` | Payload, nghiệp vụ, mapping/null semantics |
| BE `sketch_tale.Infrastructure/{Repositories,Migrations}` | Query scope, persistence/schema |

## Mode: mặc định khác cấu hình production

Nguồn: `src/lib/api/featureApi.js`, `httpClient.js`, `.env.example`, `.env.production`. Bảng production là file repo, chưa kiểm tra env hosting hoặc `.env.local` của máy khác.

| Biến `VITE_…` | Khi không khai báo | `.env.production` |
| --- | --- | --- |
| API_MODE | mock nếu không bằng real | real |
| CONTENT_API_MODE | theo API_MODE | real |
| PARENT_API_MODE | mock | mock |
| PARENT_PROFILE_API_MODE | theo Parent | real |
| PARENT_CATALOG_API_MODE | theo Parent | real |
| PARENT_APPROVALS_API_MODE | theo Parent | real |
| PARENT_QUIZ_RESULTS_API_MODE | disabled | disabled (14/11: own child 403) |
| PARENT_PAYMENT_API_MODE | mock | real |
| PARENT_SUBSCRIPTION_API_MODE | disabled | disabled |
| ADMIN_API_MODE | mock | mock |
| ADMIN_CATALOG_API_MODE | real | real |
| ADMIN_REPORTS_API_MODE | real | không khai báo → real |
| ADMIN_MODERATION_CATALOG_API_MODE | theo Admin catalog | không khai báo → real |

Parent profile **không tự theo global API_MODE**. `.env.example` giữ catalog/payment/approvals mock; khác production có chủ đích trong source hiện tại. Admin users/audit và một số mutation dùng `forceReal`; không suy mọi operation mock từ `ADMIN_API_MODE=mock`. Subscription service vẫn unavailable; đổi cờ chưa đủ để tích hợp.

## Luồng dữ liệu

UI → feature service → `moduleApiRequest`/`featureApiRequest` hoặc `apiRequest(forceReal)` → allowlist → HTTP → mapper/query cache. Base URL đã có `/api`, path trong service không thêm prefix lần nữa. Allowlist không chứng minh endpoint tồn tại hoặc có quyền.

Composition v1 nằm `features/content/services/storyComposition.js`; lưu qua `contentService.js`. Local overlay/asset store/recovery không phải DB server. Parent reader 14/11 giữ composition qua `parentReaderModel`, dùng chung codec/StoryPageRenderer/animation/audio; `ParentReaderStage` dùng chung catalog preview và reader, không đọc editor overlay. Hợp đồng deploy/ownership còn mở theo [Parent](roles/PARENT.md).

## Chạy và kiểm tra

Làm theo [README gốc](../README.md), không ghi đè env local đang dùng. Các scripts có thật trong package.json:

```sh
npm run dev
npm run lint
npm run build
npm test
npm run test:api
npm run test:editor
```

`test:api` dùng Playwright intercept; `test:editor` dùng mock. Xem chính config tương ứng để biết port/mode và testMatch trước khi chạy. Không gọi kết quả intercept là xác minh Render. Chạy kiểm thử đúng phần thay đổi; kiểm thử ownership, persistence và payment cần môi trường test thực tế.

Đợt cập nhật docs 13/11 không chạy build/lint/E2E vì không đổi runtime code. Kiểm tra tài liệu gồm link local, fixture JSON, mapping tên cũ/mới và source evidence.
