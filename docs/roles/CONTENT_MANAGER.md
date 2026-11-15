# Content Manager — soạn và phát hành truyện

Audit tiếp tục 15/11/2026. Chỉ sửa FE/tests/docs; giữ working tree có sẵn, BE chỉ đọc. Đã có caller cho story/theme/page/role/slot/vocabulary/quiz, reorder, upload media và publish. Codec CompositionJson v1, hydrate editor, save replace/preserve và read-after-write có trong working tree. Không còn chờ BE thiết kế JSON và không yêu cầu API animation riêng. **Chưa nghiệm thu end-to-end runtime.**

## Nguồn chuẩn

- [Contract API](../api/CONTRACTS.md): DTO, method/path, semantics và khác biệt local/live.
- [Composition v1](../api/COMPOSITION_V1.md) + fixture: format FE sở hữu, chưa xác nhận Mobile render.
- [WEB01–WEB09](../plans/WEB_READER.md): kế hoạch chưa hoàn tất để đọc đúng trên trình duyệt sạch.
- [UI Content](../specs/CONTENT_MANAGER_UI_UX.md), [UI editor](../specs/STORY_EDITOR_UI_UX.md), [animation](../specs/STORY_EDITOR_ANIMATION.md): tiêu chí tham chiếu, không phải trạng thái API.

## Ranh giới đã có và chưa có

| Phần | Đã có trong source | Giới hạn |
| --- | --- | --- |
| Page composition | nullable string create/update/read, FE codec v1 | Chưa nghiệm thu round-trip runtime, null/omitted, unknown fields và race saves |
| Ảnh nền + narration | page multipart `file`/`audioFile` | Một narration; nhiều audio local không thành upload cloud |
| Ảnh phụ | Upload service + asset manifest | UploadController background-image chỉ nhận claim `content manager`; kiểm tra mismatch với ContentManager |
| Slot | DTO X/Y/scale/flip/status, JSON extension rotation/layer/asset | Native slot ID phải thật; extension không phải cột BE |
| Quiz/vocab | CRUD hiện hữu | Quiz page/feedback trong JSON không đồng nghĩa scoring BE đọc extension |
| Save | Preflight, PUT, GET so sánh | Không có atomic revision/ETag; lưu một form không được xóa dirty form khác |
| Publish | POST story publish | BE source chỉ đặt story Active; không tạo version, không tự activate trang |
| Reader Parent | Catalog, composition/default roles/slots và renderer chung đã nối | Live trả trang Draft; FE reader chỉ nhận Active, chờ lifecycle BE |
| Asset registry/analytics | Local/demo | Chưa contract server tương đương; không dùng Character API như kho tư liệu CM |

Giữ raw JSON lỗi/version cao, chặn overwrite; không báo cloud-saved với blob/data/local-only. MVP dùng một narration và template characters. Migration phải backup và resume được; không xóa hàng loạt localStorage/IndexedDB. Chưa coi sửa template đã publish là sửa draft độc lập.

## Điểm chạm code

`src/features/content/services/{storyComposition,contentService,assetService,localAssetStore,contentMockOverlay,localStoryDemo}.js`; `pages/StoryPagesPage.jsx`, `StoryPreviewPage.jsx`; `components/StoryPageRenderer.jsx`, `StoryAnimationEditor.jsx`; `utils/storyAnimation.js`, `storyAudio.js`; Parent `parentCatalogService.js` và `ParentStoryReaderPage.jsx`.

BE: StoryManagementDtos, StoryPageTemplateController/Service/Repository, StoryTemplateService.PublishStoryAsync, MappingProfile, UploadController, StoryRoleTemplateController, CharacterSlotTemplateController, StoryQuizTemplateController. Ưu tiên WEB01–06 và DOC-API-01/02 trong [backlog](../BACKLOG.md).

## Ma trận action sau audit 14–15/11

Prefix `/api` do HTTP client thêm. CM = role ContentManager/content manager; R = Parent/Child theo contract đọc; quyền này phải do BE enforce. `wired` không đồng nghĩa đã nghiệm thu; `intercept` không chứng minh DB/auth. Service chính dưới đây là `contentService`; URL chính xác của từng biến thể nằm trong [ENDPOINTS](../api/ENDPOINTS.md).

