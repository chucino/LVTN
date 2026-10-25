# THIẾT KẾ CÁC LỚP CỦA HỆ THỐNG
**NextCode – Website đăng ký và học tập trực tuyến các khóa học lập trình**  
*Tài liệu mô tả chi tiết các lớp chính, lớp phụ và quan hệ giữa các lớp*

---

## 1. Giới thiệu
Tài liệu này đề xuất các lớp (class) của hệ thống NextCode dựa trên bản mô tả tổng quát hệ thống. Các lớp được chia thành lớp chính (xương sống của nghiệp vụ học tập, mua khóa học và cấp chứng chỉ), lớp phụ (hỗ trợ và mở rộng), cùng các kiểu liệt kê (enum) và lớp dịch vụ.

### Quy ước trình bày
* **Kiểu dữ liệu** – viết theo phong cách TypeScript/MongoDB (`ObjectId`, `String`, `Date`, `boolean`, `int`, `double`, `List<T>`).
* **Association (liên kết)** – hai lớp tham chiếu lẫn nhau nhưng vòng đời độc lập.
* **Composition (hợp thành)** – lớp con không tồn tại độc lập; xóa lớp cha thì xóa lớp con.
* **Dependency (phụ thuộc)** – một lớp kích hoạt hoặc sử dụng lớp kia trong một luồng nghiệp vụ, không giữ tham chiếu lâu dài.
* **Bội số** – ví dụ $1 - N$ nghĩa là một đối tượng ở phía trái liên kết với nhiều đối tượng ở phía phải; $0..1$ là tùy chọn.

---

## 2. Tổng quan danh sách lớp

| Nhóm | Lớp chính | Lớp phụ |
| :--- | :--- | :--- |
| **Người dùng và xác thực** | `User` | `Otp` |
| **Khóa học và nội dung** | `Course`, `Chapter`, `Lesson`, `QuizQuestion` | `Category`, `FlashcardSet`, `Flashcard`, `PracticeProject`, `CourseFaq` |
| **Đăng ký học và tiến độ** | `Enrollment`, `LessonProgress` | `QuizAttempt` |
| **Đơn hàng và thanh toán** | `Order`, `Coupon`, `Transaction` | `BankAccountConfig`, `PaymentWebhookLog` |
| **Chứng chỉ** | `Certificate` | `CertificateTemplate` |
| **Tương tác** | *(không có)* | `Review`, `Question`, `Answer`, `Notification`, `ActivityLog` |

Tổng cộng có 11 lớp chính, 15 lớp phụ, 10 kiểu liệt kê và nhóm lớp dịch vụ xử lý nghiệp vụ.

---

## 3. Các lớp chính

### 3.1. User (Người dùng)
Đại diện cho mọi tài khoản trong hệ thống (học viên, giảng viên, kế toán, admin). Hệ thống dùng mô hình RBAC, mỗi tài khoản có một vai trò, nên dùng một lớp User thống nhất với thuộc tính `role` thay vì tách thành các lớp con Student, Instructor.

#### Thuộc tính
| Thuộc tính             | Kiểu dữ liệu     | Mô tả                                                                    |
| :--------------------- | :--------------- | :----------------------------------------------------------------------- |
| `id`                   | `ObjectId`       | Mã định danh duy nhất                                                    |
| `fullName`             | `String`         | Họ và tên                                                                |
| `dateOfBirth`          | `Date`           | Ngày sinh                                                                |
| `occupation`           | `String`         | Nghề nghiệp                                                              |
| `email`                | `String`         | Email đăng nhập, duy nhất trong hệ thống                                 |
| `passwordHash`         | `String`         | Mật khẩu đã mã hóa, không lưu mật khẩu gốc                               |
| `role`                 | `Role`           | Vai trò: `STUDENT`, `INSTRUCTOR`, `ACCOUNTANT`, `ADMIN`                  |
| `avatar`               | `String`         | Đường dẫn ảnh đại diện                                                   |
| `status`               | `String`         | Trạng thái tài khoản (hoạt động, bị khóa)                                |
| `interestedCategories` | `List<ObjectId>` | Lĩnh vực muốn học chọn khi đăng ký (có thể rỗng vì bước này được bỏ qua) |
| `createdAt`            | `Date`           | Ngày tạo tài khoản                                                       |

#### Phương thức, hành vi chính
* `register()` – Đăng ký tài khoản sau khi xác thực OTP
* `login()` – Xác thực email, mật khẩu và cấp JWT
* `resetPassword()` – Đặt lại mật khẩu sau khi OTP hợp lệ
* `updateProfile()` – Cập nhật họ tên, ngày sinh, nghề nghiệp, avatar
* `hasPermission(action)` – Kiểm tra quyền theo vai trò (RBAC)

#### Quan hệ với các lớp khác
* Một giảng viên tạo nhiều `Course` ($1 - N$).
* Một học viên có nhiều `Enrollment`, `Order`, `Certificate`, `Review`, `QuizAttempt` ($1 - N$).
* Một `User` nhận nhiều `Notification` và có nhiều `ActivityLog` ($1 - N$).
* Một `User` là tác giả của nhiều `Question` và `Answer` ($1 - N$).
* Kế toán hoặc admin được ghi nhận là người xác nhận của `Transaction` thủ công ($0..1 - N$).

