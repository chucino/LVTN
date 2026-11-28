# Task 7

Tiếp nối các nhiệm vụ sau #060. Các nhiệm vụ đến #060 đã hoàn tất tại task-6.md.

## [x] #061 - Sắp xếp lại thứ tự menu thanh bên trang quản trị và xóa mục Khóa học chờ duyệt

- Bắt đầu: 2026-11-28 03:15
- Phạm vi: client
- File liên quan: client/src/layouts/ManageLayout.vue
- Mô tả: Cập nhật thanh điều hướng bên trái (sidebar) tại `ManageLayout.vue`: xóa mục "Khóa học chờ duyệt" và sắp xếp lại thứ tự các mục theo yêu cầu: "Tổng quan", "Tất cả khóa học", "Quản lý người dùng", "Đơn hàng & Thanh toán", "Báo cáo vi phạm".
- Backup: backup/client/src/layouts/ManageLayout.vue.20261128-sidebar-order.bak
- Hoàn thành: 2026-11-28 03:16
- Tóm tắt thay đổi: Đã xóa mục "Khóa học chờ duyệt" khỏi `links` trong `ManageLayout.vue`, sắp xếp lại thứ tự menu cho Quản trị viên thành: "Tổng quan" -> "Tất cả khóa học" -> "Quản lý người dùng" -> "Đơn hàng & Thanh toán" -> "Báo cáo vi phạm" (và với Giảng viên: "Tổng quan" -> "Khóa học được phân công" -> "Báo cáo vi phạm"), đồng thời bỏ import `ClipboardList` không còn sử dụng. Build client thành công.

## [x] #062 - Chỉnh các mục menu thanh bên trang quản trị hiển thị gọn trên cùng một hàng

- Bắt đầu: 2026-11-28 03:24
- Phạm vi: client
- File liên quan: client/src/layouts/ManageLayout.vue
- Mô tả: Mở rộng nhẹ thanh sidebar từ `w-60` lên `w-64 shrink-0` và thêm `whitespace-nowrap` cho các mục điều hướng trong `ManageLayout.vue` để mục "Đơn hàng & Thanh toán" (Admin) và "Khóa học được phân công" (Giảng viên) luôn nằm gọn trên cùng một hàng, không bị rớt chữ xuống dòng.
- Backup: backup/client/src/layouts/ManageLayout.vue.20261128-sidebar-nowrap.bak
- Hoàn thành: 2026-11-28 03:25
- Tóm tắt thay đổi: Đã cập nhật `<aside>` thành `w-64 shrink-0` và thêm `whitespace-nowrap` cho `<router-link>` trong `ManageLayout.vue` giúp toàn bộ các mục menu của cả Admin lẫn Giảng viên hiển thị thẳng hàng trên một dòng duy nhất. Build client thành công.

## [x] #063 - Nâng cấp trang Tổng quan quản trị (thêm bộ biểu đồ trực quan, lược bỏ các nút và dòng chú thích thừa)

- Bắt đầu: 2026-11-28 16:33
- Phạm vi: client
- File liên quan: client/src/pages/dashboard/DashboardPage.vue, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageUsersPage.vue, client/src/pages/manage/ManageOrdersPage.vue, client/src/pages/manage/ManageReportsPage.vue
- Mô tả: Xóa các nút lối tắt ("Tạo khóa học mới", "Quản lý khóa học", "Quản lý người dùng", "Khóa học được phân công") trên khung chào mừng trang Tổng quan; bổ sung bộ 3 biểu đồ thống kê (Trạng thái khóa học, Cơ cấu người dùng, Tình trạng đơn hàng & Doanh thu Pro) cho Admin và bộ biểu đồ trạng thái khóa học được phân công cho Giảng viên; xóa các dòng chú thích mô tả thừa dưới tiêu đề của cả 5 trang quản trị theo yêu cầu.
- Backup: backup/client/src/pages/dashboard/DashboardPage.vue.20261128-dashboard-charts.bak, backup/client/src/pages/manage/ManageCoursesPage.vue.20261128-clean-subtitles.bak, backup/client/src/pages/manage/ManageUsersPage.vue.20261128-clean-subtitles.bak, backup/client/src/pages/manage/ManageOrdersPage.vue.20261128-clean-subtitles.bak, backup/client/src/pages/manage/ManageReportsPage.vue.20261128-clean-subtitles.bak
- Hoàn thành: 2026-11-28 16:35
- Tóm tắt thay đổi: Đã xóa 3 nút lối tắt ("Tạo khóa học mới", "Quản lý khóa học", "Quản lý người dùng") trên trang Tổng quan Admin và nút "Khóa học được phân công" trên trang Tổng quan Giảng viên; bổ sung bộ 3 biểu đồ phân tích trực quan (Biểu đồ Donut tỷ lệ trạng thái khóa học, Biểu đồ thanh ngang cơ cấu tài khoản theo vai trò, Biểu đồ cột tình trạng đơn hàng & doanh thu khóa Pro) cho Admin và bộ 2 biểu đồ khóa học được phân công cho Giảng viên trong `DashboardPage.vue`; đồng thời xóa toàn bộ các dòng chú thích dưới tiêu đề của `DashboardPage.vue`, `ManageCoursesPage.vue`, `ManageUsersPage.vue`, `ManageOrdersPage.vue` và `ManageReportsPage.vue`. Build client thành công.

