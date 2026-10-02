r SketchTale — Kế hoạch code cho Content Manager

> Ngày lập: 18/09/2026.
> Cập nhật 23/09/2026: ưu tiên bộ công cụ frontend dựng truyện và quản lý asset. Mục 10 là thứ tự thực hiện hiện hành cho đợt frontend; M0–M5 vẫn là mốc hoàn thiện/tích hợp toàn module.
> Phạm vi: Web Frontend, một lập trình viên; phối hợp Backend và Mobile về contract, media và preview.
> Scope cập nhật 29/09/2026: nội dung phục vụ trẻ 6–10 tuổi; Child có account riêng và có thể tự đăng ký/đăng nhập. Content Manager vẫn chỉ cấu hình template/role/asset; quan hệ Parent–Child và quyền sử dụng nhân vật do Auth/Backend/Parent workflow quyết định.
> Cập nhật 30/09/2026: mục 11–15 bổ sung audit code, chuẩn thiết kế, đặc tả UI/UX cho đủ 11 trang và backlog nghiệm thu. Hiện trạng tại mục 11 thay thế các nhận định kỹ thuật cũ nếu khác biệt; mục 10 giữ vai trò lịch sử ưu tiên F0–F5, mục 14 là thứ tự hoàn thiện tiếp theo. Đây là cập nhật kế hoạch, chưa triển khai hoặc nghiệm thu giao diện.
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

## 11. Audit cập nhật và phạm vi hoàn thiện từng trang — 30/09/2026

Mục này dựa trên việc đọc mã nguồn trong working tree hiện tại, bao gồm thay đổi đang làm dở. Chưa chạy ứng dụng, chụp màn hình hay chạy test trong lần lập kế hoạch này; nhận định về bố cục là từ JSX/CSS, chưa phải đánh giá hình ảnh thực tế. Không ghi đè các thay đổi đang có của các role khác.

| Khu vực | Đã thấy trong code | Phần còn phải hoàn thiện/kiểm chứng |
| --- | --- | --- |
| Tổng quan | `/content` dùng `RoleOverviewPage`, các link module và nội dung giới thiệu kỹ thuật | Chuyển sang tổng quan công việc thực tế; không hiển thị thông tin route guard/backlog cho người dùng |
| Kho truyện | Search/category/status/sort/pagination đã dùng URL | Chuẩn hóa nhãn, xử lý query sai, lỗi category/ảnh độc lập; bỏ fallback ảnh `/images/hero.webp` cho cover thiếu |
| Kho tư liệu | `assetService` kết hợp `localAssetStore` lưu Blob trong IndexedDB | Kiểm tra refresh, quota, hủy muộn, cleanup; audio chưa có luồng upload tương đương ảnh |
| Chọn tư liệu | Có search, select, thumbnail và giữ asset được chọn khi lọc | Chưa là dialog hoàn chỉnh; danh sách thumbnail giới hạn 8; chưa chặn đầy đủ asset hỏng/không sẵn sàng |
| Trang truyện | Có workspace, renderer và form sửa slot | Hoàn thiện lựa chọn trang/slot, lưu nhiều form, reference checks, bố cục laptop và trạng thái lỗi |
| Service nội dung | Đã có `updateSlot`, `updateVocabulary`, `updateQuiz` bằng PATCH | Không tạo lại service này; kiểm chứng mock/API, input validation và phản hồi mutation |
| Dirty state | Có hook dùng chung, cảnh báo đóng tab và guard một số link/sidebar | Chưa chứng minh Back/Forward, điều hướng bằng code và nhiều form cùng dirty. Vocabulary so với form rỗng gây dirty ngay khi mở sửa; quiz chưa tính audio/correctIndex trong biểu thức dirty |
| Preview | Renderer chung có xử lý ảnh lỗi; route có điều hướng trang | Kiểm tra revision, lỗi asset query, audio và nội dung học tập; không tuyên bố giống Mobile khi chưa đối chiếu |
| Kiểm tra/xuất bản | Có mutation scope và thao tác trong editor shell | Publish gating mọi form/pending; thay confirm rời rạc; issue link hiện cùng trỏ `#story-editor-properties-text`, chưa đúng entity/field |
| Thống kê | Có range 7/30 ngày, summary, top story, trend và partial warnings | Normalize range; phân biệt 0/null/không tải được; bảng thay thế biểu đồ, định nghĩa số liệu và drill-down |

Phạm vi giao diện gồm **11 route** trong mục 3, cộng editor shell, AssetPicker, dialog xác nhận, danh sách lỗi và panel phiên bản. Không thêm trang CRUD category, quản lý tài khoản trẻ, duyệt nhân vật của Parent, xóa/ghi đè bytes asset, AI tạo nội dung hay editor kéo thả. Hồ sơ/đăng nhập tiếp tục dùng màn shared; chỉ kiểm thử điều hướng, hết phiên và quay lại Content.

## 12. Chuẩn UI/UX dùng chung

### 12.1. Định hướng thị giác và ngôn ngữ

**Workspace biên tập truyện cho người lớn, giữ nét thân thiện của SketchTale:** nền sáng, bề mặt trắng, vàng thương hiệu làm điểm nhấn, chữ tối và minh họa thật từ nội dung. Mật độ vừa đủ làm việc lâu; không dùng hero lớn trong dashboard, chuyển động trang trí hoặc lồng nhiều lớp card.

