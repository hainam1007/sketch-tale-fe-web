# Content Manager — API/contract còn thiếu so với frontend (31/10/2026)

Nguồn: [Swagger live](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json), [snapshot 31/10](../../artifacts/swagger-content-manager-2026-10-31.json), source `src/features/content`. 124 operations, không đổi operation/schema so với 29/10. [Kế hoạch Luna Extra High](CONTENT_MANAGER_API_INTEGRATION_PLAN_2026-10-31.md).

“Thiếu” dưới đây nghĩa là **chưa có contract trong Swagger đã kiểm tra** đáp ứng dữ liệu frontend; không khẳng định backend source hoàn toàn chưa có. URL bổ sung là **đề xuất**, có thể mở rộng endpoint hiện hữu thay vì tạo endpoint mới. Không cộng các đề xuất thành số API bắt buộc.

## 1. Đã có API — không yêu cầu tạo lại

- Story list/detail/create/update/delete/publish, education theme list.
- Page list/create/update/delete; upload background và một narration qua multipart `file`/`audioFile` của page.
- Role list/all-roles/create/update/delete; role có `DefaultAssetUrl` và multipart `file`.
- Slot list/create/update/delete cho x/y/scale/flip; thiếu field nâng cao, không thiếu CRUD slot.
- Vocabulary list/create/update/delete, word/meaning/audioUrl. Đổi page của vocabulary không nằm trong update DTO và UI real đã khóa.
- Quiz list/create/update/delete với options/correct answer/image/audio; thiếu liên kết page/feedback.
- Upload background/avatar độc lập đã có, nhưng response schema chưa mô tả. Không phải asset registry/search/delete.
- `DELETE /api/story-role/{id}` đã được nối service/UI cho vai không có slot; UI chặn xóa vai đang có slot để tránh cascade chưa chốt. `/all-roles` đã có, không cần backend tạo lại.
- Xóa page có service DELETE nhưng UI `deleteSelectedPage` đang chặn real mode; cần chốt cascade rồi hoàn thiện consumer, không yêu cầu tạo lại API xóa page.

## 2. Backlog Backend đề xuất

P0: cần để bảo đảm lưu/xuất bản đúng bản editor; P1: khớp các công cụ đang có UI; P2: tối ưu sau MVP. Các field dưới đây là yêu cầu đề xuất, chưa phải contract backend đã chốt.

| ID / mức | Nhu cầu và consumer | Bổ sung đề xuất | Dữ liệu/hành vi tối thiểu |
|---|---|---|---|
| G01 / P0 cho editor đầy đủ | Lưu composition trang: `StoryPagesPage`, `StoryAnimationEditor`, `StoryPageRenderer` | Mở rộng Page DTO hoặc `GET/PUT /api/storypage-template/{pageId}/composition` | schemaVersion, revision; subtitles với id/text/startMs/durationMs; imageObjects với assetId và transform; animationClips với targetId/kind/startMs/durationMs/preset/keyframes/points/easing; backgroundOffsetX/Y/Scale. Kiểm tra reference, đơn vị thời gian, bounds và clip conflict. Đọc lại không phụ thuộc localStorage hay authored fixture. |
| G02 / P0 cho media đầy đủ | Timeline nhiều âm thanh | Composition G01 chứa audioTracks; thêm upload audio trong registry G05 nếu cần | Stable track ID, assetId, type voiceover/music/effect, startMs/trimStartMs/durationMs/volume. Một audioNarrationUrl hiện có không thay thế nhiều track. Chốt ms, trim semantics, overlap, codec và duration. |
| G03 / P1 | Biến đổi slot nâng cao | Mở rộng Create/Update/Read CharacterSlotTemplateDto | rotation, layer, anchor, asset override có scope hợp lệ; GET và write đối xứng. Không đổi role/page ID khi chỉ sửa vị trí; chốt % tọa độ, origin, scale, tie-break layer với Mobile. |
| G04 / P1 | Kéo đổi thứ tự trang | `PUT /api/story-template/{storyId}/pages/order` hoặc action tương đương | pageIds đầy đủ, expectedRevision; kiểm tra không trùng/thiếu/ngoài story, cập nhật pageNumber nguyên tử, ID trang giữ nguyên; trả thứ tự mới/revision. Chỉ GET pageNumber chưa đáp ứng ghi thứ tự. |
| G05 / P0 cho asset dùng trong bản publish đầy đủ | `AssetsPage`, `AssetPicker`, audio/image overlay | `GET/POST /api/content/assets`, `GET/DELETE /api/content/assets/{id}`; attach assetId trong story/page/role/quiz/composition theo nhu cầu | ID durable, name, kind, category, mimeType, size, width/height/duration, URL/expiry, processingStatus; filter/pagination, quyền sở hữu/phạm vi dùng. Upload bytes + registry; xóa kiểm tra reference draft/published. Không thay bytes sau ID đã nằm trong snapshot bất biến. POST/GET có thể tách upload session nếu cần, không bắt buộc. |
| G06 / P0 khi bảo đảm đồng thời | Revision, server validate và publish nguyên tử | Revision/ETag trên read/write; mở rộng publish hiện có; có thể thêm `POST /api/story-template/{id}/validate` | expectedRevision, 409/412, lỗi có code/message/tab/entityId/fieldPath, validate toàn bộ media/slot/page/quiz/timeline. Publish chỉ thành công cho đúng revision đã kiểm tra và assets durable. Không bắt buộc endpoint validate riêng nếu publish trả issues đầy đủ. |
| G07 / P0 nếu cam kết version bất biến | Version history / published snapshot trong editor contract | `GET /api/story-template/{id}/versions`, `GET /api/story-template/{id}/versions/{versionId}` hoặc nhúng trong detail | versionId/revision/publishedAt/publisher; snapshot pages/roles/slots/quiz/vocab/composition và asset refs. Quy tắc sửa draft không đổi version đã phát hành; client/GeneratedStory tham chiếu version nào. Version list riêng có thể hoãn nếu MVP không hiển thị history, nhưng không tuyên bố đã có snapshot bảo vệ. |
| G08 / P1 | Quiz theo trang + phản hồi | Mở rộng StoryQuizTemplateDto và multipart create/update | storyPageTemplateId (nullable nếu quiz cuối truyện), feedback; page phải thuộc story; read-after-write. FE hiện dùng pageId/feedback overlay. Không cần tạo một CRUD quiz thứ hai. |
| G09 / P1 | `ContentOverviewPage`, `ContentStatisticsPage` | `GET /api/content/statistics?range=7d\|30d` hoặc endpoint aggregate tương đương | summary totalReads/activeReaders/completionRate, trend theo ngày, topStories, period/timezone, hasData, partial errors; xác định lượt đọc/hoàn thành, quyền scope và nguồn tracking. Count draft/published đã có thể tính từ list hiện tại. |
| G10 / P2 | Kho truyện lớn và editor tải chậm | Mở rộng query `/all-stories`, `/all-pages`, `/all-roles` hoặc editor aggregate | search/status/theme/sort/page/pageSize, total, order ổn định; editor aggregate chỉ cần nếu có nhu cầu hiệu năng. Hiện FE có thể ghép API nên đây không phải blocker CRUD. |

