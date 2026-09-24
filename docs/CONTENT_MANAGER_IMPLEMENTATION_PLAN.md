# SketchTale — Kế hoạch code cho Content Manager

> Ngày lập: 18/09/2026.
> Cập nhật 23/09/2026: ưu tiên bộ công cụ frontend dựng truyện và quản lý asset. Mục 10 là thứ tự thực hiện hiện hành cho đợt frontend; M0–M5 vẫn là mốc hoàn thiện/tích hợp toàn module.
> Phạm vi: Web Frontend, một lập trình viên; phối hợp Backend và Mobile về contract, media và preview.
> Tài liệu tổng thể: [WEB_IMPLEMENTATION_PLAN.md](WEB_IMPLEMENTATION_PLAN.md), đặc biệt C-01–C-10 và G2/G3/G5/G6. Nghiệp vụ nguồn: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).
> Đây là kế hoạch hoàn thiện code hiện có. Có màn hình/mock không đồng nghĩa đã tích hợp API hoặc nghiệm thu. Khi có khác biệt về phạm vi/thứ tự tổng thể, ưu tiên kế hoạch Web; hiện trạng kỹ thuật dưới đây căn cứ repository tại ngày lập.

## 1. Mục tiêu và thứ tự triển khai

Hoàn thiện luồng **tạo draft → chọn/upload asset → pages → roles/slots → vocabulary/quiz → lưu → preview → validate → publish version → sửa draft → publish lại/ẩn truyện**. Thống kê làm sau khi luồng xuất bản ổn định.

- Giữ React/Vite, JavaScript/JSX, React Router và TanStack Query đã cài.
- Tận dụng `src/features/content`; chưa tách thành nhiều feature như sơ đồ đích nếu chưa có nhu cầu dùng chung.
- Ưu tiên editor dạng form, nút lên/xuống và tọa độ số. Drag/drop, autosave, cộng tác realtime và chart nâng cao không thuộc đợt đầu.
- Không xây reader/drawing/quiz Mobile. Web preview kiểm chứng nội dung và schema để Mobile sử dụng.
- Category catalog và Free/premium cần contract/quyền rõ; không tự thêm CRUD category hoặc tự cấp quyền truyện từ client.

## 2. Hiện trạng và khoảng trống phải xử lý

Baseline lập ngày 18/09; các mục asset, revision, preview và save-state được rà lại ngày 23/09 bằng mã nguồn. Đây là kiểm tra mã nguồn; chưa chạy lại test trong đợt lập kế hoạch này. Xem mục 10 để biết khoảng trống và thứ tự ưu tiên hiện hành.

| Hạng mục | Bằng chứng hiện có | Việc cần code tiếp |
| --- | --- | --- |
| Shared | AuthProvider, role guards, workspace, HTTP wrapper, query keys | Xác nhận auth thật, quyền thao tác và cấu hình production; không làm lại shell |
| C-01 | `ContentStoriesPage`, `StoryForm`, metadata và service list/create/update | Pagination/sort/filter trên URL; catalog từ API; field errors và dirty-state |
| C-02 | `AssetsPage`, `AssetPicker`, `assetService` đã có FormData/file, abort và retry | Mock chỉ đọc metadata, trả `/images/hero.webp`; cần giữ đúng file local qua refresh, picker trực quan, audio và kiểm chứng upload API thật |
| C-03 | `StoryPagesPage` thêm/sửa/xóa/reorder bằng ID; service/hook đã truyền revision | Kiểm chứng conflict/xóa có kiểm soát tham chiếu và bảo vệ form; narration hiện là text |
| C-04 | Roles/slots và service thêm/xóa slot, cập nhật role | Bổ sung cập nhật slot; chốt tọa độ/anchor/layer với Mobile, validation và quyền vai nhạy cảm |
| C-05/C-06 | Màn vocabulary/quiz; service thêm/xóa | Bổ sung sửa vocabulary/quiz, audio, validation và giữ đáp án đúng khi sửa options |
| C-07 | `StoryPageRenderer` đã render mọi role/slot theo page, sort layer, X/Y phần trăm; fixture nhiều role | Cần kiểm chứng tỷ lệ/anchor/kích thước với Mobile, lỗi tải media; bỏ fallback che tham chiếu asset hỏng |
| C-08/C-09 | Layout validate/publish/hide; mock revision/version snapshot | Chặn publish khi chưa lưu/đang lưu; conflict cho mọi mutation; lỗi dẫn về field; kiểm chứng snapshot với API thật |
| C-10 | Statistics 7/30 ngày, aggregate query và partial warning | Chốt định nghĩa chỉ số/timezone; empty/null/error và dữ liệu thực |
| Test | `tests/g3.spec.js` có luồng tạo nội dung/publish và preview seed | Bổ sung race/conflict/dirty/multi-role/upload và kiểm thử tích hợp |

