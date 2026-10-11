# Story editor — Đặc tả UI/UX và tiêu chí nghiệm thu

Ngày: 12/10/2026. Trạng thái: đặc tả đề xuất triển khai; chưa có nghiệm thu giao diện chạy thật.

Tài liệu chi tiết cho [kế hoạch Canva + animation](STORY_EDITOR_CANVA_ANIMATION_PLAN.md). Khi khác nhau về tương tác editor, dùng tài liệu này; yêu cầu nghiệp vụ/quyền/API vẫn theo contract hiện có. Các chức năng và thông số dưới đây là mục tiêu, không phải mô tả những gì code đã hỗ trợ.

## 1. Kết quả cần đạt

Content Manager có thể dựng một trang truyện, đặt nhân vật, tạo keyframe, tự vẽ đường đi, ghép audio, xem thử và lưu trong một workspace. Animation là công cụ chính. Đầu ra là truyện đọc tương tác trên web.

Định nghĩa chất lượng: không còn lỗi UI đã biết trong các luồng và môi trường nghiệm thu được liệt kê ở mục 19–21. Tài liệu không thay thế kiểm thử thực tế và không bảo đảm không có lỗi trên mọi thiết bị.

Giữ React/CSS, Nunito, Phosphor và nhận diện SketchTale hiện có. Tham khảo cách tổ chức Canva, không sao chép toàn bộ màu sắc hay đưa các chức năng trình chiếu không liên quan vào editor.

### Phạm vi hoàn thành chính

- Workspace, thư viện tại chỗ, bố cục cảnh, timeline, preset, keyframe và đường tự vẽ.
- Resize/rotate nhân vật, zoom/fit và nhập số chính xác nằm trong phạm vi chính vì cần cho authoring keyframe; không trì hoãn các thao tác này sang P1.
- Đồng bộ audio, Undo/Redo, lưu toàn editor, đọc thử từ draft và kiểm tra bản đã lưu.
- Nhân vật là đối tượng animation đầu tiên. Văn bản nội dung trang vẫn sửa được; text object tự do có animation riêng là phần mở rộng, chưa mặc định đã được người dùng yêu cầu.
- Preset không thay thế keyframe/đường tự vẽ. Không tính các nút demo hoặc UI chưa lưu được là hoàn thành.

## 2. Kiến trúc màn hình và ngân sách không gian

Editor dùng toàn vùng nội dung trình duyệt, bỏ giới hạn max-width của dashboard và thu sidebar quản trị ra khỏi workspace. Nút về Kho truyện và menu quản lý truyện thay thế điều hướng bị thu gọn. Không áp thay đổi này lên các trang quản trị khác.

| Vùng | Kích thước mục tiêu tại zoom 100% | Quy tắc |
| --- | --- | --- |
| Topbar | min-height 56 px | Một hàng trên desktop; tên co trước, hành động chính giữ chỗ |
| Tool rail | 64 px | Icon + nhãn; Chuyển động luôn có tên, không giấu trong menu |
| Context panel | 288 px; tùy chỉnh 264–340 px | Chỉ một panel; header cố định, nội dung cuộn, footer có chỗ riêng |
| Canvas toolbar | min-height 44 px | Overflow có menu khi hẹp; không đẩy canvas qua lại khi đổi selection |
| Canvas viewport | Phần không gian còn lại | Có khoảng đệm 24 px desktop/16 px compact; stage giữ tỷ lệ |
| Page filmstrip | 72 px; thu gọn 32 px | Cuộn ngang riêng, trang chọn được đưa vào vùng nhìn thấy |
| Timeline | 208 px mặc định; thu gọn 44 px | Chiều cao kéo được, không để viewport canvas thấp hơn 240 px khi đủ màn hình |
| Timeline label column | 184 px; compact 144 px | Cố định khi cuộn thời gian; không dùng chiều rộng panel trái làm chiều rộng nhãn |

Ở 1366×768, ngân sách chiều cao mặc định: 56 topbar + 44 toolbar + 388 canvas viewport + 72 filmstrip + 208 timeline. Trong viewport 388 px, trừ padding còn tối đa 340 px chiều cao stage. Đây là giả định thiết kế cần xác nhận bằng render, không phải kích thước ảnh screenshot đã kiểm chứng.

Timeline nằm toàn chiều rộng dưới vùng làm việc; rail/panel kết thúc phía trên timeline. Không để hàng timeline và canvas có hai thanh điều khiển Play riêng gây nhầm.

### Responsive theo kích thước khả dụng

| Điều kiện | Cách bố trí |
| --- | --- |
| Rộng ≥1280 và cao ≥720 px | Layout đầy đủ như trên |
| Rộng 1024–1279 px | Panel 264 px; title ngắn; action phụ vào menu; filmstrip có thể thu |
| Rộng 768–1023 px | Panel đóng mặc định, mở overlay theo yêu cầu; có nền che và đóng rõ; chỉ thao tác panel hoặc canvas mỗi lần |
| Rộng <768 px | Chế độ đọc thử và xem thông tin; thông báo rõ chỉnh timeline cần màn hình rộng hơn, không render editor desktop bị cắt |
| Cao <720 px | Filmstrip thu gọn mặc định, timeline 160 px; cho chuyển giữa “Ưu tiên cảnh” và “Ưu tiên timeline” |
| Cao <560 px | Chỉ một vùng chính tại một thời điểm; control và thông báo cuộn tiếp cận được, không khóa màn hình |

Browser zoom làm giảm vùng CSS khả dụng thì áp dụng layout compact tương ứng. Không dùng min-width toàn trang để gây tràn ngang. Canvas và timeline được phép cuộn nội bộ theo nhiệm vụ.

