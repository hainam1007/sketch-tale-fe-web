# Kế hoạch tích hợp API Parent — 29/10/2026

**Bàn giao:** Luna, model gpt-6-luna, effort xhigh.
**Phạm vi:** Kế hoạch thực thi dựa trên mã frontend và Swagger mới. Đây là kiểm kê tĩnh; không sửa ứng dụng, không chạy kiểm thử. “Đã nối” nghĩa là có đường gọi API trong frontend, chưa xác nhận lời gọi thành công với backend thật.

> **Đã được cập nhật bởi source audit 01/11/2026.** Dùng [Parent API gaps/source status](PARENT_API_GAPS_2026-10-29.md), [Parent source audit](PARENT_API_SOURCE_AUDIT_2026-11-01.md) và [API integration master](API_INTEGRATION_MASTER_2026-11-01.md) làm nguồn trạng thái hiện hành. Bản 29/10 dưới đây giữ thứ tự kế hoạch ban đầu; không còn dùng các bước xác minh cũ để thay cho kết luận source hoặc những code change đã có.

## Baseline Swagger

Nguồn chuẩn: [snapshot 29/10](../../artifacts/swagger-parent-2026-10-29.json) và [diff](../../artifacts/swagger-parent-diff-2026-10-29.json).

- Operation tăng **118 → 124**, thêm 6; không operation cũ nào bị xóa hoặc thay đổi object.
- Sáu operation mới đều thuộc /api/users, phục vụ quản trị người dùng: GET /api/users, POST /api/users, GET /api/users/{id}, PUT /api/users/{id}, PATCH /api/users/{id}/status, PUT /api/users/{id}/status. Không operation nào thuộc Parent.
- Sáu schema thay đổi: AdminCreateUserDto, AdminUpdateUserDto, CreateSubscriptionPlanDto, SubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateUserStatusDto.
- haveParentProfileSub được thêm vào CreateSubscriptionPlanDto, SubscriptionPlanDto và UpdateSubscriptionPlanDto. UpdateSubscriptionPlanDto không còn code. Đây là thay đổi schema, không phải operation mới.

Bảy operation user-story-character-mappings đã có trong snapshot 23/10, mới so với snapshot 21/10; không mới trong diff 29/10:

1. GET /api/user-story-character-mappings
2. POST /api/user-story-character-mappings
3. GET /api/user-story-character-mappings/{id}
4. PATCH /api/user-story-character-mappings/{id}
5. DELETE /api/user-story-character-mappings/{id}
6. GET /api/user-story-character-mappings/character/{charId}
7. GET /api/user-story-character-mappings/generate-story/{generateStoryId}

DTO đọc/cập nhật có parentApprovalStatus, nên đây là **mapping một phần / cần xác minh**. Swagger chưa thể hiện rõ inbox theo bé, owner scope, ngữ cảnh yêu cầu, revision chống ghi đè hoặc lịch sử quyết định. Không coi workflow duyệt Parent là hoàn toàn có sẵn hay hoàn toàn thiếu.

## Trạng thái và quyết định

| Phân loại | Hiện trạng | Hướng xử lý |
|---|---|---|
| Đã nối, runtime chưa xác minh | GET/PUT child-profiles; POST auth/register/child; đọc stories/themes; đọc subscription-plans | Giữ adapter, kiểm chứng payload, ownership, shape và lỗi runtime. |
| Có trong Swagger nhưng frontend chưa gọi | parent-profiles list/detail/update/trial; subscription operations; một số plan lookups | Chốt ID/owner/semantics rồi nối theo nhu cầu UI. Subscription CRUD không phải thanh toán. |
| Mapping một phần / chưa rõ | user-story-character-mappings, parentApprovalStatus, một số child profile limits | Xác minh owner/context/state trước khi dùng. |
| Chưa có operation khớp UI | Dashboard/progress, settings mở rộng, inbox duyệt theo bé, thư viện riêng/gợi ý, exports và family report | Không chuyển route mock sang real bằng giả định. Xem [danh sách API còn thiếu](PARENT_API_GAPS_2026-10-29.md). |
| Demo có chủ đích | Checkout, số liệu học tập, settings bổ sung, favorites/gợi ý, approval demo và exports mẫu | Gắn nhãn demo tại thao tác/kết quả cho tới khi có contract thật. |

