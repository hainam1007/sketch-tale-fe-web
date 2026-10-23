# Bàn giao Luna — nối API SketchTale

Ngày: **21/10/2026**. Đây là chỉ dẫn triển khai tiếp theo, chưa phải báo cáo đã hoàn thành.

Đọc cùng [kế hoạch tổng thể](API_CONNECTION_PLAN_2026-10-21.md), [audit](swagger-connection-audit-2026-10-21.md) và [ma trận từng operation](LUNA_API_OPERATION_MATRIX_2026-10-21.md). Nếu source đã thay đổi, xác minh lại thay vì áp dụng máy móc baseline này.

## A. Phạm vi đã chốt với người dùng

- Triển khai **local**, kết nối `https://sketch-tale-be.onrender.com/api` hiện tại.
- **Hỏi người dùng khi cần tài khoản thử đúng role**. Chưa có tài khoản/bản ghi thử được chỉ định trong lượt lập kế hoạch.
- Người dùng yêu cầu hỏi lại khi có vấn đề. Hỏi cụ thể những quyết định còn thiếu; tiếp tục task độc lập đã rõ. Không dùng im lặng làm câu trả lời.
- Không tự deploy, tạo PR, commit hoặc sửa backend trong phạm vi kế hoạch này.
- Không thể bảo đảm tuyệt đối không có lỗi; chỉ đánh dấu hoàn tất khi có bằng chứng kiểm chứng tương ứng. Chưa chạy runtime phải ghi chưa chạy.

## B. Quy trình bắt đầu

1. Đọc `AGENTS.md` áp dụng nếu có; chạy `git status --short`, xem diff của file định sửa.
2. Baseline đang có thay đổi chưa commit ở RequireAuth, AuthProvider, authService, backendRoutes, httpClient và file mới authTokenStorage; không reset/stash/ghi đè. File `.env.development` cũng đang mới. Đọc lại trước mỗi sửa shared để giữ nguyên công việc người dùng.
3. Tải Swagger lại và so với snapshot. Ghi thay đổi method/path/DTO; nếu có khác biệt ảnh hưởng task, cập nhật contract trước code.
4. Chạy baseline lint/build, ghi lỗi có sẵn riêng. Không sửa lỗi ngoài scope chỉ để làm sạch báo cáo.
5. Kiểm tra `.env.development`, `.env.local` và cấu hình shell vì có thể override nhau. Không in token/mật khẩu; không đổi `.env.production` để bật chức năng chưa nghiệm thu.
6. Lập checklist task bên dưới. Từng task kết thúc bằng: file thay đổi, API đã dùng, test đã chạy, runtime có/không, vấn đề còn mở.

## C. Task triển khai và điều kiện kết thúc

### L00 — Contract và route guard

**File:** `src/lib/api/backendRoutes.js`; snapshot/bảng contract trong `docs/api-integration/`.

- Thêm đúng 16 method/path thuộc char-types, prohibited-themes, content-reports theo Swagger, không mở wildcard toàn `/api`.
- URL truyền vào `apiRequest` bỏ prefix `/api`, vì base URL đã chứa `/api`.
- Kiểm tra route tham số, query, method sai và route chưa khai báo. Guard chỉ kiểm tra contract URL, không thay authorization backend.
- Tạo bảng contract có cột operation, role, body, response sau HTTP unwrap, enum, nguồn xác minh, trạng thái chưa rõ.
- `httpClient` đã unwrap field `data`; adapter phải nhận payload sau unwrap, không mặc định unwrap thêm lần nữa.
- Nhiều mutation chỉ trả 200 hoặc body không có ID. Không lấy response POST làm bản ghi hoàn chỉnh; refetch list/detail sau thành công.

**Qua task khi:** đủ 16 route mới được cho phép, route sai vẫn bị chặn, chưa sửa logic refresh hiện có.

### L01 — Chế độ dữ liệu theo module

**File:** `src/lib/api/featureApi.js`, `src/app/layouts/WorkspaceLayout.jsx`, `.env.example`, `.env.development`; những consumer đọc mode.

