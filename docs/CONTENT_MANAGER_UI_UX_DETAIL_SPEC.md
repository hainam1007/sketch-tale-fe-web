# Content Manager: đặc tả UI/UX đến cấp component

Ngày cập nhật: 05/10/2026. Trạng thái: kế hoạch thiết kế đã đối chiếu lại working tree; chưa nghiệm thu thị giác trên trình duyệt. Lần cập nhật này chỉ sửa tài liệu, không triển khai giao diện.

Tài liệu này cụ thể hóa [kế hoạch tổng thể](CONTENT_MANAGER_UI_UX_PLAN.md). Khi hai tài liệu khác nhau về thông số trình bày, dùng đặc tả này. Quy tắc nghiệp vụ vẫn theo [contract Content Manager](CONTENT_MANAGER_CONTRACT.md); thông số thiết kế không tự mở rộng API hoặc quyền.

Phần đã có trong code: `src/features/content/content.css`, class shell `workspace-app-content`, hook trạng thái editor, live draft canvas, overview shortcut/draft query và Quiz null validation. Publish field routing mới có mapping tab/hash, chưa chọn đúng entity và vẫn có mapping sai. Không coi đặc tả hoặc sự tồn tại của CSS là bằng chứng giao diện đã đạt yêu cầu.

## 0. Bản đồ đọc và phạm vi từng trang

Đọc mục 1.1 để biết hiện trạng; mục 2–5 là quy chuẩn dùng chung; mục 6–17 đặc tả từng trang đến button, margin, padding, form, trạng thái và responsive. Mục 22 chia việc còn lại thành checklist nhỏ và thay thế cách hiểu rằng mọi CM-xx đều chưa được làm.

| Trang thực tế | Route | Đặc tả | Trọng tâm đợt tiếp theo |
| --- | --- | --- | --- |
| Tổng quan | `/content` | Mục 6 | Đưa truyện đang làm lên đầu, bỏ slogan chiếm diện tích |
| Kho truyện | `/content/stories` | Mục 7 | Toolbar đúng layout, debounce, quay lại giữ ngữ cảnh |
| Tạo truyện | `/content/stories/new` | Mục 8 | Form gọn, ảnh bìa, lỗi chủ đề, chuyển sang thêm trang |
| Thông tin truyện | `/content/stories/:storyId` | Mục 9 | Một tiêu đề form, hoàn tác và baseline lưu đúng |
| Trang truyện | `/content/stories/:storyId/pages` | Mục 10 | Đủ chiều rộng, một vùng sửa, chuyển trang/vị trí an toàn |
| Vai nhân vật | `/content/stories/:storyId/roles` | Mục 11 | Phân biệt vai với vị trí; mở đúng nhân vật trên trang |
| Từ vựng | `/content/stories/:storyId/vocabulary` | Mục 12 | Ngữ cảnh, tìm/lọc, nghe thử, hủy/xóa có bảo vệ |
| Câu hỏi | `/content/stories/:storyId/quizzes` | Mục 13 | Soạn/làm thử riêng, radio rõ, lỗi cạnh trường |
| Xem trước và xuất bản | `/content/stories/:storyId/preview` | Mục 14 | Đọc thử thật, validate đúng revision, sửa đúng lỗi |
| Kho tư liệu | `/content/assets` | Mục 15 | Gallery trước, upload gọn, media đúng loại |
| Hiệu quả nội dung | `/content/statistics` | Mục 16 | Phạm vi chỉ số, biểu đồ đọc được, mở truyện từ kết quả |
| Hồ sơ dùng chung | `/profile` với role Content | Mục 17 | Thông tin thật, phiên thật, style riêng role |

Dialog chọn tư liệu, xác nhận xóa/ẩn/xuất bản, cảnh báo chưa lưu và drawer mobile là các bề mặt con bắt buộc trong phạm vi, dù không có route riêng. Đăng nhập/khôi phục tài khoản là luồng auth dùng chung, không tính thành trang Content Manager mới.

## 1. Design read và cách áp dụng taste

Đọc brief: tối ưu công cụ biên tập nội dung cho người lớn, giữ nhận diện SketchTale, hướng sáng, gọn, ấm và dễ thao tác nhiều giờ. Chế độ redesign-preserve: giữ route, logo, Nunito, Phosphor, dữ liệu và cấu trúc nghiệp vụ.

Đã đọc skill `design-taste-frontend`, đặc biệt các mục Brief inference, Typography, Spacing, Shape consistency, Interaction states và Redesign protocol. Skill ghi rõ dashboard/form/editor nằm ngoài phạm vi chính của nó. Vì vậy đây là đặc tả sản phẩm dựa trên audit và nguyên tắc thị giác phù hợp của taste, không phải áp nguyên mẫu landing page vào editor. Form/list vẫn ưu tiên khả năng đọc và dự đoán được hành vi.

Dial mục tiêu: `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 6`. Mức độ biến đổi thấp giúp vị trí thao tác ổn định; motion phục vụ phản hồi; mật độ vừa đủ để canvas và form có chỗ trên laptop. Suy luận từ CSS hiện tại: variance khoảng 3, motion khoảng 2, density không đều giữa hero rộng và editor chật; chưa có baseline thị giác được đo.

Giữ light theme hiện tại trong đợt này. Theme tokens tách theo ngữ nghĩa để có thể thiết kế dark mode đồng bộ sau; không tự bật theme riêng từng section. Chỉ dùng ảnh bìa/tư liệu của truyện để nhận diện nội dung. Các nhãn/menu tiếng Việt dưới đây là đề xuất công khai của kế hoạch; giữ nguyên field name, ID, route và mapping API khi đổi nhãn hiển thị.

### 1.1. Audit từ code và ranh giới chứng cứ

| Nguồn hiện tại | Quan sát | Quyết định thiết kế |
| --- | --- | --- |
| `workspace.css` + `content.css` | Root grid vẫn 248 px; sidebar Content override width 232 px. Main Content max 1280/padding 32, con editor max 1552 không nới được cha | Đồng bộ grid/sidebar; mở container cha theo ngữ cảnh editor trước khi tăng width con |
| `.workspace-button`, `.icon-button` trong Content | Đã có min-height/target 44, radius 10, label 14/700 và focus ring | Giữ nền đã làm; kiểm tra ngoại lệ, danger hover, pending và disabled thay vì làm lại |
| `.editor-field`, `.slot-row`, preview | Label/input đã có override; một số metadata/renderer vẫn theo shared CSS | Đo computed style trên từng loại, sửa phần còn sót |
| `.admin-filter-fields` | Shared CSS đặt display flex; Content khai báo grid-template-columns nhưng chưa đặt display grid. Label kế thừa min-width 180 | Đặt layout rõ và min-width 0; test toolbar hẹp và label dài |
| `.admin-search input` | Shared có padding-left 36; rule Content có padding 10 12 với specificity cao hơn | Khôi phục padding-inline-start 40 cho search có icon; đo chữ không đè icon |
| `.story-pages-workspace` | Grid có min-width 176 + 480 + 264 và 2 gap 16; chỉ đổi 2 cột ở viewport 1100. Vẫn có danh sách sửa thứ hai | Grid cần tối thiểu 952 px bên trong panel; chuyển layout theo vùng khả dụng, gỡ form lặp |
| `StoryPageRenderer` | Canvas 16:9, text phủ ảnh, nhân vật có border-radius tròn | Kiểm tra crop/overflow/layer; giữ hình nhân vật nguyên tỷ lệ |
| `AssetPicker` | Select/search/8 thumbnails/dialog cùng xuất hiện; dialog chưa có quản lý focus đầy đủ; select không chặn failed như thumbnail | Một điểm vào, validation cùng một điều kiện cho mọi đường chọn, focus trap/return |
| `StoryPagesPage` | Đã compose pageDraft/slotDraft vào renderer; beginEdit cập nhật state trước selectPage guard; đóng form thêm chỉ setShowAdd(false) | Giữ live preview; quyết định guard trước mutation state và trước đóng form |
| `StoryQuizPage` | Đã chặn correctIndex null; có phần làm thử. Hủy sửa reset trực tiếp; xóa mutation trực tiếp | Giữ fix null; bổ sung guard, xác nhận xóa, reset và trạng thái chưa thể chấm thử |
| `StoryEditorLayout` | Validation chỉ lưu type/message, chưa gắn revision; trạng thái header không nhận đầy đủ pending/error của form con | Gắn kết quả kiểm tra revision; dùng trạng thái form thống nhất |
| `PublishIssues` | Kiểm tra title trước namespace nên pages.*.title về story-title; chưa chọn page/role/vocabulary/quiz cụ thể | Resolve namespace + entity trước field; render mục cần sửa rồi mới focus |
| `ContentOverviewPage` | Đã query draft riêng và có shortcut link; số published vẫn trong 5 truyện gần nhất | Giữ query đúng; thay banner bằng công việc và ghi rõ phạm vi số liệu |
| `AssetsPage` / `ProfilePage` | Audio còn dùng img trong kho; lỗi upload có thể hiện 2 lần; profile có copy phiên demo cố định | Media renderer theo kind, một error message, copy phiên theo nguồn dữ liệu |

Đây là audit mã nguồn. Chưa quan sát các trang đang chạy trong lần lập kế hoạch này. Các kích thước bên dưới là baseline thiết kế đề xuất, không phải tuyên bố giao diện đã đạt chuẩn hoặc “tối ưu tuyệt đối”. Chốt bằng ảnh trước/sau và thử tác vụ ở mục 18.

## 2. Quy ước đo và token chung

Mọi số đo mặc định là CSS px ở mức zoom 100%, `box-sizing: border-box`. Khi triển khai đổi spacing/font sang rem với gốc 16 px, không khóa cỡ font trình duyệt. Dùng `min-height` cho control chứa chữ, không dùng height cứng gây cắt chữ khi zoom. Kích thước ảnh/thumbnail dùng aspect-ratio.

Thứ tự ưu tiên: accessibility và nội dung thực → breakpoint → ngoại lệ từng trang → component chung → token. Mỗi phần tử chỉ nhận spacing từ một nguồn: bố cục dùng gap, ranh giới section dùng margin-block, nội dung bên trong dùng padding; không cộng margin của cả hai phần tử liền nhau.

### 2.1. Màu đề xuất, giới hạn trong Content Manager

| Token dự kiến | Giá trị | Vai trò |
| --- | --- | --- |
| `--cm-bg` | `#F8F7F3` | Nền workspace hiện có |
| `--cm-surface` | `#FFFFFF` | Form, bảng, panel |
| `--cm-surface-subtle` | `#F3F2EE` | Hover nhẹ, nền thumbnail rỗng |
| `--cm-text` | `#001050` | Tiêu đề, dữ liệu chính; kế thừa navy thương hiệu |
| `--cm-text-secondary` | `#59616E` | Mô tả, metadata đọc được |
| `--cm-text-muted` | `#697180` | Hint, caption; không giảm opacity thêm |
| `--cm-border` | `#E4E4DF` | Phân vùng trang trí |
| `--cm-control-border` | `#858A94` | Viền input/control cần nhận biết rõ |
| `--cm-accent` | `#F7BD35` | CTA chính |
| `--cm-accent-hover` / `--cm-accent-pressed` | `#EFB022` / `#DCA01D` | Hover/pressed CTA; chữ vẫn navy |
| `--cm-selected-bg` / `--cm-selected-border` | `#FFF2CC` / `#8A6200` | Selected, kèm check hoặc marker |
| `--cm-focus` | `#001050` | Focus ring trên nền sáng |
| Success fg/bg | `#166044` / `#E7F5EC` | Lưu/xuất bản thành công |
| Warning fg/bg | `#765000` / `#FFF4D6` | Chưa lưu/cần kiểm tra |
| Error fg/bg | `#9B2940` / `#FFF0F2` | Lỗi/xóa |

Màu trạng thái là semantic, không dùng làm accent trang trí tùy ý. Trên button vàng dùng chữ navy, không dùng chữ trắng. Xác minh tương phản trên màu đã compositing ở bước QA; bảng này chưa phải chứng nhận tương phản.

Kiểm tra số học trên màu đặc, không opacity, ngày 04/10/2026: chữ chính/trắng 17.65:1; chữ secondary/nền workspace 5.83:1; hint/trắng 4.91:1; chữ navy/CTA vàng 10.32:1; control-border/trắng 3.47:1; success 6.69:1; warning 6.57:1; error 6.82:1. Các cặp chữ trên đạt mục tiêu 4.5:1 và cặp viền đạt mục tiêu 3:1 trong điều kiện tính này. Vẫn cần kiểm tra focus, overlay, ảnh nền, disabled và màu hover trong UI thực.

### 2.2. Typography, spacing, radius và elevation

| Thành phần | Desktop | Mobile | Quy tắc |
| --- | --- | --- | --- |
| H1 trang thường | 30/38, weight 800 | 26/34 | tracking -0.02em; không viết hoa cả câu |
| Tên truyện trong editor | 24/32, 800 | 22/30 | Tối đa hai dòng, có cách xem tên đầy đủ |
| H2 section | 20/28, 800 | 20/28 | Margin mặc định 0 |
| H3 item/panel | 16/24, 700 | 16/24 | Tên item được xuống dòng |
| Body/input | 15/24, 400-500 | 16/24 | Input mobile 16 px để tránh zoom bất tiện |
| Label/button/nav | 14/20, 700 | 14/20 | Nhãn dài wrap; không thu nhỏ chữ |
| Hint/metadata/error | 13/20, 400-600 | 13/20 | Không dùng 10-11 px cho thông tin cần đọc |
| Badge/caption nhỏ | 12/18, 700 | 12/18 | Chỉ cho thông tin phụ |
| KPI | 32/40, 800 | 28/36 | `tabular-nums`; đơn vị 13/20 |

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48. Ngoại lệ 6 px chỉ dùng icon/hint; 2 px cho optical alignment và outline. Không rải giá trị 17/19/25 px giữa các component.

Radius scale: badge/thumbnail nhỏ 6; input/button 10; panel/ảnh lớn 12; dialog 16. Badge trạng thái không dùng hình pill; chip filter có thể radius 999 vì mang nghĩa token có thể bỏ. Radius không đổi theo hover.

Panel thường không shadow. Popover: `0 4px 16px rgb(0 16 80 / 0.10)`. Dialog: `0 16px 48px rgb(0 16 80 / 0.16)`. Canvas có border riêng để nhận diện vùng ảnh. Không dùng shadow 3D đáy nút trong Content Manager.

## 3. Khung trang và responsive

### 3.1. Kích thước tổng thể

| Khu vực | Desktop từ 1280 px | Tablet 768-1279 px | Mobile dưới 768 px |
| --- | --- | --- | --- |
| Sidebar trang thường | 232 px, padding 24 12 16 | Rail 72 px; mở panel 232 px | Drawer `min(288px, 100vw - 48px)` |
| Sidebar editor | Rail 72 px mặc định, nút mở đầy đủ | Rail 72 px | Drawer, trả không gian cho canvas |
| Main trang thường | Max-width 1280 gồm padding 32 | Padding 24 | Padding 16 |
| Main editor | Max-width 1600 gồm padding 24 | Padding 20 | Padding 16 |
| Header page | H1 + CTA, gap 24, margin-bottom 24 | Gap 16, wrap khi thiếu chỗ | Xếp dọc, gap 16; CTA full-width nếu hành động chính |
| Khoảng section | 32 | 24 | 24 |
| Panel padding | 24 | 20 | 16 |
| Mobile app bar | Không hiển thị | Chỉ khi dùng drawer | 56 px, menu 44×44, tên khu vực |

