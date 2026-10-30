## [x] #001 - Cập nhật kiến trúc và tách skill bảo mật

- Bắt đầu: 2026-10-03 14:00
- Phạm vi: cả hai
- File liên quan: .agent/skills/project-architecture/SKILL.md, .agent/skills/project-architecture/references/tech-stack.md, .agent/skills/security/SKILL.md
- Mô tả: Đồng bộ quy ước kiến trúc đã chọn, tách checklist bảo mật thành skill riêng, giữ nguyên nội dung ngoài phạm vi được yêu cầu.
- Backup: backup/.agent/skills/project-architecture/SKILL.md.20261003-1400.bak; backup/.agent/skills/project-architecture/references/tech-stack.md.20261003-1400.bak
- Hoàn thành: 2026-10-03 14:08
- Tóm tắt thay đổi: Đồng bộ cấu trúc kiến trúc và tech-stack theo lựa chọn; tách checklist bảo mật sang skill riêng; backup hai file skill trước khi sửa.

## [x] #002 - Khởi tạo hạ tầng làm việc cho dự án

- Bắt đầu: 2026-10-03 14:35
- Phạm vi: cả hai
- File liên quan: .gitignore, client/.gitignore, server/.env.example, client/.env.example, server/src/controller/, server/src/module/, server/src/service/, server/src/app.controller.ts, server/src/app.service.ts, server/src/app.module.ts, tasks/INDEX.md, tasks/task-1.md
- Mô tả: Hoàn tất các quyết định Giai đoạn 0B: xóa ba thư mục rỗng đã xác nhận, bổ sung ignore ở root/client, giữ nguyên app scaffold và server ignore, không thao tác Git metadata; báo cáo ObserveModule.
- Backup: — (chỉ thêm quy tắc vào .gitignore và tạo file .env.example mới)
- Tiếp tục: 2026-10-03 14:56 theo xác nhận của người dùng
- Hoàn thành: 2026-10-03 14:58
- Tóm tắt thay đổi: Bổ sung ignore root/client theo xác nhận; xóa ba thư mục server/src rỗng; giữ app.controller.ts, app.service.ts, app.module.ts và server/.gitignore nguyên trạng; đã báo cáo node_modules, ObserveModule và trạng thái Git. Không thao tác .git.

## [x] #003 - Thiết lập MongoDB/Mongoose và xây dựng hệ thống Auth cho Server
- Bắt đầu: 2026-10-11 14:38
- Phạm vi: server
- File liên quan: package.json, .agent/skills/project-architecture/references/tech-stack.md, .env.example, .env, src/main.ts, src/app.module.ts, src/common/, src/database/, src/modules/mail/, src/modules/users/, src/modules/auth/
- Mô tả: Chuyển đổi công nghệ DB sang MongoDB + Mongoose theo lựa chọn của người dùng, tích hợp Gmail SMTP, xây dựng kiến trúc và module Auth hoàn chỉnh với RBAC, OTP, JWT Access/Refresh Token và bảo mật theo checklist.
- Backup: backup/server/package.json.20261011-1438.bak, backup/.agent/skills/project-architecture/references/tech-stack.md.20261011-1438.bak, backup/server/src/app.module.ts.20261011-1441.bak, backup/server/src/main.ts.20261011-1441.bak, backup/server/src/app.controller.ts.20261011-1445.bak, backup/server/src/app.service.ts.20261011-1445.bak
- Hoàn thành: 2026-10-11 14:48
- Tóm tắt thay đổi: Chuyển DB sang MongoDB + Mongoose; tạo User schema, Otp schema, RefreshToken schema; tạo MailModule (Gmail SMTP); xây dựng AuthModule gồm 11 API endpoints (đăng ký OTP, xác thực OTP, gửi lại OTP, đăng nhập, xoay vòng refresh token qua httpOnly cookie, đăng xuất, quên mật khẩu chống dò email, đặt lại mật khẩu, getMe, và 2 route test RBAC cho Admin/Instructor); tích hợp JwtAuthGuard toàn cục, RolesGuard, HttpExceptionFilter, TransformInterceptor, Throttler rate limiting, Swagger UI; viết unit test Vitest 100% pass, oxlint 0 error.

