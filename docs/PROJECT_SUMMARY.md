# SketchTale — Tóm tắt dự án và định hướng triển khai Frontend

> Cập nhật: 17/09/2026  
> Thời gian dự kiến của đồ án: 09/2026–03/2027  
> Nhóm: 5 thành viên  
> Phạm vi của bạn: Web Frontend cho Parent, Content Manager và Admin  
> Trạng thái: Tài liệu khởi tạo để thống nhất phạm vi; chưa thay thế SRS, API contract hoặc quyết định chính thức của nhóm.

## 1. Cách đọc tài liệu

Các nhãn sau giúp phân biệt thông tin gốc với đề xuất triển khai:

- **[Đã xác nhận]**: có trong phiếu đăng ký, use case hoặc ERD được cung cấp.
- **[Đề xuất]**: gợi ý kỹ thuật/quy trình để nhóm thảo luận, không phải yêu cầu bắt buộc.
- **[Cần xác nhận]**: điểm chưa rõ, chưa thống nhất hoặc có mâu thuẫn giữa các nguồn.

Nguồn dùng để tổng hợp:

- Phiếu đăng ký đồ án `Phieu_FA26SE064.docx`.
- Use case diagram của SketchTale Web System.
- Use case diagram của SketchTale Mobile App.
- ERD được cung cấp.
- Trạng thái hiện tại của repository `SEP490sketchtale`.
- Thông tin ba gói Free, Pro và Family do người dùng tinh chỉnh ngày 17/09/2026.

## 2. Tóm tắt điều hành

**[Đã xác nhận]** SketchTale là hệ thống kể chuyện tương tác, cho phép trẻ biến tranh tự vẽ thành nhân vật hoạt hình và đưa nhân vật đó vào các mẫu truyện có sẵn. Trẻ có thể đọc/nghe truyện, theo dõi phần chữ được đọc và trả lời câu hỏi sau truyện.

Hệ thống đồng thời cung cấp:

- Ứng dụng di động dành cho trẻ.
- Parent Portal để phụ huynh quản lý hồ sơ trẻ, giới hạn sử dụng, nội dung, phê duyệt nhân vật và theo dõi tiến độ học tập.
- Story Content Management Web System để quản lý mẫu truyện, trang truyện, vai trò, tài sản, từ vựng và câu hỏi.
- Admin Web System để quản lý tài khoản, quyền, giới hạn hệ thống, an toàn nội dung và báo cáo.
- Web API và các tích hợp với dịch vụ tạo nhân vật AI, lưu trữ đám mây, giọng đọc và xuất truyện.

Giá trị chính của sản phẩm là kết hợp ba yếu tố:

1. **Sáng tạo cá nhân hóa**: tranh của trẻ trở thành nhân vật trong truyện.
2. **Học tập tương tác**: nghe kể, theo dõi chữ, học từ vựng và làm quiz.
3. **Kiểm soát của phụ huynh**: giới hạn sử dụng và phê duyệt nội dung phù hợp.

## 3. Thông tin hành chính

- **[Đã xác nhận] Tên tiếng Anh:** SketchTale - An Interactive Storytelling System from Children’s Drawings.
- **[Đã xác nhận] Tên tiếng Việt:** SketchTale - Hệ thống tạo truyện tương tác từ tranh vẽ của trẻ em.
- **[Đã xác nhận] Chuyên ngành:** Software Engineering.
- **[Đã xác nhận] Giảng viên hướng dẫn:** Đỗ Phúc Thịnh — thinhdp2@fpt.edu.vn.
- **[Đã xác nhận] Số thành viên:** biểu mẫu dành cho 5 sinh viên nhưng thông tin từng thành viên và vai trò đang để trống.
- **[Đã xác nhận] Tên sản phẩm:** SketchTale. Đoạn “Context” trong phiếu đang dùng nhầm tên `AnimTale` và cần được sửa trước khi nộp tài liệu chính thức.

## 4. Người dùng và hệ thống bên ngoài

### 4.1. Actors

| Actor                 | Vai trò chính                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| User                  | Nhóm chức năng dùng chung: đăng ký, đăng nhập, đăng xuất, quên mật khẩu và hồ sơ cá nhân.        |
| Parent                | Quản lý hồ sơ trẻ, giới hạn sử dụng, thư viện, phê duyệt nhân vật và tiến độ học tập.            |
| Child                 | Tạo nhân vật từ tranh, chọn/đọc truyện, làm quiz và xem thư viện cá nhân trên mobile.            |
| Content Manager       | Xây dựng, chỉnh sửa, xuất bản và theo dõi hiệu quả nội dung truyện.                              |
| Admin                 | Quản trị tài khoản, phân quyền, giới hạn hệ thống, từ khóa hạn chế, báo cáo và an toàn nội dung. |
| AI Generation Service | Tạo phiên bản nhân vật hoạt hình từ tranh của trẻ.                                               |
| Cloud Storage         | Lưu hình vẽ, nhân vật, nền, tài sản truyện, audio và file xuất.                                  |

### 4.2. Ranh giới sản phẩm

**Web:**

- Chức năng dùng chung cho tài khoản.
- Parent Portal.
- Content Management.
- Admin.

**Mobile:**

- Luồng dành cho trẻ.
- Đăng nhập/đăng xuất được use case gắn với Parent.
- Tích hợp AI và Cloud Storage.

**[Cần xác nhận]** Ba khu vực web sẽ là một SPA có phân quyền hay ba ứng dụng/deployment riêng. Với quy mô đồ án, một SPA dùng chung design system và route guard thường tiết kiệm công sức hơn.

### 4.3. Quyết định nghiệp vụ đã chốt

**[Đã xác nhận ngày 14/09/2026]**