Container không có min-width làm tràn viewport. Ở zoom 200%, layout dùng đúng chiều rộng CSS khả dụng. Khi nội dung control không còn vừa, cho wrap theo content trước breakpoint thay vì tràn.

### 3.2. Sidebar chi tiết

- Logo giữ nguyên asset; vùng link tối thiểu 44 px cao, cách nhóm menu 24 px. Bỏ khoảng role-label 45 px hiện tại; nhãn vai cách logo 16 px, cách nav 12 px.
- Nav item min-height 44, padding 10 12, gap icon/chữ 12, giữa item 4, icon 20, radius 10. Active: nền selected + chữ đậm + marker trái 3 px nằm trong padding, không làm đổi chiều rộng.
- Rail: icon 20 trong nút 44×44, căn giữa; tooltip xuất hiện khi hover/focus. Accessible name luôn có dù ẩn chữ.
- Khu hồ sơ/đăng xuất: margin-top auto, padding-top 16, divider; cùng hit target với nav. Không đẩy logout ra khỏi vùng cuộn ở màn thấp.
- Drawer: nền sau inert, focus trap, Escape đóng, click scrim đóng, trả focus về menu. Nếu click điều hướng bị chặn vì dirty, xử lý dialog trước rồi mới đóng menu.
- Logo, profile, logout và browser Back phải đi qua cùng chính sách dirty. Không chỉ bảo vệ menu chính.

### 3.3. Các lớp nổi

Thang z-index dự kiến cho Content: base 0, local sticky 10, app bar 20, desktop sidebar 30, popover 40, drawer scrim/panel 50/60, dialog scrim/panel 70/80, toast 90, skip-link 100. Popover nằm trong dialog phải render vào layer của dialog, không phía dưới scrim. Layer nhân vật chỉ tồn tại trong stacking context của canvas, không cạnh tranh với toolbar/modal.

Chỉ một cụm toolbar sticky phía trên editor; tránh ba thanh sticky chồng nhau. Đo chiều cao thực để đặt `scroll-margin-top` cho field lỗi; không hardcode offset dựa trên tiêu đề một dòng. Footer lưu mặc định ở flow; sticky chỉ trong panel form và có khoảng trống cuối bằng chiều cao footer cộng 16 px.

## 4. Component chung đến cấp trạng thái

### 4.1. Button, icon button và text link

| Loại | Kích thước/padding | Dùng ở đâu |
| --- | --- | --- |
| Primary B1 | Min-height 44; padding 10 16; icon 18; gap 8; radius 10 | Tạo/lưu/chọn tư liệu; một B1 mỗi vùng thao tác |
| Secondary B2 | Như B1; nền trắng, viền control 1 px | Hủy, xem trước, thử lại khi không phải CTA chính |
| Tertiary B3 | Min-height 44; padding 10 12; nền trong suốt | Đóng sửa, xem tất cả, thao tác phụ |
| Destructive B4 | 44; padding 10 16; đỏ đậm trên nền nhạt | Xóa ở dialog xác nhận; label nêu đối tượng |
| Icon I1 | 44×44; icon 20; padding 0; radius 10 | Sửa/xóa/đóng/trước/sau |
| Compact icon I2 | Chỉ glyph/bề mặt 32, hit target vẫn 44×44 | Toolbar dày; target không chồng target bên cạnh |
| Link L1 | Chữ 14/20; underline khi hover/focus; vùng thao tác tối thiểu 44 cao khi đứng riêng | Điều hướng và mở đúng entity |

- Default: border 1 px đã chiếm chỗ kể cả transparent. Hover đổi màu và viền; không nâng card/button. Pressed đổi màu, có thể scale 0.99 chỉ với B1 và không với reduced motion.
- Focus-visible: outline 2 px navy, offset 3; trên canvas ảnh dùng viền kép trắng/navy để luôn nhìn thấy. Focus không được phụ thuộc hover.
- Disabled: nền subtle, chữ muted, không hover/transform; có lý do cạnh control khi người dùng cần biết cách mở khóa. Không dùng tooltip trên disabled button làm cách giải thích duy nhất.
- Pending: giữ chiều rộng nút bằng label gốc/min-inline-size; spinner 16 px thay icon, label “Đang lưu…”; khóa gửi trùng. Lỗi chuyển về nút sẵn sàng và giữ input.
- Icon button có tên gắn entity, ví dụ “Xóa từ nảy mầm”. Tooltip 250 ms khi hover, ngay khi focus; không xuất hiện tự động trên touch.
- Action group gap 8; cách form 24; canh phải desktop, primary cuối theo DOM. Mobile cho wrap theo đúng DOM và primary full-width khi cần; không đảo thứ tự chỉ bằng CSS.

### 4.2. Input, textarea, select và field

| Thành phần | Đặc tả |
| --- | --- |
| Field | Label margin-bottom 8; control → hint/error 6; giữa hai field 20; giữa nhóm 32 |
| Input/select | Min-height 44; padding 10 12; radius 10; font 15/22; mobile 16/24 |
| Input có icon trái | Icon 18 cách trái 12; padding-left 40; icon không nhận focus |
| Input có clear | Dành vùng phải 44 px; clear I1; không che text |
| Textarea | Padding 12; min-height 120; resize vertical; line-height 24; không khóa height khi có nội dung dài |
| Counter | Hàng dưới control, căn phải, 13/20; helper bên trái; wrap độc lập |
| Required | Chữ “Bắt buộc” hoặc dấu * được giải thích đầu form; không chỉ dùng màu đỏ |
| Read-only | Văn bản hoặc input readonly có label; cho chọn/copy; khác với disabled |

Validation: kiểm tra sau blur khi đã tương tác, hoặc submit; sửa lỗi cập nhật field hiện tại. Không hiện lỗi khi vừa mở form. Mỗi field có error ID, `aria-invalid`, `aria-describedby`; error 13/20 + icon 16, màu error. Error summary trên đầu form chỉ khi submit lỗi, cách form 16 px, link đến field. Không cùng lúc bắn toast và banner và error summary cho cùng một lỗi.

Select tùy biến: trigger 44 cao, chevron 16 cách phải 12; panel cách trigger 6, padding 4, radius 12, tối đa `min(320px, khoảng trống viewport)`. Option min-height 44, padding 10 12, gap 8, dấu check 16 ở cột phải; selected nền selected, focus ring riêng. Hỗ trợ Arrow, Home/End, Enter, Escape, typeahead; chọn xong trả focus trigger. Collision handling lật lên trên khi thiếu chỗ. Chỉ chuyển các select sang component chung sau khi kiểm chứng đầy đủ; tên field và giá trị API không đổi.

Checkbox/radio: control 20×20, label gap 10, cả hàng click được và min-height 44. Hàng nhiều dòng align-start, control margin-top 2. Radio cùng nhóm dùng fieldset/legend; không dùng nút trang trí thay radio thiếu semantics.

### 4.3. Badge, filter chip, thông báo và empty

- Badge: min-height 26, padding 4 8, chữ 12/18, radius 6, icon 14 nếu cần. Nháp màu neutral/warning; Đã xuất bản success; Đã ẩn neutral có EyeSlash, không tự coi là lỗi.
- “Chưa lưu” và “Chưa xuất bản” là hai nhãn riêng. Không đặt badge lên ảnh bìa; đặt cùng dòng metadata của truyện.
- Filter chip: min-height 36 desktop trong hàng đủ khoảng cách; nút bỏ riêng hit target 44 khi touch; chữ 13; gap 6; chip wrap. Mô tả đầy đủ “Chủ đề: Thiên nhiên”.
- Inline notice: padding 12 16, radius 10, icon 20, gap 10, body 14/22; action ở cuối dòng hoặc hàng sau. Error không tự biến mất.
- Toast success chỉ dùng cho hành động rời ngữ cảnh, tối đa 1 ở góc phải dưới, rộng `min(360px, 100vw - 32px)`, padding 16, đóng I1. Lưu thường dùng trạng thái inline; thông tin cần để phục hồi không chỉ nằm trong toast.
- Empty lớn: min-height 240, padding 32 24, icon 32, title 18/26 cách icon 12, body 14/22 max-width 42ch cách title 8, CTA margin-top 20. Empty trong panel: padding 24 16, không ép min-height toàn trang.
- Loading: giữ header/toolbar; skeleton khớp số cột, ảnh và 4-6 hàng đang thấy. `aria-busy`, một thông báo polite; shimmer tắt khi reduced motion. Refetch giữ data cũ + nhãn “Đang cập nhật”, không thay toàn màn hình bằng spinner.

### 4.4. Dialog, drawer và motion

- Confirm dialog: width 440, max-width `calc(100vw - 32px)`, padding 24 desktop/20 mobile, radius 16. Title 20/28, body margin-top 12, action margin-top 24/gap 8. Close I1 phía phải nhưng không chèn lên title.
- Nội dung có tên đối tượng và ảnh hưởng; autofocus hành động an toàn khi xóa. Chỉ gửi request sau xác nhận; đóng dialog không đồng nghĩa hủy request đã được server nhận.
- Dialog dài: max-height `calc(100dvh - 32px)`, header/footer không co, body overflow auto. Mobile có thể full-screen với safe-area; nút cuối luôn cuộn tới được khi bàn phím mở.
- Hover/pressed chuyển background/border trong 120 ms; dialog opacity 160 ms + translateY tối đa 4 px; drawer 180 ms. Không dùng `transition: all`.
- Reduced motion: bỏ translate/scale, không shimmer, giữ phản hồi màu ngay. Không hiệu ứng khi cuộn trang, không animation lặp trên số liệu/CTA.

## 5. Khung editor áp dụng cho sáu trang con

File mục tiêu: `StoryEditorLayout.jsx`, `useEditorSaveState.js`, `PublishIssues.jsx`, `StoryEditorParts.jsx`.

| Phần tử | Kích thước và khoảng cách | Hành vi |
| --- | --- | --- |
| Breadcrumb/back | 14/20; vùng click 44; margin-bottom 12 | Về kho giữ filter; tên truyện dài truncate chỉ tại breadcrumb |
| Header | Padding-block 0 16; gap 16 | Tên truyện bên trái; trạng thái xuất bản không ép một dòng |
| Tên và badge | Gap 12; title 24/32; badge 26 cao | Wrap badge xuống dòng khi thiếu chỗ |
| Metadata lưu | Margin-top 8; font 13/20; gap 12 | Hai dòng tối đa trước khi chuyển chi tiết phụ |
| Action header | B2 Xem trước; B3 Kiểm tra; B1 Xuất bản chỉ nổi bật ở tab preview | Tabs biên tập ưu tiên nút lưu trong form |
| Tab nav | Margin-bottom 20; min-height 48; link padding 12 16; gap 4 | Active nền nhạt + underline 2 px; `aria-current=page` |
| Panel body | Padding 24/20/16 theo breakpoint | Bỏ eyebrow tiếng Anh lặp lại title tab |
| Section heading | H2 20/28; description margin-top 8; margin-bottom 20 | Action cách title 16; mobile xuống dòng |
| Thanh trạng thái form | Min-height 44, gap 8, font 13/20 | Icon 16 + text, giữ chỗ để tránh nhảy layout |

Tab nav là các link route, không giả role=tab nếu không triển khai keyboard semantics của tab widget. Trên mobile nav cuộn ngang có chỉ dấu còn tab; đưa active vào vùng nhìn thấy, không cuộn ngang body. Bàn phím vẫn tab lần lượt được.

Save matrix: pristine → nút lưu disabled có lý do “Chưa có thay đổi”; dirty → Lưu thay đổi; saving → Đang lưu và khóa mutation xung đột; saved → Đã lưu + thời điểm từ phản hồi/local event đúng nghĩa; error → Chưa lưu được + Thử lại; conflict → “Nội dung đã thay đổi ở phiên khác” và giữ bản đang nhập. Không nhầm `draftDirty` với form dirty.

Dialog rời trang: title “Bạn có thay đổi chưa lưu”; body nói rõ phần đang sửa; B2 “Ở lại”, B3 “Bỏ thay đổi”; thêm B1 “Lưu rồi tiếp tục” chỉ khi form hiện tại có save handler đầy đủ. Nếu lưu lỗi vẫn ở nguyên trang. Browser reload sử dụng cảnh báo native; không hứa chặn được browser close bằng modal tùy biến.

Kết quả validate gắn storyId + revision. Bất kỳ save nào thành công làm kết quả cũ hết hiệu lực. Khi mở lỗi: route → load data → chọn entity → render form → focus field → cuộn vừa đủ. Hash phải khớp ID thật; fallback tới summary dễ hiểu nếu entity đã mất.

## 6. Trang Tổng quan: `/content`

File: `ContentOverviewPage.jsx`. Ưu tiên P1. Mục tiêu thị giác: mở trang là nhìn thấy việc có thể tiếp tục.

### 6.1. Đặc tả từng vùng

| Vùng/element | Layout, padding, margin, typography | Chi tiết UX |
| --- | --- | --- |
| Header | Theo khung thường; bỏ eyebrow tiếng Anh; description tối đa 2 dòng | H1 “Tổng quan nội dung”; B1 “Tạo truyện” + Plus 18 |
| Khu tiếp tục | Nền trắng/kem nhạt; radius 12; padding 24; grid `112px minmax(0,1fr) auto`; gap 20 | Dùng một truyện thật; bỏ vòng tròn trang trí và slogan chiếm chỗ |
| Ảnh truyện tiếp tục | 112×84, ratio 4:3, radius 8, object-fit cover | Có fallback; không phóng ảnh khi hover |
| Text tiếp tục | H2 20/28; badge cách title 8; mô tả 14/22 margin-top 8, tối đa 2 dòng | Tên và trạng thái đủ để nhận diện truyện |
| CTA tiếp tục | B1 “Tiếp tục biên tập”, căn giữa theo vùng text | Một primary trong vùng; link tên cũng mở truyện, không lồng interactive |
| Thông tin phạm vi | Margin-top 16; 13/20 | “Trong 5 truyện cập nhật gần đây”; không làm số cục bộ trông như tổng kho |
| Nhóm tóm tắt | Một bề mặt chia 2 ô; padding 16 20; gap 24 | Bản nháp/Đã xuất bản trong dữ liệu gần đây; label 13, số 28 |
| Heading gần đây | Margin-top 32; margin-bottom 12; align center | H2 “Truyện cập nhật gần đây”; L1 “Xem tất cả” |
| Hàng truyện | Padding 16 0; grid `64px minmax(0,1fr) auto`; gap 16; divider giữa hàng | Thumbnail 64×48; tên 16/24; metadata 13/20; action I1 ArrowRight |
| Shortcut cuối | Margin-top 24; 2 link trong nhóm, gap 12, padding 16 | “Kho tư liệu”, “Hiệu quả nội dung”; icon 20; không trình bày chữ “Mở” như KPI |

### 6.2. Trạng thái, responsive và nghiệm thu

