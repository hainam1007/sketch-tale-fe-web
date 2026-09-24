# SketchTale — Kế hoạch triển khai Web cho Parent, Content Manager và Admin

> Ngày lập: 18/09/2026.
> Cập nhật 23/09/2026: ưu tiên khung công cụ Content Manager trên frontend theo mục 7; chưa thay đổi tiêu chí nghiệm thu API của G2/G3.
> Phạm vi: một lập trình viên chịu trách nhiệm Web Frontend cho ba role; phối hợp Backend, Mobile và AI/Media của nhóm.
> Trạng thái: kế hoạch đề xuất để triển khai, không phải xác nhận API/nghiệp vụ đã được Backend cung cấp.
> Nguồn nghiệp vụ: `PROJECT_SUMMARY.md`. Tài liệu này là kế hoạch tổng thể; `PARENT_IMPLEMENTATION_PLAN.md` chỉ là phân rã tham khảo riêng cho Parent. Khi thứ tự, kiến trúc hoặc ước lượng khác nhau, dùng kế hoạch tổng thể này.

## 1. Hướng triển khai chủ đạo

**Một React SPA, ba khu vực theo role, một nền tảng dùng chung; triển khai theo luồng nghiệp vụ có thể demo và tích hợp được.**

Không hoàn thiện toàn bộ Parent rồi mới bắt đầu Content và Admin. Content phải tạo được truyện để Mobile sử dụng và Parent có dữ liệu theo dõi; Admin cần quản lý tài khoản và xử lý nội dung để hệ thống có thể vận hành. Vì vậy, thứ tự là:

1. Nền tảng dùng chung và một luồng Parent nhỏ để kiểm chứng kiến trúc.
2. Content tạo và publish được một truyện hoàn chỉnh; Admin quản lý được tài khoản.
3. Parent kiểm soát hồ sơ, duyệt nhân vật và quản lý thư viện; Admin xử lý báo cáo.
4. Tiến độ, thống kê, hạn mức, giám sát và export.
5. Nghiệm thu xuyên hệ thống, tối ưu và phát hành.

“Tối ưu” ở đây là giảm code lặp, giảm phụ thuộc chờ Backend, phát hiện sớm rủi ro Story Editor và hoàn thành nghiệp vụ trước khi làm dashboard cầu kỳ. Không phải tạo nhiều abstraction ngay từ đầu.

## 2. Hiện trạng và phạm vi

### Hiện có trong repository

- React/Vite, JavaScript/JSX, React Router; public website và auth minh họa.
- CSS tokens, font Nunito tự host, Phosphor icons và public mock service.
- Playwright/axe, lint, build và công cụ đo Lighthouse.
- Chưa có auth thật, dashboard theo role, API thật, payment hay export thật.
- `src/app/App.jsx` đang gộp route public/auth và hiệu ứng title/focus. Cần mở rộng sang route động và layout được bảo vệ.

### Phạm vi phải hoàn thành

| Khu vực | Trách nhiệm |
| --- | --- |
| Shared | Auth, profile, session, permissions, layout, UI primitives, data layer, upload, feedback, test và cấu hình triển khai |
| Parent | Hồ sơ bé, settings, approval, thư viện, progress, gói/hạn mức và export theo contract |
| Content Manager | Story template, page, role, slot, vocabulary, quiz, assets, preview, publish/hide và thống kê |
| Admin | Tài khoản, quyền, lock/unlock, hạn mức hệ thống, nội dung hạn chế, content reports, giám sát và báo cáo |

Mobile drawing/reader/quiz không thuộc Web Frontend. Web cần preview nội dung của Content Manager và dữ liệu kết quả do Mobile/Backend tạo. Thanh toán thật, social/community, offline đầy đủ, cộng tác editor thời gian thực và recommendation engine không tự đưa vào phạm vi.

## 3. Kiến trúc kỹ thuật đề xuất

| Thành phần | Lựa chọn | Lý do/phạm vi |
| --- | --- | --- |
| Ứng dụng | Giữ React + Vite, một SPA | Dùng chung auth, component và deployment cho ba role |
| Ngôn ngữ | Giữ JavaScript/JSX, JSDoc cho model/service | Tránh migration toàn repo trong thời gian làm đồ án |
| Router | React Router hiện có, nested layouts, tải module theo route | Tách public và ba khu vực; editor chỉ tải khi cần |
| Styling | Giữ tokens, thêm CSS Modules cho module mới | Giữ thương hiệu và giảm xung đột với CSS public |
| Server state | Bổ sung TanStack Query | Một cơ chế quản lý tải/cache/invalidation cho toàn web |
| Forms | Bổ sung React Hook Form + Zod | Chuẩn hóa validation và lỗi field cho form nghiệp vụ |
| Client state | React state/reducer; Context cho session | Chưa cần Redux/Zustand; chỉ bổ sung nếu có nhu cầu cụ thể |
| HTTP | Một wrapper trên fetch và service theo domain | Chuẩn hóa lỗi, cancellation và session; không gọi trực tiếp từ page |
| Mock | MSW và fixtures xác định, khi chuyển sang gọi HTTP chung | Mock ở biên HTTP để kiểm thử cùng code service với API thật |
| Kiểm thử | Giữ Playwright/axe, thêm Vitest + Testing Library | Unit/component cho logic; E2E cho luồng quan trọng |
| Dialog/menu | Chọn một bộ headless primitives nếu cần | Ưu tiên hành vi bàn phím/focus nhất quán; không cài nhiều UI kit |

