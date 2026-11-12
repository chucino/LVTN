import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseStatus } from '../../common/constants/course.enum.js';
import { LessonStatus } from '../../common/constants/learning.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Course } from '../courses/schemas/course.schema.js';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema.js';
import {
  LessonProgress,
  LessonProgressDocument,
} from '../enrollments/schemas/lesson-progress.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import {
  CommentAuthorDto,
  CommentReactionSummaryItemDto,
  CreateLessonCommentDto,
  LessonCommentItemDto,
  LessonCommentsResponseDto,
  ManageReportsQueryDto,
  ManageReportsResponseDto,
  NotificationItemDto,
  ReportLessonCommentDto,
  ReportQueueItemDto,
  ResolveReportDto,
  ToggleCommentReactionDto,
} from './dto/lesson-comment.dto.js';
import {
  CommentReactionType,
  CommentVisibilityStatus,
  LessonComment,
  LessonCommentDocument,
} from './schemas/lesson-comment.schema.js';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema.js';
import {
  Report,
  ReportActionType,
  ReportDocument,
  ReportStatus,
  ReportTargetType,
} from './schemas/report.schema.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Các trạng thái báo cáo còn nằm trong hàng đợi chờ xử lý */
const ACTIVE_REPORT_STATUSES = [ReportStatus.PENDING, ReportStatus.ESCALATED];

