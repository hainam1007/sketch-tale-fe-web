# Kế hoạch triển khai Parent Portal

> Kế hoạch tổng thể cho cả ba role nằm tại [WEB_IMPLEMENTATION_PLAN.md](WEB_IMPLEMENTATION_PLAN.md). Dùng tài liệu tổng thể để quyết định kiến trúc, thứ tự triển khai và tiến độ; tài liệu này là phân rã tham khảo riêng cho Parent.

Ngày lập: 18/09/2026. Cập nhật scope auth/độ tuổi: **29/09/2026**. Thiết kế lại theo từng hồ sơ trẻ: **01/10/2026**. Phạm vi: kế hoạch và triển khai Web Frontend role Parent; vertical slice đã có mock/API boundary, chưa xác nhận API thật.

**Cách đọc:** mục 1–8 giữ nền tảng nghiệp vụ và milestone tích hợp; **mục 9–15 là đặc tả thiết kế từng trang, migration và backlog hoàn thiện UI/UX**. Vertical slice dashboard theo hồ sơ, route, mock API, approval tách quyền vai nhạy cảm và kiểm thử isolation đã được triển khai; các module còn lại vẫn cần tích hợp API thật và nghiệm thu staging.

Nguồn: `docs/PROJECT_SUMMARY.md`, router, auth và dependencies hiện có trong repository. Đây là kế hoạch đề xuất; endpoint, payload và các quyết định còn mở cần thống nhất với Backend trước khi tích hợp thật.

## 1. Mục tiêu và hiện trạng

**Quyết định sản phẩm:** Parent quản lý thông qua hồ sơ của từng trẻ. Mỗi Child đã liên kết có dashboard riêng, từ đó truy cập cài đặt, phê duyệt, thư viện và tiến độ của chính Child đó. Dashboard là màn phụ huynh xem về trẻ, không phải màn trẻ đăng nhập sử dụng. Không cộng dữ liệu nhiều trẻ thành dashboard gia đình.

Luồng chính: Parent đăng nhập → chọn hồ sơ Child đã liên kết → dashboard của bé → xem hoặc thực hiện tác vụ cho bé → đổi hồ sơ khi cần. Song song, shared auth vẫn phải hỗ trợ Child 6–10 tuổi tự đăng ký → xác minh → đăng nhập vào Mobile App. Hồ sơ quản lý không thay thế tài khoản đăng nhập độc lập của Child.

**Thứ tự ưu tiên:** danh sách/điều hướng hồ sơ và khung dashboard riêng → settings → duyệt nhân vật và quyền vai nhạy cảm → thư viện → tiến độ và số liệu dashboard đầy đủ. Khung dashboard là P0; analytics là P1. Đọc capability/entitlement tối thiểu trước khi mời hoặc quản lý Child; trang gói đầy đủ làm sau. Tích hợp API theo module khi sẵn sàng.

### 1.1. Phân định phạm vi quản lý

| Cấp | Nội dung | Quy tắc |
| --- | --- | --- |
| Tài khoản Parent | Danh sách/liên kết trẻ, hồ sơ Parent, gói và hạn mức, cấu hình email Family nếu có | Không dùng danh sách trẻ làm dashboard học tập tổng hợp |
| Hồ sơ Child | Dashboard, thông tin hồ sơ, cài đặt, phê duyệt, thư viện, tiến độ, bản xuất của bé | URL và request luôn xác định `childId`; mỗi lần thao tác chỉ ảnh hưởng một trẻ |
| Resource | Nhân vật, phiên bản, truyện, yêu cầu duyệt, export job | Backend kiểm tra resource thuộc Child và Parent có quyền quản lý Child đó |

Gói được quản lý tại trang cấp tài khoản nhưng phạm vi quota vẫn do contract quyết định. Nếu quota dùng chung, dashboard chỉ ghi rõ “Hạn mức dùng chung” khi cần; không trình bày như ngân sách riêng của bé. Không thêm chức năng so sánh trẻ, áp dụng cài đặt hàng loạt hoặc chia quota khi chưa có nghiệp vụ.

Các điểm tối ưu so với kế hoạch ban đầu:

- Auth, profile, HTTP, Query provider, guards và UI primitives là công việc shared G1, không xây lại cho Parent.
- Duyệt phiên bản và duyệt vai nhạy cảm cùng một đợt, cùng màn chi tiết nhưng giữ hai trạng thái và hai hành động độc lập.
- Một layout theo Child dùng chung selector và tabs cho settings/approval/library/progress; URL quyết định Child đang xem. Selector chỉ hiển thị các Child đã được liên kết và Backend cho phép Parent quản lý.
- Mock bằng MSW tại biên HTTP theo kế hoạch tổng thể; không duy trì thêm một bộ mock service nghiệp vụ song song.
- Mỗi milestone có task, API đầu vào và điều kiện nghiệm thu; phần export/email chưa có contract được theo dõi riêng.

Rà soát mã nguồn ngày 26/09/2026: đã có React/Vite, JavaScript/JSX, React Router, TanStack Query, CSS tokens, Nunito, Phosphor icons và Playwright/axe. Đã có `AuthProvider`, guards, `WorkspaceLayout`, `ChildWorkspaceLayout`, các trang Parent, services và mock. Scope mới ngày 29/09 yêu cầu bổ sung Child account, registration/login và liên kết Parent–Child; các phần này chưa được coi là đã triển khai chỉ vì auth mock hiện có. Việc có code/mock không chứng minh API thật hoặc nghiệp vụ đã được nghiệm thu; đợt cập nhật tài liệu này chưa chạy ứng dụng để kiểm chứng giao diện.

Kế hoạch giữ một SPA và convention JavaScript/JSX hiện tại. Không triển khai luồng vẽ, tạo nhân vật AI, đọc truyện tương tác hay làm quiz của trẻ trên Parent Portal; các luồng đó thuộc Mobile App.

## 2. Phạm vi ưu tiên

| Mức | Module | Kết quả cần đạt |
| --- | --- | --- |
| Shared G1 | Auth và phân quyền | Parent/Child login/logout, Child registration/verify, khôi phục phiên, guard; forgot/reset theo contract |
| P0 | Parent shell và dashboard cơ bản | Chọn hồ sơ, dashboard riêng có lối vào tác vụ, trạng thái tải/lỗi, 403/404 |
| P0 | Hồ sơ Child đã liên kết | Danh sách, xem và sửa; flow tạo/link account chỉ bật theo relationship contract |
| P0 | Cài đặt của bé | Giới hạn thời gian/ngày, category được phép |
| P0 | Phê duyệt nhân vật | Xem tranh gốc và phiên bản cần duyệt, chấp nhận/từ chối |
| Shared G1 | Hồ sơ phụ huynh | Tái sử dụng `/profile`, không tạo form riêng trong Parent |
| P1 | Số liệu dashboard và tiến độ | Tổng quan, lịch sử đọc, từ vựng, kết quả quiz chỉ của bé đang xem |
| P1 | Thư viện | Nhân vật/truyện, lọc, yêu thích, ẩn và xóa theo bé |
| P0 | Vai nhạy cảm | Làm cùng luồng approval; phê duyệt một lần cho từng nhân vật, tách khỏi duyệt phiên bản |
| P0/P1 | Gói và hạn mức | P0 đọc entitlement/quyền của account; P1 trang gói/usage đầy đủ |
| P2 | Xuất truyện | Tạo job, theo dõi, tải file khi định dạng/API được chốt |
| P2 | Báo cáo học tập Family | UI trạng thái/cấu hình nếu contract yêu cầu; email định kỳ do Backend gửi |

Thanh toán thật, bulk action và biểu đồ nâng cao chưa nằm trong đợt triển khai đầu. Duyệt vai nhạy cảm vẫn là chức năng phải hoàn thành; trước khi có nó, hệ thống không được tự cấp quyền dùng vai nhạy cảm.

## 3. Sitemap đề xuất

| Route | Màn hình |
| --- | --- |
| `/auth/login` | Đăng nhập dùng chung |
| `/auth/register` | Đăng ký Parent hoặc Child theo auth flow/role được Backend cho phép |
| `/auth/verify` | Xác minh tài khoản; đề xuất, chưa có route hiện hành |
| `/auth/forgot-password` | Yêu cầu đặt lại mật khẩu |
| `/auth/reset-password` | Đặt lại mật khẩu; đề xuất, chưa có route hiện hành |
| `/profile` | Hồ sơ người dùng đã đăng nhập |
| `/parent` | Entry: chờ session/danh sách, một bé thì vào dashboard bé đó; nhiều hoặc chưa có bé thì về danh sách |
| `/parent/children` | Danh sách Child đã liên kết |
| `/parent/children/new` | Mời/liên kết Child; chỉ tạo profile/account nếu contract cho phép |
| `/parent/children/:childId` | Chi tiết/sửa hồ sơ Child đã liên kết |
| `/parent/children/:childId/dashboard` | Dashboard riêng của bé; điểm vào mặc định khi chọn hồ sơ |
| `/parent/children/:childId/settings` | Thời gian và nội dung được phép |
| `/parent/children/:childId/approvals` | Phê duyệt nhân vật/vai nhạy cảm |
| `/parent/children/:childId/library` | Thư viện của bé |
| `/parent/children/:childId/progress` | Tiến độ học tập |
| `/parent/plan` | Gói đang dùng và hạn mức; đã có route |
| `/parent/children/:childId/exports` | Tạo/theo dõi bản xuất chỉ của bé, P2 |
| `/parent/reports` | Cấu hình/trạng thái email Family cấp tài khoản nếu contract hỗ trợ, P2 |
| `/parent/exports` | Route cũ: điều hướng tương thích theo mục 15; không tiếp tục là danh sách job của mọi bé |

Parent shell có sidebar, header tài khoản và bộ chọn Child tại những màn hình theo Child. URL là nguồn xác định `childId`; đổi Child giữ module hiện tại nếu phù hợp, đồng thời tải lại đúng dữ liệu. Khi chưa có Child được liên kết, hiển thị hướng dẫn kết nối tài khoản Child; không mặc định rằng Parent được tạo account thay Child.

Điều hướng cấp tài khoản gồm **Hồ sơ các bé**, **Gói và hạn mức**, **Báo cáo Family** khi sẵn sàng. Trong workspace của một bé dùng nav **Tổng quan → Cài đặt → Phê duyệt → Thư viện → Tiến độ → Hồ sơ**, bổ sung **Bản xuất** ở P2. “Tổng quan” luôn trỏ đến dashboard của bé hiện tại, không có hai mục Tổng quan cạnh tranh ở hai cấp. Giữ route chi tiết hồ sơ hiện tại để không đổi ý nghĩa các deep link cũ.

Quy tắc điều hướng:

- Chưa có Child liên kết: hiện CTA mời/liên kết; không tự chọn `childId` giả hoặc gọi API nghiệp vụ thiếu ID.
- Có một Child: `/parent` chuyển bằng replace đến dashboard của bé sau khi kiểm tra quyền; `/parent/children` luôn mở danh sách khi truy cập trực tiếp.
- Nhiều Child: `/parent` mở danh sách để chủ động chọn; chưa lưu bé truy cập gần nhất trong MVP. Sau liên kết được xác nhận có thể mở dashboard bé vừa liên kết; trạng thái chờ xác nhận chưa được mở workspace.
- Nhiều Child: hiện tên/avatar rõ ở tiêu đề và selector. Đổi Child giữ tab, reset pagination/filter không tương thích và đóng detail của Child cũ.
- Đang sửa form: đổi bé/tab phải xử lý thay đổi chưa lưu. Nếu ở lại thì giữ nguyên URL và selection.
- Deep link sai/không có quyền: hiển thị trạng thái theo response; không âm thầm chuyển sang bé khác.
- Danh sách lớn dùng pagination và filter trên URL; chỉ thêm search/debounce nơi có nhu cầu, không thêm cho danh sách tối đa năm bé.

