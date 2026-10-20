# Admin API contract (frontend baseline)

> **Hướng triển khai đã chốt 17/10:** API đã có thì nối, API chưa có thì dùng mock để hoàn thiện giao diện trước. Baseline mock và API thật phải phân biệt rõ; thiếu contract chỉ chặn thao tác real chưa đủ thông tin, không chặn form/workflow demo. Quy tắc theo module tại mục 1.1 của [kế hoạch mới](ADMIN_UI_UX_PLAN_2026-10-17.md).

> **Cập nhật 19/10/2026:** API thật đã được nối trong source cho catalog gói/credit/chủ đề, audit logs và restricted keywords. Users, permissions, reports, limits, monitoring, statistics và topic rules vẫn dùng mock. Tài liệu này chỉ là contract nền cho Admin core; xem [tổng quan tích hợp](PROJECT_SUMMARY.md) và [runbook API](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md) để biết trạng thái hiện tại. Chưa có nghiệm thu runtime trên Backend.

Ngày cập nhật: 23/09/2026

Tài liệu này mô tả shape mà frontend Admin đang dùng. Đây là baseline để đối chiếu với Backend; mock server phải mô phỏng cùng shape nhưng không thay thế việc Backend kiểm tra quyền.

> Ghi chú lịch sử 30/09/2026: các gate C-ADM-01–07 khi đó là đề xuất, chưa phải xác nhận Backend. Tài liệu hiện tại chủ yếu đặc tả Users/Permissions; các phần Reports, Limits, Restrictions, Monitoring, Statistics, Overview và Audit vẫn cần đối chiếu riêng theo API hiện hành.

## Quy ước chung

- Collection trả về `{ items, total, page, pageSize, totalPages }`.
- Mutation trả về resource mới, kèm `revision` khi resource có cạnh tranh cập nhật.
- Request mutation gửi `reason` cho thao tác nhạy cảm và `revision` khi frontend đang sửa một bản ghi đã đọc.
- Error có shape `{ code, message, fieldErrors?, requestId? }`. Frontend phân biệt tối thiểu 401, 403, 404, 409, 422, 423 và 5xx.
- `allowedActions` và role catalog là dữ liệu do server trả về. Guard frontend chỉ hỗ trợ trải nghiệm, không phải cơ chế bảo mật.
- Audit event được Backend ghi sau khi mutation thành công; client không tự hiển thị mutation là thành công trước response.

## Users

- `GET /admin/users?search&role&status&page&pageSize&sort`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id` với `{ status, reason, revision }`

User response tối thiểu gồm `id`, `email`, `name`, `role`, `plan`, `status`, `updatedAt`, `revision`, `allowedActions`.

## Permissions

- `GET /admin/permissions`
- `PATCH /admin/permissions/:id` với `{ role, reason, revision }`

Catalog trả về `{ users, roles }`. Mỗi user trong `users` có `revision` và `allowedActions`.

## Errors và concurrency

- `409 REVISION_CONFLICT`: dữ liệu đã đổi; giữ draft ở UI và cho phép tải bản mới có chủ đích.
- `409 SELF_LOCK_NOT_ALLOWED`, `409 SELF_ROLE_CHANGE_NOT_ALLOWED`, `409 LAST_ADMIN_NOT_ALLOWED`: server từ chối thao tác nhạy cảm.
- `422 VALIDATION_ERROR`: lỗi toàn form hoặc lỗi theo field trong `fieldErrors`.

## Khoảng trống cần thống nhất để hoàn thiện giao diện

Các yêu cầu sau là đầu việc contract, không phải thay đổi API đã có hiệu lực:

- Users/Permissions: định danh Child có thể khác Parent; catalog hiện tại cần thống nhất với role được PATCH chấp nhận. Chốt vai trò được gán theo từng target, bảo vệ admin **đang hoạt động** cuối cùng khi khóa hoặc đổi role, mức bắt buộc của reason/revision và hiệu lực với phiên đã đăng nhập.
- Collections: Permissions hiện dùng `{ users, roles }`; Restrictions/Monitoring trong mock hiện chỉ trả `{ items }`. Không giả định mọi endpoint đã đáp ứng quy ước pagination chung. Mọi thay đổi shape phải cập nhật đồng bộ service, mock, query và UI.
- Reports: capability/transition/assignee, quy tắc ghi chú, preview đối tượng chỉ đọc trong Admin. Ghi chú hiện gắn với mutation trạng thái; ghi chú độc lập và moderation target cần contract riêng nếu mở scope.
- Limits/Restrictions: miền giá trị, normalization, phạm vi và thời điểm hiệu lực, xử lý dữ liệu đang vượt mức, revision/reason/capability và audit cho thay đổi cấu hình.
- Monitoring: phân trang/lọc, aggregate, allowedActions, revision/idempotency, kết quả retry/cancel và trạng thái chưa xác định khi timeout.
- Statistics/Overview: định nghĩa metric, phạm vi thời gian, timezone, generatedAt, null/partial errors và nguồn tổng hợp. Chưa có endpoint overview riêng trong service hiện tại.
- Audit: status/result thật, targetId/type có cấu trúc, reason, thay đổi trước/sau được phép xem, requestId, sort và detail nếu cần. Chỉ hiển thị failed/denied khi Backend thực sự ghi những loại event này.
- Errors: phân biệt `409 REVISION_CONFLICT` với các 409 chính sách; thiếu capability không mặc nhiên cấp quyền. Mock đang cho bỏ revision ở một số mutation nên chưa chứng minh concurrency đúng contract mục tiêu.

Trước khi nghiệm thu tích hợp mỗi nhóm, bổ sung vào tài liệu này ví dụ request/response thành công, empty/null, validation, denied và conflict có liên quan. Kế hoạch UI có thể triển khai với fixture được ghi rõ trong khi chờ Backend; chỉ đánh dấu tích hợp hoàn tất sau khi kiểm chứng API thật.

