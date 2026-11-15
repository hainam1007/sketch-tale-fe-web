# Contract API — nguồn hiện hành

Ngày 14/11/2026. BE local HEAD sau pull `f53e0ad` + 24 staged modifications đã có trước pull; FE HEAD `de1649a` + working tree. [Swagger live 14/11](../../artifacts/swagger-parent-2026-11-14.json) có 109 paths/148 operations, ưu tiên theo xác nhận người dùng. Không đồng nhất deploy với local. [Ma trận Parent + bằng chứng](../roles/PARENT.md) tách source/intercept/runtime.

Delta deploy: bỏ ba quiz routes cũ dưới `/reading-logs`; thêm POST `/child-quiz-answers`, GET `/child-quiz-answers/reading-logs/{readingLogId}`, GET `/child-quiz-answers/child-profiles/{childProfileId}`; thêm POST `/reading-logs`, PUT `/{id}/progress`, PUT `/{id}/complete`, GET `/reading-logs/child-profiles/{childProfileId}/completed`. FE quiz history đã đổi caller, production disabled vì **GET mới trả 403 với bé thuộc Parent mẫu**. Chưa có source deploy để kiểm chứng owner/scoring cho API mới; không nối reading-log mutation bằng Parent hoặc token Child thay thế.

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
| POST `/story-template` | multipart EducationThemeId, Title, Description?, file? | Create DTO **không AgeGroup**, không audit fields; create + update age là hai mutation |
| PUT `/story-template/{id}` | multipart EducationThemeId, Title, Description?, AgeGroup, Status, file? | Map DTO vào entity; không mặc định partial PATCH |
| POST `/storypage-template/{storyId}/page` | multipart RawText, CompositionJson?, file?, audioFile? | Page DTO; server gán ID/pageNumber, Draft |
| PUT `/storypage-template/{id}` | multipart RawText, CompositionJson?, Status, file?, audioFile? | `{message}`; FE GET detail để xác nhận |
| PUT `/storypage-template/{storyId}/reorder-pages` | JSON `{orderedPageIds:[UUID,...]}` | Không trùng, đủ danh sách từ GetPagesByStoryIdAsync; sai → 400 |
| DELETE `/storypage-template/story-pages/{id}` | Không body | 204; **soft delete Inactive**, giảm tổng và đánh lại số trang sau |
| POST `/story-template/{id}/publish` | Không tự thêm version payload | PublishStoryResultDto; source chỉ đổi story Active |

Page DTO gồm inherited BaseFieldDto + storyTemplateId/pageNumber/rawText/backgroundUrl/audioNarrationUrl/compositionJson/status. Create/update controller nhận alias imageFile cho file và audio cho audioFile; ưu tiên field chuẩn file/audioFile.

`UpdatePageAsync` gọi `_mapper.Map(dto,page)`; MappingProfile chỉ CreateMap mặc định cho page. **Không có logic preserve-if-omitted rõ ràng cho CompositionJson**. FE phải giữ raw composition khi chỉ đổi text/status, xác minh omitted/null/empty bằng test BE; không giả định bỏ field luôn giữ dữ liệu. BE chưa validate schema v1 hay limit 1 MB: đó là giới hạn FE.

`GetPagesByStoryIdAsync` lọc **Status != Inactive**, gồm Draft/Pending/Active/Archived, dù comment service nói chỉ Active. `GetPublishedPagesByStoryAsync` kiểm tra story Active và lọc pages Active. Reorder dùng tập != Inactive, vì vậy Archived có ảnh hưởng; FE đang chặn reorder khi có Archived.

PublishStoryAsync chỉ sửa story, không activate page/role/slot và không tạo snapshot/version. Phải làm rõ workflow chuyển trang Draft sang Active; không PUT hàng loạt chỉ để vượt một lỗi đọc.

## Role, slot, quiz, vocabulary, media

