# Sổ tay tích hợp API SketchTale — end-to-end

> **Parent sau rà soát lại lịch sử chat:** dùng [plan hiện hành](PARENT_INTEGRATION_PLAN_2026-11-01.md) và [câu hỏi Backend](PARENT_BACKEND_QUESTIONS_2026-11-01.md). Catalog development đang real; profile/approvals còn mock. Approval inbox có local source + caller, quota có một phần DTO; chưa xác minh bản deploy. Ưu tiên nối trọn core trên UI hiện tại, không mở đồng loạt Parent real.

**Cập nhật:** 01/11/2026
**Phạm vi:** web frontend trong repository này và backend source được cung cấp. Source mobile không có trong workspace nên chưa nằm trong kiểm kê.

Tài liệu này là bản điều phối chung để nối API từ màn hình đến backend, theo dõi phần đã nối/chưa đủ contract và chuẩn bị yêu cầu cụ thể cho Backend. Các gap chi tiết theo vai trò vẫn nằm trong tài liệu Parent, Admin và Content Manager bên dưới.

## Nguồn tham chiếu

- Backend: [iamhyyyy/sketch-tale-backend](https://github.com/iamhyyyy/sketch-tale-backend), source đã đọc tại commit fb3075e33d584abbb185fcc860aeec206f8af9a0. Chưa xác nhận commit này chính là bản đang deploy trên Render.
- Swagger live: [OpenAPI JSON](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json). Nếu live Swagger không truy cập được, dùng snapshot đã lưu và ghi ngày snapshot.
- Snapshots: [Parent 29/10](../../artifacts/swagger-parent-2026-10-29.json), [Admin 31/10](../../artifacts/swagger-admin-2026-10-31.json), [Content Manager 31/10](../../artifacts/swagger-content-manager-2026-10-31.json). Các snapshot ghi nhận 124 operations; khác ngày không đồng nghĩa backend vừa deploy hoặc cả ba snapshot phản ánh đúng một commit.
- Chi tiết theo miền: [Parent integration plan](PARENT_INTEGRATION_PLAN_2026-11-01.md), [Parent gaps](PARENT_API_GAPS_2026-10-29.md), [Parent source audit](PARENT_API_SOURCE_AUDIT_2026-11-01.md), [Admin gaps](ADMIN_API_GAPS_2026-10-31.md), [Content Manager gaps](CONTENT_MANAGER_API_GAPS_2026-10-31.md).
- Frontend API boundary: src/lib/api/httpClient.js, src/lib/api/backendRoutes.js, src/lib/api/featureApi.js. Xác định màn hình đang dùng từ src/app/App.jsx, không suy từ component không được route/import.

**Giới hạn bằng chứng:** đây là đối chiếu source, Swagger snapshot và frontend. Chưa có authenticated staging run/read-after-write. Không dùng tài liệu này để khẳng định API chạy đúng trên môi trường deploy.

## Quy tắc tích hợp đã chốt với người dùng

1. Dùng source backend và Swagger làm căn cứ. Đọc controller, DTO, service/repository và phân quyền. Nếu thông tin thể hiện rõ trong source thì triển khai, không hỏi Backend xác nhận lại cùng dữ kiện.
2. Chỉ gọi route/field có thật. Không đoán method, payload, enum, null semantics, role, ownership, side effect hoặc trạng thái thanh toán. Nếu chưa rõ, ghi blocker cụ thể và tiếp tục phần độc lập.
3. Không tải dữ liệu nhiều chủ rồi lọc ở frontend. Backend phải xác thực và scope dữ liệu theo chủ thể hiện tại; API chưa an toàn thì không bật luồng real.
4. API chưa có hoặc chưa đủ an toàn thì giữ mock/demo có nhãn ở local lẫn deploy. Lỗi API real phải hiện lỗi/retry, không giả thành dữ liệu mock hoặc thành công.
5. Phân biệt rõ wired-in-source, fixture-verified và live-verified. Không tuyên bố lưu/đăng ký/thanh toán thành công thật nếu chưa có bằng chứng runtime.
6. Giữ nguyên thay đổi sẵn có trong working tree. Không commit, deploy hoặc gọi mutation trên dữ liệu thật nếu chưa được yêu cầu.

## Trạng thái dùng trong ma trận

| Trạng thái | Ý nghĩa |
|---|---|
| WIRED — chưa xác minh runtime | Có caller/service trong frontend và operation trong Swagger/source; chưa chứng minh response thật hoặc persistence. |
| CONTRACT CHƯA ĐỦ | Operation tồn tại nhưng response, enum, quyền, null, pagination, transition hoặc side effect chưa rõ. Không yêu cầu tạo lại endpoint nếu API hiện hữu có thể đáp ứng. |
| BACKEND FIX CẦN THIẾT | Operation tồn tại nhưng source cho thấy thiếu authorization/ownership hoặc không bảo đảm an toàn dữ liệu. Frontend không thể tự vá quyền truy cập. |
| CAPABILITY CHƯA CÓ | Snapshot Swagger không có operation/field đủ khớp nhu cầu màn hình. Tên route trong gap docs chỉ là gợi ý, không phải API đã tồn tại. |
| DEMO/MOCK | Luồng mô phỏng, chưa được báo như dữ liệu backend. |
| LIVE VERIFIED | Chỉ dùng sau test với môi trường và tài khoản staging phù hợp, có kết quả read-after-write/quyền. Hiện chưa có operation Parent/Admin/Content Manager nào được tài liệu này đánh dấu như vậy. |

Không tính phần trăm “API hoàn thành” theo số endpoint đề xuất. Một operation chỉ được tính theo consumer, quyền, schema, trạng thái UI và xác minh runtime phù hợp.

### Trạng thái xác minh source ngày 01/11/2026

- Frontend `npm run build` thành công; Vite cảnh báo bundle JavaScript vượt 500 KB.
- Backend source có các sửa đổi Parent local sau baseline `fb3075e`, nhưng chưa compile được vì môi trường hiện tại không có .NET SDK/`dotnet`. Chưa deploy, chưa chạy E2E hoặc request authenticated trên staging/Render.
- Các route mới trong Backend local chưa xuất hiện trong Swagger live/snapshot hiện có. Cập nhật Swagger sau khi build/phát hành Backend; production Parent profile/catalog vẫn mock.

## Quy trình nối API từ đầu đến cuối

### 1. Xác định đúng consumer

- Tìm route đang chạy trong src/app/App.jsx và component thực sự được render theo role/mode.
- Tìm hook/query/mutation và service đang cấp dữ liệu cho màn hình.
- Bỏ qua component orphan, mock demo hoặc endpoint service chưa có consumer khi lập trạng thái sản phẩm.

### 2. Chốt operation hiện hữu

Với mỗi nhu cầu, ghi method/path chính xác, query/path params, DTO, response status, envelope, enum và security trong Swagger. Frontend apiRequest dùng path bỏ prefix /api; backendRoutes.js phải cho phép đúng method/path. Route nằm trong Swagger chưa chứng minh frontend gọi đúng hoặc backend runtime đã bật.

### 3. Đọc source để xác nhận nghiệp vụ và quyền

Đọc controller → service → repository/entity → DTO/mapping. Xác định:

- User ID, ParentProfile ID, ChildProfile ID, story/page/asset/version ID là các định danh khác nhau.
- Endpoint public/authenticated/role-restricted; server lấy owner từ JWT hay tin ID do client gửi.
- GET list có scope/pagination không; PUT là replace hay partial; null/field bị bỏ qua có nghĩa gì.
- POST có side effect, trả ID, idempotency key; có thể retry không; GET sau ghi có lấy lại dữ liệu đã lưu không.
- DELETE/hide là soft/hard delete; cascade/reference/version được giữ thế nào.

Không coi Swagger Bearer button, tên tag, comment hoặc FE role guard là bằng chứng backend đã kiểm tra authorization. Đối chiếu attribute/controller và pipeline auth trong source.

### 4. Phân loại trước khi code

Chọn WIRED, CONTRACT CHƯA ĐỦ, BACKEND FIX CẦN THIẾT, CAPABILITY CHƯA CÓ hoặc DEMO/MOCK. Nếu API đã có nhưng thiếu quyền/scope, báo “backend fix”, không báo “thiếu endpoint” và không thêm API trùng.

### 5. Viết adapter theo DTO thật

- Giữ transport tập trung ở httpClient; chuẩn hóa response tại service boundary, không nhúng mapping/backend field vào component.
- Xác thực response shape. Mảng sai schema là lỗi API, không biến thành [] hoặc số 0.
- Giữ UUID/code/slug tách riêng; không dùng User ID cho ParentProfile ID; không làm tròn/nhân giá nếu đơn vị chưa rõ.
- Với multipart, gửi FormData để browser tự tạo boundary; upload URL không đồng nghĩa file đã attach vào entity.
- Chỉ thêm route đã có trong snapshot/source hiện hành vào backendRoutes.js.

### 6. Chọn real/mock theo capability

featureApi.js hỗ trợ mode theo module. Chỉ chuyển operation có contract an toàn sang real; phần khác vẫn demo có nhãn. Đọc .env.development, .env.production và module override trước khi kết luận môi trường nào đang gọi gì. Không để API lỗi tự chuyển nguồn sang mock. Không truyền ID fixture/demo lên backend real.

### 7. Nối UI state và cache

- Có loading, empty, malformed response, network/401/403/404/409/429/5xx và retry phù hợp.
- Chỉ hiện success sau response backend chấp nhận; mutation timeout có thể là outcome unknown, không tự POST lại nếu không có idempotency.
- Sau mutation, invalidate đúng query theo user + entity ID + mode/nguồn; clear dữ liệu khi logout/đổi tài khoản.
- Không dùng cached user/demo overlay làm nguồn cho role, owner, quota, payment status hoặc dữ liệu tài khoản thật.

### 8. Ghi bằng chứng và cập nhật gap

Với mỗi operation, cập nhật source commit, Swagger snapshot/date, frontend file, mode, contract gap, kết quả fixture và kết quả live staging. Ghi fixture-verified riêng với live-verified; không gộp chúng thành PASS chung.

## Ma trận hiện trạng theo miền

| Miền | Đã có caller/operation trong frontend | Chưa đủ / đang bị chặn | Trạng thái handoff |
|---|---|---|---|
| Auth | Login Parent/Admin/Content Manager, login Child adapter, restore /auth/profile, đổi mật khẩu, đăng ký Parent/Child, email flows, logout/refresh. | Baseline source đánh dấu /auth/refresh-token [Authorize] trong khi ValidateLifetime=true và ClockSkew=0; khi access token hết hạn middleware từ chối trước khi controller dùng refresh token. Backend local hiện trả `childProfileId` sau register; `nickName` vẫn chỉ lưu ở `ChildProfile.NickName`, không map sang `User.FirstName/LastName`, nên cột tên User có thể NULL theo thiết kế hiện tại. Error codes/field errors và chính sách thu hồi phiên cần được contract hóa. | WIRED — chưa xác minh runtime; AUTH-01 còn mở, AUTH-02 có source fix local chờ build/deploy. |
| Public/catalog | Đọc `/subscription-plans`; Parent catalog có adapter cho story/theme theo mode. ID backend/code tách riêng; checkout real đã khóa. | `/subscription-plans` read-only; DTO không có currency, UI dùng cấu hình VND. Backend local đã lọc story list/by-theme/Parent detail về `Active`, thêm route published pages; FE map page body. Production vẫn giữ catalog mock tới khi Backend mới được phát hành. Checkout/order/payment/webhook chưa có capability real. | Plan catalog WIRED. Education theme WIRED theo mode. Story source + adapter đã có, chờ release/runtime verify. Billing CAPABILITY CHƯA CÓ. |
| Parent profiles/children | Register Child dùng Parent từ JWT và tạo ChildProfile; `/auth/profile` trả ParentProfile/gói hiện tại và ParentPlanPage đọc ID/tên gói. Plan catalog và education-theme catalog có FE adapter read-only. | `/auth/profile` vẫn không Include ChildProfiles. Backend local đã thêm owner-scoped ChildProfile list/detail/update; Parent update không sửa remaining counters. ParentProfile CRUD và SubscriptionController vẫn không scoped; Parent FE không gọi chúng. `parentProfileService` đã có adapter và mode riêng; production profile vẫn mock. | Caller và source fix hiện có; build/deploy, Parent A/B, Child self-scope và read-after-write còn cần xác minh. |
| Parent dashboard/features | Có UI/service cho overview, settings, approvals, library, progress, recommendation, exports và report. | Local source có Parent-scoped approval inbox `GET /user-story-character-mappings/child/{childProfileId}` + status `PATCH` và FE live adapter/UI opt-in; mode mặc định mock. Dashboard/progress/settings mở rộng, sensitive-role grant, private library/favorites, recommendation, entitlement, exports, family report và checkout còn thiếu contract. | Approval source ready pending backend build/deploy/staging; runtime UI vẫn mock theo default. Các capability khác DEMO/MOCK/CAPABILITY CHƯA CÓ. |
| Admin | /users list/detail/create/update/status đã có caller; catalog CRUD, report list/detail/status và audit reads có caller. Overview bỏ KPI không có nguồn. | /users response schema, role policy, PUT/null semantics, paging và report transitions cần rõ. Revenue/credit aggregate chưa có. Permissions/system limits/monitoring/statistics đang redirect. Source UserController có Admin role guard, nhưng nhiều controller catalog/report/audit/subscription không có [Authorize]; cần bảo vệ mutation và dữ liệu theo role. | WIRED — chưa xác minh runtime; AC01–AC08, AG01–AG06; security P0. |
| Content Manager | Story/page/role/slot/vocabulary/quiz CRUD, publish và multipart một số media đã có adapter/consumer. | Composition animation/subtitles/image objects/audio tracks, asset registry, advanced slot transforms, page reorder, quiz-page/feedback, revision/concurrency, immutable published snapshot, statistics/pagination còn thiếu hoặc chưa rõ. Xóa/hide/cascade/upload replacement/role scope cần contract. Authorization không đồng đều giữa controllers/actions. | WIRED — một phần; G01–G10; editor/publish đầy đủ còn blocked-contract. |
| Mobile Child app | Backend có Child auth/profile entities và hoạt động liên quan. | Source mobile không có trong workspace nên không xác nhận app gọi gì, tracking activity/limit enforcement, read model hoặc tương thích DTO. | Ngoài phạm vi snapshot này; cần repo mobile nếu muốn kiểm kê xuyên client. |

## Danh sách ưu tiên báo Backend

### P0 — bảo mật và luồng dữ liệu thật

| ID | Hạng mục | Yêu cầu cụ thể để báo Backend | Bằng chứng hiện tại |
|---|---|---|---|
| SEC-01 | Parent/Child ownership | Bảo vệ list/detail/update hồ sơ bằng JWT; list chỉ trả con của Parent hiện tại; detail/update ID chéo owner trả 403/404. Thêm self-scoped Parent endpoint hoặc để /auth/profile trả danh sách con có scope. Không yêu cầu FE tải toàn bộ rồi lọc. | ChildProfileController, ChildProfileService, ParentProfileController; xem Parent source audit. |
| SEC-02 | Subscription/ParentProfile access | Thêm auth/owner check cho list/detail/mutation; định nghĩa current subscription, status và hiệu lực thời gian. Không dùng Subscription CRUD làm checkout. | SubscriptionController và ParentProfileController không khai báo [Authorize]. |
| SEC-03 | Role checks cho API ghi | Bổ sung/ghi rõ authorization cho POST/PUT/PATCH/DELETE của Admin catalogs/reports/audit và Content Manager resources. Cho phép public GET chỉ khi chủ đích; test role được phép và bị từ chối. | Source có nhiều controller không khai báo auth; Program.cs không có fallback authorization policy. UserController có Admin guard, không suy ra controller khác cũng có. |
| SEC-04 | Parent approval mapping + inbox | **Local source đã có:** `[Authorize]`, owner/resource relationship checks, status whitelist/transition, parent-scoped inbox có tên/asset/truyện/vai/time/paging; FE adapter/UI GET + PATCH đã nối, mode opt-in. | Backend build/deploy/staging A/B ownership test và cập nhật Swagger live còn pending. Revision, reject reason và sensitive-role permission chưa có. |
| STY-01 | Chỉ hiển thị story đã publish cho Parent | **Đã sửa trong Backend local, chờ build/deploy:** list/by-theme và Parent/Child detail chỉ trả `Status=Active`; production catalog vẫn mock cho đến khi xác minh runtime. | Backend source local + FE fail-closed status check. |
| STY-02 | Parent story pages | **Đã sửa trong Backend local, chờ build/deploy:** `GET /storypage-template/published/{storyId}` chỉ trả pages Active của story Active; page routes Content Manager được tách path. | Frontend `parentCatalogService` tải và map trang truyện; production catalog vẫn mock. |
| AUTH-01 | Refresh token hết hạn | Chốt contract để refresh hoạt động sau khi access token hết hạn. Hiện route yêu cầu [Authorize] trong khi bearer lifetime validation bật và clock skew 0; refresh token trong body không giúp nếu middleware từ chối request trước action. Đề xuất refresh credential được xác thực riêng, rotation nguyên tử, reuse/revoke và expiry rõ ràng; cập nhật OpenAPI/examples. | AuthController.RefreshToken, Program.cs, AuthService.RefreshTokenAsync; frontend đang gửi refresh token kèm bearer theo implementation hiện tại. |
| AUTH-02 | Register Child identity | **Đã sửa trong Backend local:** trả `childProfileId`; cần xác minh build/deploy và read-after-write sau release. Error contract duplicate/validation/quota vẫn cần được chốt. | `AuthController.RegisterChild` + `AuthService.CreateChildAccountAsync`; FE nhận ID để hiển thị link mở hồ sơ khi profile mode real. |
| ADM-01 | Admin /users response/role contract | Công bố schema/example cho list/detail/create/update/status, paging, null/omission, roles, lock state, parentProfileId; xác nhận role changes/self/last-admin policy. | AC01–AC04. Không yêu cầu tạo lại /admin/users; operation /users đã có. |
| CM-01 | Lưu/publish editor nhất quán | Chốt composition, media registry, revision/conflict, validate và published snapshot trước khi tuyên bố timeline/editor nâng cao được lưu hoặc publish thật. | Content G01/G02/G05/G06/G07. Ưu tiên thống nhất với Mobile reader. |

### P1 — nghiệp vụ và màn hình đang có

- **Parent:** dashboard/progress/settings mở rộng, sensitive-role grant, child library/saved stories/recommendations, entitlement, checkout/payment confirmation, exports. ChildProfile scope, register ID, published-story/pages, mapping authorization và scoped approval inbox/status UI đã có source fix local; cần build/deploy/runtime verify. Profile/catalog/approval production modes giữ mock tới release. Các endpoint names còn lại trong Parent gaps là đề xuất; Backend có thể mở rộng API hiện hữu.
- **Admin:** revenue/paid transaction và credit-used aggregate; report transition/evidence/reviewer/audit; pagination và actor identity. Xem AC05–AC08, AG01–AG06 trong Admin gaps.
- **Content Manager:** slot transforms, page reorder, quiz page/feedback, statistics, upload replace/remove, cascade/delete semantics và scope. Xem G03/G04/G08/G09 và contract table trong Content Manager gaps.

### P2 — khi bật nhu cầu tương ứng

- Parent family report, billing history, unlink Child account, export retry/download quotas.
- Admin system limits, monitoring actions, statistics screens hiện đang redirect; chỉ mở khi route, quyền và hành vi vận hành được xác nhận.
- Server search/pagination cho catalog/editor khi dữ liệu lớn; không bắt buộc thêm endpoint aggregate nếu FE ghép dữ liệu nhỏ vẫn đúng và ổn định.

## Mẫu yêu cầu gửi Backend

Copy block này cho từng ID còn mở; điền bằng chứng cụ thể, không gửi cả danh sách route đề xuất như endpoint bắt buộc:

    ID / priority:
    Màn hình và consumer FE:
    Operation hiện có (method/path) hoặc capability còn thiếu:
    Vấn đề: missing / response-schema / auth-role / ownership / null-enum / side-effect / pagination / concurrency / payment:
    Contract mong muốn: request DTO + success response + empty + validation/403/404/409 examples:
    Owner/role scope và dữ liệu chéo phải bị từ chối:
    Revision/idempotency/retry và read-after-write:
    Backend đề xuất mở rộng operation hiện có hay capability mới:
    Tiêu chí nghiệm thu:
    Swagger/source commit hoặc sample response cập nhật:

Backend không cần trả lời lại điều controller/DTO đã thể hiện rõ. Chỉ cần quyết định quy tắc chưa thể suy ra từ code: policy, transition, side effect, null behavior, cross-owner behavior, concurrency và dữ liệu thực tế.

## Điều kiện hoàn tất một lát cắt API

- Operation, DTO và quyền đã đối chiếu source + Swagger; mọi blocker được gắn ID và ưu tiên.
- Adapter gọi đúng path/method/body, giữ ID/enum/null theo contract; lỗi schema không biến thành empty success.
- Route allowlist/mode và consumer UI cùng được cập nhật; demo khác dữ liệu thật.
- Loading/empty/error/retry/mutation states và cache theo user/entity được xử lý.
- Fixture/intercept chỉ ghi fixture-verified; staging read-after-write, cross-owner/role checks mới ghi live-verified.
- Tài liệu master, gap domain, snapshot date/source commit được cập nhật. Không commit/deploy/mutate production tự động.

## Thông tin còn cần nếu muốn xác minh runtime

Không cần thêm thông tin để dùng tài liệu này hoặc tiếp tục tích hợp tĩnh từ source. Để đóng mục LIVE VERIFIED, cần môi trường staging có URL riêng và tài khoản test theo role phù hợp (Parent A/B + Child, Admin, Content Manager), test data được phép ghi và quy trình reset dữ liệu. Không lưu password/token trong tài liệu hoặc source; dùng cấu hình local/secret store. Nếu cần bao gồm app Child mobile, cần thêm repository hoặc source của client đó.
