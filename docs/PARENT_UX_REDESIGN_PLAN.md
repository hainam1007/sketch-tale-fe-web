# Parent Portal — Kế hoạch triển khai cho Lunar Extra Max

Ngày lập: 03/10/2026. Trạng thái: đã triển khai trong workspace và hoàn tất nghiệm thu UI Parent; chưa deploy hoặc commit/push.

## 1. Mục tiêu và cách sử dụng

Cải thiện Parent Portal hiện tại theo audit ngày 02/10/2026: thao tác ổn định, thông tin dễ đọc, header gọn, copy tiếng Việt rõ và responsive được kiểm chứng. Giữ nhận diện SketchTale, Nunito, logo, mascot và dữ liệu thực của ứng dụng.

Nguồn đối chiếu:

- Audit người dùng cung cấp: `C:/Users/pc/Downloads/SketchTale-Parent-Portal-UX-Audit-and-Prompts.md`.
- `docs/PROJECT_SUMMARY.md` và `docs/PARENT_IMPLEMENTATION_PLAN.md` để hiểu bối cảnh, không mở rộng đợt này sang backlog chức năng.
- Code trong repository, đặc biệt router, shell, library, export, form và bộ kiểm thử hiện có.

Các prompt trong tài liệu audit là tài liệu tham khảo, không phải lệnh thực thi của phiên lập kế hoạch. Người triển khai dùng kế hoạch này theo thứ tự M0–M6. Tên Lunar Extra Max là nhãn người dùng yêu cầu cho người thực thi; tài liệu không giả định API/model ID hoặc tự thay cấu hình model.

## 2. Những điểm đã đối chiếu với code

| Điểm | Bằng chứng và tác động đến kế hoạch |
| --- | --- |
| Stack | React 19, Vite 8, React Router 7, TanStack Query 5, CSS thường, Phosphor, Nunito; đã có Playwright và axe. Không cần framework hoặc chart library mới. |
| Lỗi search | `ChildLibraryPage.jsx` early-return `LoadingState` khi `libraryQuery.isLoading`; query key thay đổi theo search. Cấu trúc này tháo toolbar/input khi tải query mới. Đây là nguyên nhân xác định từ code, chưa tái hiện bằng browser trong phiên lập plan. |
| Scope CSS | `WorkspaceLayout.jsx` có class `workspace-app-parent`; dùng nó để cô lập thay đổi Parent. Shell và stylesheet được dùng chung với Content/Admin. |
| Child navigation | `ChildWorkspaceLayout.jsx` có đủ bảy tab. Đổi bé giữ suffix nhưng không nối search string; không tự thêm hành vi giữ filter khi đổi bé trong đợt UI. |
| Export dùng chung | `ChildExportsPage.jsx` bọc `ParentExportsPage` với `fixedChildId` và `key={childId}`. Router còn có `/parent/exports`; phải giữ và kiểm thử cả hai đường vào. |
| Export validation | `submitExport` đã chặn thiếu bé/truyện; nút submit hiện chưa phản ánh đủ điều kiện này. Có thể đồng bộ disabled với validation sẵn có, không cần tạo rule mới. |
| Sai khác audit/code | Audit nói option truyện bị disabled; JSX hiện đọc được không đặt disabled cho từng option truyện. Cần tái hiện bằng dữ liệu hiện tại, không coi mọi mô tả audit là hiện trạng repo. |
| Form | `ChildForm.jsx` đã có dirty state, aria-invalid và xác nhận rời form. Tận dụng chúng, không dựng lại luồng lưu/hủy. |
| Token | `tokens.css` có vàng `#f7bd35`, kem `#fff9ec`, chữ `#001050`. Màu audit là gợi ý; không thay toàn bộ global token chỉ để khớp mã màu. |
| Tests | Có parent, child-dashboard, parent-sensitive-role, g4–g7. Một số assertion dựa vào H1/copy cũ; cập nhật theo UX mới nhưng giữ kiểm chứng nghiệp vụ. |

Không tìm thấy `AGENTS.md` qua danh sách file repo trong phiên đọc. Trước triển khai vẫn kiểm tra lại hướng dẫn áp dụng trong môi trường thực thi.

## 3. Phạm vi và nguyên tắc giữ nguyên