## 3. Hệ thống thị giác và component

| Thành phần | Đặc tả |
| --- | --- |
| Font | Nunito hiện có; body/control 14 px, label 13 px, tiêu đề panel 16 px; metadata 12 px; line-height 1.4–1.5 |
| Số thời gian | Tabular numerals; chừa chiều rộng để số thay đổi không làm nhảy control |
| Spacing | Dùng thang 4/8/12/16/24/32 px; form gap 12, nhóm gap 20–24 |
| Surface | Giữ `--cm-surface`, `--cm-surface-subtle`, `--cm-border`; stage tách nền workspace rõ |
| Accent | Giữ vàng `--cm-accent` với chữ tối; viền chọn dùng `--cm-selected-border`; không dùng vàng nhạt làm chữ nhỏ trên nền trắng |
| Radius | Control 8 px; panel/card preview 10 px; không bọc mọi nhóm trong nhiều lớp card |
| Icon | Một hệ Phosphor; 18–20 px cho control, 24 px rail; không trộn weight tùy tiện |
| Button/input | Control thông thường min-height 40 px; rail/touch 44 px; target icon desktop tối thiểu 32×32 px |
| Focus | Viền rõ 2 px và offset 2 px; không chỉ đổi màu nền; không bị overflow cắt |
| Shadow | Dành cho popover/dialog; các panel chia bằng border, không đổ bóng nặng |

Độ tương phản mục tiêu nội bộ: chữ thông thường ≥4.5:1, thành phần điều khiển/viền focus quan trọng ≥3:1. Phải đo tổ hợp màu thực tế trước nghiệm thu; đây không phải tuyên bố đã chứng nhận tiêu chuẩn.

Mỗi control phải có normal, hover, focus-visible, pressed, selected nếu có, disabled và pending nếu có. Disabled có lý do đọc được bên cạnh hoặc qua mô tả, không phụ thuộc tooltip của phần tử không focus được. Pending giữ nguyên chiều rộng nút, ngăn gửi trùng.

Nhãn tiếng Việt có dấu và tên dài không được làm control cắt dòng mất chữ. Cho phép tiêu đề panel hai dòng; tên trong list có ellipsis + cách xem đầy đủ bằng focus/tooltip. Lỗi, giá trị input và hành động chính không được ellipsis.

## 4. Topbar, điều hướng và trạng thái lưu

Thứ tự: về Kho truyện → tên truyện/menu phần khác → trạng thái lưu → Undo/Redo → Lưu → Xem thử → Xuất bản. Ẩn truyện và hành động phụ đặt trong menu; không đặt sát nút phát.

- Click tên truyện mở sửa tên inline; Enter lưu vào draft, Escape hủy sửa, blur không gửi request riêng. Rỗng/giới hạn ký tự theo contract hiển thị cạnh trường.
- Một trạng thái lưu tổng cho mọi trang/slot/animation/audio, không mỗi form nói “Đã lưu” trong khi vùng khác còn dirty.
- “Lưu” lưu mọi draft đang giữ trong editor; Ctrl/Cmd+S gọi cùng hành động. Chỉnh sửa trong lúc request chạy vẫn được giữ và tiếp tục báo chưa lưu nếu mới hơn snapshot gửi đi.
- “Xem thử” mở preview draft hiện tại, không ngầm lưu hoặc publish; gắn nhãn “Bản đang chỉnh — chưa lưu” khi cần. Lối kiểm tra bản lưu hiện có được ghi “Xem bản đã lưu”.
- “Xuất bản” thực hiện lưu → kiểm tra revision vừa lưu → xác nhận snapshot → publish. Bất kỳ bước lỗi dừng luồng và chỉ đúng chỗ cần sửa; không xuất bản revision cũ.
- Chuyển trang trong cùng editor giữ draft, không hỏi bỏ thay đổi. Rời editor khi dirty có “Lưu và rời / Rời mà không lưu / Ở lại”; lỗi lưu giữ người dùng ở editor. Đóng tab dùng cơ chế cảnh báo trình duyệt.
- Các tab Thông tin/Nhân vật/Học liệu bên ngoài vùng dựng cảnh vẫn đi qua cùng guard nếu draft chưa được chia sẻ giữa route.

| State | Copy hiển thị | Hành động |
| --- | --- | --- |
| Clean | Đã lưu lúc 14:32 | Lưu disabled, vẫn có xem thử |
| Dirty | Có thay đổi chưa lưu | Lưu enabled |
| Saving | Đang lưu… | Ngăn save trùng; vẫn sửa được nếu local draft được version hóa |
| Failed | Chưa lưu được thay đổi | Thử lại; chi tiết lỗi không làm header tăng chiều cao |
| Offline | Mất kết nối · thay đổi chưa được lưu lên máy chủ | Giữ draft; không giả vờ đã lưu |
| Conflict | Có phiên bản mới hơn trên máy chủ | Giữ bản đang chỉnh; mở luồng so sánh/khôi phục, không ghi đè mù |

Autosave chưa là điều kiện P0. Nếu chưa có local recovery, không hứa dữ liệu tồn tại sau đóng tab. Khi bổ sung recovery phải tách rõ “Đã lưu trên máy” và “Đã lưu lên máy chủ”.

## 5. Rail và panel theo ngữ cảnh

Rail: Nền, Nhân vật, Nội dung, Âm thanh, Chuyển động, Lớp. “Nội dung” sửa text hiện có; chưa gọi là công cụ text tự do khi chưa hỗ trợ.