| Thành phần | Quyết định thiết kế và tiêu chí |
| --- | --- |
| Nền và màu | Kế thừa `src/styles/tokens.css`: vàng `#f7bd35`, chữ `#001050`, surface trắng. Workspace dùng nền trung tính đang có; bổ sung token trong scope Content, không đổi token toàn ứng dụng chỉ để sửa Content |
| Màu ngữ nghĩa | Thành công xanh lá, cảnh báo vàng đậm, lỗi đỏ, trung tính xám; luôn có chữ/icon. Không dùng đỏ cho trạng thái “Đã ẩn” thông thường; đỏ dành cho lỗi/xóa |
| Typography | Giữ Nunito Variable và Phosphor đang cài. H1 28–32px desktop/24px mobile; H2 20–24px; nội dung/input 14–16px; phụ chú 12–13px. Tránh chữ nghiệp vụ 10–11px như một số vùng hiện tại |
| Nhịp khoảng cách | Thang 4/8/12/16/24/32px; padding trang 24–32px desktop, 16px mobile; khoảng cách nhóm form 24px, label–input 8px |
| Hình khối | Input/button radius 10px; panel 12–16px; chip pill. Border nhẹ, shadow chỉ cho overlay/sticky cần phân lớp. Một panel cho một nhóm tác vụ |
| Nút và focus | Chiều cao mục tiêu 44px cho thao tác chạm, icon 18–20px; focus ring dễ thấy. Mỗi vùng tác vụ có một CTA chính; nút xóa tách khỏi nút lưu |
| Ảnh | Thumbnail cùng tỷ lệ theo ngữ cảnh, giữ chỗ trước khi tải; ảnh nhân vật `contain` trên nền caro nhẹ, ảnh bìa theo khung hiển thị. Thiếu/hỏng ảnh có placeholder trung tính và nhãn, không thay bằng ảnh truyện khác |
| Chuyển động | Chỉ phản hồi hover/focus, mở dialog và loading; 120–180ms, tôn trọng reduced motion. Không dịch chuyển hàng đang thao tác hoặc animate canvas liên tục |
| Nội dung chữ | Tiếng Việt nhất quán: Truyện mẫu, Bản nháp, Trang truyện, Vai & vị trí, Từ vựng, Câu hỏi, Xem trước, Xuất bản, Kho tư liệu. Giữ tên kỹ thuật trong mã nguồn; `Revision` có thể hiển thị “Bản lưu #…” |

Tương phản chữ thường mục tiêu tối thiểu 4,5:1; thành phần điều khiển/focus 3:1. Đây là tiêu chí QA của dự án, cần đo trên màu render thực, không xem tên token là bằng chứng đạt. Dùng chữ tối trên nút vàng.

### 12.2. Khung trang và responsive

- Giữ `WorkspaceLayout`, sidebar bốn mục Tổng quan / Truyện / Kho tư liệu / Hiệu quả; active state đúng khi vào route con. Có skip link, tiêu đề tài liệu và một H1 đúng trang.
- Trang danh sách/form giới hạn chiều rộng khoảng 1280px; workspace canvas có thể dùng hết phần nội dung. Header gồm breadcrumb, H1, mô tả một câu và CTA, không đẩy nội dung chính khỏi màn laptop.
- Từ 1280px viewport và đủ chỗ sau sidebar: Pages có ba cột khoảng 180–220px / `minmax(0,1fr)` / 280–320px. 1024–1279px: danh sách + canvas, thuộc tính xuống dưới. Sidebar thu gọn theo khả năng shared layout; không ép ba cột khi vùng giữa quá nhỏ.
- 768–1023px: hai cột khi đủ rộng, bảng có vùng cuộn riêng. Dưới 768px: một cột, bộ lọc có thể thu gọn, danh sách trang thành selector, dialog gần toàn màn hình. Giữ đầy đủ thao tác bằng form; không khóa editor chỉ vì màn nhỏ.
- Thanh lưu sticky trong editor không che field/focus; bù chiều cao và safe area. Không tạo nhiều thanh sticky chồng nhau; preview stage không chiếm toàn bộ chiều cao laptop.
- Kiểm tra tại 1440×900, 1366×768, 1024×768, 768×1024 và 390×844; smoke tại 320px và zoom 200%. Không cuộn ngang toàn trang; canvas giữ tỷ lệ, bảng được cuộn trong container có nhãn.

### 12.3. Trạng thái và hành vi bắt buộc

| Trạng thái | Cách thể hiện | Hành động khôi phục |
| --- | --- | --- |
| Tải lần đầu | Skeleton theo bố cục, giữ header/khung ổn định, thông báo loading cho assistive tech | Không hiện số 0 hoặc ảnh ngẫu nhiên trong lúc chờ |
| Refetch | Giữ dữ liệu trước đó với dấu đang cập nhật | Không reset form hoặc vị trí đang thao tác |
| Chưa có dữ liệu | Nêu việc tiếp theo, một CTA đúng ngữ cảnh | Tạo truyện/thêm trang/tải tư liệu |
| Không có kết quả lọc | Giữ bộ lọc, mô tả từ khóa/phạm vi | Xóa bộ lọc hoặc sửa tìm kiếm |
| Lỗi đọc toàn trang | Thông báo dễ hiểu, không lộ stack/API nội bộ | Thử lại, quay lại danh sách |
| Lỗi từng phần | Lỗi nằm ở vùng hỏng, vùng khác vẫn dùng được | Retry riêng vùng; khóa thao tác phụ thuộc vùng đó |
| Form không hợp lệ | Lỗi cạnh field, summary khi submit, focus field lỗi đầu | Giữ toàn bộ input và lựa chọn |
| Đang lưu / đã lưu | Nhãn văn bản cạnh thanh lưu, thành công có thời điểm | Chống gửi trùng; chỉ clean phần dữ liệu đã thực sự lưu |
| Save lỗi / conflict | Banner bền trong form; conflict giải thích có bản mới | Giữ input; cho xem/sao chép thay đổi trước khi xác nhận tải bản mới; không ghi đè ngầm |
| 403 / 404 / hết phiên | Tách không có quyền, không tồn tại, cần đăng nhập lại | Back phù hợp; returnTo nội bộ hợp lệ, không hứa tự phục hồi input sau đăng nhập nếu chưa có cơ chế |
| Media hỏng / chưa ready | Placeholder và tên tư liệu, lý do khả dụng | Thử tải lại hoặc chọn tư liệu khác; không cho chọn file chưa ready |