Thiết kế các mode sau, là biến **mới đề xuất triển khai**:

| Biến | Phạm vi | Mặc định khi chưa cấu hình |
| --- | --- | --- |
| VITE_PARENT_PROFILE_API_MODE | List/detail/settings bé và đọc Parent profile | Theo VITE_PARENT_API_MODE hiện tại |
| VITE_PARENT_CATALOG_API_MODE | Chủ đề/truyện catalog Parent | Theo VITE_PARENT_API_MODE |
| VITE_PARENT_SUBSCRIPTION_API_MODE | Gói hiện tại của Parent | Theo VITE_PARENT_API_MODE |
| VITE_ADMIN_REPORTS_API_MODE | Báo cáo nội dung | Theo VITE_ADMIN_API_MODE |
| VITE_ADMIN_MODERATION_CATALOG_API_MODE | char-types/prohibited-themes | Theo VITE_ADMIN_CATALOG_API_MODE |

- Dùng resolver tập trung, chỉ nhận real/mock; giá trị không hợp lệ phải báo lỗi cấu hình. Chỉ bật real từng module sau khi code/contract sẵn sàng.
- Request real đi qua `apiRequest` và cơ chế auth hiện tại; truyền `forceReal: true` khi mode module là real để không vô tình bị global mock ghi đè.
- Resolver quyết định cả service, nhãn nguồn dữ liệu và route capability; tránh ba chỗ có ba điều kiện khác nhau.
- Trong real profile workspace, chức năng chưa có backend hiển thị chưa khả dụng; không lấy ID thật gọi mock để tạo hoạt động giả. Demo profile giữ trong phạm vi mock riêng.
- Kiểm tra trạng thái mixed: profile real/catalog mock và profile mock/catalog real; thao tác có quan hệ child/story không hợp lệ phải không được bật.

**Qua task khi:** bật một module không đổi mode các module khác; lỗi real không trả mock; nhãn trên UI đúng nguồn dữ liệu.

### L02 — Audit và danh mục

**File hiện có:** `adminService.js`, `adminCatalogService.js`, `AdminAuditPage.jsx`, `AdminCatalogPage.jsx`, `AdminRestrictionsPage.jsx`, `src/app/App.jsx`, `src/app/layouts/WorkspaceLayout.jsx`.

- Audit: map `auditAction` thành field UI thống nhất cho list/detail. Test action không rỗng, lọc đúng, giá trị null không crash.
- Mở rộng config danh mục cho char-types; tạo route/menu tương ứng theo convention hiện có, kiểm tra cả breadcrumb/title và regex `isAdminCatalogPage` của layout.
- Prohibited themes: ưu tiên tái sử dụng trang Restrictions nếu giữ được phân biệt keyword/chủ đề; chỉ tạo trang riêng khi cấu trúc form không phù hợp. Không thay đổi flow keyword đã chạy thật.
- Payload char-types chỉ gồm name, description, status. Payload prohibited-themes chỉ gồm name, description, matchType, severityLevel, action, status.
- Select enum gửi số theo contract đã xác minh; không dùng `Number("")` thành 0, không gửi nhãn tiếng Việt thay giá trị số. Enum lạ hiển thị chưa xác định và chặn sửa field đó đến khi rõ mapping.
- Form hiện có mapping CommonStatus trong UI không phải bằng chứng backend; kiểm tra nguồn mapping trước reuse. Các enum mới chưa có tên trong Swagger phải xác minh trước mutation.
- Save thành công/refetch thất bại: thông báo đã gửi nhưng chưa tải lại, không retry POST tự động hoặc dựng ID giả.

**Qua task khi:** list/create/update/delete dùng request thật đúng DTO, reload bền vững, lỗi backend được giữ, route/menu mở được bằng deep link.

### L03 — Báo cáo nội dung

**File:** `src/features/admin/services/adminService.js`, `AdminReportsPage.jsx`, `AdminReportDetailPage.jsx`; đề xuất file mới `services/contentReportAdapter.js` nếu mapping phức tạp.

