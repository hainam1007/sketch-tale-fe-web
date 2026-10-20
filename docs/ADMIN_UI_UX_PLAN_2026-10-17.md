# Admin — kế hoạch hoàn thiện UI/UX, logic và dashboard

Ngày: **17/10/2026**. Tài liệu gồm baseline thiết kế và ghi nhận tiến độ triển khai.

> **Chỉ đạo triển khai:** API đã có thì nối; phần chưa có API thì làm mock; ưu tiên hoàn thiện giao diện trước. Không để thiếu Backend chặn việc xây đủ 14 trang và các luồng thao tác.

### Trạng thái cập nhật 19/10/2026

- Ba trang danh mục Gói sử dụng, Chi phí credit và Chủ đề giáo dục đã có CRUD; API thật được dùng cho catalog. Audit logs và restricted keywords cũng đã chuyển sang API thật trong source.
- Users, permissions, reports, system limits, monitoring, statistics và topic rules vẫn là mock; cần nhãn “Dữ liệu mô phỏng” ở local và bản deploy. Các API thật chưa được nghiệm thu trên Render.
- Lint/build từng đạt ở lần kiểm tra được ghi ngày 17/10, nhưng không bao gồm các thay đổi tích hợp ngày 19/10. Chưa có kiểm tra UI mới hoặc xác minh mutation thật cho source hiện tại; coi các checklist nghiệm thu dưới đây là còn mở.

## 1. Cách dùng và mức xác minh

- Đọc cùng [Admin contract](ADMIN_CONTRACT.md), [tổng quan dự án](PROJECT_SUMMARY.md), [design system](DESIGN.md), [runbook API hiện hành](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md) và [báo cáo tích hợp](api-integration/luna-extramax/implementation-report-2026-10-19.md).
- Baseline và các findings trong phần dưới được lập ngày 17/10. Nếu thông tin API/source khác, dùng trạng thái 19/10 ở đầu tài liệu, báo cáo tích hợp và runbook. Nghiệp vụ trong project summary vẫn giữ; đề xuất trong tài liệu này không tự trở thành contract Backend.
- Đã đọc đủ 11 page Admin, router, shell/CSS liên quan, service/models/query keys, transport, allowlist Backend, handler mock và suite Admin hiện có. **Audit tĩnh; chưa chạy browser, kiểm thử hoặc xác nhận API live trong đợt lập kế hoạch này.** Những vấn đề thị giác cần kiểm chứng bằng ảnh là nhiệm vụ nghiệm thu, không phải lỗi đã quan sát trên màn hình.
- Repo có nhiều thay đổi chưa commit ở Auth/Content/Parent/shared. Khi thực hiện phải đọc diff trước, giữ nguyên công việc hiện có; không reset/checkout hàng loạt hoặc ghi đè file shared.
- Mục tiêu “không lỗi” được chuyển thành tiêu chí có thể kiểm chứng. Chỉ kết luận đạt sau khi đủ kiểm thử; không cam kết tuyệt đối chỉ từ việc đọc code.

**Phạm vi đã được người dùng chốt:** nâng cấp 11 route Admin hiện có và thêm **3 trang quản lý gói, chi phí credit, chủ đề giáo dục**, tổng cộng **14 trang**; gồm shell, dialog/drawer và luồng profile/auth liên quan. Dashboard là nâng cấp `/admin` đã có, không tạo một dashboard trùng chức năng. **Dashboard ưu tiên điều hành hệ thống**; phân tích dài hạn ở `/admin/statistics`.

Ngoài đợt này: thanh toán/checkout, quản lý subscription cá nhân, ví credit/nạp hoặc điều chỉnh số dư, xóa/mời tài khoản, permission builder, bulk/export, dark mode, WebSocket, CRUD restrictions và chỉnh sửa Story Editor bằng Admin. “Quản lý credit” trong đợt này là cấu hình chi phí theo tính năng đúng API `credit-costs`; chưa có contract quản lý ví/giao dịch.

### 1.1. Quy tắc API thật / mock — ưu tiên UI

1. **Endpoint đã có và request/response đủ rõ:** nối service thật ngay trong ticket của trang, không hoãn toàn bộ tới đợt tích hợp cuối. Kiểm tra authorization qua server; endpoint tồn tại không tự chứng minh role được quyền ghi. Dữ liệu 0/false/null và response body rỗng phải được adapter bảo toàn.
2. **Endpoint chưa có:** triển khai đầy đủ UI + service interface + mock có trạng thái và mutation; không chỉ vẽ nút disabled hoặc màn unavailable trong bản phát triển. Người dùng phải thử được search/filter/pagination, create/edit/action, success/error/conflict và quay lại thấy thay đổi trong phiên demo.
3. **Có API đọc nhưng thiếu contract cho một action/field:** nối GET thật; hoàn thiện form/action đó trong chế độ demo với dataset mock riêng. Không lấy bản ghi thật rồi báo đã lưu bằng mock, không trộn mutation mock với danh sách thật. Action không thể gửi an toàn ở chế độ real có giải thích tại chỗ; phần còn lại vẫn hoạt động.
4. **Không tự fallback real → mock khi gặp lỗi:** 401/403/404/5xx/network vẫn là trạng thái lỗi của nguồn thật. Chọn data source có chủ đích theo module, hiển thị nhãn nguồn ở cấp trang; không để người dùng hiểu nhầm thao tác demo đã thay đổi hệ thống.
5. **Mock cho chức năng chưa có API:** dùng được cả local và bản deploy theo chỉ đạo người dùng, có nhãn “Dữ liệu mô phỏng”; dữ liệu demo không được trình bày như dữ liệu thật. API đã chọn real không fallback mock khi lỗi. Không sửa `.env.production` chỉ để test.
6. **Contract gate chỉ chặn action real chưa đủ thông tin và nghiệm thu tích hợp**, không chặn layout, form, dialog, fixture, luồng mock hoặc visual QA. Không cần hỏi lại người dùng có được làm mock cho 11 trang core hay không: đã được chỉ đạo trong chat.

| Phần giao diện | Nguồn ban đầu theo bằng chứng hiện có | Việc Luna phải làm |
| --- | --- | --- |
| Admin core: Overview, Users/detail, Permissions, Reports/detail, Limits, Monitoring, Statistics, topic rules | Mock theo chính sách hiện tại; chưa có API đủ cho các luồng này | Hoàn thiện workflow mock đủ state; thêm nhãn dữ liệu mô phỏng ở local và production |
| Restrictions và Audit | Restricted keywords và audit logs đã có adapter real; topic rules và một số workflow vẫn mock | Nghiệm thu schema, quyền và persistence thật; giữ nhãn mock cho thao tác chưa có API |
| Gói sử dụng | Catalog API đã được adapter trong source | Nghiệm thu GET/mutation/read-after-write và quyền; không mô phỏng billing hay entitlement chưa có contract |
| Chi phí credit | Catalog API đã được adapter trong source | Nghiệm thu schema, zero/false/null, quyền và tác động; không suy diễn ví/số dư |
| Chủ đề giáo dục | Catalog API đã được adapter trong source | Nghiệm thu enum/status, reference behavior và read-after-write; topic rules riêng vẫn mock |

Ma trận này là trạng thái source theo rà soát 19/10; snapshot không chứng minh quyền hay persistence trên Backend. Findings A02–A15 bên dưới là audit 17/10 và cần tái hiện trước khi coi là lỗi hiện hành. Thêm API mới vào adapter/allowlist sau khi có bằng chứng; không đoán endpoint từ tên trang.

## 2. Phát hiện hiện tại và thứ tự sửa

Mức P0: sai quyền/dữ liệu/quyết định hoặc chặn tích hợp; P1: sai luồng hoặc thiếu khả năng phục hồi; P2: chất lượng trình bày. Tất cả vẫn cần hoàn tất trước khi đánh dấu toàn bộ UI đạt.

