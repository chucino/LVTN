# Lộ trình phát triển, thư mục cần tạo và prompt cho agent

Đề tài: Website đăng ký và học tập trực tuyến các khóa học lập trình (xem `docs/Mo_Ta_He_Thong.md`).
Đặt file này tại `docs/Lo_Trinh_Phat_Trien.md`.

---

## 1. Nguyên tắc

1. **Thư mục chỉ tạo khi bắt đầu làm giai đoạn cần nó.** Không tạo trước các thư mục rỗng (Git cũng không theo dõi thư mục rỗng). Mỗi giai đoạn bên dưới ghi rõ thư mục nào cần tạo.
2. **Mỗi giai đoạn kết thúc bằng một thứ chạy được và demo được**, không để dở nhiều mảng cùng lúc.
3. **Làm theo chiều dọc**: mỗi chức năng làm xong cả server lẫn client rồi mới sang chức năng khác, thay vì làm hết server rồi mới làm client.
4. **Thứ tự dựa trên phụ thuộc**: không có tài khoản thì không có học viên; không có khóa học thì không có đăng ký; không có học tập thì không có chứng chỉ; có đủ khóa Free chạy trọn vẹn thì mới thêm thanh toán.
5. **Thiết kế dữ liệu cho cả ba loại khóa học (Free/Pro/Live) ngay từ đầu** (giai đoạn 3), nhưng chỉ làm đầy đủ tính năng của từng loại ở giai đoạn riêng. Đổi schema sau khi đã có dữ liệu và migration rất tốn công.
6. Mỗi giai đoạn chia thành các bước nhỏ; **mỗi bước là một nhiệm vụ** trong `tasks/` (theo skill `task-backup-safety`).

---

## 2. Tổng quan các giai đoạn

| GĐ  | Nội dung                                           | Kết quả demo được                                                     | Mức ưu tiên                          |
| --- | -------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| 0   | Chuẩn bị, đồng bộ skill, chốt quyết định công nghệ | Dự án sạch, skill khớp kiến trúc                                      | Bắt buộc                             |
| 1   | Nền tảng server + client                           | Client gọi được API server, DB kết nối, Swagger chạy                  | Bắt buộc                             |
| 2   | Tài khoản, OTP, đăng nhập, phân quyền              | Đăng ký bằng OTP, đăng nhập, route theo vai trò                       | Bắt buộc                             |
| 3   | Khóa học (xem, tìm, quản lý)                       | Trang chủ, danh sách, chi tiết khóa; giảng viên tạo khóa; admin duyệt | Bắt buộc                             |
| 4   | Học tập khóa miễn phí                              | Đăng ký học, học tuần tự, trắc nghiệm, lưu tiến độ                    | Bắt buộc                             |
| 5   | Chứng chỉ                                          | Hoàn thành khóa Free → nhận chứng chỉ → tra cứu công khai             | Bắt buộc                             |
| 6   | Mua khóa, mã giảm giá, thanh toán QR               | Mua khóa Pro, thanh toán, mở quyền học                                | Bắt buộc                             |
| 7   | Nội dung khóa Pro                                  | Ghi chép, Flashcards, dự án thực hành                                 | Nên làm                              |
| 8   | Khóa Live                                          | Lịch live, đường dẫn cho người đã mua, điểm danh, record              | Bắt buộc (vì là 1 trong 3 loại khóa) |
| 9   | Đánh giá, hỏi đáp, thông báo, trang cá nhân        | Đánh giá sao, hỏi đáp dưới bài, chuông thông báo                      | Nên làm                              |
| 10  | Thống kê và báo cáo                                | Dashboard doanh thu, xuất Excel/PDF                                   | Nên làm                              |
| 11  | Hoàn thiện, bảo mật, triển khai                    | Bản chạy ổn định, tài liệu                                            | Bắt buộc                             |

**Nếu thiếu thời gian, cắt theo thứ tự này (từ dễ cắt nhất):** webhook thanh toán tự động (giữ thủ công + giả lập) → xuất Excel/PDF → hỏi đáp trong khóa học → Flashcards và dự án thực hành → biểu đồ hoạt động 12 tháng. Những mục này đều nằm trong mức "nâng cao" của mô tả hệ thống nên cắt không làm hỏng luồng chính.

