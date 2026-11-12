import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EnrollmentStatus,
  LessonStatus,
} from '../../common/constants/learning.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';
import { computePenalty, QuestionsService } from './questions.service.js';
import {
  CommentReactionType,
  CommentVisibilityStatus,
} from './schemas/lesson-comment.schema.js';
import { ReportActionType, ReportStatus } from './schemas/report.schema.js';

describe('computePenalty', () => {
  it('maps accumulated violations to the 5 penalty tiers', () => {
    expect(computePenalty(1, false)).toMatchObject({ level: 1, banMs: null, lockAccount: false });
    expect(computePenalty(5, false).level).toBe(1);
    expect(computePenalty(6, false)).toMatchObject({ level: 2, banMs: 24 * 3600 * 1000 });
    expect(computePenalty(10, false).level).toBe(2);
    expect(computePenalty(11, false)).toMatchObject({ level: 3, banMs: 7 * 24 * 3600 * 1000 });
    expect(computePenalty(15, false).level).toBe(3);
    expect(computePenalty(16, false)).toMatchObject({ level: 4, banMs: 30 * 24 * 3600 * 1000 });
    expect(computePenalty(19, false).level).toBe(4);
    expect(computePenalty(20, false)).toMatchObject({ level: 5, lockAccount: true });
    expect(computePenalty(1, true)).toMatchObject({ level: 5, lockAccount: true });
  });
});

