# Task Log 3

## [x] #021 - Xây dựng Backend cho đăng ký khóa học, học tuần tự, làm trắc nghiệm và cấp chứng chỉ
- Bắt đầu: 2026-11-02 15:38
- Mục tiêu: Xây dựng hoàn chỉnh phần Backend cho luồng đăng ký khóa học (Free đăng ký học ngay, Pro chặn đăng ký trực tiếp và cung cấp hàm dịch vụ cho đơn hàng hoàn tất), mở bài tuần tự (`Enrollment`, `LessonProgress`), lưu vị trí đang xem video, kiểm tra điều kiện làm trắc nghiệm sau video (`QuizAttempt`, quy tắc 100% với bài 1 câu và >= 70% với bài nhiều câu), và tự động cấp chứng chỉ (`Certificate`) khi hoàn thành 100% bài học.
- Phạm vi dự kiến:
  - src/common/constants/learning.enum.ts (mới)
  - src/modules/certificates/schemas/certificate.schema.ts (mới)
  - src/modules/certificates/dto/certificate-response.dto.ts (mới)
  - src/modules/certificates/certificates.service.ts (mới)
  - src/modules/certificates/certificates.controller.ts (mới)
  - src/modules/certificates/certificates.module.ts (mới)
  - src/modules/enrollments/schemas/enrollment.schema.ts (mới)
  - src/modules/enrollments/schemas/lesson-progress.schema.ts (mới)
  - src/modules/enrollments/schemas/quiz-attempt.schema.ts (mới)
  - src/modules/enrollments/dto/update-lesson-progress.dto.ts (mới)
  - src/modules/enrollments/dto/submit-quiz.dto.ts (mới)
  - src/modules/enrollments/dto/enrollment-response.dto.ts (mới)
  - src/modules/enrollments/enrollments.service.ts (mới)
  - src/modules/enrollments/enrollments.controller.ts (mới)
  - src/modules/enrollments/enrollments.module.ts (mới)
  - src/modules/enrollments/enrollments.service.spec.ts (mới)
  - src/app.module.ts
- Backup đã tạo:
  - backup/src/app.module.ts.20261102-1538.bak
- Hoàn thành: 2026-11-02 15:45
- Tóm tắt thay đổi: Hoàn thiện `EnrollmentsModule` và `CertificatesModule` với đầy đủ 9 REST API endpoints, kiểm soát quyền `STUDENT`, mở bài tuần tự (`LOCKED` -> `UNLOCKED` -> `COMPLETED`), lưu tiến độ xem video (`lastPositionSec`, `watchedFully`), mở khóa câu hỏi trắc nghiệm sau khi xem hết video, chấm điểm trắc nghiệm (100% cho bài 1 câu, >= 70% cho bài nhiều câu), lưu `QuizAttempt`, và tự động cấp `Certificate` (mã không tuần tự `NC-YYYY-XXXXXXXX` + tra cứu công khai) khi học viên hoàn thành 100% khóa học. Pass 100% unit test (`vitest`), `nest build` và `oxlint` (`0 warnings, 0 errors`).

## [x] #022 - Thiết kế và xây dựng giao diện đăng ký khóa học, màn hình học tập tuần tự 7/3 và hệ thống chứng chỉ
- Bắt đầu: 2026-11-02 16:37
- Mục tiêu: Xây dựng toàn bộ giao diện Frontend kết nối với Backend cho chức năng đăng ký khóa học (`CourseDetailPage.vue`), màn hình học tập bố cục 7/3 (`CourseLearningPage.vue`, `LessonVideoPlayer.vue` tự động mở khóa khi phát hết 100% thời lượng video HTML5 / YouTube IFrame API, `LessonQuizPanel.vue`), nâng cấp tab "Khóa học của tôi" & "Chứng chỉ của tôi" trong `ProfilePage.vue`, cùng giao diện chứng chỉ trực quan (`CertificateCardView.vue` kèm QR + xuất PDF) và trang tra cứu chứng chỉ công khai (`CertificateVerifyPage.vue`).
- Phạm vi dự kiến:
  - client/src/types/learning.ts (mới)
  - client/src/types/user.ts
  - client/src/services/enrollments.api.ts (mới)
  - client/src/services/certificates.api.ts (mới)
  - client/src/components/learning/LessonVideoPlayer.vue (mới)
  - client/src/components/learning/LessonQuizPanel.vue (mới)
  - client/src/components/certificate/CertificateCardView.vue (mới)
  - client/src/pages/student/CourseLearningPage.vue (mới)
  - client/src/pages/public/CertificateVerifyPage.vue (mới)
  - client/src/pages/public/CourseDetailPage.vue
  - client/src/pages/student/ProfilePage.vue
  - client/src/components/public/PublicHeader.vue
  - client/src/components/public/PublicFooter.vue
  - client/src/router/index.ts