---

## 3. Chi tiết từng giai đoạn

### Giai đoạn 0 — Chuẩn bị

**Việc cần làm**

- Đồng bộ skill với kiến trúc dự tính (đổi tên thư mục, thêm skill `security`).
- Tạo `tasks/INDEX.md`, `tasks/task-1.md`, thư mục `backup/`, thêm `backup/` vào `.gitignore`.
- Dọn `server/src/controller`, `server/src/module`, `server/src/service` (thư mục rỗng cũ), kiểm tra `node_modules/` ở thư mục gốc (có vẻ cài nhầm).
- Quyết định về Git: một repo ở gốc hay hai repo riêng (hiện chỉ `server/` có `.git`).
- **Chốt 4 quyết định công nghệ** (agent sẽ không tự chọn):

| Hạng mục       | Gợi ý                                                         | Lý do                                                                                               |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Database + ORM | PostgreSQL + Prisma                                           | Schema và migration rõ ràng, type an toàn với TypeScript. TypeORM và MySQL vẫn ổn nếu bạn quen hơn. |
| Lưu JWT        | Access token ngắn hạn + refresh token trong cookie `httpOnly` | Cân bằng giữa đơn giản và an toàn.                                                                  |
| Lưu video      | YouTube Unlisted; MP4 cục bộ khi demo                         | Theo mô tả hệ thống mục 5.2.                                                                        |
| Thanh toán     | Làm thủ công + giả lập trước, webhook để sau                  | Theo mô tả hệ thống mục 4.4.                                                                        |

**Thư mục tạo:** `tasks/`, `backup/`, `.agent/skills/security/`

**Xong khi:** skill khớp kiến trúc, `tasks/` và `backup/` có, 4 quyết định đã ghi vào `references/tech-stack.md`.

### Giai đoạn 1 — Nền tảng

**Server:** cấu hình biến môi trường (`config/`), kết nối DB (`database/`), bộ lọc lỗi và pipe validate (`common/filters`, `common/pipes`), `main.ts` (ValidationPipe, helmet, CORS, Swagger chỉ ở dev), endpoint `/health`, script seed tài khoản admin.
**Client:** Tailwind + Vuetify (`plugins/vuetify.ts`, theme, icon Lucide), `router/`, `services/http.ts` (axios), `layouts/DefaultLayout`, trang chủ tạm, hàm tiện ích định dạng tiền VND và ngày giờ (`lib/`).
**Gốc:** `package.json` với `concurrently` để chạy cả hai bằng một lệnh (tùy chọn).

**Thư mục tạo:** `server/src/config`, `server/src/database`, `server/src/common/{filters,pipes}`, `client/src/{plugins,router,services,layouts,lib,types}`; `client/src/components/ui` khi có component nền tảng đầu tiên.

**Xong khi:** hai bên chạy được, client gọi `/health` thành công, Swagger mở được, DB có migration đầu tiên.

### Giai đoạn 2 — Tài khoản và phân quyền (mô tả hệ thống mục 3, 4.1)

**Chia bước:** 2.1 module `mail` (Nodemailer + Gmail SMTP) → 2.2 module `users` → 2.3 đăng ký + OTP → 2.4 đăng nhập + JWT → 2.5 quên mật khẩu → 2.6 guards phân quyền (`JwtAuthGuard` toàn cục, `@Public()`, `RolesGuard`, `@Roles()`) → 2.7 client: trang đăng ký (3 bước), đăng nhập, quên mật khẩu, `stores/auth`, guard router, header theo trạng thái đăng nhập.
**Admin tối thiểu:** tạo tài khoản giảng viên/kế toán (vì chưa có giao diện quản lý người dùng đầy đủ).

**Thư mục tạo:** `server/src/modules/{mail,users,auth}`, `server/src/common/{guards,decorators}`, `client/src/pages/auth`, `client/src/stores`, `client/src/composables`.

**Xong khi:** đăng ký bằng OTP được, OTP hết hạn/sai quá số lần bị chặn, đăng nhập đúng vai trò, route admin bị từ chối với học viên (kiểm tra bằng Swagger/Postman, không chỉ bằng giao diện).

### Giai đoạn 3 — Khóa học

