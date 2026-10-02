# Kế hoạch hoàn thiện role Admin

Ngày lập: 23/09/2026. Phạm vi: Web Frontend SketchTale và yêu cầu contract liên quan Backend.

> Cập nhật 30/09/2026: mục 8–14 là kế hoạch hoàn thiện UI/UX hiện hành cho đủ 11 trang Admin và các luồng dùng chung. Hiện trạng tại mục 8 thay thế nhận định cũ nếu khác biệt; backlog và ước lượng tại mục 12 thay thế thứ tự/ước lượng mục 3 cho đợt hoàn thiện này. Mục 1–7 giữ làm cơ sở nghiệp vụ. Đây là kế hoạch dựa trên mã nguồn, chưa triển khai giao diện, chạy ứng dụng hoặc nghiệm thu bằng ảnh chụp.
> [ADMIN_CONTRACT.md](ADMIN_CONTRACT.md) hiện mới mô tả baseline Users/Permissions và quy ước chung. Các trường/endpoint bổ sung bên dưới đều là đề xuất cần thống nhất với Backend, không phải API đã được xác nhận.

> Trạng thái triển khai 30/09/2026: đã code đợt đầu ADM-F0–F4 trên mock — Admin overview aggregate, sidebar đủ module, Users page size/Child filter, Permissions search + reason theo target, Reports URL pagination + read-only target preview, Audit pagination/result/detail drawer, Limits field validation/diff/reset, Restrictions filter/pending/revision và Monitoring filter/polling/pending/audit. Đã thêm `tests/admin-implementation.spec.js`. Chưa đánh dấu Contract ready hoặc Integration ready: các capability, Child policy, moderation preview, limits/restrictions semantics, monitoring idempotency và audit fields vẫn cần Backend chốt theo mục 11.

Kế hoạch dựa trên router, các trang `src/features/admin`, `adminService`, `mockServer`, các test G2/G4/G5/G6 và backlog A-01–A-10 trong [kế hoạch tổng thể](WEB_IMPLEMENTATION_PLAN.md). Đây là kế hoạch triển khai tiếp từ code hiện có; các API bổ sung dưới đây là đề xuất, chưa phải contract Backend đã được duyệt.

## 1. Hiện trạng đã kiểm tra

| Module | Đã có | Phần cần hoàn thiện |
| --- | --- | --- |
| Auth và workspace | Login mock, RequireAuth, RequireRole, sidebar, query keys theo user | Phiên thật, xử lý bị khóa/thu hồi quyền khi đang sử dụng |
| Tổng quan `/admin` | Trang dùng chung RoleOverviewPage, link đến các module | Dashboard nghiệp vụ từ aggregate API |
| Users | List, tìm kiếm/lọc, detail, lock/unlock cho các account được cấp quyền | Phân trang, filter trên URL, lý do thao tác, đồng bộ cache và audit; bổ sung Child account sau khi auth contract chốt |
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

- Ưu tiên P0: tài khoản Parent/Child/Content Manager, phân quyền, xử lý report và audit cho các thao tác thay đổi dữ liệu.
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

## 8. Audit code và danh mục trang cập nhật 30/09/2026

Đối chiếu `src/app/App.jsx`, `WorkspaceLayout.jsx`, `workspace.css`, `src/styles/tokens.css`, toàn bộ trang Admin, `models.js`, `adminService.js`, các handler Admin trong `mockServer.js` và cấu trúc test hiện có. Đây là audit tĩnh, không khẳng định bố cục hiện tại đã đạt ở viewport nào.

| ID | Route / file trong `src/features/admin/pages/` | Hiện có qua mã nguồn | Khoảng trống cần giải quyết |
| --- | --- | --- | --- |
| AD-01 | `/admin` → `RoleOverviewPage` dùng chung | Điểm vào các module | Chưa có tổng quan vận hành riêng hoặc aggregate overview |
| AD-02 | `/admin/users` → `AdminUsersPage.jsx` | Search/role/status/sort/page trên URL, phân trang, giữ dữ liệu trước khi query mới về | Search mỗi phím đổi URL; thiếu dấu đang cập nhật, giữ ngữ cảnh quay lại, lựa chọn page size; chưa có Child trong filter |
| AD-03 | `/admin/users/:userId` → `AdminUserDetailPage.jsx` | Detail, reason/revision, lock/unlock, cập nhật cache users/permissions/audit | Khóa dùng `window.confirm`, mở khóa chưa cùng quy trình; conflict mới là dòng thông báo; thiếu field errors và liên kết audit theo target ID |
| AD-04 | `/admin/permissions` → `AdminPermissionsPage.jsx` | Nhận catalog `roles`, có fallback hardcode; draft theo dòng, invalidate users/detail/audit, reset draft sau lưu | Reason dùng chung mọi dòng; chưa xem trước thay đổi; thiếu target-specific roles, tìm/lọc, conflict recovery; thiếu capability vẫn cho sửa |
| AD-05 | `/admin/reports` → `AdminReportsPage.jsx` | Search/status local; service/mock có page/pageSize | UI chưa điều khiển phân trang; refresh mất filter; thiếu queue density và tình trạng cần xử lý |
| AD-06 | `/admin/reports/:reportId` → `AdminReportDetailPage.jsx` | Ghi chú gắn với mutation trạng thái, revision; mock đã kiểm tra transition và ghi audit | Link target sang Content bị guard chặn; action dựa vào status local; chưa bảo vệ draft/conflict, thiếu invalidation audit; chưa có endpoint lưu note độc lập |
| AD-07 | `/admin/system-limits` → `AdminSystemLimitsPage.jsx` | Năm trường số, dirty state, revision, cập nhật thời gian | Xóa input lập tức thành số 0; lỗi chỉ toàn form, chưa diff/reset/dirty guard/conflict recovery; chưa audit mutation trong mock |
| AD-08 | `/admin/restrictions` → `AdminRestrictionsPage.jsx` | Danh sách rule, bật/tắt status | Chưa tìm/lọc/phân trang/empty riêng, xác nhận tác động, revision/capability/audit; một pending khóa mọi dòng |
| AD-09 | `/admin/monitoring` → `AdminMonitoringPage.jsx` | Job cards, progress, retry/cancel; mock chặn action sai trạng thái | Nút vẫn suy từ status, chưa capability; summary đếm `items`, chưa aggregate; thiếu lọc/phân trang/polling, retry an toàn và audit |
| AD-10 | `/admin/statistics` → `AdminStatisticsPage.jsx` | Range 7/30 ngày trên URL, bốn chỉ số, bảng trend, partial warning | Thiếu định nghĩa metric, freshness/timezone, null/empty theo section; chưa có chart |
| AD-11 | `/admin/audit` → `AdminAuditPage.jsx` | Actor/action/range/search trên URL; service/mock có phân trang | UI chưa pagination/detail; mọi dòng bị gắn “Thành công” bất kể status; target đang là text, chưa targetId có cấu trúc |

Các điểm xuyên suốt cần đưa vào backlog:

