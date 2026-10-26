# SketchTale — tổng quan sản phẩm và snapshot ngày 19/10/2026

> **Snapshot lịch sử:** bảng API và blocker bên dưới phản ánh ngày 19/10. Parent profile và Admin reports đã có adapter mới hơn. Xem [kiến trúc hiện tại](ARCHITECTURE.md) và [mục lục](README.md) để tra cứu các đợt tích hợp sau đó.

> Cập nhật: 19/10/2026. Tổng hợp từ working tree, tài liệu dự án và source backend commit `42846917f9e2381042267d916d3aa02cbef4d591` đã xác nhận đang chạy trên Render.
>
> Đây là bản tổng quan hiện trạng, không phải biên bản nghiệm thu. Các thay đổi tích hợp API gần nhất chưa được kiểm tra lại bằng lint/build/E2E hoặc request thật trên Render. Working tree còn thay đổi chưa commit; tài liệu này không xác nhận đã deploy.

## Dự án

SketchTale là hệ thống kể chuyện tương tác từ tranh vẽ của trẻ. Trẻ tạo nhân vật từ tranh, dùng nhân vật trong truyện, đọc hoặc nghe truyện, theo dõi phần chữ được đọc và làm câu hỏi sau truyện. Sản phẩm gồm ứng dụng mobile cho trẻ và web cho khách truy cập, phụ huynh, người quản lý nội dung và quản trị viên.

Tên đề án trong tài liệu khởi tạo: “SketchTale — An Interactive Storytelling System from Children’s Drawings”. Phạm vi sản phẩm hiện hướng tới trẻ 6–10 tuổi. Kế hoạch đồ án được ghi là 09/2026–03/2027; repository không có danh sách thành viên/phân công đã xác nhận.

## Người dùng và chức năng

- **Khách truy cập:** xem website, truyện mẫu và thông tin gói.
- **Parent:** quản lý các bé đã liên kết, cài đặt nội dung/thời gian, duyệt nhân vật và vai nhạy cảm, xem thư viện/tiến độ và xuất truyện.
- **Child:** có tài khoản đăng nhập riêng cho mobile; tạo nhân vật, đọc truyện, làm quiz và xem thư viện cá nhân. Parent tạo username và password cho tài khoản bé. API đăng ký bé liên kết tài khoản với Parent theo JWT.
- **Content Manager:** quản lý truyện mẫu, trang, vai, slot nhân vật, từ vựng, quiz, media và xuất bản.
- **Admin:** quản lý tài khoản/quyền, cấu hình giới hạn, an toàn nội dung, báo cáo và tình trạng hệ thống.

Các quy tắc sản phẩm đã ghi nhận: Parent chọn một hồ sơ bé để xem dashboard riêng; dữ liệu của các bé không trộn lẫn. Nội dung chỉ xuất hiện theo trạng thái publish và chủ đề được phép. Quyền dùng vai nhạy cảm được duyệt theo nhân vật. Quiz MVP là trắc nghiệm một đáp án đúng. Một lần publish tạo phiên bản truyện; bản truyện cá nhân hóa giữ snapshot phiên bản đã chọn.

### Gói sử dụng được cung cấp

Các mức giá/quyền lợi dưới đây là cấu hình sản phẩm do người dùng cung cấp ngày 17/09/2026; chưa phải xác nhận thanh toán hay entitlement thật đã triển khai.

| Gói | Giá/tháng | Hồ sơ bé | Lượt tạo nhân vật AI/tháng | Xuất video |
| --- | ---: | ---: | ---: | --- |
| Free | Miễn phí | 1 | 5 | Không hỗ trợ |
| Pro | 35.000đ | Tối đa 3 | 30 | 5 lượt/tháng |
| Family | 89.000đ | Tối đa 5 | 100 | Không giới hạn |

