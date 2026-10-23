# Kế hoạch nối các API đã có trong Swagger

Ngày lập: **21/10/2026**. Kế hoạch ban đầu; một phần đã được triển khai. Xem [trạng thái hiện tại](API_IMPLEMENTATION_STATUS_2026-10-21.md).

Bản triển khai chi tiết dành cho Luna: [bàn giao theo file, contract và test](LUNA_API_HANDOFF_2026-10-21.md), [ma trận operation còn lại](LUNA_API_OPERATION_MATRIX_2026-10-21.md). Người dùng đã chốt triển khai local với backend hiện tại; hỏi lại khi cần tài khoản thử. Các điểm kỹ thuật cụ thể trong bản bàn giao bổ sung cho các đợt bên dưới.

Nguồn: [audit 111 operations](swagger-connection-audit-2026-10-21.md), [snapshot Swagger](../../artifacts/swagger-audit-2026-10-21.json), service và cấu hình frontend hiện tại.

## 1. Mục tiêu và phạm vi

Chuyển các chức năng web hiện có sang dữ liệu backend thật theo từng module. Mỗi API được nối phải có caller, mapping dữ liệu, trạng thái lỗi và kiểm thử phù hợp; không chỉ thêm hàm service để tăng tỷ lệ coverage.

Baseline: 54 operations có đường gọi thật, 7 service-only, 48 chưa nối, 2 endpoint dùng phương án thay thế. Không đặt mục tiêu gọi đủ 111 operations: lookup dư thừa, chức năng Child mobile và thao tác quản trị không thuộc Parent được phân loại riêng.

Chức năng chưa có contract backend tiếp tục theo dõi tại [PARENT_MISSING_APIS_BACKEND.md](../PARENT_MISSING_APIS_BACKEND.md). Kế hoạch này không coi dashboard, approval, export hoặc checkout là đã có chỉ vì có CRUD profile/subscription.

## 2. Thứ tự triển khai

| Đợt | Công việc | Điều kiện bắt đầu | Kết quả nghiệm thu |
| --- | --- | --- | --- |
| 0 | Xác minh contract, đồng bộ route guard, tách cấu hình theo chức năng | Bắt đầu ngay | Mỗi module có contract/mapping và trạng thái sẵn sàng rõ ràng |
| 1 | Sửa Audit, nối danh mục char-types và prohibited-themes | Đợt 0 cho từng module | Đọc/ghi thật, tải lại vẫn giữ dữ liệu |
| 2 | Nối báo cáo nội dung Admin | Xác nhận enum và ý nghĩa PATCH | Danh sách, chi tiết, cập nhật trạng thái thật |
| 3 | Nối hồ sơ Parent/Child và settings cơ bản | Xác minh ID, response, quyền sở hữu | Parent quản lý đúng bé của mình, dữ liệu lưu thật |
| 4 | Nối catalog Parent, gói đang dùng và quyền lợi đọc được | Catalog có scope phù hợp; subscription xác định được ParentProfile ID | Catalog và thông tin gói dùng dữ liệu thật |
| 5 | Xóa page/role và upload có consumer hợp lệ | Xác minh hành vi xóa và contract lưu asset | Editor cập nhật đúng sau xóa; ảnh được lưu và đọc lại |
| 6 | Nghiệm thu tích hợp và cập nhật audit | Các đợt được triển khai đã qua kiểm tra riêng | Coverage theo UI chính xác, không báo mock thành dữ liệu thật |

Đợt nào thiếu contract chỉ hoãn phần phụ thuộc; tiếp tục module khác đã đủ điều kiện. Đợt 3 có thể được ưu tiên trước đợt 2 khi backend đã xác minh quyền sở hữu và response profile.

## 3. Đợt 0 — nền tảng và contract

- [ ] Đối chiếu Swagger live khi bắt đầu triển khai; giữ snapshot kiểm chứng và danh sách thay đổi.
- [ ] Bổ sung 16 operations của `/char-types`, `/prohibited-themes`, `/content-reports` vào `src/lib/api/backendRoutes.js`; giữ guard chặn route không được khai báo.
- [ ] Tách lựa chọn real/mock theo chức năng trong `src/lib/api/featureApi.js`: profile, catalog Parent, subscription, reports, danh mục kiểm duyệt. Đây là cấu hình cần thiết kế thêm, không phải biến môi trường đang có.
- [ ] Module real gặp lỗi phải hiển thị lỗi; không tự rơi về mock. Module chưa nối giữ nhãn dữ liệu mô phỏng hoặc trạng thái chưa khả dụng rõ ràng.
- [ ] Xác minh envelope/list, response mutation rỗng, enum và lỗi từ response thực bằng tài khoản thử đúng role. Không suy diễn tên enum từ thứ tự số.
- [ ] Quy định adapter riêng theo module; query key chứa ID/phạm vi người dùng phù hợp, invalidate sau mutation và xóa cache khi đổi phiên.
- [ ] Giữ các thay đổi Auth đang có trong working tree; phối hợp với [kế hoạch Auth](../AUTH_API_OPTIMIZATION_PLAN.md), không viết lại refresh/login trong đợt này.