- Backup đã tạo:
  - backup/client/src/router/index.ts.20261102-1637.bak
  - backup/client/src/types/user.ts.20261102-1637.bak
  - backup/client/src/pages/public/CourseDetailPage.vue.20261102-1637.bak
  - backup/client/src/pages/student/ProfilePage.vue.20261102-1637.bak
  - backup/client/src/components/public/PublicHeader.vue.20261102-1637.bak
  - backup/client/src/components/public/PublicFooter.vue.20261102-1637.bak
- Hoàn thành: 2026-11-02 16:47
- Tóm tắt thay đổi: Hoàn thiện toàn bộ giao diện Frontend cho luồng đăng ký học, màn hình học tập tuần tự bố cục 7/3 (`CourseLearningPage.vue`), trình phát video thông minh (`LessonVideoPlayer.vue`) tự động đồng bộ `watchedFully = true` khi kết thúc 100% thời lượng phát (cả HTML5 `<video>` và YouTube IFrame Player API, không có nút đánh dấu thủ công), khu vực làm trắc nghiệm (`LessonQuizPanel.vue`) hiển thị điểm và giải thích chi tiết từng câu, chứng chỉ kỹ thuật số (`CertificateCardView.vue` kèm mã QR SVG và nút In/Tải PDF), trang tra cứu chứng chỉ công khai (`CertificateVerifyPage.vue`), và nâng cấp `ProfilePage.vue` với tab "Khóa học của tôi" & "Chứng chỉ của tôi" kết nối API thực tế. Vượt qua kiểm tra `lint.mjs` (`0 FAIL`) và `npm run build` (`vue-tsc -b && vite build`).

## [x] #023 - Nâng cấp quản lý học viên theo khóa học dành cho Giảng viên và Admin
- Bắt đầu: 2026-11-02 21:25
- Mục tiêu: Bổ sung số lượng học viên `totalStudents` vào danh sách khóa học và xây dựng API cùng giao diện Quản lý học viên chuyên biệt cho từng khóa học (`/dashboard/courses/:id/students`) cho phép Giảng viên (và Admin) theo dõi thống kê, danh sách học viên, tiến độ học tập và chứng chỉ đã cấp theo cơ chế chỉ xem (Read-only) an toàn.
- Phạm vi dự kiến:
  - src/modules/courses/dto/manage-course-response.dto.ts
  - src/modules/courses/manage-course.serializer.ts
  - src/modules/courses/course-manage.service.ts
  - src/modules/enrollments/dto/manage-course-students.dto.ts (mới)
  - src/modules/enrollments/enrollments.service.ts
  - src/modules/enrollments/enrollments.controller.ts
  - src/modules/enrollments/enrollments.service.spec.ts
  - client/src/types/manage-course.ts
  - client/src/types/learning.ts
  - client/src/services/enrollments.api.ts
  - client/src/pages/manage/ManageCoursesPage.vue
  - client/src/components/manage/ManageCourseActions.vue
  - client/src/pages/manage/ManageCourseStudentsPage.vue (mới)
  - client/src/router/index.ts
