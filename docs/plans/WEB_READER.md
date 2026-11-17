# Kế hoạch FE web: soạn, lưu, xuất bản và đọc truyện thật

Cập nhật 13/11/2026. Kế hoạch đang mở, chưa nghiệm thu. Baseline hiện tại ở [Content Manager](../roles/CONTENT_MANAGER.md) và [contract API](../api/CONTRACTS.md); không làm lại codec/adapter đã có.

**Recheck 17/11:** suite CM 17/17 và hai reader checks qua; lint/build thành công. Đây là kiểm chứng FE/intercept, không có runtime mới. Parent browser trước đó mở truyện Tôn giáo nhưng không có trang Active: live trả 3 Draft. Chưa mutation nội dung runtime; publish lifecycle còn chờ Backend/người dùng. Reader đã nối vocab/quiz practice; migration media/mock-slot có checkpoint và lưu learning log còn mở. Chi tiết duy nhất ở ma trận [Content Manager](../roles/CONTENT_MANAGER.md); các đoạn baseline 13/11 bên dưới mang tính lịch sử, không dùng để kết luận reader còn bỏ CompositionJson.

## 1. Phạm vi và quyết định

- Backend quyết định endpoint, DTO, quyền truy cập và lifecycle. FE dùng API có thật; thiếu capability được ghi thành request cụ thể.
- FE web sở hữu CompositionJson v1. Mobile phải triển khai theo tài liệu FE, không cần Mobile phê duyệt trước khi FE tiếp tục.
- Kết quả đợt này: Content Creator soạn và lưu dữ liệu server; xuất bản vào catalog; reader web đọc đủ bố cục từ dữ liệu server trên trình duyệt sạch. Mobile nhận cùng format và bộ ví dụ để triển khai.
- Reader web hiện có là `/parent/library/:storyId/read`. Đây là luồng gia đình trên web; không tự mở quyền Content Manager cho Parent/Child.
- Bản phát hành đầu dùng nhân vật mặc định của template và một narration mỗi trang. Có thể phát nhiều nguồn nếu đã có URL durable hợp lệ, nhưng không quảng bá upload nhiều file khi chưa có API phù hợp.
- Cá nhân hóa nhân vật theo từng bé là hạng mục sau, cần contract riêng về mapping template slot sang nhân vật của bé. Không đồng nhất publish template với tạo truyện cá nhân hóa.
- Gỡ nút/luồng demo khỏi giao diện sản phẩm chính sau khi migration được nghiệm thu. Giữ bản sao local cũ và công cụ phục hồi trong khu vực quản lý dữ liệu; không xóa IndexedDB/localStorage hàng loạt.
- Analytics, kho asset nâng cao và lịch sử phiên bản không chặn MVP đọc thật. Phải công bố đúng giới hạn chỉnh sửa truyện đã xuất bản nếu Backend chưa tách draft khỏi bản phát hành.

## 2. Bằng chứng hiện có và phần chưa biết

**Cập nhật Parent 14/11:** Swagger live vẫn `/storypage-template/pages/{storyId}` (Parent HTTP 200); giữ route này theo người dùng. `parentReaderModel` đã hydrate composition/roles/slots; `ParentReaderStage` dùng chung renderer/animation/audio với editor và dùng chung giữa catalog preview/reader. Intercept v1/null subtitle/seek/unknown version đã qua. Không đọc local overlay. Còn nghiệm thu dữ liệu v1 thực, published hierarchy/quyền BE, quiz/vocab và lưu learning log; xem [Parent](../roles/PARENT.md). Baseline 13/11 ngay dưới đây là lịch sử trước thay đổi này.

Source đã có codec và page write/read-back, server preview tách overlay, publish endpoint. Build được báo cáo ở lượt cũ, chưa chạy lại ngày 13/11. Chưa có bằng chứng API runtime/reader sạch hoặc Mobile.

`parentCatalogService.mapPage` hiện bỏ CompositionJson; `ParentStoryReaderPage` chỉ dựng ảnh/text/audio cơ bản. Đó là phần FE chắc chắn còn thiếu. Lỗi upload 403 trong ảnh người dùng là bằng chứng lịch sử, chưa đủ để kết luận quyền Backend hiện tại vẫn lỗi. Snapshot API dùng làm baseline là 12/11; tải lại khi bắt đầu triển khai và ghi delta, không coi snapshot là API live mãi mãi.