Các thư viện bổ sung là đề xuất, chưa được cài. Không nâng major version hoặc đổi framework chỉ để triển khai kế hoạch này. Không cần migrate public service đang ổn sang MSW ngay; module nghiệp vụ mới theo chuẩn chung, public chuyển sau nếu có lợi.

### Cấu trúc thư mục đích

```text
src/
  app/
    App.jsx
    providers/          # Query, Auth và feedback cấp ứng dụng
    router/             # Route config, guard, title và role home
    layouts/            # Workspace shell và cấu hình ba role
  components/
    ui/                 # Button, Dialog, Tabs, Badge, Menu...
    forms/              # Field, FormError, Select, UploadField...
    feedback/           # Loading, Empty, Error, Forbidden...
    data/               # Table, Pagination, FilterBar, DateRange...
  features/
    public/             # Giữ phần đang có
    auth/
    profile/
    parent/             # Dashboard và composition của role
    children/
    approvals/
    library/
    learning-progress/
    subscriptions/      # Hiển thị quyền lợi/hạn mức, chưa payment
    exports/
    content/            # Dashboard và composition của role
    story-templates/
    story-editor/
    assets/
    content-statistics/
    admin/              # Dashboard và composition của role
    user-management/
    access-management/
    content-reports/
    system-settings/
    monitoring/
    audit-logs/
  lib/
    api/
    permissions/
    formatting/
  mocks/
    handlers/
    fixtures/
    scenarios/
  styles/
tests/
  auth/
  parent/
  content/
  admin/
  integration/
```

Chỉ tạo thư mục khi có code sử dụng. Mỗi feature thường có `pages`, `components`, `hooks`, `services`, `schemas` và `models.js` nếu cần JSDoc; không bắt mọi feature nhỏ có đủ sáu thư mục.

### Quy tắc chia sẻ code

- Tái sử dụng Button, FormField, Table, Upload, AssetPicker, JobStatus, permission helpers và formatting.
- Shell dùng chung cấu trúc nhưng menu/độ rộng/mật độ theo role; Story Editor có workspace riêng để đủ diện tích.
- Parent approval và Admin content report là hai workflow khác nhau, không ép thành một component nghiệp vụ với nhiều cờ.
- Form tạo/sửa cùng entity dùng chung schema và form; form khác entity chỉ chia sẻ field primitives.
- Feature khác truy cập qua service/hook/export công khai; tránh import sâu state nội bộ của editor.
- Không dựng “universal CRUD builder” cho tất cả màn hình. Chỉ trích abstraction khi hai module thực sự có cùng hành vi.

## 4. Sitemap và quyền truy cập

### Shared và Parent

| Route | Nội dung |
| --- | --- |
| `/auth/login`, `/auth/register` | Login dùng chung; đăng ký công khai chỉ cấp Parent theo server |
| `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password` | Xác minh/khôi phục theo contract |
| `/profile` | Hồ sơ của tài khoản đang đăng nhập |
| `/403`, route fallback | Không đủ quyền / không tồn tại |
| `/parent` | Tổng quan; giai đoạn đầu có thể dẫn sang children |
| `/parent/children`, `/parent/children/new` | Danh sách/tạo bé |
| `/parent/children/:childId` | Chi tiết và sửa hồ sơ |
| `/parent/children/:childId/settings` | Thời gian, category |
| `/parent/children/:childId/approvals` | Duyệt phiên bản và quyền vai nhạy cảm |
| `/parent/children/:childId/library` | Truyện/nhân vật của bé |
| `/parent/children/:childId/progress` | Reading, vocabulary, quiz |
| `/parent/plan`, `/parent/exports` | Gói/hạn mức và export jobs |

### Content Manager và Admin

