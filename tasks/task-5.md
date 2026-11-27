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

## [x] #044 - Tích hợp cổng thanh toán VietQR tự động payOS, quản lý Đơn hàng & Giao dịch cho khóa học PRO
- Bắt đầu: 2026-11-15 14:42
- Phạm vi: cả hai (server + client)
- File liên quan:
  - .env, .env.example
  - .agent/skills/project-architecture/references/tech-stack.md
  - src/app.module.ts
  - src/common/constants/order.enum.ts
  - src/modules/orders/schemas/order.schema.ts
  - src/modules/orders/schemas/payment-transaction.schema.ts
  - src/modules/orders/dto/order.dto.ts
  - src/modules/orders/payos.service.ts
  - src/modules/orders/orders.service.ts
  - src/modules/orders/orders.controller.ts
  - src/modules/orders/orders.module.ts
  - src/modules/orders/orders.service.spec.ts
  - client/src/types/order.ts
  - client/src/types/user.ts
  - client/src/services/orders.api.ts
  - client/src/pages/student/CourseCheckoutPage.vue
  - client/src/pages/public/CourseDetailPage.vue
  - client/src/pages/student/ProfilePage.vue
  - client/src/pages/manage/ManageOrdersPage.vue
  - client/src/layouts/ManageLayout.vue
  - client/src/router/index.ts
- Mô tả: Tích hợp cổng thanh toán payOS API v2 (tạo link thanh toán VietQR Pro, đối soát tự động qua API `payment-requests`, xác thực chữ ký HMAC-SHA256 cho Webhook, hỗ trợ giả lập thanh toán khi demo và xác nhận thủ công bởi Admin), xây dựng trang Thanh toán khóa học PRO, lịch sử đơn hàng học viên và trang Quản lý đơn hàng Admin.
- Backup:
  - backup/.env.20261115-144200.bak
  - backup/.env.example.20261115-144200.bak
  - backup/.agent/skills/project-architecture/references/tech-stack.md.20261115-144200.bak
  - backup/src/app.module.ts.20261115-144200.bak
  - backup/client/src/types/user.ts.20261115-144200.bak
  - backup/client/src/router/index.ts.20261115-144200.bak
  - backup/client/src/pages/public/CourseDetailPage.vue.20261115-144200.bak
  - backup/client/src/pages/student/ProfilePage.vue.20261115-144200.bak
  - backup/client/src/layouts/ManageLayout.vue.20261115-144200.bak
