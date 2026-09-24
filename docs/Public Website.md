# SketchTale — Kế hoạch thiết kế Public Website

> Cập nhật: 17/09/2026  
> Phạm vi: website giới thiệu sản phẩm dành cho khách chưa đăng nhập, ưu tiên phụ huynh có con 3–6 tuổi.  
> Công nghệ triển khai: React + Vite, JavaScript/JSX; dựng giao diện và dữ liệu mẫu trước, tích hợp API sau.  
> Trạng thái: kế hoạch thiết kế và cấu hình ba gói được cập nhật ngày 17/09/2026; frontend prototype đang triển khai, chưa có thanh toán thật.
> Cập nhật mới nhất: tên gói, hạn mức tạo nhân vật và quyền lợi đã được tinh chỉnh ngày 17/09/2026. Family dùng 100 lượt tạo nhân vật AI/tháng.

**Đọc nhanh:** mục 2–5 chốt phong cách và hệ thiết kế; mục 6–8 mô tả các trang và nội dung; mục 9–10 hướng dẫn tổ chức frontend; mục 12 là thứ tự triển khai và checklist nghiệm thu. Các lựa chọn chưa được xác nhận nằm ở mục 13.

## 1. Mục tiêu và phạm vi

### 1.1. Website cần giúp người mới hiểu điều gì?

Trong lần truy cập đầu tiên, phụ huynh cần trả lời được:

1. SketchTale là gì, dành cho ai?
2. Bé sẽ đọc, nghe và tương tác với truyện như thế nào?
3. Phụ huynh có thể đồng hành và quản lý những gì?
4. Có thể xem thử ở đâu, cần tài khoản khi nào?
5. Free, Pro và Family khác nhau về giá, hồ sơ, tạo nhân vật và xuất video như thế nào?

Luồng ưu tiên: **Trang chủ → Kệ truyện minh họa → Dành cho phụ huynh → Bảng giá → Tạo tài khoản khi chức năng sẵn sàng.**

Public website là nơi giới thiệu và trải nghiệm mẫu, không phải toàn bộ ứng dụng đọc truyện của trẻ hoặc dashboard của ba role.

### 1.2. Căn cứ và các giới hạn cần giữ

| Nội dung                                                 | Trạng thái áp dụng                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tên sản phẩm SketchTale; nhóm người dùng trẻ 3–6 tuổi    | Đã xác nhận                                                                                                               |
| Phụ huynh đăng nhập cho trẻ; Parent–Child là quan hệ 1–N | Đã xác nhận; không dùng nội dung mô tả một trẻ có nhiều Parent                                                            |
| Web có Parent, Content Manager và Admin                  | Đã xác nhận; dashboard nằm ngoài phạm vi thiết kế chi tiết của file này                                                   |
| Màu UI và tỷ lệ 60/30/10                                 | Theo bảng màu mới nhất người dùng cung cấp                                                                                |
| Logo và mèo linh vật                                     | Theo hai ảnh người dùng cung cấp; không thiết kế lại thương hiệu                                                          |
| Frontend dùng JavaScript, API sẽ cung cấp sau            | Đã xác nhận                                                                                                               |
| Tạo nhân vật bằng AI                                     | Người dùng cập nhật ngày 17/09/2026: đưa vào mô tả và quyền lợi gói theo mục 8.3; không giả lập đã tích hợp AI trong demo |
| Luồng tranh vẽ → nhân vật → gán vào truyện               | Có mô tả tạo nhân vật hoạt hình từ tranh trong gói; chi tiết tích hợp vẫn cần khớp backend                                |
| Gói, giá, hạn mức và xuất video                          | Đã cung cấp Free / Pro 35.000đ/tháng / Family 89.000đ/tháng; giao dịch thật cần tích hợp, xem mục 8.3                     |
| Truyện mẫu, trang hỗ trợ, bố cục và nội dung bên dưới    | Đề xuất thiết kế, không mặc định là nghiệp vụ đã được nhóm duyệt                                                          |

`docs/PROJECT_SUMMARY.md` và tài liệu này đã đồng bộ thông tin gói mới nhất ngày 17/09/2026. Mô tả AI trong quyền lợi gói được phép theo cập nhật này; không biến mô tả quyền lợi thành tuyên bố đã có chức năng thật trên prototype.

### 1.3. Nguyên tắc nội dung

- Ngôn ngữ mặc định: tiếng Việt. Giữ tên SketchTale; chưa làm chuyển ngôn ngữ giả.
- Viết cho phụ huynh bằng giọng ấm áp, rõ ràng; hình ảnh vui tươi nhưng bố cục không giống màn hình trò chơi dành cho trẻ.
- Nói về đọc truyện, lắng nghe, khám phá và sự đồng hành; không cam kết tăng IQ, thành tích hoặc hiệu quả giáo dục chưa có chứng cứ.
- Không thêm đánh giá khách hàng, số người dùng, đối tác, giải thưởng hoặc chứng nhận giả.
- Không quảng cáo “miễn phí”, “không giới hạn”, “an toàn tuyệt đối” hoặc “đã ra mắt” khi chưa được xác nhận.
- Bản prototype phải có nhãn “Bản trải nghiệm giao diện — dữ liệu minh họa”; không khiến người xem hiểu nhầm đã có tài khoản, giao dịch hoặc dữ liệu học tập thật.

## 2. Định hướng thẩm mỹ

### 2.1. Ý tưởng chủ đạo: Một cuốn sách tranh mở ra trên web

**Ấm áp — sáng sủa — giàu trí tưởng tượng — đáng tin với phụ huynh.**

- Nền trắng/kem, khoảng thở rộng, chữ navy rõ ràng.
- Vàng xuất hiện ở nút hành động chính, mảng minh họa, chi tiết sách và lời mời cuối trang.
- Đường cong mềm lấy cảm hứng từ trang sách, ngôi sao và nét bút trong logo.
- Mèo linh vật đóng vai người bạn dẫn đường, không phủ kín mọi section.
- Bố cục xen kẽ phần biên tập thoáng, kệ truyện và khu vực tương tác mẫu; không biến cả landing page thành các hàng thẻ giống nhau.
- Độ biểu cảm vừa phải: khác biệt chủ yếu ở minh họa và cách sắp xếp, không ở hiệu ứng phức tạp.

### 2.2. Những lựa chọn không sử dụng

- Không dùng nền tối toàn trang, gradient neon, kính mờ hoặc phong cách dashboard công nghệ.
- Không dùng carousel tự chạy ở hero, video tự phát, âm thanh tự phát hoặc popup mua gói khi vừa vào.
- Không dùng quá nhiều màu phụ trong cùng một khối.
- Không biến mọi đoạn nội dung thành một card bo tròn có bóng.
- Không đặt chữ nội dung bên trong ảnh; tiêu đề, mô tả và CTA phải là HTML.
- Không dùng ảnh chụp trẻ em không rõ quyền sử dụng hoặc ảnh có thông tin nhận diện thật.

## 3. Logo, linh vật và tài nguyên hình ảnh

### 3.1. Nguồn hiện có

| Tài nguyên                                | Nội dung quan sát được                                                            | Cách dùng                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- |
| `C:\Users\pc\Downloads\tải xuống.png`     | Logo ngang, logo xếp dọc, biểu tượng sách/bút trên nền vàng                       | Nguồn nhận diện chính                 |
| `C:\Users\pc\Downloads\tải xuống (1).png` | Mèo trắng–vàng, khăn coral, huy hiệu ngôi sao; nhiều góc nhìn, biểu cảm và tư thế | Nguồn linh vật và phong cách minh họa |

