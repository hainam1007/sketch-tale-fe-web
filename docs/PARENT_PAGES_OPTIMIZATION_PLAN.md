# Parent Portal — Kế hoạch tối ưu các trang theo hồ sơ bé

> Ngày lập: 04/10/2026. Trạng thái: M1–M5 đã triển khai trong working tree; M6 đã chạy kiểm thử responsive/UX, còn visual QA staging và API thật cần thực hiện sau.
> Căn cứ: sáu ảnh người dùng cung cấp, `DESIGN.md` và code trong working tree. Chưa chạy browser hoặc kiểm thử trong phiên lập kế hoạch này.

## 1. Phạm vi và định hướng

Ưu tiên sáu trang: Hồ sơ, Cài đặt, Phê duyệt, Thư viện của bé, Tiến độ và Bản xuất. Tối ưu khung chung để các trang Parent thống nhất với tổng quan hồ sơ đã được mô tả ở `DESIGN.md` mục 5, nhưng không nhân bản banner minh họa của dashboard vào các trang tác vụ.

Giữ nền kem, bề mặt trắng, màu vàng thương hiệu, chữ navy, Nunito và Phosphor. Mục tiêu là nhìn rõ đang quản lý bé nào, tìm được việc cần làm nhanh và giảm cuộn không cần thiết. Không đổi font, thêm thư viện animation/chart hoặc đổi stack.

Kế hoạch này bổ sung cho [PARENT_UX_REDESIGN_PLAN.md](PARENT_UX_REDESIGN_PLAN.md); không dùng trạng thái nghiệm thu của kế hoạch cũ để kết luận giao diện hiện tại đã đạt. Các điểm code chưa khớp mục tiêu cũ được đưa lại vào backlog dưới đây. Nghiệp vụ tham chiếu [PARENT_IMPLEMENTATION_PLAN.md](PARENT_IMPLEMENTATION_PLAN.md); thay đổi mới của thư viện chung theo `DESIGN.md` mục 6 được ưu tiên hơn mô tả Báo cáo Family cũ.

## 2. Audit và thứ tự ưu tiên

| Ưu tiên | Quan sát / bằng chứng | Hướng xử lý |
| --- | --- | --- |
| P0 | Header gồm link quay lại, avatar/tên/ngày sinh, nhãn in hoa, khoảng đệm tab; sau đó nhiều trang thêm một banner lớn | Thu gọn context header; dùng tiêu đề tác vụ ngắn, bỏ banner trên sáu trang |
| P0 | `ChildWorkspaceLayout.jsx` dùng tên bé làm H1; trang tác vụ chủ yếu H2 | Một H1 cho tác vụ, tên bé là thông tin ngữ cảnh; chuyển đồng bộ cả dashboard |
| P0 | `ChildDetailPage` bọc `ChildForm` bằng card; form lại có khung và cột “Gợi ý nhỏ” | Một bề mặt form; đưa trợ giúp về đúng field |
| P0 | `ParentExportsPage` giữ lưới hai cột khi `fixedChildId` làm ẩn cột Family; lịch sử nằm ngoài lưới | Trang theo bé dùng form cạnh lịch sử, không để cột rỗng |
| P0 | Selector bé, cài đặt, khoảng thời gian và export còn dùng native select | Tạo select dùng chung theo quy ước mở/đóng và accessibility trong `DESIGN.md` |
| P1 | Tiêu đề dài như “Những điều bé đã chọn giữ lại”, “Những bước nhỏ đang thành câu chuyện” | Đổi thành tên tác vụ; giữ chất thân thiện ở một dòng mô tả |
| P1 | Settings gọi thời gian là “giới hạn mềm”, trong khi tài liệu nghiệp vụ nói thời gian sử dụng ứng dụng | Bỏ khẳng định “mềm”; chốt nghĩa field trước khi đổi nhãn đọc/sử dụng, không tự đổi logic |
| P1 | Thư viện có icon yêu thích ở footer nhưng còn biểu tượng sao trên card | Thống nhất một tín hiệu yêu thích, trạng thái ẩn có chữ dễ nhận biết |
| P1 | Tiến độ dùng bốn card lớn và nhãn quiz; bảng chiếm rộng, số chưa tối ưu quét | Dải KPI gọn, nhãn tiếng Việt, số căn phải, bảng cuộn riêng trên mobile |
| P1 | Form có dirty state nhưng xác nhận rời trang mới thấy ở nút Hủy và beforeunload; settings chưa thấy guard tương đương | Kiểm chứng rồi bảo vệ cả đổi tab/đổi bé/điều hướng nội bộ; giữ draft nếu hủy rời trang |
| P2 | `parent.css` có nhiều đợt bổ sung rule, dùng chung cho nhiều màn | Hợp nhất selector đang sửa, tách CSS theo nhóm tác vụ nếu cần; không chồng thêm override cuối file |

