# Kế hoạch tối ưu UI/UX Content Manager

## Bổ sung ngày 11/10/2026 — ưu tiên sự thuận tiện trong công việc

Phạm vi bổ sung: kế hoạch frontend cho toàn bộ hành trình Content Manager, liên kết với [kế hoạch Story Editor mới](STORY_EDITOR_UX_REDESIGN_PLAN.md). P0 đang được triển khai từng phần trong source frontend và mock; chưa hoàn tất toàn bộ backlog. Các quy tắc dưới đây được ưu tiên khi khác với baseline ngày 05/10 bên dưới, đặc biệt về điều hướng editor, lưu draft chung, upload audio và CRUD tài nguyên.

Trạng thái cập nhật 19/10: workspace editor và các thao tác trang/nhân vật/audio/preset đã có trong source. Story/page/role/vocabulary/quiz/publish và slot cơ bản đã có adapter API thật; field editor nâng cao, audio tracks/timeline, asset library độc lập và một số metadata tiếp tục mô phỏng, có nhãn “Dữ liệu mô phỏng” ở local và bản deploy. Chưa nghiệm thu runtime trên Backend hoặc usability test. Chi tiết nguồn dữ liệu hiện tại ở [báo cáo tích hợp](api-integration/luna-extramax/implementation-report-2026-10-19.md); autosave liên tục, Undo/Redo và timeline tuyệt đối vẫn là backlog.

### A. Mục tiêu và luồng chính

Thiết kế cho người biên tập nội dung không cần biết tọa độ, slot, keyframe hay revision. Cần nhìn thấy đang làm gì, thay đổi đã lưu chưa và bước tiếp theo là gì.

Luồng thường xuyên: **Tổng quan → Tiếp tục truyện → Dựng trang → Xem thử → Sửa lỗi → Xuất bản**. Luồng tạo mới: **Tên/chủ đề → Tạo bản nháp → Dựng trang đầu tiên**; thông tin không bắt buộc được bổ sung sau. Luồng tái sử dụng: **Chọn trang mẫu/nhân bản trang → Đổi nội dung và nhân vật → Xem thử**.

Giữ menu chính gồm Tổng quan, Kho truyện, Kho tư liệu, Hiệu quả nội dung. Editor mở rộng vùng làm việc và thu gọn menu toàn hệ thống; không bắt người dùng đi qua nhiều màn thiết lập trước khi dựng được một trang.

### B. Tối ưu từng điểm chạm

| Khu vực | Thiết kế và hành vi đề xuất | Lợi ích thực tế |
| --- | --- | --- |
| Tổng quan | “Tiếp tục công việc” ở đầu; truyện gần đây có nút mở lại đúng trang vừa sửa; Tạo truyện luôn dễ thấy | Bắt đầu công việc ngay, không phải tìm lại vị trí |
| Kho truyện | Tìm kiếm, lọc trạng thái/chủ đề, sắp xếp; hàng hiển thị bìa, tên, số trang, cập nhật, thay đổi chưa xuất bản | Quét và chọn đúng truyện nhanh |
| Quay lại danh sách | Giữ bộ lọc, phân trang, vị trí cuộn; mở truyện không mất ngữ cảnh tìm kiếm | Không lặp lại thao tác tìm |
| Tạo truyện | Form tối thiểu theo validation hiện có; tạo xong vào Dựng truyện; bìa/mô tả bổ sung sau nếu không bắt buộc | Có trang đầu tiên sớm |
| Dựng truyện | Thumbnail trang + canvas + inspector + trình tự; thêm nền/nhân vật/audio tại chỗ | Hoàn thành một cảnh trong cùng workspace |
| Thông tin truyện | Tên, mô tả, chủ đề, bìa và preview gọn; tách khỏi thao tác dựng cảnh | Bớt nhiễu khi đang biên tập |
| Học liệu | Từ vựng/câu hỏi lọc theo trang hiện tại; thêm nhanh, nhân bản mục, thử trả lời; giữ các route cũ tương thích | Không chọn lại trang cho từng mục |
| Kho tư liệu | Nhóm Nền/Nhân vật/Âm thanh; tìm, xem trước/nghe thử, dùng gần đây; nhân vật gom theo bộ tư thế | Không phải dò hàng loạt file tên gần giống nhau |
| Xem thử | Phát trang hiện tại/toàn truyện; quay lại đúng trang, giữ selection và draft | Chu kỳ sửa–xem ngắn, không mất công việc |
| Kiểm tra | Lỗi gom theo trang; mỗi lỗi có hành động “Đi tới và sửa”; phân biệt lỗi chặn xuất bản và cảnh báo | Biết sửa gì, ở đâu và vì sao |
| Xuất bản | Bản tóm tắt số trang, trạng thái kiểm tra và phần chưa lưu; lưu xong mới kiểm tra đúng revision và xác nhận | Hiểu chính xác bản nào sẽ được xuất bản |
| Hiệu quả nội dung | Khoảng thời gian, phạm vi dữ liệu, trạng thái thiếu dữ liệu; từ một truyện mở lại editor | Số liệu hỗ trợ chỉnh nội dung, không làm dashboard giả bận rộn |

