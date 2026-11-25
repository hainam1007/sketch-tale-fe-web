# Contract API — nguồn hiện hành

## Delta source Backend — 24/11/2026, `main` 3c1e02f

### Frontend hiện đang gọi gì — kiểm tra source 24/11

- `src/features/parent/services/parentProfileService.js`: list dùng `GET /parent-profiles/child?parentId=<user.id>`, không dùng `GET /child-profiles` mới scope theo JWT; detail/update dùng `GET/PUT /child-profiles/{id}`, PUT chỉ gửi nickname/age/reading level/daily caps và đọc lại detail. Mapper giữ hai collection mới qua spread nhưng không chuẩn hóa/hiển thị chúng.
- Không có caller hoặc route trong `src/lib/api/backendRoutes.js` cho `/child-profiles/{id}/allowed-themes` và `/story-recommends`; FE chưa thực hiện GET/PUT hai collection. Không diễn giải source BE mới là tính năng Parent/Mobile đã nối.
- `parentSubscriptionService.js` vẫn lấy `parentProfile.parentProfileId` rồi fallback `profileUserId`, chưa ưu tiên `parentProfile.id` của DTO mới. Chỉ `.env.development` bật subscription real; `.env.production` disabled. `ParentPlanPage` đọc `subscriptionPlanId`/`currentPlan` từ Auth profile.
- `parentPaymentService.js` gọi `POST /payments/create-checkout`; `ParentPaymentReturnPage.jsx` chỉ refresh auth profile, không kiểm tra order status. Webhook mới có thể làm read-back plan/credit thay đổi, nhưng FE chưa có bước xác minh giao dịch theo order.

FE audit là kiểm tra source, chưa chạy request runtime trong lượt này. Cần giữ riêng việc FE cần nối với blocker owner/auth BE ở bảng dưới.

Phần dưới mốc 18/11 là lịch sử/snapshot. Source local mới có 12 commit từ `de3209f`; Swagger snapshot 18/11 **không chứng minh** release hiện tại. Các thay đổi local trước pull được giữ; `StoryTemplateRepository.cs` dùng upstream và phiên bản local cũ nằm trong stash `codex-preserve-local-before-backend-pull-2026-11-24`.

| Nhóm | Contract xác nhận trong source mới | Giới hạn cần BE trả lời/xử lý |
| --- | --- | --- |
| Child profile GET | `GET /api/child-profiles` trả toàn bộ cho Admin, theo Parent JWT cho Parent, chính bé cho Child. Detail và 4 GET field lẻ dùng owner lookup | Chưa runtime A/B/Child; Parent list repository không include themes/recommends, cần xác minh nested DTO có đủ dữ liệu hay không |
| Allowed themes | `GET/PUT /api/child-profiles/{id}/allowed-themes`; GET `EducationThemeDto[]`, PUT `{ "themeIds": ["uuid"] }` | PUT xóa collection rồi thêm ID khác nhau; `null`/`[]` xóa hết; Guid rỗng 400, ID không tồn tại 404. GET/PUT không owner-check `{id}` dù có role gate Parent/Child/Admin; P0 IDOR |
| Story recommendations | `GET/PUT /api/child-profiles/{id}/story-recommends`; GET `StoryTemplateDto[]`, PUT `{ "storyTemplateIds": ["uuid"] }` | Cùng replace/clear và owner gap; chưa lọc story Active khi ghi/đọc; không suy ra enforcement lên catalog/Mobile |
| Daily limits | `POST /api/system-jobs/reset-daily-limits`, `X-Cron-Secret`, 200 `{message,updatedProfiles,executedAtUtc}`; reset remaining time/character về daily tương ứng | Chỉ job nội bộ, không gọi từ FE/Mobile; source không chứng minh lịch chạy, timezone hay reset atomic với usage |
| Expired subscription | `POST /api/system-jobs/check-expire-subscriptions`, cùng secret, 200 `{message,expiredSubscriptions,executedAtUtc}` | Service chọn Active có EndDate trước ngày UTC+7 và dự định trả Parent về FREEPLAN. `GetActiveSubscription()` dùng `AsNoTracking()`; service đổi `Status` nhưng không gọi repository `Update`, nên không thể coi trạng thái Expired đã lưu. Count chỉ tăng khi tìm thấy FREEPLAN |
| PayOS webhook | Thành công sau verify: transaction Success, subscription Active, ngày hiệu lực, hủy subscription Active cũ, cập nhật ParentProfile plan/credit, thêm credit log; transaction Success lặp trả true | Đây là sửa source so với 18/11, chưa runtime nghiệm thu. Chưa thấy kiểm tra amount/plan/owner của order trong nhánh webhook; parent/plan không tìm thấy vẫn có thể ghi transaction Success. Cần status Parent-owned và test callback lặp/cạnh tranh |