## [x] #064 - Lược bỏ chú thích trang Hồ sơ, đổi "Tìm thấy _ khóa học" và nâng cấp nút cuộn đầu trang ở Footer

- Bắt đầu: 2026-11-28 16:56
- Phạm vi: client
- File liên quan: client/src/pages/student/ProfilePage.vue, client/src/pages/public/CoursesPage.vue, client/src/components/public/PublicFooter.vue
- Mô tả: Xóa 4 dòng chú thích mô tả trong `ProfilePage.vue` (ở khối Ảnh đại diện, Cập nhật thông tin cá nhân, Chứng chỉ của tôi, Đơn hàng & Lịch sử thanh toán); đổi "Tìm thấy _ giáo trình" thành "Tìm thấy _ khóa học" trong `CoursesPage.vue`; xóa chữ "Lên đầu trang" ở `PublicFooter.vue`, tích hợp cuộn mượt lên đầu trang khi bấm vào Logo chân trang kèm nút icon `ArrowUp` đồng bộ giao diện.
- Backup: backup/client/src/pages/student/ProfilePage.vue.20261128-profile-clean.bak, backup/client/src/pages/public/CoursesPage.vue.20261128-courses-label.bak, backup/client/src/components/public/PublicFooter.vue.20261128-footer-scroll.bak
- Hoàn thành: 2026-11-28 16:58
- Tóm tắt thay đổi: Đã xóa 4 dòng chú thích thừa tại `ProfilePage.vue`; đổi nhãn đếm kết quả tại `CoursesPage.vue` từ "giáo trình" sang "khóa học"; cập nhật `PublicFooter.vue` tích hợp `scrollToTop()` vào logo NextCode ở chân trang và thay thế chữ "Lên đầu trang" bằng nút icon mũi tên `ArrowUp` tinh gọn. Build client thành công.

## [x] #065 - Rút gọn chú thích tại trang tạo khóa học, hộp thoại thêm bài giảng và hộp thoại câu trắc nghiệm

- Bắt đầu: 2026-11-28 17:20
- Phạm vi: client
- File liên quan: client/src/components/manage/CourseInfoForm.vue, client/src/components/manage/QuizQuestionDialog.vue, client/src/components/manage/LessonEditorDialog.vue
- Mô tả: Rút gọn chú thích ảnh đại diện khóa học trong `CourseInfoForm.vue` (xóa "Khuyến nghị tỉ lệ 16:9."); xóa dòng "Chọn đáp án đúng; chỉ số gửi API bắt đầu từ 0." trong `QuizQuestionDialog.vue`; rút gọn chú thích tải video (xóa "Thời lượng sẽ được trích xuất tự động ngay khi chọn file.") và chế độ Không dùng video (xóa "(chỉ hiển thị Nội dung bài đọc / File tài liệu và câu hỏi trắc nghiệm nếu có).") trong `LessonEditorDialog.vue`.
- Backup: backup/client/src/components/manage/CourseInfoForm.vue.20261128-clean-hints.bak, backup/client/src/components/manage/QuizQuestionDialog.vue.20261128-clean-hints.bak, backup/client/src/components/manage/LessonEditorDialog.vue.20261128-clean-hints.bak
- Hoàn thành: 2026-11-28 17:21
- Tóm tắt thay đổi: Đã cập nhật chính xác cả 4 vị trí chú thích trong `CourseInfoForm.vue`, `QuizQuestionDialog.vue` và `LessonEditorDialog.vue` theo yêu cầu. Build client thành công.