Được sửa: JSX trình bày, CSS, copy, accessibility, focus, loading boundary, trạng thái nút phản ánh validation hiện có, tests hồi quy liên quan.

Giữ nguyên endpoint/payload/response, query key và query schema, auth/guard/permission, entitlement, quota, polling/retry/idempotency, cách tính progress/quiz, dữ liệu fixture và asset nguồn. Không thêm billing, liên kết bé, route đọc truyện, backend hoặc chức năng Mobile/Admin/Content.

Các bất biến phải kiểm chứng:

- Dữ liệu, thao tác và cache luôn đúng user/childId; không hiển thị nội dung riêng của bé cũ dưới tên bé mới.
- Quyền sử dụng vai độc lập với duyệt phiên bản; không gộp mutation.
- `allowedCategories: []` vẫn là không giới hạn; thời gian không giới hạn vẫn giữ giá trị hiện có.
- Null khác 0; không tính lại quiz, tự bù ngày hay đổi thứ tự API.
- Default range dashboard/progress và hành vi URL hiện tại không đổi.
- Quota lấy từ nguồn tài khoản hiện có; không hardcode số liệu audit hoặc lấy hạn mức marketing thay entitlement.
- Không suy đoán phí/lượt retry, nghĩa reset date hoặc lý do không đủ điều kiện khi contract chưa cung cấp.

## 4. Kế hoạch theo chặng

### M0 — Baseline và bản đồ thay đổi

Đọc `package.json`, `src/app/App.jsx`, `src/app/layouts/WorkspaceLayout.jsx`, `workspace.css`, `src/styles/tokens.css`, `src/features/parent/parent.css`, các trang Parent và `src/features/profile/`.

Đọc service/model/queryKeys/mock để hiểu contract, không chỉnh chúng theo thiết kế. Kiểm tra git diff và giữ thay đổi có sẵn của người dùng. Đọc các test liên quan trước khi đổi heading/copy.

Chạy baseline lint/build và nhóm tests Parent bên dưới; ghi lỗi có sẵn riêng. Chụp màn hình hiện tại cho dashboard, library, approvals, exports ở desktop/mobile bằng dữ liệu local. Xác nhận các chênh lệch giữa audit và repo, đặc biệt export option.

Đầu ra: danh sách file dự kiến sửa, baseline thật và backlog contract. Không kéo dài M0 thành một đợt audit sản phẩm mới.

### M1 — Sửa tương tác và diễn giải P1

Files: `src/features/parent/pages/ChildLibraryPage.jsx`, `ParentExportsPage.jsx`, `ChildSettingsPage.jsx`, `ChildApprovalsPage.jsx`; CSS Parent khi cần.

1. Library: giữ page header và toolbar trong cùng cây DOM ổn định. Render loading/error/empty/grid bên dưới; tránh đọc `data.items` trước khi có data. Không dùng focus lại bằng effect hoặc thêm debounce để che lỗi unmount. Không thêm placeholder data có thể giữ dữ liệu bé trước. Giữ q/type/page semantics và cách replace history.
2. Search: giữ caret khi gõ/sửa giữa chuỗi; kiểm tra composition tiếng Việt. Không tự thay request lifecycle. Phân biệt thư viện trống, bộ lọc không có kết quả và lỗi mạng; duy trì Xóa bộ lọc.
3. Export: nút tạo phản ánh điều kiện bắt buộc bé/truyện và pending/loading đang có; giữ validation submit làm lớp bảo vệ. Giải thích thiếu lựa chọn hoặc lỗi tải thư viện; không gọi lỗi mạng là thư viện trống. Đối chiếu format/eligibility trước khi thêm bất kỳ điều kiện disabled nào.
4. Settings: dùng “Chủ đề được phép”, status “Hiện cho phép tất cả chủ đề” khi mảng rỗng; giải thích bỏ chọn tất cả. “Đã lưu” cho trạng thái sạch, giữ thông báo chưa lưu/pending/error.
5. Approvals: chia nhãn vùng phiên bản/quyền vai, chỉ hiện vùng quyền vai khi dữ liệu yêu cầu. Không đổi handler, confirm hoặc thứ tự bắt buộc.