`ChildProfileDto` nay chứa `allowedThemes: EducationThemeDto[]` và `storyTemplateRecommends: StoryTemplateDto[]`; migration quan hệ đã được thêm. `PUT /api/child-profiles/{id}` Parent vẫn chỉ cho sửa nickname/age/reading level/daily caps, không nhận hai collection này. New GET/PUT collections cần owner gate riêng. Backend source chỉ đọc trong lượt tài liệu.

## Snapshot lịch sử — 18/11/2026

**Ghi nhận cuối lượt:** sau lần rà ban đầu, BE có thêm 2 file unstaged ngoài 24 file staged: `StoryManagementDtos.cs` và `CharacterSlotTemplateService.cs`. Đây là thay đổi từ ngoài lượt cập nhật docs, không do agent sửa. CreateStoryPageTemplateDto thêm DisplayFormat(ConvertEmptyStringToNull=false), BackgroundUrl/CompositionJson thành string mặc định rỗng; update DTO không đổi. Slot service bỏ kiểm tra trùng role trên một page, cho phép nhiều slot cùng role; vẫn kiểm tra page/role cùng story. Chưa xác minh model binding, migration/test hoặc deploy; không đồng nhất các thay đổi local này với schema Swagger đã tải. Khi tích hợp phải định danh animation/extension bằng slot ID, không giả định mỗi role có một slot/page.

BE local HEAD `de3209f645aa4191dba394e15be2295cd38d3c6d` + 24 file staged có sẵn; FE HEAD `ef76104851bcfd7ea39941ed74d24d58b0a313b8` là baseline trước các delta VOC-18 bên dưới. Đợt ghi nhận Swagger 18/11 trước đó chỉ sửa docs; các kết quả runtime/intercept 14–17/11 vẫn là bằng chứng lịch sử, không chứng minh source mới đã deploy.

[Swagger tải 18/11](../../artifacts/swagger-docs-2026-11-18.json): **120 paths / 161 operations**. So với snapshot Admin 16/11: thêm 11 operations, bỏ 0, đổi định nghĩa 6 operations authoring; schema cũng thay đổi, không chỉ route. Không chứng minh local và deploy cùng commit. [Danh mục source + chênh lệch live](ENDPOINTS.md).

## PUB-01 — FE re-audit 18/11/2026

FE hiện gate publish bằng read mới từ server sau xác nhận; yêu cầu cover, ít nhất một page không Inactive, CompositionJson/references hợp lệ, không còn local-only changes, quiz hợp lệ và trạng thái entity có thể được cascade. Theo lựa chọn người dùng 18/11, FE cho phép story Draft/Active/Pending/Archived vì BE chuyển mọi status khác Inactive lên Active, nhưng chỉ khi tất cả child cần đọc là Draft/Active. Child Pending/Archived/unknown và story Inactive/unknown bị chặn trước POST, kèm resource/status để Content Manager xử lý; FE không PUT Active hàng loạt. Sau POST, FE đọc lại story/pages/roles/slots/quizzes; không coi message/count là bằng chứng. Không tự retry POST khi timeout, 5xx, accepted/read-back lỗi hoặc trạng thái con chưa Active. Count bằng 0 vẫn hợp lệ nếu read-back đủ.

BE local `StoryTemplateService.PublishStoryAsync` (source hiện có) chỉ chuyển Draft → Active cho pages/slots/roles/quizzes, nhưng với story thì chỉ từ chối Inactive rồi **đặt mọi trạng thái còn lại thành Active**, gồm Pending/Archived. `validPages` loại Inactive nhưng giữ Pending/Archived; các trạng thái đó không được chuyển Active. Theo lựa chọn người dùng, FE cho phép story Pending/Archived vào POST chỉ khi child cần đọc đều Draft/Active; child Pending/Archived/unknown vẫn bị chặn vì BE không cascade chúng. Read-back sau POST vẫn là điều kiện báo thành công.

Route đọc trang còn lệch: Swagger 18/11 có `GET /storypage-template/pages/{storyId}` (route FE Parent giữ theo snapshot); BE local `StoryPageTemplateController` có `GET /storypage-template/published/{storyId}` cho Parent/Child, `GET /pages/by-story/{storyId}` cho CM/Admin và `/all-pages/{storyId}` cho CM. FE không fallback sang authoring. Gọi Swagger live GET từ API host cấu hình `https://sketch-tale-be.onrender.com` đã timeout trong lượt này; snapshot local là contract mới nhất đọc được, không xác nhận deploy. Runtime publish/read-back không chạy.

