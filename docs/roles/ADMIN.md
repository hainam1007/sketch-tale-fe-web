# Admin — quản trị

Ngày 13/11/2026. Source: `src/features/admin/services/{adminService,adminCatalogService,adminModerationCatalogService}.js`, routes ở `src/app/App.jsx`. Đặc tả UI tham chiếu: [Admin UI/UX](../specs/ADMIN_UI_UX.md).

## Hiện trạng source

| Năng lực | API hiện hữu/caller | Phần chưa nghiệm thu |
| --- | --- | --- |
| Users | GET list/detail, POST, PUT `/users/{id}`, PATCH status | Response/nullable fields, role policy, self/last active admin, session invalidation, audit reason |
| Catalog | subscription-plans, credit-costs, education-themes, restricted-keywords, char-types, prohibited-themes | Đơn vị giá, tác động quota/giá với gói đang dùng, xóa resource có tham chiếu |
| Reports | GET list/detail, PATCH, caller delete | Transition/side effect lên target, note/reviewer/time; không suy PATCH status là đã ẩn nội dung |
| Audit | List/detail và filter routes | Pagination/timezone/outcome/requestId, actor lookup; không chèn actor giả |
| Parent plan/subscription | Caller quản trị hiện có | BE thiếu auth/owner ở nhóm này; UI Admin không làm API an toàn |
| Overview | Tổng hợp từ các list trong service | Không gọi tổng price là doanh thu thực thu; cần metric ledger có định nghĩa |
| Permissions/limits/monitoring/statistics | Mock/chưa contract đủ; một số route redirect | Kiểm tra App.jsx trước mở màn hình mới |

Admin core mode mock không khóa users/audit: chúng gọi forceReal. Reports mặc định real; catalog mode riêng. Không tiếp tục đòi `/admin/users` như endpoint chưa có: BE đã có `/users`. Role change có field trên PUT user nhưng policy cần xác minh trước mở quyền trên UI.

## Contract còn mở

- **ADM-01:** response User không chứa credential/hash/security stamp; shape array/envelope và pagination rõ; role catalog/policy theo actor, self/last-admin, PUT omitted/null, lock expiry và hiệu lực phiên.
- **ADM-02:** report transition, evidence/target preview có quyền, note/reviewer/time/audit; moderation action tách với trạng thái report khi cần.
- **ADM-03:** revenue/credit aggregate từ ledger, range/timezone/currency/generatedAt/null; active account khác DAU/MAU. Không suy real metrics từ mock hay số lượng list bị phân trang.
- **ADM-04:** system limits có unit/min/max/enforcement; monitoring retry/cancel có idempotency; statistics có nguồn dữ liệu. Triển khai khi scope màn hình được mở.
- **CROSS-01:** error shape, reason/revision/ETag và conflict; không coi revision phía mock là hỗ trợ BE.

Tiêu chí chung: Admin được phép, non-Admin bị từ chối ở BE; mutation đọc lại đúng; audit thật; request/response lỗi được mô tả. Bảng API và evidence ở [contracts](../api/CONTRACTS.md), thứ tự ở [backlog](../BACKLOG.md).