- Ưu tiên GET list và detail; dùng `queryKeys.adminReports(user.id, filters)`/`adminReport(user.id, id)`.
- Không tự tạo title/reporterName/revision từ dữ liệu khác; dùng targetId/createBy khi chỉ có ID, hiển thị thiếu thông tin đúng thực tế.
- Trước PATCH, xác minh ContentReportStatus và action có thực sự ẩn/xóa target hay chỉ đổi trạng thái report.
- Nếu PATCH nhận đầy đủ DTO, giữ targetType/targetId/reason từ detail thật, chỉ thay field người dùng được phép sửa; không gửi model UI nguyên khối.
- Không gửi `revision`, `note` hoặc `action` nếu contract không nhận. Không tự mô phỏng 409/revision bằng timestamp.
- Mutation invalidate cả list các bộ lọc và detail; nếu item chuyển khỏi bộ lọc hiện tại, phân trang/empty state phải đúng.
- POST/DELETE/history theo user là phần có điều kiện trong ma trận; chưa có consumer không tính đã nối.

**Qua task khi:** list/detail/update qua đúng endpoint, các nút thể hiện đúng tác dụng backend; không có thông báo kiểm duyệt thành công sai nghiệp vụ.

### L04 — Profile: nối cả service và đường vào UI

**File bắt buộc rà soát:**

| File dưới src/features/parent | Công việc |
| --- | --- |
| services/childrenService.js | Adapter list/detail/update/settings; giữ API nghiệp vụ chưa có tách biệt |
| pages/ChildrenPage.jsx | Hiện chỉ render preview/status; bổ sung query list thật, loading/error/empty và link ID thật |
| pages/ParentOverviewPage.jsx | Đọc danh sách thật ở module sẵn sàng; không kéo số liệu demo vào hồ sơ thật |
| layouts/ParentAvailabilityGate.jsx | Hiện chỉ cho vài route cố định; mở detail/settings/catalog theo capability đã sẵn sàng |
| layouts/ChildWorkspaceLayout.jsx | Tách preview/real, selector dùng ChildProfile ID, tab chỉ bật chức năng có thật |
| components/FamilyProfilesPreview.jsx | Điều kiện preview dựa mode profile mới; không để parent global mock lấn profile real |
| pages/ChildDetailPage.jsx và components/ChildForm.jsx | Form chỉ cho sửa field backend hỗ trợ; giữ mapping displayName → nickName |
| pages/ChildSettingsPage.jsx | Bỏ phụ thuộc bắt buộc vào allowedCategories khi API chưa có; mapping giới hạn đúng contract |
| pages/NewChildPage.jsx | Sau register thành công, refetch danh sách và nhận ID thật; không tạo tài khoản lần hai chỉ vì refetch lỗi |

**Các điểm không được đoán:**

- `childrenService.list` cần trả shape UI đang dùng, ví dụ `{items}`; backend array hay envelope phải được xác nhận rồi normalize rõ ràng. Object sai schema phải báo lỗi, không biến thành danh sách rỗng.
- `ChildWorkspaceLayout` đọc displayName, birthDate, avatar và linkStatus. Ngày sinh/avatar không có trong UpdateChildProfileDto; thiếu thì hiển thị chưa có, không suy ngày sinh từ targetAgeGroup hoặc gửi field không được hỗ trợ.
- `ChildForm` hiện sửa birthDate/avatar: trong real mode field không lưu được phải chuyển chỉ đọc/ẩn, không báo đã lưu toàn form khi chỉ lưu nickName.
- `ChildSettingsPage` hiện có `readingTimeLimitMinutes=null` nghĩa không giới hạn; DTO dailyTimeLimit là integer không nullable. Xác minh đơn vị và giá trị không giới hạn; nếu chưa rõ thì chưa cho chọn “không giới hạn”, không tự chuyển null thành 0/-1.
- allowedCategories không có field tương ứng: tách trạng thái chưa hỗ trợ khỏi giới hạn thời gian đã lưu được. Không gửi list chủ đề vào PUT child profile.
- PUT có thể reset field thiếu: chỉ triển khai sau khi biết semantics; nếu cần read-modify-write, dùng detail mới và bảo toàn field được phép theo contract. Không cho frontend quyết định quota còn lại.
- Không gọi GET parent-profiles toàn hệ thống để tìm người đang đăng nhập nếu backend chưa scope theo quyền. Thiếu cách resolve ParentProfile ID là blocker riêng của module.
- Nếu register không trả ID, refetch list vẫn có thể hiển thị bé mới; chỉ tự điều hướng khi xác định duy nhất được hồ sơ thật. Không đoán theo phần tử cuối cùng hoặc trùng nickname.

