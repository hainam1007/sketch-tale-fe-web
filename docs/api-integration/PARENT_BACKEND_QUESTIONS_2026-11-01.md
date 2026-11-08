# Câu hỏi gửi Backend — Parent, 01/11/2026

Đã đọc Backend working tree local và FE. Đây là những điểm còn cần xác nhận; không yêu cầu tạo lại API đã có. Backend có thể trả lời theo Q1–Q8, kèm commit/route/DTO nếu code ở branch hoặc repository khác. Không gửi token/password vào tài liệu hay commit.

**Ưu tiên trả lời Q1–Q4 để hoàn tất hồ sơ, catalog và phê duyệt.** Q5–Q8 phục vụ các capability tiếp theo, không chặn công việc FE độc lập ở [plan hiện hành](PARENT_INTEGRATION_PLAN_2026-11-01.md).

## Q1 — Bản Backend nào sẽ dùng để tích hợp? (chặn bật module thật)

Trong working tree local đã có:
- ChildProfile list/detail/PUT lấy owner từ JWT.
- Register Child trả childProfileId.
- Story list/detail chỉ published/Active và GET /api/storypage-template/published/{storyId}.
- Inbox GET /api/user-story-character-mappings/child/{childProfileId} và PATCH quyết định.

Nhờ Backend xác nhận các thay đổi local này được chấp nhận chưa, commit nào đã build/deploy, base URL và Swagger tương ứng. Nếu chưa phát hành, cần mốc bàn giao và phần nào sẽ đổi contract. Cần dữ liệu test hai Parent khác nhau và bé thuộc từng Parent để nghiệm thu quyền; thông tin truy cập bàn giao qua kênh phù hợp, không ghi vào repo.

**FE dùng câu trả lời để:** bật riêng profile/catalog/approvals theo môi trường. Có source không đủ kết luận API đang chạy.

## Q2 — Quyền truy cập các endpoint quản lý gói (chặn phát hành an toàn)

ParentProfileController và SubscriptionController hiện chưa có auth/owner checks trong source được đọc; ParentProfile PUT có thể thay SubscriptionPlanId. FE Parent hiện không gọi những CRUD này.

Backend sẽ khóa các thao tác quản trị bằng role Admin hay thêm owner scope cho các thao tác Parent được phép? Nhờ xác nhận bản sửa nào được phát hành cùng đợt Parent. Cần kiểm chứng cả truy cập không đăng nhập và Parent truy cập ID của người khác, kể cả khi FE không hiển thị nút.

**FE dùng câu trả lời để:** giữ /auth/profile làm nguồn gói hiện tại; không dùng CRUD subscription làm checkout.

## Q3 — Ý nghĩa và vòng đời quota đã có (chặn hiển thị quota đầy đủ)

ParentProfileDto đã có RemainingChildProfile, RemainingMonthlyCredit; ChildProfileDto đã có daily/remaining time và character limits. Nhờ xác nhận:
- Các field này có đầy đủ trong GET /api/auth/profile và GET /api/child-profiles trên bản deploy không? Xin một response đã ẩn dữ liệu riêng.
- Đơn vị thời gian, mốc reset ngày/tháng, múi giờ; job/service nào trừ/reset counters? Khi Parent đổi daily cap giữa ngày thì remaining thay đổi thế nào?
- Credit/hạn mức nào dùng chung gia đình, field nào thực sự theo từng bé? API hiện có thể trả kỳ hiệu lực/resetAt/expiry nào?
- HaveParentProfileSub có nghĩa gì trong catalog gói? Giá hiện dùng VND đúng không? Gói hiện tại trong ParentProfile có phản ánh hết hạn/hủy ngay hay cần đọc trạng thái khác?

**FE dùng câu trả lời để:** tái sử dụng DTO hiện có; chỉ đề nghị mở rộng phần thiếu, không suy “đang có subscription” từ một boolean của catalog.

## Q4 — Phạm vi quyết định phê duyệt (chặn mở rộng quyền; cần kiểm chứng core)

Source hiện tạo Pending/NotRequired từ StoryRoleTemplate.RequiresParentApproval; Parent PATCH một mapping từ Pending → Approved/Rejected. Inbox có tên/ảnh/truyện/vai/paging.

Nhờ xác nhận:
- MVP chỉ duyệt mapping nhân vật vào vai của một generated story, hay phải duyệt phiên bản nhân vật/quyền vai nhạy cảm có hiệu lực ở nhiều truyện? Nếu có quyền riêng, contract lưu/cấp/thu hồi ở đâu?
- Khi hai phiên Parent duyệt cùng request, Backend bảo đảm quyết định chỉ được áp dụng một lần bằng cách nào và trả lỗi gì cho quyết định cũ? Source kiểm tra Pending rồi update, chưa thấy concurrency token/điều kiện ghi atomic.
- Lý do từ chối và revision có bắt buộc MVP không? Child app nhận trạng thái đã duyệt thế nào, và dữ liệu nào được dùng để xác nhận luồng end-to-end?

