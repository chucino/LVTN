# Sơ đồ lớp NextCode đã đối chiếu mã nguồn

Các sơ đồ use case chuyển từ 5 file PlantUML được lưu riêng trong [usecase](usecase/): [tổng quát](usecase/01_usecase_tong_quat.mdj), [khách và học viên](usecase/02_usecase_guest_student.mdj), [giảng viên](usecase/03_usecase_giang_vien.mdj), [quản trị viên](usecase/04_usecase_quan_tri_vien.mdj), [include/extend](usecase/05_usecase_include_extend.mdj). Đây là các model StarUML có thể chỉnh sửa; giữ nguyên nội dung và chiều quan hệ của PlantUML nguồn. Sinh lại bằng `python docs/diagrams/generate_usecases.py` (có thể truyền thư mục nguồn ở tham số đầu). Đã kiểm tra số tác nhân/use case/quan hệ, ID, tham chiếu và các trường theo metamodel StarUML đã cài; các tác nhân/use case không chồng lấn. Chưa xác minh đầy đủ phần hiển thị trong ứng dụng StarUML.

Ngày đối chiếu: **21/11/2026**. Mô tả và các nhận xét nằm trong [So_Do_Lop_Moi.md](../So_Do_Lop_Moi.md).

## Mở và sử dụng

* [So_Do_Lop_NextCode.mdj](So_Do_Lop_NextCode.mdj): bản mới cho StarUML, có 6 diagram trong model `NextCode`; các enum/constant nằm trong cây model. Dùng **File → Open**, sau đó mở diagram muốn xem trong Model Explorer. File cũ `sodolop.mdj` không bị ghi đè.
* SVG: ảnh vector có thể phóng to hoặc chèn vào tài liệu; nên dùng các sơ đồ chi tiết để trình bày luận văn.
* PNG: ảnh xem nhanh, giới hạn kích thước để thuận tiện mở; SVG giữ chất lượng khi phóng to.

| Bản vẽ | SVG | PNG |
| --- | --- | --- |
| Tổng quan (đầy đủ 100% thuộc tính, rút gọn các liên kết phụ) | [SVG](00_Tong_Quan.svg) | [PNG](00_Tong_Quan.png) |
| Người dùng và xác thực | [SVG](01_Nguoi_Dung_Xac_Thuc.svg) | [PNG](01_Nguoi_Dung_Xac_Thuc.png) |
| Khóa học, tiến độ và chứng chỉ | [SVG](02_Khoa_Hoc_Hoc_Tap.svg) | [PNG](02_Khoa_Hoc_Hoc_Tap.png) |
| Đơn hàng và thanh toán | [SVG](03_Don_Hang_Thanh_Toan.svg) | [PNG](03_Don_Hang_Thanh_Toan.png) |
| Hỏi đáp, đánh giá và kiểm duyệt | [SVG](04_Tuong_Tac_Kiem_Duyet.svg) | [PNG](04_Tuong_Tac_Kiem_Duyet.png) |
| Dịch vụ và guard (đầy đủ 100% thuộc tính tiêm phụ thuộc và phương thức) | [SVG](05_Dich_Vu.svg) | [PNG](05_Dich_Vu.png) |

## Quy ước và phạm vi

Màu xanh chỉ collection; vàng chỉ dữ liệu nhúng hoặc interface; xám chỉ service/guard. Hình thoi đặc là composition của cấu trúc nhúng; đường liền là association; nét đứt có mũi tên là dependency. Các quan hệ không có mũi tên không khẳng định chiều điều hướng.

`Otp` không lưu `userId`; `BuiltinCouponRule` là interface dùng bởi `OrdersService`, không phải collection được `Order` tham chiếu. Vì vậy chúng không có đường khóa ngoại trong sơ đồ dữ liệu. Các liên kết dịch vụ đến model được trình bày trong Mermaid ở tài liệu mô tả; sơ đồ dịch vụ xuất ảnh tập trung vào các service/guard và quan hệ giữa chúng.

Bội số mô tả cấu trúc tổng quát, bao gồm khóa học nháp. Liên kết đến bài/câu hỏi nhúng là tham chiếu logic; không giả định MongoDB tự thực thi khóa ngoại hoặc cascade. Các trường `isActive` được đánh dấu dẫn xuất; `[0..1]` biểu thị trường TypeScript tùy chọn. Các hành vi nghiệp vụ được đặt ở service. Các phương thức service trong bản vẽ là danh sách chọn lọc.

## Sinh lại và kiểm tra

Chạy tại thư mục gốc dự án, cần Python 3 và Graphviz có lệnh `dot`:

```powershell
python docs/diagrams/generate.py
```

Script đọc hai khối Mermaid trong tài liệu, bổ sung kiểu nullable/tùy chọn từ schema, lấy enum đã liệt kê từ mã nguồn và xuất `.dot`, `.svg`, `.png`, `model.json`, `.mdj`. `model.json` dùng để kiểm tra danh sách lớp/thuộc tính/quan hệ.

Đã kiểm tra JSON, tính duy nhất ID và toàn bộ `$ref` trong `.mdj`, kết xuất bằng Graphviz và xem ảnh đầu ra. Chưa xác minh giao diện hiển thị của file mới bằng ứng dụng StarUML; bố trí đường nối có thể cần tinh chỉnh khi mở bằng phiên bản StarUML đang dùng. Không chạy ứng dụng hoặc thanh toán thật vì thay đổi chỉ nằm trong tài liệu/bản vẽ.