---

### 3.2. Course (Khóa học)
Lớp trung tâm của nghiệp vụ, mô tả một khóa học lập trình. Có hai loại là miễn phí (`FREE`) và có phí (`PRO`), cùng cấu trúc nhưng khác về độ phong phú nội dung. Khóa do giảng viên tạo phải được admin duyệt trước khi hiển thị.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `title` | `String` | Tên khóa học |
| `description` | `String` | Mô tả tổng quan |
| `type` | `CourseType` | `FREE` hoặc `PRO` |
| `level` | `String` | Trình độ phù hợp (người mới, có cơ bản, chuyên nghiệp) |
| `targetAudience` | `String` | Khóa học phù hợp với ai |
| `learningOutcomes` | `List<String>` | Nội dung mục “Bạn học được gì trong khóa học?” |
| `requirements` | `String` | Yêu cầu với học viên (máy tính, internet, hệ điều hành, lưu ý khi học) |
| `price` | `double` | Giá gốc (0 với khóa miễn phí) |
| `discountPrice` | `double` | Giá ưu đãi, nếu có |
| `status` | `CourseStatus` | `DRAFT`, `PENDING`, `APPROVED`, `HIDDEN` |
| `instructorId` | `ObjectId` | Giảng viên tạo khóa (tham chiếu `User`) |
| `categoryId` | `ObjectId` | Lĩnh vực (tham chiếu `Category`) |
| `avgRating` | `double` | Điểm đánh giá trung bình |
| `totalChapters`, `totalLessons`, `totalDuration` | `int` | Số chương, số bài, tổng thời lượng (tính từ nội dung) |

#### Phương thức, hành vi chính
* `submitForApproval()` – Giảng viên gửi khóa chờ duyệt (`DRAFT` $\rightarrow$ `PENDING`)
* `approve()` / `hide()` – Admin duyệt hoặc ẩn khóa
* `isFree()` – Kiểm tra khóa có miễn phí không, quyết định luồng đăng ký hoặc mua
* `recalculateTotals()` – Tính lại số chương, số bài, tổng thời lượng
* `updateAvgRating()` – Cập nhật điểm trung bình khi có đánh giá mới

#### Quan hệ với các lớp khác
* `Course` $N - 1$ `User` (giảng viên) và $N - 1$ `Category`.
* `Course` là tổng thể (composition) của `Chapter`, `FlashcardSet`, `PracticeProject`, `CourseFaq`; xóa khóa thì các phần này bị xóa theo.
* `Course` $1 - N$ `Enrollment`, `Order`, `Certificate`, `Review`.

---

### 3.3. Chapter (Chương)
Một chương trong khóa học, gom nhóm các bài giảng theo lộ trình (ví dụ chương 1 gồm bài 1.1, 1.2...).

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `courseId` | `ObjectId` | Khóa học chứa chương |
| `title` | `String` | Tên chương |
| `order` | `int` | Thứ tự chương trong khóa, quyết định lộ trình học tuần tự |

#### Phương thức, hành vi chính
* `reorder()` – Đổi thứ tự chương

#### Quan hệ với các lớp khác
* `Chapter` $N - 1$ `Course` (composition).
* `Chapter` $1 - N$ `Lesson` (composition).

---

### 3.4. Lesson (Bài giảng)
Đơn vị học nhỏ nhất, gồm một video quay sẵn. Với khóa Pro, mỗi bài có thêm phần ghi chép và tóm tắt. Bài có kiến thức quan trọng có thể kèm câu trắc nghiệm sau video.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `chapterId` | `ObjectId` | Chương chứa bài |
| `title` | `String` | Tên bài (ví dụ “1.1 Giới thiệu về…”) |
| `order` | `int` | Thứ tự bài trong chương |
| `videoUrl` | `String` | Liên kết hoặc mã video (YouTube Unlisted, Vimeo hoặc MP4 khi demo) |
| `duration` | `int` | Thời lượng video (giây) |
| `note` | `String` | Nội dung ghi chép của bài (khóa Pro) |
| `summary` | `String` | Tóm tắt các nội dung trọng tâm (khóa Pro) |
| `hasQuiz` | `boolean` | Bài có câu trắc nghiệm sau video hay không |

#### Phương thức, hành vi chính
* `requiresQuiz()` – Cho biết cần trả lời đúng trắc nghiệm mới được hoàn thành bài
* `getNextLesson()` – Xác định bài kế tiếp (có thể sang chương sau) để mở khóa

#### Quan hệ với các lớp khác
* `Lesson` $N - 1$ `Chapter` (composition).
* `Lesson` $1 - 0..N$ `QuizQuestion` (composition).
* `Lesson` $1 - N$ `LessonProgress` (mỗi học viên có một bản ghi tiến độ riêng cho bài).
* `Lesson` $1 - N$ `Question` (hỏi đáp dưới từng bài giảng).

---