- Backup đã tạo:
  - backup/src/modules/courses/dto/manage-course-response.dto.ts.20261102-2125.bak
  - backup/src/modules/courses/manage-course.serializer.ts.20261102-2125.bak
  - backup/src/modules/courses/course-manage.service.ts.20261102-2125.bak
  - backup/src/modules/enrollments/enrollments.service.ts.20261102-2125.bak
  - backup/src/modules/enrollments/enrollments.controller.ts.20261102-2125.bak
  - backup/client/src/types/manage-course.ts.20261102-2125.bak
  - backup/client/src/types/learning.ts.20261102-2125.bak
  - backup/client/src/services/enrollments.api.ts.20261102-2125.bak
  - backup/client/src/pages/manage/ManageCoursesPage.vue.20261102-2125.bak
  - backup/client/src/components/manage/ManageCourseActions.vue.20261102-2125.bak
  - backup/client/src/router/index.ts.20261102-2125.bak
- Hoàn thành: 2026-11-02 21:37
- Tóm tắt thay đổi: Hoàn thiện chức năng Quản lý học viên theo khóa học dành cho Giảng viên và Admin. Backend tự động tính `totalStudents` cho bảng khóa học thông qua MongoDB aggregate và bổ sung endpoint `GET /manage/courses/:courseId/students` có kiểm soát quyền RBAC chặt chẽ (giảng viên chỉ xem khóa của mình, ném 403 nếu truy cập khóa của người khác). Frontend bổ sung cột Học viên trên `ManageCoursesPage.vue`, thêm nút thao tác Users trên `ManageCourseActions.vue` và xây dựng trang quản lý học viên chuyên biệt `ManageCourseStudentsPage.vue` (`/dashboard/courses/:id/students`) với 4 thẻ thống kê tổng quan (Tổng số, Đang học, Đã hoàn thành, Tiến độ trung bình), tìm kiếm theo tên/email, lọc theo tiến độ, sắp xếp linh hoạt, phân trang và link tra cứu chứng chỉ công khai. Toàn bộ unit test (36/36 test), `nest build`, `lint.mjs` (`0 FAIL`) và `npm run build` đều pass 100%.

## [x] #024 - Tinh chỉnh giao diện thanh điều hướng (Header) trang chủ và phân quyền hiển thị "Khóa học của tôi"
- Bắt đầu: 2026-11-11 23:55
- Mục tiêu: Sửa lỗi rớt dòng các mục điều hướng trên `PublicHeader.vue` (giữ nguyên nhãn từ khóa, thu gọn cỡ chữ/khoảng cách và áp dụng `whitespace-nowrap` + `shrink-0`), loại bỏ trùng lặp nút "Khóa học của tôi" trên thanh Header ngoài (chỉ giữ trong Menu tài khoản thả xuống), phân quyền chỉ hiển thị "Khóa học của tôi" và "Chứng chỉ của tôi" đối với Học viên (`STUDENT`) trên cả Header và `ProfilePage.vue`, đồng thời bổ sung xử lý `@error` fallback về chữ cái đầu khi ảnh avatar bị lỗi.
- Phạm vi dự kiến:
  - client/src/components/public/PublicHeader.vue
  - client/src/pages/student/ProfilePage.vue
- Backup đã tạo:
  - backup/client/src/components/public/PublicHeader.vue.20261111-2355.bak
  - backup/client/src/pages/student/ProfilePage.vue.20261111-2355.bak
- Hoàn thành: 2026-11-12 00:02
- Tóm tắt thay đổi: Tinh chỉnh `PublicHeader.vue` với `whitespace-nowrap` và `shrink-0` giúp 5 mục điều hướng ("Trang chủ", "Giáo trình & Khóa học", "Tra cứu chứng chỉ", "Cách học", "Hỏi đáp") luôn nằm thẳng hàng trên 1 dòng ngang; gỡ bỏ nút "Khóa học của tôi" bên ngoài thanh Header để loại bỏ trùng lặp và giữ duy nhất trong Menu tài khoản thả xuống; giới hạn chỉ hiển thị "Khóa học của tôi" và "Chứng chỉ của tôi" cho tài khoản `STUDENT` trên cả `PublicHeader.vue` và `ProfilePage.vue`; bổ sung `@error` fallback về chữ cái viết tắt khi ảnh đại diện không tải được. Pass `lint.mjs` (`0 FAIL`) và `npm run build`.

