---
name: security
description: Quy tắc và checklist bảo mật cho dự án LVTN. Dùng khi triển khai hoặc rà soát xác thực, phân quyền, OTP, nội dung trả phí, thanh toán, cấu hình môi trường hoặc hạ tầng.
---

# Security — Quy tắc bảo mật

Nguồn nghiệp vụ: mục "Yêu cầu phi chức năng — Bảo mật" trong `docs/Mo_Ta_He_Thong.md`. Áp dụng các quy tắc dưới đây khi triển khai chức năng liên quan và dùng checklist cuối file để rà soát.

## Xác thực, phân quyền và OTP

- Bốn vai trò: `STUDENT`, `INSTRUCTOR`, `ACCOUNTANT`, `ADMIN`. Ma trận quyền theo mục 3 của `Mo_Ta_He_Thong.md` là chuẩn.
- Dùng `JwtAuthGuard` toàn cục (mặc định mọi route cần đăng nhập), route công khai đánh dấu `@Public()`. Thêm `RolesGuard` + decorator `@Roles(...)` cho route theo vai trò. Mặc định là từ chối.
- Quyền chỉ tin phía server. Việc ẩn nút ở client chỉ để giao diện gọn, không phải biện pháp bảo vệ.
- Kiểm tra quyền sở hữu, không chỉ vai trò: giảng viên chỉ sửa khóa học của mình, học viên chỉ xem đơn hàng/chứng chỉ của mình.
- Mật khẩu băm bằng bcrypt hoặc argon2. Không bao giờ trả `password`/hash trong response, không ghi vào log.
- Access token có thời hạn ngắn. Cách lưu và làm mới token (ví dụ refresh token trong cookie `httpOnly`) chốt một lần, ghi vào `references/tech-stack.md`, dùng thống nhất.
- Chỉ lưu bản băm của OTP, hạn ngắn (ví dụ 5 phút), giới hạn số lần nhập sai, có thời gian chờ giữa các lần gửi lại.
- Giới hạn tần suất request bằng `@nestjs/throttler` ở các route OTP, đăng nhập.
- Quên mật khẩu không tiết lộ email có tồn tại hay không (cùng một thông báo cho mọi trường hợp).
- Không ghi OTP vào log, kể cả môi trường dev (dev có thể dùng mail test).

## Nội dung trả phí

- Id video, đường dẫn Zoom/Meet, bản record chỉ trả về khi người gọi có quyền: khóa miễn phí cần đã đăng ký; khóa Pro/Live cần đơn hàng ở trạng thái "Hoàn tất". API chi tiết khóa học công khai không được chứa các trường này.
- Mở bài tuần tự được kiểm tra ở server: không cho đánh dấu hoàn thành hoặc truy cập bài khi bài trước chưa hoàn thành. Sự kiện "xem hết video" từ trình phát phía client chỉ là tín hiệu, server quyết định mở bài.
- Chứng chỉ chỉ cấp khi server xác nhận đủ điều kiện hoàn thành. Mã chứng chỉ khó đoán (không tuần tự), trang tra cứu công khai chỉ trả thông tin tối thiểu cần để xác thực.

## Thanh toán và đơn hàng

- Số tiền tính ở server từ giá trong DB và mã giảm giá đã kiểm tra. Không nhận giá hay tổng tiền từ client.
- Tiền lưu bằng số nguyên VND (hoặc kiểu decimal), không dùng số thực.
- Mã đơn chỉ gồm chữ và số, không dấu, không khoảng trắng (ví dụ `DH3C7K2`), duy nhất.
- Webhook ngân hàng: xác thực chữ ký/khóa bí mật của dịch vụ trung gian; đối chiếu mã đơn + số tiền; chống xử lý trùng bằng mã giao dịch duy nhất (cùng giao dịch gửi nhiều lần chỉ xử lý một lần); lưu nhật ký mọi giao dịch nhận được.
- Endpoint thanh toán giả lập (dùng khi demo) phải bị tắt ở môi trường production bằng biến môi trường và có guard.
- Chuyển trạng thái đơn đi một chiều hợp lệ (Chờ thanh toán → Hoàn tất / Đã hủy), không cho đổi ngược tùy ý. Tác vụ hủy đơn quá hạn nằm ở `jobs/`.

## Cấu hình và hạ tầng

- Secret (JWT secret, mật khẩu SMTP, khóa webhook, thông tin DB) chỉ nằm trong `server/.env`, đọc qua `config/`, không gọi `process.env` rải rác trong service.
- `client/.env` chỉ chứa giá trị công khai (prefix `VITE_`, ví dụ URL API). Không bao giờ đặt secret vào đây vì sẽ lộ trong bundle trình duyệt.
- Cả hai `.env` nằm trong `.gitignore`; luôn có `.env.example` không chứa giá trị thật.
- Dùng `helmet`, cấu hình CORS chỉ cho domain client, bật HTTPS khi triển khai.
- Swagger chỉ bật ở môi trường dev (hoặc đặt sau xác thực).
- Không ghi mật khẩu, OTP, token, khóa bí mật vào log.

## Checklist rà soát

### Auth/OTP

- [ ] Mặc định route cần đăng nhập; route công khai được đánh dấu rõ, vai trò và quyền sở hữu được kiểm tra ở server.
- [ ] Mật khẩu chỉ lưu dạng băm; response không chứa mật khẩu/hash và log không chứa mật khẩu/hash hoặc token.
- [ ] OTP chỉ lưu dạng băm, có hạn dùng, giới hạn lần nhập và gửi lại; route được giới hạn tần suất.
- [ ] Luồng quên mật khẩu không tiết lộ email có tồn tại; OTP không xuất hiện trong log.
- [ ] Cách lưu và làm mới token nhất quán với quyết định trong `references/tech-stack.md`.

### Nội dung trả phí

- [ ] API công khai không trả id video, link live hoặc record; server chỉ trả nội dung khi người học có quyền tương ứng.
- [ ] Server kiểm tra điều kiện học tuần tự, không tin tín hiệu hoàn tất từ client.
- [ ] Server xác nhận điều kiện trước khi cấp chứng chỉ; mã chứng chỉ khó đoán và tra cứu công khai chỉ trả thông tin tối thiểu.

### Thanh toán

- [ ] Server tự tính số tiền từ dữ liệu DB và coupon đã kiểm tra; không tin giá/tổng tiền từ client.
- [ ] Kiểu lưu tiền, mã đơn và chuyển trạng thái đơn tuân thủ quy ước.
- [ ] Webhook được xác thực, đối chiếu mã đơn và số tiền; giao dịch trùng được xử lý idempotent và có nhật ký.
- [ ] Endpoint thanh toán giả lập bị vô hiệu hóa ở production.

### Cấu hình

- [ ] Secret chỉ ở `server/.env`; `client/.env` chỉ có biến `VITE_` công khai.
- [ ] `.env` được git-ignore và `.env.example` không chứa giá trị thật.
- [ ] CORS giới hạn domain client, `helmet` được dùng và HTTPS được bật khi triển khai.
- [ ] Swagger chỉ bật ở dev hoặc được đặt sau xác thực; log không chứa secret.
