CONTENT = '''
# CHƯƠNG 3 THIẾT KẾ VÀ CÀI ĐẶT GIẢI PHÁP

Chương này trình bày cách tổ chức và cài đặt NextCode để giải quyết bài toán đăng ký và học các khóa lập trình trực tuyến. Nội dung gồm kiến trúc hệ thống, phân rã chức năng, cấu trúc dữ liệu, giao diện và cách xử lý các quy trình chính. Các phần được liên kết theo công việc thực tế, từ chuẩn bị khóa học đến đăng ký, thanh toán, học tập và ghi nhận kết quả.

## 3.1 Kiến trúc tổng quan của hệ thống

### 3.1.1 Các thành phần và sự liên kết

NextCode được tổ chức thành phần giao diện và phần máy chủ. Giao diện Vue chạy trong trình duyệt, cung cấp các trang xem khóa học, học tập và quản lý. Máy chủ NestJS tiếp nhận yêu cầu qua API, kiểm tra dữ liệu, kiểm tra quyền và thực hiện nghiệp vụ. MongoDB lưu thông tin để các bước của một quy trình có thể sử dụng lại dữ liệu đã ghi nhận.

@figure architecture

Ngoài cơ sở dữ liệu, máy chủ kết nối đến máy chủ thư qua SMTP để gửi mã xác minh và đến payOS để xử lý thông tin thanh toán. Các hình ảnh, video và tài liệu tải lên được lưu trong thư mục public của ứng dụng máy chủ. Cơ sở dữ liệu lưu đường dẫn và thông tin mô tả của những tệp này.

Trình duyệt gọi API tại /api/v1 để lấy hoặc thay đổi dữ liệu nghiệp vụ. Chẳng hạn, khi mở danh sách khóa học, giao diện gửi bộ lọc đến máy chủ. Máy chủ chỉ chọn các khóa đã duyệt, truy vấn dữ liệu liên quan và trả danh sách để trình bày. Với yêu cầu tạo đơn, máy chủ lấy giá từ dữ liệu khóa học rồi tính số tiền trước khi liên hệ payOS.

Một yêu cầu học tập cũng đi qua máy chủ để kiểm tra đăng ký và tình trạng bài học. Phản hồi chứa dữ liệu cần cho màn hình, còn hình ảnh, video hoặc tài liệu được truy cập qua đường dẫn tương ứng. Cách cung cấp tệp hiện tại được trình bày riêng tại mục 3.5.7 để phân biệt dữ liệu nghiệp vụ với tệp nội dung.

### 3.1.2 Tổ chức mã nguồn

Phần giao diện nằm trong client, còn mã nguồn máy chủ nằm tại src ở thư mục gốc. Bảng 3.1 trình bày trách nhiệm của các nhóm thư mục chính.

@table modules

Ở máy chủ, controller nhận yêu cầu, service xử lý nghiệp vụ và model Mongoose làm việc với dữ liệu. Ở giao diện, trang ghép các thành phần hiển thị và sử dụng dịch vụ gọi API. Pinia giữ trạng thái xác thực dùng chung, còn dữ liệu riêng của màn hình được quản lý tại trang hoặc hàm xử lý liên quan.

## 3.2 Sơ đồ phân rã chức năng

### 3.2.1 Phân rã chức năng tổng quát

Các chức năng được chia theo nhóm công việc thay vì theo tên thư viện hoặc tệp chương trình. Mức tổng quát gồm quản lý tài khoản, tra cứu khóa học, đăng ký và thanh toán, học tập, biên soạn nội dung và quản trị. Các nhóm cùng sử dụng dữ liệu tài khoản, khóa học và kết quả xử lý để tiếp nối quy trình.

@figure function-overview

Sơ đồ phân rã cho biết một nhóm công việc bao gồm những chức năng nào. Quyền thực hiện từng chức năng còn phụ thuộc vai trò và dữ liệu liên quan. Ví dụ, cùng là xem tiến độ, học viên xem kết quả của mình, giảng viên xem học viên trong khóa được phân công, còn quản trị viên xem theo phạm vi quản lý.

### 3.2.2 Chức năng của khách truy cập và học viên

Khách truy cập có thể tìm kiếm, lọc, xem mô tả khóa học và tra cứu chứng chỉ bằng mã. Khi muốn đăng ký học, người dùng tạo tài khoản, xác minh email rồi đăng nhập. Học viên đã đăng nhập có thêm các chức năng đăng ký khóa miễn phí, mua khóa Pro, học theo thứ tự, làm trắc nghiệm, xem tiến độ và chứng chỉ.

@figure function-student

Nhóm tài khoản dùng cho cập nhật hồ sơ, đổi mật khẩu và quản lý phiên đăng nhập. Nhóm đơn hàng ghi nhận việc mua khóa và kết quả thanh toán. Nhóm học tập liên kết quyền học với bài học được mở, kết quả trả lời và tình trạng hoàn thành. Hỏi đáp, phản ánh nội dung và đánh giá khóa học là những hoạt động gắn với quá trình sử dụng; điều kiện đánh giá được kiểm tra tại máy chủ.

### 3.2.3 Chức năng của giảng viên

Giảng viên làm việc với các khóa được phân công. Các công việc chính gồm tổ chức chương, bài học, học liệu và câu hỏi; kiểm tra nội dung trước khi gửi duyệt; xem thử khóa; theo dõi học viên; giải đáp và xử lý phản ánh trong phạm vi được giao. Việc tạo khóa nền, phân công giảng viên và quyết định công bố thuộc quản trị viên.

@figure function-instructor

Chế độ xem thử cho phép giảng viên xem các bài trong khóa và làm thử câu hỏi. Chương trình trả kết quả xem thử mà không ghi nhận đây là tiến độ học của học viên. Khi xử lý phản ánh, giảng viên có thể bỏ qua, ẩn nội dung kèm nhắc nhở hoặc chuyển lên quản trị viên. Các trường hợp thuộc thẩm quyền quản trị viên được tách khỏi phạm vi xử lý của giảng viên.

### 3.2.4 Chức năng của quản trị viên

Quản trị viên quản lý người dùng, khởi tạo khóa học, định giá, phân công giảng viên và xét duyệt công bố. Ngoài ra, quản trị viên có thể xem nội dung, theo dõi học viên, xử lý phản ánh ở tuyến cuối, xem đơn hàng và xác nhận thanh toán thủ công. Hình 3.5 tổng hợp các nhóm công việc này.

@figure function-admin

Mã nguồn còn định nghĩa vai trò ACCOUNTANT cho các API quản lý đơn hàng và tuyến /dashboard/orders. Liên kết đến màn hình đơn hàng trong menu quản lý hiện chỉ được hiển thị cho quản trị viên; bố cục quản lý chưa tách riêng cách trình bày cho kế toán. Vì vậy, cần phân biệt quyền gọi chức năng với cách bố trí các lối truy cập trên giao diện.

## 3.3 Thiết kế dữ liệu

### 3.3.1 Mối liên hệ và cách lưu trữ

Dữ liệu được chia thành ba nhóm liên quan. Nhóm tài khoản lưu người dùng và thông tin xác thực. Nhóm khóa học và học tập lưu nội dung, đăng ký, tiến độ, câu trả lời và chứng chỉ. Nhóm vận hành lưu đơn hàng, giao dịch, hỏi đáp, đánh giá, báo cáo vi phạm và thông báo. Các nhóm liên kết bằng mã của đối tượng cần tham chiếu.

@figure data-learning

Một học viên có thể đăng ký nhiều khóa và một khóa có nhiều học viên. Enrollment biểu diễn từng quan hệ đăng ký này. LessonProgress liên kết bản đăng ký với từng bài học. Certificate liên kết học viên với khóa đã hoàn thành. Trong cấu trúc nội dung, Chapter, Lesson và QuizQuestion được lưu lồng trong Course, nên mã bài và mã câu hỏi được tra trong khóa học thay vì truy vấn một tập hợp bài học riêng.

@figure data-operations

Đơn hàng liên kết học viên với khóa được mua. Giao dịch thanh toán liên kết với đơn, đồng thời lưu các mã và số tiền phục vụ tra cứu. Bình luận và đánh giá liên kết người viết với khóa học; báo cáo chỉ đến nội dung bị phản ánh theo loại đối tượng. Thông báo gắn với người nhận và được lưu trong ứng dụng.

Các bảng sau mô tả tên trường theo schema. ObjectId là kiểu mã định danh của MongoDB; trong phần giải thích, mã tham chiếu dùng để tìm đối tượng liên quan. Mỗi tài liệu lưu riêng có trường _id. Các schema có timestamps tự ghi createdAt và updatedAt; riêng QuizAttempt dùng attemptedAt và tắt timestamps. Chapter, Lesson và QuizQuestion cũng có _id riêng, nhưng không có hai trường thời gian tạo và cập nhật tự động.

Mô hình hiện có 15 tập hợp dữ liệu theo các schema lưu riêng. Những cấu trúc như lịch sử vi phạm, phản ứng bình luận hoặc quy tắc mã giảm giá không được tính thành tập hợp riêng. Lịch sử và phản ứng được lưu lồng trong tài liệu cha, còn các mã giảm giá hiện được khai báo trong mã xử lý đơn hàng.

@schemas

## 3.4 Thiết kế giao diện

### 3.4.1 Tổ chức các khu vực sử dụng

Giao diện được chia thành khu vực công khai, khu vực tài khoản, phòng học và khu vực quản lý. Khu vực công khai dùng thanh điều hướng để chuyển giữa danh sách khóa học và tra cứu chứng chỉ. Các trang đăng nhập, đăng ký và khôi phục mật khẩu dùng bố cục dành cho tài khoản. Phòng học dành phần lớn diện tích cho nội dung bài, còn khu vực quản lý có thanh điều hướng theo công việc.

Các ảnh trong mục này được lấy từ ứng dụng đang chạy trên máy. Nội dung và số lượng khóa hiển thị phụ thuộc dữ liệu tại thời điểm chụp. Ảnh dùng để minh họa cách bố trí và thao tác trên màn hình; các điều kiện xử lý được giải thích cùng mã nguồn ở mục 3.5.

### 3.4.2 Giao diện đăng nhập và đăng ký

Trang đăng nhập tập trung vào hai thông tin là email và mật khẩu. Nút gửi có trạng thái đang xác thực để người dùng biết yêu cầu đang được xử lý. Đường dẫn quên mật khẩu và đăng ký tài khoản được đặt gần biểu mẫu để người dùng chuyển sang công việc cần thiết. Khi có lỗi, thông báo được đặt ngay trong vùng đăng nhập.

@figure login

Trang đăng ký thu thập thông tin tài khoản và gửi yêu cầu tạo tài khoản chờ xác minh. Sau bước này, người dùng nhập OTP nhận qua email. Quy trình đặt lại mật khẩu cũng có màn hình nhập email và xác minh, nhưng sử dụng mục đích OTP khác với đăng ký. Việc chia thành từng bước giúp người dùng biết mình đang cung cấp thông tin hay đang xác nhận địa chỉ email.

@figure register

### 3.4.3 Giao diện tìm kiếm và xem khóa học

Trang khóa học đặt ô tìm kiếm ở phần đầu và bộ lọc bên cạnh kết quả. Người dùng có thể lọc theo loại khóa, danh mục, trình độ, khoảng giá và mức đánh giá, đồng thời chọn cách sắp xếp. Mỗi thẻ khóa trình bày các thông tin cần cho lựa chọn ban đầu như tên, giảng viên, số bài, thời lượng và học phí. Hình 3.10 minh họa kết quả tìm kiếm theo từ khóa.

@figure courses

Trang chi tiết đặt tên, mô tả, cấu trúc nội dung và thông tin đăng ký trong cùng màn hình. Nội dung chương và tiêu đề bài giúp người dùng biết phạm vi khóa học trước khi đăng ký. Phần đánh giá cho biết kết quả phản hồi của học viên đã có quyền đánh giá. Nút đăng ký hoặc mua khóa được xử lý theo loại khóa và trạng thái tài khoản.

@figure course-detail

### 3.4.4 Giao diện học tập và tra cứu chứng chỉ

Phòng học hiển thị video hoặc nội dung tài liệu ở vùng chính, danh sách chương và bài ở bên cạnh. Danh sách thể hiện bài đang học, bài đã hoàn thành và bài còn khóa. Khi chuyển bài, chương trình lấy dữ liệu bài tương ứng và vị trí học đã ghi nhận. Những thành phần trắc nghiệm, tài liệu và hỏi đáp được sử dụng theo nội dung của bài.

Với học viên, thao tác tiếp tục học phụ thuộc đăng ký và tiến độ thực tế. Với giảng viên hoặc quản trị viên xem thử, giao diện thông báo đây là chế độ xem khóa và không lưu tiến độ học viên. Cùng một vùng hiển thị bài học được sử dụng với hai phạm vi xử lý khác nhau để phục vụ học tập và kiểm tra nội dung.

Trang tra cứu chứng chỉ cho phép nhập mã hoặc truy cập đường dẫn chứa mã. Khi có kết quả, màn hình hiển thị thông tin chứng chỉ, người học, khóa học và tình trạng hợp lệ. Người tra cứu không cần đăng nhập, phù hợp nhu cầu đối chiếu chứng chỉ đã được cấp.

@figure certificate

### 3.4.5 Giao diện quản lý khóa học và biên soạn

Khu vực quản lý sử dụng thanh điều hướng bên trái và vùng làm việc chính. Giảng viên xem danh sách khóa được phân công, tìm theo tên, lọc trạng thái và mở màn hình biên soạn hoặc theo dõi học viên. Quản trị viên sử dụng thêm các công việc quản lý người dùng, công bố khóa và đơn hàng theo quyền được cấp.

@figure manage-courses

Màn hình biên soạn chia nội dung thành các thẻ như thông tin, nội dung và trạng thái duyệt. Trong phần nội dung, chương và bài được đặt theo thứ tự. Các nút thêm, sửa, xóa và đổi vị trí nằm cạnh đối tượng cần thao tác. Câu hỏi trắc nghiệm được gắn với từng bài để người biên soạn kiểm tra được mối liên hệ giữa bài học và phần đánh giá cuối bài.

@figure course-editor

Trang theo dõi học viên trình bày danh sách đăng ký và kết quả theo khóa. Việc giới hạn dữ liệu theo giảng viên được thực hiện ở máy chủ, nên người dùng chỉ nhận dữ liệu thuộc phạm vi được phép. Các màn hình quản lý phản ánh và đơn hàng cũng sử dụng danh sách, bộ lọc và thao tác trên từng bản ghi; cách kiểm tra quyền và trạng thái được trình bày ở các mục tiếp theo.

## 3.5 Cài đặt các chức năng và luồng xử lý chính

### 3.5.1 Xác thực tài khoản và xử lý yêu cầu API

Khi đăng ký, máy chủ kiểm tra dữ liệu, chuẩn hóa email và kiểm tra tài khoản đã tồn tại. Mật khẩu được băm bằng Argon2. Tài khoản được tạo ở trạng thái chờ xác minh hoặc được cập nhật theo điều kiện của tài khoản đang chờ. Máy chủ tạo OTP, lưu bản băm cùng thời hạn và gửi mã qua email. Khi người dùng nhập mã hợp lệ cho mục đích đăng ký, tài khoản được chuyển sang trạng thái hoạt động.

Đăng nhập kiểm tra tài khoản và mật khẩu trước khi cấp mã truy cập JWT cùng mã làm mới ngẫu nhiên. Mã truy cập được gửi kèm các yêu cầu API. Mã làm mới được giữ trong cookie HttpOnly và được đối chiếu với bản băm trong cơ sở dữ liệu khi khôi phục phiên. Làm mới thành công thu hồi mã cũ và cấp mã mới; sử dụng lại mã đã thu hồi dẫn đến xử lý thu hồi các mã làm mới của tài khoản.

Ở máy chủ, guard xác thực kiểm tra mã truy cập, còn guard vai trò kiểm tra nhóm quyền đã khai báo tại API. Service tiếp tục kiểm tra quyền đối với dữ liệu cụ thể. Ví dụ, giảng viên phải phụ trách khóa học cần sửa; học viên phải có đăng ký khi truy cập bài học. Giao diện kiểm tra tuyến đường để hỗ trợ điều hướng theo tài khoản, nhưng yêu cầu vẫn phải được máy chủ chấp nhận.

@table api

Các API dùng cấu trúc phản hồi chung với thông tin thành công, mã trạng thái, dữ liệu và thời điểm xử lý. Trường hợp không hợp lệ được trả thành lỗi phù hợp để giao diện thông báo. Các đường dẫn ở Bảng 3.20 là ví dụ đại diện; những API thêm, sửa hoặc xóa chi tiết được tổ chức trong từng controller tương ứng.

### 3.5.2 Biên soạn, xét duyệt và công bố khóa học

Quản trị viên tạo khóa nền và xác định loại khóa, giá, mô tả cùng giảng viên phụ trách. Giảng viên biên soạn chương, bài, tài liệu và câu hỏi trong khóa được giao. Những thao tác đổi thứ tự được kiểm tra để danh sách mã gửi lên khớp với đối tượng đang có. Các tổng số chương, bài và thời lượng được tính lại từ nội dung thay vì yêu cầu người biên soạn nhập riêng.

Trước khi gửi duyệt hoặc phê duyệt, hàm kiểm tra điều kiện sẵn sàng xem xét thông tin khóa và cấu trúc nội dung. Ví dụ, khóa phải có chương, mỗi chương phải có bài, giá phải phù hợp loại khóa và bài có video cần thời lượng hợp lệ. Các thiếu sót làm khóa chưa đủ điều kiện được phân biệt với nhắc nhở bổ sung nội dung như ghi chép và tóm tắt của bài Pro.

@table course-states

Khi chuyển trạng thái, service kiểm tra người thực hiện và trạng thái hiện tại. Lệnh cập nhật có điều kiện khớp trạng thái đã đọc; nếu trạng thái bị thay đổi trước đó, chương trình yêu cầu tải lại. Dữ liệu công khai chỉ được lấy từ khóa APPROVED. Giảng viên hiện được chỉnh sửa nội dung của khóa DRAFT hoặc APPROVED theo điều kiện trong service, còn các trạng thái khác chịu giới hạn tương ứng.

### 3.5.3 Đăng ký học và thanh toán khóa Pro

Đối với khóa miễn phí đã duyệt, service kiểm tra học viên chưa đăng ký rồi tạo bản Enrollment và các bản tiến độ bài. Bài đầu tiên được mở, các bài còn lại chờ điều kiện học tiếp. Khóa Pro không được đăng ký trực tiếp bằng API đăng ký miễn phí; quyền học được tạo thông qua xử lý đơn hàng đã hoàn tất.

@figure payment-flow

Khi mua khóa Pro, máy chủ lấy giá từ khóa học và kiểm tra quyền sở hữu trước khi tạo đơn. Nếu có mã giảm giá, service đối chiếu với các quy tắc được khai báo trong mã nguồn và tính lại số tiền. Đơn hàng lưu giá gốc, giá ưu đãi, phần giảm và số phải trả ở thời điểm tạo. Hiện tại dự án chưa có một tập hợp hoặc màn hình riêng để quản trị mã giảm giá.

Sau khi có thông tin đơn, máy chủ gọi payOS để tạo liên kết và dữ liệu thanh toán. Học viên chuyển khoản bằng thông tin được hiển thị. Kết quả được tiếp nhận qua webhook hoặc được tra cứu lại từ payOS. Webhook được kiểm tra chữ ký trước khi đối chiếu với đơn. Với thông báo giao dịch thành công, số tiền thấp hơn finalAmount được ghi nhận là chưa đủ; dữ liệu đạt điều kiện được chuyển sang bước hoàn tất đơn.

Bước hoàn tất ghi nhận giao dịch, cập nhật đơn COMPLETED và gọi service đăng ký học. Mã tham chiếu giao dịch có chỉ mục duy nhất; việc cấp quyền học kiểm tra bản đăng ký đã tồn tại để tránh tạo thêm bản cho cùng học viên và khóa. Những cập nhật này được thực hiện qua các lệnh lưu liên tiếp trong service. Mã hiện tại không gói toàn bộ quá trình vào một giao dịch cơ sở dữ liệu bao trùm nhiều tài liệu.

Quản trị viên hoặc kế toán ở API có thể xác nhận thủ công đơn đang chờ hoặc đã hết hạn theo điều kiện chương trình, nhưng không xác nhận đơn đã hủy. Dữ liệu giao dịch thủ công lưu mã người xác nhận, vai trò và thời điểm. Chế độ giả lập thanh toán là công cụ phục vụ phát triển và trình diễn, chỉ hoạt động khi được bật và môi trường không phải production.

### 3.5.4 Học tuần tự, ghi nhận tiến độ và chấm trắc nghiệm

Service sắp xếp chương và bài theo trường order để xác định thứ tự học. Khi học viên mở một bài, máy chủ kiểm tra bản đăng ký, khóa và tình trạng bài. Bài LOCKED bị từ chối truy cập theo API học tập. Bài đang mở được trả nội dung cùng thông tin tiến độ. Với học viên chưa đạt phần trắc nghiệm, đáp án đúng không có trong dữ liệu câu hỏi trả về.

@figure learning-flow

Với video có thời lượng, chương trình ghi nhận vị trí gần nhất và số giây đã xem. Máy chủ giới hạn các giá trị trong phạm vi thời lượng, đồng thời giữ số giây xem không giảm so với kết quả đã ghi nhận. Điều kiện thời gian xem trong mã hiện tại là đạt tối thiểu 60 phần trăm thời lượng. Trường watchedFully biểu thị đã đạt điều kiện này, dù tên trường có thể gợi cách hiểu đã xem toàn bộ video. Bài đọc không có thời lượng video được xử lý theo thao tác xác nhận đọc của giao diện.

Bài không có trắc nghiệm được hoàn thành khi đạt điều kiện nội dung tương ứng. Bài có trắc nghiệm còn cần kết quả đạt. Khi nộp bài, service kiểm tra đủ câu trả lời, không lặp mã câu hỏi và phương án nằm trong danh sách lựa chọn. Từng câu được chấm bằng đáp án tại máy chủ và lưu vào QuizAttempt. Một câu hỏi yêu cầu trả lời đúng; từ hai câu trở lên yêu cầu tỷ lệ đúng ít nhất 70 phần trăm.

Khi một bài hoàn thành, chương trình chuyển trạng thái bài sang COMPLETED và mở bài tiếp theo nếu còn. Tỷ lệ tiến độ khóa được tính bằng số bài đã hoàn thành chia tổng số bài rồi làm tròn thành phần trăm. Khi tất cả bài đã hoàn thành và tổng số bài lớn hơn 0, Enrollment được ghi nhận COMPLETED cùng thời gian hoàn thành. Quy tắc này dùng số bài hoàn thành, không dùng trực tiếp tỷ lệ tổng thời gian xem video để tính tiến độ khóa.

Giảng viên và quản trị viên có nhánh xử lý xem thử. Nhánh này trả nội dung và kết quả làm thử để kiểm tra bài học mà không tạo tiến độ học viên hoặc cấp chứng chỉ như một lần học thật. Vì vậy, số liệu trong chế độ xem thử không được dùng để kết luận học viên đã hoàn thành.

### 3.5.5 Cấp và tra cứu chứng chỉ

Sau khi Enrollment hoàn thành, service học tập gọi chức năng cấp chứng chỉ. Chức năng này tìm chứng chỉ theo học viên và khóa trước khi tạo. Nếu đã có, chương trình sử dụng bản hiện tại. Nếu chưa có, chương trình sinh mã, lưu người học, khóa, thời điểm cấp và đường dẫn tra cứu. Chỉ mục duy nhất trên cặp học viên và khóa bổ sung ràng buộc ở nơi lưu trữ.

Giao diện trình bày chứng chỉ từ dữ liệu trả về và hỗ trợ in qua trình duyệt. Trường qrCode trong bản ghi lưu đường dẫn xác thực, còn fileUrl được gán trống khi cấp mới. Do đó, chức năng hiện tại được mô tả là cấp dữ liệu chứng chỉ, hiển thị và in trên giao diện. Việc tải một tệp PDF chứng chỉ được máy chủ tạo sẵn không phải luồng đang được cài đặt ở service này.

Khi tra cứu công khai, máy chủ chuẩn hóa mã, tìm chứng chỉ và lấy thông tin người học, khóa cùng giảng viên để trả kết quả. Kết quả còn cho biết trạng thái có phải VALID hay không. Schema định nghĩa cả REVOKED, nhưng giá trị được định nghĩa trong dữ liệu không tự chứng minh đã có đầy đủ quy trình quản lý thu hồi trên giao diện.

### 3.5.6 Hỏi đáp, đánh giá và xử lý vi phạm

Hỏi đáp gắn với khóa và bài học. Câu hỏi và câu trả lời được lưu chung trong LessonComment; câu trả lời chỉ đến nội dung cấp trên qua parentId. Mỗi nội dung có người viết, thời điểm, phản ứng và tình trạng hiển thị. Khi tạo hoặc tương tác, service kiểm tra quyền tiếp cận phần thảo luận và các hạn chế bình luận đang áp dụng cho tài khoản.

Đánh giá khóa học được lưu theo cặp học viên và khóa, với điểm từ 1 đến 5 và nhận xét tùy nội dung người dùng gửi. Học viên được tạo đánh giá khi khóa đã hoàn thành; người đã có đánh giá có thể chỉnh sửa theo điều kiện service, kể cả khi khóa được bổ sung bài làm thay đổi tiến độ. Điểm tổng hợp của khóa được tính lại từ các đánh giá được phép hiển thị.

Khi có phản ánh, Report lưu người gửi, loại nội dung, tác giả, khóa và lý do. Giảng viên xử lý các báo cáo chờ thuộc khóa phụ trách trong phạm vi được phép. Báo cáo liên quan nội dung của chính giảng viên hoặc đã chuyển cấp thuộc quản trị viên. Quản trị viên là tuyến cuối và có quyền áp dụng hạn chế tài khoản theo quy tắc xử lý.

Các báo cáo đang xử lý cùng trỏ đến một nội dung được xét theo nhóm khi có quyết định. Trường violationRecorded giúp tránh cộng lặp vi phạm cho cùng một bình luận hoặc đánh giá. Kết quả được lưu ở báo cáo, lịch sử tài khoản và các thông báo liên quan. Các thông báo này hiển thị trong ứng dụng; dịch vụ email của dự án phục vụ OTP đăng ký và đặt lại mật khẩu.

### 3.5.7 Tải lên và cung cấp học liệu

Module tải lên tiếp nhận hình ảnh, video và tài liệu theo từng loại. Chương trình kiểm tra định dạng, kích thước và một số dấu hiệu nội dung tệp trước khi chấp nhận. Giới hạn hiện tại là 5 MiB cho ảnh, 1 GiB cho video và 25 MiB cho tài liệu. Ảnh hỗ trợ JPEG, PNG, WebP; video hỗ trợ MP4, WebM; tài liệu hỗ trợ PDF, DOCX, TXT và Markdown.

Tệp được đặt tên phù hợp trước khi lưu trong các vùng của thư mục public. Thông tin trả về được gắn vào khóa học, bài học hoặc hồ sơ. Đối với DOCX, mã nguồn có phần đọc văn bản để phục vụ hiển thị; giao diện dùng thành phần xem tài liệu theo dạng nội dung phù hợp. Quy tắc biên soạn video có sự phân biệt giữa khóa miễn phí và Pro, trong đó đầu vào mã nhúng YouTube của khóa Pro bị kiểm tra tại các bước liên quan.

Máy chủ hiện công bố thư mục public qua /public/. Các kiểm tra quyền của API học tập kiểm soát việc lấy dữ liệu bài qua API, còn đường dẫn tệp tĩnh được phục vụ theo cấu hình này. Cách triển khai hiện tại chưa có cơ chế phân phối video theo chữ ký hết hạn hoặc hệ thống bảo vệ sao chép video. Việc mô tả quyền học trong báo cáo vì vậy được gắn đúng với các kiểm tra đã cài đặt.

## 3.6 Cấu hình và chạy hệ thống

### 3.6.1 Cấu hình môi trường

Máy chủ sử dụng ConfigModule để đọc cấu hình môi trường. Các nhóm thông tin chính gồm cổng chạy, địa chỉ giao diện, kết nối MongoDB, mã truy cập, email, OTP và thanh toán. Bảng 3.22 nêu các biến đang được đọc cho những nhóm chức năng này; giá trị bí mật được thiết lập riêng tại môi trường chạy.

@table environment

Các biến được mô tả theo cách sử dụng trong mã, không chỉ theo tên xuất hiện trong tệp cấu hình mẫu. Chẳng hạn, mã làm mới hiện là chuỗi ngẫu nhiên và có thời hạn bảy ngày trong phần xử lý xác thực. Các thiết lập JWT_REFRESH_SECRET và JWT_REFRESH_TTL có mặt trong tệp mẫu nhưng không được dùng để tạo JWT làm mới trong luồng hiện tại.

### 3.6.2 Chạy chương trình trong môi trường phát triển

Để chạy từ mã nguồn, môi trường cần Node.js, trình quản lý gói và kết nối MongoDB tương ứng. Phần máy chủ được cài các gói theo package của thư mục gốc, còn giao diện có package riêng trong client. Sau khi chuẩn bị cấu hình, lệnh npm run start:dev ở thư mục gốc chạy máy chủ và lệnh npm run dev trong client chạy giao diện bằng Vite.

Theo cấu hình mặc định, máy chủ nhận yêu cầu tại cổng 3000 và giao diện tại cổng 5173. Vite chuyển tiếp /api và /public đến máy chủ trong quá trình phát triển. Có thể dùng npm run dev:all ở thư mục gốc để chạy máy chủ cùng các cổng giao diện phục vụ việc sử dụng nhiều phiên. Tài liệu API được cung cấp tại /api/docs trên địa chỉ máy chủ.

Trước khi tạo bản chạy, lệnh npm run build dựng máy chủ; lệnh npm run build trong client kiểm tra kiểu và đóng gói giao diện. Bộ kiểm thử phía máy chủ được gọi bằng npm test. Mã nguồn còn có lệnh seed phục vụ dữ liệu mẫu và từ chối chạy khi NODE_ENV là production. Việc nạp mẫu là thao tác chuẩn bị dữ liệu riêng, không phải bước tự động bắt buộc mỗi lần khởi động.

### 3.6.3 Phân phối bản dựng và kết nối dịch vụ

Lệnh npm run start:prod chạy phần máy chủ đã dựng. Bản dựng giao diện trong client/dist cần được phân phối bởi dịch vụ phục vụ tệp tĩnh phù hợp với nơi vận hành. Cấu hình máy chủ hiện công bố public cho học liệu, còn mã khởi động chưa có bước tự phục vụ toàn bộ bản dựng giao diện. Địa chỉ API, chính sách nguồn giao diện và cách xử lý các đường dẫn Vue Router cần được đặt theo môi trường công bố.

Khi kết nối thanh toán thật, payOS cần gửi được thông báo đến đường dẫn /api/v1/payments/payos/webhook của máy chủ. Cấu hình SMTP cũng cần kết nối được máy chủ thư đã chọn. Thư mục public và cơ sở dữ liệu là hai phần dữ liệu cần được lưu giữ khi thay đổi hoặc khởi động lại bản chạy. Thông tin kết nối và khóa kiểm tra thuộc cấu hình máy chủ.

## 3.7 Tổng kết chương

Chương 3 đã trình bày các nhóm chức năng, kiến trúc, dữ liệu, giao diện và cách cài đặt NextCode. Các luồng xử lý liên kết tài khoản, khóa học, thanh toán và tiến độ theo điều kiện đã xác định. Phần cấu hình làm rõ cách chạy chương trình và kết nối các dịch vụ. Những nội dung này là cơ sở để kiểm thử và đánh giá ở chương tiếp theo.
'''

