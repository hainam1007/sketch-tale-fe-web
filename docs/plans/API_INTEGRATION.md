# Kế hoạch nối API thật còn mở — cập nhật 27/11/2026

## Điều chỉnh sau pull `f0e1ffb`

- Bước reader: `GET /api/story-template/stories` và list theo education theme nay chỉ trả Active, route `{id}` theo theme đã bind đúng. Tuy vậy `GET /stories/{id}` vẫn trả các trạng thái khác Inactive; FE phải giữ kiểm tra Active và BE cần gate direct read. Child list tổng dùng hợp allowed themes/recommendations nếu có cấu hình; list theo theme chỉ xét allowed themes, cần BE thống nhất policy.
- Bước subscription: bỏ nhận định `AsNoTracking` là lỗi source hiện tại. Repository đã trả tracked entity, nhưng phải chạy job và đọc DB để đóng `SUB-EXP-24`; thiếu FREEPLAN và count vẫn cần BE xử lý.
- Bước phát hành: `Program.cs` nay `app.Run()`; xác nhận host/port và healthcheck trên Render. Guard story detail từng ở BE local trước pull hiện chỉ còn trong stash ngày 27/11; BE phải rà lại trước khi phát hành. Không sửa BE từ FE/docs.

## Phạm vi và nguồn

Chỉ sửa Frontend và docs. Backend `main` tại `f0e1ffb` có nhiều thay đổi local chưa commit; chỉ đọc source để xác định contract, không sửa BE. `.env.production` và `.env.development` là cấu hình trong repo, không chứng minh bản đang deploy. Mỗi mục chỉ đóng khi request/read-back trên đúng release và đúng role thành công; build/intercept chỉ xác minh FE.

## Thứ tự thực hiện

| Bước | FE làm được | Điều kiện BE / nghiệm thu |
| --- | --- | --- |
| 1. Chốt route reader và release | Đối chiếu `parentCatalogService.listActivePages`, `VITE_PARENT_READER_PAGES_ROUTE`, allowlist; chọn một route đúng với deploy, giữ filter Active và thông báo lỗi rõ. | Production hiện cấu hình `/storypage-template/pages/{storyId}`, source BE có `/published/{storyId}`. BE xác nhận commit/route triển khai; Parent và Child đọc được truyện Active, không đọc Draft qua URL trực tiếp. Không đổi env theo suy đoán. |
| 2. Hồ sơ Parent | Chuyển list từ `/parent-profiles/child?parentId=` sang `GET /child-profiles` scope JWT mới nếu release đã có; giữ map `id`, cache theo user, GET read-back sau PUT và recovery khi lỗi. | Parent A chỉ thấy bé A, Child chỉ thấy mình; A không đọc/sửa ID của B. Nếu deploy còn route cũ, giữ capability cũ và báo mismatch. |
| 3. Character của bé | Caller `GET /characters/child-profiles/{childId}` và tab Nhân vật đã có; hoàn thiện error/empty/image/status, invalidate sau approve/reject. | **P0 BE:** route list chưa `[Authorize]`; service bỏ qua owner check nếu không parse được user ID. BE buộc JWT và kiểm tra Parent/Child ownership. Nghiệm thu anonymous 401, khác role 403, Parent A/Child A chỉ xem bé A. |
| 4. Quiz history | `parentQuizResultService`, `LiveQuizHistory` đã có; sửa mapper chỉ khi response thật khác contract, giữ lỗi 403 thay vì biến thành danh sách rỗng. Dev đang `real`, production `disabled`. | BE xác nhận `GET /child-quiz-answers/child-profiles/{id}` cho Parent sở hữu bé (runtime cũ 403). **P0 BE:** GET theo `readingLogId` phải kiểm tra Parent sở hữu log; missing identity fail closed. Sau A/B/Child tests mới bật production. |
| 5. Parent subscription và payment | Ưu tiên `parentProfile.id` trong `parentSubscriptionService`, vẫn kiểm tra session/owner response; trang return tiếp tục đọc lại Auth profile, không coi query URL là thanh toán. | **P0 BE:** subscription/ParentProfile cần auth + owner scope; order status Parent-owned; webhook amount/plan/idempotency và entitlement read-back. Job hết hạn nay đọc tracked entity nhưng cần xác minh `Expired` trong DB, xử lý FREEPLAN thiếu và count. Production subscription giữ disabled tới lúc xác minh. |
| 6. Allowed themes và story recommends | Sau khi BE bảo vệ endpoint, thêm route allowlist, service GET/PUT theo bé, UI settings với read-back; `[]` là xóa hết, xác nhận trước mutation. | **P0 BE:** 4 endpoint hiện không scope `{id}`; recommendations cần policy story Active và enforcement server cho Mobile/catalog. Kiểm tra Parent A/B, Child read, Admin. |
| 7. Content report WF-04 | FE Parent/Admin đã có caller; rà response mapper, transition và read-back trên test data. Dev Parent `real`, production `disabled`. | BE local có thay đổi WF-04 chưa commit/deploy; xác minh Parent own report, Admin transition, resolve ẩn story và khóa/unlock CM trên deploy trước khi bật production. |
| 8. CM reader, media và WF-05 | Hoàn thành migration asset local/mock sang URL bền vững, preview/reader clean-browser; giữ WF-05 disabled khi chưa có contract an toàn. | Upload/registry/audio, published hierarchy, quyền CM/Parent/Child; WF-05 cần authorization/owner và consumer chỉ dùng keyword Active. Không gọi asset local là nội dung đã publish. |
| 9. Admin và phần Parent core còn mock | Giữ users/catalog/reports/audit real; dashboard chỉ hiện số liệu có API. Thay các màn Parent dashboard/progress/library/export demo bằng caller thật theo từng capability khi contract có đủ. | BE cần aggregate revenue/credit, reading/vocab usage, thư viện GeneratedStory owner-scoped + favorite/hide/delete, export job/status/download. Chưa có contract thì giữ nhãn mô phỏng hoặc unavailable. |

