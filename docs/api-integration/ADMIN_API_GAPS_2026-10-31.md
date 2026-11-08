# Admin — API/contract còn thiếu để khớp frontend (31/10/2026)

Nguồn: [Swagger trực tiếp](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json), [snapshot](../../artifacts/swagger-admin-2026-10-31.json), [diff](../../artifacts/swagger-admin-diff-2026-10-31.json), source Admin và route trong `src/app/App.jsx`. Đây là đánh giá tài liệu/source, chưa xác minh quyền runtime. [Kế hoạch Luna xhigh](ADMIN_API_INTEGRATION_PLAN_2026-10-31.md).

Trạng thái frontend: các endpoint `/users` đã được nối. Tài liệu này tách contract còn thiếu (API đã có nhưng cần backend làm rõ) khỏi capability chưa có trong Swagger; chưa có live staging verification.

## 1. Đã có API — không báo thiếu endpoint

| Nhu cầu | API đã có | Còn thiếu ở frontend/contract |
|---|---|---|
| List/detail user | GET `/api/users`, `/api/users/{id}` | Đã gọi bằng user ID; response schema, envelope, pagination và Parent relationship còn thiếu trong Swagger |
| Tạo user | POST `/api/users` | Form theo DTO đã nối; role policy, response và staging persistence cần xác minh |
| Sửa user/đổi role | PUT `/api/users/{id}` có `role` | PUT sửa thông tin đã nối; role hiện read-only cho đến khi xác minh PUT/null semantics và role policy |
| Khóa/mở user | PATCH và PUT `/api/users/{id}/status` | UI dùng PATCH `{ isLocked, reason }`; quyền, status/error và live persistence cần xác minh |
| CRUD danh mục | subscription-plans, credit-costs, education-themes, restricted-keywords, char-types, prohibited-themes | Đã wired; field `haveParentProfileSub` đã có, ý nghĩa cần backend xác nhận |
| Báo cáo | GET/POST collection; GET/PATCH/DELETE detail; GET theo user | List/detail/PATCH đã wired. Chưa chứng minh enum/workflow/ẩn target |
| Audit | GET list/detail/theo user/entity name/entity ID | Đã wired; actor identity và pagination còn thiếu contract |
| Gói của Parent | PUT parent profile; PATCH mark-trial-plan-used; subscriptions list/detail/by-parent/by-plan | Caller có sẵn; không đồng nghĩa thanh toán thật hoặc quota adjustment tùy ý |

Không tiếp tục yêu cầu `GET/PATCH /admin/users` hoặc `PATCH /admin/permissions/{userId}` như thể chưa có chức năng tương đương. Backend đã có `/users`; adapter frontend cần theo route thật.

## 2. Có endpoint nhưng thiếu contract (ưu tiên trước khi nối)

| ID / ưu tiên | Phần cần bổ sung | Yêu cầu cụ thể để FE nối đúng |
|---|---|---|
| AC01 / P0 | Response `/users` | Schema list/detail/create/update/status; array hay envelope; trường ID/name/username/email/roles/lockout/createdAt; nullability; liên kết parentProfileId; examples và lỗi. Không trả password/hash/token/security stamp trong DTO public |
| AC02 / P0 | Role và quyền Admin | Tên role chính xác, một hay nhiều role, role được gán/tạo theo actor; bảo vệ self/last-admin; khả năng `allowedActions` hoặc quy tắc tài liệu. Có thể thêm role catalog, không bắt buộc route `/admin/permissions` |
| AC03 / P0 | PUT update/status | Omission giữ hay xóa field; null nghĩa gì; khóa hết hạn/lockout; xử lý session/refresh token; audit reason; status code khi conflict/forbidden. DTO update user chưa có reason/revision |
| AC04 / P0 | Phân trang user | Swagger chưa công bố query hay total. Cần xác nhận list là toàn bộ hay đã phân trang; nếu mở rộng hỗ trợ search/role/status/page/pageSize/sort và total/next cursor. FE còn lọc gói nên cần quy tắc join/filter Parent |
| AC05 / P1 | Report workflow | Nhãn chính thức `ContentReportStatus [0..3]`, `ReportTargetType`; transition hợp lệ; PATCH status có side effect ẩn target hay không; note/reviewer/resolvedAt/audit. `reason` hiện là lý do báo cáo, không mặc định là ghi chú xử lý |
| AC06 / P1 | Catalog | Ý nghĩa/mặc định `haveParentProfileSub`; currency/đơn vị price; tác động sửa giá/quota với subscription hiện hữu; enum moderation/status và điều kiện xóa resource đang được dùng |
| AC07 / P1 | Audit đọc lớn | Server pagination/date/action/actor filters; actor display name/email hoặc lookup chính thức; outcome/requestId nếu cần phân biệt thành công/thất bại. Không dùng seed email/role để lấp dữ liệu thiếu |
| AC08 / P1 | Concurrency/error | Revision/ETag hoặc cơ chế conflict cho thao tác nhạy cảm; error shape/fieldErrors/requestId. UI revision cũ không chứng minh backend đã hỗ trợ concurrency |