- Sidebar Admin có sáu mục, chưa có Permissions, Limits, Restrictions dù router đã có. Không để tính năng chỉ tìm được qua URL hoặc trang tổng quan.
- Giữ React/Vite, JavaScript/JSX, React Router, TanStack Query, Nunito Variable và Phosphor Icons đã cài. Không đưa yêu cầu đổi framework, font hoặc UI library vào đợt hoàn thiện này.
- `models.js` đã tồn tại; mở rộng file này, không tạo lại như mô tả cũ tại mục 4.
- Mock Users/Permissions/Reports đã ghi audit; Limits/Restrictions/Monitoring chưa ghi. Revision ở một số handler còn tùy chọn. Đây là khoảng trống cần sửa, không phải bảo đảm concurrency đã hoàn chỉnh.
- Mock Permissions trả catalog thiếu Child trong khi PATCH nhận `child`; kiểm tra admin cuối cùng đang đếm mọi admin, chưa xét admin hoạt động. Hợp nhất chính sách với Backend, kiểm tra cả khóa tài khoản và đổi role.
- `isConflictError` đang coi mọi HTTP 409 là revision conflict. Phải phân biệt `REVISION_CONFLICT` với lỗi chính sách như `LAST_ADMIN_NOT_ALLOWED` để đưa đúng cách xử lý.
- Phạm vi sản phẩm đã có Child account độc lập. Admin quản lý Child theo quyền được cấp; không suy ra được phép xem nội dung riêng, liên kết Parent hoặc chuyển loại tài khoản tự do.

## 9. Chuẩn thiết kế và hành vi dùng chung

### 9.1. Hướng giao diện

**Định hướng:** workspace quản trị SketchTale sáng, rõ ràng, thân thiện nhưng gọn; ưu tiên đọc dữ liệu và quyết định đúng. Giữ vàng thương hiệu, nền trung tính ấm, chữ đậm tối, dùng màu trạng thái có ý nghĩa. Không dùng hero quảng cáo hoặc minh họa lớn chiếm phần đầu các trang nghiệp vụ.

Các giá trị sau là mục tiêu thiết kế khi triển khai, cần kiểm tra trực quan và tương phản thực tế:

| Thành phần | Quy chuẩn |
| --- | --- |
| Nền / bề mặt / chữ | Kế thừa workspace `#f8f7f3` / trắng / `#18202f`; hợp nhất thành tokens scoped cho Admin, không ghi đè toàn bộ Public/Parent |
| Accent | Vàng hiện có `#f4be36` cho CTA chính, chữ tối; nền vàng nhạt cho active nav; màu xanh/đỏ/hổ phách chỉ mang nghĩa trạng thái |
| Typography | Nunito hiện có; H1 28–32px desktop, 24–28px mobile; H2 18–20px; body/input 14–16px; metadata tối thiểu 12px; số liệu dùng tabular numerals |
| Spacing | Thang 4/8/12/16/24/32px; giữa các khối 24px, padding panel 20–24px, mobile 16px |
| Hình khối | Input/button radius 10px, panel 14–16px, badge pill; border nhẹ; hạn chế shadow, bỏ hiệu ứng nhún mạnh ở nút quản trị |
| Header | Breadcrumb khi có cấp con → H1 → mô tả một câu; hành động chính nằm cùng vùng header; 1366×768 thấy được bộ lọc và những dòng đầu |
| Mật độ | Dòng bảng khoảng 56–64px; tối đa hai tầng text/cell; 10 dòng mặc định, chọn 10/25/50 nếu API hỗ trợ; không bọc mỗi ô thành card |
| Icon / motion | Phosphor 18–20px, cùng weight; hover/focus 120–180ms; motion chỉ báo phản hồi, tôn trọng reduced motion |
| Ngôn ngữ | Label tiếng Việt: “Vai trò”, “Đối tượng”, “Thử lại”, “Hủy tác vụ”, “Nhật ký thao tác”; không đưa “mock”, “server”, “revision” vào hướng dẫn thường ngày |

ID, request ID, revision vẫn có thể nằm trong vùng “Thông tin kỹ thuật” thu gọn khi giúp tra lỗi; không dùng chúng làm tiêu đề chính.

### 9.2. Shell, điều hướng và responsive

- Nhóm **Tổng quan**: Tổng quan. Nhóm **Quản trị**: Tài khoản, Phân quyền, Báo cáo nội dung. Nhóm **Hệ thống**: Giới hạn hệ thống, Nội dung hạn chế, Giám sát tác vụ. Nhóm **Theo dõi**: Số liệu, Nhật ký thao tác. Chín mục chính; hai trang detail nằm dưới mục cha.
- Sidebar desktop giữ rộng khoảng 248px, có cuộn riêng khi màn thấp; Hồ sơ/Đăng xuất vẫn truy cập được. Active item có cả nền, chữ và `aria-current`.
- Nội dung tối đa khoảng 1440px cho bảng rộng, form đơn tối đa 880px; không kéo field phủ cả màn hình rộng. Chỉ áp dụng override trong nhánh Admin.
- Từ 1024px trở lên dùng sidebar; dưới 1024px dùng drawer có overlay, Esc, focus trap, trả focus về nút mở và đóng khi chuyển route. Đồng bộ breakpoint này với CSS thực tế trong ticket shell.
- Tablet: filter chia hai cột, detail/action xếp dọc nếu không đủ rộng. Mobile 390px và kiểm tra thêm 360px: filter một cột hoặc panel mở rộng có badge đếm điều kiện; CTA không che nội dung.
- Users/Reports/Restrictions/Jobs chuyển thành dòng thông tin xếp dọc trên mobile; giữ tên, trạng thái và hành động chính. Bảng số liệu/audit có thể cuộn ngang trong vùng có nhãn và dấu hiệu cuộn; không cuộn ngang toàn trang.
- Detail có breadcrumb và “Quay lại danh sách”; giữ search/filter/page/sort khi quay lại. Chỉ nhận return path nội bộ hợp lệ; truy cập detail trực tiếp thì về danh sách mặc định.
- Title trình duyệt riêng từng trang. `/profile`, đăng nhập, 403, 404 và đăng xuất là luồng liên quan cần regression; không tạo bản riêng cho Admin.

### 9.3. Bảng, filter và dữ liệu

- Filter/sort/page/range có trên URL theo endpoint đã hỗ trợ; normalize giá trị lạ và reset page khi thay filter. Search debounce khoảng 300ms, Enter áp dụng ngay; thay text dùng replace để Back không đi qua từng phím.
- Header/filter không biến mất khi query đang tải. Skeleton theo đúng cấu trúc bảng/panel; refetch giữ dữ liệu cũ, có “Đang cập nhật…” và không giả hiển thị kết quả cũ là của filter mới.
- Khi dữ liệu placeholder còn thuộc filter cũ, tạm khóa thao tác thay đổi dữ liệu và điều khiển phân trang phụ thuộc kết quả. Response chậm của query cũ không ghi đè query mới.
- Footer có “1–10 / 42 kết quả”, page size, Trước/Sau; khi total=0 hiển thị “0 kết quả”. Nếu page vượt totalPages sau mutation, chuyển về trang hợp lệ và query lại một lần.
- Không lấy tổng hệ thống bằng cách đếm trang hiện tại. Chỉ hiển thị số liệu tổng/counter khi endpoint cung cấp đúng phạm vi; nếu là số trên trang phải ghi rõ.
- Trạng thái luôn có text; enum không nhận diện hiển thị trung tính “Chưa xác định”, không suy thành thành công. Email/ID/tên dài không phá layout; có cách đọc đầy đủ bằng detail hoặc vùng mở rộng dùng được bằng bàn phím.

