# SketchTale — ngữ cảnh cho chat mới

**Cập nhật 14/11/2026.** Web kể chuyện tương tác từ tranh vẽ của trẻ, hướng tới nhóm 6–10 tuổi; Child dùng ứng dụng Mobile riêng. Tên đề án: “SketchTale — An Interactive Storytelling System from Children’s Drawings”. Kế hoạch đề án đã ghi 09/2026–03/2027; chưa có danh sách phân công được xác nhận trong repo.

## Nguồn và mức xác minh

| Nguồn | Baseline đợt này |
| --- | --- |
| FE `SEP490sketchtale` | HEAD `de1649a5070bc8da223dc9da197df762e27b637f` + working tree |
| BE `../SEP490Backend/sketch-tale-backend` | HEAD `f53e0ad` sau pull 14/11 + 25 sửa đổi staged đã có trước pull |
| API snapshot gần nhất đọc được | [14/11](../artifacts/swagger-parent-2026-11-14.json): 109 paths / 148 operations |
| Live ngày 14/11 | Parent mẫu đọc profile/catalog/pages/roles/slots/plans; quiz own child 403; deploy khác BE local |

Audit Parent 14/11 có sửa FE, build/lint/intercept và runtime đăng nhập/đọc/logout. Sau đó người dùng yêu cầu pull BE: `main` fast-forward lên `f53e0ad`, giữ nguyên staged modifications. Không mutation hồ sơ/Character/payment/publish/delete runtime; source pull không đồng nghĩa đã deploy. Ma trận đầy đủ, bằng chứng và câu hỏi chưa đóng ở [Parent](roles/PARENT.md).

## Role và hiện trạng

| Role | Đã có trong source | Phần đang mở |
| --- | --- | --- |
| [Public / Child](roles/PUBLIC_CHILD.md) | Public website, auth, catalog gói; Child login adapter, luồng vẽ/AI nằm BE/Mobile | Nội dung public, entitlement; Mobile renderer v1 chưa xác minh |
| [Parent](roles/PARENT.md) | Profile/read-back recovery, Character approval, catalog/reader composition + default roles/slots, checkout URL; quiz caller theo Swagger mới | Quiz own child 403 nên disabled; payment status/quyền lợi; ownership A/B; dashboard/settings mở rộng/library riêng thiếu contract |
| [Content Manager](roles/CONTENT_MANAGER.md) | Story/page/role/slot/vocab/quiz, publish; **CompositionJson v1 đọc/ghi**, read-back | Reader chung, media durable, upload role mismatch, save race, lifecycle publish |
| [Admin](roles/ADMIN.md) | Users/catalog/report/audit adapters | Quyền và policy mutation, pagination, revenue/credit metrics, limits/monitoring/statistics |

`.env.production` đặt Auth/Content real; Parent core mock nhưng profile/catalog/payment/approvals **real**, subscription và quiz **disabled** (quiz bị 403 runtime). Không bật capability mới chỉ vì có caller. Admin core mock, catalog real; reports mặc định real. Đây là cấu hình repo, không phải xác minh hosting. Xem [kiến trúc](ARCHITECTURE.md).

## Quyết định đã chốt

1. API đủ contract/quyền thì nối theo capability. Phần chưa hỗ trợ dùng mock có nhãn; lỗi API thật không tự fallback mock.
2. Dashboard Parent theo từng bé; không trộn dữ liệu giữa bé/tài khoản. ChildProfile ID, User ID, Character ID và mapping ID phải dùng đúng resource.
3. FE tự thiết kế **CompositionJson v1**, BE lưu chuỗi; không chờ BE thiết kế schema animation. Mobile cần triển khai theo format FE, không phải điều kiện để FE tiếp tục làm reader web.
4. MVP đọc web dùng template/default characters, một narration mỗi trang. Upload nhiều file audio, asset registry, analytics và snapshot publish chưa được coi là đã hỗ trợ.
5. Duyệt Character không cấp mặc nhiên quyền vai nhạy cảm; mapping approval là nghiệp vụ khác.
6. Publish hiện chỉ đổi trạng thái story trong BE source; **không chứng minh tạo immutable version hoặc kích hoạt toàn bộ pages**.

## Ưu tiên tiếp theo

Audit CM tiếp tục **15/11**: đã sửa queue lưu, recovery, codec/slot extensions, upload ảnh phụ đúng route và kiểm tra publish server. Intercept có luồng hai trang/context sạch; runtime CM/Parent đọc truyện “Tôn giáo” Active nhưng pages đều Draft, chưa có CompositionJson. Parent browser báo chưa có trang phát hành. Không có Child test; chưa mutation nội dung, chờ quy trình lifecycle BE do người dùng cung cấp. [Ma trận action, kiểm thử và yêu cầu BE](roles/CONTENT_MANAGER.md).

- **DOC-API-01 / WEB01:** thống nhất route pages FE–BE–deploy và trạng thái con khi publish.
- **WEB02–06:** rà codec, reader dùng chung, queue lưu, migration media và đọc trên trình duyệt sạch; [kế hoạch chi tiết](plans/WEB_READER.md).
- **SEC-01 / PAY-01:** owner scope credit/subscription/ParentProfile/payment cancel; payment status và entitlement.
- Nghiệm thu approvals/profile với hai Parent; chuẩn hóa upload role và kiểm thử Auth refresh.

Toàn bộ việc chưa đóng và tiêu chí nghiệm thu: [BACKLOG](BACKLOG.md). Tra request/response/quyền: [API contracts](api/CONTRACTS.md). Bắt đầu chat mới chỉ cần tài liệu này + backlog + đúng role; không cần đọc toàn bộ specs.

## Giá gói và tài khoản test

Mốc sản phẩm do người dùng cung cấp 17/09/2026: Free 1 bé/5 lượt AI; Pro 35.000đ/tháng, 3 bé/30 lượt AI/5 video; Family 89.000đ/tháng, 5 bé/100 lượt AI/video không giới hạn. Đây là yêu cầu lịch sử, không ghi đè catalog/entitlement server và không chứng minh billing đã hoàn tất.

Tài khoản test đã ghi nhận: `admin@sketch.tale.com`, `manager@sketch.tale.com`, `parent@sketch.tale.com`. Mật khẩu ở `.test-accounts.local` nếu máy có tệp này; không đưa credential/token vào docs. Không dùng tài khoản/dữ liệu thật để tự xuất bản hoặc thử thanh toán.
