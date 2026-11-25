# SketchTale — ngữ cảnh cho chat mới

## Source Backend mới — 24/11/2026

**Đối chiếu Frontend 24/11:** `parentProfileService.list` vẫn gọi `/parent-profiles/child?parentId=<user.id>`; màn chi tiết/sửa dùng `/child-profiles/{id}` và PUT rồi GET lại. FE chưa có caller/allowlist cho `allowed-themes` hoặc `story-recommends`; hai mảng mới chỉ đi qua `...value` trong mapper, chưa có UI điều chỉnh. Subscription service vẫn đọc `parentProfile.parentProfileId` cũ trước khi fallback User ID, chưa ưu tiên `parentProfile.id`. `.env.development` bật subscription real, `.env.production` tắt; checkout real cả hai. Payment return chỉ refresh `/auth/profile`, chưa có order status API. Vì vậy các endpoint BE mới **chưa được xem là đã nối FE**.

BE `main` đã fast-forward từ `de3209f` tới `3c1e02f` (12 commit). Các thay đổi local cũ đã được giữ lại, trừ khác biệt ở `StoryTemplateRepository.cs` đang dùng bản upstream; toàn bộ bản local có trong stash `codex-preserve-local-before-backend-pull-2026-11-24`. Đây là đối chiếu source, chưa có build, request runtime hay xác nhận deploy mới.

- `GET/PUT /api/child-profiles/{id}/allowed-themes` và `/story-recommends` đã có trong source. GET trả mảng DTO; PUT nhận `{themeIds}` hoặc `{storyTemplateIds}`, thay thế toàn bộ tập hợp, bỏ ID trùng; null/mảng rỗng xóa hết. **Cả bốn action chỉ có role gate ở controller, chưa ràng buộc `{id}` với Parent/Child đang đăng nhập.** Chưa bật luồng này cho dữ liệu thật trước khi BE sửa owner scope.
- `POST /api/system-jobs/reset-daily-limits` và `/check-expire-subscriptions` dùng header `X-Cron-Secret` từ cấu hình; đây là job nội bộ. Việc có endpoint không chứng minh scheduler đã được cấu hình/chạy. Job hết hạn đọc Active subscription bằng `AsNoTracking()` rồi đổi status nhưng không gọi `Update`, cần BE xác nhận/sửa persistence.
- Webhook PayOS đã cập nhật `ParentProfile.SubscriptionPlanId`, `RemainingMonthlyCredit` và log credit khi thanh toán thành công. Luồng payment vẫn cần xác minh runtime, idempotency và status/owner read-back; các endpoint subscription/ParentProfile chưa có owner gate.
- DTO ChildProfile có thêm `allowedThemes` và `storyTemplateRecommends`; migration bảng liên kết có trong source. Xem [contract](api/CONTRACTS.md), [Parent](roles/PARENT.md) và [Backlog](BACKLOG.md).

## Delta PUB-01 FE — 18/11/2026

- Đã hoàn thiện guard FE publish theo dữ liệu server: cho phép story Draft/Active/Pending/Archived khi cover + trang hợp lệ và các trang/vai/slot/quiz còn dùng đều Draft/Active; child Pending/Archived/unknown bị chặn và hiển thị status; không PUT Active hàng loạt.
- Một thao tác chỉ gửi một POST; dirty/pending save/upload được kiểm tra lại sau xác nhận. Sau POST, FE đọc lại story/pages/roles/slots/quizzes và chỉ báo thành công khi các thành phần publishable đều Active. Read-back lỗi/không đủ hoặc timeout không tự POST lại.
- Thêm stateful intercept cho Draft → Active cascade, Parent context sạch, catalog/detail, page order/slot/quiz, pending/dirty/upload, từ chối, timeout, read-back retry GET, count 0 và route reader. Suite liên quan 37/37 passed; lint exit 0 còn 21 warnings, build thành công với cảnh báo chunk lớn. Đây không phải xác minh BE runtime.
- BE source hiện promote story Pending/Archived lên Active không điều kiện; FE chỉ gửi publish khi child cần đọc đều Draft/Active, rồi đọc lại trạng thái. Source route Parent `/published/{storyId}` không khớp Swagger 18/11 và FE route `/pages/{storyId}`. Swagger live GET đã timeout; không có runtime mutation hoặc Child test lượt này.
- Chi tiết action, file/method, bằng chứng và điều kiện BE: [Content Manager](roles/CONTENT_MANAGER.md), [contract](api/CONTRACTS.md), [backlog](BACKLOG.md). PUB-01 còn mở tới khi release/route/reader hierarchy và policy được xác minh runtime.

## Thay đổi quan trọng ngày 18/11