“Mở lại đúng trang” lưu theo tài khoản/truyện trong frontend; nếu trang đã xóa thì về trang hợp lệ đầu tiên và thông báo ngắn. Nhãn lỗi/cần xử lý chỉ xuất hiện khi có kết quả kiểm tra thật, kèm thời điểm; không giả định truyện đã hợp lệ chỉ vì chưa được kiểm tra. Không tự validate toàn kho khi vào Tổng quan.

### C. Giảm số thao tác trong editor

- Tạo trang trống chỉ bằng một thao tác; tên tạm “Trang mới” có thể sửa tại chỗ. Cho lưu nháp chưa hoàn thiện, kiểm tra điều kiện nội dung trước xuất bản; thay đổi validation cần nhất quán trong mock adapter.
- Khi chọn nhân vật, inspector tự mở đúng thông tin: tư thế, kích thước, hướng, lớp và nút Thêm hoạt động. Khi chọn nền hoặc audio, chỉ hiện thuộc tính liên quan.
- Sau khi upload thành công, asset mới được chọn sẵn và có nút “Thêm vào trang”; upload nhiều file có trạng thái và thử lại theo từng file.
- Giữ tab thư viện, từ khóa, zoom và độ mở panel trong phiên làm việc. Không reset mỗi lần đổi nhân vật.
- Nhân bản trang để tái sử dụng bố cục; sao chép/dán nhân vật và hoạt động giữa trang, remap ID và kiểm tra phụ thuộc. Không tự nhân bản học liệu khi chưa chọn.
- Hỗ trợ chọn nhiều đối tượng để di chuyển/xóa/đổi lớp cùng lúc ở đợt sau; thao tác đơn phải hoàn thiện trước.
- Preset có thumbnail và nút chạy thử; nút “Đặt lại” khôi phục thuộc tính vừa chỉnh, có Undo. Không yêu cầu mở modal cho chỉnh sửa thông thường.
- Hành động ít dùng đặt trong menu dấu ba chấm; hành động chính như thêm trang, thêm nhân vật và phát thử hiển thị trực tiếp.

### D. Dễ học nhưng không cản người dùng quen

- Lần đầu mở trang trống: ba gợi ý tại chỗ “Chọn nền → Thêm nhân vật → Thêm hoạt động”. Có thể bỏ qua; không dùng tour dài chặn thao tác.
- Dùng tiếng Việt thống nhất: Trang truyện, Nhân vật, Tư thế, Chuyển động, Lời kể, Nhạc nền, Hiệu ứng âm thanh, Trình tự, Lớp hiển thị.
- Dùng nhãn “Trên cùng/Đưa ra trước” thay cho chỉ có số layer; tọa độ và mã kỹ thuật nằm trong mục nâng cao.
- Tooltip giải thích kèm ví dụ ngắn: “Sau lời kể: bắt đầu khi đoạn lời kể được chọn phát xong”. Nội dung quan trọng không chỉ nằm trong tooltip.
- Danh sách hoạt động đơn giản là mặc định. Timeline chi tiết là lựa chọn mở rộng của cùng dữ liệu, không tạo hai cấu hình khác nhau.
- Phím tắt gợi ý: Ctrl/Cmd+Z để Undo, Ctrl/Cmd+Shift+Z để Redo, Ctrl/Cmd+S để lưu, Delete để xóa đối tượng, phím mũi tên để dịch chuyển. Chỉ hoạt động khi focus phù hợp; không chặn gõ/xóa văn bản trong input.
- Mọi thao tác kéo thả có cách thay thế bằng nút hoặc trường nhập; không bắt buộc dùng chuột chính xác.

### E. Bảo vệ công việc và phản hồi rõ ràng

- Một draft chung cho editor; chọn trang/nhân vật không bỏ form cũ và không liên tục hỏi “Bỏ thay đổi?”. Chỉ cảnh báo khi thực sự rời editor với dữ liệu chưa được bảo toàn.
- Autosave và Undo/Redo là nền tảng. Báo “Đã lưu” chỉ sau lưu thành công; “Đã lưu bản nháp” khác “Đã xuất bản”. Mock mode ghi rõ dữ liệu được lưu trên trình duyệt này, không gợi ý đã đồng bộ máy chủ.
- Khi mất kết nối hoặc lưu lỗi: giữ draft, thông báo cố định cạnh trạng thái lưu và có Thử lại; toast không phải nơi duy nhất chứa lỗi quan trọng.
- Xóa một lần xuất hiện trên trang có Undo. Xóa trang/nhân vật toàn truyện/file có phụ thuộc phải hiển thị phạm vi ảnh hưởng; không dùng cùng một nhãn “Xóa” cho các phạm vi khác nhau.
- Inline validation gần trường; khi submit lỗi, mở đúng nhóm và focus lỗi đầu tiên, không cuộn về đầu trang vô cớ.
- Skeleton theo vùng; upload và asset processing có trạng thái riêng. Empty state có hành động bắt đầu; không tìm thấy do bộ lọc thì có Xóa bộ lọc.

### F. Nguyên tắc thị giác và khả năng sử dụng

Giữ Nunito, Phosphor và palette hiện tại để nhất quán với hệ thống. Dùng nền trung tính, một màu nhấn hành động, ít khung card lồng nhau. Canvas là vùng nổi bật nhất trong editor; giảm header, mô tả kỹ thuật và khoảng trống không phục vụ thao tác.