Guard cần chờ khôi phục phiên trước khi quyết định redirect. Chưa đăng nhập thì chuyển về login, lưu đường dẫn nội bộ để quay lại; sai role thì hiển thị 403. Backend kiểm tra quyền sở hữu hoặc quan hệ liên kết Child/resource cho mọi request; guard chỉ điều khiển trải nghiệm UI.

## 4. Tổ chức code và dữ liệu

Cấu trúc đề xuất, tạo dần theo module được triển khai:

```text
src/
  app/
    App.jsx
    providers/AppProviders.jsx
    layouts/WorkspaceLayout.jsx   # Shell dùng chung theo cấu hình role
    router/RequireAuth.jsx
    router/RequireRole.jsx
  components/
    ui/
    forms/
    feedback/
  features/
    auth/          # AuthProvider, trang auth, service, session
    profile/       # Hồ sơ tài khoản dùng chung
    parent/        # Dashboard, menu Parent, ChildWorkspaceLayout/selector
    children/      # Danh sách, form, chi tiết, settings
    approvals/     # Duyệt phiên bản và quyền vai nhạy cảm
    library/       # Thư viện cá nhân của bé
    learning-progress/ # Reading, vocabulary, quiz
    subscriptions/ # Gói và usage; không payment
    exports/       # P2
  lib/
    api/           # HTTP client, chuẩn hóa lỗi, adapter mode
    permissions/   # Role constants, capability helpers
  mocks/           # MSW handlers, fixtures, scenarios theo domain
```

- Tiếp tục dùng CSS tokens hiện có; đề xuất CSS Modules cho màn hình mới để giảm xung đột CSS với public website.
- TanStack Query đã có cho server state. React Hook Form + Zod và Vitest + Testing Library là đề xuất chưa có trong dependencies; chỉ bổ sung khi công việc cụ thể cần, không bắt buộc đổi form hiện có để làm UI.
- Component gọi hook → service → HTTP client chung. MSW intercept HTTP trong dev/test; chỉ bật mock ở môi trường được chỉ định, không fallback mock khi API production lỗi. Không cần refactor public service chỉ để bắt đầu Parent.
- Dùng JSDoc cho payload, response và enum quan trọng. Model tối thiểu: session/user, child profile, child settings, character/version/approval, library item, progress, entitlements và export job.
- Query key chứa account và child khi phù hợp, ví dụ `['children', userId]`, `['approvals', userId, childId, filters]`. Xóa cache riêng tư khi logout/đổi tài khoản; hủy request cũ và tránh hiển thị dữ liệu bé trước khi đổi bé.
- Sau mutation, cập nhật hoặc invalidate các query liên quan. Duyệt/xóa chỉ hiển thị thành công sau phản hồi server; khóa nút trong khi gửi để tránh gửi trùng.
- Không chọn cơ chế lưu token trước khi có auth contract. Session mock phải được phân biệt rõ với xác thực thật, không lưu mật khẩu.
- Cập nhật `RouteEffects` để route động có tiêu đề đúng và quản lý focus; bổ sung route Parent ngoài `PublicLayout`.

Shared G1 cần sẵn sàng trước khi tính Parent milestone đầu: Query/Auth providers, HTTP/error normalization, MSW mode, guards, WorkspaceLayout, FormField, Dialog, Loading/Empty/Error và session fixtures. Nếu chưa có, làm ticket shared trước và tính thời gian vào G1 của kế hoạch tổng thể.

### Quy ước state để tránh lặp dữ liệu

| Loại state | Nơi quản lý |
| --- | --- |
| Session/role | Auth provider dùng chung |
| Bé/tab/filter/page/khoảng thời gian | Route và search params |
| Children/settings/approval/library/progress/entitlements | Query cache, key có account và child khi áp dụng |
| Nội dung form chưa lưu | Form state, không đồng bộ từng phím vào Query cache |
| Dialog/detail selection | Local state gắn với child, reset khi đổi bé |

Không lưu thêm selectedChild toàn cục có thể lệch URL. Chỉ lưu ID ở URL và lấy object từ query. Không tạo global store riêng cho Parent trong đợt đầu.

### Mutation và dữ liệu phải cập nhật

| Mutation | Dữ liệu cần cập nhật/invalidate |
| --- | --- |
| Tạo/sửa bé | Children list, child detail; entitlement usage sau tạo; dashboard liên quan |
| Lưu settings | Settings/detail nếu chứa settings; dữ liệu nội dung hợp lệ theo contract |
| Duyệt phiên bản/quyền vai | Character detail, approval list/count; library nếu phản ánh approval |
| Favorite/hide/delete | Library list/detail của đúng bé; dashboard nếu có số liệu liên quan |
| Tạo export | Export list/detail và usage theo phản hồi server |

Các query key/invalidation đặt trong hook theo domain, không copy vào từng button. Không invalidate toàn bộ ứng dụng sau mỗi thao tác. Cập nhật sau thành công; optimistic favorite chỉ bổ sung khi có rollback và thực sự cần.

## 5. Thứ tự triển khai và tiêu chí hoàn thành

Ước lượng dưới đây chỉ tính phần riêng Parent **sau khi Shared G1 đã sẵn sàng**, gồm mock, UI, logic và test module. Không cộng thêm vào tổng kế hoạch Web; đây là phân rã công việc đã có trong đó. API thật được tích hợp ngay khi sẵn sàng; thời gian sửa do lệch contract/chờ dịch vụ không nằm trong ước lượng này.

| Milestone | Backlog tổng thể | Công việc | Ngày công | Thuộc giai đoạn Web |
| --- | --- | --- | --- | --- |
| M1 | P-01, khung P-07, phần entitlement của P-08 | Child workspace, list/link/edit, dashboard cơ bản và quyền quản lý | 4–5 | G2 |
| M2 | P-02/P-03/P-04 | Settings, duyệt phiên bản và vai nhạy cảm | 4–5 | G4 |
| M3 | P-05 | Library truyện/nhân vật và thao tác cá nhân | 2–3 | G4 |
| M4 | Phần còn lại P-08 | Trang gói, usage, reset và thông báo giới hạn | 1–2 | G5 |
| M5 | P-06/phần số liệu P-07 | Progress và số liệu dashboard riêng từng bé | 3–4 | G6 |
| M6 | P-09/P-10 | Export và báo cáo học tập Family theo contract | Chốt sau | G7 |

M1–M5: **14–19 ngày công riêng Parent**, tăng một ngày so với 13–18 để tính việc tách dashboard/entry và kiểm thử đổi hồ sơ. Đây là ước lượng lập kế hoạch, không phải số ngày còn lại của working tree hiện tại. P2, migration export và phát sinh tích hợp chưa nằm trong tổng này. Shared chưa có thì thực hiện G1 trước; lịch tổng thể được hiệu chỉnh sau G2.

### M1 — Child đã liên kết và entitlement tối thiểu

- Tạo cấu hình menu Parent trên shell chung; ChildWorkspaceLayout kiểm tra quan hệ liên kết và cung cấp selector/tabs.
- Đưa dashboard cơ bản vào child workspace ngay M1: tên bé, lối vào module đã sẵn sàng, trạng thái chưa có hoạt động. Module chưa triển khai không có nút dẫn vào placeholder; không tạo số liệu mẫu để lấp khung. Entry xử lý rõ 0/1/nhiều bé.
- `ChildForm` dùng chung view/edit: tên hiển thị, ngày sinh date-only, avatar có sẵn là đề xuất tối thiểu. Chưa làm upload avatar riêng trước khi có nhu cầu/contract.
- List/detail/update Child đã liên kết. Flow create/link/invite là một nhánh riêng, chỉ bật sau khi chốt relationship contract; không tự tạo tài khoản Child từ Parent UI.
- Entitlement/quyền quản lý lấy từ server, không suy ra chỉ từ tên gói. Nếu chưa tải được entitlement hoặc link capability, hiện lỗi/retry thay vì mặc định cho phép thao tác.
- Nếu gói vẫn giới hạn số Child do Parent quản lý, Free 1, Pro 3, Family 5 chỉ là fixture theo cấu hình nguồn; server vẫn là nguồn quyết định.

**Đạt khi:** Parent xem và sửa được Child đã liên kết; deep link không thuộc quan hệ trả 403/404; dữ liệu hai Parent/tài khoản Child không lẫn nhau; link conflict và mất quyền được xử lý rõ. Flow Child tự đăng ký/đăng nhập được nghiệm thu ở shared auth, không đánh dấu hoàn thành chỉ bằng mock Parent profile.

### M2 — Settings và phê duyệt đầy đủ

- Settings có nút Lưu rõ ràng; input thời gian với đơn vị phút/ngày, chọn category, dirty-state. Chưa cần autosave.
- Không hardcode ý nghĩa `0`, `null` hoặc category rỗng; cần contract cho không giới hạn/không cho dùng/không chọn.
- Approval list lọc Pending/Approved/Rejected; một detail hiển thị tranh gốc, phiên bản AI, trạng thái và hành động hợp lệ.
- Duyệt phiên bản gửi ID/revision đang xem. Conflict thì tải bản mới và yêu cầu xem lại; không tự retry chấp nhận bản mới.
- Quyền vai nhạy cảm có field/action riêng, không tự bật sau khi duyệt nhân vật. Recolor phải duyệt version mới; kế thừa quyền vai qua version cần Backend xác nhận.
- Không tự thêm thao tác đảo ngược approval hoặc thu hồi quyền nếu contract chưa hỗ trợ.

**Đạt khi:** settings đọc lại đúng, lưu lỗi giữ form; approval/count nhất quán; gửi trùng bị chặn; duyệt bản cũ không làm bản mới được duyệt. Web chỉ cấu hình/hiển thị usage, không dùng timer tab để thực thi giới hạn mobile.

### M3 — Thư viện

- Tab truyện/nhân vật; dùng metadata card chung khi phù hợp, giữ service và thao tác theo từng resource type.
- Favorite, hide/unhide và delete chỉ trong thư viện bé đang chọn. Dialog xóa ghi đúng phạm vi; soft delete/khôi phục phải theo contract.
- Sau xóa phần tử cuối một trang, điều chỉnh pagination hợp lệ. Lỗi mutation giữ item và hiện retry; không báo thành công trước server.
- Chưa xây lại reader/quiz mobile; chỉ thêm preview nội dung cần cho Parent theo dữ liệu/API đã chốt.

**Đạt khi:** thao tác bé A không đổi bé B hoặc template toàn hệ thống; chuyển tab/filter/deep link đúng; ảnh thiếu hoặc danh sách trống có state rõ.

### M4 — Gói và usage

- Tái sử dụng entitlement query từ M1. Trang gói hiển thị giới hạn/sử dụng/còn lại/ngày reset theo server; xử lý riêng unlimited, unknown và exhausted.
- Phân biệt quota AI/tháng với giới hạn ngày do Parent đặt nếu có. Không tạo nút checkout hoặc cấp gói bằng state client.
- Quyền truy cập Free/premium do server trả; ba truyện public demo không đại diện danh sách năm truyện Free.

