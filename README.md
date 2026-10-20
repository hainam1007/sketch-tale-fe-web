# SketchTale Web

SketchTale là hệ thống kể chuyện tương tác từ tranh vẽ của trẻ. Repository này chứa web frontend dùng cho khách truy cập, Parent, Content Manager và Admin; ứng dụng Child thuộc mobile app riêng. Sản phẩm hiện hướng tới trẻ 6–10 tuổi.

## Chạy local

```sh
npm install
npm run dev
```

Các lệnh kiểm tra có trong `package.json`:

```sh
npm run lint
npm run build
npm test
```

Bản preview sau build chạy bằng `npm run preview`. Kiểm tra trạng thái và giới hạn mới nhất trước khi dùng kết quả test để nghiệm thu API; các thay đổi tích hợp ngày 19/10/2026 chưa được lint/build/E2E hoặc kiểm tra trên Render.

## Khu vực ứng dụng

- **Public/Auth:** landing, truyện mẫu, thông tin gói và các luồng tài khoản.
- **Parent:** chọn hồ sơ bé để quản lý cài đặt, duyệt nội dung, thư viện, tiến độ, gói và xuất truyện.
- **Content Manager:** tạo và xuất bản truyện, trang, vai/slot, từ vựng, quiz và media.
- **Admin:** catalog gói/credit/chủ đề, người dùng, quyền, báo cáo, giới hạn, an toàn nội dung và giám sát.

Frontend dùng React 19, Vite 8, JavaScript/JSX, React Router, TanStack Query, CSS và Playwright. Source chính nằm trong `src/app`, `src/features`, `src/lib/api` và `src/mocks`.

## API và mock

API có sẵn và contract đủ rõ dùng API thật theo từng operation. Chức năng chưa có API tiếp tục dùng mock ở cả local và production, có nhãn **“Dữ liệu mô phỏng”**. Lỗi từ API thật không được tự chuyển sang mock.

Một số API đã có adapter trong source, nhưng chưa được kiểm tra đầy đủ trên Backend thật. Parent profile/child profile vẫn mock do backend thiếu kiểm tra ownership; Admin core và các field editor chưa có API cũng tiếp tục mock. Xem [tổng quan dự án](docs/PROJECT_SUMMARY.md) và [runbook nối API](docs/LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md) để biết trạng thái cụ thể.

Không chép token hoặc secret vào tài liệu. Cấu hình môi trường chỉ chọn nguồn dữ liệu; không dùng cờ frontend thay cho kiểm tra quyền của Backend.

## Tài liệu

Mở [docs/README.md](docs/README.md) để xem danh sách tài liệu còn backlog, contract cần chốt và điều kiện nghiệm thu. [design/ASSETS.md](design/ASSETS.md) ghi tình trạng tài nguyên hình ảnh/thương hiệu.

Các minh họa hiện tại là prototype. Trước phát hành cần dùng asset thương hiệu và tranh truyện được duyệt, xác nhận nội dung/chính sách public, chạy kiểm tra trên môi trường triển khai và chỉ gỡ `noindex` khi bản public được duyệt.