Nghiệm thu: gõ liên tục qua nhiều lần tải vẫn focus/caret đúng; không thêm request mutation khi export thiếu lựa chọn; payload settings và hai mutation approval giữ nguyên. Test tương tác chạy được trước khi sang chặng bố cục.

### M2 — Shell và hệ thống hiển thị Parent

Files: `src/app/layouts/WorkspaceLayout.jsx`, `src/app/layouts/workspace.css`, `src/features/parent/layouts/ChildWorkspaceLayout.jsx`, `src/features/parent/parent.css`; reuse `States.jsx` và `StatusBadge.jsx` khi phù hợp.

- Cô lập style dưới `.workspace-app-parent` hoặc class Parent. Không chồng thêm một lớp override cuối file cho mọi lỗi: hợp nhất các rule trùng trong phạm vi đang sửa.
- Sidebar desktop khoảng 240px; content max-width khoảng 1200px, padding desktop 32px, mobile 16px.
- Child header: avatar 40–48px, tên/ngày sinh/select gọn; bảy tab cuộn ngang khi thiếu chỗ. Active tab phải nhìn thấy sau deep link/đổi bé.
- Chọn quy ước một H1 là tên trang tác vụ; tên bé ở context header không tiếp tục là H1. Cập nhật tất cả trang con đồng bộ, kể cả loading/error nếu cần.
- H1 28–32px, section 18–20px, body 15–16px, label 14px, metadata tối thiểu 12px; bảng body tối thiểu 14px. Số liệu dùng tabular figures.
- Tận dụng token hiện có; chỉ thêm biến Parent cần thiết. Card radius 16–20px, control 10–12px, target thao tác khoảng 44px. Màu trạng thái luôn kèm chữ/icon.
- Drawer: kiểm tra và bổ sung Escape, focus trap khi mở, trả focus khi đóng; xử lý khi chuyển sang desktop để không kẹt focus. Vì shell shared, smoke test Content/Admin sau thay đổi.
- Chỉ tách component mới khi có lặp thực tế; không xây design system tổng quát mới cho toàn app.

Nghiệm thu: dữ liệu chính dashboard lên cao hơn, không mất tab, không hai H1, không overflow trang và không thay hình thức shell của role khác ngoài sửa accessibility có chủ đích.

### M3 — Tổng quan, hồ sơ và cài đặt

Files trong `src/features/parent/pages/`: `ParentOverviewPage.jsx`, `ChildrenPage.jsx`, `ChildDashboardPage.jsx`, `NewChildPage.jsx`, `ChildDetailPage.jsx`, `ChildSettingsPage.jsx`; `src/features/parent/components/ChildForm.jsx`.

- Entry: tiêu đề chọn bé rõ, CTA “Thêm hồ sơ bé”; không ghi liên kết nếu route thực chỉ tạo hồ sơ. Không bổ sung thống kê thiếu nguồn.
- Danh sách: hai cột desktop khi đủ chỗ, một cột mobile; avatar/tên/ngày sinh, quota từ data, CTA mở tổng quan và sửa hồ sơ; không nested links/buttons.
- Dashboard: header/filter → việc chờ xử lý → bốn KPI → hoạt động và tóm tắt cài đặt. Bỏ banner navy lớn, giữ thứ tự dữ liệu/range. Đổi nhãn Quiz sang tiếng Việt; phân biệt không có yêu cầu đang chờ với mọi nội dung đã được duyệt.
- Form: một card max-width 720–800px, helper cạnh input; giữ native date/ISO/parser, bỏ icon lịch trang trí dư và thêm ngày diễn giải tiếng Việt. Focus trường lỗi đầu sau submit, nối lỗi qua aria-describedby, giữ cảnh báo thay đổi chưa lưu và route hủy.
- Dùng dirty state hiện có để trình bày khả năng lưu khi phù hợp; không viết lại mutation hoặc reset dữ liệu draft.
- Settings: hoàn thiện layout hai nhóm rõ, đầy đủ trạng thái lưu.

Nghiệm thu: thêm/sửa/reload/hủy vẫn đúng, validation bàn phím dùng được, tên dài không tràn; dashboard 0/null/partial error không bị đổi nghĩa.

### M4 — Phê duyệt, thư viện, tiến độ, bản xuất

