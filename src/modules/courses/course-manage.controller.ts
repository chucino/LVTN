import {
  applyDecorators,
  Body,
  Controller,
  Delete,
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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
  SchemaObject,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  ChapterParamsDto,
  CourseParamsDto,
  CreateChapterDto,
  CreateLessonDto,
  CreateManageCourseDto,
  CreateQuizQuestionDto,
  LessonParamsDto,
  ManageCourseIdParamsDto,
  ManageCourseQueryDto,
  QuizQuestionParamsDto,
  RejectManageCourseDto,
  ReorderChaptersDto,
  ReorderLessonsDto,
  UpdateChapterDto,
  UpdateLessonDto,
  UpdateManageCourseDto,
  UpdateQuizQuestionDto,
} from './dto/manage-course.dto.js';
import {
  ManageCourseDetailDto,
  ManageCourseListDto,
  ManageInstructorOptionDto,
} from './dto/manage-course-response.dto.js';
import { CourseManageService } from './course-manage.service.js';
import type { ManageCourseActor } from './manage-course.serializer.js';

function successEnvelope(
  data: Record<string, unknown>,
  statusCode = HttpStatus.OK,
): SchemaObject {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      statusCode: { type: 'number', example: statusCode },
      data: data as SchemaObject,
      timestamp: { type: 'string', format: 'date-time' },
    },
  };
}

function ManageApiErrors() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' }),
    ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token không hợp lệ' }),
    ApiForbiddenResponse({ description: 'Không đủ quyền hoặc không sở hữu khóa học' }),
    ApiNotFoundResponse({ description: 'Không tìm thấy khóa học hoặc nội dung' }),
    ApiConflictResponse({ description: 'Trạng thái hiện tại không cho phép thao tác' }),
  );
}

function CourseDetailResponse(status = HttpStatus.OK) {
  return ApiResponse({
    status,
    schema: successEnvelope(
      { $ref: getSchemaPath(ManageCourseDetailDto) },
      status,
    ),
  });
}

