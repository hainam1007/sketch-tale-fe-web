# Đối chiếu Parent API theo Backend source — 01/11/2026

Đã đọc source công khai của Backend tại commit [`fb3075e`](https://github.com/iamhyyyy/sketch-tale-backend/tree/fb3075e). Đây là kết quả kiểm tra mã nguồn; không gửi request bằng phiên đăng nhập thật và không thay đổi dữ liệu Backend.

Ngày 01/11, các blocker Parent đã được sửa thêm trong Backend working tree local và Frontend working tree local. Các link commit bên dưới là baseline trước những sửa đổi local; các thay đổi mới chưa commit/deploy hoặc live-verified. Frontend `npm run build` đã thành công; Backend chưa compile vì máy hiện tại không có .NET SDK/`dotnet`. Production profile/catalog vẫn mock.

Source đã đối chiếu: [AuthController](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.API/Controllers/AuthController.cs), [AuthService](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/Services/AuthService.cs), [Auth DTOs](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/DTOs/AuthDtos.cs), [MappingProfile](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/Mappings/MappingProfile.cs), [User](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Domain/Entities/User.cs), [ChildProfile](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Domain/Entities/ChildProfile.cs), [ChildProfileController](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.API/Controllers/ChildProfileController.cs), [ChildProfileService](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/Services/ChildProfileService.cs), [ParentProfileController](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.API/Controllers/ParentProfileController.cs) và [SubscriptionController](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.API/Controllers/SubscriptionController.cs).

> **Bổ sung sau rà soát lại ngày 01/11:** [plan hiện hành](PARENT_INTEGRATION_PLAN_2026-11-01.md) cập nhật thứ tự và mode development catalog real/profile mock/approvals mock. ParentProfileDto đã có RemainingChildProfile/RemainingMonthlyCredit; cần xác minh response và quy tắc reset. FE update adapter vẫn nhận remaining counters nếu caller truyền, dù live form không truyền và Backend nhánh Parent lọc chúng; backlog FE là bỏ khỏi whitelist. Các nhận xét build/runtime bên dưới là ghi nhận trước đó, chưa được chạy lại trong lượt cập nhật plan. [Câu hỏi Backend](PARENT_BACKEND_QUESTIONS_2026-11-01.md).

## Có thể kết nối an toàn

- Response đã xác thực của `GET /api/auth/profile` có `ParentProfile` hiện tại, gồm `SubscriptionPlanId` và plan lồng bên trong. Frontend tải response này khi khôi phục phiên. `ParentPlanPage` dùng ID đó để đánh dấu gói hiện tại trong catalog Backend. Cách này không nhầm User ID với ParentProfile ID và không gọi các subscription endpoint chưa có owner scope.
- `POST /api/auth/register/child` yêu cầu role Parent và lấy Parent user ID từ request đã xác thực. Có thể giữ kết nối hiện tại để đăng ký tài khoản bé.
- Catalog gói và chủ đề giáo dục có caller chỉ đọc. Story catalog có operation/caller nhưng phải qua kiểm tra an toàn nội dung bên dưới trước khi dùng real cho Parent.

### Đăng ký Child và trường tên

`RegisterChildDto` nhận `Username`, `Password`, `NickName`. `AuthService.CreateChildAccountAsync` tạo cả `User` và `ChildProfile`, liên kết ChildProfile với ParentProfile lấy từ JWT, rồi cập nhật quota. Mapping source chuyển `NickName` sang `ChildProfile.NickName`; `User` chỉ có `FirstName`/`LastName` và mapping không chuyển `NickName` sang hai field đó. Vì vậy, nếu đang xem hàng trong bảng `Users`, hai cột tên có thể là `NULL` trong khi tên hiển thị nằm ở `ChildProfiles.NickName`. Backend working tree local hiện trả `childProfileId`; Frontend nhận ID và chỉ mở hồ sơ khi Parent profile mode real. Chưa xác minh response/persistence trên staging.

## ChildProfile ownership — đã sửa trong local source, chờ deploy/verify

Baseline commit `fb3075e` chưa scope các thao tác ChildProfile. Backend working tree local hiện đã thêm:

- `[Authorize]` theo role Parent/Child/Admin; Parent list/detail lọc theo `ParentProfile.UserId` từ JWT; Child chỉ đọc hồ sơ có `UserId` của chính mình; Admin vẫn có phạm vi quản trị.
- Update Parent tìm hồ sơ qua cùng owner scope; truy cập chéo owner trả 404. Parent không thể sửa `RemainingTimeLimit`/`RemainingCharacterLimit`; đây vẫn là counters phía server.
- Frontend `parentProfileService` gọi GET list/detail và PUT update, map DTO. `VITE_PARENT_PROFILE_API_MODE` tách riêng, mặc định kế thừa Parent module mock; production đặt mock cho tới khi Backend mới deploy.

Những điểm còn cần xác minh bằng staging Parent A/B:

- UserId/role claim thực tế có được đọc đúng từ JWT trên môi trường phát hành không.
- List/detail/update của Parent A không đọc hoặc sửa hồ sơ Parent B; Child chỉ lấy profile của chính Child.
- Response shape và `childProfileId` sau đăng ký khớp với bản FE đang phát hành.

Các API khác vẫn chưa được mở cho Parent:

- `ParentProfileController` không có thuộc tính phân quyền. Các thao tác list/detail trả hồ sơ tùy ý; thao tác update đổi gói theo ID profile được gửi lên.
- `ParentProfileRepository.GetByUserIdAsync`, được `/auth/profile` sử dụng, nạp plan subscription nhưng không nạp `ChildProfiles`; do đó response profile đã xác thực không thể cung cấp danh sách bé của gia đình.
- `SubscriptionController` không kiểm tra xác thực hoặc quyền sở hữu. Caller có thể yêu cầu subscription theo ParentProfile ID bất kỳ.

## API phê duyệt nhân vật — security và inbox đã có trong local source, release còn pending

Source baseline có `GET/POST/PATCH/DELETE /api/user-story-character-mappings`, cùng GET theo character và generated story. Local source bổ sung inbox theo child profile; xem [controller](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.API/Controllers/UserStoryCharacterMappingController.cs), [service](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/Services/UserStoryCharacterMappingService.cs) và [DTO](https://github.com/iamhyyyy/sketch-tale-backend/blob/fb3075e33d584abbb185fcc860aeec206f8af9a0/sketch_tale.Application/DTOs/UserStoryCharacterMappingDto.cs).

- Baseline `fb3075e` không có `[Authorize]`; Backend working tree local hiện thêm role authorization, owner-scoped repository queries theo Parent/Child và validate quan hệ GeneratedStory → ChildProfile/Character/StoryRole.
- Create tự đặt `ParentApprovalStatus` thành `Pending` hoặc `NotRequired` theo `StoryRoleTemplate.RequiresParentApproval`.
- PATCH DTO local chỉ nhận `ParentApprovalStatus`, chỉ cho Parent/Admin đổi Pending sang Approved/Rejected; DELETE vẫn giữ route tương thích và có nghĩa reject request Pending.
- Parent approval UI gọi `GET /api/user-story-character-mappings/child/{childProfileId}` và `PATCH /api/user-story-character-mappings/{id}` khi `VITE_PARENT_APPROVALS_API_MODE=real`. Inbox được render trong không gian bé v2 `ParentChildExperience` qua `ParentApprovalsLive`, giữ header và điều hướng hiện tại; hồ sơ preview tiếp tục dùng dữ liệu demo. Cần `VITE_PARENT_PROFILE_API_MODE=real` để dùng ChildProfile ID thật. Revision/lý do từ chối/quyền vai nhạy cảm không được giả lập. Mặc định demo/prod vẫn mock.

Kết luận trạng thái: **Backend inbox + FE approval list/decision có trong local source; chưa build/deploy/runtime-verified.** Mode mặc định vẫn MOCK. Revision, lý do từ chối và quyền vai nhạy cảm chưa có contract; không hiển thị các control này trong trang live.

## Story catalog và pages — source fix có trong local working tree, chờ deploy/verify

Baseline `fb3075e` lọc `Status != Inactive`, nên có thể trả Draft/Pending/Archived. Backend working tree local hiện list/by-theme lọc `Status == Active`; Parent/Child detail chỉ trả Active. Content Manager/Admin vẫn dùng detail biên tập bản chưa publish. FE adapter cũng fail-closed nếu status thiếu/sai; `.env.production` giữ catalog mock tới khi release.

Backend local thêm `GET /api/storypage-template/published/{storyId}` cho Parent/Child, chỉ trả trang Active của story Active; route Content Manager `/pages/by-story/{storyId}` và `/page/{pageId}` tách nhau. Frontend adapter tải và map page body/image/audio; production profile/catalog vẫn mock cho đến khi release.

## Còn cần Backend/API release để hoàn tất tích hợp Parent

1. Build/deploy source mới, ghi version/commit và xác minh ChildProfile Parent A/B, register ID, story status/pages, mapping owner/transition trên staging.
2. ParentProfile/Subscription CRUD vẫn thiếu auth/owner checks; không gọi từ Parent. Giữ `/auth/profile` làm nguồn current plan.
3. **Approval inbox local source:** route theo bé trả item context/paging; FE live service lọc và PATCH status. Chỉ bật sau Backend build/deploy, cập nhật Swagger/live contract và test owner A/B. Revision, reject reason và sensitive-role permission vẫn cần Backend chốt.
4. Checkout session và xác minh thanh toán phía server vẫn chưa có; tiếp tục khóa checkout thật.

Dashboard/progress, cài đặt bé, thư viện riêng, exports và báo cáo gia đình chưa có contract scoped tương ứng; xem [danh sách API Parent còn thiếu](PARENT_API_GAPS_2026-10-29.md). Approval inbox có partial live-ready local source: scoped GET + status PATCH; release/runtime verify còn pending, revision/reason/sensitive-role còn thiếu.

## Trạng thái triển khai

- Đã kết nối: đọc định danh gói hiện tại từ Parent profile đã xác thực.
- Đã có caller trong source: đăng ký bé trả ID trong local Backend; đọc plan hiện tại/catalog gói và education themes.
- ChildProfile list/detail/update, story status/pages và mapping authorization đã có source fix local + FE adapter profile/catalog; chưa build/deploy/live-verified. Production giữ Parent profile/catalog mock.
- ParentProfile/Subscription CRUD vẫn không owner-scoped. Mapping CRUD và inbox có auth/owner/transition checks trong local source; approval UI có adapter/live view sau opt-in, mặc định mock cho tới khi backend mới release.
- DEMO/MOCK: dashboard/progress, settings mở rộng, thư viện riêng, exports và báo cáo. Approval inbox có code local và cờ `VITE_PARENT_APPROVALS_API_MODE`, nhưng production mặc định mock; chờ backend release/runtime verification. Revision/reason/sensitive-role chưa có.
- Chưa có capability billing thật: checkout/payment.
- Xác minh: `npm run build` Frontend thành công ngày 01/11 (có cảnh báo bundle JS lớn); Backend chưa build vì không có lệnh `dotnet`. Chưa chạy E2E, chưa gọi API trực tiếp và chưa thay đổi dữ liệu.
- Giới hạn: local Backend changes chưa commit/deploy; baseline `fb3075e` chưa được xác nhận là phiên bản đang chạy trên Render.