| ID | Mức | Bằng chứng trong code | Hậu quả / yêu cầu sửa |
| --- | --- | --- | --- |
| A01 | P0 | API Admin chỉ có cho một số capability: catalog, audit logs và restricted keywords; các module core chưa có API đủ | Giữ real theo capability đã nối; phần chưa có API dùng mock có nhãn ở cả local và production. Không bật real cho cả vùng Admin. |
| A02 | P0 | User detail dùng `!target.allowedActions`; report detail fallback action theo status; Restrictions không kiểm tra capability; Monitoring chỉ kiểm tra status | Thiếu dữ liệu quyền vẫn hiện thao tác. Fail closed, capability thiếu/lỗi thì chỉ đọc; Backend vẫn phải authorize mỗi request. |
| A03 | P0 | Limits dùng `source.revision` mới nhất nhưng `draft` giữ từ lần đọc trước; Permissions lấy revision từ row hiện tại; Reports lấy revision trong query tại lúc submit | Refetch có thể ghép draft cũ với revision mới và bỏ qua phát hiện ghi đè. Chốt snapshot khi bắt đầu sửa/xác nhận; conflict có so sánh và xác nhận lại. |
| A04 | P1 | `AdminAuditPage.updateFilter` xóa mọi giá trị `all`, trong khi range mặc định `30d` | Chọn “Tất cả thời gian” quay về 30 ngày. Serializer theo từng field, giữ `range=all`. |
| A05 | P1 | Restrictions/Monitoring dùng một `pendingId`; thao tác dòng khác được phép khi request trước còn chạy | Pending bị ghi đè/xóa bởi request khác. Pending/error/success theo resource ID hoặc tuần tự hóa rõ ràng. |
| A06 | P1 | Monitoring không gửi revision/idempotency; cancel dùng `window.confirm`; `usage ||` làm 0 thành “Chưa có” | Chống gửi trùng và kết quả không xác định; thay dialog; giữ số 0; action dựa capability. |
| A07 | P1 | Limits mutation không invalidate Audit; Reports/Monitoring không invalidate Overview; Restrictions/Monitoring không invalidate Audit | Tổng quan/log có thể cũ sau mutation. Áp dụng ma trận cache mục 6. |
| A08 | P1 | Users/Reports detail quay về route trần; Users search push URL từng phím; nhiều query giữ dữ liệu cũ không có chỉ báo | Mất ngữ cảnh và lịch sử trình duyệt nhiễu; dữ liệu cũ trông như kết quả lọc mới. Debounce, return context, trạng thái đang cập nhật. |
| A09 | P1 | Audit dialog chỉ có `aria-modal`, chưa quản lý focus/Escape; Admin forms chưa có dirty guard | Tab ra ngoài, đóng không trả focus, rời màn mất draft. Dùng dialog/guard thật, không chỉ thêm ARIA. |
| A10 | P1 | Report detail chỉ có metadata/evidence text và khối chữ “Preview chỉ đọc” | Chưa phải preview target thật. Cần endpoint/payload được phép xem; không ghi đã hoàn thiện bằng chứng. |
| A11 | P1 | Overview truy cập trực tiếp `counts/queue/recentAudit`; Statistics truy cập `summary/trend`; các page format Date không bảo vệ giá trị lỗi | Payload thiếu/partial hoặc ngày lỗi có thể làm hỏng trang. Validate adapter; null khác 0; phục hồi từng section. |
| A12 | P1 | Permissions tải cả catalog/users rồi lọc local; Restrictions/Monitoring cũng lọc local; Audit page/pageSize lấy `Number` trực tiếp | Chưa có chiến lược scale, URL lạ gây trạng thái không hợp lệ. Chốt pagination theo endpoint; không tự gọi tổng số của một trang là tổng hệ thống. |
| A13 | P0 | Mock cho bỏ revision; hạ role đếm mọi admin thay vì admin active; khóa user chưa bảo vệ last active admin; Limits chưa ghi audit | Mock hiện chưa chứng minh policy. Sửa fixture/handler theo contract và test trực tiếp trên Backend trước release. |
| A14 | P1 | Mock Reports `updated_desc` vẫn ưu tiên status trước updatedAt; overview ghép reports trước jobs rồi cắt 5 | Nhãn sắp xếp và “ưu tiên” không đúng thuật toán. Chọn sort riêng, ổn định với ID tie-break; không để jobs bị che bởi reports. |
| A15 | P2 | Copy lẫn “target/role/constraint/mock”, số liệu/metadata CSS có đoạn 10–11px; page title phần lớn chung “Admin Control Room” | Việt hóa, tăng độ đọc, title theo trang; kiểm tra thực tế tương phản và responsive. |

Tài liệu cũ cần sửa cách diễn đạt: Overview/service/mock đã tồn tại; Users/Reports đã có pagination; Permissions đã có reason riêng và kiểm tra capability. Không giao Luna làm lại các phần này từ đầu.

## 3. Định hướng giao diện chung

### 3.1. Shell và thứ bậc thị giác

- Giữ Nunito Variable, Phosphor, React/JSX, React Query và CSS hiện có. Admin là công cụ đọc dữ liệu, giữ nhận diện kem/vàng/navy của SketchTale, không thêm hero minh họa lớn hoặc animation làm chậm thao tác.
- Thêm wrapper `.workspace-app-admin` và CSS Admin có scope. Không đổi selector chung khiến Parent/Content/Profile đổi ngoài ý muốn.
- Sidebar nhóm: **Tổng quan**; **Tài khoản & quyền** (Tài khoản, Phân quyền); **An toàn nội dung** (Báo cáo, Nội dung hạn chế); **Vận hành** (Giám sát, Giới hạn hệ thống); **Phân tích & truy vết** (Thống kê, Nhật ký). Detail giữ active mục cha. Profile/đăng xuất giữ ở cuối.
- Thêm nhóm **Danh mục & gói**: Gói sử dụng, Chi phí credit, Chủ đề giáo dục. Menu có cuộn khi chiều cao laptop nhỏ; không đẩy Profile/đăng xuất ra vùng không thể truy cập. Ba trang mới dùng route đề xuất ở AD-12–14, không đổi URL API theo URL giao diện.
- Header gọn: breadcrumb → H1 → mô tả một dòng; bên phải tối đa một CTA chính và hành động phụ. Tiêu đề không đẩy nội dung chính ra khỏi màn laptop 1366×768.
- Đề xuất kích thước: content padding desktop 24–32px, mobile 16px; gap section 24px; gap control 12–16px; H1 28–32px, H2 18–20px, body/control 14–16px, metadata 12–13px. Số liệu `tabular-nums`; tên/email dài được xuống dòng hoặc có cách xem đầy đủ.
- Control cao khoảng 40–44px, vùng bấm mobile ít nhất 44px; border radius control 8–10px, panel 12–16px. Dùng token semantic, không rải hex mới. Giữ màu đỏ cho tác động nguy hiểm/lỗi, vàng cho cần chú ý, xanh cho thành công; không dùng màu làm tín hiệu duy nhất.
- 1440px: sidebar + nội dung tối đa khoảng 1440px; 768px chuyển menu drawer khi không đủ rộng; 390/360px một cột. Bảng rộng chỉ cuộn trong vùng bảng có nhãn và focus; Users/Permissions ưu tiên row/card gọn trên mobile, vẫn giữ đủ action.

### 3.2. Tương tác, bảng và biểu mẫu

