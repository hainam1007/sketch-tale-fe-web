# Parent experience v2 — kế hoạch màn hình và API bàn giao

Ngày: 23/10/2026. Tài liệu này thay thế hướng dùng màn “Sắp ra mắt” trong bản kế hoạch trước. Yêu cầu mới: giao diện đầy đủ để demo, giữ API hồ sơ/danh mục thật và mô phỏng nghiệp vụ chưa có API.

## Nguyên tắc sản phẩm

Phụ huynh cần chọn đúng bé, biết nên làm gì tiếp theo và thấy thay đổi đã được lưu. Mỗi bé có màu/biểu tượng riêng. Các nhãn như Age8to10 được trình bày thành độ tuổi dễ đọc. Dữ liệu học tập, cài đặt bổ sung, duyệt nhân vật, yêu thích và bản xuất được đánh dấu minh họa; không gửi mutation vào backend. Dữ liệu demo tách theo userId/childId và giữ trong sessionStorage của tab trình duyệt.

## Cấu trúc đã triển khai

| Màn | Nội dung và thao tác |
|---|---|
| Tổng quan gia đình | Chào ngắn gọn, thẻ từng bé có icon/màu, độ tuổi, giới hạn thật, nút thêm bé; lối tắt thư viện/báo cáo/gói; gợi ý trò chuyện sau khi đọc |
| Tổng quan bé | Thống kê 7/30 ngày, thời gian đọc theo ngày/tuần, mục tiêu, gợi ý đồng hành và lối tắt cần xử lý |
| Hồ sơ | Biểu tượng, ngày sinh, nhịp đọc demo; tên hiển thị và giới hạn thời gian/nhân vật dùng API thật, phản hồi lưu/lỗi/hoàn tác |
| Báo cáo | Thời gian đọc, truyện hoàn thành, từ mới, tỷ lệ trả lời đúng; biểu đồ, điểm mạnh, nội dung cùng luyện tập; tải báo cáo minh họa TXT |
| Cài đặt | Mục tiêu đọc, giờ đọc và bật/tắt nhắc, chủ đề yêu thích, yêu cầu bố mẹ duyệt, quyền chia sẻ; lưu demo riêng từng bé |
| Phê duyệt | Danh sách nhân vật minh họa, ảnh, trạng thái, lọc chờ/đồng ý/từ chối; thử cả quyết định đồng ý và từ chối |
| Tủ truyện | Truyện đang đọc/đã đọc, tiến độ, bật/tắt yêu thích; gợi ý từ thư viện của bố mẹ |
| Bản xuất | Chọn truyện và PDF/video, tạo bản ghi demo, lịch sử, tải tệp TXT minh họa; không tạo PDF/video giả |
| Báo cáo gia đình | Chọn một bé rồi mở báo cáo riêng; không gộp dữ liệu các bé vào cùng một kết quả học tập |
| Gói sử dụng | Bỏ bảng “So sánh nhanh” và nút “Xem các gói”; mỗi gói có CTA chọn để chuyển checkout |
| Thanh toán | Giữ đúng gói đã chọn kể cả reload; chọn ví/chuyển khoản/thẻ; tóm tắt quyền lợi; kịch bản thành công/thất bại/hủy, thử lại; không thu thông tin thẻ hoặc gửi giao dịch thật |
| Thư viện | Tiêu đề gần gũi, tìm kiếm có hỗ trợ bỏ dấu, lọc chủ đề bằng tiếng Việt, sắp xếp A–Z, lưu truyện, bìa lỗi có fallback, không hiện “0 trang” khi thiếu dữ liệu; chi tiết và gợi ý cho bé |

## API thật đang dùng

- Auth/khôi phục phiên hiện có.
- GET /api/child-profiles; GET và PUT /api/child-profiles/{id}.
- POST /api/auth/register/child.
- GET /api/story-template/stories, /stories/{id}; GET /api/education-themes.
- GET /api/subscription-plans.

Swagger snapshot: `artifacts/swagger-parent-2026-10-23.json` (118 operations). Response ChildProfile vẫn cần xác nhận runtime, quyền sở hữu lấy từ backend. Không tạo endpoint giả trong route allowlist.

## API cần bổ sung hoặc chốt contract

