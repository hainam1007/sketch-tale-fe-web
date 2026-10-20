# Runbook nối API từng bước cho Luna ExtraMax

Ngày: 19/10/2026. Trạng thái: **đã triển khai một phần; xem báo cáo triển khai và các blocker còn mở**.

> **Đọc bản xác minh source mới trước khi thực thi:** [Backend audit](api-integration/luna-extramax/backend-source-audit-2026-10-19.md). Người dùng xác nhận Render chạy commit `42846917`. Enum/profile ID đã rõ. POST register/child đã được nối vào màn tạo tài khoản bé; API chỉ trả message nên chưa thể đưa tài khoản mới vào danh sách. Chỉ link tài khoản có sẵn/unlink còn mock. Profile list/detail/update có lỗi ownership backend: ghi API_PRESENT_BACKEND_FIX_REQUIRED thay vì API_MISSING. Login đã hydrate profile qua X05. Các mô tả “chờ enum/mapping” và “create child thiếu API” dưới đây là baseline trước khi có source, được thay thế bởi audit này.

## 1. Chỉ thị hiện hành

Chính sách hiện hành thay cho các baseline API trước đây: **API đã có thì nối thật, bỏ mock khỏi đường chạy chức năng đó; API chưa có thì tiếp tục mock, chưa xây backend và chưa tự nghĩ endpoint để nối. Có lỗi hoặc contract chưa rõ thì hỏi người dùng.**

Đọc cùng [báo cáo triển khai mới nhất](api-integration/luna-extramax/implementation-report-2026-10-19.md), [quyết định đã chốt](api-integration/luna-extramax/decisions.md), [backend source audit](api-integration/luna-extramax/backend-source-audit-2026-10-19.md) và [OpenAPI snapshot](api-integration/openapi-2026-10-19.snapshot.json). Snapshot là contract tham chiếu; báo cáo là trạng thái code; runbook này là backlog triển khai và nghiệm thu.

Không dùng quy tắc cũ “thiếu API thì unavailable toàn bộ Parent/Admin”. Không quay toàn bộ Content về mock để giữ animation. Chuyển theo **operation/capability**, không theo cả vai trò.

Quyết định và câu hỏi hiện tại:

- Q01 — ĐÃ CHỐT: người dùng yêu cầu giữ mock cả local và bản deploy dùng .env.production, có nhãn “Dữ liệu mô phỏng”. Triển khai hybrid ở cả hai môi trường, không hỏi lại quyền bật mock production.
- Q02 — ĐÃ GIẢI QUYẾT: enum và profile IDs được xác minh từ source commit `42846917`; login hydration đã sửa. Parent/Child profile routes vẫn mock do backend ownership defect, không phải vì mapping còn mơ hồ.
- Q03 — ĐÃ CHỐT: người dùng xác nhận `PosX`/`PosY` là phần trăm 0–100. Slot GET/POST/PUT/DELETE đã chuyển sang API thật; rotation/layer/ảnh riêng vẫn overlay mô phỏng.

Không coi hết thời gian chờ là câu trả lời. Cập nhật câu trả lời vào `docs/api-integration/luna-extramax/decisions.md` khi nhận được. Tên ExtraMax là nhãn cấu hình người dùng yêu cầu; runbook không tự chọn/chuyển model và không yêu cầu sub-agent.

Source đã thay đổi. Báo cáo triển khai ghi rõ các phần đã chuyển sang API thật và mock còn lại; chưa chạy lint/build/E2E hoặc xác minh runtime trong đợt tích hợp 19/10.

## 2. Baseline rà soát trước khi triển khai 19/10

Bảng R01–R16 dưới đây ghi nhận các phát hiện đã dẫn tới thay đổi source ngày 19/10; **không xem chúng là kết quả hiện tại**. Dùng [báo cáo triển khai](api-integration/luna-extramax/implementation-report-2026-10-19.md) để biết phần nào đã được sửa/nối và phần nào còn mở. Các dòng lint bên dưới là baseline trước thay đổi, không phải kết quả kiểm tra working tree hiện tại.