Ảnh có vị trí cuộn khác nhau. Không kết luận header bị cắt hoặc lỗi scroll chỉ từ ảnh; cần kiểm tra ở đầu trang và sau điều hướng khi triển khai.

## 3. Khung chung đề xuất

Thứ tự: **Quay lại danh sách → ngữ cảnh bé + chọn bé → điều hướng tác vụ → tiêu đề và bộ lọc → nội dung**.

- Desktop: giữ sidebar và container hiện có làm nền; content tối đa khoảng 1200–1240px, padding 24–32px. Đo lại trước khi thay kích thước shell.
- Ngữ cảnh bé: avatar 40–48px, tên 20–24px, ngày sinh 13–14px; bỏ dòng “HỒ SƠ ĐANG CHỌN” lặp. Selector cùng hàng bên phải.
- Giữ đủ bảy liên kết, thứ tự và route hiện tại; tab cao khoảng 44px, khoảng cách tới nội dung 20–24px. Không đổi navigation link thành ARIA tab nếu không triển khai đúng hành vi tab.
- H1 tác vụ 28–32px; H2 18–22px; body 15–16px; label 14px; metadata tối thiểu 12px. Số liệu dùng tabular figures.
- Card padding 20–24px, radius 16px; control radius 10–12px và vùng thao tác tối thiểu 44px. Một card cho một nhóm có nghĩa, không thêm card chỉ để bọc card khác.
- Vàng cho hành động chính/đang chọn; navy cho cấu trúc; màu trạng thái đi kèm chữ hoặc icon. Đo tương phản trên cặp màu thực tế.
- Mobile: padding 16px, context có thể xuống hàng; bảy tab cuộn ngang và active link luôn vào vùng nhìn thấy. Sidebar dùng drawer đang có.
- Mặc định không sticky toàn bộ header. Chỉ cân nhắc thanh hành động ở màn dài sau khi kiểm tra nó không che nội dung hoặc bàn phím ảo.

Mục tiêu đo ở viewport 1366 × 768, zoom 100%, trang vừa mở: vùng nội dung đầu tiên bắt đầu trong khoảng 280px tính từ đỉnh viewport ứng dụng; form Hồ sơ/Cài đặt với dữ liệu mẫu nhìn thấy hành động lưu mà không cuộn. Đây là mục tiêu thiết kế, không ép chiều cao cố định khi tên dài, lỗi hoặc zoom chữ làm tăng nội dung.

### Select dùng chung

Tạo `ParentSelect` dùng controlled value, option, label, disabled và error. Không thêm search cho danh sách ngắn. Panel có hover/focus/selected, viền và shadow nhẹ; animation opacity/translate khoảng 120–160ms, tắt khi reduced motion.

Hỗ trợ Arrow Up/Down, Home/End, Enter/Space, Escape, type-ahead, click ngoài; chọn xong trả focus về trigger, Escape không đổi giá trị. Panel không bị cắt bởi container hoặc tràn viewport. Dùng đúng semantics combobox/listbox và option. Bắt đầu bằng selector bé, sau đó settings/range/export; giữ native date input vì đây là input ngày, không phải dropdown lựa chọn.

## 4. Đặc tả từng trang

### 4.1. Hồ sơ — `/parent/children/:childId`

