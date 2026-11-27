GROUPS = [
('AUTH','Đăng ký tài khoản và phân quyền','auth.service.spec.ts',[
('Đăng ký với mật khẩu và mật khẩu xác nhận khác nhau.','Từ chối yêu cầu vì hai mật khẩu không khớp.'),
('Đăng ký bằng email đã thuộc tài khoản đang hoạt động.','Từ chối đăng ký trùng email.'),
('Gửi thông tin đăng ký hợp lệ với các thành phần lưu trữ và gửi thư được mô phỏng.','Gọi tạo người dùng, tạo OTP và gửi thư; trả về thông báo về mã OTP.'),
('Quản trị viên tự đổi tài khoản của mình sang vai trò thấp hơn.','Từ chối thao tác tự hạ quyền quản trị.'),
('Phân quyền cho mã người dùng không tồn tại trong dữ liệu mô phỏng.','Thông báo không tìm thấy người dùng.'),
('Quản trị viên đổi vai trò của một người dùng sang giảng viên.','Trả về vai trò mới và gọi thu hồi các mã làm mới của người dùng đó.'),
]),
('MAN','Quản lý và xét duyệt khóa học','course-manage.service.spec.ts',[
('Giảng viên truy cập phần quản lý khóa học của giảng viên khác.','Từ chối truy cập ngay tại lớp xử lý nghiệp vụ.'),
('Tài khoản học viên hoặc kế toán yêu cầu danh sách quản lý khóa học.','Từ chối các vai trò không được hỗ trợ.'),
('Giảng viên lấy trang 2 với 5 khóa học mỗi trang, đồng thời truyền mã giảng viên khác.','Điều kiện truy vấn vẫn dùng mã người đang đăng nhập; bỏ qua 5 bản ghi và lấy 5 bản ghi.'),
('Tính quyền thao tác cho các tổ hợp trạng thái khóa học, chủ sở hữu và vai trò.','Khóa nháp của chủ sở hữu được sửa; khóa chờ duyệt được rút duyệt; người không sở hữu không có quyền quản lý tương ứng.'),
('Kiểm tra điều kiện gửi duyệt khi thiếu nội dung hỗ trợ, khi bài học không có video và khi có video nhưng thời lượng bằng 0.','Thiếu ghi chú hoặc tóm tắt của bài Pro chỉ tạo cảnh báo; bài không có video vẫn hợp lệ; video có thời lượng bằng 0 ngăn gửi duyệt.'),
('Gửi duyệt một khóa học đang ở trạng thái nháp và đủ điều kiện.','Chuyển sang chờ duyệt bằng cập nhật có kiểm tra trạng thái cũ; không cho sửa trong trạng thái mới.'),
('Thực hiện các bước rút duyệt, từ chối kèm lý do, phê duyệt, ẩn và duyệt lại.','Các bước hợp lệ trả về đúng trạng thái và thông tin xử lý tương ứng.'),
('Gửi duyệt khóa học đã được phê duyệt.','Từ chối chuyển trạng thái và không gọi cập nhật dữ liệu.'),
('Giảng viên sửa chương khi khóa học đang chờ duyệt.','Từ chối chỉnh sửa và không gọi lưu chương.'),
('Quản trị viên đổi khóa học nháp từ Pro sang miễn phí; giảng viên yêu cầu sửa thông tin thuộc quyền quản trị.','Đặt giá về 0, bỏ giảm giá và nội dung riêng của bài Pro; từ chối thao tác sửa thông tin không thuộc quyền giảng viên.'),
('Gửi danh sách sắp xếp chương không chứa đầy đủ các mã chương hiện có.','Từ chối yêu cầu và không lưu thứ tự mới.'),
('Đảo thứ tự hai chương bằng danh sách mã hợp lệ, trong đó có mã viết hoa.','Nhận diện đúng các mã và gán lại thứ tự liên tiếp từ 1.'),
('Tạo câu hỏi có hai lựa chọn nhưng vị trí đáp án đúng là 2 theo cách đánh số từ 0.','Từ chối vì vị trí hợp lệ chỉ là 0 hoặc 1.'),
('Kiểm tra trường cập nhật nhận giá trị rỗng, đường dẫn ảnh, nội dung nhúng và thay tệp bài học.','Từ chối null ở trường bắt buộc; cho phép ghi chú null; kiểm tra đường dẫn ảnh, lọc nội dung nhúng và gọi xóa tệp cũ qua thành phần mô phỏng.'),
('Kiểm tra dữ liệu có tiêu đề ngắn và các trường không bắt buộc để trống.','Bộ kiểm tra dữ liệu và kiểm tra điều kiện gửi duyệt chấp nhận các giá trị hợp lệ này.'),
]),
('COURSE','Tra cứu khóa học công khai','courses.service.spec.ts',[
('Lọc khóa đã duyệt theo từ khóa, loại, danh mục, trình độ, giá và điểm; lấy trang 3, mỗi trang 10 khóa.','Tạo đúng điều kiện truy vấn và sắp xếp theo giá thực trả; bỏ qua 20 bản ghi; tính 26 kết quả thành 3 trang.'),
('Nhập giá tối thiểu 500.000 đồng và giá tối đa 100.000 đồng.','Từ chối khoảng giá đảo ngược trước khi gọi truy vấn.'),
('Lấy tối đa 6 khóa học nổi bật.','Tạo truy vấn khóa đã duyệt, ưu tiên điểm trung bình, thời gian tạo và mã khóa học theo thứ tự quy định.'),
('Đặt số mục mỗi trang là 51 hoặc số khóa nổi bật là 13.','Bộ kiểm tra dữ liệu từ chối giá trị vượt giới hạn.'),
('Chuyển thông tin khóa học sang dữ liệu chi tiết công khai.','Loại đường dẫn video, ghi chú, tóm tắt, câu hỏi, đáp án và dữ liệu riêng của giảng viên; giữ thông tin giới thiệu bài học được phép công khai.'),
('Truyền mã khóa học sai cấu trúc hoặc kết quả tra cứu rỗng.','Thông báo không tìm thấy khóa học.'),
]),
('LEARN','Đăng ký học và theo dõi tiến độ','enrollments.service.spec.ts',[
('Học viên đăng ký khóa miễn phí rồi đăng ký lại khóa đó.','Lần đầu tạo lượt đăng ký với tiến độ 0 và chỉ mở bài đầu; lần sau bị từ chối do đã đăng ký.'),
('Học viên đăng ký trực tiếp khóa Pro qua chức năng dành cho đăng ký học.','Từ chối vì khóa Pro phải đi qua luồng thanh toán.'),
('Học tuần tự ba bài, cập nhật thời gian xem và nộp bài trắc nghiệm với cả đáp án sai lẫn đúng.','Áp dụng ngưỡng xem 60%, điều kiện qua trắc nghiệm và mở bài kế tiếp; khi hoàn thành thì gọi thành phần cấp chứng chỉ được mô phỏng.'),
('Giảng viên xem danh sách học viên của khóa khác, khóa của mình; quản trị viên xem danh sách.','Từ chối giảng viên không sở hữu; trả về danh sách đúng cho chủ khóa và quản trị viên.'),
('Giảng viên dùng chế độ xem thử bài học và nộp đáp án trắc nghiệm trong chế độ này.','Các bài được mở trong bản xem thử; quyền quản lý vẫn theo chủ sở hữu; dữ liệu đăng ký, tiến độ và lượt làm bài không phát sinh trong kho mô phỏng.'),
]),
('QA','Hỏi đáp và xử lý vi phạm','questions.service.spec.ts',[
('Tính hình thức xử lý tại các mốc 1, 5, 6, 10, 11, 15, 16, 19 và 20 lần vi phạm; xét thêm vi phạm nghiêm trọng.','Trả về đúng các mức nhắc nhở, cấm bình luận 24 giờ, 7 ngày, 30 ngày hoặc khóa tài khoản theo quy tắc đã cài đặt.'),
('Một bình luận gốc bị ẩn nhưng còn câu trả lời được phép hiển thị.','Giữ vị trí bình luận gốc dưới dạng nội dung thay thế và vẫn hiển thị câu trả lời.'),
('Bình luận gốc bị ẩn và không còn câu trả lời được phép hiển thị.','Không đưa bình luận đó vào danh sách trả về.'),
('Người đang bị cấm bình luận lấy danh sách hỏi đáp.','Kết quả có thời điểm kết thúc lệnh cấm của người đó.'),
('Học viên bình luận tại bài học chưa được mở.','Từ chối gửi bình luận.'),
('Tài khoản đang trong thời gian cấm gửi bình luận.','Từ chối và không gọi tạo bình luận.'),
('Người dùng bấm thích một bình luận rồi bỏ thích.','Số lượt thích lần lượt tăng lên 1 và trở về 0.'),
('Báo cáo bình luận của giảng viên phụ trách khóa học.','Tạo báo cáo ở trạng thái chuyển cấp xử lý.'),
('Báo cáo bình luận của học viên.','Tạo báo cáo ở trạng thái chờ xử lý.'),
('Giảng viên ẩn bình luận vi phạm có nhiều báo cáo trùng nhau.','Ghi nhận một lần vi phạm, giải quyết các báo cáo đang chờ hoặc đã chuyển cấp của cùng bình luận và tạo thông báo cho các bên liên quan.'),
('Xử lý bình luận đã được ghi nhận vi phạm trước đó.','Không cộng thêm lần vi phạm cho cùng bình luận.'),
('Bác bỏ báo cáo của một bình luận có nhiều báo cáo trùng nhau.','Đồng bộ trạng thái bác bỏ cho nhóm báo cáo và không cộng vi phạm.'),
('Chuyển cấp nhóm báo cáo đang chờ của cùng một bình luận.','Các báo cáo liên quan chuyển cấp và không cộng vi phạm.'),
('Giảng viên áp dụng hình phạt hoặc xử lý báo cáo đã chuyển cấp.','Từ chối các thao tác vượt quyền giảng viên.'),
('Xử lý lại báo cáo đã hoàn tất.','Từ chối yêu cầu xử lý lần nữa.'),
('Quản trị viên xử lý lần vi phạm thứ 6 khi tài khoản còn bị cấm bình luận 2 giờ.','Cộng thêm 24 giờ vào thời điểm hết lệnh cấm hiện có.'),
('Quản trị viên xử lý một vi phạm nghiêm trọng.','Yêu cầu cập nhật trạng thái tài khoản sang bị khóa trong dữ liệu mô phỏng.'),
('Quản trị viên chọn chuyển cấp báo cáo.','Từ chối thao tác chuyển cấp không hợp lệ đối với quản trị viên.'),
('Danh sách hỏi đáp có giảng viên phụ trách và một giảng viên khác.','Chỉ giảng viên được phân công cho khóa học được đánh dấu là tác giả khóa học.'),
('Giảng viên khác truy cập hỏi đáp của khóa đang ở trạng thái nháp.','Từ chối truy cập khi khóa chưa được phê duyệt.'),
]),
('REV','Đánh giá khóa học','reviews.service.spec.ts',[
('Học viên mới hoàn thành 60% khóa học gửi đánh giá.','Từ chối vì chưa hoàn thành khóa học.'),
('Hai học viên đã hoàn thành gửi điểm 4 và 5; học viên thứ nhất sửa điểm khi tiến độ giảm còn 80% do dữ liệu khóa học thay đổi.','Điểm trung bình ban đầu là 4,5, sau sửa là 5; giữ quyền sửa đánh giá đã có; ưu tiên đánh giá có nhận xét bằng chữ.'),
('Báo cáo đánh giá không có nhận xét, xử lý đánh giá có nội dung vi phạm và gửi nhận xét khi đang bị cấm bình luận.','Từ chối báo cáo chỉ có điểm; ẩn đánh giá vi phạm và tính lại điểm trung bình; chặn người đang bị cấm gửi nhận xét bằng chữ.'),
]),
('PAY','Đơn hàng và thanh toán','orders.service.spec.ts',[
('Tính chữ ký dữ liệu tạo liên kết và kiểm tra chữ ký thông báo thanh toán bằng khóa thử nghiệm.','Chữ ký tạo liên kết có 64 ký tự; thông báo có chữ ký HMAC-SHA256 đúng được chấp nhận, chữ ký sai bị từ chối.'),
('Tính tiền khóa Pro có giá 600.000 đồng, giá giảm còn 500.000 đồng; áp dụng NEXTCODE10 và TEST2K.','NEXTCODE10 giảm thêm 50.000 đồng, còn 450.000 đồng; TEST2K cho giá trị thanh toán 2.000 đồng theo cấu hình thử.'),
('Học viên đã sở hữu khóa học yêu cầu xem trước thanh toán.','Từ chối trước khi tiếp tục mua lại khóa học.'),
('Gửi thông báo thanh toán thử có chữ ký đúng và số tiền 500.000 đồng khớp đơn hàng.','Đơn chuyển sang hoàn tất, được lưu một lần và gọi thành phần tạo đăng ký học được mô phỏng.'),
('Tắt PAYMENT_SIMULATION_ENABLED rồi yêu cầu giả lập thanh toán; đồng thời kiểm tra thông báo có chữ ký sai.','Từ chối giả lập khi cờ đã tắt và từ chối thông báo có chữ ký không hợp lệ.'),
]),
('FILE','Nhận diện và xử lý tệp tải lên','uploads.service.spec.ts',[
('Đưa phần đầu dữ liệu có dấu hiệu JPEG, PNG, WebP và một mẫu giả vào hàm nhận diện ảnh.','Nhận diện đúng ba định dạng và không nhận mẫu giả là ảnh.'),
('Đưa phần đầu dữ liệu có dấu hiệu MP4, WebM và một mẫu giả vào hàm nhận diện video.','Nhận diện đúng hai định dạng và loại mẫu giả.'),
('Tạo tệp thử có phần đầu PNG trong thư mục ảnh khóa học, hoàn tất xử lý rồi xóa.','Trả về đường dẫn nội bộ đúng; tệp tồn tại trước khi xóa và không còn sau khi xóa.'),
('Tạo tệp thử có phần đầu MP4 trong thư mục video, hoàn tất xử lý rồi xóa.','Trả về đường dẫn video nội bộ đúng và xóa được tệp thử.'),
('Tạo tệp có nội dung giả nhưng khai báo kiểu ảnh hoặc video.','Từ chối cả hai mẫu và dọn các tệp thử không hợp lệ.'),
('Yêu cầu xóa bằng URL bên ngoài hoặc đường dẫn đi ra ngoài thư mục cho phép.','Bỏ qua yêu cầu; tệp package.json dùng để đối chiếu vẫn tồn tại.'),
]),
]