Backend có catalog gói, nhưng trạng thái thuê bao/entitlement và luồng thanh toán, gia hạn, hủy hoặc hoàn tiền chưa được xác nhận bằng hợp đồng đủ dùng.

## Web frontend

Repository triển khai SPA bằng JavaScript/JSX, React 19, Vite 8, React Router 7, TanStack Query, CSS và Playwright. Code chính nằm trong `src/app`, `src/features`, `src/lib/api` và `src/mocks`. Không thấy React Hook Form, Zod, MSW hay Vitest trong dependencies hiện tại.

Các khu vực chính là Public/Auth/Profile, Parent, Content Manager và Admin. UI và mock đã có nhiều luồng, nhưng sự hiện diện của màn hình hoặc service không đồng nghĩa đã nghiệm thu nghiệp vụ hay API thật.

Các kế hoạch hoàn tất đã được gộp lại: đợt Parent UX trước đó ghi nhận responsive test trên 9 viewport và hoàn tất M1–M6; UI trang gói Parent đã triển khai nhưng billing chưa có. Kết quả đó thuộc các lượt kiểm tra cũ, không thay cho QA source hiện tại. Story Editor đã có workspace/preset/audio cơ bản; animation nâng cao và timeline vẫn còn backlog.

## Quy tắc kết nối API hiện hành

Người dùng đã chốt:

1. API có sẵn và contract đủ rõ thì dùng API thật cho operation đó.
2. Chức năng chưa có API tiếp tục dùng mock cả local lẫn bản deploy; phải gắn nhãn “Dữ liệu mô phỏng”.
3. Lỗi từ API thật không được tự chuyển sang mock.
4. Không tự tạo endpoint hoặc suy đoán contract còn thiếu. Câu hỏi ảnh hưởng an toàn hoặc dữ liệu phải được làm rõ trước khi mở phần phụ thuộc.

`docs/LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md` là hướng dẫn triển khai đang dùng; báo cáo trạng thái code mới nhất ở `docs/api-integration/luna-extramax/implementation-report-2026-10-19.md`.

## Trạng thái tích hợp theo source hiện tại

“Đã nối” ở đây chỉ mô tả adapter và đường gọi trong working tree. Chưa khẳng định đã kiểm chứng request/response hoặc persistence trên Render.

| Khu vực | Dùng API thật trong source | Còn mock hoặc chưa nghiệm thu |
| --- | --- | --- |
| Auth | Đăng nhập, hydrate hồ sơ qua `/auth/profile`, đổi mật khẩu; phụ huynh tạo tài khoản bé qua `/auth/register/child` | Chưa nghiệm thu token/role và các luồng xác minh/reset bằng tài khoản staging. API tạo bé chỉ trả message, không trả child ID |
| Public / gói | Đọc catalog gói | Thanh toán, entitlement và subscription hiện hành |
| Content Manager | Story, chủ đề, page, role, vocabulary, quiz, publish; slot GET/POST/PUT/DELETE; upload media qua multipart | Asset library độc lập; timeline/animation/audio tracks và một số dữ liệu editor lưu ở overlay mô phỏng. Slot X/Y, scale/flip thật; layer, rotation, ảnh riêng của slot vẫn mô phỏng |
| Admin | Catalog gói/credit/chủ đề, audit log và restricted keywords | Users, permissions, reports, monitoring, statistics, system limits và topic rules |
| Parent | Một phần catalog gói dùng chung | Hồ sơ Parent/Child, list/detail/update, entitlement, approvals, progress, library, exports và các thao tác chưa có contract an toàn |

