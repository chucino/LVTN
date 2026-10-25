# Tech Stack — Chi tiết công nghệ sử dụng

File này mô tả từng công nghệ của dự án: vai trò, quy ước sử dụng, ràng buộc. `SKILL.md` chỉ liệt kê tóm tắt và trỏ sang đây. Khi cần biết chi tiết một công nghệ, hoặc khi cân nhắc thêm công nghệ mới, đọc file này trước.

**Về phiên bản:** phiên bản chuẩn là phiên bản đang ghi trong `client/package.json` và `server/package.json`. Không nâng cấp phiên bản major khi chưa có task riêng (theo skill `task-backup-safety`, nâng cấp lớn là một refactor lớn cần backup). Cú pháp cài đặt và cấu hình của thư viện đổi theo phiên bản: khi cài thư viện mới, **làm đúng theo tài liệu chính thức hiện hành của phiên bản đang cài**, không viết từ trí nhớ.

Mỗi công nghệ dùng cùng một khuôn mẫu (xem cuối file) để khi thêm mới chỉ cần copy và điền.

---

## Cấu trúc thư mục đã chọn

- Chỉ tạo thư mục khi bắt đầu làm chức năng cần nó; không tạo trước thư mục rỗng.
- Client dùng `client/src/pages/` cho trang và `client/src/lib/` cho hàm dùng chung (không dùng `views/` hoặc `utils/`). Type phía client đặt trong `client/src/types/` theo DTO của server.
- Server tổ chức module dưới `server/src/modules/`: `auth`, `users`, `courses`, `lessons`, `enrollments`, `progress`, `quizzes`, `flashcards`, `projects`, `live-sessions`, `attendance`, `orders`, `payments`, `coupons`, `certificates`, `reviews`, `questions`, `notifications`, `statistics`, `mail`.
- `server/src/common/` gồm `decorators/`, `filters/`, `guards/`, `interceptors/`, `pipes/`, `utils/`; ngoài ra server có `config/`, `database/`, `jobs/`.
- `shared/types/` là kế hoạch, chưa tạo. Chỉ tạo khi có nhiệm vụ riêng vì build bằng `tsc` của NestJS dễ đổi cấu trúc `dist/` khi code nằm ngoài `server/`. Trong lúc chưa có, client tự khai báo type trong `client/src/types/` theo DTO của server.
- `package.json` ở thư mục gốc chỉ dùng `concurrently` để chạy đồng thời client và server, không chứa dependency của ứng dụng.

---

## Các quyết định công nghệ

Đã chốt ngày 2026-10-03. Muốn đổi một quyết định đã chốt thì làm thành task riêng, ghi lý do vào "Lịch sử thêm công nghệ".

| Hạng mục                               | Quyết định                                                                                                | Chi tiết ở mục             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------- |
| Cơ sở dữ liệu                          | **MongoDB**                                                                                               | Cơ sở dữ liệu và ODM       |
| ODM                                    | **Mongoose** (`@nestjs/mongoose`, `mongoose`)                                                             | Cơ sở dữ liệu và ODM       |
| Xác thực                               | **Access token JWT ngắn hạn (giữ trong bộ nhớ client) + refresh token xoay vòng trong cookie `httpOnly`** | Xác thực (JWT + RBAC)      |
| Băm mật khẩu                           | **argon2**                                                                                                | Xác thực (JWT + RBAC)      |
| OTP                                    | **Lưu trong DB (bản băm), không dùng Redis**                                                              | Email và OTP               |
| Lưu video                              | **YouTube Unlisted + YouTube IFrame API**; MP4 cục bộ chỉ khi demo/phát triển                             | Video bài giảng            |
| Mã QR thanh toán                       | **Server dựng link VietQR (img.vietqr.io), client hiển thị ảnh**                                          | Thanh toán                 |
| Xác nhận thanh toán                    | **Thủ công + giả lập trước (GĐ6)**; webhook để sau (GĐ11, tùy chọn)                                       | Thanh toán                 |
| Chứng chỉ                              | **PDF sinh ở server bằng `pdfkit` + `qrcode`**                                                            | Chứng chỉ và báo cáo       |
| Nội dung bài giảng (ghi chép, tóm tắt) | **Markdown, hiển thị qua `markdown-it` + `dompurify`**                                                    | Nội dung người dùng và XSS |
| Ảnh đại diện                           | **Lưu đĩa cục bộ `server/uploads/`**, giới hạn kích thước/loại file                                       | Upload file                |
| Biểu đồ                                | **Chart.js + `vue-chartjs`**                                                                              | Thư viện client            |
| Kiểm thử                               | **Vitest** (server và client); e2e server theo `vitest.config.e2e.ts`                                     | Kiểm thử                   |
| Log                                    | **Logger có sẵn của NestJS**, không thêm thư viện log                                                     | NestJS                     |

