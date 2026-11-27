SOURCES = {
 'http': ('MDN Web Docs', 'Overview of HTTP', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview'),
 'ts': ('Microsoft', 'TypeScript for the New Programmer', 'https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html'),
 'vue': ('Vue.js', 'Introduction', 'https://vuejs.org/guide/introduction.html'),
 'router': ('Vue Router', 'Introduction', 'https://router.vuejs.org/introduction.html'),
 'pinia': ('Pinia', 'Introduction', 'https://pinia.vuejs.org/introduction.html'),
 'vuetify': ('Vuetify', 'Why Vuetify', 'https://vuetifyjs.com/en/introduction/why-vuetify/'),
 'tailwind': ('Tailwind CSS', 'Styling with utility classes', 'https://tailwindcss.com/docs/styling-with-utility-classes'),
 'vite': ('Vite', 'Getting Started', 'https://vite.dev/guide/'),
 'axios': ('Axios', 'Getting Started', 'https://axios-http.com/docs/intro'),
 'node': ('Node.js', 'Introduction to Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),
 'nest': ('NestJS', 'Providers', 'https://docs.nestjs.com/providers'),
 'validation': ('NestJS', 'Validation', 'https://docs.nestjs.com/techniques/validation'),
 'mongo': ('MongoDB', 'Data Modeling in MongoDB', 'https://www.mongodb.com/docs/manual/data-modeling/'),
 'mongoose': ('Mongoose', 'Schemas', 'https://mongoosejs.com/docs/guide.html'),
 'jwt': ('IETF', 'RFC 7519: JSON Web Token', 'https://www.rfc-editor.org/rfc/rfc7519.html'),
 'argon': ('node-argon2', 'Tài liệu thư viện băm Argon2 cho Node.js', 'https://github.com/ranisalt/node-argon2'),
 'mail': ('Nodemailer', 'SMTP transport', 'https://nodemailer.com/smtp'),
 'payos': ('payOS', 'Tài liệu API thanh toán', 'https://payos.vn/docs/api/'),
 'vitest': ('Vitest', 'Getting Started', 'https://vitest.dev/guide/'),
 'swagger': ('NestJS', 'OpenAPI và Swagger', 'https://docs.nestjs.com/openapi/introduction'),
}

# Mỗi đoạn lý thuyết dẫn về tài liệu chính thức. Ví dụ áp dụng được đối chiếu mã nguồn.
CONTENT = '''
# CHƯƠNG 2 CƠ SỞ LÝ THUYẾT

Chương này trình bày các kiến thức và công nghệ được sử dụng để xây dựng website học lập trình trực tuyến NextCode. Nội dung đi từ cách ứng dụng web trao đổi dữ liệu đến công nghệ giao diện, xử lý nghiệp vụ, lưu trữ và các dịch vụ hỗ trợ. Mỗi công nghệ được giải thích theo chức năng của nó và liên hệ với công việc cụ thể trong hệ thống. Đây là cơ sở để trình bày thiết kế và cài đặt giải pháp ở các chương sau.

## 2.1 Mô hình ứng dụng web và phương thức trao đổi dữ liệu

### 2.1.1 Mô hình máy khách và máy chủ

Ứng dụng web là phần mềm người dùng truy cập thông qua trình duyệt. Trong mô hình máy khách và máy chủ, máy khách tiếp nhận thao tác và hiển thị kết quả. Máy chủ nhận yêu cầu, thực hiện công việc cần thiết rồi gửi phản hồi. Cơ sở dữ liệu lưu giữ thông tin để có thể sử dụng lại sau khi người dùng đóng trình duyệt hoặc kết thúc phiên làm việc.

NextCode tổ chức giao diện bằng Vue và phần xử lý máy chủ bằng NestJS. MongoDB lưu dữ liệu về tài khoản, khóa học, đăng ký học, đơn hàng và kết quả học tập. Khi học viên mở danh sách khóa học, trình duyệt yêu cầu dữ liệu từ máy chủ. Máy chủ truy vấn các khóa được phép hiển thị rồi trả kết quả để giao diện trình bày. Khi giảng viên sửa bài học, dữ liệu cũng đi qua máy chủ để kiểm tra quyền và điều kiện trước khi được lưu.

Việc phân chia trách nhiệm giúp xác định nơi xử lý từng công việc. Giao diện có thể kiểm tra một ô nhập liệu để người dùng sửa ngay, nhưng quyết định chấp nhận dữ liệu vẫn thuộc máy chủ. Tương tự, việc ẩn một nút trên màn hình chỉ hỗ trợ cách sử dụng. Máy chủ vẫn cần kiểm tra quyền đối với yêu cầu thực sự được gửi đến.

@figure

### 2.1.2 HTTP, API và dữ liệu JSON

HTTP là giao thức quy định cách máy khách gửi yêu cầu và máy chủ trả phản hồi trên web. Một yêu cầu thể hiện địa chỉ cần truy cập, loại thao tác, thông tin đi kèm và dữ liệu gửi lên nếu có. Phản hồi chứa mã trạng thái cùng nội dung kết quả. Chẳng hạn, máy chủ có thể trả dữ liệu khi xử lý thành công hoặc trả thông báo khi người dùng chưa đăng nhập.[http]

API là giao diện để các thành phần phần mềm trao đổi dữ liệu và yêu cầu thực hiện công việc. API web của NextCode được tổ chức theo nhóm tài nguyên như người dùng, khóa học và đơn hàng. Các phương thức HTTP được dùng theo mục đích: GET để lấy dữ liệu, POST để tạo dữ liệu hoặc thực hiện một hành động, PATCH để cập nhật và DELETE để xóa. Cách tổ chức này kế thừa nguyên tắc giao tiếp theo tài nguyên của REST, giúp phía giao diện biết cần gửi yêu cầu đến đâu và mong đợi kết quả nào.

Phần lớn dữ liệu nghiệp vụ được trao đổi dưới dạng JSON. Đây là cách biểu diễn dữ liệu bằng các cặp tên và giá trị, có thể chứa danh sách hoặc các đối tượng lồng nhau. Một khóa học có thể được trả về với tên, học phí và danh sách chương. JSON dùng cho thông tin mô tả; video, hình ảnh và tài liệu được tải hoặc truy cập qua các đường dẫn tệp tương ứng.

Trong NextCode, các API nghiệp vụ có tiền tố /api/v1. Giao diện gọi các API này thay vì kết nối trực tiếp với MongoDB. Vì vậy, quy tắc tính tiền, xác định quyền học và ghi nhận hoàn thành được xử lý tại máy chủ trước khi phản ánh lên màn hình.

## 2.2 Ngôn ngữ lập trình TypeScript

TypeScript là ngôn ngữ phát triển từ JavaScript, bổ sung khả năng khai báo và kiểm tra kiểu dữ liệu. Kiểu dữ liệu cho biết một giá trị được sử dụng dưới dạng nào, chẳng hạn số, chuỗi hoặc một đối tượng có các thuộc tính xác định. Công cụ kiểm tra kiểu giúp phát hiện một số cách sử dụng không phù hợp trong lúc phát triển, trước khi chương trình được thực thi.[ts]

NextCode dùng TypeScript ở cả giao diện và máy chủ. Phía giao diện khai báo cấu trúc của dữ liệu nhận từ API để sử dụng trong trang và thành phần. Phía máy chủ dùng lớp, kiểu dữ liệu và các khai báo liên quan để mô tả thông tin đầu vào, dữ liệu lưu trữ và kết quả xử lý. Ví dụ, học phí là giá trị số, còn trạng thái khóa học được biểu diễn bằng một tập giá trị xác định. Các khai báo này giúp người phát triển hiểu dữ liệu đang được xử lý và giảm nhầm lẫn khi sửa chương trình.

Kiểm tra kiểu trong mã nguồn có giới hạn riêng. Dữ liệu do người dùng gửi đến có thể khác với kiểu đã khai báo, còn một phép tính đúng kiểu vẫn có thể sai quy tắc nghiệp vụ. Vì vậy, đề tài kết hợp TypeScript với kiểm tra dữ liệu tại máy chủ và các điều kiện xử lý trong từng chức năng. TypeScript hỗ trợ việc lập trình, còn việc chấp nhận yêu cầu phụ thuộc dữ liệu thực tế và quy tắc của hệ thống.

## 2.3 Các công nghệ xây dựng giao diện

### 2.3.1 Vue 3

Vue là công nghệ xây dựng giao diện dựa trên HTML, CSS và JavaScript. Vue cho phép chia giao diện thành các thành phần, mỗi thành phần phụ trách một phần hiển thị và tương tác. Cơ chế phản ứng của Vue theo dõi dữ liệu được sử dụng trên giao diện và cập nhật phần hiển thị liên quan khi dữ liệu thay đổi.[vue]

Mã nguồn NextCode sử dụng Vue 3 với Composition API. Các thành phần khai báo dữ liệu, giá trị tính toán và hàm xử lý theo công việc của màn hình. Khi kết quả API thay đổi danh sách khóa học, Vue cập nhật danh sách đang hiển thị. Khi học viên chọn một bài học khác, nội dung của khu vực học được thay đổi theo lựa chọn đó. Người phát triển không phải tự tìm và sửa từng phần tử HTML cho các thay đổi này.

Một tệp thành phần Vue có thể chứa phần mô tả giao diện, phần xử lý bằng TypeScript và phần định dạng. Những thành phần dùng chung như biểu mẫu, hộp thoại và khu vực điều hướng được sử dụng tại nhiều màn hình. Cách tổ chức này giúp tách phần trình bày thành những đơn vị dễ đọc và giúp các trang có cách tương tác nhất quán. Dữ liệu lâu dài như tiến độ hoặc đơn hàng vẫn phải được lấy từ máy chủ hoặc gửi về máy chủ để lưu.

### 2.3.2 Vue Router

Vue Router quản lý việc điều hướng giữa các màn hình của ứng dụng Vue. Thư viện liên kết địa chỉ trên trình duyệt với thành phần cần hiển thị và hỗ trợ truyền tham số qua đường dẫn. Nhờ đó, một ứng dụng có thể cung cấp nhiều màn hình trong cùng một hệ thống giao diện.[router]

NextCode dùng Vue Router cho các khu vực xem khóa học, học tập, quản lý nội dung và quản trị. Mã khóa học hoặc mã bài học trong địa chỉ giúp màn hình xác định dữ liệu cần lấy. Các tuyến đường còn khai báo yêu cầu đăng nhập và nhóm vai trò được phép truy cập. Trước khi chuyển trang, chương trình kiểm tra trạng thái tài khoản để điều hướng người dùng đến khu vực phù hợp.

Việc kiểm tra tuyến đường giúp tránh hiển thị màn hình không phù hợp với người dùng. Đối với những thao tác như sửa khóa học hoặc xem dữ liệu quản trị, máy chủ tiếp tục kiểm tra quyền khi nhận yêu cầu. Hai bước này phục vụ hai mục đích liên quan: hướng dẫn người dùng trên giao diện và kiểm soát thao tác với dữ liệu.

### 2.3.3 Pinia

Trạng thái giao diện là dữ liệu mà ứng dụng đang sử dụng tại một thời điểm, chẳng hạn người dùng đã đăng nhập hay đang chờ phản hồi. Khi nhiều thành phần cùng cần một dữ liệu, việc lưu riêng ở từng nơi dễ dẫn đến hiển thị không thống nhất. Pinia cung cấp nơi quản lý trạng thái dùng chung cho ứng dụng Vue để các thành phần có thể cùng đọc và cập nhật.[pinia]

Trong NextCode, Pinia quản lý trạng thái xác thực. Nơi lưu trữ này giữ thông tin người dùng, mã truy cập và trạng thái của các thao tác đăng nhập. Thanh điều hướng, trang tài khoản và bộ điều hướng có thể sử dụng cùng một thông tin để xác định cách hiển thị. Khi đăng xuất hoặc làm mới phiên thất bại, trạng thái được xóa để giao diện trở về trạng thái phù hợp.

Pinia không thay thế cơ sở dữ liệu. Mã truy cập trong trạng thái của NextCode được giữ trong bộ nhớ của ứng dụng đang chạy. Khi tải lại trang, giao diện thực hiện quy trình khôi phục phiên qua máy chủ. Những dữ liệu chỉ phục vụ một màn hình vẫn có thể được quản lý ngay trong thành phần hoặc các hàm xử lý dùng chung của giao diện.

### 2.3.4 Vuetify và Tailwind CSS

Vuetify cung cấp các thành phần giao diện dành cho Vue, chẳng hạn nút bấm, trường nhập liệu, hộp thoại, bảng và khu vực bố trí nội dung. Việc sử dụng thành phần có sẵn giúp các màn hình có hình thức và cách tương tác thống nhất, đồng thời giảm công việc xây dựng lại những thành phần thông dụng.[vuetify]

NextCode tích hợp Vuetify trong phần khởi tạo giao diện. Các trang sử dụng thành phần của thư viện để tổ chức biểu mẫu, hiển thị thông tin và tiếp nhận thao tác. Chẳng hạn, biểu mẫu đăng nhập cần trường nhập, nút gửi và vùng thông báo; trang quản lý cần bảng dữ liệu cùng hộp thoại cho các thao tác liên quan. Việc dùng thành phần chung giúp những công việc tương tự có cách sử dụng gần nhau.

Tailwind CSS là công cụ định dạng giao diện bằng các lớp CSS có mục đích cụ thể, như đặt khoảng cách, kích thước chữ, màu sắc và cách bố trí. Các lớp được kết hợp trực tiếp trên phần tử cần trình bày. Tailwind cũng hỗ trợ áp dụng định dạng theo kích thước màn hình để bố cục có thể thay đổi khi vùng hiển thị thay đổi.[tailwind]

Mã nguồn NextCode sử dụng Tailwind cùng Vuetify và CSS riêng. Vuetify cung cấp nhiều thành phần tương tác, còn Tailwind hỗ trợ điều chỉnh bố cục và hình thức của từng vùng nội dung. Việc kết hợp cần giữ cách đặt khoảng cách, màu và cỡ chữ nhất quán giữa các trang. Mức độ hiển thị tốt trên các thiết bị còn phụ thuộc thiết kế từng màn hình và việc kiểm tra thực tế.

### 2.3.5 Vite

Vite là công cụ hỗ trợ phát triển và đóng gói ứng dụng giao diện. Trong quá trình lập trình, máy chủ phát triển của Vite cung cấp ứng dụng cho trình duyệt và cập nhật phần mã vừa thay đổi. Khi tạo bản để triển khai, lệnh dựng ứng dụng tập hợp mã nguồn và các tài nguyên cần thiết thành các tệp sử dụng cho môi trường chạy thực tế.[vite]

NextCode cấu hình Vite với phần hỗ trợ Vue và Tailwind CSS. Khi phát triển trên máy cá nhân, các yêu cầu bắt đầu bằng /api và /public được chuyển tiếp đến máy chủ NestJS. Cấu hình này giúp giao diện gọi API và lấy tệp trong cùng quá trình làm việc. Lệnh dựng giao diện kết hợp kiểm tra kiểu bằng vue-tsc với đóng gói bằng Vite, để phát hiện vấn đề về kiểu trước khi tạo bản dựng.

Máy chủ phát triển và bản dựng phục vụ hai giai đoạn khác nhau. Cấu hình chuyển tiếp khi phát triển giúp kết nối các thành phần trên máy lập trình; cách công bố địa chỉ API và phân phối tệp giao diện khi triển khai cần được thiết lập theo môi trường vận hành. Vì vậy, chương này xem Vite là công cụ phát triển và dựng giao diện của đề tài.

### 2.3.6 Axios

Axios là thư viện gửi yêu cầu HTTP. Thư viện hỗ trợ thiết lập cấu hình dùng chung và các hàm chặn yêu cầu hoặc phản hồi để xử lý trước khi dữ liệu được chuyển đến bước tiếp theo. Nhờ vậy, những công việc lặp lại khi gọi API có thể được tập trung tại một nơi.[axios]

Phía giao diện NextCode tạo một đối tượng Axios dùng chung cho các API. Trước khi gửi yêu cầu cần xác thực, chương trình bổ sung mã truy cập vào phần đầu yêu cầu. Khi nhận phản hồi cho biết mã truy cập không còn hợp lệ, chương trình có thể yêu cầu làm mới phiên rồi thực hiện lại yêu cầu. Các yêu cầu cùng chờ làm mới được phối hợp để hạn chế việc gửi nhiều yêu cầu làm mới đồng thời.

Axios phụ trách việc trao đổi với máy chủ, còn thành phần giao diện quyết định cách thể hiện dữ liệu và thông báo. Ví dụ, màn hình có thể chuyển sang trạng thái đang tải khi bắt đầu gọi API rồi hiển thị danh sách hoặc thông báo lỗi sau khi nhận kết quả. Máy chủ vẫn là nơi xác định yêu cầu có được chấp nhận hay không.

## 2.4 Các công nghệ xây dựng máy chủ

### 2.4.1 Node.js

Node.js là môi trường thực thi JavaScript bên ngoài trình duyệt. Node.js cung cấp các chức năng để xây dựng máy chủ, làm việc với tệp và giao tiếp qua mạng. Cơ chế xử lý vào ra bất đồng bộ cho phép chương trình tiếp tục xử lý công việc khác trong khi chờ một thao tác như đọc dữ liệu hoặc nhận phản hồi mạng hoàn thành.[node]

Trong NextCode, Node.js chạy phần ứng dụng NestJS sau khi mã nguồn được dựng. Các công việc như truy vấn MongoDB, gửi email và gọi dịch vụ thanh toán thường phải chờ hệ thống khác phản hồi. Mã nguồn sử dụng các hàm bất đồng bộ để tiếp nhận và xử lý kết quả khi chúng có sẵn. Khả năng đáp ứng thực tế vẫn phụ thuộc nội dung công việc, cách viết chương trình và tài nguyên của môi trường chạy.

### 2.4.2 NestJS và cách tổ chức chương trình

NestJS là khung phát triển ứng dụng máy chủ trong hệ sinh thái Node.js. Chương trình được chia thành các module theo chức năng. Bên trong module, controller tiếp nhận yêu cầu còn service thực hiện công việc xử lý. NestJS hỗ trợ cơ chế cung cấp phụ thuộc, nghĩa là khung chương trình tạo và truyền các đối tượng cần thiết cho thành phần sử dụng chúng.[nest]

NextCode phân chia máy chủ thành các module như xác thực, người dùng, khóa học, đăng ký học, đơn hàng và chứng chỉ. Một yêu cầu sửa khóa học được controller tương ứng tiếp nhận rồi chuyển cho service. Service kiểm tra điều kiện nghiệp vụ và sử dụng lớp truy cập dữ liệu để lấy hoặc cập nhật thông tin. Kết quả sau đó được trả về giao diện qua API.

Sự phân chia này giúp giữ trách nhiệm rõ ràng trong mã nguồn. Controller mô tả đầu vào và đường dẫn của thao tác. Service quyết định có chấp nhận thao tác hay không và cần thay đổi dữ liệu nào. Các model Mongoose thực hiện công việc với MongoDB. Phần hiển thị được Vue xử lý tại trình duyệt, còn máy chủ NestJS chủ yếu trả dữ liệu cho các API.

### 2.4.3 Kiểm tra đầu vào và xử lý phản hồi

Dữ liệu đầu vào cần được kiểm tra trước khi tham gia xử lý nghiệp vụ. NestJS hỗ trợ mô tả dữ liệu nhận vào bằng các lớp DTO và kiểm tra chúng thông qua ValidationPipe. Các thư viện class-validator và class-transformer hỗ trợ khai báo điều kiện hợp lệ và chuyển dữ liệu nhận được sang dạng đối tượng cần dùng.[validation]

Trong NextCode, bước kiểm tra chung được cấu hình tại điểm khởi động máy chủ. Các thuộc tính gửi lên phải phù hợp với khai báo kiểm tra của DTO. Khi yêu cầu có thuộc tính ngoài danh sách cho phép, cấu hình hiện tại từ chối yêu cầu. Những kiểm tra như email có đúng định dạng hoặc một giá trị có phải số thuộc phạm vi kiểm tra dữ liệu. Những điều kiện như ai sở hữu khóa học hoặc đơn hàng đã được thanh toán chưa tiếp tục được xử lý trong các thành phần nghiệp vụ.

Máy chủ còn sử dụng guard để kiểm tra điều kiện truy cập, interceptor để định dạng kết quả và bộ xử lý ngoại lệ để trả thông báo lỗi theo cấu trúc chung. Việc thống nhất cách phản hồi giúp giao diện đọc kết quả và hiển thị lỗi theo một quy ước. Một lỗi về định dạng dữ liệu, thiếu quyền hoặc không tìm thấy đối tượng cần được thông báo phù hợp để người dùng biết có thể làm gì tiếp theo.

## 2.5 Cơ sở dữ liệu MongoDB và thư viện Mongoose

### 2.5.1 Mô hình dữ liệu MongoDB

MongoDB là hệ quản trị cơ sở dữ liệu tổ chức dữ liệu dưới dạng tài liệu. Mỗi tài liệu chứa các trường dữ liệu và được lưu trong một tập hợp. Trường có thể chứa giá trị đơn, một tài liệu con hoặc một danh sách. Các đối tượng liên quan có thể được lưu lồng trong một tài liệu hoặc liên kết bằng mã tham chiếu, tùy cách ứng dụng truy cập và cập nhật dữ liệu.[mongo]

Một khóa học trong NextCode có nhiều chương, mỗi chương có các bài học và những thông tin liên quan. Cấu trúc lồng nhau của MongoDB được dùng để lưu các thành phần nội dung này trong dữ liệu khóa học. Khi lấy nội dung khóa học, chương trình có thể đọc cấu trúc chương và bài từ dữ liệu tương ứng.

Những thông tin có vòng đời hoặc cách sử dụng riêng được tổ chức thành các tập hợp riêng. Chẳng hạn, bản ghi đăng ký học liên kết học viên với khóa học, còn đơn hàng lưu thông tin của quá trình mua khóa. Cách tham chiếu giúp biểu diễn quan hệ giữa các đối tượng mà không phải đưa toàn bộ dữ liệu tài khoản hoặc khóa học vào từng bản ghi liên quan. Việc chọn lưu lồng hay tham chiếu cần dựa vào nhu cầu đọc, cập nhật và quản lý dữ liệu của từng chức năng.

### 2.5.2 Schema, model và chỉ mục trong Mongoose

Mongoose là thư viện làm việc với MongoDB trong ứng dụng Node.js. Schema mô tả cấu trúc dữ liệu, kiểu của từng trường và các quy định liên quan. Model được tạo từ schema cung cấp các thao tác để tạo, đọc, sửa và xóa dữ liệu. Những khai báo này giúp ứng dụng làm việc với các tài liệu theo cấu trúc đã xác định.[mongoose]

NextCode khai báo schema cho người dùng, khóa học, đơn hàng, đăng ký học và các dữ liệu nghiệp vụ khác. Các module NestJS nhận model tương ứng để truy vấn MongoDB. Chẳng hạn, service đăng ký học dùng model để tìm bản ghi giữa một học viên và một khóa học, từ đó xử lý quyền học hoặc cập nhật tiến độ.

Chỉ mục là cấu trúc hỗ trợ việc tìm dữ liệu theo những trường xác định. Chỉ mục duy nhất còn được dùng để ngăn các giá trị trùng trong phạm vi đã khai báo. Schema đăng ký học của NextCode khai báo chỉ mục duy nhất trên cặp học viên và khóa học. Quy định này thể hiện yêu cầu mỗi học viên chỉ có một bản ghi đăng ký đối với cùng một khóa học, còn thông tin học tập được cập nhật trên bản ghi đó.

Cấu trúc dữ liệu và chỉ mục cần đi cùng các điều kiện xử lý của ứng dụng. Việc lưu được một tài liệu đúng schema chưa đủ để kết luận thao tác đúng nghiệp vụ. Với đăng ký học, máy chủ còn phải kiểm tra điều kiện của khóa và kết quả thanh toán khi cần. Những quan hệ và ràng buộc cụ thể sẽ được trình bày trong phần thiết kế dữ liệu.

## 2.6 Xác thực và kiểm soát quyền truy cập

### 2.6.1 Xác thực bằng JWT và duy trì phiên đăng nhập

Xác thực là bước xác định người đang sử dụng tài khoản. Sau khi thông tin đăng nhập được kiểm tra, máy chủ có thể cấp một mã để người dùng gửi kèm các yêu cầu tiếp theo. JWT là định dạng biểu diễn các thông tin xác nhận trong một mã có thể trao đổi giữa các bên. Với JWT được ký, bên nhận có thể kiểm tra chữ ký để phát hiện dữ liệu bị thay đổi.[jwt]

NextCode sử dụng JWT làm mã truy cập. Mã chứa các thông tin như mã người dùng, email, vai trò và thời hạn hiệu lực. Khi giao diện gọi API cần đăng nhập, Axios gửi mã này theo dạng Bearer trong phần đầu yêu cầu. Guard xác thực của máy chủ kiểm tra mã rồi cung cấp thông tin người dùng cho bước xử lý tiếp theo. Chữ ký dùng để kiểm tra tính hợp lệ; nội dung JWT được ký không vì thế trở thành dữ liệu bí mật.

Mã truy cập có thời hạn ngắn để giới hạn thời gian sử dụng. Để người dùng không phải nhập mật khẩu sau mỗi lần mã truy cập hết hạn, hệ thống cấp thêm mã làm mới. Trong mã nguồn NextCode, mã làm mới là chuỗi ngẫu nhiên, được lưu dưới dạng băm trong cơ sở dữ liệu và gửi cho trình duyệt bằng cookie HttpOnly. Thuộc tính này ngăn mã JavaScript trên trang đọc trực tiếp giá trị cookie. Khi chạy trong môi trường production, cookie còn được cấu hình chỉ gửi qua kết nối bảo mật.

Khi làm mới phiên hợp lệ, máy chủ thu hồi mã làm mới cũ rồi cấp bộ mã mới. Máy chủ cũng kiểm tra trạng thái tài khoản trong bước này. Giao diện giữ mã truy cập trong bộ nhớ và có thể khôi phục phiên qua cookie khi tải lại trang. Đăng xuất thu hồi mã làm mới để chấm dứt khả năng tiếp tục làm mới phiên. Các bước này cần được hiểu cùng thời hạn của mã truy cập đang có.

### 2.6.2 Băm mật khẩu bằng Argon2 và xác minh OTP

Băm là cách chuyển một giá trị thành kết quả dùng để kiểm tra đối chiếu, thay vì lưu giá trị gốc. Khi người dùng đăng nhập, hệ thống kiểm tra mật khẩu nhập vào với bản băm đã lưu. Argon2 là thuật toán được thư viện node-argon2 cung cấp để băm và xác minh mật khẩu trong ứng dụng Node.js.[argon]

NextCode dùng Argon2 cho mật khẩu, mã làm mới và mã xác minh OTP. Mật khẩu không được lưu trực tiếp ở dạng người dùng đã nhập. Khi kiểm tra một giá trị, chương trình sử dụng chức năng xác minh của thư viện với bản băm tương ứng. Người dùng quên mật khẩu được thực hiện quy trình đặt mật khẩu mới sau khi xác minh, thay vì yêu cầu hệ thống cung cấp lại mật khẩu cũ.

OTP là mã xác minh có thời hạn, được dùng cho một mục đích cụ thể. NextCode tạo mã gồm sáu chữ số bằng chức năng sinh số ngẫu nhiên của Node.js rồi gửi qua email khi đăng ký hoặc đặt lại mật khẩu. Bản ghi OTP chứa mục đích, thời điểm hết hạn, số lần nhập sai và tình trạng đã sử dụng. Những điều kiện này giúp máy chủ quyết định một mã còn được chấp nhận hay cần yêu cầu gửi mã mới.

### 2.6.3 Phân quyền và các biện pháp hỗ trợ

Phân quyền xác định người đã đăng nhập được làm những công việc nào. NextCode phân chia vai trò để tách hoạt động học tập, biên soạn, quản trị và kế toán. Vai trò được kiểm tra tại các API có yêu cầu tương ứng. Đối với dữ liệu cụ thể, chương trình còn kiểm tra quan hệ giữa người dùng và đối tượng, chẳng hạn giảng viên có được phân công cho khóa học cần sửa hay học viên có đăng ký khóa đang truy cập hay không.

Máy chủ sử dụng Helmet để thiết lập một số trường HTTP hỗ trợ bảo vệ trình duyệt, cấu hình CORS để quy định nguồn giao diện được phép trao đổi dữ liệu và dùng Throttler để giới hạn tần suất yêu cầu. Các cơ chế này hỗ trợ kiểm soát cách ứng dụng được truy cập. Chúng cần được kết hợp với xác thực, kiểm tra quyền và điều kiện nghiệp vụ của từng thao tác.

## 2.7 Gửi email bằng Nodemailer và SMTP

SMTP là giao thức dùng để chuyển thư điện tử. Nodemailer là thư viện giúp ứng dụng Node.js tạo và gửi email thông qua máy chủ thư. Chương trình thiết lập nơi nhận thư gửi đi, phương thức kết nối và thông tin xác thực của tài khoản gửi. Nội dung thư được cung cấp khi thực hiện thao tác gửi.[mail]

Trong NextCode, dịch vụ email sử dụng Nodemailer để gửi mã xác minh đăng ký và mã đặt lại mật khẩu. Máy chủ tạo mã, lưu thông tin phục vụ kiểm tra rồi yêu cầu dịch vụ email gửi mã đến địa chỉ của người dùng. Người dùng nhập mã nhận được trên giao diện, còn máy chủ kiểm tra thời hạn, mục đích và tình trạng sử dụng trước khi chấp nhận.

Thông tin kết nối máy chủ thư được đọc từ cấu hình môi trường để có thể thay đổi theo nơi vận hành. Việc gửi yêu cầu thành công đến máy chủ thư không đồng nghĩa người dùng chắc chắn đã đọc được email. Vì vậy, giao diện có chức năng gửi lại mã theo điều kiện của hệ thống, còn dịch vụ gửi thư cần xử lý trường hợp kết nối hoặc xác thực không thành công.

## 2.8 Thanh toán qua payOS và mã QR chuyển khoản

### 2.8.1 Liên kết thanh toán và mã QR

payOS cung cấp API tạo liên kết thanh toán và tra cứu thông tin thanh toán. Khi tạo liên kết, hệ thống gửi các thông tin như mã đơn hàng, số tiền, nội dung thanh toán và địa chỉ quay lại. Dữ liệu yêu cầu có chữ ký kiểm tra theo quy định của dịch vụ.[payos]

NextCode thực hiện việc tích hợp tại máy chủ bằng các yêu cầu HTTP đến payOS. Sau khi xác định số tiền phải thanh toán từ dữ liệu của hệ thống, máy chủ tạo thông tin thanh toán để giao diện hiển thị. Mã QR chứa thông tin chuyển khoản giúp học viên dùng ứng dụng ngân hàng điền thông tin thuận tiện hơn. Mã QR là phương tiện cung cấp thông tin thanh toán; kết quả giao dịch phải được kiểm tra qua dữ liệu xác nhận.

Mã nguồn cũng có chức năng tạo đường dẫn hình mã QR theo thông tin chuyển khoản. Việc hiển thị hình mã QR và việc xác định đã nhận tiền là hai bước khác nhau. Quyền học khóa có phí được xử lý theo trạng thái thanh toán mà máy chủ đã xác minh, không chỉ dựa vào thao tác đóng trang thanh toán hoặc quay lại giao diện.

### 2.8.2 Webhook và kiểm tra dữ liệu giao dịch

Webhook là cách một dịch vụ chủ động gửi thông báo đến địa chỉ của hệ thống khi có sự kiện. Với thanh toán, payOS gửi thông tin giao dịch cho máy chủ NextCode. Máy chủ có thể tiếp nhận kết quả mà không phụ thuộc việc người dùng còn mở màn hình thanh toán hay không. Ngoài thông báo này, chương trình còn có thao tác lấy trạng thái liên kết thanh toán để cập nhật kết quả.

Thông báo nhận được cần được kiểm tra trước khi làm thay đổi đơn hàng. NextCode sử dụng HMAC SHA-256 với khóa kiểm tra được cấu hình để đối chiếu chữ ký dữ liệu từ payOS. Cơ chế này giúp kiểm tra thông báo theo dữ liệu và khóa mà hai bên sử dụng. Khóa kiểm tra thuộc cấu hình phía máy chủ và không được gửi cho giao diện.

Sau khi kiểm tra thông báo, chương trình đối chiếu mã đơn, số tiền và thông tin giao dịch theo điều kiện xử lý. Khi kết quả được chấp nhận, máy chủ ghi nhận thanh toán và xử lý đăng ký học tương ứng. Việc xử lý cần nhận biết giao dịch đã ghi nhận vì thông báo có thể được gửi lại. Các bước này liên kết dữ liệu thanh toán với quyền học và là cơ sở cho quy trình mua khóa học trong đề tài.

## 2.9 Công cụ kiểm thử và tài liệu API

### 2.9.1 Kiểm thử bằng Vitest

Kiểm thử tự động thực hiện những tình huống đã được mô tả bằng mã rồi so sánh kết quả nhận được với kết quả mong đợi. Vitest là công cụ chạy kiểm thử trong hệ sinh thái JavaScript và TypeScript. Công cụ hỗ trợ khai báo các trường hợp kiểm tra, kiểm tra kết quả và thay thế thành phần phụ thuộc khi cần tách riêng phần đang được kiểm thử.[vitest]

Mã nguồn NextCode có các tệp kiểm thử cho những service phía máy chủ và sử dụng Vitest để chạy chúng. Trong kiểm thử đơn vị, dữ liệu hoặc model có thể được thay bằng đối tượng mô phỏng. Cách làm này cho phép kiểm tra phản ứng của service trước dữ liệu đầu vào và trạng thái đã chuẩn bị mà không phải vận hành toàn bộ các dịch vụ ngoài.

Ví dụ, với xử lý đơn hàng, một tình huống có thể kiểm tra điều kiện chấp nhận trạng thái thanh toán; với học tập, một tình huống có thể kiểm tra điều kiện hoàn thành. Việc mô phỏng giúp tập trung vào quy tắc đang xét, còn kết nối thực tế giữa giao diện, máy chủ, cơ sở dữ liệu và dịch vụ ngoài cần được kiểm tra theo phạm vi riêng. Kết quả kiểm thử cụ thể sẽ được trình bày trong chương kiểm thử và đánh giá.

### 2.9.2 Tài liệu API bằng OpenAPI và Swagger

OpenAPI là cách mô tả API HTTP theo một cấu trúc có thể đọc và xử lý bằng công cụ. Nội dung mô tả gồm đường dẫn, phương thức, dữ liệu đầu vào và các phản hồi. Thư viện Swagger dành cho NestJS hỗ trợ tạo tài liệu từ khai báo trong chương trình và cung cấp giao diện xem, gửi thử yêu cầu API.[swagger]

NextCode cấu hình Swagger tại đường dẫn /api/docs. Người phát triển có thể xem các nhóm API, dữ liệu cần gửi và yêu cầu xác thực khi kiểm tra từng chức năng. Những khai báo tại controller và DTO giúp tài liệu gắn với cấu trúc chương trình. Nội dung mô tả vẫn cần được cập nhật khi hành vi API thay đổi để người sử dụng tài liệu hiểu đúng.

Giao diện Swagger hỗ trợ kiểm tra từng yêu cầu và theo dõi phản hồi. Kết quả một lần gửi thử chỉ phản ánh tình huống đã thực hiện. Vì vậy, tài liệu API và kiểm thử tự động bổ sung cho nhau trong quá trình phát triển: một bên làm rõ cách gọi API, bên còn lại kiểm tra có hệ thống các điều kiện đã được xác định.

## 2.10 Tổng kết chương

Bảng 2.1 tóm tắt vai trò của các nhóm công nghệ trong NextCode. Các nhóm này phối hợp để thực hiện những yêu cầu đã phân tích ở Chương 1.

@table

Những kiến thức trên giải thích cách các thành phần có thể phối hợp để đáp ứng bài toán đã nêu ở Chương 1. Trên cơ sở đó, phần tiếp theo của báo cáo sẽ trình bày kiến trúc cụ thể, thiết kế dữ liệu, giao diện và cách cài đặt các chức năng của NextCode.
'''

TECH_ROWS = [
 ('Ngôn ngữ', 'TypeScript', 'Mô tả kiểu dữ liệu và xây dựng mã nguồn của giao diện, máy chủ.'),
 ('Giao diện', 'Vue 3, Vue Router, Pinia', 'Xây dựng thành phần, điều hướng và dùng chung trạng thái xác thực.'),
 ('Trình bày', 'Vuetify, Tailwind CSS', 'Cung cấp thành phần tương tác và định dạng bố cục.'),
 ('Dựng giao diện', 'Vite, vue-tsc', 'Phục vụ phát triển, kiểm tra kiểu và tạo bản dựng giao diện.'),
 ('Gọi API từ giao diện', 'Axios', 'Gửi yêu cầu HTTP và xử lý xác thực khi trao đổi với máy chủ.'),
 ('Xử lý máy chủ', 'Node.js, NestJS', 'Chạy ứng dụng, tổ chức API và thực hiện quy tắc nghiệp vụ.'),
 ('Lưu trữ', 'MongoDB, Mongoose', 'Lưu dữ liệu, mô tả cấu trúc và thực hiện các truy vấn.'),
 ('Xác thực', 'JWT, Argon2', 'Kiểm tra mã truy cập, băm và đối chiếu các giá trị xác thực.'),
 ('Email', 'Nodemailer, SMTP', 'Gửi mã xác minh đăng ký và đặt lại mật khẩu.'),
 ('Thanh toán', 'payOS', 'Tạo thông tin thanh toán, nhận và tra cứu kết quả giao dịch.'),
 ('Kiểm thử, tài liệu API', 'Vitest, Swagger', 'Chạy kiểm thử tự động và cung cấp tài liệu API.'),
]
