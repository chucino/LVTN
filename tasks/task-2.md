# Task Log 2

## [x] #011 - Tích hợp giao diện khóa học công khai với API backend

- Bắt đầu: 2026-10-30 02:56
- Phạm vi: client
- File liên quan: client/src/services/courses.api.ts, client/src/types/course.ts, client/src/lib/course-format.ts, client/src/components/course/CourseCard.vue, client/src/components/course/CourseCardSkeleton.vue, client/src/components/course/CourseCover.vue, client/src/components/course/CourseSection.vue, client/src/components/public/PublicHeader.vue, client/src/components/public/PublicFooter.vue, client/src/pages/public/HomePage.vue, client/src/pages/public/CoursesPage.vue, client/src/pages/public/CourseDetailPage.vue, client/src/router/index.ts, client/src/data/courses.ts
- Mô tả: Nối trang chủ với API khóa học, tạo trang danh sách/tìm kiếm/lọc/phân trang và chi tiết khóa học, bật tìm kiếm Header và CourseCard, giữ nguyên Auth và thiết kế hiện tại.
- Backup:
  - backup/client/src/pages/public/HomePage.vue.20261030-0256.bak
  - backup/client/src/components/public/PublicHeader.vue.20261030-0256.bak
  - backup/client/src/router/index.ts.20261030-0256.bak
- Hoàn thành: 2026-10-30
- Tóm tắt thay đổi: Thêm types, API service và formatter; trang chủ tải featured/Free/Pro từ API; thêm trang danh sách đồng bộ bộ lọc với URL và trang chi tiết; nối tìm kiếm Header, bật CourseCard và thêm trạng thái loading/rỗng/lỗi; xóa dữ liệu mẫu; tái sử dụng Auth store, logout, login redirect và giữ nguyên guard.
- Kiểm thử: `cd client && npm run build` đạt (vue-tsc và Vite); API categories/courses/featured/detail đã gọi với backend seed; browser xác nhận 9 thẻ trang chủ, tìm kiếm tiếng Việt qua Header, lọc kết hợp, sắp xếp, pagination/Back, trang chi tiết Free/Pro, 404, query không hợp lệ, minPrice > maxPrice, trạng thái lỗi và thử lại, guest redirect, đăng nhập/đăng xuất, `/dashboard` guard và không tràn ngang ở 390/768/1440px. Client không có script lint/test riêng. Build còn cảnh báo bundle JS > 500 kB; trình duyệt báo 401 từ session refresh khi chưa đăng nhập và cảnh báo `next()` deprecated từ router guard Auth có sẵn.

## [ ] #012 - Thêm API quản lý khóa học, chương, bài giảng và trắc nghiệm

- Bắt đầu: 2026-10-30 08:09
- Phạm vi: server
- File liên quan: src/common/filters/http-exception.filter.ts, src/modules/courses/course-manage.controller.ts, src/modules/courses/course-manage.service.ts, src/modules/courses/course-manage.service.spec.ts, src/modules/courses/dto/manage-course.dto.ts, src/modules/courses/dto/manage-course-response.dto.ts, src/modules/courses/manage-course-readiness.ts, src/modules/courses/manage-course.serializer.ts, src/modules/courses/courses.module.ts, src/modules/courses/courses.service.ts, src/modules/courses/courses.service.spec.ts, src/modules/courses/schemas/course.schema.ts, src/modules/users/users.service.ts, tasks/task-2.md
- Mô tả: Thêm API quản lý khóa học theo vai trò/ownership, quy trình duyệt và nội dung nhúng; giữ nguyên hợp đồng API công khai và không tạo collection mới.
- Backup:
  - backup/src/modules/courses/schemas/course.schema.ts.20261030-0809.bak
  - backup/src/modules/courses/courses.module.ts.20261030-0809.bak
  - backup/src/modules/courses/courses.service.ts.20261030-0809.bak
  - backup/src/modules/courses/serializers/course.serializer.ts.20261030-0809.bak
  - backup/src/modules/users/users.service.ts.20261030-0809.bak
  - backup/src/common/filters/http-exception.filter.ts.20261030-0809.bak
- Cập nhật: 2026-10-30
- Trạng thái: Đã triển khai API và kiểm thử unit; còn kiểm thử tích hợp trên MongoDB/API thật.
- Tóm tắt thay đổi:
  - Bổ sung `rejectReason`, timestamps (`updatedAt`) và `quizQuestions` nhúng có ObjectId riêng; không tạo collection mới.
  - Thêm DTO/Swagger, controller `/api/v1/manage/**`, service kiểm tra vai trò/quyền sở hữu, CRUD khóa/chương/bài/câu hỏi, readiness và các hành động submit/withdraw/approve/reject/hide.
  - Dùng `UsersService` hiện có để kiểm tra/liệt kê giảng viên ACTIVE; instructor ID khi giảng viên tạo luôn lấy từ JWT.
  - Giữ API công khai chỉ trả khóa APPROVED; `hasQuiz` được tính từ quiz nhúng và serializer công khai không trả trường quản trị/đáp án/video/note/summary.
  - Cập nhật exception filter để trả `issues`, `warnings`, `readiness` khi readiness chặn gửi duyệt; cập nhật tài liệu Swagger cho DTO và `correctOption` 0-based.
