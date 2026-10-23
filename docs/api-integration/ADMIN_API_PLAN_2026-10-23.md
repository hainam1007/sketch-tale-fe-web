# Admin: kế hoạch tích hợp và bàn giao API — 23/10/2026

Nguồn: Swagger trực tiếp `https://sketch-tale-be.onrender.com/swagger/v1/swagger.json`, tải thành công ngày 23/10/2026, lưu tại `artifacts/swagger-admin-2026-10-23.json`. So với snapshot 21/10, có thêm 4 đường dẫn user-story-character-mappings; không thêm đường dẫn admin. Tên nhóm dưới đây mô tả chức năng frontend, không khẳng định quyền truy cập backend chỉ dựa vào tag Swagger.

## Kế hoạch và kết quả

1. Đối chiếu Swagger với service, route UI và chế độ mock/real từng module.
2. Giữ CRUD danh mục hiện có; nối GET chi tiết trước khi chỉnh sửa gói, credit, chủ đề để tránh ghi đè từ dữ liệu danh sách cũ.
3. Dùng API thật mặc định cho báo cáo nội dung list/detail, độc lập `VITE_ADMIN_API_MODE`. Có thể chủ động đặt `VITE_ADMIN_REPORTS_API_MODE=mock` để xem workflow demo cũ.
4. Nối đủ 5 API đọc nhật ký: toàn bộ, chi tiết, theo user, theo entity name và entity ID. Tra cứu phạm vi gửi request tới backend; lọc ngày/hành động/tìm kiếm và phân trang thực hiện trên tập kết quả đã tải.
5. Hoàn thiện trải nghiệm: sửa trang audit vượt giới hạn, sắp nhật ký mới nhất trước, làm mới/xóa bộ lọc, phân trang và lọc báo cáo, tìm danh mục kiểm duyệt, dịch biểu mẫu sang tiếng Việt, dialog audit hỗ trợ Escape/focus, bố cục nhỏ và bảng cuộn trong vùng riêng.
6. Giữ UI xem trước của tài khoản, phân quyền, tổng quan, giới hạn, giám sát và số liệu. Banner chỉ rõ dữ liệu demo và thao tác không ghi vào backend. Không bật toàn bộ admin sang real khi hợp đồng chưa tồn tại.

## API đã có và frontend sử dụng

Các đường dẫn bên dưới có tiền tố `/api`. “Đã nối” nghĩa là có UI/service gọi đúng đường dẫn; không thay thế kiểm thử xác thực với tài khoản admin thật.

| Nhóm | API | Trạng thái |
| --- | --- | --- |
| Nhật ký | GET `/audit-logs`, `/{id}`, `/user-id/{id}`, `/entity-name/{name}`, `/entity-id/{id}` | Đã nối tất cả; chỉ đọc |
| Gói sử dụng | GET/POST `/subscription-plans`; GET/PATCH/DELETE `/subscription-plans/{id}` | CRUD có sẵn; bổ sung đọc detail trước chỉnh sửa |
| Chi phí credit | GET/POST `/credit-costs`; GET/PATCH/DELETE `/credit-costs/{id}` | CRUD có sẵn; bổ sung đọc detail trước chỉnh sửa |
| Chủ đề giáo dục | GET/POST `/education-themes`; GET/PATCH/DELETE `/education-themes/{id}` | CRUD có sẵn; bổ sung đọc detail trước chỉnh sửa |
| Từ khóa hạn chế | GET/POST `/restricted-keywords`; GET/PATCH/DELETE `/restricted-keywords/{id}` | List/create/update/delete đã nối từ trước; GET detail có service, chưa có màn detail riêng |
| Loại nhân vật | GET/POST `/char-types`; GET/PATCH/DELETE `/char-types/{id}` | CRUD và đọc detail trước sửa có sẵn; bổ sung tìm kiếm/làm mới/nhãn nguồn |
| Chủ đề cấm | GET/POST `/prohibited-themes`; GET/PATCH/DELETE `/prohibited-themes/{id}` | CRUD và đọc detail trước sửa có sẵn; bổ sung tìm kiếm/làm mới/nhãn nguồn |
| Báo cáo nội dung | GET `/content-reports`, `/content-reports/{id}` | Đã nối, mặc định real; bổ sung lọc, phân trang, làm mới |

## API còn thiếu cho các màn admin

Đây là hợp đồng **đề xuất theo service/UI hiện tại**, không phải các endpoint đã xuất hiện trong Swagger. Backend có thể chọn tên khác rồi cập nhật adapter frontend.

