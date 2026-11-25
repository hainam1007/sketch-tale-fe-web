# Content Manager — soạn và phát hành truyện

## Hiện trạng sau pull 18/11/2026

Ghi nhận cuối lượt: BE có 2 thay đổi unstaged ngoài lượt docs về create-page empty strings và nhiều slot cùng role/page. Chưa deploy/runtime-verified; cần kiểm thử model binding và nhiều slot/animation target theo slot ID trước khi coi hỗ trợ đầy đủ.

BE `de3209f` + staged, Swagger 120 paths/161 operations. Delta FE/tests/docs PUB-01 18/11 được ghi ở ma trận này; kiểm thử 17/11 bên dưới là baseline lịch sử, không chứng minh contract mới chạy đúng. Chi tiết request/response, URL reuse và vấn đề: [CONTRACTS](../api/CONTRACTS.md).

- PUB-01 có source cascade Draft → Active cho pages/slots/roles/quizzes, validate cover + page; unpublish mới đưa Active → Draft. **Lượt FE 18/11** cho phép story Pending/Archived nếu mọi child cần đọc là Draft/Active, đồng thời chặn child Pending/Archived/unknown; đã thêm pending/dirty/upload gate và post-POST read-back đủ trạng thái. BE vẫn promote story Pending/Archived không điều kiện. Chưa runtime nghiệm thu, chưa immutable version.
- DOC-API-02 đã có alias ContentManager ở source. Có upload ảnh CM và GET gallery URL theo JWT; chưa registry/delete/audio độc lập. FE assetService chưa gọi gallery mới, không coi đã tích hợp.
- URL reuse cho cover/background/quiz image đã có DTO và service; update rỗng giữ ảnh cũ. Page giữ narration khi không file; CompositionJson omitted vẫn phải kiểm thử riêng.
- **VOC-18 / P0:** FE real API và Parent reader ưu tiên `wordVi`; request POST/PUT chỉ gửi `wordVi`, model UI vẫn dùng `word`. Form kiểm tra RawText đã lưu server theo NFC, không phân biệt hoa/thường, substring; draft chưa lưu không được tính và không tự lưu trang. Lỗi giữ nguyên biểu mẫu; POST/PUT có GET read-back theo ID/từ/nghĩa/audio/page, không retry POST khi GET lỗi. AudioUrl↔AudioUrlVi mapping còn chờ BE bổ sung và xác minh; xem [CONTRACTS](../api/CONTRACTS.md).
- Reader route source local/Swagger vẫn khác. Snapshot Swagger 18/11 có `/pages/{storyId}`, local source có Parent/Child `/published/{storyId}`; live Swagger GET timeout lượt này. Hide FE dùng DELETE/Inactive; không tự thay bằng unpublish/Draft hoặc mở sửa published nếu chưa chốt nghiệp vụ.

Các ma trận/kết quả 14–17/11 dưới đây là baseline trước pull, không còn dùng câu “publish chỉ story”/“upload thiếu alias” làm kết luận source hiện tại.

Rà soát source/intercept 17/11 là baseline; re-audit PUB-01 ngày 18/11 chỉ sửa FE/tests/docs, giữ mọi thay đổi đã có, BE chỉ đọc. Caller cho story/theme/page/role/slot/vocabulary/quiz, reorder, upload media, composition v1 và read-after-write đã có. **Chưa nghiệm thu end-to-end runtime.**

## Nguồn chuẩn

- [Contract API](../api/CONTRACTS.md): DTO, method/path, semantics và khác biệt local/live.
- [Composition v1](../api/COMPOSITION_V1.md) + fixture: format FE sở hữu, chưa xác nhận Mobile render.
- [WEB01–WEB09](../plans/WEB_READER.md): kế hoạch chưa hoàn tất để đọc đúng trên trình duyệt sạch.
- [UI Content](../specs/CONTENT_MANAGER_UI_UX.md), [UI editor](../specs/STORY_EDITOR_UI_UX.md), [animation](../specs/STORY_EDITOR_ANIMATION.md): tiêu chí tham chiếu, không phải trạng thái API.

## Ranh giới đã có và chưa có