export const HIDDEN_COMMENT_PLACEHOLDER = 'Bình luận này đã bị xóa do vi phạm';

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function formatBanDeadline(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export interface PenaltyDecision {
  level: 1 | 2 | 3 | 4 | 5;
  banMs: number | null;
  lockAccount: boolean;
  officialWarning: boolean;
  summary: string;
}

/**
 * Bảng xử phạt tự động dựa trên tổng số lần vi phạm tích lũy:
 * 1-5: nhắc nhở | 6-10: cấm 24h | 11-15: cấm 7 ngày | 16-19: cấm 30 ngày | >=20 hoặc nghiêm trọng: khóa tài khoản
 */
export function computePenalty(
  violationCount: number,
  severeViolation: boolean,
): PenaltyDecision {
  if (severeViolation || violationCount >= 20) {
    return {
      level: 5,
      banMs: null,
      lockAccount: true,
      officialWarning: true,
      summary: severeViolation
        ? 'Đình chỉ tài khoản do vi phạm đặc biệt nghiêm trọng'
        : `Đình chỉ tài khoản do tích lũy ${violationCount} lần vi phạm`,
    };
  }
  if (violationCount >= 16) {
    return {
      level: 4,
      banMs: 30 * DAY_MS,
      lockAccount: false,
      officialWarning: true,
      summary: 'Cấm bình luận 30 ngày và cảnh cáo chính thức',
    };
  }
  if (violationCount >= 11) {
    return {
      level: 3,
      banMs: 7 * DAY_MS,
      lockAccount: false,
      officialWarning: true,
      summary: 'Cấm bình luận 7 ngày và cảnh cáo chính thức',
    };
  }
  if (violationCount >= 6) {
    return {
      level: 2,
      banMs: 24 * HOUR_MS,
      lockAccount: false,
      officialWarning: false,
      summary: 'Cấm bình luận 24 giờ',
    };
  }
  return {
    level: 1,
    banMs: null,
    lockAccount: false,
    officialWarning: false,
    summary: 'Nhắc nhở vi phạm',
  };
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(LessonComment.name)
    private readonly commentModel: Model<LessonCommentDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Kiểm tra khóa học, bài học tồn tại và người dùng có quyền tham gia hỏi đáp trong bài học.
   * - ADMIN hoặc INSTRUCTOR phụ trách khóa học: được phép truy cập.
   * - STUDENT: phải đã đăng ký khóa học (Enrollment) và bài học đó đã mở khóa (status !== LOCKED).
   */
  private async verifyLessonDiscussionAccess(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
  ): Promise<{ course: Course; isCourseModerator: boolean }> {
    if (!isValidObjectId(courseId) || !isValidObjectId(lessonId)) {
      throw new NotFoundException('Không tìm thấy bài học hoặc khóa học');
    }

    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const lessonExists = (course.chapters ?? []).some((chapter) =>
      (chapter.lessons ?? []).some((l) => l._id.toString() === lessonId),
    );
    if (!lessonExists) {
      throw new NotFoundException('Không tìm thấy bài giảng trong khóa học này');
    }

    const isAdmin = user.role === Role.ADMIN;
    const isCourseInstructor =
      user.role === Role.INSTRUCTOR &&
      course.instructorId?.toString() === user.userId;

    if (isAdmin || isCourseInstructor) {
      return { course, isCourseModerator: true };
    }

    // Giảng viên khác (Giảng viên A xem khóa học của Giảng viên B): được xem và bình luận khi khóa học đã xuất bản (APPROVED)
    if (user.role === Role.INSTRUCTOR) {
      if (course.status !== CourseStatus.APPROVED) {
        throw new ForbiddenException(
          'Bạn chỉ có thể tham gia hỏi đáp ở khóa học của giảng viên khác khi khóa học đã được xuất bản công khai',
        );
      }
      return { course, isCourseModerator: false };
    }

    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập khu vực hỏi đáp của bài học này',
      );
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(user.userId),
        courseId: new Types.ObjectId(courseId),
      })
      .exec();

    if (!enrollment) {
      throw new ForbiddenException(
        'Bạn cần đăng ký khóa học trước khi tham gia hỏi đáp bài giảng',
      );
    }

    const progress = await this.lessonProgressModel
      .findOne({
        enrollmentId: enrollment._id,
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();

    if (!progress || progress.status === LessonStatus.LOCKED) {
      throw new ForbiddenException(
        'Bài học này đang bị khóa. Hãy hoàn thành bài học trước để tham gia hỏi đáp.',
      );
    }

    return { course, isCourseModerator: false };
  }

  private buildReactionSummary(
    reactions: Array<{ userId: Types.ObjectId; type: CommentReactionType }>,
  ): CommentReactionSummaryItemDto[] {
    const counts = new Map<CommentReactionType, number>();
    for (const r of reactions) {
      counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private mapCommentToDto(
    comment: LessonCommentDocument,
    authorMap: Map<string, CommentAuthorDto>,
    currentUserId: string,
    isCourseModerator: boolean,
    replies: LessonCommentItemDto[] = [],
    courseInstructorId?: string,
  ): LessonCommentItemDto {
    const authorIdStr = comment.authorId.toString();
    const baseAuthor: CommentAuthorDto = authorMap.get(authorIdStr) ?? {
      id: authorIdStr,
      fullName: 'Học viên NextCode',
      avatar: null,
      role: Role.STUDENT,
    };
    const isCourseAuthor = Boolean(
      courseInstructorId && authorIdStr === courseInstructorId,
    );
    const author: CommentAuthorDto = {
      ...baseAuthor,
      isCourseAuthor,
    };

    const visibilityStatus =
      comment.visibilityStatus ?? CommentVisibilityStatus.VISIBLE;
    const isHidden = visibilityStatus === CommentVisibilityStatus.HIDDEN;

    const reactions = comment.reactions ?? [];
    const reports = comment.reports ?? [];
    const myReaction =
      reactions.find((r) => r.userId.toString() === currentUserId)?.type ?? null;
    const isReportedByMe = reports.some(
      (r) => r.userId.toString() === currentUserId,
    );

    return {
      id: comment._id.toString(),
      courseId: comment.courseId.toString(),
      lessonId: comment.lessonId.toString(),
      parentId: comment.parentId ? comment.parentId.toString() : null,
      replyToUser: comment.replyToUser
        ? {
            userId: comment.replyToUser.userId.toString(),
            fullName: comment.replyToUser.fullName,
          }
        : null,
      author,
      content: isHidden ? HIDDEN_COMMENT_PLACEHOLDER : comment.content,
      visibilityStatus,
      totalReactions: reactions.length,
      reactionSummary: this.buildReactionSummary(reactions),
      myReaction,
      isReportedByMe,
      reportsCount: reports.length,
      canDelete: isCourseModerator || authorIdStr === currentUserId,
      createdAt: comment.createdAt
        ? comment.createdAt.toISOString()
        : new Date().toISOString(),
      replies,
    };
  }

  async listLessonComments(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
  ): Promise<LessonCommentsResponseDto> {
    const { course, isCourseModerator } =
      await this.verifyLessonDiscussionAccess(user, courseId, lessonId);
    const courseInstructorId = course.instructorId?.toString();

    const allComments = await this.commentModel
      .find({
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .sort({ createdAt: 1 })
      .exec();

    const authorIds = Array.from(
      new Set(allComments.map((c) => c.authorId.toString())),
    ).map((id) => new Types.ObjectId(id));

    const users =
      authorIds.length > 0
        ? await this.userModel
            .find({ _id: { $in: authorIds } })
            .select('_id fullName avatar role')
            .exec()
        : [];

    const authorMap = new Map<string, CommentAuthorDto>();
    for (const u of users) {
      authorMap.set(u._id.toString(), {
        id: u._id.toString(),
        fullName: u.fullName,
        avatar: u.avatar ?? null,
        role: u.role,
      });
    }

    const rootDocs: LessonCommentDocument[] = [];
    const repliesByParent = new Map<string, LessonCommentDocument[]>();

    for (const doc of allComments) {
      if (!doc.parentId) {
        rootDocs.push(doc);
      } else {
        const parentKey = doc.parentId.toString();
        const list = repliesByParent.get(parentKey) ?? [];
        list.push(doc);
        repliesByParent.set(parentKey, list);
      }
    }

    rootDocs.reverse();

    const isHiddenDoc = (doc: LessonCommentDocument): boolean =>
      doc.visibilityStatus === CommentVisibilityStatus.HIDDEN;

    const items: LessonCommentItemDto[] = [];
    for (const rootDoc of rootDocs) {
      // Câu trả lời bị xóa mềm được ẩn hoàn toàn khỏi giao diện bài học
      const childDocs = (repliesByParent.get(rootDoc._id.toString()) ?? []).filter(
        (replyDoc) => !isHiddenDoc(replyDoc),
      );

      // Bình luận gốc bị xóa mềm: ẩn hẳn nếu chưa có phản hồi, còn lại giữ dòng thông báo để không đứt mạch thảo luận
      if (isHiddenDoc(rootDoc) && childDocs.length === 0) {
        continue;
      }

      const childDtos = childDocs.map((replyDoc) =>
        this.mapCommentToDto(
          replyDoc,
          authorMap,
          user.userId,
          isCourseModerator,
          [],
          courseInstructorId,
        ),
      );
      items.push(
        this.mapCommentToDto(
          rootDoc,
          authorMap,
          user.userId,
          isCourseModerator,
          childDtos,
          courseInstructorId,
        ),
      );
    }

    const totalComments =
      items.length +
      items.reduce((sum, item) => sum + item.replies.length, 0);

    const viewer = await this.userModel
      .findById(user.userId)
      .select('_id commentBannedUntil')
      .exec();
    const bannedUntil = viewer?.commentBannedUntil ?? null;
    const myCommentBannedUntil =
      bannedUntil && bannedUntil.getTime() > Date.now()
        ? bannedUntil.toISOString()
        : null;

    return {
      courseId,
      lessonId,
      totalComments,
      totalRootComments: items.length,
      myCommentBannedUntil,
      items,
    };
  }

  async createLessonComment(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
    dto: CreateLessonCommentDto,
  ): Promise<LessonCommentItemDto> {
    const { course, isCourseModerator } =
      await this.verifyLessonDiscussionAccess(user, courseId, lessonId);
    const courseInstructorId = course.instructorId?.toString();

    const authorDoc = await this.userModel
      .findById(user.userId)
      .select('_id fullName avatar role status commentBannedUntil')
      .exec();

    if (authorDoc?.status === UserStatus.LOCKED) {
      throw new ForbiddenException('Tài khoản của bạn đã bị đình chỉ');
    }

    if (
      authorDoc?.commentBannedUntil &&
      authorDoc.commentBannedUntil.getTime() > Date.now()
    ) {
      throw new ForbiddenException(
        `Tài khoản của bạn tạm thời bị khóa tính năng bình luận đến ${formatBanDeadline(authorDoc.commentBannedUntil)} do vi phạm tiêu chuẩn cộng đồng`,
      );
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Nội dung bình luận không được để trống');
    }

    let parentObjectId: Types.ObjectId | null = null;
    let replyToUser: { userId: Types.ObjectId; fullName: string } | null = null;

    if (dto.parentId) {
      const parentComment = await this.commentModel
        .findOne({
          _id: new Types.ObjectId(dto.parentId),
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
        })
        .exec();

      if (!parentComment) {
        throw new NotFoundException(
          'Không tìm thấy bình luận gốc để phản hồi',
        );
      }

      parentObjectId = parentComment.parentId ?? parentComment._id;

      const targetReplyUserId =
        dto.replyToUserId ?? parentComment.authorId.toString();
      if (isValidObjectId(targetReplyUserId)) {
        const targetUser = await this.userModel
          .findById(targetReplyUserId)
          .select('_id fullName')
          .exec();
        if (targetUser) {
          replyToUser = {
            userId: targetUser._id,
            fullName: targetUser.fullName,
          };
        }
      }
    }

    const created = await this.commentModel.create({
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      parentId: parentObjectId,
      replyToUser,
      authorId: new Types.ObjectId(user.userId),
      content,
      visibilityStatus: CommentVisibilityStatus.VISIBLE,
      moderationNote: null,
      violationRecorded: false,
      reactions: [],
      reports: [],
    });

    const authorMap = new Map<string, CommentAuthorDto>();
    if (authorDoc) {
      authorMap.set(authorDoc._id.toString(), {
        id: authorDoc._id.toString(),
        fullName: authorDoc.fullName,
        avatar: authorDoc.avatar ?? null,
        role: authorDoc.role,
      });
    }

    return this.mapCommentToDto(
      created,
      authorMap,
      user.userId,
      isCourseModerator,
      [],
      courseInstructorId,
    );
  }

  async toggleCommentReaction(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
    commentId: string,
    dto: ToggleCommentReactionDto,
  ): Promise<LessonCommentItemDto> {
    const { course, isCourseModerator } =
      await this.verifyLessonDiscussionAccess(user, courseId, lessonId);
    const courseInstructorId = course.instructorId?.toString();

    if (!isValidObjectId(commentId)) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const comment = await this.commentModel
      .findOne({
        _id: new Types.ObjectId(commentId),
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const existingIdx = comment.reactions.findIndex(
      (r) => r.userId.toString() === user.userId,
    );

    if (existingIdx >= 0) {
      const existing = comment.reactions[existingIdx]!;
      if (existing.type === dto.type) {
        comment.reactions.splice(existingIdx, 1);
      } else {
        existing.type = dto.type;
      }
    } else {
      comment.reactions.push({
        userId: new Types.ObjectId(user.userId),
        type: dto.type,
      });
    }

    await comment.save();

    const authorDoc = await this.userModel
      .findById(comment.authorId)
      .select('_id fullName avatar role')
      .exec();

    const authorMap = new Map<string, CommentAuthorDto>();
    if (authorDoc) {
      authorMap.set(authorDoc._id.toString(), {
        id: authorDoc._id.toString(),
        fullName: authorDoc.fullName,
        avatar: authorDoc.avatar ?? null,
        role: authorDoc.role,
      });
    }

    return this.mapCommentToDto(
      comment,
      authorMap,
      user.userId,
      isCourseModerator,
      [],
      courseInstructorId,
    );
  }

  async reportComment(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
    commentId: string,
    dto: ReportLessonCommentDto,
  ): Promise<{ message: string; isReportedByMe: boolean; reportsCount: number }> {
    const { course } = await this.verifyLessonDiscussionAccess(
      user,
      courseId,
      lessonId,
    );

    if (!isValidObjectId(commentId)) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const comment = await this.commentModel
      .findOne({
        _id: new Types.ObjectId(commentId),
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.authorId.toString() === user.userId) {
      throw new BadRequestException(
        'Bạn không thể tự báo cáo bình luận của chính mình',
      );
    }

    const reason = dto.reason.trim();
    const existingReport = comment.reports.find(
      (r) => r.userId.toString() === user.userId,
    );

    if (existingReport) {
      existingReport.reason = reason;
      existingReport.createdAt = new Date();
    } else {
      comment.reports.push({
        userId: new Types.ObjectId(user.userId),
        reason,
        createdAt: new Date(),
      });
    }

    await comment.save();

    // Người bị báo cáo là Giảng viên/Admin: tự động chuyển cấp thẳng lên Admin (tránh xung đột lợi ích)
    const targetAuthorDoc = await this.userModel
      .findById(comment.authorId)
      .select('_id role')
      .exec();

    const isTargetInstructorOrAdmin =
      comment.authorId.toString() === course.instructorId?.toString() ||
      targetAuthorDoc?.role === Role.INSTRUCTOR ||
      targetAuthorDoc?.role === Role.ADMIN;

    const targetType = comment.parentId
      ? ReportTargetType.ANSWER
      : ReportTargetType.QUESTION;

    await this.reportModel.findOneAndUpdate(
      {
        reporterId: new Types.ObjectId(user.userId),
        targetId: comment._id,
        status: { $in: ACTIVE_REPORT_STATUSES },
      },
      {
        $set: { reason },
        $setOnInsert: {
          reporterId: new Types.ObjectId(user.userId),
          targetType,
          targetId: comment._id,
          targetAuthorId: comment.authorId,
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
          status: isTargetInstructorOrAdmin
            ? ReportStatus.ESCALATED
            : ReportStatus.PENDING,
          escalatedToAdmin: isTargetInstructorOrAdmin,
        },
      },
      { upsert: true, new: true },
    );

    return {
      message: isTargetInstructorOrAdmin
        ? 'Báo cáo đã được chuyển thẳng tới Quản trị viên hệ thống (Admin) để xem xét khách quan.'
        : 'Đã ghi nhận báo cáo vi phạm. Cảm ơn bạn đã đóng góp xây dựng cộng đồng học tập!',
      isReportedByMe: true,
      reportsCount: comment.reports.length,
    };
  }

  async deleteComment(
    user: CurrentUserData,
    courseId: string,
    lessonId: string,
    commentId: string,
  ): Promise<{ deletedId: string; deletedCount: number }> {
    const { isCourseModerator } = await this.verifyLessonDiscussionAccess(
      user,
      courseId,
      lessonId,
    );

    if (!isValidObjectId(commentId)) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const comment = await this.commentModel
      .findOne({
        _id: new Types.ObjectId(commentId),
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const isOwner = comment.authorId.toString() === user.userId;
    if (!isOwner && !isCourseModerator) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    const deleteRes = await this.commentModel
      .deleteMany({
        $or: [{ _id: comment._id }, { parentId: comment._id }],
      })
      .exec();

    return {
      deletedId: commentId,
      deletedCount: deleteRes.deletedCount ?? 1,
    };
  }

  /**
   * Hàng đợi xử lý báo cáo vi phạm.
   * - Giảng viên (tuyến 1): báo cáo thuộc khóa học mình dạy, không gồm báo cáo nhắm vào chính mình.
   *   Tab "Đang chờ xử lý" = PENDING.
   * - Admin (tuyến 2): toàn hệ thống. Tab "Đang chờ xử lý" = ESCALATED.
   * Các báo cáo trùng cùng một bình luận được gộp thành một dòng.
   */
  async listManageReports(
    user: CurrentUserData,
    query: ManageReportsQueryDto,
  ): Promise<ManageReportsResponseDto> {
    const isAdmin = user.role === Role.ADMIN;
    const isInstructor = user.role === Role.INSTRUCTOR;

    if (!isAdmin && !isInstructor) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập danh sách báo cáo vi phạm',
      );
    }

    const courseFilter: Record<string, unknown> = {};
    if (isInstructor) {
      courseFilter.instructorId = new Types.ObjectId(user.userId);
    }

    const accessibleCourses = await this.courseModel
      .find(courseFilter)
      .select('_id title chapters instructorId')
      .exec();

    const courseMap = new Map<
      string,
      { title: string; lessonTitleMap: Map<string, string> }
    >();
    for (const c of accessibleCourses) {
      const lessonTitleMap = new Map<string, string>();
      for (const ch of c.chapters ?? []) {
        for (const l of ch.lessons ?? []) {
          lessonTitleMap.set(l._id.toString(), `Bài ${l.order}: ${l.title}`);
        }
      }
      courseMap.set(c._id.toString(), {
        title: c.title,
        lessonTitleMap,
      });
    }

    const accessibleCourseIds = accessibleCourses.map((c) => c._id);

    const baseScopeQuery: Record<string, unknown> = {};
    if (isInstructor) {
      baseScopeQuery.courseId = { $in: accessibleCourseIds };
      baseScopeQuery.targetAuthorId = {
        $ne: new Types.ObjectId(user.userId),
      };
    }

    if (query.courseId && isValidObjectId(query.courseId)) {
      if (
        isInstructor &&
        !accessibleCourseIds.some((id) => id.toString() === query.courseId)
      ) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền xem báo cáo thuộc khóa học mình phụ trách',
        );
      }
      baseScopeQuery.courseId = new Types.ObjectId(query.courseId);
    }

    const allScopedReports = await this.reportModel
      .find(baseScopeQuery)
      .sort({ createdAt: -1 })
      .exec();

    // Trạng thái "Đang chờ xử lý" phụ thuộc vai trò: Giảng viên = PENDING, Admin = ESCALATED
    const pendingStatus = isAdmin ? ReportStatus.ESCALATED : ReportStatus.PENDING;

    const countUnique = (statuses: ReportStatus[]): number =>
      new Set(
        allScopedReports
          .filter((r) => statuses.includes(r.status))
          .map((r) => r.targetId.toString()),
      ).size;

    const summary = {
      total: new Set(allScopedReports.map((r) => r.targetId.toString())).size,
      pending: countUnique([pendingStatus]),
      resolved: countUnique([ReportStatus.RESOLVED]),
      dismissed: countUnique([ReportStatus.DISMISSED]),
    };

    const statusFilter = query.status;
    const filteredReports = allScopedReports.filter((r) => {
      if (!statusFilter || statusFilter === 'ALL') return true;
      if (statusFilter === 'PENDING') return r.status === pendingStatus;
      return r.status === statusFilter;
    });

    // Gộp các báo cáo trùng cùng một bình luận (cùng trạng thái) thành một dòng
    const groupedReports: Array<{
      report: (typeof filteredReports)[number];
      duplicateCount: number;
    }> = [];
    const groupIndex = new Map<string, number>();
    for (const r of filteredReports) {
      const key = `${r.targetId.toString()}:${r.status}`;
      const idx = groupIndex.get(key);
      if (idx === undefined) {
        groupIndex.set(key, groupedReports.length);
        groupedReports.push({ report: r, duplicateCount: 1 });
      } else {
        groupedReports[idx]!.duplicateCount += 1;
      }
    }

    const commentIds = Array.from(
      new Set(groupedReports.map((g) => g.report.targetId.toString())),
    ).map((id) => new Types.ObjectId(id));

    const userIdsSet = new Set<string>();
    for (const { report: r } of groupedReports) {
      userIdsSet.add(r.reporterId.toString());
      userIdsSet.add(r.targetAuthorId.toString());
      if (r.resolvedBy) {
        userIdsSet.add(r.resolvedBy.toString());
      }
    }

    const [comments, users] = await Promise.all([
      commentIds.length > 0
        ? this.commentModel.find({ _id: { $in: commentIds } }).exec()
        : Promise.resolve([]),
      userIdsSet.size > 0
        ? this.userModel
            .find({
              _id: {
                $in: Array.from(userIdsSet).map((id) => new Types.ObjectId(id)),
              },
            })
            .select(
              '_id fullName avatar role status violationCount commentBannedUntil violationHistory',
            )
            .exec()
        : Promise.resolve([]),
    ]);

    const commentMap = new Map<string, LessonCommentDocument>();
    for (const c of comments) {
      commentMap.set(c._id.toString(), c);
    }

    const userMap = new Map<string, CommentAuthorDto>();
    const userDocMap = new Map<string, UserDocument>();
    for (const u of users) {
      userMap.set(u._id.toString(), {
        id: u._id.toString(),
        fullName: u.fullName,
        avatar: u.avatar ?? null,
        role: u.role,
      });
      userDocMap.set(u._id.toString(), u);
    }

    const fallbackUser = (id: string): CommentAuthorDto => ({
      id,
      fullName: 'Người dùng NextCode',
      avatar: null,
      role: Role.STUDENT,
    });

    const items: ReportQueueItemDto[] = groupedReports.map(
      ({ report: r, duplicateCount }) => {
        const courseMeta = courseMap.get(r.courseId.toString());
        const commentDoc = commentMap.get(r.targetId.toString());
        const authorDoc = userDocMap.get(r.targetAuthorId.toString());
        const bannedUntil = authorDoc?.commentBannedUntil ?? null;

        return {
          id: r._id.toString(),
          targetType: r.targetType,
          targetId: r.targetId.toString(),
          courseId: r.courseId.toString(),
          courseTitle: courseMeta?.title ?? 'Khóa học NextCode',
          lessonId: r.lessonId.toString(),
          lessonTitle:
            courseMeta?.lessonTitleMap.get(r.lessonId.toString()) ??
            'Bài giảng trong khóa học',
          reporter:
            userMap.get(r.reporterId.toString()) ??
            fallbackUser(r.reporterId.toString()),
          targetAuthor:
            userMap.get(r.targetAuthorId.toString()) ??
            fallbackUser(r.targetAuthorId.toString()),
          targetAuthorViolationCount: authorDoc?.violationCount ?? 0,
          targetAuthorCommentBannedUntil:
            bannedUntil && bannedUntil.getTime() > Date.now()
              ? bannedUntil.toISOString()
              : null,
          targetAuthorStatus: authorDoc?.status ?? UserStatus.ACTIVE,
          duplicateReportCount: duplicateCount,
          targetAuthorViolationHistory: isAdmin
            ? (authorDoc?.violationHistory ?? [])
                .slice(-5)
                .reverse()
                .map((h) => ({
                  reason: h.reason,
                  actionTaken: h.actionTaken,
                  penaltySummary: h.penaltySummary,
                  resolvedAt: h.resolvedAt
                    ? new Date(h.resolvedAt).toISOString()
                    : new Date().toISOString(),
                }))
            : [],
          commentContent:
            commentDoc?.content ?? '[Bình luận đã bị tác giả xóa]',
          commentVisibilityStatus:
            commentDoc?.visibilityStatus ?? CommentVisibilityStatus.VISIBLE,
          reason: r.reason,
          status: r.status,
          escalatedToAdmin: r.status === ReportStatus.ESCALATED,
          actionTaken: r.actionTaken,
          moderationNote: r.moderationNote,
          resolvedBy: r.resolvedBy
            ? (userMap.get(r.resolvedBy.toString()) ??
              fallbackUser(r.resolvedBy.toString()))
            : null,
          resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
          createdAt: r.createdAt
            ? r.createdAt.toISOString()
            : new Date().toISOString(),
        };
      },
    );

    return {
      items,
      summary,
      courses: accessibleCourses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
      })),
    };
  }

  /**
   * Xử lý một báo cáo vi phạm và đồng bộ trạng thái cho mọi báo cáo
   * PENDING/ESCALATED khác cùng trỏ vào cùng một bình luận (targetId).
   */
  async resolveReport(
    user: CurrentUserData,
    reportId: string,
    dto: ResolveReportDto,
  ): Promise<{ message: string; status: ReportStatus }> {
    if (!isValidObjectId(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo vi phạm');
    }

    const report = await this.reportModel.findById(reportId).exec();
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo vi phạm');
    }

    if (!ACTIVE_REPORT_STATUSES.includes(report.status)) {
      throw new BadRequestException('Báo cáo này đã được xử lý trước đó');
    }

    const course = await this.courseModel.findById(report.courseId).exec();
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học liên quan');
    }

    const isAdmin = user.role === Role.ADMIN;
    const isCourseInstructor =
      user.role === Role.INSTRUCTOR &&
      course.instructorId?.toString() === user.userId;

    if (!isAdmin && !isCourseInstructor) {
      throw new ForbiddenException('Bạn không có quyền xử lý báo cáo này');
    }

    if (isAdmin) {
      if (dto.action === ReportActionType.ESCALATE) {
        throw new BadRequestException(
          'Admin là tuyến xử lý cuối cùng, không thể chuyển cấp báo cáo',
        );
      }
    } else {
      // Tuyến 1: Giảng viên chỉ xử lý báo cáo PENDING nhắm vào học viên trong khóa học của mình
      if (
        report.status !== ReportStatus.PENDING ||
        report.targetAuthorId.toString() === user.userId
      ) {
        throw new ForbiddenException(
          'Báo cáo này thuộc thẩm quyền xử lý của Admin',
        );
      }
      if (dto.action === ReportActionType.APPLY_PENALTY) {
        throw new ForbiddenException(
          'Chỉ Admin mới có quyền áp dụng hình phạt đối với tài khoản vi phạm',
        );
      }
    }

    const note = dto.note?.trim() || null;
    const now = new Date();

    // Toàn bộ báo cáo đang chờ xử lý cùng trỏ vào bình luận này
    const groupFilter = {
      targetId: report.targetId,
      status: { $in: ACTIVE_REPORT_STATUSES },
    };
    const siblingReports = await this.reportModel.find(groupFilter).exec();
    const reporterIds = Array.from(
      new Set([
        report.reporterId.toString(),
        ...siblingReports.map((r) => r.reporterId.toString()),
      ]),
    ).map((id) => new Types.ObjectId(id));

    const notifyReporters = async (message: string): Promise<void> => {
      await Promise.all(
        reporterIds.map((reporterId) =>
          this.notificationModel.create({
            recipientId: reporterId,
            type: NotificationType.REPORT_RESULT,
            title: 'Kết quả xử lý báo cáo bình luận',
            message,
            courseId: report.courseId,
            lessonId: report.lessonId,
            isRead: false,
          }),
        ),
      );
    };

    if (dto.action === ReportActionType.ESCALATE) {
      await this.reportModel
        .updateMany(groupFilter, {
          $set: {
            status: ReportStatus.ESCALATED,
            escalatedToAdmin: true,
            actionTaken: ReportActionType.ESCALATE,
            moderationNote:
              note ?? 'Giảng viên chuyển báo cáo lên Admin xem xét',
          },
        })
        .exec();

      return {
        message: 'Đã chuyển báo cáo lên Quản trị viên hệ thống (Admin).',
        status: ReportStatus.ESCALATED,
      };
    }

    if (dto.action === ReportActionType.DISMISS) {
      await this.reportModel
        .updateMany(groupFilter, {
          $set: {
            status: ReportStatus.DISMISSED,
            actionTaken: ReportActionType.DISMISS,
            moderationNote: note,
            resolvedBy: new Types.ObjectId(user.userId),
            resolvedAt: now,
          },
        })
        .exec();

      await notifyReporters(
        `Báo cáo của bạn tại khóa học "${course.title}" đã được xem xét. Nội dung bình luận không vi phạm quy tắc cộng đồng.`,
      );

      return {
        message: 'Đã bỏ qua báo cáo vi phạm và giữ nguyên bình luận.',
        status: ReportStatus.DISMISSED,
      };
    }

    // DELETE_AND_REMIND hoặc APPLY_PENALTY: cần bình luận còn tồn tại
    const comment = await this.commentModel.findById(report.targetId).exec();
    if (!comment) {
      throw new NotFoundException('Bình luận bị báo cáo không còn tồn tại');
    }

    const targetAuthor = await this.userModel
      .findById(report.targetAuthorId)
      .select('_id role status violationCount commentBannedUntil')
      .exec();

    if (
      dto.action === ReportActionType.APPLY_PENALTY &&
      targetAuthor?.role === Role.ADMIN
    ) {
      throw new BadRequestException(
        'Không thể áp dụng hình phạt đối với tài khoản Quản trị viên',
      );
    }

    // Xóa mềm bình luận (giữ bằng chứng trong CSDL)
    comment.visibilityStatus = CommentVisibilityStatus.HIDDEN;
    comment.moderationNote =
      note ?? 'Bình luận bị xóa do vi phạm tiêu chuẩn cộng đồng';

    // Mỗi bình luận vi phạm chỉ được cộng +1 lần vi phạm duy nhất
    let violationCount = targetAuthor?.violationCount ?? 0;
    const alreadyRecorded = comment.violationRecorded === true;
    comment.violationRecorded = true;
    await comment.save();

    const isPenalty = dto.action === ReportActionType.APPLY_PENALTY;
    const penalty = isPenalty
      ? computePenalty(
          alreadyRecorded ? violationCount : violationCount + 1,
          dto.severeViolation === true,
        )
      : null;

    const penaltySummary = penalty?.summary ?? 'Xóa bình luận và nhắc nhở';

    if (!alreadyRecorded) {
      const updated = await this.userModel
        .findByIdAndUpdate(
          report.targetAuthorId,
          {
            $inc: { violationCount: 1 },
            $push: {
              violationHistory: {
                reportId: report._id,
                commentId: comment._id,
                courseId: report.courseId,
                reason: report.reason,
                actionTaken: dto.action,
                penaltySummary,
                resolvedBy: new Types.ObjectId(user.userId),
                resolvedAt: now,
              },
            },
          },
          { new: true },
        )
        .exec();
      violationCount = updated?.violationCount ?? violationCount + 1;
    }

    if (penalty) {
      const userUpdate: Record<string, unknown> = {};
      if (penalty.lockAccount) {
        userUpdate.status = UserStatus.LOCKED;
      } else if (penalty.banMs) {
        // Tính từ thời hạn cấm hiện tại để không ghi đè làm giảm thời gian xử phạt
        const currentBan = targetAuthor?.commentBannedUntil?.getTime() ?? 0;
        const base = Math.max(now.getTime(), currentBan);
        userUpdate.commentBannedUntil = new Date(base + penalty.banMs);
      }
      if (Object.keys(userUpdate).length > 0) {
        await this.userModel
          .findByIdAndUpdate(report.targetAuthorId, { $set: userUpdate })
          .exec();
      }
    }

    await this.reportModel
      .updateMany(groupFilter, {
        $set: {
          status: ReportStatus.RESOLVED,
          actionTaken: dto.action,
          moderationNote: note,
          resolvedBy: new Types.ObjectId(user.userId),
          resolvedAt: now,
        },
      })
      .exec();

    const isWarning = penalty?.officialWarning === true;
    await this.notificationModel.create({
      recipientId: report.targetAuthorId,
      type: isWarning
        ? NotificationType.MODERATION_WARNING
        : NotificationType.MODERATION_REMINDER,
      title: isWarning
        ? 'Cảnh cáo vi phạm tiêu chuẩn hỏi đáp'
        : 'Nhắc nhở về bình luận trong bài học',
      message: `Bình luận của bạn trong khóa học "${course.title}" đã bị xóa do vi phạm tiêu chuẩn cộng đồng (tổng số lần vi phạm: ${violationCount}). Hình thức xử lý: ${penaltySummary}.${note ? ` Ghi chú: ${note}` : ''}`,
      courseId: report.courseId,
      lessonId: report.lessonId,
      isRead: false,
    });

    await notifyReporters(
      `Cảm ơn bạn đã báo cáo vi phạm tại khóa học "${course.title}". Bình luận vi phạm đã được xử lý.`,
    );

    return {
      message: isPenalty
        ? `Đã xử lý vi phạm: ${penaltySummary}.`
        : 'Đã xóa bình luận vi phạm và gửi thông báo nhắc nhở.',
      status: ReportStatus.RESOLVED,
    };
  }

  async listMyNotifications(
    user: CurrentUserData,
  ): Promise<{ unreadCount: number; items: NotificationItemDto[] }> {
    const recipientObjectId = new Types.ObjectId(user.userId);
    const [items, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ recipientId: recipientObjectId })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec(),
      this.notificationModel
        .countDocuments({ recipientId: recipientObjectId, isRead: false })
        .exec(),
    ]);

    return {
      unreadCount,
      items: items.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        courseId: n.courseId ? n.courseId.toString() : null,
        lessonId: n.lessonId ? n.lessonId.toString() : null,
        isRead: n.isRead,
        createdAt: n.createdAt
          ? n.createdAt.toISOString()
          : new Date().toISOString(),
      })),
    };
  }

  async markAllNotificationsRead(
    user: CurrentUserData,
  ): Promise<{ updatedCount: number }> {
    const res = await this.notificationModel
      .updateMany(
        {
          recipientId: new Types.ObjectId(user.userId),
          isRead: false,
        },
        { $set: { isRead: true } },
      )
      .exec();

    return { updatedCount: res.modifiedCount ?? 0 };
  }
}