| Route | Nội dung |
| --- | --- |
| `/content` | Tổng quan công việc/nội dung |
| `/content/stories`, `/content/stories/new` | Danh sách/tạo mẫu truyện |
| `/content/stories/:storyId` | Editor metadata |
| `/content/stories/:storyId/pages` | Trang truyện và bố cục slot |
| `/content/stories/:storyId/roles` | Vai và điều kiện dùng nhân vật |
| `/content/stories/:storyId/vocabulary` | Từ vựng theo trang |
| `/content/stories/:storyId/quizzes` | Câu hỏi/đáp án |
| `/content/stories/:storyId/preview` | Preview và kiểm tra trước publish |
| `/content/assets`, `/content/statistics` | Assets và hiệu quả nội dung |
| `/admin` | Tổng quan quản trị |
| `/admin/users`, `/admin/users/:userId` | Danh sách và chi tiết tài khoản |
| `/admin/permissions` | Quyền theo mô hình backend chốt |
| `/admin/system-limits`, `/admin/restrictions` | Hạn mức, từ khóa/chủ đề hạn chế |
| `/admin/reports`, `/admin/reports/:reportId` | Hàng đợi/chi tiết báo cáo nội dung |
| `/admin/monitoring`, `/admin/statistics` | Tình trạng tác vụ/lỗi và số liệu hệ thống |
| `/admin/audit-logs` | Tra cứu lịch sử quản trị, ưu tiên sau workflow cốt lõi |

Các route bổ sung là đề xuất, không chứng minh endpoint tương ứng đã tồn tại. Category catalog cần API đọc; màn CRUD category chỉ thêm sau khi chốt role sở hữu chức năng.

### Ma trận quyền tối thiểu

| Chức năng | Parent | Content Manager | Admin |
| --- | --- | --- | --- |
| Profile của chính mình | Có | Có | Có |
| Child/settings/approval/library/progress | Chỉ dữ liệu thuộc mình | Không | Chưa mặc định truy cập; cần quyền hỗ trợ cụ thể |
| Story authoring, assets, publish/hide | Không | Theo quyền được cấp | Không tự kế thừa; chờ chốt |
| Tài khoản, lock/unlock, permissions | Không | Không | Theo quyền được cấp |
| Report moderation, system settings | Không | Không | Theo quyền được cấp |
| Thống kê | Phạm vi gia đình | Phạm vi nội dung | Tổng hợp hệ thống |

Role định tuyến; permission quyết định hành động. Backend là nguồn quyết định quyền và ownership. Nếu Backend chỉ hỗ trợ role, ánh xạ tập quyền tĩnh ở một chỗ; chưa xây trình quản lý permission phức tạp. Chốt tài khoản một hay nhiều role; mock khởi đầu giả định một role và ghi rõ giả định này.

## 5. Chuẩn dữ liệu và API trước khi nhân rộng màn hình

### Những hợp đồng dùng chung phải có

1. Auth/session: cookie hay bearer, refresh, expiry, logout, tài khoản bị khóa, role/permission và login redirect.
2. Response: ID, pagination, filter/sort, error code, field errors, request ID và timestamp.
3. Enum: approval, publish, report, generation và export; tránh mỗi màn tự đặt chuỗi trạng thái.
4. Ngày giờ: ISO timestamp; ngày sinh là date-only; timezone dùng cho daily limit, report range và reset quota.
5. Mutation: revision/ETag cho tài nguyên có nguy cơ ghi đè; idempotency cho job; quy tắc delete/soft delete.
6. Upload: file types/size, multipart hoặc presigned URL, metadata, progress, cancel và lỗi asset.
7. Async job: trạng thái terminal, polling interval, timeout và URL kết quả; chỉ dùng SSE/WebSocket nếu Backend đã có yêu cầu rõ.

Shape lỗi nội bộ đề xuất: `{ code, message, fieldErrors, requestId }`. Adapter chuẩn hóa response Backend sang shape này; không yêu cầu Backend đổi toàn bộ chỉ để khớp ví dụ.

### Quy tắc vận hành ở client

- Session có `loading/authenticated/anonymous`; guard không redirect trước khi khôi phục phiên xong.
- Chỉ một refresh request khi nhiều API cùng hết hạn; không retry vô hạn. Mutation không tự replay nếu chưa rõ tính an toàn/idempotency.
- 401 kết thúc/khôi phục phiên theo contract; 403 không đủ quyền; 404 không tồn tại; conflict tải lại revision; field errors hiển thị cạnh field. Map bằng mã lỗi thực tế, không giả định mọi Backend trả cùng status.
- Query key bao gồm tài khoản, resource và filter; key của dữ liệu trẻ phải có `childId`. URL giữ selected child/tab/filter/page để refresh và chia sẻ đường dẫn được.
- Logout/đổi tài khoản: hủy request, xóa cache riêng tư; đổi bé không hiển thị dữ liệu bé cũ trong lúc tải.
- Invalidate có chủ đích: duyệt nhân vật cập nhật queue/count/library; publish cập nhật list/detail/version; lock user cập nhật status và audit nếu có API.
- Không optimistic update cho publish, role change, lock, approval và delete. Favorite có thể optimistic nếu có rollback và lợi ích thực tế.
- Mock bật rõ ở dev/demo; production lỗi API không được chuyển sang dữ liệu giả. Không lưu mật khẩu hay bí mật trong Vite env.