### 9.4. Form, xác nhận, lỗi và accessibility

| Trạng thái | Hành vi bắt buộc |
| --- | --- |
| Chưa có dữ liệu | Giải thích ngắn đúng nghiệp vụ; CTA chỉ khi có việc được phép làm; không mời tạo tài khoản/rule nếu chưa có API |
| Không khớp bộ lọc | Giữ filter và cung cấp “Xóa bộ lọc”; không gọi đây là lỗi tải |
| Tải lần đầu / refetch lỗi | Lần đầu có Retry tại vùng lỗi; refetch lỗi giữ dữ liệu cũ cùng thời điểm cập nhật và banner, không xóa toàn bộ màn |
| 401 / 423 | Kết thúc phiên theo auth contract, xóa dữ liệu bảo vệ trong cache, giải thích cần đăng nhập lại hoặc tài khoản bị khóa |
| 403 / 404 | 403 nêu không đủ quyền; 404 nêu đối tượng không còn tồn tại, có đường quay lại; không auto-retry vô hạn |
| 409 revision | Giữ draft, có “Xem bản mới”; tải server snapshot riêng, so sánh thay đổi trước khi chọn bỏ draft hoặc áp lại phần còn hợp lệ rồi xác nhận lại |
| 409 chính sách | Nêu lý do như không thể đổi vai trò của chính mình; không hướng người dùng reload để vượt chính sách |
| 422 | Lỗi sát field, error summary liên kết field đầu tiên; giữ dữ liệu đã nhập, dùng `aria-invalid` và `aria-describedby` |
| 429 / 5xx / mất mạng | Có thông báo và Retry phù hợp; 429 theo thời gian retry nếu server cung cấp; mutation timeout cần kiểm tra kết quả trước khi gửi lại |
| Đang gửi / thành công | Khóa đúng form hoặc resource đang gửi; giữ tên đối tượng; thành công chỉ sau response, cập nhật badge/cache và thông báo `role=status` |

- Thay `window.confirm` bằng dialog dùng chung: tiêu đề có động từ + đối tượng, tác động cụ thể, lý do, “Quay lại” và CTA xác nhận rõ ràng. Không dùng “OK” chung chung. Không yêu cầu gõ lại email trừ khi nghiệp vụ thực sự cần.
- Capability thiếu: mặc định chỉ đọc cho hành động nhạy cảm, giải thích chưa xác định quyền; không fallback cho phép tất cả. Nếu cần tương thích backend cũ, mapping phải được thống nhất tập trung và có test riêng.
- Reason bắt buộc cho thao tác nhạy cảm là mục tiêu contract; độ dài/min/max phải thống nhất Backend. Mỗi quyết định có reason riêng, không dùng chung giữa nhiều tài khoản.
- Form giữ giá trị input dạng text trong draft để biểu diễn trường rỗng; chỉ parse khi validate/submit. Có Hủy thay đổi, dirty indicator và bảo vệ điều hướng/đóng tab cho form đang sửa. Không lưu bằng chứng hoặc dữ liệu riêng vào localStorage.
- Gắn draft với ID và revision **lúc bắt đầu sửa**. Background refetch không tự thay revision nền rồi gửi draft cũ dưới revision mới. Đổi detail ID phải reset hoặc xác nhận bỏ draft.
- Tab/Shift+Tab có thứ tự hợp lý, focus ring rõ; dialog có tên truy cập, trap focus, Esc và trả focus; không dựa vào hover để đọc lỗi/quyền. Khi đang mutation mà đóng dialog, request state vẫn được quản lý đến khi có kết quả.
- Mục tiêu nghiệm thu: text thường contrast ≥4.5:1, text lớn/UI control ≥3:1; target thao tác chính khoảng 44px; zoom 200% dùng được; error dùng `role=alert` có chọn lọc, không đọc lại cả bảng mỗi lần polling.

## 10. Đặc tả hoàn thiện từng trang

Các mục dưới đây kế thừa toàn bộ trạng thái ở mục 9.4. Trường chưa được API cung cấp chỉ xuất hiện trong fixture được ghi rõ hoặc sau khi contract hoàn tất; không dựng số liệu giả để lấp chỗ trống trên production.

### AD-01 — Tổng quan `/admin`

**Mục tiêu:** trong một màn hình đầu, biết việc nào cần xử lý và đi đúng nơi thực hiện.

- Bố cục: header “Tổng quan quản trị”, thời điểm cập nhật, nút Làm mới → dải chỉ số → vùng “Cần xử lý” rộng 2/3 + “Hoạt động gần đây” rộng 1/3. Mobile xếp dọc, việc cần xử lý ở trước nhật ký.
- Tối đa bốn chỉ số có nguồn aggregate: báo cáo chờ xử lý, báo cáo đang xem xét, tác vụ lỗi, tác vụ đang chạy. Không thêm biểu đồ tăng trưởng trang trí; statistics phụ trách xu hướng.
- Danh sách cần xử lý giới hạn 5 mục mỗi loại, có đối tượng, trạng thái, thời điểm và link trực tiếp; CTA “Xem hàng đợi” dẫn sang filter tương ứng. Thứ tự ưu tiên lấy từ quy tắc/server đã chốt, không tự tính mức nghiêm trọng từ nội dung.
- Hoạt động gần đây hiển thị actor, hành động, đối tượng, thời điểm; link Nhật ký. Truy cập nhanh các trang cấu hình là link phụ, không chiếm hàng KPI.
- Data: đề xuất overview aggregate có counts, danh sách rút gọn, generatedAt và errors theo section; nếu tái sử dụng endpoint hiện có phải đủ ngữ nghĩa, không fetch toàn bộ users/reports/jobs để tính tổng.
- Trạng thái riêng: mọi việc đã xử lý → thông điệp “Không có việc cần xử lý”; một nguồn lỗi → retry tại section, phần khác vẫn dùng được; thiếu tổng → “Chưa có dữ liệu”, không số 0.
- **Nghiệm thu:** bốn link KPI mở đúng filter; mỗi section chịu lỗi độc lập; không đếm từ danh sách phân trang; các mục điều hướng vẫn dùng được khi overview API lỗi.

### AD-02 — Danh sách tài khoản `/admin/users`

**Mục tiêu:** tìm chính xác tài khoản và kiểm tra tình trạng trước khi vào chi tiết.