- Parent đăng nhập, sau đó chọn child profile để trẻ sử dụng ứng dụng; trẻ không có luồng đăng nhập tài khoản riêng.
- Parent và child profile có quan hệ 1–N: một Parent có thể quản lý nhiều child profile; mỗi child profile thuộc đúng một Parent.
- Sản phẩm chỉ phục vụ trẻ 3–6 tuổi trong phạm vi hiện tại.
- Truyện xuất hiện cho trẻ khi đã được publish và thuộc category mà phụ huynh cho phép.
- Nhân vật phải được phụ huynh duyệt; recolor hoặc chỉnh sửa nhân vật làm phát sinh phiên bản cần duyệt lại.
- Quyền dùng vai nhạy cảm được phụ huynh duyệt một lần cho từng nhân vật, không duyệt lại theo từng lần gán vào truyện.
- Thời gian sử dụng được tính khi ứng dụng dành cho trẻ đang mở; cảnh báo trước khi hết thời gian 5 phút.
- Mỗi lần publish tạo một story version; `GeneratedStory` giữ snapshot của version đã chọn.
- Truyện được tính là hoàn thành khi trẻ đọc đến hết trang cuối.
- Tiến độ từ vựng lưu riêng số lần xuất hiện, số lần nghe và số lần trả lời đúng.
- Narration highlight theo câu trong MVP; chỉ nâng cấp theo từng từ nếu dịch vụ cung cấp timestamp.
- Quiz trong MVP là multiple choice, một đáp án đúng.
- Báo cáo nội dung đi theo `Open → UnderReview → Resolved/Rejected`, kèm người xử lý, ghi chú và lịch sử.
- Favorite, hide và delete được áp dụng riêng cho từng child profile, không ảnh hưởng child profile khác hoặc trạng thái publish toàn hệ thống.

**[Chưa chốt]**

- Có bỏ hoàn toàn giới hạn số nhân vật tạo mỗi ngày hay không.
- Định dạng và phạm vi tính năng export story.

**[Đề xuất chờ xác nhận]**

- Giới hạn số nhân vật/ngày do Parent đặt là kiểm soát sử dụng tùy chọn, tách biệt hạn mức thương mại/tháng ở mục 5.7. Không dùng giới hạn riêng của Parent để vượt hạn mức Free, Pro hoặc Family.
- Nên lưu lý do từ chối nhân vật để Parent khác và hệ thống audit hiểu quyết định. Parent có thể chọn một lý do ngắn có sẵn và nhập ghi chú tùy chọn; phía trẻ chỉ hiển thị biểu tượng, animation hoặc lời thoại thân thiện thay vì đoạn chữ dài.
- Chỉ tính usage time khi app trẻ em ở foreground/đang hoạt động; tạm dừng khi app vào background và đồng bộ thời gian với server.

## 5. Phạm vi chức năng

### 5.1. Tài khoản dùng chung

**[Đã xác nhận]**

- Đăng ký tài khoản và xác minh tài khoản.
- Đăng nhập, đăng xuất.
- Quên mật khẩu.
- Xem và cập nhật hồ sơ cá nhân.

**[Cần xác nhận]**

- Cách xác minh: email, OTP hay đường dẫn xác nhận.
- Cách đăng nhập: email/mật khẩu, social login hay SSO.
- Cơ chế cấp role và quyền chi tiết.

**[Đã xác nhận]** Parent đăng nhập và chọn child profile để chuyển sang trải nghiệm dành cho trẻ.

### 5.2. Ứng dụng trẻ em

**Tạo nhân vật**

- Vẽ trực tiếp bằng bút, chọn màu, tẩy và xóa canvas.
- Chụp hoặc tải tranh vẽ tay.
- Gửi tranh đến dịch vụ AI để tạo nhân vật hoạt hình.
- Xem trước và đặt tên nhân vật.
- Chấp nhận, đổi màu, hoặc yêu cầu tạo phiên bản khác.
- Giữ lại tranh gốc và cho phép thử lại nếu tạo nhân vật thất bại.

**Đọc truyện**

- Duyệt thư viện truyện mà phụ huynh cho phép.
- Chọn truyện và gán nhân vật đã được duyệt vào vai phù hợp.
- Đọc theo từng trang, nghe narration và xem chữ được highlight theo lời đọc.
- Trả lời câu hỏi ngắn sau truyện.
- Nhận gợi ý truyện.
- Xem lại nhân vật và truyện trong thư viện cá nhân.

### 5.3. Parent Portal

**[Đã xác nhận]**

- Tạo và quản lý nhiều child profile.
- Cấu hình category/chủ đề được phép; toàn bộ nội dung hiện hướng tới nhóm tuổi 3–6.
- Đặt giới hạn thời gian sử dụng mỗi ngày.
- Phiếu ban đầu cho phép đặt giới hạn số nhân vật mới mỗi ngày; quyết định giữ hay bỏ đang chờ chốt.
- Duyệt nhân vật trước khi được dùng trong truyện.
- Duyệt quyền dùng vai nhạy cảm một lần cho từng nhân vật.
- Ẩn, xóa hoặc đánh dấu yêu thích nhân vật/truyện riêng trong từng child profile.
- Xem số truyện đã đọc, từ vựng đã học và kết quả câu hỏi.
- Xuất truyện thành video hoặc file chia sẻ.

### 5.4. Story Content Management

**[Đã xác nhận]**

- Tạo/sửa mẫu truyện: tiêu đề, mô tả, category/chủ đề và ảnh bìa; tất cả nội dung hiện dành cho trẻ 3–6 tuổi.
- Quản lý nội dung từng trang.
- Định nghĩa vai trò: nhân vật chính, bạn đồng hành, nhân vật phụ và vai khác.
- Chỉ định vai cho phép dùng nhân vật do trẻ tạo.
- Đánh dấu vai cần phụ huynh phê duyệt bổ sung.
- Quản lý background, scene, prop, hình minh họa và audio.
- Cấu hình từ vựng mục tiêu.
- Tạo câu hỏi, đáp án và nội dung phản hồi sau truyện.
- Publish/hide truyện.
- Xem thống kê truyện được sử dụng nhiều.

### 5.5. Admin Web

**[Đã xác nhận]**

- Quản lý tài khoản Parent và Content Manager.
- Phân quyền.
- Khóa/mở khóa tài khoản vi phạm.
- Cấu hình giới hạn sử dụng chung.
- Theo dõi trạng thái tạo nhân vật, lỗi hệ thống và mức sử dụng.
- Xử lý báo cáo nội dung không phù hợp.
- Cấu hình nội dung, từ khóa hoặc chủ đề bị cấm.
- Xem báo cáo về số người dùng, số nhân vật được tạo và số truyện đã đọc.

### 5.6. Ngoài phạm vi chưa được xác nhận

Các mục sau không xuất hiện rõ trong nguồn và không nên tự đưa vào MVP:

- Tích hợp thanh toán thật: API, cổng thanh toán và điều kiện giao dịch chưa được xác nhận. Cấu hình ba gói đã được cung cấp; xem mục 5.7.
- Mạng xã hội, bình luận công khai hoặc chat giữa trẻ.
- Trẻ tự nhập prompt tự do để sinh toàn bộ cốt truyện.
- Đồng biên tập nội dung thời gian thực.
- Chế độ hoạt động hoàn toàn offline.
- Marketplace hoặc chia sẻ nội dung công khai.