### 3.5. QuizQuestion (Câu hỏi trắc nghiệm)
Câu hỏi trắc nghiệm sau video của bài có kiến thức quan trọng. Khi trả lời đúng, hệ thống hiển thị phần giải thích vì sao đáp án đó đúng.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `lessonId` | `ObjectId` | Bài giảng chứa câu hỏi |
| `content` | `String` | Nội dung câu hỏi |
| `options` | `List<String>` | Các đáp án lựa chọn |
| `correctOption` | `int` | Vị trí đáp án đúng |
| `explanation` | `String` | Giải thích đáp án đúng |

#### Phương thức, hành vi chính
* `checkAnswer(option)` – Trả về đúng hoặc sai kèm phần giải thích

#### Quan hệ với các lớp khác
* `QuizQuestion` $N - 1$ `Lesson` (composition).
* `QuizQuestion` $1 - N$ `QuizAttempt`.

---

### 3.6. Enrollment (Đăng ký học)
Thể hiện việc một học viên được học một khóa học. Với khóa miễn phí, bản ghi được tạo ngay khi bấm “Đăng ký học”. Với khóa Pro, bản ghi chỉ được tạo khi đơn hàng hoàn tất. Mọi kiểm tra quyền xem nội dung đều dựa trên lớp này.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `studentId` | `ObjectId` | Học viên (tham chiếu `User`) |
| `courseId` | `ObjectId` | Khóa học (tham chiếu `Course`) |
| `enrolledAt` | `Date` | Ngày đăng ký |
| `progressPercent` | `double` | Phần trăm hoàn thành khóa |
| `status` | `EnrollmentStatus` | `LEARNING` hoặc `COMPLETED` |
| `completedAt` | `Date` | Ngày hoàn thành |
| `lastLessonId` | `ObjectId` | Bài đang học dở, dùng để học tiếp từ nơi đã dừng |

#### Phương thức, hành vi chính
* `initProgress()` – Tạo tiến độ ban đầu: chỉ mở bài đầu tiên, các bài sau bị khóa
* `updateProgress()` – Tính lại phần trăm hoàn thành
* `unlockNextLesson()` – Mở khóa bài kế tiếp khi hoàn thành bài trước
* `isCompletable()` – Kiểm tra đủ điều kiện hoàn thành khóa (xem hết bài, đạt trắc nghiệm)

#### Quan hệ với các lớp khác
* `Enrollment` $N - 1$ `User` và $N - 1$ `Course` (lớp trung gian của quan hệ nhiều – nhiều giữa học viên và khóa học).
* `Enrollment` $1 - N$ `LessonProgress` (composition).
* `Order` hoàn tất (khóa Pro) kéo theo việc tạo `Enrollment` (dependency).
* `Enrollment` hoàn thành kéo theo việc cấp `Certificate` (dependency).

---

### 3.7. LessonProgress (Tiến độ bài học)
Lưu trạng thái học của một học viên đối với một bài giảng. Đây là lớp hiện thực cơ chế học tuần tự (không thể học vượt) và việc lưu vị trí đang xem.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `enrollmentId` | `ObjectId` | Lượt đăng ký học liên quan |
| `lessonId` | `ObjectId` | Bài giảng |
| `status` | `LessonStatus` | `LOCKED`, `UNLOCKED`, `COMPLETED` |
| `lastPositionSec` | `int` | Vị trí đang xem (giây), để học tiếp từ nơi đã dừng |
| `watchedFully` | `boolean` | Đã xem hết video (đọc từ trạng thái phát của trình phát) |
| `quizPassed` | `boolean` | Đã trả lời đúng trắc nghiệm (nếu bài có trắc nghiệm) |

#### Phương thức, hành vi chính
* `savePosition(sec)` – Lưu vị trí đang xem
* `markWatched()` – Ghi nhận đã xem hết video
* `submitQuiz(option)` – Ghi nhận kết quả trắc nghiệm
* `tryComplete()` – Hoàn thành bài nếu đủ điều kiện, sau đó báo `Enrollment` mở bài kế tiếp

#### Quan hệ với các lớp khác
* `LessonProgress` $N - 1$ `Enrollment` (composition).
* `LessonProgress` $N - 1$ `Lesson`.

---

### 3.8. Order (Đơn hàng)
Đơn mua khóa học Pro. Có vòng đời `PENDING` $\rightarrow$ `COMPLETED` hoặc `CANCELLED`. Đơn quá hạn chờ thanh toán bị tự động hủy bởi tác vụ định kỳ. Các thông tin giá được chép (snapshot) tại thời điểm mua để đơn cũ không thay đổi khi khóa học đổi giá.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `orderCode` | `String` | Mã đơn gồm chữ và số, không dấu, không khoảng trắng (dùng làm nội dung chuyển khoản) |
| `studentId` | `ObjectId` | Học viên mua |
| `courseId` | `ObjectId` | Khóa học được mua |
| `courseTitle` | `String` | Bản sao tên khóa học tại thời điểm mua |
| `originalPrice` | `double` | Giá gốc |
| `discountPrice` | `double` | Giá ưu đãi của khóa (nếu có) |
| `discountAmount` | `double` | Số tiền giảm từ mã giảm giá |
| `totalAmount` | `double` | Tổng tiền phải trả |
| `couponId` | `ObjectId` | Mã giảm giá đã áp dụng (có thể rỗng) |
| `status` | `OrderStatus` | `PENDING`, `COMPLETED`, `CANCELLED` |
| `expiresAt` | `Date` | Hạn chờ thanh toán |
| `createdAt` | `Date` | Ngày tạo đơn |

