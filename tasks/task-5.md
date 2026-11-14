# Task Log - Batch 5 (#041 - #050)

## [x] #041 - Tinh chỉnh bố cục trang học tập & Hiển thị nguyên bản định dạng file tài liệu (.docx, .pdf, .md, .txt) trong Nội dung bài đọc
- Bắt đầu: 2026-11-15 04:04
- Mục tiêu: Đưa phần "Nội dung bài đọc" lên trên và chuyển khối "Tài liệu bài giảng đính kèm" xuống dưới ngay phía trên nút "Hoàn thành bài học"; xóa dòng chữ hướng dẫn phụ và căn giữa nút "Hoàn thành bài học"; hiển thị trực tiếp định dạng gốc của file tài liệu (`.docx`, `.pdf`, `.md`, `.txt`) ngay trong phần "Nội dung bài đọc" mà không tự động đổ chữ thô vào ô nhập văn bản của giảng viên.
- Phạm vi đã thực hiện:
  - client/src/services/uploads.api.ts
  - client/src/lib/docx-parser.ts
  - client/src/components/learning/LessonDocumentViewer.vue
  - client/src/pages/student/CourseLearningPage.vue
  - client/src/components/manage/LessonEditorDialog.vue
- Backup đã tạo:
  - backup/client/src/services/uploads.api.ts.20261115-040400.bak
  - backup/client/src/pages/student/CourseLearningPage.vue.20261115-040400.bak
  - backup/client/src/components/manage/LessonEditorDialog.vue.20261115-040400.bak
- Hoàn thành: 2026-11-15 04:13
- Tóm tắt thay đổi: Tạo mới `docx-parser.ts` và `LessonDocumentViewer.vue` để đọc và hiển thị nguyên bản định dạng của file `.docx` (tiêu đề, in đậm, in nghiêng, gạch chân, gạch ngang, cỡ chữ, phông chữ, màu chữ/tô sáng, căn lề trái/giữa/phải/đều, khoảng cách dòng thật không bị nhảy cách 2 dòng, danh sách, bảng biểu, hình ảnh nhúng), `.pdf` (`<iframe>`), `.txt` và `.md` ngay trong khung "Nội dung bài đọc". Chuyển khối "Tài liệu bài giảng đính kèm" xuống phía dưới bài đọc (ngay trên nút "Hoàn thành bài học"), xóa dòng chữ hướng dẫn phụ và căn giữa nút "Hoàn thành bài học" trong `CourseLearningPage.vue`. Cập nhật `LessonEditorDialog.vue` để khi tải file tài liệu lên chỉ lưu đính kèm file gốc chứ không tự động chèn chữ thô vào ô nhập văn bản của giảng viên.

## [x] #042 - Nâng cấp ràng buộc thông tin khóa học: bỏ bắt buộc 4 trường (Danh mục, Khóa học phù hợp với ai?, Bạn học được gì?, Yêu cầu đầu vào) và bỏ giới hạn số ký tự tối thiểu
- Bắt đầu: 2026-11-15 04:50
- Mục tiêu: Cho phép để trống hoàn toàn các trường Danh mục, Khóa học phù hợp với ai?, Bạn học được gì? và Yêu cầu đầu vào khi tạo/sửa/duyệt khóa học; bỏ giới hạn số ký tự tối thiểu (minLength) trên toàn bộ biểu mẫu tạo/sửa khóa học đồng bộ cả Frontend và Backend; tự động ẩn các khối trống trên trang Chi tiết khóa học công khai.
- Phạm vi đã thực hiện:
  - src/modules/courses/schemas/course.schema.ts
  - src/modules/courses/dto/manage-course.dto.ts
  - src/modules/courses/manage-course-readiness.ts
  - src/modules/courses/course-manage.service.ts
  - src/modules/courses/manage-course.serializer.ts
  - src/modules/courses/courses.service.ts
  - src/modules/courses/serializers/course.serializer.ts
  - src/modules/courses/course-manage.service.spec.ts
  - client/src/types/manage-course.ts
  - client/src/components/manage/CourseInfoForm.vue
  - client/src/pages/public/CourseDetailPage.vue