| UI/action → caller | Method/path | Payload → response | Quyền | Nguồn | Trạng thái / thiếu sót | Ưu tiên / tiêu chí nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- |
| Kho truyện → listStories | GET `/story-template/all-stories` | filter FE → StoryTemplate DTO[] | CM | server | wired; runtime CM 200 | P0: đúng catalog, không fallback mock khi lỗi |
| Chủ đề → listCategories | GET `/education-themes` | none → theme[] | controller không attribute | server | wired; không tạo endpoint mới | P1: ID gửi khớp theme thật |
| Tạo truyện → createStory | POST `/story-template`, PUT `/{id}` nếu cần tuổi | multipart title/theme/description/file; update thêm age/status → DTO + read-back | CM | server | wired; create-age là 2 bước, có accepted recovery | P0: lỗi bước 2 không POST tạo lại |
| Metadata/cover → updateStory / StoryForm | PUT `/story-template/{id}` | multipart metadata/file → read-back | CM | server; chọn cover chuyển thành bytes | wired; khóa form đang pending để response không xóa edits mới | P0: tên/tuổi/cover đọc lại đúng, upload thật còn pending |
| Thêm trang → addPage | POST `/storypage-template/{storyId}/page` | RawText/CompositionJson/file/audioFile → page DTO | CM | server | wired; trang mới Draft; không auto retry POST | P0: tạo 1 ID duy nhất; chưa runtime mutation |
| Text/bố cục → updatePage | GET `/page/{id}`, PUT `/storypage-template/{id}`, GET detail | multipart RawText/Status/CompositionJson → semantic read-back | CM | server | intercept: preserve, conflict, wrong-story, accepted/unknown failure | P0: null/empty/omitted BE runtime còn cần test; preflight không atomic |
| Xóa/reorder → deletePage/reorderPages | DELETE `/storypage-template/story-pages/{id}`; PUT `/{storyId}/reorder-pages` | orderedPageIds đầy đủ kể cả Archived → read-back | CM | server | wired; chặn page còn quiz, dọn selection/undo; lifecycle soft-delete | P0: thứ tự/references đúng sau reload; mutation runtime pending |
| Nền/narration → page upload | PUT `/storypage-template/{id}` | file/audioFile + giữ text/composition → URL | CM | server | queue chung, narration đọc baseline mới; một narration/page | P0: bytes durable/context sạch; chưa upload runtime |
| Vai/default asset → addRole/updateRole/deleteRole | POST `/story-template/{id}/role`; PUT/DELETE `/story-role/{id}` | multipart role fields/file/defaultAssetUrl → read-back | CM | server | wired; editor đọc all-roles thay route reader | P0: ownership/status/cascade runtime còn mở |
| Slot → addSlot/updateSlot/deleteSlot | POST `/story-pages/{pageId}/slot`; PUT/DELETE `/story-slots/{id}` | roleId + x/y/scale/flip/status → slot DTO/read-back | CM | server + page composition | tạo slot lưu extension rồi đọc lại; lỗi bước sau marked accepted, giữ recovery | P0: không POST lại khi partial failure; test intercept success/failure |
| Rotation/layer/anchor/override → page composition | PUT `/storypage-template/{id}` | slotExtensions + asset manifest → read-back | CM | server | giữ field extension cũ; manifest giữ override asset | P0: slot/page/role đúng story; không tuyên bố FE thay owner gate BE |
| Ảnh phụ → AssetPicker/uploadAsset | POST `/upload/background-image` | multipart file → imageUrl; manifest vào page | chỉ `content manager` local | server bytes + index local | đã bỏ tùy chọn `/upload/avatar`; 403 không bypass; upload pending chặn publish | P0: CM alias upload được; upload lỗi không báo cloud saved |
| Subtitle/animation/timeline/audio refs → codec | PUT page CompositionJson | v1 → raw JSON/hydrated renderer | CM ghi; R đọc | server nếu URL durable; audio thêm vẫn local | codec sửa missing background/native first upload/unknown rows/slot assets; target orphan bị chặn | P0: reload/layout/seek đúng; Mobile chưa nghiệm thu |
| Vocabulary → CRUD | GET/POST `/story-pages/{id}/vocabularies`; PUT/DELETE `/story-vocabulary/{id}` | word/meaning/audioUrl → read-back | CM ghi; GET không attribute local | server | wired; edit không giả chuyển page khi DTO thiếu field; reader đã hiển thị theo trang | P1: runtime UI chờ trang Active |
| Quiz → CRUD + page extension | POST `/story-template/{id}/quizz`; PUT `/story-quiz/{id}/with-image`; DELETE `/story-quiz/{id}` | question/options/correctIndex/media; page/feedback trong JSON | CM ghi; JWT đọc | server | wired; partial extension errors accepted; FE hiện yêu cầu chọn trang | P1: quiz move/delete partial recovery cần thêm test; feedback cuối truyện chưa có nơi lưu |
| Lưu/autosave/navigation → hook/service queue | các mutation phía trên | snapshot → verified server state | CM | server + recovery v2 local | intercept: late edit giữ dirty/reload; per-story queue ngoài React Query; pending form khóa input | P0: không atomic đa tab; recovery conflict giữ nguyên, chưa tự merge |
| Saved preview → previewStory | GET story/all-pages/all-roles/slots/all-quizzes/vocab | read model không overlay | CM | server | wired; renderer chung với Parent; chưa hợp nhất toàn bộ playback/read-model | P0: lỗi không dựng từ mock; runtime v1 chưa có dữ liệu |
| Validate/publish → validateStory/publishStory | GET dữ liệu rồi POST `/story-template/{id}/publish` | không version payload → status + read-back | CM | server | validation lỗi không còn báo success; kiểm tra lại dirty sau confirm | P0: chờ quy trình BE; không tự activate hoặc khóa sửa published theo suy đoán |
| Hide → hideStory | DELETE `/story-template/{id}` | none → read-back | CM | server | wired; marked accepted/unknown nếu refresh lỗi | P0: read-back 404 sau hide vẫn cần reconcile catalog; chưa runtime |
| Catalog/reader → parentCatalogService.get | GET stories, `/storypage-template/pages/{id}`, roles/slots | DTO + CompositionJson → shared renderer | R | server, không overlay | intercept context sạch 2 trang; live Draft bị FE lọc | P0: BE thống nhất lifecycle, Parent/Child đọc đủ sau publish |
| Assets/statistics → listAssets/getStatistics | GET all-stories/pages/roles | derive inventory/counts | CM | server inventory + local uploads; analytics unavailable | không có registry/delete-cloud/usage analytics tương đương; không dùng Character API | P1: giữ nhãn local/unavailable, không số mock trong real |