- Tiêu đề “Hồ sơ của Mây”, mô tả “Cập nhật tên, ngày sinh và hình đại diện của bé.”
- Một form rộng tối đa khoảng 760–800px, căn đầu container; không kéo field kín màn hình lớn và không lấp khoảng trắng bằng card trang trí.
- Tên và ngày sinh cùng hàng khi đủ chỗ, mobile xếp dọc; trợ giúp biệt danh ngay dưới tên. Bỏ icon lịch trang trí bị trùng native picker.
- Avatar là radio có focus rõ; hình xem trước cùng tỷ lệ, nhãn ngắn.
- Footer gồm trạng thái thay đổi, Hủy, Lưu thay đổi. Edit không thay đổi thì không gửi lại; create vẫn theo validation hiện có.
- Focus field lỗi đầu, nối lỗi bằng `aria-describedby`; lỗi lưu không xóa draft. Giữ route Hủy hiện tại và bảo vệ thao tác rời form.
- Kiểm tra đổi bé A → B không giữ tên/avatar draft của A; sau lưu, form và context header cùng cập nhật.

### 4.2. Cài đặt — `/settings`

- H1 “Cài đặt của Mây”; một câu giải thích chỉ áp dụng cho bé đang chọn.
- Một bề mặt chia hai hàng bằng divider: thời gian và chủ đề. Nhãn/helper bên trái, control bên phải; mobile một cột.
- Selector thời gian khoảng 240–320px, không kéo rộng toàn hàng. Chủ đề giữ checkbox rõ trạng thái, không biến thành nút mơ hồ.
- Khi không chọn chủ đề nào, hiển thị “Đang cho phép tất cả chủ đề”. Giữ nguyên `allowedCategories: []` và giá trị thời gian không giới hạn; không thêm toggle thay đổi payload.
- Footer thống nhất “Đã lưu” / “Có thay đổi chưa lưu” / “Đang lưu…”; không để thông báo thành công cũ còn hiện như trạng thái hiện tại sau khi sửa tiếp.
- Bảo vệ draft khi đổi bé/tab; không tự lưu hoặc bỏ draft khi người dùng chưa quyết định.

### 4.3. Phê duyệt — `/approvals`

- H1 “Phê duyệt nội dung”; mô tả ngắn phạm vi bé. Bộ lọc Chờ duyệt / Đã duyệt / Từ chối và số yêu cầu nằm sát danh sách.
- Desktop danh sách 280–340px, chi tiết chiếm phần còn lại. Mobile xếp dọc; khi chọn yêu cầu đưa focus tới tiêu đề chi tiết để không phải mò xuống cuối danh sách.
- Chi tiết ưu tiên: tên → loại yêu cầu, phiên bản, trạng thái → ảnh hiện tại/đề xuất → ghi chú → quyết định. Ảnh cùng khung `contain`, không crop mất nội dung.
- Phân biệt rõ “Duyệt phiên bản” và “Quyền dùng vai nhạy cảm”; hai hành động vẫn độc lập và đúng điều kiện hiện có.
- Từ chối mở form ghi chú inline đang có, giữ xác nhận; không tự thêm bắt buộc lý do khi contract chưa chốt.
- Trong lúc mutation khóa hành động liên quan, hiển thị lỗi ở đúng vùng. Refresh/đổi bộ lọc không được giữ một chi tiết không còn khớp danh sách hoặc bé.

### 4.4. Thư viện của bé — `/library`

- H1 “Thư viện của Mây”; không nhầm với `/parent/library`, là kho truyện để phụ huynh khám phá và đề xuất.
- Một toolbar gọn: tìm kiếm, loại nội dung, số kết quả. Giữ toolbar mounted qua loading/error và qua mỗi lần search để không mất focus/caret tiếng Việt.
- Lưới 3 cột khi vùng nội dung đủ rộng cho card tối thiểu khoảng 260px, 2 cột ở tablet và 1 cột mobile. Tối ưu kích thước card theo nội dung, không ép số cột theo viewport khi sidebar đã lấy mất chiều rộng.
- Card: ảnh → loại/tên/mô tả ngắn → trạng thái và hành động. Dùng một biểu tượng tim cho yêu thích; nút có accessible name theo item, trạng thái toggle rõ.
- Ẩn/hiện có nhãn hoặc giải thích truy cập được bằng bàn phím; xóa tách khỏi hai thao tác thường xuyên, giữ xác nhận và phạm vi thư viện bé.
- Empty phân biệt chưa có nội dung với không có kết quả; có Xóa bộ lọc khi phù hợp. Không tự thêm route xem truyện/nhân vật chưa tồn tại.

### 4.5. Tiến độ — `/progress`

