> Cập nhật: hướng giao diện “Sắp ra mắt” đã được thay bằng luồng demo tương tác theo yêu cầu mới. Xem [Parent experience v2](PARENT_EXPERIENCE_V2_2026-10-23.md) để biết thiết kế và trạng thái mới nhất.

# Parent: kế hoạch API và UI/UX — 23/10/2026

## Nhu cầu phụ huynh và hướng thiết kế

- Chọn bé, thêm tài khoản và mở hồ sơ ngay từ tổng quan.
- Sửa tên, thời gian sử dụng và số nhân vật tại một nơi; phản hồi đang lưu, thành công, lỗi và hoàn tác rõ ràng.
- Tìm truyện, xem thông tin và chọn truyện để đọc cùng con.
- Theo dõi tiến độ, yêu cầu cần duyệt và tác phẩm theo từng bé; không biến dữ liệu chưa có thành số 0.
- Xem quyền lợi gói và trạng thái thanh toán đáng tin cậy.
- Mobile dễ đọc, không tràn ngang; nút đủ lớn, focus bàn phím và đường quay về rõ ràng.

## Đối chiếu Swagger

Nguồn: https://sketch-tale-be.onrender.com/swagger/v1/swagger.json, tải ngày 23/10/2026; snapshot `artifacts/swagger-parent-2026-10-23.json`, **118 operations**.

Response ChildProfile chưa có schema, chỉ ghi HTTP 200. Adapter nhận mảng hoặc `{items: [...]}` sau envelope `data` của HTTP client; yêu cầu `id`/`childProfileId` và `nickName`. Sai định dạng hiển thị lỗi, không giả lập danh sách rỗng. Chưa có phiên Parent thật để xác minh contract runtime và phân quyền.

## API đã có và trạng thái tích hợp

| Nhu cầu | API | Trạng thái |
|---|---|---|
| Tạo tài khoản bé | POST /api/auth/register/child | Luồng hiện có; thêm làm mới cache hồ sơ sau tạo |
| Danh sách bé | GET /api/child-profiles | Đã nối tổng quan/danh sách; loading, retry, empty |
| Chi tiết bé | GET /api/child-profiles/{id} | Đã nối theo ID hồ sơ |
| Sửa tên/giới hạn | PUT /api/child-profiles/{id} | Đã nối nickName, dailyTimeLimit, dailyCharacterLimit theo DTO; không gửi birthDate/avatar |
| Thuộc tính riêng | GET /api/child-profiles/{id}/nickname, /target-age-group, /daily-time-limit, /daily-character-limit | Không gọi lặp khi detail đã có dữ liệu; cần xác nhận response runtime |
| Thư viện truyện/chủ đề | GET /api/story-template/stories, /stories/{id}; GET /api/education-themes | Giữ adapter thư viện hiện có |
| Danh mục gói | GET /api/subscription-plans | Giữ luồng đọc và so sánh gói hiện có |
| Hồ sơ Parent | GET /api/parent-profiles, /{id}; PUT /{id} | Cần chốt mapping User ID → ParentProfile ID và scope; PUT chỉ có subscriptionPlanId, không dùng sửa tên/avatar |
| Subscription | GET /api/subscriptions/parent-profile/{id}; CRUD /api/subscriptions | API đã có, chưa nối gói hiện tại do thiếu mapping tin cậy; không dùng CRUD làm checkout |
| Avatar/mật khẩu | POST /api/upload/avatar; POST /api/auth/change-password | Ngoài màn hồ sơ bé; không giả định upload cập nhật ChildProfile |
| Báo cáo vi phạm | POST /api/content-reports | Đã có API, cần bổ sung luồng gửi từ truyện sau khi chốt ngữ cảnh đối tượng; không phải báo cáo học tập |

Profile mặc định real khi `VITE_API_MODE=real`, có thể ghi đè `VITE_PARENT_PROFILE_API_MODE`. Cache tách theo User ID. Backend phải giới hạn danh sách/detail/update theo Parent đang đăng nhập; cần test hai tài khoản Parent trước phát hành. Không đổi mock service của nghiệp vụ còn thiếu API.

## API còn thiếu và giao diện đã chuẩn bị

| Khu vực | Contract cần bổ sung |
|---|---|
| Tổng quan/tiến độ | Tổng hợp theo bé/gia đình, khoảng 7/30 ngày, nguồn hoạt động đọc/quiz/từ vựng |
| Phê duyệt | Danh sách/chi tiết, quyết định có revision, cấp/thu hồi quyền vai |
| Thư viện riêng | Truyện/nhân vật của bé, yêu thích/ẩn/xóa, gửi gợi ý truyện |
| Xuất truyện | Tạo job PDF/video, trạng thái, retry, URL tải có hạn và quota |
| Báo cáo gia đình | Báo cáo, lịch gửi, lịch sử/tải báo cáo |
| Thanh toán | Checkout/order, trạng thái xác thực, webhook; entitlement và currency |
| Liên kết/chủ đề | Liên kết/hủy liên kết tài khoản bé có sẵn; cấu hình và thực thi chủ đề được phép |

Chi tiết dữ liệu/endpoint đề xuất: `docs/PARENT_MISSING_APIS_BACKEND.md`. Không coi URL đề xuất là API đã triển khai. Swagger mới có 7 operations UserStoryCharacterMapping; chúng chưa cung cấp đầy đủ workflow duyệt Parent có ownership/revision nên không tự ánh xạ thành chức năng phê duyệt.

Các khu vực chưa có API đã có màn riêng theo ngữ cảnh, nhóm nội dung dự kiến, nhãn “Sắp ra mắt” và đường về hồ sơ/thư viện. Đây là giao diện chuẩn bị, chưa phải workflow hoàn chỉnh. Màn workflow mock cũ vẫn được giữ trong source để nối sau khi contract sẵn sàng.

## Kế hoạch tiếp theo

1. Chốt response ChildProfile, scope, ý nghĩa null/0 và đơn vị giới hạn; smoke test phiên Parent thật, kiểm tra thực thi ở Child.
2. Chốt mapping ParentProfile → subscription, currency và entitlement; nối gói đang dùng.
3. Bổ sung progress/dashboard và phê duyệt có revision.
4. Nối thư viện riêng/gợi ý; tiếp theo xuất truyện, báo cáo và checkout.

## Kiểm chứng

Build/lint và Playwright với HTTP fixtures: payload PUT đúng DTO, response 204, lỗi lưu giữ dữ liệu nhập, danh sách rỗng, bố cục 390/768/1366px. Fixture không chứng minh phân quyền hay việc thực thi giới hạn ở backend.

Kết quả kiểm chứng cuối: `npm run build` thành công; lint trên các file Parent thay đổi không có lỗi/cảnh báo; `git diff --check` không có lỗi whitespace; **7/7 Playwright tests pass**. Đã xem ảnh 390px và 1366px; ảnh lưu tại `artifacts/parent-profile-live-{390,768,1366}.png`. Build còn cảnh báo bundle lớn của ứng dụng chung, chưa thực hiện chia bundle trong phạm vi này.
