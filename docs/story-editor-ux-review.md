# Rà soát trải nghiệm chỉnh sửa truyện

Ngày: 28/10/2026. Góc nhìn: Content Manager chỉnh sửa nhiều truyện liên tục.

## Các điểm đã xử lý

| Vấn đề | Thay đổi | Lợi ích khi làm việc hằng ngày |
| --- | --- | --- |
| Tiêu đề, thống kê và trạng thái chiếm nhiều hàng | Thu gọn đầu trang, gom thống kê và trạng thái lưu | Thấy nội dung form sớm hơn trên laptop |
| Phải nhớ số trang, nhân vật và nội dung học tập | Hiển thị số lượng ngay trên tab | Kiểm tra nhanh trước khi chuyển mục |
| Cuộn xuống thì mất điều hướng | Thanh tab bám phía trên | Chuyển mục thuận tiện với form dài |
| Nút Ẩn truyện đứng cạnh Xuất bản | Đưa vào menu Thao tác khác, giữ xác nhận hiện có | Giảm nguy cơ bấm nhầm thao tác ảnh hưởng người đọc |
| Chờ danh mục làm biến mất toàn bộ form | Form hiển thị ngay; chỉ khóa danh mục và lưu trong lúc tải | Nhập tên, mô tả trong thời gian chờ |
| Lỗi danh mục khiến không thể tiếp tục xem bản thảo | Lỗi và nút Thử lại hiển thị trong form | Thử lại mà không làm mất nội dung đang nhập |
| Nút Hủy thực tế chuyển sang Dựng truyện | Đổi thành Sang dựng truyện trong trang chỉnh sửa | Nhãn phản ánh đúng hành động |
| Khó tìm thao tác lưu trên form dài | Thanh lưu bám đáy, trạng thái thay đổi và Ctrl/Cmd+S | Lưu nhanh, tránh gửi lại khi không có thay đổi |
| Danh sách 20 hiệu ứng khó tìm | Tìm tên/mô tả bằng tiếng Việt có hoặc không dấu | Tìm nhanh nhóm trượt, xoay, rung |
| Hiệu ứng bị khóa nhưng không rõ lý do | Hướng dẫn chọn nhân vật ngay trong bảng | Hiểu bước cần làm tiếp theo |
| Trạng thái truyện mẫu mất sau khi sửa thông tin | Dùng đúng trạng thái theo chế độ API | Nhãn trạng thái vẫn chính xác sau khi lưu |

## Kiểm chứng

- Playwright: lưu bằng bàn phím, tải lại dữ liệu, giữ trạng thái truyện, cảnh báo rời bản thảo, danh mục tải chậm, tìm hiệu ứng không dấu.
- Kiểm tra tràn ngang và ảnh chụp ở 1366, 768, 390 px.
- Kiểm thử toàn vẹn dữ liệu: xóa nhân vật, clip liên quan, từ vựng/câu hỏi tham chiếu trang không tồn tại.
- Build Vite và lint các file sửa.

Các tương tác ghi dữ liệu được kiểm thử bằng API mock; không xuất bản hay ẩn truyện thật trong quá trình đánh giá. Bố cục, danh mục API thật và ảnh tải từ máy dùng chung các thành phần đã sửa, nhưng không thay thế cho kiểm thử tích hợp với máy chủ thật.
