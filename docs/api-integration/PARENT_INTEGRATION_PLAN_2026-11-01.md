# Kế hoạch tích hợp Parent — rà soát lại lịch sử và source 01/11/2026

**Bản điều phối hiện hành.** Ưu tiên Backend working tree tại `D:/SEP490/SEP490Backend/sketch-tale-backend`, sau đó Frontend đang chạy, rồi mới tới tài liệu/Swagger snapshot. Baseline `fb3075e` không bao gồm các sửa đổi local hiện có; chưa xác nhận phiên bản đang deploy. Lần rà soát này đọc source và cập nhật tài liệu, không gọi mutation Backend hay kiểm chứng runtime.

Chi tiết contract: [API gaps](PARENT_API_GAPS_2026-10-29.md). Câu hỏi để chuyển Backend: [Backend questions](PARENT_BACKEND_QUESTIONS_2026-11-01.md). Audit trước đó: [source audit](PARENT_API_SOURCE_AUDIT_2026-11-01.md).

## 1. Yêu cầu đã chốt từ lịch sử chat

- Triển khai Parent trước, tận dụng API đã có; phân biệt thiếu API, chưa nối FE và chưa phát hành Backend.
- Giữ giao diện hiện tại khi thay nguồn dữ liệu. Không checkout/reset/revert UI theo tài liệu hoặc commit cũ. Yêu cầu UI gần nhất là bỏ hình palette/đốm màu khỏi thẻ hồ sơ; không tự đưa palette hoặc layout cũ trở lại.
- Parent chọn từng ChildProfile để quản lý. Dữ liệu, quyền và cache phải tách theo Parent user và ChildProfile ID; không trộn hoạt động các bé.
- Tạo tài khoản Child là API thật; danh sách bé đang hiển thị Mây/Nắng ở development là preview. Phải hoàn tất đọc lại hồ sơ sau tạo để tránh trải nghiệm “tạo thật nhưng danh sách vẫn giả”.
- Tên hiển thị của bé là `ChildProfiles.NickName`; `Users.FirstName/LastName = null` không tự chứng minh FE mất tên. Không tự tách nickname thành họ/tên.
- Giá gói lấy từ catalog Backend. `publicService` hiện dùng VND khi DTO không có currency; không hardcode 49.000/99.000 vào UI và không suy có checkout từ việc DB có giá.
- Người dùng sẽ chuyển câu hỏi cho Backend. Chỉ hỏi phần source chưa giải quyết được hoặc trạng thái môi trường; không gửi lại danh sách endpoint giả định như contract bắt buộc.

## 2. Hiện trạng xác nhận từ source

“Có code” dưới đây không đồng nghĩa “đã kiểm chứng trên môi trường phát hành”.

| Nghiệp vụ | Backend và FE hiện có | Việc còn lại |
|---|---|---|
| Đăng nhập/khôi phục phiên, gói hiện tại | `GET /api/auth/profile`, FE hydrate session và đọc ParentProfile/plan | Xác minh response ở bản deploy; refresh hồ sơ sau thay đổi quota/gói |
| Tạo tài khoản bé | `POST /api/auth/register/child`; local Backend tạo User + ChildProfile, gắn Parent từ JWT, trừ quota, trả ChildProfile ID; FE gọi thật | Xác minh bản deploy trả ID; refetch list và quota; xử lý trùng username/hết quota/lỗi mạng |
| Danh sách/chi tiết/sửa hồ sơ bé | `GET /api/child-profiles`, `GET/PUT /api/child-profiles/{id}`; local Backend scope theo Parent; FE adapter có | Bật mode riêng sau release và kiểm chứng quyền A/B |
| Nickname, giới hạn ngày | FE live editor sửa nickname, dailyTimeLimit, dailyCharacterLimit | Thu hẹp adapter chỉ field Parent được sửa; đọc lại giá trị server sau lưu |
| Catalog gói | `GET /api/subscription-plans`; `publicService` dùng global API mode; UI map giá/quyền lợi | Xác nhận convention VND; không dùng catalog làm trạng thái thanh toán |
| Quota hiện có | `ParentProfileDto` có RemainingChildProfile, RemainingMonthlyCredit; ChildProfile có remaining counters | Tận dụng nếu response auth/profile trả đúng; thiếu định nghĩa/resetAt/chu kỳ và quyền hiệu lực đầy đủ |
| Catalog truyện/chủ đề | `/story-template/stories`, `/stories/{id}`, `/education-themes`; adapter có | Local Backend đã lọc Active; cần xác minh bản triển khai |
| Trang truyện | Local `GET /api/storypage-template/published/{storyId}`; FE tải text/image/audio | Xác minh route mới, thứ tự trang và không lộ trang/truyện chưa publish |
| Phê duyệt | Local `GET /api/user-story-character-mappings/child/{childProfileId}` có context/paging; `PATCH /{id}` Pending → Approved/Rejected; FE có ParentApprovalsLive | Bật khi profile + approvals đều real; kiểm chứng deploy/ownership; chưa có concurrency token, reject reason, quyền vai nhạy cảm riêng |
| Đổi mật khẩu | `POST /api/auth/change-password`; caller trang tài khoản dùng chung | Kiểm chứng cùng phiên Parent |
| ParentProfile/Subscription CRUD | Có controller nhưng thiếu auth/owner checks ở source được đọc | Không nối từ Parent; Backend cần xử lý endpoint unscoped trước phát hành, FE tắt nút không bảo vệ API |
| Hoạt động học tập/thư viện riêng/thanh toán | Có UI/mock và một số entities; chưa tìm thấy contract Parent scoped đủ cho các consumer này | Chốt capability cụ thể, không tạo endpoint chỉ để trùng tên route mock |

