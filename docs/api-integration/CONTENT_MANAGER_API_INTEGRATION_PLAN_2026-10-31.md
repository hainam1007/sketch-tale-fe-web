# Content Manager — kế hoạch nối API cho Luna Extra High (31/10/2026)

## 1. Kết quả kiểm tra Swagger mới nhất

Đã tải trực tiếp `https://sketch-tale-be.onrender.com/swagger/v1/swagger.json` ngày 31/10/2026. [Snapshot](../../artifacts/swagger-content-manager-2026-10-31.json), [diff với 29/10](../../artifacts/swagger-content-manager-diff-2026-10-31.json).

- 124 operations (method + path); so với 29/10: **0 thêm, 0 xóa, 0 operation thay đổi, 0 schema thay đổi**.
- So với snapshot 19/10: 31 operations thêm trên toàn hệ thống, thuộc auth, char-types, content-reports, prohibited-themes, user-story-character-mappings và users. Không có operation authoring Content Manager mới trong nhóm này. Không đưa CRUD Admin/Parent vào Content Manager chỉ vì Swagger có endpoint.
- Việc cần làm chủ yếu là hoàn thiện consumer hiện có, xử lý phần chỉ lưu local và bổ sung contract editor. Không nên tạo lại toàn bộ service CRUD.
- Sau yêu cầu implement: đã có thay đổi frontend từng phần cho CM01–CM04; xem phần “Tình trạng triển khai” ở cuối. Chưa chạy kiểm tra/build hoặc authenticated smoke. Có tham gia audit của agent `gpt-6-luna`, reasoning `xhigh`.
- Working tree có nhiều thay đổi sẵn ở editor, assets, models và Parent. Khi triển khai phải giữ nguyên, đọc diff trước khi sửa; không reset/checkout đè thay đổi đó.

Tài liệu backend cần bổ sung: [Content Manager API gaps](CONTENT_MANAGER_API_GAPS_2026-10-31.md). Contract editor cũ là **đề xuất frontend**, không phải bằng chứng backend đã hỗ trợ: [CONTENT_MANAGER_CONTRACT.md](../CONTENT_MANAGER_CONTRACT.md).

## 2. Ma trận frontend → API hiện có

Các path trong bảng có prefix `/api`. `UI-wired` chỉ có nghĩa source có consumer; chưa chứng minh quyền hoặc dữ liệu runtime của deployment hiện tại.