- Mở panel không đổi selection hoặc playhead. Bấm lại công cụ đang mở thì thu panel; trạng thái cuộn/tìm kiếm của từng panel được nhớ trong phiên.
- Panel Chuyển động có breadcrumb tên trang/nhân vật và ba tab: Hiệu ứng, Keyframe, Đường đi. Giữ tab khi đổi nhân vật.
- Chọn clip đưa panel tới đúng loại clip. Chọn keyframe mở dòng thuộc tính và thông số mốc, không đóng timeline.
- Khi xóa selection, panel vẫn tồn tại với hướng dẫn “Chọn nhân vật trên cảnh hoặc trong danh sách Lớp”. Không tự áp thao tác lên cả trang.
- Nội dung panel cuộn độc lập; footer không dùng position overlay đè trường cuối. Lỗi hiển thị trong nhóm liên quan, không đẩy footer ngoài vùng nhìn thấy.

## 6. Selection, canvas và chỉnh bố cục

Selection có một nguồn state: pageId, objectIds, clipIds, keyframeIds và loại selection đang hoạt động. Canvas, panel, layers và timeline đều đọc cùng state; không mỗi vùng giữ một đối tượng khác.

| Thao tác | Kết quả và ràng buộc |
| --- | --- |
| Click nhân vật | Chọn, hiện box/tay nắm; không tự kéo hoặc phát |
| Click nền trống | Bỏ selection đối tượng; giữ panel đang mở |
| Click track label | Chọn nhân vật, không di chuyển playhead |
| Click clip | Chọn clip, giữ thời gian hiện tại; có nút “Đến đầu clip” riêng |
| Click keyframe | Chọn mốc và đưa playhead đến mốc đó |
| Shift+click đối tượng/mốc | Thêm/bớt selection cùng loại; không gom clip và keyframe thành selection hỗn hợp |
| Kéo đối tượng | Chỉ bắt đầu sau ngưỡng 4 CSS px; giữ khoảng lệch con trỏ lúc bắt đầu, không nhảy tâm về chuột |
| Escape trong gesture | Hủy gesture, trả về snapshot trước kéo; không hủy các sửa trước đó |
| Escape ngoài gesture | Đóng overlay trên cùng, sau đó thoát công cụ, sau đó bỏ selection; mỗi lần chỉ một cấp |

Resize mặc định giữ tỷ lệ ảnh nhân vật; không làm méo ảnh. Xoay có snap góc và nút tắt snap; nhập số luôn khả dụng. Box xoay theo đối tượng nhưng tay nắm giữ kích thước CSS, không nhỏ theo zoom. Đối tượng rất nhỏ chọn được qua Lớp.

Khóa trong Lớp ngăn di chuyển/chỉnh, không thay hình khi đọc. “Ẩn khi biên tập” chỉ ẩn tạm trong editor và gắn nhãn rõ; opacity/keyframe mới điều khiển xuất hiện trong truyện. Không để biểu tượng mắt âm thầm làm mất nhân vật bản xuất bản.

Zoom mặc định Fit, hỗ trợ 25–200% ban đầu; zoom xoay quanh con trỏ hoặc tâm viewport nếu dùng control. Space+kéo pan chỉ bắt đầu khi pointer xuống trên canvas; Space đơn khi focus ở vùng playback dùng để phát. Không chặn cuộn trang/control khi con trỏ ngoài canvas. Fit tính lại khi panel đổi; zoom thủ công được giữ, có nút Fit luôn thấy.

Stage giữ tỷ lệ 16:9 hiện tại trừ khi contract thay đổi rõ. Không crop nhân vật để ép thumbnail. Selection/đường đi nằm ở overlay editor, không ghi vào snapshot đọc. Đối tượng ngoài stage có thể tìm qua Lớp và lệnh “Đưa vào giữa”; viewport cho pan để chỉnh cảnh đi vào/ra màn hình.

## 7. Hai chế độ sửa phải phân biệt rõ

| Chế độ | Nội dung hiển thị | Khi kéo/nhập thông số |
| --- | --- | --- |
| Bố cục gốc | Nhãn “Đang sửa bố cục gốc”; về cảnh gốc và tạm giữ thời gian animation trước đó | Sửa base transform, không tạo keyframe |
| Animation | Nhãn “Đang sửa chuyển động · 1,20 s”; khôi phục playhead trước đó | Sửa mốc đã chọn hoặc tạo mốc khi Ghi keyframe bật |

Trong Animation, nếu Ghi keyframe tắt và không chọn mốc của thuộc tính, drag chỉnh thuộc tính bị chặn với hướng dẫn “Bật Ghi keyframe hoặc chọn một mốc để chỉnh”. Không cho âm thầm sửa base tại cảnh đang nội suy.

Vị trí/scale/rotation keyframe biểu diễn độ lệch so với base; đổi bố cục gốc dịch cả chuyển động tương ứng. Opacity là giá trị tuyệt đối 0–100%. UI hiển thị giá trị cảnh dễ hiểu; việc quy đổi nằm trong model. Đường đi cùng hệ tọa độ tương đối base; chỉnh base không để đường nằm lại chỗ cũ.

Bật/tắt Ghi keyframe là trạng thái công cụ, không phải chỉnh tài liệu; chuyển nhân vật giữ chế độ nhưng hiển thị rõ đích. Chuyển trang tắt Ghi keyframe để tránh tạo mốc nhầm trang, thông báo nhẹ nếu cần. Bắt đầu chỉnh khi đang phát phải pause trước ở thời gian hiện tại.

## 8. Preset và xung đột animation

