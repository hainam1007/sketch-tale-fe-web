# Demo truyện trên máy

Trong **Dựng truyện**, bấm **Lưu demo trên máy**, đợi thông báo thành công rồi bấm **Đọc demo**. Bản demo lấy cả các chỉnh sửa đang mở chưa gửi lên API. Sau mỗi lần chỉnh sửa thêm, lưu demo lại để cập nhật.

Snapshot lưu trong IndexedDB theo tài khoản và story ID: toàn bộ trang, vai/vị trí nhân vật, ảnh phụ, phụ đề, timeline/animation và track âm thanh. Các tệp ảnh/âm thanh đang dùng được sao chép vào IndexedDB; đọc lại tạo blob URL mới. Chỉ thay snapshot cũ khi toàn bộ tệp đã lưu thành công. Lỗi lưu giữ snapshot cũ.

URL đọc: `/content/stories/{storyId}/preview?localDemo=1`. Layout, preview và asset hook lấy bản demo local, không gọi API truyện/asset. Người dùng vẫn phải đăng nhập ứng dụng; đây không phải bản triển khai ứng dụng offline hay xuất bản lên server. Giữ nguyên trình duyệt/profile và địa chỉ localhost (kể cả port); xóa dữ liệu trang sẽ xóa bản demo. Để demo, mở sẵn trang đọc và bật **Tự phát các trang**, sau đó bấm **Phát trang**.

Kiểm tra: `npx playwright test --config playwright.editor.config.js tests/story-editor-local-demo.spec.js`. Bao gồm đọc lại sau reload, ảnh giải mã từ blob, audio bytes, timeline/phụ đề, phân tách tài khoản, giữ bản cũ khi thiếu media và trang đọc demo.

Backend đã có `CompositionJson`; luồng này phục vụ demo local và không giải quyết đồng bộ JSON chung với Backend/Mobile.
