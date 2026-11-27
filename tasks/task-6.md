# Task 6

Tiếp nối các nhiệm vụ sau #050. Các nhiệm vụ đến #050 đã hoàn tất tại task-5.md.

## [x] #051 - Viết Chương 2 Cơ sở lý thuyết theo mã nguồn và cập nhật file Drive

- Bắt đầu: 2026-11-22
- Phạm vi: cả hai, nghiên cứu mã nguồn và biên soạn tài liệu
- File liên quan: Drive 1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED, báo cáo mẫu 1AHeMqn3GjcM7BH4aNtcu04R6YUSQsFh2, docs/report-work/20261122-chapter2
- Mô tả: Đọc Chương 2 mẫu, kiểm tra công nghệ thực dùng trong mã nguồn, lập dàn ý và viết Cơ sở lý thuyết. Cập nhật đúng file Word hiện có trên Drive, đồng bộ mục lục và các dẫn chiếu cần thiết, kiểm tra trang trước khi lưu.
- Backup: docs/report-work/20261122-chapter2/source-drive.docx tải nguyên gốc trước chỉnh sửa; bản lưu bổ sung backup/docs/report-work/20261122-chapter2/LUANVAN.docx.20261122-chapter2.bak trước khi thay thế file Drive.
- Hoàn thành: 2026-11-22 11:31 UTC+7
- Tóm tắt thay đổi: Đối chiếu Chương 2 mẫu và mã nguồn thực tế, viết 10 mục chính về mô hình web, TypeScript, Vue, NestJS, MongoDB, xác thực, email, payOS, kiểm thử và tài liệu API. Thêm sơ đồ, bảng tổng hợp và 20 chú thích nguồn chính thức. Giữ nguyên 26 bảng, 4 hình và nội dung đã duyệt, ngoài hai đoạn dẫn cần đồng bộ bố cục chương. Giữ định dạng mục lục của bản Drive mới nhất, bổ sung mục mới và cập nhật số trang. Xuất Word thành PDF nội bộ 69 trang để kiểm tra trực quan; xác minh liên kết và số trang. Đã thay thế trực tiếp file Drive đúng ID và tải lại kiểm tra SHA-256 trùng bản cuối. Bằng chứng tại docs/report-work/20261122-chapter2/validation.json và publish-proof.json. Không sửa mã nguồn chương trình.

## [x] #052 - Viết Chương 3 Thiết kế và cài đặt giải pháp và cập nhật file Drive

- Bắt đầu: 2026-11-22
- Phạm vi: cả hai, nghiên cứu mã nguồn và biên soạn tài liệu
- File liên quan: Drive 1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED, mẫu 1AHeMqn3GjcM7BH4aNtcu04R6YUSQsFh2, thư mục sơ đồ UseCase và Class, docs/report-work/20261122-chapter3
- Mô tả: Đọc Chương 3 mẫu, đối chiếu schema, API và giao diện thực tế. Vẽ phân rã chức năng, mô tả kiến trúc, dữ liệu, cài đặt nghiệp vụ và cấu hình chạy. Đưa hình giao diện khi lấy được từ chương trình. Cập nhật đúng file Drive, đồng bộ mục lục và kiểm tra bố cục.
- Backup: backup/docs/report-work/20261122-chapter3/LUANVAN.docx.20261122-chapter3.bak, từ bản Drive xác minh metadata không đổi kể từ lần cập nhật Chương 2.
- Hoàn thành: 2026-11-22 12:07 UTC+7
- Tóm tắt thay đổi: Tham khảo Chương 3 mẫu, các use case trên Drive và sơ đồ class; đối chiếu schema, controller, service và trang Vue hiện tại. Bổ sung Chương 3 với 7 mục chính, 22 bảng, 9 sơ đồ tự vẽ và 7 ảnh giao diện chụp từ ứng dụng thật. Mô tả đầy đủ trường của 18 cấu trúc dữ liệu, trong đó 15 tập hợp lưu riêng; kiểm tra tên trường bằng cây cú pháp TypeScript. Giải thích chính xác ngưỡng video 60%, trắc nghiệm, mã làm mới ngẫu nhiên, thanh toán, chứng chỉ in từ giao diện và cấu hình lưu tệp. Giữ nguyên nội dung cũ, 27 bảng, 5 hình và 22 chú thích; chỉ bổ sung chương và cập nhật mục lục, danh mục, số trang. Xuất kiểm tra Word nội bộ 107 trang, Chương 3 ở trang 73–107. Đã cập nhật đúng ID Drive và tải lại đối chiếu SHA-256 trùng bản cuối. Kết quả tại validation.json và publish-proof.json trong thư mục công việc. Không sửa mã nguồn, không chạy seed, không thay đổi dữ liệu nghiệp vụ; đã dừng hai tiến trình ứng dụng mở để chụp giao diện.