**Đạt khi:** số liệu khớp response, ngày reset có timezone rõ; quota không tải được không bị hiển thị thành 0 hoặc unlimited.

### M5 — Tiến độ và số liệu dashboard từng bé

- Progress đọc/quiz/từ vựng theo bé và khoảng thời gian; bảng và số liệu trước, chart chỉ khi cần so sánh xu hướng.
- Tách số lần từ vựng xuất hiện/nghe/trả lời đúng; không suy ra “thành thạo”. Truyện hoàn thành theo sự kiện đọc hết trang cuối từ Backend.
- Dashboard tái sử dụng summary queries hoặc aggregate endpoint **của một childId**. Không tải dashboard gia đình rồi lọc ở client, không mở request cho từng bé để tính tổng.
- Ưu tiên hành động: nhân vật chờ duyệt, hồ sơ/cài đặt và xem tiến độ. Chỉ hiển thị hoạt động gần đây nếu API có.

**Đạt khi:** đổi bé/thời gian không hiện dữ liệu cũ; không có hoạt động khác với lỗi tải; dashboard có partial error và không cản truy cập module đang hoạt động.

### M6 — Export và báo cáo Family

- Export create/list/detail, trạng thái queued/processing/completed/failed theo enum Backend; progress phần trăm chỉ hiện nếu có giá trị thật.
- Polling dừng khi terminal/unmount, có xử lý timeout; refresh lấy lại job. Request tạo job có idempotency nếu Backend hỗ trợ; không tự retry tạo job khi chưa biết request trước đã thành công chưa.
- Tải file thành công, lỗi/hết hạn URL, retry và quota đều theo contract. Free không xuất video; Pro 5 lượt/tháng; Family không giới hạn theo cấu hình nguồn.
- P-10: bổ sung cấu hình/trạng thái báo cáo học tập tháng nếu API yêu cầu. Backend tạo/gửi email; frontend không giả lập gửi thành công. Vị trí dự kiến `/parent/reports` cho cấu hình tài khoản; link từ progress chỉ tới báo cáo riêng khi contract hỗ trợ.

**Đạt khi:** file tải được từ job thật, không tạo trùng hoặc trừ quota hai lần ngoài quy tắc; email/report chỉ đánh dấu tích hợp khi dịch vụ thật có phản hồi kiểm chứng được. Chưa có dịch vụ thì task vẫn pending, không đánh dấu Parent toàn bộ đã xong.

### Ticket bắt đầu ngay sau Shared G1

Mỗi ticket khoảng 0,5–2 ngày; tổng thời gian nằm trong milestone, không cộng thêm.

| Ticket | Kết quả bàn giao | Phụ thuộc |
| --- | --- | --- |
| PAR-001 | Models/JSDoc, schemas, services và fixtures children/entitlements | Shared HTTP/MSW và contract nháp |
| PAR-002 | Parent entry/menu, dashboard cơ bản trong child workspace, URL/selector và empty/forbidden states | PAR-001, shared shell/guards |
| PAR-003 | Children list + invite/link theo capability, quota và lỗi field | PAR-001/002 |
| PAR-004 | Detail/edit, dirty-state, refresh và invalidation | PAR-003 |
| PAR-005 | Test M1: hai tài khoản, đổi bé khi request chậm, quota, logout | PAR-004 |
| PAR-006 | Settings form + category catalog + save/error | M1, settings contract |
| PAR-007 | Approval list/detail + duyệt/reject theo version | M1, character fixtures/contract |
| PAR-008 | Sensitive-role action + conflict và invalidation tests | PAR-007 |

**Điểm dừng review đầu:** PAR-005. Khi M1 ổn, tiếp tục Content/Admin theo lịch tổng thể; M2 không bắt buộc chờ backend AI vì có fixture, nhưng nghiệm thu tích hợp approval phải dùng character/version thật.

## 6. API cần phối hợp với Backend

Endpoint trong mục 15 của `PROJECT_SUMMARY.md` là đề xuất, chưa phải API đã triển khai.

| Miền | Contract tối thiểu |
| --- | --- |
| Auth | Login/logout/refresh, `/me`, register/verify/forgot/reset; role enum, session expiry, error envelope |
| Children | List/link/detail/update; invite/consent và trạng thái liên kết; create hộ chỉ nếu được phép; field/ngày sinh/validation/quota |
| Settings | Read/update settings; category catalog; ý nghĩa danh sách category rỗng, giới hạn min/max, timezone |
| Approvals | List/detail nhân vật và tranh gốc; approve/reject theo version, conflict response |
| Sensitive roles | Read/update quyền theo nhân vật; xác định quyền này được kế thừa thế nào khi có version mới |
| Library | List/detail truyện và nhân vật; favorite/visibility/delete cho từng loại; pagination/filter |
| Progress | Khoảng thời gian, reading/vocabulary/quiz, đơn vị và timezone, định nghĩa chỉ số |
| Child dashboard | Summary của đúng `childId`, range, period/timezone, pending hiện tại, activity/resource links, thời điểm cập nhật và trạng thái từng vùng |
| Plan | Gói hiện tại, giới hạn/sử dụng/còn lại, ngày reset, quyền truy cập nội dung |
| Exports | Create/list/detail job, status enum, file URL và thời hạn, retry/idempotency |
| Family report | Nội dung/lịch tháng, trạng thái gửi, cấu hình nếu có, quyền truy cập và xử lý lỗi |

Khoảng trống so với danh sách API hiện có trong tài liệu: category catalog, đọc settings nếu không nằm trong child detail, entitlement/usage, detail nhân vật, thao tác thư viện nhân vật, dữ liệu dashboard và danh sách export. Cần bổ sung hoặc thống nhất tái sử dụng endpoint, không tự giả định đã có.

Fixtures nên gồm: Parent chưa có bé, nhiều bé, đạt quota; approval pending/approved/rejected và version mới; thư viện trống/ẩn; chưa có tiến độ; session hết hạn, 403, 404, conflict và lỗi mạng. Dùng dữ liệu mẫu cố định, có thể reset để test lặp lại.

Mỗi service method phải ghi payload, response, error codes, quyền sở hữu và query liên quan trước khi bắt đầu UI. Contract nháp có thể dùng mock để tiếp tục; ownership/quota/versioning chỉ được nghiệm thu thật sau khi kiểm tra trực tiếp API.

### 6.1. Contract đề xuất cho dashboard riêng

- `GET /children/:childId/dashboard?range=7d|30d` là **đề xuất mới**, thay việc Parent UI gọi `GET /parent/dashboard` không có childId. Backend có thể chọn endpoint khác nhưng phải bảo đảm cùng phạm vi quyền và dữ liệu.
- Response tối thiểu: `childId`, `period { from, to, timezone }`, `generatedAt`, `summary` (phút đọc, truyện hoàn thành, từ đã ôn theo định nghĩa được chốt), `pendingApprovals` hiện tại và `recentActivities`. Trạng thái lỗi/không có dữ liệu cho từng vùng phải phân biệt được với giá trị 0.
- Có thể thêm `usageToday` và `settingsSummary` nếu đã có nguồn đúng: thời gian dùng app không đồng nhất với phút đọc. Thiếu contract thì bỏ khối này, không suy ra từ tracking đọc truyện.
- Activity có `childId`, loại resource, ID và thời gian; link được dựng bằng route nội bộ đã biết. Resource khác bé bị từ chối, không âm thầm chuyển người dùng sang hồ sơ khác.
- Query key: `['childDashboard', userId, childId, range]`; chỉ enable khi session và quyền truy cập bé đã được xác nhận. Request dùng AbortSignal, không dùng previous data từ bé khác làm placeholder.
- Khi sửa hồ sơ/settings, duyệt version/quyền vai, ẩn/xóa thư viện hoặc tạo export: invalidate summary liên quan của đúng bé (mọi range bị ảnh hưởng), kèm query domain tương ứng. Entitlement dùng chung chỉ invalidate nếu mutation tác động usage.
- Mutation chụp cố định `childId/resourceId/revision` lúc submit; callback dùng các ID đó, không đọc bé đang chọn tại thời điểm response. Nếu đã chuyển sang B, kết quả của A không ghi vào cache/form/toast của B.
- Khi mất liên kết/quyền: khóa thao tác, bỏ dữ liệu child đang hiển thị và cache liên quan, tải lại danh sách được phép; cho người dùng quay về chọn hồ sơ. Request cũ hoàn tất không được khôi phục dữ liệu đã bị thu hồi.

## 7. Các quyết định còn mở

- Auth/session: cookie hay bearer token, refresh, xác minh email/OTP, tên role chính thức.
- Child account/profile: trường bắt buộc, avatar, xử lý tuổi ngoài 6–10, trẻ lớn lên sau khi tạo account, trạng thái xác minh và liên kết với Parent. Chưa thêm chức năng xóa account/profile khi chưa có quy tắc retention.
- Parent–Child relationship: invite/link/consent, cardinality một hay nhiều Parent, ai được tạo liên kết và cách thu hồi quyền.
- Settings: timezone/reset, app background có tính thời gian hay không; giữ hay bỏ giới hạn nhân vật/ngày. Giới hạn/ngày của Parent phải tách với quota thương mại/tháng.
- Approval: lý do từ chối có bắt buộc không; chính sách quyền vai nhạy cảm khi nhân vật có phiên bản mới.
- Quota: tính lượt regenerate, lượt thất bại, quota theo account hay bé, ngày reset và xử lý khi hạ gói vượt số hồ sơ.
- Library/export: soft delete và khôi phục; file format, job API, thời hạn lưu file.
- Family report: có cho bật/tắt hoặc chọn lịch không, trạng thái gửi có được trả về không; chưa tự thêm tùy chọn nhận email khi chưa có nghiệp vụ.

Các điểm này không chặn việc dựng shell và luồng mock. Mọi giả định trong mock cần ghi lại, không coi là business rule chính thức.

## 8. Kiểm thử và mốc nghiệm thu

- Unit/component cho guard chờ session, validation hồ sơ/settings và trạng thái duyệt theo version.
- Playwright cho login → chọn hồ sơ → dashboard riêng → sửa/settings → approval → thư viện → progress → đổi bé → logout; invite/link theo contract.
- Trường hợp lỗi quan trọng: đổi Child khi request cũ đang chạy, account khác, route Child chưa được link với Parent, capability/quota từ server, approval conflict, session hết hạn và gửi trùng.
- Backend integration kiểm tra quyền sở hữu bằng API thật; test mock/ẩn nút không chứng minh phân quyền server.
- Kiểm tra responsive, bàn phím/focus, label, axe cho luồng chính; có loading/empty/error/success và khả năng thử lại.
- Chạy `npm run lint`, `npm run build`, các test mới và regression public/auth liên quan. Không cần chạy test ứng dụng cho riêng tài liệu kế hoạch này.

Không viết lại test shared auth cho từng màn Parent; dùng session fixtures và kiểm tra tích hợp guard ở một số route đại diện. Mỗi E2E mutation có fixture/reset riêng để chạy song song không tranh chấp.

### Bộ kiểm thử tối thiểu theo milestone

