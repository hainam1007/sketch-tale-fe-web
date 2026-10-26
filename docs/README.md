# Tài liệu dự án SketchTale

Danh mục gồm hướng dẫn hiện tại, contract/backlog và báo cáo lịch sử. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) chứa thông tin sản phẩm và snapshot ngày 19/10, không phải bảng API mới nhất.

## Hiện trạng và tài liệu mới

- [Kiến trúc, cấu hình và kiểm thử](ARCHITECTURE.md): đối chiếu source 24/10.
- [Parent experience v2](api-integration/PARENT_EXPERIENCE_V2_2026-10-23.md): thay thế hướng UI “sắp ra mắt”.
- [Parent API/UX](api-integration/PARENT_API_UX_PLAN_2026-10-23.md), [Admin API](api-integration/ADMIN_API_PLAN_2026-10-23.md): tích hợp 23/10.
- [API status 21/10](api-integration/API_IMPLEMENTATION_STATUS_2026-10-21.md), [connection plan](api-integration/API_CONNECTION_PLAN_2026-10-21.md), [handoff](api-integration/LUNA_API_HANDOFF_2026-10-21.md), [operation matrix](api-integration/LUNA_API_OPERATION_MATRIX_2026-10-21.md).
- [Auth controller](AUTH_CONTROLLER_README.md), [Auth optimization](AUTH_API_OPTIMIZATION_PLAN.md), [Parent API còn thiếu](PARENT_MISSING_APIS_BACKEND.md).

## Tổng quan và lịch sử đợt 19/10

| Tài liệu | Phạm vi hiện còn mở |
| --- | --- |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Tổng hợp sản phẩm, stack, API hiện trạng, blocker và việc tiếp theo |
| [LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md) | Các bước nối API, mock theo capability, kiểm thử và blocker |
| [API implementation report](api-integration/luna-extramax/implementation-report-2026-10-19.md) | Phần đã đổi trong source, mock được giữ và kiểm chứng còn thiếu |
| [Luna decisions](api-integration/luna-extramax/decisions.md) | Các quyết định đã chốt và blocker ownership/child ID còn mở |
| [Backend source audit](api-integration/luna-extramax/backend-source-audit-2026-10-19.md) | Enum, DTO, ownership và hành vi backend cần xử lý/kiểm chứng |
| [OpenAPI snapshot](api-integration/openapi-2026-10-19.snapshot.json) | Contract tham chiếu cho API work chưa nghiệm thu |

## Tài liệu theo khu vực

| Khu vực | Tài liệu còn mở |
| --- | --- |
| Thiết kế chung | [DESIGN.md](DESIGN.md) — migration thị giác và QA chưa hoàn tất |
| Public | [Public Website.md](Public%20Website.md) — đặc tả và nghiệm thu website; chưa có billing thật |
| Parent | [PARENT_IMPLEMENTATION_PLAN.md](PARENT_IMPLEMENTATION_PLAN.md) — yêu cầu theo hồ sơ bé và tích hợp còn bị chặn bởi ownership backend |
| Content Manager | [CONTENT_MANAGER_UI_UX_PLAN.md](CONTENT_MANAGER_UI_UX_PLAN.md), [CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md](CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md), [CONTENT_MANAGER_CONTRACT.md](CONTENT_MANAGER_CONTRACT.md) |
| Story Editor | [STORY_EDITOR_UX_REDESIGN_PLAN.md](STORY_EDITOR_UX_REDESIGN_PLAN.md), [STORY_EDITOR_CANVA_ANIMATION_PLAN.md](STORY_EDITOR_CANVA_ANIMATION_PLAN.md), [STORY_EDITOR_UI_UX_DETAIL_SPEC.md](STORY_EDITOR_UI_UX_DETAIL_SPEC.md) |
| Admin | [ADMIN_UI_UX_PLAN_2026-10-17.md](ADMIN_UI_UX_PLAN_2026-10-17.md), [ADMIN_CONTRACT.md](ADMIN_CONTRACT.md) |

Giữ báo cáo và snapshot theo ngày để truy vết contract/quyết định. Kế hoạch cũ không xác nhận hành vi source mới. Kiểm tra local hoặc request được intercept không chứng minh quyền truy cập, persistence hay trạng thái deploy của backend thật.