**Chia bước:** 3.1 schema khóa học cho cả 3 loại (Free/Pro/Live: loại, giá, trạng thái duyệt, thông tin chung ở mô tả mục 4.2) + chương + bài (module `courses`, `lessons`) → 3.2 API công khai: danh sách, chi tiết, tìm kiếm, lọc → 3.3 giảng viên tạo/sửa khóa, chương, bài (kiểm tra quyền sở hữu) → 3.4 admin duyệt/ẩn khóa → 3.5 client: trang chủ (nổi bật, Free, Pro, Live), danh sách + tìm kiếm, chi tiết khóa → 3.6 client: trang quản lý khóa của giảng viên và duyệt khóa của admin.
Chưa trả video id/đường dẫn live trong API công khai (xem skill `security` mục nội dung trả phí).

**Thư mục tạo:** `server/src/modules/{courses,lessons}`, `client/src/pages/{public,instructor,admin}`, `client/src/components/course`.
(Nếu bạn giữ cấu trúc phẳng `pages/` thì đặt tên file theo nhóm, ví dụ `pages/instructor/`, `pages/admin/`.)

**Xong khi:** giảng viên tạo khóa → admin duyệt → khóa hiện trên trang chủ cho khách xem.

### Giai đoạn 4 — Học tập khóa miễn phí (mục 4.3)

**Chia bước:** 4.1 module `enrollments` (đăng ký học khóa Free) → 4.2 module `progress` (hoàn thành bài, vị trí đang xem, học tiếp) → 4.3 module `quizzes` (trắc nghiệm có giải thích, không bắt buộc ở mọi bài) → 4.4 logic **mở bài tuần tự kiểm tra ở server** → 4.5 client: `LearningLayout` bố cục 7/3 (có thu gọn/mở rộng danh sách bài), `VideoPlayer` (YouTube IFrame API, phát sự kiện đã xem hết), danh sách bài có khóa, panel trắc nghiệm → 4.6 trang "Khóa học của tôi" kèm tiến độ.

**Thư mục tạo:** `server/src/modules/{enrollments,progress,quizzes}`, `client/src/components/learning`, `client/src/pages/student`.

**Xong khi:** học viên đăng ký khóa Free, học bài 1 xong mới mở bài 2, thoát ra vào lại thì học tiếp đúng vị trí, và **gọi API trực tiếp để nhảy cóc bài thì server từ chối**.

### Giai đoạn 5 — Chứng chỉ (mục 4.5)

**Chia bước:** 5.1 điều kiện hoàn thành và tự cấp chứng chỉ → 5.2 mã duy nhất khó đoán + mã QR → 5.3 trang tra cứu công khai → 5.4 tạo ảnh/PDF để tải → 5.5 client: "Chứng chỉ của tôi", trang tra cứu.

**Thư mục tạo:** `server/src/modules/certificates`, `client/src/pages/student` (thêm trang), trang tra cứu trong `client/src/pages/public`.

**Xong khi:** hoàn thành khóa Free → nhận chứng chỉ → người ngoài tra cứu được. **Đây là mốc demo đầu tiên của luận văn**; các giai đoạn sau là thêm giá trị lên luồng đã chạy.

### Giai đoạn 6 — Mua khóa và thanh toán QR (mục 4.4, 5.4)

**Chia bước:** 6.1 module `coupons` → 6.2 module `orders` (tạo đơn, tính tiền **ở server**, mã đơn dạng `DH3C7K2`, trạng thái, hết hạn) → 6.3 module `payments`: sinh mã VietQR + xác nhận **thủ công** (kế toán/admin) → 6.4 endpoint **giả lập** thông báo ngân hàng (tắt ở production bằng biến môi trường) → 6.5 `jobs/` hủy đơn quá hạn (`@nestjs/schedule`) → 6.6 mở quyền học khóa Pro khi đơn "Hoàn tất" (cập nhật kiểm tra quyền ở `enrollments`) → 6.7 client: màn hình xác nhận đơn, màn hình QR, Cài đặt → Đơn hàng + Lịch sử thanh toán, trang kế toán/admin quản lý đơn và mã giảm giá.
Webhook tự động: để giai đoạn 11 nếu còn thời gian.

**Thư mục tạo:** `server/src/modules/{coupons,orders,payments}`, `server/src/jobs`, `client/src/pages/student` (đơn hàng, thanh toán), `client/src/components/order`.

