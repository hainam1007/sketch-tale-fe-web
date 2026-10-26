# 📊 BÁO CÁO ĐỐI SOÁT & CHECKLIST HOÀN THIỆN ADMIN FRONTEND (FE)
> **Tài liệu đối chiếu:** [ADMIN_API_DOCUMENTATION_FOR_FE.md](file:///c:/Users/truon/SketchTaleFE/ADMIN_API_DOCUMENTATION_FOR_FE.md)  
> **Repository:** `SketchTaleFE` (React 19, Vite, TanStack Query, React Router)  
> **Thời điểm kiểm tra:** Tháng 10/2026  
> **Trạng thái tổng thể:** **Đã hoàn thiện ~55%** (5/10 phân hệ đã chạy Real API tốt, 2 phân hệ chạy một phần/chỉ đọc, 3 phân hệ còn thiếu hoặc đang dùng mock).

---

## 📌 1. TỔNG QUAN TỶ LỆ PHỦ API THEO 10 PHÂN HỆ

| STT | Phân hệ API (Theo tài liệu) | Route Backend | Hiện trạng trên FE | Mức độ hoàn thành |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Xác thực & Phiên Admin | `/api/auth/*` | Đã tích hợp Full: Login, Refresh Token Rotation, Logout, Profile, Change Password, Current Role | **100%** (Real API) |
| **2** | Quản lý Gói dịch vụ | `/api/subscription-plans` | Trang `/admin/subscription-plans` đã CRUD đầy đủ thông qua `adminCatalogService` | **90%** (Real API) |
| **3** | Cấu hình Chi phí Credit AI | `/api/credit-costs` | Trang `/admin/credit-costs` đã CRUD đầy đủ qua `adminCatalogService` | **100%** (Real API) |
| **4** | Quản lý Đăng ký Thuê bao | `/api/subscriptions` | **Chưa có UI và Service** trên Admin FE (Mới chỉ khai báo route allowlist) | **0%** ⚠️ *Cần làm mới* |
| **5** | Hồ sơ Phụ huynh & Trẻ em | `/api/parent-profiles`<br>`/api/child-profiles` | Trang `/admin/users` hiện **vẫn dùng Mock data**; chưa kết nối API profiles thật | **15%** ⚠️ *Cần nối API* |
| **6** | An toàn Nội dung & Kiểm duyệt | `/api/restricted-keywords`<br>`/api/prohibited-themes`<br>`/api/content-reports` | - Từ khóa & Chủ đề cấm: **100% Real API**<br>- Báo cáo vi phạm: **Chỉ đọc (Read-only)**, chưa có nút duyệt/hủy | **75%** ⚠️ *Cần thêm action* |
| **7** | Nhật ký Kiểm toán (Audit Logs) | `/api/audit-logs` | Trang `/admin/audit` đã kết nối Real API, lọc theo Scope; cần tối ưu format JSON diff | **90%** (Real API) |
| **8** | Danh mục Nhân vật & Chủ đề | `/api/char-types`<br>`/api/education-themes` | Đã có 2 trang CRUD: `/admin/char-types` và `/admin/education-themes` | **100%** (Real API) |
| **9** | Kho Truyện Mẫu CMS (Story) | `/api/story-template`<br>`/api/storypage-template`<br>`/api/story-quiz`, v.v. | Đã kết nối trong module `/content/*`. Tuy nhiên Admin chưa được phân quyền truy cập CMS này | **80%** (Real API) |
| **10**| Tải file lên Cloudinary | `/api/upload/*` | Module upload hiện tại đang lưu mock local Blob / IndexedDB, chưa gọi endpoint Cloudinary | **20%** ⚠️ *Cần nối API* |

---

## 🔍 2. CHI TIẾT ĐỐI SOÁT TỪNG PHÂN HỆ & CHECKLIST CẦN LÀM

### Phân hệ 1: Xác Thực & Tài Khoản Admin (`/api/auth`)
- **Backend APIs:** `POST /login`, `POST /refresh-token`, `POST /logout`, `GET /profile`, `GET /current-role`, `POST /change-password`.
- **Thực tế Frontend:**
  - File: [`src/features/auth/authService.js`](file:///c:/Users/truon/SketchTaleFE/src/features/auth/authService.js) và [`src/lib/api/httpClient.js`](file:///c:/Users/truon/SketchTaleFE/src/lib/api/httpClient.js).
  - Tự động bắt mã `401` và chạy cơ chế `refreshTokens()` với Mutex lock tránh race conditions.
  - Hỗ trợ lưu trữ cặp Access Token + Refresh Token trong LocalStorage / SessionStorage.
- **Tình trạng:** ✅ **Đã hoàn thiện 100%**.

---

### Phân hệ 2: Quản Lý Gói Dịch Vụ & Bảng Giá (`/api/subscription-plans`)
- **Backend APIs:** `GET`, `POST`, `PATCH /{id}`, `DELETE /{id}`, `GET /code/{plan-code}`.
- **Thực tế Frontend:**
  - Trang: [`src/features/admin/pages/AdminCatalogPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminCatalogPage.jsx) (tham số `kind="plans"`).
  - Service: [`src/features/admin/services/adminCatalogService.js`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/services/adminCatalogService.js).
  - Form đã có các trường: `name`, `code`, `price`, `childProfileLimit`, `monthlyCreditLimit`, `durationDays`, `freeTrialDays`, `accessFullStories`, `canExportStory`, `isActive`.
- **Việc cần làm bổ sung:**
  - [ ] Hiển thị đơn vị tiền tệ rõ ràng (VNĐ) theo tài liệu (hiện ghi chú: *"Giá (đơn vị chưa được API xác nhận)"*).
  - [ ] Tích hợp API tra cứu nhanh theo mã `GET /subscription-plans/code/{plan-code}` nếu cần kiểm tra trùng mã khi tạo.

---

### Phân hệ 3: Cấu Hình Chi Phí Credit Tính Năng AI (`/api/credit-costs`)
- **Backend APIs:** Full CRUD `/api/credit-costs`.
- **Thực tế Frontend:**
  - Trang: [`AdminCatalogPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminCatalogPage.jsx) (`kind="credits"`).
  - DTO: Đã chuẩn hóa `featureKey`, `featureNameVi`, `featureNameEn`, `cost`, `isActive`.
- **Tình trạng:** ✅ **Đã hoàn thiện 100%**.

---

### Phân hệ 4: Quản Lý Đăng Ký Thuê Bao (`/api/subscriptions`)
- **Backend APIs:**
  - `GET /api/subscriptions`: Danh sách toàn bộ thuê bao
  - `GET /api/subscriptions/{id}`: Chi tiết 1 hợp đồng
  - `GET /api/subscriptions/parent-profile/{id}`: Thuê bao của phụ huynh
  - `GET /api/subscriptions/subscription-plan/{id}`: Thuê bao theo gói
  - `POST /api/subscriptions`: Đăng ký thủ công gói cho phụ huynh
  - `PATCH /api/subscriptions?id={id}`: Cập nhật trạng thái/ngày hiệu lực
  - `DELETE /api/subscriptions/{id}`: Hủy thuê bao
- **Thực tế Frontend:**
  - **Hiện tại chưa có trang UI nào trong FE phục vụ chức năng này.**
  - Chỉ mới khai báo danh sách route trong [`src/lib/api/backendRoutes.js`](file:///c:/Users/truon/SketchTaleFE/src/lib/api/backendRoutes.js#L98-L104).
- **Checklist cần làm mới:**
  - [ ] Tạo service `subscriptionService.js` để gọi các endpoint `/api/subscriptions`.
  - [ ] Tạo trang quản lý `AdminSubscriptionsPage.jsx` (đường dẫn `/admin/subscriptions`) hiển thị danh sách thuê bao, trạng thái (`SubscriptionStatus`: 0: Chờ thanh toán, 1: Active, 2: Hết hạn, 3: Đã hủy), ngày bắt đầu/kết thúc.
  - [ ] Thêm liên kết vào Sidebar Admin trong `WorkspaceLayout.jsx`.

---

### Phân hệ 5: Quản Lý Hồ Sơ Phụ Huynh & Trẻ Em (`/api/parent-profiles`, `/api/child-profiles`)
- **Backend APIs:**
  - `GET /api/parent-profiles`, `GET /api/parent-profiles/{id}`, `PUT /api/parent-profiles/{id}` (Gán gói cước cho phụ huynh), `PATCH /api/parent-profiles/{id}/mark-trial-plan-used`.
  - `GET /api/child-profiles`, `GET /api/child-profiles/{id}`, `PUT /api/child-profiles/{id}` (Cập nhật thời gian dùng máy `dailyTimeLimit`, số lượt tạo nhân vật `dailyCharacterLimit`).
- **Thực tế Frontend:**
  - Trang [`AdminUsersPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminUsersPage.jsx) và [`AdminUserDetailPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminUserDetailPage.jsx) hiện đang gọi mock endpoint `/admin/users` và `/admin/permissions` (chỉ chạy khi `VITE_ADMIN_API_MODE=mock`).
  - Chưa từng gọi vào `/parent-profiles` hay `/child-profiles`.
- **Checklist cần chuyển đổi (Migration):**
  - [ ] Thay vì lấy danh sách user từ mock, tạo hàm `listParentProfiles()` gọi `GET /api/parent-profiles`.
  - [ ] Hiển thị thông tin thực tế: Số credit còn lại, số bé đã tạo, gói cước hiện tại.
  - [ ] Thêm Dialog cho phép Admin gán gói dịch vụ cho phụ huynh qua `PUT /api/parent-profiles/{id}` (`{ "subscriptionPlanId": "..." }`).
  - [ ] Thêm trang/tab danh sách Hồ sơ trẻ em (`/api/child-profiles`) cho phép xem và điều chỉnh giới hạn giờ chơi `dailyTimeLimit` và số nhân vật `dailyCharacterLimit`.

---

### Phân hệ 6: An Toàn Nội Dung & Kiểm Duyệt (Safety & Moderation)
- **Backend APIs:**
  1. `/api/restricted-keywords`: Quản lý từ khóa cấm.
  2. `/api/prohibited-themes`: Quản lý chủ đề bị cấm.
  3. `/api/content-reports`: Tiếp nhận và xử lý báo cáo vi phạm.
- **Thực tế Frontend:**
  - **Từ khóa cấm (`/restricted-keywords`):** Đã kết nối Real API tại [`AdminRestrictionsPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminRestrictionsPage.jsx) (hỗ trợ tạo, sửa, xóa, toggle trạng thái). ✅
  - **Chủ đề cấm (`/prohibited-themes`):** Đã kết nối Real API tại [`AdminModerationCatalogPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminModerationCatalogPage.jsx). ✅
  - **Báo cáo vi phạm (`/content-reports`):**
    - Trang [`AdminContentReportsPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminContentReportsPage.jsx) đã hiển thị danh sách và chi tiết báo cáo từ Backend.
    - ⚠️ **Tuy nhiên đang ở chế độ CHỈ ĐỌC (Read-only)**. Ghi chú dòng 275: *"Chỉ đọc. Swagger hiện mô tả PATCH cập nhật DTO, nhưng chưa xác nhận ý nghĩa trạng thái..."*
- **Checklist cần bổ sung:**
  - [ ] Bổ sung các nút hành động tại `AdminContentReportDetailPage`:
    - Duyệt vi phạm / Giải quyết: Gửi `PATCH /api/content-reports/{id}` với `status: 2` (`Resolve`).
    - Bác bỏ báo cáo: Gửi `PATCH /api/content-reports/{id}` với `status: 3` (`Dismissed`).
  - [ ] Cho phép Admin xóa báo cáo qua `DELETE /api/content-reports/{id}`.
  - [ ] Ánh xạ enum `ContentReportStatus` (0: Chờ xử lý, 1: Đang xem xét, 2: Đã giải quyết, 3: Bác bỏ) thay vì hiển thị mã số `Mã 0, Mã 1...`.

---

### Phân hệ 7: Nhật Ký Kiểm Toán Hệ Thống (`/api/audit-logs`)
- **Backend APIs:** `GET /api/audit-logs`, lọc theo `user-id`, `entity-name`, `entity-id`, và xem chi tiết theo ID.
- **Thực tế Frontend:**
  - Đã tích hợp đầy đủ tại [`AdminAuditPage.jsx`](file:///c:/Users/truon/SketchTaleFE/src/features/admin/pages/AdminAuditPage.jsx) và `adminService.listAudit`.
- **Checklist tối ưu UI:**
  - [ ] Parse chuỗi JSON trong `oldValues` và `newValues` (`JSON.parse(...)`) để hiển thị dạng bảng so sánh "Trước - Sau" trực quan thay vì chuỗi text thô.

---

### Phân hệ 8: Danh Mục Phân Loại Nhân Vật & Chủ Đề
- **Backend APIs:** `/api/char-types` và `/api/education-themes`.
- **Thực tế Frontend:**
  - `/admin/char-types` -> `AdminModerationCatalogPage(kind="charTypes")`.
  - `/admin/education-themes` -> `AdminCatalogPage(kind="themes")`.
- **Tình trạng:** ✅ **Đã hoàn thiện 100%**.

---

### Phân hệ 9: Quản Lý Kho Truyện Mẫu CMS (CMS Authoring)
- **Backend APIs:** Toàn bộ API CRUD Story Template, Page Template, Role, Slot nhân vật, Quizz trắc nghiệm, Từ vựng theo trang.
- **Thực tế Frontend:**
  - Mã nguồn trong [`src/features/content/services/contentService.js`](file:///c:/Users/truon/SketchTaleFE/src/features/content/services/contentService.js) đã kết nối đầy đủ các API này khi bật `VITE_CONTENT_API_MODE=real`.
- **Vấn đề phân quyền (Routing):**
  - Tại [`src/app/App.jsx`](file:///c:/Users/truon/SketchTaleFE/src/app/App.jsx#L162), nhóm route `/content/*` chỉ mở cho role `ROLES.CONTENT`.
  - Theo tài liệu mục 2.2, role `Admin` cũng có quyền đọc và quản lý kho truyện mẫu.
- **Checklist cần làm:**
  - [ ] Mở rộng quyền tại router: `<Route element={<RequireRole roles={[ROLES.CONTENT, ROLES.ADMIN]} />}>` để Admin cũng có thể vào kiểm tra / duyệt truyện.

---

### Phân hệ 10: Tải Lên Đa Phương Tiện Media Cloudinary (`/api/upload`)
- **Backend APIs:**
  - `POST /api/upload/background-image` (FormData `file`, tối đa 10MB)
  - `POST /api/upload/avatar` (FormData `file`)
- **Thực tế Frontend:**
  - File [`assetService.js`](file:///c:/Users/truon/SketchTaleFE/src/features/content/services/assetService.js) hiện đang tự lưu file ảnh dạng Blob vào IndexedDB/LocalStorage của trình duyệt (Mock local store) thay vì upload lên Backend lấy link Cloudinary.
- **Checklist cần làm:**
  - [ ] Xây dựng service `uploadMediaService.js`:
    ```javascript
    export async function uploadBackgroundImage(file) {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest({ path: "/upload/background-image", method: "POST", body: formData, forceReal: true });
    }
    ```
  - [ ] Tích hợp vào form tạo trang truyện và avatar người dùng.

---

## ⚠️ 3. CÁC MÀN HÌNH ADMIN ĐANG PHẢI DÙNG MOCK DO BACKEND CHƯA CÓ API

Một số trang trong Admin portal hiện tại vẫn phụ thuộc hoàn toàn vào dữ liệu Mock giả lập (`VITE_ADMIN_API_MODE=mock`) do Backend Clean Architecture chưa phát triển endpoint tương ứng:

1. **Dashboard Tổng Quan (`/admin` - `AdminOverviewPage.jsx`):** Chưa có API tổng hợp số liệu KPIs (tổng doanh thu, số user mới, biểu đồ tăng trưởng).
2. **Quản lý Giới Hạn Hệ Thống (`/admin/system-limits` - `AdminSystemLimitsPage.jsx`):** Chưa có API lưu cấu hình rate limit / giới hạn toàn hệ thống.
3. **Giám Sát Tác Vụ Nền (`/admin/monitoring` - `AdminMonitoringPage.jsx`):** Chưa có API giám sát background job (Hangfire / RabbitMQ).
4. **Phân Quyền Chi Tiết (`/admin/permissions` - `AdminPermissionsPage.jsx`):** BE chưa có API gán Role động cho User (chỉ cố định 4 role hệ thống).
5. **Thống Kê (`/admin/statistics` - `AdminStatisticsPage.jsx`):** Chưa có API phân tích chuyên sâu.

---

## 🚀 4. LỘ TRÌNH ĐỀ XUẤT THỰC HIỆN TIẾP THEO (ACTION PLAN)

### 🥇 Giai đoạn 1: Ưu tiên cao (Khắc phục tính năng trọng yếu còn thiếu)
1. **Hoàn thiện Xử lý Vi phạm (`AdminContentReportsPage.jsx`):** Thêm nút đổi trạng thái báo cáo vi phạm (`PATCH /api/content-reports/{id}`) sang `Resolve` (2) hoặc `Dismissed` (3).
2. **Tích hợp Quản lý Đăng ký Thuê bao (`/admin/subscriptions`):** Xây dựng trang quản lý hợp đồng thuê bao từ các API `/api/subscriptions`.
3. **Chuyển đổi Quản lý Người dùng sang Real API:** Chuyển `AdminUsersPage.jsx` sang đọc dữ liệu từ `GET /api/parent-profiles` và `GET /api/child-profiles`.

### 🥈 Giai đoạn 2: Tối ưu trải nghiệm (Refinement & Cloudinary)
1. **Nối API Upload Cloudinary (`/api/upload`):** Thay thế việc lưu blob IndexedDB bằng việc upload trực tiếp lên Cloudinary thông qua backend.
2. **Cải tiến hiển thị Audit Logs:** Viết parser JSON diff để so sánh trực quan các thay đổi trong `oldValues` vs `newValues`.
3. **Đồng bộ phân quyền CMS Story:** Cho phép Admin truy cập xem kho truyện của Content Manager.
