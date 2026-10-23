# Trạng thái triển khai nối API — 21/10/2026

Kết quả code trong working tree hiện tại; chưa có kiểm thử API bằng tài khoản thật. Xem [ma trận operation hiện tại](LUNA_API_OPERATION_MATRIX_2026-10-21.md) và [audit đầy đủ](swagger-connection-audit-2026-10-21.md).

## Đã triển khai

- Thêm 16 route `char-types`, `prohibited-themes`, `content-reports` vào `backendRoutes.js`, vẫn giữ guard chính xác theo method/path.
- Thêm mode độc lập cho profile, catalog, subscription Parent, report Admin và catalog kiểm duyệt Admin. Module report kế thừa `VITE_ADMIN_API_MODE`, có thể bật riêng bằng `VITE_ADMIN_REPORTS_API_MODE=real`; PATCH chưa bật.
- Tạo trang CRUD `/admin/char-types` và `/admin/prohibited-themes`, gồm list/create/update/delete, refetch sau mutation và xử lý lỗi. Các enum mới hiển thị mã số theo Swagger; chưa tự đặt nhãn nghiệp vụ.
- Chuyển `/admin/reports` và detail sang GET `/content-reports` khi `VITE_ADMIN_REPORTS_API_MODE=real` (mặc định real). Hiển thị danh sách/chi tiết chỉ đọc, status và target type ở dạng mã số.
- Map `AuditLogDto.auditAction` thành `action` cho UI list/detail.
- Mở nút xóa trang ở Content Manager real, gọi `DELETE /storypage-template/story-pages/{id}`, tải lại truyện sau mutation và ẩn page Inactive/Archived khỏi editor. Hộp xác nhận nói rõ API xóa mềm; không khẳng định backend cascade dữ liệu liên quan.
- Kết nối Parent Library với GET `/story-template/stories` và `/story-template/stories/{id}` khi đặt `VITE_PARENT_CATALOG_API_MODE=real`; ghép tên chủ đề từ GET `/education-themes`. Backend catalog chỉ cấp metadata và tổng số trang, nên UI real không giả lập nội dung preview hay đề xuất cho bé.
- Dùng GET detail của `char-types` và `prohibited-themes` để nạp bản ghi mới nhất trước khi mở form chỉnh sửa.
- Tài liệu audit hiện tính **68 CONNECTED, 7 SERVICE_ONLY, 34 UNUSED, 2 ALTERNATIVE** trên 111 operation. CONNECTED là bằng chứng code có consumer, chưa phải runtime pass.

## Cần xác nhận hoặc triển khai tiếp

- **Profile Parent/Child:** chưa bật real. Audit source cũ ghi các profile endpoint không scope theo owner và trả danh sách toàn hệ thống; Swagger hiện tại không chứng minh lỗi đó đã được sửa. Cần xác nhận backend/commit mới và quyền sở hữu trước khi nối list/detail/update. Người dùng đã được hỏi và câu trả lời còn chờ.
- **Parent subscription và checkout/payment:** chưa nối consumer. Subscription theo profile cần xác nhận ownership; CRUD subscription không thay quy trình thanh toán.
- **Report mutation:** PATCH, POST, DELETE và lọc lịch sử chưa có consumer an toàn. Cần contract hiện tại nêu rõ status/action và tác động nghiệp vụ. GET list/detail là phần đã nối.
- **Role delete:** chưa thêm nút xóa vì chưa xác định backend xử lý slot/reference của role thế nào.
- **Upload avatar/background:** endpoint riêng chưa có luồng tiêu thụ và lưu asset vào profile/page; chưa nối riêng. Editor đang dùng multipart trong các API story/page/role.
- Lookup chi tiết char-type/prohibited-theme có service nhưng trang đang chỉnh từ dữ liệu list; hai GET detail còn SERVICE_ONLY.

## Kiểm tra đã chạy

- `npm run lint`: hoàn thành, không có lỗi; còn các warning sẵn có ở content, profile preview, auth provider, restrictions và các lệnh `Date.now()` render.
- `npm run build`: thành công. Vite còn cảnh báo bundle JavaScript lớn hơn 500 kB.
- Chưa chạy Playwright hoặc gọi mutation/live API. Build và lint không chứng minh endpoint được backend chấp nhận hay dữ liệu thật đúng.

## Quyết định cần từ người dùng

Chọn một trong ba hướng cho Parent profile đã được hỏi trong cuộc trò chuyện:

1. Giữ real profile tắt đến khi backend sửa/kiểm chứng ownership.
2. Backend đã sửa; cung cấp commit/contract hiện tại để xác minh trước khi bật.
3. Nối phần đọc nhưng vẫn bật real dù ownership chưa được xác minh.

Tài khoản Parent/Admin thử chỉ cần khi đến live smoke; không gửi mật khẩu qua tài liệu hoặc chat.