CONTENT = '''
# CHƯƠNG 4 KIỂM THỬ VÀ ĐÁNH GIÁ

Chương này trình bày cách kiểm tra các quy tắc xử lý của website đăng ký và học tập trực tuyến các khóa học lập trình cho trung tâm đào tạo. Nội dung tập trung vào những phép kiểm tra đã có trong mã nguồn và kết quả thực hiện ngày 22 tháng 11 năm 2026. Qua đó, người đọc có thể biết chức năng nào đã được kiểm chứng, kết quả thu được và những nội dung còn cần đánh giá trước khi vận hành thực tế.

Trong đợt thực hiện này, 66 tình huống kiểm thử tự động thuộc 8 tệp đều đạt. Phần máy chủ và phần giao diện cũng được biên dịch thành công. Tuy nhiên, các tình huống hiện có chủ yếu kiểm tra lớp xử lý nghiệp vụ với dữ liệu mô phỏng. Kết quả này là căn cứ đánh giá những quy tắc đã được kiểm tra, chưa đủ để kết luận toàn bộ hệ thống hoạt động đúng trong mọi điều kiện sử dụng.

## 4.1 Mục tiêu và phạm vi kiểm thử

### 4.1.1 Mục tiêu kiểm thử

Mục tiêu đầu tiên là kiểm tra xem chương trình có thực hiện đúng các điều kiện nghiệp vụ đã mô tả trong các chương trước hay không. Những điều kiện này gồm quyền quản lý khóa học, quy trình xét duyệt, điều kiện đăng ký học, cách mở bài học, cách tính tiến độ, điều kiện gửi đánh giá và cách xử lý báo cáo vi phạm.

Mục tiêu tiếp theo là kiểm tra các trường hợp phải bị từ chối. Chẳng hạn, học viên chưa hoàn thành khóa học không được gửi đánh giá và giảng viên không được sửa khóa học của người khác. Với những tình huống này, kết quả đạt có nghĩa là chương trình đã từ chối đúng yêu cầu không hợp lệ, chứ không có nghĩa thao tác của người dùng được thực hiện thành công.

Việc kiểm thử còn giúp phát hiện thay đổi làm ảnh hưởng đến những quy tắc đã có. Khi sửa chương trình, có thể chạy lại bộ kiểm thử và đối chiếu kết quả. Báo cáo đồng thời ghi nhận độ bao phủ để xác định phần mã nguồn đã được chạy qua và lựa chọn nội dung cần kiểm tra thêm.

### 4.1.2 Phạm vi đã thực hiện

Phạm vi được xác định từ các tệp kiểm thử thực sự có trong dự án. Tám nhóm được kiểm tra gồm đăng ký tài khoản và phân quyền, quản lý khóa học, tra cứu khóa học công khai, đăng ký học và tiến độ, hỏi đáp và xử lý vi phạm, đánh giá khóa học, đơn hàng và thanh toán, xử lý tệp tải lên. Danh mục và số lượng của từng nhóm được tổng hợp tại mục 4.3.

Các phép kiểm tra chủ yếu gọi trực tiếp hàm xử lý trong phần máy chủ. Chúng không thực hiện toàn bộ thao tác từ trình duyệt qua API đến cơ sở dữ liệu thật. Một số tình huống phối hợp hai lớp xử lý, như đánh giá khóa học và xử lý báo cáo, nhưng vẫn dùng dữ liệu lưu trong bộ nhớ để mô phỏng cơ sở dữ liệu.

Ngoài bộ kiểm thử, đợt đánh giá có chạy biên dịch máy chủ và kiểm tra kiểu dữ liệu, đóng gói giao diện. Hai việc này giúp phát hiện lỗi làm chương trình không thể biên dịch hoặc tạo bản dựng. Chúng không thay thế việc mở website và thao tác trên các chức năng.

### 4.1.3 Những nội dung chưa được kiểm chứng trong đợt này

Chưa có kết quả chạy kiểm thử từ đầu đến cuối trên trình duyệt, kiểm thử với MongoDB thật hoặc nghiệm thu với người sử dụng. Chưa có số liệu đo khả năng phục vụ nhiều người cùng lúc, tốc độ phản hồi, mức độ dễ sử dụng hay khả năng hiển thị nhất quán trên nhiều trình duyệt và thiết bị. Cấu hình kiểm thử từ đầu đến cuối có trong dự án, nhưng không có tệp tình huống tương ứng được tìm thấy và chạy trong đợt này.

Các luồng gửi thư thật, nhập OTP, đăng nhập và làm mới phiên, giao dịch payOS thật, phát hành chứng chỉ thực tế và toàn bộ chuỗi kiểm tra quyền khi nhận yêu cầu API chưa được kiểm chứng đầy đủ bằng bộ kiểm thử hiện có. Chương này không lấy việc tồn tại mã nguồn của các chức năng đó làm bằng chứng rằng chúng đã được kiểm thử đạt.

## 4.2 Môi trường và cách thực hiện

### 4.2.1 Môi trường kiểm thử

Đợt kiểm thử được thực hiện trên môi trường phát triển của dự án. Các phiên bản trong bảng dưới đây là phiên bản đã dùng khi chạy kiểm thử và biên dịch, không phải cấu hình bắt buộc cho mọi lần triển khai hệ thống.

@table environment

Vitest là công cụ chạy các tình huống kiểm thử tự động. Thành phần đo bao phủ V8 ghi nhận phần mã được thực thi khi bộ kiểm thử chạy. Báo cáo bao phủ giới hạn vào các tệp TypeScript trong thư mục src của máy chủ và loại các tệp kiểm thử có đuôi spec.ts. Công cụ đưa 93 tệp vào báo cáo của lần chạy này; số liệu không bao gồm độ bao phủ giao diện Vue.

### 4.2.2 Cách chuẩn bị dữ liệu và thực hiện

Mỗi tình huống chuẩn bị dữ liệu đầu vào, gọi hàm cần kiểm tra và so sánh kết quả nhận được với kết quả mong đợi. Dữ liệu mẫu được tạo riêng cho từng nhóm, chẳng hạn khóa học miễn phí hoặc Pro, tài khoản thuộc các vai trò khác nhau, tiến độ học, đơn hàng và báo cáo vi phạm. Những giá trị cụ thể như 60% thời lượng video hoặc mức điểm trắc nghiệm được chọn để kiểm tra điều kiện chuyển bước của chương trình.

Thành phần mô phỏng là đoạn mã thay thế một dịch vụ hoặc nơi lưu dữ liệu trong lúc kiểm thử. Ví dụ, thay vì gửi thư thật, phép kiểm tra ghi nhận hàm gửi thư đã được gọi với dữ liệu cần thiết. Cách làm này giúp kiểm tra quyết định của lớp nghiệp vụ mà không cần sử dụng tài khoản thư hoặc thực hiện giao dịch thật. Đổi lại, kết quả không chứng minh dịch vụ bên ngoài đã nhận và xử lý yêu cầu thành công.

@table isolation

Bộ kiểm thử được chạy một lần bằng Vitest ở chế độ run, đồng thời xuất kết quả dạng JSON và báo cáo bao phủ. Sau đó thực hiện riêng bước biên dịch máy chủ bằng Nest CLI, kiểm tra kiểu dữ liệu giao diện bằng vue-tsc và tạo bản dựng giao diện bằng Vite. Không bổ sung tình huống mới hoặc sửa mã nguồn chương trình để tạo ra kết quả được trình bày trong chương này.

### 4.2.3 Tiêu chí ghi nhận kết quả

Một tình huống được ghi nhận đạt khi tất cả điều kiện so sánh đã viết cho tình huống đó đều đúng và công cụ không báo lỗi. Nếu chương trình phải từ chối một yêu cầu, phép kiểm tra cần nhận được đúng lỗi dự kiến. Một tình huống có thể gồm nhiều bước liên tiếp; chỉ được tính là một tình huống theo cấu trúc trong tệp kiểm thử.

Khi có lỗi làm không thể chạy bộ kiểm thử hoặc có tình huống không đạt, cần giữ lại thông báo lỗi, xác định nguyên nhân và chạy lại phần bị ảnh hưởng sau khi sửa. Không loại bỏ tình huống lỗi chỉ để tăng tỷ lệ đạt. Trong lần chạy được ghi nhận, không có tình huống lỗi hoặc bị bỏ qua, nên không phát sinh vòng sửa lỗi và chạy lại.

Đối với kiểm tra bản dựng, tiêu chí đạt là công cụ kết thúc thành công. Cảnh báo được ghi riêng để xem xét, không tự đổi thành lỗi kiểm thử chức năng. Những nội dung chưa có phép kiểm tra được ghi là chưa được kiểm chứng, không ghi là đạt hoặc không đạt.

## 4.3 Danh mục tình huống kiểm thử

Các mã dưới đây được đặt trong báo cáo để thuận tiện tra cứu. Mỗi mã tương ứng với một tình huống có trong bộ kiểm thử, không phải một thao tác đơn lẻ trên giao diện. Một số tình huống chứa nhiều bước, đặc biệt là học tuần tự, cập nhật bài học và xử lý đánh giá vi phạm.

@table catalogue

Nhóm hỏi đáp có nhiều tình huống nhất vì phải xét đồng thời quyền xử lý, trạng thái báo cáo và mức vi phạm. Số lượng tình huống không phản ánh trực tiếp mức độ hoàn thiện của từng chức năng. Một nhóm có ít tình huống vẫn có thể còn nhiều nhánh cần bổ sung, dù tất cả tình huống hiện tại đều đạt.

## 4.4 Kết quả kiểm thử theo nhóm chức năng

Trong các bảng sau, cột kết quả ghi nhận kết quả của lần chạy tự động ngày 22 tháng 11 năm 2026. Cột mong đợi mô tả đúng phần đã được đối chiếu trong mã kiểm thử. Các lời gọi lưu dữ liệu hoặc gọi dịch vụ mô phỏng được đánh giá trong phạm vi đó, không được hiểu là kết quả thao tác với hệ thống bên ngoài.

@cases

## 4.5 Tổng hợp kết quả và độ bao phủ

### 4.5.1 Kết quả chạy kiểm thử và tạo bản dựng

@table results

Cả 66 tình huống đều đạt nên tỷ lệ đạt trong bộ kiểm thử hiện có là 100%. Tỷ lệ này chỉ lấy 66 tình huống đã chạy làm mẫu số. Nó không phải tỷ lệ đáp ứng toàn bộ yêu cầu của hệ thống và không khẳng định chương trình không còn lỗi.

Bản dựng giao diện có cảnh báo về gói JavaScript sau nén rút gọn lớn hơn 500 kB. Gói index được công cụ báo khoảng 742,28 kB, tương đương 236,94 kB sau gzip. Đây là số liệu kích thước tệp bản dựng, không phải thời gian tải thực tế hay thời gian phản hồi của website. Cần đo trên môi trường triển khai trước khi kết luận ảnh hưởng tới người sử dụng.

### 4.5.2 Độ bao phủ mã nguồn máy chủ

Độ bao phủ cho biết phần mã đã được thực thi trong quá trình kiểm thử. Ví dụ, một dòng được ghi nhận đã chạy khi có tình huống đi qua dòng đó. Việc dòng mã được chạy chưa đủ để chứng minh mọi kết quả của dòng đều đã được kiểm tra đúng. Ngược lại, phần chưa được chạy qua cần được xem xét để bổ sung tình huống phù hợp.

@table coverage

Kết quả bao phủ dòng là 1.547 trên 3.493 dòng, tương ứng 44,28%. Số liệu này cho thấy bộ kiểm thử đã thực thi một phần đáng kể của lớp xử lý, đồng thời còn nhiều phần mã máy chủ chưa được chạy qua. Không thể dùng tỷ lệ 100% tình huống đạt để thay thế cho nhận định về phạm vi bao phủ này.

@table service-coverage

Trong các tệp lớp xử lý được nêu, tra cứu khóa học, tiến độ học và đánh giá có tỷ lệ dòng được chạy qua cao hơn đăng ký tài khoản, đơn hàng và tải tệp. Chẳng hạn, nhóm xác thực có kiểm tra đăng ký và phân quyền, nhưng chưa có tình huống kiểm tra đầy đủ đăng nhập và OTP. Vì vậy, tỷ lệ bao phủ thấp là căn cứ để mở rộng kiểm thử, không tự nó chứng minh chức năng đang sai.

Những thành phần khác như người dùng, thư điện tử và chứng chỉ cũng có mã nguồn trong phạm vi đo nhưng chưa được kiểm thử trực tiếp đầy đủ. Việc một thành phần được nạp khi chạy kiểm thử hoặc được thay bằng thành phần mô phỏng không đồng nghĩa luồng xử lý thật của thành phần đó đã được xác nhận.

## 4.6 Đánh giá kết quả và hướng bổ sung kiểm thử

### 4.6.1 Những quy tắc đã có bằng chứng kiểm tra

Về quản lý khóa học, bộ kiểm thử đã kiểm tra quyền theo người sở hữu và vai trò, điều kiện gửi duyệt, các bước thay đổi trạng thái và việc ngăn chỉnh sửa trong khi chờ duyệt. Nhóm tra cứu công khai kiểm tra điều kiện lọc, phân trang và việc loại dữ liệu riêng khỏi kết quả chi tiết. Đây là bằng chứng ở lớp xử lý cho việc phân biệt thông tin công khai với thông tin quản lý.

Về học tập, tình huống nhiều bước cho thấy chương trình không chỉ dựa vào vị trí phát video hoặc thông báo xem hết từ phía gửi yêu cầu để hoàn thành bài. Chương trình còn xét thời gian xem và kết quả trắc nghiệm trước khi mở bài tiếp theo. Quyền gửi đánh giá và cách tính lại điểm trung bình sau khi ẩn đánh giá vi phạm cũng có phép kiểm tra cụ thể.

Về xử lý vi phạm, các phép kiểm tra đã xét việc ghi nhận một lần cho cùng bình luận, đồng bộ các báo cáo trùng nhau và giới hạn quyền của giảng viên. Về thanh toán, đã kiểm tra cách tính số tiền, chữ ký và bước chuyển đơn hàng sang hoàn tất với thông báo thử. Những kết quả này hỗ trợ việc duy trì quy tắc nghiệp vụ khi tiếp tục phát triển hệ thống.

### 4.6.2 Giới hạn của kết quả hiện tại

Giới hạn chính là phần lớn dữ liệu được mô phỏng. Một truy vấn được tạo đúng trong phép kiểm tra vẫn cần được chạy với MongoDB thật để xác nhận cách lọc, sắp xếp, cập nhật và ràng buộc dữ liệu. Tương tự, việc hàm gửi thư hoặc tạo đăng ký học được gọi đúng chưa xác nhận thông điệp đã được gửi đi hay dữ liệu đã được ghi thành công trên hệ thống thật.

Các phép kiểm tra gọi trực tiếp lớp nghiệp vụ cũng chưa đi qua đầy đủ bước nhận yêu cầu, xác thực, kiểm tra quyền ở API và trả kết quả qua mạng. Chưa có dữ liệu đánh giá khi nhiều yêu cầu đến cùng lúc hoặc khi mạng và dịch vụ ngoài bị gián đoạn. Vì vậy, chưa thể kết luận khả năng chịu tải, an toàn toàn diện hoặc mức độ sẵn sàng vận hành chỉ từ đợt kiểm thử này.

Đối với giao diện, việc kiểm tra kiểu và đóng gói thành công cho biết mã đáp ứng các điều kiện biên dịch hiện tại. Kết quả đó chưa xác nhận người học có thể hoàn thành tất cả thao tác trên từng thiết bị hoặc người sử dụng có dễ hiểu cách vận hành hay không. Cần tổ chức kiểm tra thao tác và ghi nhận ý kiến người dùng riêng.

### 4.6.3 Các nội dung cần kiểm thử bổ sung

Các nội dung trong bảng dưới đây là đề xuất cho giai đoạn tiếp theo. Chúng chưa được thực hiện trong đợt kiểm thử được báo cáo và không được cộng vào 66 tình huống đạt.

@table next-tests

Khi bổ sung kiểm thử, nên ưu tiên các luồng liên quan đến tài khoản, thanh toán và quyền truy cập trước, vì lỗi ở các luồng này có thể làm người dùng không vào được hệ thống, nhận sai quyền hoặc không nhận được khóa học đã mua. Sau đó mở rộng đến khả năng phục hồi, hiệu năng và trải nghiệm trên các thiết bị. Mỗi đợt cần lưu môi trường, dữ liệu đầu vào, kết quả mong đợi và kết quả thực tế để có thể đối chiếu lại.

## 4.7 Tổng kết chương

Đợt kiểm thử đã thực hiện 66 tình huống tự động trong 8 tệp, tất cả đều đạt. Máy chủ và giao diện tạo được bản dựng; độ bao phủ dòng mã máy chủ đạt 44,28% trong phạm vi đo đã nêu. Các kết quả cung cấp bằng chứng cụ thể cho những quy tắc được kiểm tra về khóa học, học tập, tương tác, thanh toán và xử lý tệp.

Hệ thống vẫn cần được kiểm thử với dữ liệu và dịch vụ thật, chạy toàn bộ luồng qua giao diện và API, đồng thời đánh giá hiệu năng và khả năng sử dụng. Việc phân biệt kết quả đã thực hiện với nội dung cần bổ sung giúp đánh giá đúng tình trạng hiện tại của dự án và xác định công việc cần hoàn thành trước khi đưa vào vận hành.
'''