BE source reader hierarchy cũng chưa đủ đồng nhất: `StoryRoleTemplateController.GetRolesByStory` không có `[Authorize]`, repository trả status khác Inactive; `CharacterSlotTemplateController.GetSlotsByPage` không có endpoint-level `[Authorize]`, repository trả status khác Inactive; quiz GET được xác thực JWT nhưng repository cũng trả status khác Inactive. Role/slot/page filters trong FE chỉ bảo vệ cách hiển thị, không chặn truy cập trực tiếp. Cần BE gate theo story/page Active và role/slot/quiz Active trên từng endpoint.

**Yêu cầu BE và tiêu chí đóng:** công bố source/version deploy và thống nhất method/path/role cho Parent/Child pages; ghi contract cùng policy đã chốt FE: story Pending/Archived có thể được publish khi child cần đọc Draft/Active; child Pending/Archived không cascade nên phải reject hoặc có xử lý server rõ, không trả Active nếu required content chưa Active. GET reader chỉ trả resource Active thuộc story Active, deep-link Draft/Pending/Archived bị 403/404. Test CM publish hai trang Draft cùng role/slot/quiz, read-back counts (kể cả 0), Parent/Child catalog/detail/reader sạch, Draft direct URL bị chặn, unpublish role đúng, cùng invalid/missing media/refs. Chốt riêng cách sửa published story; source chưa có immutable snapshot/version.

Kiểm tra FE 18/11: suite `content-integration.spec.js` 37/37 passed; lint exit 0 với 21 warnings repo; build thành công, còn cảnh báo chunk JS >500 kB. Đây là test/intercept/build, không phải runtime publish/read-back.

| Thay đổi | Contract xác nhận | Ảnh hưởng / phần còn mở |
| --- | --- | --- |
| Publish/unpublish | Local publish chuyển Draft → Active cho pages/slots/roles/quizzes; cần cover và ít nhất một page != Inactive. Story bị từ chối chỉ khi Inactive, sau đó source đặt Active kể cả story Pending/Archived. Unpublish trả story + con Active về Draft | FE cho phép story Pending/Archived nếu child cần đọc Draft/Active; child Pending/Archived/unknown bị chặn vì không cascade. Runtime/deploy chưa xác minh. `totalPages` đếm mọi page != Inactive. Không có immutable version |
| Publish response | storyTemplateId/title/status/message + totalPages/publishedPagesCount/publishedRolesCount/publishedSlotsCount/publishedQuizzesCount | Counts là số entity được chuyển từ Draft, không phải tổng Active. Unpublish dùng cùng DTO, counts không được gán nên mặc định 0 |
| CM upload | background-image đã nhận `content manager, ContentManager`; thêm POST `/upload/content-manager-image?folder=...`, GET `/upload/content-manager-images` | POST multipart file → `{success,imageUrl}`; GET array URL của CM theo JWT. Không phải asset registry có ID/delete/reference/metadata/audio |
| Remove background | POST `/upload/remove-background?folder=...&saveToContentManager=false`, multipart file; JWT, trả `{success,imageUrl}` hoặc 502 nếu dịch vụ không xử lý | jpg/jpeg/png/webp; action không có kiểm tra 10 MiB như upload thường. Cần rõ role/quota/size/folder policy và gallery save khi CM profile chưa tồn tại |
| URL reuse | Create/update story thêm CoverImageUrl; page thêm BackgroundUrl; quiz thêm QuestionPicUrl. Role vẫn có DefaultAssetUrl | File ưu tiên hơn URL. Update giữ URL cũ khi URL rỗng/omitted và không file. Page giữ narration cũ khi không audioFile; không suy CompositionJson được giữ tương tự |
| Vocabulary | POST/PUT body và GET DTO dùng `wordVi`, `meaning`, `audioUrl`; DTO gắn `storyPageTemplateId`. Create yêu cầu từ/nghĩa; create và đổi từ ở update kiểm tra RawText theo FormC + case-insensitive `Contains` | FE đã map/gửi `wordVi`, giữ `word` trong model UI; Parent reader cũng đọc `wordVi`. DTO `AudioUrl` chưa được map tường minh tới entity `AudioUrlVi`; người dùng xác nhận BE sẽ bổ sung mapping, chưa runtime-verified |
| Profile IDs | ParentProfileDto/ChildProfileDto kế thừa BaseFieldDto, trả **id**, bỏ field riêng parentProfileId/childProfileId cho định danh chính | Child vẫn có parentProfileId quan hệ. Không còn yêu cầu BE map ParentProfileDto.ParentProfileId cũ. FE child mapper nhận id; subscription vẫn tìm field cũ rồi fallback User.Id, cần ưu tiên profile.id |
| Generated stories | POST `/generated-stories/generate` `{storyTemplateId,childProfileId?}`; GET `/{id}`; GET `/child-profiles/{childProfileId}`; role Parent/Child | Service/repository **chưa owner gate**. Generate chỉ loại template Inactive, vẫn nhận Draft/Pending/Archived. Không nối như library an toàn; không có favorite/hide mutation hoặc snapshot từ ba API này |
| Allowed themes — snapshot 18/11 | GET/PUT `/child-profiles/{id}/allowed-themes`; PUT `{themeIds: UUID[] hoặc null}` | Đã có trong source 24/11; xem delta trên. Chưa owner-check và chưa runtime xác minh |
| Story recommendations — snapshot 18/11 | GET/PUT `/child-profiles/{id}/story-recommends`; PUT `{storyTemplateIds: UUID[] hoặc null}` | Đã có trong source 24/11; xem delta trên. Chưa owner-check và chưa runtime xác minh |