- Grid preset hai cột trong panel, tên dưới preview; chọn preset chưa áp vào tài liệu. Có “Xem thử hiệu ứng” trên thumbnail riêng, không thay đổi cảnh đã lưu.
- Nút “Thêm hiệu ứng” tạo clip ở playhead với thời lượng mặc định hiển thị trước; một lần bấm là một undo.
- Hiện đúng tham số của hiệu ứng: hướng/quãng đường cho move; độ cao cho jump; góc cho spin; không để control vô tác dụng.
- Preset được mô tả bằng các thuộc tính nó điều khiển. Xung đột kiểm tra từng thuộc tính; vị trí và xoay chạy cùng lúc được, hai nguồn vị trí chồng thời gian không được.
- Thả clip vào vùng xung đột hiển thị ghost đỏ có giải thích; thả ra không commit và trở lại vị trí cũ. Cho nhập thời gian khác; không tự đẩy các clip sau mà không báo.
- “Chuyển thành keyframe” tạo các mốc tương đương và thay clip trong một transaction có undo. Preset chưa chuyển chính xác được thì chưa cung cấp hành động này.
- Clip liền nhau có boundary chung được phép; tại boundary clip sau sở hữu giá trị. Nếu giá trị đầu clip sau khác cuối clip trước, cảnh có bước nhảy: đánh dấu cảnh báo và cung cấp “Khớp điểm đầu”, không tự sửa ý đồ.

## 9. Timeline đến cấp thao tác

Timeline gồm transport, ruler, track labels cố định và vùng thời gian cuộn. Ruler và clip dùng cùng scale/scroll position. Zoom timeline độc lập zoom canvas.

| Cử chỉ | Hành vi |
| --- | --- |
| Click/kéo ruler | Đặt/tua playhead; khi đang phát thì pause; thả xong vẫn pause |
| Kéo thân clip | Đổi start; duration và thời gian tương đối của mốc không đổi |
| Kéo mép clip animation | Giữ mép đối diện, co giãn mốc theo tỷ lệ; hiện start/end/duration trong tooltip |
| Kéo mép audio | Trim, không tăng tốc hay làm chậm file |
| Kéo vùng trống trong track mở rộng | Tạo vùng chọn mốc; không di chuyển playhead |
| Wheel | Cuộn dọc tracks; Shift+wheel cuộn ngang thời gian |
| Nút zoom timeline | Giữ playhead tại vị trí nhìn thấy; có “Vừa trang” |

- Snap mặc định 0,1 s và các biên clip/playhead; chọn vị trí snap gần nhất trong 6 CSS px, không snap nhảy xa khi zoom. Có toggle Snap và phím Alt tạm tắt; thông tin này có trong trợ giúp.
- Time input bước 0,01 s. Dữ liệu ms, hiển thị giây; nhận dấu phẩy hoặc chấm thập phân, format thống nhất khi commit. Giá trị đang nhập rỗng/dấu trừ không được ép thành 0 giữa chừng.
- Clip ngắn vẫn giữ chiều rộng thời gian thật. Khi không đủ chỗ cho hai tay nắm, chỉnh duration trong panel hoặc zoom; không tăng width giả làm sai ruler. Keyframe trùng pixel dùng danh sách mốc hoặc zoom, không chọn ngẫu nhiên.
- Track label 40 px, property row 32 px; mốc kim cương 10 px với vùng bắt 24 px nếu không chồng nhau. Tên clip ẩn khi không đủ chỗ, tooltip/focus vẫn đọc được.
- Playhead có line, đầu kéo và thời gian; con trỏ trên clip ưu tiên clip, không bị line trong suốt bắt pointer toàn timeline.
- Auto-scroll gần mép chỉ trong gesture kéo; có tốc độ giới hạn, Escape hủy. Pointer release ngoài vùng vẫn kết thúc đúng nhờ capture; pointer cancel trả snapshot trước gesture.
- Không cho start âm. Clip kéo vượt cuối trang tạo bản xem trước tăng duration; commit tăng duration trong cùng undo. Nhập rút duration trang ngắn hơn nội dung bị chặn kèm danh sách clip vượt giới hạn.
- Reorder track nhân vật đồng bộ thứ tự lớp nếu thao tác ghi “Đổi lớp”; đổi thứ tự nhìn timeline đơn thuần không đổi z-index. Hai hành động có tên riêng.

## 10. Keyframe editor

- Mở track nhân vật thấy Vị trí, Kích thước, Góc xoay, Độ trong suốt. Chỉ hiện thuộc tính có mốc theo mặc định, nút “Thêm thuộc tính” mở phần còn lại.
- Nút kim cương cạnh trường: rỗng = chưa có mốc tại playhead, đặc = có mốc. Có nhãn đọc được “Thêm mốc vị trí tại 1,20 giây”, không chỉ dùng màu.
- Lần ghi đầu trong clip ở t>0 tự thêm mốc đầu t=0 từ giá trị đầu hiện tại và mốc đang ghi; thông báo số mốc tạo. Lần ghi tại t=0 tạo một mốc và giữ giá trị đó cho đến khi có mốc tiếp theo.
- Mốc mới cùng thời điểm và cùng thuộc tính cập nhật mốc cũ, không tạo hai mốc. Kéo nhóm mốc vào collision bị chặn, không tự gộp/xóa.
- Kéo nhóm giữ khoảng cách; cả nhóm bị giới hạn bởi đầu/cuối clip. Sao chép/dán mốc đặt mốc sớm nhất tại playhead, giữ các khoảng cách còn lại; báo nếu vượt clip hoặc sai thuộc tính.
- Nội suy số/vector giữa mốc. Góc xoay cho nhập >360° để quay nhiều vòng; không tự đổi 360 thành 0. Scale đồng nhất để giữ tỷ lệ nhân vật; opacity giới hạn 0–100%.
- Easing là của đoạn từ mốc đang chọn tới mốc kế: Đều / Nhanh dần / Chậm dần / Nhanh rồi chậm. Mốc cuối không có control easing hoạt động; không hiển thị điều chỉnh không tác dụng.
- Xóa tất cả mốc của một thuộc tính trả về base; preview trước khi xác nhận thao tác xóa nhóm lớn, có undo. Xóa mốc cuối cùng có copy “Thuộc tính sẽ dùng giá trị bố cục gốc”.
- Chưa cần trình sửa đồ thị easing tùy ý để hoàn thành keyframe cơ bản nâng cao; tránh để control đường cong chưa hoạt động.