Hai file hiện là **bảng tổng hợp thương hiệu**, chưa phải bộ asset tách riêng có nền trong suốt. Không đưa nguyên bảng vào header hoặc hero. Giữ nguyên ảnh gốc; bước triển khai cần có bản xuất riêng từ nguồn thiết kế, hoặc phương án xử lý ảnh được thống nhất.

Mã màu in trên bảng hình có vài khác biệt với CSS được cung cấp. **CSS mới nhất quyết định màu giao diện**; không tự ý đổi màu từng pixel trong logo để ép khớp token.

### 3.2. Quy tắc sử dụng

- Header và footer: logo ngang, không kéo méo, không dựng lại chữ bằng font gần giống.
- Kích thước hiển thị mục tiêu: rộng 168–184 px desktop, 140–156 px mobile; giữ đúng tỷ lệ file xuất.
- Vùng an toàn quanh logo: tối thiểu khoảng 1/4 chiều cao logo.
- Favicon/app shortcut của website: đề xuất dùng biểu tượng sách/bút của bảng logo đầu tiên; chưa trộn lẫn hai mẫu app icon.
- Mèo giữ nguyên tai/đuôi vàng, khăn coral, viền navy; không tự đặt tên linh vật khi chưa có tên chính thức.
- Mỗi màn hình chỉ có một hình linh vật chính; các biểu tượng nhỏ phải có lý do sử dụng.
- Hình chỉ trang trí dùng alt rỗng; logo dùng “SketchTale”; ảnh truyện dùng mô tả nội dung có ý nghĩa.

### 3.3. Danh sách asset cần chuẩn bị

Đây là tên file đích dự kiến, không phải các file đã tồn tại trong dự án.

| Asset dự kiến                             | Vị trí                    | Yêu cầu                                                          |
| ----------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `logo-horizontal.svg` hoặc PNG trong suốt | Header/footer             | SVG từ file gốc; nếu PNG thì xuất ít nhất 2× kích thước hiển thị |
| `brand-mark.svg` và các cỡ favicon        | Tab trình duyệt           | Biểu tượng sách/bút, rõ ở cỡ nhỏ                                 |
| `mascot-wave.webp`                        | Hero                      | Mèo chào; nền trong suốt, không kèm chữ trên bảng                |
| `mascot-read.webp`                        | Trải nghiệm truyện        | Mèo đọc sách                                                     |
| `mascot-guide.webp`                       | Cách hoạt động            | Mèo hướng dẫn                                                    |
| `mascot-curious.webp`                     | FAQ hoặc trạng thái trống | Dùng tiết chế, không che nội dung                                |
| `mascot-celebrate.webp`                   | CTA cuối                  | Một tư thế vui, không lặp animation liên tục                     |
| 3 bìa truyện mẫu và tranh từng trang      | Thư viện/demo             | Cùng phong cách 2D với thương hiệu; có quyền sử dụng             |
| `og-public-home.jpg`                      | Chia sẻ trang             | Bản thiết kế riêng 1200×630; logo, tiêu đề ngắn, linh vật        |

Không sử dụng ảnh stock ngẫu nhiên thay cho minh họa truyện. Trước khi có asset hoàn chỉnh, có thể dùng bản dựng khung trong môi trường nội bộ, nhưng phải đánh dấu chưa đạt tiêu chí bàn giao hình ảnh.

## 4. Hệ màu và design tokens

### 4.1. Bảng màu gốc — giữ nguyên

```css
:root {
  /* Brand */
  --color-primary: #f7bd35;
  --color-primary-light: #f9c42a;
  --color-primary-dark: #f0b630;

  /* Background */
  --color-background: #fff9ec;
  --color-surface: #ffffff;
  --color-surface-soft: #fff4fa;

  /* Text */
  --color-text-primary: #001050;
  --color-text-secondary: #6b7280;

  /* Accent */
  --color-blue: #46dcf7;
  --color-blue-dark: #48bcfc;
  --color-coral: #fc6c78;
  --color-yellow-accent: #fcd800;
  --color-mint: #44f8e0;

  /* Border */
  --color-border: #e9e9ef;
}
```

### 4.2. Phân bổ 60% / 30% / 10%

| Tỷ lệ định hướng | Áp dụng                                                          |
| ---------------- | ---------------------------------------------------------------- |
| 60% trắng/kem    | Nền trang, khoảng trống, nền nội dung, khu vực đọc               |
| 30% vàng         | Mảng minh họa hero, bìa/chi tiết sách, CTA chính, mảng kết trang |
| 10% accent       | Nhãn chủ đề, điểm nhấn minh họa, phản hồi và chi tiết nhỏ        |

Đây là tỷ lệ cảm nhận trên tổng thể thiết kế, không phải yêu cầu tô vàng đúng 30% từng màn hình. Các trang FAQ, pháp lý và liên hệ cần nhẹ màu hơn trang chủ. Navy là màu chữ/đường nét, không dùng để tạo sidebar trong public website.

### 4.3. Ánh xạ màu vào component

| Thành phần            | Nền                         | Chữ/viền                                                   |
| --------------------- | --------------------------- | ---------------------------------------------------------- |
| Primary button        | Primary; hover primary-dark | Navy                                                       |
| Secondary button      | Trắng hoặc trong suốt       | Navy, viền navy rõ                                         |
| Link trong đoạn văn   | Nền hiện có                 | Navy, có gạch chân; không dùng vàng nhạt làm chữ           |
| Header                | Trắng                       | Navy; phân cách nhẹ                                        |
| Badge chủ đề          | Blue, coral hoặc mint       | Navy; mỗi chủ đề có quy tắc nhất quán                      |
| FAQ/thông tin dịu     | Trắng hoặc surface-soft     | Navy, mô tả secondary khi đủ tương phản                    |
| Input                 | Trắng                       | Navy; viền tương tác dùng secondary, không chỉ border nhạt |
| Lỗi form              | Coral làm nền nhấn nhẹ      | Navy + biểu tượng + thông báo cụ thể                       |
| Hoàn tất thao tác mẫu | Mint làm nền nhấn           | Navy + nội dung phản hồi                                   |
| Focus                 | Nền hiện có                 | Outline navy 3 px, offset 3 px                             |

Không dùng màu coral/mint đơn độc để diễn đạt sai/đúng; luôn có chữ hoặc icon. Nếu sau này bổ sung màu semantic mới, phải ghi riêng, không thay giá trị palette gốc.

### 4.4. Độ tương phản

Tỷ lệ dưới đây được tính trên các mã màu đặc, chưa có opacity hoặc ảnh nền.

| Cặp chữ / nền            | Tỷ lệ xấp xỉ               | Quyết định                                                          |
| ------------------------ | -------------------------- | ------------------------------------------------------------------- |
| Navy / vàng primary      | 10.32:1                    | Dùng cho nút chính                                                  |
| Trắng / vàng primary     | 1.71:1                     | Không dùng cho nhãn nút hoặc nội dung                               |
| Navy / cream             | 16.82:1                    | Dùng cho tiêu đề và đoạn văn                                        |
| Secondary / trắng        | 4.83:1                     | Dùng cho mô tả                                                      |
| Secondary / cream        | 4.61:1                     | Đạt ngưỡng chữ thường; không giảm opacity thêm                      |
| Secondary / vàng primary | 2.83:1                     | Không dùng cho chữ thường                                           |
| Navy / blue, coral, mint | 10.79:1 / 6.35:1 / 13.24:1 | Phù hợp cho nhãn chữ                                                |
| Border / trắng           | 1.21:1                     | Chỉ phân cách trang trí; không là dấu hiệu duy nhất nhận biết input |

