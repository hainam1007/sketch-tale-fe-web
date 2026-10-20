# Báo cáo triển khai API Luna ExtraMax — 19/10/2026

## Trạng thái

Đã triển khai một phần vào source hiện có. Đây là rà soát và triển khai tĩnh theo Swagger và backend source commit `42846917f9e2381042267d916d3aa02cbef4d591`. Chưa chạy lint/build/E2E hoặc xác minh request thật trên Render trong lượt này.

## Đã nối hoặc chuyển sang API thật

- Auth dùng login thật, hydrate user qua `/auth/profile`, và dùng endpoint đổi mật khẩu.
- Luồng tạo tài khoản bé gọi thật `POST /auth/register/child`, gửi username/password/nickName và để backend liên kết Parent từ JWT. UI báo rõ response chưa có child ID nên tài khoản mới chưa thể xuất hiện trong danh sách hồ sơ.
- Content stories, danh mục chủ đề, pages, roles, vocabulary, quizzes và publish dùng các route thật đã có. Hide truyện gọi `DELETE /story-template/{id}` (Backend soft-delete sang Inactive).
- Slot nhân vật đọc theo từng trang và nối `POST /story-pages/{pageId}/slot`, `PUT /story-slots/{id}`, `DELETE /story-slots/{id}`. X/Y map phần trăm 0–100; cập nhật giữ lại CommonStatus hiện tại. Request create/update kèm audit ID của tài khoản Content Manager đã đăng nhập theo DTO/backend service.
- Ảnh bìa, ảnh nền, lời kể, ảnh mặc định role và file ảnh/âm thanh quiz gửi đúng multipart field theo controller.
- Admin catalog (subscription plans, credit costs, education themes), audit logs và restricted keywords gọi API thật.
- Danh mục gói trên trang công khai/Parent đọc từ Backend; thanh toán vẫn chưa được xem là đã nối.

## Mock được giữ và có nhãn

- Content dùng overlay local theo user + story cho page title, thứ tự trang, góc xoay/lớp/ảnh gắn riêng cho slot, timeline, animation, track audio, liên kết page/feedback của quiz; standalone asset library cũng tiếp tục dùng mock cả local và production.
- Admin users, reports, permissions, monitoring, statistics, system limits và topic rules giữ dữ liệu mô phỏng. Trang Restrictions tách từ khóa backend khỏi rule chủ đề mô phỏng.
- Parent/Child profile list/detail/update, entitlement riêng, progress, approvals, library và các thao tác chưa có hợp đồng usable vẫn giữ mock. Có source label nêu lý do ownership.
- Slot scale và lật ngang lưu thật; layer, rotation và ảnh chọn riêng cho slot lưu mô phỏng vì DTO chưa có các field này. Người dùng đã xác nhận X/Y là phần trăm 0–100. Checkout/payment chưa có API hợp đồng đủ cho giao dịch.

## Cần backend sửa hoặc xác nhận

- Backend commit đang deploy không kiểm tra ownership ở Parent/Child profile read/update; `GET /child-profiles` trả dữ liệu không scope theo phụ huynh. Không gửi request các màn đó từ FE và không lọc danh sách toàn hệ thống ở client.
- `POST /auth/register/child` chỉ trả message, không trả child ID. Luồng tạo tài khoản thật đã được nối; cần backend trả ID hoặc sửa ownership của API đọc danh sách trước khi có thể nạp tài khoản mới vào danh sách an toàn. Không tự retry POST khi response thành công nhưng thiếu ID.
- Các thao tác xóa story/page/role chưa có nút hoặc consumer trong Content editor; chưa tự thêm luồng xóa ngoài thao tác xóa slot đã có UI.
- Lỗi tải truyện/kho tài sản: backend có hai action `GET /storypage-template/pages/{storyId}` và `GET /storypage-template/pages/{id}` cùng route template. Request `/pages/{storyId}` trên Render trả 500 không có CORS header, khiến Chrome hiển thị thêm lỗi CORS. FE đã chuyển các luồng lấy danh sách trang sang `GET /storypage-template/all-pages/{storyId}` (route dành cho Content Manager). `GET /story-template/all-stories` trả 401 khi không có Bearer token; cần đăng nhập lại nếu phiên hiện tại hết hạn/không hợp lệ.

## Cấu hình và giới hạn kiểm tra

- `.env.development` chọn API thật cho content/catalog, đồng thời giữ Admin core và Parent ở mock. `.env.production` được giữ nguyên.
- Không có fallback mock khi request thật lỗi.
- Không chạy lệnh test/lint/build trong lượt này. Vì vậy mọi thay đổi source ở trên là **chưa được kiểm chứng runtime**.
- Xác minh bổ sung sau đó cho lỗi route trang: `OPTIONS` trả 204 với CORS header; GET route cũ trả 500 không có CORS header; GET `/all-pages/{storyId}` không token trả 401 với CORS header (route đã được nhận diện, cần JWT Content Manager để đọc). `npm run lint` và `npm run build` đã chạy qua sau khi đổi route; chưa xác minh tải dữ liệu bằng phiên đăng nhập thật.
