# Kế hoạch thiết kế lại trang Gói sử dụng

> Ngày: 04/10/2026. Trạng thái: **UI đã triển khai, billing chưa tích hợp**. Phạm vi: `/parent/plan` và shell `/parent/checkout?plan=...` cho luồng chọn gói → trang thanh toán → kết quả. Không thay đổi giá hoặc tự bổ sung chính sách thương mại.

## 1. Mục tiêu và hiện trạng

Phụ huynh cần trả lời ngay bốn câu hỏi: đang dùng gói gì, còn hiệu lực đến khi nào, được dùng những gì và đăng ký gói trả phí ở đâu.

Trang hiện tại có tên gói, số hồ sơ đã dùng và ngày đặt lại hạn mức; chưa có thời hạn thuê bao, danh sách gói để chọn hoặc luồng thanh toán. Khối navy lớn nhưng ít thông tin; quyền lợi mô tả chung, chưa giúp so sánh Free/Pro/Family.

Các điểm cần xử lý khi triển khai:

- `resetAt` là ngày đặt lại hạn mức, **không được dùng làm ngày hết hạn gói**.
- Entitlement hiện chưa có ngày bắt đầu/kết thúc, trạng thái thuê bao và thông tin gia hạn.
- Catalog public và fixture prototype hiện thống nhất Family tối đa 5 hồ sơ; contract production vẫn phải là nguồn quyết định, không thay thông tin tài khoản bằng phép suy đoán từ tên gói.
- Public hiện có `checkoutEnabled: false`; đây là hiện trạng prototype. Luồng đăng ký/thanh toán trong tài liệu này là thiết kế mục tiêu theo yêu cầu mới.

## 2. Danh sách gói và nội dung phải hiển thị

Nguồn: [Public Website.md, mục 8.3](<Public Website.md>) và [plans.js](../src/features/public/data/plans.js).

| Nội dung | Free | Pro | Family |
| --- | --- | --- | --- |
| Giá | Miễn phí | 35.000đ/tháng | 89.000đ/tháng |
| Hồ sơ trẻ em | 1 | Tối đa 3 | Tối đa 5 |
| Tạo nhân vật AI | 5 lượt/tháng | 30 lượt/tháng | 100 lượt/tháng |
| Tạo lại nhân vật | Tối đa 1 lần mỗi tranh | Tối đa 1 lần mỗi tranh | Tối đa 1 lần mỗi tranh |
| Thư viện | 5 truyện miễn phí cơ bản | Toàn bộ mẫu truyện và chủ đề | Thư viện cao cấp, cập nhật mới hằng tuần |
| Xuất video | Không hỗ trợ | 5 lượt/tháng | Không giới hạn |
| Kho nhân vật và truyện yêu thích | Chưa công bố hạn mức riêng | Lưu trữ không giới hạn | Kế thừa Pro |
| Báo cáo học tập qua email hằng tháng | Không có quyền lợi này trong catalog | Không có quyền lợi này trong catalog | Có |

Quyền lợi chung: đọc truyện tương tác, tạo nhân vật từ tranh và Parent Portal để quản lý thời gian/duyệt nhân vật. Tránh lặp lại toàn bộ quyền lợi chung trên cả ba thẻ.

Chỉ thiết kế chu kỳ tháng. Không thêm giá năm, giảm giá, dùng thử, nhãn “phổ biến nhất”, thanh toán trọn đời hoặc quyền lợi chưa có nguồn. Việc chia sẻ quota giữa các bé cần chốt riêng trước tích hợp.

## 3. Cấu trúc trang đề xuất

### A. Đầu trang

- Tiêu đề: **Gói sử dụng**.
- Mô tả: “Xem gói hiện tại, hạn mức và chọn gói phù hợp với gia đình.”
- Header gọn; không dành một banner lớn chỉ để hiển thị tiêu đề.

### B. Gói đang sử dụng — ưu tiên đầu tiên