| Phần | Đã có trong source | Giới hạn |
| --- | --- | --- |
| Page composition | Create gửi JSON v1 rỗng; API placeholder `string` được chuẩn hóa thành composition rỗng hợp lệ; legacy null vẫn được hỗ trợ | Chưa nghiệm thu round-trip runtime, null/omitted, unknown fields và race saves |
| Ảnh nền + narration | page multipart `file`/`audioFile` | Một narration; nhiều audio local không thành upload cloud |
| Ảnh phụ | Upload service + asset manifest | Source 18/11 đã có cả content manager/ContentManager; runtime upload chưa nghiệm thu |
| Slot | DTO X/Y/scale/flip/status, JSON extension rotation/layer/asset; một nhân vật có thể có nhiều vị trí trên cùng trang | Native slot ID phải thật; extension không phải cột BE |
| Quiz/vocab | CRUD hiện hữu | Quiz page/feedback trong JSON không đồng nghĩa scoring BE đọc extension |
| Save | Preflight, PUT, GET so sánh | Không có atomic revision/ETag; lưu một form không được xóa dirty form khác |
| Publish | POST story publish | Source 18/11 cascade Draft của con → Active; chưa version/runtime |
| Reader Parent | Catalog, composition/default roles/slots và renderer chung đã nối | Runtime 14–15/11 trả 3 trang Draft cho story Active; FE lọc Active, còn BE phải gate published hierarchy ở server. Route/release chưa recheck runtime |
| Asset registry/analytics | Local/demo | Chưa contract server tương đương; không dùng Character API như kho tư liệu CM |

Giữ raw JSON lỗi/version cao, chặn overwrite; không báo cloud-saved với blob/data/local-only. MVP dùng một narration và template characters. Migration phải backup và resume được; không xóa hàng loạt localStorage/IndexedDB. Chưa coi sửa template đã publish là sửa draft độc lập.

## PUB-01 — audit luồng hiện tại 18/11/2026

| Action → caller | Method/path và dữ liệu | Quyền | Trạng thái / tiêu chí nghiệm thu |
| --- | --- | --- | --- |
| Metadata, page, role, slot, quiz, vocabulary → StoryForm / editor forms / `contentService` | Story `PUT /story-template/{id}`; page `PUT /storypage-template/{id}` multipart (`RawText`, `Status`, `CompositionJson`, file/audio); role `POST/PUT /story-template/{id}/role`, `/story-role/{id}`; slot `POST/PUT /story-pages/{pageId}/slot`, `/story-slots/{id}`; quiz `/story-template/{id}/quizz`, `/story-quiz/{id}/with-image`; vocab `/story-pages/{pageId}/vocabularies`, `/story-vocabulary/{id}` | CM ghi; GET/read-back theo contract | Save/read-back hiện có; form dirty hoặc lỗi partial không được xem là đã lưu. Test runtime cần đúng account và story test. |
| Save queue và upload → `useStoryEditorMutation`, `StoryPagesPage`, `AssetPicker`, `contentService` | Cùng story dùng React Query scope + module queue; upload media và page narration chờ response/read-back | CM | Dirty/pending/upload khóa publish. Local-only media, malformed/future CompositionJson hoặc orphan refs chặn publish. Không có transaction/ETag xuyên tab/client. |
| Validation → `validateBackendStory` | CM GET story, `all-pages`, `all-roles`, `all-quizzes`, slots theo page, vocabulary theo page; kiểm tra title/theme/cover/page/composition/quiz/local changes/status | CM | Story Draft/Active/Pending/Archived được phép; tất cả child còn cần đọc phải Draft/Active. Child Pending/Archived/unknown và story Inactive/unknown bị chặn trước POST; lỗi nêu resource/status. |
| Xuất bản → `StoryEditorLayout.publish` / `contentService.publishStory` | POST `/story-template/{id}/publish`; không gửi version payload | CM | Một click tối đa một POST; recheck dirty/pending sau dialog. FE không PUT Active hàng loạt. Cover + page gate khớp source. |
| Đọc lại → `mutateBackendStoryAndRefresh` | GET story + all pages/roles/quizzes, slots, vocab sau POST; kiểm tra story và mọi entity publishable Active | CM cho editor read-back | POST reject giữ dữ liệu; 5xx/timeout là unknown; POST accepted + GET lỗi hoặc status thiếu Active khóa publish và chỉ cho GET reconcile. Count 0 không coi là lỗi. |
| Content catalog / preview → `ContentStoriesPage`, `StoryPreviewPage` | GET `/story-template/all-stories`; preview đọc saved API data; query invalidation `['stories', user.id]`, `storyPreview(user.id, storyId)` | CM | Refetch editor/catalog/preview sau success. Cache Parent ở account/device khác không được hứa tự cập nhật. |
| Parent catalog / reader → `parentCatalogService`, `parentReaderModel`, `ParentReaderStage` | GET stories/detail, page route `/storypage-template/pages/{storyId}`, roles, slots; vocabulary/quizzes qua reader APIs | Parent/Child session, không dùng token CM | FE chỉ render Active, sort theo pageNumber, hydrate CompositionJson và không đọc overlay. Route chưa khớp local source; FE không fallback all-pages/all-roles. Intercept sạch qua, runtime mới chưa xác minh. |