## [x] #004 - Đồng bộ thuộc tính sơ đồ lớp theo So_Do_Lop.md và thêm API Admin phân quyền tài khoản
- Bắt đầu: 2026-10-25 20:58
- Phạm vi: server
- File liên quan: docs/So_Do_Lop.md, src/common/constants/user-status.enum.ts, src/modules/users/schemas/user.schema.ts, src/modules/users/users.service.ts, src/modules/auth/schemas/otp.schema.ts, src/modules/auth/dto/register.dto.ts, src/modules/auth/dto/assign-role.dto.ts, src/modules/auth/auth.service.ts, src/modules/auth/auth.controller.ts, src/modules/auth/auth.service.spec.ts
- Mô tả: Rà soát và cập nhật thuộc tính các lớp User, Otp theo docs/So_Do_Lop.md (avatar, status, interestedCategories, codeHash, failedAttempts, dateOfBirth kiểu Date); thêm API Admin phân quyền cho tài khoản (PATCH /auth/users/:id/role); cập nhật DTOs, unit tests và tài liệu Postman.
- Backup: backup/server/src/modules/users/schemas/user.schema.ts.20261025-2058.bak, backup/server/src/modules/users/users.service.ts.20261025-2058.bak, backup/server/src/modules/auth/schemas/otp.schema.ts.20261025-2058.bak, backup/server/src/modules/auth/auth.service.ts.20261025-2058.bak, backup/server/src/modules/auth/auth.controller.ts.20261025-2058.bak
- Hoàn thành: 2026-10-25 21:03
- Tóm tắt thay đổi: Đồng bộ User schema (thêm avatar, status UserStatus PENDING/ACTIVE/LOCKED, interestedCategories dạng ObjectId Category, dateOfBirth Date); đồng bộ Otp schema (codeHash, failedAttempts, purpose, expiresAt, isUsed); tạo AssignRoleDto và endpoint PATCH /auth/users/:id/role (bảo vệ quyền ADMIN, cấm tự hạ quyền admin của chính mình, thu hồi refresh token của user được phân quyền); cập nhật unit tests đạt 6/6 pass, oxlint 0 warnings/errors, build NestJS thành công.

## [x] #005 - Tích hợp Auto-Seeder tài khoản ADMIN mặc định khi khởi chạy hệ thống
- Bắt đầu: 2026-10-25 21:27
- Phạm vi: server
- File liên quan: src/modules/users/users.service.ts
- Mô tả: Tự động khởi tạo tài khoản ADMIN mặc định (admin@nextcode.vn) khi server khởi động nếu cơ sở dữ liệu chưa có tài khoản Admin nào, giúp thuận tiện kiểm thử phân quyền ngay lập tức.
- Backup: backup/server/src/modules/users/users.service.ts.20261025-2127.bak
- Hoàn thành: 2026-10-25 21:28
- Tóm tắt thay đổi: Thêm hook onApplicationBootstrap trong UsersService để tự động seed tài khoản admin@nextcode.vn với mật khẩu Admin@123456 nếu chưa có ADMIN nào trong DB; build và vitest 6/6 tests pass.