- Bố cục: header + tổng kết quả → search rộng nhất, Vai trò, Trạng thái, Sắp xếp → filter chips → bảng → footer phân trang. Không có CTA tạo/mời tài khoản trong scope hiện tại.
- Cột: Tài khoản (avatar chữ cái, tên, email hoặc định danh được phép), Vai trò, Trạng thái, Cập nhật lần cuối nếu có, Xem chi tiết. Không dùng avatar ảnh trẻ hoặc tự mở dữ liệu gia đình.
- Search có nút xóa; thêm page size 10/25/50; giữ hai sort hiện có `name_asc`, `email_asc`, chỉ thêm sort khác sau khi service/mock/backend thống nhất.
- Child hiển thị theo catalog và policy đã thống nhất; không giả định mọi Child có email. Nếu trường định danh vắng, dùng nhãn an toàn thay vì render `undefined`.
- Click tên hoặc Xem chi tiết mở AD-03, giữ bộ lọc vào return context. Không bắt buộc click cả row và không đặt thao tác khóa nhanh tại list trong đợt đầu.
- Trạng thái riêng: input đang gõ vẫn focus khi query cập nhật; tự chỉnh page vượt giới hạn; mục tiêu đã xóa giữa list và detail được xử lý ở AD-03.
- **Nghiệm thu:** refresh/Back/Forward giữ đúng trạng thái; test >50 tài khoản, tên/email dài, Child thiếu email, 0 kết quả; số tổng không đổi sai khi đổi page; thao tác bằng bàn phím đầy đủ.

### AD-03 — Chi tiết tài khoản `/admin/users/:userId`

**Mục tiêu:** xem thông tin cần thiết và khóa/mở khóa có lý do, truy vết được.

- Header: breadcrumb, tên, vai trò, badge trạng thái. Desktop chia nội dung 2/3 và panel hành động 1/3; mobile thông tin nhận diện → thao tác → thông tin bổ sung.
- Khối thông tin: định danh, email nếu được phép, gói nếu áp dụng, cập nhật lần cuối; ID có Sao chép và phản hồi rõ. Dữ liệu không áp dụng hiển thị “Không áp dụng”, không gán gói cho Child bằng suy đoán.
- Panel hành động: Khóa hoặc Mở khóa, lý do không được thao tác khi self/last active admin/capability; link “Quản lý vai trò” tới AD-04 với target được chọn. Không thêm reset password, impersonation hoặc xóa account.
- Luồng: chọn action → dialog nêu tên và tác động phiên theo contract → nhập lý do → xác nhận → pending → cập nhật trạng thái + thông báo + cache các màn liên quan. Cả khóa và mở khóa dùng cùng cấu trúc.
- Vùng nhật ký gần đây/link nhật ký theo target chỉ bật khi audit có targetId; không dùng tên/email text search thay cho quan hệ chính xác. Chi tiết quan hệ Parent–Child chỉ hiển thị nếu contract cấp quyền.
- Trạng thái riêng: xung đột giữ reason, cho xem trạng thái mới và xác nhận lại; tài khoản bị xóa → 404 có quay lại; 409 chính sách hiển thị ngay trong dialog.
- **Nghiệm thu:** không tự khóa, không làm mất admin hoạt động cuối cùng; lock/unlock có reason đúng đối tượng; thất bại không đổi badge; dialog focus/keyboard đạt; quay lại đúng trang list.

### AD-04 — Phân quyền `/admin/permissions`

**Mục tiêu:** thấy rõ vai trò hiện tại, vai trò đích và phạm vi tác động trước khi đổi.

- Bố cục: header → mô tả ngắn các vai trò có thể gán trong panel thu gọn → search/filter → bảng Tài khoản, Vai trò hiện tại, Trạng thái, Đổi vai trò. Không biến trang thành ma trận permission chưa có dữ liệu.
- Chuyển từ nhiều select luôn mở sang chỉnh một tài khoản mỗi lần trong dialog/drawer. Hiển thị “Vai trò hiện tại → Vai trò mới”, mô tả quyền thay đổi và ảnh hưởng phiên do catalog cung cấp.
- Luồng: chọn tài khoản → chọn trong tập roles hợp lệ của target → lý do riêng → kiểm tra thay đổi → xác nhận. Không gửi nếu role chưa đổi; hủy không ảnh hưởng tài khoản khác.
- Catalog hiện có là toàn cục `{ users, roles }`; đề xuất thêm vai trò cho phép theo target và mô tả quyền. Không cho sửa nếu catalog tải lỗi hoặc thiếu capability. Role không còn trong catalog vẫn hiển thị nhãn hiện tại nhưng không tự chọn thay thế.
- Trước khi API có pagination, có thể tìm/lọc local trên **toàn bộ** `users` response hiện tại và ghi rõ phạm vi; không giả server pagination. Thêm pagination khi contract collection mới được chốt.
- Trạng thái riêng: đổi role thành công cập nhật AD-02/03/04 và audit; reason/draft chỉ reset target vừa lưu; self/last admin không dùng reload như giải pháp.
- **Nghiệm thu:** không lẫn reason giữa hai người; catalog thiếu/lỗi không lộ lựa chọn hardcode; two-admin conflict không ghi đè; kiểm tra rule chuyển Parent/Child theo nghiệp vụ thay vì chỉ thấy enum là cho phép.

### AD-05 — Hàng đợi báo cáo `/admin/reports`

**Mục tiêu:** ưu tiên kiểm tra các báo cáo còn mở, theo dõi người xử lý và quay lại đúng vị trí.

- Bố cục: header → bộ chọn trạng thái Tất cả/Mới/Đang xem xét/Đã giải quyết/Từ chối → search + sort → bảng queue. Các bộ chọn có ngữ nghĩa filter, không dùng ARIA tab nếu không có tab panel.
- Cột: Đối tượng + mã báo cáo, Lý do rút gọn, Trạng thái, Người xử lý, Cập nhật, Xem chi tiết. “Chưa phân công” khi assignee rỗng; chỉ cung cấp dữ liệu người gửi theo quyền.
- Đưa `status/search/page/pageSize/sort` lên URL; dùng sort mặc định `updated_desc` hiện có. Đề xuất sort chờ lâu nhất/loại đối tượng/người xử lý cho giai đoạn contract mở rộng; chưa có API thì không hiển thị điều khiển giả.
- Tổng theo trạng thái cần aggregate riêng; không đếm từ page đang mở. Không có bulk resolve vì mỗi quyết định cần kiểm tra bằng chứng.
- Luồng: lọc → xem AD-06 → xử lý → quay lại giữ filter/page; report vừa rời filter thì biến mất sau dữ liệu mới và tổng được cập nhật.
- Trạng thái riêng: queue rỗng thật “Chưa có báo cáo”; filter không khớp “Không có báo cáo phù hợp”; loading giữ bộ lọc; tên truyện/bằng chứng dài không làm row cao vô hạn.
- **Nghiệm thu:** không bỏ sót report ngoài trang đầu; refresh giữ filter; mutation đổi status phản ánh mọi query liên quan; detail return hoạt động cả khi bản ghi đã rời queue.