### 5.7. Gói sử dụng và mô hình thương mại

**[Đã cung cấp ngày 17/09/2026]** Nội dung sau cập nhật phạm vi gói sử dụng. Thông tin tạo nhân vật AI trong các gói là chỉ dẫn mới nhất của người dùng.

#### Thông tin ba gói (người dùng cung cấp ngày 17/09/2026)

Giá tính bằng VND theo tháng. Đây là cấu hình sản phẩm được cung cấp, không phải xác nhận chức năng thanh toán hay quyền lợi đã được triển khai. Hạn mức thương mại phải do backend kiểm tra khi tích hợp; frontend không tự cấp quyền.

| Nội dung             | Free                     | Pro                          | Family                                  |
| -------------------- | ------------------------ | ---------------------------- | --------------------------------------- |
| Giá                  | Miễn phí                 | 35.000đ/tháng                | 89.000đ/tháng                           |
| Hồ sơ trẻ em         | 1                        | Tối đa 3                     | Tối đa 5                                |
| Tạo nhân vật AI      | 5 lượt/tháng             | 30 lượt/tháng                | 100 lượt/tháng                          |
| Tạo lại (regenerate) | Tối đa 1 lần/hình        | Tối đa 1 lần mỗi tranh       | Tối đa 1 lần mỗi tranh                  |
| Thư viện             | 5 truyện miễn phí cơ bản | Toàn bộ mẫu truyện và chủ đề | Trọn bộ cao cấp, cập nhật mới hàng tuần |
| Xuất video           | Không hỗ trợ             | 5 lượt/tháng                 | Không giới hạn                          |

##### Gói 1: Free

- **Mục tiêu:** Phụ huynh mới muốn dùng thử hệ thống, cho con trải nghiệm biến hình vẽ thành nhân vật hoạt hình.
- **Tính năng:** Vẽ trực tiếp hoặc chụp/tải ảnh vẽ tay; tạo nhân vật hoạt hình từ tranh vẽ bằng AI; đặt tên và chỉnh sửa màu sắc cơ bản; đọc truyện tương tác với giọng đọc, tô sáng chữ và câu hỏi sau truyện; Parent Portal cơ bản để quản lý thời gian, duyệt nhân vật.
- **Giới hạn:** Không xuất video, không xem báo cáo từ vựng chuyên sâu, thư viện giới hạn ở 5 truyện cơ bản.

##### Gói 2: Pro — 35.000đ/tháng

- **Mục tiêu:** Gia đình có 1–2 trẻ em muốn con sáng tạo hằng ngày và học qua truyện đọc. Số hồ sơ được cấp vẫn là tối đa 3, không giới hạn ở 2 theo mô tả khách hàng mục tiêu.
- **Tính năng:** Toàn bộ tính năng Free; lưu trữ kho nhân vật và thư viện truyện yêu thích (Favorites) không giới hạn.
- **Giới hạn:** 1 lần regenerate mỗi tranh; 5 lượt xuất video/tháng.

##### Gói 3: Family — 89.000đ/tháng

- **Mục tiêu:** Gia đình đông con hoặc phụ huynh muốn sự tự do sáng tạo và lưu giữ kỷ niệm.
- **Tính năng:** Toàn bộ tính năng Pro; đánh dấu và xuất báo cáo học tập định kỳ hằng tháng gửi về email phụ huynh.
- **Giới hạn:** 100 lượt tạo nhân vật AI/tháng, 1 lần regenerate mỗi tranh. Xuất truyện thành video không giới hạn.

##### Quy tắc tích hợp và các câu hỏi còn mở

- Các gói có giá và quyền lợi nêu trên; public prototype chỉ giới thiệu và cho đọc truyện mẫu, chưa thu tiền, đăng ký gói hoặc cấp quyền thật.
- Ba truyện public demo không phải danh sách 5 truyện của gói Free. Danh sách 5 truyện và thư viện cao cấp cần Content Manager xác nhận.
- Cần chốt gói gắn với Parent hay từng Child, cách chia sẻ hạn mức giữa các hồ sơ, ngày reset theo tháng và timezone.
- Cần chốt regenerate có trừ lượt tạo chính không, lượt lỗi có hoàn lại không, cách đếm xuất video và tải lại file.
- Chưa có giá năm, thời gian dùng thử, phương thức thanh toán, điều kiện gia hạn/hủy/hoàn tiền hay quy tắc nâng/hạ gói; không tự bổ sung.

## 6. Luồng nghiệp vụ cốt lõi

### 6.1. Tạo nhân vật

1. Trẻ chọn vẽ trực tiếp hoặc tải/chụp tranh.
2. Ứng dụng kiểm tra định dạng, kích thước; backend kiểm tra quyền lợi và hạn mức tạo nhân vật theo gói (mục 5.7), cộng thêm giới hạn hằng ngày nếu phụ huynh đã bật.
3. Tranh gốc được lưu trước khi gọi dịch vụ AI.
4. Hệ thống tạo nhân vật và hiển thị trạng thái xử lý.
5. Trẻ xem trước, đặt tên, đổi màu hoặc yêu cầu phiên bản mới; recolor/chỉnh sửa tạo phiên bản phải duyệt lại.
6. Nhân vật đi vào trạng thái chờ duyệt nếu chính sách yêu cầu.
7. Phụ huynh duyệt/từ chối.
8. Nhân vật đã duyệt xuất hiện trong danh sách có thể gán vào vai truyện.

**Điểm Frontend cần xử lý:** upload progress, trạng thái bất đồng bộ, retry không tải lại, timeout, hủy tác vụ, giới hạn hằng ngày nếu được bật và thông báo bằng hình ảnh/âm thanh dễ hiểu cho trẻ 3–6 tuổi.

### 6.2. Tạo phiên bản truyện cá nhân hóa

1. Trẻ duyệt thư viện đã được lọc theo profile.
2. Trẻ chọn mẫu truyện.
3. Ứng dụng hiển thị các vai có thể tùy biến.
4. Trẻ gán nhân vật hợp lệ vào từng vai.
5. Nếu vai nhạy cảm, hệ thống kiểm tra nhân vật đã được Parent duyệt quyền dùng vai nhạy cảm hay chưa; mỗi nhân vật chỉ cần duyệt một lần.
6. Backend tạo `GeneratedStory`, lưu mapping vai trò–nhân vật và snapshot story version hiện tại.
7. Trẻ mở truyện cá nhân hóa trong reader.

