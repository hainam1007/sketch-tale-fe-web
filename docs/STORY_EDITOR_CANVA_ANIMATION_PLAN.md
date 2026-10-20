# Story editor: giao diện tham khảo Canva, ưu tiên animation

Ngày cập nhật: 19/10/2026. Trạng thái: một số thao tác scene, preset animation và audio đã có trong source; animation nâng cao/timeline vẫn chưa hoàn thiện và không được backend persist. Chưa nghiệm thu giao diện chạy thật. Xem [báo cáo tích hợp](api-integration/luna-extramax/implementation-report-2026-10-19.md) để biết các field editor nào đang mô phỏng.

Đặc tả chi tiết: [STORY_EDITOR_UI_UX_DETAIL_SPEC.md](STORY_EDITOR_UI_UX_DETAIL_SPEC.md), gồm layout, state, quy tắc thao tác, responsive và cổng nghiệm thu lỗi UI. Khi khác nhau về chi tiết tương tác, dùng đặc tả này. Resize/rotate, zoom/fit phục vụ keyframe được đưa vào phạm vi chính theo đặc tả.

## 1. Mục tiêu và phạm vi

Người biên tập dựng cảnh và điều chỉnh chuyển động ngay trên cùng workspace: chọn đối tượng → chọn hiệu ứng → chỉnh thời gian → phát thử → lưu.

Tham khảo cấu trúc tương tác trong ảnh Canva người dùng cung cấp; giữ nhận diện SketchTale. Animation là một công cụ chính, có panel và timeline riêng.

Người dùng đã chốt: công cụ thuận tiện cho Content Manager, có keyframe và đường di chuyển tự vẽ trong phạm vi chính; đầu ra là truyện đọc tương tác trên web có chuyển động và âm thanh. Không cần thông tin nhân lực/deadline để lập kế hoạch tính năng này.

Kế thừa `STORY_EDITOR_UX_REDESIGN_PLAN.md`, nhưng yêu cầu mới thay thế giới hạn preset-only trong kế hoạch trước. Tạm giữ nền triển khai frontend và mock persistence; backend thật cần thống nhất contract trước khi tích hợp. Rig nhân vật, lip-sync, xuất video và cộng tác nhiều người không thuộc phạm vi đã chốt.

## 2. Hiện trạng đã đối chiếu code

- React, CSS hiện có, React Query và Phosphor icons; chưa cần đổi framework.
- `StoryPagesPage.jsx`: dựng trang, kéo vị trí nhân vật, draft, undo, danh sách audio và danh sách motion.
- `MotionSequence` có 5 preset: appear, move, jump, spin, walk; chỉnh thời lượng 200–5000 ms và thứ tự.
- Motion nằm ở inspector nội dung trang; khi chọn nhân vật, inspector chuyển sang `SlotFields`, làm công cụ animation mất khỏi ngữ cảnh đang thao tác.
- `StoryPageRenderer.jsx` phát CSS animation theo tổng thời lượng các mục trước đó. Chưa có timeline nhiều track hay bộ điều khiển seek theo thời gian chung.
- Văn bản đang được render thành nội dung cố định của trang, chưa phải text object tự do có thể chọn/resize/animate độc lập.
- Layout có header thông tin và các tab quản trị; cần thu gọn để ưu tiên không gian dựng cảnh.
- Có revision, draft/publish và kiểm tra trước xuất bản; cần bảo toàn.

Đây là audit source, chưa phải kiểm tra giao diện chạy thật. Không coi các khả năng đã mô tả trong kế hoạch cũ là đã hoàn thành.