Mọi dialog có accessible name, focus trap, Escape khi có thể đóng, trả focus về nút mở. Toast chỉ báo kết quả ngắn; lỗi cần xử lý không được chỉ xuất hiện rồi biến mất. Search debounce khoảng 300ms, hủy/loại kết quả cũ; không đưa mỗi ký tự vào lịch sử Back.

### 12.4. Editor shell, lưu và các dialog

**Bố cục:** breadcrumb Kho truyện → tên truyện; tiêu đề + trạng thái phát hành; dòng bản lưu/thay đổi; sáu tab; nội dung tab; thanh lưu. Tên truyện dài được wrap tối đa hai dòng ở header, vẫn xem đủ bằng vùng thông tin; tab có cuộn riêng và active tab nhìn thấy ở mobile.

1. Phân biệt bằng chữ: “Chưa lưu thay đổi”, “Đã lưu bản nháp”, “Có thay đổi chưa xuất bản”, “Đang phát hành phiên bản N”, “Đã ẩn khỏi danh mục”. Không dùng một badge đại diện cho cả năm trạng thái.
2. Có coordinator theo `storyId` tổng hợp dirty/pending/error của từng form. Dirty so với baseline đã tải/lưu, không so với form rỗng khi edit; reset khi đổi entity phải qua guard. Không dùng boolean global làm nguồn duy nhất khi nhiều form cùng tồn tại.
3. Nút lưu ghi rõ phạm vi: “Lưu thông tin”, “Lưu trang”, “Lưu vị trí”. Nếu có nhiều form dirty, dialog rời trang liệt kê các phần và tuần tự lưu theo revision; một phần lỗi phải giữ lại và không điều hướng. Không giả định có endpoint lưu toàn bộ nguyên tử.
4. Dialog rời trang có “Ở lại”, “Bỏ thay đổi”, “Lưu rồi tiếp tục”; xử lý tab editor, sidebar, Back/Forward, link lỗi và điều hướng bằng code. Reload/đóng tab dùng cảnh báo native của trình duyệt. Lưu lỗi thì ở lại.
5. Mutation đang chờ phải khóa thao tác ghi xung đột; validation gắn story/revision, hết hiệu lực ngay sau save. Publish bị chặn nếu bất kỳ form dirty/pending, có lý do hiển thị ngoài tooltip.
6. Dialog xóa ghi rõ tên đối tượng và các liên kết bị ảnh hưởng. Nếu contract là reject thì hướng dẫn xử lý liên kết; nếu cascade đã được duyệt thì liệt kê tác động. Không tự thêm undo khi server không hỗ trợ khôi phục.
7. Dialog xuất bản hiển thị tên truyện, bản lưu nguồn và ý nghĩa tạo phiên bản mới; server kiểm tra lại. Timeout chuyển sang “Đang xác minh kết quả”, đọc version trước khi cho gửi lại. Dialog ẩn truyện giải thích phạm vi catalog theo contract đã xác nhận.
8. Panel “Phiên bản” trong editor hiển thị số phiên bản, ngày xuất bản và revision nguồn nếu dữ liệu có. Chưa thêm route, rollback, diff hoặc xem snapshot chi tiết nếu API không hỗ trợ.

## 13. Đặc tả hoàn thiện từng trang

Các tiêu chí dưới đây cộng với mục 12 và 15 là điều kiện nghiệm thu từng trang. Wireframe chỉ diễn đạt thứ tự và tỷ lệ; phải kiểm tra trên ứng dụng thật trước khi chốt giao diện.

### P01 — Tổng quan Content Manager · `/content`

**Mục tiêu:** biết việc cần làm và tiếp tục bản nháp nhanh. File hiện tại `src/features/workspace/pages/RoleOverviewPage.jsx`; dự kiến tách `ContentOverviewPage.jsx` để không đổi dashboard Admin.

- Bố cục: header “Tổng quan nội dung” + “Tạo truyện”; dải số liệu gọn nếu có aggregate; vùng chính “Tiếp tục biên tập” với tối đa 5 truyện mới cập nhật; vùng phụ link Kho tư liệu và Kho truyện. Không dùng banner giới thiệu workspace cao hàng trăm pixel.
- Mỗi truyện có cover, tên, trạng thái, cập nhật gần nhất và “Tiếp tục”; dẫn tới metadata hoặc tab đang chọn nếu có trạng thái điều hướng hợp lệ. “Xem tất cả bản nháp” mở kho truyện với bộ lọc URL.
- Số liệu dùng cùng định nghĩa với Statistics. Nếu aggregate chưa có, bàn giao danh sách công việc trước; không tính tổng từ một trang danh sách và không bịa “cần duyệt”/“sẵn sàng xuất bản”.
- Lỗi aggregate không che danh sách; chưa có truyện hiện lời dẫn hai bước Tạo truyện → Thêm trang. Mock mode có nhãn “Dữ liệu demo trên trình duyệt này”; real mode không hiện “Mock session”.
- **Nghiệm thu:** truyện vừa lưu xuất hiện sau invalidation; link bộ lọc đúng; account khác không thấy cache account trước; mobile hiển thị tác vụ tiếp tục trước các thông tin phụ.

### P02 — Kho truyện · `/content/stories`

**Mục tiêu:** tìm đúng truyện và hiểu tình trạng trước khi mở editor. Hoàn thiện `ContentStoriesPage.jsx`, không viết lại luồng URL đã có.

