# Kế hoạch triển khai Parent Portal

> Kế hoạch tổng thể cho cả ba role nằm tại [WEB_IMPLEMENTATION_PLAN.md](WEB_IMPLEMENTATION_PLAN.md). Dùng tài liệu tổng thể để quyết định kiến trúc, thứ tự triển khai và tiến độ; tài liệu này là phân rã tham khảo riêng cho Parent.

Ngày lập/cập nhật: 18/09/2026. Phạm vi: Web Frontend role Parent. Bản tối ưu theo nền tảng dùng chung của ba role.

Nguồn: `docs/PROJECT_SUMMARY.md`, router, auth và dependencies hiện có trong repository. Đây là kế hoạch đề xuất; endpoint, payload và các quyết định còn mở cần thống nhất với Backend trước khi tích hợp thật.

## 1. Mục tiêu và hiện trạng

Luồng đầu tiên cần hoàn thành: đăng nhập → vào khu vực Parent → tạo hồ sơ bé → xem/sửa hồ sơ → đăng xuất.

**Thứ tự ưu tiên:** hồ sơ bé → settings → duyệt nhân vật và quyền vai nhạy cảm → thư viện → tiến độ → dashboard. Đọc entitlement tối thiểu ngay từ bước tạo bé; trang gói đầy đủ làm sau. Tích hợp API theo module khi sẵn sàng.

Các điểm tối ưu so với kế hoạch ban đầu:

- Auth, profile, HTTP, Query provider, guards và UI primitives là công việc shared G1, không xây lại cho Parent.
- Duyệt phiên bản và duyệt vai nhạy cảm cùng một đợt, cùng màn chi tiết nhưng giữ hai trạng thái và hai hành động độc lập.
- Một layout theo bé dùng chung selector và tabs cho settings/approval/library/progress; URL quyết định bé đang xem.
- Mock bằng MSW tại biên HTTP theo kế hoạch tổng thể; không duy trì thêm một bộ mock service nghiệp vụ song song.
- Mỗi milestone có task, API đầu vào và điều kiện nghiệm thu; phần export/email chưa có contract được theo dõi riêng.

Hiện đã có React, Vite, JavaScript/JSX, React Router, CSS tokens, Nunito, Phosphor icons, public service mock và Playwright/axe. `AuthPage.jsx` chỉ kiểm tra biểu mẫu, chưa tạo tài khoản hoặc phiên đăng nhập. Chưa có Parent Portal, auth provider, route guard hoặc API thật.

Kế hoạch giữ một SPA và convention JavaScript/JSX hiện tại. Không triển khai luồng vẽ, tạo nhân vật AI, đọc truyện tương tác hay làm quiz của trẻ trên Parent Portal; các luồng đó thuộc Mobile App.

## 2. Phạm vi ưu tiên

| Mức | Module | Kết quả cần đạt |
| --- | --- | --- |
| Shared G1 | Auth và phân quyền | Tái sử dụng login/logout, khôi phục phiên, guard; register/verify/forgot/reset theo contract |
| P0 | Parent shell | Điều hướng, danh sách bé, trạng thái tải/lỗi, 403/404 |
| P0 | Hồ sơ bé | Danh sách, tạo, xem và sửa; trạng thái chưa có bé và đạt giới hạn gói |
| P0 | Cài đặt của bé | Giới hạn thời gian/ngày, category được phép |
| P0 | Phê duyệt nhân vật | Xem tranh gốc và phiên bản cần duyệt, chấp nhận/từ chối |
| Shared G1 | Hồ sơ phụ huynh | Tái sử dụng `/profile`, không tạo form riêng trong Parent |
| P1 | Dashboard và tiến độ | Tổng quan, lịch sử đọc, từ vựng, kết quả quiz theo bé |
| P1 | Thư viện | Nhân vật/truyện, lọc, yêu thích, ẩn và xóa theo bé |
| P0 | Vai nhạy cảm | Làm cùng luồng approval; phê duyệt một lần cho từng nhân vật, tách khỏi duyệt phiên bản |
| P0/P1 | Gói và hạn mức | P0 đọc entitlement để tạo bé đúng giới hạn; P1 trang gói/usage đầy đủ |
| P2 | Xuất truyện | Tạo job, theo dõi, tải file khi định dạng/API được chốt |
| P2 | Báo cáo học tập Family | UI trạng thái/cấu hình nếu contract yêu cầu; email định kỳ do Backend gửi |

Thanh toán thật, bulk action và biểu đồ nâng cao chưa nằm trong đợt triển khai đầu. Duyệt vai nhạy cảm vẫn là chức năng phải hoàn thành; trước khi có nó, hệ thống không được tự cấp quyền dùng vai nhạy cảm.

## 3. Sitemap đề xuất