**Xong khi:** mua khóa Pro → quét QR/thanh toán giả lập → đơn "Hoàn tất" → học được; chưa thanh toán thì **không** lấy được nội dung bằng cách gọi API trực tiếp; đơn quá hạn tự hủy.

### Giai đoạn 7 — Nội dung khóa Pro (mục 4.2)

Ghi chép và tóm tắt dưới bài, Flashcards ôn tập, dự án thực hành, mục "Câu hỏi cần biết trước khi thanh toán".
**Thư mục tạo:** `server/src/modules/{flashcards,projects}`, `client/src/components/learning` (thêm Flashcards, ghi chép).
Lưu ý: tên `projects` dễ gây nhầm trong code; nếu đổi thành `assignments` hoặc `course-projects` thì cập nhật skill cho khớp.

### Giai đoạn 8 — Khóa Live (mục 4.2, 5.3)

**Chia bước:** 8.1 module `live-sessions` (giảng viên nhập đường dẫn Zoom/Meet, lịch) → 8.2 chỉ học viên đã thanh toán thấy đường dẫn → 8.3 điểm danh (module `attendance`) → 8.4 bản record (gắn vào khóa record) → 8.5 `jobs/` nhắc lịch live → 8.6 mở rộng điều kiện cấp chứng chỉ cho khóa Live (điểm danh + dự án) → 8.7 client: "Lịch live", trang giảng viên quản lý buổi học và điểm danh.

**Thư mục tạo:** `server/src/modules/{live-sessions,attendance}`, `client/src/pages/instructor` (thêm trang live).

### Giai đoạn 9 — Tương tác và tiện ích (mục 4.6, 4.8, 4.9)

`reviews` (đánh giá sao, bình luận, giảng viên/admin phản hồi hoặc ẩn), `questions` (hỏi đáp dưới từng bài), `notifications` (hệ thống, nhắc live, xác nhận thanh toán, cấp chứng chỉ; chuông trên header), trang cá nhân (avatar, biểu đồ hoạt động 12 tháng), Cài đặt.
**Thư mục tạo:** `server/src/modules/{reviews,questions,notifications}`.
Không dùng `v-html` với nội dung người dùng nhập (đánh giá, hỏi đáp).

### Giai đoạn 10 — Thống kê (mục 4.10)

Doanh thu theo ngày/tháng/khóa, học viên mới, khóa bán chạy, tỷ lệ hoàn thành; xuất Excel/PDF.
**Thư mục tạo:** `server/src/modules/statistics`, `client/src/pages/admin` (dashboard).

### Giai đoạn 11 — Hoàn thiện

Rà soát bảo mật theo checklist skill `security`; kiểm tra responsive trên điện thoại; viết test cho phần quan trọng (auth, đơn hàng, tiến độ, chứng chỉ); webhook thanh toán thật (tùy chọn); sao lưu dữ liệu định kỳ; triển khai; viết tài liệu luận văn dựa trên `docs/`.
Nếu muốn dùng `shared/types/`: làm thành một nhiệm vụ riêng, chỉ làm khi API đã ổn định, và phải cấu hình đúng cho build của NestJS (xem skill `project-architecture`).

---

## 4. Prompt cho agent

### 4.0. Prompt mẫu chung (dùng cho mọi nhiệm vụ)

Thay phần trong `< >`. **Mỗi lần chỉ giao một bước nhỏ** (ví dụ "2.3 đăng ký + OTP"), không giao cả giai đoạn.