Service dùng JSON cho nội dung và FormData cho upload, mock trực tiếp qua `mockRequest`; cần kiểm tra cấu hình mode tại HTTP boundary khi tích hợp. MSW, React Hook Form, Zod và Vitest trong kế hoạch tổng thể chưa có trong package hiện tại. Chỉ bổ sung theo ticket shared thống nhất; không giả định đã dùng MSW hoặc phải viết lại tất cả form ngay.

## 3. Routes và phân quyền

| Route | Mục đích |
| --- | --- |
| `/content` | Tổng quan công việc; ưu tiên link đến draft và kho truyện |
| `/content/stories` | Search/category/status/sort/pagination, query params giữ sau refresh |
| `/content/stories/new` | Tạo metadata tối thiểu, server cấp ID rồi chuyển editor |
| `/content/stories/:storyId` | Sửa metadata, cover/category và thông tin version |
| `/content/stories/:storyId/pages` | CRUD/reorder trang, background, text, narration |
| `/content/stories/:storyId/roles` | Vai, default asset, custom character, sensitive flag và slots |
| `/content/stories/:storyId/vocabulary` | CRUD từ/nghĩa/audio theo page ID |
| `/content/stories/:storyId/quizzes` | CRUD câu hỏi/options/đáp án/feedback/audio |
| `/content/stories/:storyId/preview` | Preview draft đã lưu, kiểm tra và publish |
| `/content/assets` | Tìm/chọn/upload asset |
| `/content/statistics` | Số liệu nội dung theo thời gian |

Role hiện tại là `content_manager`. Quyền đọc/sửa/publish/hide/upload/statistics phải map tập trung theo contract. Nếu Backend chỉ hỗ trợ role, dùng mapping tĩnh tại một chỗ; không tự tạo permission framework. Parent/Admin không tự kế thừa quyền authoring. Backend quyết định Content Manager được sửa mọi template hay chỉ template được giao; mock phải ghi rõ giả định này.

## 4. Model và contract cần chốt trước khi mở rộng editor

Các tên dưới đây là model frontend đề xuất, adapter ánh xạ sang Backend; không phải schema API đã được xác nhận.

| Model | Dữ liệu tối thiểu và quy tắc |
| --- | --- |
| Story draft | ID, title, description, category ID, cover asset ID, revision, visibility, published version ID, updatedAt; Free/premium theo catalog được cấp quyền |
| Page | ID ổn định, thứ tự, text/title, background asset ID, narration audio/segments nếu hỗ trợ |
| Role | ID, name, default asset ID, cho phép nhân vật tùy chỉnh, sensitive flag |
| Slot | ID, page ID, role ID, X/Y/scale/flip; anchor/layer/canvas theo schema chung |
| Vocabulary | ID, page ID, word, meaning, audio reference |
| Quiz | ID, page ID nếu nghiệp vụ có, question, options, đúng một đáp án, feedback/audio |
| Asset | ID, kind, MIME, size, URL/expiry, dimensions hoặc duration, processing status nếu có |
| Published version | ID/version number, revision nguồn, publishedAt, snapshot bất biến do server giữ |
| Validation issue | Code/message, tab, entity ID và field path để điều hướng/focus đúng lỗi |