- Kiểm thử:
  - `npm run build`: đạt.
  - `npm run lint`: đạt.
  - `npm test`: đạt, 26 tests / 3 test files.
  - `git diff --check`: đạt.
  - Chưa chạy Postman/Swagger/API smoke test với MongoDB và tài khoản seed; không khởi động API trên cấu hình DB chưa xác nhận môi trường an toàn, tránh tạo/sửa dữ liệu ngoài ý muốn.
- Còn lại:
  - Chạy kiểm thử tích hợp theo checklist trên database không production, gồm role/ownership, lifecycle, tính tổng, API công khai và Auth.
  - Cập nhật `docs/So_Do_Lop.md` sau khi xác nhận schema: `Course.rejectReason`, `Course.updatedAt`, `Lesson.quizQuestions` và quy ước `correctOption` 0-based.

## [ ] #013 - Xây giao diện frontend quản lý khóa học

- Bắt đầu: 2026-10-30 20:22
- Phạm vi: client
- File liên quan: client/src/router/index.ts, client/src/components/public/PublicHeader.vue, client/src/layouts/ManageLayout.vue, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageCourseEditPage.vue, client/src/components/manage/, client/src/composables/, client/src/services/manage-courses.api.ts, client/src/types/manage-course.ts, client/src/lib/manage-course-format.ts
- Mô tả: Xây khu vực quản lý khóa học cho INSTRUCTOR và ADMIN, tái sử dụng Auth/Axios, hỗ trợ danh sách, tạo/sửa khóa, nội dung, quiz và vòng đời duyệt.
- Backup:
  - backup/client/src/router/index.ts.20261030-2022.bak
  - backup/client/src/components/public/PublicHeader.vue.20261030-2022.bak
  - backup/client/src/pages/manage/ManageCourseEditPage.vue.20261030-2100.bak
- Hoàn thành: Implementation xong; kiểm thử tích hợp theo vai trò còn chờ
- Tóm tắt thay đổi: Thêm service/type/composable quản lý khóa học, layout riêng, danh sách có lọc đồng bộ query URL, form tạo/sửa, tab nội dung và trạng thái, CRUD chương/bài/trắc nghiệm, action theo permissions; thêm role guard và mục menu desktop/mobile chỉ cho INSTRUCTOR/ADMIN. Sửa lỗi Vue template truy cập ref lồng trong `editor`/`catalog` khiến màn hình tạo khóa luôn hiện skeleton và cảnh báo lỗi rỗng bằng cách bind ref qua các biến top-level. Giữ nguyên Auth, PublicLayout, dashboard và API backend.
- Kiểm thử: `cd client && npm run build` đạt (vue-tsc + Vite); `git diff --check` đạt sau thay đổi; browser xác nhận guest vào `/manage/courses/new` được chuyển tới Login và sau khi đăng nhập bằng tài khoản test có sẵn, biểu mẫu tạo khóa cùng danh mục/giảng viên tải lên (không gửi POST), sau đó đăng xuất; trước đó `/forbidden` hiển thị đúng, `/courses` vẫn mở và không tràn ngang ở viewport 390px. Không có script lint/test riêng trong client. Build vẫn cảnh báo chunk JS > 500 kB. Chưa xác minh POST tạo khóa với backend thật.
- Còn lại: Chưa chạy luồng CRUD/duyệt thật với tài khoản giảng viên, Admin và học viên; cần xác minh trên backend + MongoDB local/test. Chưa kiểm thử trực quan giao diện quản lý sau đăng nhập ở desktop/tablet/mobile do không có phiên/tài khoản kiểm thử được xác nhận trong môi trường này.

## [x] #014 - Thêm chức năng tải ảnh lên server bằng Multer, phân tách thư mục public và xem trước ảnh trên client

- Bắt đầu: 2026-10-30 22:11
- Phạm vi: cả hai
- File liên quan: package.json, .gitignore, .agent/skills/project-architecture/references/tech-stack.md, src/main.ts, src/app.module.ts, src/modules/uploads/uploads.module.ts, src/modules/uploads/uploads.controller.ts, src/modules/uploads/uploads.service.ts, src/modules/uploads/uploads.service.spec.ts, src/modules/uploads/dto/upload-response.dto.ts, src/modules/courses/courses.module.ts, src/modules/courses/dto/manage-course.dto.ts, src/modules/courses/course-manage.service.ts, src/modules/courses/course-manage.service.spec.ts, client/vite.config.ts, client/src/services/uploads.api.ts, client/src/components/manage/CourseInfoForm.vue, client/src/pages/manage/ManageCourseEditPage.vue
- Mô tả: Tạo cấu trúc thư mục `public/images/courses`, `public/images/avatars` và `public/files`, phục vụ tĩnh qua `/public/...`, thêm `UploadsModule` dùng Multer (giới hạn 5MB, JPG/PNG/WEBP, kiểm tra magic bytes, sinh tên UUID), tự động xóa ảnh cũ khi cập nhật/xóa khóa học, nâng cấp `CourseInfoForm.vue` hỗ trợ chọn ảnh từ máy + xem trước (preview) trên client và chỉ tải ảnh lên server khi bấm Lưu.
- Backup:
  - backup/package.json.20261030-2211.bak
  - backup/package-lock.json.20261030-2211.bak
  - backup/src/main.ts.20261030-2211.bak
  - backup/src/app.module.ts.20261030-2211.bak
  - backup/src/modules/courses/courses.module.ts.20261030-2211.bak
  - backup/src/modules/courses/dto/manage-course.dto.ts.20261030-2211.bak
  - backup/src/modules/courses/course-manage.service.ts.20261030-2211.bak
  - backup/src/modules/courses/course-manage.service.spec.ts.20261030-2211.bak
  - backup/client/vite.config.ts.20261030-2211.bak
  - backup/client/src/components/manage/CourseInfoForm.vue.20261030-2211.bak
  - backup/client/src/pages/manage/ManageCourseEditPage.vue.20261030-2211.bak
  - backup/client/src/composables/useManageCourseEditor.ts.20261030-2211.bak
