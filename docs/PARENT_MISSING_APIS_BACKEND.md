# Các API còn thiếu cho Parent — yêu cầu gửi Backend

Ngày đối chiếu: **21/10/2026**.

Nguồn: [Swagger đang triển khai](https://sketch-tale-be.onrender.com/swagger/v1/swagger.json), gồm 111 operations tại thời điểm kiểm tra, và các màn hình/service Parent trong repository frontend.

## 1. Phạm vi

Tài liệu chỉ liệt kê **chức năng chưa có API tương ứng trong Swagger**. Không yêu cầu tạo lại API đã có chỉ vì response chưa được mô tả, frontend chưa tích hợp, hoặc cần adapter.

Các URL, tên field, enum và status code bên dưới là **đề xuất cho API mới**, chưa phải contract backend đã triển khai. Backend có thể đổi URL, gộp endpoint hoặc mở rộng API hiện tại nếu đáp ứng đủ nghiệp vụ. Các dữ liệu trả về nêu trong tài liệu là dữ liệu cần cho chức năng mới, không phải yêu cầu sửa response của API đã có.

Tổng cộng **26 endpoint đề xuất**, chưa bao gồm các nghiệp vụ tùy chọn ở mục 14. Số endpoint không đồng nghĩa với số chức năng bắt buộc của MVP.

Không nằm trong danh sách yêu cầu bổ sung: tạo tài khoản bé; đọc/sửa ParentProfile và ChildProfile; giới hạn thời gian và nhân vật; danh mục truyện/chủ đề; danh mục gói và CRUD subscription; Auth, refresh token; upload avatar; báo cáo nội dung vi phạm.

## 2. Quy ước chung cho các API mới

- API Parent yêu cầu đăng nhập với role Parent. Backend lấy danh tính phụ huynh từ phiên/JWT, không tin `parentId` do client gửi.
- Kiểm tra quyền sở hữu trên từng `childId`, `itemId`, `approvalId`, `exportId`, `orderId`; không chỉ kiểm tra role.
- Ngoại lệ: webhook thanh toán xác thực bằng cơ chế của nhà cung cấp, không dùng JWT Parent.
- ID dùng định danh thật của backend. Phân biệt User ID, ChildProfile ID và ParentProfile ID.
- Thời điểm trả về theo ISO 8601; thống kê ngày và reset quota phải có múi giờ thống nhất.
- Danh sách có thể dùng `page`, `pageSize`; trả danh sách cùng tổng số bản ghi hoặc cursor theo chuẩn chung của backend.
- Dùng response envelope và định dạng lỗi chung của dự án. Các field trong tài liệu là payload nghiệp vụ, không bắt buộc một envelope mới.
- Phân biệt không có dữ liệu (`null`/`hasData: false`) với kết quả đo được bằng 0.
- Lỗi cần phân biệt: dữ liệu không hợp lệ, chưa đăng nhập, không có quyền, không tìm thấy, xung đột phiên bản, hết hạn mức và tính năng không thuộc gói.
- Các thao tác có `revision` phải từ chối phiên bản cũ, ví dụ HTTP 409; không ghi đè quyết định mới hơn.

## 3. Liên kết tài khoản bé đã tồn tại — 2 API

Phạm vi này khác với API tạo tài khoản bé hiện có. Chỉ cần triển khai khi sản phẩm cho phép liên kết một tài khoản Child đã tồn tại.

### P01 — Tạo liên kết

`POST /api/parent/child-links`

- Mục đích: phụ huynh liên kết với tài khoản Child qua bằng chứng xác minh hợp lệ.
- Body đề xuất: `{ "linkCode": "<mã liên kết>" }`.
- Kết quả: `linkId`, `childId`, `status`, `createdAt`; trạng thái có thể là `pending` hoặc `active` theo quy trình xác nhận.
- Backend kiểm tra mã hợp lệ, chưa hết hạn, chưa dùng, giới hạn số bé và quan hệ đang tồn tại.
- Không cho liên kết chỉ bằng username hoặc Child ID mà không xác minh.
- Không tạo tài khoản Child mới; không tạo quan hệ hoặc trừ quota hai lần khi gửi lặp.
- Cần chốt cách cấp mã/xác nhận liên kết. Nếu cần endpoint cấp mã hoặc chấp thuận từ ứng dụng Child, đó là phần phụ thuộc ngoài 26 API Parent của tài liệu này.

### P02 — Hủy liên kết

`DELETE /api/parent/child-links/{linkId}`

- Mục đích: chấm dứt quyền quản lý bé của phụ huynh hiện tại.
- Không đồng nghĩa với xóa tài khoản Child hoặc xóa toàn bộ tác phẩm.
- Thu hồi quyền đọc/sửa dữ liệu qua quan hệ này; xử lý lại hạn mức hồ sơ theo quy tắc sản phẩm.
- Gọi lặp không gây thêm tác dụng phụ.
- Cần chốt chính sách một bé có thể thuộc một hay nhiều phụ huynh, và việc giữ quyền truy cập các bản xuất đã tạo trước khi hủy liên kết.

## 4. Dashboard và tiến độ học tập — 3 API

### P03 — Tổng quan của một bé

`GET /api/children/{childId}/dashboard?range=7d`

- Query: `range=7d|30d`.
- Dữ liệu cần: `summary`, `pendingApprovals`, `recentActivities`, `settingsSummary`.
- `summary`: `readingMinutes`, `storiesCompleted`, `vocabularyReviewed`, `quizAccuracy`.
- Hoạt động gần đây: ID, loại hoạt động, tiêu đề, thời điểm, đối tượng liên quan.
- Tóm tắt cài đặt: giới hạn thời gian đọc và các thông tin cần hiển thị trên dashboard.
- Nếu có dữ liệu từng phần, trả rõ phần chưa khả dụng; không giả lập số 0 cho phần bị lỗi.

### P04 — Tổng quan gia đình

`GET /api/parent/dashboard?range=7d`

- Tổng hợp các bé thuộc phụ huynh đang đăng nhập.
- Dữ liệu cần: khoảng thời gian, thống kê gia đình, thống kê tóm tắt từng bé, tổng số yêu cầu chờ duyệt và hoạt động gần đây.
- Không tính trung bình đơn giản các tỷ lệ quiz của từng bé; dùng tổng số câu đúng/tổng số câu đã trả lời.
- Có thể lùi sau nếu màn tổng quan gia đình chỉ hiển thị danh sách hồ sơ trong MVP.

### P05 — Tiến độ chi tiết của bé

`GET /api/children/{childId}/progress?range=30d`

- Query: `range=7d|30d`; có thể hỗ trợ thêm `from`, `to` khi cần khoảng tùy chọn.
- Dữ liệu cần: `range`, `hasData`, `summary`, `days`, `latestActivity`.
- Mỗi ngày gồm: `date`, `readingMinutes`, `storiesCompleted`, `vocabularyReviewed`, `quizAccuracy`.
- Không có câu trả lời quiz thì tỷ lệ là `null`, không mặc định 0%.
- Chốt cách tính truyện hoàn thành, đọc lại, từ vựng đã ôn và thời gian đọc hợp lệ.

**Phụ thuộc dữ liệu:** backend phải có nguồn ghi nhận lượt đọc, hoàn thành truyện, kết quả quiz và ôn từ từ ứng dụng Child. Các API tổng hợp không tự tạo ra dữ liệu hoạt động. Nếu chưa có luồng ghi nhận, cần triển khai riêng cùng phía Child.

## 5. Kiểm soát chủ đề cho bé — 1 API hoặc mở rộng API hiện có

### P06 — Thiết lập chủ đề được phép

`PATCH /api/children/{childId}/allowed-themes`

- Body đề xuất: `{ "allowedThemeIds": ["<theme-id>"], "revision": 1 }`.
- Kết quả: cấu hình đã lưu, phiên bản mới, thời điểm cập nhật.
- Chỉ chấp nhận chủ đề hợp lệ; kiểm tra bé thuộc Parent.
- Cần chốt danh sách rỗng nghĩa là cho phép tất cả hay không cho phép chủ đề nào; frontend và backend phải dùng cùng quy tắc.
- Quy tắc phải được áp dụng khi Child truy cập nội dung, không chỉ ẩn trên giao diện Parent.
- Có thể bổ sung field này vào API cập nhật ChildProfile hiện có thay vì tạo endpoint mới. Cấu hình đã lưu cần đọc lại được qua API hồ sơ/cài đặt.
- Không yêu cầu thêm API cho giới hạn thời gian đọc hoặc giới hạn nhân vật vì đã có chức năng tương ứng.

## 6. Phê duyệt nhân vật và quyền vai nhạy cảm — 4 API

### P07 — Danh sách yêu cầu

`GET /api/children/{childId}/approvals?status=pending`

- Bộ lọc: `status=all|pending|approved|rejected`; phân trang.
- Mỗi mục gồm ID, loại yêu cầu, đối tượng/phiên bản cần duyệt, tên, ảnh xem trước, trạng thái, thời điểm tạo và `revision`.
- Phân biệt yêu cầu duyệt nhân vật với yêu cầu liên quan vai nhạy cảm.

### P08 — Chi tiết yêu cầu

`GET /api/children/{childId}/approvals/{approvalId}`

- Trả nội dung đủ để phụ huynh quyết định: nhân vật, ảnh, phiên bản, thông tin vai liên quan, trạng thái, ghi chú và quyết định trước đó nếu có.
- Có `revision`; nếu có quyền vai riêng thì thêm `permissionGranted`, `permissionRevision`.
- Backend kiểm tra yêu cầu thực sự thuộc bé trong URL.

### P09 — Duyệt hoặc từ chối

`PATCH /api/children/{childId}/approvals/{approvalId}`

```json
{
  "action": "approve",
  "revision": 1,
  "note": "Đồng ý sử dụng phiên bản này"
}
```

- `action`: `approve` hoặc `reject`.
- Quyết định gắn với đúng phiên bản được xem; nếu tác phẩm thay đổi thì không tự áp dụng quyết định cũ cho phiên bản mới.
- Trả trạng thái, revision mới, người quyết định và thời điểm xử lý.
- Từ chối thao tác trên revision cũ; ghi nhận lịch sử quyết định.

### P10 — Cấp/thu hồi quyền vai nhạy cảm

`PATCH /api/children/{childId}/approvals/{approvalId}/sensitive-role`

- Body: `{ "action": "allow", "permissionRevision": 1 }`; action còn lại là `revoke`.
- Trả quyền hiện hành và `permissionRevision` mới.
- Tách biệt với việc duyệt hình ảnh/nhân vật: duyệt tác phẩm không tự cấp mọi quyền vai.
- Thu hồi quyền phải có hiệu lực ở luồng sử dụng của Child. Cần chốt ảnh hưởng tới truyện đã tạo trước đó.

**Phụ thuộc:** cần có luồng tạo yêu cầu từ thao tác của Child hoặc hệ thống xử lý nhân vật; không tạo yêu cầu giả trong API đọc của Parent.

## 7. Thư viện cá nhân của bé và gợi ý truyện — 4 API

### P11 — Đọc thư viện của bé

`GET /api/children/{childId}/library?type=all&search=...`

- Bộ lọc: loại `all|story|character`, từ khóa; phân trang.
- Dữ liệu mỗi mục: `id`, `sourceId`, `type`, `title`, thumbnail, trạng thái, `favorite`, `hidden`, thời điểm tạo/cập nhật.
- `id` của mục thư viện cần phân biệt với `sourceId` của truyện/nhân vật gốc.
- Quy định rõ mục ẩn có được trả cho Parent để khôi phục hay cần bộ lọc riêng.
- Đây là thư viện cá nhân, không thay thế danh mục StoryTemplate đã có.

### P12 — Cập nhật mục thư viện

`PATCH /api/children/{childId}/library/{itemId}`

- Chức năng: yêu thích/bỏ yêu thích, ẩn và hiện lại.
- Đề xuất body đặt giá trị đích, ví dụ `{ "favorite": true }` hoặc `{ "hidden": false }`, để gửi lặp không đảo trạng thái ngoài ý muốn.
- Frontend mock hiện dùng action `favorite|hide|unhide`; có thể điều chỉnh adapter theo contract được thống nhất.
- Trả trạng thái mới của mục thư viện.

### P13 — Xóa khỏi thư viện

`DELETE /api/children/{childId}/library/{itemId}`

- Chỉ tác động đến mục thuộc bé được quản lý.
- Cần chốt xóa liên kết thư viện hay xóa tác phẩm do bé tạo; không xóa StoryTemplate dùng chung.
- Làm rõ ảnh hưởng tới lịch sử học tập và các job xuất đang xử lý.

### P14 — Gợi ý truyện cho bé

`POST /api/children/{childId}/recommendations`

- Body: `{ "storyId": "<story-id>" }`.
- Kiểm tra truyện được phát hành, quyền truy cập theo gói và quy tắc chủ đề của bé.
- Trả recommendation ID, bé, truyện, thời điểm và trạng thái.
- Gửi lặp không tạo gợi ý trùng ngoài ý muốn.
- Cần có nơi để Child đọc gợi ý qua luồng ứng dụng Child; phần đó không nằm trong danh sách endpoint Parent.

## 8. Xuất truyện PDF/video — 5 API

### P15 — Tạo yêu cầu xuất

`POST /api/parent/exports`

```json
{
  "childId": "<child-id>",
  "storyId": "<story-id>",
  "format": "pdf"
}
```

- `format`: `pdf|video`, chỉ cho phép định dạng backend thực sự hỗ trợ.
- Kiểm tra quyền quản lý bé, quyền xuất truyện, quyền truy cập truyện và quota.
- Hỗ trợ khóa chống trùng, ví dụ header `Idempotency-Key`; cùng khóa và payload không tạo thêm job/trừ lượt lần nữa.
- Chốt phiên bản truyện dùng để xuất, tránh nội dung thay đổi trong khi job đang chạy.
- Có thể trả HTTP 202 cùng job ID, trạng thái và thời điểm tạo.

### P16 — Danh sách/lịch sử bản xuất

`GET /api/parent/exports?status=all&childId=<child-id>`

- Query: lọc theo bé, trạng thái; phân trang.
- Mỗi job gồm ID, bé, truyện, tên truyện, định dạng, trạng thái, tiến độ nếu có, tên file, lỗi nếu có, `revision`, thời điểm tạo/cập nhật và hết hạn file.
- Có thể kèm quota để hiển thị hạn mức ngay trên màn xuất.
- Trạng thái tối thiểu: `queued`, `processing`, `completed`, `failed`. File hết hạn có thể dùng trạng thái riêng hoặc `expiresAt`.

### P17 — Chi tiết/trạng thái một job

`GET /api/parent/exports/{exportId}`

- Phục vụ polling khi xuất bất đồng bộ.
- Trả cùng mô hình job ở danh sách, kèm chi tiết lỗi có thể hiển thị cho người dùng.
- Không có tiến độ đáng tin cậy thì trả `null`, không tạo phần trăm giả.

### P18 — Thử lại job lỗi

`POST /api/parent/exports/{exportId}/retry`

- Body đề xuất: `{ "revision": 2 }`; hỗ trợ chống gửi lặp.
- Chỉ retry trạng thái cho phép, không chạy thêm job song song khi job hiện tại vẫn đang xử lý.
- Trả job được tiếp tục hoặc job mới cùng ID liên quan, theo cách triển khai backend.
- Chốt rõ retry có mất lượt không, lỗi nào được retry và xử lý file hết hạn thế nào.
- Frontend mock đang dùng PATCH với `action: retry`; endpoint POST này là phương án đề xuất, frontend sẽ điều chỉnh khi chốt contract.

### P19 — Tải bản xuất

`GET /api/parent/exports/{exportId}/download`

- Chỉ cho phép tải khi job hoàn tất và file còn khả dụng.
- Trả URL tải có hạn, `expiresAt`, `fileName`, `contentType`; hoặc trả file trực tiếp theo chuẩn backend.
- Không để lộ đường dẫn nội bộ hay cho tải bản xuất của gia đình khác.

**Quy tắc chung:** chốt lúc giữ/trừ quota, hoàn quota khi thất bại, thời hạn lưu file, giới hạn số job đồng thời và hỗ trợ PDF/video theo gói. Quyền `canExportStory` hiện có không tự cung cấp quy trình xử lý job xuất.

## 9. Báo cáo học tập gia đình — 2 API

### P20 — Xem trạng thái báo cáo và cấu hình

`GET /api/parent/family-report`

- Dữ liệu cần: `available`, `reason`, `status`, `settings`, `lastReport`.
- `settings`: `enabled`, `schedule`, `revision`.
- `lastReport`: ID, kỳ báo cáo, trạng thái, thời điểm tạo/gửi, tên file nếu có.
- Tổng hợp theo gia đình hiện tại, kiểm tra quyền lợi gói nếu tính năng giới hạn theo gói.
- Nếu triển khai nội dung báo cáo trực tiếp trên web thì cần trả phần tổng hợp tương ứng; nếu chỉ cấu hình gửi báo cáo thì metadata là đủ.

### P21 — Cấu hình báo cáo định kỳ

`PATCH /api/parent/family-report/settings`

```json
{
  "enabled": true,
  "schedule": "monthly",
  "revision": 1
}
```

- `schedule`: `monthly|quarterly` theo lựa chọn hiện có trên UI; chỉ bật những chu kỳ backend hỗ trợ.
- Trả cài đặt đã lưu và revision mới.
- Backend thực hiện việc tạo/gửi theo lịch; lưu cấu hình thành công không đồng nghĩa báo cáo đã được gửi.
- Chốt kênh nhận, người nhận và múi giờ lịch gửi.
- Lịch sử nhiều báo cáo và tải báo cáo riêng là phần mở rộng nếu sản phẩm cần, chưa nằm trong 26 endpoint.

**Không nhầm với `/api/content-reports`: API đó phục vụ báo cáo nội dung vi phạm, không phải báo cáo học tập.**

## 10. Mua gói và thanh toán — 4 API

### P22 — Tạo phiên thanh toán

`POST /api/parent/checkout-sessions`

- Body đề xuất: `{ "subscriptionPlanId": "<plan-id>" }`; thêm phương thức thanh toán nếu hỗ trợ nhiều lựa chọn.
- Backend tự tính giá và tiền tệ từ cấu hình, không nhận số tiền do frontend quyết định.
- Kết quả: `orderId`, `checkoutSessionId`, `amount`, `currency`, `paymentUrl`, `expiresAt`, `status`.
- Kiểm tra gói đang được bán và quy tắc mua/nâng cấp đối với subscription hiện tại.
- Có khóa chống tạo trùng khi người dùng bấm lại hoặc request timeout.
- Nếu hỗ trợ return URL từ client thì chỉ chấp nhận URL đã cho phép.

### P23 — Kiểm tra đơn thanh toán

`GET /api/parent/orders/{orderId}`

- Trả mã đơn, gói, số tiền, tiền tệ, trạng thái thanh toán, thời điểm và trạng thái kích hoạt subscription.
- Trạng thái đề xuất: `pending`, `paid`, `failed`, `cancelled`, `expired`.
- Nếu thanh toán thành công nhưng kích hoạt gói còn đang xử lý, thể hiện riêng hai trạng thái.
- Frontend dùng API này sau khi quay về từ cổng thanh toán; không tin query `success=true` là bằng chứng đã thanh toán.

### P24 — Webhook xác nhận thanh toán

`POST /api/payments/webhook`

- Server-to-server; body và xác thực theo nhà cung cấp thanh toán được chọn.
- Kiểm tra chữ ký, mã đơn, số tiền, tiền tệ và kết quả giao dịch.
- Chống xử lý trùng event/giao dịch; xử lý callback đến muộn hoặc không đúng thứ tự.
- Chỉ kích hoạt subscription/cấp quyền lợi sau khi xác minh thanh toán hợp lệ; không cấp hai lần.
- Lưu thông tin để đối soát và retry xử lý khi có lỗi nội bộ.

### P25 — Lịch sử thanh toán

`GET /api/parent/payments`

- Phân trang; có thể lọc trạng thái và khoảng thời gian.
- Mỗi mục gồm mã giao dịch, mã đơn, gói, số tiền, tiền tệ, trạng thái, thời điểm thanh toán và phương thức.
- Chỉ trả giao dịch thuộc Parent đang đăng nhập.

**Phạm vi:** danh mục gói và CRUD subscription đã có, không yêu cầu làm lại. CRUD không thay thế quy trình xác nhận thanh toán. Gia hạn tự động, hủy gia hạn, hoàn tiền và hóa đơn cần chốt nghiệp vụ riêng nếu nằm trong sản phẩm.

## 11. Cập nhật thông tin cá nhân — 1 API

### P26 — Sửa thông tin tài khoản hiện tại

`PATCH /api/users/me`

- Dùng khi màn hồ sơ cho phép phụ huynh sửa thông tin cá nhân.
- Các field đề xuất: `firstName`, `lastName`, `dob`, `gender`; hỗ trợ avatar nếu có nghiệp vụ lưu ảnh đại diện tài khoản.
- Field không gửi giữ nguyên; cần thống nhất ý nghĩa của `null` khi muốn xóa giá trị.
- Trả thông tin sau cập nhật theo mô hình hồ sơ chung.
- Không cho sửa role, quota, quyền lợi gói, số credit, trạng thái xác thực email qua API này.
- Không gộp đổi mật khẩu hoặc đổi email cần xác minh vào thao tác sửa thông tin thông thường.
- API cập nhật ParentProfile hiện có phục vụ các field hồ sơ Parent, không thay thế chức năng sửa tên/ngày sinh/giới tính của User.
- Upload avatar đã có endpoint; nếu hỗ trợ avatar thì chỉ bổ sung việc gắn asset hợp lệ vào tài khoản, không yêu cầu tạo lại upload.

## 12. Bảng tổng hợp để chia task

| Mã | Nhóm | Số endpoint đề xuất | Gợi ý thứ tự |
| --- | --- | ---: | --- |
| P01–P02 | Liên kết/hủy liên kết bé đã tồn tại | 2 | Sau khi chốt quy trình xác minh và mô hình quan hệ |
| P03–P05 | Dashboard và tiến độ | 3 | Làm sớm cùng nguồn dữ liệu từ Child; dashboard gia đình có thể làm sau |
| P06 | Chủ đề được phép | 1 | Làm sớm; có thể gộp vào cập nhật ChildProfile |
| P07–P10 | Phê duyệt và quyền vai | 4 | Làm cùng luồng tạo yêu cầu từ Child |
| P11–P14 | Thư viện và gợi ý truyện | 4 | Làm cùng mô hình tác phẩm cá nhân |
| P15–P19 | Xuất truyện | 5 | Sau khi chốt dữ liệu truyện, định dạng và quota |
| P20–P21 | Báo cáo gia đình | 2 | Sau khi có dữ liệu học tập |
| P22–P25 | Thanh toán | 4 | Ưu tiên cao nếu nghiệm thu mua gói thật |
| P26 | Thông tin cá nhân | 1 | Theo phạm vi màn hồ sơ |
| **Tổng** | | **26** | Có thể giảm bằng cách gộp endpoint |

## 13. Tiêu chí nghiệm thu các chức năng mới

1. Parent A không đọc/sửa được bé, tác phẩm, yêu cầu duyệt, bản xuất hoặc đơn của Parent B bằng cách đổi ID.
2. Mỗi API lưu thay đổi thật và đọc lại được; không trả thành công nếu chỉ cập nhật trạng thái giả.
3. Dashboard/tiến độ đối chiếu được với hoạt động Child và công thức thống kê đã thống nhất.
4. Quyết định phê duyệt/quyền vai có hiệu lực ở luồng Child; phiên bản cũ không ghi đè phiên bản mới.
5. Xuất truyện hỗ trợ đầy đủ trạng thái thành công, thất bại, retry, tải file và hết hạn; gửi lặp không trừ quota ngoài ý muốn.
6. Thanh toán không kích hoạt gói dựa vào redirect của frontend; webhook trùng không cấp quyền lợi hai lần.
7. Các chức năng phụ thuộc gói bị kiểm soát tại backend, không chỉ bằng nút bị disable trên frontend.
8. Công bố contract thực tế của các API mới trong Swagger để frontend tích hợp theo tên field, enum và lỗi đã thống nhất.

## 14. Các điểm cần chốt, chưa tính thêm endpoint

- Liên kết tài khoản Child có thuộc MVP không? Một bé thuộc một hay nhiều phụ huynh? Ai cấp mã và xác nhận?
- Quyền vai nhạy cảm áp dụng cho nhân vật, một vai trong truyện hay toàn bộ tài khoản bé?
- Danh sách chủ đề rỗng có ý nghĩa gì? Chủ đề bị cấm ảnh hưởng truyện đã lưu thế nào?
- Xóa khỏi thư viện là xóa liên kết hay xóa tác phẩm? Cần giữ lịch sử học tập ra sao?
- Định dạng xuất nào được hỗ trợ thật? Quota, retry và thời hạn file tính thế nào?
- Báo cáo gửi qua kênh nào, theo tháng hay quý, có cần lịch sử/tải file không?
- Nhà cung cấp thanh toán nào? Có nâng cấp giữa kỳ, dùng thử, tự động gia hạn, hủy gia hạn hoặc hoàn tiền không?
- Nếu có dùng thử: cần nghiệp vụ kích hoạt đầy đủ; thao tác đánh dấu đã dùng trial hiện có không tự mô tả toàn bộ luồng này.
- Nếu có mã bảo mật Parent: có cần xác minh, đổi/reset mã trong phạm vi hiện tại không?

## 15. Nguồn đối chiếu trong frontend

- [childrenService.js](../src/features/parent/services/childrenService.js): các thao tác Parent đã được mô hình hóa ở frontend.
- [Các màn hình Parent](../src/features/parent/pages): dashboard, tiến độ, phê duyệt, thư viện, xuất truyện, báo cáo và checkout.
- [publicService.js](../src/features/public/services/publicService.js): danh mục gói và trạng thái checkout.
- [Auth Controller README](AUTH_CONTROLLER_README.md): chức năng Auth hiện có; không yêu cầu bổ sung lại trong tài liệu này.

Kết luận về thiếu API dựa trên Swagger tại ngày đối chiếu và phạm vi chức năng frontend. Chưa kiểm thử runtime bằng phiên Parent; tài liệu không khẳng định backend không có triển khai nội bộ chưa công bố.