BE local hiện dùng `/storypage-template/published/{storyId}` cho Parent/Child, khác path FE `/pages/{storyId}`; publish chỉ đổi story Active. WEB01 phải xử lý khác biệt này trước khi nghiệm thu. Upload background-image chỉ nhận claim `content manager`. Rà chi tiết DOC-API-01/02 và PUB-01.

## 3. Jobs và điều kiện hoàn thành

### WEB01 — khóa baseline và ranh giới API (P0)

Đọc AGENTS áp dụng, trạng thái git, modes và Swagger mới. Lập bảng action → caller → service → method/path → payload → nguồn dữ liệu server/local. Đối chiếu cả Content và Parent catalog/reader. Đặc biệt xác minh quyền đọc role/slot, quiz, vocabulary và composition bằng tài khoản đọc; không dùng token Content Manager để kết luận reader hoạt động.

Đầu ra: capability matrix và danh sách delta so với audit 12/11. Thiếu quyền hoặc DTO ghi vào request BE; tiếp tục các job độc lập bằng intercept đúng contract.

### WEB02 — hoàn thiện và đóng băng format v1 (P0; sau WEB01)

Files: `storyComposition.js`, `models.js`, utilities animation/audio/subtitle, `CONTENT_COMPOSITION_V1.md`.

- Rà schema và codec theo hành vi, không chỉ theo build. Sửa mọi mâu thuẫn giữa tài liệu và validator, đặc biệt `subtitles: null` dùng rawText, `[]` tắt phụ đề; code validator hiện cần được rà lại vì đang yêu cầu arrays cho subtitles.
- Bảo toàn unknown fields trong object con/array theo ID; xóa entity không hồi sinh từ JSON cũ. Manifest phải thu thập cả asset override của slot, không chỉ ảnh phụ/audio/nền.
- Chuẩn hóa native/asset/inherit/none; narration DTO so với audioTracks; ID, ms, geometry, anchor, layer, flip. Migration sequence một lần. Validate target, thời gian và overlap theo thuộc tính.
- Khóa malformed/unknown version khỏi ghi đè; cho export raw để phục hồi.
- Tạo fixtures legacy, đầy đủ v1, null/[], unknown fields/version và orphan references. Fixture tài liệu đang dùng URL `.test` chỉ là minh họa, không dùng làm bằng chứng media chạy thật.

Qua job: codec round-trip bảo toàn ý nghĩa, lỗi có entity/fieldPath, không serialize blob/data URL, format có bảng preset và quy tắc playback đủ để Mobile hiện thực độc lập.

### WEB03 — model đọc dùng chung và reader web (P0; sau WEB02)

Files: `parentCatalogService.js`, `ParentStoryReaderPage.jsx`, `ParentLibraryPage.jsx`, `StoryPageRenderer.jsx`, hooks và module shared mới nếu cần.

- Giữ CompositionJson khi map page; hydrate bằng codec chung. Chuẩn hóa asset manifest, page background/narration và role/slot từ endpoint được cấp quyền đọc.
- Tách renderer và playback dùng chung khỏi dependency editor/auth Content Manager. Editor preview và reader tiêu thụ cùng read model; reader không import overlay/mock store hoặc gọi all-pages authoring để vượt quyền.
- Reader dựng đầy đủ nền, ảnh phụ, nhân vật, animation, phụ đề bên trong khung; không nhãn SKETCHTALE, không dòng demo.
- Play/pause/replay/seek, mute/volume, tự chuyển trang theo duration thống nhất; xử lý autoplay rejection, audio metadata/load failure; dispose player khi đổi trang, truyện hoặc account.
- JSON lỗi/version lạ hiển thị lỗi có thể hiểu được; không âm thầm cho rằng truyện chỉ có ảnh nền. URL hỏng không thay bằng ảnh fixture.
- Catalog detail preview và reader phải thống nhất dữ liệu; không tạo một reader riêng chỉ hoạt động với local demo.

Qua job: cùng một response dựng cùng bố cục ở editor saved preview và reader; context sạch không seed local vẫn đọc được. Nếu reader không có API đọc slot hợp lệ, ghi blocker BE chính xác thay vì nhúng credential authoring.

### WEB04 — save queue và xác nhận server (P0; sau WEB02)