### AD-06 — Chi tiết báo cáo `/admin/reports/:reportId`

**Mục tiêu:** đọc đủ bằng chứng, ghi quyết định và kiểm soát trạng thái xử lý.

- Header: mã báo cáo, tên đối tượng, status, người xử lý và cập nhật. Desktop hai cột: bằng chứng/lịch sử rộng 2/3; panel quyết định rộng 1/3, sticky có giới hạn không che footer. Mobile thứ tự bằng chứng → quyết định → lịch sử.
- Bằng chứng: lý do đầy đủ, nội dung gửi, metadata được cấp quyền; preview target read-only tại Admin. Nếu có ảnh/audio theo contract, hiển thị loading/lỗi tải và mở lớn bằng bàn phím; không autoplay.
- Bỏ link `/content/stories/...` cho Admin. Khi preview chưa có API, ghi “Chưa có bản xem nội dung” cùng bằng chứng được phép, không gọi editor dưới quyền khác.
- Workflow: `open → start_review → under_review → resolve/reject → resolved/rejected`; reopen theo capability. UI lấy actions từ server, mapping label tập trung; nhận xử lý/assignee và cạnh tranh giữa hai admin phải có quy tắc nhất quán.
- Note đi kèm action theo API hiện tại. Chưa hiển thị nút “Lưu ghi chú” độc lập trước khi có contract tương ứng. Resolve/reject/reopen cần quy tắc lý do được Backend chốt; decision dialog cho xem trước trạng thái mới và nội dung note.
- Timeline: tác giả, thời gian, ghi chú và chuyển trạng thái nếu có dữ liệu; giữ xuống dòng, render text an toàn. Không biến note tự do thành HTML thực thi.
- Moderation target (ẩn/khôi phục) là scope có điều kiện: panel riêng theo capability, không gộp với resolve. Nếu một thao tác thành công, thao tác còn lại thất bại, trình bày hai kết quả và cách tiếp tục.
- Trạng thái riêng: target bị xóa/không được phép xem vẫn có báo cáo và lịch sử được cấp; note chưa lưu được bảo vệ; conflict giữ note, tải snapshot mới và yêu cầu quyết định lại; đổi report ID không mang note sang report khác.
- **Nghiệm thu:** toàn bộ transition hợp lệ và bị cấm có test API/mock; không link 403 sang Content; 2 admin xử lý đồng thời không ghi đè; resolved không tự ẩn truyện; audit và queue cập nhật đúng sau action.

### AD-07 — Giới hạn hệ thống `/admin/system-limits`

**Mục tiêu:** hiểu từng giới hạn, biết thay đổi gì và thời điểm áp dụng trước khi lưu.

- Bố cục form rộng tối đa 880px, chia ba nhóm Nội dung, Tạo nội dung tự động, Tài khoản; panel giải thích hiệu lực; thanh lưu hiển thị khi dirty, không che field khi mobile/zoom.
- Giữ đủ năm field hiện có, label rõ và đơn vị ngoài input:

| Field | Nhãn / trợ giúp cần có |
| --- | --- |
| `maxAssetSizeMb` | Dung lượng tài sản tối đa (MB); áp dụng file nào và quy đổi MB theo Backend |
| `maxStoryPages` | Số trang tối đa mỗi truyện; xử lý draft đang vượt mức sau khi giảm |
| `maxSlotsPerRole` | Số vị trí xuất hiện tối đa mỗi vai; phân biệt vai và slot |
| `aiGenerationsPerMinute` | Lượt tạo AI tối đa mỗi phút; cần chốt phạm vi toàn hệ thống hay tài khoản |
| `parentChildProfileLimit` | Giới hạn hồ sơ/liên kết trẻ của Parent; cần chốt nghĩa theo mô hình Child account hiện tại |

- Luồng: sửa → validate field → “Xem thay đổi” liệt kê cũ/mới chỉ những field đã đổi → lý do nếu contract yêu cầu → Lưu → cập nhật thời gian. “Hủy thay đổi” phục hồi snapshot đã tải có xác nhận khi cần.
- Validation theo baseline số nguyên dương; upper bound và phụ thuộc giữa field lấy contract, không tự đặt. Trường rỗng giữ rỗng; không tự chuyển về 0. Không cho Lưu khi pristine/pending/invalid.
- Chỉ mô tả hiệu lực ngay/tác vụ mới khi Backend xác nhận. Limits, entitlement gói và cấu hình Parent là ba lớp khác nhau; không tuyên bố thay limits sẽ tự sửa gói người dùng.
- Trạng thái riêng: dirty guard khi rời trang; conflict so sánh snapshot gốc, draft và bản server mới; giữ tất cả field khi 422/5xx; cập nhật nền không thay baseline của draft.
- **Nghiệm thu:** rỗng/âm/0/thập phân/vượt ngưỡng đều có lỗi đúng field; diff chính xác; revision gốc đi cùng payload; audit có thay đổi và reason; Backend thực sự áp dụng giới hạn trong luồng liên quan.

### AD-08 — Nội dung hạn chế `/admin/restrictions`

**Mục tiêu:** nhận biết rule đang áp dụng và tác động trước khi bật/tắt.

- Bố cục: header → search + Loại + Phạm vi + Trạng thái → danh sách bảng. Cột Nội dung, Loại, Phạm vi, Lý do, Trạng thái, Cập nhật, Thao tác; mobile dùng dòng xếp dọc.
- MVP hoàn thiện bật/tắt rule hiện có. Không hiện Tạo/Sửa/Xóa trước khi scope CRUD được duyệt; route mới không bắt buộc, nếu mở rộng dùng drawer trên cùng trang.
- Đổi toggle icon tức thời thành hành động có nhãn “Bật hạn chế” / “Tắt hạn chế” → dialog mô tả giá trị, phạm vi, tác động và lý do → gửi → cập nhật badge sau response. Nếu giữ switch, trạng thái checked không đổi trước thành công và phải có accessible name.
- Tìm/lọc local chỉ trên collection đầy đủ hiện tại; khi mở rộng server pagination phải chuyển toàn bộ filter/query keys tương ứng. Không báo tổng toàn hệ thống bằng số dòng khớp của một page.
- Cần Backend cung cấp revision, capability, quy tắc normalization/dấu/chữ hoa, hiệu lực với bản đã publish. Nếu thêm CRUD: validate trùng sau normalization và giữ draft khi lỗi; không tự giả định match substring là đúng.
- Trạng thái riêng: không có rule → giải thích; row đang gửi có pending riêng; conflict rule vừa đổi cho xem bản mới; giá trị dài có mở rộng; lỗi chỉ rõ rule nào bị lỗi.
- **Nghiệm thu:** không bật/tắt nhầm khi list refetch/reorder; double click một mutation; thất bại giữ trạng thái cũ; kiểm tra audit và hiệu lực trên validate nội dung theo contract.

### AD-09 — Giám sát tác vụ `/admin/monitoring`