### 6.3. Đọc truyện và làm quiz

1. Reader tải metadata và trang đầu.
2. Audio narration chạy đồng bộ với phần text highlight theo câu.
3. Hệ thống ghi nhận trang cuối, thời lượng đọc; truyện hoàn thành khi trẻ đọc hết trang cuối.
4. Sau truyện, trẻ trả lời quiz multiple choice có một đáp án đúng.
5. Hệ thống chấm kết quả và cập nhật riêng số lần từ xuất hiện, được nghe và được trả lời đúng.
6. Dashboard phụ huynh hiển thị dữ liệu tổng hợp.

### 6.4. Xuất truyện

**[Chưa quyết định phạm vi/định dạng; luồng dưới đây mới là đề xuất.]**

1. Phụ huynh chọn truyện đã tạo.
2. Hệ thống tạo export job.
3. UI hiển thị tiến độ hoặc trạng thái queued/processing/completed/failed.
4. Khi hoàn tất, phụ huynh tải hoặc chia sẻ file.

**[Cần xác nhận]** định dạng đầu ra, giới hạn thời lượng, thời gian lưu file, watermark, quyền chia sẻ và việc export có bao gồm narration hay không.

### 6.5. Xử lý báo cáo nội dung

1. Báo cáo được tạo cho một target cụ thể.
2. Admin xem lý do, nội dung liên quan và lịch sử.
3. Báo cáo đi qua `Open → UnderReview → Resolved/Rejected`.
4. Nếu có vi phạm, Admin có thể khóa tài khoản hoặc ẩn nội dung.
5. Hệ thống lưu người xử lý, ghi chú, thời gian và lịch sử hành động.

## 7. Quy tắc nghiệp vụ quan trọng

- Trẻ không được dùng nhân vật chưa được phê duyệt khi chính sách yêu cầu.
- Recolor/chỉnh sửa tạo phiên bản nhân vật mới và phiên bản đó phải được duyệt lại.
- Quyền dùng vai nhạy cảm được duyệt một lần cho từng nhân vật.
- Thư viện chỉ hiển thị truyện đã publish và thuộc category được phụ huynh cho phép; đối tượng sử dụng hiện cố định ở tuổi 3–6.
- Thời gian sử dụng được tính khi app trẻ em đang mở; cảnh báo trước 5 phút. Backend phải kiểm soát giới hạn, Frontend chỉ phản ánh trạng thái.
- Mỗi lần publish tạo version mới; `GeneratedStory` giữ snapshot version đã chọn.
- Nếu tạo nhân vật thất bại, tranh gốc vẫn phải còn để retry.
- Tiến độ đọc lưu trang cuối; truyện được hoàn thành khi đã đọc hết trang cuối.
- Narration highlight theo câu; quiz là multiple choice một đáp án đúng.
- Tiến độ từ vựng tách riêng số lần xuất hiện, nghe và trả lời đúng.
- Favorite, hide và delete là trạng thái theo từng child profile; thao tác của một trẻ không làm thay đổi thư viện của trẻ khác.
- Thao tác quản trị quan trọng cần có audit trail.
- Content report dùng vòng đời `Open → UnderReview → Resolved/Rejected` và lưu đầy đủ lịch sử xử lý.

## 8. Yêu cầu phi chức năng và tiêu chí kiểm thử

| Nhóm        | Yêu cầu đã nêu                                                        | Gợi ý tiêu chí kiểm thử                                                                                   |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Usability   | Trẻ bắt đầu một bản vẽ mới trong tối đa 3 lần chạm từ màn hình chính. | Kiểm thử trên navigation thực tế; không tính thao tác mở ứng dụng/đăng nhập.                              |
| Performance | Trang truyện tải trong tối đa 3 giây với kết nối ổn định.             | Thống nhất cấu hình thiết bị, mạng, kích thước asset và percentile đo.                                    |
| Reliability | Khi AI thất bại, giữ tranh gốc và retry không cần upload lại.         | Giả lập timeout, lỗi 5xx và mất mạng sau upload.                                                          |
| Safety      | Không dùng nhân vật chưa được duyệt trong trường hợp cần phê duyệt.   | Chặn ở cả API và UI; kiểm thử gọi API trực tiếp.                                                          |
| Usage limit | Tính thời gian khi app trẻ em đang mở và cảnh báo trước 5 phút.       | Tạm dừng bộ đếm khi app vào background; đồng bộ định kỳ với server để tránh sửa giờ hoặc bỏ qua giới hạn. |

**[Đề xuất] Các NFR cần bổ sung vào SRS:**

- Accessibility: điều hướng bàn phím cho web, contrast, label, focus state và hỗ trợ screen reader.
- Responsive: web hoạt động tốt từ tablet đến desktop; xác định có hỗ trợ mobile web hay không.
- Security: chống XSS/CSRF, quản lý token, rate limit, upload validation và phân quyền phía server.
- Privacy: dữ liệu trẻ em, thời gian lưu ảnh, quyền xóa/xuất dữ liệu và log truy cập.
- Observability: request ID, log lỗi Frontend, theo dõi lỗi AI/export và dashboard vận hành.
- Compatibility: danh sách browser và phiên bản mobile OS được hỗ trợ.
- Localization: quyết định tiếng Việt, tiếng Anh hoặc song ngữ.

## 9. Tóm tắt mô hình dữ liệu

Tên entity dưới đây được đọc từ ERD; tên cột/cardinality cần đối chiếu lại với migration hoặc database schema trước khi code.

| Miền dữ liệu        | Entity chính                                                         | Ý nghĩa                                                                |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Identity            | `Users`, `ChildProfiles`                                             | Tài khoản Parent và các child profile thuộc Parent đó.                 |
| Audit               | `AuditLogs`                                                          | Ghi lại hành động, entity, khóa chính, giá trị cũ/mới và cột thay đổi. |
| Drawing & Character | `Drawings`, `Characters`, `CharType`                                 | Tranh gốc, nhân vật được sinh và loại nhân vật.                        |
| Story Catalog       | `Categories`, `StoryTemplates`                                       | Danh mục và metadata mẫu truyện.                                       |
| Story Composition   | `StoryPageTemplates`, `StoryRoleTemplates`, `CharacterSlotTemplates` | Trang truyện, vai trò và vị trí/scale nhân vật trên từng trang.        |
| Learning Content    | `VocabularyTemplates`, `StoryQuizTemplates`                          | Từ vựng, audio, câu hỏi và đáp án.                                     |
| Personalized Story  | `GeneratedStories`, `UserStoryCharacterMappings`                     | Phiên bản truyện của trẻ và mapping vai trò–nhân vật.                  |
| Learning Tracking   | `ReadingLogs`, `ChildVocabularyProgress`, `ChildQuizAnswers`         | Lịch sử đọc, tiến độ từ vựng và câu trả lời.                           |
| Moderation          | `ContentReports`                                                     | Báo cáo cho target nội dung/tài khoản và trạng thái xử lý.             |