## Thay đổi và kiểm chứng đợt này

- Service queue tuần tự theo user/story bao gồm preflight/write/read-back; không phải transaction/ETag giữa nhiều client. Upload narration và slot-extension writes dùng cùng luồng mutation.
- Recovery v2 lưu snapshot + baseline; restore khi khớp, backup trước thay/xóa, conflict không tự áp dụng. Recovery v1 sai revision hoặc malformed được giữ; bản sạch được backup trước dọn. Chưa có migration hoàn chỉnh local media/mock-slot → cloud với checkpoint/resume; không xóa asset bytes.
- Metadata/role/quiz/vocabulary khóa inputs khi pending; pages vẫn cho sửa trong lúc lưu và chỉ clear snapshot đã gửi. Upload picker giữ callback của trang khởi tạo, pending tham gia dirty state.
- Codec xử lý background thiếu/null thành validation error, giữ native mode khi upload nền đầu, giữ unknown fields theo ID và asset override slot; xóa row không hồi sinh từ JSON cũ.
- Test mới: `tests/content-integration.spec.js`, chạy `npx playwright test --config playwright.content-integration.config.js`. 14 ca đã qua vòng cuối, gồm slot extension success/partial failure và target ảnh phụ. Bao gồm context sạch đăng nhập Parent qua auth adapter, không seed local storage. Fixture dùng trang Active sẵn; **không mô phỏng publish tự activate pages**.
- Build qua; lint exit 0 còn warnings. Cả 3 test hồi quy editor đã qua; test cover cũ tìm nút “Hủy” trong khi UI đã đổi “Sang dựng truyện”, đã sửa locator.
- Thêm 2 test reader activities đã qua riêng: vocab/quiz đúng trang và cuối truyện, chưa hiện feedback trước chọn, không ghi log; từ chối quiz sai story. Tổng 16 ca trong suite CM, đã chạy theo hai vòng 14 + 2.
- Hồi quy Parent: 2 test `reader hydrates` / `reader rejects` trong `parent-audit.spec.js` qua; build/lint đã chạy lại sau khi thêm activities. Lint exit 0 có warnings; build có cảnh báo chunk lớn. Chưa chạy toàn bộ mọi suite của repository.