**Cache:** sau sửa profile/settings invalidate children(user), child(user,id), childSettings(user,id) và entitlement nếu contract xác nhận ảnh hưởng. Response PUT rỗng: refetch rồi trả normalized child/settings cho caller; không `setQueryData(..., null)`.

**Qua task khi:** truy cập deep link detail/settings thật được, không rơi vào preview; Parent A/B cách ly ở backend; sửa/reload thành công; đổi bé và đổi phiên không lẫn cache.

### L05 — Catalog và gói đọc

**File:** `childrenService.js`, `publicService.js`, `ParentLibraryPage.jsx`, `ParentPlanPage.jsx`, gate/menu Parent, queryKeys nếu cần key mới.

- Catalog scope phải được kiểm tra bằng Parent; không dùng tài khoản Content thành công làm bằng chứng Parent gọi được.
- GET story detail có thể cần adapter riêng với Content editor; giữ DTO catalog tối thiểu, không tải toàn bộ pages/slots khi chỉ cần card.
- Nút recommend vẫn chưa khả dụng trong catalog real đến khi có API. Không gọi mock recommendation với ID story thật.
- `publicService` hiện dùng plan.code làm id ưu tiên; bổ sung backendId hoặc đổi model có migration rõ cho caller. Audit toàn bộ link/query theo planId trước đổi để không phá pricing/checkout.
- GET subscription theo ParentProfile ID; hiển thị rõ nếu nhiều gói mà chưa có quy tắc gói đang hiệu lực. Hỏi lại quy tắc, không chọn ngẫu nhiên.
- Không tính usage bằng monthlyCreditLimit nếu không có remaining/usage đáng tin cậy. Không mở checkout bằng POST subscription.

**Qua task khi:** catalog đúng quyền/phạm vi, gói của đúng Parent, code và UUID không nhầm, unsupported action không trả thành công giả.

### L06 — Xóa nội dung và upload

**File:** `contentService.js`, `StoryPagesPage.jsx`, `StoryRolesPage.jsx`, `hooks/useStoryEditor.js`, `contentMockOverlay.js`, `assetService.js`, `localAssetStore.js` và consumer ảnh thực sự có.

- `useStoryEditorMutation.onSuccess` hiện kỳ vọng **nextStory**, không phải response DELETE rỗng. Service xóa phải refetch/normalize editor như các mutation hiện có trước khi trả kết quả.
- DELETE page dùng đúng `/storypage-template/story-pages/{pageId}`; DELETE role dùng `/story-role/{roleId}`.
- Xác minh backend cascade/constraint, không tự phát hàng loạt DELETE slot/quiz để lách lỗi nếu chưa có nghiệp vụ được xác nhận.
- Khi delete thành công nhưng refresh lỗi, không nói xóa thất bại rồi cho người dùng tạo bản ghi trùng; thể hiện thao tác đã gửi và cho tải lại.
- Rà selection, cache assets, overlay/draft còn giữ ID đã xóa; preserve draft không liên quan. Không xóa toàn bộ IndexedDB/localStorage của người dùng.
- Upload dùng FormData field file, để browser đặt multipart boundary. Không base64 hóa file vào JSON.
- Chưa có API gắn avatar/asset đã upload vào object thì giữ task upload consumer blocked; không tuyên bố lưu ảnh thành công chỉ vì nhận URL.