- Hoàn thành: 2026-10-30 22:24
- Tóm tắt thay đổi: Tạo cấu trúc `public/images/courses`, `public/images/avatars` và `public/files` kèm `.gitkeep` và cập nhật `.gitignore`; cấu hình phục vụ file tĩnh `/public/...` và Helmet `crossOriginResourcePolicy` trong `src/main.ts`; thêm `UploadsModule` (`POST /api/v1/uploads/images`) dùng Multer giới hạn 5MB, kiểm tra magic bytes (JPG/PNG/WEBP), sinh tên UUID và hàm `deleteLocalFile` chống path traversal; cập nhật `CreateManageCourseDto`/`UpdateManageCourseDto` chấp nhận đường dẫn `/public/images/courses/...` hoặc URL HTTPS và tự động xóa ảnh cũ khi cập nhật/xóa khóa học trong `CourseManageService`; cấu hình proxy `/public` ở Vite, thêm `uploads.api.ts`, nâng cấp `CourseInfoForm.vue` hỗ trợ chọn ảnh từ máy, xem trước (preview) trên client bằng `URL.createObjectURL` và chỉ tải ảnh lên server khi bấm Lưu. Kiểm thử: `npm run build`, `npm run lint`, `npm test` (30/30 tests pass) và `cd client && npm run build` đều đạt.

## [x] #015 - Nâng cấp quản lý video bài giảng (Free: YouTube iframe / tải video; Pro: tải video lên public/videos, tự động lấy thời lượng và tải ngầm có tiến trình)

- Bắt đầu: 2026-10-30 23:13
- Phạm vi: cả hai
- File liên quan: .gitignore, .agent/skills/project-architecture/references/tech-stack.md, src/modules/uploads/uploads.service.ts, src/modules/uploads/uploads.controller.ts, src/modules/uploads/uploads.service.spec.ts, src/modules/courses/dto/manage-course.dto.ts, src/modules/courses/course-manage.service.ts, src/modules/courses/course-manage.service.spec.ts, src/modules/courses/manage-course-readiness.ts, client/src/services/uploads.api.ts, client/src/lib/video-embed.ts, client/src/components/manage/LessonEditorDialog.vue, client/src/components/manage/CourseContentEditor.vue
- Mô tả: Tạo `public/videos/`, thêm endpoint `POST /api/v1/uploads/videos` dùng Multer (tối đa 1GB, MP4/WEBM, kiểm tra magic bytes), hỗ trợ khóa học Free dùng mã nhúng `<iframe>` YouTube hoặc tải video từ máy và khóa học Pro tải video từ máy, tự động trích xuất và khóa ô thời lượng, hiển thị xem trước video trong dialog, tải video ngầm có thanh tiến trình không khóa màn hình, tự động xóa video cũ khi thay thế hoặc xóa bài/chương/khóa học.
- Backup:
  - backup/src/modules/uploads/uploads.service.ts.20261030-2313.bak
  - backup/src/modules/uploads/uploads.controller.ts.20261030-2313.bak
  - backup/src/modules/uploads/uploads.service.spec.ts.20261030-2313.bak
  - backup/src/modules/courses/dto/manage-course.dto.ts.20261030-2313.bak
  - backup/src/modules/courses/course-manage.service.ts.20261030-2313.bak
  - backup/src/modules/courses/course-manage.service.spec.ts.20261030-2313.bak
  - backup/src/modules/courses/manage-course-readiness.ts.20261030-2313.bak
  - backup/client/src/services/uploads.api.ts.20261030-2313.bak
  - backup/client/src/components/manage/LessonEditorDialog.vue.20261030-2313.bak
  - backup/client/src/components/manage/CourseContentEditor.vue.20261030-2313.bak
- Hoàn thành: 2026-10-30 23:25
- Tóm tắt thay đổi: Tạo `public/videos/.gitkeep` và cập nhật `.gitignore`; mở rộng `UploadsModule` với `POST /api/v1/uploads/videos` dùng Multer (tối đa 1GB, MP4/WEBM, kiểm tra magic bytes `ftyp` và EBML header) và mở rộng `deleteLocalFile`; cập nhật `CreateLessonDto`, `manage-course-readiness.ts` và `CourseManageService` hỗ trợ mã nhúng `<iframe>` YouTube (chuẩn hóa an toàn chống XSS cho khóa Free) hoặc video tải lên `/public/videos/...` (cho cả khóa Free và Pro, chặn YouTube iframe ở khóa Pro), đồng thời tự động xóa video cũ khi thay thế hoặc xóa bài giảng/chương/khóa học; thêm `video-embed.ts` dùng YouTube IFrame API và `<video preload="metadata">` tự động trích xuất và khóa ô thời lượng kèm khung xem trước trong `LessonEditorDialog.vue`; bổ sung hàng đợi tải video ngầm có thanh phần trăm tiến trình thực tế (`0% -> 100%`) và nút Hủy tải trong `CourseContentEditor.vue` để không khóa màn hình khi tải video lớn. Kiểm thử: `npm run build`, `npm run lint`, `npm test` (32/32 tests pass) và `cd client && npm run build` đều đạt.

