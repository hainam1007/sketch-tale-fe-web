# Admin — kế hoạch nối API cho Luna Extra High (31/10/2026)

## 1. Phạm vi và bằng chứng

Đã triển khai phần Admin có thể làm từ contract hiện có. Kết quả và giới hạn: [báo cáo triển khai](luna-extramax/admin-implementation-report-2026-10-31.md). Đã tải trực tiếp [Swagger](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json) ngày 31/10/2026; lưu [snapshot](../../artifacts/swagger-admin-2026-10-31.json) và [diff](../../artifacts/swagger-admin-diff-2026-10-31.json). Phần live vẫn chưa xác minh do Swagger không công bố response schema và không có phiên Admin staging trong lượt này.

- Tổng cộng 124 operations (method + path).
- So với snapshot Admin 23/10: thêm **6 operations**, không xóa/đổi operation; thêm 3 schemas; đổi 3 schemas gói dịch vụ.
- So với snapshot Parent 29/10 và Content Manager 31/10: không đổi operations/schema. “Mới” ở đây là mới so với lần audit Admin, không khẳng định backend vừa deploy hôm nay.
- Chỉ kiểm chứng tài liệu public và source frontend; chưa đăng nhập Admin, chưa xác minh response thực tế/quyền, chưa gửi mutation live.
- Tài liệu 23/10 không còn mô tả đúng toàn bộ working tree. Dùng tài liệu này cho kế hoạch mới, giữ tài liệu cũ làm lịch sử.
- Working tree có nhiều thay đổi Content/Parent và artifacts từ trước; không reset, stash, ghi đè hoặc đưa chúng vào phạm vi Admin.

Danh sách yêu cầu backend riêng: [ADMIN_API_GAPS_2026-10-31.md](ADMIN_API_GAPS_2026-10-31.md).

## 2. API mới cần nối

Path dưới đây là path Swagger đầy đủ. `apiRequest` dùng path bỏ `/api` vì HTTP client có base URL riêng.

| Operation | Contract đã công bố | Trạng thái tích hợp |
|---|---|---|
| `GET /api/users` | Không khai báo query, response chỉ `200 OK`, không có schema | Đã nối list theo user ID; adapter nhận array hoặc `{ items }`, lỗi rõ nếu khác dạng. Không suy ra user directory từ parent profiles/audit |
| `GET /api/users/{id}` | UUID user; response không có schema | Đã nối detail theo user ID, tách userId khỏi parentProfileId |
| `POST /api/users` | `AdminCreateUserDto` | Đã có form theo field bắt buộc/validation công bố; role policy và response live còn cần xác minh |
| `PUT /api/users/{id}` | `AdminUpdateUserDto`, có `role` | Đã nối sửa thông tin/role; chỉ bật khi GET trả đủ 7 field và gửi lại đủ giá trị hiện tại |
| `PATCH /api/users/{id}/status` | `UpdateUserStatusDto`: `isLocked` boolean, `reason` nullable string | Đã nối khóa/mở bằng trạng thái đích, có xác nhận và lý do tùy chọn |
| `PUT /api/users/{id}/status` | Cùng DTO status | Không gọi; PATCH là operation được chọn cho UI |

`AdminCreateUserDto`: bắt buộc `username`, `password` (minLength 6), `role`; các field khác: `email`, `firstName`, `lastName`, `dob` (date), `gender` (boolean nullable), `phoneNumber`, `emailConfirmed` (boolean). Không ghi password vào log/cache/localStorage.

`AdminUpdateUserDto`: `firstName`, `lastName`, `email`, `phoneNumber`, `dob`, `gender`, `role`; không có username/password/revision/reason. Cần chốt omission/null của PUT trước khi gửi patch rút gọn; không tự thêm field ngoài DTO.

**Thay đổi schema gói:** `haveParentProfileSub: boolean` được thêm vào `SubscriptionPlanDto`, `CreateSubscriptionPlanDto`, `UpdateSubscriptionPlanDto`. UI đã có field này và giữ giá trị chưa được backend trả về ở trạng thái unspecified; ý nghĩa/nhãn nghiệp vụ vẫn cần backend chốt.

## 3. Ma trận frontend hiện tại

