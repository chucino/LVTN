# MÔ TẢ TỔNG QUÁT HỆ THỐNG

**Tên đề tài:** Xây dựng website đăng ký và học tập trực tuyến các khóa học lập trình cho trung tâm đào tạo

**Tên hệ thống:** [NextCode] – [Học hôm nay, kiến tạo ngày mai]

---

## 1. Giới thiệu

### 1.1. Bối cảnh

Nhiều người đi làm hoặc đang đi học muốn nâng cao kỹ năng lập trình nhưng không có thời gian đến lớp cố định. Hệ thống học tập trực tuyến cho phép họ học mọi lúc, mọi nơi, theo tiến độ của riêng mình thông qua các khóa học có video quay sẵn, học đúng lộ trình và nhận chứng chỉ khi hoàn thành.

### 1.2. Mục tiêu

- Cung cấp nền tảng đăng ký và học các khóa học lập trình trực tuyến.
- Hỗ trợ hai loại khóa học đều là video quay sẵn: khóa **miễn phí** và khóa **Pro** (có phí, nội dung chi tiết và đầy đủ hơn).
- Đảm bảo học viên học đúng lộ trình, hoàn thành nội dung thì được cấp chứng chỉ có thể xác thực.
- Hỗ trợ trung tâm quản lý khóa học, học viên, đơn hàng, doanh thu.

### 1.3. Đối tượng sử dụng

| Đối tượng              | Mô tả                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| Khách (chưa đăng nhập) | Xem trang chủ, tìm kiếm, xem thông tin khóa học, tra cứu chứng chỉ   |
| Học viên               | Đăng ký, học, thanh toán, đánh giá, nhận chứng chỉ                   |
| Giảng viên             | Tạo và quản lý khóa học của mình, theo dõi học viên                  |
| Kế toán                | Theo dõi đơn hàng, giao dịch, đối soát thanh toán, báo cáo doanh thu |
| Quản trị viên (Admin)  | Quản lý toàn bộ hệ thống, người dùng, phân quyền, duyệt khóa học     |

---

## 2. Phạm vi hệ thống

### 2.1. Trong phạm vi

- Đăng ký, đăng nhập, quên mật khẩu bằng OTP qua email.
- Quản lý và đăng ký hai loại khóa học (miễn phí, Pro).
- Giao diện học tập có khóa bài theo lộ trình.
- Thanh toán bằng chuyển khoản QR, quản lý đơn hàng và lịch sử giao dịch.
- Cấp, tải và xác thực chứng chỉ.
- Đánh giá khóa học, hỏi đáp, thông báo.
- Quản lý (khóa học, học viên, đơn hàng, mã giảm giá, người dùng) và thống kê.

### 2.2. Ngoài phạm vi (hướng phát triển)

Ứng dụng di động, chấm code tự động, chatbot AI hỗ trợ, thanh toán quốc tế, lớp học trực tuyến theo lịch qua Zoom/Google Meet (kèm bản record), tự xây dựng hệ thống họp video riêng.

---

## 3. Phân quyền người dùng

Hệ thống dùng mô hình **phân quyền theo vai trò (RBAC)**. Mỗi tài khoản có một vai trò, mỗi vai trò chỉ truy cập chức năng cần thiết.

| Chức năng                                | Học viên |    Giảng viên     | Kế toán | Admin |
| ---------------------------------------- | :------: | :---------------: | :-----: | :---: |
| Xem, tìm kiếm khóa học                   |    ✔     |         ✔         |    ✔    |   ✔   |
| Đăng ký, học, đánh giá khóa học          |    ✔     |                   |         |       |
| Tạo/sửa khóa học, bài giảng, trắc nghiệm |          | ✔ (khóa của mình) |         |   ✔   |
| Duyệt, ẩn, xóa khóa học                  |          |                   |         |   ✔   |
| Xem danh sách học viên theo khóa         |          | ✔ (khóa của mình) |    ✔    |   ✔   |
| Xem đơn hàng, giao dịch, doanh thu       |          |                   |    ✔    |   ✔   |
| Xác nhận thanh toán thủ công             |          |                   |    ✔    |   ✔   |
| Quản lý mã giảm giá                      |          |                   |    ✔    |   ✔   |
| Quản lý tài khoản, phân quyền            |          |                   |         |   ✔   |

**Ghi chú:** tài khoản Kế toán là vai trò tùy chọn. Nếu cần rút gọn, có thể gộp vào Admin mà không ảnh hưởng đến cấu trúc hệ thống.

---

## 4. Mô tả chức năng

### 4.1. Đăng ký, đăng nhập

**Đăng ký:**