- Chữ thao tác chính 14–16 px; input và nút có chiều cao nhất quán; vùng bấm mục tiêu 40–44 px, đủ tách biệt với nút xóa.
- Dùng icon kèm nhãn cho hành động quan trọng; trạng thái có chữ, không chỉ màu. Focus bàn phím luôn nhìn thấy.
- Sidebar/inspector/timeline thu gọn và đổi kích thước được; canvas Fit hoạt động ở laptop 1366×768. Khi zoom trình duyệt lớn, panel chuyển thành drawer thay vì che nút lưu/phát.
- Modal chỉ dùng khi cần quyết định có hậu quả hoặc chọn nhiều bước; hỗ trợ Escape, focus trap và trả focus về nút mở.
- Hiệu ứng UI ngắn và nhẹ; tôn trọng reduced motion cho giao diện. Animation nội dung truyện vẫn do nút phát và thiết lập xem thử điều khiển rõ ràng.
- Kiểm tra bằng screenshot và thao tác thật trước khi kết luận bố cục tốt; các thông số trên là mục tiêu thiết kế, chưa phải kết quả đo.

### G. Thứ tự thực hiện và nghiệm thu UX

| Ưu tiên | Hạng mục | Điều kiện hoàn thành |
| --- | --- | --- |
| P0 | Luồng tạo/tiếp tục truyện, draft chung, trạng thái lưu, một workspace dựng trang | Người dùng tạo và sửa cảnh mà không phải chuyển sang tab role hoặc nhập tọa độ bắt buộc |
| P0 | Thư viện tại chỗ, CRUD trang/nhân vật/audio, sequence và preview | Đi hết kịch bản Bobby với ảnh/audio mẫu; đổi thứ tự hoạt động và nghe/xem được kết quả |
| P0 | Lỗi có đường dẫn sửa, Undo, bảo toàn dữ liệu | Save failure/đổi trang/Undo không làm mất chỉnh sửa; lỗi mở đúng đối tượng |
| P1 | Tổng quan/kho truyện, tìm/lọc và khôi phục ngữ cảnh | Mở bản nháp gần đây trong một thao tác; quay lại kho giữ đúng bộ lọc |
| P1 | Học liệu theo trang, publish review, responsive/keyboard | Hoàn thành luồng kiểm tra–sửa–xuất bản bằng chuột hoặc bàn phím |
| P2 | Chọn nhiều, thư viện preset/trang mẫu, tinh chỉnh thống kê | Thêm sau khi flow đơn và kết quả usability test ổn định |

Các bước này bổ sung UX vào năm đợt trong plan Story Editor, không tạo một đợt triển khai riêng trùng lặp. Chi tiết timeline nâng cao và audio đi cùng đợt kỹ thuật tương ứng.

Usability test đề xuất với 3–5 người có công việc biên tập hoặc tương đương: tìm và tiếp tục truyện, tạo trang với Bobby, đổi tư thế/chuyển động, thêm và đổi thứ tự hai audio, nhân bản/xóa/hoàn tác, sửa lỗi rồi xuất bản mock. Ghi thời gian, số thao tác, lần đi nhầm, nhu cầu trợ giúp và điểm tự đánh giá dễ dùng; đo baseline trước rồi so sau redesign.

Mục tiêu thử nghiệm ban đầu: ít nhất 4/5 người hoàn thành các tác vụ chính không cần người hướng dẫn nếu nhóm có 5 người; giảm tối thiểu 30% thời gian cho các tác vụ hiện đã có so với baseline; không có ca mất dữ liệu trong các kịch bản kiểm tra. Các chức năng mới như timeline đo riêng, không so với baseline chưa tồn tại. Đây là mục tiêu nghiệm thu, chưa phải số liệu thực tế.

Không cần thêm yêu cầu để lập wireframe. Khi triển khai, ưu tiên lấy phản hồi trên flow dựng một trang hoàn chỉnh trước khi tinh chỉnh màu sắc và trang thống kê.

---

Ngày cập nhật: 05/10/2026. Trạng thái: kế hoạch đã đối chiếu lại code hiện tại; đợt nền Content Manager đã triển khai một phần trong working tree. Lần cập nhật này chỉ sửa tài liệu.

Đặc tả chi tiết theo taste: [CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md](CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md), bao gồm token, button, margin/padding, form, từng trang, responsive, trạng thái và backlog. Dùng đặc tả này cho thông số trình bày; tài liệu hiện tại giữ vai trò kế hoạch tổng thể.

Đã có trong code: lớp style và token riêng cho Content Manager; nhiều button/input/focus/status states; tổng quan tìm bản nháp toàn kho và shortcut thao tác được; canvas Pages phản ánh draft local; xác nhận Hide; validation `correctIndex = null` của Quiz. Shell responsive vẫn cần sửa giới hạn container/cascade; publish issue mới có tab/hash và chưa đảm bảo đúng field/entity.

Đọc [đặc tả chi tiết](CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md) mục 0 để xem đủ 12 màn, mục 6–17 cho thông số từng trang, mục 22 cho checklist triển khai nhỏ và thứ tự bàn giao. Audit mới ở mục 1.1 của đặc tả được ưu tiên hơn các nhận xét baseline cũ.

## 1. Phạm vi và cơ sở