| Luồng | Hiện trạng source | Việc cần làm |
|---|---|---|
| Users list/detail | Đã dùng `/users`; Parent profile join riêng theo `userId`, không dùng audit/seed/local override làm directory | Cần response schema, phân trang, profile relationship và staging xác nhận |
| Khóa/mở, đổi role | Create và PATCH status đã gọi API; PUT chỉ sửa thông tin, giữ role hiện tại ở chế độ chỉ đọc | Cần backend chốt role policy, PUT/null semantics trước khi mở đổi role; live read-after-write còn pending |
| Tạo/sửa account | Form create theo DTO; edit bật khi detail có đủ bảy field | Response contract chưa có; email/role policy và lỗi field-level cần xác minh |
| Profile plan/trial | Plan update dùng Parent profile ID, nút chỉ hiện khi profile được tìm thấy | Trial UI chưa được thêm; live side effect/quota cần xác minh |
| Reports list/detail/status | Read lỗi không bị đổi thành danh sách rỗng; PATCH status đã có caller | Cần xác nhận enum/chuyển trạng thái, lý do và tác động moderation |
| Audit | 5 GET endpoints đã có caller; không dùng seed/local override để ghi đè actor data | Pagination và actor identity contract vẫn thiếu |
| Catalogs | CRUD đã nối; `haveParentProfileSub` có trong form | Ý nghĩa nghiệp vụ vẫn cần backend xác nhận |
| Overview | Partial errors được hiện; KPI revenue/credit thiếu API thì hiển thị unavailable | Backend cần cung cấp aggregate thật trước khi khôi phục KPI/biểu đồ |
| Permissions/limits/monitoring/statistics | `App.jsx` vẫn redirect các màn này về `/admin` | Backlog màn bị ẩn; chưa có API/service đầy đủ để bật an toàn |

Rủi ro P0 ở overview đã được xử lý phía FE: bỏ `growthPercent: 18.4`, fallback credit `6190`, heuristic nhân giá và nhãn doanh thu suy từ subscription price. Revenue/credit aggregates vẫn là gap backend.

`src/lib/api/backendRoutes.js` allowlist hiện có 6 operations `/users`; route guard toàn cục vẫn giữ nguyên. Comment `featureApi.js` được cập nhật theo API hiện có.

## 4. Trạng thái triển khai theo kế hoạch Luna xhigh

| Bước | Trạng thái |
|---|---|
| AD01 | Đã đối chiếu Swagger/source và ghi contract blocker; schema response, role policy và PUT/null semantics còn chờ backend xác nhận. |
| AD02 | Đã nối danh sách/detail `/users`, route allowlist và Parent profile join; live response/pagination chưa xác minh. |
| AD03 | Đã nối create/update/status; role policy và staging read-after-write còn pending. |
| AD04 | Đã thêm `haveParentProfileSub`; ý nghĩa nghiệp vụ cần backend xác nhận. |
| AD05 | Đã xử lý lỗi đọc và số KPI mẫu; API aggregate doanh thu/credit còn thiếu. |
| AD06 | Đã ghi backlog capability thiếu; không bật các màn đang redirect. |
| AD07 | `npm run lint` và `npm run build` pass; Playwright/live smoke chưa chạy. |

Chi tiết hiện thực nằm trong [báo cáo triển khai](luna-extramax/admin-implementation-report-2026-10-31.md). Các checklist bên dưới mô tả nghiệm thu còn lại, không phải việc nối API chưa làm.

### AD01 — Chốt contract và baseline (P0)

- Đọc snapshot, source và git diff. Lưu danh sách route Admin đang active/redirect và baseline test.
- Lấy schema/example response user list/detail/create/update/status từ backend hoặc phiên Admin được phép sử dụng; xác định envelope, user ID, roles, trạng thái khóa, profile relationship, trường null.
- Chốt tên role backend (không suy `editor` bằng `ContentManager`), omission/null PUT, quyền tự đổi role/khóa, admin cuối cùng, trạng thái session sau thay đổi.
- Ghi rõ phần đã xác minh, phần pending. Nếu chưa có response, chỉ chuẩn bị phần độc lập; không đoán DTO rồi báo hoàn tất.

**Xong khi:** có mapping DTO → view model và fixtures có nguồn, hoặc ghi rõ blocker cho từng operation.

### AD02 — Users list/detail và route guard (P0, sau AD01 reads)

- Thêm các route mới đúng method/path vào allowlist, cập nhật ngày nguồn; chỉ dùng operations có consumer.
- Tách adapter user khỏi adapter Parent. Route `/admin/users/:userId` chuyển sang user ID; liên kết và query keys dùng cùng identity.
- Ghép plan/credit qua parentProfileId khi có; profile lỗi không làm mất account. Non-parent hiển thị không áp dụng, không gán Free/credit 0 giả.
- Bỏ seed identity/local modifications khỏi kết quả real. Không tự xóa dữ liệu local của người dùng; ngừng dùng nó để ghi đè account thật.
- Tìm/lọc/phân trang FE chỉ khi đã xác minh GET trả toàn bộ dữ liệu; nếu server trả trang phải dùng total/page contract. Không gửi query chưa được hỗ trợ rồi giả định server đã lọc.
- Giữ signal, lỗi 401/403/5xx/invalid DTO, retry và dữ liệu cũ kèm cảnh báo khi refetch lỗi.

**Xong khi:** list có mọi role được server trả; click detail dùng đúng ID; lỗi read không thành empty success; không gọi audit chỉ để dựng danh sách user.

### AD03 — Mutations tài khoản (P0, sau AD01 writes + AD02)

