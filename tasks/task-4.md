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


## [x] #032 - Nâng cấp giao diện khung Video trang học tập (/learn/:courseId): Thu gọn chiều cao khung phát 16:9 vừa vặn trong một màn hình giống mẫu tham khảo F8
- Bắt đầu: 2026-11-12 23:37
- Mục tiêu: Giới hạn chiều cao và chiều rộng tối đa của khung phát video 16:9 (`max-h-[calc(100svh-12.5rem)] max-w-[1040px] mx-auto`) đặt trên nền sân khấu màu đen (`bg-black`) trong `LessonVideoPlayer.vue` và tinh chỉnh khoảng cách trên `CourseLearningPage.vue` để khi thu gọn hay mở mục lục thì học viên đều nhìn thấy trọn vẹn 100% khung hình video mà không phải cuộn trang lên xuống.
- Phạm vi dự kiến:
  - client/src/components/learning/LessonVideoPlayer.vue
  - client/src/pages/student/CourseLearningPage.vue
- Backup đã tạo:
  - backup/client/src/components/learning/LessonVideoPlayer.vue.20261112-2337.bak
  - backup/client/src/pages/student/CourseLearningPage.vue.20261112-2337.bak
- Hoàn thành: 2026-11-12 23:39
- Tóm tắt thay đổi: Bọc trình phát 16:9 trong `LessonVideoPlayer.vue` bên trong sân khấu nền đen (`w-full bg-black`) và giới hạn kích thước `mx-auto aspect-video max-h-[calc(100svh-12.5rem)] w-full max-w-[1040px]` cùng tinh chỉnh đệm dọc trên `CourseLearningPage.vue`. Giờ đây dù học viên đang mở hay thu gọn mục lục, toàn bộ khung hình video (từ tiêu đề trên cùng đến thanh điều khiển dưới đáy) luôn hiển thị trọn vẹn trong một màn hình giống mẫu tham khảo F8. Vượt qua `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #033 - Xây dựng hệ thống Hỏi đáp (Bình luận bài giảng) cho từng bài học (Backend NestJS + Frontend Vue 3 theo mẫu F8)
- Bắt đầu: 2026-11-13 00:07
- Mục tiêu: Xây dựng hoàn chỉnh chức năng Hỏi đáp trong từng bài học gồm Backend (`QuestionsModule`: tạo bình luận/phản hồi `@Tên`, thả 7 loại biểu cảm Reactions, báo cáo vi phạm lưu vào CSDL, xóa bình luận theo quyền RBAC) và Frontend (`LessonDiscussionDrawer.vue` trượt từ bên phải kèm nút nổi "Hỏi đáp" trên `CourseLearningPage.vue`, hỗ trợ mở/thu gọn câu trả lời theo từng chặng 5 câu trả lời/lần và nút "Ẩn" ở cuối).
- Phạm vi dự kiến:
  - src/modules/questions/schemas/lesson-comment.schema.ts (mới)
  - src/modules/questions/dto/lesson-comment.dto.ts (mới)
  - src/modules/questions/questions.service.ts (mới)
  - src/modules/questions/questions.controller.ts (mới)
  - src/modules/questions/questions.module.ts (mới)
  - src/modules/questions/questions.service.spec.ts (mới)
  - src/app.module.ts
  - client/src/types/learning.ts
  - client/src/services/questions.api.ts (mới)
  - client/src/components/learning/LessonDiscussionDrawer.vue (mới)
  - client/src/pages/student/CourseLearningPage.vue
- Backup đã tạo:
  - backup/src/app.module.ts.20261113-0007.bak
  - backup/client/src/types/learning.ts.20261113-0007.bak
  - backup/client/src/pages/student/CourseLearningPage.vue.20261113-0007.bak
- Hoàn thành: 2026-11-13 00:20
- Tóm tắt thay đổi: Triển khai đầy đủ `QuestionsModule` trên Backend NestJS (schema `LessonComment`, kiểm tra bài học đã mở khóa trong `Enrollment`, hỗ trợ bình luận gốc + phản hồi `@Tên`, 7 loại biểu cảm `LIKE`/`LOVE`/`CARE`/`HAHA`/`WOW`/`SAD`/`ANGRY`, báo cáo vi phạm lưu vào CSDL, và xóa bình luận cho tác giả/Giảng viên phụ trách/Admin kèm 5 unit tests). Trên Frontend Vue 3, xây dựng `LessonDiscussionDrawer.vue` và nút nổi `"Hỏi đáp"` trên `CourseLearningPage.vue` theo đúng thiết kế F8, hỗ trợ hiển thị câu trả lời theo từng đợt tối đa 5 câu trả lời/lần (`"Xem X câu trả lời"` -> `"Xem tiếp Y câu trả lời"` -> `"Ẩn"`). Vượt qua toàn bộ 41 unit tests backend, `lint.mjs` (`0 FAIL`) và `npm run build`.


## [x] #034 - Hoàn thiện Hỏi đáp bài học (Nút Thích 1 icon Like, Nút nổi Hỏi đáp màu xanh tự dịch chuyển theo mục lục) & Hàng đợi xử lý Báo cáo vi phạm 2 tầng (/dashboard/reports)
- Bắt đầu: 2026-11-13 00:59
- Mục tiêu: (1) Đơn giản hóa nút Thích chỉ còn 1 icon Like duy nhất không hiện popup khi rê chuột; (2) Chỉnh nút nổi Hỏi đáp sang màu xanh hệ thống (`text-brand`), bỏ số đếm bình luận và tự động đẩy sang trái khi mở mục lục; (3) Bổ sung trạng thái `visibilityStatus` (`VISIBLE`/`HIDDEN`), lớp `Report` dùng chung (`PENDING`/`RESOLVED`/`DISMISSED` kèm chống xung đột lợi ích khi báo cáo bình luận của Giảng viên), lớp `Notification` và trang hàng đợi xử lý Báo cáo vi phạm `/dashboard/reports` cho Giảng viên & Admin.
- Phạm vi dự kiến:
  - src/modules/questions/schemas/lesson-comment.schema.ts
  - src/modules/questions/schemas/report.schema.ts (mới)
  - src/modules/questions/schemas/notification.schema.ts (mới)
  - src/modules/questions/dto/lesson-comment.dto.ts
  - src/modules/questions/questions.service.ts
  - src/modules/questions/questions.controller.ts
  - src/modules/questions/questions.module.ts
  - src/modules/questions/questions.service.spec.ts
  - client/src/pages/student/CourseLearningPage.vue
  - client/src/components/learning/LessonDiscussionDrawer.vue
  - client/src/types/learning.ts
  - client/src/services/questions.api.ts
  - client/src/pages/manage/ManageReportsPage.vue (mới)
  - client/src/layouts/ManageLayout.vue
  - client/src/router/index.ts
  - client/src/components/public/PublicHeader.vue
- Backup đã tạo:
  - backup/src/modules/questions/schemas/lesson-comment.schema.ts.20261113-0059.bak
  - backup/src/modules/questions/dto/lesson-comment.dto.ts.20261113-0059.bak
  - backup/src/modules/questions/questions.service.ts.20261113-0059.bak
  - backup/src/modules/questions/questions.controller.ts.20261113-0059.bak
  - backup/src/modules/questions/questions.module.ts.20261113-0059.bak
  - backup/src/modules/questions/questions.service.spec.ts.20261113-0059.bak
  - backup/client/src/pages/student/CourseLearningPage.vue.20261113-0059.bak
  - backup/client/src/components/learning/LessonDiscussionDrawer.vue.20261113-0059.bak
  - backup/client/src/types/learning.ts.20261113-0059.bak
  - backup/client/src/services/questions.api.ts.20261113-0059.bak
  - backup/client/src/layouts/ManageLayout.vue.20261113-0059.bak
  - backup/client/src/router/index.ts.20261113-0059.bak
  - backup/client/src/components/public/PublicHeader.vue.20261113-0059.bak
- Hoàn thành: 2026-11-13 01:12
- Tóm tắt thay đổi: (1) Gỡ bỏ thanh popup 7 biểu cảm khi rê chuột trên `LessonDiscussionDrawer.vue`, thay bằng thao tác nhấn trực tiếp `Thích` với 1 icon Like duy nhất màu xanh hệ thống (`text-brand`); (2) Bỏ số lượng bình luận trên nút nổi `"Hỏi đáp"` ở `CourseLearningPage.vue`, đổi icon sang `text-brand` và đặt trong khung `sticky bottom-6` của cột bài giảng để tự động dịch sang trái khi mở mục lục khóa học; (3) Bổ sung `visibilityStatus` (`VISIBLE`/`HIDDEN`), lớp `Report` dùng chung (`PENDING`/`RESOLVED`/`DISMISSED` kèm tự động `escalatedToAdmin = true` khi báo cáo bình luận của Giảng viên), lớp `Notification` kèm chuông thông báo trên `PublicHeader.vue`, và trang hàng đợi xử lý `"Báo cáo vi phạm"` (`/dashboard/reports` — `ManageReportsPage.vue`) theo đúng phân quyền 2 tầng Giảng viên / Admin.


## [x] #035 - Nâng cấp quy trình Báo cáo vi phạm 2 tuyến (Giảng viên / Admin), xử phạt tự động 5 mức, khóa bình luận khi bị cấm và đồng bộ báo cáo trùng lặp theo targetId
- Bắt đầu: 2026-11-13 02:28
- Mục tiêu: Chuẩn hóa 3 tab (Đang chờ xử lý / Đã xử lý / Đã bỏ qua) cho Giảng viên (`PENDING`) và Admin (`ESCALATED`); xóa mềm bình luận hiển thị theo có/không có phản hồi; cộng vi phạm tích lũy 1 lần/bình luận; Admin xử phạt tự động 5 mức (nhắc nhở, cấm 24h/7d/30d, khóa LOCKED); khóa ô nhập bình luận khi `commentBannedUntil` còn hiệu lực; `resolveReport` đồng bộ mọi báo cáo cùng `targetId`.
- Phạm vi dự kiến:
  - src/modules/users/schemas/user.schema.ts
  - src/modules/questions/schemas/lesson-comment.schema.ts
  - src/modules/questions/schemas/report.schema.ts
  - src/modules/questions/dto/lesson-comment.dto.ts
  - src/modules/questions/questions.service.ts
  - src/modules/questions/questions.service.spec.ts
  - client/src/types/learning.ts
  - client/src/services/questions.api.ts
  - client/src/components/learning/LessonDiscussionDrawer.vue
  - client/src/pages/manage/ManageReportsPage.vue
- Backup đã tạo: backup/<đường dẫn file>.20261113-0228.bak cho toàn bộ 10 file trên
- Hoàn thành: 2026-11-13 02:35
- Tóm tắt thay đổi: Thêm `violationCount`, `commentBannedUntil`, `violationHistory` vào `User`; `violationRecorded` vào `LessonComment`; `ReportStatus` gồm `PENDING`/`ESCALATED`/`RESOLVED`/`DISMISSED`. Backend: tab "Đang chờ xử lý" = `PENDING` (Giảng viên) / `ESCALATED` (Admin), xóa thẻ "Chuyển cấp Admin"; `resolveReport` đồng bộ mọi báo cáo cùng `targetId` và thông báo cho toàn bộ người báo cáo; cộng +1 vi phạm đúng một lần trên mỗi bình luận; Admin xử phạt tự động 5 mức (nhắc nhở, cấm 24h/7 ngày/30 ngày cộng dồn thời hạn cũ, khóa `LOCKED`); bình luận xóa mềm ẩn hẳn khi không có phản hồi, hiện "Bình luận này đã bị xóa do vi phạm" khi còn phản hồi; chặn bình luận khi đang bị cấm. Frontend: khóa ô nhập kèm thông báo thời hạn cấm, trang báo cáo 3 tab, cảnh báo vi phạm cho Giảng viên, hồ sơ vi phạm và xem trước mức phạt cho Admin. 54 unit tests, `lint.mjs` (0 FAIL) và `npm run build` đều đạt.


## [x] #036 - Nâng cấp chức năng quản lý và xem khóa học theo 2 chế độ (Biên soạn & Xem như học viên) cho Giảng viên và Admin
- Bắt đầu: 2026-11-13 02:59
- Mục tiêu: Cho phép Giảng viên và Admin xem khóa học theo 2 chế độ: (1) Chế độ Biên soạn/Quản lý (chỉ dành cho Admin và Giảng viên phụ trách khóa học đó) và (2) Chế độ Xem như học viên (`/learn/:courseId` - không giới hạn mở khóa tuần tự, không lưu tiến độ hay điểm trắc nghiệm vào DB, Giảng viên A được xem khóa học đã xuất bản của Giảng viên B); đồng thời phân biệt nhãn `TÁC GIẢ` (Giảng viên phụ trách khóa học) và `GIẢNG VIÊN` (Giảng viên khác) trong Hỏi đáp bài học.
- Phạm vi dự kiến:
  - src/modules/enrollments/dto/enrollment-response.dto.ts
  - src/modules/enrollments/enrollments.controller.ts
  - src/modules/enrollments/enrollments.service.ts
  - src/modules/enrollments/enrollments.service.spec.ts
  - src/modules/questions/dto/lesson-comment.dto.ts
  - src/modules/questions/questions.service.ts
  - src/modules/questions/questions.service.spec.ts
  - client/src/router/index.ts
  - client/src/types/learning.ts
  - client/src/pages/public/CourseDetailPage.vue
  - client/src/pages/dashboard/DashboardPage.vue
  - client/src/pages/manage/ManageCourseEditPage.vue
  - client/src/components/manage/ManageCourseActions.vue
  - client/src/components/manage/CourseStatusPanel.vue
  - client/src/pages/student/CourseLearningPage.vue
  - client/src/components/learning/LessonDiscussionDrawer.vue
- Backup đã tạo: backup/<đường dẫn file>.20261113-0259.bak cho toàn bộ 16 file trên
- Hoàn thành: 2026-11-13 03:09
- Tóm tắt thay đổi: Bổ sung chế độ "Xem như học viên" (`isPreviewMode`, `canManageCourse`) tại `/learn/:courseId` cho `INSTRUCTOR` và `ADMIN` không cần bản ghi `Enrollment`, mở khóa toàn bộ bài giảng/trắc nghiệm ngay từ đầu và chấm điểm trắc nghiệm trên bộ nhớ tạm (không lưu `LessonProgress` hay `QuizAttempt` vào DB, không cấp chứng chỉ). Cho phép Giảng viên A xem khóa học đã xuất bản (`APPROVED`) của Giảng viên B ở chế độ học viên nhưng chặn quyền chỉnh sửa/quản lý; bổ sung `author.isCourseAuthor` để hiển thị nhãn `TÁC GIẢ` cho giảng viên phụ trách khóa học và `GIẢNG VIÊN` cho giảng viên khác trong Hỏi đáp bài học; thêm nút "Xem như học viên" tại trang công khai, trang tổng quan, danh sách khóa học, trang biên soạn và nút chuyển nhanh giữa hai chế độ trên thanh đầu phòng học. Toàn bộ 57 unit tests, `lint.mjs` (0 FAIL) và `npm run build` đều đạt.


## [x] #037 - Đổi nhãn "Xem như học viên" thành "Xem khóa học" và gộp nút xem ở tab Trạng thái và duyệt
- Bắt đầu: 2026-11-13 03:16
- Mục tiêu: Đổi nhãn nút từ "Xem như học viên" thành "Xem khóa học" trên các trang công khai, tổng quan, danh sách quản lý, trang biên soạn; tại tab "Trạng thái và duyệt" (`CourseStatusPanel.vue`) loại bỏ sự trùng lặp giữa "Xem như học viên" và "Xem trang công khai", chỉ giữ lại một nút duy nhất là "Xem khóa học".
- Phạm vi dự kiến:
  - client/src/pages/public/CourseDetailPage.vue
  - client/src/pages/dashboard/DashboardPage.vue
  - client/src/pages/manage/ManageCourseEditPage.vue
  - client/src/components/manage/ManageCourseActions.vue
  - client/src/components/manage/CourseStatusPanel.vue
  - client/src/pages/student/CourseLearningPage.vue
- Backup đã tạo: backup/<đường dẫn file>.20261113-0316.bak cho toàn bộ 6 file trên
- Hoàn thành: 2026-11-13 03:18
- Tóm tắt thay đổi: Đổi toàn bộ nhãn nút "Xem như học viên" thành "Xem khóa học" tại `CourseDetailPage.vue`, `DashboardPage.vue`, `ManageCourseEditPage.vue`, `ManageCourseActions.vue`, `CourseLearningPage.vue`; tại `CourseStatusPanel.vue` (tab Trạng thái và duyệt) xóa nút trùng "Xem trang công khai" và chỉ giữ lại một nút duy nhất là "Xem khóa học".


## [x] #038 - Nâng cấp điều kiện học bài giảng tiếp theo với bộ đếm 60% thời lượng video thực tế
- Bắt đầu: 2026-11-13 03:47
- Mục tiêu: Thêm bộ đếm thời gian xem thực tế (`watchedSeconds`) chỉ đếm khi video đang phát (`Play`), lưu cộng dồn vào DB, cho phép học viên tua tự do, tự động đánh dấu hoàn thành phần video và mở khóa trắc nghiệm / bài tiếp theo ngay khi bộ đếm đạt 60% thời lượng bài giảng, đồng thời chặn lách luật tua nhanh đến cuối video và hiển thị cảnh báo khi chưa đủ 60%.
- Phạm vi dự kiến:
  - src/modules/enrollments/schemas/lesson-progress.schema.ts
  - src/modules/enrollments/dto/update-lesson-progress.dto.ts
  - src/modules/enrollments/dto/enrollment-response.dto.ts
  - src/modules/enrollments/enrollments.service.ts
  - src/modules/enrollments/enrollments.service.spec.ts
  - client/src/types/learning.ts
  - client/src/services/enrollments.api.ts
  - client/src/components/learning/LessonVideoPlayer.vue
  - client/src/pages/student/CourseLearningPage.vue
- Backup đã tạo: backup/<đường dẫn file>.20261113-0347.bak cho toàn bộ 9 file trên
- Hoàn thành: 2026-11-13 03:55
- Tóm tắt thay đổi: Bổ sung trường `watchedSeconds` vào `LessonProgress` schema, DTO và `EnrollmentsService` để lưu cộng dồn tổng thời gian thực tế học viên bật phát video; chặn hoàn toàn việc tua nhanh đến cuối video để qua bài ở tầng Backend (chỉ đánh dấu `watchedFully = true` khi `watchedSeconds >= Math.ceil(duration * 0.6)`). Trên `LessonVideoPlayer.vue`, gỡ khóa tua (`seek`) để học viên tua tự do, thêm bộ đếm ngầm 1 giây chỉ chạy khi video đang phát (`isPlaying`), tự động báo hoàn thành video và mở khóa bài tiếp theo / trắc nghiệm ngay khi chạm mốc 60% thời lượng, đồng thời hiển thị cảnh báo nhắc nhở nếu video kết thúc mà chưa tích lũy đủ 60% thời lượng. Toàn bộ 57 unit tests, `lint.mjs` (0 FAIL) và `npm run build` đều đạt.
