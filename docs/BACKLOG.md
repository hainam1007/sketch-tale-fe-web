# Backlog đang mở

Cập nhật 16/11/2026. Chỉ giữ việc chưa hoàn tất; trạng thái source ở từng role. `source-wired` = có caller, `verified-intercept` = test FE giả lập response, `verified-runtime` = test BE thật. Parent collection runtime đã bổ sung bằng chứng trong [ma trận Parent](roles/PARENT.md); không có mutation runtime.

## P0 — đường đọc, dữ liệu và quyền

15/11 CM: service queue/recovery v2/slot extension persistence và codec fixes đã có, intercept race/read-back/clean reader qua. PUB-01 vẫn blocker runtime: truyện Tôn giáo Active nhưng 3 trang reader trả Draft; người dùng đang cung cấp quy trình BE. Không tự activate pages hoặc mở filter reader. WEB05 migration legacy có checkpoint/resume và WEB07 scoring/logs còn mở; reader vocab/quiz practice đã nối. Xem [ma trận CM](roles/CONTENT_MANAGER.md).

Audit Parent 14/11 đã triển khai recovery hồ sơ, identity/session guards, Character semantics, reader composition/default roles và nối lại màn quiz. [Ma trận nghiệm thu](roles/PARENT.md). Swagger mới 109 paths/148 operations; không đóng các mục BE chỉ từ intercept.

| ID | Phần cần hoàn thiện / bên xử lý | Điều kiện đóng |
| --- | --- | --- |
| DOC-API-01 | FE + BE: route reader pages lệch local/snapshot; plan-code allowlist và role detail binding | Method/path/claim thống nhất release; reader Parent/Child đọc story Active, draft bị chặn; role detail nhận đúng UUID |
| DOC-API-02 | BE + FE: upload background-image role alias/403 | Đúng token CM upload được, role khác bị chặn, URL đọc ở browser sạch; không bypass avatar |
| WEB01–06 | FE: codec/reader/shared model/save queue/media migration/publish theo kế hoạch | JSON v1 và unknown fields không mất; text-only giữ composition; late response không xóa edits; browser sạch đọc đủ media/layout |
| PUB-01 | BE + FE: publish chỉ Active story; không activate con/snapshot | Quy tắc trạng thái từng entity rõ, một truyện mới publish đọc đủ trang; giới hạn sửa bản phát hành được công bố |
| SEC-01 | BE: auth/owner credit/subscription/ParentProfile/payment cancel; `GET /parent-profiles/child?parentId=` phải bind parentId với JWT | Theo yêu cầu người dùng, FE subscription GET chỉ bật trong `.env.development`, lấy ParentProfileId từ `/auth/profile` (fallback User.Id chỉ khi response đã xác minh, theo source relation), intercept chặn response sai owner/session; production vẫn disabled. Đây không thay authorization BE. Mapper thiếu `ParentProfile.Id` → `ParentProfileDto.ParentProfileId`; BE cần map field và bảo vệ endpoint. Parent A truyền ID B phải 403/404; non-Admin không quản trị; runtime IDOR trên route đúng chưa kiểm thử |
| SEC-02 | BE/Mobile: accept/cancel-preview lấy child từ client | JWT + child owner, không truy cập chéo, hoàn quota không lặp |
| PAY-01 | BE + FE: order status, cancel semantics, webhook entitlement | PayOS success nhưng Parent còn Free đã được báo. Source local webhook active Subscription nhưng không cập nhật ParentProfile.SubscriptionPlanId; cần webhook atomic/idempotent ghi entitlement, GET status Parent-owned, rồi FE profile/status read-back; không tin return URL |
| PAR-01 | FE/BE: nghiệm thu profile/register/Character approvals đã wired | Hai Parent, đổi bé/cache/logout, sai owner/status, gửi lặp, refetch sau approve/reject; không làm lại 4 adapter |
| PAR-02 | BE: entitlement/usage + allowed themes | Plan hiệu lực/capability/quota/kỳ reset; giới hạn bé được enforce; themes lưu/read-back và áp dụng Mobile/catalog |
| AUTH-01 | FE/BE: refresh, rotation, revocation | Expired access + refresh hợp lệ chạy; revoked/reuse bị chặn; multi-tab/logout race; blacklist theo deployment thực tế |
| QUIZ-14 | BE deploy: GET `/child-quiz-answers/child-profiles/{id}` trả 403 với bé từ list của Parent; local khác deploy | Cung cấp source/version deploy; own Parent 200, foreign Parent 403/404; scope collection/detail; mới bật lại production quiz |
| READ-14 | BE: GET roles/slots public và local repository gồm Draft/Archived | Gate trạng thái story/page/role/slot trên server; Parent không đọc draft qua deep link; runtime v1 đầy đủ trên resource test |
| ADM-01 | BE/FE: User DTO/policy/PUT/status | Không lộ credential; self/last active admin; role policy/null/pagination, audit và hiệu lực phiên có test |