Các điểm phải xác minh trước phần phụ thuộc:

| Contract | Điều cần làm rõ |
| --- | --- |
| ChildProfile/ParentProfile GET | Swagger chưa mô tả response; lấy mẫu đã bỏ thông tin nhạy cảm, xác định User ID khác Profile ID và cơ chế lấy hồ sơ hiện tại |
| Danh sách Child | Backend phải scope theo Parent; không tải toàn bộ trẻ rồi lọc ở client để thay kiểm soát quyền |
| Register Child | Xác định response có ID hay phải refetch danh sách scoped; không tự đoán ID từ username |
| Enum | Xác nhận nhãn cho CommonStatus, ContentReportStatus, ReportTargetType, MatchType, SeverityLevel, ModerationAction, SubscriptionStatus |
| PUT profile | Xác nhận field bắt buộc, ý nghĩa field bỏ qua/null và nguy cơ reset giá trị không có trên form |
| Upload | Response URL/asset ID, giới hạn file, thời hạn URL và API gắn ảnh vào đối tượng |
| Delete page/role | Xóa mềm/cứng, xử lý slot/quiz/vocabulary tham chiếu, lỗi khi đối tượng đang được dùng |

## 4. Đợt 1 — Audit và danh mục

File chính: `adminService.js`, `adminCatalogService.js`, `AdminAuditPage.jsx`, `AdminCatalogPage.jsx`, `AdminRestrictionsPage.jsx` và router/menu Admin khi cần.

- [ ] Map `auditAction` từ backend sang model thống nhất dùng cho cả list/detail Audit; sửa tìm kiếm và bộ lọc tương ứng.
- [ ] Thêm danh mục loại nhân vật bằng `/char-types`: list, create, update, delete; dùng GET detail khi mở trực tiếp chi tiết hoặc cần refresh bản ghi.
- [ ] Nối `/prohibited-themes` vào phần quản lý chủ đề cấm với field thực tế: name, description, matchType, severityLevel, action, status.
- [ ] Không map chủ đề cấm hệ thống thành `allowedThemeIds` riêng của từng bé: đây là hai nghiệp vụ khác nhau.
- [ ] Reuse layout danh mục hiện có; thiết kế form theo DTO từng loại, không dùng chung một payload cho mọi danh mục.

Nghiệm thu: CRUD giữ dữ liệu sau reload; lỗi validation/permission hiển thị đúng; Audit hiển thị và lọc theo hành động backend trả về.

## 5. Đợt 2 — báo cáo nội dung Admin

File chính: `adminService.js`, `AdminReportsPage.jsx`, `AdminReportDetailPage.jsx`; có thể tách `contentReportService.js` và adapter riêng.

- [ ] Đổi list/detail từ `/admin/reports` mock sang GET `/content-reports` và GET `/content-reports/{id}`.
- [ ] Map `targetType`, `targetId`, `reason`, `status`, thời gian và người tạo. Field như tiêu đề đối tượng/người báo cáo chỉ hiển thị khi có nguồn thật; có thể dùng ID làm thông tin tối thiểu.
- [ ] Nối PATCH đúng `UpdateContentReportDto`; xác minh việc đổi status có thực hiện hành động kiểm duyệt hay chỉ cập nhật bản ghi báo cáo.
- [ ] Chỉ bật nút xử lý mà backend thực sự hỗ trợ; không báo đã ẩn/xóa nội dung khi chỉ đổi trạng thái report.
- [ ] Swagger hiện không khai báo query phân trang/tìm kiếm cho list: xử lý trên danh sách đầy đủ nếu phù hợp, không gửi query rồi giả định backend hỗ trợ.
- [ ] Không gửi `revision`/ghi chú xử lý theo model mock khi DTO chưa có. Nếu cần concurrency hoặc lịch sử quyết định, ghi thành phần thiếu contract.
- [ ] POST, DELETE và GET `/content-reports/users/{userId}` chỉ gắn khi có luồng tạo/xóa/lịch sử báo cáo phù hợp và quyền đã rõ; không thêm nút xóa hàng loạt chỉ vì có endpoint.