## [x] #066 - Tự động đồng bộ trạng thái khóa học thời gian thực khi Giảng viên gửi duyệt / Admin phê duyệt

- Bắt đầu: 2026-11-28 17:28
- Phạm vi: client
- File liên quan: client/src/composables/useManageCourseList.ts, client/src/composables/useManageCourseEditor.ts, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageCourseEditPage.vue, client/src/pages/dashboard/DashboardPage.vue
- Mô tả: Bổ sung cơ chế làm mới ngầm không nháy giao diện (`refreshSilently` / `load(..., true)`) kết hợp sự kiện chuyển cửa sổ (`focus`, `visibilitychange`), `BroadcastChannel` và chu kỳ tự động làm mới ngầm mỗi 3–4 giây tại `ManageCourseEditPage.vue`, `ManageCoursesPage.vue` và `DashboardPage.vue`, giúp khi Giảng viên thêm nội dung và bấm "Gửi duyệt" thì màn hình của Admin tự động hiển thị trạng thái "Chờ duyệt" và nút "Duyệt khóa học" ngay lập tức mà không cần tải lại trang (F5).
- Backup: backup/client/src/composables/useManageCourseList.ts.20261128-realtime-sync.bak, backup/client/src/composables/useManageCourseEditor.ts.20261128-realtime-sync.bak, backup/client/src/pages/manage/ManageCourseEditPage.vue.20261128-realtime-sync.bak, backup/client/src/pages/manage/ManageCoursesPage.vue.20261128-realtime-sync.bak
- Hoàn thành: 2026-11-28 17:30
- Tóm tắt thay đổi: Đã nâng cấp `useManageCourseList.ts`, `useManageCourseEditor.ts`, `ManageCourseEditPage.vue`, `ManageCoursesPage.vue` và `DashboardPage.vue` với cơ chế tự động đồng bộ ngầm khi chuyển tab/cửa sổ (`focus`/`visibilitychange`), qua `BroadcastChannel('nextcode-manage-course-sync')` và polling ngầm định kỳ 3–4 giây (chỉ chạy khi form không có dữ liệu đang gõ dở `dirty === false`), giúp Admin thấy ngay nút Duyệt khi Giảng viên bấm Gửi duyệt mà không cần F5. Build client thành công.

## [x] #067 - Khắc phục lỗi ThrottlerException: Too Many Requests khi mở nhiều cửa sổ quản trị

- Bắt đầu: 2026-11-28 17:37
- Phạm vi: cả hai (server & client)
- File liên quan: src/app.module.ts, src/modules/auth/auth.controller.ts, client/src/pages/dashboard/DashboardPage.vue, client/src/pages/manage/ManageCoursesPage.vue, client/src/pages/manage/ManageCourseEditPage.vue
- Mô tả: Khắc phục lỗi `429 ThrottlerException: Too Many Requests` do giới hạn toàn cục `20 requests/phút` bị chạm ngưỡng khi mở đồng thời các cổng 5173/5174/5175 kèm timer làm mới ngầm. Giữ nguyên giới hạn chặt `20 requests/phút` riêng cho các endpoint xác thực/OTP tại `AuthController` (`@Throttle`), nâng ngưỡng API chung tại `AppModule` lên `300 requests/phút`, đồng thời tối ưu cơ chế đồng bộ bên client (chỉ làm mới khi chuyển cửa sổ `focus` có debounce 2 giây và chỉ poll ở tab Trạng thái khi khóa học đang chờ chuyển trạng thái).
- Backup: backup/src/app.module.ts.20261128-throttler-fix.bak, backup/src/modules/auth/auth.controller.ts.20261128-throttler-fix.bak
- Hoàn thành: 2026-11-28 17:39
- Tóm tắt thay đổi: Đã gắn `@Throttle({ default: { limit: 20, ttl: 60000 } })` trực tiếp cho các route đăng nhập/đăng ký/OTP trong `AuthController`, nâng giới hạn Throttler chung trong `AppModule` lên tối thiểu `300 requests/phút`, và tối ưu client (`DashboardPage.vue`, `ManageCoursesPage.vue`, `ManageCourseEditPage.vue`) bỏ vòng lặp polling liên tục trên trang Tổng quan/Danh sách, chỉ đồng bộ tức thì khi chuyển cửa sổ (`focus`) hoặc qua `BroadcastChannel`, và ở tab Trạng thái chỉ kiểm tra định kỳ khi khóa học đang ở trạng thái chờ gửi duyệt/chờ duyệt. Build server và client thành công.