### API còn thiếu cần đưa vào backlog Backend

| Domain | Khoảng trống cần chốt ngoài các endpoint đề xuất ở PROJECT_SUMMARY |
| --- | --- |
| Parent | Category catalog, đọc settings, character detail/version, thao tác thư viện nhân vật, entitlement/usage, export list |
| Content | Asset list/detail, reorder pages, draft/revision/version, validation publish, preview payload, taxonomy và Free/premium catalog |
| Admin | Role/permission catalog, thao tác moderation trên target, giám sát AI/lỗi/usage, filter/export báo cáo nếu được yêu cầu |
| Shared | Upload flow, account verification, locked-session behavior, conflict semantics, audit event liên quan mutation |

Không thể coi việc đổi một adapter là đủ nếu business model Backend khác mock. Đối chiếu contract theo từng milestone và sửa mapping/validation sớm.

## 6. Backlog Parent

| ID | Hạng mục | Tiêu chí nghiệm thu chính |
| --- | --- | --- |
| P-01 | Hồ sơ bé: list/create/detail/edit | Empty state; validation; đổi/refresh child route đúng; giới hạn hồ sơ từ server |
| P-02 | Settings | Đọc/lưu thời gian và category; rõ ý nghĩa chọn rỗng; lỗi lưu không hiển thị thành công |
| P-03 | Character approval | So sánh tranh gốc/phiên bản; approve/reject đúng version; xử lý conflict |
| P-04 | Sensitive-role approval | Quyền một lần theo nhân vật, tách approval version; không tự cấp khi chưa có dữ liệu |
| P-05 | Library | Truyện/nhân vật; filter/favorite/hide/delete theo bé; không sửa template chung |
| P-06 | Learning progress | Reading/vocabulary/quiz theo thời gian; phân biệt chưa có dữ liệu và số 0 |
| P-07 | Dashboard | Tổng hợp từ API, link hành động; partial error không phá toàn trang |
| P-08 | Gói và usage | Hiển thị Free/Pro/Family, usage/reset từ server; không tự cấp entitlement |
| P-09 | Export | Tạo/theo dõi/download job, lỗi/retry hợp lệ; quota server và file hết hạn |
| P-10 | Báo cáo học tập Family | Chuẩn bị UI trạng thái/cấu hình nếu contract có; email định kỳ do Backend thực hiện |

P-10 xuất phát từ quyền lợi Family trong tài liệu nguồn; phạm vi màn cấu hình, nội dung báo cáo và dịch vụ gửi email cần chốt, không được bỏ quên hoặc tự hứa đã gửi.

Quy tắc bắt buộc: Parent–Child là 1–N; Child là profile, không có account đăng nhập riêng. Recolor/chỉnh sửa nhân vật phải duyệt phiên bản mới. Thời gian sử dụng do Mobile/Backend ghi nhận; web không thực thi bằng timer của tab. Truyện hoàn thành khi đọc hết trang cuối; từ vựng giữ riêng số lần xuất hiện/nghe/trả lời đúng.

Free/Pro/Family hiện được cung cấp lần lượt 1/3/5 hồ sơ, 5/30/100 lượt tạo AI mỗi tháng, tối đa một regenerate mỗi tranh. Export video: Free không hỗ trợ, Pro 5/tháng, Family không giới hạn. Cách cộng trừ/reset/chia sẻ quota và hạ gói vẫn cần contract; không hardcode thành quyền ở client.

## 7. Backlog Content Manager và thiết kế Story Editor

Kế hoạch code chi tiết và audit hiện trạng: [CONTENT_MANAGER_IMPLEMENTATION_PLAN.md](CONTENT_MANAGER_IMPLEMENTATION_PLAN.md). Tài liệu này phân rã C-01–C-10 thành milestone/ticket để hoàn thiện code Content hiện có; phạm vi và thứ tự tổng thể vẫn theo kế hoạch Web này.

| ID | Hạng mục | Tiêu chí nghiệm thu chính |
| --- | --- | --- |
| C-01 | Story list/metadata | Search/filter/pagination, create/edit draft, cover/category/status |
| C-02 | Asset library/upload | List/filter/select/upload, progress, định dạng/kích thước, lỗi và preview |
| C-03 | Pages | Thêm/sửa/xóa/sắp xếp, text/background/narration, thứ tự ổn định |
| C-04 | Roles và slots | Custom character flag, sensitive role flag, default asset; role reference và tọa độ hợp lệ |
| C-05 | Vocabulary | Word/meaning/audio theo trang, validation field bắt buộc |
| C-06 | Quiz | Multiple choice, đúng một đáp án; feedback/audio theo contract |
| C-07 | Preview | Đúng tỷ lệ Mobile Reader, render background/slot/text; thiếu asset có trạng thái rõ |
| C-08 | Validate/publish/hide | Lỗi liên kết về đúng tab/field; publish tạo version, xử lý revision conflict |
| C-09 | Version và trạng thái lưu | Phân biệt draft đang sửa và version đã publish; không làm đổi GeneratedStory cũ |
| C-10 | Content statistics | Dữ liệu truyện được dùng/đọc theo API và khoảng thời gian |