| Mốc | Happy path | Trường hợp bắt buộc bổ sung |
| --- | --- | --- |
| M1 | Parent login → chọn/link Child → dashboard riêng → refresh → đổi bé → logout; Child register/login | Entry 0/1/nhiều bé, link capability, URL Child chưa liên kết, request cũ về sau khi đổi Child |
| M2 | Lưu settings → approve version → duyệt quyền vai | Save lỗi giữ form, conflict bản mới, nhấn gửi hai lần, đổi bé khi dirty |
| M3 | Favorite → hide/unhide → delete | Hai bé độc lập, mutation lỗi, xóa item cuối trang |
| M4 | Xem entitlement và usage | Hết quota, unlimited, lỗi tải, reset date/timezone |
| M5 | Chọn bé/date range → xem progress/dashboard | Không có hoạt động, partial error, response cũ |
| M6 | Tạo job → hoàn thành → download | Job lỗi, timeout không rõ kết quả, file hết hạn, retry không tạo trùng |

Mỗi milestone đi qua **Mock complete → API integrated → Verified on staging**. Chỉ đánh dấu hoàn thành tích hợp khi có bằng chứng API thật, không chỉ ảnh giao diện.

Mốc demo đầu tiên là **M1**. Khi thiếu thời gian, hoãn chart, bulk action, custom avatar upload và dashboard nâng cao trước; giữ đầy đủ hồ sơ/settings/approval/ownership và kiểm thử đổi bé. Export/email chỉ thay đổi phạm vi sau khi nhóm chốt lại MVP.

## 9. Định hướng thiết kế và audit hiện trạng

### 9.1. Thiết kế dành cho ai

**Định hướng:** không gian quản lý cho phụ huynh có con 6–10 tuổi, thân thiện theo nhận diện SketchTale nhưng gọn, dễ đọc và đáng tin cậy. Mỗi lần mở trang, phụ huynh cần biết **đang xem Child nào → có việc gì cần làm → thao tác đó ảnh hưởng gì**.

- Giữ Nunito, Phosphor, nền kem, bề mặt trắng, màu vàng thương hiệu và chữ xanh đậm. Không thay design system hoặc framework để đổi giao diện.
- Hình vẽ/nhân vật của bé là nội dung chính tại approval và library; illustration trang trí chỉ dùng tiết chế ở onboarding/empty state.
- Ưu tiên rõ ràng hơn hiệu ứng: mật độ vừa phải, chuyển động ngắn để báo trạng thái; không có scroll hijack, banner cao hoặc animation lặp trong workspace.
- Mỗi màn hình có một hành động chính nổi bật trong ngữ cảnh. Dashboard ưu tiên việc chờ duyệt; form ưu tiên lưu; export ưu tiên tạo bản xuất.
- Không xếp hạng giữa các bé, không diễn giải số lần đọc thành năng lực hoặc tạo áp lực bằng streak/badge giả.
- Ngôn ngữ sản phẩm dùng “Chủ đề”, “Bài hỏi đáp”, “Bản xuất”, “Gói và hạn mức”. Không đưa API, server, revision, worker, aggregate endpoint vào thông báo cho phụ huynh.

Skill `design-taste-frontend` chỉ được tham khảo cho tính nhất quán thị giác và chống giao diện khuôn mẫu. Các quy tắc hero/marketing của skill không áp dụng cho các trang nghiệp vụ này.

### 9.2. Audit lịch sử 26/09 và đối chiếu ngày 01/10

| Khu vực/bằng chứng | Vấn đề cần giải quyết | Hướng thiết kế/triển khai |
| --- | --- | --- |
| `ParentOverviewPage.jsx` | Panel tạo hồ sơ vẫn xuất hiện khi đã có bé; activity link dùng `child-minh-01` cố định | Dashboard theo trạng thái tài khoản; link bằng child/resource thực của activity |
| `ChildWorkspaceLayout.jsx` | Selector dùng `window.location.href`; chưa thể hiện bảo vệ dirty-state xuyên module | Điều hướng SPA, chặn rời form chưa lưu; hủy/khóa dữ liệu bé cũ khi chuyển |
| `ChildSettingsPage.jsx` | Nhánh thiếu data nằm trước nhánh error, có thể giữ loading khi lỗi; tự diễn giải category rỗng và `null` | Render error rõ; chốt semantic với Backend trước khi phát hành lựa chọn |
| `ChildApprovalsPage.jsx` | Filter/selection là state cục bộ; nhãn ảnh “Đang dùng” chưa chắc là tranh gốc; hành động vai nhạy cảm chưa rõ với người dùng | URL phục hồi selection; gắn nhãn đúng nguồn ảnh; hai quyết định độc lập, CTA diễn đạt đúng quyền |
| `ChildLibraryPage.jsx` | Search/tab cục bộ, hành động icon và confirm trình duyệt; thiếu preview theo kế hoạch | Toolbar có URL, nhãn hành động rõ, dialog có ngữ cảnh, preview đúng phạm vi Parent |
| `ParentPlanPage.jsx` | Copy kỹ thuật; dùng thanh tiến độ 8% khi không có giới hạn hữu hạn | Hiển thị unlimited/unknown riêng; bảng hạn mức có đơn vị và kỳ áp dụng |
| `ParentExportsPage.jsx` | Export và báo cáo Family cùng màn; tùy chọn quý chưa được nghiệp vụ nguồn xác nhận | Tách khối/tab rõ; báo cáo mặc định theo tháng; chỉ bật khả năng contract hỗ trợ |
| CSS Parent | Nhiều caption 10–13px, palette/radius riêng lẻ | Tạo token workspace và quy chuẩn typography; kiểm tra tương phản trước khi chốt |

Các hàng trên là audit tĩnh 26/09, không phải danh sách lỗi đã xác nhận còn tồn tại ngày 01/10. Đối chiếu working tree sau vertical slice: selector dùng `navigate`, dashboard mới gọi service có `childId`; ParentOverview cũ đã chuyển thành entry chọn hồ sơ. Các phần approval/library/settings vẫn cần audit render desktop/mobile theo từng milestone.

## 10. Khung trải nghiệm và hệ thống UI chung

### 10.1. Bố cục, màu và chữ

| Thành phần | Đặc tả mục tiêu |
| --- | --- |
| Desktop từ 1200px | Sidebar 232px; header khoảng 64px; nội dung tối đa 1200px, padding 32px; khoảng cách khối 24–32px |
| Tablet 768–1199px | Menu dạng drawer có tên mục, mở từ header; nội dung padding 24px; tối đa hai cột nội dung |
| Mobile dưới 768px | Header gọn, menu drawer, nội dung một cột padding 16px; CTA full-width khi nằm cuối form |
| Nền/bề mặt | Kế thừa `--color-background: #fff9ec`, `--color-surface: #ffffff`; border từ token chung, shadow chỉ cho overlay hoặc phần cần nổi |
| Primary | Vàng `#f7bd35` + chữ xanh đậm `#001050`; không dùng chữ trắng trên nút vàng; link dùng màu chữ đậm, có underline/focus |
| Semantic | Thành công/cảnh báo/lỗi có icon và chữ; màu semantic tách khỏi màu trang trí, phải kiểm tra tương phản từng cặp foreground/background |
| Typography | Nunito; tiêu đề trang 28–32px desktop, 24–28px mobile; tiêu đề khối 20–24px; body/input 16px; metadata 14px; line-height body 1.5–1.6 |
| Shape | Card 20px theo token; input 10px; button pill theo token; không sinh thêm hệ radius cho từng trang |
| Control | Nút/input cao tối thiểu 44px; khoảng cách giữa hành động 8–12px; icon 20–24px; mọi icon-only action có accessible name |
| Motion | 120–200ms cho hover, drawer và phản hồi; tắt chuyển động không cần thiết khi reduced-motion; không animate số liệu gây nhầm lẫn |

Các kích thước là đề xuất triển khai, kiểm chứng lại tại 360, 390, 768, 1024, 1280 và 1440px. Tại laptop 1280×720, header trang, ngữ cảnh bé và ít nhất một nội dung/hành động chính phải hiện ngay; không dành phần lớn màn hình cho lời chào.

### 10.2. Shell và ngữ cảnh bé

- Sidebar cấp tài khoản: **Hồ sơ các bé → Gói và hạn mức → Báo cáo Family** (P2 khi sẵn sàng). Dashboard và Bản xuất nằm trong workspace bé; không dẫn đến placeholder ở bản phát hành.
- Header: logo/link danh sách hồ sơ, nút menu trên màn hẹp, menu tài khoản gồm Hồ sơ tài khoản/Đăng xuất. Không thêm chuông thông báo hoặc global search khi chưa có nghiệp vụ.
- Khu vực theo bé: breadcrumb “Hồ sơ bé / [Tên bé]”, avatar/tên, selector có nhãn “Đang xem hồ sơ”, sau đó nav Tổng quan/Cài đặt/Phê duyệt/Thư viện/Tiến độ/Hồ sơ; Bản xuất thêm ở P2. Chỉ có một bộ nav tác vụ, không lặp trên sidebar.
- Desktop: selector cùng hàng tên; mobile: selector trên hàng riêng, không đẩy tên thành nhiều dòng hẹp. Tabs cuộn ngang có tín hiệu còn nội dung, tự đưa tab active vào vùng nhìn thấy; dùng link navigation với `aria-current`, không giả làm tab widget.
- Tên dài được xuống dòng trong heading; list có thể rút gọn nhưng vẫn truy cập được tên đầy đủ. Không dùng avatar làm định danh duy nhất.
- Đổi bé giữ module; chỉ giữ `range` hợp lệ, reset selection/resource/page của bé trước. Filter nào được giữ phải khai báo theo module; mặc định reset filter nghiệp vụ để tránh danh sách trống khó hiểu.
- Không hiển thị đồng thời tên bé B với dữ liệu bé A. Sau chuyển route, focus đến heading khu vực; không giật focus khi background refetch.
- URL query đề xuất: approvals `status`, `approvalId`; library `type`, `q`, `visibility`, `favorite`, `page`, `itemId`; dashboard `range`; progress `range`, `section`; exports `status`, `page`, `jobId`, `storyId`. `childId` c?a dashboard/export n?m trong path, kh?ng c? query th? hai c? th? xung ??t. Chuẩn hóa tham số sai về mặc định, không phát sinh request với enum lạ.
- Search debounce khoảng 300ms, dùng replace history khi gõ; đổi tab/mở detail dùng history phù hợp để Back quay lại danh sách và bộ lọc trước đó.

### 10.3. Quy tắc phản hồi và bảo vệ thao tác

| Tình huống | Cách hiển thị và hành vi |
| --- | --- |
| Tải lần đầu | Skeleton theo bố cục thật, có tên vùng đang tải; giữ shell và heading ổn định |
| Đang cập nhật cùng bé | Giữ dữ liệu nếu còn hợp lệ, thêm “Đang cập nhật”; không dùng dữ liệu cũ làm xác nhận mutation mới |
| Chưa có dữ liệu | Nêu nguyên nhân theo ngữ cảnh và một bước tiếp theo; không đồng nhất với lỗi |
| Bộ lọc không có kết quả | Giữ toolbar, hiển thị điều kiện và “Xóa bộ lọc”; không mời tạo hồ sơ mới |
| Tải lỗi | Thông báo tại đúng vùng, nút “Thử lại”; lỗi một khối không che các khối dùng được |
| Gửi form | Khóa submit trùng, nhãn “Đang lưu…”; nếu cho sửa tiếp phải bảo toàn phần chưa gửi, mặc định khóa field trong request ngắn |
| Thành công | Thông báo ngắn gắn tên bé/tài nguyên; cập nhật dữ liệu liên quan; không chỉ dựa vào toast tự biến mất |
| Lưu lỗi | Giữ giá trị nhập, lỗi field cạnh field và lỗi chung đầu form; focus field lỗi đầu tiên sau submit |
| Rời form dirty | Dialog “Bạn có thay đổi chưa lưu”, hai nút “Tiếp tục chỉnh sửa”/“Bỏ thay đổi”; áp dụng cho selector, menu, tabs, Back; đóng tab dùng beforeunload |
| Xung đột phiên bản | Giữ thông tin đang xem, thông báo có bản mới và CTA “Tải phiên bản mới”; hủy xác nhận cũ, yêu cầu xem lại |
| 401/403/404 | 401 về login kèm return URL nội bộ; 403 không lộ tên/dữ liệu bé; 404 có link về danh sách, không tự đổi bé |
| Mất mạng/timeout mutation | Không khẳng định thất bại nếu kết quả chưa rõ; kiểm tra trạng thái trước khi gửi lại thao tác có thể tạo trùng |

