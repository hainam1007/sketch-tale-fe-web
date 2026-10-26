# Kiến trúc, cấu hình và kiểm thử

Đối chiếu source ngày 24/10/2026. Đây là trạng thái frontend local, không xác nhận backend đã triển khai hoặc được nghiệm thu.

## Ranh giới thư mục

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/app` | Provider, router, guard và layout workspace |
| `src/features/<feature>` | Trang, component, service, dữ liệu và CSS theo nghiệp vụ |
| `src/components` | UI dùng chung giữa các feature |
| `src/lib/api` | HTTP, token, lỗi, route mapping, query key và API mode |
| `src/lib/permissions` | Định nghĩa và chuẩn hóa role |
| `src/mocks` | Backend mô phỏng cho operation chưa có API |
| `src/styles` | Token và CSS toàn ứng dụng |
| `tests`, `tests/support` | Playwright và cấu hình test dùng chung |
| `scripts` | Công cụ asset và hiệu năng |
| `docs` | Kiến trúc, contract, đặc tả, báo cáo theo thời điểm |
| `design`, `artifacts` | Thiết kế và bằng chứng kiểm tra, không phải runtime |

Giữ cấu trúc theo feature. Không gom service có contract khác nhau chỉ vì cùng gọi HTTP. Auth context nằm ở `AuthContext.js`, hook ở `useAuth.js`, provider chỉ export component. Dữ liệu preview gia đình nằm ở `features/parent/services/familyProfilePreview.js`.

## Chọn nguồn dữ liệu

Nguồn xác định hành vi là `src/lib/api/featureApi.js`, `httpClient.js` và service từng feature. `.env.example` khai báo cấu hình hybrid mẫu; `.env.development` không bị sửa trong đợt review.

| Biến | Mặc định nếu không khai báo |
| --- | --- |
| `VITE_API_MODE` | Auth/HTTP mock trừ khi bằng `real` |
| `VITE_CONTENT_API_MODE` | Theo API chung |
| `VITE_PARENT_API_MODE`, `VITE_ADMIN_API_MODE` | `mock` |
| `VITE_PARENT_PROFILE_API_MODE` | `real` nếu API chung real, còn lại theo Parent |
| `VITE_PARENT_CATALOG_API_MODE`, `VITE_PARENT_SUBSCRIPTION_API_MODE` | Theo Parent |
| `VITE_ADMIN_CATALOG_API_MODE`, `VITE_ADMIN_REPORTS_API_MODE` | `real` |
| `VITE_ADMIN_MODERATION_CATALOG_API_MODE` | Theo Admin catalog |

`VITE_PARENT_API_MODE=mock` không có nghĩa toàn bộ Parent là mock: profile vẫn có thể gọi thật khi API chung real. Admin audit/restricted keywords gọi `forceReal` trực tiếp, độc lập với Admin core. Lỗi request thật không tự chuyển sang mock.

Parent profile đã có list/detail/update; Parent catalog có story/theme. Admin reports đã có list/detail thật, UI read-only. Khác với snapshot 19/10, source hiện gọi API profile. Có adapter không chứng minh backend đã sửa ownership; cần kiểm tra quyền bằng tài khoản staging trước nghiệm thu.

## Kiểm thử tái lập

```sh
npm run lint
npm run build
npm test
npm run test:api
npm run test:editor
```

- `npm test`: nhóm mock, server riêng cổng 5180.
- `npm run test:api`: adapter thật nhưng response được Playwright intercept, server và API URL local cổng 5181. Không phải kiểm thử Render.
- `npm run test:editor`: Story Editor mock, cổng 5174, một worker.
- Các cấu hình này khai báo rõ mode, dùng `--strictPort` và không dùng lại dev server sẵn có. Cần Chrome và Playwright Chromium (một số spec chỉ định Chromium).
- `playwright.parent-production.config.js` yêu cầu build trước. Spec còn kỳ vọng UI “đang hoàn thiện” cũ; cần cập nhật theo Parent v2 trước khi dùng nghiệm thu.

## Kết quả review và việc còn lại

- Bỏ 6 file không còn importer/route: hai page trong `features/workspace`, `ParentPlaceholderPage`, `ParentReportsPage`, `ParentFeaturePending`, `publicFeatures`. Route `/parent/reports` vẫn redirect sang library; báo cáo demo hiện dùng `FamilyReportsDemo`.
- Bỏ helper không được gọi và tham số thừa; ổn định dependency danh sách hạn chế Admin.
- Lint giảm từ 15 xuống 7 cảnh báo, không có lỗi. Cảnh báo còn lại thuộc effect/render trong Story Editor. `Date.now` nằm trong hàm xử lý draft; cần phân tích call site trước khi kết luận lỗi render.
- Build thành công, vẫn cảnh báo bundle JS khoảng 1,27 MB trước gzip. `App.jsx` import các trang đồng bộ; có thể tối ưu tải theo route trong đợt sau.
- 17 test adapter API đã pass với response intercept. Kết quả này không nghiệm thu backend thật.
- Nhóm Public/Profile: 6 test pass ở lượt đầu; 1 test dùng tên nút đăng ký cũ đã được cập nhật và pass khi chạy lại riêng. Chưa chạy toàn bộ suite.
- `mockServer.js` và Story Editor chứa nhiều trách nhiệm; nên tách theo domain/chu trình lưu với regression test tương ứng.
- Các spec cũ có thể còn selector/kỳ vọng giao diện lỗi thời. Cấu hình test ổn định không có nghĩa toàn bộ E2E đã pass.

## Quy tắc tài liệu

README gốc hướng dẫn bắt đầu; tài liệu này mô tả cấu trúc/config hiện tại. Contract ghi yêu cầu nghiệp vụ. Plan/report có ngày là lịch sử hoặc backlog. Khi có bản thay thế, thêm liên kết và trạng thái ở đầu bản cũ; không xóa contract/bằng chứng chỉ vì nội dung giao nhau.
