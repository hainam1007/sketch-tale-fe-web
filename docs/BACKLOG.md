# Backlog đang mở

## P0 sau pull Backend 27/11/2026 (`f0e1ffb`)

| ID | Cần xử lý | Điều kiện đóng |
| --- | --- | --- |
| STORY-READ-27 | List truyện và list theo theme chỉ trả Active, nhưng `GET /api/story-template/stories/{id}` vẫn trả Draft/Pending/Archived cho Parent và Child không có cấu hình. Guard detail từng ở thay đổi BE local trước pull không còn trong working tree, vẫn có trong stash ngày 27/11. | BE bảo vệ detail và mọi direct read theo chính sách Active; Parent/Child gọi ID Draft/Pending/Archived/Inactive nhận 403/404; xác nhận code đã lên đúng release. |
| CHILD-CATALOG-27 | Child list tổng lọc theo `AllowedThemes ∪ StoryTemplateRecommends` khi một collection có dữ liệu; list theo theme chỉ xét AllowedThemes. Cả hai rỗng hoặc identity/profile không hợp lệ thì trả catalog không lọc. | BE chốt ngữ nghĩa rỗng và recommendation ngoài theme, xử lý identity fail closed, kiểm tra list/theme/detail nhất quán với 2 Child test. |
| DEPLOY-PORT-27 | `Program.cs` đổi từ bind `0.0.0.0:$PORT` sang `app.Run()`; cấu hình lắng nghe trên Render chưa được xác nhận. | BE xác nhận bind host/port, healthcheck và Swagger trên release mới; công bố commit deploy. |
| SUB-EXP-24 | Nguyên nhân `AsNoTracking()` cũ đã được sửa trong `SubscriptionRepository.GetActiveSubscription()`; chưa nghiệm thu persistence. Service vẫn chỉ tăng count khi có FREEPLAN và không báo lỗi rõ nếu thiếu plan. | Chạy job/kiểm tra DB: subscription Expired, Parent về Free, count chính xác, lần lặp idempotent, thiếu FREEPLAN có lỗi rõ và không để dữ liệu lệch; xác nhận scheduler/timezone. |

Các mục 24/11 bên dưới là snapshot lịch sử; `SUB-EXP-24` được cập nhật ở bảng 27/11. FE reader trong cả hai env vẫn chọn route `pages`; chưa đổi sang `published` khi chưa xác nhận deploy. BE source và stash chỉ được đọc, không chỉnh sửa trong lượt tài liệu.

## P0 sau pull Backend 24/11/2026

**FE source đã đối chiếu 24/11:** `parentProfileService.list` còn dùng `/parent-profiles/child?parentId=...`; themes/recommends chưa có caller hoặc route allowlist; subscription service chưa ưu tiên `parentProfile.id`; payment return chỉ refresh auth profile. Đây là việc FE còn mở, không phải tính năng đã nối. Xem [contract](api/CONTRACTS.md).

Source `main` 3c1e02f; không có runtime/deploy verification cho commit mới. Mục 18/11 phía dưới là lịch sử và cần đọc theo delta [contract](api/CONTRACTS.md).

| ID | Cần xử lý | Điều kiện đóng |
| --- | --- | --- |
| SEC-THEME-24 | GET/PUT allowed-themes và story-recommends đã có nhưng truy cập `{id}` trực tiếp, không kiểm tra Parent/Child sở hữu profile | Parent A/Child A chỉ đọc ghi profile A; ID B trả 403/404; Admin policy rõ; không expose Draft/Inactive recommendations |
| PAY-01 | Webhook mới đã ghi Parent plan/credit và credit log; vẫn thiếu runtime, owner status API, kiểm tra amount/plan và xử lý parent/plan thiếu | Callback thật và lặp đều nhất quán transaction/subscription/Parent/credit; return đọc lại trạng thái theo JWT; A không xem/hủy order B |
| PAR-02/05 | GET/PUT themes/recommends có contract replace/clear; chưa có owner/enforcement, Parent list có thể thiếu nested data | BE owner gate và lọc status; FE read-back; Mobile/catalog áp dụng policy server; list/detail cùng dữ liệu |
| FE-PAR-24 | Parent list vẫn dùng route cũ với `parentId` client; FE chưa nối themes/recommends, subscription profile ID còn fallback cũ | Sau khi BE owner gate, đổi list sang route phù hợp, nối GET/PUT + read-back, ưu tiên `parentProfile.id`; xác minh A/B và lỗi API thật |

`RELEASE-18` không còn là việc “tạo route themes/recommends” trong source local; vẫn cần xác nhận version deploy và route reader `/pages` so với `/published`. `LOCAL-18` về `parent.UserId` không còn đúng: entity mới có navigation `User`/repository mới cần được kiểm tra bằng build bởi BE. Không tự đóng các mục bảo mật chỉ từ source.