Dialog có title, focus trap, Escape khi phù hợp, trả focus về nút mở; nếu nút không còn tồn tại thì về heading/list gần nhất. Sticky action bar có padding bù, không che field lỗi, bàn phím mobile hoặc footer. Không mở dialog lồng dialog.

## 11. Đặc tả thiết kế từng trang

### 11.1. Dashboard của bé — `/parent/children/:childId/dashboard`

**Mục tiêu:** Parent biết bé đang sử dụng ứng dụng thế nào, nội dung nào cần quyết định và đã học gì trong kỳ. Mọi khối thuộc duy nhất bé trong URL. Dashboard không chứa danh sách các bé hoặc tổng học tập gia đình.

**Bố cục từ trên xuống:**

1. Child header dùng chung: avatar, tên, nhãn “Đang quản lý”, selector “Chọn hồ sơ bé”. Heading “Tổng quan của [Tên]”, range 7/30 ngày, mặc định 7 ngày.
2. **Cần bố mẹ xem:** yêu cầu chờ duyệt hiện tại của bé, tối đa ba mục gần nhất, phân biệt duyệt hình và quyền vai. “Xem yêu cầu” mở đúng approvalId; “Xem tất cả” mở danh sách chờ của bé. Không có yêu cầu thì một dòng “Không có yêu cầu đang chờ”.
3. **Sử dụng hôm nay:** thời gian dùng app/giới hạn ngày, chủ đề đang được phép nếu có contract; ghi rõ hôm nay và mốc cập nhật. CTA “Điều chỉnh cài đặt”. Thiếu usage vẫn có thể xem cài đặt đã tải; không tự đếm thời gian còn lại bằng trình duyệt. Thời gian dùng app khác với phút đọc.
4. **Hành trình học tập:** phút đọc, truyện hoàn thành, từ đã ôn; ghi kỳ dữ liệu/đơn vị và link “Xem tiến độ” giữ range. Không thêm điểm năng lực, so sánh anh/chị/em hoặc tỷ lệ tăng trưởng chưa có dữ liệu đối chiếu.
5. **Hoạt động gần đây:** tối đa năm mục của bé, tên nội dung/thời gian/loại hoạt động và link đúng resource. Nội dung đã xóa hoặc mất quyền mở có trạng thái rõ, không tạo link chết.
6. **Thư viện của bé:** vài nội dung gần nhất khi summary có dữ liệu, CTA “Mở thư viện”. Không tải toàn bộ thư viện chỉ để dựng dashboard.

Desktop: vùng chính khoảng 2/3 cho việc cần xử lý, học tập và hoạt động; vùng phụ 1/3 cho cài đặt/sử dụng hôm nay. Mobile xếp theo thứ tự ưu tiên trên. Tên bé và việc cần làm đầu tiên phải thấy trên laptop 1280×720; không dùng banner chào gia đình lớn. Giữ tokens/màu/chữ ở mục 10.

Range chỉ điều khiển học tập và hoạt động trong kỳ. Chờ duyệt là **hiện tại**, cài đặt là **đang áp dụng**, usage là **hôm nay**; nhãn UI và contract phải phân biệt rõ.

| Trạng thái | Hành vi |
| --- | --- |
| Bé mới liên kết, chưa có hoạt động | Tên bé, cài đặt, hướng dẫn bắt đầu trên Mobile; không bịa QR/deep link, không thêm CTA tạo bé nữa |
| Loading/chuyển bé | Skeleton của bé mới; không giữ số liệu hoặc resource của bé trước |
| Không có hoạt động trong kỳ | Nêu đúng kỳ, cho đổi 7/30 ngày; số 0 chỉ từ response hợp lệ |
| Lỗi một vùng | Retry tại vùng; giữ lối vào các module còn hợp lệ |
| Chưa triển khai analytics ở M1 | Chỉ hiện khung và tác vụ sẵn sàng; không giả lập số liệu hoặc báo lỗi mạng |
| Mất quyền/không có hồ sơ | State 403/404, bỏ dữ liệu riêng tư và link về danh sách; không tự đổi bé |

**Nghiệm thu:** tên/range/số liệu/link cùng thuộc một bé. Đổi A → B khi A đang tải không chớp dữ liệu A; mutation A trả muộn không đổi B. Dashboard mở đúng yêu cầu/settings/tiến độ trong một lần bấm. Refresh/Back giữ childId/range. Không gọi endpoint tổng gia đình.

### 11.2. Danh sách hồ sơ — `/parent/children`

**Mục tiêu:** chọn Child đã liên kết hoặc bắt đầu flow mời/liên kết, không phải quản trị bảng dữ liệu.

- Header “Hồ sơ bé”, dòng “Đang có [n]/[giới hạn] hồ sơ” khi có dữ liệu, CTA “Thêm hồ sơ bé”. Không thêm search cho tối đa năm hồ sơ.
- Grid 3 cột trên desktop rộng, 2 trên tablet, 1 trên mobile. Mỗi card có avatar 64px, tên, tuổi nếu tính được từ birth date hợp lệ, nút/link “Xem tổng quan” đến dashboard của bé; “Thông tin hồ sơ” là link phụ đến route chi tiết. Không lặp ngày sinh đầy đủ trên mọi card.
- Link phụ “Phê duyệt” kèm số chờ nếu API summary cung cấp; không tạo N request cho N card chỉ để có badge. Card không chứa link bọc quanh các nút/link con.
- Chưa có bé: một empty state, CTA mời/liên kết đầu tiên; không đồng thời lặp ba nút cùng ý định.
- Hết quota: giải thích “Gia đình đã dùng hết [n] hồ sơ của gói hiện tại”; thay CTA chính bằng “Xem gói và hạn mức”. Không cho mở form rồi mới thông báo khi đã biết chắc hết quota.
- Entitlement lỗi: danh sách bé vẫn đọc được, vùng tạo mới có retry riêng. Không giả định được phép tạo.

**Nghiệm thu:** chọn đúng Child bằng bàn phím; avatar lỗi có fallback; một và nhiều Child liên kết đều cân đối; tải lại sau link/sửa phản ánh đúng quyền và tên.

### 11.3. Mời/liên kết trẻ — `/parent/children/new`

**Mục tiêu:** đưa Child account vào danh sách Parent được phép quản lý theo relationship contract.

- Title “Mời hoặc liên kết bé”; giải thích trẻ có thể đã đăng ký tài khoản độc lập.
- Form gọn, chỉ có trường phương thức Backend hỗ trợ, ví dụ mã ghép nối hoặc lời mời. Chưa chọn cứng một cơ chế; tên/ngày sinh/avatar không phải bằng chứng xác nhận quan hệ.
- Hiện trạng thái gửi, chờ xác nhận, hết hạn, đã liên kết, xung đột, thiếu quyền/hết hạn mức theo response. Không hiển thị dữ liệu tài khoản chưa được phép xem.
- Sau xác nhận thành công: tải lại linked children/capability rồi mở dashboard của bé vừa liên kết. Chờ xác nhận thì chưa mở workspace.
- Chỉ thêm nhánh tạo hộ tài khoản nếu contract cho phép; field tên/ngày sinh date-only/avatar dùng chung với profile/auth. Tạo account không đồng nghĩa đã có consent/link.
- Footer “Hủy”/“Gửi lời mời” hoặc “Liên kết” đúng hành động được hỗ trợ. Lỗi giữ giá trị nhập; timeout kiểm tra trạng thái trước khi gửi lại.

**Nghiệm thu:** không mở dashboard trước khi liên kết có hiệu lực; quota/capability từ server; dirty guard, Enter submit một lần, lỗi field có label rõ; dùng được ở 360px và zoom 200%.

### 11.4. Hồ sơ và chỉnh sửa — `/parent/children/:childId`

**Mục tiêu:** xác nhận thông tin bé và sửa có chủ đích. Đây là trang profile, không lặp lại toàn bộ dashboard.

- Dưới child header/tabs là thông tin tên, ngày sinh, avatar dạng đọc; CTA “Chỉnh sửa hồ sơ”. Nút “Cài đặt cho bé” là link phụ.
- Khi sửa: dùng lại `ChildForm` tại cùng route, CTA “Lưu thay đổi”/“Hủy chỉnh sửa”; đề xuất `?edit=1` nếu cần Back đóng chế độ sửa, không tạo route mới chỉ để đổi form.
- Không đổi tên trong header từng phím; header chỉ cập nhật sau khi lưu thành công. Cancel phục hồi dữ liệu đã lưu.
- Ngày sinh đầy đủ chỉ hiện tại trang hồ sơ/form; không nhân rộng thông tin đó vào mọi tab.
- Không có nút xóa hồ sơ đến khi có quy tắc retention. Nếu child bị xóa/mất quyền ở nơi khác, ngừng mutation và trả state phù hợp.

**Nghiệm thu:** save lỗi giữ draft; refetch không ghi đè draft; đổi bé khi dirty có lựa chọn rõ; không đem draft bé A sang B; sau save header/list/selector đồng nhất.

### 11.5. Cài đặt — `/parent/children/:childId/settings`

**Mục tiêu:** phụ huynh hiểu chính xác giới hạn áp dụng cho bé và lưu chắc chắn.

**Bố cục:** title “Cài đặt cho [Tên]”; hai section phẳng “Thời gian mỗi ngày” và “Chủ đề được phép”; summary thay đổi + action bar phía dưới. Không lồng nhiều tầng card.

- Thời gian: control có đơn vị “phút/ngày”, chọn preset theo contract và nhập số nếu API hỗ trợ; không dùng slider làm cách nhập duy nhất. “Không giới hạn” là lựa chọn tường minh chỉ khi được hỗ trợ.
- Hiển thị timezone/reset nếu đã biết; mô tả tác động ở Mobile bằng ngôn ngữ đã được Backend/Mobile xác nhận. Không tự gọi là “giới hạn mềm” nếu hệ thống thực sự chặn.
- Chủ đề: checkbox có tên tiếng Việt và mô tả ngắn khi cần. Nếu API phân biệt mọi chủ đề và chọn riêng, dùng radio “Tất cả chủ đề phù hợp”/“Chỉ các chủ đề đã chọn”, rồi mapping qua adapter. Không dùng danh sách rỗng làm một lựa chọn mơ hồ.
- Catalog lỗi: không biến thành danh sách trống có thể ghi đè cấu hình; hiện retry, giữ bản đã lưu. Chủ đề đã ngừng hỗ trợ phải có giải thích và xử lý theo contract.
- Dòng tóm tắt trước nút lưu: “Áp dụng cho [Tên]: [thời gian], [số chủ đề hoặc tất cả]”. Chỉ dùng giá trị đã giải nghĩa được.
- Action bar: “Chưa có thay đổi” hoặc “Có thay đổi chưa lưu”; “Hủy thay đổi” + “Lưu cài đặt”. Thành công thông báo ngay tại form, xóa success cũ khi người dùng bắt đầu sửa tiếp.

