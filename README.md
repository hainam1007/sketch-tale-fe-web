# SketchTale public website

React 19 + Vite 8, JavaScript/JSX, React Router và CSS thuần. Giao diện tiếng Việt cho phụ huynh có trẻ 3–6 tuổi, theo [Public Website.md](docs/Public%20Website.md).

## Chạy dự án

```sh
npm install
npm run dev
```

```sh
npm run lint
npm run build
npm run preview
npm test
```

Playwright dùng Chrome đã cài trên máy (`channel: chrome`); máy CI cần cài Chrome hoặc đổi sang Chromium trong `playwright.config.js`. Bộ test tự khởi động Vite ở `127.0.0.1:5173`. Ảnh giao diện và báo cáo nằm trong `artifacts/`.

## Đã triển khai

- Trang chủ đủ tám phần, menu mobile/Escape/focus, anchor, footer và 404.
- Kệ truyện minh họa ba truyện ngay trên landing; không còn route public riêng cho thư viện hoặc reader.
- Demo phụ huynh trên landing với hồ sơ Mây/Nắng, chọn danh mục và thời gian riêng; tab dùng được bằng phím mũi tên, Home/End.
- Các trang giới thiệu, FAQ, liên hệ, chính sách dự thảo và form đăng nhập/đăng ký/quên mật khẩu minh họa.
- Shared workspace đã có session mock, guard theo role và shell cho Parent, Content Manager, Admin; tài khoản demo login vào đúng khu vực.
- Parent M1 đã có danh sách/tạo/sửa hồ sơ bé, selector theo URL, quota trả về từ mock API và các trạng thái empty/error/validation.
- G2 đã có Admin quản lý tài khoản với search/filter/detail/lock-unlock và Content Manager tạo/sửa story draft, chọn cover asset, lọc story và mock upload asset.
- G3 đã có Story Editor theo tab Metadata/Pages/Roles–Slots/Vocabulary/Quiz/Preview; draft lưu revision, validate/publish tạo version snapshot, hide và phát hiện draft lệch version publish.
- G4 đã có Parent Settings/Approval/Library theo từng child và Admin Content Reports với workflow open → under review → resolved/rejected, có revision conflict mock và E2E.
- G5 đã có Parent Plan/Usage theo entitlement server; Admin Permissions, System Limits, Restrictions, Monitoring; và Asset Library với validate loại/dung lượng, preview, progress, filter cùng trạng thái upload.
- G6 đã có Parent Progress/Dashboard theo aggregate API với date range và partial error; Content Statistics; Admin Statistics và Audit Viewer read-only có filter actor/action/time.
- G7 đã có Parent Export workspace theo mock contract: create/list/detail, queued/processing/failed/completed/expired, retry, download link, idempotency key và quota Free/Pro/Family; Family Learning Report có trạng thái/cấu hình rõ ràng nhưng việc tạo và gửi email vẫn pending backend thật.
- So sánh Free, Pro **35.000đ/tháng** và Family **89.000đ/tháng**, cập nhật theo người dùng ngày 17/09/2026.
- Responsive, focus/skip link, giảm chuyển động, Nunito tự host, WebP và noindex cho prototype.

## Cấu trúc

`src/app/App.jsx` chứa routing; `src/styles` chứa tokens, font và CSS; `src/features/public` chứa layout, component, trang, fixture và service; `src/features/auth` chứa form auth minh họa.

`publicService` hiện trỏ tới `mockPublicService`. Khi có backend, thay adapter giữ nguyên shape frontend. Kệ truyện, nội dung dành cho phụ huynh và bảng giá hiện được trình bày trực tiếp trên landing bằng các anchor `#stories`, `#parents` và `#pricing`.

## Ranh giới prototype

Chưa có backend thật, thanh toán, cấp quyền gói, tạo nhân vật AI, xuất video, audio, tài khoản thật hoặc gửi email/liên hệ. Login Parent/Content/Admin dùng mock API; chỉ `userId` của phiên được lưu để refresh demo, không lưu mật khẩu. Đăng ký và quên mật khẩu vẫn chỉ kiểm tra biểu mẫu. Dữ liệu hồ sơ demo dùng session storage theo tài khoản để mô phỏng ownership và refresh.

Family có **100 lượt tạo nhân vật AI/tháng** và 1 lần regenerate mỗi tranh. Danh sách 5 truyện Free, cơ chế chia sẻ/reset hạn mức, regenerate, nâng/hạ gói và gia hạn/hủy/hoàn tiền cần backend/nghiệp vụ xác nhận. Ba truyện công khai không đại diện danh sách năm truyện của gói Free.

Ảnh và logo hiện là bản prototype từ ImageGen dựa trên tham chiếu; cần asset thương hiệu xuất từ nguồn thiết kế và tranh riêng từng trang trước phát hành. Xem [design/ASSETS.md](design/ASSETS.md).

## Trước khi phát hành

Hosting cần rewrite mọi URL không phải asset về `/index.html` để refresh route trực tiếp. Chốt domain, prerender/metadata chia sẻ, OG image và chính sách chính thức; chỉ bỏ `noindex` cùng `robots.txt` chặn index khi bản phát hành được duyệt. Không dùng cờ frontend để quyết định quyền truy cập trả phí.

Đo Lighthouse trên production preview ở port 4173 bằng `node scripts/lighthouse.mjs` (đường dẫn Chrome trong script dành cho Windows). Kết quả chỉ phản ánh lần đo cục bộ, không thay thế đo trên môi trường triển khai thật.