| Màn hình/nghiệp vụ | API hiện có | Trạng thái và việc còn làm |
|---|---|---|
| Overview / kho truyện | `GET /story-template/all-stories`, `GET /education-themes` | UI-wired qua `listStories/listCategories`; search/filter/sort/pagination đang chạy ở FE. Chuẩn hóa response sai schema thành lỗi; dùng chung query để giảm tải lặp. |
| Metadata / tạo truyện | `GET /story-template/stories/{id}`, `POST /story-template`, `PUT /story-template/{id}` | UI-wired; multipart `EducationThemeId, Title, Description, AgeGroup`, update thêm `Status`, file bìa tên `file`. Kiểm tra category ID, trạng thái và giữ file cũ khi bỏ upload. |
| Trang truyện | `GET /storypage-template/all-pages/{storyId}`, `POST /storypage-template/{storyId}/page`, `PUT /storypage-template/{id}`, `DELETE /storypage-template/story-pages/{id}` | Đọc/tạo/sửa có consumer; DELETE có service nhưng `deleteSelectedPage` chặn real mode. Multipart hỗ trợ `RawText, file, audioFile`, update thêm `Status`; autosave hiện chỉ gửi text/status, phần chọn ảnh/audio/timeline lưu overlay. |
| Thứ tự trang | Không có write pageNumber/reorder trong Swagger | `reorderPages` ở real mode chỉ `saveMockPageOrder`. Blocked-contract cho persist đa thiết bị. |
| Vai nhân vật | `GET /story-template/{storyId}/roles`, `GET /story-template/{storyId}/all-roles`, `POST /story-template/{storyId}/role`, `PUT /story-role/{id}` | UI-wired đọc/tạo/sửa. Editor đang dùng `/roles`; cần xác nhận scope `/all-roles` để không mất vai draft/inactive. Asset library đã dùng `/all-roles`. |
| Xóa vai | `DELETE /story-role/{id}` | Có API, chưa có `contentService.deleteRole` và UI xóa vai tương ứng. Đây là thiếu nối FE; chốt cascade/constraint trước khi bật. |
| Vị trí nhân vật | `GET /story-pages/{pageId}/slots`, `POST /story-pages/{pageId}/slot`, `PUT/DELETE /story-slots/{id}` | UI-wired cho x/y/scale/flip; rotation/layer/anchor/asset override vẫn local. Tạo slot phải dùng ID response, không chỉ chọn slot đầu cùng role/page. |
| Từ vựng | `GET/POST /story-pages/{pageId}/vocabularies`, `PUT/DELETE /story-vocabulary/{id}` | UI-wired word/meaning/audioUrl; update không hỗ trợ chuyển page và UI real đã khóa trường này. Không cần API mới cho CRUD cơ bản. |
| Quiz | `GET /story-template/{storyId}/all-quizzes`, `POST /story-template/{storyId}/quizz`, `PUT /story-quiz/{id}/with-image`, `DELETE /story-quiz/{id}` | UI-wired nội dung/options/correctIndex/file/audioFile. `pageId`, `feedback` chỉ overlay; giữ chính xác `quizz`/`quiz` theo Swagger. |
| Preview | Ghép detail + pages + roles + slots + vocabulary + quiz | Không bắt buộc thêm endpoint preview để render FE; phải tách preview backend và bản local. Luồng real đã bỏ việc chèn animation/subtitle từ `authoredPageCompanions.js` vào DTO Backend. |
| Validate / publish | `POST /story-template/{id}/publish` | Publish có caller. Validate hiện chỉ FE kiểm tra title/category/pages, không phải server validation đầy đủ. Chưa có revision/version contract. |
| Ẩn truyện | `DELETE /story-template/{id}` đang được `hideStory` gọi | Cần xác nhận DELETE là soft hide hay xóa và trạng thái sau thao tác; không suy từ nhãn UI. |
| Assets | Upload `POST /upload/background-image`, `/upload/avatar`; multipart file trên story/page/role/quiz | Các API upload không thay thế thư viện asset. `uploadAsset` hiện gọi mock + IndexedDB ngay cả content real; list trộn asset suy ra từ backend với mock. |
| Thống kê | Có thể đếm trạng thái từ `/story-template/all-stories` | Chưa có reads/activeReaders/completionRate/trend/topStories. `getStatistics` đang bỏ qua range và trả trend/topStories rỗng kèm errors; UI cần hiện unavailable thay vì “không có lượt đọc”. |

## 3. Các rủi ro ưu tiên

1. **P0 — Lưu và xuất bản khác nhau:** `StoryPagesPage.saveAllDrafts` xóa dirty sau khi ghi local overlay, trong khi publish chỉ gửi ID truyện. Animation/phụ đề/ảnh phụ/nhạc local có thể xuất hiện trong preview nhưng không tồn tại trong bản backend. Cần trạng thái “đã lưu trên máy” riêng và chặn xuất bản bản đầy đủ khi còn thay đổi chưa đồng bộ.
2. **P0 — Asset:** blob URL, `asset-upload-*` và ID tổng hợp `page-background:*` không phải Backend asset ID. Không serialize các ID này vào contract mới như UUID. Không dọn IndexedDB/overlay để che mất dữ liệu; chỉ migrate sau khi upload + attach + read-back thành công.
3. **P0 — Publish/concurrency:** Swagger không có revision/ETag, version snapshot. Dirty UI hoặc serialization trong một tab không chống được hai trình duyệt ghi đè nhau. Cần backend kiểm tra nguyên tử khi muốn bảo đảm version publishing.
4. **P1 — Schema/enum/quyền:** CommonStatus `[0..4]`, TargetAgeGroup `[0..2]`, StoryRoleType `[0..3]` chưa có nhãn trong Swagger. Mapping FE hiện hữu không phải chứng minh backend; xác nhận trước khi đổi. Swagger cũng không đủ chứng minh Content Manager được mọi quyền CRUD.
5. **P1 — Query/cache:** editor ghép 4 request gốc + 2 request mỗi page; asset list đọc toàn bộ stories/pages/roles. Giảm fetch và invalidate đúng story/assets/statistics sau mutation; không refactor HTTP/auth ngoài nhu cầu.