TABLES = {
'environment':('Môi trường và công cụ của đợt kiểm thử',['Thành phần','Giá trị sử dụng'],[
('Ngày thực hiện','22 tháng 11 năm 2026'),('Hệ điều hành','Windows, nền tảng 64 bit'),('Node.js','24.22.3'),('Vitest','4.1.11'),('TypeScript','6.0.3'),('Công cụ đo bao phủ','V8'),('Phạm vi thu thập bao phủ','Mã TypeScript phía máy chủ trong src; loại tệp spec.ts'),
]),
'isolation':('Cách sử dụng thành phần thật và thành phần mô phỏng',['Đối tượng','Cách kiểm tra và giới hạn'],[
('Cơ sở dữ liệu','Dùng đối tượng mô phỏng hoặc kho dữ liệu trong bộ nhớ; không kết nối MongoDB thật.'),
('Thư điện tử','Kiểm tra lời gọi tạo OTP và gửi thư qua thành phần mô phỏng; không gửi thư qua SMTP thật.'),
('Thanh toán','Tính và kiểm tra chữ ký bằng thuật toán thật trên dữ liệu thử; không gọi giao dịch payOS thật.'),
('Mở quyền học sau thanh toán','Kiểm tra lời gọi đến thành phần đăng ký học được mô phỏng; chưa kiểm tra giao dịch liên quan trên cơ sở dữ liệu thật.'),
('Chứng chỉ','Nhận mã chứng chỉ do thành phần mô phỏng trả về; chưa kiểm tra luồng cấp và in chứng chỉ thật.'),
('Tệp tải lên','Tạo và xóa tệp thử cục bộ; kiểm tra dấu hiệu định dạng ở phần đầu tệp và đường dẫn. Chưa xác minh việc giải mã, phát toàn bộ video hoặc tiếp nhận tệp qua API.'),
]),
'catalogue':('Danh mục các nhóm tình huống kiểm thử',['Nhóm','Khoảng mã','Số lượng'],[]),
'results':('Tổng hợp kết quả thực hiện',['Nội dung','Kết quả'],[
('Số tệp kiểm thử đã chạy','8'),('Tổng số tình huống','66'),('Tình huống đạt','66'),('Tình huống không đạt','0'),('Tình huống bị bỏ qua hoặc để chờ','0'),
('Biên dịch máy chủ bằng Nest CLI','Thành công'),('Kiểm tra kiểu dữ liệu giao diện bằng vue-tsc','Thành công'),('Tạo bản dựng giao diện bằng Vite','Thành công; có cảnh báo kích thước gói JavaScript'),
]),
'coverage':('Độ bao phủ mã nguồn phía máy chủ',['Chỉ số','Đã thực thi / tổng','Tỷ lệ'],[
('Dòng mã','1.547 / 3.493','44,28%'),('Câu lệnh','1.565 / 3.581','43,70%'),('Hàm','214 / 554','38,62%'),('Nhánh xử lý','1.012 / 2.365','42,79%'),
]),
'service-coverage':('Độ bao phủ dòng của các lớp xử lý thuộc tám nhóm kiểm thử',['Lớp xử lý','Tỷ lệ dòng được thực thi'],[
('AuthService','20,43%'),('CourseManageService','54,98%'),('CoursesService','85,10%'),('EnrollmentsService','77,34%'),('QuestionsService','59,34%'),('ReviewsService','75,21%'),('OrdersService','28,08%'),('UploadsService','34,22%'),
]),
'next-tests':('Nội dung cần bổ sung trong các đợt kiểm thử sau',['Nội dung','Cách kiểm chứng cần bổ sung'],[
('Tài khoản và phiên đăng nhập','Đi qua API và giao diện để đăng ký, nhận OTP, kích hoạt, đăng nhập, làm mới và đăng xuất; kiểm tra OTP sai, hết hạn và quyền sau khi đổi vai trò.'),
('Truy cập dữ liệu và phân quyền','Dùng MongoDB thử nghiệm và gọi API bằng các vai trò; kiểm tra truy vấn, cập nhật trạng thái, truy cập tài nguyên của người khác và yêu cầu không có phiên hợp lệ.'),
('Thanh toán và quyền học','Dùng môi trường thanh toán phù hợp để tạo liên kết và nhận thông báo; kiểm tra thông báo lặp, số tiền sai, thanh toán đồng thời, đối soát và quyền học sau khi lưu dữ liệu thật.'),
('Học tập và chứng chỉ','Thao tác từ trình duyệt để xem bài, học tiếp sau khi tải lại trang, làm trắc nghiệm, hoàn thành khóa và xem hoặc in chứng chỉ; kiểm tra với dữ liệu thật.'),
('Gửi thư và sự cố dịch vụ ngoài','Kiểm tra nhận thư thật, cấu hình không hợp lệ, lỗi gửi và gián đoạn kết nối; ghi nhận thông báo mà người dùng nhận được.'),
('Tải tệp qua API','Gửi tệp thật và tệp sai định dạng; kiểm tra quyền tải lên, giới hạn dung lượng, đường dẫn trả về và khả năng xem ảnh, phát video sau khi tải.'),
('Hiệu năng và xử lý đồng thời','Đo thời gian phản hồi và tỷ lệ lỗi ở các mức số người dùng; quan sát cơ sở dữ liệu và các thao tác đăng ký học hoặc thanh toán đồng thời.'),
('Giao diện và khả năng sử dụng','Kiểm tra các luồng theo vai trò trên nhiều kích thước màn hình, trình duyệt; mời người dùng thực hiện nhiệm vụ và ghi nhận khó khăn cụ thể.'),
]),
}
for prefix,title,file,cases in GROUPS:
 TABLES['catalogue'][2].append((title,f'{prefix}-01 đến {prefix}-{len(cases):02}',str(len(cases))))
