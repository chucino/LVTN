# Task Log 4

## [x] #031 - Nâng cấp Bộ lọc trang Giáo trình & Khóa học (/courses): Xóa nút "Xóa bộ lọc" trùng lặp và cố định bảng Bộ lọc bên trái khi cuộn trang
- Bắt đầu: 2026-11-12 02:03
- Mục tiêu: Xóa nút "Xóa bộ lọc" trùng chức năng ở góc phải danh sách khóa học (chỉ giữ nút "Đặt lại" trong bảng Bộ lọc bên trái) và bổ sung thuộc tính `lg:sticky lg:top-24` cho `<aside id="course-filters">` để bảng Bộ lọc luôn giữ nguyên vị trí khi người dùng cuộn danh sách khóa học xuống dưới.
- Phạm vi dự kiến:
  - client/src/pages/public/CoursesPage.vue
- Backup đã tạo:
  - backup/client/src/pages/public/CoursesPage.vue.20261112-0203.bak
- Hoàn thành: 2026-11-12 02:04
- Tóm tắt thay đổi: Gỡ bỏ nút "Xóa bộ lọc" trùng lặp ở góc trên bên phải danh sách khóa học (chỉ giữ lại nút "Đặt lại" bên trong bảng Bộ lọc bên trái); đồng thời bổ sung `items-start` trên khung `grid` và `lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto` trên `<aside id="course-filters">` để bảng Bộ lọc luôn đứng yên ngay dưới thanh điều hướng Header khi người dùng cuộn danh sách khóa học xuống dưới. Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.