Cuối lượt BE có thêm 2 file unstaged bên cạnh 24 file staged: create-page giữ empty string và slot cho phép nhiều lần xuất hiện cùng role/page. Đây là thay đổi local từ ngoài lượt docs, chưa xác nhận deploy; xem [contract](api/CONTRACTS.md).

- Ghi chú của lượt docs trước khi bắt đầu delta PUB-01 FE: chỉ cập nhật docs + Swagger; không sửa BE hoặc gọi mutation. Delta FE hiện tại được ghi riêng bên trên; giữ nguyên các kết quả kiểm thử cũ đúng ngày.
- BE mới có cascade publish/unpublish, gallery/upload ảnh CM, role alias upload và URL reuse; vocabulary đổi wordVi, profile DTO đổi id.
- Swagger thêm allowed-themes/story-recommends (local chưa có); generated-stories có nhưng thiếu owner checks. Không tự bật capability mới.
- Cần BE xử lý/xác nhận: generated-story ownership/Active, vocabulary audio mapping, source deploy lệch local, staged ChildProfileRepository dùng field không tồn tại. Payment/Admin security gaps vẫn mở.
- [Contract và yêu cầu đầy đủ](api/CONTRACTS.md), [backlog cập nhật](BACKLOG.md). Kết quả audit/test 14–17/11 bên dưới là lịch sử, không phải nghiệm thu release mới.

**Cập nhật 18/11/2026.** Web kể chuyện tương tác từ tranh vẽ của trẻ, hướng tới nhóm 6–10 tuổi; Child dùng ứng dụng Mobile riêng. Tên đề án: “SketchTale — An Interactive Storytelling System from Children’s Drawings”. Kế hoạch đề án đã ghi 09/2026–03/2027; chưa có danh sách phân công được xác nhận trong repo.

## Nguồn và mức xác minh

| Nguồn | Baseline đợt này |
| --- | --- |
| FE `SEP490sketchtale` | HEAD `ef76104851bcfd7ea39941ed74d24d58b0a313b8` |
| BE `../SEP490Backend/sketch-tale-backend` | Hiện tại HEAD `3c1e02f` + thay đổi local đã khôi phục; snapshot lịch sử 18/11 dựa trên `de3209f`. Chỉ đọc source khi cập nhật docs |
| API snapshot gần nhất đọc được | [18/11](../artifacts/swagger-docs-2026-11-18.json): 120 paths / 161 operations |
| Live Parent | 14/11 đọc catalog/pages/roles/slots/plans; 16/11 xác nhận `GET /parent-profiles/child?parentId=`; quiz own child 403; deploy khác BE local |

Audit Parent đã sửa FE và chạy build/lint/intercept; 16/11 runtime GET tái hiện Parent mẫu nhận nhầm `kietlac` qua `/child-profiles`, còn `GET /parent-profiles/child?parentId=` trả đúng danh sách theo Parent ID. FE source hiện gọi route đúng và đổi query key để loại cache cũ; UI browser sau sửa chưa runtime recheck. Người dùng pull BE lên `7849600`, giữ nguyên staged modifications; BE chỉ được đọc, không mutation hồ sơ/Character/payment/publish/delete runtime. Source pull không đồng nghĩa đã deploy. Ma trận đầy đủ, bằng chứng và yêu cầu BE còn mở ở [Parent](roles/PARENT.md).

## Role và hiện trạng

| Role | Đã có trong source | Phần đang mở |
| --- | --- | --- |
| [Public / Child](roles/PUBLIC_CHILD.md) | Public website, auth, catalog gói; Child login adapter, luồng vẽ/AI nằm BE/Mobile | Nội dung public, entitlement; Mobile renderer v1 chưa xác minh |
| [Parent](roles/PARENT.md) | Profile/read-back recovery, Character approval, catalog/reader composition + default roles/slots, checkout return profile refresh; quiz caller theo Swagger mới | Quiz own child 403 nên disabled; PayOS return success nhưng gói vẫn Free cần webhook entitlement + order status BE; ownership A/B; dashboard/settings mở rộng/library riêng thiếu contract |
| [Content Manager](roles/CONTENT_MANAGER.md) | Story/page/role/slot/vocab/quiz, publish/read-back; **CompositionJson v1 đọc/ghi** | Reader runtime và route release, media durable, save race giữa client, lifecycle Pending/Archived và sửa published |
| [Admin](roles/ADMIN.md) | Users/catalog/report/audit adapters | Quyền và policy mutation, pagination, revenue/credit metrics, limits/monitoring/statistics |