| Route | Màn hình |
| --- | --- |
| `/auth/login` | Đăng nhập dùng chung |
| `/auth/register` | Đăng ký Parent |
| `/auth/verify` | Xác minh tài khoản |
| `/auth/forgot-password` | Yêu cầu đặt lại mật khẩu |
| `/auth/reset-password` | Đặt lại mật khẩu |
| `/profile` | Hồ sơ người dùng đã đăng nhập |
| `/parent` | Tổng quan; ở đợt đầu dẫn đến danh sách bé |
| `/parent/children` | Danh sách hồ sơ bé |
| `/parent/children/new` | Tạo hồ sơ bé |
| `/parent/children/:childId` | Chi tiết/sửa hồ sơ bé |
| `/parent/children/:childId/settings` | Thời gian và nội dung được phép |
| `/parent/children/:childId/approvals` | Phê duyệt nhân vật/vai nhạy cảm |
| `/parent/children/:childId/library` | Thư viện của bé |
| `/parent/children/:childId/progress` | Tiến độ học tập |
| `/parent/plan` | Gói đang dùng và hạn mức; route bổ sung đề xuất |
| `/parent/exports` | Danh sách job xuất truyện, P2 |

Parent shell có sidebar, header tài khoản và bộ chọn bé tại những màn hình theo bé. URL là nguồn xác định `childId`; đổi bé giữ module hiện tại nếu phù hợp, đồng thời tải lại đúng dữ liệu. Khi chưa có bé, hiển thị hướng dẫn tạo hồ sơ đầu tiên.

Điều hướng cấp tài khoản gồm Tổng quan, Hồ sơ bé, Gói sử dụng và Export khi được triển khai. Trong hồ sơ bé dùng tabs Hồ sơ, Cài đặt, Phê duyệt, Thư viện, Tiến độ; không lặp lại toàn bộ menu này cho từng bé trên sidebar. Dashboard ban đầu chỉ cần dẫn tới danh sách bé, không đợi thống kê để mở luồng chính.

Quy tắc điều hướng:

- Chưa có bé: hiện CTA tạo bé; không tự chọn `childId` giả hoặc gọi API nghiệp vụ thiếu ID.
- Có một bé: có thể chọn sẵn khi người dùng vào module theo bé; danh sách hồ sơ vẫn truy cập được.
- Nhiều bé: hiện tên/avatar rõ ở tiêu đề và selector. Đổi bé giữ tab, reset pagination/filter không tương thích và đóng detail của bé cũ.
- Đang sửa form: đổi bé/tab phải xử lý thay đổi chưa lưu. Nếu ở lại thì giữ nguyên URL và selection.
- Deep link sai/không có quyền: hiển thị trạng thái theo response; không âm thầm chuyển sang bé khác.
- Danh sách lớn dùng pagination và filter trên URL; chỉ thêm search/debounce nơi có nhu cầu, không thêm cho danh sách tối đa năm bé.

Guard cần chờ khôi phục phiên trước khi quyết định redirect. Chưa đăng nhập thì chuyển về login, lưu đường dẫn nội bộ để quay lại; sai role thì hiển thị 403. Backend kiểm tra quyền sở hữu child/resource cho mọi request; guard chỉ điều khiển trải nghiệm UI.

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
- Đề xuất bổ sung TanStack Query cho server state, React Hook Form + Zod cho form và Vitest + Testing Library cho logic/component. Đây là dependencies mới, chưa có trong repo.
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
| M1 | P-01, phần entitlement của P-08 | Child workspace, list/create/edit, quota tạo bé | 3–4 | G2 |
| M2 | P-02/P-03/P-04 | Settings, duyệt phiên bản và vai nhạy cảm | 4–5 | G4 |
| M3 | P-05 | Library truyện/nhân vật và thao tác cá nhân | 2–3 | G4 |
| M4 | Phần còn lại P-08 | Trang gói, usage, reset và thông báo giới hạn | 1–2 | G5 |
| M5 | P-06/P-07 | Progress trước, dashboard sau | 3–4 | G6 |
| M6 | P-09/P-10 | Export và báo cáo học tập Family theo contract | Chốt sau | G7 |

M1–M5: **13–18 ngày công riêng Parent**. Ước lượng cũ 16–23 ngày có gộp công việc shared nên không so sánh trực tiếp như mức tiết kiệm. Shared chưa có thì thực hiện G1 trước; thời gian toàn Web vẫn theo kế hoạch tổng thể và được hiệu chỉnh sau G2.

### M1 — Hồ sơ bé và entitlement tối thiểu