Danh sách endpoint hiện hành nằm trong [OpenAPI snapshot 19/10](api-integration/openapi-2026-10-19.snapshot.json). Các enum đã đọc từ backend source: `CommonStatus` (0 Draft, 1 Pending, 2 Active, 3 Inactive, 4 Archived); `TargetAgeGroup` (0 Ag6to7, 1 Age8to10, 2 Age11to12); `StoryRoleType` (0 MainCharacter, 1 Companion, 2 Supporting, 3 Other); `SubscriptionStatus` (0 PendingPayment, 1 Active, 2 Expired, 3 Cancelled); `MatchType` (0 Exact, 1 Contains, 2 Regex); `SeverityLevel` (0 Low, 1 Medium, 2 High, 3 BlockImmediately); `ModerationAction` (0 Reject, 1 FlagForReview, 2 Mask). DTO profile có nơi dùng enum dạng chuỗi, nên không áp số enum đồng loạt.

## Blocker backend và API còn thiếu

- **Lỗi ownership cần Backend sửa:** source commit đang chạy không kiểm tra quyền sở hữu ở API đọc/sửa Parent–Child profile; `GET /child-profiles` có thể trả hồ sơ không scope theo Parent. Frontend không gọi các API profile này trong luồng thật và không lọc dữ liệu toàn hệ thống ở client. Phân loại đúng là `API_PRESENT_BACKEND_FIX_REQUIRED`, không phải API thiếu.
- `POST /auth/register/child` tạo và liên kết bé theo Parent JWT nhưng response chưa trả child ID. Không tự tìm bé bằng username qua danh sách không scope và không retry POST khi tạo thành công nhưng thiếu ID.
- API liên kết tài khoản Child đã tồn tại, hủy liên kết, quyền profile an toàn, entitlement, thanh toán, approvals, progress, library, exports và một số settings chưa có contract usable.
- Admin core và chủ đề hạn chế chưa có API đủ cho các luồng UI hiện tại; các phần này tiếp tục dùng mock có nhãn.
- Story editor nâng cao và asset library dùng mock cho các field chưa được backend hỗ trợ. API slot xác nhận X/Y theo phần trăm 0–100.

Backend: [iamhyyyy/sketch-tale-backend](https://github.com/iamhyyyy/sketch-tale-backend), commit `42846917f9e2381042267d916d3aa02cbef4d591`. Swagger: [OpenAPI JSON](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json). Source audit và quyết định triển khai được lưu trong `docs/api-integration/luna-extramax/`.

## Cấu hình và kiểm chứng

- `.env.development` chọn API thật cho content/catalog; Admin core và Parent tiếp tục mock.
- `.env.production` được giữ nguyên trong đợt tích hợp được ghi nhận. Các tính năng không có API phải tiếp tục mock và được gắn nhãn ở cả hai môi trường.
- Không lưu token, thông tin tài khoản hoặc bí mật vào tài liệu.
- Bản tích hợp gần nhất chưa chạy lint/build/E2E hay mutation trên Render. Cần chạy kiểm thử phù hợp và kiểm tra read-after-write trên tài khoản/dữ liệu test trước khi tuyên bố tích hợp hoàn tất.

## Việc còn mở

1. Chờ Backend sửa ownership/authorization cho profile endpoints và trả child ID hoặc cung cấp cách refetch an toàn.
2. Hoàn thành các bước còn lại trong runbook theo capability, giữ mock cho API chưa có.
3. Kiểm tra real request từ trình duyệt, upload/mutation/read-after-write, lỗi 401/403/404/409 và cache sau logout.
4. Chạy lint/build/E2E trên working tree hiện tại; tách lỗi mới khỏi baseline đã ghi ở tài liệu cũ.
5. Tiếp tục nghiệm thu UI/UX Content, Admin, Parent và Public theo tài liệu đặc tả đang giữ.
6. Rà lại các follow-up P2 từ code review 13/10 (đặc biệt retention asset được story version tham chiếu, identity của export và độ ổn định E2E). Code review cũ đã được dọn; các mục này chưa được xác nhận lại trong đợt tích hợp 19/10, không mặc định là lỗi vẫn còn.

Không deploy hoặc gọi mutation dữ liệu người dùng thật trong lần cập nhật tài liệu này.