| Nhóm | Nhu cầu backend | Ghi chú |
|---|---|---|
| Hồ sơ mở rộng | Lưu/đọc avatar, ngày sinh, nhịp đọc | UpdateChildProfileDto đã có targetAgeGroup/readingLevel: chốt enum/semantics trước khi nối; không yêu cầu tạo lại API này. Avatar/ngày sinh chưa có trong DTO |
| Dashboard/báo cáo | Tổng quan từng bé, hoạt động ngày/tuần, khoảng thời gian, từ mới, câu đúng/tổng câu, truyện hoàn thành | Phải có nguồn ghi nhận từ Child; không xem sample data là dữ liệu thật |
| Mục tiêu và nhắc đọc | GET/PUT mục tiêu, lịch nhắc, múi giờ, trạng thái bật/tắt | Hệ thống gửi nhắc thực tế chưa được nối |
| Chủ đề/quyền | Lưu sở thích, nội dung được phép, quyền chia sẻ, yêu cầu duyệt | Phân biệt sở thích với hạn chế truy cập; cần thực thi ở Child |
| Phê duyệt | Danh sách/chi tiết theo childId, approve/reject có revision, lịch sử, quyền vai | Mapping nhân vật-truyện trong Swagger không thay thế đầy đủ workflow Parent |
| Thư viện riêng | Danh sách theo bé, bookmark/yêu thích, tiến độ đọc, gợi ý truyện | Demo hiện lưu riêng theo user/bé; cần API để đồng bộ thiết bị và phía Child |
| Bản xuất | Tạo job PDF/video, trạng thái, lịch sử, retry, URL tải hết hạn, quota | TXT hiện tại chỉ là tệp minh họa, không phải tài liệu xuất từ tác phẩm |
| Báo cáo tải về | Sinh báo cáo theo bé/khoảng ngày, tải báo cáo và lịch gửi định kỳ | Có thể gộp vào dịch vụ xuất báo cáo |
| Gói hiện tại | Mapping User → ParentProfile, subscription đang hiệu lực, entitlement/quota | CRUD subscription đã có; cần chốt mapping và nghiệp vụ, không dùng CRUD để giả thanh toán |
| Thanh toán | Tạo checkout/order, số tiền/currency, phương thức, trạng thái order, webhook xác thực, idempotency, thất bại/hủy, biên nhận | Chỉ backend xác nhận thanh toán thành công và cấp quyền; UI demo không kích hoạt subscription |

Contract đề xuất chi tiết cho các endpoint mới xem `docs/PARENT_MISSING_APIS_BACKEND.md`. Không mặc định đồng tiền từ số price nếu backend chưa công bố currency; demo giữ nguyên giá trong danh mục.

## Tham khảo thiết kế

- Epic Explore: https://www.getepic.com/explore — khám phá sách theo chủ đề và khả năng đọc, lấy bìa sách làm điểm bắt đầu.
- StoryWeaver: https://storyweaver.org.in/ur/faqs — lựa chọn sách theo mức đọc và nhu cầu của trẻ.

Áp dụng vào SketchTale: bố cục kệ truyện, bộ lọc gọn, phần giới thiệu ngắn, lưu/gợi ý cho bé; không sao chép nội dung hay thương hiệu của nguồn tham khảo.

## Giới hạn demo

Dữ liệu học tập được seed để trình bày trải nghiệm; không phải kết quả phân tích thật. sessionStorage không đồng bộ thiết bị và mất khi đóng phiên. Không gửi email/push, không xuất PDF/video, không xử lý tiền hoặc cấp gói. Giới hạn tài khoản thật vẫn dùng service hiện có. Cần kiểm thử quyền sở hữu với phiên Parent thật trước phát hành.

## Kết quả kiểm chứng

- Build production thành công; lint các file v2 sạch. Bundle ứng dụng chung vẫn có cảnh báo kích thước lớn.
- 6 test hồ sơ thật đã pass sau cập nhật đường dẫn tab Hồ sơ.
- 5 test v2 đã pass qua các lần chạy kiểm tra: 3 viewport 390/768/1366px (6 màn mỗi viewport), luồng demo xuyên suốt, và lưu avatar/tải báo cáo/tạo bản xuất/hủy thanh toán.
- Đã xem ảnh tổng quan desktop, tổng quan bé desktop, thư viện mobile và checkout mobile; sửa cách trình bày phần đơn vị giá để không phóng to chú thích.
- Luồng demo xác nhận không phát sinh request mutation backend. Các test dùng HTTP fixtures, không thay thế kiểm thử phiên Parent thật.
- Ảnh kiểm tra: `artifacts/parent-v2-{overview,child,report,plans,library,checkout}-{390,768,1366}.png`.