TABLES['catalogue'][2].append(('Tổng cộng','8 nhóm','66'))

NOTES={
'AUTH':'Nhóm này chưa kiểm tra việc người dùng nhận thư, nhập OTP hoặc đăng nhập. Tình huống AUTH-06 xác nhận lời gọi thu hồi mã làm mới, chưa chứng minh toàn bộ phiên truy cập đang có bị vô hiệu ngay lập tức.',
'MAN':'Các điều kiện truy vấn và cập nhật trong nhóm này được kiểm tra với thành phần lưu trữ mô phỏng. MAN-14 là một tình huống chứa nhiều phép so sánh, không phải nhiều tình huống được tính riêng. MAN-15 chỉ kiểm tra dữ liệu đầu vào và điều kiện sẵn sàng, chưa thực hiện trọn luồng tạo rồi duyệt khóa học.',
'COURSE':'Phép kiểm tra phân trang và sắp xếp đối chiếu cấu trúc truy vấn được tạo ra, chưa chạy truy vấn đó trên MongoDB thật. Việc loại dữ liệu riêng được kiểm tra trên kết quả chuyển đổi dữ liệu mẫu, chưa kiểm tra toàn bộ phản hồi API qua mạng.',
'LEARN':'LEARN-03 gồm chuỗi kiểm tra liên tiếp được giải thích thêm bên dưới. Mã chứng chỉ cuối chuỗi do thành phần mô phỏng cung cấp. LEARN-05 kiểm tra giảng viên xem thử và dữ liệu không phát sinh trong kho mô phỏng; không được dùng để kết luận đã kiểm thử đầy đủ chế độ xem thử của mọi vai trò.',
'QA':'Việc cập nhật tài khoản, cộng vi phạm và tạo thông báo được kiểm tra bằng các đối tượng lưu trữ mô phỏng. Tình huống khóa tài khoản xác nhận quyết định cập nhật trạng thái, chưa kiểm tra toàn bộ tác động đến phiên đăng nhập đang hoạt động.',
'REV':'Nhóm này có tình huống phối hợp lớp xử lý đánh giá và lớp xử lý báo cáo trên dữ liệu trong bộ nhớ. Qua đó có thể đối chiếu việc ẩn đánh giá và tính lại điểm trung bình, nhưng chưa xác nhận thao tác lưu và đọc lại trên cơ sở dữ liệu thật.',
'PAY':'Không có giao dịch payOS thật trong nhóm này. PAY-03 chỉ gọi bước xem trước thanh toán. PAY-05 thực sự kiểm tra cờ tắt giả lập và chữ ký sai; không có kết quả chạy riêng với NODE_ENV đặt thành production nên không ghi nhận nhánh đó là đã được kiểm chứng.',
'FILE':'Tệp thử của nhóm này chỉ có phần đầu dữ liệu đủ cho phép nhận diện định dạng. Kết quả đạt không khẳng định toàn bộ nội dung là ảnh hoặc video hợp lệ, cũng không phải kết quả kiểm tra phát video, quét mã độc hay tải tệp qua giao diện.',
}