1. Nhập họ tên, ngày sinh, nghề nghiệp, email, mật khẩu, xác nhận mật khẩu.
2. Chọn "Tiếp tục": hệ thống gửi email xác nhận chứa **mã OTP**; người dùng kiểm tra email đã đăng ký và nhập OTP để xác thực.
3. Chọn lĩnh vực muốn học (tiếng Anh, tin học, lập trình,...) từ danh sách có sẵn, hoặc bỏ qua bước này.

**Đăng nhập:** nhập email và mật khẩu.

**Quên mật khẩu:** có liên kết "Quên mật khẩu" ngay dưới ô nhập mật khẩu → nhập email đã đăng ký → hệ thống gửi OTP về email → nhập OTP → nếu đúng thì đặt mật khẩu mới và xác nhận lại → quay về giao diện chính và đăng nhập lại bằng mật khẩu mới.

**Quy tắc bảo mật:** OTP có thời hạn ngắn (ví dụ 5 phút), giới hạn số lần nhập sai, có chức năng gửi lại mã; mật khẩu được mã hóa; phiên đăng nhập dùng JWT.

### 4.2. Khóa học

**Thông tin chung của mọi khóa học:**

- Phù hợp với ai (người mới bắt đầu, có cơ bản, chuyên nghiệp,...).
- "Bạn học được gì trong khóa học?"
- Nội dung khóa học: số chương, số bài, tổng thời lượng.
- Yêu cầu với học viên: máy tính có internet, hệ điều hành, ý thức học, những lưu ý khi học.
- Giảng viên, đánh giá của học viên khác.

**Hai loại khóa học** (đều là video quay sẵn):

| Loại         | Điểm nổi bật                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Miễn phí     | Xem đầy đủ thông tin khóa học; bấm "Đăng ký học" là vào học ngay; lộ trình cơ bản                                                                                                          |
| Pro (có phí) | Lộ trình chi tiết, nhiều nội dung và bài tập hơn; bài ghi chép và tóm tắt dưới mỗi bài giảng; dự án thực hành (với khóa lớn); Flashcards ôn tập; mục "Câu hỏi cần rõ trước khi thanh toán" |

**Dự án thực hành (khóa Pro):** chỉ có ở khóa có nội dung tổng quan lớn, gồm hướng dẫn làm dự án liên quan đến bài học (ví dụ tạo một trang web) hoặc bài tập thực hành. Khóa nhỏ không có phần này. Dự án là phần học thêm, không phải điều kiện bắt buộc để nhận chứng chỉ.

**Flashcards (khóa Pro):** bộ câu hỏi trắc nghiệm liên quan đến khóa học để học viên ôn tập những gì đã học.

**"Câu hỏi cần rõ trước khi thanh toán" (khóa Pro):** phần giải đáp các câu hỏi thường gặp, mỗi câu hỏi kèm câu trả lời sơ bộ. Ví dụ:

- Khóa Pro có gì khác khóa Free?
- Sau khi thanh toán, khi nào tôi có thể học?
- Tôi có được hỗ trợ trong quá trình học không?
- Tôi muốn hỏi thì đăng câu hỏi ở đâu?

### 4.3. Giao diện học tập (bố cục 7/3)

- **Bên trái (7 phần):** video bài giảng; bên dưới là tên bài (ví dụ "1.1 Giới thiệu về…"), nội dung ghi chép và tóm tắt (với khóa Pro), gợi ý khóa học khác.
- **Bên phải (3 phần):** danh sách chương/bài (ví dụ chương 1 gồm bài 1.1, 1.2,...). Có nút **thu gọn/mở rộng**; khi thu gọn, video hiển thị toàn màn hình.
- **Học tuần tự:** học viên không thể học vượt. Vừa đăng ký khóa học thì chỉ mở bài đầu tiên, các bài và chương sau bị khóa. Bài tiếp theo chỉ mở khi hoàn thành bài trước:
  - Xem hết video giảng dạy, hoặc (với bài có kiến thức quan trọng) trả lời đúng câu trắc nghiệm sau video; trả lời đúng thì hệ thống giải thích vì sao đáp án đó đúng.
  - Không phải bài nào cũng có trắc nghiệm; bài thiên về lý thuyết, lịch sử, cài đặt chỉ cần xem hết video.
- Hệ thống lưu tiến độ, vị trí đang xem và cho phép học tiếp từ nơi đã dừng.
- Hoàn thành toàn bộ bài học thì được cấp chứng chỉ.

Khóa Pro dùng cùng bố cục này nhưng lộ trình chi tiết hơn, và dưới mỗi bài giảng có nội dung ghi chép của bài, cuối phần ghi chép có tóm tắt các nội dung trọng tâm.

### 4.4. Mua khóa học và thanh toán

Áp dụng cho khóa Pro. Khóa miễn phí không cần thanh toán.

