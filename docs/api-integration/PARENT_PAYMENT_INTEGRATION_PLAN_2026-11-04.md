# Parent — kế hoạch nối PayOS (04/11/2026)

## 1. Căn cứ và phạm vi

- Swagger live lấy ngày 04/11: [snapshot](../../artifacts/swagger-payment-2026-11-04.json), từ `https://sketch-tale-be.onrender.com/swagger/v1/swagger.json`.
- Source Backend: remote `origin/main` commit `9927acf1a4e8e9b6e2b22f5717727946303561cb`. Đã fetch để đọc bằng `git show`; không pull/checkout hoặc ghi đè working tree Backend đang có sửa đổi.
- Source local checkout cũ chưa có PaymentController. Phân tích dưới đây dùng source remote mới; route và DTO khớp Swagger live, nhưng chưa chứng minh runtime triển khai đúng toàn bộ commit này.
- Chỉ lập kế hoạch và cập nhật trạng thái tài liệu. Chưa gọi tạo/hủy thanh toán, chưa giao dịch thật, chưa sửa mã frontend.
- Phạm vi: mua gói Parent, chuyển sang PayOS, quay về, xác minh kết quả, đồng bộ gói. Giữ giao diện Parent hiện tại.

## 2. API đã có

| Chức năng | Contract xác nhận | Cách dùng |
| --- | --- | --- |
| Danh mục gói | `GET /api/subscription-plans` | Đã nối qua `publicService`; lấy UUID ở `plan.backendId`, không gửi display `plan.id` (thường là code như PlusPlan). |
| Tạo checkout | `POST /api/payments/create-checkout` | Parent JWT; body `{ subscriptionPlanId: UUID, buyerName?, buyerEmail?, description? }`; source trả `{ checkoutUrl }`. |
| Nhận kết quả PayOS | `POST /api/payments/webhook` | Server gọi server; source verify bằng PayOS SDK. Frontend không gọi endpoint này. |
| Hủy giao dịch | `PATCH /api/payments/cancel-paymentlink` | JWT; body `{ orderCode: int64, code: int64 }`; source chỉ xử lý Pending và `code == 0`, trả `{ message }`. Cần làm rõ/sửa xử lý trước khi dùng làm nút hủy chủ động. |
| Danh sách subscription của Parent | `GET /api/subscriptions/parent-profile/{id}` | Đã có frontend service. Chỉ xác nhận trạng thái subscription; chưa gắn được chính xác một checkout vì response tạo link không có subscriptionId/orderCode. |
| Làm mới hồ sơ | `GET /api/auth/profile` | Dùng `refreshUser()` hiện có sau khi server xác nhận kích hoạt quyền lợi. |

Source tạo checkout tự lấy Parent từ user ID trong JWT, đọc giá từ plan DB và tạo subscription PendingPayment + PaymentTransaction Pending. Không gửi amount, currency, ParentProfile ID hoặc trạng thái Active từ frontend.

Source tạo orderCode bằng Unix milliseconds × 10 + một chữ số ngẫu nhiên; DTO là int64. Nên lưu mã dưới dạng chuỗi trong frontend, chỉ chuyển sang số khi kiểm tra `Number.isSafeInteger` và contract cancel hiện tại yêu cầu số.

## 3. Frontend hiện tại và phần mock

- `publicService.js`: catalog thật; checkout bật theo `VITE_PARENT_PAYMENT_API_MODE`.
- `ParentPlanPage.jsx`: CTA checkout chỉ bật khi catalog là Backend và payment mode real.
- `ParentCheckoutPage.jsx`: đã nối create-checkout và mở PayOS; nhánh demo cũ chỉ còn trong mock catalog.
- `parentPaymentService.js`: kiểm tra UUID, gói có giá, URL HTTPS và host `pay.payos.vn`; không retry mutation tự động.
- `ParentPaymentReturnPage.jsx`: đã khớp ReturnUrl/CancelUrl của source Backend (`/payment/success`, `/payment/cancel`), chỉ thông báo chờ/đã quay về, không xác nhận thanh toán từ URL.
- `parentSubscriptionService.js`: đọc subscription thật; chưa có payment service/transaction status API.
- `backendRoutes.js`: khai báo `POST /payments/create-checkout`; webhook và cancel không được gọi từ trình duyệt.
- Checkout mode hiện `real` trong `.env.development` và `.env.production` theo yêu cầu ngày 04/11; `.env.example` vẫn giữ `mock` làm cấu hình mặc định cho bản sao mới.
- Bật cờ chỉ mở thao tác tạo checkout; các điểm Backend ở mục 4 (đặc biệt tra cứu giao dịch và đồng bộ quyền lợi từ webhook) vẫn cần được xác nhận để hoàn tất luồng sau thanh toán.

Khi nối thật: dùng một hành động “Thanh toán qua PayOS”; không hiển thị danh sách phương thức demo như thể Backend hỗ trợ cả ba. Danh mục và giá lấy thật; không báo thành công từ state demo.

