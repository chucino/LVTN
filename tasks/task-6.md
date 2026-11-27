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