- Tạo cấu hình menu Parent trên shell chung; ChildWorkspaceLayout kiểm tra bé và cung cấp selector/tabs.
- `ChildForm` dùng chung create/edit: tên hiển thị, ngày sinh date-only, avatar có sẵn là đề xuất tối thiểu. Chưa làm upload avatar riêng trước khi có nhu cầu/contract.
- List/detail/create/update; quota lấy từ server, không suy ra chỉ từ tên gói. Nếu chưa tải được entitlement, hiện lỗi/retry cho phần này thay vì mặc định cho phép tạo.
- Free 1, Pro 3, Family 5 là fixtures theo cấu hình nguồn. Server vẫn có thể từ chối khi quota thay đổi giữa lúc xem và gửi form.

**Đạt khi:** Parent mới tạo được bé đầu tiên; sửa và refresh đúng; có trường hợp hết quota, lỗi field và child không thuộc tài khoản. Hai Parent và hai bé không lẫn dữ liệu. Không thêm xóa child profile khi retention chưa được chốt.

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

### M5 — Tiến độ rồi dashboard

- Progress đọc/quiz/từ vựng theo bé và khoảng thời gian; bảng và số liệu trước, chart chỉ khi cần so sánh xu hướng.
- Tách số lần từ vựng xuất hiện/nghe/trả lời đúng; không suy ra “thành thạo”. Truyện hoàn thành theo sự kiện đọc hết trang cuối từ Backend.
- Dashboard tái sử dụng summary queries hoặc aggregate endpoint. Không tải tất cả record hoặc mở nhiều request cho từng bé để tự tính tổng.
- Ưu tiên hành động: nhân vật chờ duyệt, hồ sơ/cài đặt và xem tiến độ. Chỉ hiển thị hoạt động gần đây nếu API có.

**Đạt khi:** đổi bé/thời gian không hiện dữ liệu cũ; không có hoạt động khác với lỗi tải; dashboard có partial error và không cản truy cập module đang hoạt động.

### M6 — Export và báo cáo Family

- Export create/list/detail, trạng thái queued/processing/completed/failed theo enum Backend; progress phần trăm chỉ hiện nếu có giá trị thật.
- Polling dừng khi terminal/unmount, có xử lý timeout; refresh lấy lại job. Request tạo job có idempotency nếu Backend hỗ trợ; không tự retry tạo job khi chưa biết request trước đã thành công chưa.
- Tải file thành công, lỗi/hết hạn URL, retry và quota đều theo contract. Free không xuất video; Pro 5 lượt/tháng; Family không giới hạn theo cấu hình nguồn.
- P-10: bổ sung cấu hình/trạng thái báo cáo học tập tháng nếu API yêu cầu. Backend tạo/gửi email; frontend không giả lập gửi thành công. Vị trí UI trong plan/progress quyết định sau contract, chưa cần thêm route.

**Đạt khi:** file tải được từ job thật, không tạo trùng hoặc trừ quota hai lần ngoài quy tắc; email/report chỉ đánh dấu tích hợp khi dịch vụ thật có phản hồi kiểm chứng được. Chưa có dịch vụ thì task vẫn pending, không đánh dấu Parent toàn bộ đã xong.

### Ticket bắt đầu ngay sau Shared G1

Mỗi ticket khoảng 0,5–2 ngày; tổng thời gian nằm trong milestone, không cộng thêm.

| Ticket | Kết quả bàn giao | Phụ thuộc |
| --- | --- | --- |
| PAR-001 | Models/JSDoc, schemas, services và fixtures children/entitlements | Shared HTTP/MSW và contract nháp |
| PAR-002 | Parent menu, child workspace, URL/selector và empty/forbidden states | PAR-001, shared shell/guards |
| PAR-003 | Children list + create, quota và lỗi field | PAR-001/002 |
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
| Children | List/create/detail/update; field bắt buộc, quy tắc ngày sinh, validation và quota |
| Settings | Read/update settings; category catalog; ý nghĩa danh sách category rỗng, giới hạn min/max, timezone |
| Approvals | List/detail nhân vật và tranh gốc; approve/reject theo version, conflict response |
| Sensitive roles | Read/update quyền theo nhân vật; xác định quyền này được kế thừa thế nào khi có version mới |
| Library | List/detail truyện và nhân vật; favorite/visibility/delete cho từng loại; pagination/filter |
| Progress | Khoảng thời gian, reading/vocabulary/quiz, đơn vị và timezone, định nghĩa chỉ số |
| Plan | Gói hiện tại, giới hạn/sử dụng/còn lại, ngày reset, quyền truy cập nội dung |
| Exports | Create/list/detail job, status enum, file URL và thời hạn, retry/idempotency |
| Family report | Nội dung/lịch tháng, trạng thái gửi, cấu hình nếu có, quyền truy cập và xử lý lỗi |