- Role DTO: storyRoleType, roleName, description, allowCustomCharacter, requiresParentApproval, defaultAssetUrl; update thêm status. Create/update multipart + file. GET roles là route khác all-roles (CM). `GET /role/{id}` hiện action tham số `roleId` không khai báo `[FromRoute(Name="id")]`: cần sửa/test binding, không khẳng định detail đọc đúng ID.
- Slot JSON: create storyRoleTemplateId, posX, posY, scale, flipHorizontal; update posX/posY/scale/flip/status. DTO không có rotation/layer/asset riêng; các field đó thuộc [Composition v1](COMPOSITION_V1.md). X/Y quy ước % 0–100 của FE; kiểm tra validation BE trước coi server enforce.
- Quiz: questionText, options[], correctOptionIndex; update thêm status; media theo controller. GET `/story-template/{storyId}/quizzes` dành đọc dưới JWT; `/all-quizzes` chỉ CM. Không yêu cầu Parent gọi all-quizzes. DTO có correctOptionIndex: ẩn đáp án trên UI không phải bảo mật scoring.
- Vocabulary: word, meaning, audioUrl, liên kết page. API authoring tồn tại; learning progress là nghiệp vụ khác.
- Upload background-image: multipart file, role **`content manager`** (không có alias ContentManager); .jpg/.jpeg/.png/.webp/.gif, tối đa 10 MiB theo controller; trả `{success,imageUrl}`. Upload avatar yêu cầu JWT. Không chuyển sang avatar khi background trả 403 để né quyền.
- Page audioFile là một narration; chưa endpoint upload nhiều audio độc lập/kho asset với ownership/reference lifecycle. JSON manifest không lưu bytes cloud thay cho upload.

## Parent, thanh toán và authorization

Contract Character chi tiết ở [Parent](../roles/PARENT.md), Auth ở [Auth](AUTH.md).

- Daily caps nullable: `ChildProfileService.ApplyUpdateAsync` chỉ ghi khi HasValue; null/omitted giữ nguyên, không xóa giới hạn. FE sửa mô tả và chỉ gửi nickname khi đổi tên nhanh. PUT accepted/GET fail có GET-only recovery. Runtime chỉ GET own child, chưa mutation/A-B.
- Reader giữ CompositionJson, hydrate codec chung và gọi GET roles/slots theo Swagger. Role/slot repositories local lọc `!= Inactive`, controller GET không auth và không kiểm tra trạng thái truyện cha: BE cần published hierarchy gate. FE filter Active không thay bảo mật server. Runtime Parent đọc role/slot của truyện Active; chưa chứng minh draft bị chặn.
- Quiz local `GetQuizAnswersByReadingLogIdAsync` thiếu owner check Parent; collection có check nhưng dựa ParentProfileId == JWT UserId. Submit fallback DTO khi không tìm được Child JWT, chưa check quiz thuộc generated story và upper bound options. Đây là local; deploy quiz controller đã đổi, cần source release đối chiếu 403.

- ChildProfileController/Repository local có scope Parent JWT, Child tự đọc; Parent update chỉ nickname/targetAgeGroup/readingLevel/daily caps, không ghi remaining counters. Đây là local staged, cần đối chiếu release/runtime.
- CreditTransactionLogController, SubscriptionController, ParentProfileController không khai báo Authorize; các service đã đọc không có owner gate tương ứng. SEC-01: sửa quyền server, không đọc list rồi lọc client. Parent subscription hiện disabled; Admin callers cũng không khắc phục được lỗ hổng BE.
- POST payments/create-checkout: Parent JWT, CreatePaymentDto, response `{checkoutUrl}`. GET status theo order chưa expose trong PaymentController, dù service có GetByOrderCodeAsync. FE không được tự gọi method service như URL đã có.
- PATCH payments/cancel-paymentlink: Authorize nhưng service chỉ tra orderCode, không kiểm tra Parent. Body `{orderCode,code}`; Pending + code==0 → Failed, xóa subscription. Chưa thấy gọi hủy PayOS trong method này. Giữ orderCode int64 dạng chuỗi nội bộ; chỉ serialize số khi an toàn theo contract.
- POST payments/webhook là BE/PayOS; FE không gọi. Entitlement/idempotency và đồng bộ gói sau callback cần test; return URL không chứng minh đã trả tiền.
- Character accept/cancel-preview không có Authorize action/controller; service so sánh child ID do client truyền. SEC-02 cần JWT/owner enforcement, đặc biệt hoàn quota.

## Enum và yêu cầu mở

Source `sketch_tale.Domain/Enums/DomainEnums.cs`: CommonStatus 0 Draft/1 Pending/2 Active/3 Inactive/4 Archived; CharacterStatus 0 Preview/1 Pending/2 Approved/3 Rejected/4 Hidden; ParentApprovalStatus 0 NotRequired/1 Pending/2 Approved/3 Rejected. TargetAgeGroup 0 Ag6to7/1 Age8to10/2 Age11to12; ReadingLevel 0 Beginner/1 Intermediate/2 Advanced. DTO ChildProfile dùng một số giá trị **string**, không gửi enum số đồng loạt.

Đề xuất capability không phải endpoint hiện có: entitlement/usage, allowed themes, revision/reject reason/sensitive permission, child library/progress/export/report, Admin aggregates, registry/media và published versions. Mỗi gap có ưu tiên/điều kiện ở [BACKLOG](../BACKLOG.md); không thêm route phỏng đoán vào allowlist.
