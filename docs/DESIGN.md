# SketchTale — Design system và kế hoạch triển khai

> Cập nhật: **19/10/2026**. Hướng thiết kế: **thế giới truyện tranh sống động**, vàng chủ đạo + navy + nền kem/trắng, Nunito và chuyển động có mục đích.
>
> **Trạng thái:** palette vàng/navy/kem là hướng mục tiêu đã chốt; migration CSS còn chưa được nghiệm thu đồng đều trên các role/viewport. Source hiện có thay đổi UI đang làm; cần kiểm tra trực quan trước khi đánh dấu hoàn tất. Tài liệu này không xác nhận API đã nghiệm thu.
>
> **Phạm vi:** Public, Auth, Parent Portal, Content Manager, Admin và Profile trên web. Mobile Child có thể tham khảo nhận diện nhưng không thuộc đợt triển khai web này.

## 1. Mục tiêu và cách dùng

SketchTale giúp trẻ 6–10 tuổi biến tranh vẽ thành nhân vật trong truyện, đọc/nghe và học qua tương tác. Web phục vụ phụ huynh và người vận hành nội dung. Thiết kế cần sáng tạo, thân thiện, đáng tin cậy và hỗ trợ thao tác nghiệp vụ rõ ràng.

Tài liệu này là nguồn chung cho **quy tắc thị giác mới**. Tài liệu từng role tiếp tục sở hữu nghiệp vụ, permission, API và workflow. Khi quy tắc thị giác cũ khác tài liệu này, dùng thiết kế mục tiêu mới trong phạm vi migration; không tự thay đổi nghiệp vụ để khớp hình thức.

Phân biệt bốn trạng thái khi báo cáo: **đã đặc tả → đã code → đã kiểm chứng UI → đã kiểm chứng tích hợp**. Ghi rõ dữ liệu mock hay thật. Screenshot không chứng minh API đã tích hợp.

| Phạm vi | Tài liệu liên quan |
| --- | --- |
| Nghiệp vụ và phạm vi | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| Public | [Public Website.md](<Public Website.md>) |
| Parent | [PARENT_IMPLEMENTATION_PLAN.md](PARENT_IMPLEMENTATION_PLAN.md) |
| Content | [CONTENT_MANAGER_UI_UX_PLAN.md](CONTENT_MANAGER_UI_UX_PLAN.md), [CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md](CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md) |
| Admin | [ADMIN_UI_UX_PLAN_2026-10-17.md](ADMIN_UI_UX_PLAN_2026-10-17.md), [ADMIN_CONTRACT.md](ADMIN_CONTRACT.md) |
| Tích hợp | [LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md) |
| Asset | [ASSETS.md](../design/ASSETS.md) |

## 2. Baseline và định hướng

Dự án hiện dùng React + Vite, CSS thuần, React Router, TanStack Query, Nunito Variable self-host có tiếng Việt và Phosphor. Giữ nền tảng này; không cần đổi framework hoặc chuyển sang Tailwind để redesign.

Baseline hiện có vàng `#f7bd35`, nền kem `#fff9ec` và chữ navy `#001050`, cùng các token cũ trong module. Palette mục 4 là hướng mục tiêu; CSS và token thiết kế thử nghiệm đã được hoàn tác nên chưa được áp dụng đồng bộ.

Nguyên tắc thiết kế:

- **Truyện và tranh là trung tâm:** ưu tiên bìa truyện, tranh trẻ và nhân vật của dự án; minh họa không lấn át tác vụ.
- **Màu có nhiệm vụ:** vàng tạo nhận diện và nhấn hành động chính, navy dành cho chữ/icon/focus, nền kem/trắng hỗ trợ đọc; màu trạng thái chỉ diễn đạt kết quả nghiệp vụ.
- **Chữ tròn, phân cấp mạnh:** tiêu đề đậm, nội dung và bảng dễ quét; không dùng weight 800 cho mọi dòng.
- **Chuyển động phản hồi:** giải thích điều vừa thay đổi, không làm chậm thao tác.
- **Một hệ thống, nhiều mật độ:** cùng token và component, khác mức biểu cảm theo vai trò.

| Khu vực | Tính cách | Motion | Mật độ |
| --- | --- | --- | --- |
| Public | Tươi, nhiều hình ảnh, kể chuyện | Vừa; tập trung hero/section quan trọng | Thấp |
| Auth | Thân thiện, tập trung form | Thấp | Thấp |
| Parent | Ấm áp, rõ việc cần làm | Thấp–vừa, theo hành động | Vừa |
| Content | Không gian biên tập sáng rõ | Thấp | Vừa–cao |
| Admin | Chính xác, dễ kiểm tra | Thấp | Cao có kiểm soát |

