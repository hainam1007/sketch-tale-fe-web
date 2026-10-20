# Tài liệu dự án SketchTale

Danh mục này chỉ giữ các tài liệu còn backlog, cần contract/quyết định, hoặc chưa được nghiệm thu. Bản tổng quan hiện trạng là [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md). Các trạng thái API chi tiết và bước triển khai nằm trong runbook và báo cáo tích hợp.

## Đầu mối

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

Tài liệu hoàn tất, bản kế hoạch cũ đã được thay thế và snapshot OpenAPI trùng lặp đã được dọn. Qua rà soát không có file tài liệu nào rỗng; mọi file còn lại có nội dung và backlog, contract hoặc điều kiện nghiệm thu chưa đóng. OpenAPI snapshot được giữ làm dữ liệu tham chiếu cho công việc API còn mở.