```
Hãy đọc skill project-architecture và task-backup-safety trong .agent/skills/, và skill security nếu nhiệm vụ đụng tới đăng nhập, phân quyền, thanh toán hoặc nội dung trả phí. Đọc thêm docs/Mo_Ta_He_Thong.md mục <số mục liên quan>.

Nhiệm vụ: <mô tả cụ thể, ví dụ: "Bước 2.3 - Đăng ký tài khoản có xác thực OTP qua email (cả server và client)">.

Quy trình bắt buộc:
1. Ghi nhiệm vụ vào tasks/ theo skill task-backup-safety trước khi làm.
2. Trước khi viết code, đưa ra kế hoạch: liệt kê file/thư mục sẽ tạo hoặc sửa, endpoint, và những điểm bạn chưa chắc. Sau đó DỪNG và chờ tôi xác nhận.
3. Chỉ tạo thư mục và file cần cho nhiệm vụ này, không tạo trước thư mục rỗng cho chức năng khác.
4. Backup trước khi sửa file thuộc diện bắt buộc (theo skill).
5. Không tự chọn công nghệ hoặc thư viện chưa được chốt trong references/tech-stack.md. Nếu cần thêm thư viện, hỏi tôi và làm theo quy trình thêm công nghệ.
6. Không tin dữ liệu quan trọng từ client (giá, vai trò, quyền); kiểm tra ở server.
7. Sau khi xong: chạy build, lint và test liên quan; đánh dấu nhiệm vụ hoàn thành; tóm tắt thay đổi; hướng dẫn tôi cách tự kiểm tra bằng tay (kèm ví dụ request nếu là API).
```

### 4.1. Giai đoạn 0A — Đồng bộ skill với kiến trúc dự tính

```
Hãy đọc kỹ .agent/skills/project-architecture/SKILL.md, references/tech-stack.md, .agent/skills/task-backup-safety/SKILL.md và docs/Mo_Ta_He_Thong.md.

Nhiệm vụ: cập nhật các skill cho khớp với kiến trúc tôi đã chọn, và tách bảo mật thành skill riêng.

1. Trong project-architecture/SKILL.md và references/tech-stack.md, sửa cho khớp:
   - Client dùng pages/ (thay cho views/) và lib/ (thay cho utils/).
   - Server dùng coupons/ (thay cho discounts/). Danh sách module lấy theo: auth, users, courses, lessons, enrollments, progress, quizzes, flashcards, projects, live-sessions, attendance, orders, payments, coupons, certificates, reviews, questions, notifications, statistics, cộng thêm mail. Thư mục server/src/common gồm decorators, filters, guards, interceptors, pipes, utils; ngoài ra có config, database, jobs.
   - Ghi rõ nguyên tắc: thư mục chỉ được tạo khi bắt đầu làm chức năng cần nó, không tạo trước thư mục rỗng.
   - shared/types/: ghi là "kế hoạch, chưa tạo". Chỉ tạo khi có nhiệm vụ riêng, vì build bằng tsc của NestJS dễ bị đổi cấu trúc dist/ khi code nằm ngoài server/. Trong lúc chưa có, client tự khai báo type trong client/src/types theo DTO của server.
   - package.json ở thư mục gốc: chỉ dùng để chạy đồng thời client và server (concurrently), không chứa dependency của ứng dụng.
2. Tách mục "Quy tắc bảo mật" của project-architecture thành skill mới .agent/skills/security/SKILL.md, có frontmatter name/description đúng định dạng, mở rộng thêm checklist rà soát bảo mật theo từng nhóm (auth/OTP, nội dung trả phí, thanh toán, cấu hình). Trong project-architecture chỉ giữ một đoạn ngắn trỏ tới skill security và cập nhật checklist tương ứng.
3. Giữ nguyên nội dung còn lại, không thêm quy tắc mới ngoài những gì nêu trên.

Quy trình: ghi nhiệm vụ vào tasks/ (tạo tasks/INDEX.md và tasks/task-1.md nếu chưa có), backup các file skill trước khi sửa vào backup/ theo đúng skill task-backup-safety, rồi đưa tôi bản tóm tắt chênh lệch trước/sau và dừng chờ tôi xác nhận trước khi ghi đè.
```

### 4.2. Giai đoạn 0B — Dọn dẹp và khởi tạo