#### Phương thức, hành vi chính
* `applyCoupon(coupon)` – Áp mã giảm giá và tính lại tổng tiền
* `markCompleted()` – Chuyển sang `COMPLETED` khi nhận đủ tiền, sau đó tạo `Enrollment`
* `cancel()` – Hủy đơn
* `isExpired()` – Kiểm tra quá hạn chờ thanh toán

#### Quan hệ với các lớp khác
* `Order` $N - 1$ `User` (học viên) và $N - 1$ `Course`.
* `Order` $N - 0..1$ `Coupon`.
* `Order` $1 - 0..N$ `Transaction` (thông thường là 1).
* `Order` hoàn tất kéo theo việc tạo `Enrollment` (dependency).

---

### 3.9. Coupon (Mã giảm giá)
Mã giảm giá do kế toán hoặc admin quản lý, áp dụng khi tạo đơn hàng.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `code` | `String` | Mã người dùng nhập, duy nhất |
| `discountType` | `DiscountType` | `PERCENT` (phần trăm) hoặc `AMOUNT` (số tiền cố định) |
| `value` | `double` | Giá trị giảm |
| `validFrom`, `validTo` | `Date` | Khoảng thời gian hiệu lực |
| `quantity` | `int` | Tổng số lượt được dùng |
| `usedCount` | `int` | Số lượt đã dùng |
| `applicableCourses` | `List<ObjectId>` | Khóa được áp dụng (rỗng nghĩa là áp dụng mọi khóa Pro) |
| `isActive` | `boolean` | Mã đang bật hay tắt |

#### Phương thức, hành vi chính
* `isValidFor(course, date)` – Kiểm tra mã dùng được cho khóa tại thời điểm hiện tại, dùng để lọc danh sách “mã có thể áp dụng”
* `calculateDiscount(amount)` – Tính số tiền được giảm
* `increaseUsage()` – Tăng số lượt đã dùng khi đơn được tạo

#### Quan hệ với các lớp khác
* `Coupon` $1 - N$ `Order` ($0..1$ phía Order).

---

### 3.10. Transaction (Giao dịch thanh toán)
Ghi nhận một khoản tiền thực nhận cho một đơn hàng. Là căn cứ cho lịch sử thanh toán của học viên và báo cáo doanh thu của kế toán.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `orderId` | `ObjectId` | Đơn hàng liên quan |
| `bankTransactionId` | `String` | Mã giao dịch từ ngân hàng, duy nhất, dùng để chống xử lý trùng |
| `amount` | `double` | Số tiền nhận |
| `content` | `String` | Nội dung chuyển khoản (chứa mã đơn) |
| `paidAt` | `Date` | Thời điểm nhận tiền |
| `confirmMethod` | `ConfirmMethod` | `MANUAL` (thủ công), `SIMULATED` (giả lập), `WEBHOOK` (tự động) |
| `confirmedBy` | `ObjectId` | Người xác nhận (với xác nhận thủ công) |

#### Phương thức, hành vi chính
* `matchOrder()` – Đối chiếu mã đơn và số tiền với đơn hàng
* `isDuplicate()` – Kiểm tra giao dịch đã được xử lý trước đó chưa

#### Quan hệ với các lớp khác
* `Transaction` $N - 1$ `Order`.
* `Transaction` $N - 0..1$ `User` (người xác nhận thủ công).
* `PaymentWebhookLog` liên quan đến `Transaction` (dependency).

---

### 3.11. Certificate (Chứng chỉ)
Chứng chỉ được cấp tự động khi học viên hoàn thành khóa học. Mỗi chứng chỉ có mã số duy nhất và mã QR để bất kỳ ai cũng có thể tra cứu, xác thực.

#### Thuộc tính
| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `certificateCode` | `String` | Mã số chứng chỉ, duy nhất |
| `studentId` | `ObjectId` | Học viên được cấp |
| `courseId` | `ObjectId` | Khóa học đã hoàn thành |
| `issuedAt` | `Date` | Ngày cấp |
| `qrCode` | `String` | Mã QR dẫn đến trang tra cứu |
| `fileUrl` | `String` | Tệp chứng chỉ (ảnh hoặc PDF) |
| `status` | `CertificateStatus` | `VALID` hoặc `REVOKED` |

#### Phương thức, hành vi chính
* `generateFile()` – Tạo ảnh hoặc PDF từ mẫu chứng chỉ
* `verify()` – Xác thực tính hợp lệ khi tra cứu công khai
* `revoke()` – Thu hồi chứng chỉ