## Quy tắc làm việc cho từng bước

1. So sánh controller, DTO, service, repository BE với route, mapper và mode FE; ghi rõ `source`, `snapshot Swagger`, `runtime` là ba mức bằng chứng khác nhau.
2. Chỉnh FE theo capability nhỏ; giữ thay đổi local đang có. Lỗi API thật phải hiện lỗi và cho retry GET an toàn, không fallback mock. Không retry mutation khi timeout nếu chưa có idempotency/read-back.
3. Kiểm tra response đúng ID bé/Parent/story, trạng thái và quyền; dùng hai Parent và một Child trên dữ liệu test. Kiểm tra anonymous/foreign ID cho endpoint nhạy cảm do BE xác nhận.
4. Chỉ đổi mode production sau khi backend release, quyền và dữ liệu thật đã được nghiệm thu. Cập nhật [contract](../api/CONTRACTS.md), [role](../roles/PARENT.md) và [backlog](../BACKLOG.md) khi đóng mục.

## Việc cần báo BE ngay

- **P0 bảo mật:** character list không `[Authorize]`; allowed-themes/story-recommends thiếu owner; subscription/ParentProfile thiếu auth/owner; quiz theo reading log thiếu Parent owner; GeneratedStory list/detail/generate thiếu owner. FE kiểm tra ID chỉ bảo vệ giao diện, không bảo vệ API.
- **P0 phát hành:** reader production `/pages` khác source `/published`; cần route/commit deploy chính xác và gate Active hierarchy.
- **P0 dữ liệu thanh toán:** job expiry đã bỏ `AsNoTracking()` ở source; vẫn cần nghiệm thu DB/status/count và FREEPLAN thiếu. Webhook/entitlement cần nghiệm thu idempotency, order amount/plan và trạng thái Parent-owned.
- **P0 direct read:** story detail còn trả Draft/Pending/Archived theo ID; BE cần rà guard detail bị mất khỏi working tree khi pull và chốt policy lọc Child nhất quán giữa list, theme và detail.
- **P0 phát hành mới:** BE xác nhận `app.Run()` lắng nghe đúng host/port trên Render trước khi bật release.
