# Kế hoạch tối ưu tích hợp Auth API

Ngày lập: 21/10/2026. Nguồn: `AUTH_CONTROLLER_README.md` v2.2 và mã frontend hiện tại.

## 1. Phạm vi và kết luận

Repo được kiểm tra là React/Vite frontend; chưa có mã AuthController, middleware JWT hoặc database backend để xác nhận hành vi thực tế. Các vấn đề backend bên dưới là điểm cần đối soát từ tài liệu, không phải lỗi đã được tái hiện trên server.

Ưu tiên: hoàn thiện vòng đời phiên đăng nhập, đồng bộ contract của 14 API, sau đó giảm request thừa. Phần triển khai frontend đã được thực hiện; trạng thái và giới hạn được ghi ở mục 8.

## 2. Hiện trạng ban đầu đã xác nhận trong frontend

| Ưu tiên | Bằng chứng | Tác động | Hướng xử lý |
| --- | --- | --- | --- |
| P0 | `authService.js` chỉ lấy và lưu access token | Refresh token trả về từ login bị bỏ qua | Quản lý cặp token và thời điểm hết hạn trong một module |
| P0 | `httpClient.js` xóa access token và phát `auth-invalid` với mọi 401/423 | Token hết hạn dẫn tới mất phiên; lỗi đăng nhập public cũng có thể ảnh hưởng phiên hiện có | Phân loại request và mã lỗi; refresh trước khi kết luận phiên hết hiệu lực |
| P0 | `backendRoutes.js` thiếu `POST /auth/refresh-token` và `GET /auth/current-role` | Hai route mới bị chặn bằng lỗi 501 trước khi gửi | Đồng bộ allowlist theo tài liệu v2.2 |
| P1 | `authService.js` chưa có login Child | Luồng login hiện tại luôn gọi `/auth/login` | Thêm phương thức và điểm vào đăng nhập Child |
| P1 | `pickUser()` spread toàn bộ dữ liệu login | Với response có ID trong tương lai, token có thể lọt vào object user/context | Map tường minh dữ liệu user, tách credential khỏi profile |
| P1 | `AuthProvider.jsx` chuyển anonymous với mọi lỗi restore | Lỗi mạng/5xx bị hiển thị như mất đăng nhập | Tách lỗi tạm thời khỏi phiên thực sự không hợp lệ |
| P1 | Login thiếu ID nên gọi thêm `/auth/profile` | Có request bổ sung, hiện cần thiết cho query theo user | Giữ hydrate; chỉ bỏ khi BE trả identity đầy đủ |
| P1 | `registerChildAccount()` dùng `forceReal: true` | Mock mode vẫn có thể gọi backend thật | Làm rõ chủ đích, thống nhất chế độ transport và test cách ly |
| P2 | `realRequest()` unwrap `data` và bỏ `message` cùng cấp | Service không nhận được đầy đủ envelope ở response có cả hai trường | Chọn contract nội bộ rõ ràng; audit consumer trước khi đổi |

## 3. P0 — Chốt contract với backend

### Refresh token

- Tài liệu yêu cầu `[Authorize]` nhưng mô tả refresh sau khi access token hết hạn. Cần xác nhận middleware có cho phép trường hợp này không; nếu dùng kiểm tra lifetime thông thường, request sẽ bị từ chối trước controller.
- Contract mục tiêu: refresh phải chứng minh quyền sở hữu refresh token hợp lệ qua JSON hoặc cookie; không phụ thuộc access token còn hạn. Không gia hạn chỉ dựa vào identity từ access token rồi tự lấy refresh token trong DB.
- Với contract JSON hiện tại, FE gửi `{ refreshToken }`. BE xác thực token, hạn dùng, phiên, trạng thái tài khoản và rotate nguyên tử. Không vô hiệu hóa kiểm tra lifetime cho toàn bộ API để giải quyết refresh.
- Xác định 7 ngày là thời hạn trượt theo mỗi lần rotate hay giới hạn tuyệt đối của phiên; bổ sung `expiresAt`/`expiresIn` và `refreshExpiresAt` nếu có thể.
- Quy định phản hồi khi token hết hạn, bị thu hồi hoặc bị dùng lại. Giữ dấu vết token đã rotate để phát hiện reuse; xác định phạm vi thu hồi theo phiên/token family.
- Hai request refresh đồng thời không được cùng tạo hai nhánh token hợp lệ. Kiểm thử transaction/conditional update ở BE.