- Bố cục: header + Tạo truyện; một thanh search/category/status/sort; tổng kết quả; danh sách hàng có cover; pagination cuối. Dùng list làm mặc định, chưa thêm toggle grid nếu không có nhu cầu cụ thể.
- Mỗi hàng: cover khoảng 96×72, tên là link, mô tả tối đa hai dòng, category, số trang, ngày cập nhật, trạng thái phát hành và dấu có thay đổi chưa xuất bản khi response có. CTA “Mở biên tập”; không đặt xuất bản/xóa nhanh trong hàng.
- Giữ search/status/category/sort/page trên URL; đổi filter về trang 1. Normalize giá trị không hợp lệ, xử lý page vượt tổng sau dữ liệu đổi. Back từ editor khôi phục bộ lọc và vị trí đọc hợp lý.
- Category tải lỗi chỉ làm vùng category có retry; ảnh lỗi không làm mất hàng. Không xem count thiếu là 0: hiển thị “Chưa có dữ liệu”. Thumbnail không phụ thuộc tải toàn bộ kho asset khi API đã có URL cover.
- Mobile: cover nhỏ, phần chữ co giãn, bộ lọc xếp hai hàng hoặc mở sheet, CTA dễ chạm. Chuẩn hóa toàn bộ “story/category/publish” thành nhãn tiếng Việt.
- **Nghiệm thu:** refresh/deep link giữ lọc; không có kết quả khác chưa có truyện; tên dài không phá hàng; cover local mất Blob và URL hỏng đều hiện đúng lỗi; pagination dùng bàn phím được.

### P03 — Tạo truyện · `/content/stories/new`

**Mục tiêu:** tạo được bản nháp có ID với ít bước. Hoàn thiện `StoryEditorPage.jsx` và `StoryForm.jsx` dùng chung.

- Bố cục hai cột: thông tin bên trái, cover bên phải; một cột ở mobile. Field tên, mô tả, thể loại và cover theo schema; đánh dấu bắt buộc từ contract, không tự buộc nội dung dành cho publish ngay ở bước tạo draft.
- Cover có khung preview, “Chọn từ kho” và đường dẫn tải ảnh qua picker; tỷ lệ ảnh gốc có thông tin rõ, không ngầm crop bytes. Category lấy catalog, có loading/retry. Free/premium chỉ hiện nếu contract cho phép chỉnh.
- CTA “Tạo bản nháp”; phụ “Hủy”. Thành công chuyển tới metadata của ID được trả về, thông báo “Đã tạo bản nháp” và hướng dẫn “Thêm trang đầu tiên”. Đang tạo khóa gửi trùng; response mơ hồ không tự retry tạo mới.
- Khi hủy/Back với dữ liệu đã nhập dùng dirty guard; lỗi field/server giữ nội dung và cover đã chọn. Chọn asset không tự tạo truyện trước khi người dùng submit.
- **Nghiệm thu:** tạo xong refresh mở đúng ID/cover/category; lỗi catalog và upload không xóa form; bàn phím đi theo đúng thứ tự thị giác; không có bản nháp trùng do double click.

### P04 — Thông tin truyện · `/content/stories/:storyId`

**Mục tiêu:** sửa thông tin và biết draft khác gì với trạng thái phát hành. Hoàn thiện `StoryMetadataPage.jsx`, `StoryForm.jsx` và shell.

- Cột chính: tên, mô tả, category; cột phụ: cover và thông tin phát hành gọn. Panel phiên bản mở từ shell; tránh lặp cùng trạng thái ở nhiều card.
- “Lưu thông tin” và “Bỏ thay đổi” nằm gần form. Khi clean, không báo chưa lưu chỉ vì refetch hoặc mở form. Lưu thành công cập nhật baseline, thời điểm và revision; sửa tiếp trong lúc request chạy không được bị response cũ ghi đè.
- Cover thiếu và category đã bị gỡ phải giữ giá trị cũ để giải thích lỗi, yêu cầu chọn lại theo contract; không tự chọn mục đầu tiên. Preview cover dùng chung resolver với kho tư liệu.
- Khi truyện đã phát hành, có chú thích ngắn “Thay đổi này chỉ áp dụng sau lần xuất bản tiếp theo”; ẩn truyện là thao tác riêng với dialog.
- **Nghiệm thu:** save lỗi/409 giữ input; mở edit không tự dirty; bỏ thay đổi quay về baseline đúng; sửa draft không đổi snapshot đang phát hành; đường link từ lỗi metadata focus đúng field.

### P05 — Trang truyện · `/content/stories/:storyId/pages`

**Mục tiêu:** dựng từng trang, biết đang sửa đối tượng nào và thấy kết quả trực tiếp. Hoàn thiện `StoryPagesPage.jsx` và renderer hiện có.

```text
Danh sách trang     | Xem thử trang đang sửa           | Thuộc tính
01 thumbnail + tên | Nhãn bản xem thử + tỷ lệ         | Trang / Vị trí đã chọn
02 đang chọn       | Nền + mọi slot + lớp chữ         | Nội dung / tư liệu / số
+ Thêm trang       | Danh sách lớp, chọn đối tượng    | Lưu theo phạm vi
```

- Danh sách có số thứ tự, thumbnail, tên, dấu chưa lưu/lỗi và nút lên/xuống. Chọn bằng `pageId`; reorder cập nhật số thứ tự, không đổi ID hoặc mất liên kết. Tạo trang xong chọn trang mới và focus tiêu đề.
- Thuộc tính trang: tiêu đề, nội dung, background, narration text; audio/segments bổ sung khi contract sẵn sàng. Không gọi textarea narration là file giọng đọc. Background rỗng hiển thị rõ “Dùng ảnh bìa truyện” theo contract; ID nền hỏng là lỗi.
- Canvas dùng cùng `StoryPageRenderer`; nhãn “Xem thử thay đổi chưa lưu” khi có input local. Click slot và chọn trong danh sách lớp đều mở cùng form vị trí; chọn nền/vùng trống trả về thuộc tính trang. Không thêm kéo/thả/resize trực tiếp trong đợt này.
- Form vị trí gồm page, role tham chiếu, X/Y, scale, flip, layer và ảnh override nếu model hỗ trợ. Input có đơn vị, lỗi NaN/rỗng/ngoài miền; có giải thích tâm tọa độ. Unsupported anchor hiện lỗi, không tự render như center.
- Danh sách lớp có nút lên/xuống, thứ tự xác định kể cả layer trùng. Background nằm dưới, text overlay riêng; resize viewport không thay tọa độ hoặc kích thước tương đối của slot.
- Xóa trang liệt kê số slot/từ/câu hỏi tham chiếu theo dữ liệu/server; sau xóa chọn trang lân cận. Chuyển trang/slot, thêm mới hoặc reorder trong khi form dirty phải giữ dữ liệu hoặc qua guard.
- **Nghiệm thu:** fixture 3 trang/2 role, một trang nhiều slot; save page và slot nối tiếp đúng revision; reorder giữ tham chiếu; ảnh thiếu không bị che; ở 1366×768 nhìn được canvas và tiếp cận Save; màn nhỏ hoàn thành được CRUD bằng form.