## Runtime và yêu cầu Backend

Người dùng chỉ định tài khoản trong PROJECT_SUMMARY và truyện **Tôn giáo**, không có Child test. Đã login/read/logout CM và Parent; chưa mutation nội dung/publish/hide/delete/upload. [Bằng chứng API](../../artifacts/content-runtime-2026-11-14.json) không chứa token/credential. Đây là dữ liệu đọc 14/11; báo cáo tiếp tục 15/11.

1. **PUB-01 / DOC-API-01 — blocker đọc thật:** story `ad1371f3-8ef3-42ff-8b3a-46b462807937` Active; CM all-pages trả 3 Draft + 1 Inactive. Parent GET `/storypage-template/pages/{id}` 200 trả 3 Draft, tất cả chưa có CompositionJson. FE reader lọc Active nên không có trang đọc. Local `StoryPageTemplateService.GetPublishedPagesByStoryAsync` và repository lọc Active; `StoryTemplateService.PublishStoryAsync` chỉ Active story. Cần BE cung cấp quy trình publish/status/hide/edit-after-publish và đồng bộ release routes; nghiệm thu 2+ trang/roles/slots/composition đọc đủ bằng Parent/Child, Draft/Hidden không rò rỉ. **Người dùng chọn sẽ cung cấp quy trình BE, chưa cho chốt quy tắc FE mới.**
2. **DOC-API-02:** `UploadController.cs:20` chỉ alias `content manager`; POST `/upload/background-image` cần hỗ trợ các CM claims chính thức và từ chối role ngoài quyền. Runtime upload chưa thử, không suy 403 hiện tại chỉ từ source. FE đã bỏ avatar workaround; không yêu cầu endpoint animation mới.
3. **Published hierarchy/ownership:** `StoryRoleTemplateController` GET roles/detail và `CharacterSlotTemplateController` GET slots không attribute; repositories chỉ `!= Inactive`, chưa gate story cha. `GET /role/{id}` bind tham số `roleId` lệch tên. Cần BE JWT/owner/published gate theo policy và binding đúng; test CM/Parent/Child/anonymous/tài khoản khác. FE check ID không thay enforcement này.
4. **Composition update/concurrency:** page mapping mặc định không có preserve-if-omitted; FE giữ raw JSON khi text-only. BE cần test null/empty/omitted và giới hạn payload, cân nhắc revision/ETag nếu cần chống ghi đè đa client. Không cần BE thiết kế schema v1.
5. **Media/migration:** endpoint page đủ một narration, role/page file đủ ảnh native. Nhiều audio độc lập/registry ownership/xóa bytes chưa có contract; cần BE xác nhận capability nếu vượt MVP. Migration toàn bộ legacy còn mở, không tuyên bố IndexedDB là cloud.
6. **Learning:** Parent GET vocab/quizzes của truyện này 200; scoring/reading-log ownership và Child runtime chưa xác minh. Reader đã nối từ vựng và quiz practice: theo trang, feedback sau chọn, quiz không gắn trang ở cuối. Không gửi learning log/scoring; DTO chứa đáp án nên ẩn UI không phải bảo mật. Không bật capability scoring bị 403 theo audit Parent.

Runtime browser 15/11: CM mở được studio 3 trang; Parent context sạch đăng nhập và thấy “Truyện chưa có trang được phát hành”. [Bằng chứng browser](../../artifacts/content-browser-runtime-2026-11-15.json). Snapshot CM chụp khi thư viện media còn tải; chưa nghiệm thu load toàn bộ media. Lần đóng session CM cuối có lỗi session-changed ở logout; không tính là ca logout thành công. Không có mutation nội dung.