Tách ba khái niệm: **form chưa lưu**, **draft đã lưu nhưng chưa publish**, **visibility/version đang phát hành**. `draftDirty` của mock là thay đổi chưa publish, không thay thế dirty-state của form.

### Bảng contract với Backend/Mobile

| Nhóm | Cần thống nhất | Phụ thuộc |
| --- | --- | --- |
| Story list/detail | Pagination, filter/sort, catalog ID, shape detail và ownership | M1 |
| Save/delete/reorder | Expected revision hoặc ETag, revision mới, lỗi conflict; reorder nguyên tử; delete cascade hay reject khi còn tham chiếu | M2 |
| Slot/canvas | Đơn vị X/Y, origin, anchor, bounds, scale/flip/layer, aspect ratio và cách fit background | M2/M3 |
| Vocabulary/quiz | PATCH theo ID, field/audio bắt buộc, options và correct answer mapping | M3 |
| Assets | List/detail/filter, upload multipart hay presigned, MIME/size, progress/cancel, finalize/processing và URL hết hạn | M1/M3 |
| Preview/validate | Payload đúng revision, toàn bộ role/slot/media, issue paths; validate không thay draft | M3/M4 |
| Publish/hide/version | Publish nguyên tử validate + snapshot, concurrency, chống gửi trùng, visibility sau hide và truyện đã tạo trước đó | M4 |
| Statistics | Generated/reads/completed/active readers, mẫu số completion rate, timezone và phạm vi quyền | M5 |

Service hiện dùng `/content/stories/...`, còn PROJECT_SUMMARY đề xuất `/story-templates/...` và vocabulary/slots theo page. Chốt đường dẫn thật rồi sửa adapter/service; không ép Backend theo mock. Service hiện trả full story sau nhiều mutation; nếu Backend trả entity hoặc 204 thì hook phải cập nhật/invalidate tương ứng, không ghi entity nhỏ đè story cache.

Không hardcode giới hạn mock như 5MB, số trang/slot thành quy tắc chính thức. Không tự xem cờ sensitive là Parent đã duyệt: Content chỉ cấu hình vai, quyền dùng nhân vật do workflow Parent/Backend quyết định.

## 5. Cấu trúc code triển khai

Giữ các page/layout đang có; bổ sung file khi ticket thực sự cần:

```text
src/features/content/
  models.js                         # JSDoc và shape nội bộ
  schemas/                          # metadata/page/role/slot/vocabulary/quiz
  services/contentService.js        # contract adapter; chia khi quá lớn
  services/assetService.js          # upload transport nếu cần tách
  hooks/useStoryEditor.js           # query/mutation, revision và invalidation
  hooks/useEditorSaveState.js       # dirty/pending/error, bảo vệ rời trang
  components/AssetPicker.jsx
  components/StoryPageRenderer.jsx  # canvas dùng chung trong editor/preview
  components/PublishIssues.jsx      # điều hướng đến entity/field lỗi
  layouts/StoryEditorLayout.jsx
  pages/                            # hoàn thiện các file hiện có
```

- Query keys chứa user/story/filter; hook hiện đã invalidate list và preview sau mutation. Cần kiểm chứng preview đúng revision và không bị response cũ ghi đè.
- Server state ở Query; local form state độc lập, không reset khi refetch nền nếu đang dirty. Đổi story ID phải reset đúng phạm vi.
- Mỗi story chỉ một mutation ghi đang chạy; khóa hoặc xếp hàng rõ ràng. Response cũ không được ghi đè input mới hay revision mới.
- Dùng Save tường minh. Lỗi mạng giữ input; mutation không rõ đã thành công thì đối chiếu revision trước retry, không tự replay publish/upload finalize.
- Chặn chuyển tab/route và cảnh báo đóng tab khi dirty; chọn cơ chế phù hợp router hiện tại. Có lựa chọn lưu, bỏ thay đổi hoặc ở lại.
- Publish chỉ chạy trên draft đã lưu, không có mutation pending. Validate thành công ở revision cũ hết hiệu lực sau save; server luôn validate lại trong transaction publish.
- Không optimistic publish/hide/delete. Conflict giữ input, giải thích thay đổi và cho tải bản mới; không tự ghi đè hoặc merge mù.
- Upload cần transport gửi file thật; không dùng JSON serialization cho FormData. Nếu không đo được tiến độ, hiển thị trạng thái đang tải thay vì phần trăm giả. Hủy upload không đồng nghĩa asset đã bị xóa trên server.