### P06 — Vai & vị trí · `/content/stories/:storyId/roles`

**Mục tiêu:** quản lý vai dùng xuyên truyện và nơi vai xuất hiện. Hoàn thiện `StoryRolesPage.jsx`; không nhân đôi một canvas editor riêng.

- Bố cục master/detail: danh sách vai trái, thông tin vai phải. Mỗi vai có ảnh mặc định, tên, số vị trí và nhãn cấu hình. Tránh mở đồng thời tất cả form slot trong các card dài.
- Form vai: tên, tư liệu mặc định, cho phép nhân vật tùy chỉnh, cờ nhạy cảm với helper text. Nêu rõ đây là cấu hình template, không phải quyền Parent đã duyệt nhân vật.
- Bên dưới là bảng vị trí theo trang: tên trang, X/Y, scale, layer và “Sửa trên trang”. Link mở Pages, chọn đúng page/slot; hỗ trợ query như `pageId`/`slotId` qua mapping tập trung, không đổi route chính.
- “Thêm vị trí” chọn trang và thông số mặc định hợp lệ; chặn nếu chưa có trang kèm CTA tạo trang. Sửa slot dùng PATCH giữ ID; xóa vai có xác nhận tác động các slot theo contract.
- Mobile master/detail xếp dọc; ảnh trong suốt dùng nền caro, không cắt nhân vật. Số vị trí lấy từ dữ liệu thực, không giới hạn giả số lần một vai được xuất hiện.
- **Nghiệm thu:** đổi ảnh vai cập nhật đúng các slot dùng mặc định, không đè override; link sửa dẫn đúng slot sau reorder; flags không thay quyền người dùng; xóa/sửa lỗi giữ form và selection.

### P07 — Từ vựng · `/content/stories/:storyId/vocabulary`

**Mục tiêu:** biên tập từ theo ngữ cảnh, dễ tìm và nghe kiểm tra. Hoàn thiện `StoryVocabularyPage.jsx`, giữ service PATCH đã có.

- Header số từ + “Thêm từ”; thanh lọc trang và tìm từ; danh sách theo trang bên trái, form thêm/sửa bên phải hoặc dưới khi hẹp. Không luôn đặt form trống lớn trước danh sách.
- Mỗi hàng có từ/cụm từ, nghĩa, trang liên quan và trạng thái audio. Form có trang, từ, nghĩa và audio tùy chọn; hiển thị trích đoạn trang read-only giúp kiểm tra ngữ cảnh.
- Đang sửa hiển thị “Sửa từ: …”, baseline từ bản ghi đó; chuyển sang từ khác hoặc hủy khi dirty dùng guard. Không reset form về rỗng do refetch; sau lưu giữ selection và phản hồi rõ.
- Audio có play/pause/loading/error khi nguồn hỗ trợ; không hiện URL dài làm nội dung chính. Audio picker chỉ bật khi media contract sẵn sàng; nếu tạm dùng URL theo model hiện tại phải validate và thông báo lỗi phát thực tế.
- Không tự cấm trùng từ giữa các trang khi nghiệp vụ chưa quy định. Nếu phát hiện trùng trên cùng trang, có cảnh báo biên tập; chỉ chặn khi schema đã chốt. Thiếu trang hiển thị yêu cầu tạo trang, không render select vô nghĩa.
- **Nghiệm thu:** add/edit/delete theo ID; liên kết trang giữ sau reorder; mở sửa là clean, chỉ đổi audio vẫn dirty; lỗi save/âm thanh không xóa input; optional audio không chặn publish sai nghiệp vụ.

### P08 — Câu hỏi · `/content/stories/:storyId/quizzes`

**Mục tiêu:** biên tập câu hỏi và kiểm tra đáp án dễ hiểu. Hoàn thiện `StoryQuizPage.jsx` với form có ngữ cảnh và preview câu hỏi cục bộ.

- Danh sách câu hỏi có số thứ tự, trích câu hỏi, trang, số lựa chọn và nhãn thiếu dữ liệu. Một form đang hoạt động; header “Thêm câu hỏi” hoặc “Sửa câu hỏi”.
- Form gồm trang theo contract, câu hỏi, nhóm lựa chọn, một radio đánh dấu đáp án đúng, phản hồi và audio tùy chọn. Mỗi lựa chọn có label rõ; đáp án đúng có chữ/icon và màu, không chỉ viền xanh.
- Số lựa chọn lấy giới hạn schema. Code hiện tạo mặc định 3 lựa chọn; không coi đó là giới hạn chính thức. Chỉ thêm nút thêm/xóa/đổi thứ tự lựa chọn khi schema hỗ trợ; mọi thay đổi phải giữ đúng mapping đáp án.
- UI quản lý identity ổn định của lựa chọn; adapter ánh xạ sang `correctIndex` nếu API còn dùng index. Xóa lựa chọn đang đúng phải yêu cầu chọn lại, không tự chọn lựa chọn khác. Câu mới yêu cầu xác nhận đáp án, tránh vô tình mặc định đáp án đầu.
- Preview cục bộ cho thử chọn đáp án và xem feedback; ghi “Thử câu hỏi”, không ghi điểm, không gọi analytics và không biến thành reader Mobile. Reset kết quả thử khi nội dung thay đổi.
- Lỗi ở từng option/câu hỏi/đáp án; chỉ đổi correct answer/audio cũng phải dirty. Quiz vẫn optional theo contract hiện tại, nhưng đã có câu thì nội dung phải hợp lệ.
- **Nghiệm thu:** đáp án chính xác sau sửa/reorder/delete; mở sửa clean; thử câu hỏi không mutation; page bị gỡ không lặng lẽ chuyển về trang đầu; keyboard radio và errors hoạt động.