G01/G02/G03/G05/G06 cần được Backend và Mobile thống nhất schema/rendering trước khi phát hành editor đầy đủ. Editor hiện chặn publish khi còn overlay local để không xuất bản thiếu dữ liệu. Trong lúc chờ, FE có thể giữ chế độ chỉnh sửa local được ghi nhãn rõ; không âm thầm bỏ field khi báo đã xuất bản.

## 3. Cần xác nhận contract hiện có, không gọi là thiếu endpoint

| Chủ đề | Bằng chứng hiện tại | Điều cần chốt |
|---|---|---|
| Enum | Swagger chỉ có số CommonStatus 0–4, TargetAgeGroup 0–2, StoryRoleType 0–3 | Tên/ý nghĩa từng giá trị và transition hợp lệ. FE hiện có mapping; cần đối chiếu nguồn backend. |
| Scope và role | Có all-stories/all-pages/all-roles, nhưng Swagger không mô tả đầy đủ chính sách từng role | Content Manager thấy/sửa truyện của ai; `/roles` có bỏ draft/inactive không; Parent/Child có nhận draft không. Kiểm tra bằng account đúng role. |
| Hai route page trùng cấu trúc | `/storypage-template/pages/{storyId}` và `/storypage-template/pages/{id}` cùng GET | Sửa route detail/list để không ambiguous; route thứ hai còn có query pageId. FE đang dùng all-pages để tránh route này. Chưa retest lỗi runtime trong lần audit này. |
| Hide/delete | FE gọi DELETE story để “Ẩn truyện” | Soft delete hay hard delete, trạng thái sau thao tác, catalog visibility, restore, ảnh hưởng GeneratedStory/version. Không cần endpoint hide mới nếu DELETE đã có semantics phù hợp. |
| Xóa page/role/slot | Có DELETE nhưng response chỉ 200 | Cascade hay 409 khi còn reference; slot, vocabulary, quiz/composition và version đã publish được giữ thế nào; idempotency/retry. |
| File upload/replace/remove | Multipart có file/audioFile nhưng không có contract clear media rõ | Bỏ file có giữ cũ không; xóa file chủ động dùng gì; MIME/size/codec, URL expiry. Giới hạn 5MB ảnh/25MB audio đang là FE, chưa chứng minh backend giống. |
| Audit field | DTO/form có createdAt/createBy/updatedAt/updateBy | Server có tự lấy actor/time không; nếu FE gửi thì backend phải kiểm tra principal và không tin ID actor tùy ý. |
| Null/omission/response | PUT nhiều endpoint 200 không content schema; form phần lớn không ghi required | Field bắt buộc, null vs omitted, update status mặc định có reset không; mutation trả ID/entity hay refetch. Cần examples success/empty/validation/forbidden/conflict. |
| Slot identity | POST slot trả CharacterSlotTemplateDto có id | Cho phép nhiều slot cùng role/page hay unique; FE phải lấy response ID thay vì suy theo cặp role/page. |
| Published read model | PublishResult có storyTemplateId/title/status/message | Publish có validate đầy đủ không; thay đổi draft có tác động ngay người đọc không; trạng thái success không chứng minh overlay đã được gửi. |

## 4. Điều kiện bàn giao Backend → Frontend

- Swagger cập nhật request/response/enum/examples, quyền từng action, semantics PUT/DELETE và bảng lỗi.
- Fixture thật dùng được cho Content Manager; account/test story cho smoke riêng, không đưa token/password vào repo.
- Read-after-write trên browser/profile sạch tái tạo đúng media, trang, thứ tự, slot, quiz và composition; không cần IndexedDB/fixture JS của FE.
- Cập nhật đồng thời không ghi đè im lặng sau khi hỗ trợ revision; upload/attach/publish lỗi giữa chừng không báo thành công toàn bộ.
- Kiểm tra lifecycle asset/draft/published snapshot và quyền truy cập; không dùng việc GET Swagger thành công để kết luận authorization runtime đúng.
- Endpoint đề xuất chỉ được thêm vào route guard và bật consumer real sau khi contract triển khai đã được kiểm tra. Test intercept và test backend thật được ghi riêng.