#### Quan hệ với các lớp khác
* `Certificate` $N - 1$ `User` và $N - 1$ `Course` (mỗi cặp học viên – khóa học chỉ có một chứng chỉ).
* `Certificate` $N - 1$ `CertificateTemplate`.
* `Enrollment` hoàn thành kéo theo việc cấp `Certificate` (dependency).

---

## 4. Các lớp phụ

### 4.1. Otp (Mã OTP)
Mã xác thực dùng một lần gửi qua email cho đăng ký và quên mật khẩu. Có thời hạn ngắn, giới hạn số lần nhập sai và cho phép gửi lại mã.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `email` | `String` | Email nhận mã (liên kết lỏng với `User`, vì khi đăng ký tài khoản chưa tồn tại) |
| `codeHash` | `String` | Mã OTP đã băm |
| `purpose` | `OtpPurpose` | `REGISTER` hoặc `RESET_PASSWORD` |
| `expiresAt` | `Date` | Thời điểm hết hạn (ví dụ 5 phút) |
| `failedAttempts` | `int` | Số lần nhập sai, vượt ngưỡng thì khóa mã |
| `isUsed` | `boolean` | Đã dùng hay chưa |

*Quan hệ:* Liên kết với `User` qua email, không dùng khóa ngoại.

---

### 4.2. Category (Lĩnh vực)
Danh sách lĩnh vực học (tiếng Anh, tin học, lập trình...) dùng khi người dùng chọn sở thích và khi lọc khóa học.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `name` | `String` | Tên lĩnh vực |

*Quan hệ:* `Category` $1 - N$ `Course`.

---

### 4.3. FlashcardSet (Bộ Flashcards)
Bộ câu hỏi ôn tập của khóa Pro, gắn với một khóa học.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `courseId` | `ObjectId` | Khóa học sở hữu bộ |

*Quan hệ:* `Course` $1 - 0..1$ `FlashcardSet` (composition); `FlashcardSet` $1 - N$ `Flashcard` (composition).

---

### 4.4. Flashcard (Thẻ ôn tập)
Một câu hỏi trắc nghiệm trong bộ Flashcards để học viên ôn lại kiến thức đã học.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `question` | `String` | Câu hỏi |
| `options` | `List<String>` | Các đáp án |
| `answer` | `String` | Đáp án đúng |

*Quan hệ:* `Flashcard` $N - 1$ `FlashcardSet` (composition).

---

### 4.5. PracticeProject (Dự án thực hành)
Dự án hoặc bài tập thực hành đi kèm khóa Pro có nội dung lớn. Là phần học thêm, không bắt buộc để nhận chứng chỉ.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `courseId` | `ObjectId` | Khóa học chứa dự án |
| `title` | `String` | Tên dự án |
| `guideContent` | `String` | Nội dung hướng dẫn thực hiện |

*Quan hệ:* `Course` $1 - 0..N$ `PracticeProject` (composition).

---

### 4.6. CourseFaq (Câu hỏi thường gặp của khóa)
Nội dung mục “Câu hỏi cần rõ trước khi thanh toán” của khóa Pro, mỗi câu hỏi kèm câu trả lời sơ bộ.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `courseId` | `ObjectId` | Khóa học liên quan |
| `question` | `String` | Câu hỏi |
| `answer` | `String` | Câu trả lời |

*Quan hệ:* `Course` $1 - 0..N$ `CourseFaq` (composition).

---

### 4.7. QuizAttempt (Lượt làm trắc nghiệm)
Lưu từng lần học viên trả lời một câu trắc nghiệm, phục vụ đánh giá điều kiện hoàn thành bài và khóa.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `studentId` | `ObjectId` | Học viên |
| `questionId` | `ObjectId` | Câu hỏi đã trả lời |
| `selectedOption` | `int` | Đáp án đã chọn |
| `isCorrect` | `boolean` | Kết quả đúng hoặc sai |
| `attemptedAt` | `Date` | Thời điểm trả lời |

*Quan hệ:* `QuizAttempt` $N - 1$ `User`; `QuizAttempt` $N - 1$ `QuizQuestion`.

---

### 4.8. BankAccountConfig (Cấu hình tài khoản nhận tiền)
Thông tin tài khoản ngân hàng của trung tâm, dùng để tạo mã QR và hiển thị thông tin chuyển khoản dạng chữ.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `bankName` | `String` | Tên ngân hàng |
| `accountNumber` | `String` | Số tài khoản |
| `accountName` | `String` | Tên tài khoản |

*Quan hệ:* Không có quan hệ trực tiếp, được `PaymentService` và `QrService` sử dụng.

---

### 4.9. PaymentWebhookLog (Nhật ký webhook thanh toán)
Lưu mọi thông báo biến động số dư nhận được từ dịch vụ trung gian, phục vụ đối soát và truy vết (yêu cầu lưu nhật ký giao dịch).

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `rawPayload` | `String` | Nội dung thô nhận được |
| `receivedAt` | `Date` | Thời điểm nhận |
| `processResult` | `String` | Kết quả xử lý (khớp, sai số tiền, không tìm thấy đơn, trùng...) |

*Quan hệ:* Liên quan đến `Transaction` (dependency).

---