- Toolbar có label rõ, số kết quả đúng scope, “Xóa bộ lọc”; mặc định page=1, pageSize=10, lựa chọn 10/25/50. URL enum lạ normalize về mặc định hợp lệ; không cho NaN/âm/0/fraction vào query.
- Search input local phản hồi ngay, debounce khoảng 300ms trước query và replace URL; filter/page thay đổi có lịch sử điều hướng hợp lý. Back/Forward phải cập nhật input và dữ liệu. Abort query cũ, query key chứa toàn bộ filter và tài khoản đang đăng nhập.
- Khi giữ dữ liệu query trước: thông báo “Đang cập nhật”, `aria-busy`; không cho action trên row không còn khớp filter/query hoặc thiếu freshness. Không hiển thị tổng cũ như tổng mới đã xác nhận.
- Khi page vượt total sau mutation: quay về trang hợp lệ một lần; không mắc vòng refetch. Nếu kết quả rỗng vẫn có toolbar/reset và đường về trang 1.
- Detail quay lại đúng search/filter/page/sort, có fallback route danh sách khi mở URL trực tiếp. `returnTo` chỉ cho phép route nội bộ đúng module, không điều hướng URL tùy ý.
- Action nhạy cảm: dialog có tên/ID đối tượng, hiện tại → đề nghị, tác động, reason, nút Hủy và nút đúng động từ. Pending khóa đúng action; không báo thành công trước response.
- Dialog: focus đầu vào phù hợp, trap focus, Escape theo trạng thái, trả focus về trigger, background không tương tác, nội dung dài cuộn bên trong. Pending có cách xử lý đóng rõ ràng; không coi đóng dialog là hủy request đã gửi.
- Dirty guard cho Limits, Permissions, Report note và reason đang sửa: link nội bộ, sidebar, browser back, profile, đăng xuất và reload/close. Reload dùng khả năng cảnh báo native; không lưu bằng chứng nhạy cảm vào localStorage để làm draft recovery mặc định.
- Mutation error ở đúng row/form. `422` gắn field + error summary/focus đầu field lỗi; `409` phân biệt conflict với policy; `403` chỉ đọc/không quyền, không ép logout mọi 403; `401` theo auth flow hiện có và xóa cache được bảo vệ.
- Timeout mutation: “Chưa xác định kết quả”, đối chiếu trạng thái qua GET hoặc operation ID; không tự gửi lại nếu chưa có idempotency. Thành công nhưng refresh thất bại: báo đã lưu + dữ liệu danh sách chưa cập nhật, không báo lưu thất bại.

### 3.3. State bắt buộc

Mỗi trang có loading lần đầu, populated, empty thực, no-match, refresh, stale/refetch error, request error, forbidden, unavailable; detail thêm not-found. Form thêm pristine/dirty/invalid/saving/success/conflict/unknown-outcome. State không áp dụng phải ghi N/A có lý do, không dựng UI thừa.

Unavailable là trạng thái một capability chưa được triển khai, không phải “0 dữ liệu” hay lỗi mạng. Theo chỉ đạo hiện tại, chức năng chưa có API phải chạy bằng mock có nhãn “Dữ liệu mô phỏng” ở cả local và production. API thật bị lỗi phải hiện lỗi thật, không fallback mock.

## 4. Đặc tả từng trang

### AD-01 — Dashboard điều hành `/admin`

**Mục đích:** trong một màn nhìn thấy việc cần làm, chọn đúng nơi xử lý, biết dữ liệu cập nhật lúc nào.

**Bố cục:** header “Tổng quan quản trị” + thời điểm cập nhật + Làm mới; một hàng 4 KPI; phía dưới hai vùng “Báo cáo cần xử lý” và “Tác vụ cần chú ý”; cuối là nhật ký gần đây và link Thống kê. Ở mobile xếp theo thứ tự KPI → báo cáo → jobs → nhật ký. Không gom mọi nội dung vào các card lồng nhiều tầng.

**KPI bắt buộc khi nguồn có:** report open, report under_review, job failed, job processing. Mỗi KPI có định nghĩa phạm vi “Hiện tại”, nhấn mở đúng bộ lọc. Không gắn bộ chọn 7/30 ngày lên backlog hiện tại gây hiểu nhầm.

**Danh sách công việc:** tách reports/jobs để một loại không lấn hết loại kia; mỗi vùng tối đa 5 bản ghi và “Xem tất cả”. Reports ưu tiên lâu chưa xử lý theo policy BE; severity/SLA chỉ thêm khi có nguồn. Jobs lỗi có loại, đối tượng, thời gian và thông báo lỗi an toàn. Link tới job cụ thể qua `jobId`/drawer được hỗ trợ, không chỉ dẫn về danh sách trần.

**Nguồn dữ liệu:** giữ `adminService.getOverview`; `/admin/overview` hiện là đường dẫn frontend/mock, chưa phải API real được xác nhận. Đề nghị aggregate trả counts, queue chia nhóm, recentAudit, generatedAt, timezone, trạng thái/lỗi từng section. Backend tổng hợp; FE không tải toàn bộ Users/Jobs/Reports để đếm.

**Logic:** null hiển thị “Chưa có dữ liệu”, 0 hiển thị 0; không lấy queue.length làm count. Partial error giữ section tốt và retry phần lỗi nếu API hỗ trợ; nếu chỉ có aggregate, nút làm mới gọi lại aggregate và giữ section cũ có nhãn. Freshness ghi thời điểm dữ liệu, không ghi giờ browser vừa render. Không suy ra “hệ thống khỏe” chỉ vì không có job lỗi.

**Nghiệm thu:** bốn KPI mở đúng filter; count khớp aggregate và scope; xử lý report/retry job cập nhật Overview; partial/null/ngày lỗi không crash; không tạo số tăng trưởng hoặc uptime giả. Polling chỉ khi cần và tab đang visible, dừng khi mất quyền/offline; không thêm polling dày cho dashboard tĩnh.

### AD-02 — Tài khoản `/admin/users`

**Bố cục:** header; search + role + status + sort + pageSize; bảng tên/định danh, role, status, hành động. Child không có email vẫn tra cứu theo định danh BE hỗ trợ; không biến hồ sơ trẻ thành account.

**Cần làm:** sửa mô tả đang chỉ nhắc Parent/Content; debounce; indicator refetch; return context; enum/pageSize hợp lệ; empty/no-match riêng. Dùng id ổn định, sort có tie-break; không tự thêm cột ngày/gói nếu endpoint chưa có dữ liệu đáng tin.

**Logic:** filter Child là khả năng tra cứu, không mặc nhiên cho đổi account đó thành Admin. Status không nhận biết hiển thị trung tính; không gắn tất cả status khác locked thành active màu xanh. Không có khóa nhanh hoặc bulk trong đợt này.

**Nghiệm thu:** lọc Child → page 2 → detail → quay lại → reload giữ ngữ cảnh; search nhanh không hiện response cũ; page sai tự sửa; tên dài/email thiếu không tràn; role Parent/Content truy cập trực tiếp bị guard và API chặn.

### AD-03 — Chi tiết tài khoản `/admin/users/:userId`

**Bố cục:** breadcrumb/back; identity + status; thông tin tài khoản; khu vực “Trạng thái truy cập”; liên kết Phân quyền đúng target và Nhật ký theo targetId khi contract hỗ trợ. Revision là metadata kỹ thuật có thể ẩn trong chi tiết, không làm nội dung chính.

**Luồng:** chọn Khóa/Mở khóa → dialog identity, tác động, reason → xác nhận với snapshot revision → cập nhật status → invalidate các nguồn liên quan. Khóa và mở khóa dùng cùng chất lượng xác nhận, tránh `window.confirm`.

**Policy:** không tự khóa; bảo vệ admin active cuối cùng ở BE bằng xử lý atomic; capability thiếu thì không thao tác. Quyết định khóa ảnh hưởng token/phiên hiện tại phải được mô tả theo BE, không tự hứa “đăng xuất ngay mọi thiết bị”. Không truyền reason đang thay đổi sau submit: đóng gói payload một lần.

**Conflict:** giữ reason và bản đã đọc; tải bản mới vào vùng so sánh, người dùng xem lại rồi xác nhận. Khi route userId đổi, reset/key form đúng target; tuyệt đối không giữ reason của người trước sang người sau.

**Nghiệm thu:** self/last-active-admin/403/404/409/422; nút pending không gửi đôi; lỗi giữ reason; thành công hiện đúng Users/Permissions/Audit; mở detail trực tiếp vẫn quay về an toàn.

### AD-04 — Phân quyền `/admin/permissions`

**Bố cục:** bảng tra cứu read-only + nút “Đổi vai trò” theo dòng; chọn một target mở drawer/dialog. Bên trong: danh tính, role hiện tại, role được phép gán, tác động/hiệu lực, reason, diff và xác nhận. Tránh hàng chục select/reason luôn mở gây khó quét.

**Dữ liệu:** catalog chung và roles theo target; không dùng catalog chung như quyền gán mọi role. Với role hiện tại không nằm trong lựa chọn, vẫn hiển thị đúng role hiện tại dạng read-only. Child policy phải chốt; không “sửa” mismatch bằng cách cho Child tất cả roles.

