# Kế hoạch tối ưu Story Editor cho Content Manager

Ngày cập nhật: 19/10/2026. Trạng thái: editor frontend và các luồng trang/slot/audio/preset đã có một phần; API thật chỉ bao phủ các field được backend hỗ trợ. Timeline/animation/audio track và asset library độc lập vẫn còn mô phỏng; chưa nghiệm thu runtime. Xem [báo cáo API](api-integration/luna-extramax/implementation-report-2026-10-19.md) để phân biệt dữ liệu thật và mock. Kế hoạch chưa hoàn tất.

Kế hoạch UX toàn hành trình Content Manager: [CONTENT_MANAGER_UI_UX_PLAN.md — bổ sung 11/10/2026](CONTENT_MANAGER_UI_UX_PLAN.md). Bao gồm tổng quan, tìm/tiếp tục truyện, thư viện, học liệu, xuất bản, giảm thao tác, onboarding, phím tắt và usability test; áp dụng cùng kế hoạch editor này.

## 1. Phạm vi đã chốt

- Chỉ frontend, tận dụng React, CSS, service boundary và mock persistence hiện có.
- Animation phiên bản đầu: đổi tư thế và preset di chuyển, nhảy, xoay, xuất hiện/biến mất. Chưa làm animation từng frame, rig xương, lip-sync hay video export.
- Phát từng trang, có Play/Pause/Replay, chuyển trang và chế độ tự phát toàn truyện.
- Chưa có audio mẫu mới. Người biên tập có thể thêm file sau; thiếu audio không ngăn dựng cảnh hoặc phát chuyển động.
- Hình Bobby được cung cấp là bảng tham chiếu gồm bảy tư thế, không phải bảy file PNG riêng hoặc một sprite sheet hoạt hình sẵn dùng. Chưa xác nhận có bộ ảnh tách nền.
- Backend/mobile integration không thuộc triển khai này. Các field/API mới bên dưới là đề xuất frontend; không tuyên bố backend đã hỗ trợ.

## 2. Audit hiện trạng từ mã nguồn

| Hiện trạng | Hệ quả | Hướng thay đổi |
| --- | --- | --- |
| `StoryPagesPage.jsx` đã CRUD, đổi thứ tự trang, chọn background và sửa slot | Có nền tảng để mở rộng | Giữ ID và service boundary, thay luồng biên tập |
| Danh sách trang xuất hiện ở sidebar và danh sách sửa nhanh phía dưới | Lặp thông tin, nhiều form cùng sửa một trang | Một danh sách thumbnail; một inspector theo đối tượng đang chọn |
| `StoryRolesPage.jsx` tạo nhân vật/slot riêng, Pages sửa vị trí | Phải chuyển tab để dựng cùng một cảnh | Thêm nhân vật và chỉnh ngay trên canvas |
| X/Y/scale/layer chủ yếu nhập số; renderer cho chọn nhưng chưa kéo thả | Khó đặt nhân vật trực quan | Kéo, resize, xoay và đổi lớp; vẫn giữ nhập số để chỉnh chính xác |
| Narration trong trang là textarea | Không phải audio phát được | Tách lời đọc dạng text và clip audio |
| Upload hiện chỉ nhận ảnh, tối đa 5MB; thư viện có hiển thị audio | Chưa đủ luồng audio authoring | Bổ sung upload/metadata/persistence audio riêng |
| `StoryPageRenderer.jsx` dựng cảnh tĩnh | Chưa có trình tự audio/motion | Shared scene evaluator và player theo thời gian |
| Có revision, draft/publish, guard thay đổi chưa lưu | Nên bảo toàn khi thiết kế lại | Draft toàn editor, hàng đợi lưu và xử lý conflict |

Audit này dựa trên source, chưa phải kết quả kiểm tra giao diện chạy thật hoặc xác nhận backend.

## 3. Bố cục workspace

Trang biên tập mặc định mở **Dựng truyện**. Điều hướng cấp truyện gồm Dựng truyện, Thông tin, Học liệu, Xem thử. Học liệu gom lối vào Từ vựng và Câu hỏi; giữ route cũ hoặc điều hướng tương thích.