Files: `StoryPagesPage.jsx`, `contentService.js`, save-state hooks, cache keys.

- Một hàng đợi mutation theo story/page bao gồm autosave, manual, upload và extension writes; serialize thao tác phụ thuộc, chống ghi đè từ callback cũ.
- Capture snapshot và baseline cho mỗi save; edits phát sinh khi request pending vẫn dirty. PUT text-only giữ composition, replace dùng JSON mới, đọc lại semantic trước khi clear đúng recovery fields đã gửi.
- Phân biệt lỗi trước mutation, accepted nhưng refresh lỗi, timeout/outcome unknown. Chỉ retry GET khi biết mutation accepted; không POST lại quiz/slot sau lỗi làm mới.
- Rà slot extension: giữ unknown fields và giá trị extension cũ không sửa; delete dọn target; quiz move/add/delete có partial-state và phục hồi cụ thể.
- Dirty/pending của metadata/pages/roles/quiz/vocabulary phải cùng chặn publish. Giữ lỗi tại form và hành động tải lại/khôi phục rõ ràng.

Qua job: không mất edits trong lúc lưu; không báo đã lưu server với local-only; lỗi không tạo entity trùng. Preflight chưa được coi là atomic conflict protection.

### WEB05 — media durable và migration truyện cũ (P0; sau WEB03–04)

Files: `assetService.js`, `localAssetStore.js`, `contentMockOverlay.js`, AssetPicker và recovery UI.

- Kiểm tra upload background qua page file, role qua role file, ảnh phụ qua upload được BE xác nhận dành cho CM. Không fallback endpoint khác khi 403.
- Lập inventory cho từng truyện: remote resolved, local bytes, missing bytes, mock slot, URL hết hạn/hỏng. UI cho xem kế hoạch phục hồi trước khi áp dụng bản local thiếu baseline.
- Backup snapshot trước migration. Upload media → tạo/map entity thật → thay references ở image/slot/clip/audio → PUT → GET xác nhận → chỉ xóa recovery đã đồng bộ. Lưu tiến trình và ID đã tạo để resume không tạo trùng sau reload.
- Local mock slot phải map sang slot ID thật; không serialize target mock. Nếu không đủ dữ liệu tạo entity, giữ recovery và chỉ rõ đối tượng cần xử lý.
- Một narration server theo page; nhiều file chỉ local thì báo đúng track chưa đồng bộ và chặn publish. Không overwrite narration nhiều lần để giả kho audio.
- Chọn cover từ kho phải có đường ghi thật tương ứng, không giữ coverAssetId local rồi báo đã lưu. Gỡ nền bằng mode none là gỡ khỏi render, không tuyên bố xóa bytes cloud.

Qua job: truyện cũ được chuyển có thể mở từ browser sạch; migration thất bại vẫn mở được bản backup; không còn local reference trong truyện đạt chuẩn xuất bản.

### WEB06 — publish, catalog và quyền đọc (P0; sau WEB03–05)

- Flush tất cả form, chờ uploads/queue, GET server sạch, validate media/targets/quiz/text, rồi gọi publish và GET xác nhận.
- Đọc lại bằng tài khoản reader: truyện xuất hiện catalog, thứ tự trang đúng, nội dung Active đầy đủ. Xác minh publish có chuyển trạng thái page/role/slot không; không tự PUT Active hàng loạt khi chưa có contract.
- Sửa workflow delete/reorder theo server read-back; chặn xóa page còn quiz gắn kèm, cleanup selection/draft/undo. Rà lỗi trước đây của mini slides và xóa trang.
- Nếu publish thay đổi bản đang đọc trực tiếp, tạm khóa sửa nội dung đã phát hành trong UI sản phẩm cho tới khi có workflow sửa hợp lệ; đây là quy tắc FE và không thay được enforcement Backend.
- Hide theo API hiện hữu, xác nhận truyện không còn truy cập từ catalog theo quy tắc BE. Không gọi hide là rollback/version.

Qua job: hoàn thành một hành trình soạn → lưu → publish → catalog → reader sạch; không cần nút demo hay quyền editor ở phía đọc.

### WEB07 — quiz, vocabulary và trải nghiệm gia đình (P1; sau WEB03/06)