**Logic:** lưu `{ targetId, originalRole, draftRole, revisionAtEdit, reason }`; đổi target có dirty guard; lưu xong reset draft/error đúng target; khi thay đổi role, user detail/users/catalog bị ảnh hưởng phải đồng bộ. Một target không được nhận hai mutation song song.

**Quy mô:** shape hiện tại `{users, roles}` giữ qua adapter. Nếu chuyển server pagination/search phải có contract và query key mới; trong giai đoạn fixture không giả phân trang toàn hệ thống trên subset.

**Nghiệm thu:** thiếu catalog/capability không sửa; hạ admin active cuối cùng bị BE từ chối; refetch giữa lúc sửa không thay revisionAtEdit; lỗi nằm trong dialog target, thành công phản ánh cả Users/detail; empty đúng khi search không khớp.

### AD-05 — Hàng đợi báo cáo `/admin/reports`

**Bố cục:** header; bộ lọc trạng thái/tìm kiếm/sắp xếp/pageSize; danh sách dày vừa đủ gồm ID, loại đối tượng, tiêu đề, lý do rút gọn, người xử lý, thời điểm, badge. Không đưa toàn bộ bằng chứng dài lên queue.

**Sort:** “Cập nhật mới nhất” chỉ sort updatedAt giảm dần; “Cũ nhất trước” theo createdAt tăng dần; nếu có “Ưu tiên xử lý” dùng enum/thuật toán riêng. Không đánh tráo nhãn với thuật toán trong mock hiện tại.

**Logic:** bộ lọc URL, giữ ngữ cảnh khi mở detail; tab count nếu có phải lấy aggregate cùng filter scope, không tính từ một page. “Nhận xử lý” không đồng nghĩa lock tài khoản/ẩn nội dung. Không thêm assignee filter trước khi API hỗ trợ.

**Nghiệm thu:** sort khớp fixture có ngày/status chéo nhau; xử lý xong report rời filter đúng và page được hiệu chỉnh; loading không báo 0 kết quả sai; bộ lọc từ dashboard được giữ đến detail và khi quay lại.

### AD-06 — Chi tiết báo cáo `/admin/reports/:reportId`

**Bố cục:** tiêu đề/ID/status; desktop vùng bằng chứng rộng và panel quyết định hẹp; mobile bằng chứng trước, quyết định sau. Lịch sử ghi chú có author/time, phân biệt bằng chứng gốc với nhận xét quản trị.

**Bằng chứng:** metadata và preview thực chỉ đọc theo payload được cấp quyền; ảnh lỗi/asset hết hạn/target deleted/forbidden có state riêng. Không mở Story Editor vượt role guard. Không đưa raw HTML không tin cậy vào DOM. Không hứa đã xem đầy đủ target khi chỉ có evidence text.

**Workflow mục tiêu:** `open → start_review → under_review → resolve/reject → resolved/rejected`; `reopen → open` khi được cấp quyền. Server quyết định allowedActions, assignee và required reason/note. Đề xuất bắt buộc note cho resolve/reject/reopen, cần chốt trước tích hợp; không tự thêm “Lưu ghi chú” khi chưa có endpoint độc lập.

**Luồng:** nhập note → chọn action → xem quyết định và tác động → gửi revisionAtEdit → hiển thị kết quả. Không resolve thay cho hide target. Nếu mở moderation target sau này, cần action/contract riêng và trạng thái partial success rõ ràng.

**Nghiệm thu:** transition sai bị server chặn; action thiếu/unknown không tạo nút thực thi; hai admin cùng quyết định tạo conflict; refetch giữ note và snapshot; rời trang cảnh báo; target thiếu không làm mất lịch sử; reports/audit/overview đồng bộ.

### AD-07 — Giới hạn hệ thống `/admin/system-limits`

**Bố cục:** nhóm Nội dung (asset MB, số trang, slot mỗi vai), AI (lượt/phút), Tài khoản (hồ sơ/Parent); helper về đơn vị/phạm vi; thanh Lưu/Hủy khi dirty; vùng diff trước/sau và tác động trước áp dụng. Giữ năm field hiện tại, không tạo field quota thương mại tùy ý.

**Logic:** draft là string để xóa/sửa được; validate required, integer an toàn, min/max theo schema, không tự suy ra 0 = unlimited. Lưu snapshot baseline+revision khi bắt đầu sửa; refetch chỉ báo có bản mới. Pending khóa field hoặc giữ riêng draft mới có version; mặc định khóa để response không xóa thao tác gõ tiếp.

**Policy cần BE:** hiệu lực với request mới hay cả job đang chạy; dữ liệu đã vượt ngưỡng có giữ được không; maxSlotsPerRole tính ở page hay toàn truyện; aiGenerationsPerMinute là global/account; MB dùng đơn vị nào; lý do và audit. Hạn mức gói tháng và giới hạn do Parent đặt là các lớp khác nhau, không thay lẫn nhau.

**Nghiệm thu:** rỗng/0/âm/thập phân/số quá lớn đều xử lý rõ; lỗi field được đọc bởi screen reader; Hủy về baseline đã chọn; conflict không âm thầm ghi đè; lưu lỗi giữ draft; thành công refetch và Audit có event; rời trang khi dirty được bảo vệ.

### AD-08 — Nội dung hạn chế `/admin/restrictions`

**Bố cục:** search + type + status; bảng/card giá trị, loại, scope, lý do, thời gian, trạng thái; “Bật/Tắt” là action rõ nhãn. Không mặc định viết “chặn trước publish” nếu scope BE còn chưa xác nhận.

**Luồng:** xem rule → bật/tắt → xác nhận phạm vi và tác động + reason nếu contract yêu cầu → gửi revision → refresh. Chỉ hiện control khi allowedActions phù hợp. Toggle không đổi trạng thái trước response.

**Concurrency:** pending/error theo ID; A và B có thể pending độc lập, A hoàn tất không mở khóa B. Một rule đang pending không gửi tiếp. Conflict tải bản mới có chủ đích.

**Contract:** xác nhận match dấu tiếng Việt/case/word boundary, exact hay substring, scope, thời điểm hiệu lực. Không triển khai normalization ở FE như cơ chế thực thi policy. CRUD/deduplicate chỉ làm nếu scope mở rộng.

**Nghiệm thu:** bật/tắt đúng target, double click không lặp, hai rule không lẫn trạng thái; 403/409 giữ dữ liệu cũ; unknown type/status trung tính; Audit phản ánh thay đổi; danh sách lớn có pagination theo contract.

### AD-09 — Giám sát tác vụ `/admin/monitoring`

**Bố cục:** summary đúng phạm vi + timestamp; search/type/status khi nguồn hỗ trợ; bảng job ID, loại, target, trạng thái, tiến độ, cập nhật, action; drawer chi tiết theo `jobId` có lịch sử attempt/error đã được lọc thông tin nhạy cảm.

**Logic:** summary toàn hệ thống dùng aggregate, không đếm current page; nếu chỉ có list subset phải ghi scope rõ. Progress null = “Chưa có tiến độ”, 0 là 0%, render thanh trong 0–100 và cảnh báo dữ liệu sai thay vì thanh vượt container. Usage 0 không biến thành thiếu.

**Action:** retry/cancel theo capability và trạng thái server; gửi revision/version và idempotency key theo contract. Retry có thể tạo attempt/job mới: hiển thị đúng ID trả về. Cancel accepted không đồng nghĩa cancelled; hỗ trợ cancelling khi BE có. Hiển thị phí/quota ảnh hưởng chỉ khi BE cung cấp.

**Polling:** 15 giây là điểm khởi đầu cho jobs đang chạy/đang hủy; dừng background/offline/unmount/mất quyền, backoff khi lỗi/429. Khi filter chỉ có failed/completed, vẫn cần refresh thủ công và chính sách refresh khi quay lại tab để phát hiện job mới. Poll không reset dialog/reason/snapshot.

**Nghiệm thu:** retry gửi một lần; timeout đã thực thi không tạo attempt trùng; pending A/B độc lập; job hoàn tất trước cancel bị xử lý rõ; refetch lỗi giữ last-known data có nhãn; links Overview/Audit mở đúng job; list/audit/overview được làm mới.

### AD-10 — Thống kê `/admin/statistics`