- Không có truyện: thay khu tiếp tục bằng empty với B1 Tạo truyện; không dựng dữ liệu minh họa trông như thật.
- Có truyện nhưng 5 item không có nháp: hiển thị “Truyện gần đây”, không tuyên bố không có nháp trong toàn kho. Nếu query draft riêng lỗi, lỗi chỉ ở vùng tiếp tục.
- Tablet khu tiếp tục có CTA ở hàng dưới bên phải, cách 16; mobile thumbnail 80×60, text cạnh ảnh, CTA full-width hàng dưới; padding 16.
- Hàng gần đây mobile giữ thumbnail 56×42, tên tối đa 2 dòng; nút mở 44 không bị ép. Shortcut xếp dọc.
- Loading: một block tiếp tục + 5 row skeleton; header và Tạo truyện vẫn hiện. Error có Thử lại trong vùng dữ liệu.
- Nghiệm thu: tại 1366×768 thấy header, khu tiếp tục và ít nhất heading/dòng đầu danh sách; tên 80 ký tự không đẩy CTA ra viewport.

## 7. Trang Kho truyện: `/content/stories`

File: `ContentStoriesPage.jsx`. Ưu tiên P1. Giữ filter, sort và pagination trong URL.

### 7.1. Đặc tả từng vùng

| Vùng/element | Thông số | Hành vi/nhãn |
| --- | --- | --- |
| Header | Margin-bottom 24; H1 30/38 | H1 “Kho truyện”; B1 “Tạo truyện” |
| Toolbar | Padding 16; radius 12; nền trắng; gap 12; grid search linh hoạt + 3 control | Không cần heading “Lọc story” lặp; label của control vẫn hiển thị |
| Search | Min-width 240, cao 44, icon trái 18; clear phải 44 | Label “Tìm truyện”; placeholder “Tên hoặc mô tả truyện”; debounce 300 ms |
| Trạng thái/chủ đề | Rộng mục tiêu 160/180; cao 44 | Khi không vừa chuyển hàng, không ép chữ |
| Sắp xếp | Rộng 180; cao 44 | Giá trị mặc định “Cập nhật gần nhất” |
| Active filters | Margin-top 12; gap 8; wrap | Chip + L1 “Xóa bộ lọc”; đổi filter trả page 1 |
| Results bar | Margin-block 16 12; min-height 24; font 13/20 | Tổng số + phạm vi kết quả; `aria-live` sau debounce |
| Story row | Padding 16; grid `96px minmax(0,1fr) auto`; gap 16; nền trắng | Divider giữa các row trong cùng list; hover nền subtle |
| Bìa | 96×72, radius 8, object-fit cover | Loading giữ tỷ lệ; ảnh lỗi hiện icon + “Chưa có ảnh bìa” |
| Tiêu đề | 16/24, 700; margin-top 6 dưới status row | Link có focus riêng, tối đa 2 dòng |
| Mô tả | 14/22; margin-top 4; tối đa 2 dòng | Không tooltip thay cho mô tả đầy đủ trong editor |
| Metadata | 13/20; margin-top 8; gap 12 | Số trang và ngày cập nhật; ngày đầy đủ trong title/chi tiết |
| Status row | Flex-wrap; gap 8; badge 26 cao | Trạng thái và “Chưa xuất bản thay đổi” tách nhau |
| Row action | B2 “Biên tập”, min-width 104, cao 44 | Không để toàn bộ row là button chứa link/button con |
| Pagination | Margin-top 20; padding-block 12; gap 12 | B2 Trước/Sau + “Trang x/y”; số kết quả bên trái |

### 7.2. Tương tác, responsive và nghiệm thu

- Input search cập nhật ngay tại máy; query và URL sau debounce. Clear cập nhật ngay; không tạo history entry mỗi ký tự. Chọn sort/filter không kéo focus khỏi control.
- Trong refetch: giữ hàng cũ, `aria-busy`; không cho dữ liệu response cũ ghi đè query mới. URL sai page/status có fallback rõ.
- Error tải cover/category độc lập với error danh sách; vẫn mở được truyện khi ảnh lỗi. Zero results có “Xóa bộ lọc”; kho thật sự rỗng có “Tạo truyện”.
- Tablet toolbar 2 cột, search span 2; mobile 1 cột, spacing 12. Không giấu filter sau icon không nhãn.
- Mobile row: ảnh 72×54 + text, gap 12; CTA ở hàng dưới canh phải hoặc full-width nếu chữ dài. Không dùng overflow hidden cắt badge.
- Pagination mobile: summary một hàng, Trước/Trang/Sau hàng dưới, target 44. Quay lại editor khôi phục filter/page và vị trí cuộn.
- Nghiệm thu: nhiều badge + tên dài vẫn rõ thứ bậc; nhấn Enter trên link tên mở đúng truyện; search refetch không gây nhảy chiều cao cả trang.

## 8. Trang Tạo truyện: `/content/stories/new`

File: `StoryEditorPage.jsx`, `StoryForm.jsx`. Ưu tiên P1. Dùng container form tối đa 1040 px trong main.

### 8.1. Đặc tả từng vùng

| Vùng/element | Thông số | UX |
| --- | --- | --- |
| Back + header | Back L1 cách H1 12; header margin-bottom 24 | “Kho truyện”; H1 “Tạo truyện mới” |
| Form surface | Padding 24; radius 12; grid `minmax(0,1fr) 320px`; gap 32 | Không thêm card quanh từng field |
| Intro form | 14/22, margin-bottom 24 | “Nhập tên và chủ đề để bắt đầu. Bạn có thể bổ sung ảnh bìa sau.” |
| Tên truyện | Input 44; label gap 8; counter margin-top 6 | Max 80 theo code; không đổi giới hạn âm thầm |
| Mô tả | Textarea min-height 144; cách field trước 20 | Max 240; helper/counter cùng hàng khi vừa |
| Chủ đề | Trigger 44; cách field trước 20 | Chọn một chủ đề; lỗi tải có retry riêng, không fallback thành category giả |
| Khu ảnh bìa | H2 18/26, margin-bottom 12 | Ảnh xem trước ratio 4:3, width 100%, radius 12 |
| Cover placeholder | Ratio 4:3; icon 28; text 14/22; gap 8 | B2 “Chọn ảnh bìa” dưới ảnh, margin-top 12 |
| Bìa đã chọn | Tên file 13/20 margin-top 8, wrap | B2 “Thay ảnh”; B3 “Bỏ chọn” nếu optional |
| Thẻ xem trước thông tin | Margin-top 20; title 18/26; mô tả 14/22; gap 8 | Dùng values đang gõ; placeholder ghi “Tên truyện” rõ là preview |
| Error summary | Padding 12 16, margin-bottom 20 | Link đúng field; không tự xóa input |
| Footer | Margin-top 24; padding-top 20; border-top; gap 8 | B2 “Hủy”; B1 “Tạo bản nháp và thêm trang” |

### 8.2. Tương tác, responsive và nghiệm thu

- Không autofocus field trên mobile để tránh mở bàn phím ngay khi vào trang. Desktop có thể focus H1; người dùng Tab tới tên truyện theo DOM.
- B1 chỉ pending khi request chạy; validation có thể chạy khi click để giải thích trường thiếu. Thành công đi tới pages với truyện đúng ID.
- Không có asset vẫn tạo được nháp nếu contract cho phép. Nếu tải category lỗi, giữ text đã nhập và cung cấp Thử lại tại field; không ghi category ngoài danh mục thật.
- Tablet khi content-width dưới 840 chuyển 1 cột; ảnh tối đa 360 px, canh trái. Mobile ảnh full-width tối đa 360, padding 16, gap 24; footer B1 full-width, B2 đứng trước theo DOM.
- Hủy có dirty dialog; API lỗi giữ toàn form; đóng asset picker không mất text. B1 pending giữ độ rộng và label đủ đọc.
- Nghiệm thu: có thể tạo nháp chỉ bằng bàn phím; label, counter và lỗi không đè nhau ở zoom 200%; không tạo hai truyện vì double click.

## 9. Trang Thông tin truyện: `/content/stories/:storyId`

File: `StoryMetadataPage.jsx`, `StoryForm.jsx`. Ưu tiên P1. Kế thừa toàn bộ field metric mục 8; các khác biệt bắt buộc:

| Element | Thông số/điều chỉnh | UX |
| --- | --- | --- |
| Panel heading | H2 “Thông tin truyện”, 20/28; margin-bottom 20 | Không lặp title “Thông tin story” lần nữa trong form |
| Notice nháp | Padding 12 16; margin-bottom 24; icon 20 | “Thay đổi sẽ hiển thị cho người đọc sau khi xuất bản.” |
| Form grid | Nội dung linh hoạt + 320 px preview; gap 32; padding 24 | Giữ thứ tự tên/mô tả/chủ đề và field name hiện tại |
| Publication summary | Dưới preview, margin-top 20; padding-top 16; font 13/20 | Phiên bản/lần xuất bản nếu có dữ liệu; không lộ revision thành nội dung chính |
| Footer status | Bên trái desktop, hàng trên mobile; min-height 44 | Có thay đổi chưa lưu / Đã lưu / Chưa lưu được |
| Footer actions | Gap 8; margin-top 24; B2 “Hoàn tác thay đổi”; B1 “Lưu thay đổi” | “Quay lại kho truyện” dùng breadcrumb thay vì Hủy mơ hồ |
| Lưu thành công | Status icon 16 + text; không đổi chiều cao footer | Reset baseline bằng server response, kể cả server chuẩn hóa text |
| Conflict | Notice trên footer, padding 16, margin-bottom 16 | Giữ input; B2 tải bản mới chỉ sau khi đã xử lý nguy cơ mất nội dung |

- Hoàn tác có xác nhận nếu dirty, đưa form về baseline đã lưu gần nhất và cập nhật preview. Không gửi mutation chỉ để hủy form.
- Server trả thành công nhưng user đã gõ tiếp trong lúc chờ: không đánh dấu input mới là đã lưu; quản lý snapshot request/baseline rõ ràng khi triển khai.
- Asset ID không tìm thấy: “Ảnh bìa không khả dụng” + Thay ảnh; không giả vờ chưa chọn. Lỗi ảnh không xóa coverAssetId âm thầm.
- Responsive giống trang tạo; footer wrap theo độ dài trạng thái, không đẩy action khỏi panel.
- Nghiệm thu: đổi bìa/mô tả thấy preview ngay; lưu nháp không đổi phiên bản xuất bản cũ; danh sách và overview được cập nhật sau save.

## 10. Trang Trang truyện: `.../pages`

File: `StoryPagesPage.jsx`, `StoryPageRenderer.jsx`. Ưu tiên P0. Đây là trang cần dành nhiều diện tích nhất cho tác vụ.

### 10.1. Phân bố chiều rộng và chiều cao

Gọi W là chiều rộng nội dung bên trong panel sau padding. W từ 1040 px: grid `192px minmax(480px, 1fr) 288px`, gap 16. W từ 760-1039: danh sách 176 px + vùng chính linh hoạt, thuộc tính chuyển xuống dưới canvas trong vùng chính. W dưới 760: dùng ba vùng chọn Trang / Xem trang / Thuộc tính, chỉ một vùng chính hiện một lần; selection và draft được giữ khi chuyển vùng.

Tại viewport 1366 px, rail 72 + main padding 48 + panel padding 48 để lại khoảng 1198 px: canvas khoảng 686 px với grid ba cột. Đây là phép tính mục tiêu, cần kiểm tra box model thật khi triển khai. Sidebar đầy đủ mở dạng overlay trong editor, không làm canvas co đột ngột.

Mặc định dùng document scroll, các cột ở flow. Chỉ cho danh sách trang cuộn riêng khi đủ chiều cao viewport; không tạo ba scrollbar cao cố định trên laptop. Thuộc tính dài vẫn cuộn tới được nút lưu. Canvas không bị kéo cao theo textarea ở cột bên cạnh.

### 10.2. Đặc tả từng phần tử

| Element | Kích thước/spacing | Hành vi |
| --- | --- | --- |
| Panel heading | H2 “Trang truyện”; margin-bottom 16; mô tả tối đa 1-2 dòng | B1 “Thêm trang” + Plus 18; đang tạo thì focus form hiện tại thay vì mở bản thứ hai |
| List heading | 14/20, 700; padding 8 12; gap 8 với tổng trang | Tổng dựa trên pages.length |
| Item trang | Padding 10 12; gap 10; radius 10; min-height 76 | Thumb 56×42, số 12/18, tên 14/20 tối đa 2 dòng |
| Item selected | Border 1 px selected; nền selected; marker/check riêng | Không chỉ đổi màu; `aria-current` hoặc selected semantics phù hợp |
| Item hover | Nền subtle; border đã chiếm chỗ | Không phóng thumbnail |
| Action của item | Menu I1 ở item đang chọn; menu option 44 cao | “Đưa lên”, “Đưa xuống”, “Xóa trang”; disable đầu/cuối có giải thích |
| Canvas toolbar | Min-height 44; gap 8; margin-bottom 12 | Tên/số trang 14/20; I1 lên/xuống nếu chưa dùng menu; tránh trùng hai bộ reorder |
| Nhãn bản xem | 13/20, margin-bottom 8 | “Bản đang chỉnh sửa” khi dirty; “Bản đã lưu” khi sạch |
| Canvas surface | Width 100%; ratio 16:9 hiện tại; radius 12; border 1 | Giữ ratio theo contract, không đổi theo cảm tính; dùng chung renderer |
| Vùng nền canvas | Subtle để nhìn được ảnh trong suốt; không thêm texture lên artwork | Lỗi background có thông báo rõ và link chọn lại |
| Vùng chữ truyện | Padding tham chiếu 24 ở canvas rộng; chữ 16/24 trở lên trong chế độ đọc độc lập | Bố cục chữ thuộc story renderer, không tùy tiện thay để vừa editor |
| Outline nhân vật chọn | Viền kép 2 px, không ảnh hưởng size | Không ép ảnh vào hình tròn; object-fit contain, giữ transparency |
| Properties heading | 16/24; padding-bottom 12; margin-bottom 16; divider | “Nội dung trang” hoặc tên vai đang chọn |
| Properties panel | Padding 16, radius 12, nền trắng; border | Không dùng nền vàng toàn panel gây cạnh tranh với selected |
| Field trong properties | Gap 16 thay cho form lớn 20; label 13/20 | Control vẫn 44 cao và text 15; không thu nhỏ để ép vừa |
| Title trang | Input 44; counter 13/20 cách 6 | Giới hạn 120 theo validate hiện tại |
| Nội dung trang | Textarea min-height 168; line-height 24; resize vertical | Live preview cập nhật từ draft; không gọi save mỗi ký tự |
| Ảnh nền | Preview 96×72 + tên bên cạnh hoặc full-width khi chọn | B2 “Chọn ảnh nền”; picker lọc ảnh |
| Lời đọc | Textarea min-height 96; section gap 20 | Label “Lời đọc (tùy chọn)”; không vẽ nút play nếu chỉ có text |
| Footer properties | Border-top; margin-top 20; padding-top 16; gap 8 | B1 “Lưu trang”, status 13/20; khi slot thì “Lưu vị trí” |

### 10.3. Khi chọn vị trí nhân vật

- Link B3 “Thuộc tính trang” ở đầu properties, min-height 44, margin-bottom 8; chuyển về trang không làm mất slotDraft âm thầm.
- Tên vai 16/24 + thumb 40×40; gap 12, margin-bottom 16. Picker “Ảnh riêng tại vị trí này” giải thích fallback về ảnh mặc định của vai; không gọi “Asset override”.
- Dịch ngang và Dịch dọc: grid 2 cột gap 12; input number cao 44; suffix % ở vùng riêng padding-right 36. Min 0, max 100; error cạnh nhóm khi vượt giới hạn.
- Kích thước: number step 0.1, min theo contract; label phụ giải thích 1 = kích thước gốc. Thứ tự lớp: số nguyên từ 1, hint “Số lớn nằm phía trước”.
- Lật ngang: checkbox row 44, margin-top 12. Anchor chỉ center được hỗ trợ thì hiển thị read-only “Neo giữa”, không một dropdown chỉ có một lựa chọn.
- Mỗi thay đổi cập nhật local composed story cho canvas; nút Lưu vị trí mới gửi mutation. Chuyển slot khác khi dirty xử lý trước khi thay selectedId.
- P2 kéo/resize: chỉ thêm sau review Mobile; bounding box có handle 12 px, vùng kéo chạm tối thiểu 44; hỗ trợ điều chỉnh bằng số và bàn phím. Không tự cam kết thao tác này đã có.