## [x] #016 - Cấu hình chạy đa cổng (5173, 5174, ...) và cô lập phiên đăng nhập theo cổng trên cùng 1 trình duyệt Chrome

- Bắt đầu: 2026-10-30 23:31
- Phạm vi: cả hai
- File liên quan: package.json, src/main.ts, src/modules/auth/auth.controller.ts, client/package.json, client/vite.config.ts, client/src/services/http.ts, client/scripts/dev-multi.mjs, scripts/dev-all.mjs, .env.example
- Mô tả: Cô lập cookie `refreshToken` theo từng cổng (`refreshToken_5173`, `refreshToken_5174`, ...) dựa trên header `X-Client-Port` / `Origin` để nhiều tài khoản (Admin, Giảng viên, Học viên) hoạt động độc lập trên cùng một trình duyệt Chrome; mở rộng CORS cho các cổng `localhost:5173, 5174, ...`; thêm script khởi chạy nhiều cổng frontend đồng thời và có thể mở rộng số lượng cổng.
- Backup:
  - backup/package.json.20261030-2331.bak
  - backup/src/main.ts.20261030-2331.bak
  - backup/src/modules/auth/auth.controller.ts.20261030-2331.bak
  - backup/client/package.json.20261030-2331.bak
  - backup/client/vite.config.ts.20261030-2331.bak
  - backup/client/src/services/http.ts.20261030-2331.bak
- Hoàn thành: 2026-10-30 23:35
- Tóm tắt thay đổi: Cô lập phiên đăng nhập theo từng cổng trên cùng một trình duyệt Chrome bằng cách đặt tên cookie `httpOnly` theo cổng (`refreshToken_5173`, `refreshToken_5174`, ...) trong `auth.controller.ts` dựa trên header `X-Client-Port` (gửi từ `client/src/services/http.ts`) hoặc port của `Origin`/`Referer`; cập nhật CORS trong `src/main.ts` chấp nhận danh sách `CLIENT_ORIGIN` phân tách bằng dấu phẩy và mọi cổng `http://localhost:<port>` trong môi trường dev cùng header `X-Client-Port`; cấu hình `client/vite.config.ts` nhận `VITE_PORT` và tách riêng `cacheDir` (`node_modules/.vite-<port>`) để tránh xung đột khi chạy nhiều tiến trình Vite; thêm `client/scripts/dev-multi.mjs` và `scripts/dev-all.mjs` cùng các script `dev:multi`, `dev:5173`, `dev:5174`, `dev:client:multi`, `dev:all` hỗ trợ mở rộng linh hoạt số cổng (`5173`, `5174`, `5175`, ...). Kiểm thử: `npm run build`, `npm run lint`, `npm test` và `cd client && npm run build` đều đạt.


## [x] #017 - Nâng cấp Hồ sơ người dùng (/profile) tách biệt khỏi quản trị, phân quyền rõ Admin/Giảng viên và thêm Quản lý người dùng (/manage/users)