**Mục đích:** phân tích sử dụng theo thời gian, tách khỏi backlog cần xử lý hiện tại.

**Bố cục:** header + 7/30 ngày + timezone/phạm vi; KPI có định nghĩa; biểu đồ xu hướng khi có đủ buckets; bảng số liệu tương đương để đọc bằng bàn phím và đối chiếu. Không bổ sung thư viện chart trước khi kiểm tra dependency và nhu cầu; chart đơn giản có thể dùng SVG truy cập được.

**Metric:** “User hoạt động” phải chốt là account status active hay user có sự kiện trong kỳ. Nếu là status active, đổi nhãn “Tài khoản đang hoạt động” và ghi snapshot, không gọi DAU/MAU. User bị khóa là snapshot tại thời điểm chốt hoặc sự kiện khóa trong kỳ — chọn một định nghĩa. Nhân vật là tạo thành công trong kỳ hay tổng tồn tại; readingMinutes theo log hợp lệ, không tự tính từ thời gian mở tab.

**Nghiệm thu:** range URL enum hợp lệ; refresh giữ range; 0/null/missing day khác nhau; không nối đường qua gap như có dữ liệu; không cộng unique users từng ngày thành unique users toàn kỳ; phần trăm mẫu số 0 hiện “Không có cơ sở so sánh”; thiếu previous period thì không vẽ tăng trưởng. Partial warning đặt tại metric/section bị ảnh hưởng.

### AD-11 — Nhật ký thao tác `/admin/audit`

**Bố cục:** actor/action/range/search/pageSize; result/targetId/type khi API hỗ trợ; bảng time, actor, action, target, result, Xem chi tiết. Drawer có event ID, timestamp timezone, reason, diff đã lọc, requestId nếu nguồn có. UI chỉ đọc.

**Sửa ngay:** giữ `range=all`; normalize pagination; sort mới nhất trước có ID tie-break; missing filters metadata không làm crash; safe date; quản lý focus/Escape/scroll dialog. Không hiển thị lời hứa “Backend sẽ cung cấp” như nội dung sản phẩm chính.

**Logic:** target filter theo ID/type, không dùng tên search thay cho liên kết chính xác. Actor bị xóa vẫn đọc event theo snapshot được phép. Result unknown trung tính; failed/denied chỉ hiển thị khi backend thực sự ghi. Không tự append audit success từ frontend, không đoán diff.

**Nghiệm thu:** chọn all thật sự giữ all sau reload; event cũ hơn 30 ngày xuất hiện; lọc target A không lẫn tên giống A; mở/đóng drawer giữ filter/page và trả focus; mutation mỗi module có đúng actor/target/result/reason theo contract; không có nút sửa/xóa log.

### AD-12 — Gói sử dụng `/admin/subscription-plans` (mới)

**Bố cục:** header + “Tạo gói”; bảng code/tên, giá với đơn vị được xác nhận, credit/kỳ, giới hạn hồ sơ, trạng thái, thao tác. Search và lọc active local chỉ khi GET thực sự trả toàn danh mục; pagination local có thể dùng cho danh mục đầy đủ, phải phân biệt với server pagination. Form create/edit trong drawer rộng gồm: định danh; giá/thời hạn; hạn mức; quyền lợi; trạng thái. Có diff và xác nhận trước cập nhật.

**Schema đã thấy trong snapshot 19/10:** `name`, `code`, `price`, `childProfileLimit`, `monthlyCreditLimit`, `accessFullStories`, `canExportStory`, `durationDays` nullable, `freeTrialDays` nullable, `isActive`. GET DTO thêm ID/timestamp; không có currency, revision, allowedActions hoặc audit metadata. Không dựng thêm quyền lợi Family/email/regenerate thành field lưu nếu API không hỗ trợ.

**API:** GET/POST `/subscription-plans`; GET/PATCH/DELETE `/subscription-plans/:id`. Prefix `/api` do HTTP boundary thêm đúng một lần. Ưu tiên GET by ID sau lưu; endpoint by code có path/query parameter chưa thống nhất trong snapshot, cần xác nhận riêng nếu dùng.

**Logic:** phân biệt 0, null, empty, false. Giá 0 có thể là Free nhưng min/unit/currency phải xác nhận; không tự gắn VND hoặc `/tháng`. `monthlyCreditLimit` là credit, không tự thay bằng 5/30/100 lượt tạo đã mô tả trong tài liệu sản phẩm; phải có mapping chi phí tính năng và quyết định nghiệp vụ. Không tự hiểu `durationDays=null` là vĩnh viễn, hay 0 limit là vô hạn. Giữ false khi submit, không lọc bằng truthiness.

**Tác động cần chốt:** sửa giá/quyền lợi áp dụng subscription hiện hữu hay lần mua/gia hạn tiếp theo; đổi code có phá consumer không; tắt gói có chặn mua mới và giữ quyền cũ không. UI hiển thị chính sách đã xác nhận, không tự đoán. Code nên read-only khi edit cho tới khi BE xác nhận có thể đổi. Duplicate code cần field error rõ.

**Xóa:** có endpoint nhưng reference/soft-delete chưa rõ. UI design có confirmation tên/code và tác động; chỉ bật real action khi BE xác nhận policy. Ưu tiên ngừng cung cấp bằng `isActive=false` khi đúng semantics; không coi disable là tương đương delete. `409` gói đang được dùng giữ bản ghi và giải thích, không thử xóa subscription liên quan.

**Nghiệm thu:** create → reload → edit → reload giữ 0/false/null; giá không gắn đơn vị bịa; quyền lợi giữ đúng boolean; duplicate code/403/404/409/422/timeout; thay đổi gói đang dùng không âm thầm đổi quyền subscription; khi POST không trả ID không tự sinh ID để đưa vào list, refresh danh mục và đối chiếu key được BE xác nhận duy nhất.

### AD-13 — Chi phí credit `/admin/credit-costs` (mới)

**Bố cục:** header + “Thêm cấu hình chi phí”; bảng feature key, tên Việt/Anh, cost, active, cập nhật; tìm theo key/tên; form chi tiết theo một target. Gọi đúng “Chi phí credit”, không gọi “Số dư người dùng”.

**Schema/API:** `featureKey`, `cost` int32, `featureNameVi`, `featureNameEn`, `isActive`; GET/POST `/credit-costs`, GET/PATCH/DELETE `/credit-costs/:id`. GET trả danh sách array; PATCH/DELETE không khai báo body response. Có createBy/updateBy dạng UUID nhưng không tự hiển thị UUID như tên actor đã xác minh.

**Logic:** cost dùng string draft rồi validate integer an toàn trong miền BE; cost=0 chỉ cho khi contract xác nhận miễn phí; negative không được tự hiểu hoàn credit. Feature key là định danh tích hợp, không để tạo key tùy ý nếu Backend dùng catalog cố định. Xác nhận unique key/case sensitivity và quyền đổi key; không đổi key đang được jobs dùng mà không có policy.

**Tác động:** chốt lúc ghi nhận giá credit (enqueue/start/complete), retry/regenerate tính thế nào, thay đổi cost ảnh hưởng job đang chạy không, refund và insufficient credit do Backend xử lý. Thay đổi `isActive` cần biết “tính năng không khả dụng” hay “không dùng cấu hình giá”, tuyệt đối không suy ra tắt = miễn phí. Không xây tính toán trừ credit trong FE.

**Luồng:** chọn feature → sửa cost/status/tên → diff + chính sách hiệu lực → xác nhận → mutate → GET xác minh. Không tự retry POST khi timeout; đối chiếu record bằng operation ID hoặc key duy nhất đã chốt. Xóa chỉ khi reference semantics và quyền rõ; lỗi linked feature giữ record.

**Nghiệm thu:** cost 0/âm/thập phân/vượt int32; key trùng/lạ; false không biến true; save thất bại giữ draft; hai admin sửa cùng record không lost update khi BE hỗ trợ concurrency; jobs hiện hữu tuân theo chính sách giá đã chốt. Không hiện “đã đồng bộ audit” khi API chưa có audit.

### AD-14 — Chủ đề giáo dục `/admin/education-themes` (mới)