## Ưu tiên sau pull 18/11/2026

Nguồn: BE de3209f + staged; [Swagger 18/11](../artifacts/swagger-docs-2026-11-18.json) 120 paths/161 operations. Không mutation runtime. [Bằng chứng và contract](api/CONTRACTS.md).

| ID | Trạng thái mới / yêu cầu | Điều kiện đóng |
| --- | --- | --- |
| PUB-01 | FE cho phép story Pending/Archived khi child cần đọc Draft/Active; chặn child không cascade. Stateful suite 37/37 passed, lint/build thành công 18/11. Route Parent lệch Swagger/source | Release + route thống nhất; publish/read/unpublish đúng role trên truyện test; Parent/Child chỉ đọc Active hierarchy qua direct URL; BE công bố policy Pending/Archived và sửa published. Chưa runtime verified |
| DOC-API-02 | Alias CM đã sửa source, thêm upload/gallery | Upload test thành công, gallery đúng user; không bypass avatar |
| VOC-18 — P0 tích hợp | FE mapper/payload, Parent reader, saved-RawText validation và read-back đã có source/tests; domain UI vẫn `word`. AudioUrl↔AudioUrlVi source mapping thiếu; người dùng xác nhận BE sẽ bổ sung | FE intercept suites qua; BE khai báo mapping create/read, chứng minh update/create GET read-back giữ audio + đúng release/runtime. Chưa runtime/mutation; VOC-18 chỉ hoàn tất phần FE |
| SEC-GEN-18 — P0 | Generated stories thiếu owner gate, generate nhận template Draft | Parent A/B và Child foreign bị chặn; chỉ template Active; chưa nối library an toàn |
| RELEASE-18 — P0 | Live themes/recommendations chưa có local; reader route khác | BE cung cấp đúng commit/branch deploy + response/error/owner contract; không tạo endpoint trùng |
| LOCAL-18 — P0 | Staged ChildProfileRepository dùng parent.UserId không có trong entity | BE sửa/build chứng minh owner scope; agent không sửa BE |
| PROFILE-18 — P1 | DTO identity đổi sang id; FE subscription còn field cũ/fallback | Dùng id đúng resource, giữ compatibility khi cần; owner gate BE vẫn bắt buộc |
| PAR-02/05 | Allowed themes/recommendations đã công bố; generated library có một phần | Xác minh GET schema, null/empty/replace, enforcement; library mutation còn thiếu |
| MEDIA-18 — P1 | Gallery URL list + remove-background đã có | Xác minh policy role/folder/size/quota; không gọi gallery là full registry |

Các security/payment/scoring gaps cũ chưa đóng. Reading progress dùng delta seconds, cần idempotency/retry policy. Các ma trận lịch sử bên dưới phải đọc cùng delta này; không đóng runtime chỉ từ source mới.

Cập nhật 16/11/2026. Chỉ giữ việc chưa hoàn tất; trạng thái source ở từng role. `source-wired` = có caller, `verified-intercept` = test FE giả lập response, `verified-runtime` = test BE thật. Parent collection runtime đã bổ sung bằng chứng trong [ma trận Parent](roles/PARENT.md); không có mutation runtime.

## P0 — đường đọc, dữ liệu và quyền

15/11 CM baseline: service queue/recovery v2/slot extension persistence và codec fixes đã có, intercept race/read-back/clean reader qua. **Re-audit 18/11:** theo lựa chọn người dùng, FE cho phép story Pending/Archived khi child cần đọc là Draft/Active; child Pending/Archived và incomplete publish read-back bị chặn. Intercept mô phỏng cascade; không mutation/runtime. Truyện Tôn giáo Active nhưng 3 trang reader trả Draft là bằng chứng runtime 14–15/11, chưa tái kiểm tra. Không tự activate pages hoặc mở filter reader. WEB05 migration legacy có checkpoint/resume và WEB07 scoring/logs còn mở; reader vocab/quiz practice đã nối. Xem [ma trận CM](roles/CONTENT_MANAGER.md).

Audit Parent 14/11 đã triển khai recovery hồ sơ, identity/session guards, Character semantics, reader composition/default roles và nối lại màn quiz. [Ma trận nghiệm thu](roles/PARENT.md). Swagger mới 109 paths/148 operations; không đóng các mục BE chỉ từ intercept.