- Bắt đầu: 2026-10-30 23:55
- Phạm vi: cả hai
- File liên quan: src/modules/uploads/uploads.controller.ts, src/modules/uploads/uploads.service.ts, src/modules/users/users.module.ts, src/modules/users/users.service.ts, src/modules/users/users.controller.ts, src/modules/users/manage-users.controller.ts, src/modules/users/dto/user-profile.dto.ts, src/modules/users/dto/manage-user.dto.ts, src/modules/courses/course-manage.controller.ts, src/modules/courses/course-manage.service.ts, src/modules/courses/course-manage.service.spec.ts, src/modules/courses/manage-course.serializer.ts, src/modules/courses/dto/manage-course.dto.ts, src/modules/courses/dto/manage-course-response.dto.ts, client/src/router/index.ts, client/src/components/public/PublicHeader.vue, client/src/layouts/ManageLayout.vue, client/src/pages/student/ProfilePage.vue, client/src/pages/manage/ManageUsersPage.vue, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageCourseEditPage.vue, client/src/components/manage/CourseInfoForm.vue, client/src/services/users.api.ts, client/src/services/uploads.api.ts, client/src/types/user.ts, client/src/types/manage-course.ts, client/src/stores/auth.store.ts
- Mô tả: Thiết kế trang Hồ sơ người dùng (/profile) tách biệt hoàn toàn khỏi khu vực quản trị (cập nhật thông tin + tải avatar có preview lưu vào public/images/avatars, đổi mật khẩu, tab khóa học của tôi); phân quyền rõ Admin và Giảng viên trong quản lý khóa học (chỉ Admin tạo/sửa/xóa khóa học nền và phân công giảng viên; Giảng viên chỉ xem thông tin nền và toàn quyền quản lý chương/bài/quiz trên khóa được phân công rồi gửi duyệt); xây dựng trang Quản lý người dùng (/manage/users) dành riêng cho Admin.
- Backup:
  - backup/src/modules/uploads/uploads.controller.ts.20261030-2355.bak
  - backup/src/modules/uploads/uploads.service.ts.20261030-2355.bak
  - backup/src/modules/users/users.module.ts.20261030-2355.bak
  - backup/src/modules/users/users.service.ts.20261030-2355.bak
  - backup/src/modules/courses/course-manage.controller.ts.20261030-2355.bak
  - backup/src/modules/courses/course-manage.service.ts.20261030-2355.bak
  - backup/src/modules/courses/course-manage.service.spec.ts.20261030-2355.bak
  - backup/src/modules/courses/manage-course.serializer.ts.20261030-2355.bak
  - backup/src/modules/courses/dto/manage-course.dto.ts.20261030-2355.bak
  - backup/src/modules/courses/dto/manage-course-response.dto.ts.20261030-2355.bak
  - backup/client/src/router/index.ts.20261030-2355.bak
  - backup/client/src/components/public/PublicHeader.vue.20261030-2355.bak
  - backup/client/src/layouts/ManageLayout.vue.20261030-2355.bak
  - backup/client/src/pages/manage/ManageCoursesPage.vue.20261030-2355.bak
  - backup/client/src/pages/manage/ManageCourseEditPage.vue.20261030-2355.bak
  - backup/client/src/components/manage/CourseInfoForm.vue.20261030-2355.bak
  - backup/client/src/types/manage-course.ts.20261030-2355.bak
  - backup/client/src/stores/auth.store.ts.20261030-2355.bak
  - backup/client/src/services/uploads.api.ts.20261030-2355.bak
- Hoàn thành: 2026-10-31 00:14
- Tóm tắt thay đổi: Hoàn thiện trang Hồ sơ cá nhân (`/profile`, redirect từ `/dashboard`) tách biệt khỏi khu vực quản trị với 3 tab (Thông tin cá nhân + upload avatar có preview lưu vào `/public/images/avatars/` và tự động dọn ảnh cũ; Khóa học của tôi; Đổi mật khẩu); mở quyền upload ảnh thư mục `avatars` cho mọi tài khoản đã đăng nhập trong `uploads.controller.ts` trong khi giữ nguyên phân quyền `INSTRUCTOR`/`ADMIN` cho ảnh/video khóa học; phân tách chặt chẽ quyền `ADMIN` và `INSTRUCTOR` trong quản lý khóa học (`course-manage.controller.ts`, `course-manage.service.ts`, `CourseInfoForm.vue`) để chỉ `ADMIN` được tạo/sửa/xóa khóa học nền và gán/đổi giảng viên phụ trách (`instructorId`), còn `INSTRUCTOR` xem tab Thông tin ở chế độ Read-only (`canEditInfo: false`), toàn quyền thêm/sửa/xóa/sắp xếp Chương - Bài giảng - Quiz và bấm "Gửi duyệt" (tự động chuyển khóa học `APPROVED` về `DRAFT` khi giảng viên chỉnh sửa nội dung); xây dựng hệ thống Quản lý người dùng dành riêng cho `ADMIN` (`manage-users.controller.ts`, `ManageUsersPage.vue` tại `/manage/users`) hỗ trợ thống kê, tìm kiếm/lọc, tạo tài khoản kích hoạt sẵn, phân quyền (`STUDENT`/`INSTRUCTOR`/`ADMIN`) và khóa/mở khóa tài khoản kèm thu hồi refresh token. Kiểm thử: `npm run build`, `npm run lint`, `npm test` (32/32 tests pass) và `cd client && npm run build` đều đạt.


## [x] #018 - Đưa toàn bộ hệ thống quản trị (Admin/Giảng viên) vào nhánh /dashboard, thiết kế lại DashboardPage và điều hướng từ menu người dùng

- Bắt đầu: 2026-10-31 00:18
- Phạm vi: client
- File liên quan: client/src/router/index.ts, client/src/pages/dashboard/DashboardPage.vue, client/src/layouts/ManageLayout.vue, client/src/components/public/PublicHeader.vue, client/src/pages/student/ProfilePage.vue, client/src/pages/public/HomePage.vue
- Mô tả: Tách biệt hoàn toàn hệ thống quản trị ra khỏi các trang của người dùng thông thường; đưa toàn bộ vai trò quản trị (`INSTRUCTOR`, `ADMIN`) vào nhánh `/dashboard` (`/dashboard`, `/dashboard/courses`, `/dashboard/courses/new`, `/dashboard/courses/:id/edit`, `/dashboard/users`); thiết kế lại `DashboardPage.vue` thành trang tổng quan quản trị cho Admin và Giảng viên; cập nhật menu người dùng trên `PublicHeader.vue` hiển thị tùy chọn "Trang quản trị" dẫn tới `/dashboard` và gỡ bỏ nút quản trị khỏi trang cá nhân `/profile`.
- Backup:
  - backup/client/src/router/index.ts.20261031-0018.bak
  - backup/client/src/pages/dashboard/DashboardPage.vue.20261031-0018.bak
  - backup/client/src/layouts/ManageLayout.vue.20261031-0018.bak
  - backup/client/src/components/public/PublicHeader.vue.20261031-0018.bak
  - backup/client/src/pages/student/ProfilePage.vue.20261031-0018.bak
  - backup/client/src/pages/public/HomePage.vue.20261031-0018.bak