## 4. Thứ tự triển khai cho Luna Extra High

Thực hiện tuần tự CM00 → CM01 → CM02 → CM03 → CM04. CM05–CM07 chỉ bật khi contract tương ứng sẵn sàng. Mỗi task ghi `pending / UI-wired / verified-intercept / verified-runtime / blocked-contract` và bằng chứng. Không đánh dấu verified-runtime từ test mock/intercept.

### CM00 — Chốt baseline và ma trận

- Đọc git diff, snapshot và tài liệu này; kiểm tra Swagger còn khớp trước khi code.
- Chạy baseline `npm run lint`, `npm run build`; ghi lỗi tồn tại trước, không sửa ngoài scope.
- Đối chiếu `src/lib/api/backendRoutes.js`, `featureApi.js`, queryKeys. Các route Content chính đã có allowlist; không mở wildcard hoặc đưa `/content/*` mock vào real guard.
- Dùng `playwright.api.config.js` hiện có (port 5181, real env, reuseExistingServer false); không tạo cấu hình trùng nếu cấu hình hiện tại đáp ứng.
- Qua task khi xác định từng action có contract/caller/test nào, và phân biệt new Swagger với integration gap.

### CM01 — Trạng thái lưu thật và local, bảo vệ publish (P0)

Files: `StoryPagesPage.jsx`, `StoryEditorLayout.jsx`, `hooks/useEditorSaveState.js`, `contentMockOverlay.js`, `models.js`, `StoryPreviewPage.jsx`, `hooks/useStoryEditor.js`.

- Thể hiện serverSaved/localOnly/unsaved/failed cho dữ liệu có liên quan; không coi local overlay là backend saved.
- Kiểm tra local-only đã lưu từ phiên trước, không chỉ dirty form hiện tại. Publish phải xử lý cả metadata, page/slot, quiz và media đang local; không bỏ qua vì người dùng reload.
- Preview ghi rõ nguồn local hay persisted; không dùng authored companion/asset fallback theo tên làm bằng chứng dữ liệu server.
- Giữ draft, undo và recovery của người dùng; không tự xóa hoặc gửi field backend chưa nhận.
- Qua task khi chỉnh animation → autosave → reload vẫn nhận biết chưa đồng bộ, và publish không thông báo xuất bản toàn bộ bản preview đó.

### CM02 — Hoàn thiện CRUD đã có (P1)

Files: `contentService.js`, `StoryMetadataPage.jsx`, `StoryRolesPage.jsx`, `StoryQuizPage.jsx`, `StoryVocabularyPage.jsx`, `ContentStoriesPage.jsx`, hooks/cache liên quan.

- Dùng parser list nghiêm ngặt thống nhất; hiện listStories/categories/statistics còn fallback `items || []` làm lỗi schema thành empty state.
- Join theme name qua educationThemeId; `educationThemeName` không nằm trong StoryTemplateDto.
- Kiểm tra `/roles` và `/all-roles` bằng fixture đủ draft/active/inactive; chọn route authoring theo contract và xử lý slot tham chiếu role đã ẩn rõ ràng.
- Nối deleteRole sau khi xác nhận semantics: UI → service DELETE → refetch normalized editor → cache/selection/draft cleanup đúng entity. Nếu backend từ chối role đang được dùng, hiển thị lỗi; không tự cascade xóa slot/quiz.
- Xóa page hiện chỉ hoạt động ở mock (`deleteSelectedPage` guard). Chỉ mở real sau khi chốt cascade/constraint; không gọi việc service có DELETE là UI đã nối xong.
- Tạo slot lấy `result.id`, xác nhận entity sau refetch; bảo toàn status khi update. Không chọn nhầm slot khi có nhiều bản ghi cùng role/page.
- Với create thành công nhưng refetch lỗi, giữ mutationAccepted và chỉ retry GET; network timeout là outcome unknown, không tự retry POST.
- Qua task khi create/update/delete và reload cho metadata/page/role/slot/vocabulary/quiz đúng payload; lỗi giữ dữ liệu nhập và không fallback mock.

### CM03 — Nối upload trực tiếp vào consumer hiện có (P1)