Files: `ChildApprovalsPage.jsx`, `ChildLibraryPage.jsx`, `ChildProgressPage.jsx`, `ParentExportsPage.jsx`, `ChildExportsPage.jsx`, CSS Parent.

- Approvals: danh sách 30–34% / chi tiết phần còn lại, mobile xếp dọc. Ảnh trước/sau cùng khung contain. CTA ở gần quyết định, giữ phạm vi bé/nhân vật/phiên bản; sticky chỉ nếu không che nội dung. Giữ confirmation và feedback lỗi.
- Library: nhãn Truyện/Nhân vật rõ, tỷ lệ ảnh phù hợp asset; thống nhất biểu tượng yêu thích. Target 44px, accessible name, thông tin thao tác không phụ thuộc hover. Có thể giữ nút xóa riêng để tránh thêm menu phức tạp; không đổi handler/confirm.
- Progress: filter nổi bật, nhãn cột tiếng Việt, số căn phải, bảng có vùng scroll riêng. Giữ raw data và bảng đầy đủ. Không đưa chart vào scope mặc định vì repo chưa có chart dependency và chart không cần thiết để sửa lỗi audit.
- Export: form 320–360px cạnh lịch sử desktop, một cột mobile. Copy “Tạo bản xuất”, “Đang xử lý”, “Tải xuống”, “Tạo lại”. Quota có phạm vi theo contract; trạng thái completed/processing/expired/failed rõ, progress dùng số thật. Không thay expiry/download/retry/idempotency.
- Giữ `/parent/exports` và route theo bé; wrapper `key={childId}` không được bỏ tùy tiện. Cả hai đường vào có heading/layout đúng.

Nghiệm thu: cả hai quyết định approval độc lập; favorite/hide/delete hoạt động như cũ; range/URL đúng; export create/retry/download và state khi đổi bé không hồi quy.

### M5 — Trang tài khoản và copy còn lại

Files: `ParentPlanPage.jsx`, `ParentReportsPage.jsx`, `src/features/profile/pages/ProfilePage.jsx`, `src/features/profile/profile.css`; navigation nếu có entitlement dùng được.

- Gói: tên gói và quota gọn, bỏ copy server/contract billing. Chỉ hiển thị quyền lợi từ data hiện có. Không diễn giải reset date thành gia hạn nếu field chưa xác định nghĩa.
- Family: giữ entitlement/guard. Trang khóa gọn, link “Xem gói hiện tại” đến `/parent/plan`. Chỉ thêm badge khóa ở menu nếu dữ liệu quyền hiện có đủ; không thêm request chỉ để trang trí badge.
- Profile: Việt hóa nhãn, giảm lặp identity, giữ read-only và nhãn demo trung thực. Không thêm đổi mật khẩu/email. Vì trang shared, kiểm tra role khác và chỉ scope phần thiết kế dành cho Parent.
- Rà copy kỹ thuật còn lại trong phần Parent; giữ thông báo lỗi có ích, không xóa lý do lỗi chỉ để ngắn hơn.

Nghiệm thu: Free/Pro/Family hiển thị đúng theo fixtures/contract thực tế, không CTA giả, profile và navigation role khác không hỏng.

### M6 — Nghiệm thu và bàn giao

Chạy các kiểm tra ở mục 5. Review diff để xác nhận không thay service, model, mock, route, query/permission hoặc lifecycle ngoài phạm vi. Các file này có thể được đọc để xác minh; nếu phát hiện lỗi nghiệp vụ thì ghi backlog riêng.

Bàn giao: danh sách file sửa, thay đổi UX, kết quả lệnh đã chạy, screenshot desktop/mobile, phần chưa xác minh và các bất nhất contract/fixture. Không deploy hoặc commit/push nếu chưa được yêu cầu.

## 5. Kế hoạch kiểm thử

### Lệnh có sẵn trong repo

```powershell
npm run lint
npm run build
npx playwright test tests/parent.spec.js tests/child-dashboard.spec.js tests/parent-sensitive-role.spec.js tests/g4.spec.js tests/g5.spec.js tests/g6.spec.js tests/g7.spec.js
```