## [x] #053 - Viết Chương 4 Kiểm thử và đánh giá theo kết quả thực tế

- Bắt đầu: 2026-11-22
- Phạm vi: cả hai, kiểm tra mã nguồn và biên soạn tài liệu
- File liên quan: Drive 1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED, Chương 5 báo cáo mẫu 1AHeMqn3GjcM7BH4aNtcu04R6YUSQsFh2, các tệp src/**/*.spec.ts, docs/report-work/20261122-chapter4
- Mô tả: Đọc mẫu, kiểm tra các tình huống đã cài đặt và chạy kiểm thử để lấy số liệu. Viết phạm vi, phương pháp, tình huống, kết quả và đánh giá có giới hạn rõ ràng. Giữ nguyên phần người dùng đã sửa, cập nhật đúng file Drive và kiểm tra bố cục.
- Backup: docs/report-work/20261122-chapter4/source-drive.docx và backup/docs/report-work/20261122-chapter4/LUANVAN.docx.20261122-chapter4.bak tải mới từ Drive trước chỉnh sửa.
- Hoàn thành: 2026-11-22 15:32 UTC+7
- Tóm tắt thay đổi: Tham khảo Chương 5 mẫu, đọc các phép kiểm tra trong mã nguồn và chạy đúng bộ kiểm thử hiện có. Kết quả 66/66 tình huống đạt trong 8 tệp, không bỏ qua; độ bao phủ dòng máy chủ 44,28% trên phạm vi 93 tệp được công cụ thu thập. Biên dịch máy chủ, kiểm tra kiểu và đóng gói giao diện thành công; ghi nhận cảnh báo kích thước gói. Bổ sung Chương 4 với 7 mục chính, 16 bảng, 66 mã tình huống và phần đánh giá giới hạn, không ghi dữ liệu mô phỏng thành kết quả dịch vụ thật. Giữ nguyên nội dung cũ, 49 bảng, 21 hình và toàn bộ các phần khác trong gói DOCX; chỉ sửa document.xml để thêm chương và đồng bộ điều hướng. Hợp nhất mục lục bị chia giữa vùng điều khiển và các đoạn liên kết cũ thành 179 mục, giữ định dạng người dùng, cập nhật danh mục bảng và số trang. Xuất kiểm tra Word nội bộ 127 trang, Chương 4 ở trang 109–127, rà soát ảnh trang và liên kết. Đã thay thế đúng file ID trên Drive, tải lại và đối chiếu SHA-256 trùng bản cuối. Bằng chứng tại validation.json, test-evidence.json và publish-proof.json. Không sửa mã nguồn chương trình, không thêm kiểm thử hoặc thực hiện giao dịch thật.

## [x] #054 - Sửa lỗi tạo/lưu khóa học PRO và loại bỏ ô Giá ưu đãi trên form quản lý khóa học

- Bắt đầu: 2026-11-27 22:40
- Phạm vi: client
- File liên quan: client/src/components/manage/CourseInfoForm.vue
- Mô tả: Xử lý lỗi TypeError khi tạo/lưu khóa học PRO có Giá ưu đãi theo lựa chọn của người dùng: xóa bỏ ô "Giá ưu đãi (tùy chọn)" trên form thông tin khóa học, giữ nguyên 100% giao diện ô "Giá (VNĐ)", luôn gửi `discountPrice: null` và chuẩn hóa ép kiểu `price` giữa `string`/`number` khi dùng `v-model` trên `<input type="number">`.
- Backup: backup/client/src/components/manage/CourseInfoForm.vue.20261127-pro-price.bak
- Hoàn thành: 2026-11-27 22:42
- Tóm tắt thay đổi: Đã xóa ô nhập "Giá ưu đãi (tùy chọn)" (`discountPrice`) khỏi `CourseInfoForm.vue`, cố định `discountPrice: null` trong payload tạo/cập nhật khóa học, đồng thời chuẩn hóa xử lý `form.price` (`String(form.price ?? '').trim()`) trong `serializeFormState`, `validate()` và `save()` để tránh lỗi ép kiểu `number`/`string` của Vue `v-model` trên `<input type="number">`. Build client (`vue-tsc` + `vite build`) thành công.