Files: `assetService.js`, `StoryForm.jsx`, `StoryMetadataPage.jsx`, `StoryPagesPage.jsx`, `StoryRolesPage.jsx`, `StoryQuizPage.jsx`, `contentService.js`.

- Trước mắt tận dụng multipart đã có: bìa story, background page, narration page, default image role, image/audio quiz. Phân biệt chọn file trực tiếp với chọn asset thư viện tái sử dụng.
- StoryPages autosave hiện không chuyển file ảnh/audio vào service dù service hỗ trợ. Bổ sung luồng chọn file → FormData → read-back URL thật → preview; giữ nguyên local file nếu upload thất bại.
- Không mặc định chuyển nhiều audioTracks thành một audioFile: một narration không thể lưu timing/trim/volume/music/effect của cả timeline. Chỉ đánh dấu thành công phần contract thật sự hỗ trợ.
- Upload background/avatar độc lập chỉ dùng khi có consumer attach phù hợp và schema response đã xác nhận; không đánh đồng upload URL với đã gắn vào story/page.
- File không thay đổi phải giữ media cũ; remove/replace cần semantics rõ. Không hard-code multipart Content-Type/boundary.
- Qua task khi mở trình duyệt/profile sạch vẫn thấy media đã lưu bằng API; local-only asset vẫn được phân biệt và không báo upload server thành công.

### CM04 — Overview, assets và statistics đọc đúng dữ liệu (P1)

Files: `ContentOverviewPage.jsx`, `ContentStatisticsPage.jsx`, `AssetsPage.jsx`, `assetService.js`, `useStoryEditor.js`, `contentService.js`, queryKeys.

- Dùng chung raw list cache cho các bộ lọc Overview khi phù hợp; không thêm query params chưa có trong Swagger rồi coi là server pagination.
- Asset suy từ story/page/role là read-only; không gọi DELETE `/content/assets/{id}` ở real. Hiện fallback mock theo tên role phải được tách khỏi dữ liệu publish thật.
- Giảm load toàn bộ kho khi editor chỉ cần asset của một story. Không tự đẩy yêu cầu endpoint aggregate thành blocker CRUD MVP.
- Hiện “backend chưa cung cấp thống kê” cho metrics thiếu, phân biệt với 0 lượt đọc; count draft/published vẫn có thể dùng dữ liệu thật.

### CM05 — Editor nâng cao, reorder và asset library (blocked-contract)

- Đợi G01–G05 trong [gaps](CONTENT_MANAGER_API_GAPS_2026-10-31.md); đóng schema với Backend/Mobile trước.
- Sau khi có contract: upload assets → map ID local sang UUID → save composition/slot extension → read-back → đối chiếu preview sạch → mới bỏ trạng thái local-only.
- Thứ tự trang cập nhật nguyên tử với pageIds ổn định; không delete/recreate pages. Concurrency conflict giữ draft.
- Hỗ trợ schemaVersion và migration sequence cũ sang animationClips một cách rõ ràng; không đưa JSON tùy ý vào RawText.

### CM06 — Validation, revision và version publish (blocked-contract)

- Đợi G06–G07. Nối expectedRevision/ETag qua tất cả mutation có liên quan; stale write trả 409/412 và giữ nội dung đang sửa.
- Publish trả version/revision đã phát hành; preview persisted và client đọc truyện dùng cùng snapshot/version/asset durable.
- Backend validate assets, pages/roles/slots, quiz index, timeline và liên kết; FE hiển thị issue có tab/entityId/fieldPath để mở đúng control.
- Hide chỉ được gọi sau khi xác nhận lifecycle của DELETE hoặc có action thay thế được backend tài liệu hóa.

### CM07 — Quiz bổ sung và analytics (blocked-contract)

- Đợi G08–G09. Nối quiz page/feedback khi schema có; giữ CRUD hiện tại.
- Nối range cho statistics, timezone, empty vs unavailable, partial failure; kiểm tra nguồn tracking thật, không tạo trend từ số lượng truyện.

## 5. Kiểm thử nghiệm thu