**Bố cục:** bảng/list tên, mô tả ngắn, trạng thái, thời gian; search/status; “Tạo chủ đề”; drawer create/edit gồm name, description và status có label xác nhận. Không thêm cover/color/icon bắt buộc vì DTO chưa hỗ trợ.

**Schema/API:** `name`, `description` nullable, `status: CommonStatus`; GET/POST `/education-themes`, GET/PATCH/DELETE `/education-themes/:id`. Chưa biết mapping enum thì cho đọc nhãn trung tính và khóa status mutation, không tự gán 0/1 = active/inactive.

**Logic:** trim name, reject blank trong UX, độ dài và uniqueness/normalization cần BE xác nhận. Description null khác chuỗi rỗng theo PATCH semantics; không tự gửi null cho field chưa sửa. Chủ đề là danh mục tham chiếu, không đồng nhất với restricted keyword/topic.

**Tác động:** chốt quyền Admin ghi và Content đọc/chọn; inactive có còn hiện ở truyện cũ không, có cấm gán mới không; đổi tên ảnh hưởng filter/public reader ra sao. Không tự xóa tham chiếu trong truyện khi xóa theme. Không hiển thị số truyện sử dụng nếu chưa có aggregate/reference API.

**Nghiệm thu:** CRUD/reload trên fixture và staging được cấp quyền; tên tiếng Việt dài/trùng, description null, unknown enum; delete đang được story tham chiếu trả conflict giữ item; edit theme làm mới option cache của Content đúng phạm vi; Parent/Content không có quyền sửa vẫn bị API chặn.

### Quy tắc tích hợp chung cho ba trang mới

- Người dùng đã mở scope, nên có thể làm UI/adapter/fixture; **permission matrix vẫn cần BE xác nhận**. Không suy ra quyền ghi từ endpoint GET công khai hoặc Bearer security chung. Nếu không có allowedActions, dùng capability từ contract/session đã xác nhận; không phát minh field server hay bật action theo tên route.
- DTO `additionalProperties=false`, chưa có reason/revision: không thêm các field này vào body rồi mong BE nhận. Chốt ETag/If-Match hoặc version schema và audit policy với BE; GET trước PATCH chỉ giảm dữ liệu cũ, không bảo đảm atomic concurrency. Không ghi “concurrency passed” nếu Backend chưa có cơ chế phù hợp.
- PATCH semantics absent/null/false/0 phải kiểm chứng; không mặc định mọi PATCH là partial đúng nghĩa. POST response hiện tham chiếu Create DTO nên không bảo đảm ID; PATCH/DELETE có thể trả body rỗng. Service phải đọc thành công theo HTTP status và GET lại, không set cache bằng undefined.
- Tách `adminCatalogService` hoặc các service theo domain nhưng vẫn dùng HTTP boundary hiện có. Dùng readiness/capability theo operation: catalog, audit và restricted keywords có thể real trong khi Admin core vẫn mô phỏng. Không bật `VITE_ADMIN_API_MODE=real` toàn vùng để thử, không gỡ allowlist và không fallback lỗi real sang mock.
- Chốt quyền, error shape, concurrency, reference delete, effect policy trước khi release mutation. Nếu thiếu, UI/fixture vẫn triển khai, real chỉ đọc khi được phép và ghi gate đang chờ.

### Luồng dùng chung của role Admin ngoài các route nghiệp vụ

Kiểm tra `/profile`, login/logout, hết phiên, refresh trang, deep link, trang 403/404 và mobile nav bằng tài khoản Admin. Không redesign các trang này ngoài phần lỗi trực tiếp của luồng Admin. Không hiển thị cache của admin trước sau khi đổi người dùng; pending response từ phiên cũ không được đưa dữ liệu trở lại UI.

## 5. Contract và dữ liệu dashboard cần chốt

Các trường dưới đây là **đề xuất**, không tự thêm vào API allowlist hoặc coi Backend đang hỗ trợ.

| Gate | Đầu ra cần có trước khi nối real | Page |
| --- | --- | --- |
| C01 Identity/permissions | account vs ChildProfile ID; enum role/status; target-specific assignable roles; allowedActions; session invalidation; last active admin atomic; required reason/revision | 02–04 |
| C02 Reports | transition + assignee; note rules; read-only evidence/preview phạm vi được cấp; target deleted; concurrency; moderation tách riêng | 05–06 |
| C03 Limits | min/max/unit/scope/effectiveAt; dữ liệu vượt ngưỡng; quan hệ quota/Parent setting; required reason + audit | 07 |
| C04 Restrictions | action/scope/match/normalization/effect; revision; list pagination; reason + audit | 08 |
| C05 Jobs | enum/allowedActions; version/idempotency; retry attempt ID; cancel accepted/completed; timeout reconciliation; quota semantics | 09 |
| C06 Aggregate | metric definitions, scope/timezone/from/to, generatedAt, buckets, null/partial, totals, overview queue ordering | 01/10 |
| C07 Audit | ID/actor/action/targetId/type/result/time/reason/requestId; safe before/after; sorting/filter/pagination; access/retention | 11 và links |
| C08 Plans | permission CRUD; đơn vị giá/chu kỳ; nullable/zero; credit vs lượt; code uniqueness; subscription hiện hữu; delete references; PATCH/concurrency/audit | 12 |
| C09 Credit costs | permission CRUD; feature catalog/key; cost range/zero; thời điểm tính phí, retry/refund; inactive/delete; PATCH/concurrency/audit | 13 |
| C10 Themes | permission CRUD/consumer read; CommonStatus; uniqueness; references/delete/inactive; PATCH/concurrency/audit | 14 |

Mỗi gate cần ví dụ request/response: success, empty, null/partial khi áp dụng, 401/403/404, validation, revision conflict/policy error, timeout khi có mutation. Schema có chủ sở hữu/version và ghi rõ chưa xác nhận hay đã được BE xác nhận. Adapter validate payload để không biến shape lỗi thành “0 kết quả”.

### Từ điển metric đề xuất

| Metric | Định nghĩa mục tiêu | Thời gian / drill-down |
| --- | --- | --- |
| reportsOpen | Tổng report status open trong scope được phép | Snapshot generatedAt → Reports status=open |
| reportsUnderReview | Tổng report status under_review | Snapshot → Reports status=under_review |
| jobsFailed | Tổng jobs ở failed theo retention/scope được công bố | Snapshot → Monitoring failed cùng scope |
| jobsProcessing | Tổng jobs processing; queued/cancelling không tự cộng | Snapshot → Monitoring processing |
| activeUsersInPeriod (nếu có) | Distinct account có event sử dụng được BE định nghĩa | Khoảng ngày đã chọn; không suy ra từ status active |
| charactersCreated | Nhân vật tạo thành công trong kỳ, phân biệt regeneration/attempt | Event time theo contract |
| readingMinutes | Tổng thời lượng đọc hợp lệ, policy background/dedup do BE | Khoảng ngày đã chọn |

Đề xuất timezone hiển thị/bucket `Asia/Ho_Chi_Minh` (UTC+7), API timestamp ISO 8601. Dùng khoảng `[from, to)` để không đếm đôi ngày giao nhau; xác nhận 7/30 ngày gồm hôm nay chưa hoàn chỉnh hay các ngày đã hoàn tất. Label phải nói rõ lựa chọn cuối cùng. Snapshot counts không bị bộ lọc kỳ làm thay đổi ngầm. Không đưa doanh thu, CPU/RAM, uptime, latency/SLA vào dashboard khi chưa có telemetry tương ứng.

## 6. Thiết kế kỹ thuật và đồng bộ

### 6.1. File và component

- `src/features/admin/admin.css` mới, scope theo wrapper; import có chủ đích từ Admin/shared layout.
- `components/`: PageHeader, ListToolbar, Pagination, ActionDialog, ConflictPanel, DataState; tách khi từ hai nơi dùng thật. Không dựng generic table/form engine lớn.
- `hooks/`: URL filters/return context, dirty guard tương thích router hiện tại, mutation lifecycle theo resource; không giả định `useBlocker` hoạt động trước khi kiểm tra router mode.
- `models.js`: enum labels, safe date/number formatting, URL normalization, capability adapter. Unknown enum giữ nhãn fallback trung tính và không cấp mutation.
- `adminService.js`: giữ một transport, signal đầy đủ, adapter theo contract; không tạo “real” service gọi endpoint đoán từ mock.
- `queryKeys.js`: thêm filter/job/detail/range/timezone khi cần; keys luôn phân vùng theo session user. Kiểm tra race logout/refetch và hủy query phù hợp.
- Mock/fixtures: snapshot có thời gian cố định để test ngày, thêm nhiều trang, delayed/error/concurrency, null/partial; không sửa fixture chỉ để bỏ qua tình huống khó.