Mục tiêu chữ thường tối thiểu 4.5:1; chữ lớn tối thiểu 3:1 theo [WCAG — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Những phần đồ họa cần thiết để nhận biết điều khiển/trạng thái cần được kiểm tra mức 3:1 với màu liền kề theo [WCAG — Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## 5. Typography, bố cục và tương tác

### 5.1. Font

Chọn **Nunito** cho cả heading và body: nét bo tròn hợp logo, đủ thân thiện nhưng vẫn đọc tốt ở trang dành cho người lớn. Google Fonts ghi nhận font có bộ ký tự tiếng Việt trong [metadata chính thức của Nunito](https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/METADATA.pb).

- Weight sử dụng: 400 cho body, 600 cho nhãn, 700 cho button/subheading, 800 cho heading.
- Ưu tiên self-host WOFF2 có đủ dấu tiếng Việt, `font-display: swap`; giữ giấy phép font.
- Fallback: `"Nunito", system-ui, sans-serif`.
- Không dùng font viết tay cho đoạn văn, form hoặc nhãn điều hướng.

| Cấp chữ       | Desktop    | Mobile     | Line-height |
| ------------- | ---------- | ---------- | ----------- |
| H1 hero       | 56 px, 800 | 36 px, 800 | 1.12–1.2    |
| H1 trang con  | 44 px, 800 | 32 px, 800 | 1.2         |
| H2 section    | 36 px, 800 | 28 px, 800 | 1.25        |
| H3            | 24 px, 700 | 22 px, 700 | 1.35        |
| Lead          | 18 px      | 17 px      | 1.6         |
| Body          | 16 px      | 16 px      | 1.65        |
| Label/caption | 14 px, 600 | 14 px, 600 | 1.5         |

Kiểm tra dấu tiếng Việt, đặc biệt các chữ như “trưởng thành”, “trí tưởng tượng”, “phụ huynh”; không cắt dấu bằng line-height hoặc overflow. Đoạn văn dài giới hạn khoảng 60–70 ký tự mỗi dòng.

### 5.2. Grid và kích thước

- Container tối đa 1248 px; gutter tối thiểu 32 px desktop, 24 px tablet, 20 px mobile.
- Desktop dùng grid 12 cột khi cần; khoảng cách cột 24–32 px.
- Section padding dọc 80–96 px desktop, 56–64 px tablet, 40–48 px mobile.
- Header cao khoảng 72 px desktop, 64 px mobile.
- Scale spacing: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96 px.
- Radius: input 12 px; button 14 px; khối truyện 24 px; khung minh họa lớn 32 px. Pill chỉ cho badge.
- Button/input cao tối thiểu 48 px; icon button vùng bấm tối thiểu 44×44 px.
- Shadow nhẹ chỉ cho vật thể nổi như bìa sách hoặc menu; phần nội dung chủ yếu dùng khoảng trống và nền để phân chia.
- Website mặc định light theme theo palette; chưa thêm dark mode hoặc tự đổi màu theo hệ điều hành.

### 5.3. Responsive và chuyển động

- Từ 1024 px: menu ngang; hero 5/7 cột.
- Từ 768–1023 px: menu thu gọn nếu không đủ chỗ; kiểm tra để không ép nhãn thành hai dòng.
- Dưới 768 px: nội dung một cột, chữ và CTA trước minh họa; kệ truyện xuống dòng, không buộc vuốt ngang.
- H1 hero tối đa 2 dòng desktop, mục tiêu tối đa 3 dòng mobile; điều chỉnh cỡ chữ và độ rộng thay vì ép line-break trên mọi thiết bị.
- Ở 1366×768: thấy trọn tiêu đề, mô tả và CTA hero mà chưa cần cuộn; không bắt hero cao `100vh`.
- Hover/focus transition 160–220 ms; dịch chuyển card không quá 2 px.
- Linh vật có thể chào một lần nếu có asset phù hợp; bản đầu dùng hình tĩnh vẫn đạt thiết kế.
- Không cần thư viện animation riêng ở giai đoạn đầu. Tôn trọng `prefers-reduced-motion`, tắt hiệu ứng dịch chuyển và cuộn mượt khi người dùng yêu cầu.
- Menu mobile có trạng thái mở/đóng, Escape để đóng, quản lý focus và trả focus về nút mở.

## 6. Sơ đồ trang và điều hướng

### 6.1. Danh sách trang

Các route dưới đây là đề xuất frontend, không phải endpoint backend.

| Route                   | Trang                                                                         | Mức triển khai                                                      |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/`                     | Trang chủ/landing                                                             | Đợt 1                                                               |
| `/faq`                  | Câu hỏi thường gặp                                                            | Đợt 3                                                               |
| `/contact`              | Liên hệ/hỗ trợ                                                                | Đợt 3                                                               |
| `/about`                | Giới thiệu SketchTale                                                         | Đợt 3                                                               |
| `/child-safety`         | Cách đồng hành và nguyên tắc bảo vệ trẻ                                       | Đợt 4, duyệt nội dung trước ra mắt                                  |
| `/privacy`              | Chính sách quyền riêng tư                                                     | Đợt 4, cần nội dung chính thức trước thu thập dữ liệu thật          |
| `/terms`                | Điều khoản sử dụng                                                            | Đợt 4, cần nội dung chính thức trước ra mắt                         |
| `/auth/login`           | Giao diện đăng nhập chung                                                     | Ranh giới sang module Auth; prototype trước, tích hợp sau           |
| `/auth/register`        | Giao diện tạo tài khoản Parent                                                | Ranh giới sang module Auth; không cho tự chọn Admin/Content Manager |
| `/auth/forgot-password` | Giao diện quên mật khẩu                                                       | Prototype khi làm Auth                                              |
| Route không khớp        | Trang 404 thân thiện                                                          | Đợt 1                                                               |

Không tạo trang riêng cho các section landing; dùng anchor `/#features`, `/#stories`, `/#parents` và `/#pricing`. Không thêm blog khi chưa có người và quy trình duy trì nội dung.

### 6.2. Header và footer

**Header desktop:** logo → Cách hoạt động → Truyện → Dành cho phụ huynh → Bảng giá → Đăng nhập. Các mục này đều cuộn tới section tương ứng trên landing; không có trang public riêng cho truyện mẫu, phụ huynh hoặc gói sử dụng.

- Logo về `/`.
- “Truyện”, “Dành cho phụ huynh” và “Bảng giá” dùng lần lượt `/#stories`, `/#parents` và `/#pricing`.
- “Đăng nhập” là hành động tài khoản phụ, không cạnh tranh bằng nhiều nút vàng với CTA khám phá.
- Sticky header nhẹ; anchor phải có khoảng bù để tiêu đề không bị che.
- Chỉ hiển thị liên kết đã có đích sử dụng được; không dùng `href="#"` thay cho route chưa làm.

**Footer:** logo và một câu giới thiệu; nhóm Khám phá, Hỗ trợ, Chính sách. Nền trắng/kem, chữ navy, không cần mảng navy lớn.

Nội dung giới thiệu: “SketchTale — cùng bé mở trang sách, nuôi dưỡng trí tưởng tượng.”

Không thêm địa chỉ, hotline, mạng xã hội hoặc huy hiệu App Store/Google Play giả. Chỉ xuất hiện khi có thông tin thật và URL hoạt động.

## 7. Trang chủ — thiết kế và nội dung từng section

### 7.1. Hero — Mở trang sách

**Mục tiêu:** trong vài giây đầu người xem nhận ra sản phẩm truyện tương tác cho bé và biết có thể xem thử.

- Nền cream, phần chữ bên trái, minh họa lớn bên phải trên desktop.
- Minh họa: cuốn sách mở/bìa truyện và mèo chào; một mảng vàng mềm phía sau, tối đa vài nét sao hoặc nét bút.
- Không dựng một màn hình ứng dụng giả với các số liệu hoặc nút không tồn tại.
- Mobile: chữ → CTA → minh họa nhỏ hơn; không cho mèo đẩy CTA xuống ngoài màn hình đầu.

**Nội dung đề xuất:**

- Nhãn nhỏ: “Cùng bé 3–6 tuổi khám phá”.
- H1: “Mở trang sách. Mở trí tưởng tượng.”
- Mô tả: “Cùng bé đọc, nghe và khám phá những câu chuyện theo cách riêng.”
- CTA chính: **Khám phá truyện** → `/#stories`.
- CTA phụ: **Cách hoạt động** → `/#how-it-works`.

Không thêm dòng đánh giá sao hoặc “hàng nghìn gia đình” thiếu dữ liệu. Hero vẫn ưu tiên đọc truyện; thông tin tạo nhân vật AI được giới thiệu đúng phạm vi gói ở mục 8.3.

### 7.2. Cách hoạt động — Một câu chuyện, ba bước nhỏ

**Bố cục:** một dải tiến trình minh họa 3 bước, không dùng 3 card có bóng giống nhau. Đường nối gợi nét bút; mobile chuyển thành trình tự dọc.

H2: **“Bắt đầu từ một câu chuyện.”**

| Bước | Tiêu đề                       | Nội dung                                                                 |
| ---- | ----------------------------- | ------------------------------------------------------------------------ |
| 01   | Chọn điều bé yêu thích        | Khám phá những câu chuyện về thiên nhiên, tình bạn và thế giới quanh bé. |
| 02   | Cùng bé đọc và nghe           | Đi qua từng trang truyện, lắng nghe lời kể và khám phá những từ mới.     |
| 03   | Trò chuyện sau mỗi trang sách | Những câu hỏi nhỏ mở ra cơ hội để bé nhớ lại và chia sẻ điều mình nghĩ.  |

Phần này mô tả hành trình đọc, không thay thế màn hình onboarding thật. Chỉ mở nút nghe trong demo khi đã có tệp âm thanh phù hợp.

### 7.3. Kệ truyện — Có câu chuyện nào dành cho bé?

**Bố cục:** nền trắng; một truyện nổi bật lớn và hai truyện nhỏ đặt cạnh, tạo cảm giác kệ sách. Mobile xếp dọc; bìa là trọng tâm, không nhồi metadata.

H2: **“Một thế giới nhỏ, nhiều điều để khám phá.”**

Mô tả: “Xem thử những câu chuyện và tìm chủ đề bé yêu thích.”

- Mỗi mục có bìa, tên truyện và chủ đề; nội dung là preview tĩnh trên landing.
- Nhãn “Truyện mẫu” hiển thị rõ; không nói đây là toàn bộ kho truyện thật.
- Không gán thời lượng, lượt đọc, điểm đánh giá hoặc trạng thái “bán chạy” khi không có dữ liệu.
- CTA toàn section: **Khám phá truyện** → `/#stories`.

Tên và nội dung mẫu được đề xuất ở mục 8.1.

### 7.4. Giá trị trải nghiệm — Từ câu chuyện đến điều mới

**Bố cục:** một trang sách minh họa ở giữa với ba đoạn chú giải xung quanh; trên mobile, hình đứng trước danh sách. Không lặp bố cục 3 card của website mẫu.

H2: **“Đọc một câu chuyện. Mở thêm một cuộc trò chuyện.”**

- **Lắng nghe:** “Cùng bé theo dõi lời kể qua từng trang.”
- **Khám phá từ mới:** “Gặp những từ gần gũi trong ngữ cảnh của câu chuyện.”
- **Chia sẻ điều bé nghĩ:** “Câu hỏi nhỏ giúp bố mẹ cùng bé nhắc lại điều vừa đọc.”

Đây là mô tả hoạt động, không phải lời cam kết về kết quả giáo dục. Hình gợi trải nghiệm đọc; không thêm biểu đồ tiến bộ giả.

### 7.5. Dành cho phụ huynh — Bố mẹ luôn đồng hành

**Bố cục:** panel ngang rộng, phần giới thiệu phía trên và demo dạng tab phía dưới. Nền cream hoặc hồng rất nhẹ; giao diện mẫu sạch, trưởng thành hơn phần minh họa.

H2: **“Thế giới của bé, có bố mẹ đồng hành.”**

Mô tả: “Mỗi bé có không gian riêng; bố mẹ cùng chọn nội dung và nhịp sử dụng phù hợp.”

| Tab               | Nội dung giới thiệu                               | Demo frontend                                                                      |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Hồ sơ của bé      | Quản lý từng hồ sơ trong cùng tài khoản phụ huynh | Chuyển giữa hai hồ sơ hư cấu “Mây” và “Nắng”; thể hiện quan hệ 1–N                 |
| Nội dung phù hợp  | Lựa chọn danh mục được phép cho từng bé           | Toggle danh mục; thay đổi chỉ ở state demo của hồ sơ đang chọn                     |
| Thời gian sử dụng | Thiết lập thời gian cho từng hồ sơ                | Điều chỉnh giá trị mẫu; chú thích ứng dụng cảnh báo trước khi hết thời gian 5 phút |

- Luôn có nhãn “Minh họa giao diện phụ huynh — thay đổi không được lưu”.
- Giá trị thời gian demo không được mô tả là hạn mức gói hoặc chính sách mặc định.
- Tab có thể tương tác bằng bàn phím; thay đổi hồ sơ không ghi đè cài đặt mẫu của hồ sơ còn lại.
- Không nhập tên, ngày sinh hoặc dữ liệu thật của trẻ vào public demo.
- Liên kết “Tìm hiểu dành cho phụ huynh” → `/#parents`.

### 7.6. Gói sử dụng — Lựa chọn cho gia đình

H2: **“Lựa chọn phù hợp cho hành trình của gia đình.”**

Giới thiệu ba gói: Free miễn phí, Pro **35.000đ/tháng**, Family **89.000đ/tháng**. Nêu số hồ sơ tương ứng **1 / tối đa 3 / tối đa 5**; liên kết “Xem gói sử dụng” → `/#pricing` để xem đầy đủ hạn mức, tính năng và lưu ý.

Không thêm nhãn “phổ biến nhất”, giá gạch ngang hoặc khuyến mãi thiếu dữ liệu. CTA demo chỉ cuộn giữa các section landing, không thu tiền hoặc cấp gói giả.

### 7.7. FAQ — Những điều bố mẹ muốn biết

**Bố cục:** tiêu đề bên trên, accordion một cột rộng tối đa 800 px; mèo tò mò nhỏ cạnh tiêu đề nếu còn không gian.

H2: **“Bố mẹ đang thắc mắc điều gì?”**

Hiển thị 4–5 câu hỏi nổi bật từ mục 8.4. Mỗi câu hỏi là button có trạng thái mở/đóng; câu trả lời không chỉ hiện khi hover. Liên kết cuối: “Xem tất cả câu hỏi” → `/faq`.

### 7.8. Lời mời cuối — Cùng mở câu chuyện đầu tiên

**Bố cục:** mảng vàng đủ rộng để kết thúc hành trình; chữ navy lớn, mèo vui ở một phía. Nội dung ngắn, một hành động chính.

- H2: **“Cùng bé mở câu chuyện đầu tiên.”**
- Nội dung: “Bắt đầu bằng một câu chuyện nhỏ, dành thời gian khám phá cùng nhau.”
- CTA: **Khám phá truyện** → `/#stories`.
- Button tại nền vàng dùng nền navy/chữ trắng để tách khỏi section; đây là biến thể đảo màu có chủ đích.

Không ép đăng ký hoặc thanh toán trước khi xem mẫu. Sau khi Auth hoạt động thật, có thể thử thêm link phụ “Tạo tài khoản phụ huynh”, nhưng không thay đổi luồng chính khi chưa đánh giá.

## 8. Các trang con — bố cục, nội dung và hành vi

### 8.1. Nội dung truyện trên landing — `/#stories`

Kệ truyện hiển thị ba truyện minh họa ngay trên trang chủ. Đây là nội dung giới thiệu, không mở trang chi tiết public; trải nghiệm đọc đầy đủ thuộc ứng dụng sau khi đăng nhập.

Không có route `/stories` hoặc `/stories/:slug` trong public website. Các link khám phá truyện chỉ cuộn về section `/#stories`.

### 8.2. Gói sử dụng trên landing — `/#pricing`

**H1:** “Gói sử dụng SketchTale”.

**Bố cục:** tiêu đề và trạng thái prototype → ba gói so sánh giá, hạn mức, tính năng → ghi chú Family → FAQ → CTA đọc truyện mẫu. Desktop ba cột, mobile một cột; không dựng switch tháng/năm vì chỉ có giá tháng.

#### Thông tin ba gói (người dùng cung cấp ngày 17/09/2026)

Giá tính bằng VND theo tháng. Đây là cấu hình sản phẩm được cung cấp, không phải xác nhận chức năng thanh toán hay quyền lợi đã được triển khai. Hạn mức thương mại phải do backend kiểm tra khi tích hợp; frontend không tự cấp quyền.

| Nội dung             | Free                     | Pro                          | Family                                  |
| -------------------- | ------------------------ | ---------------------------- | --------------------------------------- |
| Giá                  | Miễn phí                 | 35.000đ/tháng                | 89.000đ/tháng                           |
| Hồ sơ trẻ em         | 1                        | Tối đa 3                     | Tối đa 5                                |
| Tạo nhân vật AI      | 5 lượt/tháng             | 30 lượt/tháng                | 100 lượt/tháng                          |
| Tạo lại (regenerate) | Tối đa 1 lần/hình        | Tối đa 1 lần mỗi tranh       | Tối đa 1 lần mỗi tranh                  |
| Thư viện             | 5 truyện miễn phí cơ bản | Toàn bộ mẫu truyện và chủ đề | Trọn bộ cao cấp, cập nhật mới hàng tuần |
| Xuất video           | Không hỗ trợ             | 5 lượt/tháng                 | Không giới hạn                          |

##### Gói 1: Free

- **Mục tiêu:** Phụ huynh mới muốn dùng thử hệ thống, cho con trải nghiệm biến hình vẽ thành nhân vật hoạt hình.
- **Tính năng:** Vẽ trực tiếp hoặc chụp/tải ảnh vẽ tay; tạo nhân vật hoạt hình từ tranh vẽ bằng AI; đặt tên và chỉnh sửa màu sắc cơ bản; đọc truyện tương tác với giọng đọc, tô sáng chữ và câu hỏi sau truyện; Parent Portal cơ bản để quản lý thời gian, duyệt nhân vật.
- **Giới hạn:** Không xuất video, không xem báo cáo từ vựng chuyên sâu, thư viện giới hạn ở 5 truyện cơ bản.

##### Gói 2: Pro — 35.000đ/tháng

- **Mục tiêu:** Gia đình có 1–2 trẻ em muốn con sáng tạo hằng ngày và học qua truyện đọc. Số hồ sơ được cấp vẫn là tối đa 3, không giới hạn ở 2 theo mô tả khách hàng mục tiêu.
- **Tính năng:** Toàn bộ tính năng Free; lưu trữ kho nhân vật và thư viện truyện yêu thích (Favorites) không giới hạn.
- **Giới hạn:** 1 lần regenerate mỗi tranh; 5 lượt xuất video/tháng.

##### Gói 3: Family — 89.000đ/tháng

- **Mục tiêu:** Gia đình đông con hoặc phụ huynh muốn sự tự do sáng tạo và lưu giữ kỷ niệm.
- **Tính năng:** Toàn bộ tính năng Pro; đánh dấu và xuất báo cáo học tập định kỳ hằng tháng gửi về email phụ huynh.
- **Giới hạn:** 100 lượt tạo nhân vật AI/tháng, 1 lần regenerate mỗi tranh. Xuất truyện thành video không giới hạn.

##### Quy tắc tích hợp và các câu hỏi còn mở

- Các gói có giá và quyền lợi nêu trên; public prototype chỉ giới thiệu trên landing, chưa thu tiền, đăng ký gói hoặc cấp quyền thật.
- Ba truyện preview trên landing không phải danh sách 5 truyện của gói Free. Danh sách 5 truyện và thư viện cao cấp cần Content Manager xác nhận.
- Cần chốt gói gắn với Parent hay từng Child, cách chia sẻ hạn mức giữa các hồ sơ, ngày reset theo tháng và timezone.
- Cần chốt regenerate có trừ lượt tạo chính không, lượt lỗi có hoàn lại không, cách đếm xuất video và tải lại file.
- Chưa có giá năm, thời gian dùng thử, phương thức thanh toán, điều kiện gia hạn/hủy/hoàn tiền hay quy tắc nâng/hạ gói; không tự bổ sung.

### 8.4. Câu hỏi thường gặp — `/faq`

**H1:** “Những điều bố mẹ muốn biết.”

Chia nhóm Bắt đầu, Dành cho phụ huynh, Gói sử dụng. Bản đầu dùng khoảng 6 câu hỏi; chưa cần ô tìm kiếm cho lượng nội dung ít.

| Câu hỏi                                                | Câu trả lời đề xuất                                                                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SketchTale dành cho trẻ bao nhiêu tuổi?                | SketchTale hướng tới trẻ từ 3 đến 6 tuổi, với sự đồng hành của phụ huynh.                                                                                  |
| Bé sử dụng ở đâu, bố mẹ quản lý ở đâu?                 | Sản phẩm được thiết kế với ứng dụng di động cho trải nghiệm của bé và website cho phụ huynh quản lý. Trang này giới thiệu sản phẩm và cung cấp truyện mẫu. |
| Bé có cần tự tạo tài khoản không?                      | Phụ huynh đăng nhập và quản lý hồ sơ của bé. Bé không cần tự tạo tài khoản riêng.                                                                          |
| Một phụ huynh có thể quản lý nhiều bé không?           | Có. Mỗi hồ sơ trẻ thuộc một tài khoản phụ huynh và có cài đặt riêng. Free có 1 hồ sơ, Pro tối đa 3, Family tối đa 5 hồ sơ.                                 |
| Bố mẹ có thể chọn nội dung và thời gian sử dụng không? | Chức năng dành cho phụ huynh được thiết kế để quản lý danh mục nội dung và thời gian theo từng hồ sơ. Phần trình diễn trên website dùng dữ liệu minh họa.  |
| SketchTale có thu phí không?                           | Có gói Free miễn phí, Pro 35.000đ/tháng và Family 89.000đ/tháng. Family có 100 lượt tạo nhân vật AI/tháng; prototype chưa hỗ trợ thanh toán.               |

Cuối trang: “Bạn còn câu hỏi khác?” → “Liên hệ” → `/contact`. Trước khi ra mắt phải cập nhật các câu đang mô tả kế hoạch để khớp đúng trạng thái tính năng thực tế.

### 8.5. Liên hệ — `/contact`

**H1:** “Bố mẹ muốn trao đổi điều gì?”

**Mô tả:** “Chia sẻ câu hỏi hoặc góp ý để SketchTale hiểu điều gia đình cần.”

**Bố cục:** tiêu đề ngắn, form một cột dễ đọc; mèo hướng dẫn nhỏ cạnh phần giới thiệu trên desktop, bỏ hình nếu mobile quá dài.

Form gồm:

- Tên người liên hệ: bắt buộc, không yêu cầu họ tên của trẻ.
- Email: bắt buộc, kiểm tra định dạng.
- Chủ đề: tùy chọn; Sản phẩm / Tài khoản / Góp ý.
- Nội dung: bắt buộc, giới hạn độ dài được mô tả rõ.
- Nhắc nhở: “Vui lòng không gửi thông tin riêng tư hoặc hình ảnh của trẻ trong biểu mẫu này.”

**Trong prototype:** nhãn rõ “Biểu mẫu minh họa, chưa gửi thông tin”; sau khi kiểm tra hợp lệ hiển thị “Thông tin hợp lệ. Bản demo chưa gửi liên hệ.” Không báo “Đã gửi thành công”, không lưu nội dung vào localStorage và không gửi qua dịch vụ bên ngoài.

**Khi nối backend:** thêm loading, thành công thực, lỗi mạng và retry; không xóa nội dung người dùng khi gửi thất bại. Email/hotline hỗ trợ chỉ hiện khi có đầu mối thật.

### 8.6. Dành cho phụ huynh trên landing — `/#parents`

Nội dung đồng hành của phụ huynh được trình bày trực tiếp trong section `/#parents`, gồm demo quản lý hồ sơ, duyệt nhân vật, giới hạn thời gian, kiểm soát nhóm truyện và theo dõi tiến độ. Không tạo route `/for-parents` riêng; điều hướng về section này bằng anchor.

### 8.7. Giới thiệu và các trang chính sách

**`/about` — H1: “Một câu chuyện nhỏ về SketchTale.”**

- Giới thiệu mục tiêu tạo không gian đọc truyện và khám phá cùng bé.
- Có thể ghi đây là dự án đồ án do nhóm 5 thành viên phát triển nếu nhóm muốn công khai.
- Không dựng tiểu sử công ty, tên chuyên gia, thành viên hoặc thành tựu chưa được cung cấp.
- Dùng hình mèo và ngôn ngữ hình ảnh sách; tránh mảng thống kê không có dữ liệu thật.

**`/child-safety` — H1: “Cùng xây dựng trải nghiệm phù hợp cho bé.”**

- Phân biệt nội dung do hệ thống xuất bản, cài đặt của phụ huynh và hành vi sử dụng.
- Mô tả công cụ kiểm soát thực sự có; không bảo đảm an toàn tuyệt đối.
- Dẫn tới hướng dẫn báo cáo nội dung và đầu mối hỗ trợ khi quy trình vận hành sẵn sàng.

**`/privacy` và `/terms`:**

- Layout đọc một cột khoảng 760 px, mục lục, tiêu đề phân cấp, ngày hiệu lực và liên hệ khi có thông tin chính thức.
- Lập danh mục cần nhóm cung cấp: dữ liệu thu thập, mục đích, lưu trữ/chia sẻ, quản lý tài khoản, xóa dữ liệu, quyền sử dụng nội dung, điều kiện thanh toán nếu có.
- Không tự viết nội dung như chính sách đã được phê duyệt hoặc tuyên bố tuân thủ pháp luật/chứng nhận cụ thể.
- Bản nháp nội bộ phải ghi “Chưa phải chính sách chính thức”, không index. Duyệt chính sách thật trước phát hành và thu thập dữ liệu thật.

### 8.8. Auth và 404

Auth dùng cùng màu, font và logo nhưng bố cục tập trung: form dễ đọc, minh họa nhỏ, không có đủ tám section landing.

- Đăng ký public chỉ dành cho Parent; không đặt dropdown tự chọn Parent/Admin/Content Manager.
- Đăng nhập chung; phân luồng theo role do backend trả về khi tích hợp.
- Prototype ghi rõ chưa tạo tài khoản/đăng nhập thật; không lưu mật khẩu, token giả hoặc bật quyền quản trị bằng thao tác UI.
- Có link qua lại giữa đăng nhập, đăng ký và quên mật khẩu; mỗi link phải có trang đích trước khi hiển thị.
- Xác thực email và đặt lại mật khẩu thật sẽ phụ thuộc API; không giả lập email đã được gửi.
- Trang 404: mèo tò mò, H1 “Trang này đi lạc rồi.”, mô tả ngắn, nút “Về trang chủ” và link “Khám phá truyện”.

## 9. Component và quy ước tương tác

### 9.1. Bộ component dùng chung

| Nhóm         | Component dự kiến                                              |
| ------------ | -------------------------------------------------------------- |
| Khung public | PublicLayout, PublicHeader, MobileMenu, PublicFooter, SkipLink |
| Cơ bản       | Button, TextLink, Container, SectionHeading, Badge, FormField  |
| Truyện mẫu   | StoryCard, StoryFilters, SampleReader, SampleQuiz              |
| Nội dung     | FaqAccordion, ParentDemoTabs, PlanAvailabilityNotice           |
| Trạng thái   | LoadingState, EmptyState, ErrorState, PrototypeNotice          |

Giữ API component đơn giản. Không tạo design-system package riêng hoặc abstraction phức tạp cho số trang ban đầu.

### 9.2. Quy tắc hành động

| Nhãn            | Đích/hành vi                                             | Điều kiện                                                                   |
| --------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Khám phá truyện | `/#stories`                                               | Cuộn tới kệ truyện trên landing                                      |
| Đọc truyện       | Ứng dụng sau khi đăng nhập                                | Public website chỉ giới thiệu kệ truyện minh họa                              |
| Cách hoạt động  | `/#how-it-works`                                         | Cuộn tới section, có bù header                                              |
| Xem gói sử dụng | `/#pricing`                                               | Cuộn tới bảng giá trên landing; chưa tích hợp thanh toán          |
| Đăng nhập       | `/auth/login`                                            | Chỉ hiện khi giao diện Auth đã tồn tại; có nhãn prototype nếu chưa tích hợp |
| Tạo tài khoản   | `/auth/register`                                         | Không hứa đăng ký thật khi chưa có API                                      |
| Liên hệ         | `/contact`                                               | Prototype không báo gửi thật                                                |
| Tải ứng dụng    | URL store thật                                           | Chưa có URL thì không hiển thị nút/huy hiệu                                 |

- Link để điều hướng; button để đổi state, mở menu, gửi form hoặc chuyển trang reader.
- Nút có disabled/loading khi có lý do thực tế; không dùng một CTA nổi bật nhưng bấm không làm gì.
- Lỗi form nằm cạnh field, có hướng dẫn sửa; không chỉ đổi viền đỏ.
- Accordion thông báo trạng thái mở/đóng. Tab có lựa chọn hiện tại và điều khiển bàn phím.
- Không dùng tooltip làm nơi duy nhất chứa thông tin cần thiết.

## 10. Tổ chức frontend để nối API sau

### 10.1. Điểm xuất phát hiện có

Dự án dùng React 19 + Vite 8. Bản triển khai ngày 17/09/2026 đã thêm React Router, JSX/CSS cho các trang public, service mock, các luồng đọc/quiz, demo phụ huynh và trang so sánh gói. Chưa tích hợp API, auth, thanh toán hoặc dashboard nội bộ. README ghi cách chạy và các giới hạn bàn giao.

Đề xuất:

- Giữ React/Vite; không chuyển sang Next.js hoặc TypeScript chỉ để làm landing page.
- Dùng JavaScript/JSX. Chọn và thêm router ở bước triển khai, không tự khóa phiên bản trong tài liệu này.
- CSS variables + CSS thường hoặc CSS Modules; chưa cần thêm Tailwind/chồng nhiều thư viện UI.
- State cục bộ cho menu/filter/quiz; chưa cần Redux cho website public.
- Loại bỏ màn hình counter/logo mẫu Vite và các CSS starter về dark mode, canh giữa toàn trang, giới hạn root không phù hợp khi bắt đầu code.
- Module public có layout riêng, không chia sẻ sidebar hoặc navigation nội bộ của Parent/Admin/Content Manager.

### 10.2. Cấu trúc thư mục đề xuất

Các đường dẫn sau là cấu trúc sẽ tạo khi triển khai, chưa phải danh sách file hiện hữu.

```text
src/
  app/
    App.jsx
    routes.jsx
  styles/
    tokens.css
    global.css
  components/
    ui/
  features/
    public/
      layouts/
        PublicLayout.jsx
      components/
      sections/
      pages/
      data/
        homeContent.js
        sampleStories.js
        faqs.js
        plans.js
      services/
        publicService.js
        mockPublicService.js
      config/
        publicFeatures.js
    auth/
      pages/
  assets/
    brand/
    mascot/
    stories/
public/
  fonts/
  favicon.ico
```

### 10.3. Dữ liệu mẫu và ranh giới API

- Copy, FAQ, sample stories và cấu hình gói tách khỏi JSX để đổi nội dung không sửa bố cục.
- Component lấy dữ liệu qua interface service; bản đầu service trả Promise từ fixture.
- Interface dự kiến: `getSampleStories(filters)`, `getSampleStory(slug)`, `getFaqs()`, `getPlanAvailability()`.
- Đây là hàm frontend đề xuất, không phải tên endpoint đã thống nhất với backend.
- Mock hỗ trợ trạng thái thành công, trống, lỗi và chậm trong môi trường phát triển để kiểm thử UI.
- Khi có API, thêm adapter chuyển response thật về shape component đang dùng; không để component phụ thuộc trực tiếp vào tên bảng ERD.
- Không coi enum, ID hoặc quan hệ trong fixture là API contract chính thức.
- Public sample có danh sách cho phép riêng; không lấy đại một generated story hoặc tài nguyên thuộc Child để công khai.
- Không đưa API secret, tài khoản thử thật, thông tin trẻ thật hoặc khóa thanh toán vào mã frontend.

**Shape tối thiểu đề xuất cho sample story:** `id`, `slug`, `title`, `summary`, `category`, `cover`, `coverAlt`, `pages`, `quiz`, `isDemo`.

Mỗi page có ID ổn định, số thứ tự, văn bản, ảnh/alt; audio/timestamps là tùy chọn. Tránh thiết kế bắt buộc audio ngay khi đang làm giao diện đọc.

**Cấu hình khả năng:** đánh dấu rõ demo mode, trạng thái chính sách gói và URL tải app. Cờ UI chỉ điều khiển hiển thị, không có giá trị bảo mật hoặc xác nhận quyền mua.

### 10.4. Cần thống nhất với backend ở giai đoạn tích hợp

1. Danh sách và chi tiết truyện mẫu nào được public; nguồn ảnh/audio công khai.
2. Tìm kiếm/lọc/phân trang nếu kho mẫu tăng; shape response và lỗi.
3. Auth Parent, xác minh email, quên mật khẩu và phân luồng role.
4. Đầu nhận form liên hệ, giới hạn gửi và xử lý spam.
5. API gói và quyền lợi theo mục 8.3; hạn mức Family 100 lượt, tính regenerate, reset và cấp quyền sau thanh toán.
6. URL domain, cấu hình route khi refresh và chiến lược SEO trước ra mắt.

Không cần backend để hoàn thành bố cục, copy, responsive hoặc tương tác demo trong kế hoạch này.

## 11. Khả năng tiếp cận, hiệu năng và SEO

### 11.1. Khả năng tiếp cận

- Mỗi trang có một H1; thứ tự heading phản ánh cấu trúc nội dung.
- Có skip link tới main; landmarks header/nav/main/footer rõ ràng.
- Dùng được bằng bàn phím: menu, tìm kiếm, bộ lọc, tab, accordion, reader và quiz.
- Focus luôn thấy được, không bị sticky header che; kiểm tra phóng to chữ/trang 200%.
- Label form là phần tử hiển thị thật; placeholder không thay label.
- Ảnh có alt phù hợp; ảnh trang trí alt rỗng.
- Không dùng màu, âm thanh hoặc animation làm dấu hiệu duy nhất.
- Thông báo kết quả lọc, lỗi và hoàn tất thao tác cần được công nghệ hỗ trợ nhận biết mà không tự giành focus vô lý.
- Kiểm tra bảng màu sau khi thêm opacity, hover, disabled và ảnh nền; kết quả màu đặc ở mục 4 không thay thế kiểm thử thực tế.

### 11.2. Hiệu năng

- Không tải cả hai bảng thương hiệu gốc làm hình hiển thị nhỏ.
- Xuất ảnh đúng kích thước; khai báo width/height hoặc aspect-ratio để tránh nhảy layout.
- Ưu tiên tải ảnh hero; lazy-load ảnh phía dưới; không lazy-load nội dung hình quan trọng đầu trang.
- Chỉ tải các weight/subset font thực dùng và có tiếng Việt.
- Không thêm thư viện animation/chart cho các minh họa có thể làm nhẹ hơn.
- Mục tiêu nội bộ: LCP ≤ 2.5 giây, CLS ≤ 0.1 trên cấu hình đo đã ghi nhận; đây là mục tiêu, chưa phải kết quả đạt được.

### 11.3. SEO và độ tin cậy

- Title từng route; đề xuất trang chủ: “SketchTale — Cùng bé mở trang sách và trí tưởng tượng”.
- Meta description đề xuất: “Khám phá SketchTale, trải nghiệm truyện tương tác cho bé 3–6 tuổi cùng sự đồng hành của phụ huynh. Xem truyện mẫu và tìm hiểu sản phẩm.”
- Open Graph dùng asset riêng, URL/canonical theo domain thật khi có.
- Nội dung cốt lõi là HTML; không đặt toàn bộ nội dung marketing vào ảnh.
- Trước ra mắt cần chốt cách prerender các trang marketing trên nền Vite và kiểm tra HTML metadata khi chia sẻ; không cho rằng đổi title phía client đã giải quyết toàn bộ SEO.
- Prototype/staging không index; production có sitemap và robots đúng phạm vi. Không vô tình index dữ liệu demo như nội dung thương mại thật.
- Không thêm structured data đánh giá, giá hoặc tổ chức với dữ liệu bịa.
- Chỉ triển khai analytics khi có kế hoạch dữ liệu phù hợp; không thu tên trẻ, thông tin form hoặc nội dung riêng tư vào event.

## 12. Lộ trình triển khai và tiêu chí nghiệm thu

### Đợt 1 — Nền thương hiệu và trang chủ

**Làm:**

- Chuẩn bị các asset logo/linh vật tách riêng.
- Tạo tokens, typography, container, button, header/footer, route và 404.
- Dựng tám section trang chủ với nội dung tại mục 7.
- Tạo destination tối thiểu hợp lệ cho những liên kết đang hiển thị; ẩn liên kết chưa có đích.
- Làm responsive ngay từ đầu, không chờ hết desktop.

**Đạt khi:** nhận diện đúng SketchTale; hero/CTA rõ ở 1366×768; không có UI Vite còn sót; menu/anchor/404 hoạt động; không có nút chết hoặc thông tin quảng cáo bịa.

### Đợt 2 — Trải nghiệm công khai có tương tác

**Làm:**

- Thư viện truyện mẫu, tìm kiếm, bộ lọc và trạng thái.
- Hoàn thiện tối thiểu một truyện có đủ trang/ảnh/quiz; tăng lên ba truyện khi đã có đủ nội dung riêng.
- Reader và quiz hoạt động với dữ liệu mẫu.
- Demo cài đặt Parent theo từng hồ sơ.

**Đạt khi:** người mới hoàn thành luồng từ hero đến đọc hết một truyện; lọc/xóa lọc và chuyển hồ sơ đúng; không cần backend; không lưu dữ liệu thật của trẻ.

### Đợt 3 — Hoàn thiện trang thông tin và điểm nối tài khoản

**Làm:**

- Trang so sánh Free / Pro / Family theo mục 8.3, FAQ, liên hệ, dành cho phụ huynh và giới thiệu.
- Dựng giao diện Auth theo phạm vi thống nhất; phân biệt prototype với chức năng thật.
- Kiểm tra toàn bộ CTA/route, empty/error/loading và hành vi back/forward của trình duyệt.

**Đạt khi:** các trang thống nhất typography/màu; form không báo gửi hoặc tạo tài khoản giả; giá và quyền lợi đúng thông tin đã cung cấp; Family ghi rõ 100 lượt tạo nhân vật/tháng, chưa có giao dịch thật.

### Đợt 4 — Chuẩn bị phát hành và tích hợp

**Làm:**

- Chốt nội dung chính sách, đầu mối hỗ trợ, asset có quyền sử dụng.
- Kiểm tra accessibility, hiệu năng, SEO, metadata và refresh route trực tiếp.
- Nối API theo contract thật; bỏ nhãn demo chỉ đối với luồng đã hoạt động đầy đủ.
- Mở CTA tài khoản/tải app/thanh toán theo trạng thái thực, không mở đồng loạt bằng việc ẩn badge prototype.

**Đạt khi:** chức năng hiển thị đúng khả năng backend; lỗi có đường phục hồi; nội dung và chính sách được duyệt; không công khai tài nguyên thuộc trẻ.

### Checklist bàn giao giao diện

- [ ] Đúng palette gốc và cảm nhận 60% trắng/kem, 30% vàng, 10% accent.
- [ ] Logo không méo; không dùng nguyên bảng thương hiệu trong trang.
- [ ] Copy tiếng Việt không mất dấu/cắt dấu; H1 và CTA không bị đẩy khỏi hero trên laptop nhỏ.
- [ ] Kiểm tra ở 360, 390, 768, 1024, 1366 và 1440 px; không tràn ngang.
- [ ] Header, menu mobile, anchor và footer links có đích đúng.
- [ ] Dùng bàn phím hoàn thành luồng đọc mẫu; focus và trạng thái form rõ.
- [ ] Thư viện có kiểm thử tìm kiếm/lọc đồng thời, không kết quả, lỗi và retry.
- [ ] Reader có chặn trang trước ở đầu/trang sau ở cuối; quiz phản hồi đúng.
- [ ] Dữ liệu demo từng Child không lẫn nhau; không nhận dữ liệu trẻ thật.
- [ ] Giá đúng thông tin Free / 35.000đ / 89.000đ; không có đánh giá, số người dùng, thanh toán hoặc gửi form giả.
- [ ] Kiểm tra console, `npm run lint` và `npm run build` khi triển khai code.
- [ ] Có ảnh chụp desktop/mobile của giao diện thực để đối chiếu với kế hoạch.

## 13. Những điểm cần chốt tiếp — không chặn dựng giao diện

| Cần xác nhận                                                               | Mặc định để tiếp tục thiết kế                                                                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Luồng cá nhân hóa từ tranh/nhân vật hiện chính xác ra sao?                 | Giới thiệu tạo nhân vật AI theo gói mới; chức năng demo chỉ mở khi tích hợp thật                                                                       |
| Có file logo/linh vật tách riêng, nền trong suốt hay nguồn thiết kế không? | Giữ hai bảng làm tham chiếu; chưa coi chúng là asset production                                                                                        |
| Tên linh vật chính thức?                                                   | Gọi là “mèo linh vật SketchTale”, không tự đặt tên                                                                                                     |
| Có truyện và audio được phép công khai chưa?                               | Dùng nội dung mẫu đã đánh dấu; audio chỉ bật khi có file thật                                                                                          |
| Đã có bản app và URL store chưa?                                           | Ẩn CTA tải app                                                                                                                                         |
| Family có những hạn mức nào?                                               | Family có tối đa 5 hồ sơ, 100 lượt tạo nhân vật AI/tháng, 1 lần regenerate mỗi tranh và không giới hạn lượt xuất video. Prototype chưa cấp quyền thật. |
| Domain, email hỗ trợ và thông tin đơn vị vận hành?                         | Không bịa thông tin; chỉ hoàn thiện khi có nguồn thật                                                                                                  |
| Khi nào tích hợp Auth/API?                                                 | Frontend JavaScript/JSX, service mock và dữ liệu tách biệt                                                                                             |

**Thứ tự bắt đầu được đề xuất:** asset thương hiệu → tokens và khung public → hero/trang chủ → một truyện mẫu hoàn chỉnh → các trang thông tin → API và phát hành. Không cần làm dashboard ba role hoặc thanh toán trước để bắt đầu public website.
