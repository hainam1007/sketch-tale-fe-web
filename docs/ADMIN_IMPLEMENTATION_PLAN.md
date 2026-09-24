# Kế hoạch hoàn thiện role Admin

Ngày lập: 23/09/2026. Phạm vi: Web Frontend SketchTale và yêu cầu contract liên quan Backend.

Kế hoạch dựa trên router, các trang `src/features/admin`, `adminService`, `mockServer`, các test G2/G4/G5/G6 và backlog A-01–A-10 trong [kế hoạch tổng thể](WEB_IMPLEMENTATION_PLAN.md). Đây là kế hoạch triển khai tiếp từ code hiện có; các API bổ sung dưới đây là đề xuất, chưa phải contract Backend đã được duyệt.

## 1. Hiện trạng đã kiểm tra

| Module | Đã có | Phần cần hoàn thiện |
| --- | --- | --- |
| Auth và workspace | Login mock, RequireAuth, RequireRole, sidebar, query keys theo user | Phiên thật, xử lý bị khóa/thu hồi quyền khi đang sử dụng |
| Tổng quan `/admin` | Trang dùng chung RoleOverviewPage, link đến các module | Dashboard nghiệp vụ từ aggregate API |
| Users | List, tìm kiếm/lọc, detail, lock/unlock | Phân trang, filter trên URL, lý do thao tác, đồng bộ cache và audit |
| Permissions | Đổi role, mock chặn tự đổi role/hạ admin cuối cùng | UI đang hardcode role; dùng catalog/capability server, đồng bộ users/detail sau đổi role |
| Reports | Queue, detail, ghi chú, đổi trạng thái, revision | Mock chưa kiểm tra đầy đủ chuyển trạng thái; đường dẫn “Mở target” sang `/content/stories` bị guard chặn với admin |
| System limits | Form năm giới hạn, validate mock, revision | Field errors, xử lý conflict có tải lại, định nghĩa thời điểm và phạm vi áp dụng |
| Restrictions | List và bật/tắt | Tạo/sửa rule nếu scope được chốt, tìm kiếm/lọc, quy tắc trùng lặp và hiệu lực |
| Monitoring | List job, retry/cancel theo trạng thái | Capability từ server, lọc/phân trang, cập nhật trạng thái, chống thực thi lặp |
| Statistics | Aggregate theo khoảng thời gian | Định nghĩa metric, dữ liệu thật, freshness và trạng thái thiếu dữ liệu |
| Audit | Viewer read-only và lọc | Ghi event từ thao tác thật, phân trang, kết quả thực tế; UI hiện gắn nhãn thành công cho mọi dòng |

HTTP boundary đã hỗ trợ `VITE_API_MODE=real` và `VITE_API_URL`; mặc định gọi mock nội bộ. Không cần dựng lại React Router, Query provider hoặc đổi framework. Các test hiện có là nền tảng hồi quy; chưa chạy lại trong lần lập kế hoạch này.

Route audit hiện hành là `/admin/audit`; tài liệu tổng thể còn ghi `/admin/audit-logs`. Giữ route hiện hành và cập nhật tài liệu khi triển khai; chỉ thêm alias nếu có yêu cầu tương thích.

## 2. Phạm vi và nguyên tắc

- Ưu tiên P0: tài khoản, phân quyền, xử lý report và audit cho các thao tác thay đổi dữ liệu.
- P1: hoàn thiện cấu hình, restrictions, monitoring, statistics và dashboard.
- Hoãn bulk action, xuất báo cáo nâng cao, realtime WebSocket và quản lý thanh toán tới khi có nhu cầu/contract.
- Backend kiểm tra quyền trên mỗi request. Admin không tự động có quyền sửa Story Editor hoặc xem toàn bộ dữ liệu riêng của trẻ.
- Tách trạng thái report khỏi hành động lên target. Resolve không đồng nghĩa ẩn truyện; nếu hai thao tác độc lập, UI trình bày kết quả từng thao tác.
- Giữ JavaScript/JSX, CSS tokens, WorkspaceLayout, React Query và các UI trạng thái hiện có. Chỉ tách component/hook khi có nghiệp vụ chung thực sự.
- Tác vụ nhạy cảm dùng xác nhận trong ứng dụng, hiển thị đối tượng, tác động và lý do; không cập nhật thành công trước phản hồi server.