### Mode hiện tại trong repository

| Nguồn | Global API | Parent feature | Profile | Catalog | Approvals |
|---|---|---|---|---|---|
| Development | real | mock | mock, kế thừa Parent | **real** | mock, kế thừa Parent |
| Production | real | mock | mock | mock | mock |
| Story demo | mock | mock | mock, kế thừa Parent | mock | mock, kế thừa Parent |

`.env.local` chỉ đặt global API mode, không override Parent modules. Bảng trên theo file trong repo; biến môi trường process/CI có thể override. `parentSubscription` mặc định kế thừa Parent mock, nhưng catalog gói dùng global API mode chứ không dùng cờ này. Không bật `VITE_PARENT_API_MODE=real` toàn cục: `childrenService` còn nhiều URL placeholder.

## 3. Mock và chức năng chưa khả dụng

| Màn hình / hành vi | Hiện tại | Cách xử lý khi chuyển sang dữ liệu thật |
|---|---|---|
| Tổng quan / danh sách bé | Development profile mock hiển thị previewProfiles Mây/Nắng. Production profile off có thể hiển thị trạng thái unavailable, không được suy mọi build đều hiện Mây/Nắng | Thay nguồn bằng list owner-scoped; giữ component/thẻ hiện tại |
| Hồ sơ cơ bản | Có live editor khi profile real; preview avatar/ngày sinh dùng trạng thái demo | Nối nickname/giới hạn đã có. Avatar hiện là lựa chọn hình FE; chưa có lưu association avatar/DOB thật |
| Dashboard từng bé | metrics, chartValues, lời gợi ý, recent story và pending count còn hardcode/demo, kể cả khi hồ sơ thật được bật | Trả trạng thái chưa có dữ liệu cho vùng thiếu API; không trình bày fixture như thống kê của bé thật |
| Cài đặt mở rộng | Mục tiêu đọc, lịch nhắc, chủ đề yêu thích, yêu cầu duyệt, chia sẻ lưu useParentDemo/sessionStorage | Tách khỏi giới hạn tài khoản thật; chờ contract lưu và thực thi |
| Duyệt nhân vật | Có live inbox nhưng cần profile + approvals real và ChildProfile ID thật; nếu chưa bật vẫn demo | Nối list/filter/page/decision, refetch sau mutation; số chờ ở dashboard phải cùng nguồn inbox |
| Thư viện Parent | Development catalog thật; saved stories và gợi ý cho bé lưu trên máy, không gửi thông báo thật | Giữ catalog read-only; tách rõ lưu trên thiết bị với đồng bộ Backend |
| Thư viện riêng của bé | demoBooks, yêu thích, recommendations và trạng thái bản xuất vẫn demo | Chờ contract tác phẩm thuộc bé; template catalog không thay thế generated library |
| Xuất truyện / báo cáo | Bản xuất trong child workspace là mô phỏng. Root /parent/reports và /parent/exports redirect tới library; có file component không chứng minh route hoạt động | Chưa mở báo cáo/export như chức năng thật trước contract |
| Gói / checkout | Catalog và định danh gói có caller thật; checkout mô phỏng. Catalog Backend trả checkoutEnabled=false | Giữ khóa cả entry point trực tiếp khi chưa có payment API, không báo mua gói thành công bằng state local |
| Tài khoản Parent | Danh tính và đổi mật khẩu có caller; self edit tên/DOB/avatar chưa nối | Upload ảnh không đồng nghĩa đã lưu vào hồ sơ |