## 4. Các điểm source chưa đủ cho luồng hoàn chỉnh

### A. Thiếu API đọc trạng thái giao dịch — ưu tiên cao

Swagger live và controller trên origin/main chưa expose GET tra cứu theo orderCode, chi tiết giao dịch hoặc lịch sử Parent. Repository/service đã có GetByOrderCodeAsync/GetByIdWithDetailsAsync/GetAllWithDetailsAsync; đây chưa phải API frontend gọi được.

Đề nghị expose endpoint scoped Parent (tên URL do Backend chốt), trả ít nhất: orderCode, payment status, amount/currency, subscriptionId, subscriptionPlanId, subscription status và trạng thái quyền lợi đã áp dụng. Thêm lịch sử có phân trang ở bước sau; không bắt lịch sử chặn bước tạo checkout.

Response tạo checkout hiện chỉ có checkoutUrl. Đề nghị bổ sung orderCode, subscriptionId, paymentLinkId và expiresAt nếu có để phục hồi sau reload/timeout và theo dõi đúng đơn. Không lấy một subscription Active cũ làm bằng chứng đơn vừa tạo đã trả tiền.

### B. Webhook chưa cập nhật đầy đủ quyền lợi — cần Backend xử lý

Trong `PayOsService.ProcessWebhookAsync`, nhánh thành công đổi transaction thành Success và subscription thành Active. Không thấy gọi `SubscriptionService.UpdateSubscriptionForSuccessPayment`, trong khi hàm này mới cập nhật ParentProfile.SubscriptionPlanId và RemainingMonthlyCredit.

Hàm kích hoạt hiện chỉ chạy khi subscription còn PendingPayment: không thể set Active trước rồi gọi hàm đó và kỳ vọng quyền lợi được cập nhật. Backend cần gom xác nhận/kích hoạt vào một flow nhất quán, xử lý lặp và race bằng transaction/concurrency thích hợp.

StartDate/EndDate đang tính ngay khi tạo link, chưa tính lại lúc thanh toán. Source không thấy đối chiếu amount nhận từ webhook với transaction.Amount. Cần chốt thời điểm tính hạn, kiểm tra amount và cách xử lý nhiều subscription Active/nâng cấp giữa kỳ.

### C. Hủy và tạo lại checkout — cần làm rõ semantics

`PaymentTransactionService.CancelPayment` cập nhật transaction Failed và subscription Cancelled; không gọi `PayOsService.CancelPaymentAsync` để hủy link trên PayOS. Controller có `[Authorize]` nhưng không truyền user ID vào service để kiểm tra chủ giao dịch. Cần xác định endpoint dùng cho callback đã hủy tại PayOS hay nút hủy chủ động; nút chủ động phải hủy thật bên nhà cung cấp và kiểm tra chủ giao dịch.

Tạo checkout mới sẽ hủy các subscription PendingPayment và thử hủy các payment Pending trước đó của Parent. Đồng thời DB được lưu trước khi gọi PayOS CreateAsync. Khi request timeout/lỗi gateway, có thể đã tồn tại đơn Pending. Không tự retry POST, không tự tạo link từ effect khi mount, không retry mutation mặc định. Backend nên có idempotency/recovery để tránh hai tab hoặc double submit tạo nhiều đơn.

## 5. Trình tự triển khai

### P1 — Nối tạo link và mở PayOS (đã implement, đã bật cờ)

1. [x] Thêm `parentPaymentService.js`: createCheckout qua apiRequest/forceReal, kiểm tra backendId và response checkoutUrl.
2. [x] Thêm route create-checkout vào allowlist và cờ module `parentPayment`; checkout chỉ mở khi API và module đều ở real mode.
3. [x] Thay chặn checkout real bằng tóm tắt gói và nút PayOS; giới hạn UUID + giá dương.
4. [x] Disable khi đang gửi; không gọi trong query/effect, không auto retry; chuyển cùng tab tới HTTPS `pay.payos.vn`.
5. [ ] Chưa giữ orderCode/subscriptionId trong session vì create-checkout hiện chỉ trả checkoutUrl.

Kết quả: code nối xong; cờ đang bật trong cấu hình development/production. Chưa xác nhận giao dịch thật end-to-end trong quá trình bật cờ. Các giới hạn ở mục 4 vẫn còn: frontend chưa tra cứu đúng trạng thái đơn sau khi rời PayOS và cần Backend xác nhận đồng bộ quyền lợi.

### P2 — Return/cancel và xác minh kết quả