| Mã | Bằng chứng | Ảnh hưởng / bước xử lý |
| --- | --- | --- |
| R01 | `featureApi.js` chọn mode theo admin/parent/content, mock chỉ được DEV | Không đáp ứng real + mock cùng khu vực; X02. |
| R02 | `httpClient.js` mặc định mock nếu VITE_API_MODE khác real; guard là snapshot cũ | Cần giữ real transport rõ ràng và đồng bộ allowlist; X01–X02. |
| R03 | `authService.storeSessionUser` chỉ lưu `session.user` trong DEV; mock `currentUser` tìm seed hoặc session.user | Tài khoản real không có trong seed sẽ lỗi mock trên production; không chỉ bật cờ mock; X03. |
| R04 | Mock database dùng một key sessionStorage; cache query chưa chứa source | Có thể dùng lẫn cache/mock giữa nguồn hoặc tài khoản; X03. |
| R05 | `ParentAvailabilityGate` chặn real trừ /parent/plan; ParentPlanPage chỉ enable entitlement ở mock và bỏ entitlement khi catalog là backend | Hybrid không hoạt động chỉ bằng sửa service; X12–X14. |
| R06 | NewChildPage mock create xong chuyển ngay vào child detail | Child ID mock có thể đi vào detail/update real; cần định tuyến theo provenance resource; X03/X12. |
| R07 | Content list/detail/quiz gọi route cũ; page gửi AudioNarrationUrl | Đứt editor/assets/refetch và audio không đúng contract; X04–X08. |
| R08 | `StoryPagesPage.saveAllDrafts` chặn slot/field mở rộng trong real, chỉ gửi text/narration/status rồi xóa dirty | Phải tách phần save real và mock; không đánh dấu đã lưu mọi thứ sau một request; X06/X09/X15. |
| R09 | `useStoryEditorMutation.onSuccess` set nguyên nextStory vào cache; mutation serialize theo story | Giữ return shape editor và serialization, không thay bằng DTO riêng; X04/X09/X15. |
| R10 | `useContentAssets` và nhiều UI dùng featureApiModes.content; tools layers/motion bị ẩn theo mode | Sửa capability ở cả hook/component/layout, không chỉ service; X09/X15. |
| R11 | `AdminAuditPage.jsx:27` tự tham chiếu total trước khởi tạo | Runtime ReferenceError khi query thành công; sửa X10. |
| R12 | Admin restrictions mong items/value/reason/type/status chuỗi, BE trả array/keyword/description/enum | Cần adapter và tách keyword thật khỏi topic mock; X11. |
| R13 | AdminCatalogPage đã CRUD và gắn nhãn nguồn; real theme status chưa cho sửa | Tái sử dụng, bổ sung enum thật; không viết lại catalog; X05. |
| R14 | publicService spread mockPublicService rồi override pricing; sample stories/FAQ vẫn local | Không coi nội dung editorial/FAQ là lỗi tích hợp; story backend chỉ thay nếu đáp ứng public sample contract; X05. |
| R15 | Plan mapper dùng code hoặc id làm id hiển thị | Giữ backendId riêng khi join subscription; không dùng code như UUID trong request; X14. |
| R16 | Playwright mặc định reuseExistingServer=true; test parent-production yêu cầu tất cả màn Parent vẫn khóa | Tách config test; cập nhật expectation đúng yêu cầu mới, không skip test để xanh; X00/X16. |

Baseline lint khi lập kế hoạch: exit 0, **9 cảnh báo**. Không dùng kết quả cũ này để đánh dấu source ngày 19/10 đạt; báo cáo hiện hành ghi chưa chạy lint/build/E2E hoặc mutation backend.

Snapshot OpenAPI ngày 19/10 có 93 operation. Đây là bản tham chiếu đóng băng; cần tải và so sánh lại Swagger khi bắt đầu một đợt tích hợp mới.

## 3. Quy tắc phân nguồn phải dùng

### 3.1. Bảng quyết định

| Tình huống | Đường chạy |
| --- | --- |
| Có endpoint đúng nghiệp vụ và contract đủ rõ | Real; không gọi mock cho thao tác đó trong chế độ tích hợp. |
| Có endpoint nhưng chưa rõ enum/ownership/body | Hỏi người dùng, đánh dấu contract pending cho đúng thao tác; tiếp tục các bước độc lập. Không gọi mock và báo như đã nối thật. |
| Chưa có endpoint cho nghiệp vụ/field | Giữ mock có nhãn; không gửi request đoán lên backend. |
| Endpoint real trả 401/403/404/500/timeout | Hiển thị/xử lý lỗi thật, không fallback mock. 404 không tự biến endpoint thành “chưa có”. |
| Test offline | Có thể dùng fixture/mock/intercept độc lập; đây không phải đường chạy ứng dụng đã tích hợp. |
| Resource được tạo trong demo vì API create chưa có | Chi tiết/chỉnh sửa resource đó nằm trong nhánh demo, không gửi ID demo sang endpoint real đã có. Nhãn demo theo resource. |

“Bỏ mock” là bỏ mock khỏi operation đã nối trong ứng dụng, không xóa fixture/test cần cho chức năng chưa có API. “Có endpoint” không có nghĩa nối mọi CRUD vào nút bất kỳ: ví dụ POST subscription không tự thay checkout, register Child không tự thay liên kết Parent–Child.

### 3.2. Thiết kế nhỏ, có kiểm soát