### 10.4. Form thêm trang, xóa và lỗi

- Tạo trang dùng cùng properties panel ở trạng thái “Trang mới”; focus title sau hành động Thêm trang. Không chèn thêm một form đầy đủ phía trên canvas như hiện tại.
- B2 Hủy + B1 “Thêm trang”; cancel dirty phải hỏi. Save thành công chọn trang vừa tạo, đưa list item vào view, giữ focus ổn định ở properties heading.
- Xóa mở dialog 440 px. Title “Xóa trang này?”; body nêu tên và số vị trí liên quan. Từ vựng/câu hỏi có ảnh hưởng chỉ mô tả khi contract xác nhận; lỗi dependency có link xử lý.
- Reorder giữ pageId, chọn nguyên trang, không reset text đang sửa. Nếu chưa thể reorder trong dirty mode thì giải thích và yêu cầu lưu trước; không âm thầm bỏ dữ liệu.
- Nội dung dài không được clip bởi `overflow:hidden` mà không báo. Chế độ kiểm tra hiện cảnh báo text tràn và link sửa; chế độ đọc phải theo đúng Mobile contract. Chưa có contract thì ghi rõ giới hạn mô phỏng.
- Không có vai trên trang là trạng thái hợp lệ: đưa lời gợi ý ra ngoài canvas, không che giữa ảnh bằng “No role slots”. Thiếu asset thực sự mới là cảnh báo trên canvas.
- Nghiệm thu: một đường sửa mỗi field; live canvas và saved preview thống nhất sau lưu; không crop hình nhân vật do radius; tất cả control dùng được ở laptop thấp và mobile.

## 11. Trang Vai nhân vật: `.../roles`

File: `StoryRolesPage.jsx`. Ưu tiên P1. Một vai có nhiều vị trí xuất hiện; UI phải biểu đạt hai cấp này.

### 11.1. Bố cục và phần tử

W từ 900 px: danh sách vai 280 px + vùng chi tiết linh hoạt, gap 24. W dưới 900: danh sách trước, chi tiết sau; trên mobile chọn vai mở vùng chi tiết với B3 “Danh sách vai”, giữ draft khi qua lại theo guard.

| Element | Metric | Nội dung/hành vi |
| --- | --- | --- |
| Heading | H2 20/28; margin-bottom 20 | “Vai nhân vật”; B1 “Thêm vai” |
| Item vai | Padding 12; gap 12; min-height 76; radius 10 | Avatar 48×48 object-fit contain; tên 15/22; số vị trí 13/20 |
| Trạng thái vai | Badge 26 cao; margin-top 6; wrap | “Cho phép thay nhân vật”, “Cần phụ huynh cho phép” |
| Panel chi tiết | Padding 24; trên mobile 16 | Heading 18/26 + menu I1; divider margin-block 16 |
| Tên vai | Input 44; label 8; counter 60 ký tự | Giữ limit 60 theo code |
| Ảnh mặc định | Khu preview 120×120, nền subtle, radius 10; margin-top 20 | Giữ ảnh trong suốt; B2 chọn/thay ảnh dưới preview cách 12 |
| Checkbox custom | Hàng min-height 44, gap 10; margin-top 20 | “Cho phép dùng nhân vật của bé”; helper 13/20 margin-top 4 |
| Checkbox sensitive | Hàng min-height 44, cách hàng trước 12 | “Vai cần phụ huynh cho phép”; giải thích theo contract, không tự sửa quyền |
| Footer vai | Margin-top 24, gap 8 | B2 Hủy sửa; B1 Lưu vai; status nằm trước action |
| Heading vị trí | Margin-top 32; H3 16/24 | Tổng số + B2 “Thêm vị trí” |
| Hàng vị trí | Padding 12 0; gap 12; grid `56px 1fr auto` | Thumb trang 56×42; tên trang 14/20; vị trí 13/20 |
| Link mở vị trí | L1 cao 44, icon ArrowRight 16 | “Mở trên trang”; deep link pageId + slotId |
| Xóa vị trí | I1 Trash; gap 8 với link | Aria-label gồm vai + số trang; xác nhận nhỏ có tên đối tượng |
| Form vị trí mới | Margin-top 16; padding 16; nền subtle; gap 16 | Chọn trang trước; B1 “Thêm vị trí” |

### 11.2. Chi tiết thao tác và nghiệm thu

- Khi chưa chọn vai, panel chi tiết ghi “Chọn một vai để chỉnh sửa”; khi chưa có vai, empty CTA Thêm vai. Không tạo form slot cho tất cả vai cùng lúc.
- Form thêm vị trí chỉ hiện khi được gọi. Vị trí mặc định dùng thông số contract, người dùng có thể mở canvas để chỉnh; không bày 5 input nhỏ ngang nhau trên mobile.
- Vai nhạy cảm không dùng màu đỏ như lỗi. Badge warning với nhãn đầy đủ; không dùng biểu tượng khóa làm người dùng tưởng đã mất quyền sửa.
- Xóa vai: dialog nêu số vị trí sẽ xóa theo dữ liệu thật, focus ban đầu ở Hủy; thành công focus item kế tiếp hoặc Thêm vai nếu rỗng.
- Role name dài wrap hai dòng; badge chuyển hàng; icon action vẫn 44. Selected không làm thay đổi padding list.
- Nghiệm thu: link “Mở trên trang” chọn đúng slot, không mở mặc định trang đầu; cancel form vai/slot có guard; cập nhật giữ nguyên roleId/slotId.

## 12. Trang Từ vựng: `.../vocabulary`

File: `StoryVocabularyPage.jsx`. Ưu tiên P1. Giúp kiểm tra từ trong ngữ cảnh, chỉnh nhanh từng mục.

### 12.1. Bố cục và phần tử

W từ 960: list 320 px + form linh hoạt, gap 24. W 760-959: list 260 px + form; dưới 760 chọn danh sách hoặc form, có nút quay lại rõ. Mỗi form chỉ sửa một mục.

| Element | Metric | UX |
| --- | --- | --- |
| Heading | H2 20/28, margin-bottom 20 | “Từ vựng”; số từ badge neutral; B1 “Thêm từ” |
| Search list | Cao 44; margin-bottom 12; icon 18 | Label “Tìm từ vựng”; lọc local nếu toàn bộ dữ liệu đã tải |
| Filter trang | Cao 44; margin-bottom 16 | “Tất cả trang”; giữ lựa chọn khi sửa/xóa mục |
| Item từ | Padding 12; gap 6; min-height 80; radius 10 | Từ 16/24 weight 700; nghĩa 14/22 tối đa 2 dòng; trang 13/20 |
| Audio indicator | Icon Speaker 16 cạnh metadata | Chỉ báo có audio; nghe ở nút riêng I1, không lồng trong button chọn item |
| Form heading | 18/26; margin-bottom 20 | “Thêm từ vựng” hoặc “Sửa từ vựng”; nút đóng I1 |
| Chọn trang | Trigger 44, label gap 8 | Mục hiển thị “Trang 3: Tên trang”, option wrap |
| Trích đoạn | Margin-top 12; padding 16; nền subtle; chữ 14/24 | Nội dung của trang đã chọn; max-height 160 với Mở rộng, không cắt nghĩa im lặng |
| Từ/cụm từ | Input 44; margin-top 20 | Không ép thành một từ; giữ dấu tiếng Việt |
| Nghĩa | Textarea min-height 120; margin-top 20 | Helper “Giải thích ngắn, dễ hiểu cho trẻ”; không thêm giới hạn server chưa có |
| Audio URL | Input 44; margin-top 20; type phù hợp | Nhãn “Âm thanh (tùy chọn)”; giữ URL khi lưu lỗi |
| Player | Margin-top 12; width 100%; vùng cao ít nhất 44 | Native audio có label; không autoplay |
| Cảnh báo từ/ngữ cảnh | Padding 12; margin-top 12; warning nhẹ | Từ không tìm thấy chỉ cảnh báo, không khóa lưu |
| Footer | Margin-top 24; padding-top 16; divider; gap 8 | B2 Hủy sửa; B1 “Thêm từ” hoặc “Lưu từ” |

### 12.2. Trạng thái và nghiệm thu

- Chưa có trang: empty “Thêm trang truyện trước khi thêm từ vựng”, B1 “Thêm trang truyện”; form chưa sẵn sàng không chỉ hiện nút disabled vô cớ.
- Không có từ theo filter: hiện “Không có từ trong trang này” và CTA thêm gắn sẵn trang; không xóa bộ lọc người dùng khi reset form.
- Audio lỗi: text 13/20 ngay dưới player và retry/tải lại; không kéo toàn form vào error state. URL dài trong danh sách được thay bằng trạng thái “Có âm thanh”.
- Trùng từ + trang: hiển thị cảnh báo và link mở mục hiện có, không tự merge. Nếu contract cho phép trùng, người dùng vẫn quyết định.
- Xóa: action trong menu của item/detail; dialog nêu từ và trang; thành công focus item tiếp theo. Không thêm Undo nếu backend chưa có cách khôi phục entity đúng ID.
- Khi lọc làm item đang sửa biến mất: giữ form và ghi item không thuộc kết quả hiện tại; hoặc guard trước khi đóng, không mất text.
- Nghiệm thu: từ dài/không có khoảng trắng wrap; chọn trang thay đổi trích đoạn chính xác; lỗi word/meaning được nối đúng label và focus.

## 13. Trang Câu hỏi: `.../quizzes`

File: `StoryQuizPage.jsx`. Validation và radio cho `correctIndex=null` đã sửa trong working tree; giữ regression test. Ưu tiên P0 cho bảo vệ dữ liệu/hành vi còn thiếu, P1 cho bố cục.

### 13.1. Bố cục

W từ 1120: danh sách 240 + form `minmax(400px,1fr)` + vùng làm thử 320, gap 20. W 800-1119: danh sách 240 + form linh hoạt, phần thử chuyển thành tab trong vùng form. W dưới 800: danh sách và chi tiết tách view, chi tiết có chuyển Soạn câu hỏi / Làm thử.

| Element | Metric | UX |
| --- | --- | --- |
| Heading | H2 20/28; margin-bottom 20 | “Câu hỏi”; B1 “Thêm câu hỏi”; ghi tùy chọn trong mô tả |
| Question list item | Padding 12; min-height 88; gap 6; radius 10 | Số câu 12/18, câu hỏi 15/22 tối đa 3 dòng, trang 13/20 |
| Form header | 18/26; margin-bottom 20 | Một câu đang sửa, không tạo form song song |
| Trang liên kết | Select 44; gap tới field kế 20 | Chọn đúng pageId, giải thích ngữ cảnh câu hỏi |
| Nội dung câu hỏi | Textarea min-height 120 | 15/24; label “Câu hỏi”; không placeholder thay label |
| Nhóm đáp án | Fieldset margin-top 24; legend 14/20 weight 700; helper margin-top 6 | “Chọn một đáp án đúng”; ban đầu chưa chọn |
| Hàng đáp án | Padding 12; border 1; radius 10; gap 12; margin-top 12 | Grid chữ A/B/C 24 + input linh hoạt + radio; không fixed-height nếu wrap |
| Input đáp án | Min-height 44; font 15/22 | Dài được chỉnh trong textarea auto-grow khi cần, không cắt dữ liệu |
| Radio đúng | Control 20, label target tối thiểu 44 | “Đáp án đúng”; cùng name, không dùng Number(null) để checked |
| Hàng được chọn đúng | Viền semantic success + chữ “Đúng”/check | Không chỉ màu nền; chỉ hiện ở chế độ soạn |
| Lỗi chưa chọn | Margin-top 8; font 13/20, icon 16 | Nối vào fieldset, focus radio đầu khi submit lỗi |
| Phản hồi | Textarea min-height 96; margin-top 24 | “Phản hồi sau câu trả lời”; helper mô tả đúng một field hiện có |
| Audio URL | Input 44; margin-top 20 | Tùy chọn; nghe thử có lỗi riêng |
| Footer | Margin-top 24; gap 8; status trước action | B2 Hủy; B1 “Lưu câu hỏi”; B3 “Làm thử” nếu preview không hiện cạnh |

### 13.2. Vùng làm thử

- Panel padding 20, radius 12, nền subtle; header “Làm thử” 16/24; notice 13/20 “Kết quả thử không được lưu”.
- Câu hỏi 18/28, margin-top 16; đáp án là button full-width min-height 48, padding 12 16, gap 12 giữa các nút, text align-left và wrap.
- Không đánh dấu đáp án đúng trước khi trả lời. Khi chọn: viền selected, phản hồi icon + text ở block margin-top 16/padding 12. Phản hồi đúng/sai dùng data hiện có, không tự tạo hai trường mới trong schema.
- “Làm lại” B2 margin-top 16; reset choice khi nội dung/đáp án đúng thay đổi. Khi chưa có đáp án đúng trong form, thông báo chưa thể chấm thử và vẫn giữ preview câu chữ.
- Chế độ preview không gửi kết quả vào analytics. Đóng preview không xóa giá trị form.

### 13.3. Responsive, trạng thái và nghiệm thu

- Mobile mỗi đáp án xếp input toàn hàng, radio ở hàng dưới; chữ A/B/C sát label; khoảng field 20. Không ép radio và input vào cùng hàng hẹp.
- Chưa có trang có CTA thêm trang. Không có quiz là trạng thái hợp lệ, không dùng warning “chưa hoàn thành” hoặc chặn publish chỉ vì chưa có quiz.
- Error validation đặt cạnh câu hỏi/option/nhóm radio; summary cho nhiều lỗi. B1 pending khóa double submit, mọi radio giữ value.
- Xóa câu hỏi cần xác nhận tên rút gọn tối đa 2 dòng; có thể xem đầy đủ trong body wrap. Bỏ sửa guard nếu dirty.
- Nghiệm thu bắt buộc: `correctIndex=null` làm cả 3 radio unchecked và save bị chặn; chọn index 0 hợp lệ; đổi câu hỏi reset phần làm thử; keyboard chọn radio bằng Arrow hoạt động.

## 14. Trang Xem trước và xuất bản: `.../preview`

File: `StoryPreviewPage.jsx`, `StoryPageRenderer.jsx`, `PublishIssues.jsx`, layout editor. Ưu tiên P0.

### 14.1. Bố cục và phần tử

W từ 1080: điều hướng trang 176 + preview `minmax(480px,1fr)` + checklist 280, gap 20. W 800-1079: điều hướng 160 + preview; checklist xuống dưới preview. W dưới 800: chọn trang dạng dropdown 44 cao; preview và checklist xếp dọc. Không ép khung truyện xuống dưới chiều rộng có thể đọc.