**Mục tiêu:** thấy tác vụ bất thường, đọc nguyên nhân và thao tác phục hồi đúng điều kiện.

- Bố cục: header + thời điểm cập nhật + Làm mới/tự cập nhật → summary theo aggregate → filter trạng thái/loại/search → bảng jobs → vùng detail mở rộng hoặc drawer. Không tạo route detail nếu chưa có nhu cầu/endpoint.
- Cột: mã + loại tác vụ, đối tượng, trạng thái, tiến độ, thời điểm cập nhật, hành động. Drawer hiển thị thông tin lỗi an toàn, thời điểm/attempt/usage nếu API có, không tự sinh logs.
- Progress chỉ hiển thị % khi server có giá trị hợp lệ; `null` → “Chưa có tiến độ”; job failed/cancelled không chạy animation giả. Không suy % từ thời gian chờ.
- Retry/cancel lấy từ allowedActions. Retry cần nêu khả năng tạo attempt mới/usage theo contract; cancel có xác nhận. Không hiển thị “Đã hủy” nếu server mới trả đang hủy.
- Polling đề xuất 10–15 giây khi tab visible và có job chưa kết thúc hoặc người dùng bật tự cập nhật; dừng khi rời trang/ẩn tab, backoff khi lỗi, vẫn có Làm mới. Query refresh không reset drawer, scroll hoặc trạng thái xác nhận.
- Khi timeout, báo “Chưa xác định kết quả”, tải lại trạng thái trước khi cho gửi lại; idempotency key theo Backend, không retry mutation mù. Các job độc lập có pending riêng.
- Trạng thái riêng: không có job, không khớp filter, dữ liệu cũ khi polling lỗi, job đã hoàn tất trước khi cancel, job không còn tồn tại; xử lý riêng thay vì cùng một thông báo chung.
- **Nghiệm thu:** không tạo attempt trùng; summary không đếm page hiện tại; hai admin cùng retry được server kiểm soát; auto refresh không làm mất focus; lỗi trả về không lộ token hoặc payload riêng.

### AD-10 — Số liệu `/admin/statistics`

**Mục tiêu:** hiểu số liệu trong khoảng thời gian đã chọn, nhận biết dữ liệu thiếu hoặc chậm.

- Bố cục: header + range 7/30 ngày → bốn KPI hiện có → vùng xu hướng → bảng dữ liệu chi tiết; mỗi section có freshness/phạm vi khi cần. Giữ số liệu và bảng hiện có trước khi làm chart.
- KPI: activeUsers, lockedUsers, characters, readingMinutes. Chốt “User hoạt động” là account có trạng thái active hay active trong kỳ; lockedUsers là snapshot hay số bị khóa trong kỳ; characters là mới tạo hay tồn tại; minutes dựa trên tracking hợp lệ nào.
- Format số `vi-VN`, đơn vị rõ; null là “Chưa có dữ liệu”, 0 là 0; không tự tính % tăng trưởng khi thiếu kỳ so sánh hoặc mẫu số bằng 0.
- Chart là enhancement sau khi có bucket thời gian đầy đủ: line cho phút đọc hoặc cột cho lượng phát sinh, một metric tại một thời điểm; tooltip dùng được bằng bàn phím và luôn có bảng tương đương. Không dùng chart để thay định nghĩa metric.
- Timezone và khoảng thời gian thực tế hiển thị nhất quán; mặc định trình bày giờ Việt Nam khi contract thống nhất. Không bịa điểm 0 cho ngày thiếu tracking; thể hiện gap/chưa thu thập.
- Range thay đổi cập nhật URL, KPI/trend thuộc cùng range; filter lạ trở về giá trị hỗ trợ. Chưa có export/custom range/drilldown thì không đặt nút tương ứng.
- Trạng thái riêng: lỗi một metric chỉ đánh dấu metric đó, phần khác dùng được; trend rỗng không dựng chart giả; toàn bộ API lỗi có retry giữ range.
- **Nghiệm thu:** KPI/bảng/chart khớp source; kiểm tra null, 0, số lớn, thiếu một bucket, partial error, múi giờ; không hiển thị số cũ dưới nhãn range mới như đã tải xong.

### AD-11 — Nhật ký thao tác `/admin/audit`

**Mục tiêu:** tra được ai đã làm gì, lên đối tượng nào, vào lúc nào và kết quả ra sao.

- Bố cục: header “Nhật ký thao tác”, nhãn chỉ đọc → actor/action/range/search → bảng → pagination. Result/targetType/targetId/custom date là filter đề xuất, chỉ mở khi API hỗ trợ.
- Cột: Thời gian, Người thực hiện, Hành động, Đối tượng, Kết quả, Xem chi tiết. Map label tiếng Việt; action code có thể xem trong detail. Sort thời gian mới nhất cần thống nhất server, không sort riêng page gây sai toàn danh sách.
- Dùng status/result thật; không gắn mọi event “Thành công”. Thiếu kết quả → “Chưa xác định”; chỉ hiện failed/denied nếu Backend thực sự ghi và trả các event này.
- Detail drawer: event ID, actor, action, đối tượng, thời gian có timezone, result, reason, request ID, thay đổi trước/sau đã lọc dữ liệu nhạy cảm. Chưa có detail API/field thì giữ list và thông tin được cung cấp, không dựng bản diff giả.
- Deep link từ Users/Reports/Jobs cần targetId/type cấu trúc. Nếu đối tượng bị xóa hoặc mất quyền, lịch sử hợp lệ vẫn đọc được, link target hiển thị tình trạng phù hợp.
- Search/actor/action/range/page/pageSize trên URL; giữ filter khi đóng drawer. Không có sửa/xóa audit hoặc export trong MVP.
- Trạng thái riêng: empty theo khoảng ngày, actor đã bị xóa, action lạ, detail lỗi nhưng list vẫn đọc được; thời gian không hợp lệ không làm crash bảng.
- **Nghiệm thu:** lấy mẫu mutation Users/Permissions/Reports/Limits/Restrictions/Monitoring thấy đúng actor/target/action/result; pagination đầy đủ; failed không bị gắn success; nhật ký chỉ đọc và không lộ trường nhạy cảm.

## 11. Công việc kỹ thuật và khoảng trống contract

### 11.1. Phân rã component/file