Kế hoạch dựa trên việc đọc route, component, CSS, service và contract trong working tree hiện tại. Chưa chạy audit giao diện trên trình duyệt hoặc kiểm chứng API production; các nhận xét thị giác cần được đối chiếu bằng ảnh chụp trước khi triển khai.

Nguồn: `src/features/content/`, `src/app/App.jsx`, `src/app/layouts/workspace.css`, [DESIGN.md](DESIGN.md), [CONTENT_MANAGER_CONTRACT.md](CONTENT_MANAGER_CONTRACT.md), [CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md](CONTENT_MANAGER_UI_UX_DETAIL_SPEC.md) và [API runbook](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md).

Bao phủ 11 trang nghiệp vụ: tổng quan, kho truyện, tạo truyện, thông tin truyện, trang truyện, vai nhân vật, từ vựng, câu hỏi, xem trước, kho tư liệu và thống kê. Hồ sơ tài khoản là trang dùng chung, có hạng mục phụ ở cuối. Giữ React, React Router, React Query, CSS hiện có, Nunito và Phosphor.

Mục tiêu: tìm đúng truyện nhanh; biên tập trực quan; luôn biết nội dung nào chưa lưu/chưa xuất bản; sửa được lỗi ngay tại vị trí phát sinh; hoàn thành luồng tạo → biên tập → kiểm tra → xuất bản mà không mất dữ liệu.

## 2. Những điểm đã xác định từ code

| Hiện trạng | Ý nghĩa với kế hoạch |
| --- | --- |
| Kho truyện đã có filter/sort/pagination trong URL, loading/error/empty | Giữ các hành vi này, không xây lại từ đầu |
| Editor đã có revision, draftDirty, hook dirty và cảnh báo rời trang | Hoàn thiện độ phủ và cách trình bày; không gọi đây là tính năng còn thiếu hoàn toàn |
| Tổng quan chỉ lấy 5 truyện gần nhất; nhãn phụ đã nói rõ phạm vi | Giảm cách trình bày giống KPI toàn kho; chỉ hiển thị tổng khi có dữ liệu tổng hợp |
| Trang biên tập có cả canvas/thuộc tính và danh sách sửa nhanh bên dưới | Hai đường sửa cùng nội dung tạo dư thừa và khó theo dõi bản đang sửa |
| Canvas đã dùng `composedStory` từ `pageDraft`/`slotDraft` | Giữ live preview; tập trung vào chuyển mục an toàn và một nguồn chỉnh sửa |
| Quiz đã chặn null trong radio và validation | Giữ regression null/index 0; tiếp tục cải thiện hủy/xóa/làm thử |
| PublishIssues suy ra tab/hash từ chuỗi field; title được xử lý trước namespace | Có thể mở sai field như pages.title → story-title; chưa chọn entity trước focus |
| Sidebar width 232 nhưng root grid vẫn 248; main cha max 1280 | Sửa khung cha, không chỉ nới editor con |
| Filter khai báo grid-template-columns trên display flex; search padding có thể bị override | Audit computed layout và sửa cascade trước chỉnh margin nhỏ |
| AssetPicker có select, search, thumbnails và dialog cùng lúc | Lặp cách chọn; cần một điểm vào chính |
| Upload chỉ chấp nhận ảnh tối đa 5 MB, nhưng kho có lựa chọn lọc audio | Làm rõ khả năng thực tế, không quảng bá upload audio chưa hỗ trợ |
| Nhiều nhãn trộn story/page/role/slot/metadata với tiếng Việt | Chuẩn hóa ngôn ngữ và giảm mô tả kỹ thuật trên giao diện |

## 3. Quy tắc thiết kế chung

- Hướng thiết kế: không gian biên tập gọn, sáng, dễ quét. Giữ nền kem, bề mặt trắng, chữ navy; vàng dành cho hành động chính và lựa chọn. Màu trạng thái luôn đi cùng chữ/icon.
- Chữ nội dung/form mục tiêu 14–16 px, trợ giúp 12–14 px, tiêu đề trang 28–32 px. Kiểm tra tương phản thực tế; hạn chế chữ 10–11 px hiện có ở thông tin quan trọng.
- Hệ khoảng cách 4/8/12/16/24/32 px. Giảm nhiều lớp card lồng nhau; ưu tiên một bề mặt chính và đường phân cách nhẹ.
- Mỗi khu vực thao tác có một hành động chính. Không làm nút xuất bản nổi bật ngang nút lưu ở mọi bước.
- Đổi nhãn: Metadata → Thông tin; Pages → Trang truyện; Roles / Slots → Vai nhân vật; Vocabulary → Từ vựng; Quiz → Câu hỏi; Preview → Xem trước; Asset → Tư liệu; Publish → Xuất bản.
- Giữ thông tin revision/ID trong phần chi tiết khi cần hỗ trợ xử lý lỗi. Dùng “Bản nháp đã lưu” và “Bản đang xuất bản” để giải thích trạng thái cho người biên tập.
- Loading dùng skeleton theo vùng; lỗi có thử lại; empty phân biệt chưa có dữ liệu và không có kết quả lọc. Lỗi tải ảnh không làm biến mất form hay danh sách.
- Dialog có focus trap, Escape và trả focus về trigger. Dropdown tùy biến theo DESIGN.md phải hỗ trợ bàn phím và reduced motion; dùng một component chung sau khi kiểm chứng, không viết riêng cho từng trang.
- CSS mới giới hạn trong Content Manager, dự kiến `src/features/content/content.css`; tránh làm thay đổi Parent/Admin do selector chung.