### 6.2. Ma trận sau mutation thành công

| Mutation | Cập nhật resource từ response | Invalidate theo prefix đủ biến thể |
| --- | --- | --- |
| Lock/unlock | User detail | Users, Permissions, Audit, Overview/Statistics nếu metric liên quan |
| Change role | User detail + target trong catalog nếu đủ shape | Users, Permissions, Audit, aggregates liên quan |
| Report action | Report detail | Reports, Audit, Overview |
| Limits | Limits với revision mới | Audit, aggregate cấu hình nếu thực sự tồn tại |
| Restriction | Rule hoặc refetch list | Restrictions, Audit |
| Retry/cancel | Job/attempt trả về | Monitoring, Audit, Overview, Statistics nếu metric liên quan |
| Plan CRUD | GET lại detail/list vì response mutation có thể thiếu body/ID | Admin plan catalog, public/Parent plan query liên quan; Audit nếu BE ghi; không tự sửa subscription |
| Credit cost CRUD | GET lại detail/list | Credit catalog và consumer query thực tế; Audit nếu có; không sửa số dư/jobs từ FE |
| Theme CRUD | GET lại detail/list | Theme options ở Content/public theo scope; Audit nếu có; không viết lại story tham chiếu |

Không dùng invalidation như cơ chế sửa conflict. Không reset draft của target khác. Mutation đã thành công nhưng invalidate thất bại vẫn ghi nhận mutation thành công, cho retry refresh riêng. Backend ghi audit trong cùng bảo đảm consistency đã thống nhất; nếu audit async phải có thời gian chờ/operation correlation rõ, không dựng event để che độ trễ.

## 7. Runbook giao Luna: chia ticket có đầu vào/đầu ra

Không yêu cầu model viết lại toàn bộ Admin trong một lượt. Mỗi ticket phải kiểm tra hiện trạng trước vì code có thể đã đổi sau ngày lập kế hoạch. Mức reasoning/model do người dùng chọn, kế hoạch không phụ thuộc một tên preset cụ thể.

| Ticket | Phạm vi/file chính | Phụ thuộc | Điều kiện hoàn tất |
| --- | --- | --- | --- |
| ADM-00 | Snapshot diff; lập progress; đối chiếu contract/transport; fixture và test config mock cô lập | Không | Biết rõ endpoints mock/real/unavailable; không sửa `.env.production`; chốt baseline kiểm thử |
| ADM-01 | Shell Admin, tokens, header/state/dialog/URL/dirty patterns | 00 | Mẫu Users + detail + Limits ở desktop/mobile; focus/overflow; Parent/Content không hồi quy |
| ADM-02 | Users list/detail; policy fixtures | 01, C01 cho real | AC AD-02/03 và A02/A03/A08 đạt |
| ADM-03 | Permissions một target mỗi lần | 02, C01 | AC AD-04, roles/refetch/conflict/self/last active admin |
| ADM-04 | Reports queue/detail + preview adapter | 01, C02 | AC AD-05/06; sort và transition đúng; missing preview có state trung thực |
| ADM-05 | Audit filters/dialog/deep link | 01, C07 | AC AD-11; regression range=all; đối chiếu audit của 02–04 |
| ADM-06 | Limits | 01, C03 | AC AD-07; revision snapshot và dirty guard; audit |
| ADM-07 | Restrictions | 01, C04 | AC AD-08; pending nhiều dòng và capability |
| ADM-08 | Monitoring | 01, C05 | AC AD-09; timeout/idempotency/cancel/polling |
| ADM-09 | Dashboard + Statistics | 04/05/08, C06 | AC AD-01/10; metric dictionary, drill-down, partial/null, cache |
| ADM-11 | Gói sử dụng: page/service/fixture; module readiness | 01, C08 cho real mutation | AC AD-12; body rỗng/null/false/0 và subscription impact |
| ADM-12 | Chi phí credit: page/service/fixture | 01, C09 | AC AD-13; feature key/cost/hiệu lực/không trừ credit client |
| ADM-13 | Chủ đề: page/service/fixture; Content consumers | 01, C10 | AC AD-14; enum/reference delete/option cache |
| ADM-10 | Tích hợp từng module + regression/visual/a11y | 02–09 và 11–13, gates BE tương ứng | Bằng chứng UI và API thật đủ 14 trang, không nhầm mock pass với release |

Thứ tự đề nghị: **00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 11 → 12 → 13 → 09 → 10**. Giữ ID 10 cho nghiệm thu cuối để không nhầm với 11–13 được mở scope sau. Layout dashboard có thể làm ngay trong 01; logic số liệu hoàn thiện ở 09. **Mỗi ticket làm giao diện trước trên fixture, nối ngay API đã có, giữ mock cho phần chưa có, rồi kiểm tra ảnh và luồng.** Không chờ tất cả contract gates mới tiếp tục ticket sau. ADM-10 là kiểm chứng xuyên suốt, không phải lần đầu bắt đầu nối API.

Mốc bàn giao ưu tiên thứ nhất: **đủ 14 trang dùng được, giao diện nhất quán, có bản demo chạy đầy đủ workflow, các API đã có được nối theo module**. Mốc thứ hai: thay các mock còn lại bằng API mới và nghiệm thu Backend. Tiến độ ghi riêng hai mốc, không đánh đồng giao diện hoàn thiện với toàn bộ hệ thống production đã hoàn thiện.

Ước lượng tham khảo một frontend developer: phạm vi 11 trang khoảng 20–28 ngày công; ba catalog mới, module readiness và kiểm thử tác động thêm khoảng 6–9 ngày. Tổng scope đã chọn **26–37 ngày công**, điều chỉnh sau baseline. Không phải dự đoán thời gian chạy model; chưa tính xây API hoặc chờ quyết định Backend.

### Prompt để bắt đầu

```text
Đọc docs/ADMIN_UI_UX_PLAN_2026-10-17.md và các nguồn được dẫn ở mục 1.
Chỉ thực hiện ADM-00 trước. Đối chiếu working tree/diff và chỉ dẫn repository.
Không ghi đè thay đổi sẵn có, không sửa .env.production để test, không thêm endpoint
ngoài contract và không tự mở rộng scope. Mock cho capability chưa có API phải có nhãn
“Dữ liệu mô phỏng” ở cả local lẫn bản deploy; lỗi API thật không fallback.
Tạo docs/admin-quality/progress.md: từng ticket, UI ready, Contract ready,
Integration ready, Accepted; bằng chứng và phần đang chờ Backend.
Chuẩn bị môi trường mock cô lập, kiểm tra baseline phù hợp và ghi lỗi có sẵn.
Sau ADM-00 báo file đổi, kết quả thực tế và ticket kế tiếp. Không ghi hoàn tất
cho phần chưa chạy/không có API. Không tạo hoặc chạy mutation trên production.
```

### Prompt cho mỗi ticket tiếp theo

```text
Thực hiện ADM-XX theo docs/ADMIN_UI_UX_PLAN_2026-10-17.md.
Đọc progress và code hiện tại trước; làm đủ UI, logic, states và AC trong scope.
Tái sử dụng stack, component và transport hiện có; giữ công việc chưa commit.
Ưu tiên hoàn thiện UI và workflow đầy đủ. API có thì nối ngay trong ticket;
API chưa có thì triển khai service mock có trạng thái và mutation, có nhãn demo.
Thiếu contract một action real không được chặn xây form/flow mock của action đó.
Không trộn bản ghi thật với mutation mock hoặc tự fallback sang mock khi API lỗi.
Phần chưa có API dùng mock có nhãn theo chỉ đạo hiện tại; capability real xử lý lỗi thật.
Không bịa API/số liệu/quyền và không chỉ vẽ nút disabled trong bản demo.
Test theo rủi ro, chụp và kiểm tra ảnh ở viewport quy định; sửa lỗi tìm thấy.
Chỉ cập nhật trạng thái đã có bằng chứng. Bàn giao file đổi, test đã chạy,
ảnh đã xem, lỗi còn lại và ticket kế tiếp; không chỉ báo “đã hoàn thiện UI”.
```