## 6. Milestone và ước lượng phần việc còn lại

Ước lượng cho một Frontend developer, bao gồm code và test module, giả định shared nền tảng dùng được và Backend phản hồi đều. Đây là phần hoàn thiện sau audit, **không cộng thêm máy móc vào 47–65 ngày của kế hoạch tổng thể**. Thời gian chờ API và sửa shared ngoài phạm vi chưa tính; hiệu chỉnh sau M1.

| Mốc | Nội dung | Phụ thuộc | Ngày công | Điều kiện đạt |
| --- | --- | --- | --- | --- |
| M0 | Chốt model/contract; fixture nhiều trang/nhiều role; spike canvas | BE/Mobile review | 1–2 | Schema và giả định được ghi rõ; thống nhất preview mẫu |
| M1 | List/metadata/catalog; asset picker và upload thật tối thiểu | M0, upload/auth contract | 3–4 | Tạo/sửa/refresh draft, filter/pagination đúng; file tải thật và dùng được |
| M2 | Save-state/revision; pages/roles/slots; reorder/delete an toàn | M1, mutation/canvas contract | 4–5 | Không mất input/ghi đè; tọa độ hợp lệ; mọi mutation có conflict handling |
| M3 | Sửa vocabulary/quiz; audio; renderer/preview đầy đủ | M2, media payload | 3–4 | Nhiều role hiện đồng thời; content học tập/media kiểm chứng được |
| M4 | Validate/publish/hide/version; tích hợp Mobile snapshot | M3, publish/version API | 3–4 | Publish tạo version bất biến; lỗi trỏ đúng field; GeneratedStory cũ không đổi |
| M5 | Statistics/dashboard tối thiểu; QA và staging | M4, tracking aggregate | 2–3 | Chỉ số đúng, E2E và responsive/a11y đạt, API mode rõ |

Tổng **16–22 ngày công**, dự phòng 20–25% khoảng **20–28 ngày công**. M1/M2 tương ứng hoàn thiện G2/G3, asset nâng cao gắn G5, statistics gắn G6. Không chờ xong toàn bộ Content mới chuyển sang Parent/Admin nếu lịch nhóm cần xen kẽ.

### Backlog code theo ticket

Mỗi ticket khoảng 0,5–2 ngày; thời gian nằm trong milestone ở trên. Ticket lớn hơn phải tách trước khi đưa vào sprint.