Một khối ngang lớn, chia hai vùng: nhận diện gói/quyền lợi chính bên trái, thời hạn/trạng thái bên phải. Mobile xếp dọc.

Thông tin bắt buộc:

| Trường | Cách trình bày |
| --- | --- |
| Tên gói | Free / Pro / Family, chỉ hiển thị tên một lần |
| Trạng thái | Miễn phí / Đang hoạt động / Sắp hết hạn / Đã hết hạn theo dữ liệu và chính sách |
| Giá và chu kỳ | Miễn phí hoặc giá thuê bao thực tế theo kỳ; không dùng giá catalog thay cho hợp đồng cũ |
| Ngày bắt đầu kỳ hiện tại | Hiển thị nếu có dữ liệu; ghi đúng “Kỳ sử dụng” nếu không phải ngày đăng ký đầu tiên |
| Hiệu lực đến | Ngày, giờ hết hạn gói trả phí; số ngày còn lại là thông tin bổ trợ |
| Gia hạn | Chỉ hiện tự gia hạn/ngày thu tiền tiếp theo khi backend và chính sách hỗ trợ |
| Quyền lợi chính | 2–3 quyền lợi đúng gói để người dùng nhận diện nhanh |

Quy tắc thời hạn:

- Free: “Gói miễn phí · Không áp dụng ngày hết hạn thuê bao”; không hiển thị ngày giả hoặc “còn 0 ngày”.
- Pro/Family: “Hiệu lực đến: {ngày, giờ}” và “Còn {n} ngày” khi có dữ liệu. Gần hết trong ngày dùng “Hết hạn hôm nay lúc {giờ}”, tránh làm tròn gây hiểu lầm.
- Nếu đang tự gia hạn, phân biệt “Kết thúc kỳ hiện tại” và “Ngày thanh toán tiếp theo”; không khẳng định quyền truy cập sẽ dừng khi kỳ kết thúc.
- Thiếu ngày hết hạn: “Chưa có thông tin thời hạn”, có tải lại; không suy ra từ ngày đăng ký hoặc `resetAt`.
- Tất cả thời gian hiển thị nhất quán theo múi giờ do hệ thống cung cấp; chú thích dễ hiểu “Giờ Việt Nam” khi là `Asia/Ho_Chi_Minh`.
- Nhãn “Sắp hết hạn” đề xuất ở mốc còn 7 ngày; đây là ngưỡng UX cần chốt, không phải quy tắc hiện có.

### C. Hạn mức đang sử dụng

Một bề mặt chung gồm các hàng, thay cho ba thẻ rời rạc:

| Hạn mức | Thông tin hiển thị | Ghi chú |
| --- | --- | --- |
| Hồ sơ bé | Đang dùng / tối đa; số còn có thể liên kết | Không có reset hằng tháng; link “Quản lý hồ sơ bé” |
| Tạo nhân vật AI | Đã dùng / tổng lượt; còn lại | Kỳ áp dụng và ngày đặt lại riêng |
| Xuất video | Đã dùng / tổng lượt hoặc “Không giới hạn” | Free hiển thị “Không có trong gói” |

Thanh tiến độ chỉ bổ trợ cho số thật. Unlimited không có phần trăm; thiếu dữ liệu hiển thị “Chưa có dữ liệu”, không biến thành 0. Khi vượt hạn mức vẫn hiển thị số thực, không tự xóa hồ sơ/nội dung.

Trên mobile mỗi hàng thành nhóm nhãn–giá trị, không ép bảng nhiều cột. Không dùng ngày đặt lại lượt AI làm ngày reset chung cho mọi hạn mức.

### D. Khu vực đăng ký và so sánh gói

Đặt ngay sau tóm tắt gói và hạn mức, không giấu sau modal hoặc link sang landing. Với Free, có CTA “Khám phá gói trả phí” ngay trong khối gói hiện tại để cuộn đến khu vực này.