- Hoàn thành: 2026-11-15 15:01
- Tóm tắt thay đổi: Cấu hình biến môi trường `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `ORDER_EXPIRE_MINUTES`, `PAYMENT_SIMULATION_ENABLED`. Xây dựng `OrdersModule`, `OrdersService`, `PayosService` với xác thực chữ ký HMAC-SHA256 chuẩn của payOS, tạo link thanh toán VietQR Pro (MB Bank), tự động đồng bộ trạng thái đơn hàng từ API payOS (`POST /orders/:id/sync-payment`), nhận Webhook (`POST /payments/payos/webhook`), hỗ trợ mã giảm giá (`NEXTCODE10`, `SINHVIEN20`, `PRO50K`, `TEST2K`), giả lập thanh toán phục vụ demo và xác nhận thủ công cho Admin. Xây dựng giao diện `CourseCheckoutPage.vue`, mục Đơn hàng & Giao dịch trong `ProfilePage.vue` và trang `ManageOrdersPage.vue` cho Admin. Toàn bộ 66/66 unit tests, `lint.mjs` (0 FAIL, 0 WARN) và build Backend/Frontend đều đạt.

## [x] #045 - Biên soạn lại luận văn từ phần đầu đến hết Chương 1 theo mẫu được cung cấp

- Bắt đầu: 2026-11-21
- Phạm vi: cả hai, chỉ nghiên cứu mã nguồn và biên soạn tài liệu
- File liên quan: Google Docs LUANVAN, docs/report-work/20261121
- Mô tả: đọc quy định và hai luận văn mẫu; đối chiếu mã nguồn; viết bìa, các trang đầu, phần giới thiệu và Chương 1; kiểm tra nội dung cùng bố cục trang.
- Backup: backup/reports/luanvan-before-20261121.json
- Hoàn thành: 2026-11-21
- Tóm tắt thay đổi: Đã viết lại tài liệu Google Docs LUANVAN từ bìa đến hết Chương 1, gồm 32 trang, tóm lược Việt và Anh, phần giới thiệu, 20 trường hợp sử dụng, bảng vai trò, 3 sơ đồ, mục lục liên kết và chú thích nguồn. Đã đối chiếu mã nguồn, chạy 66/66 kiểm thử tự động và kiểm tra toàn bộ ảnh trang từ bản xuất cuối. Thông tin sinh viên Nguyễn Công Chức B2303800 khóa 49, GVHD ThS. Phan Huy Cường. Thời gian nộp và ngày ký chờ bổ sung. Kết quả kiểm tra lưu tại docs/report-work/20261121/validation.json.

## [x] #046 - Rà soát toàn bộ mã nguồn hiện tại và biên soạn tài liệu Sơ đồ lớp mới (docs/So_Do_Lop_Moi.md)

- Bắt đầu: 2026-11-21 11:13
- Phạm vi: cả hai (đối chiếu toàn bộ mã nguồn server + client và tạo tài liệu thiết kế lớp mới)
- File liên quan: docs/So_Do_Lop.md, docs/So_Do_Lop_Moi.md, src/modules/**/schemas/*.ts, src/modules/**/*.service.ts, src/common/constants/*.ts
- Mô tả: Đọc toàn bộ mã nguồn chương trình hiện tại, đối chiếu với tài liệu sơ đồ lớp ban đầu (`docs/So_Do_Lop.md`) và tạo mới tài liệu `docs/So_Do_Lop_Moi.md` phản ánh chính xác 100% các lớp thực thể, subdocument nhúng, enum, lớp dịch vụ, ràng buộc và biểu đồ Mermaid `classDiagram` theo code mới nhất.
- Backup: Không yêu cầu (tạo file mới `docs/So_Do_Lop_Moi.md`, giữ nguyên `docs/So_Do_Lop.md`)
- Hoàn thành: 2026-11-21 11:17
- Tóm tắt thay đổi: Tạo mới `docs/So_Do_Lop_Moi.md` gồm bảng đối chiếu thay đổi so với thiết kế cũ, 2 sơ đồ Mermaid `classDiagram` (Domain/Schema & Service Layer), mô tả chi tiết 11 lớp chính, 12 lớp phụ & subdocument nhúng (`RefreshToken`, `PaymentTransaction`, `LessonComment`, `CourseReview`, `Report`, `Notification`, `ViolationHistoryItem`, `CommentReaction`, `CommentReport`, `CommentReplyToUser`, `BuiltinCouponRule`...), 17 kiểu liệt kê (Enum/Constant), bảng tổng hợp 37 quan hệ giữa các lớp, 14 lớp dịch vụ/Guard và 5 nhóm ràng buộc nghiệp vụ cốt lõi theo đúng code hiện tại.

## [x] #047 - Biên soạn tài liệu Sơ đồ Use Case và Đặc tả chi tiết theo mã nguồn hiện tại (loại bỏ vai trò Kế toán)

- Bắt đầu: 2026-11-21 12:12
- Phạm vi: cả hai (đối chiếu toàn bộ mã nguồn server + client và tạo tài liệu thiết kế Use Case mới)
- File liên quan: docs/So_Do_UseCase.md, src/modules/**/*.controller.ts, src/modules/**/*.service.ts, client/src/router/index.ts, client/src/pages/**/*.vue
- Mô tả: Đọc toàn bộ mã nguồn chương trình hiện tại, loại bỏ hoàn toàn tác nhân Kế toán (chuyển toàn bộ quản lý đơn hàng, đối soát và xác nhận thanh toán thủ công về Quản trị viên - Admin) và biên soạn tài liệu `docs/So_Do_UseCase.md` gồm mô tả tác nhân, các biểu đồ Mermaid Use Case (tổng quát và phân rã theo từng tác nhân có `<<include>>`/`<<extend>>`), bảng tổng hợp và bảng đặc tả chi tiết cho toàn bộ 23 Use Case.
- Backup: Không yêu cầu (tạo file mới `docs/So_Do_UseCase.md`)
- Hoàn thành: 2026-11-21 12:16
- Tóm tắt thay đổi: Tạo mới `docs/So_Do_UseCase.md` xác định 4 tác nhân người dùng (`Khách vãng lai`, `Học viên`, `Giảng viên`, `Quản trị viên` — đã loại bỏ hoàn toàn Kế toán) và 2 tác nhân hệ thống ngoài (`Cổng thanh toán VietQR payOS`, `Dịch vụ Email SMTP`), 4 sơ đồ Mermaid trực quan (sơ đồ tổng quát + 3 sơ đồ phân rã theo tác nhân kèm quan hệ `<<include>>` / `<<extend>>`), bảng danh mục 23 Use Case (`UC01` – `UC23`), 23 bảng đặc tả chi tiết (Tiền/Hậu điều kiện, Luồng sự kiện chính, Luồng rẽ nhánh/ngoại lệ khớp 100% với code hiện tại) và ma trận phân quyền RBAC.

## [x] #048 - Bổ sung đầy đủ 100% thuộc tính, ràng buộc, chỉ mục và phương thức cho toàn bộ 37 lớp (23 lớp dữ liệu & 14 lớp dịch vụ/Guard) trong docs/So_Do_Lop_Moi.md và các bản vẽ UML

- Bắt đầu: 2026-11-21 21:55
- Phạm vi: server (tài liệu thiết kế lớp & script sinh sơ đồ UML)
- File liên quan: docs/So_Do_Lop_Moi.md, docs/diagrams/generate.py, docs/diagrams/README.md, docs/diagrams/*
- Mô tả: Rà soát và điền đầy đủ không rút gọn 100% thuộc tính, kiểu dữ liệu, giá trị mặc định, ràng buộc schema, chỉ mục cho cả 23 lớp thực thể/subdocument (bao gồm lập bảng thuộc tính đầy đủ cho 5 lớp mục 5.8), bổ sung toàn bộ thuộc tính (injected dependencies, fields) và toàn bộ phương thức (`public` + `private`) cho cả 14 lớp Service & Guard trong Mermaid và mục 8, đồng thời bỏ giới hạn cắt 4 thuộc tính (`[:4]`) trong `docs/diagrams/generate.py` và sinh lại toàn bộ sơ đồ SVG/PNG/StarUML.
- Backup:
  - backup/docs/So_Do_Lop_Moi.md.20261121-215500.bak
  - backup/docs/diagrams/generate.py.20261121-215500.bak
- Hoàn thành: 2026-11-21 22:02
- Tóm tắt thay đổi: Cập nhật `docs/So_Do_Lop_Moi.md` điền đầy đủ 100% thuộc tính kèm cột "Ràng buộc & Mặc định trong Schema" và chỉ mục (`Indexes`) cho toàn bộ 23 lớp thực thể/subdocument (tách 5 lớp con mục 5.8 thành 5 bảng thuộc tính chi tiết), bổ sung đầy đủ toàn bộ thuộc tính (`private readonly` injected models/services/fields) và toàn bộ phương thức (`public` + `private`) cho cả 14 lớp `Service` & `Guard` trong sơ đồ Mermaid `3.2` và 14 tiểu mục `8.1` – `8.14`. Cập nhật `docs/diagrams/generate.py` bỏ cắt bớt `[:4]` thuộc tính ở sơ đồ tổng quan và sinh lại toàn bộ file `.mdj`, `.svg`, `.png`, `model.json`.

## [x] #049 - Viết lại riêng Phần I Giới thiệu trong bản Word người dùng đã chỉnh mục lục

- Bắt đầu: 2026-11-22
- Phạm vi: cả hai, chỉ nghiên cứu mã nguồn và chỉnh tài liệu
- File liên quan: LUANVAN.docx do người dùng cung cấp, báo cáo mẫu B2110156, docs/report-work/20261122
- Mô tả: Đọc toàn bộ báo cáo mẫu, xem lại bản Word và mã nguồn; biên soạn lại riêng Phần I; giữ nguyên các phần khác và cấu trúc mục lục người dùng đã chỉnh; render kiểm tra trước khi giao.
- Backup: Giữ nguyên file gốc, xuất bản chỉnh sửa riêng cạnh file gốc.
- Hoàn thành: 2026-11-22
- Tóm tắt thay đổi: Đọc báo cáo tham khảo 209 trang, đối chiếu bản Word và các luồng nghiệp vụ trong mã nguồn; viết lại riêng Phần I với 7 mục chính, giữ 16 tiêu đề và dấu trang phục vụ mục lục. Xuất LUANVAN_Phan_I_da_viet_lai.docx cạnh bản gốc. Giữ nguyên byte XML trước và sau Phần I, toàn bộ mục lục và các thành phần khác trong gói DOCX. Dựng trang bằng Microsoft Word do công cụ render mặc định thiếu LibreOffice; kiểm tra hình ảnh 34 trang, trong đó Phần I từ trang 11 đến 16. Kiểm tra mã băm xác nhận cả bản gốc và bản xuất không thay đổi khi dựng trang. Bằng chứng lưu tại docs/report-work/20261122/preservation-check.json và qa. Không thay đổi chương trình hoặc nội dung các phần còn lại.

## [x] #050 - Viết lại Phần II và Chương 1 trực tiếp trong file luận văn trên Drive

- Bắt đầu: 2026-11-22
- Phạm vi: cả hai, nghiên cứu mã nguồn và cập nhật tài liệu
- File liên quan: Drive 1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED, báo cáo mẫu B2110156, 5 sơ đồ use case người dùng cung cấp, docs/report-work/20261122-chapter1
- Mô tả: Đọc kỹ Phần II và Chương 1 báo cáo mẫu, xem các sơ đồ .mdj, đối chiếu mã nguồn, lập dàn ý và viết lại Chương 1. Giữ nguyên Phần I; cập nhật đúng file Word hiện có trên Drive sau khi kiểm tra trang.
- Backup: docs/report-work/20261122-chapter1/source-drive.docx là bản tải nguyên gốc trước chỉnh sửa.
- Hoàn thành: 2026-11-22 10:25
- Tóm tắt thay đổi: Viết lại Chương 1 theo bố cục mô tả bài toán, yêu cầu, sơ đồ use case, danh mục và đặc tả 23 UC, quy tắc nghiệp vụ và yêu cầu chất lượng. Đọc lại báo cáo mẫu và 5 tệp StarUML người dùng cung cấp; đối chiếu các module chương trình. Trình bày lại 4 sơ đồ phù hợp trang báo cáo, bổ sung 26 bảng và đồng bộ mục lục, danh mục bảng/hình theo kiểu trình bày nguồn. Kiểm tra 55 trang dựng bằng Microsoft Word; Phần I và các đoạn cam kết, tóm lược giữ nguyên byte XML. Cập nhật tại chỗ file Word trên Drive ID 1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED, giữ nguyên thư mục, tên và loại file. Tải lại xác nhận byte trùng bản đã kiểm tra. Bằng chứng tại validation.json và drive-verification.json. Không chỉnh mã nguồn hoặc viết các chương sau.