**Nghiệm thu:** tải lỗi không treo skeleton; round-trip dữ liệu không đổi ý nghĩa; không cho lưu khi semantic `0`/`null`/rỗng chưa xác nhận; giới hạn ngày không bị gộp vào quota tháng.

### 11.6. Phê duyệt — `/parent/children/:childId/approvals`

**Mục tiêu:** xem đủ bằng chứng trước khi quyết định; phân biệt duyệt hình nhân vật với quyền dùng vai nhạy cảm.

**Desktop:** toolbar trạng thái Chờ duyệt/Đã duyệt/Đã từ chối và loại yêu cầu nếu API hỗ trợ; bên trái danh sách khoảng 300–340px, bên phải chi tiết co giãn. List item có thumbnail, tên, loại yêu cầu, phiên bản, thời gian. Danh sách dài có pagination theo contract.

**Mobile:** mặc định danh sách; chọn item mở detail chiếm vùng nội dung với “Quay lại yêu cầu”. Không nhét hai cột xuống màn hẹp. `approvalId` trên URL để refresh/back giữ selection; deep link không thuộc bé phải bị từ chối.

**Chi tiết phiên bản:**

1. Tên, badge trạng thái, “Phiên bản [n]”, ngày gửi; thông tin revision kỹ thuật không đưa lên UI chính.
2. Hai ảnh có nhãn đúng nguồn: “Tranh bé vẽ” và “Nhân vật tạo từ tranh”; bản đang dùng là ảnh thứ ba tùy chọn nếu API thực sự trả. Ảnh `object-fit: contain`, không crop mất nét vẽ; mobile xếp dọc, mở phóng to bằng bàn phím được.
3. Mô tả liên quan đến nội dung cần duyệt; không có nhận xét AI tự sinh chưa qua nghiệp vụ.
4. Hai nút “Từ chối phiên bản” và “Duyệt phiên bản này”. Duyệt trực tiếp sau khi xem, không thêm confirm chung vô nghĩa. Mutation gắn chính xác child/approval/version/revision.
5. Từ chối mở form ngắn: lý do có sẵn theo catalog và ghi chú nếu hỗ trợ; ghi rõ nội dung gửi cho phụ huynh/hệ thống, không hứa hiển thị nguyên văn cho trẻ. Bắt buộc lý do hay không là quyết định còn mở.

**Chi tiết quyền vai nhạy cảm:** dùng heading “Cho phép [Nhân vật] dùng vai nhạy cảm”, mô tả loại vai từ catalog và phạm vi quyền một lần theo nhân vật. Có CTA riêng “Cho phép dùng vai nhạy cảm” và xác nhận phạm vi rõ trước khi gửi. Duyệt hình không tự bật quyền; không đặt checkbox cấp quyền được chọn sẵn. Chính sách kế thừa qua phiên bản phải chốt, không lấy hành vi fixture làm nghiệp vụ.

**Sau quyết định:** giữ một kết quả ngắn “Đã duyệt phiên bản [n] của [Tên]”, cập nhật list/count; người dùng chọn “Xem yêu cầu tiếp theo”, không tự nhảy và đổi nội dung dưới con trỏ. Không cung cấp undo/thu hồi nếu API chưa hỗ trợ.

**Trường hợp lỗi:** ảnh thiếu/tải lỗi có retry và không cho duyệt hình khi chưa xem được bằng chứng cần thiết; conflict khóa quyết định cũ, tải bản mới và yêu cầu xem lại; mutation lỗi chỉ hiện ở yêu cầu liên quan, không mang lỗi sang item khác. Khi request đang gửi, không cho đổi selection khiến kết quả bị gán nhầm.

**Nghiệm thu:** thử hai phiên bản cùng nhân vật, hai bé, request chậm và quyết định từ phiên khác; không duyệt nhầm hoặc cấp quyền nhạy cảm kèm approve; Back khôi phục filter và vị trí danh sách.

### 11.7. Thư viện — `/parent/children/:childId/library`

**Mục tiêu:** xem nội dung của đúng bé và quản lý nhanh mà không xóa nhầm.

- Header “Thư viện của [Tên]”; toolbar: Truyện/Nhân vật, tìm theo tên, lọc hiển thị/đã ẩn và yêu thích nếu API hỗ trợ. Trạng thái mặc định chỉ nội dung đang hiển thị; bộ lọc có thể xóa rõ ràng.
- Grid truyện 3 cột desktop, 2 tablet, 1 mobile hẹp; card gồm bìa tỷ lệ cố định theo asset thực, tên tối đa hai dòng, metadata vừa đủ, trạng thái và CTA “Xem nội dung”. Nhân vật dùng khung vuông `contain` để không mất nét vẽ.
- Favorite là toggle có tên truy cập và `aria-pressed`; các thao tác ẩn/xóa trong menu có label, tránh ba icon nhỏ không giải thích. Không đặt nút xóa cạnh nút mở preview như hành động ngang hàng.
- Detail dùng panel rộng hoặc màn detail trong cùng route với `itemId`; mobile chiếm vùng nội dung, Back về danh sách. Truyện hiển thị mô tả/chủ đề và preview trang nếu contract có; nhân vật hiển thị ảnh/phiên bản/trạng thái duyệt. Không xây reader tương tác hoặc quiz của Mobile.
- “Ẩn khỏi thư viện” và “Hiện lại” phải ghi phạm vi đúng theo contract. Filter “Đã ẩn” luôn giúp tìm lại item; không hứa rằng ẩn cũng thu hồi quyền ở tất cả truyện nếu chưa có quy tắc đó.
- Xóa có dialog “Xóa [Tên nội dung] khỏi thư viện của [Tên bé]?” + tác động đã xác nhận. CTA “Giữ lại”/“Xóa khỏi thư viện”; focus mặc định về lựa chọn an toàn. Không hứa khôi phục hoặc undo khi chưa có API.
- Link xuất truyện từ detail chỉ xuất hiện với resource hợp lệ và capability phù hợp; đi `/parent/children/:childId/exports?storyId=...` để điền trước, vẫn kiểm tra lại quyền khi submit.

**States:** ảnh lỗi giữ kích thước card và tên; thư viện trống khác với tìm không ra kết quả; mutation pending khóa đúng item, server lỗi giữ item; xóa item cuối trang chuyển về trang còn hợp lệ. Item không còn khả dụng không có CTA mở giả.

**Nghiệm thu:** refresh giữ filter; sửa bé A không tác động B; dùng bàn phím mở menu/dialog; preview không làm mất scroll danh sách; có đường tìm và hiện lại nội dung đã ẩn.

### 11.8. Tiến độ — `/parent/children/:childId/progress`

**Mục tiêu:** giúp phụ huynh hiểu bé đã làm gì và có dữ liệu nào, không chẩn đoán năng lực.

- Header “Hành trình của [Tên]”, chọn 7/30 ngày; default thống nhất 30 ngày, còn link dashboard truyền rõ range đã chọn. Hiển thị ngày bắt đầu/kết thúc và timezone; khoảng ngày tùy chỉnh là đợt sau nếu API chưa hỗ trợ.
- Dải summary 3–4 số: phút đọc, truyện hoàn thành, từ đã ôn và số lượt hỏi đáp/độ chính xác khi có định nghĩa. Số 0 là dữ liệu hợp lệ; chưa có câu trả lời là “Chưa có dữ liệu”, không hiển thị 0% sai nghĩa.
- Ba vùng nội dung Đọc truyện/Từ vựng/Bài hỏi đáp. Nếu dùng tabs nội bộ, có URL `section` và semantics bàn phím đúng; tránh thêm tab chỉ để chia một bảng ngắn.
- Đọc truyện: bảng ngày, thời lượng, số truyện hoàn thành; drill-down danh sách truyện chỉ khi API có. Biểu đồ cột đơn giản theo ngày là tùy chọn sau bảng; luôn có dữ liệu dạng chữ/bảng tương đương.
- Từ vựng: phân biệt số từ riêng biệt với số lần xuất hiện/nghe/trả lời; chỉ render những chỉ số Backend cung cấp. Không gọi “đã thành thạo”.
- Bài hỏi đáp: hiện số đúng/tổng số trước phần trăm, nêu kỳ dữ liệu; chi tiết lượt làm chỉ khi có endpoint. Không quy đổi thành điểm năng lực hoặc xếp hạng.
- Mobile: summary 2 cột nếu đọc rõ; lịch sử thành các hàng có nhãn hoặc vùng bảng cuộn có chỉ dẫn, không làm toàn trang tràn ngang. Chart tooltip dùng được khi chạm/focus.
- Family: link “Báo cáo học tập tháng” sang khu vực báo cáo, mang theo ngữ cảnh phù hợp nếu report hỗ trợ theo bé.

**Nghiệm thu:** mọi số có định nghĩa/đơn vị và cùng kỳ; đổi range/bé không chớp dữ liệu cũ; không hoạt động khác với lỗi một phần; tất cả ngày hiển thị theo timezone thống nhất.

### 11.9. Gói và hạn mức — `/parent/plan`

**Mục tiêu:** biết quyền hiện tại, đã dùng bao nhiêu và khi nào có thể tiếp tục.

- Header “Gói và hạn mức”; khối gói hiện tại hiển thị tên và trạng thái có thật. Không dùng banner nâng cấp chiếm phần lớn màn hình.
- Bảng usage: **Tính năng | Đã dùng | Giới hạn | Còn lại | Kỳ áp dụng/đặt lại**; các hàng hồ sơ, tạo nhân vật AI, xuất video hoặc capability khác chỉ từ contract.
- Mỗi dòng ghi phạm vi tài khoản/bé theo dữ liệu đã chốt. Hạn mức số hồ sơ không mặc định có kỳ reset tháng như lượt AI.
- Hữu hạn: số và progress bar bổ trợ; unlimited: “Không giới hạn”, bỏ thanh %; unknown: “Chưa tải được”/“Chưa có thông tin”, retry nếu phù hợp. Nếu used vượt limit sau hạ gói, vẫn hiện số thật và hướng dẫn từ chính sách, không tự xóa hồ sơ.
- “Đã dùng hết” đi cùng ngày đặt lại nếu biết; không biến thành cảnh báo đỏ nghiêm trọng khi chỉ là giới hạn bình thường. Hạn mức ngày do Parent cấu hình có link sang settings, không trộn với quota thương mại.
- Bảng so sánh quyền lợi chỉ hiển thị dữ liệu catalog chính thức. Chưa có billing thì không có nút “Thanh toán” hoặc “Nâng cấp ngay” không hoạt động; có thể có link tìm hiểu nếu đã có trang phù hợp.
- Mobile: mỗi tính năng thành một hàng/khối label–value, tránh bảng năm cột bị ép chữ nhỏ.

**Nghiệm thu:** Free/Pro/Family là fixture kiểm thử, quyền thực tế theo response; không dựng phần trăm giả; ngày reset rõ timezone; lỗi entitlement không chặn xem các nội dung khác đã có quyền.

### 11.10. Bản xuất của bé — `/parent/children/:childId/exports` (P2)

**Mục tiêu:** chọn đúng câu chuyện, biết điều kiện xuất, theo dõi và tải kết quả.

**Bố cục:** header “Xuất truyện”; form tạo bản xuất ở đầu, danh sách gần đây bên dưới. Desktop form chia hai cột field/tóm tắt nếu đủ chỗ; mobile form một cột. Báo cáo Family có trang cấu hình riêng theo mục 11.11; không gộp vào lịch sử xuất truyện của bé.