| Ticket | Mốc / map | Kết quả bàn giao | Phụ thuộc |
| --- | --- | --- | --- |
| CM-001 | M0 / C-01–09 | Model/JSDoc, ma trận contract/ownership, fixture có lỗi và nhiều role | Review BE/Mobile |
| CM-002 | M0 / C-04/07 | Spike renderer, tọa độ và fixture đối chiếu Mobile | CM-001 |
| CM-003 | M1 / C-01 | List pagination/filter/sort trên URL; adapter response | CM-001 |
| CM-004 | M1 / C-01 | Metadata/category/cover, field errors và draft redirect | CM-003 |
| CM-005 | M1 / C-02 | Upload bytes, validate MIME/size, cancel/retry, trạng thái thật | Upload contract |
| CM-006 | M1 / C-02 | AssetPicker và query/filter/cache dùng chung | Asset contract/fixture; không chờ CM-005 tích hợp thật |
| CM-007 | M2 / C-09 | Dirty-state, save trạng thái, route guard và mutation coordination | CM-004 |
| CM-008 | M2 / C-03/09 | Revision/ETag, conflict, invalidation và giữ input khi lỗi | CM-007 |
| CM-009 | M2 / C-03 | Pages CRUD/reorder/delete có reference checks | CM-008 |
| CM-010 | M2 / C-04 | Role/slot CRUD đầy đủ, tọa độ số/flags/default assets | CM-002/006/008 |
| CM-011 | M3 / C-05 | Vocabulary edit + page link + audio/error | CM-009, media contract |
| CM-012 | M3 / C-06 | Quiz edit/options/correct answer/feedback/audio | CM-009, media contract |
| CM-013 | M3 / C-07 | Renderer mọi role/slot, đúng tỷ lệ, missing asset và preview fresh | CM-010/011/012 |
| CM-014 | M4 / C-08 | Validation issues dẫn tab/entity/field và focus | CM-013 |
| CM-015 | M4 / C-08/09 | Publish gating/conflict/chống gửi trùng, version/hide UI | CM-014, API version |
| CM-016 | M4 / C-09 | Integration version N/N+1, snapshot cũ và lỗi mạng | CM-015, BE/Mobile seed |
| CM-017 | M5 / C-10 | Statistics/overview đúng định nghĩa, empty/null/partial errors | Aggregate contract |
| CM-018 | M5 / toàn bộ | E2E hồi quy, keyboard/axe/responsive, staging evidence | Các ticket trên |

Test hành vi quan trọng đi cùng từng ticket; CM-018 dành cho luồng liên module và release, không dồn toàn bộ test về cuối. Đợt frontend hiện tại ưu tiên F0–F5 tại mục 10; CM-005 upload thật không chặn dựng editor bằng asset local.

## 7. Validation, preview và vòng đời publish

1. Metadata kiểm tra field bắt buộc theo schema; ID category/asset phải còn truy cập được.
2. Pages không được có ID trùng/thứ tự mơ hồ; reorder giữ ID và liên kết vocabulary/slots. Xóa page phải mô tả tác động thật theo contract, gồm cả vocabulary/quiz nếu liên quan.
3. Slots tham chiếu page/role/asset tồn tại; X/Y/scale hữu hạn và trong miền đã chốt. Preview phản ánh anchor/layer/flip đúng, không lấy ảnh fallback đẹp để che lỗi thiếu asset.
4. Vocabulary kiểm tra word/meaning/page/audio theo contract. Không bắt buộc audio nếu nghiệp vụ chưa chốt.
5. Quiz có options hợp lệ và đúng một đáp án thuộc options hiện tại. Nếu dùng index, cập nhật đúng khi đổi thứ tự/xóa option; không tự đổi đáp án sang lựa chọn khác.
6. Preview hiển thị draft đã lưu và revision đang xem. Phát audio thật, highlight theo segment câu nếu dữ liệu có; thiếu timestamp phải ghi rõ khả năng preview, không giả lập đồng bộ.
7. Publish đợi lưu xong, server kiểm tra revision và nội dung rồi tạo snapshot mới nguyên tử. Nếu timeout, tải trạng thái/version để xác định kết quả trước khi gửi lại.
8. Sửa draft sau publish không đổi version đang phát hành. Hide thay đổi khả năng xuất hiện trong catalog theo server; tác động tới GeneratedStory đã có phải được xác nhận, không tự xóa chúng.

## 8. Kiểm thử và Definition of Done

| Mốc | Happy path | Case bắt buộc |
| --- | --- | --- |
| M1 | Tạo draft → upload file → chọn cover → refresh | Sai MIME/size, upload lỗi/hủy, catalog lỗi, 403/404, pagination/filter deep link |
| M2 | Sửa page → reorder → sửa role/slot → lưu | Hai tab conflict, response chậm, đổi story/tab khi dirty, xóa page còn tham chiếu, save lỗi giữ input |
| M3 | Sửa vocabulary/quiz → preview nhiều trang/role → nghe audio | Xóa option đúng, audio lỗi, asset thiếu, preview cache cũ, scale/flip/anchor và resize |
| M4 | Validate → publish N → sửa draft → publish N+1 → hide | Publish khi dirty/pending, validation focus, revision conflict, double click/timeout, snapshot N không đổi |
| M5 | Đổi range → xem số liệu → logout/login khác account | Range sai, no data/null, partial failure, dữ liệu account cũ, session hết hạn, role bị thu hồi |

