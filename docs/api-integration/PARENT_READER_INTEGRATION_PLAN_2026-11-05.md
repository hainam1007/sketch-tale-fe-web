# Kế hoạch nối API đọc truyện cho Parent — 05/11/2026

Trạng thái: đã nối reader cơ bản ở frontend ngày 05/11/2026; chưa xác minh bằng giao dịch đọc với phiên Parent trên backend deploy.

## Nguồn và kết luận

- Swagger live đọc ngày 05/11: `https://sketch-tale-be.onrender.com/swagger/v1/swagger.json`; snapshot [swagger-parent-reader-2026-11-05.json](../../artifacts/swagger-parent-reader-2026-11-05.json).
- Backend source tham chiếu commit `9927acf`: StoryPageTemplateController → StoryPageTemplateService → StoryPageTemplateRepository. Không khẳng định commit này chính là bản đang deploy.
- Backend working tree có thay đổi chưa commit, bổ sung `/published/{storyId}`. Route này **không có trong Swagger live vừa đọc**; không dùng source local đó như contract đã phát hành.
- FE đã có catalog, chi tiết, CTA đọc và màn reader riêng `ParentStoryReaderPage.jsx`. Adapter dùng `/storypage-template/pages/{storyId}`, kiểm tra trạng thái Active, quan hệ truyện và thứ tự trang; route guard đã khai báo endpoint Swagger.
- `VITE_PARENT_CATALOG_API_MODE=real` đã bật trong production để catalog và reader dùng backend. Chưa xác minh quyền gói hay response runtime bằng tài khoản Parent thật.
- Build production đã chạy thành công ngày 05/11; còn cảnh báo bundle JavaScript lớn hơn 500 kB.

## API dùng cho luồng đọc

| Chức năng | API hiện có | Cách nối |
| --- | --- | --- |
| Danh sách truyện | `GET /api/story-template/stories` | Giữ catalog hiện tại, chỉ hiển thị truyện Active |
| Chi tiết truyện | `GET /api/story-template/stories/{id}` | Tải độc lập theo story ID, kiểm tra trạng thái trước khi tải nội dung |
| Các trang truyện | `GET /api/storypage-template/pages/{storyId}` | Adapter sắp theo `pageNumber` và chỉ hiển thị trang Active |
| Chủ đề | `GET /api/education-themes` | Chỉ bổ sung nhãn; lỗi chủ đề không chặn việc đọc truyện |

DTO trang trong Swagger: `id`, `storyTemplateId`, `pageNumber`, `rawText`, `backgroundUrl`, `audioNarrationUrl`, `status`. Nội dung, ảnh và audio có thể null. Không cần API riêng để phát audio URL.

**Điểm cần phân biệt:** comment service ở commit tham chiếu nói “chỉ Active”, nhưng repository thực sự lọc `Status != Inactive`, nghĩa là có thể gồm Draft/Pending/Archived. FE cần kiểm tra Active cho cả truyện và trang; BE cần xác nhận/sửa bộ lọc ở server. Không gọi route quản trị `all-pages` để thay thế khi gặp lỗi.

## Thứ tự thực hiện

### P0 — Sửa contract và adapter

1. Đổi endpoint lấy trang sang `/storypage-template/pages/{storyId}`; cập nhật allowlist trong `src/lib/api/backendRoutes.js`. **Đã làm.**
2. Giữ `pageNumber`, `storyTemplateId`, `status` trong model; kiểm tra trang thuộc truyện, lọc Active và sắp số trang tăng dần. **Đã làm.**
3. Sửa `.map(mapStory)` để index không bị nhận nhầm làm danh sách trang. **Đã làm.**
4. Tách dữ liệu chủ đề khỏi nội dung bắt buộc; query reader theo user + story ID + API mode và truyền AbortSignal. **Đã làm.**

### P1 — Reader Parent đầy đủ cho nội dung cơ bản