- **Thanh trên:** tên truyện, trạng thái lưu, Undo/Redo, Xem thử, Kiểm tra, Xuất bản. Không để header thông tin dài chiếm chỗ canvas.
- **Bên trái — Trang:** thumbnail, số thứ tự, tên, thời lượng và chỉ báo lỗi. Thêm, nhân bản, xóa, kéo đổi thứ tự; có nút lên/xuống tương đương cho bàn phím.
- **Ở giữa — Canvas:** cảnh lớn, zoom/fit, vùng an toàn cho chữ, chọn/kéo đối tượng, tay nắm resize/xoay, hướng dẫn căn chỉnh. Toolbar thêm Nền, Nhân vật, Văn bản, Âm thanh.
- **Bên phải — Thuộc tính:** thay theo lựa chọn Trang/Nền/Nhân vật/Văn bản/Hoạt động/Audio. Nhóm nâng cao thu gọn; không bắt đầu bằng hàng loạt ô tọa độ.
- **Phía dưới — Trình tự:** chế độ danh sách hoạt động mặc định; chuyển sang timeline khi cần chỉnh thời điểm chi tiết. Panel kéo đổi chiều cao và thu gọn được.
- **Thư viện:** mở drawer khi thêm asset, có tab Nền/Nhân vật/Âm thanh, tìm kiếm, bộ lọc và upload tại chỗ. Không đưa người dùng ra khỏi trang đang dựng.

Desktop/laptop là thiết bị biên tập chính. Mục tiêu kiểm tra 1366×768: canvas và nút phát luôn tiếp cận được; panel trái/phải thu gọn. Màn hình nhỏ dùng một panel mỗi lần; xem thử hỗ trợ mobile, không ép toàn bộ editor desktop vào màn hình điện thoại.

## 4. Các thao tác CRUD

| Đối tượng | Tạo và đọc | Sửa | Xóa và phụ thuộc |
| --- | --- | --- | --- |
| Trang | Trang trống, sao chép trang, xem thumbnail | Tên, nội dung, thứ tự, thời lượng | Báo các đối tượng, hoạt động, học liệu liên quan; xóa một giao dịch, có Undo |
| Background | Upload/chọn thư viện, xem trước | Thay ảnh, fit/crop, điểm lấy nét | Gỡ nền trang khác với xóa file thư viện; có màu nền trống |
| Nhân vật | Tạo bộ nhân vật, thêm tư thế, chèn vào trang | Tên, tư thế, vị trí, kích thước, góc, lật, lớp | Gỡ lần xuất hiện khác với xóa nhân vật toàn truyện; hiển thị trang bị ảnh hưởng |
| Audio | Upload, nghe thử, thêm vào trang | Tên, loại, thứ tự, thời điểm, cắt đầu/cuối không phá file, volume, fade, loop nhạc nền | Gỡ clip không xóa file; hoạt động phụ thuộc cần sửa hoặc xóa kèm |
| Hoạt động | Thêm preset và xem thử tại chỗ | Đích, bắt đầu, thời lượng, easing, lặp, tư thế | Xóa clip; kiểm tra các mục có quan hệ “sau hoạt động này” |

Asset dùng chung: sửa tên/tag/nhóm; thay nội dung tạo version/ID mới. Không thay bytes phía sau ID đã được snapshot xuất bản tham chiếu. Khi xóa file, chỉ cho xóa nếu không còn tham chiếu trong phạm vi dữ liệu frontend quản lý; dữ liệu thật cần backend kiểm tra toàn hệ thống.

Nhân bản trang phải tạo ID mới cho trang, slot, clip và remap quan hệ nội bộ; giữ asset reference. Vocabulary/quiz chỉ sao chép khi chọn rõ trong thao tác nhân bản.

## 5. Mô hình Bobby và chuẩn asset

Phân biệt ba lớp:

1. **Bộ nhân vật:** Bobby, thumbnail và các tư thế: đứng phải, đứng trái, chính diện, quay lưng, ngồi, đi, nhảy.
2. **Lần xuất hiện:** Bobby trên trang 2, có vị trí, kích thước, lớp, tư thế khởi đầu riêng. Tương thích role/slot hiện có, không bỏ ý nghĩa role tùy biến của dự án.
3. **Hoạt động:** đổi sang tư thế nhảy, dịch chuyển hoặc bật lên trong một khoảng thời gian, rồi đổi sang ngồi.