### Nguồn BE và yêu cầu còn mở

`StoryTemplateService.PublishStoryAsync` cần cover + page khác Inactive; nó đặt story Active nếu story không Inactive, nên promote cả story Pending/Archived. Pages/roles/slots/quizzes chỉ cascade từ Draft; Pending/Archived không Active. Theo lựa chọn người dùng 18/11, FE cho phép Pending/Archived ở story khi mọi child cần đọc là Draft/Active; Pending/Archived child vẫn bị chặn, nêu ID/status để xử lý. FE không tự đổi trạng thái child.

Swagger artifact 18/11 có `GET /storypage-template/pages/{storyId}`; source local `StoryPageTemplateController` có route Parent/Child `/published/{storyId}` và authoring `/pages/by-story/{storyId}`/`all-pages`. `StoryRoleTemplateController.GetRolesByStory` và `CharacterSlotTemplateController.GetSlotsByPage` không có endpoint-level role gate; repositories trả mọi status khác Inactive. Reader FE filter Active không thay được gate BE; cần route thống nhất và Parent/Child direct-read test, không truy cập draft qua ID.

### Intercept lượt này

`tests/content-integration.spec.js` mô phỏng server state Draft → Active cho story hai trang, role, slot và quiz; Parent context mới đọc catalog/detail/pages/slots/quiz không seed storage tác giả. Có test story Pending/Archived được publish khi child Draft/Active (kèm luồng UI Pending), child Pending/Archived bị chặn, dirty trong confirmation, upload pending, cover, reject, timeout, accepted/read-back GET-only, child status chưa Active, duplicate POST guard, count 0 và filter Draft page trên reader route. Đây là kiểm chứng FE/intercept; không chứng minh BE route authorization, DB hoặc release.

### Kết quả kiểm tra FE 18/11/2026

- `npm run test:api -- tests/content-integration.spec.js --reporter=line`: 37/37 passed.
- `npm run lint`: exit 0, còn 21 warnings trên repo; không còn warning trong `contentService.js`.
- `npm run build`: thành công; Vite còn cảnh báo chunk JS lớn hơn 500 kB sau minify.
- Chưa có runtime publish/read-back, Child test hoặc mutation nội dung; Swagger live GET timeout. Kết quả intercept/build không xác minh DB hoặc release.

Khi API trả placeholder Swagger `string` cho trang mới, FE dùng ảnh nền texture mặc định trong `public/images/story-page-default-background.jpg`, chuẩn hóa `RawText` thành một dấu cách không hiển thị, và thay `CompositionJson` bằng JSON v1 hợp lệ ở chế độ nền trang.

## Điểm chạm code