- Tiêu đề cho tài khoản Free: **Thêm không gian sáng tạo cho bé**.
- Mô tả: “Chọn Pro hoặc Family để có thêm lượt tạo nhân vật và quyền lợi phù hợp.”
- Desktop: ba thẻ Free / Pro / Family; Free nhẹ về thị giác, Pro nhấn viền vàng, Family nền sáng cùng hệ thống. Không ngụ ý Pro được nhiều người mua nhất.
- Mỗi thẻ gồm tên, đối tượng phù hợp, giá/tháng, 4–5 khác biệt chính và CTA ở cùng đường đáy.
- Gói đang dùng có nhãn **Đang sử dụng**, không có nút mua lại trong bảng so sánh.
- Free hiện tại: Pro có nút **Đăng ký Pro**, Family có nút **Đăng ký Family**. Cả hai dẫn tới trang thanh toán với gói đã chọn.
- Dưới thẻ có bảng “So sánh quyền lợi” đầy đủ, không cần accordion cho những khác biệt quyết định mua gói.
- Mobile: thẻ dọc, giá và nút đủ lớn; không dùng carousel khiến người dùng bỏ sót Family.

### E. Trợ giúp và giao dịch

- Cuối trang có các giải thích ngắn: thời hạn gói khác ngày đặt lại lượt như thế nào, khi thanh toán chưa xác nhận cần làm gì.
- Link chính sách thanh toán/hỗ trợ chỉ đến trang có nội dung thực tế.
- Lịch sử giao dịch là phần mở rộng sau luồng mua đầu tiên: mã đơn, gói, số tiền, ngày, trạng thái và link chi tiết. Không gọi là “hóa đơn” nếu chưa có chức năng xuất hóa đơn.

## 4. Hành động theo trạng thái tài khoản

| Trạng thái | Nội dung ưu tiên | Hành động |
| --- | --- | --- |
| Free | Miễn phí, quyền lợi hiện tại, khu vực đăng ký rõ ràng | Đăng ký Pro / Đăng ký Family → checkout |
| Pro còn hiệu lực | Ngày hết hạn, hạn mức, gói hiện tại | Family có thể so sánh; chỉ mở mua nâng gói khi đã chốt thời điểm hiệu lực và cách tính tiền |
| Family còn hiệu lực | Ngày hết hạn, hạn mức, báo cáo tháng | Xem quyền lợi; gia hạn nếu nghiệp vụ cho phép |
| Sắp hết hạn | Cảnh báo nhẹ kèm ngày cụ thể | Gia hạn khi hỗ trợ; tự gia hạn thì mô tả đúng trạng thái |
| Đã hết hạn | Gói đã hết hạn và quyền đang được áp dụng thực tế | Đăng ký lại theo lựa chọn backend cho phép |
| Đã thanh toán, đang kích hoạt | Thông báo đang xác nhận/cấp quyền | Kiểm tra trạng thái; tránh mời thanh toán lại |
| Không tải được thuê bao | Không khẳng định đang Free | Tải lại; có thể xem catalog nhưng chặn mua khi chưa xác định eligibility |

Không mặc định hết hạn sẽ tự về Free hoặc xóa dữ liệu; đây là chính sách cần chốt. Nếu backend xác nhận đã về Free, hiển thị Free là gói hiện tại và lịch sử gói trả phí đã hết hạn trong thông báo riêng.

## 5. Luồng đến trang thanh toán

Route **đề xuất**, chưa có trong ứng dụng:

```text
/parent/plan
  → Đăng ký Pro / Đăng ký Family
  → /parent/checkout?plan=pro|family
  → xác nhận gói, giá và phương thức thanh toán
  → nhà cung cấp thanh toán (nếu có chuyển hướng)
  → /parent/checkout/result?orderId=...
  → /parent/plan (tải lại trạng thái thuê bao)
```