Chuẩn đầu vào đề xuất: ảnh PNG/WebP có alpha; mỗi tư thế một file; cùng khung vẽ và tỷ lệ nhân vật; có điểm gốc ở chân để đổi tư thế không bị giật. Đặt tên dễ hiểu, gán tư thế qua UI thay vì bắt buộc tên file kỹ thuật. Import hàng loạt có bước xem và hiệu chỉnh điểm gốc, kích thước tương đối, tư thế mặc định.

Giữ tọa độ slot cũ theo center. Với asset mới, metadata pivot của ảnh được renderer quy đổi trong local transform; không đổi âm thầm ý nghĩa X/Y của story cũ. Cần xác định kích thước thiết kế chuẩn của stage trước khi triển khai.

Ảnh bảng mẫu hiện có nền, chữ, bóng và nhiều cảnh: không đưa nguyên bảng lên canvas như một nhân vật. Có thể dùng tham chiếu thiết kế; để nghiệm thu cần bộ ảnh riêng. Tách nền/tạo asset mới là công việc bổ sung, không mặc định thuộc kế hoạch coding frontend.

“Đi” bằng preset là di chuyển ảnh từ A tới B, tùy chọn nhún nhẹ; không thể hiện chu kỳ bước chân thật khi chỉ có một ảnh Walk. UI gọi đúng là “Di chuyển”. Preset Nhảy tạo quỹ đạo bật lên rồi hạ xuống; pose và quỹ đạo chỉnh độc lập.

## 6. Trình tự dễ dùng, timeline khi cần

Content Manager mặc định thao tác bằng câu dễ đọc:

- Khi mở trang → Bobby xuất hiện.
- Sau hoạt động trước → Bobby di chuyển đến vị trí được kéo trên canvas.
- Cùng lúc với hoạt động được chọn → phát lời kể.
- Sau lời kể → Bobby nhảy rồi chuyển sang ngồi.

Mỗi mục có đối tượng, hành động, điều kiện bắt đầu, thời lượng, nút xem thử. Kéo để đổi thứ tự chuỗi; nút lên/xuống hỗ trợ thao tác chính xác. Khi đổi thứ tự, các mục “sau mục trước” được tính lại, mục đặt thời gian cố định giữ nguyên và được đánh dấu rõ.

Timeline nâng cao dùng cùng dữ liệu với danh sách, không tạo một bản sao: track lời kể, nhạc nền, hiệu ứng và nhân vật; playhead, zoom thời gian, snap, kéo clip, sửa start/duration bằng số. Di chuyển clip sang thời điểm cố định phải cho thấy quan hệ cũ đã đổi.

Audio narration mặc định nối tiếp; nhạc nền và hiệu ứng có thể chạy song song. Reorder track để nhìn dễ hơn không được tự đổi thời điểm phát. Cho phép nghe riêng/mute track và cảnh báo lời kể chồng nhau. Bản đầu giới hạn nhạc nền trong từng trang để kiểm soát chuyển trang rõ ràng.

Quy tắc dữ liệu: thời gian lưu bằng ms; trigger `pageStart`, `after`, `with`, `absolute`, kèm offset và reference clip khi cần. Kiểm tra vòng lặp quan hệ và reference mất. Hai clip đồng thời điều khiển cùng thuộc tính trên một instance phải báo lỗi; motion và đổi pose có thể song song vì điều khiển thuộc tính khác nhau.

Thời lượng trang tự tính từ thời điểm kết thúc hữu hạn cuối cùng; có override nhưng không âm thầm cắt nội dung. Loop âm nền kết thúc tại cuối trang, không kéo thời lượng thành vô hạn. Bản đầu chưa có trigger tương tác chạm.

## 7. Phát và xem thử

