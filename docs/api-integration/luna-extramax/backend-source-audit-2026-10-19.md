# Contract xác minh từ source backend — 19/10/2026

Repo: https://github.com/iamhyyyy/sketch-tale-backend.git

Commit được đọc: `42846917f9e2381042267d916d3aa02cbef4d591`. Người dùng đã xác nhận Render chạy commit này. Kiểm tra chỉ đọc source, không truy vấn dữ liệu hồ sơ thật, không chạy mutation hoặc sửa backend. Kết luận source vẫn cần test runtime để nghiệm thu tích hợp.

## 1. Enum đã xác định

Nguồn: [DomainEnums.cs](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.Domain/Enums/DomainEnums.cs). Enum C# không gán số riêng nên bắt đầu 0, tăng lần lượt.

| Enum | Mapping chính xác |
| --- | --- |
| CommonStatus | 0 Draft, 1 Pending, 2 Active, 3 Inactive, 4 Archived |
| TargetAgeGroup | 0 Ag6to7, 1 Age8to10, 2 Age11to12 |
| StoryRoleType | 0 MainCharacter, 1 Companion, 2 Supporting, 3 Other |
| SubscriptionStatus | 0 PendingPayment, 1 Active, 2 Expired, 3 Cancelled |
| MatchType | 0 Exact, 1 Contains, 2 Regex |
| SeverityLevel | 0 Low, 1 Medium, 2 High, 3 BlockImmediately |
| ModerationAction | 0 Reject, 1 FlagForReview, 2 Mask |
| ReadingLevel | 0 Beginner, 1 Intermediate, 2 Advanced |

Giữ đúng tên `Ag6to7` trong contract dù không đồng nhất cách viết với hai giá trị còn lại. DTO ChildProfile/UpdateChildProfile dùng chuỗi TargetAgeGroup/ReadingLevel; DTO story dùng enum số. Không gửi số cho tất cả chỉ vì cùng enum domain.

StoryTemplateService tạo story với Pending=1, publish thành Active=2, DELETE là soft-delete sang Inactive=3. Detail/list tất cả loại Inactive. Không map 1 thành published hoặc 2 thành hidden; không tự gộp Pending vào Draft mà làm mất giá trị backend. UI cần hỗ trợ trạng thái pending. Page tạo Draft=0, role và quiz tạo Active=2 theo các service tương ứng.

## 2. Identity và đăng nhập

Nguồn: [AuthDtos.cs](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.Application/DTOs/AuthDtos.cs), [AuthService.cs](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.Application/Services/AuthService.cs), AuthController.

- Login trả `{data:{token,username,email,role},message}`, **không có user ID**.
- GET `/auth/profile` có Authorize, lấy userId từ claims rồi gọi GetProfileAsync. Trả `{data:UserProfileDto,message}`.
- Sau transport unwrap: `profile.id` là User.Id; `profile.parentProfile.id` là ParentProfile.Id; `profile.childProfile.id` là ChildProfile.Id đối với tài khoản Child. Hai profile không phải luôn cùng xuất hiện.
- ParentProfile có userId và ChildProfiles; ChildProfile có id, userId, parentProfileId. Không suy userId = profileId.
- Parent đăng nhập lấy ID từng bé từ nguồn child list được giới hạn theo Parent ở server, không lấy `profile.childProfile.id` vì đó là profile của tài khoản Child.
- GetProfileAsync tải ParentProfile qua generic repository không Include ChildProfiles. Vì vậy không đảm bảo nested childProfiles là danh sách đầy đủ; array rỗng ở đây chưa chứng minh Parent không có con.
- ParentProfile detail repository có Include ChildProfiles, nhưng endpoint hiện thiếu ownership như mục 4, chưa dùng làm giải pháp bảo vệ thay server authorization.
- `currentPlan` trong auth/profile được BE suy ra từ quota: >=5 child hoặc >=10000 credit là Pro; >=3 hoặc >=4000 là Plus; còn lại Free. Nó không chứng minh subscription đã thanh toán hoặc đang hiệu lực.

### Lỗi FE phát hiện được nhờ source

