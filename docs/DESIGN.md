# SketchTale — Tổng hợp tài liệu thiết kế

> Cập nhật: 01/10/2026. Tổng hợp từ tài liệu và code hiện có; không phải một bộ thiết kế mới hoặc xác nhận UI đã nghiệm thu.

## 1. Thiết kế hiện nằm ở đâu?

Dự án đã có tài liệu thiết kế, nhưng trước đây phân tán trong kế hoạch public và từng role. File này là đầu mối tra cứu chung; đặc tả chi tiết tiếp tục được duy trì tại nguồn để tránh nhân bản quy tắc.

| Phạm vi | Nguồn | Nội dung |
| --- | --- | --- |
| Thương hiệu và public | [Public Website.md](<Public Website.md>), mục 2–9 | Logo/mascot, màu, typography, responsive, sitemap, section và component |
| Parent Portal | [PARENT_IMPLEMENTATION_PLAN.md](PARENT_IMPLEMENTATION_PLAN.md), mục 9–14 | Định hướng UI, từng trang, luồng xuyên trang và tiêu chí bàn giao |
| Content Manager | [CONTENT_MANAGER_IMPLEMENTATION_PLAN.md](CONTENT_MANAGER_IMPLEMENTATION_PLAN.md), mục 11–15 | Audit, chuẩn thiết kế, 11 trang, backlog và nghiệm thu editor |
| Admin | [ADMIN_IMPLEMENTATION_PLAN.md](ADMIN_IMPLEMENTATION_PLAN.md), mục 8–14 | Audit, shell, bảng/filter/form, 11 trang và kiểm chứng |
| Ảnh và font | [ASSETS.md](../design/ASSETS.md) | Nguồn ảnh, tài nguyên prototype và giới hạn sử dụng |
| Phạm vi và tiến độ | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md), [WEB_IMPLEMENTATION_PLAN.md](WEB_IMPLEMENTATION_PLAN.md) | Nghiệp vụ, route, hiện trạng code và kế hoạch tích hợp |

Chưa thấy file Figma hoặc liên kết Figma trong bộ tài liệu được rà soát. `design/source/` chứa ảnh nguồn; `artifacts/` chứa ảnh chụp giao diện để đối chiếu, không phải bộ màn hình thiết kế đã duyệt.

## 2. Nền tảng thị giác đang dùng

Nguồn token thực thi: [tokens.css](../src/styles/tokens.css). Public dùng tinh thần sách tranh, nền sáng ấm, logo và mascot SketchTale. Workspace giữ nhận diện chung nhưng ưu tiên đọc dữ liệu, form và thao tác nghiệp vụ.

| Token | Giá trị hiện tại | Vai trò |
| --- | --- | --- |
| `--color-primary` | `#f7bd35` | Vàng thương hiệu |
| `--color-background` | `#fff9ec` | Nền kem |
| `--color-surface` | `#ffffff` | Bề mặt trắng |
| `--color-text-primary` | `#001050` | Chữ chính navy |
| `--color-text-secondary` | `#6b7280` | Chữ phụ |
| `--color-blue` | `#46dcf7` | Màu nhấn xanh |
| `--color-coral` | `#fc6c78` | Màu nhấn coral |
| `--color-border` | `#e9e9ef` | Đường viền |
| Radius input/card/button | `10px` / `20px` / `999px` | Token nền; từng module có thể định nghĩa riêng |

Font dùng Nunito Variable với tiếng Việt; icon dùng Phosphor. Các màu nhấn không mặc nhiên đạt tương phản cho chữ nhỏ; kiểm tra theo cặp màu thực tế. Không tạo thêm một bảng màu độc lập trong tài liệu này.

## 3. Bố cục và nguồn code

| Khu vực | Nguồn giao diện chính | Hiện trạng |
| --- | --- | --- |
| Public | `src/features/public/components/landing/landing.css`, `src/features/public/pages/HomePage.jsx` | 8 section; FAQ là trang riêng; các section stories/parents/pricing dùng anchor |
| Auth | `src/features/auth/pages/AuthPage.jsx`, `auth.css` cùng thư mục | Form và minh họa; login mock, register/forgot chỉ validate |
| Workspace chung | `src/app/layouts/WorkspaceLayout.jsx`, `workspace.css` | Shell và menu theo role, trang tổng quan riêng cho ba khu vực |
| Parent | `src/features/parent/parent.css`, `layouts/ChildWorkspaceLayout.jsx` | Tổng quan gia đình, danh sách bé và điều hướng tác vụ theo bé |
| Content | `src/features/content/` | Danh sách truyện, editor theo tab, kho asset, preview và thống kê |
| Admin | `src/features/admin/pages/`, workspace CSS | Tổng quan, bảng quản trị, chi tiết, form cấu hình và audit |
| Profile | `src/features/profile/pages/ProfilePage.jsx`, `src/features/profile/profile.css` | Thông tin tài khoản chỉ đọc, phiên demo và shortcut theo role |

## 4. Quy ước khi hoàn thiện thiết kế

- Tách trạng thái loading, empty, error/retry, forbidden, saving và success theo dữ liệu thật của màn hình.
- Bảo vệ dữ liệu form chưa lưu; lỗi validation gắn với field, lỗi mutation không được báo thành công. Publish/preview phải thể hiện rõ draft và bản đã lưu.
- Bảng và editor phải dùng được trên màn nhỏ; hành động bằng icon có tên truy cập; focus và thao tác bàn phím cần được kiểm tra.
- Giữ scope trẻ 6–10 tuổi và tài khoản Child độc lập. Web register hiện dành cho Parent; không mô tả flow liên kết account như đã hoàn thiện khi chưa có contract.
- Label KPI phản ánh đúng phạm vi dữ liệu. Content overview hiện truy vấn 5 truyện gần đây, không phải thống kê toàn kho.
- Tách ba mức tiến độ: đã có code/mock, đã tích hợp API, đã kiểm chứng trên staging. Screenshot không tự đóng tiêu chí nghiệm thu.

## 5. Việc còn cần xác nhận

- Đối chiếu logo prototype với bản vector gốc; bổ sung ảnh từng trang truyện và audio đã duyệt theo `ASSETS.md`.
- Kiểm chứng responsive, tương phản, focus/keyboard và các trạng thái lỗi theo checklist từng role.
- Đồng bộ bản thiết kế với contract Parent–Child, permission, story revision/publish, asset storage, quota và export.
- Khi tài liệu cũ khác code, ghi rõ đó là thiết kế mục tiêu hay hiện trạng. Thay đổi layout/token phải cập nhật nguồn tương ứng và đầu mối này nếu ảnh hưởng nhiều khu vực.