- Tạo bảng capability tường minh, ví dụ `content.story.read`, `content.page.write`, `content.slot.write`, `content.motion.write`, `admin.audit.read`, `admin.keyword.write`, `admin.topicRules.write`, `parent.child.read`, `parent.child.create`, `parent.progress.read`. Mỗi mục ghi source, operation, lý do mock hoặc câu hỏi pending.
- Không chọn source bằng “path có trong allowlist thì real”: route FE và BE khác tên, nghiệp vụ có thể khác. Allowlist chỉ kiểm tra request real.
- Service giữ API public dễ đọc; router capability chọn adapter real hoặc mock. Page không gọi fetch trực tiếp.
- Query key giữ prefix hiện dùng và thêm source/resource namespace ở phần phù hợp; cập nhật cả invalidate/setQueryData/cancel. Không để đổi shape key làm invalidation mất tác dụng.
- Mock context nhận identity tối thiểu từ session đã xác thực qua lớp ứng dụng. Không fake JWT, không thay token thật bằng token demo, không dùng mock status để quyết định logout real.
- Mock database/overlay tách theo user và source; namespace ID demo, kèm metadata provenance ngoài payload backend. Real resource dùng ID server. Resource lookup phải theo provenance, không chỉ kiểm tra UUID có đúng định dạng.
- Dữ liệu mock không thay quota/permission/session backend. Màn hỗn hợp có nhãn ở từng vùng; save báo “Đã lưu API” hoặc “Đã lưu mô phỏng” đúng phần.
- Với story/child thật cần mock chức năng con: dùng overlay lưu riêng theo user + real resource ID; không clone toàn bộ resource vào seed rồi để snapshot cũ ghi đè metadata real. Không gửi overlay vào payload thật.
- Mock create Child tạo nhánh demo riêng, không làm tăng usage thật. Có thể hiển thị danh sách demo tách vùng hoặc chuyển tới demo detail bằng namespace, nhưng bắt buộc kiểm thử đi lại giữa hai nguồn.
- Mock feature được giữ cả read/write đang tồn tại. Chức năng chưa từng có mock (ví dụ checkout hoàn chỉnh) không tự xây thêm scope mới; ghi rõ và hỏi nếu cần.
- Giữ thiết kế hiện tại; chỉ thêm nhãn nguồn, form/field cần thiết và sửa lỗi phục vụ tích hợp. Không redesign toàn site.

## 4. Ma trận phạm vi thực thi

| Nhóm | Nối real | Giữ mock vì thiếu contract API |
| --- | --- | --- |
| Auth/Profile | Các flow auth hiện có, đọc profile, đổi mật khẩu | Edit profile chung nếu UI đang mô phỏng; không dùng parent quota PUT thay user profile. |
| Public | Đọc catalog gói | FAQ/editorial, sample flow và billing chưa có contract tương ứng. |
| Content | Story/page/role/slot/vocabulary/quiz CRUD, publish/hide và media upload theo DTO | Timeline/motion/layer bổ sung, reorder, history/version và thống kê đọc/quiz. |
| Assets | File trong story/page/role/quiz; standalone upload khi có consumer hợp lệ | Asset library CRUD/metadata; dùng mock store hiện tại, không coi URL tổng hợp là kho asset đầy đủ. |
| Admin | Catalog, audit logs, restricted keywords | Users/permissions/reports/monitoring/statistics/system limits và topic rules. |
| Parent | Chỉ catalog gói dùng chung; POST `/auth/register/child` tạo tài khoản bé thật nhưng response chưa có ID | Profile/list/detail/update giữ mock đến khi backend sửa ownership; link tài khoản có sẵn/unlink, entitlement, approvals, progress, library, recommendations, exports và settings tiếp tục mock. |
| Subscription mutation | Chỉ nối vào chức năng quản trị/lifecycle được người dùng/BE xác nhận | Checkout/renewal/cancel-payment chưa có; giữ mock có sẵn, không gọi CRUD thay thanh toán. |

GET lẻ/detail/lookup không bắt buộc tạo thêm màn mới nếu dữ liệu list đủ. Form Parent tạo tài khoản Child đã nằm trong web; luồng Child tự đăng nhập và sử dụng mobile app ngoài phạm vi repo này. Mỗi operation chưa dùng ghi NOT_NEEDED với lý do thay vì báo missing integration.

## 5. Cách thực thi từng bước

Các bước X00–X17 là thứ tự thực thi và nghiệm thu; adapter đã được triển khai một phần. Đọc implementation report trước khi sửa để không làm lại phần đã có. Kiểm tra git status và AGENTS.md nếu có; không reset/stash/revert thay đổi người dùng. Mỗi bước hoàn tất service + caller UI + test liên quan trước khi đánh dấu xong.

Giữ một báo cáo trạng thái hiện hành tại `docs/api-integration/luna-extramax/implementation-report-2026-10-19.md` và cập nhật sau mỗi chặng. Chỉ tạo báo cáo Xnn riêng nếu có kết quả kiểm thử lớn cần lưu độc lập; không ghi PASS cho phần chỉ đọc code.

### X00 — Chốt baseline, cấu hình và câu hỏi

**Đầu vào:** repo hiện tại, runbook này; không phụ thuộc bước khác.