`src/features/content/services/{storyComposition,contentService,vocabularyContract,assetService,localAssetStore,contentMockOverlay}.js`; `pages/StoryPagesPage.jsx`, `StoryVocabularyPage.jsx`, `StoryPreviewPage.jsx`; `components/StoryPageRenderer.jsx`, `StoryAnimationEditor.jsx`; `utils/storyAnimation.js`, `storyAudio.js`; Parent `parentCatalogService.js`, `parentReaderActivities.js` và `ParentStoryReaderPage.jsx`.

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
| Ảnh phụ → AssetPicker/uploadAsset | POST `/upload/background-image` | multipart file → imageUrl; manifest vào page | `content manager, ContentManager` local 18/11 | server bytes + index local | đã bỏ tùy chọn `/upload/avatar`; 403 không bypass; upload pending chặn publish | P0: CM alias upload được; upload lỗi không báo cloud saved |
| Subtitle/animation/timeline/audio refs → codec | PUT page CompositionJson | v1 → raw JSON/hydrated renderer | CM ghi; R đọc | server nếu URL durable; audio thêm vẫn local | codec sửa missing background/native first upload/unknown rows/slot assets; target orphan bị chặn | P0: reload/layout/seek đúng; Mobile chưa nghiệm thu |
| Vocabulary → CRUD | GET/POST `/story-pages/{id}/vocabularies`; PUT/DELETE `/story-vocabulary/{id}` | `wordVi`/meaning/audioUrl → DTO/read-back, page ID giữ ở path/response | CM ghi; GET không attribute local | server | FE boundary/Parent reader map `wordVi`; saved RawText preflight; update giữ meaning/audio/page; intercept tests trong delta VOC-18 | P0: audio create/read mapping BE và source/runtime release còn chờ; không mutation runtime |
| Quiz → CRUD + page extension | POST `/story-template/{id}/quizz`; PUT `/story-quiz/{id}/with-image`; DELETE `/story-quiz/{id}` | question/options/correctIndex/media; page/feedback trong JSON | CM ghi; JWT đọc | server | wired; partial extension errors accepted; FE hiện yêu cầu chọn trang | P1: quiz move/delete partial recovery cần thêm test; feedback cuối truyện chưa có nơi lưu |
| Lưu/autosave/navigation → hook/service queue | các mutation phía trên | snapshot → verified server state | CM | server + recovery v2 local | intercept: late edit giữ dirty/reload; per-story queue ngoài React Query; pending form khóa input | P0: không atomic đa tab; recovery conflict giữ nguyên, chưa tự merge |
| Saved preview → previewStory | GET story/all-pages/all-roles/slots/all-quizzes/vocab | read model không overlay | CM | server | wired; renderer chung với Parent; chưa hợp nhất toàn bộ playback/read-model | P0: lỗi không dựng từ mock; runtime v1 chưa có dữ liệu |
| Validate/publish → validateStory/publishStory | GET dữ liệu rồi POST `/story-template/{id}/publish` | không version payload → status + read-back | CM | server | validation lỗi không còn báo success; kiểm tra lại dirty sau confirm | P0: chờ quy trình BE; không tự activate hoặc khóa sửa published theo suy đoán |
| Hide → hideStory | DELETE `/story-template/{id}` | none → read-back | CM | server | wired; marked accepted/unknown nếu refresh lỗi | P0: read-back 404 sau hide vẫn cần reconcile catalog; chưa runtime |
| Catalog/reader → parentCatalogService.get | GET stories, `/storypage-template/pages/{id}`, roles/slots | DTO + CompositionJson → shared renderer | R | server, không overlay | intercept context sạch 2 trang; live Draft bị FE lọc | P0: BE thống nhất lifecycle, Parent/Child đọc đủ sau publish |
| Assets/statistics → listAssets/getStatistics | GET all-stories/pages/roles | derive inventory/counts | CM | server inventory + local uploads; analytics unavailable | không có registry/delete-cloud/usage analytics tương đương; không dùng Character API | P1: giữ nhãn local/unavailable, không số mock trong real |

## VOC-18 delta — 18/11/2026

Backend source/Swagger được đối chiếu trực tiếp trong lượt này; chỉ đọc BE. `CreateVocabularyTemplateDto`, `UpdateVocabularyTemplateDto` và `VocabularyTemplateDto` dùng `WordVi`; GET `/story-pages/{pageId}/vocabularies` trả liên kết `StoryPageTemplateId`. `CreateVocabAsync` yêu cầu từ/nghĩa, RawText đã lưu không rỗng và substring sau Unicode FormC, `OrdinalIgnoreCase`; update chỉ chạy kiểm tra RawText khi WordVi mới khác rỗng và khác từ hiện tại không phân biệt hoa/thường. Update bỏ qua WordVi/Meaning rỗng, `AudioUrl == null` giữ audio hiện tại. Không áp create rules vào mọi update.

FE real API map `wordVi` sang model `word`, dùng fallback cũ `word` chỉ khi `wordVi` không có mặt, gửi duy nhất `wordVi`, giữ ID/meaning/audio/page và kiểm tra response GET sau mutation. Trước khi thêm/đổi từ, editor đọc RawText từ endpoint page đã lưu; không dùng page draft trong overlay và không tự lưu trang. UI hướng dẫn lưu trang trước; backend vẫn là validator cuối. Mutation đã nhận nhưng GET lỗi/sai nội dung sẽ giữ draft và khóa thao tác tạo lại đến khi tải lại.

