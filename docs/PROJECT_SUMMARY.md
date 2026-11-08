# SketchTale — tổng quan sản phẩm và trạng thái tích hợp

> Phần thiết kế/nghiệp vụ lịch sử vẫn có mốc 19/10. Trạng thái API hiện hành được tóm tắt ở mục “Trạng thái tích hợp theo source hiện tại” và đối chiếu chi tiết trong [API integration master](api-integration/API_INTEGRATION_MASTER_2026-11-01.md), [Parent integration plan](api-integration/PARENT_INTEGRATION_PLAN_2026-11-01.md). Đây không phải biên bản nghiệm thu runtime.

> Nền lịch sử: 19/10/2026, tổng hợp từ working tree và backend source commit `42846917f9e2381042267d916d3aa02cbef4d591` tại thời điểm đó. Đối chiếu API mới ngày 01/11 dùng backend source [`fb3075e`](https://github.com/iamhyyyy/sketch-tale-backend/tree/fb3075e33d584abbb185fcc860aeec206f8af9a0) và các Swagger snapshot được dẫn ở dưới; chưa xác nhận commit này đang deploy trên Render.
>
> Đây là bản tổng quan hiện trạng, không phải biên bản nghiệm thu. Ngày 01/11, `npm run build` frontend đã thành công; Backend chưa build được vì môi trường không có .NET SDK/`dotnet`. Chưa chạy E2E hoặc request thật trên Render. Working tree còn thay đổi chưa commit; tài liệu này không xác nhận đã deploy.

## Tham chiếu backend/API và quy tắc làm việc — cập nhật 01/11/2026

- **Backend source:** [iamhyyyy/sketch-tale-backend](https://github.com/iamhyyyy/sketch-tale-backend). Source đã đọc ở commit [`fb3075e33d584abbb185fcc860aeec206f8af9a0`](https://github.com/iamhyyyy/sketch-tale-backend/commit/fb3075e33d584abbb185fcc860aeec206f8af9a0), commit này chưa được xác nhận là source đang deploy trên Render.
- **Swagger/OpenAPI đang public:** [swagger/v1/swagger.json](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json).
- **Snapshots trong repo:** [Parent — 29/10](../artifacts/swagger-parent-2026-10-29.json), [Admin — 31/10](../artifacts/swagger-admin-2026-10-31.json), [Content Manager — 31/10](../artifacts/swagger-content-manager-2026-10-31.json).
- **Sổ tay tích hợp API end-to-end:** [API_INTEGRATION_MASTER_2026-11-01.md](api-integration/API_INTEGRATION_MASTER_2026-11-01.md) — quy trình nối, ma trận trạng thái và danh sách ưu tiên gửi Backend.
- **Audit Parent theo source:** [PARENT_API_SOURCE_AUDIT_2026-11-01.md](api-integration/PARENT_API_SOURCE_AUDIT_2026-11-01.md). Snapshot 19/10 và các trạng thái cũ ở phần sau giữ nguyên ý nghĩa lịch sử; dùng audit/snapshot mới hơn khi triển khai.

### Quy tắc của người dùng khi tích hợp API

1. Dùng source backend và Swagger được cung cấp làm căn cứ chính. Đọc controller, DTO, service và phân quyền để hiểu contract; nếu source thể hiện rõ thì triển khai luôn, không hỏi Backend xác nhận lại cùng thông tin.
2. Chỉ gọi endpoint/field có thật và có contract đủ rõ. Không tự tạo path, đoán payload, enum, quyền truy cập, ownership hay trạng thái nghiệp vụ. Chỗ source/Swagger chưa kết luận được thì ghi rõ blocker hoặc tiếp tục phần độc lập.
3. Chỉ dùng dữ liệu đã được backend scope theo tài khoản hiện tại. Không tải dữ liệu nhiều chủ rồi lọc ở frontend; nếu API thiếu ownership/authentication thì chặn luồng thật cho tới khi Backend sửa.
4. Chức năng chưa có API an toàn tiếp tục dùng mock/demo ở cả local và deploy, có nhãn dễ thấy. API thật lỗi thì hiện lỗi/retry; không tự fallback sang mock như thể thao tác đã thành công.
5. Phân biệt rõ điều source chứng minh với điều chỉ được xác nhận bằng request runtime. Không tuyên bố đã tích hợp/đã lưu thành công nếu chưa kiểm chứng với backend phù hợp.
6. Giữ nguyên thay đổi sẵn có trong working tree; không commit, deploy hoặc chạy mutation trên dữ liệu thật nếu chưa được yêu cầu.

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

1. API có sẵn, contract đủ rõ và scope an toàn thì dùng API thật cho operation đó.
2. Chức năng chưa có API an toàn tiếp tục dùng mock cả local lẫn bản deploy; phải gắn nhãn “Dữ liệu mô phỏng”.
3. Lỗi từ API thật không được tự chuyển sang mock.
4. Không tự tạo endpoint hoặc suy đoán contract còn thiếu. Làm rõ blocker ảnh hưởng an toàn/dữ liệu trước khi mở phần phụ thuộc.

Hướng dẫn điều phối API hiện hành là [API integration master 01/11](api-integration/API_INTEGRATION_MASTER_2026-11-01.md); thứ tự nối Parent nằm trong [Parent integration plan](api-integration/PARENT_INTEGRATION_PLAN_2026-11-01.md), căn cứ source chi tiết ở [Parent source audit](api-integration/PARENT_API_SOURCE_AUDIT_2026-11-01.md). Runbook 19/10 và implementation report 19/10 là tài liệu lịch sử, chỉ tra khi cần ngữ cảnh đợt cũ.

## Trạng thái tích hợp theo source hiện tại

“Đã nối” ở đây chỉ mô tả adapter và đường gọi trong working tree. Chưa khẳng định đã kiểm chứng request/response hoặc persistence trên Render.

| Khu vực | Dùng API thật trong source | Còn mock hoặc chưa nghiệm thu |
| --- | --- | --- |
| Auth | Login/restore `/auth/profile`, đổi mật khẩu, đăng ký Parent/Child có caller. Backend source xác nhận đăng ký Child lấy Parent từ JWT và tạo ChildProfile; local source hiện trả `childProfileId`. | `nickName` được lưu ở `ChildProfiles.NickName`, không map sang `Users.FirstName/LastName`, nên hai cột tên User có thể `NULL` theo contract hiện tại. `/auth/profile` không trả danh sách Child. Thay đổi register local chưa build/deploy/live-verified. |
| Public / gói | Đọc catalog gói; ParentPlan đọc gói hiện tại từ ParentProfile trong `/auth/profile`; education-theme và story catalogs có mode riêng. | Backend local đã lọc story về `Active` và có route pages đã publish; FE có status guard/page adapter. Production catalog vẫn mock cho tới khi release/verify. Checkout thật và entitlement/usage chưa có contract. |
| Content Manager | Story, chủ đề, page, role, vocabulary, quiz, publish; slot GET/POST/PUT/DELETE; upload media qua multipart | Asset library độc lập; timeline/animation/audio tracks và một số dữ liệu editor lưu ở overlay mô phỏng. Slot X/Y, scale/flip thật; layer, rotation, ảnh riêng của slot vẫn mô phỏng |
| Admin | `/users` list/detail/create/update/status; catalog CRUD; report read/update; audit reads theo working-tree source/master. | Permissions, system limits, monitoring/statistics aggregates; một số role/null/pagination/security contract chưa xác minh. |
| Parent | Register Child; đọc gói hiện hành qua `/auth/profile`; đọc catalog gói, education themes và story catalog theo module mode. Backend local đã thêm ChildProfile owner scope, register profile ID, published story/pages, mapping authorization và scoped approval inbox; FE có profile/catalog adapters cùng approval live adapter/UI opt-in. | Local fixes chưa build/deploy/runtime-verified; để dùng inbox cần `VITE_PARENT_APPROVALS_API_MODE=real` và Parent profile mode real để lấy ChildProfile ID thật. Revision, reject reason, sensitive-role permission còn thiếu. Production profile/catalog/approvals giữ mock. Dashboard/progress/settings mở rộng/library riêng/exports/reports và thanh toán còn demo hoặc thiếu contract. |

Swagger snapshots role-specific được dẫn đầu tài liệu, mỗi snapshot có 124 operations nhưng ngày tải khác nhau; không giả định chúng cùng backend commit. Các enum phải đọc theo DTO/source cụ thể: `CommonStatus` (0 Draft, 1 Pending, 2 Active, 3 Inactive, 4 Archived); `TargetAgeGroup` (0 Ag6to7, 1 Age8to10, 2 Age11to12); `StoryRoleType` (0 MainCharacter, 1 Companion, 2 Supporting, 3 Other); `SubscriptionStatus` (0 PendingPayment, 1 Active, 2 Expired, 3 Cancelled); `MatchType` (0 Exact, 1 Contains, 2 Regex); `SeverityLevel` (0 Low, 1 Medium, 2 High, 3 BlockImmediately); `ModerationAction` (0 Reject, 1 FlagForReview, 2 Mask). Không áp một kiểu enum đồng loạt nếu DTO biểu diễn khác nhau.

## Blocker backend và API còn thiếu

- **ChildProfile ownership — đã có source fix local, runtime chưa xác minh:** list/detail/update scope theo Parent JWT; Child chỉ đọc profile bản thân; Parent update không ghi remaining counters. ParentProfile và Subscription endpoints vẫn không có owner scope, nên Parent không gọi các CRUD đó.
- **Story visibility/pages — đã có source fix local, runtime chưa xác minh:** list/by-theme/detail Parent/Child chỉ trả `Active`; published-pages route trả pages Active của story Active. FE có guard và mapper; `.env.production` giữ catalog mock cho tới khi Backend mới được phát hành.
- `GET /auth/profile` vẫn không trả ChildProfiles. Local `POST /auth/register/child` hiện trả thêm ChildProfile ID; nickname chỉ được lưu ở `ChildProfiles.NickName`, không map sang `Users.FirstName/LastName`. Vì vậy `NULL` ở cột tên User không chứng minh nickname chưa được lưu; kiểm tra đúng bảng/cột hồ sơ bé.
- API liên kết/hủy liên kết Child, entitlement/usage, thanh toán, dashboard/progress, child library, exports và family report chưa có contract Parent đủ an toàn/khớp UI. `user-story-character-mappings` local đã có auth/owner checks, nhưng Parent UI chưa gọi API này và vẫn mock do thiếu inbox context/revision. Không tạo CRUD mapping trùng.
- Không gọi `GET/PUT /parent-profiles` hoặc Subscription CRUD từ Parent để lách blocker: source cho thấy các endpoint này không kiểm tra owner.
- Story editor nâng cao và asset library dùng mock cho các field chưa được backend hỗ trợ. API slot xác nhận X/Y theo phần trăm 0–100.

Backend source tham chiếu ở đầu tài liệu; source commit `42846917f9e2381042267d916d3aa02cbef4d591` là snapshot lịch sử ngày 19/10, không dùng làm contract mới nhất. Swagger live và các snapshot theo role được liên kết ở đầu tài liệu. Source audit và quyết định triển khai cũ được lưu trong `docs/api-integration/luna-extramax/`.

## Cấu hình và kiểm chứng

- `.env.local` đặt `VITE_API_MODE=real` nhưng không override Parent modules; `VITE_PARENT_API_MODE` mặc định là `mock`, và profile/catalog kế thừa mode đó. Catalog gói vẫn đọc real qua `publicService`. `.env.production` đặt Parent feature/profile/catalog `mock`; `.env.story-demo` cũng mock. Kiểm tra mode/override thực tế trước khi mô tả môi trường khác.
- Ngày 01/11/2026, `.env.production` giữ Parent profile/catalog mock đến khi source Backend mới build/deploy và được xác minh. Các tính năng chưa có API tiếp tục demo/mock.
- Không lưu token, thông tin tài khoản hoặc bí mật vào tài liệu.
- Frontend production build đã qua ngày 01/11 (Vite cảnh báo bundle JS lớn hơn 500 KB). Backend chưa compile được trong môi trường này vì thiếu `dotnet`; E2E và mutation/read-after-write trên Render chưa chạy.

## Việc còn mở

1. Build/deploy Backend local và xác minh ChildProfile scope, register ID/read-after-write, story Active/pages, mapping authorization trên staging.
2. Giữ Parent catalog/profile mock trên production đến khi có version đã phát hành và xác nhận; các nghiệp vụ thiếu contract tiếp tục demo/mock.
3. Kiểm thử trên staging: đăng ký Child, profile ID/read-after-write, owner checks Parent A/B, lỗi 401/403/404/409 và cache sau logout.
4. Chạy lint/E2E và compile Backend khi có .NET SDK; frontend production build đã qua ngày 01/11. Lặp lại build nếu source thay đổi trước release.
5. Tiếp tục nghiệm thu UI/UX Content, Admin, Parent và Public theo tài liệu đặc tả đang giữ.
6. Rà lại các follow-up P2 từ code review 13/10 (đặc biệt retention asset được story version tham chiếu, identity của export và độ ổn định E2E). Code review cũ đã được dọn; các mục này chưa được xác nhận lại trong đợt tích hợp 19/10, không mặc định là lỗi vẫn còn.

Không deploy hoặc gọi mutation dữ liệu người dùng thật trong lần cập nhật tài liệu này.