1. Child cố định theo workspace → chọn truyện hợp lệ của bé → chọn định dạng từ capability. PDF/video hiện có trong mock chỉ là baseline cho thiết kế, cần contract trước nghiệm thu.
2. Đổi Child reset truyện đã chọn; từ library đi sang thì điền sẵn Child/truyện và tải kiểm tra quyền. Truyện không còn hợp lệ phải được giải thích, không âm thầm đổi sang truyện đầu.
3. Summary trước submit có tên bé/truyện/định dạng, quota cần dùng nếu đã biết, lưu ý thời gian chờ bằng dữ liệu thật; không hứa số phút xử lý cố định.
4. CTA “Tạo bản xuất”; sau thành công hiển thị job vừa tạo và “Bạn có thể rời trang, bản xuất sẽ tiếp tục được xử lý” chỉ khi Backend đảm bảo.
5. Lịch sử chỉ gồm job của bé trong URL, có tên truyện, định dạng, thời gian, trạng thái, action; filter theo trạng thái và pagination khi cần. `jobId` mở chi tiết trong panel/màn con cùng route.

| Trạng thái | Nội dung và action |
| --- | --- |
| Đang chờ | “Yêu cầu đã được tiếp nhận”; không hiện % tự tăng |
| Đang xử lý | Spinner + trạng thái; chỉ có progress khi Backend trả giá trị đáng tin cậy |
| Hoàn thành | “Tải file”, định dạng/dung lượng/hạn tải nếu có |
| Không thành công | Lý do dễ hiểu; “Thử lại” chỉ nếu endpoint cho phép, nêu rõ có tạo job/trừ lượt mới không |
| Link hết hạn | Thử lấy lại link cho job cũ nếu hỗ trợ; chỉ tạo bản mới khi cần và cho biết tác động quota trước xác nhận |
| Chưa rõ kết quả | “Đang kiểm tra yêu cầu”; refresh danh sách/detail theo khóa request, không tự tạo job khác |

**Nghiệm thu:** double click/timeout không tạo trùng; refresh khôi phục job; polling dừng đúng terminal/unmount, retry tải file không đồng nghĩa tạo job; lỗi tải không làm mất lịch sử.

### 11.11. Báo cáo Family — `/parent/reports` (P2)

**Đề xuất:** tách cấu hình nhận email khỏi công cụ xuất truyện. Family là quyền lợi gói, không phải lý do gộp dashboard học tập của các bé.

- Trang cấp tài khoản hiển thị lịch gửi tháng, trạng thái gửi, nơi nhận đã che một phần và cấu hình được contract hỗ trợ. Nội dung email theo bé hay gia đình vẫn cần chốt.
- Nếu có báo cáo riêng của một bé, link từ Tiến độ mang childId; server kiểm tra quyền và trả đúng báo cáo. Không lọc tài liệu gia đình tại client rồi gọi đó là báo cáo riêng.
- Không có capability: giải thích ngắn và link Gói. Dịch vụ chưa triển khai: chưa mở mục điều hướng ở bản phát hành, không giả lập đã gửi.
- Phân biệt chưa đến kỳ, chưa có báo cáo, lỗi gửi, đã tạo file và đã gửi email. Download/gửi lại/bật tắt chỉ có khi API hỗ trợ.
- Lịch mặc định theo tháng, không thêm lựa chọn quý. Form khởi tạo từ dữ liệu đã lưu, có dirty/save/error; không mặc định enabled rồi ghi đè.

**Nghiệm thu:** đổi hồ sơ không đổi cấu hình cấp Parent; báo cáo riêng không lẫn trẻ; trạng thái gửi được dịch vụ thật xác nhận.

### 11.12. Các trang shared trong hành trình Parent

Không xây lại auth/profile riêng cho Parent. Bảng dưới là yêu cầu UX tích hợp; verify/reset chưa có route hiện hành và phụ thuộc auth contract.

| Trang | Bố cục và hành vi cần thiết | Nghiệm thu riêng |
| --- | --- | --- |
| Đăng nhập | Form gọn email/mật khẩu, hiện/ẩn mật khẩu, Quên mật khẩu; trạng thái gửi/lỗi; trở lại đường dẫn nội bộ hợp lệ sau đăng nhập | Không redirect khi session còn đang khôi phục; hết phiên giữa tác vụ không gửi lại mutation tự động |
| Đăng ký Parent/Child | Field và age/role flow theo contract, điều khoản có link thực, lỗi cạnh field; sau thành công hướng dẫn xác minh nếu cần | Không cho chọn Admin/Content Manager trong form công khai; Child 6–10 phải đi qua quy tắc xác minh/link/consent đã chốt |
| Xác minh | Hiện đích nhận đã che, hướng dẫn, gửi lại với cooldown do server; sửa địa chỉ nếu contract cho | Mã/link hết hạn có đường phục hồi; không hiển thị xác minh thành công trước response |
| Quên mật khẩu | Một field email, thông báo tiếp theo dễ hiểu và quay về login | Không làm lộ tài khoản tồn tại qua thông báo; gửi lại có phản hồi rõ |
| Đặt lại mật khẩu | Mật khẩu mới, hướng dẫn quy tắc thật, trạng thái link hết hạn | Link không hợp lệ dẫn đến yêu cầu link mới; không tự đăng nhập nếu contract không có |
| Hồ sơ tài khoản | Tên/email và field được phép sửa; đọc trước, sửa/lưu có chủ đích; link quay lại Parent | Không gộp hồ sơ phụ huynh với hồ sơ bé; đổi email có bước xác minh nếu nghiệp vụ yêu cầu |
| Không đủ quyền/không tìm thấy | Heading, mô tả ngắn, “Về hồ sơ bé” hoặc “Về tổng quan”; giữ shell khi có session hợp lệ | Không rò rỉ tên/tài nguyên không thuộc tài khoản, không vòng lặp redirect |

## 12. Luồng xuyên trang cần thiết kế và kiểm chứng

| Luồng | Các bước mong đợi | Điểm cần giữ ngữ cảnh |
| --- | --- | --- |
| Parent mới | Login → danh sách trống → mời/liên kết Child → xác nhận → dashboard bé → cài đặt → lưu | Không bắt xem tour dài; không tự tạo account hoặc setting thay Child khi chưa có contract |
| Child mới | Child register → verify/link nếu cần → login Mobile → tạo nhân vật/đọc truyện | Không hiển thị Child như account đã được link khi Backend chưa xác nhận |
| Duyệt nội dung | Dashboard → yêu cầu của đúng bé → xem ảnh → quyết định → kết quả/tiếp theo | Child, approval và version giữ nguyên đến khi server xác nhận |
| Duyệt quyền vai | Yêu cầu vai nhạy cảm → đọc phạm vi quyền → xác nhận → kết quả riêng | Không gộp với approve hình; không kế thừa quyền phiên bản theo suy đoán |
| Quản lý thư viện | Chọn Child → lọc → preview → ẩn → tìm trong Đã ẩn → hiện lại | Filter/scroll giữ khi Back; mutation không chạy nhầm item |
| Theo dõi học tập | Dashboard/range → tiến độ bé → xem đúng khoảng ngày → báo cáo tháng nếu có | Range và timezone rõ; báo cáo tháng không giả vờ dùng range 7 ngày |
| Xuất truyện | Library detail → export điền sẵn → kiểm tra → tạo → xem trạng thái → tải | Bé/truyện không mất khi chuyển; quota và quyền được kiểm tra lại |
| Đổi bé khi đang sửa | Form dirty → selector → ở lại hoặc bỏ thay đổi → tải bé mới | Nếu ở lại, URL/selector/form giữ nguyên; nếu rời, không mang draft cũ sang |

### Copy mẫu dùng khi dựng UI

| Trường hợp | Nội dung mẫu |
| --- | --- |
| Chưa có Child liên kết | “Kết nối tài khoản Child để theo dõi hành trình.” — “Mời hoặc liên kết Child” |
| Hết quota tạo hồ sơ | “Gia đình đã dùng hết số hồ sơ của gói hiện tại.” — “Xem gói và hạn mức” |
| Lưu settings thành công | “Đã lưu cài đặt cho Mây.” |
| Approval conflict | “Nhân vật này có phiên bản mới. Hãy xem lại trước khi quyết định.” — “Tải phiên bản mới” |
| Không có hoạt động | “Chưa có hoạt động trong khoảng thời gian này.” — “Xem 30 ngày gần đây” nếu đang ở 7 ngày |
| Lỗi tải một vùng | “Chưa tải được thư viện của Mây. Bạn có thể thử lại.” |
| Timeout tạo export | “Chưa xác nhận được yêu cầu. Đang kiểm tra để tránh tạo bản xuất trùng.” |

Tên và con số trong thiết kế là fixture, không phải nội dung hardcode trong sản phẩm. Thông báo không đổ lỗi cho bé hoặc phụ huynh.

## 13. Backlog thực hiện thiết kế và tiêu chí bàn giao

Các ticket dưới đây **bổ sung chi tiết UI/UX cho M1–M6**, không cộng thêm vào 14–19 ngày ở mục 5. Do đã có code nhưng chưa audit render và API, cần ước lượng phần còn lại sau UX-01; không coi ước lượng này là cam kết cho toàn bộ đợt hoàn thiện.

| Ticket | Công việc và đầu ra | Phụ thuộc/ưu tiên |
| --- | --- | --- |
| UX-01 | Chụp baseline desktop/mobile từng route; kiểm kê component/state, xác nhận contract còn thiếu và các quyết định mục 14 | Làm đầu tiên |
| UX-02 | Tokens workspace, page header, nav mobile, child selector, state primitives, dialog/focus, dirty guard dùng chung | Shared; trước các màn form |
| UX-03 | Wireframe + list/link/detail, entry và dashboard cơ bản; quota, mock hai bé/tài khoản | M1; UX-02 |
| UX-04 | Settings rõ đơn vị/ý nghĩa lựa chọn; error/dirty/save; copy tiếng Việt | M2; contract settings |
| UX-05 | Approval list/detail desktop/mobile, preview ảnh, reject, quyền vai, conflict | M2; contract version/role |
| UX-06 | Library filter URL, card, preview, menu ẩn/xóa, pagination | M3; resource actions |
| UX-07 | Gói/usage hữu hạn/unlimited/unknown và trạng thái hết quota xuyên trang | M4; entitlement |
| UX-08 | Progress có định nghĩa số liệu, range, lịch sử và mobile; chart nếu cần | M5; analytics contract |
| UX-09 | Số liệu dashboard từng bé, link đúng tài nguyên và partial error; entry 0/1/nhiều bé ở M1 | M5; tái sử dụng summary thực |
| UX-10 | Export theo childId, tạo/theo dõi/tải, pending/timeout/expired; cấu hình Family cấp tài khoản | M6; capability/job/report contract |
| UX-11 | Regression các luồng mục 12, kiểm tra bàn phím/axe, responsive và usability với phụ huynh | Theo từng milestone và trước bàn giao |

### Bộ đầu ra cho mỗi trang

1. Wireframe desktop và mobile có thứ tự nội dung, CTA, điểm mở dialog/detail và vị trí quay lại.
2. Thiết kế chi tiết theo tokens: trạng thái mặc định, loading, empty, error, success; quota/forbidden/conflict nếu áp dụng.
3. Ghi rõ field/metadata cần API; mỗi giá trị phân loại “đã có”, “mock”, “cần contract”. Không thêm control mà không có hành vi dự kiến.
4. Triển khai trên component hiện có, ưu tiên reuse; không tách feature folder hoặc thêm thư viện chỉ để làm đẹp.
5. Ảnh kiểm chứng trước–sau và checklist hành vi ở desktop/mobile. Không dùng screenshot đẹp thay bằng chứng tương tác.