Mỗi ticket bàn giao `docs/admin-quality/ADM-XX.md`: phạm vi, file đổi, contract assumption, test command + pass/fail/skipped, ảnh đã kiểm tra, known issue và phụ thuộc. Không cần xin phép lại các sửa đổi reversible trong scope người dùng đã giao; chỉ hỏi khi cần quyết định nghiệp vụ thực sự.

## 8. Ma trận nghiệm thu và release

### 8.1. Fixture và kiểm thử logic trọng yếu

1. Users: trên 50 account, Child thiếu email, ID dài, tự thao tác, chỉ còn một admin active và một admin locked. Hai admin đồng thời hạ quyền/khóa phải không làm mất admin active cuối cùng ở Backend.
2. Forms: bắt đầu sửa revision 1 → background fetch revision 2 → submit vẫn dùng revision 1 và nhận conflict; giữ draft, hiển thị bản mới, chỉ submit revision 2 sau review. Route target A → B không mang note/reason/role của A.
3. Reports: mọi transition hợp lệ và sai; sort có cùng timestamp; resolve không hide target; unknown capability; deleted/forbidden/expired preview; note dirty khi back.
4. Lists: `page=-1/0/abc/9999`, `pageSize=12/999`, enum lạ; page cuối mất item sau mutation; request search A chậm hơn B; refresh/back/deep link.
5. Pending: thao tác row A rồi B, A trả trước và sau B; chỉ row tương ứng đổi pending; double click không gửi hai request.
6. Jobs: unknown progress, 0/100/ngoài biên, usage=0, job đổi trạng thái khi dialog mở, timeout đã thực thi, retry attempt ID mới, cancel accepted nhưng còn running, polling lỗi/offline/hidden tab.
7. Metrics: 0, null, missing key, một section lỗi, payload sai shape, ngày không hợp lệ, thiếu bucket, previous=0, same-scope KPI/list. Không nuốt schema error thành empty thành công.
8. Audit: event >30 ngày và range=all; target trùng tên khác ID; actor deleted; unknown result; drawer keyboard; từng mutation có audit theo contract.
9. Session: sai role, 401, resource-level 403, thu hồi quyền khi đang mở dialog, logout trong lúc GET đang chạy, đổi tài khoản không lộ cache.
10. Production mode: capability chưa có API hiển thị nhãn mô phỏng và chỉ ghi vào mock store; API thật không fallback. Catalog, audit và restricted keywords real không làm Admin core tự đổi sang real. Integration chỉ dùng staging/test account được cấp quyền.
11. Catalogs: create response thiếu ID, PATCH/DELETE body rỗng, false/0/null, PATCH missing field, duplicate key, delete có reference, unknown CommonStatus, giá thiếu currency, thay đổi plan/cost ảnh hưởng consumer hiện hữu. Không coi HTTP 200 không body là resource mới.

### 8.2. Visual và accessibility

- 14 route × populated + state lỗi quan trọng: chụp **1440×900 và 390×844**. Smoke **1366×768, 768×1024, 360×800**. Dialog/drawer mở, error dài, long name và bảng nhiều dòng phải có bằng chứng riêng.
- Xem ảnh thật, không chỉ tạo screenshot. Lưu `artifacts/admin-quality/<ticket>/<route>-<viewport>-<state>.png`; không ghi đè artifacts ngoài scope.
- Không overflow toàn trang, text mất nghĩa, sticky che action hoặc table header lệch. 200% zoom vẫn thao tác được; font tiếng Việt đủ dấu; contrast đo trên cặp màu thực, focus rõ; icon có accessible name.
- Keyboard-only: mở menu → điều hướng → lọc → chọn row → mở dialog → validation → đóng → focus trở lại đúng trigger. Reduced motion; chart có bảng dữ liệu; status dùng live region vừa đủ, không đọc lại toàn bảng mỗi lần polling.
- Chạy axe bằng dependency sẵn có và review thủ công; không coi axe pass là đạt toàn bộ UX.

### 8.3. Lệnh và bằng chứng

- `npm run lint`, `npm run build` sau thay đổi phù hợp; ghi lỗi baseline riêng với lỗi mới.
- Dùng `tests/admin-implementation.spec.js`, `g2/g4/g5/g6` làm nền; hiện suite riêng Admin chỉ có hai test đơn giản, chưa bao phủ các rủi ro trên. Thêm test đúng hành vi, không chỉ title/selector.
- Tạo config Admin độc lập nếu cần: local port riêng, auth/admin mock rõ ràng theo biến môi trường thực tế, không reuse nhầm server real đang mở. Không sửa env production để test. Snapshot/time/seed cố định.
- Thay shell/auth/cache/router phải chạy regression Parent/Content/Profile, đặc biệt editor dirty guard. E2E staging dùng account/dữ liệu test; không lấy mock test làm bằng chứng quyền Backend.
- Theo dõi console/network: không exception, loop refetch, request trùng do double click, unhandled rejection hoặc dữ liệu nhạy cảm trong log. Không yêu cầu upload token hoặc mật khẩu vào báo cáo.

### 8.4. Định nghĩa hoàn tất

| Mức | Điều kiện |
| --- | --- |
| UI ready | Trang/flow/responsive/states/keyboard đạt trên fixture có nhãn, ảnh đã review |
| Contract ready | Schema, policy, metric và error đã được BE xác nhận; service/mock cùng contract |
| Integration ready | GET/mutation/reload/audit đi qua API thật ở môi trường test; quyền/concurrency được kiểm chứng |
| Accepted | Đủ AC theo trang, regression và visual/a11y; không còn lỗi P0/P1 mở, lỗi khác đã xử lý hoặc có quyết định chấp nhận rõ |

Chỉ đánh dấu **toàn bộ Admin hoàn tất** khi 14 trang và các luồng dùng chung đạt Accepted. Nếu Backend còn thiếu, bàn giao rõ “UI ready, integration đang chờ Cxx”, không che bằng dữ liệu giả.

## 9. Quyết định còn mở

Người dùng đã chốt: **thêm quản lý gói, credit và chủ đề; dashboard ưu tiên điều hành hệ thống**. Phạm vi mới phù hợp capability Admin trong [runbook API](LUNA_EXTRAMAX_API_RUNBOOK_2026-10-19.md); không cần hỏi lại việc có làm ba màn này. Snapshot ngày 19/10 đã được rà soát. Source hiện có API catalog, audit logs và restricted keywords; quyền ghi và persistence vẫn cần nghiệm thu trên môi trường test.

Chỉ đạo bổ sung đã chốt: **API có thì nối, chưa có thì mock, làm giao diện trước**. Áp dụng mục 1.1 cho mọi ticket; những câu “chờ Backend” chỉ nói về tích hợp thật, không phải để hoãn UI/UX hay bỏ workflow demo.

Các câu hỏi cần nhóm Backend/nghiệp vụ chốt trước mutation real:

- Vai trò nào được gán cho từng loại account, đặc biệt Child; quyền đọc bằng chứng trẻ và moderation target đến đâu?
- Khóa/đổi role ảnh hưởng các phiên đã đăng nhập thế nào; reason bắt buộc cho những action nào?
- Hiệu lực limits/restrictions, quota và retry/cancel được tính ra sao?
- Các aggregate/telemetry nào có thể cung cấp; định nghĩa user hoạt động, thời gian đọc, timezone, retention và freshness?
- Endpoint, error shape, pagination và capability nào của Admin cần được xác nhận thêm bằng response/mutation staging?
- Ba catalog: currency/unit, mapping credit với lượt tạo, CommonStatus, PATCH null/missing, quyền CRUD, reference-delete, hiệu lực đối với subscription/job/truyện đã tồn tại, concurrency và audit?

Các quyết định này là điều kiện tích hợp cụ thể, không phải yêu cầu ngừng chuẩn bị UI/UX.