- Backup đã tạo: backup/<đường dẫn file>.20261115-045000.bak cho toàn bộ 11 file trên
- Hoàn thành: 2026-11-15 04:56
- Tóm tắt thay đổi: Bỏ `required: true` cho `categoryId`, `targetAudience`, `learningOutcomes`, `requirements` trong `Course` schema; cập nhật `CreateManageCourseDto`/`UpdateManageCourseDto` bỏ toàn bộ giới hạn số ký tự tối thiểu (`minLength`) và cho phép để trống 4 trường trên; gỡ bỏ kiểm tra bắt buộc 4 trường này khỏi `getCourseReadiness`; cập nhật pipeline `$lookup` danh mục với `preserveNullAndEmptyArrays: true` trong `CourseManageService` và `CoursesService`. Trên `CourseInfoForm.vue`, bỏ dấu `*` bắt buộc và bỏ toàn bộ kiểm tra số ký tự tối thiểu. Trên `CourseDetailPage.vue`, tự động ẩn các khối bị để trống. Toàn bộ 61/61 unit tests, `lint.mjs` (0 FAIL, 0 WARN) và build Backend/Frontend đều đạt.

## [ ] #043 - Nâng cấp giao diện thẻ khóa học: thêm huy hiệu Vương miện (Crown) cho khóa PRO, bỏ mục trình độ và làm nổi bật giá khóa PRO
- Bắt đầu: 2026-11-15 05:04
- Mục tiêu: Thêm huy hiệu Vương miện vàng (Crown) trên góc ảnh bìa của khóa học PRO kèm nhãn PRO rõ nét ở thân thẻ; bỏ hiển thị mục Trình độ (level) trên thẻ khóa học; tăng cỡ chữ và đổi màu cam đỏ nổi bật (#f05123) cho giá tiền của khóa PRO (hiển thị kèm giá gốc gạch ngang nếu có ưu đãi).
- Phạm vi dự kiến:
  - client/src/components/course/CourseCover.vue
  - client/src/components/course/CourseCard.vue
- Backup đã tạo:
  - backup/client/src/components/course/CourseCover.vue.20261115-050400.bak
  - backup/client/src/components/course/CourseCard.vue.20261115-050400.bak

## [x] #043 - Nâng cấp giao diện thẻ khóa học: thêm huy hiệu Vương miện (Crown) cho khóa PRO, bỏ mục trình độ và làm nổi bật giá khóa PRO
- Bắt đầu: 2026-11-15 05:04
- Mục tiêu: Thêm huy hiệu Vương miện vàng (Crown) trên góc ảnh bìa của khóa học PRO kèm nhãn PRO rõ nét ở thân thẻ; bỏ hiển thị mục Trình độ (level) trên thẻ khóa học; tăng cỡ chữ và đổi màu cam đỏ nổi bật (#f05123) cho giá tiền của khóa PRO (hiển thị kèm giá gốc gạch ngang nếu có ưu đãi).
- Phạm vi đã thực hiện:
  - client/src/components/course/CourseCover.vue
  - client/src/components/course/CourseCard.vue
- Backup đã tạo:
  - backup/client/src/components/course/CourseCover.vue.20261115-050400.bak
  - backup/client/src/components/course/CourseCard.vue.20261115-050400.bak
- Hoàn thành: 2026-11-15 05:06
- Tóm tắt thay đổi: Cập nhật `CourseCover.vue` nhận prop `isPro` và hiển thị huy hiệu Vương miện vàng (`Crown` từ `lucide-vue-next` với màu `#facc15`/`#f59e0b`) trong ô vuông bo góc ở góc trên bên trái ảnh bìa khóa học PRO. Cập nhật `CourseCard.vue`: bỏ hiển thị badge trình độ (`course.level`), nâng cấp nhãn `Crown + PRO` màu vàng cam ở thân thẻ, và làm nổi bật giá khóa học PRO với cỡ chữ lớn đậm màu cam đỏ (`#f05123`) kèm giá gốc gạch ngang nếu có giảm giá. Kiểm tra `lint.mjs` (0 FAIL, 0 WARN) và `npm --prefix client run build` đều đạt.