## [x] #055 - Nâng cấp giao diện chứng chỉ hiện đại, thay QR bằng Con dấu học viện và xuất PDF 1 trang A4 ngang

- Bắt đầu: 2026-11-27 23:32
- Phạm vi: client
- File liên quan: client/src/components/certificate/CertificateCardView.vue, client/src/pages/student/ProfilePage.vue
- Mô tả: Thiết kế lại giao diện chứng chỉ theo phong cách Công nghệ Hiện đại (tông Xanh Navy & Xanh Lam NextCode, khung viền kỷ hà sắc nét); xóa bỏ hoàn toàn mã QR và dòng "Tra cứu trực tuyến /certificates/verify/...", thay bằng Con dấu chứng nhận (Official Seal) của học viện; sửa tính năng "In / Tải PDF" thông qua iframe in độc lập khổ A4 Ngang (Landscape) để chỉ xuất duy nhất khung chứng chỉ vừa khít trên 1 trang giấy (không lẫn header/hồ sơ/footer của trang web).
- Backup: backup/client/src/components/certificate/CertificateCardView.vue.20261127-cert-redesign.bak, backup/client/src/pages/student/ProfilePage.vue.20261127-cert-redesign.bak
- Hoàn thành: 2026-11-27 23:34
- Tóm tắt thay đổi: Đã tái thiết kế hoàn toàn `CertificateCardView.vue` theo phong cách Công nghệ Hiện đại (khung viền kép Navy `#0b1f4d` & Royal Blue `#1d4ed8`, góc kỷ hà, phân cấp chữ rõ nét, khung tên khóa học nổi bật, chữ ký giảng viên kèm monogram). Đã xóa hoàn toàn mã QR và dòng chữ `/certificates/verify/...`, thay bằng Con dấu chứng nhận `NextCode Official Seal` ở chính giữa chân chứng chỉ. Đã nâng cấp hàm `printCertificate()` kết xuất chứng chỉ qua `iframe` độc lập định dạng `@page { size: A4 landscape; margin: 0; }` kích thước chuẩn `297mm × 210mm`, giúp khi bấm "In / Tải PDF" chỉ xuất đúng 1 trang chứng chỉ duy nhất, không bị bể trang và không dính thanh menu, thông tin hồ sơ hay footer của website. Build client (`vue-tsc -b && vite build`) thành công.

## [x] #056 - Tinh chỉnh nội dung chứng chỉ, tích hợp ảnh con_dau.jpg và tải trực tiếp PDF khổ ngang thuận chiều đọc

- Bắt đầu: 2026-11-27 23:54
- Phạm vi: client
- File liên quan: client/src/components/certificate/CertificateCardView.vue, client/public/con_dau.jpg
- Mô tả: Xóa dòng mã số trùng lặp dưới badge "CHỨNG CHỈ ĐÃ XÁC THỰC"; xóa phần tên giảng viên lặp lại phía trên khối "Giảng viên hướng dẫn"; đổi "NextCode Official Seal" thành "NEXTCODE"; đồng bộ "NEXTCODE ACADEMY" / "NextCode Academy" thành "NEXTCODE CENTER" / "NextCode Center"; thay con dấu bằng ảnh `con_dau.jpg` người dùng cung cấp; chuyển nút xuất PDF sang tải trực tiếp file `.pdf` 1 trang khổ A4 ngang (`/MediaBox [0 0 841.89 595.28]`, `/Rotate 0`) để khi mở trên WPS Office luôn nằm ngang thuận chiều đọc, không bị xoay dọc 90 độ.
- Backup: backup/client/src/components/certificate/CertificateCardView.vue.20261127-cert-pdf-landscape.bak
- Hoàn thành: 2026-11-27 23:57
- Tóm tắt thay đổi: Đã xóa dòng `MÃ SỐ:` trùng lặp dưới badge `CHỨNG CHỈ ĐÃ XÁC THỰC`; xóa tên giảng viên lặp lại phía trên khối `Giảng viên hướng dẫn`; đổi nhãn dưới con dấu thành `NEXTCODE`; đồng bộ toàn bộ `NEXTCODE ACADEMY` / `NextCode Academy` thành `NEXTCODE CENTER` / `NextCode Center`; đưa ảnh con dấu người dùng cung cấp vào `client/public/con_dau.jpg` và hiển thị cả trên giao diện lẫn bản xuất PDF. Đã nâng cấp nút `Tải PDF` sang kết xuất Canvas 300 DPI (`2480x1754`) và đóng gói trực tiếp thành file PDF chuẩn khổ A4 ngang (`/MediaBox [0 0 841.89 595.28]`, `/Rotate 0`), tải thẳng về máy file `Chung-chi-{code}.pdf` hiển thị nằm ngang thuận chiều đọc trên WPS Office và mọi trình đọc PDF. Build client thành công.