### 4.10. CertificateTemplate (Mẫu chứng chỉ)
Mẫu thiết kế dùng để tạo ảnh hoặc PDF chứng chỉ.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `templateFile` | `String` | Tệp mẫu |
| `layout` | `String` | Cấu hình vị trí họ tên, tên khóa, ngày cấp, mã QR |

*Quan hệ:* `CertificateTemplate` $1 - N$ `Certificate`.

---

### 4.11. Review (Đánh giá khóa học)
Chấm sao và bình luận của học viên đã đăng ký khóa. Giảng viên hoặc admin có thể phản hồi, hoặc ẩn đánh giá vi phạm.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `courseId` | `ObjectId` | Khóa học được đánh giá |
| `studentId` | `ObjectId` | Học viên đánh giá |
| `rating` | `int` | Số sao |
| `comment` | `String` | Bình luận |
| `isHidden` | `boolean` | Đánh giá bị ẩn do vi phạm |
| `replyContent` | `String` | Nội dung phản hồi |
| `repliedBy` | `ObjectId` | Người phản hồi |

*Quan hệ:* `Review` $N - 1$ `Course`; `Review` $N - 1$ `User`.

---

### 4.12. Question (Câu hỏi hỏi đáp)
Câu hỏi học viên đặt dưới từng bài giảng, đồng thời là kênh hỗ trợ trong quá trình học.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `lessonId` | `ObjectId` | Bài giảng chứa câu hỏi |
| `authorId` | `ObjectId` | Người hỏi |
| `content` | `String` | Nội dung |
| `createdAt` | `Date` | Thời điểm đăng |

*Quan hệ:* `Question` $N - 1$ `Lesson`; `Question` $N - 1$ `User`; `Question` $1 - N$ `Answer` (composition).

---

### 4.13. Answer (Câu trả lời hỏi đáp)
Câu trả lời của giảng viên hoặc học viên khác cho một câu hỏi.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `questionId` | `ObjectId` | Câu hỏi được trả lời |
| `authorId` | `ObjectId` | Người trả lời |
| `content` | `String` | Nội dung |
| `createdAt` | `Date` | Thời điểm đăng |

*Quan hệ:* `Answer` $N - 1$ `Question` (composition); `Answer` $N - 1$ `User`.

---

### 4.14. Notification (Thông báo)
Thông báo hệ thống, xác nhận thanh toán, cấp chứng chỉ, hiển thị ở biểu tượng chuông.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `userId` | `ObjectId` | Người nhận |
| `type` | `String` | Loại thông báo |
| `title` | `String` | Tiêu đề |
| `content` | `String` | Nội dung |
| `isRead` | `boolean` | Đã đọc hay chưa |
| `createdAt` | `Date` | Thời điểm tạo |

*Quan hệ:* `Notification` $N - 1$ `User`.

---

### 4.15. ActivityLog (Nhật ký hoạt động học)
Ghi thời gian học theo ngày để vẽ biểu đồ hoạt động 12 tháng ở trang cá nhân.

| Thuộc tính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `ObjectId` | Mã định danh |
| `userId` | `ObjectId` | Học viên |
| `date` | `Date` | Ngày |
| `minutesLearned` | `int` | Số phút học trong ngày |

*Quan hệ:* `ActivityLog` $N - 1$ `User`.

---

## 5. Các kiểu liệt kê (Enum)

| Enum | Giá trị | Ý nghĩa |
| :--- | :--- | :--- |
| `Role` | `STUDENT`, `INSTRUCTOR`, `ACCOUNTANT`, `ADMIN` | Vai trò người dùng (RBAC). `ACCOUNTANT` là vai trò tùy chọn, có thể gộp vào `ADMIN` |
| `CourseType` | `FREE`, `PRO` | Loại khóa học |
| `CourseStatus` | `DRAFT`, `PENDING`, `APPROVED`, `HIDDEN` | Vòng đời khóa học: nháp, chờ duyệt, đã duyệt, bị ẩn |
| `EnrollmentStatus` | `LEARNING`, `COMPLETED` | Trạng thái đăng ký học |
| `LessonStatus` | `LOCKED`, `UNLOCKED`, `COMPLETED` | Trạng thái bài học đối với một học viên |
| `OrderStatus` | `PENDING`, `COMPLETED`, `CANCELLED` | Chờ thanh toán, Hoàn tất, Đã hủy |
| `ConfirmMethod` | `MANUAL`, `SIMULATED`, `WEBHOOK` | Ba mức xác nhận thanh toán: thủ công, giả lập, tự động |
| `DiscountType` | `PERCENT`, `AMOUNT` | Giảm theo phần trăm hoặc theo số tiền |
| `OtpPurpose` | `REGISTER`, `RESET_PASSWORD` | Mục đích của mã OTP |
| `CertificateStatus` | `VALID`, `REVOKED` | Chứng chỉ còn hiệu lực hoặc đã thu hồi |

---

## 6. Quan hệ giữa các lớp
Bảng dưới liệt kê toàn bộ quan hệ giữa các lớp thực thể. Quan hệ tới kiểu liệt kê (ví dụ `User` dùng `Role`, `Order` dùng `OrderStatus`) là quan hệ sử dụng thông thường nên không liệt kê lại.

