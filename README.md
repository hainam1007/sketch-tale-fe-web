# SketchTale Web

SketchTale là hệ thống kể chuyện tương tác từ tranh vẽ của trẻ. Repository này chứa web frontend dùng cho khách truy cập, Parent, Content Manager và Admin; ứng dụng Child thuộc mobile app riêng. Sản phẩm hiện hướng tới trẻ 6–10 tuổi.

## Chạy local

Yêu cầu Node.js 20.19+ hoặc 22.12+.

```sh
cp .env.example .env.development
npm ci
npm run dev
```

Với PowerShell, có thể dùng `Copy-Item .env.example .env.development` thay cho `cp`. Vite không tự nạp `.env.example`; cần tạo `.env.development` trước khi chạy dev server. Cấu hình mẫu bật API thật cho đăng nhập và Content Manager. Các phần chưa tích hợp API vẫn dùng mock theo cấu hình mặc định. Tạo tài khoản hợp lệ trên backend để đăng nhập bằng API.

Các lệnh kiểm tra có trong `package.json`:

```sh
npm run lint
npm run build
npm test
```

Bản preview sau build chạy bằng `npm run preview`. Xem [kiến trúc, cấu hình và kiểm thử](docs/ARCHITECTURE.md) để chọn bộ test phù hợp. Kết quả local không thay cho nghiệm thu API trên Render.

## Khu vực ứng dụng

- **Public/Auth:** landing, truyện mẫu, thông tin gói và các luồng tài khoản.
- **Parent:** chọn hồ sơ bé để quản lý cài đặt, duyệt nội dung, thư viện, tiến độ, gói và xuất truyện.
- **Content Manager:** tạo và xuất bản truyện, trang, vai/slot, từ vựng, quiz và media.
- **Admin:** catalog gói/credit/chủ đề, người dùng, quyền, báo cáo, giới hạn, an toàn nội dung và giám sát.

Frontend dùng React 19, Vite 8, JavaScript/JSX, React Router, TanStack Query, CSS và Playwright. Source chính nằm trong `src/app`, `src/features`, `src/lib/api` và `src/mocks`.

## API và mock

API có sẵn và contract đủ rõ dùng API thật theo từng operation. Chức năng chưa có API tiếp tục dùng mock ở cả local và production, có nhãn **“Dữ liệu mô phỏng”**. Lỗi từ API thật không được tự chuyển sang mock.

Một số API đã có adapter trong source, nhưng chưa được kiểm tra đầy đủ trên Backend thật. Parent/Child profile đã có adapter thật và mặc định bật khi `VITE_API_MODE=real`; ownership vẫn cần nghiệm thu trên backend. Admin reports có adapter đọc thật; Admin core và các field editor chưa có API tiếp tục mock. Xem [kiến trúc hiện tại](docs/ARCHITECTURE.md) và [mục lục tài liệu](docs/README.md) để biết trạng thái cụ thể.

Không chép token hoặc secret vào tài liệu. Cấu hình môi trường chỉ chọn nguồn dữ liệu; không dùng cờ frontend thay cho kiểm tra quyền của Backend.

## Tài liệu

Mở [docs/README.md](docs/README.md) để xem danh sách tài liệu còn backlog, contract cần chốt và điều kiện nghiệm thu. [design/ASSETS.md](design/ASSETS.md) ghi tình trạng tài nguyên hình ảnh/thương hiệu.

Các minh họa hiện tại là prototype. Trước phát hành cần dùng asset thương hiệu và tranh truyện được duyệt, xác nhận nội dung/chính sách public, chạy kiểm tra trên môi trường triển khai và chỉ gỡ `noindex` khi bản public được duyệt.