```
Hãy đọc skill task-backup-safety và project-architecture.

Nhiệm vụ: khởi tạo hạ tầng làm việc cho dự án.
1. Tạo tasks/INDEX.md và tasks/task-1.md (nếu chưa có), tạo thư mục backup/ và thêm dòng "backup/" vào .gitignore ở gốc.
2. Kiểm tra node_modules/ ở thư mục gốc LVTN/: báo cho tôi biết nó có package.json đi kèm hay không và nội dung bên trong. KHÔNG xóa, chỉ báo cáo.
3. Liệt kê các thư mục rỗng server/src/controller, server/src/module, server/src/service và file app.controller.ts, app.service.ts mặc định. Đề xuất cách xử lý nhưng chưa xóa gì cho tới khi tôi xác nhận.
4. Kiểm tra .gitignore ở gốc, server/.gitignore, client/.gitignore: có ignore đúng .env, node_modules, dist, backup chưa. Đề xuất bổ sung nếu thiếu.
5. Tạo server/.env.example và client/.env.example (không chứa giá trị thật) cho các biến chắc chắn cần: cổng server, URL API cho client (VITE_API_URL).
6. Tóm tắt trạng thái Git hiện tại (repo nào có, repo nào chưa) và liệt kê các lựa chọn để tôi quyết. KHÔNG tự git init, không xóa .git, không gộp repo.

Không tạo thêm thư mục khác. Dừng chờ tôi xác nhận ở các điểm đã nêu.
```

### 4.3. Giai đoạn 1 — Nền tảng (chạy từng bước)

```
Đọc skill project-architecture, task-backup-safety và references/tech-stack.md. Mô tả hệ thống mục 5 và 6.

Nhiệm vụ 1.1 (server): thiết lập nền tảng NestJS. Gồm: cấu hình biến môi trường qua @nestjs/config (đọc và validate tập trung trong src/config, không dùng process.env rải rác), kết nối DB theo lựa chọn đã ghi trong tech-stack.md (nếu chưa chốt thì dừng lại và hỏi tôi), exception filter tập trung, ValidationPipe toàn cục (whitelist, forbidNonWhitelisted, transform), helmet, CORS chỉ cho origin của client, Swagger chỉ bật ở môi trường dev, endpoint GET /health. Chưa tạo module nghiệp vụ nào.

Các quy trình bắt buộc như prompt mẫu chung (ghi task, kế hoạch và chờ xác nhận, backup file quan trọng, chỉ tạo thư mục cần thiết, chạy build/lint/test, hướng dẫn tôi kiểm tra bằng tay).
```

```
Nhiệm vụ 1.2 (client): thiết lập nền tảng Vue. Gồm: Tailwind CSS và Vuetify chạy cùng nhau (đọc tài liệu chính thức về việc dùng chung để tránh xung đột CSS nền, ghi cách chọn vào lịch sử trong tech-stack.md), plugins/vuetify.ts với theme và alias icon trỏ về lucide-vue-next, router/, services/http.ts (axios với baseURL từ VITE_API_URL, interceptor sẵn cho token và 401), layouts/DefaultLayout có header và footer đúng mô tả mục 7 của Mo_Ta_He_Thong.md (header chưa đăng nhập: Đăng ký, Đăng nhập), một trang chủ tạm gọi thử /health, lib/ có hàm định dạng tiền VND và ngày giờ. Giao diện phải responsive. Chưa làm chức năng nghiệp vụ.

Quy trình bắt buộc như prompt mẫu chung.
```

### 4.4. Giai đoạn 2 — Tài khoản

```
Đọc skill project-architecture, task-backup-safety và security. Mô tả hệ thống mục 3 và 4.1.

Nhiệm vụ: <bước cần làm, lần lượt: 2.1 module mail với Nodemailer + Gmail SMTP | 2.2 module users | 2.3 đăng ký với OTP email | 2.4 đăng nhập JWT | 2.5 quên mật khẩu bằng OTP | 2.6 guards phân quyền: JwtAuthGuard toàn cục, decorator @Public(), RolesGuard và @Roles() cho 4 vai trò STUDENT, INSTRUCTOR, ACCOUNTANT, ADMIN | 2.7 client: trang đăng ký (3 bước), đăng nhập, quên mật khẩu, stores/auth, router guard, header đã đăng nhập>.

Lưu ý riêng: OTP chỉ lưu bản băm, hạn 5 phút, giới hạn số lần nhập sai, có thời gian chờ khi gửi lại, dùng @nestjs/throttler cho route nhạy cảm; quên mật khẩu không tiết lộ email có tồn tại hay không; mật khẩu băm bằng bcrypt hoặc argon2; không ghi OTP, mật khẩu, token vào log; cách lưu và làm mới JWT theo quyết định đã ghi trong tech-stack.md (nếu chưa chốt thì hỏi tôi). Mật khẩu SMTP chỉ nằm trong server/.env.

Viết test cho: OTP hết hạn, OTP sai quá số lần, route chỉ-admin bị từ chối với học viên. Quy trình bắt buộc như prompt mẫu chung.
```