**Đang gọi thật:** src/features/parent/services/parentProfileService.js gọi GET/PUT /child-profiles...; PUT gửi nickName, dailyTimeLimit, dailyCharacterLimit. src/features/auth/authService.js gọi POST /auth/register/child. src/features/parent/services/parentCatalogService.js đọc stories/themes theo module mode. src/features/public/services/publicService.js đọc /subscription-plans khi global mode là real.

**Còn mock/demo:** src/features/parent/services/childrenService.js giả định các path /children, /parent/dashboard, /entitlements, /children/{id}/settings, /approvals, /library, /parent/exports, /parent/family-report và /catalog/categories. Các route này không có trong allowlist hiện tại của src/lib/api/backendRoutes.js; route guard sẽ trả 501 API_ROUTE_NOT_DOCUMENTED trước network. src/features/parent/services/parentDemoState.js lưu state trong sessionStorage. Catalog truyện có thể đọc thật nhưng lưu/gợi ý vẫn local. ParentCheckoutPage chỉ mô phỏng; publicService trả checkoutEnabled=false nhưng ParentPlanPage vẫn cho CTA vào trang checkout.

## Route đang hoạt động

src/app/App.jsx đăng ký overview, danh sách/tạo bé, profile/dashboard/settings/approvals/library/progress/exports theo bé, plans/checkout và /parent/library. /parent/exports và /parent/reports chuyển hướng về thư viện.

Khi parentProfile=real, route qua `ChildWorkspaceLayout` hiển thị `ParentChildExperience` (không gian bé v2). Hồ sơ và giới hạn cơ bản dùng API; dashboard/settings/favorites/exports vẫn là demo. Approval inbox có `ParentApprovalsLive` opt-in khi cả `parentProfile` và `parentApprovals` đều `real`; nếu thiếu một mode thì không gửi request bằng preview ID. Một số route page cũ như `ChildDashboardPage`, `ChildSettingsPage`, `ChildApprovalsPage`, `ChildLibraryPage`, `ChildProgressPage` và `ChildExportsPage` không phải view được render trong nhánh v2.

ParentExportsPage.jsx, FamilyReportsDemo.jsx và LiveChildProfilePage.jsx không được import/tham chiếu trong src. Không lấy chúng làm bằng chứng tính năng hoạt động. Chốt route/UI thật trước khi nối thêm API, tránh real mode rơi âm thầm vào demo cũ.

## Kế hoạch thực thi

### 0. Xác minh contract và owner bằng runtime

1. Đối chiếu Swagger với controller/service cho child-profiles, parent-profiles, subscriptions và approval mappings.
2. Trên môi trường test, dùng hai tài khoản Parent: danh sách chỉ có profile của chủ gọi; đọc/cập nhật chéo ID bị từ chối 403/404; ghi nhận response/status thực tế, gồm trường hợp PUT trả 204.
3. Xác định quan hệ user.id từ /auth/profile với parentProfileId. Không truyền User UUID vào route cần ParentProfile UUID nếu chưa xác minh.
4. Kiểm tra child-side enforcement của dailyTimeLimit và dailyCharacterLimit. UI lưu hạn mức không chứng minh backend/app Child đang áp dụng.
5. Kiểm tra allowlist: comment backendRoutes.js ghi snapshot 19/10. Chỉ thêm route có trong Swagger hiện tại; allowlist không chứng minh runtime.

**Chấp nhận:** không đọc/ghi profile chéo Parent; ID, response/envelope, nullable và status được ghi lại; child enforcement có kết luận. Nếu chưa đạt, không bật profile real rộng.

Audit ngày 21/10 từng nêu quan ngại ownership cho profile. Đây là phát hiện lịch sử, không xác nhận lỗi còn hay đã sửa ngày 29/10; kiểm tra lại thay vì mặc định.

### 1. Nối đúng plan và đọc subscription hiện tại