## [x] #025 - Nâng cấp giao diện Trang chủ: Phân tách bố cục, xen kẽ màu nền và đóng khung thẻ nội dung
- Bắt đầu: 2026-11-12 00:10
- Mục tiêu: Phân tách rõ ràng từng khu vực trên `HomePage.vue` bằng đường viền ngang (`border-b border-surface-3`) và xen kẽ nền Trắng (`bg-surface`) ↔ Xám nhạt (`bg-ground`), bổ sung nhãn Eyebrow đóng khung phía trên tiêu đề mỗi phần, giữ bố cục 3 thẻ ngang ở mục "Cách học trên NextCode" nhưng đóng khung viền sắc nét (`border border-surface-3`) trên nền trắng, đồng thời đóng khung viền cho toàn bộ thẻ khóa học (`CourseCard.vue`), danh mục, bảng so sánh Free/Pro và câu hỏi thường gặp (FAQ).
- Phạm vi dự kiến:
  - client/src/pages/public/HomePage.vue
  - client/src/components/course/CourseSection.vue
  - client/src/components/course/CourseCard.vue
  - client/src/components/illustrations/LanguageBadges.vue
- Backup đã tạo:
  - backup/client/src/pages/public/HomePage.vue.20261112-0010.bak
  - backup/client/src/components/course/CourseSection.vue.20261112-0010.bak
  - backup/client/src/components/course/CourseCard.vue.20261112-0010.bak
  - backup/client/src/components/illustrations/LanguageBadges.vue.20261112-0010.bak
- Hoàn thành: 2026-11-12 00:17
- Tóm tắt thay đổi: Hoàn thiện nâng cấp bố cục trang chủ (`HomePage.vue`, `CourseSection.vue`, `CourseCard.vue`, `LanguageBadges.vue`): phân tách rõ ràng toàn bộ 8 khu vực bằng đường viền ngang `border-b border-surface-3` và xen kẽ màu nền Trắng (`bg-surface`) ↔ Xám nhạt (`bg-ground`); bổ sung nhãn Eyebrow đóng khung phía trên tiêu đề mỗi phần; giữ bố cục 3 thẻ ngang ở phần "Cách học trên NextCode" với nền trắng đóng khung viền sắc nét kèm thẻ tag tính năng; đóng khung riêng biệt cho khối "Lên lịch học của bạn", thẻ khóa học, bảng so sánh Free/Pro và danh sách câu hỏi thường gặp (FAQ). Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #026 - Nâng cấp giao diện trang quản trị Admin & Giảng viên: Cố định Sidebar khi cuộn trang và xóa mục "Phạm vi quyền hạn hiện tại"
- Bắt đầu: 2026-11-12 00:30
- Mục tiêu: Khắc phục lỗi thanh bên trái (`<aside>`) bị tách khúc khi cuộn trang trong `ManageLayout.vue` (chuyển `<header>` sang `sticky top-0 z-30`, bổ sung đường viền phải `border-r border-surface-3` trên `<aside>`, thêm fallback `@error` cho ảnh đại diện) và xóa hoàn toàn khối "Phạm vi quyền hạn hiện tại" ở cuối `DashboardPage.vue` đối với cả Admin và Giảng viên.
- Phạm vi dự kiến:
  - client/src/layouts/ManageLayout.vue
  - client/src/pages/dashboard/DashboardPage.vue
- Backup đã tạo:
  - backup/client/src/layouts/ManageLayout.vue.20261112-0030.bak
  - backup/client/src/pages/dashboard/DashboardPage.vue.20261112-0030.bak
