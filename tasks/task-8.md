# Task 8

Tiếp nối các nhiệm vụ sau #070. Các nhiệm vụ đến #070 đã hoàn tất tại task-7.md.

## [x] #071 - Kéo dài khung thẻ thanh điều hướng dọc bằng chiều cao với cột nội dung bên phải tại trang Hồ sơ cá nhân

- Bắt đầu: 2026-11-28 18:19
- Phạm vi: client
- File liên quan: client/src/pages/student/ProfilePage.vue
- Mô tả: Điều chỉnh khung bố cục 2 cột tại `ProfilePage.vue` từ `lg:items-start` sang `lg:items-stretch` để khung thẻ trắng của thanh điều hướng dọc bên trái luôn kéo dài bằng đúng chiều cao với các thẻ nội dung bên phải, trong khi vị trí 5 mục điều hướng vẫn giữ nguyên ở phía trên khung.
- Backup: backup/client/src/pages/student/ProfilePage.vue.20261128-nav-stretch-height.bak
- Hoàn thành: 2026-11-28 18:20
- Tóm tắt thay đổi: Đã bỏ `lg:items-start` trên container 2 cột và đặt `<aside>` co giãn toàn chiều cao (`self-stretch`) tại `ProfilePage.vue`, giữ `<nav>` nằm gọn ở đầu thẻ để khung trắng bên trái dài bằng đúng các thẻ bên phải. Build client thành công.