`.env.production` đặt Auth/Content real; Parent core mock nhưng profile/catalog/payment/approvals **real**, subscription và quiz **disabled** (quiz bị 403 runtime). Theo yêu cầu mới của người dùng, `.env.development` bật đọc subscription cho FE local; route BE hiện thiếu Authorize/owner scope nên đây chỉ là opt-in local, không được bật production. FE lấy ID từ `/auth/profile`; khi DTO thiếu ID, fallback User.Id dựa trên quan hệ PK/FK đã xác nhận ở source local. Intercept đã kiểm tra contract/owner mismatch/lỗi/race; chưa xác minh subscription runtime. BE mới đổi ParentProfileDto sang `id`; FE subscription cần đọc field mới, không còn yêu cầu map field ParentProfileId cũ; xem [contract API](api/CONTRACTS.md). Admin core mock, catalog real; reports mặc định real. Đây là cấu hình repo, không phải xác minh hosting. Xem [kiến trúc](ARCHITECTURE.md).

## Quyết định đã chốt

1. API đủ contract/quyền thì nối theo capability. Phần chưa hỗ trợ dùng mock có nhãn; lỗi API thật không tự fallback mock.
2. Dashboard Parent theo từng bé; không trộn dữ liệu giữa bé/tài khoản. ChildProfile ID, User ID, Character ID và mapping ID phải dùng đúng resource.
3. FE tự thiết kế **CompositionJson v1**, BE lưu chuỗi; không chờ BE thiết kế schema animation. Mobile cần triển khai theo format FE, không phải điều kiện để FE tiếp tục làm reader web.
4. MVP đọc web dùng template/default characters, một narration mỗi trang. Upload nhiều file audio, asset registry, analytics và snapshot publish chưa được coi là đã hỗ trợ.
5. Duyệt Character không cấp mặc nhiên quyền vai nhạy cảm; mapping approval là nghiệp vụ khác.
6. BE source publish cascade Draft → Active cho pages/slots/roles/quizzes và có unpublish Active → Draft. Story Pending/Archived hiện vẫn bị đặt Active; chưa nghiệm thu runtime hoặc immutable version. Không tự thay hide DELETE bằng unpublish.

## Ưu tiên tiếp theo

Đối chiếu Content Manager 18/11: xem kết quả suite/lint/build mới nhất ở [ma trận CM](roles/CONTENT_MANAGER.md). Intercept mô phỏng cascade Draft → Active nhưng không xác minh DB, deploy hoặc authorization BE. Runtime CM/Parent đã đọc truyện “Tôn giáo” Active nhưng pages đều Draft, chưa có CompositionJson (14–15/11); route/status runtime chưa được tái kiểm tra trong lượt này. Không có Child test; không mutation nội dung.

- **DOC-API-01 / WEB01:** thống nhất route pages FE–BE–deploy và trạng thái con khi publish.
- **WEB02–06:** rà codec, reader dùng chung, queue lưu, migration media và đọc trên trình duyệt sạch; [kế hoạch chi tiết](plans/WEB_READER.md).
- **SEC-01 / PAY-01:** owner scope credit/subscription/ParentProfile/payment cancel; payment status và entitlement.
- Nghiệm thu approvals/profile với hai Parent; chuẩn hóa upload role và kiểm thử Auth refresh.

Toàn bộ việc chưa đóng và tiêu chí nghiệm thu: [BACKLOG](BACKLOG.md). Tra request/response/quyền: [API contracts](api/CONTRACTS.md). Bắt đầu chat mới chỉ cần tài liệu này + backlog + đúng role; không cần đọc toàn bộ specs.

## Giá gói và tài khoản test

Mốc sản phẩm do người dùng cung cấp 17/09/2026: Free 1 bé/5 lượt AI; Pro 35.000đ/tháng, 3 bé/30 lượt AI/5 video; Family 89.000đ/tháng, 5 bé/100 lượt AI/video không giới hạn. Đây là yêu cầu lịch sử, không ghi đè catalog/entitlement server và không chứng minh billing đã hoàn tất.

Tài khoản test đã ghi nhận: `admin@sketch.tale.com`, `manager@sketch.tale.com`, `parent@sketch.tale.com`. Mật khẩu ở `.test-accounts.local` nếu máy có tệp này; không đưa credential/token vào docs. Không dùng tài khoản/dữ liệu thật để tự xuất bản hoặc thử thanh toán.

## Admin audit 16/11/2026

Đã sửa FE Users/CharType/catalog/report/audit và thêm intercept; tạm khóa tạo Child và gán gói Parent theo quyết định người dùng. Runtime Admin login/đọc/logout 200; **anonymous GET audit/reports/ParentProfile cũng 200**, cần BE xử lý P0. Dashboard để trống metric thiếu API/dữ liệu, không dựng nội dung mặc định. Swagger mới 111 paths; không mutation dữ liệu thật. [Ma trận action, bằng chứng và yêu cầu BE](roles/ADMIN.md).