1. Ghi git status và xác định diff mới; không commit tự động.
2. Snapshot 19/10 đã có. Tải Swagger lại khi bắt đầu chặng API mới; so method/path/body/schema và chỉ cập nhật snapshot khi có drift được xác nhận.
3. Dùng `decisions.md` hiện có; Q01–Q03 đã chốt. Hỏi credential/dữ liệu test chỉ khi đến bước cần xác minh live; không ghi secret vào tài liệu.
4. Chạy lint/build/E2E phù hợp trước nghiệm thu. Kết quả cũ 9 cảnh báo không đại diện cho source hiện tại.
5. Tách test offline/hybrid-intercept khỏi API live; khai báo env rõ ràng, không vô tình dùng `.env.local` để gọi server thật.

**Xong khi:** có baseline, snapshot hiện hành, test config rõ và questions ledger; thiếu credential chỉ chặn nghiệm thu live, không chặn adapter/test intercept.

### X01 — Đồng bộ allowlist và contract

**Sau X00. Files:** backendRoutes.js, snapshot, test contract.

1. Thêm route audit/keyword và route story/quiz mới; bỏ route đã vắng Swagger. So sánh `{id}` với `:id` theo hình dạng.
2. Đánh dấu xung đột GET pages/{storyId} và pages/{id}; hỏi BE qua người dùng về query pageId, roleId, EduThemeId. Không silently deduplicate rồi coi hợp lệ.
3. Kiểm tra multipart field mới, schema create/update khác nhau; ghi mapper cần sửa.
4. Viết test guard cho method đúng/sai, query string, route tĩnh và biến; test drift với snapshot, ngoại lệ trùng phải hiện rõ.

**Xong khi:** guard cho phép operation mới, chặn route cũ/sai method; không xóa guard để lách lỗi.

### X02 — Router theo capability, không theo cả feature

**Sau X01. Files:** featureApi.js, httpClient.js, module capability nhỏ, service callers.

1. Khai báo source cho từng capability theo ma trận mục 4; endpoint đã có/contract pending không nằm trong tập “missing API”.
2. Thêm routing real/mock tường minh; real luôn đi apiRequest forceReal khi cần; mock không gửi fetch.
3. Giữ chế độ test offline riêng. Không để DEV tự chọn mock cho API đã nối trong chế độ tích hợp.
4. Theo Q01 đã chốt, hỗ trợ mock missing API cả local và production, có nhãn “Dữ liệu mô phỏng”. Cấu hình không được kéo API đã nối thật về mock; test cả dev và production preview.
5. Test bảng routing: cùng feature một operation real, một mock; real lỗi không fallback; pending không tạo request sai.

**Xong khi:** real và mock cùng khu vực hoạt động độc lập; không phải bật VITE_PARENT_API_MODE/VITE_ADMIN_API_MODE toàn vùng.

### X03 — Identity, ID, cache và persistence mock

**Sau X02. Files:** mockServer.js, authService/AuthProvider, queryKeys, localAssetStore, draft recovery.

1. Tách mock session context khỏi seeded login; tài khoản thật dùng chức năng mock mà không cần login thêm.
2. Namespace mock store theo user/source, hỗ trợ seed thiếu cho user mới; logout/đổi user cancel và clear cache. Không log token.
3. Định nghĩa provenance resource và cơ chế resolve mock child/story. Chặn synthetic ID trước request real. Link/navigation/detail phải giữ provenance.
4. Thiết kế overlay riêng cho progress/approval/motion của resource thật; không dùng fake ID làm ID backend.
5. Cập nhật query keys và mọi prefix invalidation; cache mock không thể thay cache real.
6. Test real login → mock feature → reload; A → logout → B; mock create → detail/update demo; real child → mock progress; lỗi mock không xóa phiên real.

**Xong khi:** không 401 do thiếu seed, không giao thoa dữ liệu, không gửi ID demo/overlay lên network. Đây là prerequisite bắt buộc trước mở lại Parent.

### X04 — Khôi phục toàn bộ đường đọc Content

**Sau X01–X03. Files:** contentService.js, assetService.js, models.js, list/editor/preview callers.

1. Thay getallstories bằng all-stories hoặc stories theo scope đã xác nhận; detail bằng stories/{id}. Sửa mọi caller, gồm statistics/assets/refetch mutation.
2. Chọn pages/all-pages, roles/all-roles, quizzes/all-quizzes theo draft scope; nếu chưa rõ hỏi, không suy ra theo tên.
3. Mapping enum đã được trả lời mới chuyển number → UI status; giữ unknown nếu chưa biết. Không map 0/1/2 theo mock.
4. Giữ vocabulary fan-out có giới hạn concurrency và AbortSignal; lỗi một collection phải hiển thị lỗi đúng phần, không thay bằng [].
5. Test list/filter/detail/draft/preview, missing item, enum lạ, lỗi một nhóm, navigation nhanh.

**Xong khi:** không còn GET story route cũ, editor tải được toàn bộ phần có contract và đọc lại sau mutation dùng route mới.

### X05 — Auth, public và Admin catalog đã có code