**Hoãn có chủ đích** (quyết khi tới giai đoạn đó, agent không tự chọn):

| Hạng mục                                                         | Quyết khi               | Ghi chú                                                    |
| ---------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| Nơi triển khai (hosting) và cách chạy PostgreSQL production      | GĐ11                    | Cần biết ngân sách và yêu cầu của khoa/trường              |
| Dịch vụ webhook ngân hàng (ví dụ SePay, Casso)                   | GĐ11, nếu còn thời gian | Phải đọc tài liệu dịch vụ khi làm, không viết theo trí nhớ |
| Cách chạy PostgreSQL ở máy phát triển (cài trực tiếp hay Docker) | GĐ1                     | Tùy máy của bạn; Docker không bắt buộc                     |
| Công cụ e2e giao diện (ví dụ Playwright)                         | GĐ11                    | Tùy chọn                                                   |

Agent **không tự chọn** các mục "hoãn có chủ đích" khi đang làm task khác: dừng lại, hỏi người dùng, rồi ghi quyết định vào mục "Lịch sử thêm công nghệ".

---

## TypeScript

- **Vai trò**: ngôn ngữ chính cho cả `server/src/` và `client/src/`. Không viết `.js` mới.
- **Cấu hình**: giữ `strict` bật ở cả hai `tsconfig`. Không tắt `strict`, `noImplicitAny` để "cho qua lỗi".
- **Quy ước**:
  - Không dùng `any` trừ khi có comment giải thích lý do (ví dụ thư viện thiếu type).
  - Ưu tiên `interface` cho object có thể mở rộng, `type` cho union/alias.
  - Enum dùng chung như vai trò, trạng thái đơn hàng định nghĩa ở cả server và client, giá trị chuỗi phải khớp nhau.

---

## Node.js

- **Vai trò**: runtime của server (NestJS) và công cụ build của client (Vite).
- **Phiên bản**: dùng bản LTS đang hỗ trợ; ghi vào `engines` của `package.json` nếu cần cố định.
- **Múi giờ và ngày giờ**: lưu thời gian ở dạng UTC trong DB; hiển thị theo múi giờ `Asia/Ho_Chi_Minh` ở client (dùng `Intl.DateTimeFormat` trong `client/src/lib/`, không thêm thư viện ngày giờ). Lịch live, hạn đơn hàng, hạn OTP đều tính trên UTC ở server.

---

## NestJS (server)

- **Vai trò**: framework backend, REST API trả JSON.
- **Quy ước**:
  - Tổ chức theo module nghiệp vụ trong `server/src/modules/` (xem `SKILL.md` mục 1, 2 và danh sách module ở phần Cấu trúc thư mục đã chọn).
  - Dependency injection chuẩn của Nest; không `new` service thủ công.
  - DTO + `ValidationPipe` cho mọi input; Guard cho xác thực/phân quyền; Exception Filter tập trung.
  - Log bằng `Logger` có sẵn của NestJS, không dùng `console.log` trong code nghiệp vụ; không ghi mật khẩu, OTP, token vào log.
- **Công cụ đã có sẵn trong `server/`**: Prettier (`.prettierrc`), oxlint (`oxlint.json`), Vitest (`vitest.config.ts`, `vitest.config.e2e.ts`). Dùng đúng các công cụ này, không thêm ESLint hay Jest song song.
- **Thư viện server** (cài khi có task cần, theo quy trình cuối file):

