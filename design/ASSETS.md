# Tài nguyên giao diện SketchTale

> Rà soát: 19/10/2026. Các minh họa hiện dùng cho prototype; bộ asset thương hiệu và nội dung xuất bản chính thức vẫn chưa hoàn tất.

- Hai bảng nhận diện gốc được cung cấp ngoài repository trong thư mục Downloads trên máy làm thiết kế; đường dẫn cụ thể không được dùng như đường dẫn dùng chung trong project.
- `source/logo.png`: bản tách tham chiếu bằng ImageGen từ logo ngang; cần đối chiếu và thay bằng bản xuất thiết kế gốc để bảo đảm chính xác nhận diện.
- `source/hero.png`: minh họa mới dựa trên mèo trắng–vàng, khăn coral và huy hiệu ngôi sao trong bảng nhận diện.
- `source/rabbit.png`, `seed.png`, `stars.png`: minh họa truyện demo, chưa được duyệt làm nội dung xuất bản. Mỗi truyện hiện dùng một tranh chung cho ba trang chữ; cần tranh riêng theo trang khi hoàn thiện nội dung.
- `public/images/*.webp`: bản chuyển định dạng để sử dụng trên web; `node scripts/optimize-assets.mjs` tạo lại từ ảnh nguồn.
- `public/favicon.png`: biểu tượng sách/bút tách theo bảng logo bằng ImageGen.
- `public/fonts`: Nunito variable gồm Latin và Vietnamese, có giấy phép OFL kèm theo.

Asset ImageGen không thay thế file vector thương hiệu gốc. Bộ ảnh Open Graph 1200×630, domain production và audio được duyệt chưa có trong repository. Không bật giọng đọc giả trong reader.