**FE dùng câu trả lời để:** nối inbox/decision đúng phạm vi, xử lý conflict; không tự tạo quyền nhạy cảm từ status Approved.

## Q5 — Nguồn dữ liệu học tập (chặn bỏ mock dashboard/progress)

Hiện FE hardcode thời gian đọc, truyện hoàn thành, từ vựng, tỷ lệ đúng và biểu đồ. Chưa tìm thấy contract Parent scoped đủ cho màn này trong backend đang đọc.

Child app đã ghi event đọc/quiz/từ vựng/hoàn thành chưa? Nếu có, code ở repo/branch nào và Parent lấy aggregate ở API nào? Cần định nghĩa thời gian đọc, điều kiện hoàn thành, tử/mẫu tỷ lệ đúng, khoảng ngày/múi giờ, xử lý offline/trùng event và cách phân biệt “chưa có dữ liệu” với số 0.

**FE dùng câu trả lời để:** nối dashboard từng bé; không yêu cầu một family dashboard tổng hợp nếu chỉ cần list hồ sơ và summary của từng bé.

## Q6 — Thư viện và gợi ý truyện (chặn đồng bộ các thao tác đang local)

Backend có contract scoped nào cho:
- Tác phẩm/generated stories và nhân vật của từng ChildProfile.
- Truyện template Parent đã lưu.
- Gợi ý một template cho bé và nơi app Child hiển thị gợi ý đó?

Nếu đã có code ở branch/repo khác, xin route/DTO/ownership/pagination. Với favorite/hide/delete cần xác nhận thao tác tác động bản ghi nào và có xóa dữ liệu thật không. Entity/migration hoặc GET template catalog chưa đủ đáp ứng thư viện riêng của bé.

**FE dùng câu trả lời để:** thay sessionStorage/demoBooks theo từng capability, không báo “đã gửi” nếu chỉ lưu trên máy.

## Q7 — Cài đặt và hồ sơ mở rộng (chặn lưu các field chưa có DTO)

Giới hạn ngày và nickname đã có API. Các control còn lại là mục tiêu đọc, giờ nhắc, chủ đề yêu thích, yêu cầu duyệt nhân vật, chia sẻ, DOB/avatar.

Nhờ xác nhận field nào cần trong MVP và contract đọc/sửa tương ứng. Chủ đề yêu thích là preference hay allowedThemeIds cần chặn truy cập? Cờ approval/sharing được Backend/Child app thực thi ở đâu? Upload avatar có API gắn URL vào Parent/ChildProfile và đọc lại chưa? Khi chưa có, FE sẽ để chức năng chưa khả dụng hoặc demo có nhãn, không báo đã lưu Backend.

**FE dùng câu trả lời để:** tránh đồng nhất mục tiêu đọc với daily cap, hoặc yêu thích chủ đề với quyền xem nội dung.

## Q8 — Thanh toán và phần sau core MVP

Catalog giá đã có; chưa thấy checkout/order/provider verification contract. Nhờ Backend xác nhận thanh toán có thuộc đợt MVP không. Nếu có, cần provider được chọn, API tạo session/order, GET trạng thái, idempotency, webhook xác thực và thời điểm cập nhật entitlement. Tiền/currency phải do server quyết định; redirect trình duyệt không đủ xác nhận paid.

Export PDF/video, báo cáo gia đình/email và liên kết tài khoản Child cũ có thuộc cùng đợt bàn giao không? Nếu chưa, FE ưu tiên hoàn tất core và không mở các chức năng này như đã hoạt động. Nếu có, cần contract job/download/quota, nguồn số liệu báo cáo và owner của từng phần.

## Mẫu trả lời ngắn

- Q1: commit + môi trường + Swagger + đã/chưa deploy + phần đổi contract.
- Q2: phạm vi quyền + commit fix.
- Q3: response mẫu + đơn vị/chu kỳ/reset/quyền gói.
- Q4: phạm vi duyệt + hành vi conflict + phần bắt buộc MVP.
- Q5–Q8: đã có code (gửi route/DTO) / cần bổ sung (mốc bàn giao) / chưa thuộc MVP.

Tên và URL endpoint mới trong gap doc chỉ là đề xuất để mô tả nhu cầu, Backend có thể mở rộng endpoint hiện có. Chỉ đánh dấu hoàn tất khi FE caller, quyền và read-after-write đã được kiểm chứng trên đúng bản release.