| Ưu tiên | Màn hình | Endpoint cần cung cấp | Dữ liệu/hành vi cần thống nhất |
| --- | --- | --- | --- |
| P0 | Tài khoản | GET `/admin/users`, GET `/admin/users/{id}`, PATCH `/admin/users/{id}` | Tìm kiếm, role, status, page/pageSize/sort, tổng số; thông tin tài khoản; khóa/mở, lý do, revision, chặn tự khóa admin cuối cùng |
| P0 | Phân quyền | GET `/admin/permissions`, PATCH `/admin/permissions/{userId}` | Danh sách user/role được phép gán, lý do thay đổi, revision, bảo vệ admin cuối cùng |
| P1 | Tổng quan | GET `/admin/overview` | counts, queue, recentAudit, generatedAt; không thay số liệu chưa có bằng 0 |
| P1 | Giới hạn hệ thống | GET/PATCH `/admin/system-limits` | Giới hạn upload/tác vụ, đơn vị, min/max, phạm vi áp dụng, revision |
| P1 | Giám sát | GET `/admin/monitoring`, PATCH `/admin/monitoring/{jobId}` | Trạng thái job, lỗi, thời gian, retry/cancel, điều kiện thao tác, idempotency và revision |
| P1 | Số liệu | GET `/admin/statistics` với range `7d` hoặc `30d` | metrics/chuỗi thời gian, timezone, thời điểm cập nhật, quy tắc tính |
| P2 | Quy tắc hạn chế tổng quát | GET `/admin/restrictions`, PATCH `/admin/restrictions/{id}` | Chỉ dành cho quy tắc ngoài keyword/prohibited-theme đã có; hiện phần này là demo trong trang hạn chế |

## Có endpoint nhưng chưa đủ hợp đồng nghiệp vụ

- Báo cáo: POST/PATCH/DELETE và GET theo user đã tồn tại. **Không báo thiếu các endpoint này.** `ContentReportStatus` chỉ liệt kê 0–3, không có nhãn và sơ đồ chuyển trạng thái. Cần xác nhận trạng thái nào là tiếp nhận/đang xem/đã xử lý/từ chối, PATCH có thực sự ẩn nội dung hay chỉ đổi DTO, nội dung target đọc ở đâu, lưu ghi chú/lý do và audit thế nào. Frontend thật hiện chỉ đọc; workflow demo có sẵn khi đặt module mock.
- Audit: DTO có UUID người thao tác, chưa có tên/email, kết quả thành công/thất bại. API danh sách không khai báo phân trang/lọc ngày server-side; cần bổ sung để tránh tải toàn bộ dữ liệu lớn.
- Gói: cần xác nhận đơn vị tiền tệ, tác động thay đổi giá/quyền lợi với subscription đang tồn tại. CRUD subscription không đồng nghĩa thanh toán/hoàn tiền.
- Các enum kiểm duyệt: Swagger chỉ công bố số; cần tài liệu tên nghiệp vụ chính thức để thay các nhãn mã đang hiển thị.
- API auth/profile, parent/child profiles không thay thế API quản lý toàn bộ tài khoản và phân quyền admin.
- GET subscription-plan theo code, subscriptions CRUD và các lookup theo parent/plan có trong Swagger, nhưng chưa có luồng quản lý subscription tương ứng trong admin hiện tại; không gọi chỉ để tăng độ phủ.

## Cấu hình

- `VITE_ADMIN_API_MODE=mock`: các chức năng chưa có hợp đồng giữ UI xem trước.
- `VITE_ADMIN_CATALOG_API_MODE=real`: các danh mục gói, credit, giáo dục.
- `VITE_ADMIN_MODERATION_CATALOG_API_MODE=real`: loại nhân vật/chủ đề cấm (mặc định kế thừa catalog).
- `VITE_ADMIN_REPORTS_API_MODE=real`: list/detail báo cáo (mặc định real, không kế thừa admin core).
- Audit và restricted-keywords dùng real adapter như trước.

Không có fallback âm thầm sang mock khi API thật lỗi. UI giữ trạng thái lỗi/retry hoặc dữ liệu đã tải cùng thông báo làm mới thất bại.

## Kiểm chứng

- `npm run build`: PASS; vẫn có cảnh báo bundle lớn hơn 500 kB của ứng dụng.
- `npm run lint`: exit 0, không có lỗi; còn cảnh báo sẵn có tại các phần khác và AdminRestrictionsPage.
- Playwright `tests/admin-api-ux.spec.js`: **4/4 PASS**. Adapter HTTP với response fixture theo DTO; scoped audit, trang URL vượt giới hạn, dialog keyboard/focus, lọc/phân trang report, đọc detail mới nhất trước sửa và 9 màn responsive 1366/768/390px. Ảnh kiểm tra nằm ở `artifacts/admin-audit-*.png` và `artifacts/admin-reports-*.png`.
- Sửa tràn ngang do nhãn `sr-only` định vị tuyệt đối bên trong bảng: đặt vùng cuộn làm containing block cho bảng audit, tài khoản, phân quyền và danh mục. Nội dung bảng vẫn cuộn được, không che mất cột bằng overflow toàn trang.
- Không gửi mutation lên backend thật. Cần smoke test với phiên admin thật trên môi trường staging để xác nhận quyền truy cập, response thực tế và các chính sách nghiệp vụ trước khi phát hành.