### Vấn đề cần báo Backend/người dùng

1. **SEC-GEN-18:** GeneratedStoryService.Get/Generate không đối chiếu JWT với ChildProfile/Parent; repository chỉ lọc ID. Cần owner gate cả ba operations, template Active và policy mapping trước tích hợp.
2. **VOC-18 / audio:** `VocabularyTemplateService.UpdateVocabAsync` gán `dto.AudioUrl` vào `vocab.AudioUrlVi` (dòng 134–136), nhưng `MappingProfile` chỉ khai báo `CreateMap` mặc định DTO↔entity (dòng 130–132). Tên khác nhau nên create/read không map `AudioUrl`↔`AudioUrlVi`; create trả DTO từ entity và GET cũng map entity sang DTO. Người dùng xác nhận BE sẽ bổ sung mapping tường minh. Chưa xác minh bản sửa hoặc runtime; FE giữ audio URL, và chặn trạng thái lưu thành công nếu read-back không khớp.
3. **RELEASE-18 (đã cập nhật 24/11):** themes/recommends nay có trong source local; reader snapshot vẫn `/pages/{storyId}` trong khi source `/published/{storyId}`. Cần commit/branch thực tế deploy, response mẫu và owner tests.
4. **LOCAL-18 (đã cập nhật 24/11):** source mới có `ParentProfile.UserId`; báo cáo thiếu field 18/11 đã hết hiệu lực. Vẫn cần BE build và A/B owner test.
5. **PUB-01 / DOC-API-01:** xem re-audit 18/11 phía trên. `StoryTemplateService.PublishStoryAsync` đặt story Pending/Archived Active; child Pending/Archived không cascade; `StoryPageTemplateController` local Parent route `/published/{storyId}` khác Swagger `/pages/{storyId}`; role/slot repositories không gate Active hierarchy. BE cần công bố đúng policy/trạng thái, thống nhất route/deploy và bảo vệ direct reads. FE hide hiện DELETE (Inactive), không tự thay bằng unpublish (Draft) vì khác nghiệp vụ.
6. **SEC-01/SEC-ADM/PAY-01:** controllers/services credit/subscription/ParentProfile/payment cancel, audit/reports và webhook không đổi trong diff 7849600→de3209f; các blocker trước vẫn mở. Không tuyên bố đã sửa chỉ vì pull mới.

Reading/quiz source hiện đã có controller mới: Child viết POST `/child-quiz-answers`, POST `/reading-logs`, PUT `/{id}/progress`, PUT `/{id}/complete`; Parent/Child đọc quiz history và GET `/reading-logs/child-profiles/{id}/completed`. Start nhận generatedStoryId; progress nhận currentPage/readDurationSeconds, **seconds là lượng cộng thêm**, retry có thể cộng lặp. Detail quiz còn thiếu Parent owner check, submit còn fallback khi không map được Child JWT và thiếu kiểm tra quiz thuộc story/upper bound option. ReadingLogService chỉ chặn owner mutation khi currentChild tìm thấy; cần fail closed khi thiếu profile. Runtime 403 cũ chưa được tái kiểm tra, không tự bật quiz/scoring.

Character list theo bé và PUT name đã có từ baseline 16/11; controller thiếu Authorize, service chỉ kiểm tra owner nếu parse được user ID. Không có JWT thì nhánh kiểm tra bị bỏ qua. Accept/cancel-preview cũng còn thiếu gate. Đây là SEC-02, không dùng các API này để lấp library trước khi BE bảo vệ.

## Baseline 16/11 và contract kế thừa

Phần này giữ chứng cứ cũ; thay đổi 18/11 ở trên được ưu tiên.