**Sau X02–X03; không cần chờ Content mutations.**

1. Giữ Auth real cho register Parent/login/profile/confirm/reset/change/logout; kiểm tra role mapping và 401/403. Không thay auth real bằng seeded user để mock chạy được.
2. Pricing/themes/catalog thật không lấy default từ mock. Giữ backendId riêng với plan.code/id hiển thị.
3. Kiểm tra adminCatalogService CRUD cho plans/credits/themes; theme enum chốt xong mới mở field status, bảo toàn audit/field không sửa.
4. Public sample stories/FAQ giữ nội dung hiện có nếu chưa có API đáp ứng flow slug/sample/public access; không tự cho đó là thư viện backend.
5. Test auth fixtures/status, catalog CRUD intercept, zero/false/empty/unknown, query invalidation. Live auth/email/password dùng tài khoản test sau khi người dùng cung cấp.

**Xong khi:** đường chạy integration của API đã có không đi mock; phần chưa có được giữ và nhãn phù hợp, không hiển thị fake entitlement cạnh giá thật như dữ liệu tài khoản.

### X06 — Story và page create/update + ảnh/audio

**Sau X04; cần enum/default và PUT file semantics cho phần liên quan.**

1. Tách mapper story create/update: create không yêu cầu Status vì schema không có; AgeGroup theo contract. Update bảo toàn Status cần thiết.
2. Form gửi EducationThemeId đúng ID; file ảnh bìa bằng FormData; không tự điền audit fields.
3. Page RawText/file/audioFile; bỏ AudioNarrationUrl khỏi request mới. Nối file picker vào state và mutation, không chỉ thêm field trong service.
4. Chốt bỏ file là giữ/xóa với BE; xử lý chọn lại/xóa media đúng contract, giữ input nếu save lỗi.
5. Sửa saveAllDrafts cho phần page real: không chặn ảnh/audio đã có API; không xóa dirty của motion/reorder mock.
6. Test tạo → reload, sửa text giữ ảnh/audio, thay file, body 0/false, request thành công nhưng refetch lỗi; timeout không auto retry create.

**Xong khi:** saved text/media khớp reload, UI không báo lưu field backend không nhận.

### X07 — Role CRUD và ảnh nhân vật

**Sau X06; cần StoryRoleType và default status.**

1. Tách role create/update, bỏ guard status cho create theo schema; dùng type thật.
2. Nối file upload role vào FormData; hiện mapper chỉ gửi URL/field text.
3. Map AllowCustomCharacter và RequiresParentApproval là booleans; phê duyệt của Parent vẫn mock riêng.
4. Giữ defaultAssetUrl/ảnh theo PUT semantics; refresh editor sau save.
5. Test tạo/sửa role ảnh, false, loại enum lạ và change story khi request đang chạy.

**Xong khi:** role thật reload đúng; không tuyên bố cờ requiresParentApproval đã nối flow approvals.

### X08 — Vocabulary và quiz multipart

**Sau X04/X06.**

1. Rà vocabulary GET theo page, POST/PUT/DELETE, audioUrl, ID và audit fields; giữ DTO và reload đúng.
2. Quiz create POST /story-template/{storyId}/quizz; update PUT /story-quiz/{id}/with-image, cả hai FormData. Không dùng route JSON cũ.
3. Bind Options theo format BE đã xác nhận; giữ CorrectOptionIndex=0; append file và audioFile nếu chọn.
4. Map response options/optionsJson, questionPicUrl/questionAudioUrl/status. Feedback/page binding chưa có backend giữ mock overlay nếu UI có, không gộp vào request real.
5. Test text-only, ảnh/audio, edit giữ file, options lỗi, index 0, delete và reload; tạo quiz không POST lặp do refetch fail.

**Xong khi:** quiz real cả read/write/delete đúng contract; phần bổ sung mock hiển thị đúng nguồn.

### X09 — Slot, delete và publish

**Đã triển khai một phần ngày 19/10:** Slot đọc theo trang và POST/PUT/DELETE đã nối thật. X/Y dùng phần trăm 0–100 theo xác nhận của người dùng; scale/flip gửi thật; status được bảo toàn khi PUT. Góc xoay, lớp, ảnh riêng và animation tiếp tục dùng overlay. Các nút xóa story/page/role chưa có consumer UI; kiểm thử tích hợp vẫn còn.

1. **Đã nối:** GET slots theo page, nhóm vào role theo ID; POST slot, PUT/DELETE story-slots theo Swagger.
2. **Đã nối:** map x/y ↔ posX/posY theo phần trăm; gửi scale/flip; không gửi layer/keyframe/rotation/assetId chưa có schema.
3. **Đã làm:** giữ công cụ bố cục mở trong real Content; phân chia trường Backend và trường mô phỏng trong editor.
4. Slot delete đã nối. Nút xóa story/page/role và xử lý conflict reference vẫn là việc còn lại nếu các thao tác đó được đưa vào UI.
5. Publish dùng trạng thái Backend + reload; không báo publish motion/version nếu chỉ mock overlay.
6. **Còn lại:** test nhiều role/slot/page, create/update/delete/refetch, publish status số, dirty pending và unknown mutation outcome.