### Bố cục checkout

Desktop chia hai cột: thông tin/xác nhận bên trái, tóm tắt đơn bên phải. Mobile một cột, tóm tắt số tiền trước nút xác nhận.

- Link “Quay lại gói sử dụng”; đổi gói trở về khu vực so sánh, không tự tạo giao dịch.
- Tên gói, chu kỳ tháng, quyền lợi chính.
- Tài khoản Parent nhận quyền sử dụng; không yêu cầu nhập lại thông tin các bé.
- Ngày dự kiến bắt đầu/kết thúc nếu backend xác định được; nếu kích hoạt sau thanh toán thì ghi rõ điều kiện này.
- Giá gói, thuế/phí/giảm giá nếu có thật và **tổng phải thanh toán** từ báo giá backend.
- Phương thức thanh toán do tích hợp hỗ trợ. Chưa chốt MoMo/VNPay/chuyển khoản/thẻ, không tự đưa logo vào thiết kế.
- Chính sách gia hạn/hủy/hoàn tiền đã được chốt, link điều khoản và xác nhận nếu cần.
- CTA: **Thanh toán {tổng tiền}**. Trong lúc tạo đơn/điều hướng hiển thị trạng thái xử lý và ngăn gửi lặp.
- Không thêm ô mã giảm giá, thông tin thẻ hoặc toggle tự gia hạn khi chưa hỗ trợ.

### Kết quả thanh toán

| Kết quả | Trình bày và bước tiếp theo |
| --- | --- |
| Thành công và đã cấp quyền | Tên gói, số tiền, mã đơn, thời hạn; “Về gói sử dụng” |
| Thanh toán thành công, quyền chưa cập nhật | “Đang kích hoạt gói”; theo dõi trạng thái có giới hạn và nút kiểm tra lại |
| Đang chờ/không rõ kết quả | “Đang xác nhận thanh toán”; kiểm tra đơn cũ trước khi cho thử giao dịch mới |
| Thất bại xác nhận | Lý do dễ hiểu; chọn lại phương thức/thử lại theo backend |
| Người dùng hủy | Gói hiện tại giữ theo dữ liệu thực; quay về chọn gói hoặc tiếp tục đơn nếu còn hợp lệ |
| Đơn hết hạn hoặc giá thay đổi | Lấy báo giá mới và yêu cầu người dùng xem lại tổng tiền |

Frontend không tự nâng gói từ query `success=true`, localStorage hay chỉ vì quay lại từ nhà cung cấp. Backend xác minh giao dịch và cập nhật entitlement; refresh/back/mở lại trang kết quả phải truy xuất được đơn đúng tài khoản. Request tạo thanh toán cần chống tạo đơn trùng.

## 6. Hướng thiết kế thị giác

- Giữ Nunito, Phosphor, nền kem, chữ navy và vàng SketchTale theo [DESIGN.md](DESIGN.md).
- Tóm tắt gói dùng nền vàng kem nhẹ, không tiếp tục dùng một mảng navy lớn với chữ phụ tương phản thấp.
- Tiêu đề trang 30–36px desktop, 26–28px mobile; body 14–16px; giá 32–40px. Ngày hết hạn cần rõ tương đương một thông tin chính, không thu nhỏ thành chú thích.
- Container khoảng 1120–1200px; khoảng cách giữa section 28–40px; card radius 16–20px, border nhẹ, hạn chế shadow.
- Màu vàng dùng cho CTA đăng ký; trạng thái còn hiệu lực xanh dịu, sắp hết hạn hổ phách. Luôn có nhãn chữ, không chỉ dựa vào màu.
- Mobile hỗ trợ từ 360px; CTA tối thiểu 44px chiều cao; keyboard/focus-visible rõ; chuyển động nhẹ và tôn trọng reduced motion.
- Không cần ảnh trang trí lớn. Giá, thời hạn và quyền lợi là điểm nhấn chính.