## [x] #057 - Thu gọn khoảng trắng dưới tên khóa học trong file PDF chứng chỉ khớp với giao diện web

- Bắt đầu: 2026-11-28 00:02
- Phạm vi: client
- File liên quan: client/src/components/certificate/CertificateCardView.vue
- Mô tả: Loại bỏ khoảng trắng thừa bên dưới hộp tên khóa học khi tải file PDF chứng chỉ bằng cách tính động tọa độ chân chứng chỉ (`footerDividerY`) ngay dưới hộp tên khóa học và tự động co chiều cao khung chứng chỉ (`innerH`, `outerH`, `H`) cùng `MediaBox` của trang PDF ngang theo đúng tỷ lệ hiển thị trên web.
- Backup: backup/client/src/components/certificate/CertificateCardView.vue.20261128-cert-pdf-spacing.bak
- Hoàn thành: 2026-11-28 00:05
- Tóm tắt thay đổi: Đã điều chỉnh `downloadCertificatePdf()` trong `CertificateCardView.vue` để đặt đường kẻ chân chứng chỉ (`footerDividerY = boxY + boxH + 84`) ngay dưới hộp tên khóa học (đối xứng với khoảng cách phía trên tiêu đề `CERTIFICATE OF COMPLETION`), đồng thời tính động chiều cao khung chứng chỉ (`innerH`, `outerH`, `H`) và `MediaBox` trang PDF ngang để ôm sát nội dung giống hệt bản chứng chỉ trên giao diện web. Build client thành công.

## [x] #058 - Điều chỉnh thang số lần vi phạm bình luận và hình thức xử lý mới (1-3, 4-6, 7-10, >10)

- Bắt đầu: 2026-11-28 02:20
- Phạm vi: cả hai (server, client, test & tài liệu)
- File liên quan: src/modules/questions/questions.service.ts, src/modules/questions/questions.service.spec.ts, client/src/pages/manage/ManageReportsPage.vue, docs/So_Do_UseCase.md, docs/So_Do_Lop_Moi.md
- Mô tả: Cập nhật bảng ngưỡng xử phạt vi phạm tích lũy từ 5 mốc cũ (1-5, 6-10, 11-15, 16-19, >=20) sang 4 mốc mới theo yêu cầu: 1-3 lần (Nhắc nhở), 4-6 lần (Hạn chế bình luận 24 giờ), 7-10 lần (Hạn chế bình luận 7 ngày và cảnh cáo), trên 10 lần (>=11) hoặc vi phạm đặc biệt nghiêm trọng (Khóa tài khoản theo quyết định của quản trị viên).
- Backup: backup/src/modules/questions/questions.service.ts.20261128-penalty-tiers.bak, backup/src/modules/questions/questions.service.spec.ts.20261128-penalty-tiers.bak, backup/client/src/pages/manage/ManageReportsPage.vue.20261128-penalty-tiers.bak
- Hoàn thành: 2026-11-28 02:22
- Tóm tắt thay đổi: Đã cập nhật hàm `computePenalty()` trong `questions.service.ts`, bộ xem trước mức phạt `penaltyPreview` cùng ngưỡng cảnh báo `HIGH_VIOLATION_THRESHOLD = 3` trong `ManageReportsPage.vue`, cập nhật unit test `questions.service.spec.ts` và đồng bộ đặc tả trong `docs/So_Do_UseCase.md`, `docs/So_Do_Lop_Moi.md` theo đúng 4 mốc mới: 1–3 lần (Nhắc nhở), 4–6 lần (Hạn chế bình luận 24 giờ), 7–10 lần (Hạn chế bình luận 7 ngày và cảnh cáo), trên 10 lần hoặc vi phạm đặc biệt nghiêm trọng (Khóa tài khoản). Kiểm thử Vitest và build client thành công.