| Khu vực | Công việc cụ thể |
| --- | --- |
| `src/app/layouts/WorkspaceLayout.jsx` | Đủ nav Admin, nhóm mục, active cha cho detail, drawer keyboard; không làm hỏng dirty guard Content đang có |
| `src/app/App.jsx` | Thay duy nhất overview Admin khi có `AdminOverviewPage`; title riêng từng trang; giữ các role guard hiện tại |
| `src/features/admin/admin.css` (đề xuất) | Tokens/pattern của Admin và responsive; scope theo wrapper Admin, tái sử dụng CSS chung trước khi tách |
| `src/features/admin/components/` (đề xuất) | `AdminPageHeader`, `AdminListToolbar`, `AdminPagination`, `AdminActionDialog`, `AdminConflictPanel`; bảng vẫn cấu hình theo nghiệp vụ, không ép mọi trang cùng một schema |
| `src/features/admin/hooks/` (đề xuất) | URL filter/return context, dirty guard, mutation invalidation; tách khi từ hai trang thực sự dùng chung |
| `src/features/admin/models.js` | Labels/enum/capability adapter, normalize URL, phân loại error theo code; frontend validation không thay server policy |
| `src/features/admin/services/adminService.js` | Mở rộng filter và truyền signal đầy đủ; shape mới theo contract, không dựng service mock song song |
| `src/lib/api/queryKeys.js` | Đủ user/range/filter/page/sort/detail ID; invalidation mọi biến thể bị ảnh hưởng, không xóa draft do refetch |
| `src/mocks/mockServer.js` | Capabilities, mandatory revision, policy admin cuối cùng, transition, audit còn thiếu; fixture mới bám cùng schema |
| `tests/` | Giữ G2/G4/G5/G6; bổ sung suite Admin theo luồng/rủi ro và visual/accessibility, không đổi selector test chỉ để né lỗi |

### 11.2. Contract gate cho từng nhóm

**Gate** là điều kiện kỹ thuật để hoàn tất tính năng, không phải yêu cầu dừng toàn bộ frontend chờ phê duyệt. Layout, states, filter đã hỗ trợ và component có thể làm ngay; tính năng thiếu dữ liệu dùng fixture có nhãn trong môi trường phát triển.

| Gate | Baseline đang có | Cần bổ sung/thống nhất | Màn bị ảnh hưởng |
| --- | --- | --- | --- |
| C-ADM-01 | Users collection và Permissions `{ users, roles }` | Child/định danh, tập roles theo target, capability khi thiếu, bảo vệ admin hoạt động cuối cùng, reason/revision bắt buộc, hiệu lực phiên | AD-02/03/04 |
| C-ADM-02 | Reports GET/PATCH, actions + revision, note gắn mutation | allowedActions/assignee policy, note bắt buộc theo action, preview read-only và phạm vi bằng chứng; endpoint note riêng nếu cần | AD-05/06 |
| C-ADM-03 | Năm limits, số nguyên dương trong mock | Upper bound, phạm vi quota, định nghĩa Parent–Child, effectiveAt/hiệu lực, dữ liệu vượt mức, reason/audit | AD-07 |
| C-ADM-04 | Restrictions `{ items }`, PATCH status | revision/capability/reason, lọc/phân trang nếu quy mô cần; rule matching/normalization/hiệu lực; CRUD tách scope | AD-08 |
| C-ADM-05 | Monitoring `{ items }`, PATCH action | revision/idempotency, allowedActions, attempt/cancel semantics, aggregate, filter/page, usage an toàn, audit | AD-09 |
| C-ADM-06 | Statistics summary/trend/errors, range 7d/30d | Định nghĩa metric, buckets/timezone/generatedAt/partial/null; overview API hoặc cách tổng hợp không fetch toàn bộ | AD-01/10 |
| C-ADM-07 | Audit list/filter/page trong service/mock | UI dùng status thật; targetId/type, reason/result/before/after/requestId; detail nếu cần, sort, result filter và chính sách failed events | AD-03/06/09/11 |

Mỗi gate phải có ví dụ response thành công, empty/null, error và mutation conflict tương ứng trong `ADMIN_CONTRACT.md` trước khi chuyển từ fixture sang tích hợp thật. Không đổi shape collection của Permissions thành `{ items }` một cách âm thầm; adapter/migration phải rõ ràng. Collection hiện tại chỉ có `{ items }` ở Restrictions/Monitoring cũng chưa đáp ứng quy ước phân trang chung.

### 11.3. Mức hoàn thành để không nhầm mock với production

1. **UI ready:** bố cục, responsive và mọi state đạt trên fixture; ghi rõ dữ liệu minh họa ở môi trường phát triển.
2. **Contract ready:** schema/enum/capabilities/errors/hiệu lực được thống nhất, service và mock cùng shape.
3. **Integration ready:** luồng đi qua API thật, quyền/concurrency/audit được xác minh; không còn control chỉ hoạt động trong mock.
4. **Accepted:** kiểm thử chức năng + visual + accessibility qua tiêu chí từng trang và mục 13.

Không đánh dấu hoàn thành toàn trang chỉ vì đã có screenshot đẹp hoặc một happy path chạy được.

## 12. Backlog triển khai và thứ tự hiện hành

Đây là ước lượng đợt hoàn thiện UI/UX toàn bộ 11 trang, gồm code, fixture và kiểm tra frontend cho một lập trình viên. Không cộng thêm ước lượng cũ mục 3; chưa bao gồm thời gian Backend xây API/chờ quyết định, CRUD restrictions hoặc moderation target ngoài MVP.

| Ticket | Phạm vi / đầu ra | Phụ thuộc | Ưu tiên | Ước lượng |
| --- | --- | --- | --- | --- |
| ADM-F0 | Shell đủ nav, tokens, header/filter/pagination, action dialog, conflict/error pattern, chuẩn fixture và contract gate | Audit mục 8 | P0 | 2–3 ngày |
| ADM-F1 | AD-02/03 Users list/detail: URL/return, dialog lock/unlock, reason, capabilities, Child, error/cache/audit | F0, C-ADM-01 | P0 | 2–3 ngày |
| ADM-F2 | AD-04 Permissions: search, chỉnh một target, diff role, reason riêng, catalog, conflict, đồng bộ users | F1, C-ADM-01 | P0 | 1.5–2 ngày |
| ADM-F3 | AD-05/06 Reports: queue/pagination, read-only evidence, workflow/capability, note/draft/conflict/audit | F0, C-ADM-02 | P0 | 3–4 ngày |
| ADM-F4 | AD-11 Audit: result thật, pagination, detail/deep link theo contract, đối chiếu mutation đã triển khai | F1–F3, C-ADM-07 | P0 | 1.5–2 ngày |
| ADM-F5 | AD-07/08 Limits và Restrictions: field validation, diff, dirty guard, row action, hiệu lực, audit | F0, C-ADM-03/04 | P1 | 2.5–3.5 ngày |
| ADM-F6 | AD-09 Monitoring: list/detail/filter, polling, per-job pending, timeout/idempotency/cancel semantics | F0, C-ADM-05 | P1 | 2–3 ngày |
| ADM-F7 | AD-01/10 Overview và Statistics: aggregate, links, metrics, freshness/partial/null, chart nếu nguồn đủ | F3/F6, C-ADM-06 | P1 | 2–3 ngày |
| ADM-F8 | Kiểm tra xuyên luồng, API thật khi sẵn sàng, visual responsive/a11y, regression shared, sửa lỗi nghiệm thu | F1–F7 | P0 trước phát hành | 2.5–3.5 ngày |