Đợt này ưu tiên light theme phù hợp baseline. Dark mode là hạng mục riêng, cần palette và nghiệm thu riêng trước khi triển khai.

## 3. Tham khảo Duolingo

**Chỉ tham khảo font chữ và cách animation phản hồi tương tác. Không tham khảo bảng màu Duolingo; không dùng xanh lá/teal làm màu thương hiệu, CTA, điều hướng hoặc trang trí UI của SketchTale.**

[Typography chính thức](https://design.duolingo.com/identity/typography) mô tả Feather Bold cho tiêu đề, DIN Next Rounded cho nội dung và Nunito làm font thay thế. Feather Bold là font riêng của Duolingo. SketchTale tiếp tục dùng Nunito, không sao chép font độc quyền, logo hoặc nhân vật của họ.

[Bài viết về nhân vật](https://blog.duolingo.com/building-character/) mô tả animation gắn với phản hồi và mốc tiến bộ. SketchTale áp dụng nguyên tắc này cho tương tác và mascot của mình. Thông số component/motion bên dưới là **đề xuất riêng**, không phải thông số đo từ website Duolingo.

Không thêm streak, leaderboard hoặc gamification vào portal chỉ vì sản phẩm tham khảo có chúng. Bảo toàn phạm vi sản phẩm hiện tại.

## 4. Hệ màu mục tiêu

Đây là palette mục tiêu đã chốt, chưa phải trạng thái hiện tại của code. Lớp CSS dùng chung và semantic token thử nghiệm đã được gỡ; khi tiếp tục redesign, cần áp dụng palette này và rà màu hardcode riêng theo module.

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--color-brand` | `#F7BD35` | Vàng nhận diện, điểm nhấn |
| `--color-brand-soft` | `#FFF2C9` | Banner gia đình, vùng kể chuyện |
| `--color-action` | `#F7BD35` | Nền CTA chính |
| `--color-action-hover` | `#F0B630` | Hover CTA |
| `--color-action-edge` | `#B77900` | Cạnh nút, pressed depth; không dùng làm chữ mặc định |
| `--color-action-soft` | `#FFF2C9` | Nền tab/sidebar/selection đang chọn |
| `--color-action-foreground` | `#001050` | Chữ và icon trên CTA vàng |
| `--color-background` | `#FFF9EC` | Nền ứng dụng kem ấm |
| `--color-surface` | `#FFFFFF` | Bảng, form, card |
| `--color-text-primary` / `--color-text-strong` | `#001050` | Chữ navy, tiêu đề và icon chính |
| `--color-text-muted` | `#526077` | Metadata và mô tả |
| `--color-border` / `--color-border-subtle` | `#E4DFD3` | Phân vùng trang trí |
| `--color-control-border` | `#718494` | Biên nhận diện control khi cần |
| `--color-focus` | `#001050` | Focus ring navy trên nền sáng |
| `--color-success` / `--color-success-soft` | `#216E45` / `#E9F6EE` | Thành công |
| `--color-warning` / `--color-warning-soft` | `#805400` / `#FFF4CC` | Cần chú ý |
| `--color-danger` / `--color-danger-soft` | `#B42332` / `#FFF0F1` | Lỗi, thao tác nguy hiểm |
| `--color-info` / `--color-info-soft` | `#001050` / `#F2F3F7` | Thông tin trung tính theo navy |

Quy tắc phối màu:

- CTA chính nền vàng, chữ/icon navy ở cả default, hover và pressed. Không giữ chữ trắng từ CTA teal cũ khi đổi nền sang vàng. Link dùng navy và có dấu hiệu tương tác rõ; không dùng chữ vàng trên nền sáng.
- Public có thể dùng mảng vàng lớn; workspace ưu tiên nền trung tính, màu tập trung ở điều hướng và hành động.
- Một vùng tác vụ có một CTA chính; thao tác phụ dùng outline hoặc text button.
- Badge luôn có nhãn, có thể kèm icon. Màu category khác màu trạng thái; không truyền đạt thông tin chỉ bằng màu.
- `--color-border` dùng cho divider/trang trí, không mặc định đủ tương phản để nhận diện input. Dùng token control phù hợp và kiểm tra cặp màu thực tế.
- Giữ `--color-primary` theo vàng thương hiệu. Active tab/sidebar dùng nền vàng nhạt, chữ navy và indicator navy. Focus dùng navy với offset; điều chỉnh ring trên nền navy. Không dùng màu cạnh nút thay màu chữ/link.
- Xanh lá chỉ dành cho trạng thái thành công thực tế, ví dụ đã lưu/đã duyệt. Nút “Lưu”, “Phê duyệt”, progress thường và card trang trí vẫn theo vàng/navy. Warning có nhãn/icon để phân biệt với vàng thương hiệu; danger dùng đỏ theo ngữ nghĩa.
- Giữ màu tự nhiên trong bìa truyện, tranh vẽ và mascot. Không lấy xanh lá/teal từ minh họa để tô CTA, điều hướng hoặc vùng chọn. Biểu đồ nhiều chuỗi chỉ thêm màu khi dữ liệu cần, kèm nhãn và chú giải.

Các cặp màu phải được kiểm tra trong UI thực tế trước nghiệm thu; bảng mã màu không phải chứng nhận accessibility.

## 5. Typography

Giữ `"Nunito Variable", Nunito, system-ui, sans-serif`, self-host Latin và Vietnamese tại `src/styles/fonts.css`, với `font-display: swap`. Không thêm font CDN chỉ để thử phong cách mới.

| Vai trò | Desktop | Mobile | Weight | Line-height |
| --- | --- | --- | --- | --- |
| Hero | 48–64px | 32–40px | 900–1000 | 1.15–1.2 |
| Tiêu đề trang | 28–36px | 24–28px | 800–900 | 1.25 |
| Tiêu đề section | 22–28px | 20–24px | 800 | 1.3 |
| Tiêu đề component | 18–20px | 18px | 800 | 1.35 |
| Nội dung | 16px | 16px | 400–600 | 1.5–1.65 |
| Bảng, label | 14–16px | 14–16px | 500–700 | 1.45–1.5 |
| Button | 15–16px | 15–16px | 800 | 1.25 |
| Caption | 13–14px | 13–14px | 500–600 | 1.45 |

- Heading lớn có thể dùng tracking `-0.02em`; body giữ bình thường. Không ép heading tiếng Việt thành một dòng.
- Hero ưu tiên thông điệp ngắn, khoảng 2–3 dòng desktop; kiểm tra ở laptop 1366 × 768.
- Paragraph rộng khoảng 60–70 ký tự mỗi dòng; không text justify.
- Dùng `font-variant-numeric: tabular-nums` cho KPI, thời gian và cột số.
- Kiểm tra chuỗi nhiều dấu như “Phê duyệt nhân vật”, “Cài đặt quyền sử dụng”; không cắt dấu do fixed height hoặc overflow.
- Dùng sentence case tự nhiên; không ép toàn bộ UI viết thường theo thương hiệu tham khảo.

## 6. Layout, spacing và hình khối

- Spacing scale: **4, 8, 12, 16, 24, 32, 48, 64, 80, 96px**. Dùng token thay các giá trị tùy ý lặp lại.
- Public container tối đa 1200px; workspace thông thường tối đa 1440px. Editor có thể full width trong shell.
- Gutter: 16px mobile, 24px tablet, 32px desktop. Public section cách nhau 64–96px desktop và 40–56px mobile.
- Breakpoint tham chiếu: 640 / 768 / 1024 / 1280px. Chuyển layout dựa trên nội dung thực tế.
- Radius: input 12px, button 14px, card 20px, dialog 24px, badge/avatar pill. Pill button dành cho chip/filter, không mặc định mọi nút.
- Input/button chuẩn cao 44–48px; CTA public có thể 52px. Toolbar dense có thể 36–40px khi phù hợp thiết bị trỏ, vẫn đáp ứng tiêu chí vùng chạm.
- Card thường dùng viền mảnh; shadow cho tương tác hoặc lớp nổi. Không bọc mọi đoạn nội dung trong card.
- Page header có title, mô tả ngắn và action group; mobile wrap theo thứ tự đọc, không để action che title.
- Sidebar chuyển drawer trên màn nhỏ, có focus management. Bảng rộng cuộn trong vùng riêng, không làm cả trang tràn ngang.
- Form nhỏ ưu tiên một cột; form dài chia nhóm có heading. Editor giữ danh tính truyện và trạng thái lưu khi đổi tab.

## 7. Component contract

Ưu tiên chuẩn hóa component hiện có trước khi tạo abstraction. `src/components/ui/StatusBadge.jsx` và `src/components/feedback/States.jsx` là điểm bắt đầu. Tên component mới dưới đây là đề xuất.

| Component | Thiết kế và hành vi |
| --- | --- |
| Button | Primary vàng chữ navy, secondary viền navy nền trắng, ghost chữ navy, danger đỏ; đủ hover/focus/active/disabled/loading; pending ngăn gửi trùng, giữ chiều rộng và nhãn có nghĩa |
| CTA có chiều sâu | Dành cho Public và hành động chính phù hợp ở Parent; cạnh dưới 3px, nhấn hạ 2–3px; Admin dùng nút phẳng |
| Input/Textarea | Label luôn nhìn thấy, helper/error gắn field; placeholder không thay label; lỗi có chữ và `aria-invalid` |
| Select/Dropdown | Trigger/option đồng bộ; native fallback cho select; giữ keyboard, value và focus-visible; không áp dụng menu semantics cho select |
| Card truyện | Bìa nổi bật, tỷ lệ nhất quán trong cùng danh sách, title và metadata gọn; không lồng button trong link |
| StatusBadge | Mapping trạng thái domain sang semantic tone và nhãn tiếng Việt; không suy ra trạng thái bằng màu |
| Tabs | Indicator và trạng thái truy cập; tab nội dung theo keyboard pattern, route navigation dùng link |
| Table/FilterBar | Header rõ, số căn phải, filter có reset; action không chỉ hiện khi hover; empty và search-empty tách nhau |
| Dialog/Drawer | Tên truy cập, focus trap, trả focus khi đóng; xác nhận nguy hiểm nêu đúng đối tượng; bảo vệ dữ liệu chưa lưu |
| Toast/InlineFeedback | Toast cho xác nhận ngắn; lỗi field ở field, lỗi trang ở trang; live region phù hợp |
| PageHeader | Title, mô tả, breadcrumb khi cần và action group; dùng chung cấu trúc, không ép mọi trang cùng bố cục |
| Skeleton/States | Giữ kích thước vùng tải; empty có bước tiếp theo; error có retry khi hợp lý; forbidden khác empty |

Giữ Phosphor, thống nhất size 20/24px và weight theo vai trò. Icon-only action phải có accessible name; tooltip không thay thế tên truy cập.

## 8. Motion system và mascot

| Tình huống | Chuyển động | Thời lượng đề xuất |
| --- | --- | --- |
| Nhấn CTA | Translate Y 2–3px, cạnh nút thu lại | 100–140ms |
| Hover bìa truyện | Nâng 2–4px, không đổi kích thước layout | 160–200ms |
| Dropdown/dialog vào | Opacity + translate 4–8px | 160–220ms |
| Đổi tab | Indicator chuyển; nội dung fade nhẹ khi cần | 140–180ms |
| Public section vào viewport | Reveal một lần, dịch tối đa 16px | 300–450ms |
| Success | Check/feedback xuất hiện ngắn | 240–400ms |
| Mascot | Chào, chỉ dẫn, vui mừng theo sự kiện | Theo storyboard/asset |

Token thời gian nền: `--motion-fast: 120ms`, `--motion-base: 180ms`, `--motion-slow: 360ms`. Easing thường: `cubic-bezier(0.2, 0, 0, 1)`; easing biểu cảm tùy chọn: `cubic-bezier(0.34, 1.56, 0.64, 1)`, chỉ cho chi tiết nhỏ.

Quy tắc thực thi:

- Bắt đầu bằng CSS transition/keyframes và IntersectionObserver cho reveal. Chưa cần thêm thư viện motion cho toàn app.
- Animate transform/opacity cho chuyển động thường xuyên, không `transition: all`. Hover motion chỉ dành cho thiết bị hỗ trợ hover.
- Reveal phải progressive enhancement: nội dung vẫn hiện nếu observer/JavaScript lỗi. Không trì hoãn nội dung hero quan trọng.
- `prefers-reduced-motion: reduce`: bỏ translation, bounce, reveal delay và loop trang trí; trạng thái/nội dung vẫn đầy đủ.
- Không animation lại cả bảng khi lọc, không cho số liệu nhảy liên tục, không tự cuộn người dùng qua section.
- Success chỉ xuất hiện khi tác vụ thành công theo nguồn dữ liệu đang dùng. Animation không che lỗi hoặc thay thông báo.
- Không chạy mascot ngoài viewport. Đoạn chuyển động kéo dài cần cơ chế dừng phù hợp; bản đầu ưu tiên đoạn ngắn theo sự kiện.

Giữ nhận diện SketchTale và đối chiếu asset theo `design/ASSETS.md`. Ảnh tĩnh có thể nâng nhẹ/xuất hiện nhưng không đủ tạo biểu cảm chi tiết. Mascot nâng cao cần storyboard, asset tách lớp hoặc file chuyên dụng và ảnh tĩnh dự phòng.

Chỉ đánh giá Rive/Lottie khi có asset và nhu cầu rõ; lazy-load tại nơi dùng. Không đưa thư viện animation nặng vào bundle chung chỉ để làm nút nhấn.

## 9. Áp dụng theo khu vực

### 9.1. Public và Auth

- Hero kể được chuỗi “tranh vẽ → nhân vật → truyện” bằng asset dự án, thông điệp ngắn và CTA rõ.
- Giữ sitemap/anchor hiện có trong migration đầu; thay đổi nhịp section bằng hình ảnh và mảng màu có chủ đích.
- Pricing lấy quyền lợi theo nguồn dữ liệu hiện hành; không tự đổi giá/gói/quota để làm đẹp bố cục.
- Auth ưu tiên form, label, trạng thái gửi và lỗi. Đọc code auth hiện tại trước khi mô tả tích hợp; ghi chú “chỉ mock” trong tài liệu cũ không còn là kết luận tự động.

### 9.2. Parent

- Giữ mô hình Parent chọn Child; dashboard, cài đặt, phê duyệt, thư viện, tiến độ và bản xuất theo đúng bé đang chọn.
- `/parent/children/:childId/dashboard`: banner vàng nhạt, việc cần làm rõ, bốn chỉ số trên một vùng chung; mobile 2 × 2. Chỉ thêm biểu đồ khi có dữ liệu và ý nghĩa cụ thể.
- Tách duyệt phiên bản nhân vật khỏi quyền vai nhạy cảm; redesign không được gộp hai quyết định.
- `/parent/library` tiếp tục là thư viện truyện; giữ redirect `/parent/reports` theo code hiện có. Chỉ hiển thị bản publish, xem trước và đề xuất cho đúng bé, không tạo bản trùng hoặc tự đặt Family gate.
- Đủ trạng thái chưa có bé, không tìm thấy truyện, đang gửi, thất bại và thành công. Dialog đề xuất thể hiện rõ hồ sơ bé.
- Giữ filter URL, keyboard navigation trang truyện và dữ liệu hiện có. `seed.webp` nếu tiếp tục dùng vẫn là asset prototype/trang trí.
- Ghi nhận mock thư viện ở tài liệu cũ không chứng minh API đã tích hợp; kiểm tra lại service và contract khi triển khai.

### 9.3. Content Manager

- Màu dành cho selection, validation và publish status; vùng biên tập chủ yếu trắng.
- List, asset picker, editor tabs, preview và publish issues dùng cùng form/table/dialog contract.
- Trạng thái lưu, draft/revision và dữ liệu chưa lưu phải nhìn thấy; giữ recovery/validation hiện có khi đổi layout.
- Preview giữ tỷ lệ và dữ liệu truyện; CSS workspace không được làm đổi layout trang truyện.
- KPI ghi đúng phạm vi dữ liệu; danh sách vài truyện gần đây không được trình bày như thống kê toàn kho.

### 9.4. Admin và Profile

- Theo phạm vi 14 trang của kế hoạch Admin 17/10: 11 trang core cùng danh mục gói, chi phí credit và chủ đề giáo dục.
- Dashboard ưu tiên việc cần xử lý; statistics phục vụ phân tích. Table/filter/drawer có mật độ ổn định, hành động nguy hiểm rõ.
- Không mascot/bounce trong bảng nghiệp vụ; không thêm ví/giao dịch hoặc permission builder trong redesign.
- Profile dùng cùng typography, form và feedback; giữ khả năng chỉnh sửa theo contract hiện tại.

## 10. Trạng thái, dữ liệu và accessibility

Mỗi màn đánh giá: loading, empty, search-empty, error/retry, forbidden, pending/saving, success và conflict nếu nghiệp vụ có. Không bắt màn hình có trạng thái không liên quan.

- API thật lỗi phải hiện lỗi; không âm thầm fallback sang mock hoặc báo lưu thành công.
- Demo có nhãn nguồn rõ. Không sửa `.env.production` để visual review; dùng cấu hình development/preview riêng.
- Bảo vệ form chưa lưu, giữ lỗi server gắn field và pending theo đúng đối tượng.
- Mục tiêu WCAG AA: chữ thường ít nhất 4.5:1, chữ lớn 3:1; thành phần UI và focus kiểm tra tương phản phù hợp 3:1. Focus ring 2px + offset 2px, điều chỉnh khi trên nền cùng màu.
- Kiểm tra keyboard-only, thứ tự focus, Escape, focus return, screen-reader labels, zoom 200% và tiếng Việt dài.
- Vùng chạm mục tiêu 44 × 44px cho thao tác chính; control dense không dưới 24 × 24px và có khoảng cách phù hợp.
- Asset có kích thước dành sẵn và alt đúng nội dung; ảnh trang trí alt rỗng. Không lazy-load ảnh hero quan trọng; lazy-load dưới fold khi phù hợp.

## 11. Bản đồ file triển khai

| Lớp | File/thư mục hiện có | Công việc |
| --- | --- | --- |
| Nền | `src/styles/tokens.css`, `fonts.css`, `global.css`, `dropdowns.css` | Semantic token, type, spacing, focus, motion |
| Shared UI | `src/components/ui/`, `feedback/`, `branding/` | Chuẩn hóa component, thêm primitive cần thiết |
| Shell | `src/app/layouts/WorkspaceLayout.jsx`, `workspace.css` | Header/sidebar, responsive, active state |
| Public | `src/features/public/pages/HomePage.jsx`, `src/features/public/components/landing/` | Hero, section, CTA, asset |
| Auth | `src/features/auth/pages/` | Form, feedback, layout |
| Parent | `src/features/parent/`, gồm `child-dashboard.css`, `parent-library.css` | Dashboard và luồng theo bé |
| Content | `src/features/content/`, `content.css` | Bảng, editor, picker, preview |
| Admin | `src/features/admin/`, `admin.css` | Bảng, form, dashboard và 14 trang |
| Profile | `src/features/profile/` | Form và thông tin tài khoản |

Shared style định nghĩa nền; module giữ layout và ngoại lệ có tên rõ. Không tạo stylesheet toàn cục khổng lồ để override mọi module. Tránh selector toàn cục cho `button`, `section`, `img` ảnh hưởng preview truyện.

## 12. Kế hoạch implement

### Ưu tiên hiện tại — Giữ baseline sau khi hoàn tác redesign

Theo yêu cầu của chủ dự án, lớp màu/CSS thử nghiệm đã được hoàn tác. Giữ palette mục 4 làm đặc tả cho lần triển khai sau:

1. `[x]` Gỡ stylesheet redesign dùng chung và import khỏi entry point.
2. `[x]` Trả `tokens.css` và trang trí hero về baseline trước đợt redesign.
3. `[ ]` Chỉ tiếp tục áp dụng palette mục 4 khi bắt đầu lại migration giao diện.
4. `[ ]` Rà từng role trên desktop/mobile, kiểm tra contrast và các trạng thái hover/pressed/focus/disabled/loading.

**Đầu ra:** giao diện hiện giữ baseline; tài liệu lưu lại palette mục tiêu để làm chuẩn cho lần triển khai tiếp theo.

### Giai đoạn 0 — Baseline

1. Đọc `git status` và diff của file sắp sửa; working tree có công việc đang triển khai, không reset/ghi đè hàng loạt.
2. Chạy bản review phù hợp, chụp Home, Parent dashboard, Content editor, Admin users trên desktop/mobile.
3. Liệt kê màu/radius/type hardcode, selector dùng chung và component tái sử dụng.
4. Ghi kết quả lint/build/test baseline, phân biệt lỗi có sẵn với lỗi mới.

**Đầu ra:** ảnh baseline, inventory token/component, phạm vi commit và lỗi có sẵn. Audit tĩnh chưa đóng giai đoạn này.

### Giai đoạn 1 — Nền và ba mẫu đại diện

1. Thêm semantic token song song token cũ; bổ sung type/spacing/radius/motion scale.
2. Chuẩn hóa Button, field, badge và feedback. Tạo dev fixture/component gallery với đủ trạng thái, không đưa vào navigation production.
3. Làm Home hero, Parent dashboard và bảng Admin: cùng token, khác mật độ/độ biểu cảm.
4. Kiểm tra contrast, tiếng Việt, responsive và reduced motion; sửa hệ thống trước khi nhân rộng.

**Điều kiện chuyển bước:** ba mẫu thống nhất, control chính dùng được bằng bàn phím và không có regression shared chưa xử lý.

### Giai đoạn 2 — Shell, Public và Auth

1. Đồng bộ sidebar, mobile menu và page header hiện có; tiếp đó làm public sections và auth forms.
2. Giữ route, anchor, query, auth state và API behavior. Thêm motion sau khi layout tĩnh ổn.
3. Kiểm tra navigation, pricing và login/register/reset/confirm theo khả năng hiện có.

**Đầu ra:** trải nghiệm đầu vào nhất quán và shell sẵn cho các module.

### Giai đoạn 3 — Parent và Profile

1. Theo thứ tự: chọn bé/tổng quan → dashboard → phê duyệt → thư viện → tiến độ/cài đặt/bản xuất → gói/Profile.
2. Kiểm tra switch Child, đúng scope dữ liệu, recommendation, pending/error và quyền vai nhạy cảm.
3. Chuyển màu hardcode trong module sang semantic token; không thay service chỉ để phục vụ style.

**Đầu ra:** một luồng Parent hoàn chỉnh đã kiểm chứng, gồm các trạng thái ngoài happy path.

### Giai đoạn 4 — Content và Admin

1. Content: list/filter → asset picker → editor tabs/form → save/recovery → preview/publish.
2. Admin: list/filter/detail → action/dialog → dashboard/statistics → ba trang catalog; theo kế hoạch Admin mới.
3. Kiểm tra CSS không rò sang StoryPageRenderer, revision/conflict, permission và unsaved changes.

**Đầu ra:** module nghiệp vụ dùng shared UI, giữ contract và phân biệt dữ liệu thật/mock.

### Giai đoạn 5 — Hoàn thiện và nghiệm thu

1. Xóa alias/token cũ khi không còn usage; dọn override trùng và đồng bộ tài liệu role còn palette cũ.
2. Rà responsive, keyboard, contrast, reduced motion, ảnh lỗi và nội dung dài.
3. Thêm mascot nâng cao khi có asset phù hợp; không để thiếu animation chặn UI chức năng.
4. Ghi bằng chứng nghiệm thu, kết quả test và phần thiếu API/asset riêng.

**Đầu ra:** bảng hoàn thành, ảnh trước/sau, kết quả kiểm tra và giới hạn còn lại.

### Cách chia ticket/commit

Mỗi ticket gồm một lớp nền hoặc một luồng trang, kèm ảnh trước/sau, state đã kiểm tra và file ảnh hưởng. Thứ tự phụ thuộc: **token → primitive → mẫu đại diện → shell → module → cleanup**.

Không rewrite toàn giao diện trong một commit. Khi có lỗi, revert phần thay đổi của ticket tương ứng, giữ thay đổi khác trong working tree. Không format toàn repository chỉ để hoàn thiện một trang.

## 13. Kế hoạch kiểm chứng

Các kiểm tra sau cần chạy khi implement, **chưa chạy trong lần cập nhật tài liệu này**.

| Phạm vi đổi | Test hiện có liên quan |
| --- | --- |
| Public/Auth/Profile | `tests/public.spec.js`, `pricing.spec.js`, `confirm-email.spec.js`, `profile.spec.js` |
| Parent | `tests/parent.spec.js`, `parent-ux.spec.js`, `parent-responsive.spec.js`, `child-dashboard.spec.js`, `parent-library.spec.js`, `parent-sensitive-role.spec.js`, `parent-plan.spec.js` |
| Content | `tests/content-save-state.spec.js`, `content-contract.spec.js`, `story-editor-recovery.spec.js` |
| Admin | `tests/admin-implementation.spec.js` |

Tên test rút gọn trong bảng đều nằm dưới `tests/`. Đọc cấu hình/fixture trước khi chọn lệnh; không mặc định test có tên production phù hợp visual review hoặc được phép ghi dữ liệu thật.

- Chạy `npm run lint`, `npm run build` và test theo module ảnh hưởng. Đổi shared primitive/shell cần mở rộng kiểm tra ba role và public liên quan.
- Dùng Playwright/axe hiện có cho accessibility; vẫn review thủ công focus và hierarchy.
- Viewport đại diện: 390 × 844, 768 × 1024, 1366 × 768, 1440 × 900. Kiểm tra thêm 320px và zoom 200% cho reflow.
- Mục tiêu hiệu năng: LCP < 2.5s, INP < 200ms, CLS < 0.1; ghi điều kiện đo. Build thành công không chứng minh đạt, dữ liệu field cần có để xác nhận trải nghiệm thực tế.
- Tài liệu Admin ghi nhận cảnh báo bundle; đo baseline trước khi thêm dependency/asset, ưu tiên lazy-load theo route và ảnh đúng kích thước.

## 14. Checklist theo dõi

- [x] Chốt đặc tả vàng + navy + kem/trắng; Duolingo chỉ tham chiếu font chữ và animation.
- [ ] Áp dụng semantic token và lớp màu dùng chung theo palette vàng/navy; rà các màn và màu hardcode riêng theo module.
- [x] Viết design system và kế hoạch migration trong tài liệu này.
- [ ] Hoàn tất baseline toàn luồng và inventory token/component (Home, Parent và Profile đã xem; còn lưu ảnh có thể so sánh, mobile và Content).
- [ ] Implement semantic token và primitive CTA theo palette mục tiêu.
- [x] Áp dụng và xem trực tiếp ba mẫu: Home hero, dashboard hồ sơ bé, bảng tài khoản Admin (bản màu cũ; chưa nghiệm thu palette mới).
- [ ] Hoàn tất migration shell, Public và Auth theo palette mới; rà từng màn, responsive/form và accessibility.
- [ ] Hoàn tất migration Parent/Profile theo palette mới; xem lại từng màn, responsive, accessibility và API thật.
- [ ] Migration Content/Admin.
- [ ] Hoàn thiện asset/mascot trong phạm vi có nguồn.
- [ ] Kiểm chứng UI, accessibility và luồng liên quan.
- [ ] Đồng bộ tài liệu role, ghi rõ phần tích hợp chưa nghiệm thu.

### Lịch sử implement — 17–18/10/2026

Các ghi nhận ngày 17/10 mô tả phiên bản teal cũ, **không phải hướng thiết kế được tiếp tục áp dụng**. Ngày 18/10, semantic token và lớp giao diện chung đã chuyển sang vàng/navy/kem; các màn Parent/Profile và Admin cần được xem lại sau lần đổi màu.

- Semantic token được thêm ở `src/styles/tokens.css`; primitive CTA và thử nghiệm thị giác nằm ở `src/styles/design-refresh.css`. Token cũ được giữ để chuyển từng module có kiểm soát.
- Home hero, dashboard hồ sơ bé và bảng tài khoản Admin đã được mở và xem trực tiếp. Dashboard hồ sơ bé được xem bằng mock preview tại cổng 5174 vì `ParentAvailabilityGate` chặn các trang Child khi API mode là `real`; cấu hình `.env.local` không đổi.
- Luồng dashboard Admin thật báo lỗi quyền từ API trong lần xem; bảng tài khoản dùng nhãn demo và hiển thị dữ liệu minh họa. Không coi đây là xác nhận Admin API đã tích hợp.
- Baseline Home tại `localhost:5173` được chụp lại trước chặng này; baseline tổng thể vẫn mở cho đến khi có ảnh so sánh các role/viewport còn lại.
- Chặng 2 đã thêm lớp màu cho shell dùng chung, header/section/footer Public và Auth: teal dành cho thao tác, vàng giữ vai trò nhận diện, các section Public phân lớp nền ấm/lạnh rõ hơn. JSX và luồng nghiệp vụ được giữ nguyên.
- Sau cập nhật, Home, phần “Cách hoạt động”, Auth và shell Admin đã được xem ở desktop; Auth cũng được kiểm tra báo lỗi/focus khi gửi form rỗng. Admin shell dùng mock preview tạm ở cổng 5174, server đã dừng sau khi kiểm tra.
- Chưa kiểm tra mobile viewport trong chặng này; chưa coi Auth API, pricing API hay shell Content là đã nghiệm thu tích hợp.
- Chặng 3 thêm màu nền ấm, teal cho hành động và trạng thái xanh/vàng có chủ đích cho Parent/Profile trong `src/styles/design-refresh.css`; giữ nguyên route, service và cách xử lý dữ liệu.
- Đã xem trên mock preview các màn Parent overview, dashboard bé, phê duyệt, thư viện, tiến độ, cài đặt, bản xuất, gói và Profile. Không gửi thao tác phê duyệt, tạo bản xuất hoặc lưu thay đổi lên backend.
- `npm run lint`, `npm run build` và `git diff --check` đều chạy xong. Lint còn cảnh báo sẵn ở Auth/Content; build còn cảnh báo chunk JavaScript lớn hơn 500 kB. Chưa kiểm tra viewport mobile, bàn phím/axe hay tích hợp API thật cho Parent/Profile; việc dọn toàn bộ màu hardcode cũ sang token được để lại cho giai đoạn hoàn thiện.
- Ngày 18/10: cập nhật `src/styles/tokens.css` sang CTA vàng/chữ navy, nền kem, focus navy; `src/styles/design-refresh.css` đổi các lớp màu chung cho Public, Auth, Parent, Content, Admin và Profile. Đã xem lại trang chủ tại `localhost:5173`; các trang Parent/Profile chưa được chụp lại sau lần đổi palette.
- `npm run build` thành công sau cập nhật token và CSS; còn cảnh báo bundle JavaScript trên 500 kB. Chưa chạy test theo yêu cầu hiện tại.

**Trạng thái hiện tại:** ngày 18/10, theo yêu cầu của chủ dự án, stylesheet redesign và các semantic token thử nghiệm đã được gỡ; hero trở về nhãn trang trí ban đầu. Các ghi nhận phía trên là lịch sử tại thời điểm triển khai, không mô tả giao diện hiện tại.

**Bước tiếp theo:** khi được triển khai lại, áp dụng palette mục 4 theo từng role, rà responsive/accessibility và nghiệm thu tích hợp riêng.