## [x] #059 - Nâng cấp cơ chế kiểm duyệt báo cáo vi phạm 2 tuyến (Tự động chuyển Admin từ mốc >=3, gộp nút xử lý Admin và thu hồi phiên khi khóa TK)

- Bắt đầu: 2026-11-28 02:48
- Phạm vi: cả hai (server, client & test)
- File liên quan: src/modules/questions/questions.module.ts, src/modules/questions/questions.service.ts, src/modules/questions/questions.service.spec.ts, src/modules/reviews/reviews.service.ts, client/src/pages/manage/ManageReportsPage.vue
- Mô tả: Áp dụng 3 cải tiến cho quy trình xử lý báo cáo vi phạm: (1) Tự động phân tuyến thẳng lên Admin (`ESCALATED`) khi người bị báo cáo đã có >= 3 lần vi phạm tích lũy, đồng thời tự động nâng cấp các báo cáo `PENDING` còn lại của người đó lên `ESCALATED` ngay khi chạm mốc 3 lần vi phạm; (2) Gộp nút xử lý ở giao diện Admin thành một nút "Xử lý vi phạm và áp dụng hình phạt" chuẩn theo bảng quy định (tránh bấm nhầm nút chỉ nhắc nhở) và ẩn nút "Xóa và nhắc nhở" ở phía Giảng viên nếu tác giả đã có >= 3 lần vi phạm; (3) Thu hồi toàn bộ `RefreshToken` ngay khi tài khoản bị khóa (`LOCKED`) do vi phạm bình luận.
- Backup: backup/src/modules/questions/questions.service.ts.20261128-moderation-v2.bak, backup/src/modules/questions/questions.module.ts.20261128-moderation-v2.bak, backup/src/modules/questions/questions.service.spec.ts.20261128-moderation-v2.bak, backup/src/modules/reviews/reviews.service.ts.20261128-moderation-v2.bak, backup/client/src/pages/manage/ManageReportsPage.vue.20261128-moderation-v2.bak
- Hoàn thành: 2026-11-28 02:51
- Tóm tắt thay đổi: Đã cập nhật `questions.service.ts` và `reviews.service.ts` để tự động chuyển thẳng báo cáo lên `ESCALATED` (Admin) khi người bị báo cáo đã có `violationCount >= 3`, đồng thời tự động nâng cấp mọi báo cáo `PENDING` còn lại của người đó lên `ESCALATED` ngay khi chạm mốc 3 lần vi phạm; bổ sung thu hồi toàn bộ `RefreshToken` (`isRevoked = true`) khi tài khoản bị khóa do vi phạm bình luận; cập nhật `ManageReportsPage.vue` gộp nút xử lý của Admin thành 1 nút "Xử lý vi phạm và áp dụng hình phạt" thống nhất theo bảng quy định và ẩn nút "Xóa và nhắc nhở" ở phía Giảng viên khi học viên đã có >= 3 lần vi phạm. Toàn bộ unit test và build client thành công.

## [x] #060 - Thống nhất thông báo phản hồi khi người dùng gửi báo cáo vi phạm

- Bắt đầu: 2026-11-28 03:03
- Phạm vi: server
- File liên quan: src/modules/questions/questions.service.ts, src/modules/reviews/reviews.service.ts
- Mô tả: Giữ nguyên cơ chế tự động chuyển thẳng báo cáo lên Admin ngầm ở phía sau khi tài khoản tái phạm nhiều lần, nhưng luôn trả về thông báo thống nhất "Đã ghi nhận báo cáo vi phạm. Cảm ơn bạn đã đóng góp xây dựng cộng đồng học tập!" cho người báo cáo để không tiết lộ trạng thái vi phạm nội bộ của tài khoản khác.
- Backup: backup/src/modules/questions/questions.service.ts.20261128-moderation-v2.bak, backup/src/modules/reviews/reviews.service.ts.20261128-moderation-v2.bak
- Hoàn thành: 2026-11-28 03:04
- Tóm tắt thay đổi: Đã cập nhật `reportComment()` trong `questions.service.ts` và `reportCourseReview()` trong `reviews.service.ts` để luôn trả về thông báo tiêu chuẩn "Đã ghi nhận báo cáo vi phạm. Cảm ơn bạn đã đóng góp xây dựng cộng đồng học tập!" cho người gửi báo cáo trong mọi trường hợp. Kiểm thử Vitest đạt 100%.