## 11. Công cụ vẽ và sửa đường đi

Luồng: chọn nhân vật → Đường đi → Vẽ tự do/Đặt điểm → chỉnh → đặt thời lượng → Áp dụng. Trước Áp dụng là bản tạm, nút Hủy khôi phục; đổi trang/công cụ khi đang có đường tạm hỏi Áp dụng/Hủy/Ở lại.

- Điểm bắt đầu mặc định tại pivot nhân vật ở đầu clip; marker “Bắt đầu” và “Kết thúc” phân biệt bằng hình/nhãn. Không nhảy nhân vật về vị trí con trỏ khi bắt đầu vẽ.
- Vẽ tự do: pointer down tại marker đầu, kéo tạo nét; sau thả làm mượt có mức điều chỉnh. Giữ đường thô cho đến Áp dụng để người dùng so sánh và hoàn tác mức làm mượt.
- Đặt điểm: click thêm điểm, Enter hoàn tất, Escape hủy nét chưa commit; double click hoàn tất nhưng không tạo hai điểm trùng. Sau khi hoàn tất có thể kéo điểm và tay nắm.
- Chọn điểm để sửa; Delete trong chế độ sửa đường chỉ xóa điểm, không xóa nhân vật. Tối thiểu hai điểm phân biệt; nếu còn ít hơn thì báo đường chưa hợp lệ và disable Áp dụng có lý do.
- Có “Thêm điểm”, “Xóa điểm”, “Làm thẳng đoạn”, “Đảo chiều” và nhập tọa độ điểm cho người không kéo chuột được. Không bắt người dùng nhập thuật ngữ kỹ thuật của đường cong.
- Đảo chiều đổi điểm đầu/cuối và vị trí bắt đầu clip; hiển thị ghost trước khi áp dụng để thấy tác động tới hoạt động trước. Không tự sửa base.
- Hướng theo đường đi mặc định tắt. Nếu bật, đường sở hữu cả position và rotation; kiểm tra xung đột track xoay. Góc offset cho nhân vật quay mặt đúng hướng, flip gốc không tự thay đổi.
- Easing điều khiển tiến độ theo chiều dài đường; linear phải cho tốc độ gần đều dọc đường. Làm mượt không đổi duration hoặc thời điểm audio.
- Khi điểm ra ngoài stage, path vẫn sửa qua pan; có viền stage và chú thích “Ngoài vùng đọc”. Không tự clamp toàn đường về biên.
- Đường, điểm và handles không có trong preview đọc. Hit area handles giữ theo CSS px ở mọi mức zoom; không cản chọn nhân vật sau khi thoát chế độ đường.

## 12. Âm thanh và playback

- Thư viện audio nghe thử độc lập, tối đa một preview asset tại một thời điểm. Bắt đầu phát trang dừng nghe thử asset.
- Thêm audio tạo clip với tên, loại (Lời kể/Nhạc nền/Hiệu ứng), thời điểm, trim và volume. Nút mute track là chỉnh bản nghe tạm hay tài liệu phải ghi rõ; dùng “Tắt tiếng khi xem thử” cho trạng thái cục bộ.
- Waveform là tiện ích, không là điều kiện tải xong để chỉnh start/trim. Khi chưa có waveform hiển thị skeleton đúng chiều cao, không giả vẽ waveform sai dữ liệu.
- Trim không vượt thời lượng file; trimEnd>trimStart. Thay file có duration ngắn hơn báo cần điều chỉnh trim, không cắt âm thanh ngầm.
- Play/Pause giữ playhead; Replay về 0 rồi phát; tới cuối dừng ở cảnh cuối. Nhãn và icon đổi cùng lúc; một lần bấm không tạo hai phiên audio.
- Scrub mặc định không phát các đoạn âm thanh rời; sau Play audio seek đúng playhead. Khi thiếu audio đang cần, pause clock và hiển thị “Đang tải âm thanh”, không để hình chạy bỏ tiếng.
- Audio lỗi: có Thử lại hoặc “Phát thử không có âm thanh này”; lựa chọn bỏ qua chỉ áp dụng phiên preview và có banner, không biến lỗi thành hợp lệ để publish.
- Chuyển tab trình duyệt ra nền: tạm dừng cả hình/tiếng; quay lại không tự phát bất ngờ. Chuyển trang truyện hủy audio, timer và trạng thái buffering cũ.
- Đồng hồ phát không cập nhật React document state mỗi frame; pan/zoom/selection không làm seek hay dirty tài liệu.

## 13. Trang, tư liệu và lớp

- Filmstrip có số, thumbnail, duration và chỉ báo lỗi/dirty; “Thêm trang” luôn truy cập được cuối dải và qua menu.
- Chọn trang giữ draft các trang khác, reset playback về 0, chọn canvas thay vì giữ slot thuộc trang trước. Nhớ scroll/zoom timeline từng trang trong phiên.
- Reorder có drag và nút Trước/Sau. Xóa trang đang chọn chọn trang kế tiếp, nếu không còn thì trang trước; xóa trang cuối vào empty state có “Thêm trang”.
- Xóa trang có dialog liệt kê nhân vật/clip/audio/học liệu ảnh hưởng; không hiện số giả. Nhân bản phải remap IDs nếu được triển khai, nếu chưa thì không hiện nút hoạt động.
- Thư viện ảnh theo Nền/Nhân vật/Tư thế; file lỗi đang xử lý không chọn được và có lý do. Upload hiển thị từng file, tiến độ nếu biết, Thử lại nếu thất bại.
- Đổi ảnh tư thế giữ pivot và tỷ lệ nhất quán; ảnh có kích thước khác hiển thị preview trước áp dụng. Gỡ đối tượng khỏi trang khác với xóa file dùng chung.
- Loading/query lỗi không xóa canvas draft đang có. Kết quả tìm kiếm đến trễ không ghi đè query mới; selection bằng ID ổn định, không dựa index list.

