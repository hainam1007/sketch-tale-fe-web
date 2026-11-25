# Auth — contract và phiên

Cập nhật 18/11/2026: Auth profile nested Parent/Child DTO đổi định danh sang `id`; register/child local staged vẫn trả `childProfileId` ở response riêng, không đồng nhất hai shape. GET confirm-email có Required/EmailAddress validation trong source hiện tại. Refresh/rotation chưa có runtime mới; giữ AUTH-01. Source BE chỉ đọc; xem [contract mới](CONTRACTS.md).

Đối chiếu 13/11/2026: AuthController, AuthService, Program.cs; FE authService/AuthProvider/authTokenStorage/httpClient. Prefix `/api/auth`. Chi tiết tên DTO xem controller và danh mục [ENDPOINTS](ENDPOINTS.md); không suy tất cả response cùng envelope.

| Method/path | Quyền / dữ liệu chính |
| --- | --- |
| POST register/parent | Public, DTO đăng ký Parent; xác thực email |
| POST register/child | Parent JWT; RegisterChildDto; trả `{message, childProfileId}` trong BE local |
| POST login | Username/password theo LoginDto, dành các role web |
| POST login/child | Username/password cho Child |
| POST forgot-password, reset-password | Email/reset token/password theo DTO; không log token |
| POST change-password | JWT; mật khẩu cũ/mới |
| GET profile | JWT; identity/profile theo role, không phải danh sách ChildProfiles |
| GET confirm-email | Query xác thực email |
| POST confirm-email | JSON xác thực email; chọn một flow, không gọi đôi |
| POST resend-confirmation-email | Gửi lại xác thực |
| POST logout | JWT; không mặc định thu hồi mọi thiết bị |
| POST refresh-token | Authorize; FE gửi Bearer hiện có + `{refreshToken}` |
| GET current-role | JWT; role từ BE, không cần gọi thêm mỗi lần đã có profile |

## Điều đã làm rõ từ BE mới

- Register Child trả `childProfileId` ở controller local staged. NickName lưu ở ChildProfiles, không bắt buộc Users.FirstName/LastName có giá trị. Kiểm tra đúng bảng/field trước kết luận mất nickname.
- Refresh **không còn là câu hỏi chỉ dựa trên `[Authorize]`**: Program.cs có LifetimeValidator riêng cho path kết thúc `/refresh-token`, cho access token hết hạn đi tiếp; vẫn có signature/issuer/audience và blacklist checks. FE `realRequest` nhận `accessToken: pair.accessToken` dù `skipAuth: true`, nên vẫn gửi Bearer tường minh.
- AuthService chấp nhận body refresh token, đồng thời có nhánh lấy token DB theo JWT user khi body thiếu. Đây là hành vi source hiện có, không phải yêu cầu FE bỏ refresh credential. Cần rà proof-of-possession, rotation nguyên tử/reuse và phạm vi thu hồi.
- FE đã lưu cặp token/remember session, single-flight refresh, Web Locks nếu hỗ trợ, session guard chống response cũ, retry có giới hạn. Không làm lại hạ tầng này từ plan cũ.

## Chưa được nghiệm thu

14/11 FE: HTTP boundary kiểm tra session cả khi response thành công, chặn callback mutation cũ tiếp tục GET dưới account mới. Intercept single-flight refresh và logout trong refresh đã qua. Runtime Parent mẫu login/profile/logout HTTP 200; chưa runtime expired access, token reuse hoặc multi-tab. Source `RefreshTokenAsync` có nhánh thiếu body dùng DB token và lookup token fallback: BE cần xác nhận binding JWT user/refresh credential, atomic rotation/reuse policy.

AUTH-01: expired access + valid refresh, invalid/revoked refresh, blacklist sau logout, multi-tab race, logout trong lúc refresh, reset/change-password ảnh hưởng phiên. Xác minh exception lifetime chỉ áp dụng đúng endpoint và không bỏ kiểm tra khác. Kiểm tra blacklist xuyên restart/instance nếu đó là yêu cầu vận hành.

Error codes/status và fieldErrors chưa được chuẩn hóa toàn hệ thống. 401 ở Character API có thể là sai owner, không chỉ token hết hạn; FE cần phân biệt nghiệp vụ khi BE chuẩn hóa lỗi. Không tự retry mutation sau timeout/5xx; không tự fallback mock.

Role FE chuẩn hóa Parent→parent, Child→child, Admin→admin, ContentManager→content_manager; role claim BE theo từng controller, UploadController 18/11 đã nhận `content manager, ContentManager`. Route guard web không thay authorization server.
