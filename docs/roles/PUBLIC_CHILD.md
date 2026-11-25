# Public và Child/Mobile

## Delta Backend 24/11/2026

Source mới có GET/PUT `child-profiles/{id}/allowed-themes` và `/story-recommends`, cùng hai mảng trong ChildProfileDto. Chúng chưa được ràng buộc owner theo `{id}`; Mobile không nên coi danh sách này là enforcement an toàn cho đến khi BE sửa và kiểm tra Child/Parent khác tài khoản. PUT chỉ cho Parent/Admin theo role. Job reset daily limits là endpoint nội bộ dùng `X-Cron-Secret`, Mobile chỉ đọc `remainingTimeLimit`/`remainingCharacterLimit` mới từ profile sau reset, không gọi job. Xem [contract](../api/CONTRACTS.md).

## Đối chiếu 18/11/2026

Generated-story generate/detail/list đã có; quyền Parent/Child ở controller nhưng thiếu ownership và chỉ loại template Inactive ở service. Chưa đủ điều kiện nối an toàn. Allowed themes/recommendations live có thêm nhưng source local chưa khớp, cần enforcement server được xác minh.

Drawing generate nhận charTypeId nullable (null/chuỗi trắng được converter xử lý), CharacterTypeOption thêm nameVi; Program đăng ký NullableGuidConverter toàn cục. Luồng AI thêm xóa nền; không coi đây là API được bảo vệ đầy đủ: DrawingController không Authorize và child ID vẫn cần kiểm tra quyền. Character list/name cũng thiếu Authorize và owner check chỉ chạy khi có user ID.

Reading-log mutations thuộc Child; Parent chỉ đọc các GET được cấp quyền. GeneratedStoryId khác StoryTemplateId. Progress seconds cộng dồn, cần chống gửi lặp. Chi tiết và blocker tại [contract 18/11](../api/CONTRACTS.md); Mobile renderer/scoring runtime chưa nghiệm thu.

Public web trình bày sản phẩm, truyện mẫu, catalog gói, đăng ký/đăng nhập và profile. Quyền lợi gói từ catalog không chứng minh entitlement đã được cấp. Nội dung/giá lịch sử xem [tổng quan](../PROJECT_SUMMARY.md); đặc tả ở [Public website](../specs/PUBLIC_WEBSITE.md). Asset prototype, nội dung/chính sách public và điều kiện gỡ noindex cần nghiệm thu trước phát hành.

Child có tài khoản riêng do Parent tạo; workspace Child thuộc Mobile, không có màn quản trị Child trên web. FE có loginChild adapter nhưng không đồng nghĩa SPA đã có luồng đăng nhập Child đầy đủ. Register Child liên kết Parent từ JWT, không nhận Parent tùy ý.

BE có `POST /api/drawings/analyze` (multipart File/DrawingType/ChildProfileId), `POST /api/drawings/generate-character` và Character accept/cancel-preview. Luồng preview → pending → Parent approved khác với gán nhân vật vào truyện. Hai action accept/cancel-preview chưa có Authorize ở controller local; đối chiếu quyền JWT/owner là SEC-02, không dùng childProfileId từ client làm bằng chứng quyền.

Mobile cần đọc [Composition v1](../api/COMPOSITION_V1.md), fixture, DTO story/page/role/slot và quy tắc playback từ FE. Chưa xác minh Mobile hỗ trợ. Không yêu cầu Mobile phê duyệt schema mới cho phép FE tiếp tục; vẫn cần nghiệm thu renderer từng client. Quiz history API không thay thế event/scoring/time tracking mà Mobile cần ghi.

Backlog: owner scope Mobile; renderer v1; read/scoring/log contract theo ChildProfile; entitlement/allowed themes thực thi server; dữ liệu riêng của bé và xuất truyện theo version khi scope được xác nhận.