Audio mapping là blocker BE riêng: source `VocabularyTemplateService.UpdateVocabAsync` gán `AudioUrl` vào `AudioUrlVi`, nhưng `MappingProfile` dùng map mặc định cho create và read nên không có mapping tên khác. Người dùng xác nhận BE sẽ bổ sung; chưa có bản sửa hoặc runtime read-back để nghiệm thu audio. FE không sửa BE.

Kiểm thử lượt này: `npx playwright test --config playwright.content-integration.config.js` **25/25 passed**; `npx playwright test --config playwright.parent-integration.config.js tests/parent-integration.spec.js` **7 passed / 3 skipped** theo project config. `npm run lint` exit 0, còn warnings ở các khu vực khác; `npm run build` thành công, bundle JS 1,351.38 kB có cảnh báo chunk > 500 kB. Vocabulary API trong Playwright được intercept; không phải mutation/runtime BE thật.

## Thay đổi và kiểm chứng đợt này

- Service queue tuần tự theo user/story bao gồm preflight/write/read-back; không phải transaction/ETag giữa nhiều client. Upload narration và slot-extension writes dùng cùng luồng mutation.
- Recovery v2 lưu snapshot + baseline; restore khi khớp, backup trước thay/xóa, conflict không tự áp dụng. Recovery v1 sai revision hoặc malformed được giữ; bản sạch được backup trước dọn. Chưa có migration hoàn chỉnh local media/mock-slot → cloud với checkpoint/resume; không xóa asset bytes.
- Metadata/role/quiz/vocabulary khóa inputs khi pending; pages vẫn cho sửa trong lúc lưu và chỉ clear snapshot đã gửi. Upload picker giữ callback của trang khởi tạo, pending tham gia dirty state.
- Codec xử lý background thiếu/null thành validation error, giữ native mode khi upload nền đầu, giữ unknown fields theo ID và asset override slot; xóa row không hồi sinh từ JSON cũ.
- Test mới: `tests/content-integration.spec.js`, chạy `npx playwright test --config playwright.content-integration.config.js`. 14 ca đã qua vòng cuối, gồm slot extension success/partial failure và target ảnh phụ. Bao gồm context sạch đăng nhập Parent qua auth adapter, không seed local storage. Fixture dùng trang Active sẵn; **không mô phỏng publish tự activate pages**.
- Build qua; lint exit 0 còn warnings. Cả 3 test hồi quy editor đã qua; test cover cũ tìm nút “Hủy” trong khi UI đã đổi “Sang dựng truyện”, đã sửa locator.
- Thêm 2 test reader activities đã qua riêng: vocab/quiz đúng trang và cuối truyện, chưa hiện feedback trước chọn, không ghi log; từ chối quiz sai story. Tổng 16 ca trong suite CM, đã chạy theo hai vòng 14 + 2.
- Hồi quy Parent: 2 test `reader hydrates` / `reader rejects` trong `parent-audit.spec.js` qua; build/lint đã chạy lại sau khi thêm activities. Lint exit 0 có warnings; build có cảnh báo chunk lớn. Chưa chạy toàn bộ mọi suite của repository.
- **Recheck 17/11:** `npx playwright test --config playwright.content-integration.config.js` qua 17/17; `npx playwright test --config playwright.parent-integration.config.js tests/parent-audit.spec.js --grep "reader hydrates|reader rejects"` qua 2 ca ở project `parent-live`, 2 ca `parent-catalog-only` được skip theo cấu hình. `npm run lint` exit 0 còn warnings; `npm run build` thành công, bundle JS 1.35 MB có cảnh báo chunk lớn. Đây là kiểm chứng FE/intercept, không xác minh DB, role enforcement hoặc deploy runtime.

## Runtime và yêu cầu Backend — lịch sử 14–17/11

Cập nhật 18/11: các mục cascade/alias bên dưới đã có source fix; lấy phần đầu tài liệu và CONTRACTS làm trạng thái hiện hành. Các bằng chứng runtime giữ nguyên ngày, không suy đã deploy fix.