## 4. Thứ tự triển khai tối ưu

### Đợt A — Làm ngay trên FE, độc lập câu trả lời Backend

1. Chốt baseline UI bằng diff/screenshot trước tích hợp; chỉ thay data/query/mutation và trạng thái cần thiết. Không dùng git restore/reset để thay lại toàn bộ trang.
2. Bỏ remainingTimeLimit/remainingCharacterLimit khỏi whitelist của `parentProfileService.update`. Adapter hiện vẫn nhận hai field nếu caller truyền; live form hiện chỉ truyền nickname và daily limits. Local Backend đã lọc remaining counters ở nhánh Parent; không báo đây là lỗ hổng ghi đè đã được tái hiện.
3. Với profile real, không hiển thị metrics/demoBooks hoặc thông báo lưu thành công demo như dữ liệu thật. Giữ demo trong mode minh họa; lỗi API không tự chuyển sang fixtures.
4. Chặn query family ở chi tiết catalog khi profile API chưa bật; hiện `ParentLibraryPage` gọi `parentProfileService.list` không có enabled theo profile mode.
5. Chuẩn hóa query keys theo userId + childProfileId + nguồn dữ liệu; dùng response GET sau mutation để cập nhật UI. Không giữ cache tài khoản trước sau logout/chuyển user.
6. Sau tạo bé: invalidate danh sách, refresh auth profile/quota, dùng ChildProfile ID thật để điều hướng khi module được bật. Nếu chưa lấy được ID/list, báo đúng trạng thái đã tạo nhưng chưa tải được hồ sơ; không tự POST lại.
7. Khóa checkout thật ở cả nút lẫn route trực tiếp; rà đường vào report/export để không hứa một chức năng đang redirect.
8. Giữ docs trạng thái một nguồn tại tài liệu này; gap doc mô tả contract, các tài liệu cũ là backlog lịch sử.

**Hoàn tất đợt A:** profile thật không trộn dữ liệu mẫu; payload đúng quyền; catalog mở được khi profile off; UI hiện tại không bị đổi bố cục ngoài các trạng thái cần thiết. Đây là backlog triển khai sau lượt lập plan, chưa đánh dấu đã sửa code.

### Đợt B — Nối trọn luồng tạo và quản lý bé

**Phụ thuộc:** Backend xác nhận bản release chứa owner scope và register ID (Q1), xử lý endpoint unscoped (Q2).

- Bật riêng `VITE_PARENT_PROFILE_API_MODE=real` trên môi trường đã xác minh.
- Nghiệm thu Parent đăng nhập → tạo bé → danh sách thật → chi tiết → sửa nickname/giới hạn → reload.
- Dùng `ChildProfile.NickName` làm tên hiển thị; không yêu cầu sửa Users chỉ để hết NULL.
- Tận dụng RemainingChildProfile từ hồ sơ đã xác thực để hướng dẫn người dùng; Backend vẫn quyết định được phép tạo hay không.
- Trường ngoài DTO (DOB/avatar/nhắc đọc/chủ đề yêu thích) chưa gửi lên PUT.

**Điều kiện qua đợt:** Parent A không đọc/sửa bé của B, Child không sửa profile bằng quyền Parent, hết quota không tạo thêm, lỗi refetch không gây tạo trùng.

### Đợt C — Catalog và phê duyệt cơ bản

Catalog chỉ phụ thuộc release story/published pages, có thể kiểm chứng song song với đợt B. Approval phải sau khi có ChildProfile ID thật.

- Catalog: list/chủ đề/detail/published pages; loading/error/empty riêng; kiểm chứng Draft/Pending/Archived và trang không Active bị chặn.
- Approval: bật riêng `VITE_PARENT_APPROVALS_API_MODE=real`, giữ workspace hiện tại; filter, paging, approve/reject, refresh trạng thái và số chờ.
- API hiện duyệt một mapping nhân vật vào vai trong generated story. Không diễn giải thành duyệt mọi phiên bản nhân vật hoặc cấp quyền vai nhạy cảm vĩnh viễn.
- Revision, lý do từ chối và quyền nhạy cảm riêng là mở rộng cần Q4; không xây control giả trước contract. Kiểm tra quyết định đồng thời, không mặc định service kiểm tra Pending đồng nghĩa có atomic concurrency.