| Element | Metric | UX |
| --- | --- | --- |
| Heading | H2 “Xem trước”; margin-bottom 16 | Description “Bản nháp đã lưu”; revision trong chi tiết phụ |
| Mode switch | Group padding 4, gap 4; button min-height 40, padding 8 12 | “Đọc thử” / “Kiểm tra”; aria-pressed hoặc tab semantics đầy đủ |
| List trang | Như trang Pages; item min-height 64 | Số + tên, selected rõ, không liệt kê đáp án tại đây |
| Toolbar đọc | Min-height 44; margin-bottom 12; gap 8 | I1 Trước/Sau, text “Trang x/y” 14/20; disable ở hai đầu |
| Canvas | Cùng renderer/ratio với pages; giữ space trước khi load | Không tạo bản render riêng dẫn tới lệch vị trí |
| Chọn khung | B2/segmented control 44 | “Vừa vùng xem”, “Khung điện thoại” chỉ là mô phỏng có nhãn giới hạn |
| Cảnh báo media | Notice margin-bottom 12, padding 12 16 | Nêu cụ thể nền/nhân vật/audio lỗi; nút Thử lại |
| Nội dung học tập | Margin-top 24; gap 16; grid 2 cột khi mỗi cột ít nhất 280 | Mobile 1 cột, title 16/24; item padding 12 |
| Từ vựng | Từ 16/24, nghĩa 14/22, gap 6; player margin-top 12 | Audio không tự phát |
| Quiz đọc thử | Câu 18/28; options 48 cao, gap 12 | Ẩn đáp án đúng; feedback sau trả lời; reset khi đổi trang |
| Checklist panel | Padding 20; radius 12; border | H3 18/26; text 14/22; trạng thái kiểm tra 13/20 |
| Checklist row | Padding-block 12; icon 20; gap 10 | Đủ / Cần sửa / Chưa kiểm tra, dựa trên validate thật |
| Error row | Link cao ít nhất 44; padding 10 12; margin-top 8 | Message tiếng Việt + tên entity; không dùng raw fieldPath làm label |
| Action kiểm tra | B2 full-width; margin-top 16 | “Kiểm tra nội dung”; busy chỉ khi đang kiểm tra |
| Action xuất bản | B1 full-width; margin-top 12 | “Xuất bản phiên bản mới”; có lý do nếu chưa được phép |

### 14.2. Checklist, xác nhận và kết quả

- Checklist gồm nhóm dữ liệu thực theo validation: thông tin, trang, tư liệu, vai nếu có, từ vựng/câu hỏi nếu có. Không tự áp bắt buộc ảnh/từ/quiz khác contract.
- Chưa kiểm tra: trạng thái neutral. Kiểm tra lỗi: số mục cần sửa + link, không chỉ toast. Revision đổi: “Bản nháp đã thay đổi, hãy kiểm tra lại”.
- Từ link lỗi quay về editor: nhớ trang preview và mode; sau sửa có L1 “Quay lại xem trước”. Không lưu origin là URL ngoài miền không kiểm soát.
- Dialog xuất bản width 480, padding 24, title 20/28; thumb 64×48 cạnh tên 16/24, gap 12, margin-top 16. Body giải thích tạo phiên bản mới từ bản đã lưu. Footer margin-top 24, B2 Hủy + B1 Xuất bản.
- Sau thành công: notice success hiển thị version trả từ server, CTA tiếp tục biên tập; không mở đường dẫn công khai nếu sản phẩm chưa có route đó.
- Ẩn truyện nằm trong menu hành động phụ, B4 chỉ trong dialog xác nhận. Phân biệt ẩn khỏi danh mục với xóa dữ liệu/version.
- Pending publish không cho trigger lại; khi lỗi có retry rõ, giữ version/snapshot đang hiển thị. Chỉ báo thành công sau response xác nhận.

### 14.3. Nghiệm thu

- Chế độ kiểm tra có thể hiện đáp án đúng; chế độ đọc thử không lộ trước đáp án. Hệ thống không ghi nhận lượt đọc/quiz từ thao tác thử nội bộ.
- Khi canvas nhỏ, không giảm font truyện vô hạn. Cho mở vùng đọc rộng hoặc hiển thị phần văn bản đầy đủ bên dưới để kiểm tra; phải phân biệt phần trợ giúp này với nội dung Mobile thật.
- Phím trái/phải chỉ đổi trang khi focus trong reader và không ở input/audio/select. Có nút tương đương cho touch.
- Error tải asset và error preview được xử lý độc lập; empty có B1 Thêm trang. Không hiện bản dữ liệu fallback như thể preview server đã thành công.
- Saved preview không bao gồm dữ liệu form chưa lưu; live preview ở trang Pages phải ghi nhãn khác. Đây là tiêu chí chặn phát hành nếu sai.

## 15. Trang Kho tư liệu: `/content/assets`

File: `AssetsPage.jsx`, `AssetPicker.jsx`, `assetService.js`. Ưu tiên P1. Phân biệt quản lý kho với chọn file cho một field.

### 15.1. Trang kho: từng phần tử

| Element | Metric/layout | UX |
| --- | --- | --- |
| Header | H1 “Kho tư liệu”; margin-bottom 24 | B1 “Tải ảnh lên” + Upload 18; mô tả đúng khả năng hiện tại |
| Toolbar | Padding 16; gap 12; nền trắng; radius 12 | Search linh hoạt + type filter 160 px; summary 13/20 phía dưới cách 12 |
| Search | Input cao 44, icon 18; min-width 240 khi desktop | “Tìm theo tên tư liệu”; clear I1 |
| Type filter | Cao 44; image/audio chỉ khi dữ liệu hỗ trợ | Nếu audio chưa hỗ trợ ở kho, không trình bày như tính năng upload đang có |
| Grid + detail | W từ 1000: `minmax(0,1fr) 304px`, gap 24 | Detail chỉ xuất hiện khi chọn item; không đẩy grid xuống xa |
| Asset grid | `repeat(auto-fill,minmax(160px,1fr))`, gap 16 | Mobile 2 cột gap 12 nếu mỗi tile ít nhất 144 px; hẹp hơn dùng 1 cột |
| Asset tile | Padding 8; border 1; radius 12; nền trắng | Toàn tile là button chọn, không chứa player/button con |
| Thumbnail | Ratio 4:3, radius 8, object-fit contain | Ảnh nền/bìa có thể cover ở gallery nhưng detail luôn xem đủ; ảnh nhân vật không crop |
| Tên file | 14/20 weight 700; margin-top 10; tối đa 2 dòng | Detail hiển thị đầy đủ với overflow-wrap:anywhere |
| Metadata | 13/20; margin-top 4; padding-bottom 4 | Dung lượng và loại, không lấy ID làm mô tả chính |
| Processing state | Text 12/18 dưới metadata, margin-top 6 | Có label Sẵn sàng/Đang xử lý/Lỗi nếu server cung cấp |
| Selected tile | Viền 2 px qua inset shadow để không đổi kích thước + check 18 ngoài ảnh | `aria-pressed`/selected semantics; không chỉ nền vàng |
| Detail panel | Padding 20, radius 12, border; close I1 | Preview đầy đủ, tên, metadata, thông tin phụ |
| Detail media | Ratio theo nội dung, max-height 280; object-fit contain | Audio dùng player và biểu tượng file, không dùng img cho audio |
| Detail metadata | `dl` gap 12, label 13/20, value 14/22 | Width/height/duration chỉ khi có dữ liệu; ID ở disclosure “Chi tiết kỹ thuật” |

### 15.2. Upload panel

- B1 Tải ảnh lên mở dialog width 560, max-height theo viewport; header “Tải ảnh lên”, padding 24, description 14/22 cách 8.
- Dropzone min-height 180, padding 24, border dashed 1 control-border, radius 12, nền subtle; icon 32 → title cách 12 → định dạng cách 8. Có B2 “Chọn ảnh từ máy”, dùng được bằng bàn phím, không chỉ kéo thả.
- Hiển thị đúng “PNG, JPG, WEBP hoặc GIF, tối đa 5 MB”. Một file mỗi lần ở đợt đầu theo API hiện có. Không vẽ lựa chọn tải audio hoặc nhiều file nếu chưa triển khai.
- Sau chọn: preview 96×72 + tên/dung lượng, gap 16; tên wrap; B3 “Chọn ảnh khác”. File validation lỗi ở dưới dropzone cách 12; không giữ file cũ nhưng hiển thị tên file mới gây nhầm.
- Footer margin-top 24, gap 8; B2 Hủy và B1 “Tải lên”. Trong pending: B1 Đang tải, B2 “Hủy tải”; không có phần trăm giả. Chỉ dùng progress determinate nếu transport thật có byte progress.
- Cancel giữ file đã chọn để thử lại nếu behavior đã có. Nếu request có thể đã hoàn tất phía server, refresh kho để xác định trạng thái; không tuyên bố chắc chắn không có file sau abort.
- Thành công chọn/highlight asset mới, đóng dialog hoặc cho “Tải ảnh khác” theo flow thống nhất; trả focus đến tile vừa tải. Inline/toast báo thành công một lần.
- Error: giữ preview/file, B1 “Thử tải lại”, message 14/22; nếu file sai định dạng thì CTA “Chọn ảnh khác”. Không tự gửi lại mutation nền mà người dùng không biết.

### 15.3. AssetPicker dùng trong tất cả form

| Element | Metric | Behavior |
| --- | --- | --- |
| Field chưa chọn | Placeholder ảnh 96×72 cạnh B2 “Chọn tư liệu”; gap 12 | Giữ label gắn field; không kèm select và thumbnail list trùng lặp |
| Field đã chọn | Thumb 80×60, tên 14/20, metadata 13/20 | B2 Thay + B3 Bỏ chọn nếu optional; action gap 8 |
| Picker dialog | Width 880, max-width `100vw - 32px`; padding 24 | Title cụ thể “Chọn ảnh bìa”/“Chọn ảnh nền” |
| Search | Margin-block 20 16; input 44 | Focus ban đầu vào search trên desktop; mobile focus title để tránh bàn phím tự mở |
| Grid | Columns minmax 144, gap 12; body scroll | Lọc đúng kind ngay đầu, giữ item selected thấy được sau tìm kiếm |
| Selection summary | Margin-top 16; font 14/22 | “Đã chọn: tên file”; thumb 40×30 nếu đủ chỗ |
| Footer | Padding-top 16; margin-top 16; border-top; gap 8 | B2 Hủy; B1 “Dùng ảnh này”; disabled khi chưa chọn hợp lệ |

- Chọn tile chỉ đổi draft selection; chỉ B1 xác nhận mới đổi form bên ngoài. Hủy/Escape giữ asset cũ. Nút Bỏ chọn là hành động riêng rõ ràng, tránh hiểu “không chọn tile” thành xóa asset.
- Missing/failed/processing hoặc sai loại không thể xác nhận; tile ghi lý do bằng text. Rà tất cả đường chọn, kể cả select fallback nếu còn tồn tại trong giai đoạn chuyển đổi.
- Picker chỉ chọn ảnh khi field cần ảnh; audio URL hiện có tiếp tục được quản lý riêng. Tải lên trực tiếp trong picker là P2; tránh dialog lồng dialog ở đợt đầu.
- Focus trap, background inert, trả focus trigger, Escape; khi có modal hệ thống chọn file trả lại browser, focus vẫn ở dialog. Screen reader biết lựa chọn hiện tại.
- Mobile picker full-screen, padding 16, header/footer có safe-area; grid 2 cột nếu đủ 144 px mỗi tile, một cột trên màn quá hẹp.

### 15.4. Responsive và nghiệm thu

- Detail panel chuyển thành drawer hoặc vùng chi tiết toàn chiều rộng khi W dưới 1000; không giữ panel 304 px cạnh grid chật. Mobile mở detail có Back và đóng 44 px.
- Grid loading giữ tỷ lệ ảnh; error thư viện có retry; zero search có Xóa tìm kiếm; kho rỗng có Tải ảnh lên.
- Không bổ sung nút xóa/thay bytes asset đang tham chiếu trong scope hiện tại. “Đang được dùng ở đâu” chỉ hiện nếu có endpoint và phạm vi version đáng tin.
- Nghiệm thu: tên file 100 ký tự không làm rộng tile; GIF/PNG trong suốt xem đúng; file lỗi bị chặn; picker cancel không đổi form; upload không phụ thuộc thao tác drag.

## 16. Trang Hiệu quả nội dung: `/content/statistics`

File: `ContentStatisticsPage.jsx`. Ưu tiên P1. Dữ liệu phải giúp quyết định mở truyện nào để cải thiện.

### 16.1. Bố cục và thành phần

| Element | Metric | UX |
| --- | --- | --- |
| Header | H1 30/38, description 15/24 dưới 8 px | “Hiệu quả nội dung”; control thời gian bên phải |
| Range | Label 13/20, gap 8, select 200×44 | Giữ 7/30 ngày và query range hiện tại |
| Scope note | Font 13/20, margin-bottom 16 | Khoảng dữ liệu và định nghĩa ngắn có nguồn; không suy đoán kỳ |
| KPI strip | Một surface, radius 12; grid 3 cột; padding 24; gap 24 | Lượt đọc / Người đọc hoạt động / Tỷ lệ hoàn thành |
| KPI label | 14/20, secondary; icon info I1 nếu có help | Không dùng acronym hoặc “do Backend định nghĩa” |
| KPI value | 32/40; margin-top 8; tabular-nums | Không animate đếm; đơn vị 13/20 cạnh hoặc dưới |
| Tooltip định nghĩa | Width 260, padding 12; chữ 13/20 | Hover/focus/click mở; close bằng Escape; đủ thông tin trên touch |
| Quy mô kho | Margin-top 16; padding 16 20; flex wrap gap 24 | Truyện đã xuất bản / Bản nháp; không trộn với KPI theo kỳ nếu phạm vi khác |
| Vùng chart/list | Margin-top 32; gap 24; grid 1.15fr/1fr nếu W đủ 1040 | Hẹp hơn xếp dọc, chart trước |
| Chart panel | Padding 24; radius 12; title 20/28 | “Lượt đọc theo ngày”; đơn vị hiển thị trên trục |
| Chart plot | Height 260 desktop/220 mobile; margin-top 20 | Dành gutter y 48, x 32; trục x label 12/18 |
| Data point | Focus target riêng; tooltip có ngày + số lượt | 30 ngày thưa nhãn, không thưa dữ liệu; không ép 30 label chồng nhau |
| Zero baseline | Trục/nhãn 0 rõ | No data khác mọi điểm bằng 0 |
| Bảng dữ liệu thay thế | B3 “Xem số liệu”; margin-top 16 | Semantic table, header 44, row min-height 44; sticky không che focus |
| Top truyện | Title 20/28; margin-bottom 16 | Cột tên/lượt đọc/hoàn thành; sort chỉ nếu dữ liệu hỗ trợ đầy đủ |
| Row truyện | Padding 14 0; min-height 72; gap 12 | Tên link 15/22, thumb 48×36 nếu data có; số căn phải, tabular |
| Partial warning | Padding 12 16; margin-block 16; body 14/22 | Nêu vùng thiếu; số liệu tốt còn lại vẫn hiện |

### 16.2. Dữ liệu, responsive và nghiệm thu