- Tiếp tục Playwright hiện có: `tests/g2.spec.js`, `tests/g3.spec.js`, `tests/g5.spec.js`, `tests/g6.spec.js`, `tests/g7.spec.js`; thêm spec Content chuyên biệt khi cần để tránh test dài phụ thuộc nhau.
- Unit/component cho validation, correct answer mapping, save/revision và renderer; nếu thêm Vitest dùng `test:unit`, giữ `npm test` là Playwright.
- Fixture/reset riêng cho E2E mutation; mock lỗi/conflict phải tái lập được. Nếu chuyển sang MSW, thực hiện tại shared HTTP boundary và kiểm tra hồi quy ba role.
- Mỗi milestone chạy `npm run lint`, `npm run build` và test liên quan; release chạy regression public/auth/ba role và kiểm tra deep-link refresh.
- Kiểm tra editor ở desktop/laptop và màn hẹp, không mất nút lưu; keyboard focus/label/dialog và axe cho luồng chính.
- API thật phải chứng minh ownership, revision, publish snapshot và upload download được. Mock test không chứng minh Backend bảo vệ quyền.
- Build staging/production phải bật API thật rõ ràng; phát hiện thiếu cấu hình thay vì âm thầm dùng mock. Cookie/CORS/CSRF theo auth contract shared.

Mỗi ticket theo **Backlog → Ready → In progress → Review → Done**, kèm ba cột độc lập **Mock complete / API integrated / Verified on staging**. Hiện chưa đánh dấu hoàn thành thêm ticket nào từ việc chỉ đọc code.

## 9. Quyết định còn mở và cách tiếp tục

| Quyết định | Cần trước | Có thể làm khi chờ |
| --- | --- | --- |
| Quyền sửa template và quyền publish/hide | API integration | Mapping role hiện tại, fixture 403 và scope giả định được ghi rõ |
| Draft revision, delete cascade, response mutation | M2 | Save-state/component tests với contract nháp |
| Canvas/anchor/layer/aspect ratio | Nghiệm thu CM-010/013 với Mobile | Dựng khung F0–F5 bằng quy ước frontend tạm trong contract; chưa chốt fidelity Mobile hoặc công cụ canvas nâng cao |
| Audio upload/narration segments | M3 | CRUD text, media adapter và UI loading/error |
| Category/Free/premium ownership | Metadata/catalog thật | Catalog read-only bằng fixture; không thêm trang quản trị tùy tiện |
| Hide/republish và GeneratedStory cũ | M4 | Version UI và fixture bất biến; tích hợp vẫn pending |
| Định nghĩa statistics | M5 | Bảng/empty/error, chưa gán ý nghĩa chỉ số chưa thống nhất |

Nếu thiếu thời gian, hoãn autosave, drag/drop, bulk action, chart và dashboard nâng cao trước. Giữ upload thật tối thiểu, editor CRUD, bảo vệ draft/revision, preview đúng, publish/version và kiểm thử phân quyền. Không đánh dấu role Content Manager hoàn thành nếu luồng chính vẫn chỉ chạy mock.

## 10. Đợt ưu tiên: bộ công cụ dựng truyện trên frontend (23/09/2026)

### Kết quả cần đạt và giới hạn

**Có thể triển khai trước Backend:** Content Manager tạo một truyện mẫu, đưa ảnh của mình vào kho, chọn cover/background/nhân vật, dựng nhiều trang, đặt vai vào từng trang, lưu và xem lại đúng nội dung sau refresh trong cùng trình duyệt. Đây là công cụ authoring hoạt động với mock, chưa phải truyện đã phát hành cho Mobile.

