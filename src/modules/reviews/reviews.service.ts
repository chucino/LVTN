import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { EnrollmentStatus } from '../../common/constants/learning.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Course } from '../courses/schemas/course.schema.js';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema.js';
import { CommentVisibilityStatus } from '../questions/schemas/lesson-comment.schema.js';
import {
  Report,
  ReportDocument,
  ReportStatus,
  ReportTargetType,
} from '../questions/schemas/report.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import {
  CourseReviewItemDto,
  CourseReviewsListResponseDto,
  CourseReviewSummaryDto,
  ListCourseReviewsQueryDto,
  MyCourseReviewStateDto,
  ReportCourseReviewDto,
  UpsertCourseReviewDto,
} from './dto/course-review.dto.js';
import {
  CourseReview,
  CourseReviewDocument,
} from './schemas/course-review.schema.js';

const ACTIVE_REPORT_STATUSES = [ReportStatus.PENDING, ReportStatus.ESCALATED];

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(CourseReview.name)
    private readonly reviewModel: Model<CourseReviewDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {}

  async listCourseReviews(
    courseId: string,
    query: ListCourseReviewsQueryDto,
  ): Promise<CourseReviewsListResponseDto> {
    if (!isValidObjectId(courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const course = await this.courseModel
      .findById(courseObjectId)
      .select('_id')
      .lean()
      .exec();
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const allVisibleReviews = await this.reviewModel
      .find({
        courseId: courseObjectId,
        visibilityStatus: CommentVisibilityStatus.VISIBLE,
      })
      .sort({ hasComment: -1, createdAt: -1 })
      .exec();

    const summary = this.computeSummaryFromVisibleReviews(allVisibleReviews);

    const filteredReviews = query.rating
      ? allVisibleReviews.filter((r) => r.rating === query.rating)
      : allVisibleReviews;

    // Đảm bảo luôn ưu tiên đánh giá có chữ nhận xét lên đầu (mới nhất), sau đó mới tới đánh giá chỉ chấm sao
    const sortedReviews = [...filteredReviews].sort((a, b) => {
      const aHas = Boolean(a.comment && a.comment.trim().length > 0);
      const bHas = Boolean(b.comment && b.comment.trim().length > 0);
      if (aHas !== bHas) {
        return aHas ? -1 : 1;
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const studentIds = Array.from(
      new Set(sortedReviews.map((r) => r.studentId.toString())),
    ).map((id) => new Types.ObjectId(id));

    const students =
      studentIds.length > 0
        ? await this.userModel
            .find({ _id: { $in: studentIds } })
            .select('_id fullName avatar')
            .exec()
        : [];

    const studentMap = new Map<
      string,
      { id: string; fullName: string; avatar: string | null }
    >();
    for (const s of students) {
      studentMap.set(s._id.toString(), {
        id: s._id.toString(),
        fullName: s.fullName,
        avatar: s.avatar ?? null,
      });
    }

    const items: CourseReviewItemDto[] = sortedReviews.map((r) => {
      const sId = r.studentId.toString();
      const createdIso = r.createdAt
        ? r.createdAt.toISOString()
        : new Date().toISOString();
      const updatedIso = r.updatedAt ? r.updatedAt.toISOString() : createdIso;
      const cleanComment = (r.comment ?? '').trim();

      return {
        id: r._id.toString(),
        courseId: r.courseId.toString(),
        author: studentMap.get(sId) ?? {
          id: sId,
          fullName: 'Học viên NextCode',
          avatar: null,
        },
        rating: r.rating,
        comment: cleanComment,
        hasComment: cleanComment.length > 0,
        createdAt: createdIso,
        updatedAt: updatedIso,
        isEdited:
          Boolean(r.createdAt && r.updatedAt) &&
          Math.abs(r.updatedAt.getTime() - r.createdAt.getTime()) > 2000,
      };
    });

    return {
      summary,
      items,
    };
  }

  async getMyCourseReviewState(
    user: CurrentUserData,
    courseId: string,
  ): Promise<MyCourseReviewStateDto> {
    if (!isValidObjectId(courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const userObjectId = new Types.ObjectId(user.userId);

    const [enrollment, existingReview, userDoc, allReviewsOfCourse] =
      await Promise.all([
        this.enrollmentModel
          .findOne({
            courseId: courseObjectId,
            studentId: userObjectId,
          })
          .exec(),
        this.reviewModel
          .findOne({
            courseId: courseObjectId,
            studentId: userObjectId,
          })
          .exec(),
        this.userModel
          .findById(userObjectId)
          .select('_id commentBannedUntil')
          .exec(),
        this.reviewModel
          .find({ courseId: courseObjectId })
          .select('_id reports')
          .exec(),
      ]);

    const isCourseCompleted =
      Boolean(enrollment) &&
      (enrollment!.status === EnrollmentStatus.COMPLETED ||
        enrollment!.progressPercent >= 100 ||
        enrollment!.completedAt !== null);

    // Học viên được phép đánh giá/chỉnh sửa nếu đã hoàn thành 100% HOẶC đã có đánh giá từ trước (kể cả khi khóa học thêm bài mới)
    const canReview =
      user.role === Role.STUDENT &&
      (isCourseCompleted || Boolean(existingReview));

    const bannedUntil = userDoc?.commentBannedUntil ?? null;
    const isCommentBanned = Boolean(
      bannedUntil && bannedUntil.getTime() > Date.now(),
    );

    const reportedReviewIds: string[] = [];
    for (const rev of allReviewsOfCourse) {
      if (rev.reports?.some((rep) => rep.userId.toString() === user.userId)) {
        reportedReviewIds.push(rev._id.toString());
      }
    }

    const cleanComment = (existingReview?.comment ?? '').trim();

    return {
      canReview,
      isCourseCompleted,
      isCommentBanned,
      commentBannedUntil: isCommentBanned ? bannedUntil!.toISOString() : null,
      myReview: existingReview
        ? {
            id: existingReview._id.toString(),
            rating: existingReview.rating,
            comment: cleanComment,
            hasComment: cleanComment.length > 0,
            visibilityStatus: existingReview.visibilityStatus,
            moderationNote: existingReview.moderationNote ?? null,
            createdAt: existingReview.createdAt
              ? existingReview.createdAt.toISOString()
              : new Date().toISOString(),
            updatedAt: existingReview.updatedAt
              ? existingReview.updatedAt.toISOString()
              : new Date().toISOString(),
          }
        : null,
      reportedReviewIds,
    };
  }

  async upsertMyCourseReview(
    user: CurrentUserData,
    courseId: string,
    dto: UpsertCourseReviewDto,
  ): Promise<{
    message: string;
    myReview: NonNullable<MyCourseReviewStateDto['myReview']>;
    summary: CourseReviewSummaryDto;
  }> {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException(
        'Chỉ tài khoản Học viên đã hoàn thành khóa học mới có thể gửi đánh giá',
      );
    }

    if (!isValidObjectId(courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const studentObjectId = new Types.ObjectId(user.userId);

    const [course, enrollment, existingReview, userDoc] = await Promise.all([
      this.courseModel.findById(courseObjectId).select('_id title').exec(),
      this.enrollmentModel
        .findOne({
          courseId: courseObjectId,
          studentId: studentObjectId,
        })
        .exec(),
      this.reviewModel
        .findOne({
          courseId: courseObjectId,
          studentId: studentObjectId,
        })
        .exec(),
      this.userModel
        .findById(studentObjectId)
        .select('_id commentBannedUntil')
        .exec(),
    ]);

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const isCourseCompleted =
      Boolean(enrollment) &&
      (enrollment!.status === EnrollmentStatus.COMPLETED ||
        enrollment!.progressPercent >= 100 ||
        enrollment!.completedAt !== null);

    // Giữ quyền chỉnh sửa nếu học viên đã từng gửi đánh giá trước khi khóa học cập nhật thêm bài mới
    if (!isCourseCompleted && !existingReview) {
      throw new ForbiddenException(
        'Bạn cần hoàn thành 100% khóa học trước khi gửi đánh giá',
      );
    }

    if (
      existingReview &&
      existingReview.visibilityStatus === CommentVisibilityStatus.HIDDEN
    ) {
      throw new ForbiddenException(
        'Đánh giá của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng và không thể chỉnh sửa',
      );
    }

    const cleanComment = (dto.comment ?? '').trim();
    const hasComment = cleanComment.length > 0;

    // Nếu học viên đang bị cấm bình luận (#035): chặn gửi nhận xét có chữ
    const bannedUntil = userDoc?.commentBannedUntil ?? null;
    if (hasComment && bannedUntil && bannedUntil.getTime() > Date.now()) {
      const formattedUntil = new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(bannedUntil);
      throw new ForbiddenException(
        `Tài khoản của bạn tạm thời bị khóa tính năng bình luận đến ${formattedUntil} do vi phạm tiêu chuẩn cộng đồng`,
      );
    }

    let savedReview: CourseReviewDocument;
    const isUpdating = Boolean(existingReview);

    if (existingReview) {
      existingReview.rating = dto.rating;
      existingReview.comment = cleanComment;
      existingReview.hasComment = hasComment;
      savedReview = await existingReview.save();
    } else {
      savedReview = await this.reviewModel.create({
        courseId: courseObjectId,
        studentId: studentObjectId,
        rating: dto.rating,
        comment: cleanComment,
        hasComment,
        visibilityStatus: CommentVisibilityStatus.VISIBLE,
        moderationNote: null,
        violationRecorded: false,
        reports: [],
      });
    }

    const summary = await this.recalculateCourseRating(courseObjectId);

    return {
      message: isUpdating
        ? 'Đã cập nhật đánh giá khóa học của bạn.'
        : 'Cảm ơn bạn đã gửi đánh giá cho khóa học!',
      myReview: {
        id: savedReview._id.toString(),
        rating: savedReview.rating,
        comment: savedReview.comment,
        hasComment: savedReview.hasComment,
        visibilityStatus: savedReview.visibilityStatus,
        moderationNote: savedReview.moderationNote ?? null,
        createdAt: savedReview.createdAt
          ? savedReview.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: savedReview.updatedAt
          ? savedReview.updatedAt.toISOString()
          : new Date().toISOString(),
      },
      summary,
    };
  }

  async reportCourseReview(
    user: CurrentUserData,
    courseId: string,
    reviewId: string,
    dto: ReportCourseReviewDto,
  ): Promise<{ message: string; isReportedByMe: boolean }> {
    if (!isValidObjectId(courseId) || !isValidObjectId(reviewId)) {
      throw new NotFoundException('Không tìm thấy đánh giá khóa học');
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const [course, review] = await Promise.all([
      this.courseModel
        .findById(courseObjectId)
        .select('_id title instructorId')
        .exec(),
      this.reviewModel
        .findOne({
          _id: new Types.ObjectId(reviewId),
          courseId: courseObjectId,
          visibilityStatus: CommentVisibilityStatus.VISIBLE,
        })
        .exec(),
    ]);

    if (!course || !review) {
      throw new NotFoundException('Không tìm thấy đánh giá khóa học');
    }

    if (review.studentId.toString() === user.userId) {
      throw new BadRequestException(
        'Bạn không thể tự báo cáo đánh giá của chính mình',
      );
    }

    const cleanComment = (review.comment ?? '').trim();
    if (!cleanComment) {
      throw new BadRequestException(
        'Đánh giá chỉ chấm sao không có nội dung văn bản để báo cáo vi phạm',
      );
    }

    const reason = dto.reason.trim();
    const existingReport = review.reports.find(
      (r) => r.userId.toString() === user.userId,
    );

    if (existingReport) {
      existingReport.reason = reason;
      existingReport.createdAt = new Date();
    } else {
      review.reports.push({
        userId: new Types.ObjectId(user.userId),
        reason,
        createdAt: new Date(),
      });
    }

    await review.save();

    await this.reportModel.findOneAndUpdate(
      {
        reporterId: new Types.ObjectId(user.userId),
        targetId: review._id,
        status: { $in: ACTIVE_REPORT_STATUSES },
      },
      {
        $set: { reason },
        $setOnInsert: {
          reporterId: new Types.ObjectId(user.userId),
          targetType: ReportTargetType.REVIEW,
          targetId: review._id,
          targetAuthorId: review.studentId,
          courseId: courseObjectId,
          lessonId: null,
          status: ReportStatus.PENDING,
          escalatedToAdmin: false,
        },
      },
      { upsert: true, new: true },
    );

    return {
      message:
        'Đã ghi nhận báo cáo vi phạm. Cảm ơn bạn đã đóng góp xây dựng cộng đồng học tập!',
      isReportedByMe: true,
    };
  }

  async recalculateCourseRating(
    courseObjectId: Types.ObjectId,
  ): Promise<CourseReviewSummaryDto> {
    const visibleReviews = await this.reviewModel
      .find({
        courseId: courseObjectId,
        visibilityStatus: CommentVisibilityStatus.VISIBLE,
      })
      .select('rating')
      .exec();

    const summary = this.computeSummaryFromVisibleReviews(visibleReviews);

    await this.courseModel
      .findByIdAndUpdate(courseObjectId, {
        $set: { avgRating: summary.avgRating },
      })
      .exec();

    return summary;
  }

  private computeSummaryFromVisibleReviews(
    reviews: Array<Pick<CourseReview, 'rating'>>,
  ): CourseReviewSummaryDto {
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let sum = 0;
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as
        | 1
        | 2
        | 3
        | 4
        | 5;
      distribution[star] += 1;
      sum += star;
    }

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0 ? Math.round((sum / totalReviews) * 10) / 10 : 0;

    return {
      avgRating,
      totalReviews,
      distribution,
    };
  }
}

