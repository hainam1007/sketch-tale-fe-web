# Quyết định triển khai Luna ExtraMax

## Q01 — Đã chốt ngày 19/10/2026

Người dùng: “Giữ mock cả local và bản deploy, có nhãn ‘Dữ liệu mô phỏng’”.

Áp dụng cho chức năng chưa có API. API đã có chuyển real theo operation; lỗi real không fallback mock. Không hỏi lại permission cho policy này.

## Q02 — Đã xác minh source; còn lỗi ownership backend

Đã đọc repo người dùng cung cấp tại commit `42846917f9e2381042267d916d3aa02cbef4d591`. Người dùng xác nhận Render chạy commit này. Backend source xác nhận enum và profile IDs; xem phần mapping trong [tổng quan dự án](../../PROJECT_SUMMARY.md).

Enum và profile ID đã rõ, không hỏi lại. FE login đã hydrate qua `/auth/profile` vì login DTO không có ID. Create Child liên kết Parent qua JWT nhưng response không có child ID. Profile read/update chưa kiểm tra ownership; cần backend sửa trước khi mở các luồng Parent.

`POST /auth/register/child` hiện được gọi thật từ màn tạo tài khoản bé với username/password/nickName do phụ huynh tạo; bé dùng thông tin đó để đăng nhập app mobile. UI không giả định child ID hoặc refetch qua endpoint list chưa scope; kết quả thành công báo rõ giới hạn này.

## Q03 — Đã chốt 19/10/2026

Người dùng xác nhận `PosX`/`PosY` là phần trăm 0–100. Slot đọc/tạo/cập nhật/xóa dùng API thật. DTO không có góc xoay, lớp hiển thị hoặc ảnh riêng cho từng slot; các thuộc tính này giữ trong overlay với nhãn `Dữ liệu mô phỏng`. PUT slot cần gửi lại CommonStatus hiện có để tránh DTO mặc định Draft làm đổi trạng thái.

### Blocker ownership đang mở

Backend source hiện chạy không scope `GET /child-profiles` theo Parent và không kiểm tra owner cho detail/update Parent–Child profile. Không gọi các profile API đó từ giao diện thật; không tải danh sách toàn hệ thống để lọc ở frontend. Backend cần thêm authorization theo JWT/owner và kiểm thử với hai Parent riêng. `POST /auth/register/child` liên kết bé theo Parent JWT nhưng chỉ trả message, chưa có child ID; cần response ID hoặc list đã scope an toàn để hoàn tất hiển thị tài khoản mới.