Cập nhật 16/11/2026. BE local HEAD `7849600` + staged modifications; FE HEAD `59d1efb` + working tree. [Snapshot Swagger baseline 14/11](../../artifacts/swagger-parent-2026-11-14.json) có 109 paths/148 operations; ngày 16/11 đã xác minh route Parent child collection trên Swagger live. Không đồng nhất deploy với local. [Ma trận Parent + bằng chứng](../roles/PARENT.md) tách source/intercept/runtime.

Delta deploy: bỏ ba quiz routes cũ dưới `/reading-logs`; thêm POST `/child-quiz-answers`, GET `/child-quiz-answers/reading-logs/{readingLogId}`, GET `/child-quiz-answers/child-profiles/{childProfileId}`; thêm POST `/reading-logs`, PUT `/{id}/progress`, PUT `/{id}/complete`, GET `/reading-logs/child-profiles/{childProfileId}/completed`. FE quiz history đã đổi caller, production disabled vì **GET mới trả 403 với bé thuộc Parent mẫu**. Source local mới đã có các controller này nhưng chưa xác nhận trùng deploy; không nối reading-log mutation bằng Parent hoặc token Child thay thế.

## Cách tra

Prefix runtime `/api`; service FE dùng path không prefix vì base URL đã có. [ENDPOINTS](ENDPOINTS.md) liệt kê method/path/action/quyền khai báo trong controller local. DTO/service/repository quyết định schema, owner/filter và lifecycle. Swagger mô tả 200 không có schema thì đọc DTO/mapping; không tự bịa envelope `{items,total}`.

Quyền ở attribute là một lớp kiểm tra, không phải đầy đủ policy. Kiểm tra cả service/repository và middleware. Các route không có attribute cần rà server policy; không dùng allowlist FE để kết luận an toàn.

## Sai khác cần xử lý trước luồng reader