### 9.1. Quan hệ chính

- Một `User` có role Parent quản lý 0–N `ChildProfiles`; mỗi `ChildProfile` thuộc đúng một Parent qua `ParentId`.
- `ChildProfiles` 1–N `Drawings`, `Characters`, `GeneratedStories` và `ReadingLogs`.
- `Drawings` liên kết với `Characters` để giữ nguồn tạo nhân vật.
- `Categories` 1–N `StoryTemplates`.
- `StoryTemplates` 1–N `StoryPageTemplates`, `StoryRoleTemplates`, `StoryQuizTemplates` và `GeneratedStories`.
- `StoryPageTemplates` 1–N `VocabularyTemplates` và `CharacterSlotTemplates`.
- `StoryRoleTemplates` 1–N `CharacterSlotTemplates`.
- `GeneratedStories` kết nối vai trò với nhân vật qua `UserStoryCharacterMappings`.
- `ReadingLogs` liên kết với `ChildQuizAnswers`.
- `ChildProfiles` và `VocabularyTemplates` được tổng hợp qua `ChildVocabularyProgress`.

### 9.2. Trường dữ liệu Frontend cần chú ý

- Các entity dùng nhiều trạng thái enum: story, character, approval, report, reading và publish state.
- Asset URL xuất hiện ở tranh, nhân vật, cover, background, narration và vocabulary audio.
- `StoryPageTemplates` có số trang và nội dung chính.
- `CharacterSlotTemplates` có tọa độ X/Y, scale và lật ngang; editor cần preview đúng tỷ lệ canvas.
- `StoryQuizTemplates` lưu nội dung câu hỏi, audio, danh sách lựa chọn và chỉ số đáp án đúng.
- `ChildProfiles` chứa giới hạn thời gian/ngày và category được phép; giới hạn nhân vật/ngày đang chờ quyết định.
- `AuditLogs` không nên được render như dữ liệu tin cậy từ client; server quyết định nội dung audit.

### 9.3. Khoảng trống dữ liệu cần xử lý

- Chưa thấy entity rõ ràng cho role/permission, token/refresh session hoặc account verification.
- `AllowedCategoryIdsJson` có dấu hiệu lưu danh sách ID dạng JSON; cân nhắc bảng many-to-many để đảm bảo toàn vẹn dữ liệu.
- Quan hệ Parent–Child được chốt là 1–N; `ChildProfiles.ParentId` là khóa ngoại bắt buộc. Không cần bảng nối `ParentChildProfiles`.
- Phê duyệt nhân vật cần ít nhất Pending/Approved/Rejected, người duyệt và thời gian. Lý do từ chối nên phục vụ Parent/audit; trẻ chỉ cần thông báo thân thiện bằng biểu tượng hoặc âm thanh.
- Cần version cho nhân vật vì recolor/chỉnh sửa phải duyệt lại; phiên bản đã duyệt không được bị ghi đè.
- Cần story version/snapshot để mỗi lần publish tạo version mới và `GeneratedStory` không đổi ngoài ý muốn.
- Chưa thấy job model cho AI generation và export video.
- MVP highlight theo câu; cần timestamp theo câu từ dịch vụ narration hoặc dữ liệu do Content Manager cấu hình.
- Chưa thấy model cho recommendation.
- Chưa thấy bảng cấu hình giới hạn hệ thống, từ khóa hạn chế và chủ đề cấm.
- `ContentReports` dùng cặp `TargetType/TargetId`; cần quy ước và validation rõ vì database khó tạo foreign key đa hình.
- Cần bổ sung dữ liệu theo child profile cho favorite/hide/delete. `Hide` chỉ ẩn khỏi thư viện của trẻ; `delete` nên là soft delete khỏi thư viện cá nhân và không được xóa story template toàn hệ thống.

## 10. Trạng thái Frontend hiện tại

**[Đã xác nhận từ repository]**

- Dự án dùng React + Vite; public website prototype đã được triển khai theo `docs/Public Website.md`.
- React `19.2.8`, React DOM `19.2.8` và Vite `8.3.0`.
- Source dùng JavaScript/JSX; đây là convention triển khai của dự án.
- Đã có React Router, CSS tokens, Nunito tự host, Phosphor icons, service mock và Playwright/axe để kiểm thử. Chưa tích hợp API thật, auth, thanh toán hoặc dashboard theo role.
- Màn hình starter đã thay bằng trang chủ, thư viện/reader/quiz, demo phụ huynh, so sánh gói và các trang thông tin/auth minh họa. Mã bắt đầu tại `src/app/App.jsx`.
- Repository hiện chưa có Git metadata trong thư mục dự án.

Điều này có nghĩa Frontend vẫn đang ở giai đoạn khởi tạo và đây là thời điểm phù hợp để chốt cấu trúc trước khi phát triển nhiều màn hình.

## 11. Phạm vi Web Frontend của bạn

**[Đã xác nhận]** Bạn chịu trách nhiệm Web Frontend cho ba khu vực: **Parent Portal, Story Content Management và Admin Web**. Mobile App không thuộc phạm vi Frontend của bạn.

### 11.1. Ưu tiên P0 — nền tảng

- Chốt sitemap, route và ma trận quyền.
- Giữ JavaScript/JSX nhất quán với codebase hiện tại; dùng JSDoc cho object/API response phức tạp khi cần.
- Tạo design tokens, typography, spacing, màu trạng thái và component cơ bản.
- Thiết lập router, route guard và layout theo role.
- Thiết lập API client, refresh token, error normalization và request cancellation.
- Thiết lập server-state cache và quy ước query key.
- Xây form primitives, validation và upload component.
- Tạo mock API/fixtures để Frontend không bị chặn bởi Backend.
- Thiết lập unit/component test và kiểm tra accessibility cơ bản.

### 11.1.1. Điểm bắt đầu khuyến nghị — Sprint 1