## P1 — mở rộng trên nền dữ liệu thật

| ID | Công việc | Điều kiện đóng |
| --- | --- | --- |
| PAR-03 | Approval history/filter/pagination, reason, revision và quyền vai nhạy cảm | Scope đúng bé, lưu/read reason, stale decision bị chặn; permission độc lập approve Character |
| PAR-04 | Dashboard/progress/settings thật | Summary theo bé, phút đọc/từ vựng từ event, range/timezone; 0 khác missing; nối settings daily caps qua profile |
| PAR-05 | Library riêng, favorite/hide/delete/recommendations | Resource thuộc bé, mutation đọc lại, tham chiếu story rõ; không lấy catalog template thay library |
| PAY-02 | Lịch sử payment/credit | Order/currency/amount/status/time đúng nguồn; credit log không thay payment history |
| WEB07–09 | Quiz/vocab, bỏ demo luồng chính sau migration, nghiệm thu/bàn giao Mobile | Scoring/log owner đúng, không fake kết quả; full reader E2E đúng role; Mobile có format/playback fixtures |
| MEDIA-01 | Upload audio độc lập + media retention | Durable URL, MIME/codec/size/duration, replace/clear; không ghi đè narration để giả kho audio |
| CROSS-01 | Revision/ETag + error contract | Stale write bị BE từ chối nguyên tử; field errors/requestId; multi-entity partial save có recovery |
| PUB-02 | Draft/published version khi cần sửa song song | Bản đang đọc giữ snapshot; retention assets theo references |
| ADM-02 | Report workflow/evidence, catalogs, audit pagination | Transition/target effects/note/actor đúng; giá/quota/delete có quy tắc |
| ADM-03 | Doanh thu/credit và metrics thật | Ledger/currency/range/timezone/generatedAt; không tính doanh thu từ giá gói hiện tại |
| ADM-04 | Limits/monitoring/statistics khi mở scope | Enforcement server; retry/cancel idempotent; metric có định nghĩa |
| UI-01 | Nghiệm thu UI còn mở trong specs | Loading/empty/error/dirty/conflict; keyboard/focus; responsive; rà checkbox với code trước làm lại |

## P2 / theo phạm vi

- Export jobs theo child/story version: status/retry/quota/download expiry/identity; Family report: timezone/recipient/kỳ dữ liệu/server email.
- Link/unlink tài khoản Child có sẵn: proof, revoke và quota; không thay bằng create Child.
- Asset registry/list/detail/delete với ownership và reference checks; Content analytics.
- Public: asset/nội dung/chính sách được duyệt, thay prototype, nghiệm thu rồi gỡ noindex.
- Tối ưu tải theo route/bundle và tách module lớn khi có số đo; không dùng kết quả build cũ để khẳng định hiện trạng.

## Trình tự triển khai

1. Khóa release/route/source và test data; xử lý DOC-API-01/02, PUB-01. FE có thể làm codec/read model/queue bằng intercept đúng contract trong lúc BE xử lý quyền.
2. WEB02–06 + nghiệm thu PAR-01; SEC-01/02 và PAY-01 phải xong trước tuyên bố luồng payment/quota đầy đủ.
3. WEB07–09, Parent P1 và Admin theo nhu cầu; P2 không chặn MVP một narration/template reader.

Khi đóng một ID, cập nhật contract/role và bằng chứng test; không chỉ đánh dấu xong vì có màn hình hoặc build pass. Chi tiết jobs: [WEB_READER](plans/WEB_READER.md). Yêu cầu API hiện tại và nguồn BE: [CONTRACTS](api/CONTRACTS.md).

## Delta Admin 16/11/2026

- **P0 SEC-ADM / AUDIT-DATA:** anonymous GET audit-logs/content-reports/parent-profiles runtime 200; bảo vệ endpoint và lọc Identity secrets trong audit persistence/response, actor thật. Không đóng bằng FE guard.
- **ADM-01:** FE sửa isLockedOut, role ContentManager, changed-only PUT; tạm khóa tạo Child/gán gói theo người dùng. Còn BE self-demotion/last-admin/role-profile lifecycle, revoke token, phone/clear/reason/revision.
- **ADM-02:** CharType đúng schema; catalog whitelist/code server; reports giữ reason/read-back recovery; audit scoped search và bỏ actor giả. Còn auth/transition/evidence/notes và quota/price/reference policy.
- **ADM-03/04:** tổng chỉ từ full collection; metric chưa có API để trống, không dựng biểu đồ/cơ cấu giả; giữ redirect các route chưa mở.
- Runtime mutation vẫn chờ dataset/ID test và non-Admin; [ma trận và toàn bộ yêu cầu BE](roles/ADMIN.md).