- H1 “Tiến độ của Mây”, khoảng thời gian cùng hàng bên phải.
- Bốn chỉ số trên một bề mặt, ngăn bằng divider, theo ngôn ngữ dashboard hiện có. Mobile 2 × 2; ở zoom lớn có thể xuống một cột.
- Nhãn: Phút đọc, Truyện hoàn thành, Từ vựng đã ôn, Tỷ lệ trả lời đúng. Dùng summary service trả về, không tính trung bình từ các dòng bảng.
- Bảng “Lịch sử đọc”: số căn phải, ngày căn trái, hàng khoảng 44–48px; giữ thứ tự và giá trị từ API. Mobile cuộn trong vùng bảng có tên truy cập.
- `null` hiện “Chưa có dữ liệu”, `0` vẫn là số 0. Không tạo biểu đồ xu hướng, so sánh kỳ trước hoặc tự điền ngày thiếu.
- Giữ bộ lọc khả dụng khi tải lại; không hiển thị dữ liệu kỳ cũ dưới nhãn kỳ mới mà thiếu chỉ báo.

### 4.6. Bản xuất — `/exports`

- H1 “Bản xuất của Mây”; mô tả một dòng. Hạn mức gia đình là strip nhỏ ngay dưới heading, nêu rõ không phải quota riêng của bé.
- Desktop: form 320–360px bên trái, lịch sử linh hoạt bên phải. Mobile: quota → form → lịch sử. Lịch sử rỗng vẫn chiếm vùng có chủ đích, không để một cột không có nội dung.
- Form theo bé chỉ có chọn truyện, định dạng được hỗ trợ, trợ giúp cần thiết và “Tạo bản xuất”. Các field chiếm toàn chiều rộng form, tránh dropdown chọn truyện còn nửa hàng do grid dùng chung.
- Lịch sử ưu tiên tên truyện, định dạng, trạng thái, thời điểm và hành động tải/tạo lại. Dùng “Lịch sử bản xuất”, bỏ thuật ngữ “job” khỏi copy thông thường.
- Không bịa tiến độ khi API chưa có phần trăm. Không đổi quota, retry/idempotency, điều kiện tải, hết hạn hay entitlement; không mở thêm PDF/video chỉ vì mock có lựa chọn.
- Với `/parent/exports`, giữ lựa chọn bé và cấu hình Family ở cấp tài khoản. Tách bố cục route theo bé và route gia đình trong cùng logic hiện có; không bỏ wrapper `key={childId}` hoặc đưa cấu hình Family vào trang bé.

## 5. Các trang Parent còn lại

| Trang | Phạm vi đợt này |
| --- | --- |
| Tổng quan Parent và danh sách bé | Đồng bộ spacing/heading/control; giữ chức năng chọn bé, trạng thái liên kết và quota |
| Dashboard từng bé | Giữ hướng nhật ký đọc sách ở `DESIGN.md` mục 5; chỉ thích nghi context header/H1 và kiểm tra KPI |
| Thêm hồ sơ | Nhận cải tiến từ `ChildForm`; không đổi thành flow liên kết tài khoản khi contract chưa có |
| Thư viện truyện chung | Giữ layout và luồng đề xuất mới; hồi quy selector/focus nếu dùng component chung |
| Gói và checkout | Theo `PARENT_PLAN_REDESIGN_PLAN.md`; chỉ kiểm tra tính nhất quán, không mở lại phạm vi thanh toán |
| Hồ sơ tài khoản | Rà heading, copy và focus; không thêm chức năng chỉnh sửa nếu trang vẫn read-only |

## 6. Chặng triển khai và file dự kiến