| Nhóm | Ca bắt buộc |
|---|---|
| Adapter | Multipart field name/casing và file; zero correctIndex; null/unknown status; JSON optionsJson sai; sai envelope khác list rỗng; PUT/DELETE 200 body rỗng được refetch. |
| CRUD UI | Tạo/sửa/xóa + reload; role draft xuất hiện; slot đúng response ID; xóa entity không hồi sinh từ draft cũ; failed mutation không xóa input. |
| Media | Upload/replace ảnh, narration, role image, quiz audio; thiếu blob; upload thành công nhưng attach/refresh lỗi; không nhận object URL là durable URL. |
| Local/server | Timeline/subtitles/imageObjects/reorder/quiz feedback local còn sau reload nhưng không bị gắn nhãn backend saved; browser sạch không có dữ liệu local giả. |
| Publish | Dirty toàn editor; local-only từ phiên cũ; stale revision sau khi backend hỗ trợ; lỗi publish; refetch không published; hide theo semantics xác nhận. |
| Isolation | Đổi account/mode/story lúc request đang chạy; cache không lẫn; 401/403/404 không fallback mock. |
| Statistics | Unsupported khác empty, range thực sự được dùng sau khi có API, không diễn giải số 0 từ missing field. |

Lệnh dự kiến khi triển khai: `npm run lint`, `npm run build`, `npm run test:api` và test editor liên quan qua `npm run test:editor -- <spec>`. Xem `tests/support/apiModes.js` để thêm integration spec mới vào `apiSpecs` khi cần. `test:editor` hiện chạy mock nên không chứng minh backend persistence. Intercept chặn mọi API không fixture xử lý; live smoke tách riêng với account Content Manager và story test được cung cấp, không dùng credential mock. Chưa chạy các test này trong lần lập kế hoạch.

## 6. Prompt giao triển khai

> Dùng gpt-6-luna với reasoning xhigh. Đọc CONTENT_MANAGER_API_INTEGRATION_PLAN_2026-10-31.md và CONTENT_MANAGER_API_GAPS_2026-10-31.md. Bắt đầu CM00–CM04, giữ toàn bộ thay đổi hiện tại. Hoàn thiện consumer, service, cache và trạng thái lưu; không chỉ thêm hàm API. Không coi mock/local asset/overlay là dữ liệu backend đã lưu hoặc xuất bản. Chỉ triển khai CM05–CM07 khi Swagger/contract đã hỗ trợ. Với contract chưa rõ, ghi blocker cụ thể và tiếp tục phần độc lập; không đoán enum, hide semantics hoặc quyền. Chạy lint/build và test thích hợp, báo bằng chứng intercept riêng với live. Không deploy hoặc commit trong scope này.

## 7. Tình trạng triển khai sau yêu cầu “implement”

- **CM01 — một phần:** overlay hiện được tóm tắt thành `localOnlyChanges` mỗi lần editor đọc/làm mới. Khi API mode là real, header/bảng cảnh báo ghi rõ các thay đổi local-only; kiểm tra, publish và hide bị chặn khi overlay còn dữ liệu. Mục “trạng thái lưu” không còn gọi thay đổi local là bản nháp đã lưu. Có nút tải bản sao JSON và bỏ overlay sau xác nhận; tệp nhị phân IndexedDB không nằm trong bản sao. Contract G01–G05 hiện chặn đồng bộ.
- **CM02 — một phần:** list response cho story/category/statistics ở real mode giờ báo lỗi sai schema thay vì biến thành danh sách rỗng. Tạo slot dùng ID từ response POST khi read-back. Có `deleteRole` và nút xóa cho vai không có slot; vai còn slot bị chặn để tránh cascade không rõ. Xóa page vẫn chặn real mode, `/roles` so với `/all-roles` và semantics hide vẫn cần xác nhận.
- **CM03 — một phần:** picker ảnh bìa/vai không cho attach asset chỉ lưu local; copy mô tả rõ cần upload multipart trực tiếp. Upload role qua trường file và story cover vẫn đi theo multipart endpoint có sẵn. Upload từ AssetsPage vẫn local/IndexedDB vì Swagger chưa có library API; thành công được ghi rõ là chỉ lưu trên thiết bị.
- **CM04 — một phần:** thống kê real không còn trình bày lượt đọc/trend/top story chưa có như số 0. Hiện “chưa có API”; counts draft/published từ danh sách truyện vẫn giữ. Chưa thêm server pagination vì Swagger không mô tả query contract.
- Không chạy test/lint/build trong lần implement này. Không chạy request ghi lên backend. CM05–CM07 còn blocked-contract theo gaps.