## 3. Thứ tự code và tiêu chí nghiệm thu

Ước lượng cho một lập trình viên frontend, tái sử dụng code hiện có; không gồm thời gian Backend xây API hoặc thời gian chờ chốt nghiệp vụ.

| Đợt | Công việc cụ thể | Phụ thuộc | Nghiệm thu | Ước lượng |
| --- | --- | --- | --- | --- |
| M0 — Contract và nền tảng | Ghi ADMIN_CONTRACT.md; thống nhất enum, pagination, errors, revision, capabilities; chuẩn hóa fixture admin; bổ sung helper invalidation và xử lý conflict | Rà soát với Backend | Phân biệt API đang có/bổ sung; mock và service cùng shape; không tạo mock service song song | 1–2 ngày |
| M1 — Users và permissions | URL search/filter/page; danh sách và detail; xác nhận khóa/mở với lý do; role options từ server; đồng bộ cache; xử lý mất phiên/quyền | M0 | Đổi role/khóa phản ánh đúng ở các màn; server từ chối tự khóa/tự đổi role và thao tác làm mất admin hoạt động cuối cùng; sai role trả 403 | 2–3 ngày |
| M2 — Reports | Giữ filter khi quay lại; state machine server; xem bằng chứng/target read-only trong admin; ghi chú, assignee, conflict; moderation target nếu được phép | M0, contract target access | Đi hết open → under_review → resolved/rejected; reopen theo capability; không bị đưa sang route 403; hai admin không ghi đè quyết định nhau | 2–3 ngày |
| M3 — Limits và restrictions | Validation theo field, dirty state, revision; xem thay đổi trước lưu; bật/tắt rule và CRUD nếu được chốt | M0, quy tắc hiệu lực | Lỗi không làm mất draft; conflict cho phép tải bản mới có chủ đích; giới hạn/rule thật được Backend áp dụng ở nghiệp vụ liên quan | 1.5–2 ngày |
| M4 — Monitoring, statistics và dashboard | Capability retry/cancel; xử lý double click/timeout; polling có điều kiện; aggregate cards, links đến queue; filter thời gian và thiếu dữ liệu | API job và aggregate | Không tạo job trùng; retry/cancel sai trạng thái bị server chặn; partial failure không làm mất toàn trang; dashboard không tải toàn bộ records để tính tổng | 2–3 ngày |
| M5 — Audit viewer và tích hợp | Hoàn thiện bộ lọc/phân trang/detail event theo contract; tích hợp API thật theo module; E2E quyền/lỗi/concurrency; responsive và accessibility | M1–M4, Backend thật | Thao tác thật có event đúng actor/target/result; log read-only; lint/build và test liên quan đạt; kiểm tra lại trên môi trường tích hợp | 2–3 ngày |

Tổng dự kiến: **10.5–16 ngày công frontend**. Phần ghi audit cho mutation được làm ngay trong M1–M4; M5 hoàn thiện viewer và kiểm chứng xuyên suốt. CRUD restrictions và moderation target có thể làm tăng ước lượng nếu Backend yêu cầu workflow phê duyệt riêng.

## 4. Phân rã thay đổi trong code

### Shared và dữ liệu