**Tổng dự kiến: 19–27 ngày công frontend.** Tinh chỉnh estimate sau F0 và khi Backend xác nhận gates; không lấy ngày lịch làm cam kết khi dependency chưa sẵn sàng. Chart phức tạp, export, bulk action, CRUD rule và target moderation cần ticket/ước lượng riêng nếu mở scope.

Thứ tự đề xuất: **F0 → F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8**. Audit được nối ngay trong từng mutation từ F1; F4 hoàn thiện viewer sớm để kiểm tra các thao tác F5/F6, không chờ cuối mới làm truy vết. Có thể làm layout F5/F6 trong lúc chờ contract Reports nhưng không tuyên bố tích hợp xong.

Mỗi ticket phải bàn giao: file đã đổi, contract còn thiếu, ảnh desktop/mobile với dữ liệu đại diện, kết quả test phù hợp và checklist của trang. Các ticket hiện đều là kế hoạch, chưa được đánh dấu hoàn thành trong lần cập nhật tài liệu này.

## 13. Kế hoạch nghiệm thu UI/UX và chức năng

### 13.1. Bộ fixture có chủ đích

- Tài khoản: đủ trên 50 bản ghi, tên/email dài, không có email, Child, self admin, ít nhất hai admin và trường hợp chỉ còn một admin hoạt động.
- Báo cáo: đủ bốn status, chưa phân công, nhiều note, evidence dài, target bị xóa/không có quyền xem, revision cũ và hai admin cùng thao tác.
- Limits: min hợp lệ, rỗng, số âm/0/thập phân, upper bound theo contract, dữ liệu đã bị người khác sửa.
- Restrictions: active/disabled, giá trị tiếng Việt dài, loại/phạm vi lạ, trùng normalization nếu CRUD được mở.
- Jobs: không tiến độ, 0/100%, failed/processing/completed/cancelled, trạng thái bổ sung theo contract, timeout đã thực thi và job thay đổi trong lúc xác nhận.
- Statistics: 0/null/số lớn, trend rỗng, một ngày thiếu, partial error, stale data; audit success và kết quả khác nếu contract hỗ trợ, actor/target đã xóa.
- Mọi collection: nhiều trang, empty thật, không khớp filter, page vượt total; mọi mutation: 403/404/409/422/5xx và response chậm.

### 13.2. Ma trận kiểm tra từng trang

| Trang | Luồng phải chạy | Trạng thái visual bổ sung ngoài populated |
| --- | --- | --- |
| AD-01 | KPI → đúng queue; retry một section | Empty công việc, partial/stale |
| AD-02 | Search → page 2 → detail → quay lại → refresh | No match, refetch, tên dài |
| AD-03 | Lock/unlock → users + audit phản ánh | Dialog error, self/last admin, conflict, 404 |
| AD-04 | Đổi role → xác nhận → users/detail cùng kết quả | Catalog lỗi, target cấm sửa, conflict |
| AD-05 | Filter → trang sau → report → queue cập nhật | Empty thật, no match, report rời filter |
| AD-06 | Nhận → quyết định → reopen theo quyền | Note dài, preview lỗi/thiếu, conflict |
| AD-07 | Sửa → diff → lưu → audit; rời khi dirty | 422 tại field, dirty bar, conflict diff |
| AD-08 | Lọc → bật/tắt → audit | Empty, row pending/error, giá trị dài |
| AD-09 | Retry/cancel → refresh kết quả → audit | Null progress, timeout, stale/poll lỗi |
| AD-10 | 7 ngày → 30 ngày → refresh giữ range | 0/null/partial/trend thiếu |
| AD-11 | Lọc actor → phân trang → mở/đóng detail | Non-success, target mất, detail lỗi |

### 13.3. Cổng chất lượng trước khi đánh dấu hoàn thiện

- Chụp và tự kiểm tra cả 11 route với fixture đại diện tại **1440×900 và 390×844**; smoke bố cục thêm **1366×768, 768×1024 và 360×800**. Detail/dialog/drawer có ảnh riêng ở trạng thái mở và lỗi quan trọng; không chỉ chụp happy path.
- Kiểm tra mắt: thẳng hàng, nhịp spacing, typography, badge đồng nhất, CTA có thứ bậc, không panel lồng vô ích, không text bị cắt mất nghĩa, không khoảng trống lớn vô cớ.
- Không overflow toàn trang, sticky không che field/button, bảng có phương án mobile; ở laptop nhìn thấy nội dung chính sau header mà không cuộn qua hero lớn.
- Keyboard-only đi hết luồng chính; focus không mất khi đóng dialog/refetch/chuyển route; kiểm tra reduced motion, zoom 200%, tương phản; dùng `@axe-core/playwright` đã có và review thủ công, không coi axe pass là đủ.
- Chạy `npm run lint`, `npm run build`, Playwright liên quan G2/G4/G5/G6 và suite Admin mới sau mỗi đợt code phù hợp. Thay shell/auth/cache/router phải thêm regression Parent/Content/Profile, đặc biệt dirty guard và role guards.
- Kiểm tra request trực tiếp sai role, thiếu capability, revision cũ và last active admin trên Backend thật. Mock test không chứng minh bảo mật hoặc audit production.
- Không có console error, request lặp vô hạn, mutation duplicate, toast thành công khi thất bại hoặc draft bị mất do refetch. Thời gian/label/số liệu lấy đúng nguồn, không còn copy triển khai như “tùy chọn trong mock” ở UI production.
- Lưu bằng chứng kiểm tra theo route và viewport trong thư mục artifact của dự án; khi cần visual baseline, dùng fixture/time cố định để tránh diff nhiễu. Không ghi đè artifact ngoài scope Admin.

## 14. Checklist sẵn sàng bắt đầu và ranh giới phạm vi

- [ ] F0: chốt tokens Admin và một mẫu bảng (Users), một mẫu detail/action (User detail), một mẫu form (Limits) trước khi nhân rộng.
- [ ] Ghi ví dụ contract theo C-ADM-01–07; đánh dấu field/API đang có và đề xuất ngay trong `ADMIN_CONTRACT.md`.
- [ ] Quyết định chính sách Child, gán role theo target, last active admin và hiệu lực phiên; không tự mở quyền chỉ vì UI cần nút.
- [ ] Xác định dữ liệu được xem trong report preview; endpoint read-only không kế thừa quyền Story Editor.
- [ ] Chốt hiệu lực limits/restrictions, retry/cancel/idempotency và nguồn overview aggregate.
- [ ] Có fixture đủ lỗi/concurrency/null và tiêu chí AD-01–11 trước khi code từng trang.
- [ ] Phân biệt UI ready, Contract ready, Integration ready và Accepted trong cập nhật tiến độ.

Scope mặc định của kế hoạch là hoàn thiện 11 route hiện có, shell và các dialog/drawer phục vụ trực tiếp. Không tự bổ sung quản lý thanh toán, xóa tài khoản, mời admin, custom permission builder, export/bulk, WebSocket, dark mode, CRUD restrictions hoặc quyền moderation target mới. Những phần này chỉ mở thành ticket khi nghiệp vụ và API tương ứng được thống nhất.