| Lớp nguồn             | Loại quan hệ | Lớp đích          | Bội số     | Ý nghĩa                                                  |
| :-------------------- | :----------- | :---------------- | :--------- | :------------------------------------------------------- |
| `User`                | Association  | `Course`          | $1 - N$    | Giảng viên tạo và sở hữu khóa học                        |
| `Category`            | Association  | `Course`          | $1 - N$    | Mỗi khóa thuộc một lĩnh vực                              |
| `Course`              | Composition  | `Chapter`         | $1 - N$    | Khóa gồm nhiều chương; xóa khóa thì xóa chương           |
| `Chapter`             | Composition  | `Lesson`          | $1 - N$    | Chương gồm nhiều bài giảng                               |
| `Lesson`              | Composition  | `QuizQuestion`    | $1 - 0..N$ | Bài có thể có hoặc không có trắc nghiệm                  |
| `Course`              | Composition  | `FlashcardSet`    | $1 - 0..1$ | Chỉ khóa Pro có bộ Flashcards                            |
| `FlashcardSet`        | Composition  | `Flashcard`       | $1 - N$    | Bộ gồm nhiều thẻ                                         |
| `Course`              | Composition  | `PracticeProject` | $1 - 0..N$ | Chỉ khóa Pro có nội dung lớn                             |
| `Course`              | Composition  | `CourseFaq`       | $1 - 0..N$ | Câu hỏi cần rõ trước khi thanh toán                      |
| `User`                | Association  | `Enrollment`      | $1 - N$    | Học viên có nhiều lượt đăng ký học                       |
| `Course`              | Association  | `Enrollment`      | $1 - N$    | Khóa có nhiều học viên đăng ký                           |
| `Enrollment`          | Composition  | `LessonProgress`  | $1 - N$    | Mỗi lượt đăng ký có tiến độ cho từng bài                 |
| `LessonProgress`      | Association  | `Lesson`          | $N - 1$    | Tiến độ gắn với một bài giảng cụ thể                     |
| `User`                | Association  | `QuizAttempt`     | $1 - N$    | Học viên có nhiều lượt trả lời                           |
| `QuizAttempt`         | Association  | `QuizQuestion`    | $N - 1$    | Lượt trả lời thuộc một câu hỏi                           |
| `User`                | Association  | `Order`           | $1 - N$    | Học viên có nhiều đơn hàng                               |
| `Course`              | Association  | `Order`           | $1 - N$    | Khóa Pro có nhiều đơn mua                                |
| `Order`               | Association  | `Coupon`          | $N - 0..1$ | Đơn có thể áp dụng một mã giảm giá                       |
| `Order`               | Association  | `Transaction`     | $1 - 0..N$ | Đơn có giao dịch thanh toán (thường là một)              |
| `Transaction`         | Association  | `User`            | $N - 0..1$ | Người xác nhận thủ công (kế toán, admin)                 |
| `PaymentWebhookLog`   | Dependency   | `Transaction`     | –          | Thông báo webhook được đối soát và tạo ra giao dịch      |
| `Order`               | Dependency   | `Enrollment`      | –          | Đơn hoàn tất thì tạo `Enrollment`, mở quyền học khóa Pro |
| `Enrollment`          | Dependency   | `Certificate`     | –          | Hoàn thành khóa thì cấp chứng chỉ                        |
| `User`                | Association  | `Certificate`     | $1 - N$    | Học viên nhận nhiều chứng chỉ                            |
| `Course`              | Association  | `Certificate`     | $1 - N$    | Mỗi khóa cấp nhiều chứng chỉ cho nhiều học viên          |
| `CertificateTemplate` | Association  | `Certificate`     | $1 - N$    | Chứng chỉ được tạo từ một mẫu                            |
| `User`                | Association  | `Review`          | $1 - N$    | Học viên viết nhiều đánh giá                             |
| `Course`              | Association  | `Review`          | $1 - N$    | Khóa có nhiều đánh giá                                   |
| `Lesson`              | Association  | `Question`        | $1 - N$    | Hỏi đáp dưới từng bài giảng                              |
| `User`                | Association  | `Question`        | $1 - N$    | Người dùng đặt nhiều câu hỏi                             |
| `Question`            | Composition  | `Answer`          | $1 - N$    | Câu hỏi có nhiều câu trả lời                             |
| `User`                | Association  | `Answer`          | $1 - N$    | Người dùng viết nhiều câu trả lời                        |
| `User`                | Association  | `Notification`    | $1 - N$    | Người dùng nhận nhiều thông báo                          |
| `User`                | Association  | `ActivityLog`     | $1 - N$    | Nhật ký học theo ngày của học viên                       |
| `Otp`                 | Dependency   | `User`            | –          | Liên kết lỏng qua email, không dùng khóa ngoại           |