- `src/features/admin/services/adminService.js`: giữ các method hiện có, thêm pagination/sort/filter, reason/revision và endpoint được chốt; truyền AbortSignal cho query detail.
- `src/lib/api/queryKeys.js`: đưa toàn bộ filter/range/page vào query key; giữ phân vùng theo tài khoản đăng nhập.
- `src/features/admin/models.js` (mới): enum, labels, quy tắc hiển thị và validation frontend; server vẫn là nguồn quyết định quyền/trạng thái hợp lệ.
- `src/features/admin/hooks/` (tạo khi cần): hooks mutation và invalidation liên quan users, permissions, report, audit, dashboard.
- `src/features/admin/components/` (tạo khi cần): bảng phân trang, form xác nhận có lý do, trạng thái conflict; tái sử dụng States và StatusBadge.
- `src/mocks/mockServer.js`: kiểm tra transition, revision và quyền như contract; fixture nhiều trang, rỗng, lỗi, nhiều admin và job đổi trạng thái. Có thể tách fixture admin thành `src/features/admin/data/adminFixtures.js` để giảm kích thước file.
- AuthProvider/HTTP boundary: rà soát và hoàn thiện phản ứng với 401/403, thu hồi phiên/quyền; xóa cache dữ liệu được bảo vệ khi kết thúc phiên.

### Màn hình

- Nâng cấp các `Admin*Page.jsx` hiện có theo từng milestone.
- Thêm `AdminOverviewPage.jsx`, thay riêng element route `/admin` trong `src/app/App.jsx` khi aggregate sẵn sàng; tiếp tục dùng chung WorkspaceLayout.
- Target report: ưu tiên preview read-only ngay trên detail từ dữ liệu server được phép cung cấp; chỉ thêm route admin riêng nếu nội dung đủ lớn. Không mở rộng guard Content Manager chỉ để sửa link.
- Chỉ bổ sung `admin.css` nếu cần tách style riêng; giữ tokens và convention hiện tại.

### Đồng bộ sau mutation

| Thao tác | Dữ liệu cần cập nhật hoặc invalidate |
| --- | --- |
| Lock/unlock, đổi role | User detail, users list, permissions, audit, tổng quan/statistics bị ảnh hưởng |
| Đổi trạng thái report | Report detail, mọi bộ lọc reports, audit, số report cần xử lý |
| Moderation target | Target preview, report liên quan, audit; query nội dung liên quan nếu nằm trong session được phép |
| Lưu limits/restrictions | Cấu hình tương ứng, audit; Backend quyết định hiệu lực với các nghiệp vụ khác |
| Retry/cancel job | Monitoring list/detail, audit, aggregate job |

Xóa draft của dòng permissions sau khi lưu thành công. Không tự retry mutation khi timeout và chưa biết server đã thực thi hay chưa; tải lại trạng thái hoặc dùng idempotency theo contract.

## 5. Contract cần chốt

Endpoint dưới đây là path tương đối trong adminService; HTTP client tự thêm API base URL.

| Nhóm | API đang dùng | Bổ sung cần thống nhất |
| --- | --- | --- |
| Users | GET `/admin/users`, GET/PATCH `/admin/users/:id` | page/pageSize hoặc cursor, sort, reason, revision, allowedActions |
| Permissions | GET `/admin/permissions`, PATCH `/admin/permissions/:id` | Catalog và role được phép gán cho từng target; hiệu lực phiên sau đổi role |
| Reports | GET `/admin/reports`, GET/PATCH `/admin/reports/:id` | Transition hợp lệ, required note/reason, assignee, target preview được phép xem |
| Target moderation | Chưa có method riêng | Contract read-only và action ẩn/khôi phục nếu nghiệp vụ cho phép; phân biệt story template với phiên bản/nội dung của trẻ |
| Limits | GET/PATCH `/admin/system-limits` | Miền giá trị, revision bắt buộc, thời điểm hiệu lực, xử lý dữ liệu đang vượt ngưỡng |
| Restrictions | GET `/admin/restrictions`, PATCH `/admin/restrictions/:id` | type/scope, normalization, rule trùng, CRUD nếu nằm trong MVP |
| Monitoring | GET `/admin/monitoring`, PATCH `/admin/monitoring/:id` | allowedActions, pagination, version, idempotency và trạng thái hủy/đang hủy |
| Statistics | GET `/admin/statistics` | Định nghĩa metric, timezone, from/to hoặc range, generatedAt, partial errors |
| Dashboard | Chưa có API riêng | Ưu tiên dùng aggregate hiện có nếu đủ; đề xuất GET `/admin/overview` khi cần số liệu vận hành riêng |
| Audit | GET `/admin/audit` | actor/action/target/time/result, pagination; detail chứa thay đổi được phép xem, reason, requestId |