Nhóm g4–g7 chứa cả test role khác, hữu ích khi chạm shell shared. `playwright.config.js` dùng Chrome, baseURL `http://127.0.0.1:5173`, tự chạy Vite, mặc định 1366×768; cần `page.setViewportSize` để kiểm tra responsive thật. Không lấy viewport mặc định làm bằng chứng cho mobile.

Đã thêm `tests/parent-ux.spec.js` và `tests/parent-responsive.spec.js` để gom regression tương tác và kiểm tra responsive. Chạy các file này cùng nhóm trên sau khi tạo. Dùng mock/local theo thiết lập test hiện có; không chạy mutation kiểm thử lên tài khoản thật.

### Ca tương tác cần bổ sung hoặc mở rộng

| Ca | Tiêu chí |
| --- | --- |
| Search qua tải chậm | Gõ từng ký tự qua nhiều phản hồi, assert input còn focus và value đúng; sửa giữa chuỗi, clear/type filter vẫn đúng URL. Không chỉ `fill()` một lần rồi chờ kết quả. |
| Tiếng Việt | Kiểm tra chuỗi nhiều dấu/caret; xác minh composition/IME thực bằng thao tác thủ công khi môi trường hỗ trợ, không coi `fill()` là test IME. |
| Đổi bé | Kiểm tra chuyển trong dashboard/library/exports, cả tải chậm và cache; không lộ dữ liệu bé trước. Giữ suffix và hành vi reset/giữ query đúng baseline. |
| Settings | Bỏ mọi chủ đề rồi lưu/reload vẫn không giới hạn; null thời gian không biến thành 0. |
| Approval | Cấp quyền vai không tự duyệt phiên bản và ngược lại; failure/confirmation giữ đúng. |
| Export | Thiếu lựa chọn disabled và không gọi create; valid submit giữ payload, quota/idempotency/retry/download như trước. Có cả route cấp tài khoản và route theo bé. |
| Form | Submit trống focus lỗi đầu; aria gắn đúng; native date/ISO không đổi; dirty/cancel vẫn hoạt động. |
| Progress | 7/30 ngày, null/0, loading/error/empty; không thay số liệu hoặc thứ tự từ nguồn. |
| Drawer | Tab/Shift+Tab không thoát drawer đang mở; Escape đóng và focus trở lại nút menu; resize desktop không kẹt focus. |

Chỉ thêm test hành vi có giá trị, không snapshot hàng loạt hoặc assert class CSS. Nếu copy/H1 đổi, sửa locator và expected text tương ứng; không xóa test hoặc hạ assertion nghiệp vụ để làm pass.

### Ma trận visual

- Width: 1440, 1280, 1024, 820, 800, 768, 390, 375, 360px; dùng chiều cao desktop khoảng 900px và mobile khoảng 844px, thêm 1280×720 cho laptop thấp.
- Mỗi width kiểm tra shell và màn hình rủi ro cao: approvals, library, progress, exports. Các trang còn lại kiểm tra ít nhất desktop/mobile và breakpoint nơi layout đổi.
- Không overflow toàn trang; chỉ tab/bảng trong container riêng được cuộn ngang. Active tab nhìn thấy, Bản xuất luôn truy cập được.
- Tên bé/truyện dài, dấu tiếng Việt, empty/loading/error/disabled. Dùng dữ liệu test riêng; không sửa fixture sản phẩm chỉ để có screenshot đẹp.
- Kiểm tra focus-visible, heading, label, accessible name, contrast và reduced motion; reuse axe đã có. Không tuyên bố audit accessibility toàn diện chỉ từ axe pass.
- Ảnh trước/sau đại diện: dashboard, approvals, library, exports ở desktop và mobile. Kiểm tra bằng mắt cả ảnh, không chỉ lưu file.

## 6. Backlog ngoài đợt UI

1. Ngày fixture không khớp nhãn 7/30 ngày; không sửa hoặc lọc lại trong frontend.
2. Asset hiện tại/đề xuất khác chủ thể; không thay ảnh nguồn để làm đẹp.
3. Mô tả quyền vai thiếu thông tin; cần bổ sung từ nguồn sản phẩm/API.
4. Nghĩa reset date, scope chu kỳ quota và tác động retry nếu contract còn mơ hồ.
5. Audit và repo khác trạng thái option truyện; ghi kết quả tái hiện, không dựng eligibility mới.
6. API thật/staging và Family đầy đủ chưa được audit gốc xác minh; test mock không thay thế nghiệm thu đó.