@ApiTags('Course Management')
@ApiBearerAuth('bearer')
@ApiExtraModels(ManageCourseDetailDto, ManageCourseListDto, ManageInstructorOptionDto)
@UseGuards(RolesGuard)
@Roles(Role.INSTRUCTOR, Role.ADMIN)
@Controller('manage')
export class CourseManageController {
  constructor(private readonly courseManageService: CourseManageService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Danh sách khóa học được phép quản lý' })
  @ApiResponse({
    status: 200,
    schema: successEnvelope({ $ref: getSchemaPath(ManageCourseListDto) }),
  })
  @ManageApiErrors()
  listCourses(
    @Query() query: ManageCourseQueryDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseListDto> {
    return this.courseManageService.listCourses(query, actor);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Tạo khóa học ở trạng thái DRAFT' })
  @CourseDetailResponse(HttpStatus.CREATED)
  @ManageApiErrors()
  createCourse(
    @Body() input: CreateManageCourseDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.createCourse(input, actor);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Chi tiết khóa học để quản lý nội dung' })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của khóa học' })
  @CourseDetailResponse()
  @ManageApiErrors()
  getCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.getCourse(params.id, actor);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin khóa học' })
  @CourseDetailResponse()
  @ManageApiErrors()
  updateCourse(
    @Param() params: ManageCourseIdParamsDto,
    @Body() input: UpdateManageCourseDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.updateCourse(params.id, input, actor);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Xóa khóa học ở trạng thái được phép' })
  @ApiResponse({ status: 200, description: 'Khóa học đã được xóa' })
  @ManageApiErrors()
  deleteCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<{ message: string }> {
    return this.courseManageService.deleteCourse(params.id, actor);
  }

  @Post('courses/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi khóa DRAFT chờ Admin duyệt' })
  @CourseDetailResponse()
  @ManageApiErrors()
  submitCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.submitCourse(params.id, actor);
  }

  @Post('courses/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thu hồi khóa đang PENDING về DRAFT' })
  @CourseDetailResponse()
  @ManageApiErrors()
  withdrawCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.withdrawCourse(params.id, actor);
  }

  @Post('courses/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Duyệt khóa PENDING hoặc hiện lại khóa HIDDEN' })
  @CourseDetailResponse()
  @ManageApiErrors()
  approveCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.approveCourse(params.id, actor);
  }

  @Post('courses/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Từ chối khóa PENDING và lưu lý do' })
  @CourseDetailResponse()
  @ManageApiErrors()
  rejectCourse(
    @Param() params: ManageCourseIdParamsDto,
    @Body() input: RejectManageCourseDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.rejectCourse(params.id, input, actor);
  }

  @Post('courses/:id/hide')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ẩn khóa APPROVED khỏi API công khai' })
  @CourseDetailResponse()
  @ManageApiErrors()
  hideCourse(
    @Param() params: ManageCourseIdParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.hideCourse(params.id, actor);
  }

  @Get('instructors')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách giảng viên ACTIVE để gán khóa học' })
  @ApiResponse({
    status: 200,
    schema: successEnvelope({
      type: 'array',
      items: { $ref: getSchemaPath(ManageInstructorOptionDto) },
    }),
  })
  @ManageApiErrors()
  getInstructors(
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageInstructorOptionDto[]> {
    return this.courseManageService.getActiveInstructors(actor);
  }

  @Post('courses/:courseId/chapters')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm chương vào cuối khóa học' })
  @CourseDetailResponse()
  @ManageApiErrors()
  addChapter(
    @Param() params: CourseParamsDto,
    @Body() input: CreateChapterDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.addChapter(params.courseId, input, actor);
  }

  @Patch('courses/:courseId/chapters/reorder')
  @ApiOperation({ summary: 'Sắp xếp lại toàn bộ chương' })
  @CourseDetailResponse()
  @ManageApiErrors()
  reorderChapters(
    @Param() params: CourseParamsDto,
    @Body() input: ReorderChaptersDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.reorderChapters(params.courseId, input, actor);
  }

  @Patch('courses/:courseId/chapters/:chapterId')
  @ApiOperation({ summary: 'Đổi tên chương' })
  @CourseDetailResponse()
  @ManageApiErrors()
  updateChapter(
    @Param() params: ChapterParamsDto,
    @Body() input: UpdateChapterDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.updateChapter(
      params.courseId,
      params.chapterId,
      input,
      actor,
    );
  }

  @Delete('courses/:courseId/chapters/:chapterId')
  @ApiOperation({ summary: 'Xóa chương và toàn bộ nội dung con' })
  @CourseDetailResponse()
  @ManageApiErrors()
  deleteChapter(
    @Param() params: ChapterParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.deleteChapter(
      params.courseId,
      params.chapterId,
      actor,
    );
  }

  @Post('courses/:courseId/chapters/:chapterId/lessons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm bài giảng vào cuối chương' })
  @CourseDetailResponse()
  @ManageApiErrors()
  addLesson(
    @Param() params: ChapterParamsDto,
    @Body() input: CreateLessonDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.addLesson(
      params.courseId,
      params.chapterId,
      input,
      actor,
    );
  }

  @Patch('courses/:courseId/chapters/:chapterId/lessons/reorder')
  @ApiOperation({ summary: 'Sắp xếp lại toàn bộ bài giảng trong chương' })
  @CourseDetailResponse()
  @ManageApiErrors()
  reorderLessons(
    @Param() params: ChapterParamsDto,
    @Body() input: ReorderLessonsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.reorderLessons(
      params.courseId,
      params.chapterId,
      input,
      actor,
    );
  }

  @Patch('courses/:courseId/chapters/:chapterId/lessons/:lessonId')
  @ApiOperation({ summary: 'Cập nhật bài giảng' })
  @CourseDetailResponse()
  @ManageApiErrors()
  updateLesson(
    @Param() params: LessonParamsDto,
    @Body() input: UpdateLessonDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.updateLesson(
      params.courseId,
      params.chapterId,
      params.lessonId,
      input,
      actor,
    );
  }

  @Delete('courses/:courseId/chapters/:chapterId/lessons/:lessonId')
  @ApiOperation({ summary: 'Xóa bài giảng và câu hỏi trắc nghiệm con' })
  @CourseDetailResponse()
  @ManageApiErrors()
  deleteLesson(
    @Param() params: LessonParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.deleteLesson(
      params.courseId,
      params.chapterId,
      params.lessonId,
      actor,
    );
  }

  @Post(
    'courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz-questions',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm câu trắc nghiệm cho bài giảng' })
  @ApiResponse({
    status: 200,
    description:
      'correctOption là chỉ số đáp án bắt đầu từ 0; trả về ManageCourseDetail mới nhất.',
  })
  @CourseDetailResponse()
  @ManageApiErrors()
  addQuizQuestion(
    @Param() params: LessonParamsDto,
    @Body() input: CreateQuizQuestionDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.addQuizQuestion(
      params.courseId,
      params.chapterId,
      params.lessonId,
      input,
      actor,
    );
  }

  @Patch(
    'courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz-questions/:questionId',
  )
  @ApiOperation({ summary: 'Cập nhật câu trắc nghiệm' })
  @ApiResponse({
    status: 200,
    description:
      'correctOption là chỉ số đáp án bắt đầu từ 0; trả về ManageCourseDetail mới nhất.',
  })
  @CourseDetailResponse()
  @ManageApiErrors()
  updateQuizQuestion(
    @Param() params: QuizQuestionParamsDto,
    @Body() input: UpdateQuizQuestionDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.updateQuizQuestion(
      params.courseId,
      params.chapterId,
      params.lessonId,
      params.questionId,
      input,
      actor,
    );
  }

  @Delete(
    'courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz-questions/:questionId',
  )
  @ApiOperation({ summary: 'Xóa câu trắc nghiệm' })
  @CourseDetailResponse()
  @ManageApiErrors()
  deleteQuizQuestion(
    @Param() params: QuizQuestionParamsDto,
    @CurrentUser() actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.courseManageService.deleteQuizQuestion(
      params.courseId,
      params.chapterId,
      params.lessonId,
      params.questionId,
      actor,
    );
  }
}
