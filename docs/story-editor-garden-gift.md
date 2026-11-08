# Bobby và món quà của khu vườn

## Bản trên tài khoản manager

Đã tạo trên máy chủ bằng tài khoản `manager@sketch.tale.com`:

- Story ID: `21a89526-20b1-471b-bce0-bc23c4fb7418`.
- Mở bằng chế độ API thật (`npm run dev`): http://127.0.0.1:5173/content/stories/21a89526-20b1-471b-bce0-bc23c4fb7418/pages
- Trạng thái: bản nháp. Máy chủ lưu 5 trang, 5 ảnh nền, 5 bản sao nguyên vẹn của MP3, nhân vật Bobby với 5 vị trí, 3 từ vựng và 1 câu hỏi.
- API chưa hỗ trợ lưu cue phụ đề hoặc chuyển động. `src/features/content/data/authoredPageCompanions.js` giữ 25 cue và chuyển động cho đúng các page ID trên. Editor chỉ áp dụng khi story ID, nội dung và URL audio vẫn khớp; bản chỉnh sửa trong editor vẫn ưu tiên hơn dữ liệu kèm này. Phần định thời cần phiên bản frontend trong dự án này, chưa được lưu thành trường dữ liệu backend.
- Phụ đề là nội dung truyện, chưa căn theo lời đọc của file audio được dùng chung.

Phần bên dưới mô tả bản demo local đã tạo trước đó; bản demo này độc lập với truyện thật trên tài khoản manager.

Bản truyện local gồm 5 trang, dành cho trẻ cùng đọc với người lớn. Chủ đề: quan sát, biết quan tâm và nhẹ nhàng với thiên nhiên.

## Mở và chỉnh sửa

```sh
npm run dev:story
```

- Mở http://127.0.0.1:5175/auth/login
- Tài khoản **local demo**: `content@example.com` / `content123`.
- Editor: http://127.0.0.1:5175/content/stories/story-bobby-mon-qua-khu-vuon/pages
- Đọc thử: http://127.0.0.1:5175/content/stories/story-bobby-mon-qua-khu-vuon/preview

Chế độ `story-demo` dùng dữ liệu local và giữ các chỉnh sửa trong localStorage của trình duyệt, kể cả khi đóng tab. Không thay đổi `.env.development`, không tạo truyện trên máy chủ. Dữ liệu chỉnh sửa gắn với origin `127.0.0.1:5175`; xóa dữ liệu trình duyệt sẽ mất các chỉnh sửa đó. Bản truyện gốc nằm trong `src/features/content/data/gardenGiftStoryFixture.js` và được khởi tạo lại nếu chưa có.

## Nội dung

1. **Tiếng gọi ngoài hiên** — Bobby theo chiếc lá vàng từ hành lang.
2. **Dấu nắng trên sàn** — Chú học cách chậm lại để không làm đổ chậu cây.
3. **Một điều bé xíu** — Chú phát hiện mầm cây bên lối đi.
4. **Món quà ở lại** — Bobby để chiếc lá trong vườn, bên người bạn nhỏ.
5. **Mang niềm vui về nhà** — Chú hiểu rằng biết quan tâm cũng là một món quà.

Mỗi trang có bối cảnh từ thư viện Bobby hiện có, một tư thế nhân vật, chuyển động xuất hiện, 5 phụ đề nối tiếp nhau và audio. Truyện kèm 3 từ vựng cùng 1 câu hỏi đọc hiểu.

## Audio và phụ đề

File gốc: `ElevenLabs_2026-10-14T02_46_49_Giang - Northern female Narrator_pvc_sp109_s50_sb75_v4.mp3`.

Bản sao nguyên vẹn: `public/audio/garden-gift-giang.mp3`. Cả 5 trang dùng lại toàn bộ file dài 57,391 giây, âm lượng 80%; tổng thời gian khoảng 4 phút 47 giây.

25 phụ đề là nội dung truyện mới, chia thời gian đều trong mỗi trang. Đây **không phải bản chép lời hoặc căn chỉnh theo lời nói của file MP3**. Khi có bản thu đúng nội dung, có thể thay audio và chỉnh thời điểm từng phụ đề trong editor.

## Các cải thiện editor

Animation đã được mở rộng thành 69 clip (15 / 15 / 13 / 13 / 13 theo trang): xuất hiện, bước đi kèm đổi vị trí, nhảy nhẹ, nghiêng đầu, cúi quan sát và nhịp thở nhẹ. Chuyển động bám theo nhịp phụ đề, kết thúc trước audio và không có hai clip điều khiển cùng thuộc tính trong cùng thời gian. Áp dụng cho cả bản local và dữ liệu kèm truyện trên tài khoản manager; API vẫn chưa có trường lưu animation.

- Sửa phân loại ảnh nền Bobby để hành lang, phòng khách và khu vườn xuất hiện đúng trong kho nền.
- Giữ ô nội dung truyện khi đã có phụ đề định thời; giải thích rõ hai phần được biên tập riêng.
- Cho tạo lại phụ đề từ nội dung sau khi đã gỡ hết cue; không cho tạo từ nội dung trống.
- Thumbnail trang luôn hiển thị nhân vật, không bị ẩn bởi frame đầu của hiệu ứng xuất hiện.
- Đồng bộ tỷ lệ nhân vật giữa editor và bản đọc thử; trước đây bản đọc thử phóng lớn nhân vật so với lúc biên tập.
- Tăng khoảng cách và trạng thái focus cho các ô biên tập phụ đề.

Kiểm tra tự động (bao gồm mở bản sửa trong tab mới): `npx playwright test --config playwright.story-demo.config.js`.