### Cách triển khai editor để kiểm soát độ phức tạp

**Ưu tiên hiện tại — frontend trước:** triển khai F0–F5 trong [kế hoạch Content Manager, mục 10](CONTENT_MANAGER_IMPLEMENTATION_PLAN.md#10-đợt-ưu-tiên-bộ-công-cụ-dựng-truyện-trên-frontend-23092026): baseline/contract tạm → kho asset local giữ đúng file qua refresh → picker dùng chung → workspace Pages → role/slot → preview và kiểm tra. Tận dụng các route, service, renderer và save-state đã có; audit Content ngày 23/09 trong tài liệu chi tiết thay cho mô tả baseline cũ khi triển khai phần này.

Đầu ra là một công cụ nhập asset có sẵn và dựng truyện demo hoạt động được, chưa gồm AI tạo asset, vẽ/chỉnh ảnh, drag/drop hay narration generation. Có thể bắt đầu bằng fixture và quy ước frontend trong [CONTENT_MANAGER_CONTRACT.md](CONTENT_MANAGER_CONTRACT.md), không chờ upload API. Chưa tuyên bố khớp Mobile khi schema chưa được review.

Đợt này ước lượng 8–13 ngày công (dự phòng 10–16), là phân rã ưu tiên của C-01–04/C-07/C-09 và một phần validation; không cộng cơ học vào tổng Web. Demo frontend không đóng G2/G3: upload/storage, quyền, revision và publish snapshot thật vẫn phải nghiệm thu với Backend/Mobile. Các domain khác tiếp tục theo phụ thuộc riêng, không cần chờ toàn bộ Content hoàn tất.

1. Prototype kỹ thuật sớm bằng một truyện nhỏ: nhiều trang, một role, một slot và một quiz. Kiểm chứng payload, tọa độ và preview với Mobile trước khi xây đủ UI.
2. Tách metadata, pages, roles, vocabulary và quiz thành form/tab. Dùng ID ổn định, không dùng array index làm định danh entity.
3. Làm Save draft tường minh trước. Khi save/revision ổn định, bổ sung autosave có debounce, lưu tuần tự và trạng thái `chưa lưu/đang lưu/đã lưu/lưu lỗi`; response cũ không ghi đè form mới.
4. Reorder/xóa page phải được Backend xử lý nguyên tử hoặc có contract rõ. Không đoán chuỗi nhiều PATCH sẽ luôn thành công toàn bộ.
5. Slot dùng form X/Y/scale/flip trước; thống nhất tọa độ chuẩn hóa hay canvas units, anchor, layer và aspect ratio với Mobile. Drag/drop là cải tiến sau, vẫn giữ nhập số.
6. Cảnh báo rời trang khi còn thay đổi; giữ nội dung form khi lỗi mạng. Không mặc định đồng bộ bản nháp nhạy cảm vào localStorage.
7. Publish đợi save hoàn tất và xác nhận revision; server validate toàn truyện rồi trả version mới. Frontend validation chỉ hỗ trợ nhập liệu.
8. Tham chiếu role/page/asset bị xóa phải được phát hiện. Từ chối publish nếu schema/content bắt buộc không hợp lệ; quy tắc số trang/từ/quiz cụ thể do nhóm chốt.
9. Preview tái sử dụng component render web trong editor; chia sẻ schema với Mobile. Không giả định có thể dùng chung toàn bộ React code nếu Mobile dùng công nghệ khác.

Narration MVP highlight theo câu; dữ liệu timestamp/segment và preview audio phải theo khả năng provider. Không tự dựng pipeline tạo giọng đọc ở Frontend. Không thêm age-group selector phức tạp khi sản phẩm hiện chỉ phục vụ 3–6 tuổi.

## 8. Backlog Admin

| ID | Hạng mục | Tiêu chí nghiệm thu chính |
| --- | --- | --- |
| A-01 | User management | List/search/filter/detail Parent và Content Manager; dữ liệu nhạy cảm theo quyền |
| A-02 | Lock/unlock | Hiện trạng, lý do theo contract, xác nhận hành động; server cập nhật và audit |
| A-03 | Role/permissions | Chỉ cấp quyền server cho phép; xử lý phiên/quyền thay đổi; quy tắc tự khóa/admin cuối cùng do server kiểm tra |
| A-04 | Content report queue | Filter/status/target; detail, evidence, người xử lý và lịch sử |
| A-05 | Report actions | `Open → UnderReview → Resolved/Rejected`; ghi chú và xử lý xung đột khi người khác vừa cập nhật |
| A-06 | System limits | Load/edit/save constraints; phân biệt giới hạn chung, entitlement gói và giới hạn Parent |
| A-07 | Restrictions | Từ khóa/chủ đề/nội dung hạn chế theo model server; validation, trạng thái áp dụng |
| A-08 | Monitoring | AI generation status, lỗi hệ thống và usage; retry/cancel chỉ khi có quyền/API |
| A-09 | Statistics | Users/characters/reading theo khoảng thời gian; không tự tải tất cả record để tính trên browser |
| A-10 | Audit viewer | Filter theo actor/action/target/time; read-only và phân quyền |

Report status và tác vụ với target không phải cùng một việc. “Resolved” không mặc nhiên nghĩa là đã ẩn nội dung/khóa user. Nếu Backend không cung cấp transaction chung, UI cần thể hiện kết quả từng hành động và cho phép xử lý phần thất bại.

Admin không mặc định được sửa Story Editor hoặc mở dữ liệu riêng của mọi bé. Những quyền hỗ trợ/điều tra này phải được chốt rõ; không suy ra từ tên role.

## 9. Lộ trình triển khai tổng thể

Ước lượng ngày công cho một Frontend developer, gồm UI, logic và kiểm thử mức module. Giả định có thiết kế đủ rõ, phản hồi Backend đều đặn và scope như trên. Kế hoạch Parent tối ưu phân rã M1–M5 thành 13–18 ngày công riêng Parent sau Shared G1, chưa gồm export/email và phát sinh tích hợp; không cộng thêm số này vào bảng vì Parent đã nằm trong từng giai đoạn.

| Giai đoạn | Nội dung và thứ tự | Phụ thuộc | Ngày công | Mốc nghiệm thu |
| --- | --- | --- | --- | --- |
| G0 | Chốt route, quyền, glossary, model/contract, wireflow ba role và editor spike | Nhóm BE/Mobile xác nhận giả định | 3–4 | Backlog, contract nháp, fixture và preview spike được thống nhất |
| G1 | Provider/router/auth guards; shell; UI/form/data primitives; HTTP/MSW; login/logout/profile; auth flows còn lại theo contract | G0 | 5–7 | Ba role vào đúng khu vực, session/403/logout hoạt động |
| G2 | P-01; A-01/A-02; C-01 và C-02 bản tối thiểu | G1 | 6–8 | Parent tạo bé, Admin khóa/mở user, Content tạo draft và chọn/upload asset |
| G3 | C-03 → C-04 → C-05/C-06 → C-07 → C-08/C-09 | G2, schema Mobile/BE | 10–14 | Một truyện hoàn chỉnh được publish thành version, preview đúng và sửa draft an toàn |
| G4 | P-02 → P-03/P-04 → P-05; A-04/A-05 | G2, dữ liệu character/report; story G3 cho tích hợp | 7–9 | Kiểm soát/duyệt/thư viện theo bé; Admin giải quyết một report |
| G5 | A-03/A-06/A-07/A-08; P-08; hoàn thiện asset library | Contract quyền, giới hạn và monitoring | 5–7 | Cấu hình/quyền/hạn mức và trạng thái vận hành nhất quán |
| G6 | P-06/P-07, C-10, A-09/A-10 và dashboard ba role | Dữ liệu tracking/aggregate | 5–7 | Số liệu khớp seed/API, filter/date range/partial errors đúng |
| G7 | P-09, P-10 theo scope chốt; E2E thật, responsive/a11y, hiệu năng và deployment | Export/email/BE hoàn thiện | 6–9 | Release candidate có bằng chứng kiểm thử và kịch bản demo |

Tổng cơ sở **47–65 ngày công**; thêm **20–25% dự phòng** cho contract thay đổi, review và sửa lỗi: khoảng **57–82 ngày công**. Khoảng 12–17 tuần nếu có 5 ngày công thực tế/tuần; đồ án bán thời gian sẽ kéo dài hơn. Đây là ước lượng lập kế hoạch, không phải cam kết ngày giao; hiệu chỉnh sau G2 bằng tốc độ thực tế.

G3 là phần rủi ro cao nhất nên được đưa lên sớm. Tích hợp API thực hiện ngay khi từng domain sẵn sàng, không trì hoãn toàn bộ đến G7. Nếu export/email chưa có contract, giữ task pending riêng và không đánh dấu toàn bộ chức năng hoàn thành chỉ vì demo được bằng mock.

### Ba mốc demo hữu ích

- **Demo 1 — nền tảng:** login theo ba role, Parent tạo bé, Content tạo draft, Admin lock/unlock; dữ liệu mock có thể reset.
- **Demo 2 — nghiệp vụ cốt lõi:** Content publish truyện → Parent cấu hình category và duyệt nhân vật → Mobile/seed API tạo truyện/reading → Parent thấy thư viện → Admin xử lý report.
- **Demo 3 — tích hợp:** dữ liệu thật, progress/statistics, quota, export nếu dịch vụ sẵn sàng, phân quyền và lỗi được kiểm thử.

## 10. Cách làm mỗi ticket để không phải sửa lại nhiều

Một ticket nên hoàn thành một hành vi kiểm thử được trong khoảng 0,5–2 ngày; editor lớn chia nhỏ theo save/reorder/preview/publish. Ticket gồm: actor, quyền/ownership, route, input/output, contract/fixture, business rule, UI states, acceptance criteria và test cần chạy.

Thứ tự trong mỗi ticket:

1. Viết acceptance criteria và chốt payload/error cho hành vi.
2. Tạo fixture/handler gồm happy path và lỗi quan trọng.
3. Implement service/query/schema rồi UI; đủ loading/empty/error/permission/success.
4. Làm mutation, invalidation và xử lý rời trang nếu có form.
5. Test hành vi quan trọng, lint/build và regression liên quan.
6. Tích hợp API nếu có, ghi rõ phần còn mock và điều kiện nghiệm thu thật.

Không mở nhiều module dang dở cùng lúc. Với một Frontend developer, ưu tiên một luồng chính và một nhóm sửa lỗi nhỏ; kiểm tra contract với BE theo milestone thay vì đợi màn hình hoàn thiện hết.

### Backlog mở đầu theo thứ tự cụ thể

- [ ] WEB-001: Glossary, permission matrix, route map và danh sách quyết định còn mở.
- [ ] WEB-002: Spike story schema/preview cùng một fixture nhiều trang; chốt tọa độ với Mobile.
- [ ] WEB-003: AppProviders, route modules, title/focus và error boundary.
- [ ] WEB-004: HTTP client, chuẩn lỗi, query keys và MSW fixtures theo tài khoản/role.
- [ ] WEB-005: AuthProvider, login/logout/restore, guards và role redirect.
- [ ] WEB-006: Workspace shell, menu ba role, 403/404, shared feedback/form primitives.
- [ ] WEB-007: Parent list/create/edit bé và quota/error states.
- [ ] WEB-008: Admin users list/detail/lock/unlock.
- [ ] WEB-009: Content story list/create/edit metadata và asset picker tối thiểu.
- [ ] WEB-010: Smoke E2E ba role; tích hợp auth/children/users/story API nào đã sẵn sàng.
- [ ] WEB-011: Bổ sung verify/reset/profile theo contract, hoàn thiện auth milestone.
- [ ] WEB-012: Bắt đầu editor pages/roles/slots theo kết quả spike.

## 11. Kiểm thử, dữ liệu demo và Definition of Done

### Những gì phải kiểm thử

| Lớp | Trọng tâm |
| --- | --- |
| Unit | Validation domain, chuyển trạng thái, permission mapping, date/usage formatting |
| Component | Guard đang restore, lỗi field server, form dirty, approval conflict, publish validation |
| E2E module | Auth và luồng chính của Parent/Content/Admin; không chỉ kiểm tra text có xuất hiện |
| Integration thật | Ownership, server quota, lock session, role change, publish version, report transitions |
| UI quality | Keyboard/focus, axe, responsive, bảng dài/form/editor, lỗi tải asset |
| Release | Build, deep-link refresh, session, API environment, mock disabled, smoke trên staging |

Không dùng mock để khẳng định Backend đã bảo vệ quyền. Kiểm thử truy cập trực tiếp resource của Parent khác, tài khoản bị khóa và request sai role cần API thật, phối hợp với BE.

Fixture pack: ba role, ít nhất hai Parent, bé chưa có dữ liệu/nhiều bé/đạt quota; nhân vật mọi trạng thái và version mới; truyện draft hợp lệ/không hợp lệ/published/hidden; report từng trạng thái; jobs thành công/lỗi/đang xử lý. E2E mutation dùng dữ liệu riêng hoặc reset riêng để test chạy song song không tranh chấp.

### Definition of Done cho mỗi feature

- Quy tắc và contract/giả định được ghi lại; có trạng thái phân biệt mock-complete và API-integrated.
- Route/menu/quyền đúng; server ownership đã kiểm chứng khi API sẵn sàng.
- Đủ loading, empty, error/retry, forbidden, success; form có validation và dirty-state phù hợp.
- Mutation phản ánh đúng dữ liệu; lỗi/conflict không báo thành công giả hoặc mất nội dung nhập.
- Responsive, bàn phím/focus và nội dung tiếng Việt nhất quán.
- Test có giá trị cho logic và happy path chính; lint/build và regression liên quan đạt.
- Không log token/thông tin nhạy cảm, không lỗi console nghiêm trọng; có hướng dẫn demo/tích hợp.

Giữ `npm test` cho Playwright hiện có; khi thêm Vitest dùng script riêng như `test:unit` để không vô tình đổi hành vi CI. CI dùng trình duyệt được cài rõ ràng: cấu hình hiện tại dùng Chrome trên máy local, cần chuẩn hóa trên runner.

## 12. Hiệu năng và triển khai

- Lazy-load theo khu vực/route, đặc biệt Story Editor, charts và preview nặng.
- Pagination/filter ở server khi dữ liệu lớn; không tải tất cả users/stories/audit logs vào browser.
- Ảnh thumbnail, kích thước ảnh rõ, tải media theo trang; giải phóng object URL sau preview upload.
- Hủy request không còn cần; polling chỉ chạy khi job active/trang còn sử dụng, dừng ở terminal state và có backoff lỗi.
- Chỉ thêm chart library khi đã có chỉ số và dữ liệu cần biểu diễn; bảng/số liệu đủ thì dùng trước.
- Đo production build với fixture đại diện trên thiết bị/mạng thống nhất; chốt budget theo màn. Chỉ tiêu reader 3 giây trong tài liệu nguồn thuộc reader, không tự áp nguyên xi cho mọi màn Admin.
- Dev/demo/staging/production có cấu hình API rõ; `VITE_*` là cấu hình client công khai. Không đặt secret hoặc API key đặc quyền trong bundle.
- Hosting hỗ trợ SPA rewrite để refresh route động. Quy định cookie/CORS/CSRF tùy auth contract; frontend không tự quyết một nửa cơ chế.
- Staging là môi trường nghiệm thu; kiểm tra release build, API mode, deep links và smoke ba role trước phát hành. Có cách quay lại build trước khi phát hiện lỗi.

## 13. Quyết định cần chốt và cách không làm nghẽn tiến độ

| Quyết định | Cần trước | Cách tiếp tục khi chưa chốt |
| --- | --- | --- |
| Một SPA, role enum, một/nhiều role | G1 | Kế hoạch giả định một SPA, một role/account; cô lập mapping |
| Auth/session/verify | Auth thật | Dùng mock rõ ràng, không coi là đã xác thực production |
| Fields child, age validation, avatar | P-01 | Prototype field tối thiểu; chưa hardcode quy tắc tuổi ngoài phạm vi |
| Role sở hữu category và Free/premium catalog | C-01/C-08 | Catalog fixture read-only; chưa thêm CRUD tùy tiện |
| Story draft/version/revision và slot schema | Nghiệm thu G3 với BE/Mobile | Dựng khung F0–F5 với contract frontend tạm, cô lập adapter; review trước khi chốt fidelity Mobile/canvas nâng cao |
| Lý do reject và sensitive permission qua version | P-03/P-04 | Ghi giả định mock, chờ rule trước nghiệm thu thật |
| Foreground/background, timezone, daily character limit | P-02 | Tách settings UI khỏi thực thi usage; hoãn field chưa chốt |
| Gói theo account/child, quota/reset/regenerate | P-08 và enforce thật | Đọc entitlement response; không tự tính quyền từ bảng giá |
| Admin được sửa nội dung/xem dữ liệu riêng nào | A-03/A-05 | Không tự cấp quyền; chuẩn bị hành động theo capability |
| Moderation target action, retention/soft delete | A-05/P-05 | Mô tả rõ phạm vi; không triển khai xóa vĩnh viễn giả định |
| Export format/job/file retention và email report Family | G7 | Chuẩn bị job UI/schema; phần tích hợp vẫn pending |

`PROJECT_SUMMARY.md` còn một số ghi chú cũ: phần ma trận quyền vẫn hỏi Child có account riêng dù quyết định mới đã chốt là profile; phần hiện trạng nói chưa có Git metadata dù workspace hiện dùng Git. Khi làm sạch tài liệu nguồn, ưu tiên quyết định có ngày cập nhật và bằng chứng repository; không biến ghi chú cũ thành yêu cầu mới.

## 14. Khi thiếu thời gian và cách theo dõi tiến độ

Giữ trước: auth/quyền, hồ sơ/settings/approval Parent, story editor dạng form và publish, quản trị user/report, dữ liệu tiến độ cơ bản. Hoãn trước: drag/drop editor, bulk action, chart cầu kỳ, dashboard trang trí, audit viewer nâng cao và realtime notification. Export/email chỉ hoãn sau khi thống nhất MVP, vì đã xuất hiện trong phạm vi/quyền lợi nguồn.

Theo dõi từng ticket qua `Backlog → Ready → In progress → Review → Done`; đánh dấu riêng `Mock complete`, `API integrated`, `Verified on staging`. Module demo đẹp nhưng chưa có API không được tính ngang với module đã tích hợp và kiểm thử thật.

Sau G2, cập nhật ước lượng theo tốc độ thực tế và độ ổn định contract. Kế hoạch này được cập nhật theo quyết định nhóm; không nhân bản quy tắc nghiệp vụ mâu thuẫn trong ba tài liệu riêng theo role.