| Chặng | Công việc | File chính | Điều kiện chuyển chặng |
| --- | --- | --- | --- |
| M0 | Chụp baseline sáu trang ở đầu trang; ghi diff có sẵn; đo chiều cao header; chạy baseline phù hợp | Router, test Parent, `parent.css`, `workspace.css` | Tách lỗi có sẵn khỏi mục tiêu mới |
| M1 | Context header, heading tác vụ, select dùng chung và responsive | `layouts/ChildWorkspaceLayout.jsx`, CSS Parent, component mới `ParentSelect`, các page dùng select | Không mất tab/focus, không đổi child scope; chọn được bằng keyboard |
| M2 | Form Hồ sơ và Cài đặt | `components/ChildForm.jsx`, `ChildDetailPage.jsx`, `NewChildPage.jsx`, `ChildSettingsPage.jsx` | Lưu/hủy/lỗi/dirty/đổi bé đúng; form hết khung lồng |
| M3 | Bố cục Bản xuất | `ParentExportsPage.jsx`, `ChildExportsPage.jsx`, CSS | Hết cột rỗng; cả hai route và lifecycle export đúng |
| M4 | Phê duyệt và Thư viện bé | `ChildApprovalsPage.jsx`, `ChildLibraryPage.jsx`, CSS | Quyết định độc lập; search không mất focus; thao tác đúng item |
| M5 | Tiến độ và đồng bộ trang phụ | `ChildProgressPage.jsx`, dashboard và trang Parent liên quan | Không đổi nghĩa dữ liệu/range; không hồi quy giao diện mới |
| M6 | Visual QA, accessibility, kiểm thử và cập nhật tài liệu | Tests Parent, `DESIGN.md`, ảnh kết quả | Có bằng chứng ở từng kích thước/trạng thái, không chỉ ảnh desktop |

Chỉ trích xuất component ở nơi có lặp thực tế: context, page heading, select, action footer. Giữ service/query keys/model/mock/permission ngoài phạm vi thay đổi trình bày. Nếu guard điều hướng cần thay cấu hình router, kiểm tra cơ chế router đang dùng trước và tách thay đổi đó để review, không giả định hook blocker dùng được ngay.

## 7. Tiêu chí nghiệm thu

- Kiểm tra 1440 × 900, 1366 × 768, 1024 × 768, 820 × 1180, 390 × 844 và 360 × 800; zoom chữ 200%. Không overflow toàn trang; chỉ tab/bảng được cuộn trong vùng riêng.
- Sáu trang có cùng context header, một H1 rõ tác vụ, không banner giới thiệu chiếm chỗ, không form bọc hai card. Trang Export theo bé không có cột rỗng.
- Kiểm tra tên dài 40 ký tự, nhiều bé, một bé, chưa có bé, không có quyền; tải chậm, lỗi và retry; dữ liệu rỗng, 0/null.
- Select/dropdown dùng keyboard hoàn chỉnh, focus nhìn thấy và trả đúng nơi, reduced motion hoạt động; drawer giữ Escape/focus trap hiện có.
- Dirty form được bảo vệ ở Hủy, đổi tab, đổi bé, điều hướng nội bộ và tải lại trang. Không hiện draft hoặc dữ liệu riêng của bé cũ dưới tên bé mới.
- Phê duyệt phiên bản không tự cấp quyền vai; favorite/hide/delete chỉ tác động đúng thư viện; search tiếng Việt giữ caret; khoảng thời gian giữ URL semantics hiện có.
- Export kiểm tra thiếu lựa chọn, pending, hết quota, thất bại/tạo lại, hoàn tất/tải, link hết hạn, đổi bé khi có tác vụ. Không yêu cầu mutation trùng hoặc đổi cách trừ lượt.
- Chạy lint/build; nhóm Playwright liên quan `parent`, `parent-ux`, `parent-responsive`, `parent-sensitive-role`, `child-dashboard`, `parent-library`, `parent-plan` và các test export hiện có. Thêm kiểm tra hành vi mới có ý nghĩa cho select, guard và route export; cập nhật assertion heading nhưng không bỏ kiểm tra nghiệp vụ.
- Mở rộng `parent-responsive.spec.js` để có Hồ sơ/Cài đặt; hiện danh sách route trong test chưa gồm hai trang này. Kiểm tra axe trên trạng thái đại diện, bổ sung thao tác keyboard thủ công.
- Smoke test Content/Admin/Profile khi đụng shell hoặc component shared. Lưu ảnh trước/sau cùng viewport và dữ liệu để đánh giá, ghi riêng mức mock/API/staging.

## 8. Các điểm phụ thuộc nghiệp vụ

Tối ưu bố cục có thể làm ngay. Cần thống nhất với contract trước khi thay đổi nghĩa thời gian đọc/sử dụng, chính sách tuổi hợp lệ, định dạng export và chi phí tạo lại. Ngày sinh trong ảnh là dữ liệu demo, không phải căn cứ tự thêm rule chặn tuổi. Không mở rộng đợt này thành tích hợp backend, flow liên kết Parent–Child hay thanh toán thật.