Wireframe desktop:

```text
Gói sử dụng
Mô tả ngắn

┌──────────────────────────────────────────────────────────┐
│ Gói hiện tại + trạng thái  │ Kỳ sử dụng / hiệu lực đến    │
│ Quyền lợi chính            │ Gia hạn / CTA phù hợp        │
└──────────────────────────────────────────────────────────┘
Hạn mức: hồ sơ bé • lượt AI • xuất video • kỳ đặt lại

Chọn gói phù hợp với gia đình
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Free           │ │ Pro            │ │ Family         │
│ Miễn phí       │ │ 35.000đ/tháng   │ │ 89.000đ/tháng   │
│ Quyền lợi      │ │ Quyền lợi      │ │ Quyền lợi      │
│ Đang sử dụng*  │ │ Đăng ký Pro*   │ │ Đăng ký Family*│
└────────────────┘ └────────────────┘ └────────────────┘
So sánh quyền lợi đầy đủ
Giải thích thời hạn / hỗ trợ / chính sách

* Ví dụ trạng thái tài khoản Free.
```

## 7. Dữ liệu cần bổ sung khi triển khai

Đây là đề xuất contract, không phải field/API đã tồn tại:

| Nhóm | Dữ liệu cần có |
| --- | --- |
| Catalog | Mã gói, tên, giá VND, chu kỳ, quyền lợi, hạn mức, khả năng đăng ký |
| Subscription | Mã thuê bao, gói, trạng thái, kỳ hiện tại bắt đầu/kết thúc, giá thuê bao thực, timezone |
| Renewal | Có hỗ trợ hay không; trạng thái tự gia hạn, ngày thu tiền tiếp theo nếu áp dụng |
| Usage | Mỗi tính năng có used/limit, kỳ áp dụng, resetAt, phạm vi Parent/Child |
| Eligibility | Những hành động được phép: đăng ký, nâng gói, gia hạn; lý do không được phép |
| Quote/order | Mã đơn/báo giá, gói, từng khoản tiền và tổng, thời hạn báo giá, tài khoản nhận quyền |
| Payment | Phương thức hỗ trợ, trạng thái giao dịch, URL chuyển hướng đã xác thực |
| Fulfillment | Trạng thái cấp quyền sau giao dịch; tham chiếu thuê bao được tạo |

Catalog và entitlement có vai trò khác nhau: catalog mô tả gói có thể mua; entitlement mô tả quyền đang có. Không lấy tên gói để tự tính mọi quyền trong frontend.

## 8. Những quyết định cần chốt trước khi code thanh toán

1. Gói gắn với Parent hay Child; hạn mức tháng chia sẻ thế nào giữa các hồ sơ đã liên kết?
2. Một tháng là tháng lịch hay kỳ tính từ ngày kích hoạt? Xử lý cuối tháng và timezone thế nào?
3. Ngày reset quota có trùng kỳ thuê bao không? Lượt chưa dùng có chuyển kỳ không?
4. Nhà cung cấp và phương thức thanh toán; giá đã gồm thuế/phí chưa?
5. Thanh toán một kỳ hay tự gia hạn? Quy tắc hủy và hoàn tiền?
6. Nâng Pro → Family hiệu lực ngay hay kỳ sau; có khấu trừ phần chưa dùng không? Gia hạn sớm cộng thời gian thế nào?
7. Khi hết hạn/hạ gói, xử lý hồ sơ vượt giới hạn, nội dung cao cấp và dữ liệu đã lưu ra sao?
8. Quyền báo cáo chuyên sâu của Pro cần xác nhận nếu đưa vào so sánh; không suy từ việc Free không có.

Các câu hỏi này không cản việc dựng bản thiết kế. Phạm vi mua đầu tiên ưu tiên **Free → Pro/Family**; luồng gia hạn/nâng/hạ gói chỉ triển khai khi chính sách tương ứng rõ ràng.