- Không có kỳ trước thì không hiện mũi tên tăng/giảm, phần trăm tăng trưởng hoặc so sánh tự dựng. Không thêm export khi chưa có yêu cầu/API.
- Không biết mẫu số completionRate: cần thống nhất trước tích hợp; UI hiển thị giải thích hợp lệ khi có, chưa có thì ghi “Chưa có định nghĩa chỉ số” tại phần trợ giúp thay vì tự bịa công thức.
- Null/undefined hiển thị “Chưa có dữ liệu”, 0 hiển thị “0”; không biến null thành 0. Loading dùng skeleton ở vị trí số để label/range giữ nguyên.
- Khi range đổi, giữ dữ liệu cũ có trạng thái đang cập nhật và nhãn kỳ cũ cho tới response mới hoặc skeleton các metric; không gắn nhãn kỳ mới lên số kỳ cũ mà không giải thích.
- Top story badge dựa status thật; row không clickable nếu không có quyền/ID hợp lệ, có giải thích. Không dùng success tone cố định cho mọi truyện.
- Tablet KPI strip 3 cột nếu mỗi ô đủ 180 px; nhỏ hơn xếp dọc. Mobile padding 16, số 28/36, divider giữa ô, range full-width dưới heading.
- Chart giảm số nhãn ngày theo width, vẫn có bảng đầy đủ. Top list mobile tên hàng trên, 2 metric hàng dưới gap 24; không cuộn ngang toàn trang.
- Nghiệm thu: screen reader đọc được số liệu không cần chart; đổi range cập nhật KPI/chart/list đồng bộ; ngày/đơn vị không mơ hồ; dữ liệu thật mới được dùng để nhận xét hiệu quả.

## 17. Trang Hồ sơ tài khoản: `/profile`, biến thể Content Manager

File: `ProfilePage.jsx`, `profile.css`. Phạm vi phụ P2, vẫn đặc tả đầy đủ vì role sử dụng được trang này. Tất cả style phải giới hạn theo biến thể role, tránh thay giao diện Parent/Admin ngoài yêu cầu.

| Element | Metric | UX |
| --- | --- | --- |
| Container | Max-width 1040 gồm padding; header chuẩn | H1 “Hồ sơ tài khoản”; B2 “Về tổng quan” |
| Identity surface | Padding 24; radius 12; flex gap 20 | Avatar có thật hoặc initials từ tên, 72×72, radius 12 |
| Identity name | 24/32, 800; role badge cách 8 | Tên dài wrap; không dùng heading slogan thay thông tin chính |
| Email | 15/24, margin-top 6, overflow-wrap:anywhere | Có thể chọn/copy; không giả thành link edit |
| Role/status | Badge 26 cao; gap 8; wrap | Role từ auth; status chỉ khi nguồn dữ liệu xác nhận |
| Details/session | Margin-top 24; grid 1.2fr/1fr, gap 24 | Hai section có heading 18/26 và padding 24 |
| Account dl | Margin-top 20; mỗi row padding-block 12; label 140 px + value | Label 13/20, value 15/24; giữ dữ liệu dạng text readonly |
| Session block | Padding 16; icon 20; gap 12 | Diễn đạt đúng demo/real theo môi trường; không luôn ghi “demo” |
| Truy cập nhanh | Margin-top 32; heading 20/28; gap xuống list 16 | Kho truyện / Kho tư liệu / Hiệu quả nội dung |
| Shortcut row | Padding 16; min-height 72; icon 24 trong vùng 40×40; gap 16 | Tên 16/24, mô tả 13/20; ArrowRight 20; toàn row là link |
| Logout nếu đặt tại đây | B3 hoặc menu phụ, min-height 44 | Giữ flow logout và dirty guard, không cần xác nhận thêm khi không dirty |

- Không có avatar thì dùng initials có nền thương hiệu nhẹ, không lấy ảnh người ngẫu nhiên làm người dùng thật.
- Không thêm button Chỉnh sửa/Đổi mật khẩu vô hiệu nếu backend chưa hỗ trợ. Khi có API cần đặc tả form riêng trước.
- Mobile identity avatar 56×56, padding 16/gap 16; details/session một cột; dl label trên value cách 4, các row cách 16.
- Phiên hoạt động không chứng minh tài khoản đã xác minh email; chỉ hiển thị “Đã xác minh” khi có field thực. Không suy ra status từ việc đang mở trang.
- Nghiệm thu: tên/email dài không tràn; shortcut đúng role; trạng thái phiên phản ánh nguồn dữ liệu; mọi nội dung chỉ đọc không có affordance chỉnh sửa giả.

## 18. Checklist trạng thái và đo nghiệm thu

### 18.1. Ma trận theo trang

| Trang | Loading/empty/error cần thiết | Tình huống dễ bỏ sót |
| --- | --- | --- |
| Tổng quan | Skeleton từng vùng; kho rỗng; query lỗi | Không có draft trong 5 item không đồng nghĩa kho không có draft |
| Kho truyện | Initial/refetch; zero result; list/category/cover lỗi riêng | URL invalid; Back giữ filter/scroll; total thay đổi làm page vượt giới hạn |
| Tạo truyện | Asset/category loading; submit error/pending | Cancel dirty; submit trùng; asset optional; mất mạng giữ text |
| Thông tin | Load story; save success/error/409 | Input gõ thêm trong khi save; baseline cập nhật theo response |
| Trang truyện | Không có trang; asset lỗi; add/update/reorder/delete lỗi | Chuyển slot/page, hủy thêm, text tràn, layer che chữ, trang bị xóa |
| Vai nhân vật | Không có vai/trang; role/slot lỗi | Link chính xác slot, sensitive/custom label, xóa cascade được xác nhận |
| Từ vựng | Không có từ/trang/kết quả; audio lỗi | Trang liên kết đã mất; duplicate; đổi filter khi dirty |
| Câu hỏi | Optional empty; thiếu page/đáp án; save lỗi | Null khác index 0; quiz preview reset; không ghi thống kê |
| Xem trước | Preview/assets loading và error riêng | Validate revision cũ; asset xử lý; publish double click; bản đang xem |
| Kho tư liệu | Empty/filter-empty; upload pending/abort/error | Tên file dài, audio bị render như ảnh, picker cancel, file không sẵn sàng |
| Thống kê | No data khác zero; partial error; refetch | Kỳ cũ hiển thị dưới nhãn kỳ mới; thiếu mẫu số; chart keyboard |
| Hồ sơ | Dữ liệu auth thiếu/đang phục hồi do shell xử lý | Email dài; demo/real; status không có field chứng minh |

### 18.2. QA hình học và thị giác

1. Viewport bắt buộc: 1440×900, 1366×768, 1024×768, 768×1024, 390×844; thêm 320 px width và zoom 200% để kiểm tra reflow. Kiểm tra landscape thấp cho dialog.
2. Chụp mỗi trang ở trạng thái có dữ liệu; riêng form/editor thêm dirty + error; kho tư liệu thêm dialog chọn/upload; preview thêm checklist lỗi.
3. Đo computed style của button/input/label/panel; spacing deviation tối đa 2 px khi cần optical alignment và phải có lý do. Không sửa cho giống ảnh bằng margin âm tùy tiện.
4. Header, toolbar và mép content cùng trục; label/input/helper thẳng nhau; đáy control trong toolbar cùng baseline; icon và text không lệch quang học.
5. Ở 1366×768, người dùng thấy vùng tác vụ chính sau header mà không phải cuộn qua banner marketing. Không đặt KPI/hero trước form đang cần sửa.
6. H1/tên truyện dài 80 ký tự, page title 120, tên vai 60, mô tả đủ 240; email/filename không có khoảng trắng; tất cả wrap/clamp đúng chỗ và có đường đọc đầy đủ.
7. Ảnh chậm/lỗi không thay chiều cao card; badge active/selected/focus không đẩy nội dung; spinner không làm nút đổi width.
8. Không cắt chữ Việt có dấu ở line-height; không uppercase toàn nhãn dài; không bố trí text trên ảnh thiếu vùng tương phản.
9. Thứ bậc rõ ở grayscale: primary, secondary, selected, error vẫn phân biệt bằng viền/icon/chữ. Không chỉ dựa vàng/xanh/đỏ.
10. Kiểm tra light theme tất cả route; canvas/story content giữ màu tác phẩm. Dark mode chỉ nghiệm thu khi có scope theme riêng, không tuyên bố hoàn thành ở đây.

### 18.3. QA tương tác và khả năng tiếp cận

- Tab qua toàn luồng, focus không mất và không bị sticky che. Enter/Space đúng semantics; không kích hoạt xóa khi đang nhập text. Không keyboard shortcut chiếm phím của field.
- Dialog/select/drawer: mở, chọn, Escape, click ngoài, focus return, scroll lock; dialog confirm không đóng bằng click ngoài nếu điều đó dễ bỏ sót quyết định dirty chưa xử lý.
- Pointer coarse: hit target tối thiểu 44×44 và không chồng; tooltip không là nguồn thông tin duy nhất. Bàn phím ảo không che vĩnh viễn CTA.
- Mục tiêu tương phản: chữ thường ít nhất 4.5:1, chữ lớn 3:1; biên/control/focus có nhận biết rõ. Đo màu thật sau opacity/overlay, không chỉ token gốc.
- Lỗi đọc được và nối field; success polite, error alert chỉ một nguồn; không aria-live lại toàn list sau từng ký tự.
- Tắt motion ở OS vẫn thấy rõ state; không phụ thuộc animation để báo đã lưu. Không autoplay audio; chuyển trang dừng player cũ.
- Mọi link lỗi có fallback khi entity đã biến mất. Sau xóa đặt focus vào vị trí hợp lý, không body. Sau filter không đưa focus về đầu trang.

### 18.4. Test và tiêu chí phát hành

- Tái sử dụng Playwright hiện có; mở rộng `content-save-state.spec.js` và `content-contract.spec.js` theo hành vi. Không viết test cho mỗi giá trị margin; dùng review screenshot/computed style cho visual.
- Test tự động ưu tiên: quiz null; dirty trên mọi đường chuyển; giữ input khi 409/network; revision invalidation; đúng entity khi mở lỗi; double submit; picker cancel; upload abort; saved/live preview khác nhau rõ.
- Screenshot ổn định: seed mock cố định, timestamp cố định trong fixture, chờ font/ảnh, reduced motion; snapshot từng breakpoint đại diện và các trạng thái quan trọng.
- Run lint/build + suite content liên quan; smoke Parent/Admin vì đang chia sẻ shell/CSS. Chỉ chạy thêm suite rộng khi thay shared behavior hoặc có lỗi mới.
- Các số đo trải nghiệm như thời gian tìm truyện, sửa lỗi publish, thêm vị trí cần đo trước/sau trên cùng tác vụ. Chưa có dữ liệu thì không công bố tỷ lệ cải thiện.
- UI mock pass không chứng minh API production hay Mobile đúng. Chặn phát hành nếu dirty loss, publish sai revision, lựa chọn quiz sai hoặc snapshot version cũ bị đổi.

## 19. Backlog nhỏ, thứ tự và điểm chạm code

Mỗi hàng là nhóm thay đổi review được riêng. Không trộn đổi CSS toàn role với sửa contract trong một thay đổi lớn.

| ID | Việc cụ thể | File/component chính | Done khi |
| --- | --- | --- | --- |
| CM-01 | Tạo fixture/ảnh baseline 12 màn và lỗi hiện tại | Tests + artifacts Content riêng | Có ảnh và steps tái hiện, không ghi đè artifacts role khác |
| CM-02 | Giữ fix quiz null/radio/validation đã có; kiểm chứng regression | StoryQuizPage | Test null fail, index 0 pass |
| CM-03 | Rà toàn bộ dirty/pending và baseline | Hook + layout + form callers | Cancel/Back/menu/logo/entity không mất input |
| CM-04 | Validate gắn revision + issue routing | StoryEditorLayout, PublishIssues | Save làm invalidate; link đúng field/entity |
| CM-05 | Hoàn thiện token/container đã có, sửa cascade và grid cha | content.css, WorkspaceLayout | Scope role rõ, main/editor đủ rộng |
| CM-06 | Button/icon/status shared | UI components dự kiến | Đủ state, target 44, width pending ổn định |
| CM-07 | Form field/error/helper/radio | EditorField, StoryForm | Label/error đúng ID, font/gap chuẩn |
| CM-08 | Dialog/select accessible dùng chung | Component chung dự kiến | Keyboard/focus/collision/reduced motion pass |
| CM-09 | Sidebar/editor header/tab/save bar | WorkspaceLayout, StoryEditorLayout | Laptop/mobile đủ diện tích; không sticky chồng |
| CM-10 | Overview từng vùng | ContentOverviewPage | Phạm vi số liệu đúng, CTA tiếp tục dùng được |
| CM-11 | List/filter/debounce/back restoration | ContentStoriesPage | URL/Back/refetch/cover error pass |
| CM-12 | Form tạo và preview bìa | StoryEditorPage, StoryForm | Tạo đúng ID, không trùng, chuyển pages |
| CM-13 | Form metadata/undo/baseline | StoryMetadataPage | Lưu nháp an toàn, preview đúng |
| CM-14 | Pages một vùng sửa + bố cục W | StoryPagesPage | Bỏ form lặp, mobile đủ tác vụ |
| CM-15 | Giữ local composed preview đã có; rà layer/media và switching | StoryPagesPage, StoryPageRenderer | Draft phản ánh ngay, saved giữ riêng |
| CM-16 | Vai và vị trí theo entity | StoryRolesPage | Role/slot form gọn, deep link đúng |
| CM-17 | Từ vựng list/form/context/player | StoryVocabularyPage | Ngữ cảnh và audio đúng; dirty guard |
| CM-18 | Quiz layout và làm thử | StoryQuizPage | Radio/feedback/focus đúng, không ghi điểm |
| CM-19 | Preview/checklist/publish dialog | StoryPreviewPage + layout | Xuất bản đúng revision, error recoverable |
| CM-20 | AssetPicker một điểm vào | AssetPicker | Cancel giữ value, incompatible blocked |
| CM-21 | Kho file/detail/upload states | AssetsPage | Upload/cancel/retry và responsive pass |
| CM-22 | KPI/chart/list/range | ContentStatisticsPage | Số liệu đúng phạm vi, accessible alternative |
| CM-23 | Profile Content variant | ProfilePage, profile.css | Không giả edit/status, không ảnh hưởng role khác |
| CM-24 | QA theo ma trận + cập nhật docs | Tests + docs | Các tiêu chí mục 18 có bằng chứng |

Thứ tự: CM-01 → CM-02/03/04 → CM-05 đến 09 → CM-10 đến 23 → CM-24. Những nhóm độc lập có thể thực hiện ở các thay đổi riêng, nhưng component chung phải ổn định trước khi áp dụng tất cả trang. Ước lượng ngày công nên thực hiện sau baseline và xác nhận phạm vi API, tránh lịch hứa dựa trên số trang.

## 20. Quyết định phạm vi và phần cần kiểm chứng

**Đã chọn trong kế hoạch:** giữ brand và stack; typography/spacing chuẩn; target 44; theme sáng thống nhất; một vùng sửa; manual save; full set states; các nhãn tiếng Việt đề xuất; hỗ trợ responsive cho từng màn.

**Thực hiện với frontend hiện có:** phần lớn layout/token/copy, local preview, picker/dialog, filter, form validation, state hiển thị và deep link client. Cần kiểm tra response shape và test hiện có trước khi sửa.

**Phụ thuộc dữ liệu/contract:** KPI toàn kho, mẫu số analytics, error entity identifiers, upload audio/progress/processing, asset references/retention, canvas text/anchor/layer với Mobile. UI chưa có dữ liệu phải ghi đúng giới hạn hoặc giữ tính năng ngoài scope.

**Mở rộng P2 sau:** kéo/resize nhân vật, undo/redo có lịch sử, phục hồi nháp local an toàn theo user/story/revision, upload hàng loạt, dark theme toàn workspace, version diff/rollback. Không gắn nút cho các khả năng này trước khi có flow thực.