describe('QuestionsService', () => {
  const courseId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe100').toHexString();
  const lessonId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe401').toHexString();
  const studentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe001').toHexString();
  const otherStudentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe002').toHexString();
  const thirdStudentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe005').toHexString();
  const instructorId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe003').toHexString();
  const adminId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe004').toHexString();
  const rootCommentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe501').toHexString();
  const reportId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe701').toHexString();
  const enrollmentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe601');

  const studentUser = {
    userId: studentId,
    email: 'student@nextcode.edu.vn',
    role: Role.STUDENT,
  };
  const instructorUser = {
    userId: instructorId,
    email: 'instructor@nextcode.edu.vn',
    role: Role.INSTRUCTOR,
  };
  const adminUser = {
    userId: adminId,
    email: 'admin@nextcode.edu.vn',
    role: Role.ADMIN,
  };

  let commentModel: any;
  let reportModel: any;
  let notificationModel: any;
  let courseModel: any;
  let enrollmentModel: any;
  let lessonProgressModel: any;
  let userModel: any;
  let service: QuestionsService;

  const mockViewer = (extra: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(studentId),
    fullName: 'Học viên A',
    avatar: null,
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    commentBannedUntil: null,
    ...extra,
  });

  const makeReportDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(reportId),
    reporterId: new Types.ObjectId(studentId),
    targetId: new Types.ObjectId(rootCommentId),
    targetAuthorId: new Types.ObjectId(otherStudentId),
    courseId: new Types.ObjectId(courseId),
    lessonId: new Types.ObjectId(lessonId),
    reason: 'Spam',
    status: ReportStatus.PENDING,
    ...overrides,
  });

  const makeCommentDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(rootCommentId),
    visibilityStatus: CommentVisibilityStatus.VISIBLE,
    moderationNote: null as string | null,
    violationRecorded: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const setupResolveMocks = (opts: {
    report?: Record<string, unknown>;
    comment?: ReturnType<typeof makeCommentDoc>;
    siblings?: Array<Record<string, unknown>>;
    author?: Record<string, unknown>;
    updatedCount?: number;
  }) => {
    const report = makeReportDoc(opts.report);
    reportModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(report) });
    reportModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue(opts.siblings ?? [report]),
    });
    const comment = opts.comment ?? makeCommentDoc();
    commentModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(comment) });
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(otherStudentId),
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          violationCount: 0,
          commentBannedUntil: null,
          ...opts.author,
        }),
      }),
    });
    userModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ violationCount: opts.updatedCount ?? 1 }),
    });
    return { report, comment };
  };

  beforeEach(() => {
    commentModel = {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    };
    reportModel = {
      find: vi.fn(),
      findById: vi.fn(),
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }),
    };
    notificationModel = {
      create: vi.fn().mockResolvedValue({}),
      find: vi.fn(),
      countDocuments: vi.fn(),
      updateMany: vi.fn(),
    };
    courseModel = {
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(courseId),
          title: 'Lập trình JavaScript nâng cao',
          instructorId: new Types.ObjectId(instructorId),
          chapters: [
            {
              _id: new Types.ObjectId(),
              lessons: [
                {
                  _id: new Types.ObjectId(lessonId),
                  order: 1,
                  title: 'Closure là gì?',
                },
              ],
            },
          ],
        }),
      }),
      find: vi.fn(),
    };
    enrollmentModel = {
      findOne: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: enrollmentId,
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId),
          status: EnrollmentStatus.LEARNING,
        }),
      }),
    };
    lessonProgressModel = {
      findOne: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          enrollmentId,
          lessonId: new Types.ObjectId(lessonId),
          status: LessonStatus.UNLOCKED,
        }),
      }),
    };
    userModel = {
      find: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(studentId),
              fullName: 'Học viên A',
              avatar: null,
              role: Role.STUDENT,
            },
            {
              _id: new Types.ObjectId(otherStudentId),
              fullName: 'Học viên B',
              avatar: 'https://example.com/b.png',
              role: Role.STUDENT,
            },
          ]),
        }),
      }),
      findById: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockViewer()),
        }),
      }),
      findByIdAndUpdate: vi.fn(),
    };

    service = new QuestionsService(
      commentModel,
      reportModel,
      notificationModel,
      courseModel,
      enrollmentModel,
      lessonProgressModel,
      userModel,
    );
  });

  describe('listLessonComments', () => {
    const buildComments = (rootHidden: boolean, replyHidden: boolean) => {
      const now = new Date();
      const replyId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe502');
      return [
        {
          _id: new Types.ObjectId(rootCommentId),
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
          authorId: new Types.ObjectId(studentId),
          parentId: null,
          replyToUser: null,
          content: 'Nội dung gốc vi phạm',
          visibilityStatus: rootHidden
            ? CommentVisibilityStatus.HIDDEN
            : CommentVisibilityStatus.VISIBLE,
          reactions: [],
          reports: [],
          createdAt: now,
        },
        {
          _id: replyId,
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
          authorId: new Types.ObjectId(otherStudentId),
          parentId: new Types.ObjectId(rootCommentId),
          replyToUser: null,
          content: 'Câu trả lời',
          visibilityStatus: replyHidden
            ? CommentVisibilityStatus.HIDDEN
            : CommentVisibilityStatus.VISIBLE,
          reactions: [],
          reports: [],
          createdAt: now,
        },
      ];
    };

    it('keeps a hidden root comment as a placeholder when it still has visible replies', async () => {
      commentModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(buildComments(true, false)),
        }),
      });

      const result = await service.listLessonComments(studentUser, courseId, lessonId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.content).toBe('Bình luận này đã bị xóa do vi phạm');
      expect(result.items[0]?.replies).toHaveLength(1);
      expect(result.totalComments).toBe(2);
      expect(result.myCommentBannedUntil).toBeNull();
    });

    it('fully hides a hidden root comment that has no visible replies', async () => {
      commentModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(buildComments(true, true)),
        }),
      });

      const result = await service.listLessonComments(studentUser, courseId, lessonId);

      expect(result.items).toHaveLength(0);
      expect(result.totalComments).toBe(0);
    });

    it('returns myCommentBannedUntil while the viewer is banned', async () => {
      const until = new Date(Date.now() + 3600 * 1000);
      userModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockViewer({ commentBannedUntil: until })),
        }),
      });
      commentModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.listLessonComments(studentUser, courseId, lessonId);

      expect(result.myCommentBannedUntil).toBe(until.toISOString());
    });
  });

  describe('createLessonComment', () => {
    it('forbids commenting when lesson is still LOCKED for student', async () => {
      lessonProgressModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          enrollmentId,
          lessonId: new Types.ObjectId(lessonId),
          status: LessonStatus.LOCKED,
        }),
      });

      await expect(
        service.createLessonComment(studentUser, courseId, lessonId, {
          content: 'Test locked lesson',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks commenting while the account is banned from commenting', async () => {
      userModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(
            mockViewer({ commentBannedUntil: new Date(Date.now() + 24 * 3600 * 1000) }),
          ),
        }),
      });

      await expect(
        service.createLessonComment(studentUser, courseId, lessonId, {
          content: 'Em muốn hỏi',
        }),
      ).rejects.toThrow(/tạm thời bị khóa tính năng bình luận đến/);
      expect(commentModel.create).not.toHaveBeenCalled();
    });
  });

  it('toggles LIKE reaction on and off', async () => {
    const reactions: Array<{ userId: Types.ObjectId; type: CommentReactionType }> = [];
    const doc = {
      _id: new Types.ObjectId(rootCommentId),
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      authorId: new Types.ObjectId(otherStudentId),
      parentId: null,
      replyToUser: null,
      content: 'Bài học rất hay',
      visibilityStatus: CommentVisibilityStatus.VISIBLE,
      reactions,
      reports: [],
      createdAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    commentModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(doc) });

    const first = await service.toggleCommentReaction(
      studentUser,
      courseId,
      lessonId,
      rootCommentId,
      { type: CommentReactionType.LIKE },
    );
    expect(first.myReaction).toBe(CommentReactionType.LIKE);
    expect(first.totalReactions).toBe(1);

    const removed = await service.toggleCommentReaction(
      studentUser,
      courseId,
      lessonId,
      rootCommentId,
      { type: CommentReactionType.LIKE },
    );
    expect(removed.myReaction).toBeNull();
    expect(removed.totalReactions).toBe(0);
  });

  describe('reportComment', () => {
    const buildReportedComment = (authorId: string) => ({
      _id: new Types.ObjectId(rootCommentId),
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      authorId: new Types.ObjectId(authorId),
      parentId: null,
      reports: [] as Array<{ userId: Types.ObjectId; reason: string; createdAt: Date }>,
      save: vi.fn().mockResolvedValue(undefined),
    });

    it('creates an ESCALATED report when the target is the course instructor', async () => {
      commentModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(buildReportedComment(instructorId)),
      });
      userModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(instructorId),
            role: Role.INSTRUCTOR,
          }),
        }),
      });

      await service.reportComment(studentUser, courseId, lessonId, rootCommentId, {
        reason: 'Giảng viên phản hồi chưa phù hợp',
      });

      expect(reportModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({ status: ReportStatus.ESCALATED }),
        }),
        expect.any(Object),
      );
    });

    it('creates a PENDING report when the target is a student', async () => {
      commentModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(buildReportedComment(otherStudentId)),
      });
      userModel.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(otherStudentId),
            role: Role.STUDENT,
          }),
        }),
      });

      await service.reportComment(studentUser, courseId, lessonId, rootCommentId, {
        reason: 'Spam',
      });

      expect(reportModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({ status: ReportStatus.PENDING }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('resolveReport', () => {
    it('instructor deletes (soft hides) a student comment, adds +1 violation once and resolves all duplicate reports', async () => {
      const reporters = [studentId, otherStudentId, thirdStudentId];
      const siblings = reporters.map((rid) => ({
        reporterId: new Types.ObjectId(rid),
      }));
      const { comment } = setupResolveMocks({
        report: { reporterId: new Types.ObjectId(studentId) },
        siblings,
        updatedCount: 1,
      });

      const res = await service.resolveReport(instructorUser, reportId, {
        action: ReportActionType.DELETE_AND_REMIND,
        note: 'Không quảng cáo',
      });

      expect(res.status).toBe(ReportStatus.RESOLVED);
      expect(comment.visibilityStatus).toBe(CommentVisibilityStatus.HIDDEN);
      expect(comment.violationRecorded).toBe(true);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

      // Tất cả báo cáo cùng targetId được cập nhật một lượt
      const [filter, update] = reportModel.updateMany.mock.calls[0];
      expect(filter.targetId.toString()).toBe(rootCommentId);
      expect(filter.status.$in).toEqual([ReportStatus.PENDING, ReportStatus.ESCALATED]);
      expect(update.$set.status).toBe(ReportStatus.RESOLVED);

      // 1 thông báo cho tác giả + 3 thông báo cho 3 người báo cáo (không trùng)
      expect(notificationModel.create).toHaveBeenCalledTimes(4);
    });

    it('does not add another violation when the comment was already recorded', async () => {
      setupResolveMocks({ comment: makeCommentDoc({ violationRecorded: true }) });

      await service.resolveReport(instructorUser, reportId, {
        action: ReportActionType.DELETE_AND_REMIND,
      });

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('syncs DISMISSED status to every duplicate report of the same comment', async () => {
      const siblings = [studentId, otherStudentId].map((rid) => ({
        reporterId: new Types.ObjectId(rid),
      }));
      setupResolveMocks({ siblings });

      const res = await service.resolveReport(instructorUser, reportId, {
        action: ReportActionType.DISMISS,
      });

      expect(res.status).toBe(ReportStatus.DISMISSED);
      const [filter, update] = reportModel.updateMany.mock.calls[0];
      expect(filter.targetId.toString()).toBe(rootCommentId);
      expect(update.$set.status).toBe(ReportStatus.DISMISSED);
      expect(notificationModel.create).toHaveBeenCalledTimes(2);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('escalates all duplicate PENDING reports to ESCALATED without adding a violation', async () => {
      setupResolveMocks({});

      const res = await service.resolveReport(instructorUser, reportId, {
        action: ReportActionType.ESCALATE,
      });

      expect(res.status).toBe(ReportStatus.ESCALATED);
      const [, update] = reportModel.updateMany.mock.calls[0];
      expect(update.$set.status).toBe(ReportStatus.ESCALATED);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('forbids instructor from applying penalties or touching ESCALATED reports', async () => {
      setupResolveMocks({});
      await expect(
        service.resolveReport(instructorUser, reportId, {
          action: ReportActionType.APPLY_PENALTY,
        }),
      ).rejects.toThrow(ForbiddenException);

      setupResolveMocks({ report: { status: ReportStatus.ESCALATED } });
      await expect(
        service.resolveReport(instructorUser, reportId, {
          action: ReportActionType.DISMISS,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects resolving an already processed report', async () => {
      setupResolveMocks({ report: { status: ReportStatus.RESOLVED } });
      await expect(
        service.resolveReport(adminUser, reportId, { action: ReportActionType.DISMISS }),
      ).rejects.toThrow(BadRequestException);
    });

    it('admin applies a 24h comment ban at the 6th violation, stacking on the existing ban', async () => {
      const existingBan = new Date(Date.now() + 2 * 3600 * 1000);
      setupResolveMocks({
        report: { status: ReportStatus.ESCALATED },
        author: { violationCount: 5, commentBannedUntil: existingBan },
        updatedCount: 6,
      });

      const res = await service.resolveReport(adminUser, reportId, {
        action: ReportActionType.APPLY_PENALTY,
      });

      expect(res.status).toBe(ReportStatus.RESOLVED);
      const banCall = userModel.findByIdAndUpdate.mock.calls.find(
        (c: any[]) => c[1].$set?.commentBannedUntil,
      );
      expect(banCall).toBeDefined();
      expect(banCall[1].$set.commentBannedUntil.getTime()).toBe(
        existingBan.getTime() + 24 * 3600 * 1000,
      );
    });

    it('admin locks the account immediately for a severe violation', async () => {
      setupResolveMocks({
        report: { status: ReportStatus.ESCALATED },
        author: { violationCount: 0 },
        updatedCount: 1,
      });

      await service.resolveReport(adminUser, reportId, {
        action: ReportActionType.APPLY_PENALTY,
        severeViolation: true,
      });

      const lockCall = userModel.findByIdAndUpdate.mock.calls.find(
        (c: any[]) => c[1].$set?.status === UserStatus.LOCKED,
      );
      expect(lockCall).toBeDefined();
    });

    it('forbids admin from escalating a report', async () => {
      setupResolveMocks({ report: { status: ReportStatus.ESCALATED } });
      await expect(
        service.resolveReport(adminUser, reportId, { action: ReportActionType.ESCALATE }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
