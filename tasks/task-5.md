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