Audit CM 14–15/11: Swagger live GET vẫn `/storypage-template/pages/{storyId}`. Truyện test “Tôn giáo” Active nhưng response Parent chứa 3 trang Draft, chưa có CompositionJson; reader FE giữ filter Active nên không có trang đọc. Người dùng đang cung cấp lifecycle BE; chưa tự chuyển trang Active hoặc nới filter. Bằng chứng và ma trận action: [Content Manager](../roles/CONTENT_MANAGER.md#runtime-và-yêu-cầu-backend). Đã bỏ tùy chọn upload ảnh phụ qua avatar trong FE; không dùng endpoint đó để né quyền CM.

| Hạng mục | FE / snapshot 12/11 | BE local 13/11 | Kết luận |
| --- | --- | --- | --- |
| Page list reader | FE/Swagger 14/11 `/storypage-template/pages/{storyId}`, runtime Parent 200 | Local `/published/{storyId}` cho Parent/Child, `/pages/by-story/{storyId}` cho CM/Admin | Giữ route Swagger theo người dùng; không fallback authoring; BE cần đồng bộ release |
| Page detail | `/storypage-template/page/{id}` | `/page/{pageId:guid}`, CM/Admin | ID param khác tên không đổi URL; Parent không dùng token CM để đọc |
| Mapping inbox | Không có trong snapshot; allowlist FE còn route local | `/user-story-character-mappings/child/{childProfileId}` có owner/pagination local | Local-only so với snapshot; Character adapter hiện không dùng |
| Plan code lookup | Allowlist `/subscription-plans/code/:plan-code` | Controller `/subscription-plans/plan-code/{code}` | Sửa khi dùng lookup; list catalog hiện đã có ID |
| Composition | Snapshot có nullable string; FE v1 đã wired | DTO + entity + migration + mapping có CompositionJson | Không còn ghi “BE checkout không có field”; runtime round-trip vẫn pending |

## Story/page authoring: request và response

Source BE `sketch_tale.Application/DTOs/StoryManagementDtos.cs`; controller/service cùng tên resource. Multipart không tự đặt Content-Type boundary bằng tay.

| Operation | Request contract local | Response / lưu ý |
| --- | --- | --- |
| POST `/story-template` | multipart EducationThemeId, Title, Description?, CoverImageUrl?, file? | Create DTO **không AgeGroup**, không audit fields; create + update age là hai mutation |
| PUT `/story-template/{id}` | multipart EducationThemeId, Title, Description?, CoverImageUrl?, AgeGroup, Status, file? | Map DTO vào entity; không mặc định partial PATCH |
| POST `/storypage-template/{storyId}/page` | multipart RawText, BackgroundUrl?, CompositionJson?, file?, audioFile? | Page DTO; server gán ID/pageNumber, Draft |
| PUT `/storypage-template/{id}` | multipart RawText, BackgroundUrl?, CompositionJson?, Status, file?, audioFile? | `{message}`; FE GET detail để xác nhận |
| PUT `/storypage-template/{storyId}/reorder-pages` | JSON `{orderedPageIds:[UUID,...]}` | Không trùng, đủ danh sách từ GetPagesByStoryIdAsync; sai → 400 |
| DELETE `/storypage-template/story-pages/{id}` | Không body | 204; **soft delete Inactive**, giảm tổng và đánh lại số trang sau |
| POST `/story-template/{id}/publish` | Không tự thêm version payload | PublishStoryResultDto; source mới cascade Draft → Active; xem mục 18/11 |

Page DTO gồm inherited BaseFieldDto + storyTemplateId/pageNumber/rawText/backgroundUrl/audioNarrationUrl/compositionJson/status. Create/update controller nhận alias imageFile cho file và audio cho audioFile; ưu tiên field chuẩn file/audioFile.

`UpdatePageAsync` gọi `_mapper.Map(dto,page)`; MappingProfile chỉ CreateMap mặc định cho page. **Không có logic preserve-if-omitted rõ ràng cho CompositionJson**. FE phải giữ raw composition khi chỉ đổi text/status, xác minh omitted/null/empty bằng test BE; không giả định bỏ field luôn giữ dữ liệu. BE chưa validate schema v1 hay limit 1 MB: đó là giới hạn FE.

`GetPagesByStoryIdAsync` lọc **Status != Inactive**, gồm Draft/Pending/Active/Archived, dù comment service nói chỉ Active. `GetPublishedPagesByStoryAsync` kiểm tra story Active và lọc pages Active. Reorder dùng tập != Inactive, vì vậy Archived có ảnh hưởng; FE gửi orderedPageIds đầy đủ kể cả Archived theo ma trận CM 14–15/11; cần kiểm thử cùng tập server.

PublishStoryAsync mới cascade Draft → Active cho page/role/slot/quiz; không tạo snapshot/version. Không PUT hàng loạt để thay publish. Xem điều kiện/counts/unpublish tại mục 18/11.

## VOC-18 — Vocabulary API contract và FE delta (18/11/2026)

- Swagger 18/11 và DTO local xác nhận POST `/story-pages/{pageId}/vocabularies` nhận `{wordVi,meaning,audioUrl}`; PUT `/story-vocabulary/{id}` nhận cùng ba field; GET theo page trả array DTO gồm `id`, `storyPageTemplateId`, `wordVi`, `meaning`, `audioUrl`. Prefix runtime là `/api`. Create trả DTO; update trả `{message}` nên FE refetches editor data.
- `VocabularyTemplateService.CreateVocabAsync`: từ và nghĩa bắt buộc; page `RawText` phải không rỗng; `Trim` rồi Unicode FormC; kiểm tra substring `Contains(..., OrdinalIgnoreCase)`; trùng từ cùng page bị từ chối. Không bỏ dấu và không yêu cầu whole-word match.
- `UpdateVocabAsync`: kiểm tra RawText/duplicate chỉ khi `WordVi` khác rỗng và khác từ hiện tại theo `OrdinalIgnoreCase`; cùng quy tắc FormC + `Contains`. Blank `WordVi`/`Meaning` không xóa field mà giữ nguyên; audio `null` giữ nguyên, còn chuỗi rỗng được gán. FE form yêu cầu từ/nghĩa, giữ liên kết page và không đổi hành vi này thành auto-save.
- FE đọc RawText qua GET page trực tiếp từ server trước create/đổi từ; không lấy `page.text` đang có thể chứa draft local. UI yêu cầu lưu trang trước, không tự lưu. API vẫn kiểm tra cuối cùng; lỗi validation hiển thị ở field từ/nghĩa và giữ nguyên form.
- API boundary ưu tiên `wordVi`; chỉ fallback `word` nếu response không có field mới. Theo schema Swagger nullable, `wordVi: null`/`meaning: null` hiển thị thành chuỗi rỗng nhưng không fallback; giá trị sai kiểu như number/object bị từ chối. Domain/UI và fixture demo tiếp tục dùng `word`; không gửi field đó lên API thật. POST/PUT được kiểm tra bằng GET read-back theo ID, từ, nghĩa, audioUrl và page. Nếu GET lỗi hoặc sai giá trị sau mutation thì FE giữ form, đánh dấu mutation đã nhận và không gửi POST lại.
- **Audio còn phụ thuộc BE:** MappingProfile local chưa có `ForMember(AudioUrl, AudioUrlVi)` cho create/read. Dù update service gán `AudioUrlVi`, response mapping GET vẫn không map tên khác. Người dùng đã xác nhận BE sẽ bổ sung mapping; tới khi source/release và read-back xác minh, không coi audio đã hoạt động.
- Chưa có kiểm chứng runtime thật hoặc mutation dữ liệu BE. Bằng chứng lượt này là source và FE intercept tests; xem test results VOC-18 ở [CONTENT_MANAGER](../roles/CONTENT_MANAGER.md).

## Role, slot, quiz, vocabulary, media

- Role DTO: storyRoleType, roleName, description, allowCustomCharacter, requiresParentApproval, defaultAssetUrl; update thêm status. Create/update multipart + file. GET roles là route khác all-roles (CM). `GET /role/{id}` hiện action tham số `roleId` không khai báo `[FromRoute(Name="id")]`: cần sửa/test binding, không khẳng định detail đọc đúng ID.
- Slot JSON: create storyRoleTemplateId, posX, posY, scale, flipHorizontal; update posX/posY/scale/flip/status. DTO không có rotation/layer/asset riêng; các field đó thuộc [Composition v1](COMPOSITION_V1.md). X/Y quy ước % 0–100 của FE; kiểm tra validation BE trước coi server enforce.
- Quiz: questionText, options[], correctOptionIndex; update thêm status; media theo controller. GET `/story-template/{storyId}/quizzes` dành đọc dưới JWT; `/all-quizzes` chỉ CM. Không yêu cầu Parent gọi all-quizzes. DTO có correctOptionIndex: ẩn đáp án trên UI không phải bảo mật scoring.
- Vocabulary mới: wordVi, meaning, audioUrl, liên kết page; FE real API đã map/gửi `wordVi`, còn model UI/demo giữ `word`. Compatibility fallback và RawText validation được giới hạn tại API boundary; audio read-back đang chờ mapping BE. API authoring không đồng nghĩa learning progress.
- Upload background-image: multipart file, role **`content manager, ContentManager`** ở source 18/11; .jpg/.jpeg/.png/.webp/.gif, tối đa 10 MiB theo controller; trả `{success,imageUrl}`. Upload avatar yêu cầu JWT. Không chuyển sang avatar khi background trả 403 để né quyền.
- Page audioFile là một narration; chưa endpoint upload nhiều audio độc lập/kho asset với ownership/reference lifecycle. JSON manifest không lưu bytes cloud thay cho upload.

## Parent, thanh toán và authorization

Contract Character chi tiết ở [Parent](../roles/PARENT.md), Auth ở [Auth](AUTH.md).

- Daily caps nullable: `ChildProfileService.ApplyUpdateAsync` chỉ ghi khi HasValue; null/omitted giữ nguyên, không xóa giới hạn. FE sửa mô tả và chỉ gửi nickname khi đổi tên nhanh. PUT accepted/GET fail có GET-only recovery. Runtime chỉ GET own child, chưa mutation/A-B.
- Reader giữ CompositionJson, hydrate codec chung và gọi GET roles/slots theo Swagger. Role/slot repositories local lọc `!= Inactive`, controller GET không auth và không kiểm tra trạng thái truyện cha: BE cần published hierarchy gate. FE filter Active không thay bảo mật server. Runtime Parent đọc role/slot của truyện Active; chưa chứng minh draft bị chặn.
- Quiz local `GetQuizAnswersByReadingLogIdAsync` thiếu owner check Parent; collection có check nhưng dựa ParentProfileId == JWT UserId. Submit fallback DTO khi không tìm được Child JWT, chưa check quiz thuộc generated story và upper bound options. Đây là local; deploy quiz controller đã đổi, cần source release đối chiếu 403.

- ChildProfileController/Repository local có staged attempt thêm scope Parent/Child; repo hiện tham chiếu `ParentProfile.UserId` dù entity chỉ có `ParentProfile.Id` liên kết User, nên chưa build-verified và không được coi là owner gate hoàn chỉnh. Parent update trong staged service chỉ nickname/targetAgeGroup/readingLevel/daily caps, không ghi remaining counters.
- CreditTransactionLogController, SubscriptionController, ParentProfileController không khai báo Authorize; các service đã đọc không có owner gate tương ứng. SEC-01: sửa quyền server, không đọc list rồi lọc client. Theo yêu cầu người dùng, FE chỉ bật subscription GET trong `.env.development`, ưu tiên ParentProfileId từ `/auth/profile`; nếu field thiếu/Guid.Empty thì dùng User.Id sau khi xác minh `/auth/profile`, vì entity/repository local xác nhận `ParentProfile.Id == User.Id`. DTO 18/11 đã chuyển định danh sang `id`; yêu cầu mapping field ParentProfileId cũ đã hết hiệu lực. FE cần đọc profile.id; auth/owner scope vẫn mở. FE từ chối response sai owner/session nhưng đây không phải kiểm soát bảo mật. Production vẫn disabled.
- Parent child collection theo Swagger live là `GET /parent-profiles/child?parentId={uuid}`; response source là `ChildProfileDto[]`. FE source đã chuyển caller sang route này, lấy ID từ `/auth/profile`, và đổi query key để bỏ cache của route sai. Runtime GET trước sửa xác nhận Parent mẫu nhận `kietlac` qua `GET /child-profiles`, còn route đúng trả danh sách riêng; UI sau sửa chưa runtime recheck. BE source collection đúng vẫn chỉ lọc query `parentId`, không ràng buộc ID đó với JWT; yêu cầu BE role/owner gate vẫn mở. Swagger global Bearer không chứng minh action đã kiểm tra ownership.
- POST payments/create-checkout: Parent JWT, CreatePaymentDto, response `{checkoutUrl}`. FE return giữ trạng thái chờ và GET `/auth/profile` để làm mới profile; return URL không chứng minh payment thành công. GET status theo order chưa expose trong PaymentController, dù service có GetByOrderCodeAsync. FE không được tự gọi method service như URL đã có.
- PATCH payments/cancel-paymentlink: Authorize nhưng service chỉ tra orderCode, không kiểm tra Parent. Body `{orderCode,code}`; Pending + code==0 → Failed, xóa subscription. Chưa thấy gọi hủy PayOS trong method này. Giữ orderCode int64 dạng chuỗi nội bộ; chỉ serialize số khi an toàn theo contract.
- POST payments/webhook là BE/PayOS; FE không gọi. Source local `PayOsService.ProcessWebhookAsync` xác minh PayOS rồi set PaymentTransaction Success và Subscription Active, nhưng không cập nhật `ParentProfile.SubscriptionPlanId`; `SubscriptionService.UpdateSubscriptionForSuccessPayment` có logic cập nhật plan nhưng không được gọi từ webhook. Vì `ParentPlanPage` hiển thị plan từ auth profile và Subscription API đang disabled, Parent vẫn có thể thấy Free sau payment. Cần cập nhật nguyên tử/idempotent entitlement ở webhook và GET status Parent-owned; return URL không chứng minh đã trả tiền. Bản deploy và callback lần giao dịch trong ảnh chưa được xác minh.
- Character accept/cancel-preview không có Authorize action/controller; service so sánh child ID do client truyền. SEC-02 cần JWT/owner enforcement, đặc biệt hoàn quota.

## Enum và yêu cầu mở

Source `sketch_tale.Domain/Enums/DomainEnums.cs`: CommonStatus 0 Draft/1 Pending/2 Active/3 Inactive/4 Archived; CharacterStatus 0 Preview/1 Pending/2 Approved/3 Rejected/4 Hidden; ParentApprovalStatus 0 NotRequired/1 Pending/2 Approved/3 Rejected. TargetAgeGroup 0 Ag6to7/1 Age8to10/2 Age11to12; ReadingLevel 0 Beginner/1 Intermediate/2 Advanced. DTO ChildProfile dùng một số giá trị **string**, không gửi enum số đồng loạt.

Đề xuất capability không phải endpoint hiện có: entitlement/usage, revision/reject reason/sensitive permission, library/progress đầy đủ/export/report (allowed themes/recommendations và generated-stories đã có endpoint nhưng còn thiếu xác minh/quyền), Admin aggregates, registry/media và published versions. Mỗi gap có ưu tiên/điều kiện ở [BACKLOG](../BACKLOG.md); không thêm route phỏng đoán vào allowlist.

## Delta Admin 16/11/2026

[Swagger](../../artifacts/swagger-admin-2026-11-16.json) 111 paths; BE đọc tại `7849600` + staged changes. User GET envelope data được HTTP boundary unwrap, field khóa là `isLockedOut`, không phoneNumber; PUT null giữ nguyên, FE gửi changed-only không role. CharType DTO là nameEn/nameVi/category/canFly/canSwim/imageUrl/status. Plan Code do BE sinh, không field create/update. Report PATCH giữ reason gốc, không note/target effect. Audit chỉ có endpoint list theo user/entity/target; chưa có query ngày hoặc paging nên FE không gọi list all, ngày chỉ lọc trong scope đã tải. Actor Guid.Empty không chứng minh System; timestamp Z không tự đổi timezone. Runtime anonymous GET audit/reports/ParentProfile 200. [Chi tiết source, action matrix, tiêu chí BE](../roles/ADMIN.md).