## 3. Bố cục đề xuất

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Kho truyện | Tên truyện | Trạng thái lưu | Undo/Redo | Xem thử | Xuất bản│
├──────┬──────────────────┬───────────────────────────────────────────────┤
│Công  │ Panel đang mở    │ Toolbar theo lựa chọn                        │
│cụ    │                  ├───────────────────────────────────────────────┤
│      │ Chuyển động      │                                               │
│Nền   │ • Vào / Nhấn / Ra│                  CANVAS                       │
│NV    │ • Preset preview │            Chọn và kéo nhân vật                │
│Chữ   │ • Tham số        │                                               │
│Audio │ • Áp dụng / Gỡ   │                                               │
│Motion│                  ├───────────────────────────────────────────────┤
│Lớp   │                  │ Trang: [1] [2] [3] [+]                        │
├──────┴──────────────────┼───────────────────────────────────────────────┤
│ Play/Pause | Thời gian  │ Timeline trang hiện tại                       │
│ Nhân vật A             │ [Xuất hiện]  [Di chuyển]                      │
│ Nhân vật B             │    [Nhảy]                                     │
│ Lời kể / Nhạc / SFX     │ [────────────── audio ─────────────]          │
└────────────────────────┴───────────────────────────────────────────────┘
```

- Thanh công cụ trái khoảng 64–72 px; panel mở khoảng 280–320 px. Chỉ mở một panel chính để tránh ép canvas giữa hai cột rộng.
- Toolbar ngữ cảnh: tư thế, lật, lớp, vị trí, nút Chuyển động nổi bật. Các ô số chi tiết mở trong panel thay vì luôn chiếm diện tích.
- Khi mở Chuyển động, panel giữ nguyên khi đổi lựa chọn trên canvas và cập nhật theo đối tượng mới. Không chọn đối tượng thì hiển thị hướng dẫn chọn, không tự áp hiệu ứng lên toàn trang.
- Timeline mặc định mở ở chế độ chỉnh chuyển động, có thể thay đổi chiều cao/thu gọn. Dải thumbnail trang mỏng và có thể thu gọn riêng.
- Panel Chuyển động có ba mục: Hiệu ứng có sẵn / Keyframe / Vẽ đường đi. Track đối tượng mở rộng thành các dòng Vị trí, Kích thước, Góc xoay, Độ trong suốt; keyframe hiển thị bằng dấu kim cương. Các dòng nâng cao chỉ mở khi cần.
- Thông tin, Nhân vật, Từ vựng, Câu hỏi vẫn truy cập được qua điều hướng gọn; giữ route và dữ liệu hiện tại.
- Mục tiêu laptop 1366×768: canvas, lựa chọn hiện tại và điều khiển phát luôn nhìn thấy. Mobile ưu tiên xem thử, chưa cam kết đầy đủ thao tác timeline.

## 4. Phạm vi tính năng theo ưu tiên

### P0 — Bộ biên tập animation nâng cao

1. Chọn nhân vật ở canvas hoặc track; hai vùng đồng bộ selection.
2. Thư viện preset có hình xem trước: xuất hiện/mờ vào, di chuyển, nhảy, xoay, nhún bước, mờ ra. Chia nhóm Vào cảnh / Hành động / Ra cảnh.
3. Chỉnh thời điểm bắt đầu, thời lượng, hướng, quãng đường hoặc điểm đến, easing phù hợp từng preset. UI dùng giây; dữ liệu dùng mili giây.
4. Timeline mỗi nhân vật một track, clip kéo để đổi thời điểm, kéo mép để đổi thời lượng, nhập số để chỉnh chính xác; có snap và thao tác bàn phím tương đương.
5. Cho phép nhiều nhân vật chuyển động đồng thời và một nhân vật vừa di chuyển, xoay, đổi kích thước, đổi độ trong suốt. Chỉ chặn các clip cùng điều khiển một thuộc tính trong khoảng thời gian chồng nhau; UI chỉ rõ xung đột. Đường đi và keyframe vị trí là hai cách điều khiển cùng thuộc tính, không cộng chồng ngầm.
6. Play/Pause/Resume/Replay và kéo playhead tới thời điểm bất kỳ. Khi pause phải giữ đúng cảnh đang thấy.
7. Di chuyển có điểm đầu/đích chỉnh trên canvas; tách rõ vị trí gốc của nhân vật và vị trí trong hoạt động đang chọn.
8. Track audio có start, trim đầu/cuối không sửa file gốc, volume; các track lời kể/nhạc/hiệu ứng có thể chồng thời gian. Hình ảnh và audio theo một đồng hồ phát chung.
9. Undo/Redo cho chỉnh sửa draft; một lần kéo là một bước undo. Lưu toàn bộ thay đổi dựng cảnh qua một hành động, hiển thị rõ đang lưu/lỗi/xung đột revision.
10. Preview dùng cùng bộ phát với editor; chuyển trang hoặc rời editor phải dừng và dọn audio/animation cũ.
11. Keyframe cho vị trí, kích thước, góc xoay, độ trong suốt: thêm/xóa/di chuyển/sao chép, chọn nhiều mốc và chỉnh easing giữa hai mốc. Khi bật nút “Ghi keyframe”, thay đổi đối tượng tại playhead tạo/cập nhật mốc; khi tắt, chỉnh bố cục gốc. Trạng thái này phải luôn rõ để tránh sửa nhầm.
12. Vẽ đường đi trực tiếp trên canvas bằng kéo tự do hoặc đặt điểm; chỉnh điểm và tay nắm đường cong, thêm/xóa điểm, đảo chiều, đặt thời lượng. Làm mượt có xem trước và undo. Đường đi có điểm đầu/cuối, chỉ hiện khi chỉnh; tùy chọn nhân vật hướng theo đường đi, mặc định giữ hướng hiện tại.
13. Đọc tương tác: chọn trang bằng nút trước/sau; có phát/tạm dừng/phát lại và bật/tắt tiếng. Mặc định đề xuất animation khi vào trang, giữ cảnh cuối và chờ người đọc chuyển trang. Chức năng từ vựng/câu hỏi hiện có vẫn hoạt động. Chế độ editor có thể tua, chế độ đọc không cần lộ timeline biên tập.

### Luồng thao tác nâng cao

- **Keyframe:** chọn Bobby → đưa playhead đến 0 s → bật Ghi keyframe → đặt vị trí đầu → đến 2 s → kéo Bobby đến vị trí cuối → chọn chuyển động nhanh/chậm dần → phát thử. Có thể thêm mốc xoay/kích thước ở giữa mà không viết công thức.
- **Đường tự vẽ:** chọn Bobby → Vẽ đường đi → kéo một đường trên cảnh → xem trước → chỉnh các điểm → đặt thời lượng 3 s → phát thử cùng lời kể. Không yêu cầu người biên tập hiểu đường Bézier.
- **Preset:** vẫn dùng để làm nhanh; có thể chuyển thành keyframe để sửa sâu. Bước chuyển đổi phải có undo và giữ kết quả xem trước tương đương.

### P1 — Hoàn thiện trải nghiệm kiểu Canva

- Resize bằng tay nắm, căn chỉnh, zoom/fit; bổ sung xoay nếu model đã hỗ trợ.
- Sao chép/dán hiệu ứng, nhân bản clip, áp hiệu ứng cho nhiều đối tượng với quy tắc thời gian rõ ràng.
- Nhân bản trang và remap ID trang/slot/clip; không giữ nhầm liên kết về trang gốc.
- Text object có vị trí, kiểu chữ và animation riêng. Đây là mở rộng model, không chỉ thêm nút lên văn bản hiện tại.
- Chuyển cảnh giữa trang, loop có giới hạn và đổi tư thế theo thời điểm.
- Autosave sau khi hàng đợi lưu và conflict handling đã ổn định; bổ sung phục hồi draft khi tải lại.

### P2 — Mở rộng sau phạm vi chính

Trigger nhấp nhân vật để chạy một hoạt động riêng, phân nhánh cốt truyện, rig/lip-sync hoặc xuất video. “Đọc tương tác” hiện không được tự suy rộng thành hệ thống tác giả lập trình sự kiện hay truyện phân nhánh. Nếu cần trigger, phải định nghĩa chạy lại/ngắt/chồng hoạt động và quan hệ với lời kể.

## 5. Kế hoạch kỹ thuật

- Tách `StoryPagesPage.jsx` thành EditorTopbar, ToolRail, ContextPanel, CanvasToolbar, PageFilmstrip, AnimationPanel, Timeline và PlaybackControls; giữ service boundary.
- Dùng state riêng cho tài liệu/draft, selection, playback và trạng thái panel. Thời gian phát không được làm tài liệu dirty hoặc tạo lịch sử undo.
- Model đề xuất: `animationVersion`, `page.durationMs`, `animationClips[]` với `id`, `targetId`, `preset`, `startMs`, `durationMs`, `easing`, `params`. Audio có `startMs`, `trimStartMs`, `trimEndMs`, `volume` và tham chiếu asset. Các tên này là đề xuất, chưa phải contract backend.
- Clip phân biệt `preset`, `keyframes`, `path`. Keyframe lưu ID, thời gian tương đối trong clip, giá trị thuộc tính và easing của đoạn tiếp theo. Path lưu điểm điều khiển trong hệ tọa độ thiết kế, chiều đi và tùy chọn hướng theo tiếp tuyến; không lưu tọa độ màn hình sau zoom. Validate thời gian hữu hạn, trong clip, không trùng mốc trên cùng thuộc tính; chặn scale không hợp lệ và opacity ngoài 0–1.
- Evaluator nội suy số/vector và easing theo đoạn; góc xoay lưu góc liên tục để biểu diễn nhiều vòng. Đường cong cần ánh xạ tiến độ theo độ dài đường đi để tốc độ đều khi chọn linear. Đường có độ dài 0 không được gây lỗi. Khi resize clip, mặc định co giãn thời điểm keyframe theo tỷ lệ và cho xem trước; trim audio dùng quy tắc riêng.
- Di trú `sequence` cũ bằng startMs cộng dồn durationMs để giữ thứ tự cũ; giữ nguyên story/role/slot/asset ID. Cần fixture so sánh trước/sau và không sửa snapshot đã xuất bản.
- Xác định kích thước thiết kế/tỷ lệ stage; tọa độ chuyển động quy đổi theo stage để zoom không đổi đường đi. Giữ nghĩa tọa độ phần trăm/anchor hiện tại.
- Xây bộ tính trạng thái cảnh tại thời điểm t, dùng chung editor/preview. Chốt nội suy và trạng thái trước/sau clip; di chuyển giữ điểm kết thúc, nhảy/nhún trở về vị trí, hiệu ứng ra giữ ẩn. Clip sau lấy đúng trạng thái cuối clip trước.
- Tách transform bố cục, scale/flip gốc và transform animation để chúng không ghi đè nhau.
- Playback có một đồng hồ, xử lý pause/resume/seek, audio chưa tải, tab nền và chuyển trang. Không dùng chuỗi timeout độc lập làm nguồn thời gian chính.
- Player đọc web và preview dùng chung scene evaluator. Khi người đọc chuyển trang, hủy lịch phát cũ; khi quay lại, mặc định khởi tạo lại trang. Nếu trình duyệt chặn audio tự phát, hiển thị nút “Bắt đầu đọc” để người dùng khởi động hình và tiếng cùng nhau. Phân biệt giảm chuyển động giao diện với tùy chọn giảm chuyển động trong nội dung truyện.
- Tổng thời lượng trang bao phủ thời điểm kết thúc lớn nhất của motion/audio đã trim; nếu người dùng rút ngắn trang, báo clip vượt giới hạn và yêu cầu chỉnh rõ ràng.
- Tái dùng revision và hàng đợi mutation hiện tại. Nếu lưu nhiều request bị lỗi giữa chừng, chỉ đánh dấu phần đã lưu thành công và giữ draft còn lại; chỉ bảo đảm lưu nguyên tử khi API thực sự hỗ trợ.
- Cập nhật models, mock persistence, validate/publish, preview snapshot và contract tài liệu cùng với UI. Không chỉ lưu field trong state hoặc chạy demo animation.

## 6. Thứ tự triển khai và đầu ra

| Chặng | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 1. Chốt UX và dữ liệu | Wireframe laptop, luồng animation, phạm vi text/audio, schema và di trú | Có bản thiết kế xem được và quy tắc playback thống nhất |
| 2. Editor shell | Topbar, rail, panel chuyển động, canvas, dải trang, selection | Chọn nhân vật và chỉnh preset ngay trong ngữ cảnh; CRUD cũ vẫn dùng được |
| 3. Animation runtime | Model preset/keyframe/path, evaluator, clock, migration, play/pause/seek | Cảnh tại một thời điểm tái hiện nhất quán, phát đồng thời đúng |
| 4. Timeline và keyframe | Tracks thuộc tính, mốc kim cương, Ghi keyframe, easing, kéo/resize/snap, undo/redo | Dựng nhân vật đồng thời đổi vị trí, kích thước và góc xoay |
| 5. Vẽ đường đi | Vẽ tự do, làm mượt, sửa điểm/tay nắm, thời lượng, hướng theo đường | Đường đi lưu/mở lại đúng và phát không phụ thuộc zoom |
| 6. Audio và đọc tương tác | Audio sync, chuyển trang, playback theo thao tác người đọc, giữ học liệu | Đọc thử truyện hoàn chỉnh, không còn âm thanh trang cũ |
| 7. Lưu và nghiệm thu | Revision/conflict, snapshot, preview, responsive, kiểm thử | Lưu/mở lại giữ kết quả, preview khớp editor, không mất tính năng cũ |

Đây là thứ tự phụ thuộc triển khai, không phải lịch giao việc theo nhân lực. Keyframe và đường tự vẽ là điều kiện hoàn thành phạm vi chính, không bị chuyển sang phần tùy chọn.

## 7. Kịch bản nghiệm thu

- Chọn Bobby → thêm xuất hiện 0–0,6 s → di chuyển 0,6–2 s → nhân vật khác nhảy 1–1,8 s → thêm lời kể; phát đồng thời đúng lịch.
- Pause ở 1,2 s, resume, rồi tua trở về 0,8 s: vị trí, hiển thị và audio đúng thời điểm; không khởi động lại toàn cảnh ngoài ý muốn.
- Kéo clip và undo/redo; reload sau lưu; xem preview: kết quả giữ nguyên.
- Tạo mốc vị trí/scale/rotation/opacity; kiểm tra tại đúng mốc và giữa hai mốc; tua ngược và phát từ đầu cho cùng kết quả. Ghi keyframe tắt không tạo mốc ngoài ý muốn.
- Vẽ đường cong, sửa một điểm, đổi thời lượng, zoom canvas và lưu/mở lại: giữ đường đi và easing. Undo một nét vẽ hoặc một lần kéo điểm bằng một thao tác.
- Di chuyển và xoay đồng thời hợp lệ; hai clip cùng ghi vị trí bị báo xung đột, không ghi đè âm thầm. Chuyển preset thành keyframe không làm nhân vật nhảy vị trí.
- Đọc web: bắt đầu phát có tiếng, tạm dừng, bật/tắt tiếng, chuyển trang giữa hoạt động, quay lại và làm câu hỏi/từ vựng; không chạy audio cũ hoặc tự chuyển trang ngoài chế độ đã chọn.
- Truyện dùng sequence cũ vẫn mở/phát/lưu được; bản publish trước đó không đổi khi sửa draft.
- Xóa nhân vật hoặc trang xử lý clip tham chiếu; asset thiếu hiển thị lỗi có thể sửa, không âm thầm thay ảnh.
- Mất mạng, save lỗi giữa chừng và revision conflict không xóa draft hoặc báo đã lưu sai.
- Laptop 1366×768 và 1440×900: không che canvas bằng panel; các thao tác timeline có cách nhập số/bàn phím; focus rõ ràng.
- Kiểm tra hiệu năng với fixture nhiều nhân vật/clip; đo rồi thống nhất giới hạn hỗ trợ, không hứa FPS trước khi benchmark.

Kiểm thử dự kiến: test thuần cho evaluator/migration/timing; Playwright cho selection–timeline–save–preview và hồi quy content contract/save state; build/lint và kiểm tra giao diện thực tế. Chưa chạy test vì đây là công việc lập kế hoạch.

## 8. Quyết định đã chốt và giả định còn lại

Đã chốt với người dùng:

1. Có keyframe và đường di chuyển tự vẽ trong phạm vi chính.
2. Đầu ra là đọc tương tác trong web, có chuyển động và âm thanh.
3. Mục tiêu là sự thuận tiện của Content Manager; không yêu cầu người dùng cung cấp deadline/nhân lực.

Giả định thiết kế chưa được người dùng xác nhận: nhân vật là đối tượng animation đầu tiên; text object tự do ở P1; đọc tương tác mặc định gồm chuyển trang, playback và học liệu hiện có, chưa gồm phân nhánh/trigger tùy biến. Các giả định này có thể điều chỉnh khi duyệt wireframe, không ngăn lập kế hoạch hiện tại.

Kế hoạch này cập nhật yêu cầu animation mới; chưa phải yêu cầu bắt đầu sửa code ứng dụng.