- Dùng một scene evaluator để tính pose/transform tại thời điểm t cho canvas và preview; tránh hai renderer cho kết quả khác nhau.
- Play/Pause/Replay, scrub và phát trang hiện tại; khi kéo playhead, cập nhật cảnh và audio offset phù hợp, không kích hoạt âm thanh lặp ngoài ý muốn.
- Chuyển trang luôn dừng audio và hủy lịch phát của trang cũ. Replay khôi phục trạng thái đầu trang.
- Tự phát bật sau thao tác Play của người dùng; khi hết trang và media hoàn tất thì sang trang sau; hết truyện dừng rõ ràng.
- Thiếu asset/audio: cảnh báo có đường dẫn tới đối tượng, không thay asset ngẫu nhiên. Nếu audio bị lỗi, cho thử lại hoặc bỏ qua có chủ đích; không treo player chờ mãi.
- Preview có lựa chọn tỉ lệ/khung thiết bị; tỉ lệ cảnh cố định, fit theo khung và có vùng an toàn chữ. Tạm kế thừa 16:9 trong contract hiện có, chờ xác nhận với app đọc truyện.

## 8. Lưu, Undo và lỗi

- Một draft store chung cho toàn editor; chuyển trang hoặc chọn nhân vật không làm mất thay đổi đang sửa ở đối tượng khác.
- Undo/Redo cho thao tác nội dung. Kéo một lần là một bước undo; không tạo lịch sử cho từng pixel. Upload bytes không bị xóa khi undo việc chèn.
- Autosave sau khoảng nghỉ ngắn và nút Lưu; trạng thái Chưa lưu/Đang lưu/Đã lưu/Lỗi lưu hiển thị chính xác.
- Serialize mutation theo story, revision cập nhật sau mỗi lần lưu; response cũ không ghi đè bản sửa mới. Có thể lưu snapshot draft qua mock adapter; endpoint mới là đề xuất, không gọi nhầm backend chưa hỗ trợ.
- Lỗi lưu giữ nguyên dữ liệu. Conflict revision giữ bản local và yêu cầu chọn cách xử lý; không tự retry ghi đè.
- Upload có loading, hủy, lỗi, thử lại; giới hạn MIME/dung lượng ảnh và audio cấu hình riêng. Blob lưu IndexedDB ở mock mode, reference bằng asset ID, không serialize object URL.
- Kiểm tra/xuất bản chỉ dùng revision đã lưu đầy đủ; danh sách lỗi dẫn tới trang, đối tượng hoặc clip. Phân biệt draft đã lưu với phiên bản đã xuất bản.

## 9. Kiến trúc frontend đề xuất

Giữ stack hiện có; chưa cần chốt thêm thư viện trước khi làm prototype tương tác.

- `StoryComposer`: kết nối shell, selection, draft và workspace.
- `PageNavigator`, `AssetDrawer`, `SceneCanvas`, `ObjectInspector`, `LayerPanel`.
- `SequenceEditor`, `TimelineEditor`, `AudioClipInspector`, `PlaybackControls`.
- `useEditorDocument`: draft, commands, selection, history; `useEditorPersistence`: queue/revision/recovery.
- `sceneEvaluator`: hàm tính trạng thái tại t; `playbackController`: clock, audio, pause/seek/cleanup.

Domain mở rộng: `characterDefinition` và `poses`; slot/instance bổ sung poseId, rotation, kích thước chuẩn; page bổ sung duration và clips; audio clip tham chiếu assetId, trim, volume, loop; motion clip tham chiếu slotId và preset parameters. Có `schemaVersion` để migrate dữ liệu cũ.

Migration: giữ pageId/roleId/slotId, narration text, metadata và học liệu; defaultAssetId trở thành pose mặc định nếu chưa có bộ tư thế; trang cũ có clips rỗng vẫn hiển thị đúng. Published snapshot phải giữ phiên bản asset/character cần thiết, không phụ thuộc định nghĩa dùng chung đang bị sửa.

## 10. Thứ tự triển khai và tiêu chí nghiệm thu