Đừng bắt đầu bằng Story Editor. Hãy làm một **vertical slice** nhỏ nhưng hoàn chỉnh: người dùng đăng nhập → nhận role → vào đúng dashboard → Parent tạo/xem một child profile bằng mock data.

1. Chốt React Router, thư viện UI/styling, cách gọi API và convention JavaScript (naming, cấu trúc module, JSDoc khi cần).
2. Tạo app shell: sidebar, header, trang 403/404, loading và error state.
3. Khai báo role `PARENT`, `CONTENT_MANAGER`, `ADMIN`; tạo route guard và ba dashboard placeholder.
4. Tạo mock API cho `GET /me`, login, danh sách/tạo/sửa child profile.
5. Hoàn thiện Parent Children List + Create/Edit Child Profile, gồm validation và responsive state.
6. Viết component test cho route guard và form child profile; E2E happy path nếu môi trường test đã sẵn sàng.

Sau Sprint 1, bạn có nền dùng chung cho cả ba role và một luồng Parent demo được. Khi API Backend thay đổi, chỉ cần thay mock adapter thay vì viết lại màn hình.

### 11.2. Ưu tiên P0 — màn hình nghiệp vụ

- Authentication: login, register, verify, forgot/reset password.
- Profile: xem/cập nhật hồ sơ.
- Parent: danh sách child profile, tạo/sửa profile và usage limits.
- Parent: hàng đợi phê duyệt nhân vật.
- Content Manager: danh sách story template và editor metadata.
- Content Manager: quản lý page, role, slot, vocabulary và quiz.
- Admin: danh sách tài khoản, chi tiết, role/permission và lock/unlock.

### 11.3. Ưu tiên P1

- Parent dashboard và learning progress.
- Parent library: filter, favorite, hide/delete.
- Phê duyệt vai nhạy cảm.
- Publish/hide workflow cho truyện.
- Asset library và upload.
- Content report queue.
- Admin system limits và restricted keywords.
- Story statistics và system reports.

### 11.4. Ưu tiên P2

- Export story và theo dõi export job sau khi chốt định dạng/phạm vi.
- Dashboard nâng cao, biểu đồ và export báo cáo.
- Bulk action.
- Audit log viewer.
- Cải thiện editor bằng drag/drop và live preview.
- Recommendation explanation hoặc tùy chọn tinh chỉnh nếu Backend hỗ trợ.

## 12. Sitemap/route đề xuất

```text
/auth/login
/auth/register
/auth/verify
/auth/forgot-password
/auth/reset-password
/profile

/parent
/parent/children
/parent/children/:childId
/parent/children/:childId/settings
/parent/children/:childId/approvals
/parent/children/:childId/library
/parent/children/:childId/progress
/parent/exports

/content
/content/stories
/content/stories/new
/content/stories/:storyId
/content/stories/:storyId/pages
/content/stories/:storyId/roles
/content/stories/:storyId/vocabulary
/content/stories/:storyId/quizzes
/content/assets
/content/statistics

/admin
/admin/users
/admin/users/:userId
/admin/permissions
/admin/system-limits
/admin/restrictions
/admin/reports
/admin/audit-logs
```

**[Đề xuất]** Dùng route theo role nhưng tái sử dụng shell, component, form và data layer. Không chỉ ẩn menu ở client; Backend phải kiểm tra quyền cho mọi endpoint.

## 13. Kiến trúc Frontend đề xuất

### 13.1. Stack

| Mục                  | Đề xuất                                    | Ghi chú                                                                                   |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Language             | JavaScript/JSX                             | Phù hợp với codebase hiện tại; dùng JSDoc cho model, payload và hàm phức tạp để giảm lỗi. |
| Routing              | React Router                               | Nested layout theo role và route guard.                                                   |
| Server state         | TanStack Query                             | Cache, retry, invalidation và trạng thái request.                                         |
| Forms                | React Hook Form + Zod                      | Form dài, validation dùng chung và mapping lỗi API.                                       |
| Styling              | Tailwind CSS hoặc CSS Modules              | Chọn một hướng; phiếu chỉ đưa ra công nghệ khả dụng, không bắt buộc.                      |
| Component foundation | Radix UI/headless primitives               | Giữ accessibility và chủ động visual style.                                               |
| Testing              | Vitest + Testing Library + Playwright      | Unit/component cho logic; E2E cho luồng chính.                                            |
| API schema           | OpenAPI schema/client hoặc API mock nếu có | Giảm lệch contract giữa Frontend và Backend; không bắt buộc TypeScript.                   |

### 13.2. Cấu trúc thư mục gợi ý

```text
src/
  app/
    router/
    providers/
    layouts/
  assets/
  components/
    ui/
    feedback/
    forms/
  features/
    auth/
    profile/
    children/
    approvals/
    stories/
    story-editor/
    vocabulary/
    quizzes/
    reports/
    administration/
  lib/
    api/
    auth/
    validation/
    permissions/
    formatting/
  pages/
  styles/
  test/
```

### 13.3. Quy ước trạng thái UI

Mọi màn hình lấy dữ liệu cần thiết kế đủ:

- Loading/skeleton.
- Empty state có hành động tiếp theo.
- Error state có retry.
- Unauthorized/forbidden.
- Partial data.
- Success feedback.
- Unsaved changes.
- Offline/mất kết nối nếu ảnh hưởng luồng.

Các tác vụ lâu như AI generation, upload và export cần state machine rõ ràng thay vì một boolean `isLoading`.

## 14. Story Editor — phần Frontend phức tạp nhất

Story Editor nên được chia thành các bước/tab:

1. Metadata: title, description, category, age group, cover và status.
2. Pages: thứ tự trang, nội dung, background và narration.
3. Roles: tên vai, cho phép custom character, cần parental approval và default asset.
4. Character slots: role, X/Y, scale và flip.
5. Vocabulary: word, meaning và audio.
6. Quiz: question, options, đáp án đúng, audio và feedback.
7. Preview.
8. Validation và publish.

### 14.1. Quy tắc editor đề xuất

- Autosave draft có debounce nhưng phải hiển thị trạng thái save.
- Cảnh báo khi rời trang với thay đổi chưa lưu.
- Không cho publish khi thiếu trường bắt buộc.
- Validate tham chiếu: slot phải trỏ tới role hợp lệ; page number không trùng; quiz phải có đúng một đáp án.
- Preview dùng cùng tỷ lệ khung với Mobile Reader.
- Asset picker hỗ trợ upload progress, alt text, loại file và kích thước.
- Drag/drop chỉ là cải tiến; form tọa độ số vẫn cần để kiểm tra chính xác.
- Publish nên là một hành động riêng có confirmation và trả về danh sách lỗi.

