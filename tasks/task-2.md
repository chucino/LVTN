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
