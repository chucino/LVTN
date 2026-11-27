# Các tên trường được giữ nguyên để đối chiếu với schema của chương trình.
# Một số trường cùng vai trò được gom trên một dòng để bảng dễ đọc.
SCHEMAS = [
('User','users','Tài khoản người dùng','Lưu chung tài khoản của học viên, giảng viên, quản trị viên và kế toán. Vai trò và trạng thái được lưu trên từng tài khoản, không tách thành các tập hợp người dùng riêng.', '''
fullName|Chuỗi|Họ tên người sử dụng.
email|Chuỗi|Địa chỉ email, được chuẩn hóa chữ thường và không trùng.
passwordHash|Chuỗi|Bản băm mật khẩu; mặc định không được chọn khi truy vấn thông thường.
dateOfBirth|Thời gian|Ngày sinh, có thể chưa được cung cấp.
occupation|Chuỗi|Nghề nghiệp của người dùng.
role|Chuỗi|STUDENT, INSTRUCTOR, ACCOUNTANT hoặc ADMIN.
avatar|Chuỗi|Đường dẫn ảnh đại diện.
status|Chuỗi|PENDING, ACTIVE hoặc LOCKED.
interestedCategories|Danh sách|Lĩnh vực quan tâm, chấp nhận mã danh mục hoặc nhãn chuỗi.
violationCount|Số|Số vi phạm đã được xác nhận, mặc định bằng 0.
commentBannedUntil|Thời gian|Thời điểm hết hạn cấm bình luận, có thể để trống.
violationHistory|Danh sách|Lịch sử xử lý, gồm mã báo cáo, nội dung, khóa học, lý do, biện pháp, người và thời gian xử lý.
'''),
('Otp','otps','Mã xác minh qua email','Phục vụ xác minh đăng ký và đặt lại mật khẩu. Mã được đối chiếu bằng bản băm, cùng với mục đích, thời hạn và số lần nhập sai.', '''
email|Chuỗi|Email nhận mã xác minh.
codeHash|Chuỗi|Bản băm của mã OTP.
purpose|Chuỗi|REGISTER hoặc RESET_PASSWORD.
expiresAt|Thời gian|Thời điểm hết hiệu lực.
failedAttempts|Số|Số lần nhập sai đã ghi nhận.
lastSentAt|Thời gian|Thời điểm gửi mã gần nhất, phục vụ điều kiện gửi lại.
isUsed|Đúng hoặc sai|Cho biết mã đã được sử dụng hay chưa.
'''),
('RefreshToken','refreshtokens','Mã làm mới phiên','Liên kết mã làm mới với tài khoản. Mỗi lần làm mới hợp lệ thu hồi bản ghi cũ và tạo mã mới.', '''
userId|Mã tham chiếu|Tài khoản được cấp mã.
tokenHash|Chuỗi|Bản băm mã làm mới ngẫu nhiên.
expiresAt|Thời gian|Thời điểm hết hiệu lực của mã.
isRevoked|Đúng hoặc sai|Cho biết mã đã bị thu hồi.
'''),
('Category','categories','Danh mục khóa học','Lưu tên nhóm nội dung để phân loại và lọc khóa học.', '''
name|Chuỗi|Tên danh mục, bắt buộc và không trùng.
'''),
('Course','courses','Khóa học','Đây là tài liệu trung tâm của nội dung học tập. Cấu trúc chương, bài học và câu hỏi được lưu lồng trong trường chapters.', '''
title|Chuỗi|Tên khóa học, bắt buộc.
description|Chuỗi|Mô tả khóa học, bắt buộc.
type|Chuỗi|FREE cho khóa miễn phí hoặc PRO cho khóa có phí.
level|Chuỗi|Trình độ trong danh sách giá trị được chương trình quy định.
targetAudience|Chuỗi|Đối tượng phù hợp với khóa học.
learningOutcomes|Danh sách chuỗi|Những nội dung học viên đạt được sau khóa học.
requirements|Chuỗi|Điều kiện cần chuẩn bị trước khi học.
price|Số|Học phí gốc, không âm.
discountPrice|Số hoặc trống|Học phí ưu đãi của khóa học.
status|Chuỗi|DRAFT, PENDING, APPROVED hoặc HIDDEN.
instructorId|Mã tham chiếu|Giảng viên được phân công phụ trách.
categoryId|Mã tham chiếu hoặc trống|Danh mục của khóa học.
avgRating|Số|Điểm đánh giá trung bình từ 0 đến 5.
totalChapters|Số|Tổng số chương được tính từ nội dung.
totalLessons|Số|Tổng số bài học được tính từ nội dung.
totalDuration|Số|Tổng thời lượng video theo giây.
thumbnail|Chuỗi|Đường dẫn ảnh đại diện khóa học.
rejectReason|Chuỗi|Lý do từ chối khi trả khóa về nháp.
chapters|Danh sách tài liệu|Các chương, được lưu lồng trong khóa học.
'''),
('Chapter',None,'Cấu trúc chương trong khóa học','Mỗi chương có mã riêng và nằm trong danh sách chapters của một khóa học. Đây là tài liệu con, không phải một tập hợp riêng trong MongoDB.', '''
title|Chuỗi|Tên chương.
order|Số|Thứ tự chương, bắt đầu từ 1.
lessons|Danh sách tài liệu|Các bài học của chương.
'''),
('Lesson',None,'Cấu trúc bài học trong chương','Bài học là đơn vị được theo dõi tiến độ. Đường dẫn video hoặc tài liệu được lưu tại bài học, còn nội dung tệp nằm trên nơi lưu trữ tương ứng.', '''
title|Chuỗi|Tên bài học.
order|Số|Thứ tự bài trong chương, bắt đầu từ 1.
videoUrl|Chuỗi|Đường dẫn video, có thể không có với bài đọc.
duration|Số|Thời lượng video theo giây, không âm.
content|Chuỗi|Nội dung văn bản của bài học.
fileUrl|Chuỗi|Đường dẫn tài liệu đính kèm.
fileName|Chuỗi|Tên tài liệu hiển thị cho người học.
note|Chuỗi|Ghi chép do người biên soạn cung cấp cho bài học.
summary|Chuỗi|Nội dung tóm tắt của bài học.
quizQuestions|Danh sách tài liệu|Các câu hỏi trắc nghiệm của bài học.
hasQuiz|Đúng hoặc sai|Thông tin về việc có trắc nghiệm của bài học.
'''),
('QuizQuestion',None,'Cấu trúc câu hỏi trắc nghiệm','Câu hỏi được lưu trong quizQuestions của bài học. Đáp án đúng được dùng tại máy chủ khi chấm và không có trong dữ liệu câu hỏi trước khi học viên nộp bài.', '''
content|Chuỗi|Nội dung câu hỏi.
options|Danh sách chuỗi|Các phương án trả lời.
correctOption|Số|Chỉ số phương án đúng, bắt đầu từ 0.
explanation|Chuỗi|Giải thích đáp án dùng trong kết quả chấm.
'''),
('Enrollment','enrollments','Đăng ký học','Liên kết một học viên với một khóa học và lưu kết quả tổng hợp của quá trình học. Cặp studentId và courseId có chỉ mục duy nhất.', '''
studentId|Mã tham chiếu|Học viên đăng ký.
courseId|Mã tham chiếu|Khóa học được đăng ký.
enrolledAt|Thời gian|Thời điểm đăng ký học.
progressPercent|Số|Tỷ lệ bài đã hoàn thành, từ 0 đến 100.
status|Chuỗi|LEARNING hoặc COMPLETED.
completedAt|Thời gian|Thời điểm hoàn thành, để trống khi chưa hoàn thành.
lastLessonId|Mã bài học hoặc trống|Bài được ghi nhận để tiếp tục học.
'''),
('LessonProgress','lesson_progresses','Tiến độ từng bài học','Một bản ghi đăng ký có nhiều bản ghi tiến độ bài học. Cặp enrollmentId và lessonId có chỉ mục duy nhất.', '''
enrollmentId|Mã tham chiếu|Bản ghi đăng ký học.
lessonId|Mã bài học|Mã bài nằm trong cấu trúc khóa học.
status|Chuỗi|LOCKED, UNLOCKED hoặc COMPLETED.
lastPositionSec|Số|Vị trí video ghi nhận gần nhất theo giây.
watchedSeconds|Số|Thời gian xem đã được ghi nhận theo giây.
watchedFully|Đúng hoặc sai|Đã đạt điều kiện thời gian xem hoặc xác nhận đọc bài.
quizPassed|Đúng hoặc sai|Đã đạt trắc nghiệm; bài không có trắc nghiệm được xử lý theo điều kiện hoàn thành tương ứng.
'''),
('QuizAttempt','quiz_attempts','Kết quả trả lời câu hỏi','Mỗi phương án nộp cho một câu hỏi tạo một bản ghi kết quả. Dữ liệu được lưu theo câu hỏi và thời điểm trả lời, không có tập hợp riêng cho toàn bộ một lần làm bài.', '''
studentId|Mã tham chiếu|Học viên nộp câu trả lời.
questionId|Mã câu hỏi|Câu hỏi được lưu lồng trong khóa học.
selectedOption|Số|Chỉ số phương án được chọn.
isCorrect|Đúng hoặc sai|Kết quả đối chiếu với đáp án đúng.
attemptedAt|Thời gian|Thời điểm nộp câu trả lời.
'''),
('Certificate','certificates','Chứng chỉ hoàn thành','Mỗi cặp học viên và khóa học có tối đa một bản ghi chứng chỉ. Mã chứng chỉ được dùng để tra cứu công khai.', '''
certificateCode|Chuỗi|Mã chứng chỉ, không trùng và được chuẩn hóa chữ hoa.
studentId|Mã tham chiếu|Học viên được cấp chứng chỉ.
courseId|Mã tham chiếu|Khóa học đã hoàn thành.
issuedAt|Thời gian|Thời điểm cấp chứng chỉ.
qrCode|Chuỗi|Đường dẫn tra cứu theo mã chứng chỉ.
fileUrl|Chuỗi hoặc trống|Trường dự phòng đường dẫn tệp; khi cấp mới hiện được gán trống.
status|Chuỗi|VALID hoặc REVOKED; khi cấp mới là VALID.
'''),
('Order','orders','Đơn hàng mua khóa học','Lưu thông tin mua một khóa học Pro, số tiền đã tính và dữ liệu hướng dẫn thanh toán. Giá tại thời điểm mua được lưu trong đơn hàng.', '''
orderCode|Chuỗi|Mã đơn hiển thị, bắt buộc và không trùng.
payosOrderCode|Số|Mã đơn gửi payOS, bắt buộc và không trùng.
studentId|Mã tham chiếu|Học viên đặt mua.
courseId|Mã tham chiếu|Khóa học được mua.
originalPrice|Số|Giá gốc tại thời điểm lập đơn.
discountPrice|Số hoặc trống|Giá ưu đãi của khóa tại thời điểm lập đơn.
couponCode|Chuỗi hoặc trống|Mã giảm giá đã áp dụng.
discountAmount|Số|Số tiền được giảm theo mã.
finalAmount|Số|Số tiền phải thanh toán.
status|Chuỗi|PENDING, COMPLETED, CANCELLED hoặc EXPIRED.
paymentMethod|Chuỗi|PAYOS_VIETQR, SIMULATION hoặc MANUAL.
paymentLinkId|Chuỗi|Mã liên kết thanh toán từ payOS.
checkoutUrl|Chuỗi|Địa chỉ trang thanh toán của payOS.
qrCode|Chuỗi|Dữ liệu mã QR do dịch vụ trả về.
qrImageUrl|Chuỗi|Địa chỉ hình mã QR để hiển thị.
bankBin, bankName|Chuỗi|Mã ngân hàng và tên ngân hàng nhận.
accountNumber, accountName|Chuỗi|Số và tên tài khoản nhận tiền.
transferDescription|Chuỗi|Nội dung chuyển khoản.
transactionReference|Chuỗi|Mã tham chiếu giao dịch đã hoàn tất đơn.
expiresAt|Thời gian|Thời điểm hết hạn thanh toán của đơn.
paidAt|Thời gian|Thời điểm ghi nhận thanh toán.
cancelledAt|Thời gian|Thời điểm hủy đơn.
cancelReason|Chuỗi|Lý do hủy đơn nếu có.
'''),
('PaymentTransaction','payment_transactions','Giao dịch thanh toán','Lưu lần ghi nhận giao dịch gắn với đơn hàng. Mã reference có chỉ mục duy nhất để hạn chế ghi trùng cùng một mã tham chiếu.', '''
orderId|Mã tham chiếu|Đơn hàng liên quan.
orderCode|Chuỗi|Mã đơn hàng hiển thị.
payosOrderCode|Số|Mã đơn sử dụng với payOS.
studentId, courseId|Mã tham chiếu|Học viên và khóa học liên quan.
amount|Số|Số tiền của giao dịch, không âm.
reference|Chuỗi|Mã tham chiếu, bắt buộc và không trùng.
provider|Chuỗi|PAYOS, SIMULATION hoặc MANUAL.
status|Chuỗi|SUCCESS, IGNORED hoặc FAILED theo schema.
counterAccountBankId|Chuỗi|Thông tin ngân hàng đối ứng nếu nhận được.
counterAccountName|Chuỗi|Tên chủ tài khoản đối ứng nếu nhận được.
counterAccountNumber|Chuỗi|Số tài khoản đối ứng nếu nhận được.
transactionDateTime|Chuỗi|Thời gian giao dịch từ nguồn thông tin thanh toán.
rawPayload|Đối tượng|Dữ liệu nguồn; với xác nhận thủ công có thông tin người và thời điểm xác nhận.
'''),
('LessonComment','lesson_comments','Hỏi đáp tại bài học','Câu hỏi và câu trả lời dùng chung một tập hợp. parentId liên kết câu trả lời với nội dung cấp trên; để trống với câu hỏi ban đầu.', '''
courseId|Mã tham chiếu|Khóa học của cuộc thảo luận.
lessonId|Mã bài học|Bài học liên quan.
parentId|Mã tham chiếu hoặc trống|Nội dung cấp trên trong cùng cuộc thảo luận.
replyToUser|Tài liệu con|Mã và họ tên người đang được trả lời.
authorId|Mã tham chiếu|Người viết nội dung.
content|Chuỗi|Nội dung thảo luận, tối đa 2.000 ký tự.
visibilityStatus|Chuỗi|VISIBLE hoặc HIDDEN.
moderationNote|Chuỗi|Ghi chú xử lý nội dung nếu có.
violationRecorded|Đúng hoặc sai|Đã cộng vi phạm cho nội dung này hay chưa.
reactions|Danh sách|Mỗi phần tử gồm userId và loại cảm xúc type.
reports|Danh sách|Thông tin người phản ánh, lý do và thời điểm gửi.
'''),
('CourseReview','course_reviews','Đánh giá khóa học','Lưu một đánh giá cho mỗi cặp học viên và khóa học. Điểm sao và phần nhận xét được lưu cùng bản ghi.', '''
courseId, studentId|Mã tham chiếu|Khóa học được đánh giá và học viên đánh giá; cặp mã không trùng.
rating|Số|Điểm từ 1 đến 5.
comment|Chuỗi|Nhận xét, tối đa 2.000 ký tự.
hasComment|Đúng hoặc sai|Cho biết có nội dung nhận xét.
visibilityStatus|Chuỗi|VISIBLE hoặc HIDDEN.
moderationNote|Chuỗi|Ghi chú xử lý nếu có.
violationRecorded|Đúng hoặc sai|Đã cộng vi phạm cho đánh giá này hay chưa.
reports|Danh sách|Thông tin người phản ánh, lý do và thời điểm gửi.
'''),
('Report','reports','Báo cáo vi phạm','Lưu yêu cầu xem xét một câu hỏi, câu trả lời hoặc nhận xét khóa học, cùng trạng thái và kết quả giải quyết.', '''
reporterId|Mã tham chiếu|Người gửi phản ánh.
targetType|Chuỗi|QUESTION, ANSWER hoặc REVIEW.
targetId|Mã nội dung|Mã bình luận hoặc đánh giá, được hiểu theo targetType.
targetAuthorId|Mã tham chiếu|Tác giả nội dung bị phản ánh.
courseId|Mã tham chiếu|Khóa học liên quan.
lessonId|Mã bài học hoặc trống|Bài học liên quan nếu phản ánh nội dung hỏi đáp.
reason|Chuỗi|Lý do phản ánh, tối đa 500 ký tự.
status|Chuỗi|PENDING, ESCALATED, RESOLVED hoặc DISMISSED.
escalatedToAdmin|Đúng hoặc sai|Cho biết báo cáo đã chuyển lên quản trị viên.
resolvedBy|Mã tham chiếu|Người xử lý kết thúc báo cáo.
resolvedAt|Thời gian|Thời điểm xử lý kết thúc.
actionTaken|Chuỗi|DISMISS, DELETE_AND_REMIND, ESCALATE hoặc APPLY_PENALTY.
moderationNote|Chuỗi|Ghi chú xử lý.
'''),
('Notification','notifications','Thông báo trong hệ thống','Lưu thông báo liên quan việc nhắc nhở, xử lý vi phạm, khôi phục và kết quả báo cáo. Đây là dữ liệu thông báo trên ứng dụng.', '''
recipientId|Mã tham chiếu|Người nhận thông báo.
type|Chuỗi|MODERATION_REMINDER, MODERATION_WARNING, MODERATION_RESTORED hoặc REPORT_RESULT.
title|Chuỗi|Tiêu đề thông báo.
message|Chuỗi|Nội dung thông báo.
courseId|Mã tham chiếu hoặc trống|Khóa học liên quan.
lessonId|Mã bài học hoặc trống|Bài học liên quan.
isRead|Đúng hoặc sai|Trạng thái đã đọc, mặc định là chưa đọc.
'''),
]