## 4. Khung điều hướng và editor — P0

Giữ menu chính: Tổng quan / Kho truyện / Kho tư liệu / Hiệu quả nội dung. Sidebar có thể thu gọn khi mở editor. Breadcrumb: Kho truyện → Tên truyện → Tab hiện tại; quay lại kho giữ bộ lọc trước đó.

Header editor gọn: tên truyện, trạng thái xuất bản, trạng thái lưu, nút xem trước. Các tab là điều hướng tự do, không ép người dùng đi tuần tự. Luồng hướng dẫn gợi ý: Thông tin → Trang truyện → Vai nhân vật → Từ vựng → Câu hỏi → Xem trước.

Thanh lưu theo ngữ cảnh hiển thị: Có thay đổi chưa lưu / Đang lưu / Đã lưu / Lưu thất bại. Tách biệt với “Có thay đổi chưa xuất bản”. Nút lưu tác động đúng form đang sửa; nếu có nhiều form dirty phải liệt kê rõ, không giả định một lần lưu đã lưu tất cả.

Khi rời tab, đổi entity, bấm Back của trình duyệt hoặc menu: kiểm tra dữ liệu chưa lưu. Dialog có “Ở lại”, “Bỏ thay đổi”, và chỉ thêm “Lưu rồi tiếp tục” khi có thể lưu/validate trọn vẹn form hiện tại. Reload/đóng tab tiếp tục dùng cảnh báo native của trình duyệt.

Xuất bản: mở bảng kiểm tra → liệt kê lỗi theo phần → sửa đúng entity/field → kiểm tra lại → xác nhận xuất bản. Kết quả kiểm tra gắn với revision và bị vô hiệu sau khi lưu nội dung mới. Trong lúc mutation chạy, khóa các hành động xung đột. Khi 409, giữ input và hướng dẫn tải bản mới; không tự ghi đè.

Ẩn truyện: xác nhận bằng tên truyện và giải thích tác động lên danh mục; không hứa xóa/thu hồi các bản truyện đã tạo nếu contract không quy định.

Nghiệm thu: không mất input khi lưu lỗi/409; không báo đã lưu trước phản hồi thành công; không xuất bản khi còn dirty hoặc pending; lỗi kiểm tra mở đúng tab, chọn đúng mục và focus đúng trường.

## 5. Kế hoạch theo từng trang

### 5.1. Tổng quan — `/content` — P1

- Thu gọn hero hiện tại để đưa công việc lên phần đầu màn hình.
- Bố cục: tiêu đề + Tạo truyện → Tiếp tục biên tập → truyện cập nhật gần đây → shortcut kho tư liệu/thống kê.
- Hiển thị bìa, tên, trạng thái, ngày cập nhật và hành động tiếp tục. Giữ phạm vi “5 truyện gần đây” nếu vẫn dùng query hiện tại.
- Shortcut kho tư liệu/thống kê đã có link: giữ và sắp xếp sau khu công việc.
- Query bản nháp riêng đã có: giữ; bổ sung lỗi/thử lại của vùng này và không suy ra “không có bản nháp” khi query thất bại.
- KPI toàn kho hoặc hàng đợi “cần xử lý” chỉ bổ sung khi nguồn dữ liệu đủ, không validate hàng loạt truyện khi tải trang.
- Nghiệm thu: người dùng mở được bản nháp từ tổng quan bằng một thao tác; nhãn số liệu không gây hiểu nhầm phạm vi.

### 5.2. Kho truyện — `/content/stories` — P1

- Giữ danh sách có bìa, tối ưu thành hàng dễ quét: tên/chủ đề, trạng thái, số trang, cập nhật, Mở biên tập.
- Gom tìm kiếm, trạng thái, chủ đề, sắp xếp thành toolbar gọn; chip bộ lọc đang áp dụng và Xóa bộ lọc.
- Debounce tìm kiếm khoảng 300 ms; URL vẫn là nguồn trạng thái. Giữ dữ liệu cũ khi tải trang kết quả mới, có dấu hiệu đang cập nhật.
- Giữ vị trí cuộn/bộ lọc khi quay về từ editor. Phân trang có tổng kết quả, trang hiện tại, previous/next rõ ràng.
- Hiển thị “Có thay đổi chưa xuất bản” riêng với trạng thái Published. Không thêm bulk publish trong đợt tối ưu này.
- Nghiệm thu: refresh, link chia sẻ và Back khôi phục bộ lọc; ảnh lỗi có fallback; danh sách không nhảy trắng mỗi lần gõ.

### 5.3. Tạo truyện — `/content/stories/new` — P1

- Form hai vùng: tên/mô tả/chủ đề bên trái, ảnh bìa và thẻ xem trước bên phải; mobile một cột.
- Giữ tên và chủ đề bắt buộc theo validation hiện tại; nói rõ có thể bổ sung bìa sau khi lưu nháp.
- Nút chính “Tạo bản nháp và thêm trang”; sau thành công đi vào Trang truyện của truyện vừa tạo.
- Bỏ mô tả kỹ thuật về metadata/schema/mobile. Thay bằng trợ giúp ngắn tại field, ví dụ tên truyện và mô tả mẫu.
- Nghiệm thu: lỗi đặt cạnh trường và focus lỗi đầu tiên; click liên tiếp không tạo trùng; lỗi mạng giữ nội dung; hủy có bảo vệ dirty.