## 14. Undo/Redo và nhập liệu an toàn

- Undo/Redo bao phủ object, clip, keyframe, path và audio draft. Zoom, selection, playhead, mở panel không đi vào lịch sử tài liệu.
- Một gesture kéo, một đường áp dụng, một nhóm xóa hoặc một lần resize clip = một transaction. Gõ liên tiếp cùng field gộp đến blur/Enter; Escape trả giá trị trước phiên sửa field.
- Undo khi đang phát pause trước, restore snapshot và chọn entity còn tồn tại gần nhất; không để panel tham chiếu entity đã mất. Edit mới sau undo xóa nhánh redo.
- Lưu thành công không làm undo mất hiệu lực; undo sau save tạo dirty draft mới. Việc xóa entity đã gửi API không hứa undo nếu chưa có thao tác phục hồi thật; phải hoàn thành contract phục hồi hoặc thực hiện delete trong draft trước lưu.
- Input numeric giữ text tạm, validate khi commit. Không gọi API với NaN/Infinity; min/max từ model, giải thích sát trường. Browser wheel không đổi giá trị input số khi chỉ đang cuộn panel.
- Hiện đơn vị ngoài vùng gõ; chọn toàn giá trị bằng bàn phím không copy nhầm “giây/%”. Lỗi không tự kéo focus khỏi trường khác sau mỗi keystroke.

## 15. Overlay, bàn phím và focus

Thứ tự lớp rõ: stage → selection/handles → sticky toolbar → popover → dialog backdrop → dialog → thông báo. Tooltip không xuất hiện trên dialog không liên quan. Popup neo control và tự đổi hướng khi sát cạnh viewport; không bị panel overflow cắt.

Dialog giữ focus trong vùng, Escape đóng khi hành động cho phép, trả focus về nút mở hoặc entity thay thế còn tồn tại. Click ngoài không đóng dialog có draft chưa áp dụng. Menu đóng khi chọn action, trả focus đúng chỗ.

| Phím | Hành vi trong editor |
| --- | --- |
| Ctrl/Cmd+S | Lưu toàn editor |
| Ctrl/Cmd+Z; Ctrl/Cmd+Shift+Z | Undo/Redo tài liệu khi không đang sửa text; input giữ native undo |
| Delete/Backspace | Xóa selection theo vùng focus; trong field chỉ xóa ký tự |
| Mũi tên | Canvas dịch đối tượng 1 đơn vị thiết kế; Shift 10; timeline dịch mốc/clip theo bước 0,01 s, Shift 0,1 s |
| Space | Play/Pause khi focus ở timeline/playback; input/nút giữ hành vi native; canvas dùng Space+kéo pan |
| Escape | Hủy gesture hoặc đóng tầng tương tác gần nhất |

Phím tắt không chạy khi IME đang composition, khi dialog khác đang mở hoặc khi focus không thuộc editor. Có menu “Phím tắt”, tooltip kèm tên action. Tab order theo topbar → rail → panel → canvas controls/layers → filmstrip → timeline. Timeline có điều hướng nội bộ bằng phím, không bắt Tab qua hàng trăm mốc; danh sách mốc dạng form là lựa chọn thay thế.

Thông báo lưu dùng vùng live nhẹ; lỗi quan trọng được thông báo một lần. Không đọc playhead mỗi frame cho screen reader. Trạng thái chọn/khóa/lỗi không truyền đạt chỉ bằng màu.

## 16. Đọc thử và đọc web

Preview draft mở trong vùng riêng có “Quay lại chỉnh sửa”; đóng preview trả đúng trang/selection/zoom/playhead editor. Không làm mất draft. Có lựa chọn khung desktop/mobile để kiểm tra nội dung, không thay kích thước thiết kế tài liệu.

Trang đọc: Bắt đầu đọc → chạy animation/audio trang → giữ cảnh cuối → người đọc chọn trang tiếp. Quay lại trang chạy từ đầu theo chính sách hiện tại; không lưu progress ngầm vào tài liệu authoring. Play/Pause/Replay và bật/tắt tiếng có nhãn, đủ target trên mobile.

Mở từ vựng/câu hỏi pause nội dung; đóng quay về vẫn pause để không làm người đọc bỏ lỡ lời kể. Overlay học liệu không che nút đóng hoặc nút trả lời. Không hiển thị đáp án trước thao tác trả lời trong chế độ đọc.

Tùy chọn giảm chuyển động nội dung hiển thị cảnh tĩnh đại diện, giữ text/học liệu và audio điều khiển được. Cần fixture kiểm tra nhân vật không bị giữ opacity 0 do chỉ tắt CSS animation. UI editor giảm transition theo sở thích hệ thống mà không thay đổi animation do tác giả tạo.

## 17. Ma trận trạng thái bắt buộc

