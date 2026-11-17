# SketchTale — ngữ cảnh cho chat mới

**Cập nhật 14/11/2026.** Web kể chuyện tương tác từ tranh vẽ của trẻ, hướng tới nhóm 6–10 tuổi; Child dùng ứng dụng Mobile riêng. Tên đề án: “SketchTale — An Interactive Storytelling System from Children’s Drawings”. Kế hoạch đề án đã ghi 09/2026–03/2027; chưa có danh sách phân công được xác nhận trong repo.

## Nguồn và mức xác minh

| Nguồn | Baseline đợt này |
| --- | --- |
| FE `SEP490sketchtale` | HEAD `de1649a5070bc8da223dc9da197df762e27b637f` + working tree |
| BE `../SEP490Backend/sketch-tale-backend` | HEAD `7849600` + staged modifications; chỉ đọc, không sửa |
| API snapshot gần nhất đọc được | [14/11](../artifacts/swagger-parent-2026-11-14.json): 109 paths / 148 operations |
| Live Parent | 14/11 đọc catalog/pages/roles/slots/plans; 16/11 xác nhận `GET /parent-profiles/child?parentId=`; quiz own child 403; deploy khác BE local |

Audit Parent đã sửa FE và chạy build/lint/intercept; 16/11 runtime GET tái hiện Parent mẫu nhận nhầm `kietlac` qua `/child-profiles`, còn `GET /parent-profiles/child?parentId=` trả đúng danh sách theo Parent ID. FE source hiện gọi route đúng và đổi query key để loại cache cũ; UI browser sau sửa chưa runtime recheck. Người dùng pull BE lên `7849600`, giữ nguyên staged modifications; BE chỉ được đọc, không mutation hồ sơ/Character/payment/publish/delete runtime. Source pull không đồng nghĩa đã deploy. Ma trận đầy đủ, bằng chứng và yêu cầu BE còn mở ở [Parent](roles/PARENT.md).

## Role và hiện trạng

| Role | Đã có trong source | Phần đang mở |
| --- | --- | --- |
| [Public / Child](roles/PUBLIC_CHILD.md) | Public website, auth, catalog gói; Child login adapter, luồng vẽ/AI nằm BE/Mobile | Nội dung public, entitlement; Mobile renderer v1 chưa xác minh |
| [Parent](roles/PARENT.md) | Profile/read-back recovery, Character approval, catalog/reader composition + default roles/slots, checkout return profile refresh; quiz caller theo Swagger mới | Quiz own child 403 nên disabled; PayOS return success nhưng gói vẫn Free cần webhook entitlement + order status BE; ownership A/B; dashboard/settings mở rộng/library riêng thiếu contract |
| [Content Manager](roles/CONTENT_MANAGER.md) | Story/page/role/slot/vocab/quiz, publish; **CompositionJson v1 đọc/ghi**, read-back | Reader chung, media durable, upload role mismatch, save race, lifecycle publish |
| [Admin](roles/ADMIN.md) | Users/catalog/report/audit adapters | Quyền và policy mutation, pagination, revenue/credit metrics, limits/monitoring/statistics |

`.env.production` đặt Auth/Content real; Parent core mock nhưng profile/catalog/payment/approvals **real**, subscription và quiz **disabled** (quiz bị 403 runtime). Theo yêu cầu mới của người dùng, `.env.development` bật đọc subscription cho FE local; route BE hiện thiếu Authorize/owner scope nên đây chỉ là opt-in local, không được bật production. FE lấy ID từ `/auth/profile`; khi DTO thiếu ID, fallback User.Id dựa trên quan hệ PK/FK đã xác nhận ở source local. Intercept đã kiểm tra contract/owner mismatch/lỗi/race; chưa xác minh subscription runtime. BE mapper thiếu `ParentProfile.Id` → `ParentProfileDto.ParentProfileId`, cần sửa; xem [contract API](api/CONTRACTS.md). Admin core mock, catalog real; reports mặc định real. Đây là cấu hình repo, không phải xác minh hosting. Xem [kiến trúc](ARCHITECTURE.md).

## Quyết định đã chốt

1. API đủ contract/quyền thì nối theo capability. Phần chưa hỗ trợ dùng mock có nhãn; lỗi API thật không tự fallback mock.
2. Dashboard Parent theo từng bé; không trộn dữ liệu giữa bé/tài khoản. ChildProfile ID, User ID, Character ID và mapping ID phải dùng đúng resource.
3. FE tự thiết kế **CompositionJson v1**, BE lưu chuỗi; không chờ BE thiết kế schema animation. Mobile cần triển khai theo format FE, không phải điều kiện để FE tiếp tục làm reader web.
4. MVP đọc web dùng template/default characters, một narration mỗi trang. Upload nhiều file audio, asset registry, analytics và snapshot publish chưa được coi là đã hỗ trợ.
5. Duyệt Character không cấp mặc nhiên quyền vai nhạy cảm; mapping approval là nghiệp vụ khác.
6. Publish hiện chỉ đổi trạng thái story trong BE source; **không chứng minh tạo immutable version hoặc kích hoạt toàn bộ pages**.

## Ưu tiên tiếp theo

Đối chiếu Content Manager 17/11: suite CM 17/17 và hai reader checks qua; lint/build thành công. Đây là kiểm chứng FE/intercept, không thêm runtime evidence. Runtime CM/Parent đã đọc truyện “Tôn giáo” Active nhưng pages đều Draft, chưa có CompositionJson; Parent browser báo chưa có trang phát hành. Không có Child test; chưa mutation nội dung, chờ quy trình lifecycle BE do người dùng cung cấp. [Ma trận action, kiểm thử và yêu cầu BE](roles/CONTENT_MANAGER.md).

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