**Xong khi:** dựng truyện cơ bản với slot thật, lưu/publish/reload nhất quán; motion/reorder/history mock vẫn dùng được theo X15.

### X10 — Admin audit thật và sửa crash

**Sau X02–X03; độc lập với Content.**

1. Tách audit service khỏi admin core mock. Nối list/detail/by-user/by-entity-name/by-entity-id nếu UI dùng các bộ lọc đó.
2. Sửa total tự tham chiếu; adapter array → model UI. Giữ actor ID nếu không có tên, không tự tạo success/failed status.
3. Hiển thị old/new/changedColumns an toàn với JSON hoặc string; không giả định luôn parse được.
4. Filter/pagination client chỉ trên tập đã tải đầy đủ; ghi rõ không phải server pagination. Hỏi nếu cần dữ liệu lớn/filter server.
5. Test query success thực sự render, empty, detail, parse lỗi, 403; các màn users/reports/monitoring vẫn mock và không call /admin/* thật.

**Xong khi:** audit không crash, không còn /admin/audit trên real network; mock core Admin giữ được chức năng.

### X11 — Restricted keywords thật, topic rules mock

**Sau X02–X03; cần enum MatchType/SeverityLevel/ModerationAction/CommonStatus.**

1. Nối 5 operation /restricted-keywords, map keyword/description với UI.
2. Form thêm/sửa/xóa/toggle; PATCH payload theo DTO, không gửi revision mock hoặc status chuỗi.
3. Tách keyword từ backend và topic rules mock thành vùng/nguồn rõ; toggle topic không gọi keyword API.
4. Invalidate keyword/audit sau mutation đúng phạm vi; mock overview không bị diễn giải như số liệu hệ thống real.
5. Test all CRUD, enum chưa biết, duplicate/validation, toggle topic không network, keyword lỗi không fallback.

**Xong khi:** keyword real đầy đủ, topic mock còn hoạt động, không tự xóa mock topic khi chuyển màn.

### X12 — Parent child list/detail và liên kết demo

**Sau X03; cần mapping ID/ownership và response mẫu Q02.**

1. Dùng /child-profiles list/detail; không lọc toàn bộ trẻ ở frontend thay authorization server.
2. Map nickName/targetAgeGroup/readingLevel đúng response. DOB/avatar không có thì không giả là trường backend đã lưu.
3. Thay ParentAvailabilityGate bằng capability/resource checks; ChildWorkspaceLayout lấy nguồn đúng cho child đã chọn.
4. Tạo tài khoản Child mới đã nối `POST /auth/register/child` qua JWT và không chuyển tới detail bằng fake ID; backend chưa trả child ID nên UI giữ kết quả tại màn tạo. Link tài khoản có sẵn/hủy liên kết chưa có API và tiếp tục dùng mock riêng. Hồ sơ demo tạo từ date/avatar không gọi API profile thật.
5. Dashboard/progress/approvals/library của child thật tiếp tục mock overlay; giữ nhãn “Dữ liệu mô phỏng”, không ảnh hưởng child read thật.
6. Test empty list thật, mock create/detail, real child detail, chuyển child giữa nguồn, A/B ownership, deep link/reload.

**Xong khi:** Parent đọc được hồ sơ thật và vẫn trải nghiệm tính năng mock thiếu API, không lẫn resource ID.

### X13 — Child update/settings thật theo field

**Sau X12; cần PUT semantics và đơn vị/reset limits.**

1. Nối PUT /child-profiles/{id}, chỉ field được phép: nickName, targetAgeGroup, readingLevel và limits theo quyền đã chốt.
2. remainingCharacterLimit không cho Parent tự cộng nếu chưa có contract. GET lẻ chỉ dùng khi detail không đủ, không gọi dư 4 request mặc định.
3. Form đang gửi PATCH mock phải đổi adapter/body; field DOB/avatar/allowed categories còn thiếu giữ mock riêng, không ghi đè bản thật.
4. Tách kết quả save real và mock; một phần lỗi thì giữ dirty phần đó, không báo “đã lưu tất cả”.
5. Test giữ field không sửa, 0, null, out-of-range, forbidden, save một phần, reload và mock child chỉ ghi demo.

**Xong khi:** giới hạn/hồ sơ được backend hỗ trợ lưu thật; phần chưa có vẫn mock nhưng không bị gửi lên PUT.

### X14 — Parent profile, subscription và plan view

**Sau X05/X12; cần profile ID, lifecycle/subscription status và quyền.**

1. Resolve current parent profile từ contract; không lấy phần tử đầu list hoặc suy userId=parentProfileId.
2. Đọc subscription by-parent, join plan bằng backend UUID; chốt active/expiry/timezone/reset. Đọc field entitlement thật khi response đủ.
3. Sửa ParentPlanPage không phụ thuộc featureApiModes.parent===mock; bỏ điều kiện loại entitlement chỉ vì catalog backend.
4. Thiếu usage cụ thể thì giữ vùng demo riêng, không gắn số fake vào nhãn “hạn mức thực tế”. Không đổi credit thành số lần tạo nhân vật.
5. Parent profile PUT/mark-trial và subscription POST/PATCH/DELETE: hỏi scope/quyền/nghiệp vụ trước khi gắn UI. Không tự gọi trial marker hay CRUD subscription thay mua gói. Nếu chưa có consumer hợp lệ, ghi NOT_NEEDED/PENDING_DECISION; không tạo màn quản trị mới ngoài yêu cầu.
6. Test nhiều subscription, không có active, expired, plan code khác UUID, API lỗi, catalog thật cạnh phần usage mock có nhãn.

**Xong khi:** thông tin có nguồn thật hiển thị đúng; payment chưa có API giữ mô phỏng sẵn có, không thực hiện giao dịch thật.

### X15 — Giữ toàn bộ tính năng thiếu API bằng mock, hoàn thiện màn hỗn hợp

**Sau X03 và bước feature tương ứng; chạy từng phần ngay khi tích hợp feature, không đợi cuối mới sửa.**

1. Content: mở lại motion/timeline/reorder/history/hide chưa có contract theo mock capability; overlay theo user/story/page/slot; mock asset metadata/store vẫn hoạt động.
2. Tách save real từ save mock: merge view không ghi đè ID/status/content backend; thay đổi real refetch không xóa overlay. Khi resource backend bị xóa, overlay orphan không xuất hiện như resource sống.
3. Mock asset được chọn để gắn vào story/page/role thật: lấy Blob rồi upload qua multipart đã có API; không gửi blob URL/local asset ID cho backend. Không có Blob khả dụng thì báo rõ và giữ draft.
4. Standalone upload background/avatar chỉ nối nếu có consumer hợp lệ và response contract. Upload avatar chưa có API gắn vào user thì ghi rõ chỉ upload được, không báo đã cập nhật hồ sơ.
5. Parent: progress, approvals, library, exports, recommendation, family reports tiếp tục dùng mock đúng identity/resource; không gửi email/export job thật khi backend chưa hỗ trợ.
6. Admin: users/permission/moderation/system limits/monitoring/statistics vẫn mock. Mock khóa user không vô hiệu hóa JWT thật; mock role không nâng quyền backend hoặc thay auth role.
7. Mỗi vùng hoặc action demo có nhãn và thông báo save phù hợp. Cập nhật dirty guard/recovery/undo để biết phần lưu server và phần demo.
8. Test real text save + mock animation save, reload, save một phần thất bại; real child + mock progress; mock moderation + real audit không tạo event giả trong log thật.

**Xong khi:** thiếu API vẫn sử dụng được mock đúng yêu cầu, API đã có không bị kéo về mock và không bị dữ liệu demo ghi đè.

### X16 — Kiểm thử tích hợp và sửa test cũ theo yêu cầu mới

**Sau các bước feature cần phát hành.**

1. Contract/adapter test theo snapshot mới; kiểm tra field multipart thực tế, index 0, status unknown, ID, array/envelope, text/204, validation, abort.
2. Hybrid-intercept: request thật chỉ vào endpoint hợp lệ; thiếu API dùng mock không network; real lỗi không fallback; test bằng token giả chỉ trong intercept.
3. Cập nhật parent-production.spec từ kỳ vọng khóa mọi màn thành capability/source routing: API có chạy thật, API chưa có mock với nhãn “Dữ liệu mô phỏng” cả production. Không xóa coverage hay skip để qua lỗi.
4. Chạy test phù hợp từng feature: content-contract/content-save-state/story-editor-recovery; admin-implementation; parent/parent-library/parent-plan/parent-sensitive-role; auth/profile/pricing. Xác định config trước chạy, không mặc định tất cả test cũ phù hợp env mới.
5. Browser các màn đã đổi ở 1366×768 và 390×844; Network đúng route/body, không console error, không mất dirty/file, focus/dialog còn hoạt động.
6. Live smoke với tài khoản test: đọc → tạo riêng dữ liệu test → sửa → reload → xóa đúng dữ liệu đã tạo; role 403/ownership A/B. Không dùng intercept PASS thay live PASS.
7. Chạy npm run lint và npm run build; so với 9 warning baseline. Ghi rõ lỗi mới, lỗi sẵn có và phần chưa xác minh.

**Xong khi:** có kết quả tách biệt offline/hybrid-intercept/live; không báo hoàn tất mutation khi chưa thử persist với server thật.

### X17 — Cập nhật trạng thái và bàn giao

**Sau X16 hoặc hoàn tất các phần độc lập còn blocker đã ghi rõ.**

1. Inventory từng API: REAL_VERIFIED, REAL_UNVERIFIED, CONTRACT_PENDING, MOCK_API_MISSING, NOT_NEEDED. Không dùng tổng số route để tính “% hoàn thành” thiếu căn cứ.
2. Ghi mock nào còn, lý do và file; API nào có nhưng bị chặn và câu hỏi chờ trả lời. Không xếp cả hai cùng nhóm thiếu backend.
3. Cập nhật env mẫu/docs theo Q01, không chứa credential; đối chiếu production build với policy nguồn đã chốt.
4. Bàn giao diff và lệnh test, known issues, bước tiếp theo. Không tự deploy hay đổi model.

**Xong khi:** người dùng có thể thấy rõ API nào đã nối, phần nào còn mock, lỗi nào cần quyết định; không tuyên bố hoàn tất toàn bộ nếu còn API cần nối chưa triển khai.

## 6. Câu hỏi phải hỏi đúng thời điểm

| Câu hỏi | Bước bị ảnh hưởng | Có thể tiếp tục |
| --- | --- | --- |
| Q01 mock cả local/deploy, có nhãn “Dữ liệu mô phỏng” — **ĐÃ CHỐT** | X02/X17 và production tests | Không hỏi lại. |
| Q02 enum/profile ID — **ĐÃ GIẢI QUYẾT từ source** | Parent profile API vẫn bị chặn bởi ownership backend | Tiếp tục phần độc lập; không hỏi lại mapping. |
| Q03 X/Y slot là phần trăm 0–100 — **ĐÃ CHỐT** | Slot CRUD đã nối; kiểm tra read-after-write vẫn còn | Không hỏi lại đơn vị tọa độ. |
| C01 all-* khác list thường thế nào; route pages trùng hình dạng cần query/ID nào? | X04, đọc draft | Đọc DTO/controller; hỏi Backend qua người dùng nếu contract vẫn mơ hồ. |
| C02 PUT/PATCH omission có giữ media/field không; Options multipart bind thế nào? | X06–X08/X13 | Xác minh source/test trước khi gửi mutation live. |
| C03 tài khoản test/role và dữ liệu nào được phép tạo? | Live nghiệm thu | Làm offline/intercept trước; không ghi credential vào docs. |
| C04 có cần UI quản trị subscription CRUD/trial không? | X14 mutation | Không mở mutation quản trị nếu chưa có quyết định scope; catalog/plan read tiếp tục độc lập. |

Khi lỗi: nêu thao tác, file/endpoint, expected/actual, status/message đã loại secret, cách tái hiện và lựa chọn cần người dùng quyết định. Lỗi code rõ nguyên nhân thì sửa trong bước và báo; contract mâu thuẫn/thiếu nghĩa thì hỏi trước khi đoán. Chỉ dừng phần phụ thuộc, không dừng cả dự án nếu còn việc độc lập.

## 7. Prompt giao cho Luna

```text
Đọc docs/LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md và tiếp tục bước còn mở tiếp theo.
Đây là chính sách hiện hành:
- API đã có: nối thật, bỏ mock khỏi đường chạy tích hợp của operation đó.
- API chưa có: giữ mock và chức năng hiện có, không tự tạo endpoint backend.
- Cùng một feature có thể có cả real và mock, phải tách identity/resource/cache/save.
- Real lỗi không fallback mock. Contract chưa rõ thì hỏi tôi; tiếp tục việc độc lập.
Đọc code/AGENTS.md/git status trước sửa, giữ mọi thay đổi đang có của tôi.
Không dùng ID demo hoặc field overlay trong request backend.
Giữ UI hiện tại, sửa đầy đủ service + caller + test trong phạm vi bước.
Cập nhật docs/api-integration/luna-extramax/implementation-report-2026-10-19.md.
Không deploy, không tự commit/reset/stash. Không coi test intercept là live nghiệm thu.
```

Lượt sau thay X00 bằng mã tiếp theo và đọc báo cáo prerequisite. Thứ tự gợi ý: **X00 → X01 → X02 → X03 → X04 → X05 → X06 → X07 → X08 → X09 → X10 → X11 → X12 → X13 → X14 → X15 → X16 → X17**. X10/X11 có thể làm sớm sau X03 khi Content đang chờ contract; X15 được thực hiện theo từng feature trong quá trình nối, không để mock hỏng đến cuối.

## 8. Mẫu báo cáo mỗi bước

```markdown
# Xnn — Tên bước
Trạng thái: IMPLEMENTED / PARTIAL / CONTRACT_PENDING
Baseline và prerequisite:
Files đã sửa:
Operations đã chuyển real:
Operations giữ mock và lý do thiếu API:
Resource/source/cache/UI thay đổi:
Câu hỏi và câu trả lời người dùng:
Kiểm thử: lệnh, config/env không secret, exit code, số test pass/fail/skip.
Live backend: đã thử gì / chưa thử gì (không token, password, PII).
Lỗi còn lại: expected/actual, tái hiện, ảnh hưởng.
Bước tiếp theo đủ điều kiện:
```