“Xây dựng asset” trong đợt này nghĩa là nhập file có sẵn, xem trước, phân loại và gắn vào truyện. Chưa gồm vẽ ảnh, AI sinh ảnh, xóa nền, chỉnh sửa ảnh, tạo giọng đọc hoặc một editor kiểu Canva. Asset nhân vật nên dùng ảnh có nền trong suốt; frontend không tự tách nền. Audio làm sau luồng ảnh, tận dụng cùng picker/adapter khi contract sẵn sàng.

### Bố cục và thao tác

- Giữ route/tab hiện có. Trong tab Pages: danh sách trang bên trái, vùng xem trang ở giữa, form thuộc tính bên phải; laptop hẹp chuyển thuộc tính xuống dưới, luôn truy cập được nút lưu.
- Thanh trên có tên truyện, revision, trạng thái lưu, Lưu và Xem trước. Hiển thị rõ chế độ demo local và giới hạn lưu trên thiết bị.
- Kho asset và hộp chọn asset dùng chung: thumbnail, tên, loại file, công dụng, tìm kiếm, bộ lọc, trạng thái rỗng/lỗi, xem chi tiết và chọn. Mở picker từ cover/background/default asset của role và quay lại đúng form.
- Vùng trang cho phép chọn slot để sửa bằng form X/Y/scale/flip/layer. Danh sách lớp sắp theo layer; nút lên/xuống cập nhật thứ tự xác định. Chưa kéo thả/resize trực tiếp ở đợt đầu.
- Phân biệt **xem thử form chưa lưu** ngay trong editor và route **Preview draft đã lưu**. Cả hai dùng `StoryPageRenderer`; preview chưa lưu không sửa query cache và không được dùng để publish.

### Nền tảng tận dụng và phần thiếu

Audit mã nguồn ngày 23/09 cho thấy đã có `models.js`, `AssetPicker`, `assetService`, `StoryPageRenderer`, mutation scope theo story, invalidate preview và dirty guard cho metadata. Có `tests/content-contract.spec.js` và `tests/content-save-state.spec.js`; đợt lập kế hoạch này chưa chạy lại test nên không đánh dấu chúng đã pass.

Khoảng trống chính: mock upload bỏ qua bytes và trả ảnh cố định; picker dùng select và ảnh fallback; renderer dùng kích thước slot CSS có `min-width`, chưa xử lý anchor khác tâm hoặc lỗi tải URL. Service chưa có PATCH slot/vocabulary/quiz. Dirty-state chưa được chứng minh cho mọi form; guard link hiện tại chưa đủ chứng minh chặn Back/sidebar/mọi chuyển route. Vì vậy không làm lại shell hoặc coi nền hiện tại đã hoàn thiện.

Luồng dữ liệu: **UI → hooks → content/asset service → mock hoặc real adapter**. Không đọc IndexedDB hay gọi endpoint trực tiếp trong component. Giữ mock boundary hiện tại; chưa cần thêm MSW, thư viện canvas hoặc đổi toàn bộ form stack.

### Backlog thực hiện theo thứ tự

Các ticket F dưới đây là phân rã ưu tiên từ CM, chưa triển khai trong lần cập nhật tài liệu này. Mỗi ticket lớn chia nhỏ thành phần việc tối đa hai ngày trước khi code.