`authService.login()` hiện dùng `pickUser(response) || restore()`. Response login có username/role nên pickUser trả object dù **id undefined**, và restore không chạy. storeSessionUser bỏ qua khi thiếu id; cache và mock identity sau login có thể hỏng.

Đã sửa trong source ngày 19/10: login hydrate profile qua `/auth/profile` trước khi lưu session. Cần giữ fixture giống response login không có ID và kiểm thử sau login/reload; implementation report ghi lượt tích hợp gần nhất chưa chạy test runtime.

## 3. Tạo bé và liên kết Parent đã có API

**Đính chính kế hoạch trước:** `POST /auth/register/child` không chỉ dành cho app Child.

- AuthController yêu cầu role Parent,parent và lấy parentUserId từ JWT.
- CreateChildAccountAsync tìm ParentProfile qua UserId, tạo mặc định nếu chưa có; kiểm tra RemainingChildProfileLimit.
- Tạo User role Child và ChildProfile, gán `ChildProfile.ParentProfileId = parentProfile.Id`, trừ remaining child limit.
- Body: `{username,password,nickName}`. Form Parent hiện có username/password và gọi endpoint thật; DOB/avatar không được endpoint lưu.
- Success chỉ trả message, không trả child ID. Không tự đoán ID hoặc điều hướng bằng username; refetch danh sách đã được server scope hoặc yêu cầu BE trả ID vừa tạo. Không retry POST khi chỉ refetch thất bại.
- API này tạo **tài khoản mới** và liên kết; liên kết tài khoản Child đã tồn tại, hủy liên kết và các thao tác khác chưa thấy endpoint, tiếp tục mock.

Tạo tài khoản thật đã được nối theo yêu cầu người dùng. Để hoàn tất flow hiển thị tài khoản mới, Backend cần trả child ID hoặc cung cấp đường đọc children có ownership. Không dùng danh sách toàn hệ thống để tìm child vừa tạo.

## 4. Vấn đề ownership trong backend cần sửa

Nguồn: ChildProfileController, ParentProfileController, ChildProfileService, ParentProfileService, GenericRepository, Program.cs tại commit trên.

- Hai profile controller không có `[Authorize]`. Không tìm thấy global AuthorizeFilter/FallbackPolicy/RequireAuthorization trong source đã rà.
- GET child list gọi generic GetAllAsync → `_dbSet.ToListAsync()`, không lọc theo claims/Parent.
- Detail và update đọc trực tiếp ID, không so owner với caller. Parent detail Include children nhưng cũng không scope caller.
- Parent PUT nhận quota/credit/permission/securityCode; source không kiểm tra quyền sửa các field này. Đây là lỗi backend thực tế trong source, không giải quyết bằng ẩn nút FE.
- Route child by-parent đang comment; service GetByParentProfileIdAsync ném NotImplementedException.

**Phân loại: API_PRESENT_BACKEND_FIX_REQUIRED**, không phải API_MISSING. Không tự fallback mock cho request thật lỗi, không gọi toàn bộ profile rồi lọc trên frontend. Chỉ giữ demo tách biệt có nhãn trong lúc chờ sửa; không tuyên bố đã nối profile thật.

Yêu cầu BE: xác thực trên các profile endpoint; authorize theo owner/role; child list scope JWT; kiểm tra từng ID ở read/write; tách field quota hệ thống khỏi input Parent; trả child ID khi tạo hoặc cung cấp đường refetch an toàn. Nghiệm thu với hai tài khoản Parent riêng trên dữ liệu test.

## 5. PUT và media: cập nhật cho Luna

