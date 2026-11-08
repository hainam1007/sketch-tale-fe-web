# Parent API implementation — 29/10/2026

> Bản báo cáo này là snapshot 29/10. Trạng thái sau khi đọc Backend source và thay đổi frontend ngày 01/11 xem [Parent source audit](../PARENT_API_SOURCE_AUDIT_2026-11-01.md) và [API integration master](../API_INTEGRATION_MASTER_2026-11-01.md). Source commit `fb3075e` chưa được xác nhận là backend đang deploy; không coi source audit là live verification.

Trạng thái: **PARTIAL**. Hoàn tất sửa mapping catalog/checkout an toàn; chưa hoàn tất kết nối Parent Profile và subscription hiện hành.

Model thực hiện: gpt-6-luna, effort xhigh.

## Đã thay đổi

- `src/features/public/services/publicService.js`: response catalog giữ `backendId` (UUID) và `code` riêng; giữ khóa `id` cũ cho route/UI hiện tại. Ánh xạ `haveParentProfileSub` thành boolean khi response có boolean, nếu không giữ `null` để thể hiện chưa rõ.
- `src/features/parent/pages/ParentPlanPage.jsx`: catalog backend có thể vào checkout chỉ khi `checkoutEnabled === true`. Catalog mock tiếp tục dùng luồng demo.
- `src/features/public/services/publicService.js`: DTO không có currency, nên catalog hiện dùng VND theo cấu hình thị trường SketchTale hiện tại và mock catalog. Nếu mở đa tiền tệ, Backend cần thêm `currency` rõ ràng.
- `src/features/parent/pages/ParentPlanPage.jsx` và `ParentCheckoutPage.jsx`: không còn nhân giá với 1.000; giá catalog như 49.000 và 99.000 được định dạng thành VND. Checkout vẫn ghi rõ là demo.

## Chưa nối và lý do

- `GET /parent-profiles/{id}` và `GET /subscriptions/parent-profile/{parentProfileId}` có trong Swagger nhưng response profile không có schema, và Swagger không chỉ cách lấy ParentProfile ID của phiên hiện tại. Không thể dùng User ID thay thế hoặc liệt kê mọi hồ sơ Parent để tìm tại client.
- Subscription API có sẵn nhưng endpoint POST/PATCH/DELETE không đại diện cho quy trình checkout đã xác thực. Checkout giữ demo; catalog thật đã khóa nút chọn gói.
- Không bật thật dashboard/progress/approvals/library/exports/report vì các route cần thiết chưa có contract đầy đủ. Chi tiết trong `PARENT_API_GAPS_2026-10-29.md`.
- Lỗi ownership của profile từng được nêu trong audit cũ, nhưng chưa có phiên test Parent A/B để kết luận runtime hiện tại. Không mở thêm consumer phụ thuộc profile.

## Files thay đổi trong lượt này

- `src/features/public/services/publicService.js`
- `src/features/parent/pages/ParentPlanPage.jsx`
- `src/features/parent/pages/ParentCheckoutPage.jsx`

Các thay đổi sẵn có khác trong workspace được giữ nguyên. Không sửa backend route allowlist vì chưa có Parent operation mới cần cho phần đã nối.

## Kiểm chứng

- Đã đối chiếu field gói/SubscriptionDto với snapshot Swagger ngày 29/10.
- Chưa chạy Playwright, build, lint hoặc live request trong lượt này.
- Chưa kiểm chứng thanh toán, scope hồ sơ Parent, scope subscription hoặc enforcement giới hạn ở app Child.

## Bước tiếp theo đủ điều kiện

Backend cung cấp response mẫu ParentProfile và xác nhận mapping user phiên → parentProfileId, kèm test scope hai Parent. Sau đó thêm query subscription theo parentProfileId, chọn subscription hiện hành theo status/date đã xác nhận và hiển thị riêng trạng thái chưa xác định. Không tạo/cập nhật subscription từ CTA checkout.