Nghiệm thu: list/detail nhất quán; mutation thành công phải refetch và hiển thị trạng thái thật; phân biệt báo cáo nội dung với báo cáo học tập gia đình.

## 6. Đợt 3 — Parent/Child profile và settings

File chính: `childrenService.js`, các trang Parent/profile, `ChildWorkspaceLayout.jsx`, query liên quan; thêm adapter profile thay vì đưa DTO backend trực tiếp vào UI.

- [ ] Lấy ParentProfile ID từ nguồn xác thực hợp lệ đã xác minh; nối GET profile cá nhân và dữ liệu quyền lợi có sẵn.
- [ ] Nối GET `/child-profiles`, GET `/child-profiles/{id}` vào danh sách, selector và màn chi tiết bé.
- [ ] Map `nickName`, `targetAgeGroup`, `readingLevel`, `dailyTimeLimit`, `dailyCharacterLimit` theo response/contract thực.
- [ ] Nối PUT `/child-profiles/{id}` cho sửa hồ sơ và giới hạn. Không cho Parent tùy ý sửa `remainingCharacterLimit`; không đặt 0 cho field chưa tải được.
- [ ] Sau đăng ký Child thành công, lấy ID từ response hoặc refetch danh sách scoped; đưa bé mới vào selector bằng ID thật.
- [ ] Chuyển profile/settings sang real độc lập với dashboard, progress, approval và library còn thiếu API; kiểm tra các trang này đang phụ thuộc dữ liệu profile ở đâu để tránh trộn ID giả/thật.
- [ ] Không đưa các field quota/quyền lợi trong `UpdateParentProfileDto` vào form tự chỉnh cho Parent. Chỉ nối PUT cho trường/nghiệp vụ đúng quyền đã xác nhận, ví dụ securityCode nếu quy trình tương ứng đã đủ contract.
- [ ] `mark-trial-plan-used` chưa được coi là kích hoạt dùng thử; hoãn đến khi xác định lifecycle và bên được phép gọi.

Nghiệm thu: Parent A không đọc/sửa được profile của Parent B hoặc Child của B; đổi bé không hiện dữ liệu bé trước; reload giữ settings; tài khoản không có bé hiển thị empty state. Các nhận định lỗi ownership trong audit cũ phải được xác minh lại, không mặc định backend đã sửa hoặc vẫn lỗi.

## 7. Đợt 4 — catalog Parent và subscription đọc

File chính: `childrenService.js`, `publicService.js`, `ParentLibraryPage.jsx`, `ParentPlanPage.jsx`; thêm `subscriptionService.js` nếu cần.

- [ ] Nối danh mục chủ đề từ GET `/education-themes`.
- [ ] Chọn endpoint story catalog đúng scope Parent và trạng thái đã xuất bản. Xác minh `/story-template/stories` và bộ lọc theme trước; không dùng `all-stories` để vô tình đưa bản nháp nội bộ ra catalog.
- [ ] Map thông tin catalog; tách thao tác đề xuất cho bé vì API recommendation chưa có.
- [ ] Nối GET `/subscriptions/parent-profile/{id}` và GET detail khi cần; hiển thị gói, status, startDate/endDate và plan thực.
- [ ] Giữ cả backend plan ID và code trong adapter `publicService`: hiện `id` ưu tiên code, không dùng code thay UUID khi tích hợp subscription.
- [ ] Xác định gói đang hiệu lực từ quy tắc backend; không lấy phần tử đầu tiên hoặc tự suy luận nhãn status số.
- [ ] Dữ liệu usage/quota còn lại chỉ hiển thị từ nguồn đã có; không biến giới hạn gói thành số đã sử dụng.
- [ ] POST/PATCH/DELETE subscriptions để dành cho luồng quản trị/lifecycle được xác nhận; không nối vào nút thanh toán Parent. PATCH hiện là `/subscriptions?id=...`, không phải `/subscriptions/{id}`.

Nghiệm thu: catalog dùng dữ liệu thật đúng phạm vi; gói hiển thị đúng Parent; thiếu subscription có empty state; nút mua gói không thông báo thanh toán thành công qua CRUD.

## 8. Đợt 5 — Content và upload

File chính: `contentService.js`, `assetService.js`, `StoryPagesPage.jsx`, các component quản lý role/ảnh.