| ID | Phần cần hoàn thiện / bên xử lý | Điều kiện đóng |
| --- | --- | --- |
| DOC-API-01 | FE source đã chuyển reader sang `/published/{storyId}` theo BE local; Swagger/deploy contract và role/slot hierarchy chưa xác minh | Release xác nhận route/method/claim; mọi Parent/Child read chỉ trả story + entity Active; Draft/Pending/Archived bị chặn qua direct URL; không fallback authoring |
| DOC-API-02 | Alias ContentManager đã có source; cần runtime upload/gallery | Đúng token CM upload được, role khác bị chặn, URL đọc ở browser sạch; không bypass avatar |
| WEB01–06 | FE: codec/reader/shared model/save queue/media migration/publish theo kế hoạch | JSON v1 và unknown fields không mất; text-only giữ composition; late response không xóa edits; browser sạch đọc đủ media/layout |
| PUB-01 | FE gates/read-back/intercepts xong; FE reader source dùng `/published/{storyId}`; BE vẫn promote story Pending/Archived và role/slot read chưa gate đầy đủ hierarchy | BE policy rõ và không publish hierarchy thiếu; release xác nhận route/version; CM publish Draft story ≥2 pages/roles/slots/quizzes; Parent/Child đọc catalog/detail/full active pages từ context sạch; deep-link draft bị chặn; unpublish role đúng; workflow sửa published/snapshot được công bố |
| SEC-01 | BE: auth/owner credit/subscription/ParentProfile/payment cancel; `GET /parent-profiles/child?parentId=` phải bind parentId với JWT | Theo yêu cầu người dùng, FE subscription GET chỉ bật trong `.env.development`, lấy ParentProfileId từ `/auth/profile` (fallback User.Id chỉ khi response đã xác minh, theo source relation), intercept chặn response sai owner/session; production vẫn disabled. Đây không thay authorization BE. DTO 18/11 chuyển sang id; FE cần ưu tiên profile.id, BE vẫn phải bảo vệ endpoint. Parent A truyền ID B phải 403/404; non-Admin không quản trị; runtime IDOR trên route đúng chưa kiểm thử |
| SEC-02 | BE/Mobile: accept/cancel-preview lấy child từ client | JWT + child owner, không truy cập chéo, hoàn quota không lặp |
| PAY-01 | BE + FE: order status, cancel semantics, webhook entitlement | PayOS success nhưng Parent còn Free đã được báo. Source local webhook active Subscription nhưng không cập nhật ParentProfile.SubscriptionPlanId; cần webhook atomic/idempotent ghi entitlement, GET status Parent-owned, rồi FE profile/status read-back; không tin return URL |
| PAR-01 | FE/BE: nghiệm thu profile/register/Character approvals đã wired | Hai Parent, đổi bé/cache/logout, sai owner/status, gửi lặp, refetch sau approve/reject; không làm lại 4 adapter |
| PAR-02 | BE: entitlement/usage + allowed themes | Plan hiệu lực/capability/quota/kỳ reset; giới hạn bé được enforce; themes lưu/read-back và áp dụng Mobile/catalog |
| AUTH-01 | FE/BE: refresh, rotation, revocation | Expired access + refresh hợp lệ chạy; revoked/reuse bị chặn; multi-tab/logout race; blacklist theo deployment thực tế |
| QUIZ-14 | BE deploy: GET `/child-quiz-answers/child-profiles/{id}` trả 403 với bé từ list của Parent; local khác deploy | Cung cấp source/version deploy; own Parent 200, foreign Parent 403/404; scope collection/detail; mới bật lại production quiz |
| READ-14 | BE: source GET roles/slots thiếu endpoint role gate; repositories gồm mọi status khác Inactive; page reader route lệch Swagger | Gate story/page/role/slot/quiz status Active trên server; Parent không đọc draft qua deep link; runtime v1 đầy đủ trên resource test |
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
| ADM-02 | Report workflow/evidence, catalogs, audit date filters/pagination | Report Content WF-04 đã có source flow Parent submit → Admin transition/ẩn Story/khóa chủ truyện; runtime còn chờ. Decision note/evidence, catalogs, audit date filter/page vẫn mở |
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
- **ADM-02:** CharType đúng schema; catalog whitelist/code server; reports giữ reason/read-back recovery. WF-04 source đã thêm role/owner gate, status transition, ẩn Story và lockout chủ truyện; cần staging/runtime để đóng. Decision note/evidence và audit scoped date/pagination cùng quota/price/reference policy còn mở.
- **ADM-03/04:** tổng chỉ từ full collection; metric chưa có API để trống, không dựng biểu đồ/cơ cấu giả; giữ redirect các route chưa mở.
- Runtime mutation vẫn chờ dataset/ID test và non-Admin; [ma trận và toàn bộ yêu cầu BE](roles/ADMIN.md).