## [x] #006 - Thiết kế và xây dựng giao diện hoàn chỉnh cho nhánh Auth (Client Vue 3 + Vuetify + Tailwind)
- Bắt đầu: 2026-10-25 21:43
- Phạm vi: client
- File liên quan: client/package.json, client/vite.config.ts, client/tsconfig.app.json, client/src/
- Mô tả: Cài đặt vue-router, pinia, axios, lucide-vue-next; cấu hình alias @/; thiết lập Http client Axios kèm token interceptor & cookie refresh token; xây dựng Auth Pinia store; xây dựng giao diện thẩm mỹ cao (Đăng nhập, Đăng ký, Xác thực OTP, Quên mật khẩu, Đặt lại mật khẩu, Dashboard thông tin cá nhân, Kiểm tra RBAC và Giao diện Admin phân quyền tài khoản).
- Backup: backup/client/package.json.20261025-2142.bak, backup/client/vite.config.ts.20261025-2142.bak, backup/client/tsconfig.app.json.20261025-2142.bak, backup/client/style.css.20261025-2142.bak
- Hoàn thành: 2026-10-25 21:55
- Tóm tắt thay đổi: Hoàn thiện frontend Vue 3 + Tailwind CSS + Vuetify + Lucide icons: Thiết lập Axios Http client bảo mật (Access Token lưu trong memory Pinia, Refresh Token lưu tự động trong HttpOnly cookie, cơ chế xoay vòng và hàng đợi làm mới token khi gặp lỗi 401); Xây dựng đầy đủ các màn hình giao diện (LoginPage có nút điền nhanh admin, RegisterPage với đầy đủ các trường khớp So_Do_Lop.md, VerifyOtpPage có bộ đếm ngược 5 phút và nút gửi lại mã có cooldown 60s, ForgotPasswordPage, ResetPasswordPage, DashboardPage hiển thị profile, chức năng làm mới token, khu vực kiểm tra RBAC Guards cho Admin/Instructor, và giao diện quản trị phân quyền tài khoản cho Admin); Đã chạy build vue-tsc và vite thành công không có lỗi; Đã kiểm thử tự động toàn diện qua Browser Subagent thành công.

## [x] #007 - Xây dựng layout công khai và trang chủ NextCode
- Bắt đầu: 2026-10-25 23:15
- Phạm vi: client
- File liên quan: client/src/router/index.ts, client/src/layouts/PublicLayout.vue, client/src/components/public/PublicHeader.vue, client/src/components/public/PublicFooter.vue, client/src/pages/public/HomePage.vue, client/src/components/course/CourseCard.vue, client/src/data/courses.ts, client/src/types/course.ts
- Mô tả: Thêm layout công khai responsive có Header/Footer và trang chủ NextCode theo phong cách Auth hiện có; tái sử dụng Auth store, Axios/API và router guard, không triển khai API khóa học hoặc trang đích giả.
- Backup: backup/client/src/router/index.ts.20261025-2337.bak (tái dựng từ HEAD khi ghi nhận bổ sung; không được tạo trước lúc sửa router)
- Hoàn thành: 2026-10-25 23:37 (ghi nhận bổ sung sau khi triển khai; thời điểm hoàn tất code ở lượt trước không được ghi riêng)
- Tóm tắt thay đổi: Đổi route `/` từ redirect dashboard sang trang chủ công khai bọc PublicLayout; thêm Header có tìm kiếm giao diện, trạng thái khách/đã đăng nhập, menu avatar và đăng xuất qua Auth store; thêm Footer dùng nội dung liên hệ giữ chỗ; xây Hero, lợi ích, khóa nổi bật/Free/Pro, quy trình 5 bước và CTA; thêm CourseCard cùng dữ liệu khóa học mẫu tách riêng. Tái sử dụng `isAuthenticated`, `refreshSession()`, `logout()` và endpoint `GET /auth/me` đã có ở frontend/backend, không thêm API. `npm run build` và `git diff --check` thành công; browser smoke test xác nhận trang chủ và guard chuyển khách chưa đăng nhập từ `/dashboard` sang `/login`, menu mobile có thể mở. Không xác minh được đăng nhập/đăng xuất thực tế vì API backend trả 502; kích thước viewport mobile trong browser tool không khớp kích thước đặt nên responsive geometry chưa được xác nhận đầy đủ. Dữ liệu khóa học vẫn là mẫu.

