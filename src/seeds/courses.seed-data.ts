import { CourseStatus, CourseType } from '../common/constants/course.enum.js';
import { CourseLevel } from '../common/constants/course-level.constant.js';

export interface SeedChapter {
  title: string;
  lessons: [string, string, string];
}

export interface SeedCourse {
  title: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  price: number;
  discountPrice: number | null;
  avgRating: number;
  status: CourseStatus;
  categoryName: string;
  instructorEmail: string;
  chapters: SeedChapter[];
}

const webCategory = 'Lập trình Web';
const backendCategory = 'Lập trình Backend';
const databaseCategory = 'Cơ sở dữ liệu';
const languagesCategory = 'Ngôn ngữ lập trình';
const toolsCategory = 'Công cụ và quy trình';
const instructorOne = 'giangvien.an@nextcode.vn';
const instructorTwo = 'giangvien.binh@nextcode.vn';

export const SEED_CATEGORIES = [
  webCategory,
  backendCategory,
  databaseCategory,
  languagesCategory,
  toolsCategory,
];

export const SEED_INSTRUCTORS = [
  { email: instructorOne, fullName: 'Nguyễn Minh An' },
  { email: instructorTwo, fullName: 'Trần Quốc Bình' },
];

export const SEED_COURSES: SeedCourse[] = [
  {
    title: 'HTML và CSS cơ bản',
    description:
      'Bắt đầu xây dựng giao diện web từ cấu trúc HTML đến cách trình bày bằng CSS. Khóa học kết hợp kiến thức nền tảng với các ví dụ nhỏ để người mới có thể thực hành từng bước.',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    targetAudience:
      'Người chưa từng làm website, học sinh sinh viên hoặc người muốn chuyển sang lĩnh vực phát triển giao diện web.',
    learningOutcomes: [
      'Giải thích cấu trúc của một trang web.',
      'Sử dụng các thẻ HTML thông dụng và tạo biểu mẫu cơ bản.',
      'Viết CSS để định dạng màu sắc, khoảng cách và bố cục Flexbox.',
    ],
    requirements:
      'Máy tính có trình duyệt web hiện đại và kết nối internet. Không yêu cầu kiến thức lập trình trước đó.',
    price: 0,
    discountPrice: null,
    avgRating: 4.8,
    status: CourseStatus.APPROVED,
    categoryName: webCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Làm quen web',
        lessons: [
          'Trình duyệt và máy chủ web',
          'Cấu trúc một trang HTML',
          'Tạo tệp HTML đầu tiên',
        ],
      },
      {
        title: 'Thẻ HTML thường dùng',
        lessons: [
          'Tiêu đề và đoạn văn',
          'Liên kết và hình ảnh',
          'Danh sách và biểu mẫu',
        ],
      },
      {
        title: 'CSS cơ bản',
        lessons: [
          'Cách viết quy tắc CSS',
          'Màu sắc và kiểu chữ',
          'Box model và khoảng cách',
        ],
      },
      {
        title: 'Bố cục Flexbox',
        lessons: [
          'Trục chính và trục phụ',
          'Căn chỉnh phần tử',
          'Tạo thanh điều hướng responsive',
        ],
      },
    ],
  },
  {
    title: 'JavaScript cho người mới',
    description:
      'Làm quen JavaScript qua cú pháp cốt lõi, cách tổ chức hàm và mảng, sau đó dùng DOM để cập nhật nội dung trang web. Các bài học ưu tiên ví dụ dễ thử trực tiếp trên trình duyệt.',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    targetAudience:
      'Người đã biết HTML và CSS cơ bản, muốn bổ sung tương tác cho trang web.',
    learningOutcomes: [
      'Khai báo biến và sử dụng kiểu dữ liệu cơ bản.',
      'Viết hàm, xử lý mảng và điều kiện.',
      'Truy vấn DOM và phản hồi sự kiện người dùng.',
    ],
    requirements:
      'Máy tính có trình duyệt web và trình soạn thảo mã nguồn. Nên hoàn thành khóa HTML và CSS cơ bản trước.',
    price: 0,
    discountPrice: null,
    avgRating: 4.7,
    status: CourseStatus.APPROVED,
    categoryName: languagesCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Cú pháp và biến',
        lessons: [
          'Chạy JavaScript trong trình duyệt',
          'Biến let và const',
          'Kiểu dữ liệu và phép toán',
        ],
      },
      {
        title: 'Hàm và mảng',
        lessons: [
          'Khai báo và gọi hàm',
          'Tham số và giá trị trả về',
          'Duyệt và biến đổi mảng',
        ],
      },
      {
        title: 'Làm việc với DOM',
        lessons: [
          'Tìm phần tử trên trang',
          'Thay đổi nội dung và thuộc tính',
          'Bắt sự kiện nhấn nút',
        ],
      },
    ],
  },
  {
    title: 'Git và GitHub nhập môn',
    description:
      'Học cách theo dõi lịch sử thay đổi của mã nguồn bằng Git và phối hợp công việc trên GitHub. Khóa học dẫn dắt từ repository đầu tiên đến nhánh và pull request.',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    targetAudience:
      'Người mới học lập trình cần quản lý bài tập, dự án cá nhân hoặc làm việc nhóm.',
    learningOutcomes: [
      'Tạo repository và lưu các mốc thay đổi bằng commit.',
      'Sử dụng nhánh để phát triển độc lập.',
      'Đẩy mã nguồn lên GitHub và tạo pull request.',
    ],
    requirements:
      'Máy tính có thể cài Git và trình duyệt để sử dụng GitHub. Tài khoản GitHub miễn phí được khuyến nghị.',
    price: 0,
    discountPrice: null,
    avgRating: 4.6,
    status: CourseStatus.APPROVED,
    categoryName: toolsCategory,
    instructorEmail: instructorTwo,
    chapters: [
      {
        title: 'Khái niệm Git',
        lessons: [
          'Vì sao cần quản lý phiên bản',
          'Repository và working tree',
          'Commit và lịch sử thay đổi',
        ],
      },
      {
        title: 'Lệnh cơ bản',
        lessons: [
          'Khởi tạo và sao chép repository',
          'Thêm tệp và tạo commit',
          'Xem trạng thái và hoàn tác an toàn',
        ],
      },
      {
        title: 'Làm việc nhóm với GitHub',
        lessons: [
          'Tạo repository trên GitHub',
          'Đẩy và lấy thay đổi từ remote',
          'Tạo nhánh và pull request',
        ],
      },
    ],
  },
  {
    title: 'SQL cơ bản',
    description:
      'Tìm hiểu dữ liệu quan hệ và thực hành các truy vấn SQL thường dùng. Từ SELECT, điều kiện lọc đến JOIN và nhóm dữ liệu, khóa học giúp xây nền tảng làm việc với cơ sở dữ liệu.',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    targetAudience:
      'Người mới tiếp cận cơ sở dữ liệu, lập trình viên frontend/backend hoặc người phân tích dữ liệu ở mức nhập môn.',
    learningOutcomes: [
      'Mô tả bảng, hàng, cột và khóa trong cơ sở dữ liệu quan hệ.',
      'Viết truy vấn SELECT có điều kiện và sắp xếp.',
      'Kết hợp bảng bằng JOIN và tổng hợp dữ liệu.',
    ],
    requirements:
      'Máy tính có trình duyệt hoặc công cụ SQL cục bộ để thực hành. Không yêu cầu kinh nghiệm với cơ sở dữ liệu.',
    price: 0,
    discountPrice: null,
    avgRating: 4.5,
    status: CourseStatus.APPROVED,
    categoryName: databaseCategory,
    instructorEmail: instructorTwo,
    chapters: [
      {
        title: 'Làm quen CSDL quan hệ',
        lessons: [
          'Bảng và kiểu dữ liệu',
          'Khóa chính và khóa ngoại',
          'Đọc sơ đồ dữ liệu đơn giản',
        ],
      },
      {
        title: 'Truy vấn SELECT',
        lessons: [
          'Chọn cột và đặt bí danh',
          'Lọc dữ liệu bằng WHERE',
          'Sắp xếp và giới hạn kết quả',
        ],
      },
      {
        title: 'JOIN và nhóm dữ liệu',
        lessons: [
          'Kết hợp hai bảng bằng JOIN',
          'Đếm và tính tổng với GROUP BY',
          'Lọc nhóm bằng HAVING',
        ],
      },
    ],
  },
  {
    title: 'Python nhập môn',
    description:
      'Tiếp cận lập trình bằng Python với cú pháp dễ đọc, cấu trúc điều khiển và cách chia chương trình thành hàm, module. Bài tập nhỏ giúp luyện cách phân tích vấn đề.',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    targetAudience:
      'Người chưa có nền tảng lập trình, học sinh sinh viên hoặc người muốn thử sức với Python.',
    learningOutcomes: [
      'Cài đặt và chạy chương trình Python đầu tiên.',
      'Dùng biến, điều kiện và vòng lặp để xử lý dữ liệu.',
      'Tách logic thành hàm và sử dụng module có sẵn.',
    ],
    requirements:
      'Máy tính có thể cài Python 3 và trình soạn thảo mã nguồn. Không yêu cầu kinh nghiệm lập trình.',
    price: 0,
    discountPrice: null,
    avgRating: 4.7,
    status: CourseStatus.APPROVED,
    categoryName: languagesCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Cài đặt và cú pháp',
        lessons: [
          'Cài Python và chạy chương trình',
          'Biến và kiểu dữ liệu cơ bản',
          'Nhập xuất dữ liệu',
        ],
      },
      {
        title: 'Cấu trúc điều khiển',
        lessons: [
          'Rẽ nhánh với if và else',
          'Lặp với for và while',
          'Xử lý danh sách cơ bản',
        ],
      },
      {
        title: 'Hàm và module',
        lessons: [
          'Định nghĩa và gọi hàm',
          'Tham số và giá trị trả về',
          'Import module chuẩn',
        ],
      },
    ],
  },
  {
    title: 'Lập trình Web với Vue 3',
    description:
      'Xây dựng ứng dụng giao diện với Vue 3 Composition API, tổ chức component, định tuyến và quản lý trạng thái bằng Pinia. Cuối khóa, học viên kết nối API và chuẩn bị triển khai ứng dụng.',
    type: CourseType.PRO,
    level: 'Có cơ bản',
    targetAudience:
      'Lập trình viên đã biết HTML, CSS và JavaScript, muốn phát triển ứng dụng web với Vue 3.',
    learningOutcomes: [
      'Tạo ứng dụng Vue 3 bằng Composition API.',
      'Chia giao diện thành component và định tuyến bằng Vue Router.',
      'Quản lý trạng thái với Pinia, gọi API và cấu hình bản build triển khai.',
    ],
    requirements:
      'Đã nắm JavaScript cơ bản, biết dùng terminal và có thể cài Node.js cùng trình soạn thảo mã nguồn.',
    price: 599000,
    discountPrice: 449000,
    avgRating: 4.9,
    status: CourseStatus.APPROVED,
    categoryName: webCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Nền tảng Vue 3',
        lessons: [
          'Khởi tạo dự án Vue',
          'Template và reactive state',
          'Computed và watch',
        ],
      },
      {
        title: 'Component và Router',
        lessons: [
          'Props và emits giữa component',
          'Component dùng chung',
          'Khai báo route và điều hướng',
        ],
      },
      {
        title: 'Pinia và gọi API',
        lessons: [
          'Tạo store Pinia',
          'Tổ chức trạng thái dùng chung',
          'Gọi API và xử lý trạng thái tải',
        ],
      },
      {
        title: 'Triển khai',
        lessons: [
          'Cấu hình biến môi trường',
          'Tạo bản build production',
          'Kiểm tra ứng dụng sau triển khai',
        ],
      },
    ],
  },
  {
    title: 'REST API với NestJS',
    description:
      'Thiết kế backend theo module với NestJS, xây dựng controller và service, bảo vệ API bằng JWT, đồng thời viết kiểm thử và mô tả endpoint bằng Swagger.',
    type: CourseType.PRO,
    level: 'Có cơ bản',
    targetAudience:
      'Lập trình viên đã biết TypeScript/JavaScript và muốn xây dựng dịch vụ REST bằng NestJS.',
    learningOutcomes: [
      'Tổ chức ứng dụng theo module của NestJS.',
      'Xây dựng API có DTO, validation và xác thực JWT.',
      'Viết kiểm thử dịch vụ và tài liệu API bằng Swagger.',
    ],
    requirements:
      'Có kiến thức cơ bản về TypeScript, HTTP và REST API; máy tính cài Node.js và npm.',
    price: 699000,
    discountPrice: null,
    avgRating: 4.8,
    status: CourseStatus.APPROVED,
    categoryName: backendCategory,
    instructorEmail: instructorTwo,
    chapters: [
      {
        title: 'Kiến trúc NestJS',
        lessons: [
          'Khởi tạo ứng dụng NestJS',
          'Module và dependency injection',
          'Cấu hình môi trường',
        ],
      },
      {
        title: 'Module, Controller, Service',
        lessons: [
          'Khai báo route trong controller',
          'Tách nghiệp vụ vào service',
          'Validate request bằng DTO',
        ],
      },
      {
        title: 'Xác thực JWT',
        lessons: [
          'Tạo access token',
          'Bảo vệ route bằng guard',
          'Phân quyền theo vai trò',
        ],
      },
      {
        title: 'Kiểm thử và Swagger',
        lessons: [
          'Mock dependency trong unit test',
          'Kiểm thử xử lý thành công và lỗi',
          'Mô tả API với Swagger',
        ],
      },
    ],
  },
  {
    title: 'Thiết kế CSDL và tối ưu truy vấn',
    description:
      'Rèn luyện cách mô hình hóa dữ liệu quan hệ, chọn chỉ mục phù hợp, hiểu giao dịch và phân tích truy vấn. Nội dung hướng tới việc xây dựng nền dữ liệu tin cậy và dễ mở rộng.',
    type: CourseType.PRO,
    level: 'Chuyên nghiệp',
    targetAudience:
      'Lập trình viên backend hoặc người đã làm việc với SQL, muốn nâng cao kỹ năng thiết kế và tối ưu cơ sở dữ liệu.',
    learningOutcomes: [
      'Chuyển yêu cầu nghiệp vụ thành mô hình dữ liệu rõ ràng.',
      'Đánh giá lựa chọn chỉ mục và ảnh hưởng lên thao tác ghi.',
      'Phân tích kế hoạch thực thi và tối ưu truy vấn phổ biến.',
    ],
    requirements:
      'Đã biết SQL cơ bản, khóa chính/khóa ngoại và có môi trường PostgreSQL hoặc MySQL để thực hành.',
    price: 549000,
    discountPrice: 399000,
    avgRating: 4.8,
    status: CourseStatus.APPROVED,
    categoryName: databaseCategory,
    instructorEmail: instructorTwo,
    chapters: [
      {
        title: 'Mô hình hóa dữ liệu',
        lessons: [
          'Phân tích thực thể và thuộc tính',
          'Chuẩn hóa dữ liệu thực tế',
          'Ràng buộc và quan hệ bảng',
        ],
      },
      {
        title: 'Chỉ mục',
        lessons: [
          'Cách chỉ mục hỗ trợ truy vấn',
          'Chọn cột và thứ tự chỉ mục',
          'Đánh đổi giữa đọc và ghi',
        ],
      },
      {
        title: 'Giao dịch',
        lessons: [
          'ACID và tính toàn vẹn',
          'Mức cô lập giao dịch',
          'Xử lý lỗi và rollback',
        ],
      },
      {
        title: 'Tối ưu truy vấn',
        lessons: [
          'Đọc kế hoạch thực thi',
          'Tối ưu điều kiện lọc và JOIN',
          'Đo lường trước và sau tối ưu',
        ],
      },
    ],
  },
  {
    title: 'Vue nâng cao - bản nháp',
    description:
      'Dữ liệu mẫu ở trạng thái nháp dùng để xác nhận API công khai không trả về khóa chưa được duyệt.',
    type: CourseType.PRO,
    level: 'Có cơ bản',
    targetAudience: 'Học viên đã hoàn thành một khóa nhập môn Vue.',
    learningOutcomes: [
      'Ôn tập component.',
      'Tổ chức ứng dụng.',
      'Chuẩn bị nội dung nâng cao.',
    ],
    requirements: 'Có kiến thức Vue 3 cơ bản và môi trường Node.js.',
    price: 299000,
    discountPrice: null,
    avgRating: 4.4,
    status: CourseStatus.DRAFT,
    categoryName: webCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Ôn tập component',
        lessons: ['Vòng đời component', 'Props nâng cao', 'Tái sử dụng logic'],
      },
      {
        title: 'Tổ chức ứng dụng',
        lessons: ['Cấu trúc thư mục', 'Quản lý lỗi', 'Chuẩn bị bản phát hành'],
      },
      {
        title: 'Bài tập tổng hợp',
        lessons: [
          'Phân tích yêu cầu',
          'Xây dựng giao diện',
          'Tự đánh giá kết quả',
        ],
      },
    ],
  },
  {
    title: 'TypeScript cho ứng dụng lớn',
    description:
      'Dữ liệu mẫu đang chờ duyệt để kiểm thử việc ẩn khóa học chưa được công khai.',
    type: CourseType.PRO,
    level: 'Chuyên nghiệp',
    targetAudience:
      'Lập trình viên TypeScript muốn củng cố cách tổ chức kiểu cho ứng dụng lớn.',
    learningOutcomes: [
      'Tổ chức kiểu miền nghiệp vụ.',
      'Thiết kế API có kiểu rõ ràng.',
      'Giảm lỗi qua kiểm tra tĩnh.',
    ],
    requirements: 'Đã sử dụng TypeScript và có máy tính cài Node.js.',
    price: 399000,
    discountPrice: null,
    avgRating: 4.3,
    status: CourseStatus.PENDING,
    categoryName: languagesCategory,
    instructorEmail: instructorTwo,
    chapters: [
      {
        title: 'Kiểu dữ liệu nâng cao',
        lessons: [
          'Union và intersection',
          'Generic cơ bản',
          'Narrowing an toàn',
        ],
      },
      {
        title: 'Thiết kế theo miền',
        lessons: [
          'Kiểu cho thực thể',
          'Kiểu cho kết quả API',
          'Xử lý lỗi có cấu trúc',
        ],
      },
      {
        title: 'Tích hợp dự án',
        lessons: ['Cấu hình strict', 'Tách module', 'Kiểm tra kiểu trong CI'],
      },
    ],
  },
  {
    title: 'Docker và triển khai cơ bản',
    description:
      'Dữ liệu mẫu đã ẩn để kiểm thử API không trả các khóa không còn hiển thị.',
    type: CourseType.FREE,
    level: 'Có cơ bản',
    targetAudience:
      'Lập trình viên muốn hiểu quy trình đóng gói ứng dụng để chạy nhất quán.',
    learningOutcomes: [
      'Mô tả image và container.',
      'Viết Dockerfile đơn giản.',
      'Khởi chạy ứng dụng cùng cấu hình môi trường.',
    ],
    requirements:
      'Máy tính có thể cài Docker Desktop hoặc Docker Engine và ứng dụng mẫu để thực hành.',
    price: 0,
    discountPrice: null,
    avgRating: 4.2,
    status: CourseStatus.HIDDEN,
    categoryName: toolsCategory,
    instructorEmail: instructorOne,
    chapters: [
      {
        title: 'Khái niệm Docker',
        lessons: [
          'Image và container',
          'Registry và image tag',
          'Chạy container đầu tiên',
        ],
      },
      {
        title: 'Đóng gói ứng dụng',
        lessons: ['Viết Dockerfile', 'Build image', 'Truyền biến môi trường'],
      },
      {
        title: 'Chạy môi trường phát triển',
        lessons: [
          'Map cổng và volume',
          'Kết nối dịch vụ',
          'Dọn dẹp tài nguyên',
        ],
      },
    ],
  },
];