### Logout, thu hồi và lỗi

- Xác nhận logout thu hồi phiên hiện tại hay toàn bộ thiết bị; `jti` của một JWT không mặc nhiên đại diện cho mọi access token được cấp trong phiên.
- Xác định logout khi access token hết hạn: FE cần refresh trước theo contract cũ, hoặc BE cung cấp cách thu hồi bằng refresh credential. FE vẫn xóa dữ liệu cục bộ nếu mạng lỗi, nhưng không khẳng định đã thu hồi server.
- Tài liệu ghi blacklist dùng in-memory cache: cần kiểm thử sau restart và khi có nhiều instance. Nếu yêu cầu thu hồi tức thì xuyên instance, dùng trạng thái thu hồi dùng chung, kèm chính sách khi kho trạng thái lỗi.
- Thống nhất mã lỗi máy đọc được, ví dụ `ACCESS_TOKEN_EXPIRED`, `SESSION_REVOKED`, `REFRESH_TOKEN_EXPIRED`, `EMAIL_NOT_CONFIRMED`, `ACCOUNT_LOCKED`, cùng status và field errors. Đây là đề xuất mới, chưa có trong README.
- Xác định reset/change password có thu hồi các phiên khác hay toàn bộ phiên, và FE có phải đăng nhập lại không.

Điều kiện hoàn tất: có ví dụ request/response lỗi và test BE chứng minh refresh hoạt động sau khi access token hết hạn.

## 4. P0 — Hoàn thiện vòng đời phiên phía frontend

### Tách trách nhiệm

- `src/features/auth/tokenStorage.js` (mới): đọc/lưu/xóa token, giữ đúng lựa chọn remember session. Nếu tiếp tục JSON transport, lưu cả cặp cùng một record để hạn chế trạng thái lệch; migration xóa key access-token cũ khi cần.
- `src/lib/api/httpClient.js`: transport, chuẩn hóa lỗi, cơ chế refresh và retry có kiểm soát. Có metadata phân biệt request public/protected và bỏ qua refresh cho chính request refresh.
- `src/features/auth/authService.js`: payload theo từng endpoint, map DTO user, login/refresh/logout rõ ràng; không nhúng token vào user.
- `src/features/auth/AuthProvider.jsx`: trạng thái phiên, bootstrap, lỗi tạm thời, đồng bộ tab và xóa cache khi đổi identity.

### Luồng request mục tiêu

1. Gửi protected request với access token.
2. Khi nhận lỗi có thể refresh theo contract, các request trong cùng tab cùng chờ một refresh Promise.
3. Refresh thành công: lưu cặp token mới trước khi phát lại request. Mỗi request chỉ retry tối đa một lần.
4. Refresh bị từ chối do credential hết hiệu lực: xóa token, user, cache và chuyển về `/auth/login`.
5. Lỗi mạng/5xx: báo lỗi có thể thử lại; không mặc định xóa phiên. Không tự lặp refresh vô hạn, nhất là khi response rotate có thể bị thất lạc.

Các ràng buộc:

- Không refresh khi login sai mật khẩu, khi gọi endpoint public, hoặc khi bị 403.
- Không tự retry mutation vì timeout/5xx. Chỉ replay sau 401 được BE bảo đảm xảy ra trước khi xử lý nghiệp vụ; giữ nguyên body và tôn trọng abort.
- Logout hoặc đổi tài khoản phải vô hiệu kết quả refresh/restore đang chạy bằng revision của phiên, tránh token cũ hồi sinh.
- Single-flight trong một tab chưa đủ cho nhiều tab: cần khóa refresh liên tab và thông báo token mới, hoặc cơ chế BE được thống nhất. Storage event hiện tại không giải quyết được race này.
- Nếu giữ Web Storage, đây là phương án tương thích contract hiện tại. Chuyển refresh token sang cookie HttpOnly là thay đổi FE+BE riêng, cần xử lý credentials, CORS, SameSite và CSRF; không chỉ đổi một dòng ở FE.

## 5. P1 — Đồng bộ đủ 14 API

Các path dưới đây đều thuộc `/api/auth`.

| API | Kế hoạch |
| --- | --- |
| POST register/parent | Map đúng username/email/password; thành công chuyển sang hướng dẫn xác thực email, không tạo phiên |
| POST register/child | Chỉ Parent; đồng bộ chế độ real/mock; sau thành công invalidate danh sách con và quota profile liên quan |
| POST login | Lưu cặp token; hydrate profile khi chưa có ID; xử lý lỗi hydrate mà không để phiên nửa vời |
| POST login/child | Thêm service và lựa chọn luồng Child; chỉ gửi username/password; dùng chung quản lý phiên |
| POST forgot-password | Giữ thông báo trung tính như README; chống submit lặp và xử lý rate limit |
| POST reset-password | Map email/token/newPassword; token thiếu/hết hạn có trạng thái rõ; xử lý thu hồi phiên theo contract BE |
| POST change-password | Map đúng hai password; xử lý field errors và chính sách phiên sau đổi mật khẩu |
| GET profile | Nguồn chuẩn cho identity và quyền lợi; bảo toàn null/profile theo role; gom bootstrap để tránh fetch trùng |
| GET confirm-email | Giữ tương thích link hiện có; encode query đúng; kiểm thử token chứa ký tự đặc biệt |
| POST confirm-email | Bổ sung adapter nếu dùng flow xác thực JSON; ưu tiên flow này khi đổi thiết kế email link, không gọi cả GET và POST cho cùng thao tác |
| POST resend-confirmation-email | Thông báo trung tính; cooldown giao diện theo chính sách server; BE mới là nơi thực thi giới hạn |
| POST logout | Không body theo README; xóa cả cặp token, session và cache; xử lý race và lỗi thu hồi |
| POST refresh-token | Bổ sung allowlist và service sau khi chốt contract P0; rotate và cập nhật cặp token |
| GET current-role | Bổ sung allowlist/service khi cần; không gọi mặc định sau login/profile vì đã có role |

Chuẩn hóa bốn role API tại một adapter: `Parent -> parent`, `Child -> child`, `Admin -> admin`, `ContentManager -> content_manager`. Role không nhận diện phải bị chặn; route guard FE chỉ điều hướng, quyền truy cập phải được BE kiểm tra.

## 6. P2 — Tối ưu số request và vận hành backend

- Mục tiêu hiện tại: login 1 request + profile tối đa 1 request khi thiếu ID. Không thêm current-role vào chuỗi này.
- Bootstrap dùng chung kết quả/profile request đang chạy; chỉ invalidate khi thay đổi dữ liệu liên quan. Không cache quota/quyền lợi vô thời hạn.
- Nếu BE bổ sung ID và identity tối thiểu trong login/refresh, đánh giá bỏ profile ở bước login; vẫn lấy profile khi màn hình cần quyền lợi đầy đủ.
- Đo baseline trước khi tối ưu: số request mỗi flow, p50/p95 login/profile/refresh, refresh thất bại, số truy vấn DB. Chưa có số liệu để kết luận database chậm.
- Backend cần kiểm tra index lookup username/email và refresh token hash, cleanup token hết hạn, rate limit login/reset/resend, cùng cơ chế gửi email ngoài request khi có nhu cầu tải thực tế.
- Không log password, access/refresh token hay token xác thực email. Dùng request ID để đối chiếu lỗi.