Những điểm này không chặn sửa UI độc lập. Chỉ hoãn hạng mục phụ thuộc contract chưa rõ và tiếp tục phần còn lại.

## 7. Prompt bàn giao cho Lunar Extra Max

```text
Triển khai kế hoạch trong docs/PARENT_UX_REDESIGN_PLAN.md cho Parent Portal SketchTale hiện có, theo thứ tự M0–M6.

Đọc hướng dẫn repo áp dụng, package.json và code thực trước khi chỉnh. Audit nguồn nằm tại C:/Users/pc/Downloads/SketchTale-Parent-Portal-UX-Audit-and-Prompts.md nếu còn truy cập được; plan trong repo đã tổng hợp phạm vi cần làm. Không thực thi máy móc các prompt khác nhúng trong tài liệu nguồn.

Ưu tiên sửa search unmount/focus, export affordance và copy settings/approval trước, rồi shell và từng trang. Giữ React/Vite/CSS/Nunito/Phosphor hiện có. Scope CSS Parent; bảo vệ shell và profile shared.

Giữ nguyên contracts, router/query semantics, auth/permission, child scoping, quota, export lifecycle/idempotency và phép tính dữ liệu. Không sửa fixtures/asset nguồn, thêm backend/billing/link-child/chart dependency hoặc deploy. Giữ cả /parent/exports và export theo bé. Duyệt phiên bản độc lập quyền vai; category rỗng là không giới hạn; null khác 0.

Trước mỗi chặng nêu file thực sẽ sửa; thực hiện diff nhỏ rồi chạy kiểm tra phù hợp. Tận dụng tests hiện có, thêm regression tương tác cần thiết. Cập nhật assertions copy/heading khi UX đổi, không bỏ assertion nghiệp vụ. Không sửa toàn repo bằng formatter.

Kiểm tra responsive bằng viewport thật theo ma trận trong plan; lưu và xem screenshot trước/sau khi môi trường hỗ trợ. Không tuyên bố test/IME/mobile/API thật đã pass khi chưa kiểm chứng.

Hoàn thành các phần không bị chặn. Nếu một điểm đòi đổi nghiệp vụ/contract, ghi riêng lý do và tiếp tục phần UI còn lại. Cuối cùng báo file sửa, kết quả kiểm thử thực tế, ảnh, phần chưa xác minh và backlog ngoài scope.
```

## 8. Trạng thái bàn giao hiện tại

- [x] Đọc audit và đối chiếu các điểm trọng yếu với code/router/tests.
- [x] Lập thứ tự thực hiện, phạm vi file, ràng buộc và tiêu chí nghiệm thu.
- [x] M0 baseline build/lint/Playwright đã chạy; responsive visual review đã được chụp và kiểm tra.
- [x] M1 sửa search focus, export affordance, settings semantics và approval copy.
- [x] M2 shell Parent gọn hơn và drawer mobile có Escape/focus return/trap.
- [x] M3–M5 copy cấp tài khoản, dashboard/progress/export và trạng thái Family đã cập nhật ở phạm vi UI.
- [x] M6 nghiệm thu đầy đủ viewport Parent, kiểm tra focus/drawer/tab mobile và báo cáo cuối kỳ.

Đã xác minh bằng `npm run lint`, `npm run build`, `git diff --check`, nhóm Playwright Parent/UX và responsive review. Responsive suite kiểm tra dashboard/approvals/library/progress/exports ở 9 viewport (1440, 1280, 1024, 820, 800, 768, 390, 375, 360), không có overflow; screenshot desktop/mobile đã được chụp và kiểm tra trực quan. Tab đang chọn trên mobile tự cuộn vào vùng nhìn thấy sau khi đổi route hoặc đổi hồ sơ bé. Lint còn một cảnh báo Fast Refresh có sẵn ở `src/features/auth/AuthProvider.jsx`; build còn cảnh báo bundle lớn. Full suite trước M6 đạt 29/32; ba lỗi còn lại thuộc Content/Admin ngoài scope (G3 thiếu field preview/quiz, G5 thiếu job monitoring trong fixture), không phát sinh từ thay đổi Parent.