**Qua task khi:** delete và upload hoàn tất đúng luồng consumer, tải lại bền vững, tham chiếu/draft không làm hồi sinh dữ liệu đã xóa.

## D. Kiểm thử cụ thể

### Tách ba loại kiểm tra

1. **Contract/adapter:** fixture theo Swagger và response đã xác minh, không có dữ liệu nhạy cảm. Kiểm tra payload, unwrap, enum, null và shape lỗi.
2. **UI intercept:** chạy code real với Playwright route interception, xác nhận method/path/body và trạng thái UI. Chặn request API không được fixture xử lý để test không vô tình ghi lên backend thật.
3. **Live smoke:** chỉ chạy khi có tài khoản đúng role và bản ghi thử được xác nhận. Không dùng tài khoản mock `content@example.com` làm tài khoản thật.

`playwright.config.js` hiện `reuseExistingServer: true`, một số test hiện đăng nhập mock. Luna cần config riêng cho integration với port riêng, env rõ, `reuseExistingServer: false`; không coi server đang chạy bất kỳ là đúng mode. Live smoke tách opt-in, không chạy cùng lệnh test mặc định.

### Ca kiểm tra bắt buộc theo module

| Mã | Ca kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| T01 | 16 route mới + route/method sai | Route đúng qua guard, route sai bị chặn trước fetch |
| T02 | Module real nhận 500/network error | Hiện lỗi, không đọc mock |
| T03 | List sai schema / list rỗng | Sai schema là lỗi; array rỗng là empty state |
| T04 | Mutation 200 body rỗng | Refetch, không cache null như entity |
| T05 | Audit có auditAction | Table/detail/filter cùng giá trị |
| T06 | Enum hợp lệ/lạ/field bỏ trống | Payload số đúng; không ép rỗng thành 0 |
| T07 | Report đổi status | List/detail nhất quán; không tự tuyên bố đã ẩn target |
| T08 | Parent real deep link detail/settings | Gate cho vào đúng màn, không preview |
| T09 | Parent A thử ID Child/Parent B | Backend từ chối, FE không hiển thị dữ liệu B |
| T10 | Đổi bé khi fetch cũ còn đang chạy | Không flash/cache dữ liệu bé cũ vào bé mới |
| T11 | Field sinh nhật/avatar/chủ đề chưa hỗ trợ | Không gửi field sai, không báo đã lưu field đó |
| T12 | Register thành công, list refetch lỗi | Giữ kết quả tạo tài khoản; retry chỉ tải list |
| T13 | Sửa dailyTimeLimit và reload | Giá trị/đơn vị đúng, không reset field khác |
| T14 | Profile PUT/GET 403 hoặc 404 | Thông báo phù hợp, không fallback demo |
| T15 | Catalog bằng Parent | Không có bản nháp/truyện ngoài quyền; recommendation chưa có không giả thành công |
| T16 | Plan code khác UUID | Request subscription dùng đúng UUID, link pricing không hỏng |
| T17 | Subscription không có/nhiều bản ghi | Empty/ambiguity rõ ràng; không tự chọn gói sai |
| T18 | Xóa page/role thành công/thất bại | Selection/cache đúng; thất bại giữ object |
| T19 | Reload sau xóa có draft cũ | Object đã xóa không xuất hiện lại |
| T20 | Upload được nhưng gắn ảnh thất bại | Không báo đã lưu avatar/background |
| T21 | Đổi tài khoản/logout khi request đang chạy | Không đưa response phiên cũ sang người mới |
| T22 | Profile real + phần Parent chưa có API | Không trộn thống kê/approval/library mock vào Child thật |

Lệnh nền tảng: `npm run lint`, `npm run build`. Test chọn theo thay đổi; thêm spec integration có ý nghĩa, không tạo test chỉ kiểm tra text trong source. Nếu sửa shared HTTP/auth ngoài dự kiến, phải giải thích lý do và kiểm tra hồi quy refresh/logout/session, không lặng lẽ mở rộng scope.