## [x] #068 - Lược bỏ các dòng chú thích, nút Mở trang payOS / Giả lập thanh toán và cập nhật thông báo trên trang Đăng ký khóa học Pro

- Bắt đầu: 2026-11-28 17:52
- Phạm vi: client
- File liên quan: client/src/pages/student/CourseCheckoutPage.vue
- Mô tả: Xóa 3 dòng chú thích mô tả tại trang Đăng ký khóa học Pro (`CourseCheckoutPage.vue`); xóa 2 nút "Mở trang payOS" và "Giả lập thanh toán (Demo)" tại màn hình quét mã VietQR; đổi thông báo sau khi chuyển khoản thành công thành "Hệ thống đã nhận được thanh toán và mở khóa học Pro cho bạn!".
- Backup: backup/client/src/pages/student/CourseCheckoutPage.vue.20261128-checkout-clean.bak
- Hoàn thành: 2026-11-28 17:53
- Tóm tắt thay đổi: Đã xóa 3 dòng chú thích tại trang Đăng ký khóa học Pro (`CourseCheckoutPage.vue`), xóa 2 nút "Mở trang payOS" và "Giả lập thanh toán (Demo)" ở khung quét mã VietQR, và cập nhật nội dung thông báo thanh toán thành công thành "Hệ thống đã nhận được thanh toán và mở khóa học Pro cho bạn!". Build client thành công.

## [x] #069 - Thiết kế lại thanh điều hướng trang Hồ sơ cá nhân dạng cột dọc bên phải

- Bắt đầu: 2026-11-28 18:08
- Phạm vi: client
- File liên quan: client/src/pages/student/ProfilePage.vue
- Mô tả: Chuyển thanh điều hướng 5 mục ở trang Hồ sơ cá nhân (`ProfilePage.vue`) từ dạng thanh ngang bị tràn scrollbar sang thanh điều hướng dọc (Vertical Sidebar) đặt cố định ở cột bên phải (`lg:w-72 lg:sticky lg:top-24`), nội dung chính hiển thị ở cột lớn bên trái (`flex-1 min-w-0`), đồng thời mở rộng khung trang lên `max-w-[1380px]` để bố cục thoáng và cân đối.
- Backup: backup/client/src/pages/student/ProfilePage.vue.20261128-vertical-right-nav.bak
- Hoàn thành: 2026-11-28 18:09
- Tóm tắt thay đổi: Đã mở rộng khung trang `ProfilePage.vue` lên `max-w-[1380px]` và chuyển thanh điều hướng 5 mục thành cột dọc bên phải (`lg:w-72 lg:sticky lg:top-24`), nội dung chính hiển thị rộng rãi ở cột bên trái (`flex-1 min-w-0`), loại bỏ hoàn toàn thanh cuộn ngang. Build client thành công.

## [x] #070 - Chuyển thanh điều hướng dọc sang bên trái và xóa các chỉ số đếm tại trang Hồ sơ cá nhân

- Bắt đầu: 2026-11-28 18:13
- Phạm vi: client
- File liên quan: client/src/pages/student/ProfilePage.vue
- Mô tả: Chuyển cột thanh điều hướng dọc tại `ProfilePage.vue` sang bên trái (`order-first lg:w-64`) và xóa các chỉ số đếm số lượng (ở các mục "Khóa học của tôi", "Chứng chỉ của tôi", "Đơn hàng & Giao dịch").
- Backup: backup/client/src/pages/student/ProfilePage.vue.20261128-vertical-left-nav.bak
- Hoàn thành: 2026-11-28 18:14
- Tóm tắt thay đổi: Đã chuyển thanh điều hướng dọc ở `ProfilePage.vue` sang cột bên trái và xóa toàn bộ các huy hiệu chỉ số đếm số lượng bên cạnh các mục menu theo yêu cầu. Build client thành công.