**Handoff cần có cho mỗi trang khi triển khai:** ảnh desktop và mobile, trạng thái error/empty tương ứng, checklist component đã dùng, link test hành vi và ghi chú khác biệt so với spec. Nếu điều chỉnh thông số sau thử nghiệm, cập nhật ngay hàng tương ứng trong tài liệu này.

## 21. Bảng chuyển đổi CSS và component để bắt đầu code

Không thay hàng loạt giá trị trong `workspace.css`: file đang dùng chung nhiều role. Root `workspace-app-content` và `content.css` đã tồn tại. Tiếp tục hoàn thiện dưới root này. Bảng dưới ghi baseline shared CSS trước override để truy vết, không phải computed style hiện tại; dùng audit mục 1.1 và checklist mục 22 cho công việc còn lại. Chỉ loại selector cũ sau khi kiểm tra mọi consumer.

| Selector/component hiện tại | Hiện trạng đọc được | Thay đổi mục tiêu | Giới hạn phạm vi |
| --- | --- | --- | --- |
| `.workspace-app` | Sidebar 248 px | 232 px ở trang thường, rail 72 px ở editor | Root Content, không đổi Parent/Admin |
| `.workspace-main` | Max 1240, padding clamp 28-52 | Container thường max 1280, padding 32; editor max 1600, padding 24 | Responsive mục 3 |
| `.workspace-page-heading` | Margin-bottom 34; gap 20 | Margin-bottom 24; gap 24 desktop/16 nhỏ | Mọi trang Content thường |
| `.workspace-page-heading h1` | Tối đa 43 px, tracking -1.6 px | 30/38 desktop, 26/34 mobile; tracking -0.02em | Giữ H1 riêng trong editor 24/32 |
| `.workspace-eyebrow` | 11 px, weight 900, uppercase, tracking 1.5 | Bỏ nhãn lặp; nếu cần metadata dùng 13/20 sentence case | Không xóa nhãn ở role khác |
| `.workspace-button` | Min 43, padding 10 17, font 13/900, đáy shadow | B1/B2 min 44, padding 10 16, font 14/700, không đáy shadow | Token/state mục 4 |
| `.icon-button` | 34×34, radius 8 | Target 44×44, icon 20, radius 10 | Toolbar cần compact dùng bề mặt 32 với target 44 |
| `.workspace-badge` | 25 cao, 11 px, radius pill | 26 cao, 12/18, padding 4 8, radius 6 | Semantic status, không biến chip filter thành badge |
| `.story-editor-panel` | Padding 25, radius 16 | Padding 24/20/16, radius 12 | Giảm lớp bề mặt lồng nhau |
| `.editor-field label` và input | Label nhỏ/đậm; input 13 px, radius 9 | Label 14/20, gap 8; input 15/22, mobile 16/24, radius 10 | Properties dùng label 13/20 theo ngoại lệ mục 10 |
| `.editor-field-error` | 11 px, margin-top 5 | 13/20, margin-top 6, ID nối field | Không chỉ sửa CSS; cần aria-describedby |
| `.editor-form-actions` | Margin-top 15, gap 8 | Margin-top 24, gap 8; properties margin-top 20 | Status và action wrap độc lập |
| `.story-pages-workspace` | Grid minmax theo tỷ lệ, gap 14 | Grid theo W ở mục 10, gap 16 | Đo W thực, không chỉ viewport |
| `.story-pages-secondary-list` | Danh sách sửa nhanh lặp | Gỡ khỏi UI sau khi action tương đương có ở vùng chính | Test edit/delete còn đầy đủ |
| `.story-preview-slot` | Radius 50%, min-width 62, width 19% | Giữ ảnh nguyên hình; review min-width/scale theo Mobile contract | Không tự đổi scale/tọa độ làm lệch snapshot |
| `.story-preview-stage-copy` | Nội dung 12 px phủ ảnh, có thể tràn | Kiểm tra readable text/overflow theo mục 10 và 14 | Không đổi renderer riêng cho một tab |
| `.slot-row small` | 10 px | 13/20, giảm chuỗi thông số dày | Chi tiết nâng cao mở khi cần |
| `.asset-picker-results` + select | Nhiều đường chọn cùng field | Thumb/value + một nút mở picker | Giữ form value và ID gắn label |
| `.content-overview-hero` | Hero tối thiểu 230, nền tối, orbit | Khu tiếp tục nội dung thật, padding 24, không min-height hero | Tổng quan, không tác động dashboard khác |
| `.analytics-bar-list` | Danh sách thanh theo ngày | Chart có trục + bảng dữ liệu tương đương | Giữ metric nguồn, không suy ra thêm KPI |

### 21.1. Component contract đề xuất

Các tên dưới đây là tên dự kiến khi triển khai, chưa phải component tồn tại. Chỉ tách thành file dùng chung khi có nhiều consumer hoặc hành vi cần kiểm chứng tập trung.

| Component | Trách nhiệm | Không tự chịu trách nhiệm |
| --- | --- | --- |
| `ContentPageHeader` | Title, description, action, spacing responsive | Fetch dữ liệu hoặc quyết định quyền |
| `ContentButton` / `ContentIconButton` | Variant, pending, disabled, label, focus | Tự gửi request hoặc báo thành công |
| `ContentField` | Label, hint, error, required, counter, ID | Đặt giới hạn nghiệp vụ ngoài schema |
| `ContentSelect` | Trigger/listbox, keyboard, collision, focus | Thay giá trị/ID category từ API |
| `ContentDialog` | Layer, focus trap/return, inert, body scroll | Tự hủy request khi đóng |
| `EditorSaveBar` | Hiển thị dirty/pending/saved/error, gọi save/revert | Đồng nhất form dirty với draftDirty |
| `EditorIssueList` | Group lỗi, điều hướng đúng entity/field | Suy đoán entity dựa trên tên hiển thị |
| `AssetPickerField` | Value hiện tại, lựa chọn tạm, confirm/cancel, kind | Thay bytes asset hoặc mutate story ngoài onChange |
| `StoryPageRenderer` | Render cùng quy ước từ story/page/assets đã truyền | Fetch/mutate hoặc tự lưu local draft |
| `ContentEmptyState` / `ContentNotice` | Heading/message/action, live region phù hợp | Bịa dữ liệu mẫu để lấp chỗ trống |

### 21.2. Trình tự một thay đổi nhỏ

1. Chọn một ID backlog và đọc mục spec của đúng trang.
2. Xác định selector/component đang dùng và consumer ở role khác.
3. Ghi ảnh baseline với dữ liệu đủ đại diện; nêu behavior hiện có cần giữ.
4. Sửa UI và state cùng phạm vi; không gộp tính năng API chưa chốt.
5. Kiểm tra desktop/mobile, bàn phím và tình huống lỗi liên quan.
6. Đối chiếu các thông số trong bảng, ghi ngoại lệ có lý do.
7. Chạy kiểm tra hành vi thích hợp và cập nhật ảnh/handoff của đúng trang.

Không xem “đã đổi CSS” là done nếu nút không dùng được, không focus được, hoặc thao tác lưu vẫn mất dữ liệu.

## 22. Checklist triển khai nhỏ theo trang, cập nhật 05/10/2026

Các ô dưới đây đều là **việc còn lại hoặc cần kiểm chứng**, không đánh dấu hoàn thành chỉ vì đọc thấy code. Thông số chi tiết ở mục 2–17 vẫn áp dụng. P0: tính đúng/dữ liệu/thao tác thiết yếu; P1: bố cục và hiệu suất biên tập; P2: mở rộng. Không dùng lịch cứng khi chưa có baseline trình duyệt.

### 22.1. Nền và khung dùng chung: làm trước tất cả trang

- [ ] **F01 · P1 · Shell:** một biến chiều rộng sidebar chi phối cả grid root lẫn sidebar. Trang thường 232 px; editor rail 72 px khi đủ điều kiện. Main editor max 1600 gồm padding 24, áp ở cha chứa Outlet, không chỉ `.story-editor-shell`.
- [ ] **F02 · P1 · Ngân sách chiều rộng:** lấy W là content width bên trong panel sau padding/border. Nếu W dưới 952 px không dùng grid hiện tại có tổng min 952. Mục tiêu ba cột ở W từ 1040; 760–1039 dùng danh sách 176 + vùng chính, thuộc tính xuống dưới; dưới 760 dùng chọn trang + vùng xem/sửa một cột. Kiểm tra cả ở 1366×768 khi sidebar mở rộng.
- [ ] **F03 · P1 · Khoảng cách:** page header → section 24; section → section 32 desktop/24 nhỏ; panel padding 24/20/16; field gap 20, label → control 8, control → help/error 6; action gap 8. Dùng gap hoặc margin tại một cấp để không nhân đôi khoảng trống.
- [ ] **F04 · P1 · Button:** B1/B2 min-height 44, padding 10×16, icon 18, gap 8, radius 10. Icon-only 44×44/glyph 20. Nút dài được tăng chiều cao trên mobile; giữ chiều rộng giữa trạng thái thường/pending bằng vùng label ổn định. Primary chữ navy trên vàng, secondary viền rõ; danger hover/pressed vẫn đỏ, không kế thừa màu vàng của primary.
- [ ] **F05 · P1 · Typography:** Nunito; H1 30/38, H2 20/28, item title 16/24, body 15/24, label/button 14/20, hint/error 13/20. Mobile input 16/24. Không dùng weight 900 cho toàn bộ metadata; số liệu dùng tabular-nums.
- [ ] **F06 · P0 · Save state:** form con gửi cả dirty/pending/error cho shell, không chỉ dirty. Tách save status và publication status. Pending giữ dữ liệu; nếu cho tiếp tục gõ, response cũ không được ghi đè text mới. Lưu một form không được đánh sạch form khác.
- [ ] **F07 · P0 · Điều hướng:** kiểm thử tab, sidebar, logo, breadcrumb, Browser Back/Forward, đổi entity, đóng form, Hủy sửa, logout. Guard phải chạy trước khi đổi state. Giữ beforeunload native cho reload/đóng tab; dùng cơ chế chặn điều hướng phù hợp router đang dùng, không chỉ bọc click link.
- [ ] **F08 · P0 · Dialog:** có title, initial focus, Tab/Shift+Tab giữ trong dialog, Escape và focus return. Hủy xóa mặc định nhận focus; picker desktop ưu tiên ô tìm kiếm. Không chỉ gắn aria-modal mà vẫn cho thao tác nền.
- [ ] **F09 · P1 · Header/tabs:** tên truyện 24/32, tối đa hai dòng; action gap 8; tab target 44, padding 10×14, active có underline. Tab là route navigation, giữ NavLink/aria-current thay vì gán tab role thiếu keyboard behavior. Tên tiếng Việt theo mapping mục 3/5, route không đổi.
- [ ] **F10 · P1 · Sticky/focus:** chỉ một thanh lưu sticky theo form khi thực sự cần. Padding đáy content bằng chiều cao thanh + 16 + safe-area. Với header động, đo offset thực; không đặt top cố định khiến field lỗi bị che. Màn hình thấp/zoom ưu tiên bỏ sticky.
- [ ] **F11 · P1 · Select:** giữ native select cho đến khi component tùy biến đã đạt keyboard/focus. Không cần cài thêm design system để làm kế hoạch này; nếu thay primitive sau này, chọn một nền duy nhất và kiểm thử riêng.

### 22.2. Tổng quan: `/content`

- [ ] **OV01:** thay hero slogan/orbit bằng truyện nháp thật: thumbnail 112×84, gap 20, padding 24, title 20/28, metadata 13/20. Empty dùng lời mời tạo truyện, không hiển thị truyện giả.
- [ ] **OV02:** giữ query tìm draft toàn kho đã có; query draft lỗi phải có Retry tại vùng này. Không biến lỗi thành “Chưa có bản nháp” hoặc mở ngẫu nhiên một story đã xuất bản.
- [ ] **OV03:** CTA header “Tạo truyện”; CTA khu tiếp tục “Tiếp tục biên tập”. Khi kho rỗng, chỉ một CTA tạo nổi bật trong vùng nhìn đầu tiên, tránh ba nút cùng ý định.
- [ ] **OV04:** đặt truyện gần đây trước shortcut; heading cách list 12; hàng padding 16, thumb 64×48, gap 16, title 16/24, action 44×44. Bỏ margin âm -20/-16 đang dùng ở shortcut và dùng gap thật.
- [ ] **OV05:** giữ nhãn “trong 5 truyện mới nhất” nếu có số xuất bản cục bộ; không dùng kiểu KPI tổng. Nghiệm thu: tìm và mở bản nháp bằng một click, phân biệt được query lỗi và kho rỗng.

### 22.3. Kho truyện: `/content/stories`

- [ ] **LS01:** sửa display grid thực sự trên toolbar; label min-width 0; search padding-left 40, icon trái 12. Control cao 44, gap 12; bốn control chuyển 2 cột rồi 1 cột theo chiều rộng thật, không ép filter 180 px vào container hẹp.
- [ ] **LS02:** label nhìn thấy phía trên mỗi filter, cách 8. Bỏ phần giải thích kỹ thuật URL; chip lọc có nút xóa target 44, gap 8, không aria-live toàn toolbar khi gõ.
- [ ] **LS03:** input tìm kiếm cập nhật tức thời, query debounce 300 ms; hủy debounce khi clear/unmount/Back; đổi filter về page 1. URL/refresh/Back khôi phục cùng giá trị, tránh vòng lặp đồng bộ input và URL.
- [ ] **LS04:** hàng 96×72 + nội dung + action, padding 16/gap 16; title 16/24 hai dòng; description 14/22; metadata 13/20 cách 8. Mobile thumb 80×60, CTA xuống hàng, không co chữ để giữ nút cạnh ảnh.
- [ ] **LS05:** cover lỗi có fallback qua onError; category/asset lỗi không ngụy trang thành dữ liệu rỗng. Hiển thị lỗi tải chủ đề riêng với Retry; danh sách truyện còn dùng được khi chỉ ảnh lỗi.
- [ ] **LS06:** giữ filter và scroll khi trở về từ editor; pagination cách list 20, target 44; khi total giảm làm page vượt giới hạn thì chuyển về trang hợp lệ. Nghiệm thu cả gõ nhanh, mạng chậm, không kết quả và tên dài.

### 22.4. Tạo truyện: `/content/stories/new`

- [ ] **CR01:** một H1 “Tạo truyện mới”; form hai cột nội dung + bìa 320, gap 32/padding 24. Khi vùng form dưới 800 chuyển một cột; không cộng thêm 24 padding cho nhiều card lồng nhau.
- [ ] **CR02:** tên 80 ký tự, mô tả 240 theo form hiện tại; counter cách control 6. Mô tả min-height 144; field cách 20. Giữ thứ tự dữ liệu và field ID; chỉ đổi copy hiển thị sang tiếng Việt.
- [ ] **CR03:** bìa ratio 4:3, radius 12, nút chọn bên dưới cách 12; tên file wrap. Bìa optional ở bước lưu nháp. Loading/lỗi ảnh không khóa form nhập tên và mô tả.
- [ ] **CR04:** category tải lỗi hoặc trả danh sách rỗng là trạng thái riêng; bỏ fallbackCategories khỏi nguồn lựa chọn production. Không gửi nhãn tự dựng như ID hợp lệ. Retry không reset input đã gõ.
- [ ] **CR05:** footer border-top/padding-top 20/margin-top 24, Hủy B2 + “Tạo bản nháp và thêm trang” B1. Thành công dùng ID server trả về chuyển `/pages`; lỗi focus field đầu và giữ input; double-click chỉ một request đang chạy.