- Hoàn thành: 2026-11-12 00:32
- Tóm tắt thay đổi: Chuyển thanh `<header>` của `ManageLayout.vue` sang `sticky top-0 z-30` để luôn cố định ở đỉnh màn hình và khớp liền mạch với thanh bên trái `<aside>` (`lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)]`), bổ sung đường viền phải `border-r border-surface-3` cho `<aside>` và fallback `@error` cho ảnh đại diện; đồng thời xóa toàn bộ khối "Phạm vi quyền hạn hiện tại" ở cuối `DashboardPage.vue` cho cả Admin và Giảng viên. Vượt qua kiểm tra `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #027 - Tinh gọn Sidebar & Header trang quản trị (Admin & Giảng viên): Xóa khối giới thiệu, gỡ "Hồ sơ cá nhân" / "Về trang chủ" ở đáy Sidebar và dời nút "Đăng xuất" xuống cuối Sidebar
- Bắt đầu: 2026-11-12 00:46
- Mục tiêu: Xóa hộp giới thiệu "NextCode Admin / Instructor Studio" ở đầu Sidebar, xóa 2 mục trùng lặp "Hồ sơ cá nhân" và "Về trang chủ" ở cuối Sidebar (giữ lại trên thanh Header), đồng thời dời nút "Đăng xuất" từ thanh Header xuống vị trí cuối bên trái của Sidebar.
- Phạm vi dự kiến:
  - client/src/layouts/ManageLayout.vue
- Backup đã tạo:
  - backup/client/src/layouts/ManageLayout.vue.20261112-0046.bak
- Hoàn thành: 2026-11-12 00:48
- Tóm tắt thay đổi: Tinh gọn `ManageLayout.vue` cho cả Admin và Giảng viên: xóa hộp giới thiệu "NextCode Admin / Instructor Studio" ở đầu thanh bên trái, gỡ bỏ hai mục trùng lặp "Hồ sơ cá nhân" và "Về trang chủ" ở đáy thanh bên trái (giữ lại cụm tên tài khoản mở Hồ sơ cá nhân và nút "Trang chủ" trên thanh điều hướng Header), đồng thời dời nút "Đăng xuất" từ thanh điều hướng Header xuống vị trí cuối cùng bên trái của Sidebar kèm nhãn "Đăng xuất" rõ ràng. Vượt qua kiểm tra `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #028 - Sửa lỗi icon tìm kiếm và icon trong ô nhập liệu bị đè lên chữ trên trang quản trị
- Bắt đầu: 2026-11-12 01:21
- Mục tiêu: Khắc phục triệt để lỗi CSS Specificity trong `client/src/style.css` khiến `.manage-input` ghi đè các class `pl-10`, `pl-11`, `pr-10`, `pr-11` của Tailwind v4 làm icon kính lúp/ổ khóa đè lên chữ bên trong ô nhập liệu; đồng thời chuẩn hóa toàn bộ các ô tìm kiếm trong khu vực quản trị (`ManageCoursesPage.vue`, `ManageUsersPage.vue`, `ManageCourseStudentsPage.vue`).
- Phạm vi dự kiến:
  - client/src/style.css
  - client/src/pages/manage/ManageCoursesPage.vue
  - client/src/pages/manage/ManageUsersPage.vue
  - client/src/pages/manage/ManageCourseStudentsPage.vue
- Backup đã tạo:
  - backup/client/src/style.css.20261112-0121.bak
  - backup/client/src/pages/manage/ManageCoursesPage.vue.20261112-0121.bak
  - backup/client/src/pages/manage/ManageUsersPage.vue.20261112-0121.bak
  - backup/client/src/pages/manage/ManageCourseStudentsPage.vue.20261112-0121.bak