### P09 — Xem trước & xuất bản · `/content/stories/:storyId/preview`

**Mục tiêu:** kiểm tra bản đã lưu trước khi phát hành. Hoàn thiện `StoryPreviewPage.jsx`, `PublishIssues.jsx` và shell.

- Bố cục: điều hướng trang trái, stage giữa; thanh thông tin bản lưu, số trang, trước/sau; vùng nội dung học tập và audio bên dưới; vùng kết quả kiểm tra mở khi cần. Desktop tận dụng canvas, mobile selector trang + trước/sau.
- Hiển thị rõ “Xem trước bản nháp đã lưu #…”. Khi form chưa lưu ở nơi khác, yêu cầu lưu hoặc bỏ trước khi vào; không trộn input local vào query preview. Response preview lỗi không giả vờ hiển thị story cache như một preview đã xác minh.
- Dùng renderer chung cho đủ roles/slots/layers/text. Thiếu media chỉ lỗi vùng liên quan; có link về đúng page/slot. Stage 16:9 chỉ là quy ước frontend tạm, không ghi giao diện “chuẩn Mobile” khi chưa có review.
- Có xem từ vựng/câu hỏi theo trang và thử audio nếu dữ liệu hỗ trợ. Không autoplay; đổi trang dừng audio cũ. Có transcript/lời đọc; highlight chỉ khi có timestamp/segment thật.
- “Kiểm tra nội dung” trả nhóm lỗi theo Thông tin / Trang / Vai / Từ / Câu hỏi. Mỗi lỗi có câu mô tả, tên entity và “Đi tới lỗi”; mở đúng tab, chọn đúng entity rồi focus field. Không dùng một hash cố định cho mọi lỗi.
- Kiểm tra thành công hiện bản lưu đã kiểm tra và CTA xuất bản. Nếu server không phân biệt warning/error, không tự coi issue là warning; mọi nội dung lưu mới làm kết quả cũ hết hiệu lực.
- Xuất bản/ẩn dùng dialog mục 12.4. Sau thành công cập nhật version, visibility, list, preview và summary; thông báo phiên bản thực từ server. Truyện ẩn không được tự hiện lại chỉ vì sửa metadata; republish theo contract.
- **Nghiệm thu:** bản xem đúng revision mới sau save; lỗi dẫn đúng field sau reorder; không publish khi dirty/pending/conflict; double click/timeout không tạo version trùng; snapshot N giữ nguyên khi xuất bản N+1. Mock chứng minh UI, API thật chứng minh tính nguyên tử.

### P10 — Kho tư liệu · `/content/assets`

**Mục tiêu:** nhập, tìm, kiểm tra và chọn đúng ảnh/âm thanh. Hoàn thiện `AssetsPage.jsx`, `AssetPicker.jsx` và asset service đang có.

- Bố cục ưu tiên thư viện: header + “Tải tư liệu”; search/loại/công dụng khi metadata có; grid responsive 4/3/2/1 cột theo vùng khả dụng. Upload trong panel mở theo yêu cầu, không luôn chiếm phần lớn màn hình.
- Card ảnh có thumbnail, tên tối đa hai dòng, loại/kích thước và trạng thái ready/processing/failed. Card audio dùng icon/waveform đơn giản và player, không dùng thẻ `img`. Không hiện duration/dimensions giả khi thiếu metadata.
- Panel chi tiết: xem ảnh đầy đủ hoặc nghe audio, tên, MIME, dung lượng và kích thước/thời lượng nếu có. Chưa thêm xóa asset/thay bytes; API cleanup local không đồng nghĩa tính năng xóa tư liệu được phép mở cho người dùng.
- Upload từng file: chọn file → preview + metadata → tải → processing nếu server có → ready. Có hủy/thử lại, giữ file khi lỗi; dùng tiến độ vô định khi transport không đo được bytes. Không thêm upload hàng loạt vào scope đầu.
- Cho biết loại/giới hạn trước khi chọn; 5MB là cấu hình prototype cần BE xác nhận. Nhãn local chỉ trong mock; hết quota/mất Blob có lời giải thích và CTA tải lại thành asset ID mới.
- **AssetPicker dùng chung:** dialog có search/filter, danh sách, preview selection và footer “Hủy” / “Chọn tư liệu”. Lựa chọn tạm trong dialog chỉ cập nhật form khi xác nhận; hủy giữ giá trị cũ, filter không làm mất selection. Có pagination/load more thay vì chỉ 8 thumbnail.
- Picker nhận context cover/background/role/audio; MIME/kind/readiness quyết định chọn được, `usage` chỉ giúp lọc. Tư liệu đang chọn nhưng không hợp lệ được nêu lỗi, không được lách kiểm tra nhờ giữ selection.
- Cho tải file ngay trong picker rồi chọn khi ready, giữ nguyên story form và focus. Nút “Bỏ chọn” chỉ xuất hiện khi trường optional, mô tả chính xác “Dùng ảnh bìa”/“Không có audio”; bỏ nhãn mơ hồ “Tự chọn asset đầu tiên”.
- **Nghiệm thu:** upload hai ảnh khác nhau, refresh vẫn đúng bytes và ID; mất Blob/URL hết hạn/cancel response muộn có xử lý; filter và paging giữ selection; keyboard dialog đầy đủ; audio không hiển thị thumbnail ảnh lỗi; lỗi thư viện không xóa file đang chờ upload.

### P11 — Hiệu quả nội dung · `/content/statistics`