Swagger chỉ khai báo Bearer toàn cục; tag `User` và sự tồn tại endpoint không chứng minh chỉ Admin được truy cập. Backend cần mô tả/kiểm thử quyền theo role.

## 3. Chưa có API/capability trong Swagger

Các đường dẫn dưới đây **là đề xuất**, không được thêm vào allowlist hoặc gọi như endpoint đã tồn tại. Backend có thể chọn tên khác nếu trả đúng nghiệp vụ.

| ID / ưu tiên | Màn hình, mức cần thiết | Capability / route đề xuất | Dữ liệu tối thiểu / nghiệm thu |
|---|---|---|---|
| AG01 / P1 | Overview đang active | Aggregate `GET /api/admin/overview` hoặc các metrics endpoints tương đương | counts có scope, queue, recentAudit, generatedAt, partial errors. Không bắt buộc endpoint riêng chỉ để đếm list nhỏ; cần aggregate khi dữ liệu phân trang/lớn hoặc KPI không có nguồn |
| AG02 / P0 về tính đúng KPI | Revenue/credit trên Overview đang active | Revenue và credit usage aggregate, có thể nằm trong overview; ledger/payment reads nếu sản phẩm cần drill-down | Doanh thu đã trả/hoàn tiền/tiền tệ/thời điểm; trend/growth công thức rõ; credit used theo kỳ và loại event. Subscription price hiện tại không phải số tiền thực thu; remaining credit không phải credit đã sử dụng |
| AG03 / P1 | System limits — source có nhưng route đang redirect | GET/PATCH `/api/admin/system-limits` | maxAssetSizeMb, maxStoryPages, maxSlotsPerRole, aiGenerationsPerMinute, parentChildProfileLimit; min/max/unit/scope/revision/updatedAt; backend thực thi sau lưu |
| AG04 / P1 | Monitoring — source có nhưng route đang redirect | GET `/api/admin/monitoring`; action retry/cancel (ví dụ PATCH `/{jobId}`) | id/type/target/status/progress/usage/error/updatedAt/allowedActions/revision; idempotency, transition, lỗi retry/cancel; không tạo task giả rồi báo vận hành thật |
| AG05 / P1 | Statistics — source có nhưng route đang redirect | GET `/api/admin/statistics?range=7d|30d` | summary.activeUsers/lockedUsers/characters/readingMinutes; trend buckets; timezone/range/generatedAt/errors; định nghĩa account active khác DAU/MAU |
| AG06 / P1, tùy workflow report | Evidence/target preview và moderation effect đầy đủ | Đọc target an toàn theo targetType + action moderation nếu PATCH report không làm việc này | Preview/target title/url/evidence có quyền; decision note/reviewer/time/audit; ẩn/xóa target đúng loại. Không khẳng định PATCH status hiện tại chưa có side effect; backend cần xác nhận trước |

Permissions màn riêng có thể dựng từ `/users` + PUT user + role policy sau AC01–03; **không phải gap endpoint CRUD user**. Generic restrictions không được yêu cầu như API bắt buộc: luồng hiện tại đã có restricted-keywords/prohibited-themes; chỉ thêm khi có yêu cầu rule ngoài hai catalog đó.

## 4. Trạng thái frontend sau lượt triển khai

1. Hoàn tất: account list/detail dùng `/users`; Parent profile tách theo `userId`; không lấy audit/seed/localStorage làm nguồn chính.
2. Hoàn tất: create/update/status gọi API; không báo local success; cache được invalidate sau mutation.
3. Hoàn tất: lỗi list users/reports được giữ là lỗi; overview hiển thị nguồn lỗi riêng.
4. Hoàn tất: số revenue/credit giả và heuristic giá đã bỏ khỏi overview.
5. Hoàn tất: `haveParentProfileSub` có trong create/edit và giữ trạng thái unspecified nếu response cũ thiếu field.
6. Còn giữ redirect: permissions/limits/monitoring/statistics chưa bật vì service/contract tương ứng chưa đủ.

Chi tiết operation, file, kiểm chứng lint/build và giới hạn live: [báo cáo triển khai](luna-extramax/admin-implementation-report-2026-10-31.md).

## 5. Điều kiện bàn giao backend

- OpenAPI có request/response/error schemas, enum có nhãn và examples không chứa dữ liệu riêng tư.
- Kiểm thử Admin được phép và non-Admin bị từ chối; không coi client route guard là phân quyền.
- Contract PUT/null/identity/currency/timezone/concurrency được ghi rõ; thao tác nhạy cảm có audit.
- Có phiên test/staging phù hợp để kiểm chứng read-after-write. Intercept fixtures chỉ xác minh frontend, không thay thế kiểm thử backend.

Ưu tiên backend: **AC01–03 → AC04/AC06 → AG02/AC05 → AC07–08 → AG03–05 theo lịch mở lại màn hình**. AG01/AG06 tùy khả năng đáp ứng bằng endpoint hiện có; không tạo API trùng chỉ để giữ tên service cũ.