### 5.4. Thông tin truyện — `/content/stories/:storyId` — P1

- Tái sử dụng StoryForm nhưng phân biệt ngữ cảnh sửa và tạo; nút “Lưu thay đổi”.
- Xem trước bìa/tên/mô tả theo input hiện tại. Giữ chiều cao ảnh ổn định khi tải.
- Thông báo ngắn: “Thay đổi chỉ áp dụng vào bản nháp cho đến khi xuất bản”. Hiển thị lần xuất bản gần nhất nếu dữ liệu có.
- Tránh nút Hủy gây hiểu nhầm: “Hoàn tác thay đổi” để khôi phục form; “Quay lại kho truyện” là điều hướng riêng.
- Nghiệm thu: lưu cập nhật baseline dirty; chỉnh thông tin không làm thay đổi snapshot đã xuất bản.

### 5.5. Trang truyện — `.../pages` — P0

- Desktop: danh sách trang 180–220 px → canvas co giãn → thuộc tính 280–320 px. Tự thu gọn sidebar hoặc chuyển hai cột khi vùng làm việc không đủ rộng.
- Một vùng sửa chính. Bỏ danh sách sửa nhanh lặp bên dưới; đưa sửa/xóa/di chuyển vào trang đang chọn hoặc menu của từng trang.
- Danh sách có thumbnail, số trang và tiêu đề; giữ nút lên/xuống để dùng bàn phím. Kéo sắp xếp là phần nâng cao, không thay thế nút.
- Canvas phản ánh pageDraft và slotDraft ngay trong bộ nhớ; nhãn “Xem trước thay đổi chưa lưu”. Dùng cùng renderer và quy ước tọa độ với preview đã lưu.
- Thuộc tính chia “Nội dung”, “Ảnh nền”, “Lời đọc”; chọn nhân vật trên canvas chuyển sang thuộc tính vị trí, có nút quay lại thuộc tính trang.
- Vị trí: nhãn Dịch ngang/Dịch dọc, Kích thước, Thứ tự lớp, Lật ngang; vẫn giữ số để chỉnh chính xác. Kéo/thay đổi kích thước trực tiếp đưa sang P2 sau khi xác nhận canvas với Mobile.
- Xóa trang nêu đúng các liên kết bị ảnh hưởng theo contract; không tự giả định cascade cho từ vựng/câu hỏi. Nếu API từ chối, chỉ dẫn xử lý.
- Nghiệm thu: sửa chữ/vị trí thấy ngay trên canvas nhưng chưa lưu server; chọn trang/slot không làm mất thay đổi im lặng; lưu và preview cho kết quả thống nhất.

### 5.6. Vai nhân vật — `.../roles` — P1

- Danh sách vai với ảnh mặc định, tên, nhãn cho phép thay nhân vật và nhãn vai nhạy cảm. Mỗi lần mở một vùng chỉnh sửa để giảm form dày đặc.
- Giải thích bằng ngôn ngữ nghiệp vụ: “Cho phép dùng nhân vật của bé”; “Vai cần phụ huynh cho phép”. Không thay đổi cơ chế quyền đã có.
- Đổi slot thành “Vị trí xuất hiện”. Mỗi vị trí ghi số/tên trang, thumbnail nhỏ và “Mở vị trí trên trang”.
- Deep link dùng pageId/slotId để mở đúng trang và chọn đúng nhân vật; không chỉ mở tab pages mặc định như hiện tại.
- Tạo vị trí bằng chọn trang, sau đó chỉnh tại canvas; các thuộc tính nâng cao thu gọn.
- Xóa vai có xác nhận số vị trí sẽ bị ảnh hưởng dựa trên dữ liệu thật.
- Nghiệm thu: phân biệt được định nghĩa vai và vị trí xuất hiện; link hai chiều giữ ngữ cảnh; không đổi ID khi cập nhật.

### 5.7. Từ vựng — `.../vocabulary` — P1

- Bố cục danh sách có tìm kiếm/lọc theo trang, vùng chỉnh sửa kèm trích đoạn trang chứa từ.
- Hiển thị từ/cụm từ, nghĩa, trang liên kết và trạng thái audio; không dùng URL dài làm nội dung chính trong danh sách.
- Cho nghe audio bằng player khi có URL hợp lệ; lỗi audio có thông báo tại mục đó. Bộ chọn audio từ kho chỉ làm khi kho hỗ trợ đúng loại.
- Cảnh báo mềm khi từ không xuất hiện trong đoạn văn; không chặn tuyệt đối do biến thể ngôn ngữ. Cảnh báo trùng theo từ + trang.
- Chưa có trang: giải thích và CTA “Thêm trang truyện”, thay cho chỉ disable nút lưu.
- Nghiệm thu: chuyển mục có bảo vệ dirty; lỗi gắn với trường; xóa có xác nhận phù hợp; trang liên kết không tồn tại được chỉ rõ và có cách sửa.

### 5.8. Câu hỏi — `.../quizzes` — P0