### 4.5. Giai đoạn 3 — Khóa học

```
Đọc skill project-architecture, task-backup-safety và security. Mô tả hệ thống mục 4.2, 4.7, 4.10.

Nhiệm vụ: <bước cần làm: 3.1 schema khóa học cho cả 3 loại Free/Pro/Live + chương + bài | 3.2 API công khai danh sách, chi tiết, tìm kiếm, lọc | 3.3 giảng viên tạo/sửa khóa, chương, bài (chỉ khóa của mình) | 3.4 admin duyệt/ẩn khóa | 3.5 client trang chủ, danh sách, chi tiết | 3.6 client quản lý khóa của giảng viên và duyệt khóa của admin>.

Ở bước 3.1: thiết kế schema đủ cho cả ba loại khóa, trước khi tạo migration hãy đưa sơ đồ bảng cho tôi xem và chờ xác nhận. Tiền lưu bằng số nguyên VND. Tuyệt đối không đưa id video hay đường dẫn live vào API công khai. Trạng thái khóa mới do giảng viên tạo là "chờ duyệt".

Quy trình bắt buộc như prompt mẫu chung; backup schema/migration trước khi sửa.
```

### 4.6. Giai đoạn 4 — Học tập

```
Đọc skill project-architecture, task-backup-safety và security. Mô tả hệ thống mục 4.3.

Nhiệm vụ: <bước cần làm: 4.1 module enrollments (đăng ký học khóa Free) | 4.2 module progress (hoàn thành bài, vị trí đang xem) | 4.3 module quizzes | 4.4 logic mở bài tuần tự ở server | 4.5 client LearningLayout bố cục 7/3, VideoPlayer YouTube IFrame API, danh sách bài có khóa, panel trắc nghiệm | 4.6 trang Khóa học của tôi>.

Quy tắc: việc mở bài tuần tự phải được kiểm tra ở server; sự kiện "xem hết video" từ player chỉ là tín hiệu client gửi lên, server quyết định bài tiếp theo có mở hay không. Không phải bài nào cũng có trắc nghiệm. Trắc nghiệm có giải thích đáp án nhưng không trả đáp án đúng trước khi học viên trả lời. Viết test: gọi API đánh dấu hoàn thành bài 3 khi chưa xong bài 2 phải bị từ chối.

Quy trình bắt buộc như prompt mẫu chung.
```

### 4.7. Giai đoạn 5 — Chứng chỉ

```
Đọc skill project-architecture, task-backup-safety và security. Mô tả hệ thống mục 4.5.

Nhiệm vụ: <bước cần làm: 5.1 điều kiện hoàn thành và tự cấp chứng chỉ | 5.2 mã duy nhất khó đoán + QR | 5.3 trang tra cứu công khai | 5.4 tạo ảnh/PDF tải về | 5.5 client Chứng chỉ của tôi và trang tra cứu>. Điều kiện cho khóa Free: xem hết bài và đạt trắc nghiệm; phần điều kiện cho khóa Live để lại cho giai đoạn Live.

Quy tắc: mã chứng chỉ không tuần tự; trang tra cứu công khai chỉ trả thông tin tối thiểu để xác thực; chỉ cấp khi server xác nhận đủ điều kiện. Nếu cần thêm thư viện (QR, PDF), hỏi tôi và làm theo quy trình thêm công nghệ.

Quy trình bắt buộc như prompt mẫu chung.
```

### 4.8. Giai đoạn 6 — Thanh toán