## E. Những lúc Luna phải hỏi lại

Tìm bằng chứng trong source/Swagger/tài liệu trước. Nếu không đủ, hỏi người dùng câu cụ thể kèm operation và ảnh hưởng; giữ task đó pending, không tự chọn câu trả lời.

| Vấn đề | Câu hỏi cần làm rõ | Phần vẫn làm được |
| --- | --- | --- |
| Thiếu tài khoản/bản ghi thử | Có tài khoản Parent A/B, Admin, Content và dữ liệu thử nào được phép dùng? Không ghi secret vào tài liệu | Code/fixture/UI intercept |
| Enum không có nhãn | Giá trị số của enum này tương ứng trạng thái nào? Có source/backend contract xác nhận không? | GET và hiển thị giá trị chưa xác định |
| Không resolve được Profile ID/scoped list | Backend cung cấp mapping user → profile và danh sách bé của Parent qua đâu? | Adapter skeleton có lỗi rõ; không bật module real |
| PUT bỏ field/null chưa rõ | Bỏ field có giữ nguyên không? dailyTimeLimit dùng đơn vị gì, không giới hạn là gì? | Read-only profile, module khác |
| Reports thiếu workflow | Đổi status có ẩn nội dung thật không? Những quyết định nào được phép? | List/detail |
| Nhiều subscription | Quy tắc chọn gói hiệu lực và priority là gì? | Danh sách subscription, không suy entitlement |
| Avatar/background không có API gắn | API nào lưu URL/asset ID này vào hồ sơ/page? | Giữ luồng multipart hiện tại nếu đã hoạt động |
| Delete có tham chiếu | Có cho cascade không hay phải chặn? Cần bảo toàn dữ liệu nào? | Read/update, thông báo lỗi backend |
| Backend lỗi/contract lệch | Gửi request đã bỏ secret, status/error, expected/actual; hỏi backend contract đã thay đổi hay cần xử lý thế nào | Task không phụ thuộc |

Không bắt người dùng duyệt lại các lựa chọn kỹ thuật nhỏ đã có convention (tên helper, tách adapter, invalidate query). Không hỏi lại môi trường: đã chốt local + backend hiện tại.

## F. Tiêu chí bàn giao cuối

- Mỗi operation có trạng thái trong ma trận: pending / service-only / UI-wired / verified-runtime / deferred / blocked-contract, kèm source và bằng chứng test.
- Tách rõ UI-wired và verified-runtime. Một test intercept pass không đủ nâng lên verified-runtime.
- Ghi lỗi tồn tại trước, lỗi mới và task chưa xong. Không xóa checklist chưa đạt để làm báo cáo đẹp.
- Sau từng đợt kiểm tra diff không chạm ngoài scope; cập nhật audit và ma trận. Không thay snapshot cũ làm mất bằng chứng.
- Kết quả gửi người dùng: chức năng đã nối, test đã chạy, phần chưa nghiệm thu và câu hỏi còn mở. Nếu còn blocker thì không kết luận toàn bộ API đã nối xong.

## G. Prompt giao việc cho Luna

> Đọc docs/api-integration/LUNA_API_HANDOFF_2026-10-21.md, API_CONNECTION_PLAN_2026-10-21.md và LUNA_API_OPERATION_MATRIX_2026-10-21.md. Triển khai theo task L00–L06 trên local, dùng backend hiện tại. Giữ thay đổi đang có của người dùng. Bắt đầu bằng kiểm tra working tree, Swagger và baseline lint/build; không chỉ tạo service mà phải nối consumer, gate, adapter và cache. Chưa đoán enum, Profile ID, PUT semantics, payment hoặc quyền sở hữu. Khi thiếu thông tin, hỏi tôi đúng blocker và tiếp tục phần độc lập. Hỏi tài khoản thử khi đến live smoke; không tự dùng credentials mock hoặc sửa dữ liệu có sẵn. Sau mỗi task ghi rõ code/test/runtime đã đạt, cập nhật ma trận. Không deploy hoặc tự commit trong scope này.