- Logic null đã được sửa trong working tree: giữ kiểm tra số nguyên/trong khoảng và radio chưa chọn; xác minh regression trước khi đổi layout.
- Desktop: danh sách câu hỏi → form → phần thử; ở chiều rộng nhỏ gộp form/thử bằng tab. Chỉ một câu hỏi mở sửa tại một thời điểm.
- Đánh nhãn đáp án A/B/C; đúng một radio được chọn; lỗi chưa chọn đáp án đặt cạnh nhóm radio.
- Tách chế độ Soạn và Làm thử. Làm thử không đánh dấu trước đáp án đúng; hiện kết quả sau lựa chọn và có Làm lại.
- Hiện liên kết trang, lời phản hồi và audio nếu có; giữ số lựa chọn theo contract hiện có, không tự thêm loại quiz mới.
- Nghiệm thu: điền đủ câu hỏi/đáp án nhưng chưa chọn đáp án đúng phải bị chặn; hỗ trợ bàn phím; không ghi kết quả thử vào thống kê người học.

### 5.9. Xem trước và xuất bản — `.../preview` — P0

- Thanh công cụ: chọn trang, trước/sau, bộ đếm, kích thước khung mô phỏng; khu kiểm tra xuất bản đặt riêng khỏi nội dung truyện.
- Nhãn rõ “Bản nháp đã lưu”; không gọi preview này là nội dung chưa lưu hoặc bản production.
- Hai chế độ: Đọc thử (ẩn đáp án, tương tác quiz) và Kiểm tra nội dung (thấy từ vựng/câu hỏi/liên kết và lỗi).
- Lỗi tải tư liệu tách khỏi lỗi dựng preview; có thử lại. Empty có nút Thêm trang đầu tiên.
- Checklist dựa trên quy tắc validate thật; quiz optional không được coi là thiếu bắt buộc. Lỗi có nút Sửa tại vị trí; sau lưu quay lại đúng trang đã xem.
- Xác nhận xuất bản trình bày tên truyện và tác động tạo phiên bản mới. Hiện kết quả/version từ server; không giả lập thành công.
- Nghiệm thu: preview không mutation; ảnh/vị trí khớp bản lưu; kết quả validate cũ không còn hiển thị hợp lệ sau revision mới; lỗi publish vẫn giữ ngữ cảnh.

### 5.10. Kho tư liệu — `/content/assets` — P1

- Toolbar tìm theo tên/lọc loại → lưới tư liệu → panel chi tiết bên cạnh. Upload là nút rõ ràng, mở vùng chọn file gọn thay vì luôn chiếm nhiều diện tích.
- Nêu đúng định dạng PNG/JPG/WEBP/GIF, tối đa 5 MB theo validator hiện tại. Không bật upload audio trước khi thống nhất API.
- Trạng thái file: đang gửi, xử lý, sẵn sàng, lỗi theo dữ liệu thật; chỉ hiện phần trăm khi transport cung cấp tiến độ thực.
- Chi tiết có ảnh hoặc audio player đúng loại, tên, dung lượng và kích thước nếu có. ID đưa vào chi tiết phụ.
- AssetPicker dùng một thumbnail đã chọn + nút Thay/Chọn tư liệu; dialog có tìm kiếm và lưới, không đồng thời thêm select và 8 thumbnail bên ngoài.
- Chặn chọn file sai loại hoặc chưa sẵn sàng ở mọi đường chọn, không chỉ trong dialog.
- Chưa thêm xóa/thay bytes asset đã được tham chiếu. Upload nhiều file, tag và thông tin “đang dùng ở đâu” là phần mở rộng cần contract riêng.
- Nghiệm thu: cancel/retry upload hoạt động; đóng picker giữ lựa chọn cũ; chọn xong trả focus; file lỗi không xuất hiện như tư liệu dùng được.

### 5.11. Hiệu quả nội dung — `/content/statistics` — P1

- Đưa lượt đọc, người đọc hoạt động và tỷ lệ hoàn thành lên đầu; số truyện xuất bản/bản nháp là nhóm quy mô kho riêng.
- Giữ 7/30 ngày trong URL. Không thêm khoảng ngày tùy ý nếu API chưa hỗ trợ.
- Đổi phần xu hướng thành biểu đồ có trục/ngày/đơn vị dễ đọc, kèm bảng số liệu truy cập được; không bắt buộc thêm thư viện biểu đồ.
- Top truyện thành danh sách có link mở biên tập, lượt đọc, tỷ lệ hoàn thành, trạng thái đúng dữ liệu. Không áp dụng tone success cho mọi trạng thái.
- Mô tả mẫu số và ý nghĩa chỉ số khi backend xác nhận; bỏ câu kỹ thuật “do Backend định nghĩa” khỏi nội dung hướng tới người dùng.
- Phân biệt 0 với chưa có dữ liệu; giữ cảnh báo dữ liệu từng phần. So sánh kỳ trước chỉ có khi nguồn dữ liệu hỗ trợ.
- Nghiệm thu: đổi khoảng cập nhật đồng bộ KPI/chart/list; dữ liệu thiếu hiện dấu “—”; mọi tỷ lệ đều có định nghĩa rõ trước khi nghiệm thu tích hợp.

### 5.12. Hồ sơ dùng chung — `/profile` — P2, phạm vi phụ

Giữ nhãn role Content Manager, thông tin tài khoản và shortcut về khu nội dung. Chỉ hiển thị thao tác chỉnh sửa/đổi mật khẩu khi có flow thực; tránh nút trông hoạt động nhưng không có tác dụng. Không mở rộng redesign các role khác trong đợt này.