```
Đọc skill project-architecture, task-backup-safety và security. Mô tả hệ thống mục 4.4 và 5.4.

Nhiệm vụ: <bước cần làm: 6.1 coupons | 6.2 orders | 6.3 payments: VietQR + xác nhận thủ công | 6.4 endpoint thanh toán giả lập | 6.5 jobs hủy đơn quá hạn | 6.6 mở quyền học khóa Pro khi đơn Hoàn tất | 6.7 client: xác nhận đơn, màn hình QR, Cài đặt → Đơn hàng và Lịch sử thanh toán, trang kế toán/admin quản lý đơn và mã giảm giá>.

Quy tắc bắt buộc: tổng tiền tính ở server từ giá trong DB và mã giảm giá đã kiểm tra, không nhận từ client; mã đơn chỉ gồm chữ và số không dấu, duy nhất; trạng thái đơn chuyển một chiều hợp lệ; endpoint giả lập phải bị tắt ở production bằng biến môi trường và có guard; mã giao dịch duy nhất để chống xử lý trùng; lưu nhật ký giao dịch. Trước khi chạy migration: backup schema vào backup/db/ và chờ tôi xác nhận.

Viết test: tính tiền với mã giảm giá, đơn quá hạn bị hủy, thanh toán trùng chỉ xử lý một lần, chưa thanh toán thì không lấy được nội dung khóa Pro.

Quy trình bắt buộc như prompt mẫu chung.
```

### 4.9. Giai đoạn 7 đến 10 — Prompt rút gọn

Dùng prompt mẫu chung (mục 4.0) và thay phần nhiệm vụ:

```
Giai đoạn 7 (nội dung Pro): "Bước 7.1 - module flashcards; 7.2 - module projects (dự án thực hành); 7.3 - ghi chép/tóm tắt dưới bài giảng và mục 'Câu hỏi cần biết trước khi thanh toán'; 7.4 - client tương ứng. Các nội dung này chỉ trả về cho người đã mua khóa."

Giai đoạn 8 (Live): "Bước 8.1 - module live-sessions; 8.2 - chỉ học viên đã thanh toán thấy đường dẫn Zoom/Meet; 8.3 - module attendance (điểm danh); 8.4 - bản record; 8.5 - jobs nhắc lịch live; 8.6 - mở rộng điều kiện cấp chứng chỉ khóa Live (điểm danh + dự án); 8.7 - client Lịch live và trang giảng viên quản lý buổi học."

Giai đoạn 9 (tương tác): "Bước 9.1 - reviews; 9.2 - questions (hỏi đáp dưới bài giảng); 9.3 - notifications và chuông trên header; 9.4 - trang cá nhân và Cài đặt. Nội dung người dùng nhập không được hiển thị bằng v-html."

Giai đoạn 10 (thống kê): "Bước 10.1 - module statistics (doanh thu theo ngày/tháng/khóa, học viên mới, khóa bán chạy, tỷ lệ hoàn thành); 10.2 - dashboard admin; 10.3 - xuất Excel/PDF. Chỉ kế toán và admin được xem."
```

### 4.10. Giai đoạn 11 — Rà soát bảo mật cuối

```
Đọc skill security và project-architecture.

Nhiệm vụ: rà soát toàn bộ dự án theo checklist trong skill security. KHÔNG tự sửa code. Với mỗi mục, báo: đạt / chưa đạt / chưa áp dụng, kèm file và dòng liên quan. Đặc biệt kiểm tra: mọi route có guard đúng và kiểm tra quyền sở hữu; không có secret trong client/.env hoặc bundle; endpoint thanh toán giả lập đã bị tắt khi NODE_ENV=production; Swagger đã tắt hoặc có bảo vệ ở production; API công khai không lộ video id/đường dẫn live; log không chứa OTP/mật khẩu/token. Kết quả là danh sách việc cần sửa theo mức độ nghiêm trọng, tôi sẽ chọn việc nào làm trước.
```

---

## 5. Mẹo dùng prompt hiệu quả

- **Một prompt, một bước.** Prompt càng gọn thì agent càng ít làm lệch hoặc làm thừa.
- **Luôn yêu cầu kế hoạch trước khi code** (đã nằm trong prompt mẫu). Đọc kế hoạch, nếu thấy agent định tạo thư mục hay thêm thư viện ngoài dự kiến thì chặn lại ngay.
- **Sau mỗi bước, tự kiểm tra bằng tay** theo hướng dẫn agent đưa ra, đặc biệt với phần bảo mật (gọi API trực tiếp bằng Swagger/Postman chứ không chỉ bấm trên giao diện).
- **Commit sau mỗi bước chạy được** (khi đã chốt cách dùng Git) để có điểm quay lại rõ ràng.
- Khi agent hỏi về điều chưa chốt (DB, ORM, cách lưu JWT...), trả lời và yêu cầu nó ghi vào `references/tech-stack.md` để các lần sau không hỏi lại.
