import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  CourseLearningOverviewDto,
  EnrollmentStatusResponseDto,
  LessonLearningDetailDto,
  LessonProgressUpdateResponseDto,
  MyEnrolledCourseItemDto,
  SubmitQuizResponseDto,
} from './dto/enrollment-response.dto.js';
import {
  ManageCourseStudentsQueryDto,
  ManageCourseStudentsResponseDto,
} from './dto/manage-course-students.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import {
  MyCoursesQueryDto,
  UpdateLessonProgressDto,
} from './dto/update-lesson-progress.dto.js';
import { EnrollmentsService } from './enrollments.service.js';

@ApiTags('Enrollments & Learning')
@ApiBearerAuth()
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId/enroll')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Đăng ký học khóa học FREE (tạo Enrollment và mở khóa bài học đầu tiên)',
  })
  @ApiParam({
    name: 'courseId',
    example: '6650c1f6f2f4f6e4c8bfe125',
    description: 'Mongo ObjectId của khóa học',
  })
  @ApiResponse({ status: 201, type: CourseLearningOverviewDto })
  @ApiResponse({
    status: 403,
    description: 'Chỉ học viên được đăng ký hoặc khóa học thuộc loại PRO',
  })
  @ApiResponse({
    status: 409,
    description: 'Học viên đã đăng ký khóa học này trước đó',
  })
  enrollCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CourseLearningOverviewDto> {
    return this.enrollmentsService.enrollCourse(user.userId, courseId);
  }

  @Get('courses/:courseId/enrollment-status')
  @ApiOperation({
    summary:
      'Kiểm tra trạng thái đăng ký và tiến độ của người dùng hiện tại đối với khóa học',
  })
  @ApiParam({
    name: 'courseId',
    example: '6650c1f6f2f4f6e4c8bfe125',
  })
  @ApiResponse({ status: 200, type: EnrollmentStatusResponseDto })
  getEnrollmentStatus(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<EnrollmentStatusResponseDto> {
    return this.enrollmentsService.getEnrollmentStatus(user.userId, courseId);
  }

  @Get('enrollments/my-courses')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'Lấy danh sách các khóa học đã đăng ký của học viên',
  })
  @ApiResponse({ status: 200, type: [MyEnrolledCourseItemDto] })
  getMyCourses(
    @Query() query: MyCoursesQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<MyEnrolledCourseItemDto[]> {
    return this.enrollmentsService.getMyCourses(user.userId, query);
  }

  @Get('enrollments/courses/:courseId/learning')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Lấy toàn bộ lộ trình chương/bài giảng (Học viên xem theo tiến độ mở khóa tuần tự; Giảng viên/Admin xem ở chế độ Preview mở khóa toàn bộ bài)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiResponse({ status: 200, type: CourseLearningOverviewDto })
  @ApiResponse({ status: 403, description: 'Chưa đăng ký khóa học này hoặc khóa học chưa xuất bản' })
  getCourseLearning(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CourseLearningOverviewDto> {
    return this.enrollmentsService.getCourseLearning(
      user.userId,
      courseId,
      user.role,
    );
  }

  @Get('enrollments/courses/:courseId/lessons/:lessonId')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Xem chi tiết bài giảng đang mở khóa (videoUrl, ghi chép, câu hỏi trắc nghiệm)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe126' })
  @ApiResponse({ status: 200, type: LessonLearningDetailDto })
  @ApiResponse({
    status: 403,
    description: 'Chưa đăng ký khóa học hoặc bài học đang ở trạng thái LOCKED',
  })
  getLessonForLearning(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<LessonLearningDetailDto> {
    return this.enrollmentsService.getLessonForLearning(
      user.userId,
      courseId,
      lessonId,
      user.role,
    );
  }

  @Patch('enrollments/courses/:courseId/lessons/:lessonId/progress')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Lưu vị trí đang xem video và/hoặc đánh dấu đã xem hết video (ở chế độ Preview của Giảng viên/Admin thì không lưu vào DB)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe126' })
  @ApiResponse({ status: 200, type: LessonProgressUpdateResponseDto })
  updateLessonProgress(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<LessonProgressUpdateResponseDto> {
    return this.enrollmentsService.updateLessonProgress(
      user.userId,
      courseId,
      lessonId,
      dto,
      user.role,
    );
  }

  @Post('enrollments/courses/:courseId/lessons/:lessonId/quiz-submit')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Nộp câu trả lời trắc nghiệm (ở chế độ Preview của Giảng viên/Admin thì chấm điểm trực tiếp không lưu vào DB)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe126' })
  @ApiResponse({ status: 200, type: SubmitQuizResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Chưa xem hết video hoặc chưa trả lời đủ số câu hỏi của bài',
  })
  submitLessonQuiz(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubmitQuizResponseDto> {
    return this.enrollmentsService.submitLessonQuiz(
      user.userId,
      courseId,
      lessonId,
      dto,
      user.role,
    );
  }

  @Get('manage/courses/:courseId/students')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Giảng viên hoặc Admin xem danh sách, thống kê và tiến độ học viên của khóa học',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiResponse({ status: 200, type: ManageCourseStudentsResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Giảng viên không có quyền quản lý khóa học của người khác',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy khóa học',
  })
  getCourseStudents(
    @Param('courseId') courseId: string,
    @Query() query: ManageCourseStudentsQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ManageCourseStudentsResponseDto> {
    return this.enrollmentsService.getCourseStudentsForManager(
      courseId,
      user,
      query,
    );
  }
}