LEARN_STEPS=[
('Chuẩn bị khóa có ba bài; bài đầu có thời lượng 300 giây.','Lượt đăng ký bắt đầu với bài đầu được mở, các bài sau chưa mở.'),
('Báo đã xem hết và vị trí phát ở giây 300 nhưng thời gian xem tích lũy chỉ 20 giây.','Chưa hoàn thành bài đầu và chưa mở bài thứ hai.'),
('Thời gian xem bài đầu đạt 180 trên 300 giây.','Đủ ngưỡng 60%; hoàn thành bài đầu, tiến độ 33% và mở bài thứ hai.'),
('Sau khi xem đủ 60% video bài thứ hai có một câu trắc nghiệm, nộp đáp án sai rồi làm lại với đáp án đúng.','Lần sai chưa được qua và chưa trả lời giải; lần đúng đạt 100%, mở bài thứ ba, tiến độ 67%.'),
('Ở bài cuối có ba câu, trả lời đúng hai câu.','Điểm được làm tròn thành 67%, chưa đạt ngưỡng 70% và chưa hoàn thành khóa.'),
('Trả lời đúng cả ba câu ở lượt làm tiếp theo.','Hoàn thành khóa ở mức 100% và nhận kết quả chứng chỉ từ thành phần mô phỏng.'),
]