### Tiêu chí UI/UX bắt buộc

- Tại 360px không tràn ngang toàn trang; ở zoom 200% không mất nội dung hoặc hành động. Chỉ vùng bảng được cuộn ngang khi thật sự cần.
- Văn bản thường đặt mục tiêu tương phản tối thiểu 4.5:1; chữ lớn và thành phần đồ họa/control cần nhận biết tối thiểu 3:1; kiểm tra màu thực sau render, không mặc định token thương hiệu đã đạt.
- Mọi thao tác chính dùng được bằng bàn phím, focus nhìn rõ, label gắn control; thứ tự heading hợp lý. Không chỉ dùng màu để truyền đạt trạng thái.
- Skeleton/ảnh có kích thước dự trữ; lỗi ảnh không làm layout sụp. Chuyển route quản lý focus, background refresh không kéo màn hình người dùng.
- Form không mất draft khi server lỗi hoặc refetch; trạng thái success không còn xuất hiện sau khi người dùng sửa tiếp mà chưa lưu.
- URL phục hồi đúng bé/tab/filter; từ detail quay lại không mất lựa chọn. Server vẫn chịu trách nhiệm ownership; kiểm thử UI không chứng minh bảo mật Backend.
- Không xuất hiện tên bé A cùng dữ liệu bé B, revision kỹ thuật trong copy chính, nút dead-end, số liệu giả hoặc thanh phần trăm giả.
- Mọi empty/error đều có hướng xử lý phù hợp; không ép nâng cấp để thoát lỗi mạng.

### Kiểm chứng với người dùng

Đề xuất một vòng 3–5 phụ huynh và một nhóm trẻ 6–10 tuổi đại diện trước khi chốt giao diện, dùng tài khoản và dữ liệu giả. Giao nhiệm vụ cho Parent: liên kết Child, đặt thời gian, duyệt phiên bản, tìm lại truyện đã ẩn, xem tiến độ đúng Child. Giao nhiệm vụ cho Child: đăng ký, đăng nhập, tạo nhân vật và mở truyện. Quan sát khả năng hoàn thành không cần hướng dẫn, thao tác nhầm account/Child, điểm không hiểu nhãn và cách phục hồi lỗi. Mục tiêu nội bộ: không có quyết định duyệt/xóa nhầm, phần lớn nhiệm vụ hoàn thành độc lập; đây là tiêu chí để cải tiến, chưa phải kết quả đo được.

Khi code xong từng milestone mới chạy lint/build và test liên quan theo mục 8. Đợt chỉnh sửa tài liệu này chỉ kiểm tra nội dung, liên kết và tính nhất quán, không cần chạy regression ứng dụng.

## 14. Quyết định thiết kế đã đề xuất và các điểm cần chốt

### Có thể tiến hành mà không chờ Backend

- Giữ nhận diện SketchTale, Nunito/Phosphor và CSS tokens hiện có; workspace ít trang trí hơn public landing.
- Desktop sidebar, mobile drawer; Child nav dùng chung; form mời/liên kết một trang; profile xem trước rồi chỉnh sửa.
- Dashboard ưu tiên việc cần xử lý; approval desktop list/detail và mobile chuyển màn trong route; library có preview theo khả năng dữ liệu.
- Dashboard và export có childId trong path; profile giữ route hiện tại. Cấu hình email Family tách cấp tài khoản, chỉ bật sau contract.
- Thực hiện skeleton/empty/error/focus/dirty-state và copy rõ ràng trước khi thêm chart hoặc animation.

### Cần chốt trước khi triển khai phần phụ thuộc

| Câu hỏi | Đề xuất hoặc hướng xử lý tạm thời | Phần bị ảnh hưởng |
| --- | --- | --- |
| Phụ huynh có dùng web trên điện thoại thường xuyên không? | Thiết kế đầy đủ responsive, ưu tiên thao tác duyệt/lưu bằng một tay; không tạo ứng dụng mobile Parent riêng | Mức ưu tiên QA mobile |
| Có giữ hướng vàng–kem hiện tại không? | Giữ nhận diện, giảm màu phụ và caption nhỏ; nếu đổi thì chốt trước mockup chi tiết | Tokens và toàn bộ trang |
| Tuổi ngoài 6–10 được chặn tạo/đăng ký hay chỉ cảnh báo? | Không tự quyết; chuẩn bị cả hai state, chỉ bật theo quy tắc được duyệt | Child account/profile |
| Child link với Parent bằng cách nào? | Invite/mã ghép nối/consent theo auth contract; không hardcode một cách | Selector, approval, ownership |
| Không giới hạn, 0 phút và chủ đề rỗng có nghĩa gì? | Thiết kế lựa chọn rõ bằng lời, mapping sau khi có contract; không phát hành save với nghĩa suy đoán | Settings |
| Lý do từ chối có bắt buộc, danh mục và giới hạn ghi chú là gì? | Có chỗ cho lý do/ghi chú; trạng thái bắt buộc theo contract | Approval reject |
| Quyền vai nhạy cảm kế thừa thế nào khi recolor/tạo version mới? | Tách action/state; không tự mở quyền từ approve hình | Approval/sensitive roles |
| Ẩn/xóa ảnh hưởng nội dung Mobile và truyện đã tạo thế nào? Có khôi phục không? | Dialog chỉ hứa tác động đã xác nhận; chưa có API thì không có undo | Library |
| Quota theo account hay bé; lượt lỗi/retry tính thế nào? | Không suy diễn từ tên gói; hiển thị unit/scope/period theo response | Plan/export |
| Report tháng theo bé hay gia đình, có cấu hình và lịch sử gửi không? | Trang cấu hình cấp tài khoản; báo cáo riêng theo quyền/childId khi có contract; bỏ tùy chọn quý khỏi phạm vi mặc định | Family report |

Các câu hỏi trên không chặn hoàn thiện bố cục và state mocks. Mỗi quyết định khi được chốt phải cập nhật cả tài liệu, fixture và contract tương ứng; không coi giao diện đang có là bằng chứng nghiệp vụ đã đúng.

## 15. Chuyển đổi từ hiện trạng sang dashboard theo hồ sơ

### 15.1. Phạm vi thay đổi khi triển khai

| Hiện trạng trong repository | Đích cần triển khai |
| --- | --- |
| `App.jsx`: `/parent` render `ParentOverviewPage` | Entry xử lý 0/1/nhiều bé; thêm child dashboard nested trong `ChildWorkspaceLayout`, giữ index profile hiện tại |
| `WorkspaceLayout.jsx`: Tổng quan và Xuất truyện cấp Parent | Menu cấp tài khoản theo mục 10.2; tác vụ của bé trong child workspace; tránh thay đổi menu Content/Admin |
| `ParentOverviewPage.jsx`: query dashboard/export cấp Parent | Tách entry khỏi `ChildDashboardPage`; tái sử dụng khối UI phù hợp, lấy child từ route/layout; không mang query tổng gia đình sang màn mới |
| `ChildWorkspaceLayout.jsx`: profile/settings/approval/library/progress | Thêm Tổng quan đầu nav, Bản xuất ở P2; bảo vệ dirty-state và reset resource khi đổi bé |
| `childrenService.dashboard`, query keys và mock handlers | Contract theo childId mục 6.1; fixtures hai bé có số liệu/yêu cầu khác nhau; bỏ dependency endpoint tổng cũ khi migration hoàn tất |
| `ParentExportsPage.jsx`: export/report chung | Tách danh sách job theo bé và cấu hình Family cấp tài khoản; service kiểm tra child/resource, không chỉ lọc client |
| Route title, links, tests và tài liệu | Cập nhật title theo bé, CTA từ children/library/progress, return URL và các kiểm thử dùng route cũ |

Không đổi cấu trúc thư mục toàn bộ feature để thực hiện việc này. Giữ React/JSX, shared auth/query/layout và design tokens hiện có. Rà working tree trước khi code để giữ các cải tiến giao diện đang làm; audit cũ không phải chỉ thị khôi phục code cũ.

### 15.2. Tương thích đường dẫn

- `/parent/children/:childId` vẫn là thông tin hồ sơ; chỉ CTA chọn bé đổi sang `/dashboard`. URL module hiện tại tiếp tục hoạt động.
- `/parent` dùng entry logic mục 3, không giữ dashboard gia đình ẩn phía sau.
- P2: `/parent/exports?childId=...` chuyển bằng replace sang `/parent/children/:childId/exports` sau khi kiểm tra quyền; chỉ giữ query hợp lệ như storyId/jobId/status/page. ID không hợp lệ trả lỗi, không chọn bé khác.
- Link export cũ chỉ có jobId/storyId: chỉ resolve Child qua endpoint được phân quyền nếu contract có; nếu không, yêu cầu chọn hồ sơ, không đoán ownership. Link không có ngữ cảnh mở danh sách bé với thông báo chọn bé để xem bản xuất.
- `/parent/exports?tab=reports` chuyển sang `/parent/reports` khi module P2 sẵn sàng. Không phát hành link đến route mới trước khi màn đích sẵn sàng.
- Back, refresh và return URL sau login không thay childId; chuyển bé chỉ giữ module và range hợp lệ, bỏ ID tài nguyên, page, search/filter không tương thích.

### 15.3. Checklist nghiệm thu bổ sung

- [ ] Entry 0 bé → hướng dẫn liên kết; 1 bé → dashboard bé đó; nhiều bé → chủ động chọn. Lỗi tải danh sách không bị coi là 0 bé.
- [ ] Hai bé có số liệu khác nhau; dashboard A không chứa tên/resource/count của B, kể cả khi request A hoàn tất sau B.
- [ ] Chuyển bé lúc đang lưu: chặn chuyển hoặc hoàn tất mutation cho ID ban đầu; kết quả không ghi sang bé mới. Form dirty có lựa chọn ở lại/bỏ thay đổi.
- [ ] Duyệt yêu cầu A cập nhật count/dashboard A ở mọi range liên quan, không sửa B; settings đọc lại đúng và không áp dụng chung gia đình.
- [ ] Refresh/Back/deep link giữ đúng bé/module/range; link item của bé khác bị từ chối bằng API thật.
- [ ] Thu hồi liên kết khi đang xem chặn mutation, xóa dữ liệu riêng tư và không để response cũ khôi phục dữ liệu.
- [ ] Chờ duyệt hiện tại, usage hôm nay và học tập 7/30 ngày có nhãn khác nhau; missing/error không trở thành số 0.
- [ ] P2: lịch sử export và tải file đúng bé; cấu hình Family cấp Parent không đổi khi đổi bé; route cũ chuyển đúng và không vòng lặp.
- [ ] Không phát sinh regression shared shell, auth, Content/Admin; kiểm tra responsive/bàn phím cho selector và nav bổ sung.

Các checkbox là công việc tương lai. Đợt 01/10 đã triển khai entry chọn hồ sơ, dashboard riêng, settings/library/progress theo bé, approval phiên bản với quyền vai nhạy cảm tách riêng, route bản xuất theo bé, báo cáo Family cấp tài khoản và mock/API boundary; luồng mời/liên kết theo auth contract, API thật và staging vẫn cần hoàn thiện/nghiệm thu.
