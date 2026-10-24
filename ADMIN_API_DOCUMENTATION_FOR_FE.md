# 📘 TÀI LIỆU TÍCH HỢP HỆ THỐNG API DÀNH CHO ADMIN & CONTENT MANAGER
> **Dự án:** SketchTale Backend API (.NET 8 Clean Architecture)  
> **Mục tiêu:** Hướng dẫn đội ngũ Frontend (FE) tích hợp, cấu hình Dashboard/Portal quản trị hệ thống nhanh chóng và chính xác.  
> **Cập nhật:** Tháng 10/2026 | **Múi giờ chuẩn:** UTC+7 (Giờ Việt Nam)

---

## 📑 MỤC LỤC
1. [Tổng Quan & Cấu Hình Môi Trường](#1-tổng-quan--cấu-hình-môi-trường)
2. [Cơ Chế Xác Thực & Phân Quyền (Auth & RBAC)](#2-cơ-chế-xác-thực--phân-quyền-auth--rbac)
3. [Quy Chuẩn Dữ Liệu & Error Handling](#3-quy-chuẩn-dữ-liệu--error-handling)
4. [Bảng Tra Cứu Enums Chuẩn Hóa (Frontend Enums Cheat Sheet)](#4-bảng-tra-cứu-enums-chuẩn-hóa)
5. [Chi Tiết Toàn Bộ APIs Theo Phân Hệ Admin](#5-chi-tiết-toàn-bộ-apis-theo-phân-hệ-admin)
   - [Phân hệ 1: Xác Thực & Tài Khoản Admin (`/api/auth`)](#phân-hệ-1-xác-thực--tài-khoản-admin)
   - [Phân hệ 2: Quản Lý Gói Dịch Vụ & Bảng Giá (`/api/subscription-plans`)](#phân-hệ-2-quản-lý-gói-dịch-vụ--bảng-giá)
   - [Phân hệ 3: Cấu Hình Chi Phí Credit Tính Năng AI (`/api/credit-costs`)](#phân-hệ-3-cấu-hình-chi-phí-credit-tính-năng-ai)
   - [Phân hệ 4: Quản Lý Đăng Ký Thuê Bao (`/api/subscriptions`)](#phân-hệ-4-quản-lý-đăng-ký-thuê-bao)
   - [Phân hệ 5: Quản Lý Hồ Sơ Phụ Huynh & Trẻ Em (`/api/parent-profiles`, `/api/child-profiles`)](#phân-hệ-5-quản-lý-hồ-sơ-phụ-huynh--trẻ-em)
   - [Phân hệ 6: An Toàn Nội Dung & Kiểm Duyệt (`/api/restricted-keywords`, `/api/prohibited-themes`, `/api/content-reports`)](#phân-hệ-6-an-toàn-nội-dung--kiểm-duyệt)
   - [Phân hệ 7: Nhật Ký Kiểm Toán Hệ Thống (`/api/audit-logs`)](#phân-hệ-7-nhật-ký-kiểm-toán-hệ-thống)
   - [Phân hệ 8: Danh Mục Phân Loại Nhân Vật & Chủ Đề (`/api/char-types`, `/api/education-themes`)](#phân-hệ-8-danh-mục-phân-loại-nhân-vật--chủ-đề)
   - [Phân hệ 9: Quản Lý Kho Truyện Mẫu - CMS (`/api/story-template`, `/api/storypage-template`, v.v.)](#phân-hệ-9-quản-lý-kho-truyện-mẫu---cms)
   - [Phân hệ 10: Tải Lên Đa Phương Tiện Media Cloudinary (`/api/upload`)](#phân-hệ-10-tải-lên-đa-phương-tiện-media-cloudinary)
6. [Mã Nguồn Mẫu Cấu Hình Client (Axios + Auto Refresh Token + TypeScript)](#6-mã-nguồn-mẫu-cấu-hình-client)

---

## 1. TỔNG QUAN & CẤU HÌNH MÔI TRƯỜNG

### 1.1. Thông Tin Kết Nối
- **Local Dev Server:** `http://localhost:8080` (hoặc `http://localhost:5000` tùy cấu hình)
- **Swagger UI:** `http://localhost:8080/swagger` (Hệ thống tự động redirect từ trang chủ `/` sang `/swagger`)
- **CORS:** Đã kích hoạt chính sách `AllowAll` (Chấp nhận mọi origin, header, method trong quá trình phát triển).
- **Múi giờ:** Tất cả trường thời gian (`CreatedAt`, `UpdatedAt`, `StartDate`, `EndDate`,...) được chuẩn hóa theo **UTC+7** (Giờ Việt Nam).

### 1.2. Headers Mặc Định
| Tên Header | Giá trị mẫu | Ghi chú |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Dùng cho tất cả API gửi nhận JSON thông thường |
| `Content-Type` | `multipart/form-data` | Dùng cho các API upload file ảnh, file âm thanh |
| `Authorization` | `Bearer <ACCESS_TOKEN>` | Bắt buộc đối với các API yêu cầu đăng nhập |

### 1.3. Tài Khoản Thử Nghiệm Mặc Định (Seed Accounts)
Hệ thống đã nạp sẵn dữ liệu ban đầu phục vụ test:

| Quyền hạn (Role) | Username / Identifier | Password | Mục đích sử dụng trên FE |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` (hoặc `admin@sketch.tale.com`) | `Admin@123` | Quản trị toàn hệ thống, gói cước, kiểm duyệt, logs |
| **Content Manager** | `manager` (hoặc `manager@sketch.tale.com`) | `Manager@123` | Quản lý bản mẫu truyện, câu đố, từ vựng, trang sách |
| **Parent** | `parent` (hoặc `parent@sketch.tale.com`) | `Parent@123` | Phụ huynh mẫu (dùng để test các luồng liên kết) |
| **Child** | `child` | `Child@123` | Trẻ em mẫu |

---

## 2. CƠ CHẾ XÁC THỰC & PHÂN QUYỀN (AUTH & RBAC)

### 2.1. Chu Kỳ Hoạt Động Của Token
1. **Đăng nhập (`/api/auth/login`):** FE gửi `identifier` (username hoặc email) + `password`. Nhận về `token` (Access Token - hiệu lực **60 phút**) và `refreshToken` (hiệu lực **7 ngày**).
2. **Gửi Token:** Lưu `token` vào Memory / LocalStorage / Cookie. Mọi request cần quyền đính kèm Header: `Authorization: Bearer <token>`.
3. **Cơ chế Refresh Token Rotation (`/api/auth/refresh-token`):**
   - Khi gọi API nhận mã `401 Unauthorized`, FE gọi API `/api/auth/refresh-token`.
   - Có 2 cách gửi: Hoặc gửi kèm body `{ "refreshToken": "..." }`, hoặc gửi token cũ trong header `Authorization: Bearer <token_hết_hạn>` (BE đã cấu hình validator cho phép đường dẫn `/refresh-token` bỏ qua lỗi token hết hạn).
   - BE sẽ hủy refresh token cũ và sinh ra 1 cặp `token` + `refreshToken` mới.
4. **Đăng xuất (`/api/auth/logout`):** BE sẽ đưa access token hiện tại vào `TokenBlacklist` (bộ nhớ tạm cache) để vô hiệu hóa tức thì, đồng thời xóa refresh token trong cơ sở dữ liệu.

### 2.2. Ma Trận Quyền Hạn Dành Cho Admin Portal
| Phân hệ chức năng | Quyền `Admin` | Quyền `ContentManager` |
| :--- | :---: | :---: |
| Quản lý Gói dịch vụ (`SubscriptionPlans`) | ✅ Toàn quyền | ❌ |
| Cấu hình Chi phí Credit AI (`CreditCosts`) | ✅ Toàn quyền | ❌ |
| Quản lý Thuê bao người dùng (`Subscriptions`) | ✅ Toàn quyền | ❌ |
| Quản lý Hồ sơ Phụ huynh & Bé (`Profiles`) | ✅ Toàn quyền | ❌ |
| Kiểm duyệt từ khóa, chủ đề cấm (`Safety`) | ✅ Toàn quyền | ❌ |
| Xử lý Báo cáo vi phạm (`ContentReports`) | ✅ Toàn quyền | ❌ |
| Tra cứu Nhật ký kiểm toán (`AuditLogs`) | ✅ Toàn quyền | ❌ |
| Quản lý Master Data (Chủ đề, Loại nhân vật) | ✅ Toàn quyền | ❌ |
| Quản lý Kho Truyện Mẫu (Story Templates & Pages) | ✅ Đọc & Quản lý | ✅ Toàn quyền (Tạo, Sửa, Xóa, Xuất bản) |
| Quản lý Câu đố & Từ vựng trang truyện | ✅ Đọc & Quản lý | ✅ Toàn quyền |
| Tải ảnh nền truyện Cloudinary (`/upload`) | ✅ Hỗ trợ | ✅ Toàn quyền |

> **Lưu ý quan trọng cho FE:** Trong claim của JWT Token và DB Identity, vai trò có thể là `"Admin"` hoặc `"admin"`, `"ContentManager"` hoặc `"content manager"`. Trên FE, khi kiểm tra role, nên dùng `.toLowerCase()` để so khớp an toàn (`role.toLowerCase().includes('admin')`).

---

## 3. QUY CHUẨN DỮ LIỆU & ERROR HANDLING

### 3.1. Cấu Trúc Bản Ghi Kế Thừa (`BaseFieldDto`)
Hầu hết các entities trả về đều có các thuộc tính metadata hệ thống sau:
```typescript
interface BaseFieldDto {
  id: string;          // GUID (VD: "3fa85f64-5717-4562-b3fc-2c963f66afa6")
  createdAt: string;   // ISO-8601 UTC+7 (VD: "2026-10-24T14:30:00+07:00")
  createBy: string;    // GUID của User tạo bản ghi
  updatedAt?: string;  // ISO-8601 UTC+7 (có thể null nếu chưa từng sửa)
  updateBy?: string;   // GUID của User sửa lần cuối (có thể null)
}
```

### 3.2. Cấu Trúc Response
- **Các API Xác thực (`/api/auth/...`):**
  ```json
  {
    "data": { ... },
    "message": "Thông báo thành công!"
  }
  ```
- **Các API CRUD Dữ liệu (`/api/subscription-plans`, `/api/audit-logs`,...):**
  - Trả về trực tiếp Object DTO hoặc Mảng `[ { ... }, { ... } ]`.
  - Khi tạo thành công: HTTP `201 Created` kèm Object vừa tạo trong body.
  - Khi cập nhật hoặc xóa thành công: HTTP `200 OK` hoặc `204 NoContent`.

### 3.3. Xử Lý Mã Lỗi (HTTP Status Codes)
- `400 Bad Request`: Dữ liệu không hợp lệ. Body dạng:
  ```json
  { "message": "Thông báo lỗi chi tiết từ nghiệp vụ" }
  ```
  hoặc (nếu vi phạm ModelState validation):
  ```json
  {
    "errors": {
      "SubscriptionPlanId": ["SubscriptionPlanId là bắt buộc."]
    }
  }
  ```
- `401 Unauthorized`: Chưa truyền Token, Token hết hạn, hoặc Token đã bị thu hồi qua Logout. Body:
  ```json
  { "message": "Bạn chưa đăng nhập hoặc token đã hết hạn / bị vô hiệu hóa." }
  ```
- `403 Forbidden`: Người dùng đã đăng nhập nhưng không có vai trò phù hợp (VD: Tài khoản Parent truy cập vào API của ContentManager).
- `404 Not Found`: Không tìm thấy bản ghi theo ID yêu cầu.
- `500 Internal Server Error`: Lỗi máy chủ chưa được bắt.

---

## 4. BẢNG TRA CỨU ENUMS CHUẨN HÓA

> ⚠️ **LƯU Ý ĐẶC BIỆT DÀNH CHO FRONTEND:**  
> Backend .NET mặc định serialize Enum ra **Số nguyên (Integer: 0, 1, 2...)** trừ khi một số endpoint đặc biệt được map qua String (như `ChildProfile.TargetAgeGroup`). Để hiển thị Dropdown, Badge, Tag trên giao diện trực quan, FE hãy cấu hình các bảng ánh xạ sau:

### 4.1. `CommonStatus` (Trạng thái chung)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt (UI) | Màu Badge gợi ý |
| :---: | :--- | :--- | :--- |
| `0` | `Draft` | Bản nháp | Xám (Gray) |
| `1` | `Pending` | Chờ duyệt | Vàng cam (Warning) |
| `2` | `Active` | Đang hoạt động / Xuất bản | Xanh lá (Success) |
| `3` | `Inactive` | Ngưng hoạt động | Đỏ (Danger) |
| `4` | `Archived` | Đã lưu trữ | Tím (Secondary) |

### 4.2. `TargetAgeGroup` (Nhóm tuổi đích)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt (UI) |
| :---: | :--- | :--- |
| `0` | `Ag6to7` | 6 - 7 tuổi |
| `1` | `Age8to10` | 8 - 10 tuổi |
| `2` | `Age11to12` | 11 - 12 tuổi |

### 4.3. `SubscriptionStatus` (Trạng thái gói đăng ký)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt (UI) |
| :---: | :--- | :--- |
| `0` | `PendingPayment` | Chờ thanh toán |
| `1` | `Active` | Đang hiệu lực |
| `2` | `Expired` | Đã hết hạn |
| `3` | `Cancelled` | Đã hủy gói |

### 4.4. `MatchType` (Kiểu so khớp kiểm duyệt)
| Giá trị (Int) | Tên Enum | Ý nghĩa nghiệp vụ |
| :---: | :--- | :--- |
| `0` | `Exact` | So khớp chính xác từ/cụm từ |
| `1` | `Contains` | Chứa cụm từ khóa (tìm kiếm con) |
| `2` | `Regex` | Biểu thức chính quy (Regular Expression) |

### 4.5. `SeverityLevel` (Mức độ nghiêm trọng của vi phạm)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt | Gợi ý màu sắc |
| :---: | :--- | :--- | :--- |
| `0` | `Low` | Thấp | Xanh dương |
| `1` | `Medium` | Trung bình | Vàng |
| `2` | `High` | Cao | Cam |
| `3` | `BlockImmediately` | Ngăn chặn ngay lập tức | Đỏ đậm |

### 4.6. `ModerationAction` (Hành động xử lý kiểm duyệt)
| Giá trị (Int) | Tên Enum | Ý nghĩa |
| :---: | :--- | :--- |
| `0` | `Reject` | Từ chối nội dung |
| `1` | `FlagForReview` | Đánh dấu chờ Admin duyệt thủ công |
| `2` | `Mask` | Che mờ / Thay thế bằng ký tự sao (`***`) |

### 4.7. `ContentReportStatus` (Trạng thái xử lý báo cáo vi phạm)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt |
| :---: | :--- | :--- |
| `0` | `Pending` | Chờ xử lý |
| `1` | `Processing` | Đang xem xét |
| `2` | `Resolve` | Đã giải quyết vi phạm |
| `3` | `Dismissed` | Bác bỏ / Không vi phạm |

### 4.8. `ReportTargetType` (Loại đối tượng bị báo cáo)
| Giá trị (Int) | Tên Enum | Đối tượng |
| :---: | :--- | :--- |
| `0` | `Character` | Nhân vật do AI/Bé tạo |
| `1` | `Story` | Toàn bộ câu chuyện |
| `2` | `Content` | Nội dung/Trang truyện/Lời thoại |

### 4.9. `StoryRoleType` (Vai trò của nhân vật trong truyện)
| Giá trị (Int) | Tên Enum | Nhãn Tiếng Việt |
| :---: | :--- | :--- |
| `0` | `MainCharacter` | Nhân vật chính |
| `1` | `Companion` | Bạn đồng hành |
| `2` | `Supporting` | Nhân vật phụ |
| `3` | `Other` | Nhân vật khác |

---

## 5. CHI TIẾT TOÀN BỘ APIS THEO PHÂN HỆ ADMIN

---

### PHÂN HỆ 1: XÁC THỰC & TÀI KHOẢN ADMIN

#### 1. Đăng nhập Admin / Content Manager
- **Endpoint:** `POST /api/auth/login`
- **Quyền:** Public
- **Request Body:**
  ```json
  {
    "identifier": "admin",
    "password": "Admin@123"
  }
  ```
  *(Ghi chú: `identifier` có thể truyền Username hoặc Email).*
- **Response 200 OK:**
  ```json
  {
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "4a1bc9...",
      "username": "admin",
      "email": "admin@sketch.tale.com",
      "role": "Admin"
    },
    "message": "Đăng nhập thành công!"
  }
  ```

#### 2. Cấp lại Token (Refresh Token)
- **Endpoint:** `POST /api/auth/refresh-token`
- **Quyền:** `[Authorize]` (Token hết hạn vẫn được phép gửi đến endpoint này)
- **Request Header:** `Authorization: Bearer <token_cũ>`
- **Request Body (Tùy chọn):**
  ```json
  {
    "refreshToken": "4a1bc9..."
  }
  ```
- **Response 200 OK:** Trả về cặp `token` và `refreshToken` mới.

#### 3. Đăng xuất (Logout)
- **Endpoint:** `POST /api/auth/logout`
- **Quyền:** `[Authorize]`
- **Response 200 OK:**
  ```json
  { "message": "Đăng xuất thành công! Token đã bị vô hiệu hóa." }
  ```

#### 4. Xem thông tin cá nhân Profile
- **Endpoint:** `GET /api/auth/profile`
- **Quyền:** `[Authorize]`
- **Response 200 OK:**
  ```json
  {
    "data": {
      "id": "11111111-1111-1111-1111-111111111111",
      "username": "admin",
      "email": "admin@sketch.tale.com",
      "firstName": "Admin",
      "lastName": "User",
      "dob": null,
      "gender": null,
      "role": "Admin",
      "createdAt": "2026-10-24T14:00:00+07:00",
      "parentProfile": null,
      "childProfile": null
    },
    "message": "Lấy thông tin tài khoản thành công!"
  }
  ```

#### 5. Kiểm tra Role hiện tại từ Database
- **Endpoint:** `GET /api/auth/current-role`
- **Quyền:** `[Authorize]`
- **Response 200 OK:**
  ```json
  {
    "data": "Admin",
    "message": "Lấy quyền người dùng thành công!"
  }
  ```

#### 6. Đổi mật khẩu
- **Endpoint:** `POST /api/auth/change-password`
- **Quyền:** `[Authorize]`
- **Request Body:**
  ```json
  {
    "currentPassword": "Admin@123",
    "newPassword": "NewAdminPassword@456"
  }
  ```
- **Response 200 OK:** `{ "message": "Đổi mật khẩu thành công!" }`

---

### PHÂN HỆ 2: QUẢN LÝ GÓI DỊCH VỤ & BẢNG GIÁ
*Quản lý danh mục gói thuê bao (Free, Plus, Pro...), định mức credit, giới hạn số trẻ em.*

- **Base Route:** `/api/subscription-plans`
- **Đối tượng DTO đầy đủ (`SubscriptionPlanDto`):**
  ```typescript
  interface SubscriptionPlanDto extends BaseFieldDto {
    name: string;                // Tên gói hiển thị (VD: "Gói Trải Nghiệm Pro")
    code: string;                // Mã định danh duy nhất (VD: "ProPlan", "FreePlan", "PlusPlan")
    price: number;               // Giá cước (VND), VD: 199000
    childProfileLimit: number;   // Số lượng hồ sơ bé tối đa được tạo (VD: 3)
    monthlyCreditLimit: number;  // Định mức credit cấp mỗi tháng (VD: 2000)
    accessFullStories: boolean;  // Có được mở khóa toàn bộ kho truyện không
    canExportStory: boolean;     // Có quyền xuất truyện (PDF/Video) không
    durationDays?: number;       // Thời hạn gói (VD: 30 ngày, 365 ngày)
    freeTrialDays?: number;      // Số ngày cho phép dùng thử miễn phí
    isActive: boolean;           // Kích hoạt bán trên hệ thống
  }
  ```

| Method | Đường dẫn API | Mô tả & Tham số | Body Request |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subscription-plans` | Lấy danh sách toàn bộ các gói | Không |
| `GET` | `/api/subscription-plans/{id}` | Lấy chi tiết gói theo GUID | Không |
| `GET` | `/api/subscription-plans/code/{plan-code}` | Lấy gói theo mã `code` (VD: `FreePlan`) | Không |
| `POST` | `/api/subscription-plans` | Thêm gói dịch vụ mới | `CreateSubscriptionPlanDto` |
| `PATCH`| `/api/subscription-plans/{id}` | Cập nhật thông tin gói dịch vụ | `UpdateSubscriptionPlanDto` |
| `DELETE`| `/api/subscription-plans/{id}`| Vô hiệu hóa gói (Soft delete: `isActive = false`)| Không |

- **Body Mẫu khi Tạo (`POST /api/subscription-plans`):**
  ```json
  {
    "name": "Gói Gia Đình Plus",
    "code": "PlusPlan",
    "price": 99000,
    "childProfileLimit": 2,
    "monthlyCreditLimit": 1200,
    "accessFullStories": true,
    "canExportStory": false,
    "durationDays": 30,
    "freeTrialDays": 7,
    "isActive": true
  }
  ```

---

### PHÂN HỆ 3: CẤU HÌNH CHI PHÍ CREDIT TÍNH NĂNG AI
*Cấu hình số điểm Credit mà tài khoản bị trừ khi dùng các tính năng AI (nhận diện tranh, tạo nhân vật hoạt hình, xuất truyện).*

- **Base Route:** `/api/credit-costs`
- **Đối tượng DTO (`CreditCostDto`):**
  ```typescript
  interface CreditCostDto extends BaseFieldDto {
    featureKey: string;     // Khóa tính năng (VD: "CharacterGeneration", "ImageClassification")
    cost: number;           // Số điểm credit trừ mỗi lượt thực hiện
    featureNameVi: string;  // Tên hiển thị Tiếng Việt
    featureNameEn: string;  // Tên hiển thị Tiếng Anh
    isActive: boolean;      // Đang áp dụng tính phí
  }
  ```

| Method | Đường dẫn API | Mô tả | Body Request |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/credit-costs` | Lấy toàn bộ cấu hình chi phí | Không |
| `GET` | `/api/credit-costs/{id}` | Lấy chi tiết chi phí theo ID | Không |
| `POST` | `/api/credit-costs` | Thêm cấu hình chi phí tính năng mới | `CreateCreditCostDto` |
| `PATCH`| `/api/credit-costs/{id}` | Cập nhật chi phí | `UpdateCreditCostDto` |
| `DELETE`| `/api/credit-costs/{id}`| Tắt áp dụng chi phí (`isActive = false`) | Không |

- **Body Mẫu Cập nhật (`PATCH /api/credit-costs/{id}`):**
  ```json
  {
    "featureKey": "CharacterGeneration",
    "cost": 15,
    "featureNameVi": "Tạo nhân vật AI từ tranh vẽ",
    "featureNameEn": "AI Character Generation",
    "isActive": true
  }
  ```

---

### PHÂN HỆ 4: QUẢN LÝ ĐĂNG KÝ THUÊ BAO
*Theo dõi và điều chỉnh lịch sử đăng ký gói cước của các phụ huynh.*

- **Base Route:** `/api/subscriptions`

| Method | Đường dẫn API | Mô tả | Body Request |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subscriptions` | Lấy toàn bộ danh sách thuê bao | Không |
| `GET` | `/api/subscriptions/{id}` | Xem chi tiết hợp đồng thuê bao | Không |
| `GET` | `/api/subscriptions/parent-profile/{id}`| Danh sách gói thuê bao của 1 phụ huynh | Không |
| `GET` | `/api/subscriptions/subscription-plan/{id}`| Danh sách thuê bao thuộc 1 gói cụ thể | Không |
| `POST` | `/api/subscriptions` | Tạo thủ công một thuê bao cho phụ huynh | `CreateSubscriptionDto` |
| `PATCH`| `/api/subscriptions?id={id}` *(Lưu ý: truyền `id` qua Query)* | Cập nhật ngày hiệu lực/trạng thái | `UpdateSubscriptionDto` |
| `DELETE`| `/api/subscriptions/{id}`| Hủy bản ghi thuê bao | Không |

- **Body Mẫu Tạo mới (`POST /api/subscriptions`):**
  ```json
  {
    "parentProfileId": "22222222-2222-2222-2222-222222222222",
    "subscriptionPlanId": "66666666-6666-6666-6666-666666666666"
  }
  ```
- **Body Mẫu Sửa (`PATCH /api/subscriptions?id=...`):**
  ```json
  {
    "subscriptionPlanId": "66666666-6666-6666-6666-666666666666",
    "status": 1, // 1: Active
    "startDate": "2026-10-24T00:00:00+07:00",
    "endDate": "2026-11-24T23:59:59+07:00"
  }
  ```

---

### PHÂN HỆ 5: QUẢN LÝ HỒ SƠ PHỤ HUYNH & TRẺ EM

#### 1. Hồ Sơ Phụ Huynh (`/api/parent-profiles`)
- `GET /api/parent-profiles`: Lấy danh sách tất cả phụ huynh, kèm số credit còn lại, số slot con còn lại, và danh sách hồ sơ con.
- `GET /api/parent-profiles/{id}`: Xem chi tiết một hồ sơ phụ huynh.
- `PUT /api/parent-profiles/{id}`: **Admin cập nhật / gán gói cước trực tiếp cho phụ huynh**.
  - Body:
    ```json
    {
      "subscriptionPlanId": "66666666-6666-6666-6666-666666666666"
    }
    ```
- `PATCH /api/parent-profiles/{id}/mark-trial-plan-used`: Đánh dấu tài khoản đã dùng quyền kích hoạt gói trải nghiệm miễn phí (Trial).

#### 2. Hồ Sơ Trẻ Em (`/api/child-profiles`)
- `GET /api/child-profiles`: Lấy toàn bộ danh sách hồ sơ các bé trên hệ thống.
- `GET /api/child-profiles/{id}`: Xem chi tiết 1 bé.
- `GET /api/child-profiles/{id}/nickname`: Lấy tên hiển thị của bé.
- `GET /api/child-profiles/{id}/target-age-group`: Lấy nhóm tuổi của bé.
- `GET /api/child-profiles/{id}/daily-time-limit`: Lấy giới hạn thời gian sử dụng app trong ngày (phút).
- `GET /api/child-profiles/{id}/daily-character-limit`: Lấy số lượng tranh vẽ được sinh nhân vật trong ngày.
- `PUT /api/child-profiles/{id}`: **Cập nhật thông tin hoặc hạn mức của bé** *(Quyền: Admin hoặc Phụ huynh sở hữu)*.
  - Body mẫu:
    ```json
    {
      "nickName": "Bé Bo",
      "targetAgeGroup": "Age8to10",
      "readingLevel": "Intermediate",
      "dailyTimeLimit": 60,
      "remainingTimeLimit": 45,
      "dailyCharacterLimit": 5,
      "remainingCharacterLimit": 3
    }
    ```

---

### PHÂN HỆ 6: AN TOÀN NỘI DUNG & KIỂM DUYỆT (SAFETY & MODERATION)

#### 1. Từ Khóa Bị Hạn Chế / Cấm (`/api/restricted-keywords`)
*Bộ lọc danh sách đen từ khóa nhạy cảm, bạo lực không phù hợp với trẻ em.*

| Method | Đường dẫn API | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/restricted-keywords` | Lấy danh sách từ khóa cấm |
| `GET` | `/api/restricted-keywords/{id}` | Lấy chi tiết từ khóa |
| `POST` | `/api/restricted-keywords` | Thêm từ khóa mới |
| `PATCH`| `/api/restricted-keywords/{id}` | Cập nhật từ khóa, mức độ nghiêm trọng, hành động |
| `DELETE`| `/api/restricted-keywords/{id}`| Xóa từ khóa |

- **Body Mẫu (`POST /api/restricted-keywords`):**
  ```json
  {
    "keyword": "từ_nhạy_cảm_mẫu",
    "description": "Ngăn chặn nội dung bạo lực",
    "matchType": 1,        // 0: Exact, 1: Contains, 2: Regex
    "severityLevel": 3,    // 0: Low, 1: Medium, 2: High, 3: BlockImmediately
    "action": 0,           // 0: Reject, 1: FlagForReview, 2: Mask
    "status": 2            // 2: Active
  }
  ```

#### 2. Chủ Đề Bị Cấm (`/api/prohibited-themes`)
*Quản lý danh mục các chủ đề truyện/nội dung không lành mạnh cần ngăn chặn qua AI Prompts.*
- Các endpoint: `GET`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}` trên route `/api/prohibited-themes`.
- Body tương tự như từ khóa bị hạn chế (`name`, `description`, `matchType`, `severityLevel`, `action`, `status`).

#### 3. Báo Cáo Vi Phạm Nội Dung Từ Người Dùng (`/api/content-reports`)
*Tiếp nhận khiếu nại, phản ánh nội dung độc hại từ phụ huynh đối với truyện hoặc nhân vật.*

| Method | Đường dẫn API | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/content-reports` | Lấy toàn bộ danh sách báo cáo vi phạm |
| `GET` | `/api/content-reports/{id}` | Xem chi tiết 1 báo cáo |
| `GET` | `/api/content-reports/users/{userId}` | Lọc báo cáo do 1 phụ huynh cụ thể gửi |
| `PATCH`| `/api/content-reports/{id}` | **Admin cập nhật trạng thái xử lý khiếu nại** |
| `DELETE`| `/api/content-reports/{id}`| Xóa bản ghi báo cáo |

- **Body Cập nhật xử lý báo cáo (`PATCH /api/content-reports/{id}`):**
  ```json
  {
    "targetType": 0,      // 0: Character, 1: Story, 2: Content
    "targetId": "77777777-7777-7777-7777-777777777777",
    "reason": "Hình ảnh nhân vật có chi tiết gây sợ hãi cho trẻ nhỏ",
    "status": 2           // 0: Pending, 1: Processing, 2: Resolve, 3: Dismissed
  }
  ```

---

### PHÂN HỆ 7: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
*Hệ thống Audit.NET tự động ghi lại toàn bộ thao tác Thêm / Sửa / Xóa dữ liệu của tất cả người dùng trong hệ thống kèm diff chi tiết JSON.*

- **Base Route:** `/api/audit-logs`
- **Đối tượng DTO (`AuditLogDto`):**
  ```typescript
  interface AuditLogDto extends BaseFieldDto {
    auditAction: string;     // "Insert" | "Update" | "Delete"
    entityName: string;      // Tên bảng/thực thể (VD: "SubscriptionPlan", "StoryTemplate")
    primaryKey: string;      // ID bản ghi bị thay đổi
    oldValues?: string;      // Chuỗi JSON chứa các trường và giá trị CŨ
    newValues?: string;      // Chuỗi JSON chứa các trường và giá trị MỚI
    changedColumns?: string; // Danh sách các cột bị sửa (VD: "Price, MonthlyCreditLimit")
  }
  ```

| Method | Đường dẫn API | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | Lấy toàn bộ nhật ký kiểm toán hệ thống |
| `GET` | `/api/audit-logs/{id}` | Chi tiết 1 lượt audit |
| `GET` | `/api/audit-logs/user-id/{id}` | Lọc các thao tác do 1 tài khoản Admin/User thực hiện |
| `GET` | `/api/audit-logs/entity-name/{name}` | Lọc biến động trên 1 bảng (VD: `/entity-name/SubscriptionPlan`) |
| `GET` | `/api/audit-logs/entity-id/{id}` | Xem toàn bộ lịch sử thay đổi của 1 đối tượng cụ thể |

> **Tip cho FE:** Trường `oldValues` và `newValues` trả về chuỗi JSON stringified, FE có thể gọi `JSON.parse(item.oldValues)` và hiển thị bảng so sánh "Trước - Sau" cực kỳ trực quan cho Admin.

---

### PHÂN HỆ 8: DANH MỤC PHÂN LOẠI NHÂN VẬT & CHỦ ĐỀ
*Master data phục vụ gắn tag và phân loại khi tạo truyện.*

#### 1. Loại Nhân Vật (`/api/char-types`)
- Ví dụ: Người, Động vật, Thực vật, Đồ vật, Siêu nhiên...
- Endpoints: `GET /api/char-types`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`.
- Body tạo mới (`POST /api/char-types`):
  ```json
  {
    "name": "Động vật",
    "description": "Các nhân vật muông thú, chim chóc",
    "status": 2 // 2: Active
  }
  ```

#### 2. Chủ Đề Giáo Dục (`/api/education-themes`)
- Ví dụ: Lòng biết ơn, Bảo vệ môi trường, Tình bạn, Khoa học vũ trụ...
- Endpoints: `GET /api/education-themes`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`.
- Body tạo mới (`POST /api/education-themes`):
  ```json
  {
    "name": "Bảo Vệ Môi Trường",
    "description": "Dạy bé thói quen tiết kiệm nước và phân loại rác",
    "status": 2
  }
  ```

---

### PHÂN HỆ 9: QUẢN LÝ KHO TRUYỆN MẪU - CMS
*Dành cho Content Manager và Admin để thiết kế truyện tranh tương tác, gắn slot nhân vật, câu đố và từ vựng.*

#### 1. Quản Lý Bản Mẫu Truyện (`/api/story-template`)
- `GET /api/story-template/all-stories`: Lấy toàn bộ truyện (gồm nháp, ẩn, xuất bản). *Yêu cầu quyền ContentManager/Admin*.
- `GET /api/story-template/stories`: Lấy các truyện đang `Active` (xuất bản).
- `GET /api/story-template/stories/{id}`: Xem chi tiết truyện.
- `GET /api/story-template/stories/education-theme/{id}`: Lọc truyện theo chủ đề giáo dục.
- `POST /api/story-template`: **Tạo truyện mới kèm Upload ảnh bìa**.
  - `Content-Type`: `multipart/form-data`
  - Form Fields:
    - `EducationThemeId` (Guid)
    - `Title` (string)
    - `Description` (string)
    - `AgeGroup` (int: 0: 6-7 tuổi, 1: 8-10 tuổi, 2: 11-12 tuổi)
    - `file` (File ảnh bìa cover - JPG, PNG, WEBP tối đa 10MB)
- `PUT /api/story-template/{id}`: Cập nhật thông tin truyện và ảnh bìa (multipart/form-data).
- `DELETE /api/story-template/{id}`: Xóa truyện.
- `POST /api/story-template/{id}/publish`: **Xuất bản truyện** sang trạng thái `Active`.

#### 2. Quản Lý Trang Truyện (`/api/storypage-template`)
- `GET /api/storypage-template/all-pages/{storyId}`: Lấy tất cả trang của truyện (gồm nháp).
- `GET /api/storypage-template/pages/{storyId}`: Lấy danh sách trang truyện đã active.
- `POST /api/storypage-template/{storyId}/page`: **Tạo trang truyện mới kèm Tranh nền & File đọc Audio**.
  - `Content-Type`: `multipart/form-data`
  - Form Fields:
    - `RawText` (string: Lời thoại / nội dung trang truyện)
    - `file` (hoặc `imageFile`): File ảnh nền trang truyện
    - `audioFile` (hoặc `audio`): File giọng đọc thuyết minh (MP3, WAV,...)
- `PUT /api/storypage-template/{id}`: Cập nhật nội dung trang, ảnh nền và audio mới.
- `DELETE /api/storypage-template/story-pages/{id}`: Xóa trang truyện.

#### 3. Quản Lý Vai Diễn Trong Truyện (`/api/story-template/{storyId}/role`)
- `GET /api/story-template/{storyId}/all-roles`: Danh sách toàn bộ vai diễn trong truyện.
- `POST /api/story-template/{storyId}/role`: **Tạo vai diễn mới**.
  - `Content-Type`: `multipart/form-data`
  - Form Fields:
    - `StoryRoleType` (int: 0: MainCharacter, 1: Companion, 2: Supporting, 3: Other)
    - `RoleName` (string: VD: "Chú Bé Tí Hon", "Mèo Máy")
    - `Description` (string)
    - `AllowCustomCharacter` (boolean: Cho phép bé vẽ tranh thế chỗ không)
    - `RequiresParentApproval` (boolean: Vai nhạy cảm cần phụ huynh duyệt không)
    - `file` (File ảnh nhân vật mẫu mặc định)
- `PUT /api/story-role/{id}`: Cập nhật vai diễn.
- `DELETE /api/story-role/{id}`: Xóa vai diễn.

#### 4. Quản Lý Vị Trí Ghép Nhân Vật Trên Trang (`/api/story-pages/{pageId}/slot`)
*Định vị tọa độ Canvas để hiển thị nhân vật do bé vẽ lên tranh nền trang truyện.*
- `GET /api/story-pages/{pageId}/slots`: Lấy danh sách các slot vị trí trên trang.
- `POST /api/story-pages/{pageId}/slot`: Thêm vị trí mới.
  - Body JSON:
    ```json
    {
      "storyRoleTemplateId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "posX": 150.5,
      "posY": 320.0,
      "scale": 1.25,
      "flipHorizontal": false
    }
    ```
- `PUT /api/story-slots/{id}`: Cập nhật tọa độ, tỷ lệ co giãn (`scale`), đảo gương (`flipHorizontal`).
- `DELETE /api/story-slots/{id}`: Xóa slot.

#### 5. Quản Lý Câu Đố Tương Tác Của Truyện (`/api/story-template/{storyId}/quizz`)
- `GET /api/story-template/{storyId}/all-quizzes`: Lấy toàn bộ câu hỏi trắc nghiệm của truyện.
- `POST /api/story-template/{storyId}/quizz`: **Tạo câu đố mới**.
  - `Content-Type`: `multipart/form-data`
  - Form Fields:
    - `QuestionText` (string: Nội dung câu hỏi)
    - `Options[0]`, `Options[1]`, `Options[2]`, `Options[3]` (Các đáp án trắc nghiệm)
    - `CorrectOptionIndex` (int: Chỉ số mảng đáp án đúng, bắt đầu từ `0`)
    - `file` (Ảnh minh họa cho câu đố)
    - `audioFile` (File âm thanh câu hỏi)
- `PUT /api/story-quiz/{id}/with-image`: Cập nhật câu đố, đáp án, đổi ảnh/âm thanh.
- `DELETE /api/story-quiz/{id}`: Xóa câu đố.

#### 6. Quản Lý Từ Vựng Học Tập Theo Trang (`/api/story-pages/{pageId}/vocabularies`)
*Giúp bé bấm vào từ nổi bật trên trang để nghe phát âm và hiểu nghĩa.*
- `GET /api/story-pages/{pageId}/vocabularies`: Danh sách từ vựng của trang.
- `POST /api/story-pages/{pageId}/vocabularies`: Thêm từ mới.
  - Body JSON:
    ```json
    {
      "word": "Cầu vồng",
      "meaning": "Hiện tượng tán sắc ánh sáng mặt trời qua các hạt mưa tạo 7 sắc màu rực rỡ.",
      "audioUrl": "https://res.cloudinary.com/.../rainbow.mp3"
    }
    ```
- `PUT /api/story-vocabulary/{id}`: Cập nhật từ vựng.
- `DELETE /api/story-vocabulary/{id}`: Xóa từ vựng.

---

### PHÂN HỆ 10: TẢI LÊN ĐA PHƯƠNG TIỆN MEDIA CLOUDINARY
*Dịch vụ upload ảnh trực tiếp lên Cloudinary, trả về link CDN bảo mật.*

#### 1. Upload Tranh Nền Story (`POST /api/upload/background-image`)
- **Quyền:** `[Authorize(Roles = "content manager")]`
- **Content-Type:** `multipart/form-data`
- **Request Form:** `file` (Hỗ trợ `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, dung lượng tối đa **10MB**)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "imageUrl": "https://res.cloudinary.com/cloud_name/image/upload/v12345/SketchTale/background-image/img.webp"
  }
  ```

#### 2. Upload Avatar (`POST /api/upload/avatar`)
- **Quyền:** `[Authorize]`
- **Content-Type:** `multipart/form-data`
- **Request Form:** `file`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "imageUrl": "https://res.cloudinary.com/cloud_name/image/upload/v12345/SketchTale/avatars/avatar.webp"
  }
  ```

---

## 6. MÃ NGUỒN MẪU CẤU HÌNH CLIENT

Dưới đây là đoạn mã nguồn mẫu hoàn chỉnh bằng **TypeScript** và **Axios** để FE tích hợp vào dự án Admin Portal, tự động gắn Token và tự động xử lý khi Token hết hạn (Auto Refresh Token Rotation):

```typescript
// src/api/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// 1. Request Interceptor: Tự động đính kèm Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến cờ tránh gọi refresh token nhiều lần đồng thời khi nhiều API bị 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Response Interceptor: Bắt lỗi 401 & Tự động gọi Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Bỏ qua nếu lỗi không phải 401 hoặc request này đã từng thử refresh rồi
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu chính request gọi refresh-token bị lỗi -> Đăng xuất ngay
    if (originalRequest.url?.includes('/api/auth/refresh-token')) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');

    try {
      // Gọi API refresh token
      const res = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
        refreshToken: refreshToken,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      const { token: newAccessToken, refreshToken: newRefreshToken } = res.data.data;

      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      processQueue(null, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
```

### Hướng Dẫn Sử Dụng API Upload File (Multipart Form)
```typescript
// src/api/uploadService.ts
import { apiClient } from './apiClient';

export const uploadStoryCover = async (storyData: any, imageFile?: File) => {
  const formData = new FormData();
  formData.append('EducationThemeId', storyData.educationThemeId);
  formData.append('Title', storyData.title);
  formData.append('Description', storyData.description || '');
  formData.append('AgeGroup', String(storyData.ageGroup)); // 0, 1, 2

  if (imageFile) {
    formData.append('file', imageFile);
  }

  const response = await apiClient.post('/api/story-template', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
```

---

## 7. CHECKLIST KIỂM THỬ TRƯỚC KHI BÀN GIAO (FE INTEGRATION CHECKLIST)
- [ ] Đăng nhập thành công với tài khoản `admin` / `Admin@123` và lưu token.
- [ ] Chuyển hướng đúng vai trò khi kiểm tra `role` từ `/api/auth/current-role`.
- [ ] Hiển thị danh sách Gói dịch vụ (`SubscriptionPlans`) và test Thêm / Sửa / Xóa.
- [ ] Hiển thị Bảng điều khiển kiểm toán hệ thống (`AuditLogs`), parse trường `oldValues` và `newValues` thành công.
- [ ] Upload thử 1 file ảnh tranh nền qua `/api/upload/background-image` với tài khoản `manager` / `Manager@123`.
- [ ] Test cơ chế tự động gia hạn token khi xóa `access_token` hoặc chờ sau 60 phút.