## 15. API contract tối thiểu để Frontend bắt đầu

Đây là **[Đề xuất]** để nhóm Frontend–Backend thống nhất; tên endpoint chưa phải yêu cầu chính thức.

### 15.1. Auth và profile

```text
POST   /auth/register
POST   /auth/verify
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /me
PATCH  /me
```

### 15.2. Parent

```text
GET    /children
POST   /children
GET    /children/:childId
PATCH  /children/:childId
PATCH  /children/:childId/settings

GET    /children/:childId/characters
PATCH  /characters/:characterId/approval
PATCH  /characters/:characterId/sensitive-role-approval

GET    /children/:childId/library
PATCH  /children/:childId/generated-stories/:storyId/favorite
PATCH  /children/:childId/generated-stories/:storyId/visibility
DELETE /children/:childId/generated-stories/:storyId
GET    /children/:childId/progress

POST   /generated-stories/:storyId/exports
GET    /exports/:exportId
```

### 15.3. Content Manager

```text
GET    /story-templates
POST   /story-templates
GET    /story-templates/:storyId
PATCH  /story-templates/:storyId
POST   /story-templates/:storyId/publish
POST   /story-templates/:storyId/hide

GET/POST/PATCH/DELETE  /story-templates/:storyId/pages
GET/POST/PATCH/DELETE  /story-templates/:storyId/roles
GET/POST/PATCH/DELETE  /story-templates/:storyId/quizzes
GET/POST/PATCH/DELETE  /story-pages/:pageId/vocabulary
GET/POST/PATCH/DELETE  /story-pages/:pageId/character-slots

POST   /assets
GET    /content/statistics
```

### 15.4. Admin

```text
GET    /admin/users
GET    /admin/users/:userId
PATCH  /admin/users/:userId/permissions
POST   /admin/users/:userId/lock
POST   /admin/users/:userId/unlock

GET/PATCH  /admin/system-limits
GET/POST/PATCH/DELETE  /admin/restrictions
GET    /admin/content-reports
GET    /admin/content-reports/:reportId
PATCH  /admin/content-reports/:reportId
GET    /admin/reports/overview
GET    /admin/audit-logs
```

### 15.5. Quy ước response cần chốt

- Pagination: page/size hay cursor.
- Filter/sort/search.
- Error envelope và field-level validation error.
- Date/time theo ISO 8601 và timezone.
- Enum values dùng chung.
- Upload: multipart, presigned URL hay direct-to-cloud.
- Async job: polling, Server-Sent Events hay WebSocket.
- Idempotency cho retry.
- Quy tắc cache/version/ETag nếu nhiều người sửa nội dung.

## 16. Ma trận quyền sơ bộ

| Chức năng                  | Parent | Content Manager |       Admin       | Child |
| -------------------------- | :----: | :-------------: | :---------------: | :---: |
| Quản lý hồ sơ cá nhân      |   ✓    |        ✓        |         ✓         |   —   |
| Quản lý child profile      |   ✓    |        —        | Có thể chỉ hỗ trợ |   —   |
| Duyệt nhân vật/vai         |   ✓    |        —        |  Có thể điều tra  |   —   |
| Xem learning progress      |   ✓    |        —        | Báo cáo tổng hợp  |   —   |
| Quản lý story template     |   —    |        ✓        |    Theo quyền     |   —   |
| Publish/hide story         |   —    |        ✓        |    Theo quyền     |   —   |
| Quản lý tài khoản/quyền    |   —    |        —        |         ✓         |   —   |
| Xử lý content report       |   —    |        —        |         ✓         |   —   |
| Tạo nhân vật và đọc truyện |   —    |        —        |         —         |   ✓   |

**[Cần xác nhận]** Admin có quyền sửa nội dung trực tiếp hay chỉ quản trị/giám sát; Parent có được tạo account riêng cho Child hay Child chỉ là profile.

## 17. Phân công gợi ý cho nhóm 5 người

Đây là **[Đề xuất]**, ưu tiên giảm phụ thuộc và tránh chỉ một người chịu toàn bộ Backend.

| Thành viên | Trách nhiệm chính                                                    | Trách nhiệm phối hợp              |
| ---------- | -------------------------------------------------------------------- | --------------------------------- |
| 1          | Backend Core: auth, user, child profile, permission, audit           | Tech lead/architecture            |
| 2          | Backend Domain: story template, generated story, progress, reporting | Database và OpenAPI               |
| 3 — bạn    | Web Frontend: shared UI, Parent, Content Manager, Admin              | UX, API contract và E2E web       |
| 4          | Mobile Frontend: drawing, character, library, reader, quiz           | Mobile UX và integration          |
| 5          | AI/Media Integration: generation, narration, storage, export         | DevOps, monitoring và performance |

Mọi thành viên cùng tham gia:

- Phân tích yêu cầu và review SRS.
- Review API contract.
- Viết test cho phần mình sở hữu.
- Chuẩn bị tài liệu và demo.
- Cross-review ít nhất một module của thành viên khác.

Nếu thành viên 5 phải dành nhiều thời gian cho AI, nên luân phiên QA/DevOps trong cả nhóm thay vì giao hoàn toàn cho một người.

## 18. Lộ trình 09/2026–03/2027

### Giai đoạn 1 — Scope và nền tảng (09–10/2026)

- Chốt tên sản phẩm, actor, MVP và business rules.
- Hoàn thành use case detail, wireflow và SRS bản đầu.
- Chốt kiến trúc, database, API conventions và cloud.
- Frontend: router, auth shell, design system, API mocks và CI.

### Giai đoạn 2 — Nội dung và tài khoản (10–11/2026)

- Auth, profile, child profile và quyền.
- Story template CRUD, page/role/vocabulary/quiz editor bản cơ bản.
- Upload asset và lưu trữ.
- Mobile shell, child profile selection và thư viện.

### Giai đoạn 3 — Luồng chính (11–12/2026)

- Vẽ/upload và character generation.
- Approval workflow.
- Character assignment và generated story.
- Reader page-by-page và reading log.
- Parent Portal P0.

### Giai đoạn 4 — Học tập và quản trị (12/2026–01/2027)

- Narration/highlight.
- Quiz và vocabulary progress.
- Admin account/report/restriction.
- Content statistics và parent dashboard.