- Hoàn thành: 2026-10-31 00:24
- Tóm tắt thay đổi: Chuyển toàn bộ nhánh quản trị dành cho `INSTRUCTOR` và `ADMIN` về `/dashboard` trong `client/src/router/index.ts` (`/dashboard`, `/dashboard/courses`, `/dashboard/courses/new`, `/dashboard/courses/:id/edit`, `/dashboard/users`) kèm redirect tương thích ngược từ `/manage/*` sang `/dashboard/*`; thiết kế lại `client/src/pages/dashboard/DashboardPage.vue` thành trang Tổng quan quản trị (hiển thị thống kê khóa học, thống kê người dùng cho Admin, danh sách khóa học cập nhật gần đây và lối tắt tác vụ); thêm mục "Tổng quan" (`/dashboard`) vào thanh bên của `client/src/layouts/ManageLayout.vue`; cập nhật menu người dùng trên `client/src/components/public/PublicHeader.vue` để Giảng viên và Admin truy cập thông qua tùy chọn duy nhất "Trang quản trị" dẫn tới `/dashboard`; gỡ bỏ nút quản trị trên `client/src/pages/student/ProfilePage.vue` và điều chỉnh nút "Bắt đầu học" trên `client/src/pages/public/HomePage.vue` trỏ về `/profile?tab=courses` để tách biệt hoàn toàn giao diện người dùng thông thường với hệ thống quản trị. Kiểm thử: `cd client && npm run build` thành công.


## [x] #019 - Tái kiến trúc toàn bộ giao diện hệ thống theo skill design-taste-frontend (Giai đoạn A–E)

- Bắt đầu: 2026-10-31 00:35
- Phạm vi: client
- File liên quan: client/index.html, client/src/style.css, client/src/plugins/vuetify.ts, client/src/layouts/PublicLayout.vue, client/src/components/public/PublicHeader.vue, client/src/components/public/PublicFooter.vue, client/src/components/course/CourseCover.vue, client/src/components/course/CourseCardSkeleton.vue, client/src/components/course/CourseCard.vue, client/src/components/course/CourseSection.vue, client/src/pages/public/HomePage.vue, client/src/pages/public/CoursesPage.vue, client/src/pages/public/CourseDetailPage.vue, client/src/layouts/AuthLayout.vue, client/src/pages/public/LoginPage.vue, client/src/pages/public/RegisterPage.vue, client/src/pages/public/VerifyOtpPage.vue, client/src/pages/public/ForgotPasswordPage.vue, client/src/pages/public/ResetPasswordPage.vue, client/src/pages/ForbiddenPage.vue, client/src/pages/student/ProfilePage.vue, client/src/layouts/ManageLayout.vue, client/src/pages/dashboard/DashboardPage.vue, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageCourseEditPage.vue, client/src/pages/manage/ManageUsersPage.vue, client/src/components/manage/CourseInfoForm.vue, client/src/components/manage/CourseContentEditor.vue, client/src/components/manage/CourseStatusBadge.vue, client/src/components/manage/CourseStatusPanel.vue, client/src/components/manage/ManageCourseActions.vue, client/src/components/manage/ManageCourseThumbnail.vue, client/src/components/manage/ManageActionDialog.vue, client/src/components/manage/ChapterEditorDialog.vue, client/src/components/manage/LessonEditorDialog.vue, client/src/components/manage/QuizQuestionDialog.vue
- Mô tả: Cài đặt và áp dụng bộ skill `Leonxlnx/taste-skill` (`design-taste-frontend`) để tái kiến trúc toàn bộ giao diện frontend của NextCode theo hướng thiết kế `editorial-report` ("The printed annual", seed `1823174834`) và bảng màu **Black and crimson** (`#0a0a0a`, `#151515`, `#1d1d1d`, `#efefef`, `#8c8c8c`, `#b11226`); thay font `Boska` bằng `Newsreader` (Google Fonts hỗ trợ đầy đủ tiếng Việt); tích hợp 4 ảnh tư liệu mở Văn Miếu - Quốc Tử Giám (CC BY 4.0 Jakub Hałun); thiết kế bộ lập kế hoạch nhịp độ học tập trực tiếp trên trang chủ; tái thiết kế toàn bộ trang công khai, xác thực, hồ sơ cá nhân (`/profile`) và nhánh quản trị (`/dashboard/*`) theo quy tắc chống giao diện rập khuôn của skill.
- Backup:
  - backup/client/src/style.css.20261031-0035.bak
  - backup/client/index.html.20261031-0035.bak
  - backup/client/src/plugins/vuetify.ts.20261031-0040.bak
  - backup/client/src/layouts/PublicLayout.vue.20261031-0040.bak
  - backup/client/src/components/public/PublicHeader.vue.20261031-0040.bak
  - backup/client/src/components/public/PublicFooter.vue.20261031-0040.bak
  - backup/client/src/components/course/CourseCover.vue.20261031-0040.bak
  - backup/client/src/components/course/CourseCardSkeleton.vue.20261031-0040.bak
  - backup/client/src/components/course/CourseCard.vue.20261031-0040.bak
  - backup/client/src/components/course/CourseSection.vue.20261031-0040.bak
  - backup/client/src/pages/public/HomePage.vue.20261031-0040.bak
  - backup/client/src/pages/public/CoursesPage.vue.20261031-0040.bak
  - backup/client/src/pages/public/CourseDetailPage.vue.20261031-0040.bak
  - backup/client/src/layouts/AuthLayout.vue.20261031-0040.bak
  - backup/client/src/pages/public/LoginPage.vue.20261031-0040.bak
  - backup/client/src/pages/public/RegisterPage.vue.20261031-0040.bak
  - backup/client/src/pages/public/VerifyOtpPage.vue.20261031-0040.bak
  - backup/client/src/pages/public/ForgotPasswordPage.vue.20261031-0040.bak
  - backup/client/src/pages/public/ResetPasswordPage.vue.20261031-0040.bak
  - backup/client/src/pages/ForbiddenPage.vue.20261031-0040.bak
  - backup/client/src/pages/student/ProfilePage.vue.20261031-0050.bak
  - backup/client/src/layouts/ManageLayout.vue.20261031-0050.bak
  - backup/client/src/pages/dashboard/DashboardPage.vue.20261031-0050.bak
  - backup/client/src/pages/manage/ManageCoursesPage.vue.20261031-0050.bak
  - backup/client/src/pages/manage/ManageCourseEditPage.vue.20261031-0050.bak
  - backup/client/src/pages/manage/ManageUsersPage.vue.20261031-0050.bak
  - backup/client/src/components/manage/CourseInfoForm.vue.20261031-0050.bak
  - backup/client/src/components/manage/CourseContentEditor.vue.20261031-0050.bak
  - backup/client/src/components/manage/CourseStatusBadge.vue.20261031-0050.bak
  - backup/client/src/components/manage/CourseStatusPanel.vue.20261031-0050.bak
  - backup/client/src/components/manage/ManageCourseActions.vue.20261031-0050.bak
  - backup/client/src/components/manage/ManageCourseThumbnail.vue.20261031-0050.bak
  - backup/client/src/components/manage/ManageActionDialog.vue.20261031-0050.bak
  - backup/client/src/components/manage/ChapterEditorDialog.vue.20261031-0050.bak
  - backup/client/src/components/manage/LessonEditorDialog.vue.20261031-0050.bak
  - backup/client/src/components/manage/QuizQuestionDialog.vue.20261031-0050.bak