- Đọc vocabulary/quiz qua quyền reader được BE xác nhận. Hiển thị quiz đúng trang theo extension; quiz không có page là cuối truyện.
- Không hiển thị đáp án trước khi trả lời. Phân biệt tương tác đọc thử trên web với kết quả học tập lưu server; chỉ gửi kết quả khi có API nhận đúng ChildProfile và quyền sở hữu.
- Nếu API reader trả cả correct index, ẩn UI không được gọi là bảo mật đáp án. Quyền scoring/DTO cần BE xác nhận nếu đây là bài đánh giá thật.
- Giữ feedback theo page trong CompositionJson; không giả Backend scoring đã đọc extension. End-of-story feedback không lưu được thì không báo thành công.
- Loading/empty/partial error, retry, keyboard/touch, responsive 1366/768/390; caption nhỏ, trắng, dễ đọc, không tràn hình.

Qua job: reader không phụ thuộc local draft; trạng thái quiz và log không bị gán nhầm account/bé.

### WEB08 — bỏ demo khỏi sản phẩm chính (P1; sau WEB05–07)

- Chỉ giữ các hành động Lưu, Xem trước bản đã lưu, Xuất bản trong luồng chính; chuyển backup/recovery sang vị trí riêng.
- Real mode không gọi mock khi API lỗi; audit env và query/storage keys theo user/mode/story. Xóa cache dữ liệu nhạy cảm đúng lúc logout, không xóa backup của user khác.
- Không sửa mất các lựa chọn UI đã duyệt: nền ở trên, nút thu gọn mũi tên, button cùng chiều rộng, tên file một dòng, ảnh tĩnh không có lane animation, không trim audio/banner demo.

Qua job: người dùng hoàn thành công việc mà không cần biết mock/demo, mọi trạng thái lưu phản ánh đúng nơi dữ liệu tồn tại.

### WEB09 — nghiệm thu và bàn giao Mobile (P0 để phát hành)

- Unit tests codec/media references/migration và playback math; stateful API intercept cho save/read/reload, race edits khi PUT pending, upload fail, accepted/readback fail, conflict, partial quiz/slot writes.
- E2E browser sạch: tạo story test hai trang, upload media thật được phép, subtitle/preset/path/keyframes, một narration có start/volume, quiz/vocab, reorder/delete, reload, publish, đọc bằng quyền reader.
- Dùng môi trường và truyện test; không xuất bản/xóa truyện thật để thử. Nếu chưa có môi trường phù hợp, hoàn thành intercept và ghi runtime pending; không tuyên bố đã nghiệm thu sản phẩm.
- Chạy lint/build và suites liên quan; tách lỗi nền khỏi lỗi mới, không coi build là bằng chứng lưu DB.
- Bàn giao Mobile: schema, mapping DTO → domain, thứ tự resolve assets, duration/playhead, presets/keyframes/path, quiz placement, behavior version lạ và bộ fixtures có kỳ vọng hình/thời gian. Mobile triển khai theo format này.
- Báo cáo mỗi job: source-wired / verified-intercept / verified-runtime / blocked và evidence tương ứng.

## 4. Thứ tự thực hiện

WEB01 → WEB02 → WEB03 + WEB04 → WEB05 → WEB06 → WEB07 → WEB08 → WEB09. Tests cần thiết được bổ sung trong từng job; WEB09 là vòng tổng nghiệm thu. Khi một phần bị BE chặn, hoàn thiện phần FE có thể thực hiện và chuyển sang job độc lập, không bypass quyền hay bịa API.

## 5. Điều kiện phát hành

1. Truyện đạt chuẩn server không có blob/data/mock-only reference và không cần storage từ máy tác giả.
2. Reader đúng quyền dựng được đủ hình, nhân vật, animation, subtitle và âm thanh sau reload trên context sạch.
3. API failures không làm mất bản chỉnh sửa hoặc tạo entity trùng; publish chờ lưu đủ.
4. Trạng thái publish/catalog và giới hạn sửa bản đã phát hành được xác nhận rõ.
5. Các phần chưa có BE được giới hạn trong UI đúng khả năng; Mobile có đủ tài liệu để tiêu thụ v1.

Yêu cầu Backend nằm trong [contract đã đối chiếu source](../api/CONTRACTS.md) và [backlog](../BACKLOG.md). Đây là yêu cầu xác nhận/capability, không khẳng định mọi mục đều cần endpoint mới.