- Hoàn thành: 2026-11-12 01:25
- Tóm tắt thay đổi: Đưa `.manage-input` trong `client/src/style.css` vào `@layer components` và bổ sung quy tắc tường minh cho `.manage-input.pl-9`, `.pl-10`, `.pl-11`, `.pr-10`, `.pr-11` để không bao giờ ghi đè các class khoảng cách nội bộ khi có icon; đồng thời chuẩn hóa vị trí icon kính lúp (`left-3.5 top-1/2 -translate-y-1/2`) và `pl-10` trên toàn bộ ô tìm kiếm của khu vực quản trị (`ManageCoursesPage.vue`, `ManageUsersPage.vue`, `ManageCourseStudentsPage.vue`). Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #029 - Nâng cấp giao diện trang Tìm kiếm & Khóa học (/courses): Tự động ẩn ô tìm kiếm nhỏ trên Header khi ở trang /courses và nâng cấp thanh tìm kiếm lớn + khung Bộ lọc
- Bắt đầu: 2026-11-12 01:36
- Mục tiêu: Tự động ẩn ô tìm kiếm trên `PublicHeader.vue` khi người dùng đang đứng tại trang `/courses` (`route.name === 'Courses'`) để loại bỏ tình trạng trùng lặp 2 thanh tìm kiếm cùng nhảy chữ; đồng thời nâng cấp giao diện thanh tìm kiếm lớn (thêm viền sắc nét, nút xóa nhanh từ khóa, nút Tìm kiếm) và khung Bộ lọc trong `CoursesPage.vue`.
- Phạm vi dự kiến:
  - client/src/components/public/PublicHeader.vue
  - client/src/pages/public/CoursesPage.vue
- Backup đã tạo:
  - backup/client/src/components/public/PublicHeader.vue.20261112-0136.bak
  - backup/client/src/pages/public/CoursesPage.vue.20261112-0136.bak
- Hoàn thành: 2026-11-12 01:39
- Tóm tắt thay đổi: Cập nhật `PublicHeader.vue` tự động ẩn ô tìm kiếm nhỏ trên thanh điều hướng khi đang ở trang `/courses` (`route.name === 'Courses'`) và giữ cụm nút tài khoản căn phải mượt mà; đồng thời nâng cấp `CoursesPage.vue` với đường viền phân tách khu vực đầu trang (`border-b border-surface-3`), nhãn đóng khung "Danh mục & Tìm kiếm", thanh tìm kiếm lớn có viền rõ nét kèm nút "Xóa" nhanh từ khóa và nút "Tìm kiếm", cùng khung Bộ lọc có viền `border border-surface-3` đồng bộ với Trang chủ. Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #030 - Nâng cấp chức năng tìm kiếm có bảng gợi ý thả xuống trực tiếp (Autocomplete Dropdown) trên Header
- Bắt đầu: 2026-11-12 01:53
- Mục tiêu: Nâng cấp ô tìm kiếm trên `PublicHeader.vue` (hiển thị ở các trang ngoài `/courses`) để khi người dùng gõ từ khóa sẽ xuất hiện bảng gợi ý thả xuống ngay bên dưới giống mẫu tham khảo: dòng đầu là "Tìm khóa học '<từ khóa>'" dẫn tới `/courses?keyword=...`, bên dưới là danh sách các khóa học khớp từ khóa (nhấn vào sẽ mở thẳng trang Chi tiết khóa học `/courses/:id`), hỗ trợ điều hướng bằng bàn phím (`↑`/`↓`/`Enter`/`Escape`).
- Phạm vi dự kiến:
  - client/src/components/public/PublicHeader.vue
- Backup đã tạo:
  - backup/client/src/components/public/PublicHeader.vue.20261112-0153.bak
- Hoàn thành: 2026-11-12 01:55
- Tóm tắt thay đổi: Hoàn thiện bảng gợi ý tìm kiếm thả xuống trực tiếp (Autocomplete Dropdown) trên thanh điều hướng `PublicHeader.vue` (desktop & mobile menu) cho tất cả các trang ngoài `/courses`. Khi người dùng nhập từ khóa, hệ thống gọi `coursesApi.getCourses` (có debounce `220ms` và `AbortController`), hiển thị dòng đầu `Tìm khóa học "<từ khóa>"` dẫn tới `/courses?keyword=...` và danh sách tối đa 8 khóa học khớp từ khóa (kèm nhãn `Miễn phí` / `Pro`) dẫn thẳng tới trang Chi tiết khóa học `/courses/:id`, hỗ trợ điều hướng bằng bàn phím (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) và tự động đóng khi click ra ngoài. Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.