- Hoàn thành: 2026-10-31 00:59
- Tóm tắt thay đổi: Hoàn tất cả 5 giai đoạn (A–E): (A) Thiết lập hệ thống token `@theme` trong `client/src/style.css`, cấu hình `Newsreader` hỗ trợ tiếng Việt trong `client/index.html` và đồng bộ bảng màu trong `client/src/plugins/vuetify.ts`; (B) Tái kiến trúc toàn bộ giao diện công khai (`PublicLayout.vue`, `PublicHeader.vue`, `PublicFooter.vue`, `HomePage.vue` kèm bộ tính lộ trình học tập trực tiếp và 4 ảnh tư liệu mở Văn Miếu - Quốc Tử Giám, `CoursesPage.vue`, `CourseDetailPage.vue`) và các trang xác thực (`AuthLayout.vue`, `LoginPage.vue`, `RegisterPage.vue`, `VerifyOtpPage.vue`, `ForgotPasswordPage.vue`, `ResetPasswordPage.vue`, `ForbiddenPage.vue`); (C) Tái thiết kế `ProfilePage.vue` theo chuẩn màn hình ứng dụng phẳng, giữ nguyên toàn bộ chức năng cập nhật hồ sơ, tải/xem trước avatar và đổi mật khẩu; (D) Tái thiết kế toàn bộ nhánh `/dashboard` (`ManageLayout.vue`, `DashboardPage.vue`, `ManageCoursesPage.vue`, `ManageCourseEditPage.vue`, `ManageUsersPage.vue` và 10 component trong `client/src/components/manage/*.vue`) sử dụng `tabular-nums`, phân tầng nền phẳng (`bg-ground`, `bg-surface`, `bg-surface-2`) và loại bỏ toàn bộ gradient/bóng đổ/màu tím-indigo. Kiểm thử (E): `node .agents/skills/design-taste-frontend/scripts/lint.mjs client/src` đạt `0 FAIL`, và `cd client && npm run build` (`vue-tsc -b && vite build`) thành công.