## 6. Phân kỳ triển khai và phụ thuộc

| Đợt | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 0 — xác lập baseline | Chụp 11 trang trên dữ liệu mock ổn định; đối chiếu lỗi nêu trên; rà route/dirty/save | Danh sách lỗi tái hiện được và ảnh trước thay đổi |
| 1 — P0 an toàn thao tác | Regression quiz null; dirty/pending, conflict, validate theo revision, deep link lỗi, preview lỗi | Luồng lưu/kiểm tra/xuất bản không mất hoặc hiểu nhầm dữ liệu |
| 2 — P1 nền giao diện | Hoàn thiện CSS Content đã có, sửa grid/container/cascade; nhãn tiếng Việt, header/editor navigation, picker/dialog, tổng quan/kho/tạo/thông tin | Luồng tìm → tạo → mở biên tập nhất quán |
| 3 — hoàn thiện biên tập | Trang truyện một vùng sửa + live draft preview, vai, từ vựng, câu hỏi, preview tương tác | Luồng biên tập đầy đủ dùng được trên laptop/tablet |
| 4 — tư liệu và thống kê | Kho file, lỗi media, số liệu/biểu đồ, responsive/accessibility toàn bộ | Đạt checklist, regression Parent/Admin không bị ảnh hưởng |
| 5 — P2 mở rộng | Kéo/thả, resize, phục hồi nháp, nâng cấp media/analytics khi có contract | Thiết kế và API được thống nhất riêng |

P0 là ưu tiên về tính đúng và an toàn dữ liệu; các phần bố cục lớn có thể hoàn thiện trong đợt 3 sau khi sửa lỗi cốt lõi ở đợt 1. Không bật autosave trong đợt đầu; cần giải quyết revision, retry, conflict và nội dung đang sửa trước.

**Làm được ở frontend với dữ liệu hiện tại:** đổi nhãn/layout, giảm form lặp, trạng thái lưu, bảo vệ điều hướng, live preview, chọn đúng entity bằng URL, xử lý quiz null, dialog/picker, responsive và hiển thị media đúng loại.

**Cần đối chiếu/bổ sung contract:** KPI tổng và hàng đợi công việc; lỗi validate có entityId/fieldPath đáng tin cậy; upload audio/processing/progress; asset usage/retention; mẫu số analytics; quy ước canvas với Mobile. Nếu chưa có, giữ trải nghiệm hiện tại với nhãn đúng phạm vi hoặc ẩn tính năng mở rộng.

**Chưa đưa vào đợt này:** cộng tác thời gian thực, workflow duyệt nội dung mới, lịch xuất bản, xuất bản hàng loạt, version diff/rollback, AI sinh nội dung, xóa asset tham chiếu. Đây là mở rộng nghiệp vụ cần thiết kế riêng.

## 7. Tiêu chí nghiệm thu toàn luồng

- Viewport kiểm tra: 1440×900, 1366×768, 1024×768, 768×1024 và 390×844. Không cuộn ngang toàn trang; editor nhỏ chuyển vùng Trang/Nội dung/Thuộc tính thay vì ép ba cột.
- Thanh sticky không che field đang focus hoặc lỗi. Tên truyện dài, nhiều trang, không có bìa và ảnh lỗi đều có layout ổn định.
- Bàn phím hoàn thành được luồng chính, reorder có phương án ngoài kéo; focus visible; dialog trả focus; trạng thái được đọc bằng live region vừa đủ.
- Kiểm tra cặp màu đạt mục tiêu tương phản 4.5:1 cho chữ thường, 3:1 cho chữ lớn; trạng thái không chỉ biểu đạt bằng màu.
- Tạo truyện → thêm trang → thêm vai/vị trí → từ vựng → câu hỏi → xem trước → xuất bản → sửa nháp → xuất bản lại. Snapshot cũ không đổi.
- Test lỗi save/upload/preview/publish và 409; Back/menu/đổi tab/đổi trang/đóng form khi dirty; pending không tạo mutation xung đột.
- Regression tập trung vào `tests/content-save-state.spec.js`, `tests/content-contract.spec.js` và các suite editor hiện có. Bổ sung test đúng hành vi mới và lỗi quiz null; chạy lint/build khi triển khai code.
- Đo usability bằng tác vụ: tìm và mở một truyện; sửa lỗi xuất bản; thêm vai vào trang; xác định bản nào trẻ sẽ nhìn thấy. Ghi baseline trước rồi so sánh sau, không công bố phần trăm cải thiện khi chưa đo.
- Tách bằng chứng: hoàn thiện UI trên mock, tích hợp API thật, xác minh với Mobile/staging. Hoàn tất một mức không tự chứng minh hai mức còn lại.

## 8. Điểm bắt đầu đề xuất

Làm đợt 0–1 trước, sau đó xây khung Content chung và tối ưu Kho truyện → Tạo/Thông tin → Trang truyện. Đây là luồng sử dụng nền tảng, đồng thời tạo component tái sử dụng cho các trang còn lại. Chỉ cần wireframe riêng cho khung editor, trang biên tập và preview trước khi thay đổi layout lớn; các màn danh sách/form dùng cùng quy tắc đã thống nhất.