| Tình huống | UI cần hiển thị | Không được xảy ra |
| --- | --- | --- |
| Editor đang tải | Skeleton theo khung, trạng thái tải | Chớp form trống rồi ghi đè draft |
| Không có trang | Hướng dẫn và Tạo trang | Canvas trống không đường tiếp tục |
| Chưa có nhân vật | Thêm nhân vật ngay trong editor | Bắt sang route khác mất draft |
| Không chọn đối tượng | Hướng dẫn lựa chọn | Panel còn dữ liệu nhân vật cũ |
| Không có clip/mốc | Hành động thêm phù hợp | Timeline trắng không lời giải thích |
| Tìm kiếm rỗng | Không có kết quả + Xóa bộ lọc | Nhầm với kho tư liệu trống |
| Asset thiếu/lỗi | Placeholder có tên và chọn thay thế | Ảnh fallback che vấn đề contract |
| Clip xung đột | Highlight vùng và lý do | Ghi đè chuyển động âm thầm |
| Field sai | Lỗi sát field, giữ giá trị đang sửa | Alert rời rạc, reset toàn form |
| Request lỗi | Retry, giữ draft và vị trí cuộn | Báo thành công hoặc chuyển trang |
| Revision conflict | Giữ local snapshot, đọc bản mới riêng | Retry lặp ghi đè server |
| Quyền sửa hết hạn | Dừng mutation, giữ draft trong phiên, hướng dẫn đăng nhập lại | Tiếp tục báo đã lưu |
| Publish lỗi | Danh sách lỗi có link tới đúng trang/entity/field | Focus vào title truyện cho mọi lỗi title |

## 18. Danh mục màn hình cần thiết kế trước coding

Mỗi màn hình cần wireframe rồi bản thiết kế có kích thước và trạng thái, không chỉ một ảnh tổng quát thu nhỏ.

| ID | Màn hình/trạng thái | Nội dung phải nhìn rõ |
| --- | --- | --- |
| UX-01 | Editor trang có nội dung | Topbar, stage, filmstrip, timeline đúng ngân sách |
| UX-02 | Nhân vật được chọn | Handles, toolbar, panel và track cùng selection |
| UX-03 | Thư viện preset | Preview, params, thêm hiệu ứng, empty/disabled |
| UX-04 | Keyframe nhiều thuộc tính | Mốc, playhead, Ghi keyframe, easing, xung đột |
| UX-05 | Vẽ đường tạm | Điểm đầu/cuối, Áp dụng/Hủy, chỉ dẫn |
| UX-06 | Chỉnh đường đã tạo | Điểm/tay nắm, duration, hướng, ngoài stage |
| UX-07 | Audio và playback | Trim, volume, buffering/lỗi, đồng bộ |
| UX-08 | Save/error/conflict | Topbar và hành động phục hồi, không thay layout |
| UX-09 | Trang/tư liệu | Loading, không có dữ liệu, upload lỗi, xóa phụ thuộc |
| UX-10 | Preview đọc desktop/mobile | Playback, học liệu, trở lại editor |
| UX-11 | Laptop thấp/compact/zoom 200% | Panel và controls vẫn tiếp cận được |
| UX-12 | Keyboard-only | Focus, menu/dialog và sửa mốc bằng input |

## 19. Checklist chống lỗi UI nhỏ

Mỗi dòng có kết quả Pass/Fail, ảnh hoặc bước tái hiện. Không đánh dấu Pass từ code review đơn thuần đối với tiêu chí thị giác.

| ID | Kiểm tra | Điều kiện đạt |
| --- | --- | --- |
| UI-01 | Chiều rộng editor | Không thừa sidebar quản trị hoặc max-width cha bó canvas |
| UI-02 | Scroll | Không có scrollbar ngang toàn trang; scroll vùng đúng nhiệm vụ |
| UI-03 | Text tiếng Việt | Không cắt dấu/descender, tên dài không đè action |
| UI-04 | Button pending | Không nhảy chiều rộng, không submit kép |
| UI-05 | Panel footer | Trường cuối, lỗi và nút luôn cuộn tới được |
| UI-06 | Sticky/overlay | Toolbar, tooltip, menu và dialog không cắt/đè sai tầng |
| UI-07 | Focus | Luôn thấy, trở đúng chỗ sau close/delete/undo |
| UI-08 | Icon-only | Có tên truy cập; tooltip không che target đang thao tác |
| UI-09 | Selection | Canvas/panel/timeline/layers cùng entity sau mọi thao tác |
| UI-10 | Pointer | Không nhảy vị trí khi kéo, không kẹt drag khi thả ngoài cửa sổ |
| UI-11 | Zoom | Handles dễ bắt, path khớp nhân vật, không drift sau nhiều lần zoom |
| UI-12 | Timeline alignment | Ruler, grid, clip, playhead thẳng theo cùng tọa độ |
| UI-13 | Clip cực ngắn/dài | Không kéo sai mép; input thay thế hoạt động |
| UI-14 | Keyframe dày | Chọn đúng qua zoom/list, không xóa nhầm mốc |
| UI-15 | Chế độ ghi | Luôn biết sửa base hay keyframe; không tạo mốc ngầm |
| UI-16 | Numeric/IME | Dấu phẩy, số âm đang gõ, Enter/Escape, tiếng Việt không bị phá |
| UI-17 | Undo | Một gesture một bước; redo đúng, không mất sau lưu |
| UI-18 | Playback | Pause/seek/replay và đổi trang không còn audio cũ |
| UI-19 | Trạng thái lưu | Dirty mới không bị response cũ đánh dấu saved |
| UI-20 | Error density | Một lỗi một thông báo chính, không trùng toast và banner vô ích |
| UI-21 | Image/font load | Không đổi layout đột ngột; ảnh đúng tỷ lệ, font tải xong không che chữ |
| UI-22 | Responsive/zoom | 200% vẫn dùng được control hoặc có chế độ compact rõ |
| UI-23 | Empty/delete | Xóa hết trang/clip/nhân vật vẫn có lối tiếp tục |
| UI-24 | Long session | Chuyển trang/phát lại nhiều lần không tăng audio listener hoặc kẹt phím |
| UI-25 | Preview snapshot | Không lộ handles/path; draft preview và bản lưu ghi nhãn đúng |
| UI-26 | Color | Đo contrast, lỗi/selected không chỉ phân biệt bằng màu |