1. Sửa publicService để giữ plan id UUID và code riêng. Hiện adapter dùng code || id làm id; không dùng code thay UUID trong route subscription.
2. Thêm haveParentProfileSub vào kiểu plan. Swagger khai báo boolean không nullable, nhưng không ép dữ liệu thiếu/null thành false trước khi xác minh dữ liệu cũ và default backend. Khi update plan, chỉ gửi boolean rõ ràng.
3. Kiểm tra Admin plan editor không gửi code trong UpdateSubscriptionPlanDto.
4. Sau khi chốt mapping, lấy ParentProfile đúng qua GET /parent-profiles hoặc /parent-profiles/{id}; ưu tiên GET /subscriptions/parent-profile/{parentProfileId} để đọc subscription có scope.
5. Dùng parentProfileId, subscriptionPlanId, status, startDate, endDate và plan từ SubscriptionDto làm read model. Chốt cách xử lý trial, hết hạn và nhiều bản ghi với backend.
6. Không gọi POST/PATCH/DELETE /subscriptions từ CTA checkout. CRUD không chứng minh thanh toán, webhook hợp lệ hay entitlement đã cấp. Nếu chưa có checkout thật, báo chưa khả dụng hoặc giữ demo có nhãn và không kích hoạt gói.

**Chấp nhận:** UUID/code không trộn; subscription thuộc đúng ParentProfile; giá trị chưa xác định không thành false; chọn gói không tạo subscription hay báo thanh toán thành công.

### 2. Hoàn thiện profile và catalog hiện có

- Giữ child-profiles và parent-profiles là entity/ID riêng; đặt tên kiểu/service rõ nghĩa.
- Chuẩn hóa profile theo shape runtime đã xác minh. Empty khác malformed/error; API lỗi có retry, không fallback mock hoặc trả danh sách rỗng. Cache key phân vùng theo phiên và profile ID.
- Xác minh semantics targetAgeGroup, dailyTimeLimit, dailyCharacterLimit và lookup riêng; tránh gọi lookup dư nếu detail đã đủ.
- Giữ Parent catalog read-only; xác minh stories được phép xem/công bố. Adapter giữ backend ID/theme ID; thiếu cover/số trang phải ở trạng thái chưa có thay vì dựng dữ liệu.
- Nếu lưu truyện/gợi ý còn demo, gắn nhãn tại CTA và kết quả. Catalog thật không khiến hành động local thành thao tác đã lưu thật.

**Chấp nhận:** fixtures cho shape đúng, malformed, lỗi, empty; API lỗi không fallback; demo được dán nhãn ngay tại thao tác.

### 3. Xác minh approval mapping một phần

- Xác minh controller của bảy route: creator, owner scope, quan hệ child/story/character, enum parentApprovalStatus, default, transition hợp lệ và side effect khi xóa.
- Kiểm tra GET theo generateStoryId/characterId có ngữ cảnh đúng bé; không dùng GET toàn bộ làm inbox Parent nếu không có owner scope.
- PATCH không có revision token. Chưa bật approve/reject khi chưa rõ stale update, nhiều tab và audit trail.
- DTO chưa thể hiện đủ ngữ cảnh UI cần: bé yêu cầu, tài sản/version, thời điểm, trạng thái trước và generated story.
- Nếu chỉ read path rõ, nối read-only theo scope đã xác nhận; để quyết định demo/không khả dụng. Ghi contract còn thiếu vào tài liệu gaps.

**Chấp nhận:** chỉ đúng Parent/bé xem được yêu cầu; không đọc chéo owner; conflict được phát hiện hoặc quy tắc backend rõ; UI chỉ báo thành công sau khi backend xác nhận.

### 4. Đồng bộ route, mode và trạng thái thật

- Chỉnh capability routing trong ParentAvailabilityGate/ParentChildExperience theo từng operation. Có thể giữ view hiện tại và demo có nhãn cho phần thiếu API; không bắt buộc chuyển về trang cũ hay bỏ chức năng demo. Phần đã có contract phải đi đúng adapter thật.
- Chốt routes progress/exports và component orphan trước khi nối API mới.
- Lỗi real (network/401/403/5xx/schema) phải hiện lỗi/retry; không chuyển sang mock như thể thay đổi đã lưu.
- Giữ nhãn demo trên checkout, favorites, recommendations, học tập, approvals và exports đến khi luồng thật hoạt động.