Khoảng trống so với danh sách API hiện có trong tài liệu: category catalog, đọc settings nếu không nằm trong child detail, entitlement/usage, detail nhân vật, thao tác thư viện nhân vật, dữ liệu dashboard và danh sách export. Cần bổ sung hoặc thống nhất tái sử dụng endpoint, không tự giả định đã có.

Fixtures nên gồm: Parent chưa có bé, nhiều bé, đạt quota; approval pending/approved/rejected và version mới; thư viện trống/ẩn; chưa có tiến độ; session hết hạn, 403, 404, conflict và lỗi mạng. Dùng dữ liệu mẫu cố định, có thể reset để test lặp lại.

Mỗi service method phải ghi payload, response, error codes, quyền sở hữu và query liên quan trước khi bắt đầu UI. Contract nháp có thể dùng mock để tiếp tục; ownership/quota/versioning chỉ được nghiệm thu thật sau khi kiểm tra trực tiếp API.

## 7. Các quyết định còn mở

- Auth/session: cookie hay bearer token, refresh, xác minh email/OTP, tên role chính thức.
- Child profile: trường bắt buộc, avatar, xử lý tuổi ngoài 3–6 và trẻ lớn lên sau khi tạo profile. Chưa thêm chức năng xóa profile khi chưa có quy tắc liên quan dữ liệu.
- Settings: timezone/reset, app background có tính thời gian hay không; giữ hay bỏ giới hạn nhân vật/ngày. Giới hạn/ngày của Parent phải tách với quota thương mại/tháng.
- Approval: lý do từ chối có bắt buộc không; chính sách quyền vai nhạy cảm khi nhân vật có phiên bản mới.
- Quota: tính lượt regenerate, lượt thất bại, quota theo account hay bé, ngày reset và xử lý khi hạ gói vượt số hồ sơ.
- Library/export: soft delete và khôi phục; file format, job API, thời hạn lưu file.
- Family report: có cho bật/tắt hoặc chọn lịch không, UI nằm ở đâu, trạng thái gửi có được trả về không; chưa tự thêm tùy chọn nhận email khi chưa có nghiệp vụ.

Các điểm này không chặn việc dựng shell và luồng mock. Mọi giả định trong mock cần ghi lại, không coi là business rule chính thức.

## 8. Kiểm thử và mốc nghiệm thu

- Unit/component cho guard chờ session, validation hồ sơ/settings và trạng thái duyệt theo version.
- Playwright cho login → tạo/sửa bé → settings → approval → thư viện → progress → logout.
- Trường hợp lỗi quan trọng: đổi bé khi request cũ đang chạy, account khác, route child không thuộc Parent, quota từ server, approval conflict, session hết hạn và gửi trùng.
- Backend integration kiểm tra quyền sở hữu bằng API thật; test mock/ẩn nút không chứng minh phân quyền server.
- Kiểm tra responsive, bàn phím/focus, label, axe cho luồng chính; có loading/empty/error/success và khả năng thử lại.
- Chạy `npm run lint`, `npm run build`, các test mới và regression public/auth liên quan. Không cần chạy test ứng dụng cho riêng tài liệu kế hoạch này.

Không viết lại test shared auth cho từng màn Parent; dùng session fixtures và kiểm tra tích hợp guard ở một số route đại diện. Mỗi E2E mutation có fixture/reset riêng để chạy song song không tranh chấp.

### Bộ kiểm thử tối thiểu theo milestone

| Mốc | Happy path | Trường hợp bắt buộc bổ sung |
| --- | --- | --- |
| M1 | Login → tạo/sửa bé → refresh → logout | Empty/quota, URL bé khác tài khoản, request cũ về sau khi đổi bé |
| M2 | Lưu settings → approve version → duyệt quyền vai | Save lỗi giữ form, conflict bản mới, nhấn gửi hai lần, đổi bé khi dirty |
| M3 | Favorite → hide/unhide → delete | Hai bé độc lập, mutation lỗi, xóa item cuối trang |
| M4 | Xem entitlement và usage | Hết quota, unlimited, lỗi tải, reset date/timezone |
| M5 | Chọn bé/date range → xem progress/dashboard | Không có hoạt động, partial error, response cũ |
| M6 | Tạo job → hoàn thành → download | Job lỗi, timeout không rõ kết quả, file hết hạn, retry không tạo trùng |

Mỗi milestone đi qua **Mock complete → API integrated → Verified on staging**. Chỉ đánh dấu hoàn thành tích hợp khi có bằng chứng API thật, không chỉ ảnh giao diện.

Mốc demo đầu tiên là **M1**. Khi thiếu thời gian, hoãn chart, bulk action, custom avatar upload và dashboard nâng cao trước; giữ đầy đủ hồ sơ/settings/approval/ownership và kiểm thử đổi bé. Export/email chỉ thay đổi phạm vi sau khi nhóm chốt lại MVP.