### Giai đoạn 5 — Tích hợp nâng cao (01–02/2027)

- Export story.
- Recommendation.
- Story preview/publish validation.
- Performance, security và error recovery.

### Giai đoạn 6 — Hoàn thiện và bảo vệ (02–03/2027)

- Integration/E2E/UAT.
- Fix bug, accessibility và responsive.
- Deployment, seed data và monitoring.
- Hoàn tất SRS, design, testing, installation guide, source và deployment package.
- Chuẩn bị demo có dữ liệu dự phòng khi AI/cloud gặp lỗi.

## 19. Definition of Done cho Web Frontend

Một user story chỉ nên được xem là hoàn thành khi:

- Acceptance criteria đã được thống nhất.
- UI có responsive state phù hợp.
- Đủ loading, empty, error, forbidden và success state.
- Form có client validation và hiển thị lỗi từ server.
- Không dựa vào client để đảm bảo authorization/business rule.
- Không có lỗi console nghiêm trọng.
- Keyboard navigation và focus state hoạt động với các luồng quản trị.
- Component test cho logic quan trọng.
- E2E hoặc integration test cho happy path chính.
- API type/contract đã đồng bộ.
- Code được review.
- Demo được bằng dữ liệu seed/mock ổn định.

## 20. Rủi ro chính và cách giảm thiểu

| Rủi ro                                               | Tác động                  | Hướng xử lý                                            |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
| Phạm vi gồm web, mobile, AI, audio và export quá lớn | Trễ tiến độ               | Chốt MVP, P0/P1/P2 và demo path ngay từ đầu.           |
| Tên AnimTale/SketchTale không nhất quán              | Sai hồ sơ/tài liệu        | Sửa nguồn chính và dùng SketchTale thống nhất.         |
| FE bị chặn bởi BE                                    | Chậm UI/integration       | OpenAPI sớm, mock server và fixtures có version.       |
| AI chậm hoặc thất bại                                | Luồng cốt lõi kém ổn định | Async job, lưu tranh trước, retry và demo fallback.    |
| Asset/audio quá nặng                                 | Không đạt mốc 3 giây      | CDN, nén, preload trang kế tiếp và performance budget. |
| Phân quyền chỉ làm ở UI                              | Rò rỉ dữ liệu/chức năng   | Enforce ở API và test quyền trực tiếp.                 |
| Sửa template làm thay đổi truyện đã tạo              | Mất tính nhất quán        | Version/snapshot khi tạo generated story.              |
| Dữ liệu trẻ em nhạy cảm                              | Rủi ro riêng tư           | Data retention, consent, access log và xóa dữ liệu.    |
| Editor quá phức tạp                                  | Tốn phần lớn thời gian FE | Làm form editor trước, drag/drop sau.                  |
| Export/narration phụ thuộc dịch vụ ngoài             | Demo dễ lỗi               | Queue, timeout, retry, status UI và file mẫu dự phòng. |

## 21. Các câu hỏi còn cần chốt

### P0 — trước khi code nhiều

1. Web Parent/Content/Admin là một SPA hay ba ứng dụng?
2. Backend framework, database và chuẩn API cuối cùng là gì?
3. Mô hình auth/role/permission và refresh token như thế nào?
4. Mobile dùng React Native hay Flutter?
5. AI provider, storage provider và narration provider nào được dùng?
6. Phạm vi MVP chính xác cho lần demo đầu là gì?
7. Chốt cách tính regenerate, lượt thất bại, phạm vi hạn mức và lịch reset. Hạn mức đã cung cấp: Free 5 lượt/tháng, Pro 30 lượt/tháng, Family 100 lượt/tháng; mỗi gói 1 lần regenerate mỗi tranh.

### P1 — trước khi tích hợp domain

9. Có bắt buộc Parent chọn lý do khi từ chối nhân vật không, hay lý do chỉ là tùy chọn?
10. App chạy background có tính usage time không? Giới hạn ngày dùng timezone nào và reset lúc mấy giờ?
11. Xuất video đã có trong quyền lợi Pro/Family; cần chốt định dạng, API job và phạm vi MVP. PDF hoặc link web chưa được xác nhận.
12. Recommendation là rule-based hay AI-based?
13. Admin có quyền chỉnh sửa nội dung hay chỉ giám sát?
14. Với nhóm tuổi cố định 3–6, có cần chia nội dung thành các mức nhỏ như 3–4 và 5–6 hay không?

### P2 — trước khi release

15. Hỗ trợ ngôn ngữ nào?
16. Browser, thiết bị và phiên bản OS tối thiểu?
17. Chính sách lưu/xóa tranh, nhân vật, audio và file export?
18. Cần audit những hành động nào và ai được xem audit log?
19. SLA cho AI/export và chiến lược thông báo khi job hoàn tất?

## 22. Việc Frontend nên làm tiếp theo

- [x] Xác nhận bạn phụ trách Web Frontend cho Parent, Content Manager và Admin; không gồm Mobile App.
- [ ] Chốt câu hỏi P0 còn lại với nhóm và giảng viên.
- [ ] Chốt React Router, styling, thư viện form/query và convention JavaScript/JSDoc.
- [ ] Tạo sitemap + permission matrix bản chính thức.
- [ ] Xây app shell, route guard và mock API cho `/me`, auth và child profiles.
- [ ] Hoàn thiện luồng Parent: Children List → Create/Edit Child Profile.
- [ ] Vẽ low-fidelity wireflow cho parent approval, story editor và admin report.
- [ ] Thống nhất OpenAPI/error envelope/enum với Backend.
- [ ] Làm Story Template editor dạng form trước.
- [ ] Làm Parent approval và Admin user management.
- [ ] Thêm test, accessibility và performance budget từ đầu.

## 23. Deliverables cuối kỳ đã được nêu

- Mobile App for Children.
- Parent Portal.
- Story Content Management Web System.
- Web Admin.
- Web API.
- User Requirements.
- Software Requirement Specification.
- Architecture Design.
- Detailed Design.
- System Implementation.
- Testing Document.
- Installation Guide.
- Source Code.
- Deployment Packages.

---

### Ghi chú cuối

Tài liệu này chủ động tách **yêu cầu đã có trong nguồn** khỏi **đề xuất triển khai**. Khi một quyết định P0/P1 được chốt, nên cập nhật lại file này và đồng thời phản ánh quyết định đó vào SRS, ERD, OpenAPI và backlog để tránh bốn nguồn mô tả hệ thống khác nhau.
