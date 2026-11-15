# Public và Child/Mobile

Public web trình bày sản phẩm, truyện mẫu, catalog gói, đăng ký/đăng nhập và profile. Quyền lợi gói từ catalog không chứng minh entitlement đã được cấp. Nội dung/giá lịch sử xem [tổng quan](../PROJECT_SUMMARY.md); đặc tả ở [Public website](../specs/PUBLIC_WEBSITE.md). Asset prototype, nội dung/chính sách public và điều kiện gỡ noindex cần nghiệm thu trước phát hành.

Child có tài khoản riêng do Parent tạo; workspace Child thuộc Mobile, không có màn quản trị Child trên web. FE có loginChild adapter nhưng không đồng nghĩa SPA đã có luồng đăng nhập Child đầy đủ. Register Child liên kết Parent từ JWT, không nhận Parent tùy ý.

BE có `POST /api/drawings/analyze` (multipart File/DrawingType/ChildProfileId), `POST /api/drawings/generate-character` và Character accept/cancel-preview. Luồng preview → pending → Parent approved khác với gán nhân vật vào truyện. Hai action accept/cancel-preview chưa có Authorize ở controller local; đối chiếu quyền JWT/owner là SEC-02, không dùng childProfileId từ client làm bằng chứng quyền.

Mobile cần đọc [Composition v1](../api/COMPOSITION_V1.md), fixture, DTO story/page/role/slot và quy tắc playback từ FE. Chưa xác minh Mobile hỗ trợ. Không yêu cầu Mobile phê duyệt schema mới cho phép FE tiếp tục; vẫn cần nghiệm thu renderer từng client. Quiz history API không thay thế event/scoring/time tracking mà Mobile cần ghi.

Backlog: owner scope Mobile; renderer v1; read/scoring/log contract theo ChildProfile; entitlement/allowed themes thực thi server; dữ liệu riêng của bé và xuất truyện theo version khi scope được xác nhận.