## [x] #020 - Thiết kế lại toàn bộ giao diện theo phong cách nền tảng học lập trình sáng, hiện đại
- Bắt đầu: 2026-10-31 08:40
- Mục tiêu: Chuyển đổi toàn bộ giao diện NextCode sang phong cách nền tảng học tập công nghệ sáng sủa, hiện đại và thân thiện (lấy cảm hứng từ Coursera / Udemy) với tông nền sáng (`#f4f7fb` / `#ffffff`), điểm nhấn xanh dương công nghệ (`#2563eb`) + xanh ngọc (`#0f766e`), thẻ bo góc mềm mại, typography `Be Vietnam Pro` + `JetBrains Mono`. Gỡ bỏ toàn bộ ảnh phong cảnh Văn Miếu (`client/public/images/site/*`) và thay bằng hệ thống minh họa vector/code (`HeroCodeWindow.vue`, `LanguageBadges.vue`, `CourseCover.vue`). Đảm bảo đạt `0 FAIL` với `lint.mjs` và build sạch.
- Phạm vi dự kiến:
  - client/index.html
  - client/src/style.css
  - client/src/plugins/vuetify.ts
  - client/src/components/illustrations/HeroCodeWindow.vue (mới)
  - client/src/components/illustrations/LanguageBadges.vue (mới)
  - client/src/components/course/CourseCover.vue (mới)
  - client/src/components/course/CourseCard.vue
  - client/src/components/course/CourseCardSkeleton.vue
  - client/src/components/course/CourseSection.vue
  - client/src/layouts/PublicLayout.vue
  - client/src/layouts/PublicHeader.vue
  - client/src/layouts/PublicFooter.vue
  - client/src/layouts/AuthLayout.vue
  - client/src/layouts/ManageLayout.vue
  - client/src/pages/public/HomePage.vue
  - client/src/pages/public/CoursesPage.vue
  - client/src/pages/public/CourseDetailPage.vue
  - client/src/pages/auth/*.vue
  - client/src/pages/user/ProfilePage.vue
  - client/src/pages/manage/*.vue
  - client/src/components/manage/*.vue
- Backup đã tạo:
  - backup/client/index.html.20261031-0840.bak
  - backup/client/src/style.css.20261031-0840.bak
  - backup/client/src/plugins/vuetify.ts.20261031-0840.bak
  - backup/client/src/layouts/PublicLayout.vue.20261031-0840.bak
  - backup/client/src/layouts/PublicHeader.vue.20261031-0840.bak
  - backup/client/src/layouts/PublicFooter.vue.20261031-0840.bak
  - backup/client/src/layouts/AuthLayout.vue.20261031-0840.bak
  - backup/client/src/layouts/ManageLayout.vue.20261031-0840.bak
  - backup/client/src/components/course/CourseCard.vue.20261031-0840.bak
  - backup/client/src/components/course/CourseCardSkeleton.vue.20261031-0840.bak
  - backup/client/src/components/course/CourseSection.vue.20261031-0840.bak
  - backup/client/src/pages/public/HomePage.vue.20261031-0840.bak
  - backup/client/src/pages/public/CoursesPage.vue.20261031-0840.bak
  - backup/client/src/pages/public/CourseDetailPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/LoginPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/RegisterPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/VerifyOtpPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/ForgotPasswordPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/ResetPasswordPage.vue.20261031-0840.bak
  - backup/client/src/pages/auth/ForbiddenPage.vue.20261031-0840.bak
  - backup/client/src/pages/user/ProfilePage.vue.20261031-0840.bak
  - backup/client/src/pages/manage/DashboardPage.vue.20261031-0840.bak
  - backup/client/src/pages/manage/ManageCoursesPage.vue.20261031-0840.bak
  - backup/client/src/pages/manage/ManageCourseEditPage.vue.20261031-0840.bak
  - backup/client/src/pages/manage/ManageUsersPage.vue.20261031-0840.bak
  - backup/client/src/components/manage/CourseInfoForm.vue.20261031-0840.bak
  - backup/client/src/components/manage/CourseContentEditor.vue.20261031-0840.bak
  - backup/client/src/components/manage/CourseStatusBadge.vue.20261031-0840.bak
  - backup/client/src/components/manage/CourseStatusPanel.vue.20261031-0840.bak
  - backup/client/src/components/manage/ManageCourseActions.vue.20261031-0840.bak
  - backup/client/src/components/manage/ManageCourseThumbnail.vue.20261031-0840.bak
  - backup/client/src/components/manage/ManageActionDialog.vue.20261031-0840.bak
  - backup/client/src/components/manage/ChapterEditorDialog.vue.20261031-0840.bak
  - backup/client/src/components/manage/LessonEditorDialog.vue.20261031-0840.bak
  - backup/client/src/components/manage/QuizQuestionDialog.vue.20261031-0840.bak
- Hoàn thành: 2026-10-31 08:47
- Tóm tắt thay đổi: Tái thiết kế toàn bộ giao diện hệ thống sang phong cách nền tảng học lập trình sáng sủa, hiện đại (`#f4f7fb` / `#ffffff`, xanh dương `#2563eb`, xanh ngọc `#0f766e`, chữ `Be Vietnam Pro` + `JetBrains Mono`, bo góc thẻ mềm mại). Xóa toàn bộ thư mục ảnh phong cảnh `client/public/images/site/` và tạo bộ 3 component minh họa công nghệ mới (`HeroCodeWindow.vue`, `LanguageBadges.vue`, `CourseCover.vue` tự sinh bìa vector theo chủ đề khi khóa học chưa có ảnh hoặc ảnh bị lỗi). Cập nhật đồng bộ toàn bộ trang công khai, xác thực, hồ sơ học viên và hệ thống quản trị `/dashboard`. Đạt `0 FAIL` với `lint.mjs`, build TypeScript + Vite sạch (`0 error`), và kiểm tra thực tế trên trình duyệt headless với `inspect.mjs`.
