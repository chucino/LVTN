import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  CourseReviewsListResponseDto,
  ListCourseReviewsQueryDto,
  MyCourseReviewStateDto,
  ReportCourseReviewDto,
  UpsertCourseReviewDto,
} from './dto/course-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('Course Reviews (Đánh giá khóa học)')
@Controller('courses/:courseId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Lấy thống kê sao và danh sách đánh giá công khai của khóa học (ưu tiên đánh giá có chữ lên đầu)',
  })
  @ApiParam({ name: 'courseId', description: 'ObjectId của khóa học' })
  @ApiResponse({ status: 200, type: CourseReviewsListResponseDto })
  async listCourseReviews(
    @Param('courseId') courseId: string,
    @Query() query: ListCourseReviewsQueryDto,
  ): Promise<CourseReviewsListResponseDto> {
    return this.reviewsService.listCourseReviews(courseId, query);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Kiểm tra quyền đánh giá khóa học của người dùng hiện tại và lấy đánh giá đã gửi (nếu có)',
  })
  @ApiParam({ name: 'courseId', description: 'ObjectId của khóa học' })
  @ApiResponse({ status: 200, type: MyCourseReviewStateDto })
  async getMyCourseReviewState(
    @CurrentUser() user: CurrentUserData,
    @Param('courseId') courseId: string,
  ): Promise<MyCourseReviewStateDto> {
    return this.reviewsService.getMyCourseReviewState(user, courseId);
  }

  @Put('me')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary:
      'Gửi mới hoặc cập nhật đánh giá 1–5 sao kèm nhận xét của học viên đã hoàn thành 100% khóa học',
  })
  @ApiParam({ name: 'courseId', description: 'ObjectId của khóa học' })
  async upsertMyCourseReview(
    @CurrentUser() user: CurrentUserData,
    @Param('courseId') courseId: string,
    @Body() dto: UpsertCourseReviewDto,
  ) {
    return this.reviewsService.upsertMyCourseReview(user, courseId, dto);
  }

  @Post(':reviewId/report')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Báo cáo nhận xét đánh giá khóa học vi phạm tiêu chuẩn cộng đồng (đẩy vào hàng đợi kiểm duyệt 2 tuyến)',
  })
  @ApiParam({ name: 'courseId', description: 'ObjectId của khóa học' })
  @ApiParam({ name: 'reviewId', description: 'ObjectId của đánh giá' })
  async reportCourseReview(
    @CurrentUser() user: CurrentUserData,
    @Param('courseId') courseId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: ReportCourseReviewDto,
  ) {
    return this.reviewsService.reportCourseReview(
      user,
      courseId,
      reviewId,
      dto,
    );
  }
}