| Ticket | Kết quả và tiêu chí đạt | Map / phụ thuộc | Ngày công |
| --- | --- | --- | --- |
| F0 | Rà baseline, cố định fixture 3 trang/2 role, quy ước canvas tạm và adapter; lưu ảnh đối chiếu để kiểm tra resize | CM-001/002; không chờ API | 0,5–1 |
| F1 | Local asset store lưu Blob bằng IndexedDB, metadata/ID ổn định; upload đúng ảnh, refresh vẫn mở được, reset demo dọn dữ liệu; lỗi quota/hủy giữ file và không báo thành công giả | CM-005 phần mock; F0 | 1,5–2 |
| F2 | Nâng AssetPicker thành hộp chọn có thumbnail, search/filter, chi tiết; chọn cover/background/role đúng ID, giữ lựa chọn khi lọc, thiếu asset có lỗi rõ | CM-004/006; F1 | 1–2 |
| F3 | Workspace Pages có danh sách + renderer + thuộc tính; thêm/sửa/reorder/xóa có reference check; Save và dirty guard cho page, input không mất khi lỗi | CM-007/008/009; F2 | 2–3 |
| F4 | Role/slot CRUD gồm PATCH slot; chọn slot, sửa số/flip/layer, ảnh mặc định; resize giữ bố cục, nhiều role trên một trang | CM-010/013; F3 | 2–3 |
| F5 | Preview draft đúng revision, danh sách lỗi đi tới page/slot/field; demo xuyên luồng, kiểm tra refresh/dirty/conflict/ảnh hỏng và responsive | CM-013/014/018 phần frontend; F4 | 1–2 |

Ước lượng **8–13 ngày công**, dự phòng khoảng **10–16 ngày** cho một frontend developer. Đây là ước lượng riêng cho khung frontend từ code hiện có, có thể hiệu chỉnh sau F0; không cộng nguyên khối vào 16–22 ngày M0–M5 hoặc 47–65 ngày Web. Phần local Blob store phát sinh cần cập nhật lại ước lượng tích hợp sau đợt này.

Mốc demo sớm sau F2: nhập ảnh thật ở local → chọn làm cover/background → refresh còn đúng ảnh. Mốc demo khung sau F5: truyện 3 trang, 2 role, ít nhất một trang có nhiều slot; reorder không mất liên kết, lưu và preview đúng, thiếu asset báo lỗi thay vì đổi ảnh khác.

### Lưu local và đường chuyển sang API

- Chỉ bật local asset store trong mock/dev. Lưu Blob theo asset ID với namespace tài khoản demo; metadata tham chiếu cùng ID. Tạo object URL khi đọc, thu hồi khi không còn người dùng; không lưu chuỗi `blob:` vào draft/snapshot hoặc giả lập URL dùng được trên Mobile.
- Dùng mock database hiện tại cho draft demo; adapter phải có rollback/cleanup nếu ghi metadata và Blob không thành công đồng bộ. Reset demo xóa cả hai; xử lý mất Blob hoặc quota bằng trạng thái lỗi có thể khôi phục/chọn lại.
- Real mode không âm thầm fallback local. Giữ multipart hiện có hoặc đổi sang presigned theo Backend; chỉ nhận asset sẵn sàng khi server hoàn tất. Backend quyết định MIME/size/ownership, giới hạn 5MB hiện tại chỉ là cấu hình prototype cần xác nhận.
- Không tự chuyển draft/asset demo lên production. Dữ liệu kiểm thử tích hợp được tạo qua API thật; nếu cần migration local sau này, lập ticket riêng.
- Publish mock hiện có chỉ phục vụ kiểm tra version. Nghiệm thu upload tải lại được, phân quyền, revision nguyên tử, snapshot và bố cục Mobile vẫn nằm ở M1–M4.

### Kiểm chứng trước khi nhận khung

Chạy lint/build và các Playwright spec Content liên quan sau khi code. Bổ sung test upload hai ảnh khác nhau rồi refresh, missing Blob/URL, picker giữ selection, reorder giữ page ID, PATCH slot, preview nhiều role, save lỗi/conflict giữ input và rời trang dirty bằng tab/sidebar/Back. Kiểm tra bằng bàn phím và laptop/màn hẹp; không yêu cầu viết test mới cho lần chỉ chỉnh tài liệu này.

Sau F5, tiếp tục sửa vocabulary/quiz, audio theo contract, publish/version với API rồi statistics. Trạng thái bàn giao chỉ là **Frontend/mock complete** sau khi đạt tiêu chí; `API integrated` và `Verified on staging` vẫn theo dõi riêng.