Quy ước cần thống nhất:

- Collection: một shape thống nhất, ví dụ `{ items, total, page, pageSize }`; không tự áp nếu Backend chọn cursor.
- Mutation: trả resource mới và revision; request chứa revision bắt buộc cho nghiệp vụ có cạnh tranh cập nhật.
- Error: `{ code, message, fieldErrors?, requestId? }`, phân biệt 401, 403, 404, 409, 422, 429 và 5xx theo contract.
- Capability/action trả về từ server; guard frontend chỉ hỗ trợ trải nghiệm.
- Audit được Backend ghi, gắn với kết quả mutation; không ghi log thành công từ client trước khi server xác nhận.
- Phải chốt mô hình session thật, CORS/cookie và CSRF nếu dùng cookie như HTTP client hiện tại.

## 6. Kế hoạch kiểm thử

Kế thừa test G2/G4/G5/G6; bổ sung test theo rủi ro thay vì chỉ kiểm tra tiêu đề màn hình.

| Nhóm | Kịch bản cần có |
| --- | --- |
| Quyền | Chưa login, Parent/Content truy cập admin, gọi trực tiếp API sai quyền, phiên bị khóa hoặc role bị thu hồi |
| Users | Tìm/lọc/phân trang, refresh giữ filter, khóa/mở, lỗi server, tự khóa, admin hoạt động cuối cùng |
| Permissions | Options từ catalog, đổi role cập nhật users/detail, draft reset, thao tác không được phép bị server từ chối |
| Reports | Transition hợp lệ/không hợp lệ qua API, resolve/reject/reopen, revision cũ, target thiếu/bị xóa, preview không 403 |
| Cấu hình | Giá trị rỗng/âm/thập phân/vượt biên, field errors, revision conflict, lưu lỗi giữ draft |
| Monitoring | Retry failed, cancel khi được phép, double click, timeout, trạng thái đã đổi ở server |
| Audit | Mutation thật xuất hiện đúng actor/action/target/result; filter/phân trang; không có khả năng sửa log |
| UX | Loading/empty/error/partial error, bàn phím, focus dialog, bảng trên màn nhỏ và thông báo kết quả |

Chạy lint, build và Playwright liên quan sau mỗi đợt thay đổi. Với thay đổi shared auth/cache/router, chạy thêm hồi quy Parent và Content. Chỉ đánh dấu tích hợp hoàn tất sau khi kịch bản quyền, mutation và audit chạy với Backend thật; test mock không chứng minh server đã bảo vệ dữ liệu.

## 7. Các quyết định cần chốt khi bắt đầu M0

1. Admin quản lý những role nào, có được tạo/mời admin khác hay chỉ sửa tài khoản đã có?
2. Được xem những bằng chứng/dữ liệu trẻ nào khi xử lý report; được thao tác gì với target?
3. Limits áp dụng ngay hay chỉ cho tác vụ mới; quan hệ giữa giới hạn hệ thống, entitlement gói và cấu hình Parent?
4. Restrictions MVP chỉ bật/tắt hay bao gồm tạo/sửa; match theo từ khóa/chủ đề thế nào?
5. Backend có API/session/job/audit nào sẵn sàng; contract thời gian và phân trang dùng chuẩn nào?

Trong khi chờ chốt, có thể hoàn thiện filter URL, cache invalidation, field errors, trạng thái rỗng/lỗi và các test hồi quy dựa trên contract hiện hành. Các chức năng cần quyền mới chỉ triển khai sau khi phạm vi dữ liệu và capability được thống nhất.

**Điểm bắt đầu đề xuất:** M0 → M1 → M2; hoàn thành luồng quản lý tài khoản và xử lý báo cáo trước khi bổ sung dashboard.