**Mục tiêu:** biết nội dung được sử dụng ra sao trong phạm vi được cấp. Hoàn thiện `ContentStatisticsPage.jsx`.

- Header + range 7/30 ngày; dòng phạm vi ngày/timezone/thời điểm cập nhật nếu API cung cấp; dải summary gọn; bảng truyện hiệu quả; xu hướng theo ngày. Không thêm custom range/export/chart library khi chưa có yêu cầu.
- Phân biệt số lượng truyện hiện tại với số sự kiện trong khoảng thời gian. Mỗi chỉ số có đơn vị và giải thích cách tính đã được Backend thống nhất; completion rate nêu mẫu số, không suy từ lượt đọc nếu không có dữ liệu tương ứng.
- Top truyện có tên link về editor, lượt đọc, tỷ lệ hoàn thành và trạng thái. Trend dùng bar hiện tại nếu dễ đọc; bổ sung nhãn ngày/giá trị và bảng dữ liệu tương đương, không dựa vào hover để biết số.
- Range trên URL được normalize; chuyển range giữ khung, ghi rõ đang tải dữ liệu mới, không gắn nhãn range mới vào số cũ như dữ liệu đã hoàn tất. Date/time theo timezone contract; chưa có thì đánh dấu quyết định còn mở.
- Giá trị 0 hiển thị 0; null là “Chưa có dữ liệu”; denominator 0 thì tỷ lệ “—” kèm giải thích. Lỗi từng section đặt tại section, retry không xóa phần thành công. Không dựng trend giả trong empty state.
- **Nghiệm thu:** refresh/range sai/switch nhanh không trộn kết quả; cùng dữ liệu cùng định nghĩa với Overview; bảng đọc được bằng bàn phím/screen reader; dữ liệu lớn không tràn; không lộ danh tính trẻ qua aggregate.

## 14. Backlog và thứ tự hoàn thiện hiện hành

Các ticket UX dưới đây là phân rã/hiệu chỉnh CM-001–018 và F0–F5 theo code ngày 30/09, **không phải một dự án cộng thêm nguyên khối vào 16–22 ngày cũ**. Phần F đã có code chuyển thành verify/fix. Tất cả ticket UX đang ở trạng thái **Planned**; chưa có ticket được nghiệm thu bằng lần sửa tài liệu này.

| Đợt / ticket | Sản phẩm bàn giao | Phụ thuộc / map | Ngày công FE dự kiến |
| --- | --- | --- | --- |
| A · UX-00 | Chạy baseline, ảnh chụp 11 route, fixture và danh sách gap theo viewport | M0, F0, CM-001/002 | 1–1,5 |
| A · UX-01 | Token Content, header, field/error, dialog, skeleton, chuẩn nhãn và responsive shell | UX-00; CM-018 | 1,5–2 |
| A · UX-02 | Coordinator dirty/pending, baseline form, guard mọi đường đi và conflict UI | UX-01; CM-007/008 | 2–3 |
| B · UX-03 | P10 thư viện/picker, verify local bytes, missing media, upload states | UX-01/02; F1/2, CM-005/006 | 2–3 |
| B · UX-04 | P02 kho truyện + P03 tạo + P04 metadata, URL/filter/cover/field errors | UX-02/03; CM-003/004 | 2–3 |
| C · UX-05 | P05 workspace trang, reference checks, selection, save và responsive | UX-02/03/04; F3/4, CM-009/013 | 2–3 |
| C · UX-06 | P06 vai/vị trí, link tới canvas, flags, layers và role media | UX-05; CM-010 | 1,5–2 |
| D · UX-07 | P07 từ vựng + P08 câu hỏi, baseline đúng, audio states/option mapping | UX-02/05; CM-011/012 | 2–3 |
| D · UX-08 | P09 preview, issue focus, publish/hide/version, timeout/conflict | UX-05/06/07; F5, CM-014/015/016 | 2–3 |
| E · UX-09 | P01 tổng quan công việc + P11 statistics, null/partial errors | UX-04/08; CM-017, aggregate contract | 1,5–2 |
| E · UX-10 | Hồi quy ba role, visual QA, keyboard/axe, staging evidence | Các ticket trên; CM-018 | 2–3 |

Ước lượng **19,5–28,5 ngày công FE**, làm tròn kế hoạch **20–29 ngày**, dự phòng khoảng **24–36 ngày** cho một người. Ước lượng mới bao gồm độ hoàn thiện UI/UX theo trang, sửa lỗi nền tảng đã nhận diện và kiểm chứng frontend; cần hiệu chỉnh sau UX-00. Không bao gồm thời gian chờ API, Backend/Mobile triển khai mới, hay toàn bộ phần việc integration chưa biết. Khi API sẵn sàng, kiểm chứng trong ticket tương ứng; phát sinh ngoài giả định tách ticket, không tuyên bố staging xong bằng mock.

Mỗi ticket lớn tách subtask tối đa 2 ngày: layout/state → behavior/integration → QA theo trang; người thực hiện vẫn là một FE, không giả định làm song song. Mốc demo:

1. **Sau B:** kho truyện → tạo draft → tải/chọn ảnh thật local → lưu/refresh; form và dialog hoàn chỉnh trên laptop/mobile.
2. **Sau C:** truyện 3 trang/2 vai → sửa vị trí → reorder → preview tại chỗ; giữ input khi lỗi và rời trang.
3. **Sau D:** từ/câu hỏi/audio có hỗ trợ → preview đã lưu → đi tới lỗi → publish N/N+1 → ẩn; tách evidence mock và real.
4. **Sau E:** tổng quan/statistics dữ liệu đúng → hồi quy đầy đủ → đóng gap thị giác → staging nếu dependency đáp ứng.