**Chấp nhận:** route tests cho mock và real profile; nhánh thật không trộn sample data như dữ liệu thật; mock không phát sinh mutation backend.

### 5. Bổ sung contract còn thiếu

Dashboard, progress, settings mở rộng, inbox approvals, thư viện riêng/gợi ý, exports và family report theo [Parent API gaps](PARENT_API_GAPS_2026-10-29.md). Không tự thêm path vào backendRoutes.js hoặc gọi real trước khi endpoint xuất hiện trong Swagger và owner/schema/response được xác nhận.

Triển khai từng lát cắt: contract DTO → route allowlist → service adapter → query/mutation UI → owner/child-side enforcement → API/UI tests. Không bật toàn Parent real chỉ vì một module xong.

## Files và kiểm thử

**Source dự kiến:** parentProfileService.js, ParentAvailabilityGate.jsx, ParentChildExperience.jsx, FamilyProfilesLive.jsx; parentCatalogService.js, publicService.js, ParentPlanPage.jsx, ParentCheckoutPage.jsx; featureApi.js, backendRoutes.js. childrenService.js chứa giả định cho API chưa có; chỉ nối từng nhóm sau khi contract duyệt.

**Test hiện có để mở rộng:**
- tests/parent-live-profiles.spec.js dùng fixtures GET/PUT profile; kiểm tra payload/UI, không chứng minh backend thật.
- tests/parent-experience-v2.spec.js dùng fixtures profile/catalog/plans và kiểm tra demo không gửi mutation.
- tests/parent-production.spec.js kiểm tra production route/mode và request.
- tests/support/apiModes.js, playwright.api.config.js, playwright.parent-production.config.js cấu hình mode/server.

**Gate trước khi bật real:** build/lint không có lỗi mới; Playwright cho response đúng/malformed/error, 204, empty, timeout/5xx, không mock-fallback và viewport 390/768/1366; API test backend test environment với hai Parent về cross-owner profile, ID mapping, subscription scope và child enforcement; xác nhận body không chứa field ngoài DTO và log/báo cáo không lộ token, update plan không gửi code, checkout demo không ghi subscription; git diff --check sạch. Ghi lại Swagger version, backend commit và test environment. Tách lỗi có sẵn khỏi lỗi do thay đổi mới.

Các gate này là yêu cầu cho lần triển khai sau; **chưa được chạy trong lần lập kế hoạch này**.

## Thứ tự ưu tiên

1. Xác minh contract/runtime ownership cho child profiles và mapping User → ParentProfile.
2. Tách UUID/code, xử lý haveParentProfileSub thận trọng, đọc subscription có scope; checkout vẫn demo/disabled.
3. Đồng bộ route profile/catalog để real không trộn với demo.
4. Xác minh approval mapping cho read-only trước; chỉ mở mutation khi owner/state/revision rõ.
5. Triển khai các API mới theo [Parent API gaps](PARENT_API_GAPS_2026-10-29.md), từng module một.

## Prompt giao việc cho lần triển khai

```text
Model: gpt-6-luna; reasoning effort: xhigh.
Đọc PARENT_API_INTEGRATION_PLAN_2026-10-29.md và PARENT_API_GAPS_2026-10-29.md.
Bắt đầu role Parent, thực hiện lần lượt các bước đủ contract; ghi blocker riêng cho bước chưa đủ.
Giữ các thay đổi đang có của người dùng; không commit/deploy tự động.
API đã có nối theo operation; API chưa có giữ demo có nhãn cả local và deploy.
Lỗi API thật không fallback mock; không gửi ID demo hoặc dữ liệu overlay lên server.
Giữ UUID gói tách code; chỉ nối subscription READ theo đúng ParentProfile.
Không dùng CRUD subscription để mô phỏng mua gói thật.
Sửa service, caller/route thực tế và test liên quan trong cùng bước.
Báo rõ fixture tests và live tests; không coi intercept pass là backend đã nghiệm thu.
```