### 22.5. Thông tin truyện: `/content/stories/:storyId`

- [ ] **MD01:** bỏ heading “Thông tin story” lặp giữa panel và StoryForm; một notice nháp padding 12×16, margin-bottom 24, dùng ngôn ngữ người biên tập.
- [ ] **MD02:** dùng lại lưới/field tạo truyện; preview bìa và tên/mô tả nhận values đang nhập. Preview thumbnail giữ ratio 4:3; version/lần xuất bản chỉ hiển thị khi dữ liệu có.
- [ ] **MD03:** footer “Hoàn tác thay đổi” + “Lưu thay đổi”, gap 8. Hoàn tác phục hồi baseline đã lưu sau xác nhận khi dirty; quay về kho là breadcrumb riêng. Không dùng cùng một “Hủy” cho reset và điều hướng.
- [ ] **MD04:** 409 giữ input và hiển thị cách xem/tải phiên bản mới; baseline lấy từ response thành công. Nghiệm thu gõ thêm khi request chưa xong, lỗi rồi thử lại, và không đổi published snapshot.

### 22.6. Trang truyện: `.../pages`

- [ ] **PG01 · P0:** chuyển guard trước beginEdit/setEditingPage và mọi hành động đóng form. Với pageDraft dirty và chọn slot: quyết định rõ giữ bản nháp trang hay bỏ nó; nếu thông báo “bỏ thay đổi” thì state thật phải đồng nhất với quyết định.
- [ ] **PG02 · P1:** bỏ `.story-pages-secondary-list` sau khi đưa sửa/xóa/di chuyển vào vùng chính; chỉ một pageDraft cho trang đang sửa. Không mất chức năng xóa khi gỡ danh sách phụ.
- [ ] **PG03 · P1:** list item min-height 76/padding 10×12; thumbnail 56×42; selected có marker và aria-current. Action reorder 44×44, disable đầu/cuối; sau đổi thứ tự vẫn chọn theo ID, không theo index.
- [ ] **PG04 · P1:** toolbar cao tối thiểu 44/cách canvas 12; nhãn “Bản đang chỉnh sửa” khi dirty. Giữ composedStory đã có; không tạo API call mỗi lần gõ.
- [ ] **PG05 · P1:** thuộc tính padding 16; label 13/20 cách control 8, field gap 16, text 15/24; nội dung min-height 168, lời đọc 96. B1 “Lưu trang” hoặc “Lưu vị trí” ở footer cách 20; nút quay về thuộc tính trang khi đang chọn slot.
- [ ] **PG06 · P0:** X/Y 0–100, scale >0, layer nguyên ≥1 theo validator; rỗng/NaN phải có lỗi rõ, không âm thầm thành 0. Anchor hiện chỉ center: trình bày read-only trong nâng cao, không tạo select trông như có nhiều lựa chọn.
- [ ] **PG07 · P0:** xóa trang xác nhận theo tên và liên kết thật; khi xóa trang cuối reset cả selected slot và mọi draft liên quan. Form thêm trang đóng/hủy có dirty guard. Nghiệm thu dirty switching, reorder, delete cuối, ảnh lỗi và văn bản dài.

### 22.7. Vai nhân vật: `.../roles`

- [ ] **RL01:** master-detail một vai đang sửa; item avatar 48×48, gap 12/padding 12, min-height 76; detail padding 24/16. Không render toàn bộ SlotForm mở cùng lúc.
- [ ] **RL02:** tên tối đa 60; ảnh mặc định 120×120 contain; field cách 20; checkbox target 44 với glyph 20, helper 13/20 cách 4. Hai quyền custom và sensitive được mô tả độc lập, không tự chuyển giá trị khi đổi nhãn.
- [ ] **RL03:** đổi nhãn slot thành “Vị trí xuất hiện”; hàng page thumbnail 48×36, tên 14/22, metadata 13/20, padding 12/gap 12. Thuộc tính X/Y/scale/layer chỉ mở khi cần.
- [ ] **RL04:** “Mở vị trí trên trang” mang pageId + slotId; Pages parse và xác minh thuộc story rồi chọn đúng entity. Nếu slot không còn, giải thích và chọn trang hợp lệ thay vì im lặng mở trang đầu.
- [ ] **RL05:** mọi field slot dùng ID có roleId để tránh ID trùng giữa nhiều form; hủy/xóa role hoặc slot có guard, tên đối tượng và ảnh hưởng rõ. Sau lưu một role không làm mất slotDraft khác còn dirty.

### 22.8. Từ vựng: `.../vocabulary`

- [ ] **VC01:** list 320 + form/gap 24 khi W ≥960; search 44, cách filter trang 12; filter cách list 16. Lọc local chỉ trên tập dữ liệu đã tải đầy đủ.
- [ ] **VC02:** item padding 12/min-height 80, từ 16/24, nghĩa 14/22, trang 13/20. Nút nghe 44 độc lập, không lồng trong nút chọn mục; URL không chiếm nội dung list.
- [ ] **VC03:** sau chọn trang hiển thị trích đoạn padding 16/cách 12/max-height 160 có mở rộng. Nghĩa dùng textarea min-height 120; URL optional dưới cách 20, player dưới cách 12, không autoplay.
- [ ] **VC04:** thiếu trang có CTA Thêm trang; audio lỗi riêng; duplicate từ+trang chỉ cảnh báo. Error map tới field word/meaning/page/audio, summary không thay cho lỗi cạnh field.
- [ ] **VC05:** Hủy sửa hiện reset trực tiếp: thêm guard; xóa hiện mutate trực tiếp: thêm xác nhận. Đổi filter không được reset form đang sửa; xóa thành công focus mục kế hoặc nút Thêm từ.

### 22.9. Câu hỏi: `.../quizzes`

- [ ] **QZ01:** giữ validation null đã sửa, bổ sung kiểm chứng index 0 vẫn hợp lệ. Không lặp lại ticket “sửa null” như tính năng chưa có.
- [ ] **QZ02:** danh sách câu hỏi 240, form linh hoạt, làm thử 320/gap 20 chỉ khi W ≥1120; hẹp hơn dùng chuyển Soạn/Làm thử. Câu hỏi textarea 120, feedback 96; mỗi nhóm cách 24.
- [ ] **QZ03:** fieldset có legend và lỗi liên kết; mỗi đáp án A/B/C padding 12, gap 12, margin-top 12, input min-height 44; radio target 44. Mobile radio xuống hàng, không ép input còn vài ký tự.
- [ ] **QZ04:** nút “Thử câu hỏi” hiện chỉ reset choice trong vùng luôn hiện: đổi thành mở/chuyển vùng làm thử thật. Chưa chọn đáp án đúng thì ghi chưa thể chấm; có nút Làm lại, không đánh dấu đáp án trước khi chọn.
- [ ] **QZ05:** label sửa/xóa nêu số hoặc nội dung câu hỏi; Hủy sửa có guard; xóa có xác nhận. Không có quiz là empty hợp lệ; không làm checklist xuất bản báo thiếu bắt buộc.

### 22.10. Xem trước và xuất bản: `.../preview`

- [ ] **PV01 · P0:** validation lưu validatedRevision; đổi story/revision hoặc save mới làm kết quả cũ hết hiệu lực. Kết quả request kiểm tra cũ đến trễ không được đánh dấu bản hiện tại hợp lệ.
- [ ] **PV02 · P0:** issue resolver xử lý namespace → entity ID → field. Ví dụ lỗi title của trang 3 phải mở Pages, chọn trang 3 và focus input properties-title; không trỏ story-title. Nếu chỉ có index, map trong cùng revision đã kiểm tra; không đoán ID theo tên.
- [ ] **PV03 · P1:** “Đọc thử” ẩn đáp án, nhận lựa chọn và feedback; “Kiểm tra” mới lộ đáp án/ngữ cảnh. Header nhãn “Bản nháp đã lưu”; không gọi đây là version đang phát hành.
- [ ] **PV04 · P1:** toolbar target 44/cách canvas 12; checklist padding 20/cách preview 20; errors padding 10×12/target 44, grouping theo phần. Dưới W 1080 checklist xuống dưới; dưới 800 chọn trang bằng control 44.
- [ ] **PV05 · P0:** lỗi preview có Retry; lỗi tải assets tách riêng và không biến thành story không có ảnh. Empty có link thêm trang; đổi trang dừng audio và reset lựa chọn quiz; không ghi lượt đọc/thống kê học tập.
- [ ] **PV06 · P0:** dialog xuất bản width 480/padding 24/footer gap 8; có tên truyện và mô tả tạo version. Khóa publish trong lúc form mutation đang chạy; kết quả version từ server. Ẩn đã có confirm native, nâng cấp dialog sau khi primitive sẵn sàng, giữ đúng tác động.

### 22.11. Kho tư liệu và picker: `/content/assets`

- [ ] **AS01:** gallery là phần chính; upload mở từ B1 ở header. Toolbar input 44/gap 12, grid gap 16/tile tối thiểu 160; mobile cho 2 cột chỉ khi mỗi tile ≥144, nhỏ hơn 1 cột.
- [ ] **AS02:** detail 304 px khi W ≥1000; còn lại drawer/view dưới. Render theo image/audio; ảnh contain, player audio native. Selected phải có check/aria-pressed; tên file dài wrap ở detail.
- [ ] **AS03:** upload dialog 560/padding 24; file preview 96×72/gap 16; định dạng và 5 MB theo validator. File mới không hợp lệ phải có state rõ, không để tên file cũ khiến người dùng upload nhầm.
- [ ] **AS04:** chỉ một vùng error upload thay vì vừa error state vừa mutation.error; pending, abort, retry phân biệt. B1 pending không đổi thành hành động hủy cùng vị trí mà thiếu nhãn rõ; dùng Hủy tải riêng. Abort xong refresh nếu kết quả server chưa rõ.
- [ ] **AS05 · P0:** picker chỉ thumbnail hiện tại + Chọn/Thay; bỏ select/search/thumbnails bên ngoài trùng lặp. Dialog 880, gap 12, body scroll, footer cố định trong dialog. Hủy/Escape giữ value cũ; confirm mới gọi onChange.
- [ ] **AS06 · P0:** dùng chung canSelectAsset cho đúng kind, URL có giá trị và trạng thái hợp lệ theo contract. Không để selected asset sai loại được chèn ngược vào danh sách ảnh rồi xác nhận; item không dùng được vẫn có thể hiện để giải thích, nhưng không chọn được.
- [ ] **AS07:** không có tư liệu khác không có kết quả tìm; CTA lần lượt Tải ảnh và Xóa tìm kiếm. Lọc khiến selected ngoài kết quả phải có nhãn rõ hoặc chọn lại sau hành động người dùng, không hiển thị detail gây hiểu nhầm.

### 22.12. Hiệu quả nội dung: `/content/statistics`

- [ ] **ST01:** ưu tiên lượt đọc/người đọc/tỷ lệ hoàn thành; KPI padding 24/gap 24, số 32/40, label 14/20, margin-top số 8. Quy mô kho ở hàng riêng cách 16.
- [ ] **ST02:** range 7/30 ngày cao 44/rộng 200; mobile full-width dưới title cách 16. Khi fetch kỳ mới, không hiển thị số kỳ cũ dưới nhãn kỳ mới thiếu dấu hiệu cập nhật.
- [ ] **ST03:** chart cao 260 desktop/220 mobile, trục ngày/lượt, bảng dữ liệu thay thế; 30 điểm giữ đầy đủ nhưng nhãn thưa theo width. Empty, toàn 0, null, partial error có cách trình bày khác nhau.
- [ ] **ST04:** Top truyện có link mở editor, row min-height 72/padding-block 14, số căn phải; badge theo status thật thay success cố định. Không suy ra mức tăng trưởng khi API không có kỳ trước.
- [ ] **ST05:** thay copy “Backend định nghĩa” bằng giải thích người dùng khi contract có định nghĩa; chưa có thì phần trợ giúp nói thiếu định nghĩa, không bịa công thức. Nghiệm thu đồng bộ range/KPI/chart/list và keyboard đọc bảng.

### 22.13. Hồ sơ Content Manager: `/profile`

- [ ] **PR01:** identity padding 24/gap 20/avatar 72; title tên 24/32/email 15/24. Bỏ slogan chiếm cột; initials từ tên nếu không có avatar, không dùng ảnh người giả.
- [ ] **PR02:** session copy hiện luôn nói demo: lấy ngữ cảnh phiên thật hoặc dùng copy trung tính “Bạn đang đăng nhập”. Không suy ra tài khoản đã xác minh từ session tồn tại.
- [ ] **PR03:** detail/session gap 24, heading 18/26, dl label 140; mobile label trên value gap 4 và row gap 16. Email dài dùng overflow-wrap, không cắt mất phần định danh.
- [ ] **PR04:** shortcut padding 16/min-height 72/icon 40/gap 16, link đúng role; button quay về target 44. Scope `.workspace-app-content .workspace-profile-page`, smoke profile Parent/Admin sau thay đổi.

### 22.14. Trình tự bàn giao và điều kiện qua đợt

| Đợt | Ticket | Kết quả review được | Điều kiện qua đợt |
| --- | --- | --- | --- |
| A: baseline | CM-01, audit mục 1.1 | 12 màn + dialog chính, ảnh laptop/mobile, steps lỗi | Xác nhận khác biệt giữa CSS source và computed layout |
| B: hành vi cốt lõi | F06–08, PG01/06/07, PV01/02/05/06, AS05/06, guard VC/QZ | Luồng save/dirty/validation/picker dùng được bằng keyboard | Không mất input, không xác nhận revision cũ, không chọn tư liệu sai |
| C: khung và luồng truyện | F01–05/09–11, OV, LS, CR, MD | Bộ token/components và tìm → tạo → mở editor | Toolbar không tràn, state và khoảng cách nhất quán |
| D: biên tập | PG còn lại, RL, VC, QZ, PV còn lại | Một vùng sửa, liên kết entity, làm thử và checklist | Tạo → trang → vai → từ → quiz → preview → publish hoàn chỉnh |
| E: hoàn thiện toàn role | AS còn lại, ST, PR, CM-24 | Tất cả trang, responsive, ảnh trước/sau, docs cập nhật | QA mục 18 và regression shared surfaces đạt |

Mỗi ticket giao cùng: file thay đổi, ảnh trước/sau 1366×768 và 390×844, trạng thái lỗi liên quan, bằng chứng test hành vi nếu có. Thông số spacing kiểm bằng computed style/screenshot, không viết unit test chỉ để so sánh từng margin.

### 22.15. Nguồn kiểm chứng accessibility

- Target 44×44 là lựa chọn thiết kế của dự án để dễ thao tác; không ghi nhầm thành mức tối thiểu AA. WCAG 2.2 SC 2.5.8 quy định 24×24 CSS px và các ngoại lệ: [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Dialog phải quản lý focus trong/ngoài và làm nền không tương tác, không chỉ thêm thuộc tính ARIA: [W3C APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- Thanh sticky/dialog không được che hoàn toàn phần tử đang focus; mục tiêu dự án là thấy trọn control và thông báo lỗi: [W3C Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

Các thông số đẹp/dễ dùng trong tài liệu là giả thuyết thiết kế để triển khai và đo, không phải bằng chứng giao diện đã được thử với người dùng.