| Mục đích               | Thư viện                                                     | Giai đoạn |
| ---------------------- | ------------------------------------------------------------ | --------- |
| Biến môi trường        | `@nestjs/config`                                             | 1         |
| ORM + PostgreSQL       | `@prisma/client`, `@prisma/adapter-pg`, `pg`, `prisma` (dev) | 1         |
| Validate DTO           | `class-validator`, `class-transformer`                       | 1         |
| Bảo mật header         | `helmet`                                                     | 1         |
| Tài liệu API           | `@nestjs/swagger`                                            | 1         |
| JWT + guard            | `@nestjs/jwt` (guard tự viết, **không dùng Passport**)       | 2         |
| Cookie (refresh token) | `cookie-parser`                                              | 2         |
| Băm mật khẩu           | `argon2`                                                     | 2         |
| Giới hạn tần suất      | `@nestjs/throttler`                                          | 2         |
| Gửi email OTP          | `nodemailer` (Gmail SMTP)                                    | 2         |
| Tác vụ định kỳ         | `@nestjs/schedule`                                           | 6         |
| Chứng chỉ PDF, QR      | `pdfkit`, `qrcode`                                           | 5         |
| Xuất Excel             | `exceljs`                                                    | 10        |
| Upload ảnh đại diện    | `multer` (đi kèm `@nestjs/platform-express`)                 | 9         |

Lý do không dùng Passport: bảo vệ bằng một guard JWT tự viết với `@nestjs/jwt` đủ cho nhu cầu này và ít thành phần hơn; tài liệu NestJS có hướng dẫn kiểu này.

### Biến môi trường server dự kiến (chỉ tên, không ghi giá trị; thêm vào `server/.env.example` khi cần)