- [ ] Nối DELETE `/storypage-template/story-pages/{id}` vào `deletePage`; giữ dialog xác nhận và chỉ cập nhật editor sau thành công.
- [ ] Bổ sung thao tác xóa role dùng DELETE `/story-role/{id}` với trạng thái đang sử dụng/lỗi từ backend.
- [ ] Sau xóa refetch story, pages, slots, quizzes/vocabulary liên quan; cập nhật trang/role đang chọn và xử lý draft local để không khôi phục đối tượng đã xóa.
- [ ] Tạo upload adapter multipart dùng field `file`; nối `/upload/avatar` và `/upload/background-image` ở consumer có API lưu liên kết ảnh hợp lệ.
- [ ] Xác minh upload xong có thể gắn URL/asset ID vào profile/page và đọc lại. Nếu endpoint lưu chỉ nhận multipart ảnh trực tiếp, giữ luồng đó; không upload hai lần để cố sử dụng endpoint riêng.
- [ ] Upload thành công đơn lẻ không được coi là đã lưu avatar hay đã có thư viện asset bền vững.

Nghiệm thu: xóa thành công không để selection/reference hỏng, xóa thất bại giữ nội dung; ảnh đọc được sau reload và không phụ thuộc blob URL của phiên hiện tại.

## 9. API chưa cần nối thêm ngay

| Nhóm | Quyết định |
| --- | --- |
| Child login | Đã có service/provider; Child mobile ngoài phạm vi web hiện tại, không thêm màn đăng nhập chỉ để dùng endpoint |
| POST confirm-email | UI đã dùng GET; giữ phương án thay thế, chỉ dùng nếu luồng xác nhận yêu cầu |
| GET current-role | Auth đang có role từ profile; dùng khi cần xác nhận role riêng, tránh gọi thừa mỗi lần render |
| GET detail danh mục | Nối khi form/detail cần đọc mới; dùng list hiện có là hợp lệ nếu đủ dữ liệu |
| Audit filter endpoints | Dùng khi UI cần truy vấn theo user/entity; xác minh khả năng kết hợp filter trước |
| Lookup quiz/role/vocabulary, stories theo theme, plan theo code | Nối theo nhu cầu trang hoặc tối ưu fetch; tránh gọi N+1 khi list đã đủ |
| Hai GET storypage-template/pages/{...} | Tiếp tục dùng all-pages; chỉ đổi sau khi backend làm rõ hai route cùng hình dạng |
| Profile lookup từng field | Ưu tiên đọc profile một lần nếu response đủ; không bắt buộc thêm bốn request cho một màn settings |
| Subscription list toàn hệ thống/theo plan | Chỉ nối vào màn quản trị có nhu cầu và quyền phù hợp |

## 10. Kiểm thử và điều kiện hoàn tất

- Mỗi đợt chạy `npm run lint`, `npm run build` và các Playwright spec liên quan; mở rộng kiểm thử khi có thay đổi shared hoặc lỗi phát sinh.
- Contract tests tập trung vào mapping enum/envelope, payload PUT/PATCH, guard và response rỗng. Test intercept không thay cho nghiệm thu backend thật.
- Profile kiểm tra role/ownership bằng tài khoản thử và dữ liệu được phép dùng; cập nhật, reload và đổi phiên để phát hiện cache lẫn người dùng.
- CRUD dùng bản ghi thử có thể dọn dẹp; không xóa nội dung sản xuất để kiểm tra.
- Các spec hiện có như `admin-implementation.spec.js`, `parent.spec.js`, `parent-plan.spec.js`, `parent-library.spec.js`, `profile.spec.js`, `content-contract.spec.js`, `story-editor-integrity.spec.js` cần chọn/cập nhật theo module; test mock cũ không tự chứng minh tích hợp thật.
- Trạng thái hoàn thành phải ghi rõ: service có, UI gọi, test contract qua, runtime đã nghiệm thu hay còn chờ. Cập nhật audit theo từng operation, không gắn CONNECTED cho toàn controller sau khi chỉ nối GET list.
- Trước bật real trên môi trường triển khai, xác nhận cấu hình của từng module và smoke test luồng liên quan. Module chưa sẵn sàng vẫn được phân biệt rõ trong UI.

## 11. Các phần bàn giao

1. PR nền tảng: route guard, cấu hình module, adapter chung cần thiết và mapping Audit.
2. PR danh mục: char-types, prohibited-themes, form và kiểm thử CRUD.
3. PR reports: list/detail/mutation được backend hỗ trợ.
4. PR Parent profiles: ID, danh sách, selector, settings và đăng ký Child/refetch.
5. PR Parent catalog/subscription: dữ liệu đọc thật, giữ ranh giới với checkout còn thiếu.
6. PR Content: delete page/role, upload có consumer và xử lý cache/draft.
7. Báo cáo nghiệm thu: API đã nối, trường hợp kiểm thử, phần chờ backend và cấu hình đã bật.

Các PR là cách chia khối lượng dự kiến; chưa tạo PR hoặc triển khai ứng dụng trong bước lập kế hoạch này.