| Đợt | Công việc | Kết quả nghiệm thu |
| --- | --- | --- |
| 1 | Wireframe workspace, domain/schema, fixture Bobby, flow prototype | Đi hết flow tạo trang → thêm nền → chèn nhân vật → thêm hoạt động → preview; thống nhất semantics timeline |
| 2 | CRUD trang/nền/nhân vật, pose library, canvas, layer panel, draft/history | Không cần đổi tab để dựng cảnh; kéo/resize/lật/đổi lớp; nhân bản/xóa/Undo không sai reference |
| 3 | Preset animation, sequence, shared evaluator | Bobby đổi pose, di chuyển, nhảy; pause/replay/seek cho cùng trạng thái |
| 4 | Audio upload/persistence, sequencing, timeline, autoplay | Nhiều clip đúng thứ tự, đồng bộ chuyển động; chuyển trang không còn âm thanh cũ |
| 5 | Autosave/recovery/conflict, validation/publish mock, accessibility/responsive | Reload giữ dữ liệu đã lưu, lỗi không mất draft, story cũ vẫn mở được |

Draft/history cơ bản cần từ đợt 2; đợt 5 hoàn thiện độ bền và kiểm tra tích hợp. Không coi các đợt thiếu audio hoặc motion là hoàn thành toàn yêu cầu.

Kiểm thử trọng tâm: CRUD và remap ID khi nhân bản; delete cascade/Undo; thay pose không lệch chân; timeline đổi thứ tự, clip trùng thuộc tính, cycle; pause/seek/replay; đổi trang giữa audio; reload Blob; save failure/conflict; snapshot cũ không đổi khi thay asset. Kiểm tra bàn phím, focus, panel trên laptop và preview mobile. Test thời gian cần clock có thể kiểm soát để tránh kiểm thử chập chờn.

Kịch bản Bobby nghiệm thu: tạo bốn trang rừng, nhìn bướm, nhảy, ngồi; dùng lại cùng bộ nhân vật; thêm ít nhất hai audio clip vào một trang rồi đổi thứ tự; phát riêng và tự phát toàn truyện; lưu, reload và phát lại cho cùng kết quả. Audio test dùng file fixture hợp lệ, không mô phỏng thanh sóng thành âm thanh thật.

## 11. Thông tin bổ sung hữu ích

Không cần thêm thông tin để bắt đầu wireframe và frontend prototype. Trước khi chốt fidelity và nghiệm thu cần:

- Bộ Bobby từng tư thế nền trong suốt hoặc quyết định riêng về việc chuẩn bị asset.
- Một background và một hoặc hai audio ngắn khi đã có; chưa có audio mới không cản lập kế hoạch.
- Tỉ lệ trang/hướng màn hình app đọc truyện; trước mắt giả định 16:9 theo contract.
- Số trang, nhân vật và audio thường dùng trong một truyện để đo hiệu năng bằng dữ liệu đại diện.

Các tài liệu cũ có giới hạn asset deletion và canvas trước đây; kế hoạch này đề xuất mở rộng theo yêu cầu CRUD mới của người dùng, không coi giới hạn cũ là yêu cầu phải xin phép lại. Khi triển khai sẽ cập nhật contract và các plan liên quan để tránh hai mô tả khác nhau.

## 12. Tình trạng triển khai đợt đầu

Đã triển khai: trang dựng truyện một workspace; thumbnail và sắp thứ tự trang; thêm trang một thao tác; giữ bản sửa cục bộ khi đổi trang; inspector cho trang/slot; kéo đặt nhân vật; thêm nhân vật đã có vào trang; chọn ảnh tư thế; đổi lớp; thêm/xóa, đổi thứ tự audio và hoạt động; hiệu ứng CSS preset; phát thử audio lần lượt; tự phát trang kế tiếp ở Preview; upload audio vào thư viện mock local; quay lại trang gần nhất; picker chọn asset qua một điểm vào.

Giới hạn của đợt này: motion là preset preview phía trình duyệt; “Di chuyển” là chuyển dịch CSS, không phải chu kỳ đi bộ. Audio và hai trường `audioTracks`/`sequence` mới persist trong mock; real backend/mobile cần chốt adapter/contract. Editor vẫn lưu tường minh, chưa có autosave/Undo/Redo chung, timeline scrub theo ms, upload ngay trong picker, chỉnh trim/fade, âm nền chạy song song, quản lý bộ tư thế hàng loạt hoặc xác nhận xóa tham chiếu với backend. Trang mới có thể lưu trống; publish mock vẫn chặn trang chưa có nội dung.

Build xác nhận source biên dịch được ngày 11/10; chưa chạy kiểm thử tự động hoặc nghiệm thu thao tác giao diện trong trình duyệt.
