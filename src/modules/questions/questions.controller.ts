import {
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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import {
  CreateLessonCommentDto,
  LessonCommentItemDto,
  LessonCommentsResponseDto,
  ManageReportsQueryDto,
  ManageReportsResponseDto,
  NotificationItemDto,
  ReportLessonCommentDto,
  ResolveReportDto,
  ToggleCommentReactionDto,
} from './dto/lesson-comment.dto.js';
import { QuestionsService } from './questions.service.js';
import { ReportStatus } from './schemas/report.schema.js';

@ApiTags('Lesson Questions & Discussions')
@ApiBearerAuth()
@Controller('courses/:courseId/lessons/:lessonId/comments')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy danh sách bình luận (hỏi đáp) và các câu trả lời của bài giảng',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe201' })
  @ApiResponse({ status: 200, type: LessonCommentsResponseDto })
  listLessonComments(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<LessonCommentsResponseDto> {
    return this.questionsService.listLessonComments(user, courseId, lessonId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gửi bình luận mới hoặc phản hồi câu trả lời trong bài giảng',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe201' })
  @ApiResponse({ status: 201, type: LessonCommentItemDto })
  createLessonComment(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonCommentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<LessonCommentItemDto> {
    return this.questionsService.createLessonComment(
      user,
      courseId,
      lessonId,
      dto,
    );
  }

  @Post(':commentId/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Nhấn Thích hoặc bỏ Thích trên bình luận bài giảng',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe201' })
  @ApiParam({ name: 'commentId', example: '6650c1f6f2f4f6e4c8bfe888' })
  @ApiResponse({ status: 200, type: LessonCommentItemDto })
  toggleCommentReaction(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('commentId') commentId: string,
    @Body() dto: ToggleCommentReactionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<LessonCommentItemDto> {
    return this.questionsService.toggleCommentReaction(
      user,
      courseId,
      lessonId,
      commentId,
      dto,
    );
  }

  @Post(':commentId/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Báo cáo bình luận vi phạm (spam, quảng cáo, nội dung sai lệch)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe201' })
  @ApiParam({ name: 'commentId', example: '6650c1f6f2f4f6e4c8bfe888' })
  reportComment(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('commentId') commentId: string,
    @Body() dto: ReportLessonCommentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string; isReportedByMe: boolean; reportsCount: number }> {
    return this.questionsService.reportComment(
      user,
      courseId,
      lessonId,
      commentId,
      dto,
    );
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Xóa bình luận (chỉ cho phép tác giả bình luận, Giảng viên khóa học hoặc Admin)',
  })
  @ApiParam({ name: 'courseId', example: '6650c1f6f2f4f6e4c8bfe125' })
  @ApiParam({ name: 'lessonId', example: '6650c1f6f2f4f6e4c8bfe201' })
  @ApiParam({ name: 'commentId', example: '6650c1f6f2f4f6e4c8bfe888' })
  deleteComment(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ deletedId: string; deletedCount: number }> {
    return this.questionsService.deleteComment(
      user,
      courseId,
      lessonId,
      commentId,
    );
  }
}

@ApiTags('Moderation Reports Queue')
@ApiBearerAuth()
@Controller('manage/reports')
export class ManageReportsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy hàng đợi xử lý báo cáo vi phạm cho Giảng viên (khóa học mình dạy) và Admin (toàn hệ thống)',
  })
  @ApiResponse({ status: 200, type: ManageReportsResponseDto })
  listManageReports(
    @Query() query: ManageReportsQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ManageReportsResponseDto> {
    return this.questionsService.listManageReports(user, query);
  }

  @Patch(':reportId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Xử lý báo cáo vi phạm (Bỏ qua, Ẩn bình luận & nhắc nhở, Ẩn & cảnh cáo, Khôi phục, hoặc Chuyển lên Admin)',
  })
  resolveReport(
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string; status: ReportStatus }> {
    return this.questionsService.resolveReport(user, reportId, dto);
  }
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách thông báo mới nhất của người dùng hiện tại',
  })
  listMyNotifications(
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ unreadCount: number; items: NotificationItemDto[] }> {
    return this.questionsService.listMyNotifications(user);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đánh dấu tất cả thông báo là đã đọc',
  })
  markAllNotificationsRead(
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ updatedCount: number }> {
    return this.questionsService.markAllNotificationsRead(user);
  }
}
