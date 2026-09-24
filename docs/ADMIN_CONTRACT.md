# Admin API contract (frontend baseline)

Ngày cập nhật: 23/09/2026

Tài liệu này mô tả shape mà frontend Admin đang dùng. Đây là baseline để đối chiếu với Backend; mock server phải mô phỏng cùng shape nhưng không thay thế việc Backend kiểm tra quyền.

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