## [x] #008 - Thay logo mặc định bằng logo NextCode do người dùng cung cấp
- Bắt đầu: 2026-10-26 00:04
- Phạm vi: client
- File liên quan: client/public/logo.jpg, client/public/favicon.svg, client/src/components/public/PublicHeader.vue, client/src/components/public/PublicFooter.vue, client/src/layouts/AuthLayout.vue, client/src/pages/dashboard/DashboardPage.vue
- Mô tả: Thay các biểu tượng thương hiệu mặc định bằng ảnh logo người dùng cung cấp trên giao diện công khai, Auth, Dashboard và favicon; giữ nguyên tên NextCode và nội dung giao diện còn lại.
- Backup: backup/client/src/components/public/PublicHeader.vue.20261026-0004.bak, backup/client/src/pages/dashboard/DashboardPage.vue.20261026-0004.bak, backup/client/public/favicon.svg.20261026-0004.bak
- Hoàn thành: 2026-10-26 00:10
- Tóm tắt thay đổi: Dùng ảnh client/public/logo.jpg ở Header, Footer, AuthLayout và Dashboard; chuyển favicon trong client/index.html sang cùng ảnh JPEG. Giữ nguyên client/public/favicon.svg và client/public/logo.jpg đã có sẵn thay đổi trong worktree trước khi bắt đầu. Build/type-check thành công; browser xác nhận ảnh logo tải đúng 2048x2048 và favicon trỏ đến /logo.jpg. Còn cảnh báo build chunk lớn hơn 500 kB.

## [x] #009 - Hoàn thiện điều hướng trang chủ sau Auth và từ Dashboard
- Bắt đầu: 2026-10-26 00:38
- Phạm vi: client
- File liên quan: client/src/router/index.ts, client/src/pages/public/LoginPage.vue, client/src/pages/public/VerifyOtpPage.vue, client/src/pages/dashboard/DashboardPage.vue
- Mô tả: Sau đăng nhập/đăng ký thành công ưu tiên quay lại trang đích an toàn được guard yêu cầu, mặc định về trang chủ; làm logo NextCode trên Dashboard thành liên kết về trang chủ để người dùng luôn điều hướng được.
- Backup: backup/client/src/router/index.ts.20261026-0038.bak, backup/client/src/pages/dashboard/DashboardPage.vue.20261026-0038.bak
- Hoàn thành: 2026-10-26 00:42
- Tóm tắt thay đổi: Sau login, mặc định điều hướng về `/`; nếu guard truyền `redirect` nội bộ hợp lệ thì quay lại đúng trang được yêu cầu. Sau xác thực OTP đăng ký điều hướng về trang chủ. Người đã đăng nhập mở trang Login/Register cũng được chuyển về trang chủ thay vì Dashboard. Logo và tên NextCode trên Dashboard trở thành liên kết về `/`. `npm run build` và `git diff --check` thành công. Browser kiểm thử với API mock: login mặc định về trang chủ; truy cập Dashboard khi chưa đăng nhập rồi login thì trở lại Dashboard; logo Dashboard quay về trang chủ; xác thực OTP đăng ký quay về trang chủ. Dashboard hiện tại là Auth Portal hiển thị profile và công cụ kiểm thử Auth/RBAC, chưa phải dashboard học tập theo vai trò; chưa kiểm thử API thật.

## [x] #010 - Xây dựng API công khai danh mục và khóa học

- Bắt đầu: 2026-10-26 01:49
- Phạm vi: server
- File liên quan: .env.example, README.md, package.json, src/app.module.ts, src/common/constants/course*, src/modules/courses/, src/seeds/
- Mô tả: Xây dựng schema Mongoose cho Category/Course với Chapter/Lesson nhúng, API công khai danh mục và khóa học có tìm kiếm/lọc/sắp xếp/phân trang, serializer an toàn, recalculateTotals, seed mẫu idempotent và kiểm thử.
- Backup: backup/server/package.json.20261026-0149.bak; backup/server/src/app.module.ts.20261026-0149.bak
- Hoàn thành: 2026-10-26 02:07
- Tóm tắt thay đổi: Thêm Category/Course schema với Chapter/Lesson nhúng, enum/trình độ dùng chung, API công khai GET /categories, GET /courses, GET /courses/featured, GET /courses/:id; lọc/sắp xếp theo giá hiệu lực và phân trang ở MongoDB; serializer allow-list bảo vệ videoUrl/note/summary và dữ liệu User; thêm recalculateTotals, dữ liệu seed idempotent 5 danh mục/2 instructor/11 khóa, chặn production, npm run seed và hướng dẫn README. Không thêm migration vì dự án dùng MongoDB/Mongoose. Build/lint pass, 12/12 unit tests pass; seed chạy 2 lần; HTTP smoke test các filter/sort/page, 404 khóa chưa duyệt, bảo mật chi tiết, Swagger và Auth login/me pass.