## 9. Thứ tự triển khai sau khi duyệt plan

### Đã triển khai trong đợt này

- `ParentPlanPage.jsx` đọc entitlement hiện có, hiển thị gói hiện tại, trạng thái, hạn mức hồ sơ, ngày reset và vùng so sánh Free/Pro/Family.
- `parent-plan.css` bổ sung bố cục responsive, trạng thái current/unknown, focus/hover và bảng so sánh theo mobile.
- `ParentCheckoutPage.jsx` và route `/parent/checkout` là shell UX; chưa tạo order, chưa thu tiền và nút thanh toán vẫn disabled.
- `tests/parent-plan.spec.js` kiểm tra tài khoản Free, CTA đúng query `plan`, checkout placeholder và không tràn ngang ở 390px.

### Việc còn lại sau khi duyệt plan

1. Chốt contract và chính sách tối thiểu cho mua gói từ Free; đồng bộ catalog với entitlement production.
2. Thiết kế desktop/mobile cho Free, Pro còn hạn, sắp hết hạn, hết hạn và thiếu dữ liệu.
3. Dựng trang gói hiện tại + usage + so sánh; giữ nguyên dịch vụ đang dùng tới khi có contract mới.
4. Dựng checkout và kết quả với các trạng thái mock được ghi rõ; chưa coi là thanh toán thật.
5. Tích hợp tạo đơn, xác nhận thanh toán phía server, cấp quyền và tải lại entitlement.
6. Kiểm tra chức năng, keyboard, tương phản, responsive và trường hợp refresh/thanh toán lặp.

## 10. Tiêu chí nghiệm thu

- [ ] Nhìn đầu trang biết ngay gói đang dùng và thời hạn; Free không có ngày hết hạn giả.
- [ ] Free/Pro/Family đúng giá và quyền lợi nguồn; Family tối đa 5 hồ sơ trong catalog.
- [ ] Không nhầm ngày reset hạn mức với ngày hết hạn thuê bao.
- [ ] Free có vùng đăng ký Pro/Family rõ ràng; mỗi nút mang đúng gói sang checkout.
- [ ] Checkout hiển thị tổng tiền từ server và điều kiện trước hành động trả tiền.
- [ ] Không thay đổi quyền trước khi backend xác nhận; không thu tiền/gửi đơn lặp do double-click hoặc refresh.
- [ ] Thành công, thất bại, hủy, pending, hết hạn đơn và chậm cấp quyền đều có hướng đi tiếp.
- [ ] Loading/error/partial-data không biến tài khoản thành Free hoặc quota thành 0.
- [ ] Nút nâng/gia hạn chỉ xuất hiện khi có chính sách và backend cho phép.
- [ ] Desktop/mobile không tràn ngang; giá, ngày hết hạn và CTA đọc được; thao tác bằng bàn phím đầy đủ.

## 11. Nguồn đối chiếu

- [DESIGN.md](DESIGN.md): nền tảng thị giác.
- [Public Website.md](<Public Website.md>), mục 8.3: cấu hình giá và quyền lợi.
- [PARENT_IMPLEMENTATION_PLAN.md](PARENT_IMPLEMENTATION_PLAN.md), mục 11.9: nguyên tắc usage và entitlement.
- [ParentPlanPage.jsx](../src/features/parent/pages/ParentPlanPage.jsx): giao diện hiện tại.
- [plans.js](../src/features/public/data/plans.js): catalog prototype.
- [mockServer.js](../src/mocks/mockServer.js): entitlement fixture, chưa có contract thuê bao/thanh toán đầy đủ.

Tài liệu này bổ sung thiết kế mục tiêu có đăng ký/thanh toán theo yêu cầu ngày 04/10. Những mô tả “chưa hỗ trợ thanh toán” ở tài liệu/code hiện có vẫn đúng với hiện trạng, không phải giới hạn của thiết kế mới.
