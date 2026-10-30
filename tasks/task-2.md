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