TABLES = {
'modules':('Tổ chức mã nguồn của NextCode',['Vị trí','Nội dung và trách nhiệm'],[
 ('client/src/pages, layouts','Các trang và bố cục công khai, tài khoản, học tập, quản lý.'),
 ('client/src/components','Các thành phần như thẻ khóa, trình phát, tài liệu, trắc nghiệm và hộp thoại.'),
 ('client/src/services, stores','Gọi API và quản lý trạng thái xác thực dùng chung.'),
 ('client/src/composables','Các hàm xử lý dùng lại cho danh sách và biên soạn khóa học.'),
 ('src/modules','Các module xác thực, người dùng, khóa học, học tập, chứng chỉ, đơn hàng, hỏi đáp và đánh giá.'),
 ('src/common','Guard, decorator, hằng số, xử lý phản hồi và ngoại lệ dùng chung.'),
 ('src/database','Thiết lập kết nối Mongoose với MongoDB.'),
 ('public','Các tệp nội dung được máy chủ công bố qua /public/.'),
]),
'api':('Một số API đại diện của hệ thống',['API sau tiền tố /api/v1','Công việc'],[
 ('POST /auth/register, /auth/verify-otp','Tạo tài khoản chờ và xác minh đăng ký.'),
 ('POST /auth/login, /auth/refresh','Đăng nhập và làm mới phiên.'),
 ('GET /courses, /courses/:id','Tra cứu khóa học đã công bố.'),
 ('POST /courses/:courseId/enroll','Đăng ký học miễn phí.'),
 ('POST /orders, /orders/preview','Tạo đơn Pro hoặc xem trước số tiền.'),
 ('POST /payments/payos/webhook','Nhận thông báo thanh toán và kiểm tra chữ ký.'),
 ('GET /enrollments/courses/:courseId/learning','Lấy cấu trúc phòng học theo quyền truy cập.'),
 ('PATCH /enrollments/courses/:courseId/lessons/:lessonId/progress','Ghi nhận tiến độ bài học.'),
 ('POST /enrollments/courses/:courseId/lessons/:lessonId/quiz-submit','Nộp và chấm trắc nghiệm.'),
 ('GET /manage/courses','Xem danh sách khóa theo phạm vi quản lý.'),
 ('GET /manage/orders','Xem đơn hàng theo quyền quản lý.'),
 ('PATCH /manage/reports/:reportId/resolve','Xử lý báo cáo vi phạm.'),
]),
'course-states':('Chuyển trạng thái công bố khóa học',['Thao tác','Trạng thái','Người thực hiện'],[
 ('Gửi duyệt','DRAFT → PENDING','Giảng viên phụ trách hoặc quản trị viên.'),
 ('Thu hồi','PENDING → DRAFT','Giảng viên phụ trách hoặc quản trị viên.'),
 ('Phê duyệt','PENDING → APPROVED','Quản trị viên, sau khi kiểm tra điều kiện sẵn sàng.'),
 ('Từ chối','PENDING → DRAFT','Quản trị viên, kèm lý do.'),
 ('Ẩn khóa','APPROVED → HIDDEN','Quản trị viên.'),
 ('Hiện lại','HIDDEN → APPROVED','Quản trị viên, sau khi kiểm tra điều kiện sẵn sàng.'),
]),
'environment':('Các nhóm cấu hình đang sử dụng',['Biến cấu hình','Vai trò'],[
 ('PORT, NODE_ENV','Cổng máy chủ và môi trường thực thi.'),
 ('CLIENT_ORIGIN','Các địa chỉ giao diện được cấu hình cho CORS.'),
 ('MONGODB_URI','Địa chỉ kết nối cơ sở dữ liệu MongoDB.'),
 ('JWT_ACCESS_SECRET, JWT_ACCESS_TTL','Khóa ký và thời hạn mã truy cập.'),
 ('SMTP_HOST, SMTP_PORT, SMTP_SECURE','Máy chủ, cổng và chế độ kết nối thư.'),
 ('SMTP_USER, SMTP_PASS, MAIL_FROM','Tài khoản gửi và thông tin người gửi thư.'),
 ('OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS','Thời hạn OTP, giới hạn nhập sai và khoảng cách gửi lại.'),
 ('THROTTLE_TTL, THROTTLE_LIMIT','Khoảng thời gian và giới hạn tần suất yêu cầu chung.'),
 ('PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY','Thông tin tích hợp và khóa kiểm tra thanh toán.'),
 ('ORDER_EXPIRE_MINUTES','Thời gian hiệu lực của đơn thanh toán.'),
 ('PAYMENT_SIMULATION_ENABLED','Bật giả lập trong môi trường được phép.'),
]),
}

# Số hình theo thứ tự xuất hiện, được dùng trong lời dẫn của bản thảo.
FIGURES = {
'architecture':'Kiến trúc tổng quan của NextCode',
'function-overview':'Phân rã chức năng tổng quát của NextCode',
'function-student':'Phân rã chức năng của khách truy cập và học viên',
'function-instructor':'Phân rã chức năng của giảng viên',
'function-admin':'Phân rã chức năng của quản trị viên',
'data-learning':'Liên kết dữ liệu tài khoản, khóa học và học tập',
'data-operations':'Liên kết dữ liệu thanh toán và tương tác',
'login':'Giao diện đăng nhập tài khoản',
'register':'Giao diện đăng ký tài khoản',
'courses':'Giao diện tìm kiếm khóa học theo từ khóa',
'course-detail':'Giao diện chi tiết khóa học',
'certificate':'Giao diện tra cứu chứng chỉ',
'manage-courses':'Giao diện danh sách khóa học được phân công',
'course-editor':'Giao diện biên soạn nội dung khóa học',
'payment-flow':'Luồng xử lý thanh toán và cấp quyền học',
'learning-flow':'Luồng hoàn thành bài học và cập nhật tiến độ',
}