| Nhóm       | Biến                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Chung      | `NODE_ENV`, `PORT`, `CLIENT_ORIGIN`                                                                     |
| Database   | `DATABASE_URL`                                                                                          |
| JWT        | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`                          |
| Email      | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`                                         |
| OTP        | `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`                                    |
| Thanh toán | `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `ORDER_EXPIRE_MINUTES`, `PAYMENT_SIMULATION_ENABLED` |

---

## Vue 3 + Vite (client)

- **Vai trò**: toàn bộ giao diện người dùng trong `client/src/`.
- **Quy ước**:
  - Chỉ dùng Composition API với `<script setup lang="ts">`. Không viết Options API cho code mới.
  - Logic gọi API tách khỏi component: `services/` (gọi API) → `composables/` hoặc `stores/` (dùng trong UI).
  - Alias `@/` trỏ tới `client/src/`, cấu hình ở cả `vite.config.ts` và `tsconfig.app.json`.
  - Biến môi trường dùng prefix `VITE_`.
  - Player video: nhúng YouTube IFrame API trong một component riêng (ví dụ `components/learning/VideoPlayer.vue`), phát sự kiện "đã xem hết" lên trên; không rải logic player khắp nơi.
  - Form: dùng rules có sẵn của Vuetify; chưa thêm thư viện validate form riêng (cân nhắc lại bằng task riêng nếu form phức tạp nhiều).

### Vue Router

- Khai báo route trong `router/`, gắn `meta` (ví dụ `requiresAuth`, `roles`) và xử lý ở một navigation guard.
- Guard phía client chỉ để điều hướng, **không thay thế** kiểm tra quyền ở server.

### Pinia

- Một store cho một mảng nghiệp vụ (`auth.store.ts`...). Store gọi `services/`, không gọi axios trực tiếp.
- Access token giữ trong **bộ nhớ** (state của store), không lưu vào `localStorage`/`sessionStorage`. Không lưu secret trong store.

### Axios

- Một instance duy nhất ở `services/http.ts`: baseURL từ `VITE_*`, `withCredentials: true` (để gửi cookie refresh token), interceptor gắn access token vào header.
- Khi nhận 401: gọi `/auth/refresh` **một lần duy nhất** cho tất cả request đang chờ (tránh gọi refresh trùng lặp), rồi gửi lại request ban đầu; nếu refresh thất bại thì đăng xuất và chuyển về trang đăng nhập.

---

## Vuetify + Tailwind CSS (giao diện)

- **Vai trò**: Vuetify cung cấp component (form, dialog, bảng, snackbar...); Tailwind xử lý layout, khoảng cách, responsive, tiện ích.
- **Quy ước**:
  - Ưu tiên component Vuetify trước khi tự dựng bằng thẻ HTML + Tailwind.
  - Tailwind không dùng để "vá" lại giao diện bên trong component Vuetify bằng class tùy ý; cần đổi giao diện thì chỉnh theme hoặc props của Vuetify.
  - Không dùng giá trị tùy ý kiểu `w-[137px]`, `text-[#4f46e5]` trừ trường hợp bất khả kháng.
  - Màu/bo góc/font khai báo một nơi (theme Vuetify trong `plugins/vuetify.ts` + biến trong `style.css`), Tailwind dùng lại cùng giá trị.
  - Bố cục responsive theo breakpoint chung của Vuetify/Tailwind; kiểm tra màn hình điện thoại cho mọi trang mới.
- **Lưu ý kỹ thuật**: Tailwind (preflight/reset) và Vuetify đều có CSS nền, dễ chồng chéo khi dùng chung. Khi thiết lập lần đầu, đọc tài liệu chính thức của Vuetify về dùng cùng Tailwind/CSS layers, ghi cách đã chọn vào "Lịch sử thêm công nghệ". Cách khai báo token phụ thuộc phiên bản Tailwind đang cài (v3: `tailwind.config.ts`; v4: khối `@theme` trong CSS) — theo đúng phiên bản trong `client/package.json`.

---

## Lucide Icon (`lucide-vue-next`)

- **Vai trò**: bộ icon duy nhất của UI. Không trộn thêm bộ khác, không dùng emoji trong UI hệ thống.
- **Cách import**: từng icon riêng lẻ để giảm kích thước bundle:

  ```ts
  import { Search, Trash2, ChevronDown } from "lucide-vue-next";
  ```

- **Quy ước**:
  - Kích thước: 16px trong text/label, 20px trong button, 24px trong thanh điều hướng.
  - Màu lấy từ theme/class chung, không hardcode màu riêng cho icon.
  - Giữ `strokeWidth` mặc định trên toàn app.
  - Vuetify mặc định dùng bộ icon riêng (MDI) cho thành phần nội bộ; cấu hình icon aliases trong `plugins/vuetify.ts` để dùng Lucide thay thế, tránh phải kéo thêm một bộ icon thứ hai.

---

## Cơ sở dữ liệu và ORM (PostgreSQL + Prisma)

- **Vai trò**: lưu người dùng, khóa học, bài giảng, đơn hàng, giao dịch, tiến độ, chứng chỉ...
- **Lý do chọn PostgreSQL**: ràng buộc dữ liệu chặt (unique, foreign key, check), transaction đáng tin cậy cho đơn hàng và thanh toán, kiểu dữ liệu phong phú, và có nhiều nơi cho thuê DB miễn phí/giá rẻ khi triển khai.
- **Lý do chọn Prisma**: schema khai báo tập trung trong một file, migration rõ ràng, truy vấn có type theo TypeScript nên lỗi sai tên cột bị bắt lúc build thay vì lúc chạy. Với dự án làm một mình, điều này giảm lỗi đáng kể.
- **Lưu ý cài đặt (Prisma 7 trở lên)**: Prisma Client cần **driver adapter** (`@prisma/adapter-pg` cùng `pg`) và file cấu hình `prisma.config.ts` ở thư mục `server/`. Prisma 7 phát hành dạng ES module mặc định nên có thể cần cấu hình định dạng module để chạy với NestJS CommonJS. Cách làm chính xác thay đổi theo phiên bản, vì vậy: **trước khi cài, đọc hướng dẫn NestJS + Prisma hiện hành** (docs.nestjs.com mục Prisma và docs.prisma.io mục NestJS), kiểm tra `server/tsconfig.json` đang dùng CommonJS hay ESM, rồi làm đúng theo đó.
- **Cấu trúc**: `server/prisma/schema.prisma` + `server/prisma/migrations/`; `PrismaService` và `PrismaModule` đặt trong `server/src/database/` (module toàn cục).
- **Quy ước schema**:
  - Tên model `PascalCase` số ít (`Course`), trường `camelCase`, ánh xạ sang bảng `snake_case` số nhiều bằng `@@map` (`courses`).
  - Khóa chính dùng UUID (`String @id @default(uuid())`) để id không đoán được, tránh lộ số lượng bản ghi và giảm rủi ro truy cập trái phép bằng cách đoán id.
  - Mọi bảng có `createdAt`, `updatedAt`.
  - Vai trò, loại khóa học (Free/Pro/Live), trạng thái khóa học, trạng thái đơn hàng dùng `enum` của Prisma.
  - Tiền lưu bằng `Int` (đơn vị VND), không dùng số thực.
  - Không xóa mềm đại trà; dùng trạng thái (ví dụ khóa học "ẩn") khi nghiệp vụ cần.
  - Unique bắt buộc cho: email, mã đơn hàng, mã giao dịch ngân hàng, mã chứng chỉ; unique kép cho cặp (học viên, khóa học) ở bảng đăng ký học.
- **Quy ước truy vấn**:
  - Chỉ truy cập DB từ service (hoặc `*.repository.ts` nếu truy vấn phức tạp), không từ controller.
  - Các thao tác nhiều bước phải toàn vẹn (xác nhận thanh toán + mở quyền học + tạo thông báo) dùng `prisma.$transaction`.
  - Chống xử lý trùng một giao dịch ngân hàng bằng ràng buộc unique trên mã giao dịch, không chỉ kiểm tra bằng code.
- **Migration**:
  - Dev: `prisma migrate dev`; production: `prisma migrate deploy`. Không sửa schema bằng tay trên DB đang dùng.
  - Trước khi chạy migration: backup schema/dump vào `backup/db/` (skill `task-backup-safety`).
  - **Lệnh xóa dữ liệu** như `prisma migrate reset`, `prisma db push --force-reset`: chỉ chạy khi đã backup và được người dùng xác nhận rõ ràng.
- **Seed**: script seed tạo tài khoản admin và dữ liệu mẫu, đọc thông tin từ biến môi trường, không ghi mật khẩu cố định trong code.

---

## Xác thực (JWT + RBAC)

- **Vai trò**: đăng nhập, bảo vệ API, phân quyền bốn vai trò `STUDENT`, `INSTRUCTOR`, `ACCOUNTANT`, `ADMIN`.
- **Quy ước chung**: xem `.agent/skills/security/SKILL.md`.
- **Mô hình token đã chọn**:
  - **Access token**: JWT thời hạn ngắn (gợi ý 15 phút), gửi qua header `Authorization: Bearer`, client giữ trong bộ nhớ.
  - **Refresh token**: chuỗi ngẫu nhiên dài, thời hạn dài hơn (gợi ý 7 ngày), gửi bằng cookie `httpOnly`, `Secure` (ở production), `SameSite=Lax`, giới hạn `path` ở route `/auth`. JavaScript phía client không đọc được cookie này.
  - **Xoay vòng**: mỗi lần `/auth/refresh` cấp refresh token mới và vô hiệu hóa token cũ. DB chỉ lưu **bản băm** của refresh token (bảng riêng, có người dùng, hạn, trạng thái thu hồi). Nếu một refresh token đã bị thay thế mà vẫn bị dùng lại, thu hồi toàn bộ phiên của người dùng đó.
  - **Khôi phục phiên khi tải lại trang**: client gọi `/auth/refresh` lúc khởi động để lấy access token mới nếu cookie còn hiệu lực.
  - **Đăng xuất**: thu hồi refresh token ở server và xóa cookie.
  - Giá trị thời hạn chỉ là gợi ý, chốt khi làm Giai đoạn 2 và ghi vào biến môi trường.
- **CORS và cookie**: CORS chỉ cho `CLIENT_ORIGIN` với `credentials: true`. Khi phát triển, client và server chạy khác cổng trên `localhost` vẫn gửi được cookie. Khi triển khai, nên để client và API cùng domain gốc (ví dụ `app.example.com` và `api.example.com`); nếu khác site hoàn toàn thì cần `SameSite=None; Secure` và phải rà soát lại bảo vệ CSRF.
- **Băm mật khẩu**: `argon2` (cấu hình mặc định của thư viện hoặc theo khuyến nghị hiện hành của OWASP). Nếu cài `argon2` bị lỗi trên máy phát triển, hỏi người dùng trước khi đổi sang `bcrypt`/`bcryptjs`.
- **Guard**: `JwtAuthGuard` toàn cục + `@Public()` + `RolesGuard` + `@Roles()`, tự viết dựa trên `@nestjs/jwt`.
- **Không được làm**: tin vai trò/quyền do client gửi lên; trả hash mật khẩu; ghi token/OTP vào log; lưu access/refresh token vào `localStorage`.

---

## Email và OTP

- **Vai trò**: gửi OTP đăng ký/quên mật khẩu và thông báo qua email.
- **Gửi email**: `nodemailer` qua Gmail SMTP với **mật khẩu ứng dụng (App Password)** của tài khoản Gmail (cần bật xác minh 2 bước), không dùng mật khẩu đăng nhập Gmail. Gmail có giới hạn số thư gửi mỗi ngày, đủ cho demo luận văn.
- **Khi phát triển/kiểm thử**: ưu tiên dùng tài khoản test của Nodemailer (Ethereal) hoặc một Gmail riêng cho dự án, không dùng Gmail cá nhân.
- **Nội dung email**: tạo bằng chuỗi HTML đơn giản trong module `mail`, chưa thêm thư viện template.
- **OTP**:
  - Sinh bằng `crypto.randomInt` (6 chữ số), **không** dùng `Math.random`.
  - Lưu trong bảng DB của module `auth`: bản băm OTP, mục đích (đăng ký/quên mật khẩu), email, hạn dùng, số lần nhập sai, thời điểm gửi gần nhất. Không dùng Redis (không cần thêm hạ tầng cho quy mô này).
  - Quy tắc hạn dùng, giới hạn nhập sai, thời gian chờ gửi lại: xem skill `security` mục OTP; các giá trị cấu hình qua biến môi trường.
- **Throttler**: `@nestjs/throttler` dùng bộ nhớ trong của tiến trình là đủ khi chạy một instance; nếu sau này chạy nhiều instance thì phải cân nhắc lại.

---

## Video bài giảng

- **Quyết định**: video do trung tâm/giảng viên tự quay, tải lên **YouTube chế độ "Không công khai" (Unlisted)**, nhúng bằng **YouTube IFrame API**. Khi phát triển hoặc demo không có mạng, có thể dùng file MP4 cục bộ (đặt ngoài `client/src`, đưa vào `.gitignore` nếu nặng).
- **Lưu trong DB**: chỉ lưu **id video** (không lưu cả đường dẫn), kèm thời lượng nếu cần. Id video và đường dẫn live **không** có trong API công khai (xem skill `security`).
- **Giới hạn cần biết (ghi vào báo cáo luận văn)**: Unlisted không phải bảo mật tuyệt đối. Ai có id video vẫn xem được trên YouTube. Cách làm này chấp nhận được cho phạm vi luận văn; nếu cần chống chia sẻ nghiêm ngặt, hướng nâng cấp là dịch vụ lưu video có link ký thời hạn.
- **Phát hiện "xem hết video"**: dùng sự kiện trạng thái của player (kết thúc) kết hợp gửi tiến độ xem định kỳ lên server. Gợi ý: server coi bài hoàn thành khi nhận sự kiện kết thúc hoặc tiến độ xem đạt một ngưỡng cao (ví dụ 90%) và việc mở bài tiếp theo do server quyết định. Chốt ngưỡng cụ thể khi làm Giai đoạn 4.
- **Không làm**: tải video của người khác về để dùng (vi phạm bản quyền); không đặt video trực tiếp trên server web; không nhận upload file video lên server của dự án. Bản record buổi live cũng đăng lên YouTube Unlisted rồi dán id vào hệ thống.

---

## Thanh toán

- **Mã QR**: server dựng đường dẫn ảnh VietQR từ ngân hàng, số tài khoản, số tiền, nội dung chuyển khoản (mã đơn) bằng dịch vụ tạo ảnh VietQR công khai (img.vietqr.io); client chỉ hiển thị ảnh, **không tự ghép số tiền ở client**. Màn hình thanh toán luôn hiển thị thêm thông tin chuyển khoản dạng chữ (ngân hàng, số tài khoản, tên tài khoản, số tiền, nội dung) có nút sao chép, phòng khi dịch vụ ảnh không truy cập được. Đọc lại tài liệu dịch vụ khi làm để lấy đúng cú pháp URL.
- **Thông tin ngân hàng** (`BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`) đặt trong `server/.env`, không đặt ở client.
- **Mã đơn**: chữ và số, không dấu, không khoảng trắng, duy nhất (ví dụ `DH3C7K2`), sinh bằng nguồn ngẫu nhiên an toàn.
- **Xác nhận thanh toán — làm theo thứ tự**:
  1. **Thủ công** (GĐ6): kế toán/admin đối chiếu sao kê và bấm xác nhận.
  2. **Giả lập** (GĐ6): endpoint mô phỏng thông báo ngân hàng cho demo. Chỉ bật khi `PAYMENT_SIMULATION_ENABLED=true`, có guard, **tắt ở production**.
  3. **Webhook** (GĐ11, tùy chọn): nhận biến động số dư từ dịch vụ trung gian. Khi làm phải xác thực yêu cầu theo cơ chế của dịch vụ, đối chiếu mã đơn + số tiền, chống xử lý trùng bằng mã giao dịch duy nhất. Dịch vụ cụ thể chọn khi đến giai đoạn đó.
- **Hết hạn đơn**: `@nestjs/schedule` trong `server/src/jobs/` hủy đơn quá `ORDER_EXPIRE_MINUTES`.

---

## Chứng chỉ và báo cáo

- **Chứng chỉ**: sinh **PDF ở server** bằng `pdfkit`, nhúng mã QR tạo bởi `qrcode`; mã QR trỏ tới trang tra cứu công khai kèm mã chứng chỉ. Học viên tải PDF ở mục "Chứng chỉ của tôi".
- **Tiếng Việt trong PDF**: font mặc định của `pdfkit` không hiển thị đủ dấu tiếng Việt. Phải **nhúng font TrueType có hỗ trợ tiếng Việt** (ví dụ Roboto hoặc Noto Sans, giấy phép mở), đặt trong `server/assets/fonts/`. Kiểm tra bằng tên có nhiều dấu (ví dụ "Nguyễn Thị Ánh Tuyết").
- **Tải dưới dạng ảnh** (nếu muốn): trang xem chứng chỉ ở client có thể dùng `html2canvas` để xuất PNG; đây là phần tùy chọn, bản PDF từ server là bản chính.
- **Báo cáo thống kê**: Excel bằng `exceljs`; PDF dùng lại `pdfkit` và cùng font ở trên. Chỉ kế toán và admin được xuất.

---

## Nội dung người dùng và XSS

- **Nội dung do giảng viên nhập** (ghi chép, tóm tắt, mô tả khóa): lưu dạng **Markdown**; client hiển thị qua `markdown-it` rồi **luôn làm sạch bằng `dompurify`** trước khi gắn vào trang. Chỉ riêng trường hợp này mới được dùng `v-html`, và phải qua hai bước trên, gói trong một component dùng chung (ví dụ `components/ui/MarkdownView.vue`).
- **Nội dung do học viên nhập** (đánh giá, hỏi đáp, bình luận): coi là **văn bản thuần**, hiển thị bằng nội suy `{{ }}` của Vue, **không** dùng `v-html`, không cho phép HTML hay Markdown.
- **Tô sáng mã nguồn** trong bài giảng lập trình: tùy chọn, thêm `highlight.js` (hoặc tương đương) bằng task riêng nếu cần.

---

## Upload file

- **Phạm vi**: chỉ **ảnh đại diện** cần upload lên server. Video không upload (xem mục Video).
- **Lưu**: đĩa cục bộ trong `server/uploads/` (thêm vào `.gitignore`), tên file do server sinh ngẫu nhiên, **không dùng tên file người dùng gửi**.
- **Giới hạn**: kích thước tối đa nhỏ (gợi ý 2MB), chỉ nhận ảnh png/jpg/webp, kiểm tra loại file ở server (không tin phần mở rộng hay `Content-Type` do client gửi).
- **Hạn chế đã biết**: lưu đĩa cục bộ không phù hợp nếu triển khai lên nền tảng có ổ đĩa tạm thời; nếu gặp tình huống đó, hướng xử lý là chuyển sang dịch vụ lưu trữ đối tượng, làm bằng task riêng.

---

## Kiểm thử

- **Server**: Vitest cho unit test (cạnh file, `*.spec.ts`) và e2e theo cấu hình `vitest.config.e2e.ts`. Ưu tiên viết test cho: OTP (hết hạn, sai quá số lần), phân quyền, tính tiền đơn hàng và mã giảm giá, mở bài tuần tự, chống xử lý trùng giao dịch, điều kiện cấp chứng chỉ.
- **Client**: Vitest + `@vue/test-utils` cho component và composable quan trọng, thêm khi cần (không bắt buộc phủ đều).
- **E2E giao diện**: hoãn, quyết ở GĐ11.
- **Không** thêm Jest song song với Vitest.

---

## Thư viện client

Cài khi có task cần, theo quy trình cuối file:

| Mục đích                                     | Thư viện                                            | Giai đoạn |
| -------------------------------------------- | --------------------------------------------------- | --------- |
| Router, state, HTTP                          | `vue-router`, `pinia`, `axios`                      | 1         |
| Giao diện                                    | `vuetify`, `tailwindcss`, `lucide-vue-next`         | 1         |
| Hiển thị Markdown an toàn                    | `markdown-it`, `dompurify`                          | 3–4       |
| Biểu đồ thống kê, biểu đồ hoạt động 12 tháng | `chart.js`, `vue-chartjs`                           | 9–10      |
| Xuất ảnh chứng chỉ phía client (tùy chọn)    | `html2canvas`                                       | 5         |
| Hiển thị mã QR thanh toán                    | Không cần thư viện: hiển thị ảnh do server cung cấp | 6         |
| Kiểm thử component                           | `vitest`, `@vue/test-utils`                         | khi cần   |

---

## Quy trình thêm công nghệ mới

1. Cân nhắc: công nghệ hiện có có giải quyết được không? Chỉ thêm khi thực sự cần.
2. Thêm một mục mới vào file này theo khuôn mẫu bên dưới.
3. Cài vào đúng `package.json` (`server/package.json` nếu phục vụ server, `client/package.json` nếu phục vụ client). Backup `package.json` trước khi sửa.
4. Ghi vào "Lịch sử thêm công nghệ" kèm lý do.
5. Ghi thành một nhiệm vụ trong `tasks/task-N.md` (skill `task-backup-safety`).

### Khuôn mẫu cho một công nghệ mới

```md
## <Tên công nghệ>

- **Vai trò**: ...
- **Phiên bản**: theo package.json (ghi số cụ thể khi cần cố định)
- **Lý do thêm**: ...
- **Quy ước sử dụng**: ...
- **Ràng buộc / không được làm**: ...
```

---

## Lịch sử thêm công nghệ

Ghi theo thời gian mỗi khi có công nghệ được thêm hoặc quyết định được chốt:

```md
- 2026-10-02: Khởi tạo dự án — client: Vue 3 + Vite + TypeScript; server: NestJS + TypeScript (Prettier, oxlint, Vitest có sẵn). Giao diện dự kiến Vuetify + Tailwind CSS, icon lucide-vue-next.
- 2026-10-03: Chốt các quyết định còn mở — PostgreSQL + Prisma (adapter-pg); JWT access ngắn hạn trong bộ nhớ + refresh token xoay vòng trong cookie httpOnly; argon2; OTP lưu DB; video YouTube Unlisted; QR VietQR dựng ở server; thanh toán thủ công + giả lập trước; chứng chỉ PDF bằng pdfkit; nội dung Markdown qua markdown-it + dompurify; ảnh đại diện lưu đĩa cục bộ; Chart.js; Vitest. Hoãn: hosting, dịch vụ webhook, cách chạy PostgreSQL khi phát triển, e2e giao diện.
- 2026-10-11: Cập nhật quyết định DB theo lựa chọn của người dùng — Chuyển từ PostgreSQL + Prisma sang MongoDB + Mongoose (@nestjs/mongoose, mongoose); cấu hình gửi mail OTP bằng Gmail SMTP thật qua App Password ngay từ đầu.
```