1. Học viên chọn mua khóa Pro → màn hình xác nhận đơn: tên khóa, thông tin sơ bộ, giá gốc, giá ưu đãi (nếu có), ô nhập **mã giảm giá**, danh sách mã giảm giá có thể áp dụng (bấm vào để xem có mã nào dùng được), tổng tiền phải trả sau khi áp mã.
2. Bấm "Tiếp tục thanh toán" → màn hình thanh toán hiển thị số tiền cần chuyển và **mã QR** (quét thì tài khoản nhận, số tiền, nội dung được điền sẵn đúng). Bên cạnh mã QR là thông tin chuyển khoản dạng chữ, ví dụ: Ngân hàng, Số tài khoản, Tên tài khoản, Số tiền, Nội dung (mã đơn). Học viên có thể sao chép các thông tin này, quét QR trực tiếp, hoặc tải mã QR về máy để quét.
3. Sau khi nhận tiền đúng nội dung và số tiền, hệ thống chuyển đơn sang "Hoàn tất" và mở quyền học.
4. Đơn hàng quá thời hạn chờ thanh toán sẽ tự chuyển sang "Đã hủy".

**Cách xác nhận thanh toán:** hệ thống hỗ trợ ba mức, từ đơn giản đến đầy đủ:

- _Thủ công:_ kế toán/admin đối chiếu sao kê và bấm xác nhận.
- _Giả lập:_ endpoint mô phỏng thông báo từ ngân hàng (dùng khi demo).
- _Tự động:_ nhận webhook biến động số dư từ dịch vụ trung gian.

### 4.5. Chứng chỉ

- Cấp tự động khi học viên đạt điều kiện hoàn thành: xem hết các bài và đạt các câu trắc nghiệm/bài kiểm tra của khóa học.
- Mỗi chứng chỉ có **mã số duy nhất và mã QR**.
- Trang **tra cứu chứng chỉ công khai** cho phép bất kỳ ai xác thực tính hợp lệ.
- Học viên xem và tải chứng chỉ (ảnh/PDF) ở mục "Chứng chỉ của tôi".

### 4.6. Tiện ích cho học viên

| Mục               | Nội dung                                                                                                                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thông báo         | Thông báo hệ thống, xác nhận thanh toán, cấp chứng chỉ                                                                                                                                                                                                                           |
| Khóa học của tôi  | Các khóa đã đăng ký và tiến độ                                                                                                                                                                                                                                                   |
| Chứng chỉ của tôi | Xem, tải ảnh/PDF chứng chỉ                                                                                                                                                                                                                                                       |
| Trang cá nhân     | Avatar, tên, biểu đồ thời gian hoạt động 12 tháng, các khóa đã đăng ký                                                                                                                                                                                                           |
| Cài đặt           | Thông tin cá nhân (họ tên, ngày sinh, nghề nghiệp, email); **Đơn hàng** (tổng số, tên, mã, ngày giờ, tổng giá, đã thanh toán, còn lại, trạng thái; lọc: Tất cả / Chờ thanh toán / Hoàn tất / Đã hủy); **Lịch sử thanh toán** (số giao dịch, khóa học, mã đơn, ngày giờ, số tiền) |

### 4.7. Tìm kiếm và phân loại

- Tìm theo từ khóa.
- Phân loại theo loại khóa học: **khóa miễn phí** và **khóa Pro**.
- Có thể lọc thêm theo lĩnh vực, trình độ, giá, đánh giá.

### 4.8. Đánh giá khóa học

Học viên đã đăng ký chấm sao và bình luận; mọi người xem được điểm trung bình và các đánh giá khác. Giảng viên/Admin có thể phản hồi hoặc ẩn đánh giá vi phạm.

### 4.9. Hỏi đáp trong khóa học

Học viên đặt câu hỏi dưới từng bài giảng; giảng viên và học viên khác trả lời. Đây cũng là nơi học viên được hỗ trợ trong quá trình học.

### 4.10. Chức năng quản lý

- **Quản lý khóa học:** tạo/sửa/ẩn khóa (miễn phí hoặc Pro); quản lý chương, bài, video, trắc nghiệm, Flashcards, dự án, FAQ; khóa mới do giảng viên tạo cần Admin duyệt.
- **Quản lý học viên theo khóa:** số học viên đăng ký, ai đã thanh toán, ngày thanh toán, số tiền, giá khóa học, tiến độ học.
- **Quản lý đơn hàng, giao dịch, mã giảm giá.**
- **Quản lý người dùng, phân quyền, thông báo.**
- **Thống kê:** doanh thu theo ngày/tháng/khóa, học viên mới, khóa bán chạy, tỷ lệ hoàn thành; xuất Excel/PDF.

---

## 5. Giải pháp kỹ thuật

### 5.1. Công nghệ sử dụng