- UpdateChildProfileDto có string mặc định rỗng và int mặc định 0. UpdateParentProfileDto có default quota/false/securityCode. Mapper chỉ bỏ null; không bỏ 0/false/chuỗi rỗng. Omit field không có nghĩa giữ nguyên. Cần BE làm rõ/sửa semantics hoặc round-trip các field cho phép theo dữ liệu thật, không tự mở quyền sửa quota.
- Story update: Map DTO vào entity, chỉ thay CoverImageUrl khi file khác null. Page update chỉ thay background/audio khi file tương ứng khác null. Schema update không có các URL này, nên source cho thấy không gửi file giữ media hiện có. Bỏ blocker “phải chọn lại ảnh bìa” sau khi adapter/test đối chiếu đúng contract; vẫn test live bảo toàn file.
- Quiz update có nhánh thay ảnh/audio khi file được gửi. Hành vi xóa media chủ động chưa được xác nhận, không dùng omission để xóa.
- Người dùng đã xác nhận X/Y slot là phần trăm 0–100; CRUD slot đã được nối trong source. Quyền các nhóm API khác và kiểm tra multipart/runtime vẫn cần nghiệm thu; bảng enum không tự giải quyết mọi câu hỏi contract.

## 6. Thứ tự áp dụng

1. X01/X04/X06–X11 dùng enum đã xác minh, không hỏi lại bảng enum.
2. Hydration profile qua X05 đã có trong source; kiểm tra fixture/runtime trước khi nghiệm thu.
3. X12: create child thật qua register/child đã nối. Giữ existing-link/unlink mock; read/update Parent–Child đợi backend ownership fix.
4. X14 dùng parentProfile.id từ auth/profile, phân biệt currentPlan suy quota và subscription thực tế.
5. Ghi riêng lỗi backend và câu hỏi còn lại. Người dùng đã xác nhận commit deploy; không hỏi lại câu hỏi đó.

## 7. Slot API sau khi người dùng xác nhận đơn vị

CRUD slot đã được nối trong source; implementation report ghi chính xác field real, overlay mock và kiểm thử runtime còn thiếu.

Người dùng xác nhận `PosX`/`PosY` là phần trăm 0–100.

- [`CharacterSlotTemplateController`](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.API/Controllers/CharacterSlotTemplateController.cs): GET theo `pageId`; POST cùng route cần role ContentManager; PUT/DELETE theo slot ID cũng cần ContentManager.
- [`CharacterSlotTemplateService`](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.Application/Services/CharacterSlotTemplateService.cs): create kiểm tra page/role active, cùng story và không trùng role trên trang; server đặt slot Active. Delete là soft-delete sang Inactive; GET loại Inactive.
- [`StoryManagementDtos`](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.Application/DTOs/StoryManagementDtos.cs): DTO slot có `PosX`, `PosY`, `Scale`, `FlipHorizontal`, `Status` và audit fields. DTO không có rotation, layer, hoặc ảnh riêng trên từng slot. Update DTO mặc định Status=0; FE phải gửi lại status hiện tại để giữ nguyên.
- Tạo slot gửi `CreatedAt` và `CreateBy` theo DTO; update gửi `UpdateBy`. FE lấy ID từ hồ sơ tài khoản Content Manager đang đăng nhập, không lấy từ form.

## 8. Lỗi route đọc trang phát hiện khi kiểm tra tải truyện

Trong [`StoryPageTemplateController.cs`](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.API/Controllers/StoryPageTemplateController.cs), backend khai báo cả `GET pages/{storyId}` và `GET pages/{id}`. Hai route có cùng mẫu URL nên ASP.NET trả 500 khi FE gọi `/storypage-template/pages/{storyId}`; phản hồi 500 trên Render không có `Access-Control-Allow-Origin`, vì vậy Chrome còn báo lỗi CORS. Policy CORS `AllowAll` và middleware được cấu hình trong [`Program.cs`](https://github.com/iamhyyyy/sketch-tale-backend/blob/42846917f9e2381042267d916d3aa02cbef4d591/sketch_tale.API/Program.cs).

FE đã đổi các request lấy trang cho editor và kho tài sản sang `GET /storypage-template/all-pages/{storyId}`, route riêng có `[Authorize(Roles = "ContentManager,content manager")]`. Smoke request không token trả 401 kèm CORS header, xác nhận route mới được nhận diện; chưa có JWT Content Manager test để xác nhận 200 và nội dung trang. `GET /story-template/all-stories` cũng được bảo vệ role ContentManager; 401 khi thiếu/hết hạn token cần xử lý bằng đăng nhập lại, không chuyển sang mock.