- `toggleUserStatus` chuyển thành set trạng thái đích `{ isLocked, reason }`, không toggle dựa trên localStorage. Xác nhận trước thao tác và khóa nút trong lúc gửi.
- Đổi role qua `PUT /users/{id}` theo semantics đã chốt; các quyền cuối cùng phải do backend kiểm tra. FE chặn thao tác không được phép theo contract, không coi disable button là bảo mật.
- Form tạo/sửa dùng DTO ở mục 2; tránh lưu password trong query cache/persistence. Không mở quản lý `emailConfirmed` nếu chưa rõ chính sách.
- Sau success refetch list/detail/overview/audit bị ảnh hưởng; không giả định response là full DTO vì Swagger chưa khai báo. Lỗi giữ draft, báo rõ, không fallback local success.
- Giữ đổi plan/trial là thao tác khác; chỉ hoạt động khi có profile ID hợp lệ.

**Xong khi:** intercept kiểm chứng method/body/ID; staging read-after-write xác nhận persistence khi có phiên test. Chưa có staging thì ghi REAL_UNVERIFIED, không báo live PASS.

### AD04 — Catalog schema mới (P1, độc lập AD02–03)

- Bổ sung `haveParentProfileSub` vào field/default/label/deserialize/serialize của catalog sau khi chốt nghĩa.
- Test false không bị mất, true không bị reset khi sửa tên/giá hoặc toggle isActive; create/update theo đúng DTO.
- Xác minh đơn vị price và tác động với thuê bao đang tồn tại. Không dùng heuristic nhân giá.

### AD05 — Reports, audit, overview (P0 về tính đúng dữ liệu)

- Propagate lỗi nguồn chính của list/detail report; audit enrichment thất bại chỉ làm identity unavailable, không che lỗi reports.
- Loại seed/role suy đoán khỏi audit thật; cache lookup theo user ID nếu contract cho phép, tránh một request mỗi hàng không kiểm soát.
- Giữ PATCH report đã nối; xác nhận status/target enums và side effect. Ghi chú kiểm duyệt không ghi đè `reason` báo cáo gốc khi backend chưa định nghĩa.
- Overview trả trạng thái từng nguồn và thời điểm lấy; số liệu thiếu là null/unavailable. Bỏ growth/credit cố định và “doanh thu thực tế” suy từ giá catalog.

**Xong khi:** một nguồn 403/500 không biến dashboard thành KPI 0; không còn số liệu demo trộn vào nhánh real.

### AD06 — Backend gaps và màn bị ẩn (P1/P2)

Theo tài liệu gaps. Chỉ mở lại permissions/limits/monitoring/statistics khi service, route, quyền và test tương ứng hoàn chỉnh. Gán role cơ bản đã có PUT user, không yêu cầu backend tạo thêm endpoint chỉ để khớp tên mock cũ. Giữ khả năng demo nếu có nhưng phải ghi nhãn và tách cache/mutation khỏi real.

### AD07 — Nghiệm thu và bàn giao

- Kiểm tra `tests/admin-api-ux.spec.js`, `tests/admin-implementation.spec.js` và `tests/support/apiModes.js`: fixtures cũ dùng Parent profile/mock contract không chứng minh `/users` mới hoạt động.
- Contract/intercept: route guard; ID user khác profile; role không có profile; malformed DTO; 401/403/404/409/422/500; abort; null/false; double submit; refetch sau mutation; read lỗi không fallback.
- UI: list/detail/form/confirmation trên 1366×768 và 390×844, focus/keyboard, mutation error hiển thị, refresh không mất draft.
- Chạy `npm run lint`, `npm run build`; chọn Playwright config đúng spec/API mode (config mặc định mock, API config real). Không tuyên bố test PASS khi spec bị testMatch loại bỏ.
- Live staging: dùng account test đúng role, đọc → tạo dữ liệu riêng → sửa/khóa/mở → reload → kiểm chứng quyền. Không khóa admin thật hoặc thay role account đang dùng chỉ để smoke test.
- Báo cáo file sửa, commands + exit codes, operations wired, pending contracts, intercept/live tách riêng. Không tự deploy/commit/reset.

Thứ tự phần còn lại: **chốt contract AC01–04 → staging CRUD/status → Playwright/live smoke khi có môi trường**. AG02 và các màn AD06 phụ thuộc backend.

## 5. Prompt bàn giao

```text
Dùng gpt-6-luna reasoning xhigh. Tiếp tục nghiệm thu phần Admin đã triển khai theo
docs/api-integration/ADMIN_API_INTEGRATION_PLAN_2026-10-31.md
và ADMIN_API_GAPS_2026-10-31.md; bắt đầu từ contract blocker và staging verification.
Đọc AGENTS.md nếu có, git status/diff; giữ mọi thay đổi có sẵn.
Không lặp lại phần wiring đã hoàn tất; contract chưa rõ ghi blocker.
Không đoán user response/role mapping/PUT semantics.
Không lấy localStorage, seed hoặc audit làm nguồn chính account thật.
Không tạo endpoint giả, không tắt route guard, không fallback mock khi real lỗi.
Không bật lại các route redirect trước khi đủ service/contract/test.
Kiểm chứng phù hợp, phân biệt intercept với live; không deploy/commit/reset.
```