## 20. Ma trận kiểm thử và bằng chứng

Thiết bị nghiệm thu desktop: 1366×768, 1440×900, 1920×1080; compact 1024×768; màn hình thấp 1280×600. Browser zoom 100%, 125%, 150%, 200%; ít nhất kiểm tra DPR 1 và 2 cho độ nét mốc/handles. Preview đọc: 390×844 và 768×1024, dọc/ngang.

Chạy Chrome/Edge là môi trường chính trên Windows; Firefox và WebKit kiểm tra engine cho playback/focus/pointer, có kiểm tra Safari thực trước khi cam kết hỗ trợ Safari. Ghi phiên bản và môi trường trong biên bản; giả lập engine không được gọi là đã thử mọi thiết bị thật.

Fixture: trang rỗng; một nhân vật; nhiều nhân vật chồng lớp; tên 120 ký tự và chuỗi không khoảng trắng; 20 trang/10 nhân vật trên trang/100 clip toàn truyện/500 mốc trên trang để thử tải; asset lỗi, audio dài/ngắn, truyện sequence cũ. Đây là bộ thử ban đầu, không phải giới hạn hỗ trợ đã xác minh.

Quy trình:

1. Test thuần cho timing, nội suy, path, overlap, migration và giao dịch undo.
2. Playwright cho các luồng authoring → save → reload → preview, bàn phím, dirty/conflict, pointer cancel và responsive.
3. Visual regression dùng thời gian animation cố định và asset/font đã tải; chụp các trạng thái UX-01–12. Không so ảnh lúc animation đang chạy ngẫu nhiên.
4. Kiểm tra tay bằng chuột, trackpad, bàn phím, nhập tiếng Việt và tab nền. Tool tự động không thay được đánh giá clipping, gesture và khả năng hiểu chế độ.
5. Thử tác vụ với Content Manager: dựng một cảnh có 2 nhân vật, 2 thuộc tính keyframe, đường tự vẽ, lời kể; cố tình sửa sai rồi undo, lưu/mở lại. Ghi chỗ người dùng dừng/nhầm, sửa rồi thử lại.

Mục tiêu hiệu năng để đo: phản hồi chọn/nhập/pause dưới 100 ms trên máy thử đã ghi cấu hình; tương tác kéo hướng tới 60 fps, không có khựng kéo dài >100 ms trong fixture chuẩn. Dùng profiling để kết luận; không đặt dấu đạt chỉ vì build thành công.

## 21. Cổng nghiệm thu và thứ tự làm

| Cổng | Đầu ra bắt buộc trước khi qua bước tiếp |
| --- | --- |
| G1 — Thiết kế | UX-01–12, tokens, trạng thái và hành vi không mâu thuẫn; kiểm tra ngân sách laptop |
| G2 — Shell | Layout, focus, overlay, empty/loading/error và responsive; không cần fake animation để che thiếu |
| G3 — Authoring | Base/animation mode, preset, keyframe/path, timeline, Undo/Redo đúng fixture |
| G4 — Dữ liệu/player | Save/reload/conflict, migration, audio, draft preview và reader khớp |
| G5 — Chất lượng | UI-01–26 và tác vụ nghiệm thu có bằng chứng; build/lint/test liên quan pass |

Mức lỗi: S0 mất dữ liệu/publish sai; S1 không hoàn thành tác vụ; S2 nhầm thao tác, focus/overlap/clipping hoặc state sai; S3 lệch spacing/icon/typography. Phạm vi nghiệm thu không đóng khi còn lỗi S0–S3 đã biết trong các màn hình và môi trường đã chốt. Những khác biệt rasterization không ảnh hưởng bố cục/khả năng đọc được ghi nhận với ảnh, không tạo test pixel tuyệt đối thiếu thực tế.

Biên bản mỗi lỗi: ID, viewport/browser, fixture, bước tái hiện, mong đợi/thực tế, ảnh/video, mức độ, bản sửa, kết quả retest. Không gộp “polish sau” cho các lỗi nhỏ đã phát hiện.

## 22. Đối chiếu code khi triển khai

- `WorkspaceLayout`/`workspace.css`: mở không gian editor tại container cha, tránh override chồng max-width và sidebar.
- `StoryEditorLayout`: topbar, trạng thái lưu hợp nhất, guard và luồng publish theo revision.
- `StoryPagesPage`: tách component và state tài liệu/selection/tool/playback; không kéo dài monolith để thêm timeline.
- `StoryPageRenderer`: scene evaluator chung, tách overlay editor và content đọc, transform đúng pivot.
- `useEditorSaveState`: thay cờ dirty rời rạc bằng nguồn trạng thái toàn editor, response gắn đúng snapshot.
- Models/services/mocks/contract: lưu keyframe/path/audio và validate phụ thuộc, giữ tương thích sequence cũ.
- `StoryPreviewPage`: phân biệt draft preview/bản đã lưu, không nhân đôi runtime phát.
- CSS editor có scope riêng; gom token/rule có chủ đích, kiểm tra computed styles thay vì thêm override cuối file mãi.

Chỉ cập nhật tài liệu trong lần này. Các màn hình thiết kế, code và bằng chứng kiểm thử kể trên là đầu ra phải làm ở giai đoạn triển khai, chưa được tạo hoặc nghiệm thu bởi việc viết đặc tả.
