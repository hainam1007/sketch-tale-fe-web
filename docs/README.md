# Tài liệu SketchTale

**Cập nhật source Backend 27/11/2026:** `main` đã pull tới `f0e1ffb`; xem [delta API hiện hành](api/CONTRACTS.md), [Backlog](BACKLOG.md) và [tổng quan](PROJECT_SUMMARY.md). Pull mới lọc catalog truyện `Active`, thêm lọc theo token Child, sửa route education-theme và thay tracking subscription. Swagger 18/11 là snapshot deploy cũ, chưa xác nhận deploy bản mới. BE chỉ được đọc để đối chiếu; không sửa logic Backend trong lượt tài liệu.

**Cập nhật 18/11/2026:** đã đối chiếu BE `de3209f` + staged và Swagger live **120 paths/161 operations**. Đọc [tổng quan](PROJECT_SUMMARY.md), [contract mới](api/CONTRACTS.md) và [backlog](BACKLOG.md) trước các báo cáo kiểm chứng 14–17/11. BE chỉ đọc; mọi thiếu sót/quyền/contract phải báo người dùng, không tự sửa Backend.

Cập nhật 13/11/2026 theo FE và BE local, gồm thay đổi chưa commit. Điểm bắt đầu cho chat mới là [PROJECT_SUMMARY](PROJECT_SUMMARY.md).

## Đọc theo công việc

Kế hoạch nối các API thật còn mở: [API_INTEGRATION](plans/API_INTEGRATION.md). Đọc mục này trước khi bật thêm capability production.

| Cần làm | Đọc theo thứ tự |
| --- | --- |
| Bắt đầu chat mới | [Tổng quan](PROJECT_SUMMARY.md) → [Backlog](BACKLOG.md) → đúng role bên dưới |
| Parent | [Parent](roles/PARENT.md) → [Contract API](api/CONTRACTS.md) |
| Soạn truyện / reader | [Content Manager](roles/CONTENT_MANAGER.md) → [Composition v1](api/COMPOSITION_V1.md) → [Kế hoạch reader](plans/WEB_READER.md) |
| Admin | [Admin](roles/ADMIN.md) → [Contract API](api/CONTRACTS.md) |
| Public / Mobile | [Public và Child](roles/PUBLIC_CHILD.md) |
| Auth / phiên / cấu hình | [Auth](api/AUTH.md) → [Kiến trúc](ARCHITECTURE.md) |
| Tra endpoint BE local | [Danh mục route từ controller](api/ENDPOINTS.md); DTO/service dẫn trong [contract](api/CONTRACTS.md) |
| Chỉnh UI chi tiết | [Đặc tả tham chiếu](specs/README.md), chỉ đọc phần màn hình đang làm |

## Cấu trúc và quy tắc cập nhật

- Gốc `docs/`: tổng quan, mục lục, kiến trúc và một backlog đang mở.
- `roles/`: trách nhiệm, trạng thái source và điểm chạm code từng role.
- `api/`: contract hiện tại, Auth, CompositionJson và fixture.
- `plans/`: kế hoạch chưa hoàn tất; hiện giữ luồng soạn → xuất bản → reader.
- `specs/`: yêu cầu UI/nghiệp vụ để tham chiếu, không phải báo cáo trạng thái API.
- `development/`: hướng dẫn demo local; `diagrams/`: sơ đồ dự án.

Khi hoàn tất việc: cập nhật role/contract, bỏ dòng khỏi backlog hoặc thu gọn thành quyết định còn giá trị; không tạo thêm chuỗi report/plan theo ngày. Chỉ ghi `verified-runtime` khi có request thực tế và kết quả; build hoặc intercept không thay thế kiểm tra BE.

Đợt 13/11 đã gộp các audit, runbook, handoff và report cũ vào các nguồn trên; bỏ snapshot 19/10 trong docs. Snapshot API theo ngày ở `artifacts/` vẫn giữ để tra chứng cứ, không phải nguồn live. Các đặc tả dài còn checklist chưa nghiệm thu được giữ riêng. [Bản đồ thay thế tài liệu](development/DOCS_MIGRATION.md) giúp tìm tên cũ.

## Prompt cho chat mới

```text
Đọc docs/PROJECT_SUMMARY.md, docs/BACKLOG.md và docs/roles/<ROLE>.md.
Kiểm tra git status của FE và BE; giữ thay đổi đang có.
Tiếp tục mục <ID backlog>. Dùng api/CONTRACTS.md và source để xác minh
method/path/DTO/quyền, phân biệt BE local với snapshot/deploy.
Chỉ đọc specs của màn hình liên quan. Hoàn thành phần đủ điều kiện,
ghi rõ phần bị chặn và kiểm thử đã chạy; cập nhật tài liệu hiện hành.
```