## 7. Thứ tự triển khai và nghiệm thu

1. **Chốt contract:** giải quyết refresh khi access token hết hạn; error codes; phạm vi logout; chính sách phiên và mật khẩu. Cập nhật README/OpenAPI cùng nhau.
2. **Hạ tầng FE:** token storage, allowlist, request metadata, refresh single-flight, retry guard, cơ chế ngăn stale response và đồng bộ tab.
3. **Luồng người dùng:** login Child, restore, logout, email/password và role mapping; cập nhật mock tương ứng.
4. **Tối ưu:** giảm profile trùng; đo baseline và chỉ tối ưu BE dựa trên kết quả.
5. **Triển khai:** BE hỗ trợ contract mới trước, FE sau; kiểm thử staging bằng tài khoản thử nghiệm. Nếu rollback storage/contract không tương thích, buộc đăng nhập lại thay vì tái sử dụng token cũ.

Các ca kiểm thử bắt buộc khi triển khai:

- Login đủ 4 role; Child có email null; Parent chưa xác thực email.
- Access token hết hạn + refresh hợp lệ: tiếp tục phiên, không điều hướng login.
- 10 request đồng thời trong một tab: đúng 1 refresh; mỗi request retry tối đa 1 lần.
- Hai tab refresh cùng lúc: không làm mất phiên do race rotation.
- Refresh hết hạn/bị thu hồi/reuse: kết thúc phiên theo contract; không lặp refresh.
- Login sai, 403, lỗi mạng và 5xx không gây invalidation sai cho phiên khác.
- Logout/đổi tài khoản trong lúc refresh hoặc restore: response cũ không khôi phục user/token.
- Reload và remember session giữ đúng loại storage; user A không thấy cache user B.
- Reset/change password, resend rate limit, email token không hợp lệ và body validation.
- BE: token đã logout bị từ chối trên các instance; rotation nguyên tử; quota tạo Child không bị vượt khi gửi đồng thời.

Chạy test contract/integration cho real adapter bằng response giả lập, test mock regression riêng, sau đó staging smoke test. `npm run lint` và `npm run build` là kiểm tra cuối của thay đổi code; không thay thế các ca kiểm thử phiên ở trên.

## 8. Trạng thái triển khai frontend

Đã cập nhật `authTokenStorage.js`, `httpClient.js`, `authService.js`, `AuthProvider.jsx`, `RequireAuth.jsx` và allowlist API:

- Lưu access/refresh token cùng chế độ remember; refresh token được rotate và lưu trước khi phát lại request.
- Gom refresh đồng thời trong tab, dùng Web Locks khi trình duyệt hỗ trợ để đồng bộ tab, và tránh phát lại request sau khi tài khoản đã đổi.
- Chỉ xóa phiên khi lỗi xác thực cho biết phiên không còn hợp lệ; lỗi máy chủ/tạm thời giữ cache user và cho phép thử khôi phục lại.
- Bổ sung adapter cho child login, POST confirm-email, current-role và route refresh/current-role trong allowlist.
- Public auth request không gửi access token hiện có, tránh lỗi login/forgot-password làm mất phiên khác.

`loginChild` đã được expose qua AuthProvider để client gọi endpoint. Chưa thêm trang đăng nhập Child vào SPA vì mã nguồn hiện ghi Child workspace thuộc ứng dụng mobile và role Child trên web hiện quay về trang chủ.

Chưa chạy lint, build hoặc test trong bước triển khai này. Backend chưa có trong repo, nên FE refresh gửi `{ refreshToken }` nhưng chưa thể xác nhận tương thích với `[Authorize]` như mô tả README. Cần cập nhật backend contract trước khi tính năng refresh được nghiệm thu end-to-end.