1. [x] Thêm `/payment/success` và `/payment/cancel`, khớp ReturnUrl/CancelUrl trong source Backend. Cần xác nhận các URL production runtime trỏ đúng origin.
2. Query redirect chỉ dùng nhận diện đơn/hiển thị đang xác minh; không coi success/status/code từ URL là bằng chứng thanh toán.
3. Khi có API status: poll mỗi 3 giây, tối đa 60 giây mỗi đợt; dừng khi terminal/unmount/đổi tài khoản, có nút kiểm tra lại. Hết thời gian hiển thị “Đang chờ xác nhận”, không tự chuyển thành thất bại.
4. Phân biệt payment Pending/Success/Failed/Cancelled/Expired theo enum Backend chốt; không tự giả định Backend đã có đủ mọi trạng thái này. Success nhưng quyền lợi chưa cập nhật thì hiển thị đang kích hoạt.
5. Chỉ dùng cancel API sau khi rõ code và semantics ở mục 4C. Mở URL cancel không tự coi là đã hủy trên server.
6. [x] Hiện không có status endpoint: trang return hiển thị trạng thái chờ/quay về và không gắn nhãn giao dịch thành công; tra cứu chính xác cần Backend.

### P3 — Đồng bộ gói sau xác nhận

- Refetch `parent-subscriptions`, gọi `refreshUser()` và invalidate các query entitlement/profile/children liên quan của đúng user theo query keys hiện hữu.
- ParentPlanPage hiện chọn subscription theo rank Active rồi ngày bắt đầu: cần chọn gói hiệu lực theo quy tắc Backend khi có nhiều bản ghi Active; không suy gói hiện tại chỉ từ bản ghi Active bất kỳ.
- Không gọi CRUD subscription hoặc endpoint đổi plan/credit từ frontend để thay webhook.
- Sau khi hoàn tất: hiển thị tên gói, hạn dùng, trạng thái; cho quay về thư viện hoặc gói sử dụng.

### P4 — Lịch sử giao dịch và nghiệm thu

- Nối lịch sử khi Backend expose API scoped Parent; DTO/service nội bộ đã có là điểm tái sử dụng.
- Kiểm tra request đúng UUID, gửi JWT, lỗi 401/403/400, mất mạng, bấm hai lần, hai tab, reload và phiên đăng nhập hết hạn khi quay lại.
- Kiểm tra return giả mạo, webhook trễ/lặp, thanh toán xong nhưng chưa kích hoạt, hủy đơn rồi thanh toán, checkout mới thay đơn pending cũ.
- Kiểm tra giá/gói thay đổi, gói ngừng bán, thanh toán chậm và mốc thời gian hiệu lực. Không chạy giao dịch thu tiền thật như một phần kiểm tra tự động; dùng môi trường nghiệm thu do Backend xác nhận.

## 6. Câu hỏi gửi Backend

1. Cho FE endpoint **tra cứu theo orderCode của Parent hiện tại**; có thể expose service sẵn có không? Bổ sung orderCode + subscriptionId vào create-checkout được không?
2. Webhook sẽ cập nhật ParentProfile.SubscriptionPlanId và credit/hạn mức qua flow nào? Hiện source chỉ set subscription Active. Ngày bắt đầu tính từ lúc tạo đơn hay xác nhận trả tiền? Khi mua gói mới, gói Active cũ xử lý thế nào?
3. `cancel-paymentlink` dùng cho callback hay hủy chủ động? `code: 0` có nghĩa gì? Khi nào hủy thật ở PayOS, và endpoint sẽ kiểm tra chủ giao dịch thế nào?
4. ReturnUrl/CancelUrl của local và production đang cấu hình là gì? Redirect trả những query nào? Môi trường/tài khoản nghiệm thu và host checkout nào dùng để kiểm tra?
5. Đơn pending được tiếp tục/tạo lại thế nào sau timeout? Có idempotency key không? Thời hạn link, giao dịch miễn phí/trial, amount/currency và enum trạng thái chính thức là gì?

Câu 1–4 cần chốt để nghiệm thu vòng thanh toán hoàn chỉnh. Có thể triển khai P1 và khung P2 trước khi có câu trả lời; chưa mở nhãn hoàn tất thanh toán thật khi chưa có cơ chế xác minh đúng đơn và quyền lợi.

## 7. Tham chiếu source

- [PaymentController](https://github.com/iamhyyyy/sketch-tale-backend/blob/9927acf1a4e8e9b6e2b22f5717727946303561cb/sketch_tale.API/Controllers/PaymentController.cs)
- [PayOsService](https://github.com/iamhyyyy/sketch-tale-backend/blob/9927acf1a4e8e9b6e2b22f5717727946303561cb/sketch_tale.Infrastructure/Services/PayOsService.cs)
- [PaymentTransactionService](https://github.com/iamhyyyy/sketch-tale-backend/blob/9927acf1a4e8e9b6e2b22f5717727946303561cb/sketch_tale.Application/Services/PaymentTransactionService.cs)
- [DTO](https://github.com/iamhyyyy/sketch-tale-backend/blob/9927acf1a4e8e9b6e2b22f5717727946303561cb/sketch_tale.Application/DTOs/PayOsDto.cs)
- [SubscriptionService](https://github.com/iamhyyyy/sketch-tale-backend/blob/9927acf1a4e8e9b6e2b22f5717727946303561cb/sketch_tale.Application/Services/SubscriptionService.cs)