| Thành phần           | Công nghệ                                          |
| -------------------- | -------------------------------------------------- |
| Frontend             | Vue.js 3 + Vite (kèm Vue Router, Pinia, Axios)     |
| Giao diện            | Tailwind CSS + Vuetify                             |
| Backend              | NestJS (Node.js, TypeScript)                       |
| Cơ sở dữ liệu        | PostgreSQL hoặc MySQL (ORM: Prisma hoặc TypeORM)   |
| Xác thực, phân quyền | JWT + Guards theo vai trò (RBAC)                   |
| Gửi email OTP        | Nodemailer + Gmail SMTP                            |
| Tác vụ định kỳ       | @nestjs/schedule (hủy đơn quá hạn)                 |
| Tài liệu API         | Swagger                                            |
| Tạo chứng chỉ        | Tạo ảnh/PDF từ mẫu (ví dụ pdfkit hoặc html2canvas) |

### 5.2. Video bài giảng

- Dùng **video do chính trung tâm/giảng viên tự quay**.
- Lưu trữ: tải lên **YouTube ở chế độ "Không công khai" (Unlisted)** và nhúng bằng YouTube IFrame API; hoặc dùng Vimeo/dịch vụ lưu video; khi demo có thể dùng file MP4 cục bộ.
- Hệ thống đọc trạng thái phát của trình phát để xác định học viên đã xem hết video hay chưa.
- Không tải video của người khác về để sử dụng (vi phạm bản quyền).

### 5.3. Thanh toán QR

- Mã QR được tạo theo chuẩn **VietQR** từ: ngân hàng, số tài khoản, số tiền, nội dung chuyển khoản (mã đơn hàng).
- Mã đơn dùng chữ và số, không dấu, không khoảng trắng (ví dụ `DH3C7K2`) để ngân hàng không làm sai nội dung.
- Khi nhận thông báo biến động số dư, hệ thống đối chiếu **mã đơn + số tiền**; hợp lệ thì xác nhận đơn và mở quyền học. Xử lý chống trùng khi nhận cùng một giao dịch nhiều lần.

### 5.4. Kiến trúc tổng quan

```
Trình duyệt (Vue.js + Vuetify + Tailwind)
        │  REST API (JSON, JWT)
        ▼
Backend NestJS ── Cơ sở dữ liệu (PostgreSQL/MySQL)
   │      │
   │      ├── Gmail SMTP (OTP, thông báo)
   │      ├── Dịch vụ video (YouTube Unlisted / Vimeo / MP4)
   │      └── Dịch vụ tạo QR VietQR + webhook ngân hàng
   └── Lịch tác vụ định kỳ (hủy đơn quá hạn)
```

---

## 6. Yêu cầu phi chức năng

- **Bảo mật:** mã hóa mật khẩu, HTTPS, chống dò OTP, chỉ người đã thanh toán mới xem được nội dung Pro, kiểm tra quyền ở phía server.
- **Hiệu năng:** tải trang nhanh, video phát mượt (lưu trên dịch vụ riêng, không đặt trực tiếp trên server web).
- **Dễ sử dụng:** giao diện thân thiện, **responsive** trên điện thoại.
- **Tin cậy:** lưu nhật ký giao dịch, sao lưu dữ liệu định kỳ.
- **Dễ mở rộng:** tách module theo nghiệp vụ (auth, courses, orders, payments, certificates,...).

---

## 7. Giao diện chính

**Header:**

- Trái: logo, tên website hoặc slogan.
- Giữa: ô tìm kiếm và phân loại khóa học.
- Phải (chưa đăng nhập): Đăng ký, Đăng nhập.
- Phải (đã đăng nhập): Khóa học của tôi, Thông báo (biểu tượng chuông), avatar → menu gồm Trang cá nhân, Chứng chỉ của tôi, Cài đặt, Đăng xuất.

**Nội dung trang chủ:** khóa học nổi bật, khóa học Free, khóa học Pro.

**Footer:** logo, tên website, liên hệ, địa chỉ, kênh chính thức, hỗ trợ.

---

## 8. Quy trình nghiệp vụ chính

**Học khóa miễn phí:** Chọn khóa → Xem thông tin → Đăng ký học → Học tuần tự → Hoàn thành → Nhận chứng chỉ.

**Học khóa Pro:** Chọn khóa → Mua (áp mã giảm giá) → Thanh toán QR → Hệ thống xác nhận → Học tuần tự (ghi chép, Flashcards, dự án) → Hoàn thành → Nhận chứng chỉ.

---

## 9. Hướng phát triển

Ứng dụng di động; chấm bài lập trình tự động; chatbot AI hỗ trợ học viên; đăng nhập bằng Google; thanh toán quốc tế; gợi ý khóa học thông minh theo hành vi học.