1. CTA “Đọc truyện” mở `/parent/library/:storyId/read` dưới layout/quyền Parent; route trực tiếp và refresh tải độc lập theo ID. **Đã làm.**
2. Reader hiển thị tên truyện, ảnh, văn bản, trang trước/sau, số trang và quay về chi tiết truyện. **Đã làm.**
3. Audio có controls chủ động; đổi trang remount audio theo page ID. Lỗi audio không chặn nội dung chữ. **Đã làm.**
4. Có loading, retry, trang Active rỗng và lỗi API riêng; không fallback sang demo ở reader. **Đã làm.**
5. Có bố cục responsive và nhãn truy cập cho điều hướng/audio. Cần nghiệm thu trực quan sau khi chạy với phiên Parent. **Đã làm code, chờ runtime review.**

### P2 — Chỉ mở rộng sau khi có contract phù hợp

- Quiz/từ vựng có route trong Swagger nhưng không bắt buộc để Parent đọc chữ/ảnh/audio. Chưa nối ghi điểm của Child vào phiên đọc Parent.
- Animation/nhân vật ghép: DTO trang hiện không cung cấp đầy đủ model editor (timeline, subtitle cues, image objects...). Không dùng overlay/mock Content Manager làm dữ liệu đọc thật. Chỉ tái sử dụng renderer sau khi adapter và nguồn assets/slots được xác nhận.
- Tiến độ đọc đồng bộ, yêu thích và gửi gợi ý tới app bé là các luồng riêng. Saved/recommendations hiện lưu local qua `useParentDemo`, không phải đồng bộ BE. Đọc cơ bản không cần chờ các luồng này.
- Không tự trừ thời gian bé hoặc tạo reading log của bé khi Parent mở truyện.

## Cần hỏi Backend

1. **Nội dung phát hành:** `/storypage-template/pages/{storyId}` trên bản deploy đã chỉ trả trang Active của truyện Active chưa? Source `9927acf` đang lọc khác comment. Nếu đã sửa, gửi commit/release tương ứng.
2. **Quyền đọc theo gói:** Parent được đọc toàn bộ truyện hay bị giới hạn bởi `accessFullStories`? Endpoint nào thực thi kiểm tra này và trả mã lỗi gì? Hiện chưa đủ bằng chứng để tự đặt quy tắc khóa truyện ở FE.
3. **Phạm vi nội dung:** `backgroundUrl` là ảnh hoàn chỉnh hay chỉ nền cần ghép slots/nhân vật? Nếu cần hiển thị giống bản editor, contract đọc lấy assets/animation ở đâu?
4. **Nếu cần tính tiến độ:** đọc bằng tài khoản Parent có ghi nhận cho bé không? Nếu có, cần API/session và childProfileId được xác minh, không tự dùng API nộp quiz của Child thay thế.

P0 và UI P1 có thể triển khai ngay. Quy tắc gói và lọc bản phát hành phải xác nhận trước nghiệm thu quyền truy cập; câu 3 chỉ chặn phần render nâng cao, câu 4 chỉ chặn tracking.

## Nghiệm thu khi triển khai

- Parent mở một truyện Active từ thư viện và từ URL trực tiếp, đọc đúng thứ tự, refresh không mất nội dung.
- Không đọc Draft/Pending/Archived; xử lý truyện bị gỡ giữa phiên và ID không tồn tại.
- Dữ liệu trả không đúng thứ tự, mảng rỗng, ảnh/audio null hoặc lỗi đều xử lý rõ ràng.
- Đổi trang không phát chồng audio; loading/lỗi không xuất hiện nội dung mock.
- Xác minh bằng tài khoản Parent thật, kiểm tra Network đúng endpoint/JWT và hành vi Free/Plus theo contract BE; không dùng phiên Content Manager để kết luận Parent có quyền.
- Kiểm tra build và luồng desktop/mobile; ghi rõ phần nào mới kiểm tra contract, phần nào đã chạy end-to-end.