**Điều kiện qua đợt:** catalog và reader dùng dữ liệu published; quyết định được lưu và reload đúng; cross-owner bị chặn; không có pending counter hardcode.

### Đợt D — Tận dụng quota hiện có và nối các capability còn thiếu

- **Quota đọc:** kiểm tra response auth/profile trước. Hiển thị remaining đúng nghĩa; chưa suy chu kỳ/resetAt, ngày hết hạn hoặc usage% từ field không đủ dữ liệu (Q3).
- **Hoạt động học tập:** cần event từ Child app và quy tắc aggregate trước dashboard/progress. Web không tự tạo số phút/truyện/quiz để lấp ô trống (Q5).
- **Thư viện/saved/recommendations:** phân biệt template, generated story và character; xác định owner, thao tác hỗ trợ, nơi Child nhận gợi ý (Q6).
- **Settings/profile mở rộng:** phân biệt chủ đề yêu thích với chủ đề được phép; daily cap với mục tiêu đọc; cờ chia sẻ UI với enforcement Backend (Q7).
- **Billing:** chỉ triển khai sau order/session/status/webhook và entitlement (Q8). Subscription CRUD không phải payment API.
- **Export/report/link Child cũ:** sau core MVP; chốt scope/contract riêng nếu cần. Không bắt Backend làm toàn bộ endpoint đề xuất để mở hồ sơ và catalog.

Mỗi capability được bật độc lập khi có contract. Chưa có lịch commit từ Backend nên không gán ngày hoàn tất giả định.

## 5. Kiểm chứng và điều kiện phát hành

| Luồng | Kiểm chứng tối thiểu |
|---|---|
| Build/release | FE build theo mode mục tiêu; BE build thành công, commit/migration/base URL được ghi nhận; Swagger đúng phiên bản |
| Quyền | Hai Parent và Child của từng người; list/detail/PUT/approval chéo owner bị chặn; kiểm tra cả endpoint public/unscoped |
| Mutation | Tạo → GET; sửa → GET; duyệt → GET; reload/đổi tài khoản đúng dữ liệu; double click/lỗi mạng không tạo tác dụng lặp ngoài ý muốn |
| Catalog | Chỉ truyện/trang Active; thứ tự page đúng; lỗi reader không hiển thị trang mẫu; ảnh/audio thiếu có trạng thái rõ |
| Demo/real | Không trộn sample vào hồ sơ thật; không đổi real error thành mock; mode và cache tách nguồn |
| UI | So ảnh trước/sau ở desktop/mobile; kiểm tra giữ bố cục hiện tại; đổi hồ sơ/đường dẫn trực tiếp/refresh hoạt động |
| Thanh toán | Chưa có API thì không có thông báo mua thành công thật; sau này server xác nhận paid mới cập nhật quyền |

Không gọi bản sửa local là “đã deploy” hoặc “live verified”. Kết quả build được ghi trong docs cũ là lịch sử; lượt này không chạy lại build/E2E hay Backend mutation.

## 6. Nguồn code cần dùng khi thực hiện

- FE: `src/lib/api/featureApi.js`, `.env.development`, `.env.production`, `src/app/App.jsx`.
- FE profile: `parentProfileService.js`, `NewChildPage.jsx`, `LiveChildProfilePage.jsx`, `FamilyProfilesLive.jsx`, `FamilyProfileCard.jsx`.
- FE catalog/approval: `parentCatalogService.js`, `ParentLibraryPage.jsx`, `parentApprovalService.js`, `ParentApprovalsLive.jsx`, `ParentChildExperience.jsx`.
- FE demo: `familyProfilePreview.js`, `parentDemoState.js`, `childrenService.js`, `ParentCheckoutPage.jsx`.
- BE: AuthController/AuthService/MappingProfile; ChildProfileController/Service/Repository/DTO; StoryTemplate và StoryPageTemplate controllers/services/repositories; UserStoryCharacterMapping controller/service/repository/DTO; ParentProfileDto/Repository và SubscriptionController.

Các đường dẫn FE rút gọn ở trên thuộc `src/features/parent` (components/pages/services tương ứng), BE thuộc các project trong backend working tree. DTO/entity tồn tại không đủ để kết luận đã có endpoint Parent dùng được.