**Đối chiếu source 17/11:** Backend checkout vẫn có staged modifications và chỉ được đọc. `StoryTemplateService.PublishStoryAsync` chỉ đặt story `Active`; `StoryPageTemplateRepository.GetPublishedPagesByStoryIdAsync` chỉ trả page `Active`. `StoryPageTemplateController` có route Parent/Child `GET /storypage-template/published/{storyId}`, trong khi route reader live đã ghi nhận là `/storypage-template/pages/{storyId}`. `UploadController.UploadItemImage` chỉ cho role `content manager`; runtime upload chưa thử. Các khác biệt này giữ nguyên blocker trong bảng dưới, không được giải quyết bằng việc nới filter hoặc đổi route FE theo phỏng đoán.

Người dùng chỉ định tài khoản trong PROJECT_SUMMARY và truyện **Tôn giáo**, không có Child test. Đã login/read/logout CM và Parent; chưa mutation nội dung/publish/hide/delete/upload. [Bằng chứng API](../../artifacts/content-runtime-2026-11-14.json) không chứa token/credential. Đây là dữ liệu đọc 14/11; recheck 17/11 không thêm bằng chứng runtime.

1. **PUB-01 / DOC-API-01 — blocker đọc thật:** story `ad1371f3-8ef3-42ff-8b3a-46b462807937` Active; CM all-pages trả 3 Draft + 1 Inactive. Parent GET `/storypage-template/pages/{id}` 200 trả 3 Draft, tất cả chưa có CompositionJson. FE reader lọc Active nên không có trang đọc. Local `StoryPageTemplateService.GetPublishedPagesByStoryAsync` và repository lọc Active; `StoryTemplateService.PublishStoryAsync` chỉ Active story. Cần BE cung cấp quy trình publish/status/hide/edit-after-publish và đồng bộ release routes; nghiệm thu 2+ trang/roles/slots/composition đọc đủ bằng Parent/Child, Draft/Hidden không rò rỉ. **Người dùng chọn sẽ cung cấp quy trình BE, chưa cho chốt quy tắc FE mới.**
2. **DOC-API-02:** `UploadController.cs:20` chỉ alias `content manager`; POST `/upload/background-image` cần hỗ trợ các CM claims chính thức và từ chối role ngoài quyền. Runtime upload chưa thử, không suy 403 hiện tại chỉ từ source. FE đã bỏ avatar workaround; không yêu cầu endpoint animation mới.
3. **Published hierarchy/ownership:** `StoryRoleTemplateController` GET roles/detail và `CharacterSlotTemplateController` GET slots không attribute; repositories chỉ `!= Inactive`, chưa gate story cha. `GET /role/{id}` bind tham số `roleId` lệch tên. Cần BE JWT/owner/published gate theo policy và binding đúng; test CM/Parent/Child/anonymous/tài khoản khác. FE check ID không thay enforcement này.
4. **Composition update/concurrency:** page mapping mặc định không có preserve-if-omitted; FE giữ raw JSON khi text-only. BE cần test null/empty/omitted và giới hạn payload, cân nhắc revision/ETag nếu cần chống ghi đè đa client. Không cần BE thiết kế schema v1.
5. **Media/migration:** endpoint page đủ một narration, role/page file đủ ảnh native. Nhiều audio độc lập/registry ownership/xóa bytes chưa có contract; cần BE xác nhận capability nếu vượt MVP. Migration toàn bộ legacy còn mở, không tuyên bố IndexedDB là cloud.
6. **Learning:** Parent GET vocab/quizzes của truyện này 200; scoring/reading-log ownership và Child runtime chưa xác minh. Reader đã nối từ vựng và quiz practice: theo trang, feedback sau chọn, quiz không gắn trang ở cuối. Không gửi learning log/scoring; DTO chứa đáp án nên ẩn UI không phải bảo mật. Không bật capability scoring bị 403 theo audit Parent.

Runtime browser 15/11: CM mở được studio 3 trang; Parent context sạch đăng nhập và thấy “Truyện chưa có trang được phát hành”. [Bằng chứng browser](../../artifacts/content-browser-runtime-2026-11-15.json). Snapshot CM chụp khi thư viện media còn tải; chưa nghiệm thu load toàn bộ media. Lần đóng session CM cuối có lỗi session-changed ở logout; không tính là ca logout thành công. Không có mutation nội dung.