### 6.1. Các luồng quan hệ quan trọng
* **Học khóa miễn phí** – `User` $\rightarrow$ `Enrollment` (tạo ngay khi bấm Đăng ký học) $\rightarrow$ `LessonProgress` (mở bài đầu) $\rightarrow$ học tuần tự $\rightarrow$ `Enrollment` `COMPLETED` $\rightarrow$ `Certificate`.
* **Học khóa Pro** – `User` $\rightarrow$ `Order` (áp `Coupon`) $\rightarrow$ `Transaction` (xác nhận thanh toán) $\rightarrow$ `Order` `COMPLETED` $\rightarrow$ `Enrollment` $\rightarrow$ `LessonProgress` $\rightarrow$ học tuần tự $\rightarrow$ `Certificate`.
* **Quan hệ nhiều – nhiều** – `User` (học viên) và `Course` được nối qua `Enrollment`; `User` và `Course` cũng được nối qua `Order`, `Review` và `Certificate`, mỗi lớp mang thông tin riêng của mối quan hệ.

---

## 7. Các lớp dịch vụ (Service)
Các lớp dịch vụ không lưu dữ liệu mà xử lý nghiệp vụ, tương ứng cách tách module của NestJS (`auth`, `courses`, `orders`, `payments`, `certificates`...).

| Lớp dịch vụ | Trách nhiệm | Làm việc với |
| :--- | :--- | :--- |
| `AuthService` | Đăng ký, đăng nhập, cấp và kiểm tra JWT, đặt lại mật khẩu | `User`, `Otp` |
| `OtpService`, `MailService` | Sinh, kiểm tra, giới hạn thử OTP; gửi email qua Nodemailer | `Otp`, `User` |
| `CourseService` | CRUD khóa học, chương, bài, trắc nghiệm; duyệt, ẩn khóa; tìm kiếm và lọc | `Course`, `Chapter`, `Lesson`, `Category` |
| `LearningService` | Đăng ký học, mở khóa bài tuần tự, lưu tiến độ, kiểm tra điều kiện hoàn thành | `Enrollment`, `LessonProgress`, `QuizQuestion` |
| `OrderService`, `CouponService` | Tạo đơn, áp mã giảm giá, tính tổng tiền, quản lý mã | `Order`, `Coupon` |
| `PaymentService`, `QrService` | Tạo mã QR VNPay Sandbox, xử lý xác nhận thủ công, giả lập, webhook; đối chiếu mã đơn và số tiền; chống trùng giao dịch | `Order`, `Transaction`, `PaymentWebhookLog`, `BankAccountConfig` |
| `CertificateService` | Cấp chứng chỉ, tạo ảnh hoặc PDF, tra cứu công khai | `Certificate`, `CertificateTemplate`, `Enrollment` |
| `ReviewService`, `QaService` | Đánh giá khóa học, hỏi đáp dưới bài giảng | `Review`, `Question`, `Answer` |
| `NotificationService` | Tạo và gửi thông báo cho người dùng | `Notification` |
| `OrderSchedulerService` | Tác vụ định kỳ (`@nestjs/schedule`) tự hủy đơn quá hạn | `Order` |
| `StatisticsService`, `ReportExporter` | Thống kê doanh thu, học viên mới, khóa bán chạy, tỷ lệ hoàn thành; xuất Excel, PDF | `Order`, `Transaction`, `Enrollment`, `Course` |

---

## 8. Ràng buộc và lưu ý thiết kế
1. Chỉ người có `Enrollment` hợp lệ mới xem được nội dung bài giảng; với khóa Pro, `Enrollment` chỉ được tạo sau khi `Order` chuyển sang `COMPLETED`. Việc kiểm tra thực hiện ở phía server.
2. Cặp `(studentId, courseId)` trong `Enrollment` là duy nhất; một học viên không đăng ký học cùng một khóa hai lần.
3. Khi tạo `Enrollment`, hệ thống tạo sẵn `LessonProgress`: chỉ bài đầu tiên ở trạng thái `UNLOCKED`, các bài còn lại `LOCKED`. Bài kế tiếp chỉ mở khi bài trước `COMPLETED`.
4. Bài `COMPLETED` khi học viên xem hết video, hoặc (với bài có trắc nghiệm) trả lời đúng câu trắc nghiệm sau video.
5. `Certificate` chỉ được cấp khi `Enrollment` đủ điều kiện hoàn thành; cặp `(studentId, courseId)` và `certificateCode` đều duy nhất.
6. `bankTransactionId` của `Transaction` là duy nhất để xử lý trường hợp nhận cùng một giao dịch nhiều lần.
7. Đơn hợp lệ khi mã đơn và số tiền trên giao dịch khớp với `Order`; `Order` quá hạn `expiresAt` được tác vụ định kỳ chuyển sang `CANCELLED`.
8. `Order` lưu bản sao thông tin giá và tên khóa tại thời điểm mua.
9. Khóa do giảng viên tạo ở trạng thái `PENDING` cần admin duyệt (`APPROVED`) mới hiển thị với học viên.
10. Với MongoDB, `Chapter` và `Lesson` có thể nhúng trong `Course`; các lớp có số lượng lớn như `LessonProgress`, `Transaction`, `Notification`, `ActivityLog` nên tách collection riêng.