**Điểm chặn cụ thể:** BE/Mobile chốt canvas trước nghiệm thu fidelity; media contract trước tuyên bố audio/upload thật hoàn chỉnh; ownership/revision/publish trước nghiệm thu phát hành; aggregate definition trước nghiệm thu ý nghĩa thống kê. Khi chờ, làm layout, fixture lỗi và adapter; không tự mở rộng schema đã được duyệt.

### File và component dự kiến

- Giữ React/Vite, Router, Query, Nunito và Phosphor đang có; kế hoạch này không yêu cầu đổi thư viện UI/form/canvas.
- Tiếp tục sửa các page trong `src/features/content/pages`, `StoryEditorLayout`, `StoryForm`, `StoryEditorParts`, `AssetPicker`, `StoryPageRenderer`, `PublishIssues`, hai service và hai hook hiện có.
- Tách `ContentOverviewPage.jsx` từ shared overview khi thực hiện UX-09. Cân nhắc `content.css` scoped cho Content để không làm regress Parent/Admin; không di chuyển CSS hàng loạt không liên quan.
- Trích `AssetCard`, `AssetDetails`, `EditorSaveBar`, `EditorNavigationDialog`, `VersionPanel`, `AudioPreview` khi được dùng thật; shared Dialog/Field/States ưu tiên component đã có, không tạo bản sao theo từng trang.
- Tập trung mapping route/entity/field cho issue focus và “Sửa trên trang”. Lưu selection có thể qua query; query này không thay thế authorization hoặc kiểm tra entity thuộc story.

## 15. Nghiệm thu UI/UX và bàn giao

### 15.1. Ma trận review cho từng trang

Mỗi P01–P11 có một hàng theo mẫu dưới, điền link ảnh/test/PR khi thực hiện. Không đánh dấu bằng cảm nhận “đã đẹp”.

| Trang | Visual desktop/laptop/mobile | Loading/empty/error/partial | Tác vụ chính + failure | Keyboard/focus/axe | Mock complete | API integrated | Staging verified |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P01 Tổng quan | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P02 Kho truyện | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P03 Tạo truyện | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P04 Thông tin | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P05 Trang truyện | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P06 Vai & vị trí | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P07 Từ vựng | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P08 Câu hỏi | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P09 Xem trước | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P10 Kho tư liệu | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |
| P11 Hiệu quả | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa kiểm tra | Chưa | Chưa | Chưa |

**Một trang chỉ đạt UI/UX khi:**

- Bố cục có thứ bậc rõ, cùng token/font/icon/spacing với các trang còn lại; không có placeholder kỹ thuật, ảnh stock che lỗi hoặc CTA chưa hoạt động.
- Screenshot với dữ liệu thực tế dài/ngắn, ảnh có/không và danh sách nhiều mục đã được xem bằng mắt tại desktop, laptop và mobile; không cắt chữ, che Save, focus hoặc dialog footer. Kiểm tra zoom 200% và contrast thực tế.
- Có đầy đủ trạng thái áp dụng trong mục 12.3; mỗi lỗi có bước khôi phục; disabled action có lý do; thông báo thành công chỉ sau kết quả thật.
- Dùng bàn phím hoàn thành tác vụ chính; label/error liên kết field; icon button có accessible name; dialog đóng/mở/trả focus đúng; axe không còn lỗi nghiêm trọng trong luồng kiểm tra.
- Refresh/deep link/Back không làm sai ngữ cảnh; input không mất do save lỗi/refetch/chuyển selection chưa xác nhận; thao tác có quyền đúng và không lộ cache của người khác.
- Page-specific acceptance ở mục 13 đạt, lint/build và test liên quan pass; API/staging còn thiếu thì ghi rõ, không đánh dấu hoàn thành cả role.

### 15.2. Bộ dữ liệu và ca kiểm tra có ý nghĩa

- Fixture chính: `story-contract-multi-role` 3 trang/2 vai; thêm trạng thái draft, published sạch, published có draft mới và hidden. Fixture lỗi gồm thiếu cover/background, asset failed/processing, page reference mất, title/meaning dài, audio URL hỏng, quiz chưa chọn đáp án và 409.
- Dữ liệu thư viện: ít nhất 2 ảnh khác bytes, một PNG trong suốt, nhiều hơn 8 tư liệu để kiểm tra picker, audio khi supported. Kiểm tra empty khác no-results và thiếu Blob sau refresh.
- Dirty tests: mở edit không dirty; chỉ sửa audio/correct answer phải dirty; chuyển page/slot/từ/câu hỏi trong cùng route; tab/sidebar/Back; lưu một form không làm clean form khác; response save cũ không ghi đè input mới.
- Publishing tests: validation revision cũ hết hiệu lực; pending/dirty chặn publish; issue mở đúng entity/field; 409 giữ input; timeout đối chiếu version; N/N+1 bất biến và hide theo contract.
- Analytics tests: 0/null/partial failure; range không hợp lệ; đổi range nhanh; reset cache account; timezone/mẫu số đã được xác nhận.

Tiếp tục các spec Content hiện có và regression G2/G3/G5/G6/G7; thêm test theo hành vi còn thiếu, không viết test chỉ kiểm tra class CSS hay sao chép implementation. Visual evidence lưu theo route/viewport ở vị trí artifacts thống nhất của nhóm, chỉ cập nhật baseline sau khi đã review. Chạy `npm run lint`, `npm run build` và Playwright liên quan sau thay đổi code; lần chỉ cập nhật tài liệu này không cần chạy bộ test ứng dụng.

### 15.3. Điều kiện hoàn tất role

**Frontend/mock complete:** đủ 11 trang và overlay liên quan đạt checklist UI/UX, luồng demo xuyên trang hoạt động, không còn mất dữ liệu khi biên tập. **API integrated:** upload/media thật, catalog, ownership, revision, publish/version và statistics nối API đúng. **Verified on staging:** kiểm thử end-to-end với Backend, đối chiếu preview với Mobile, snapshot cũ không đổi, phân quyền và hồi quy shared có bằng chứng. Chỉ khi cả ba đạt mới kết luận Content Manager hoàn thiện.
