import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnrollmentStatus } from '../../common/constants/learning.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';
import { QuestionsService } from '../questions/questions.service.js';
import { CommentVisibilityStatus } from '../questions/schemas/lesson-comment.schema.js';
import {
  ReportActionType,
  ReportStatus,
  ReportTargetType,
} from '../questions/schemas/report.schema.js';
import { ReviewsService } from './reviews.service.js';

describe('ReviewsService & Moderation Integration', () => {
  const courseId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe100');
  const instructorId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe002');
  const student1Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe001');
  const student2Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe003');
  const student3Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe004');

  let courseDoc: any;
  let enrollmentsStore: any[];
  let reviewsStore: any[];
  let reportsStore: any[];
  let notificationsStore: any[];
  let usersStore: Map<string, any>;
  let reviewsService: ReviewsService;
  let questionsService: QuestionsService;

  beforeEach(() => {
    courseDoc = {
      _id: courseId,
      title: 'Lập trình NestJS Thực chiến',
      instructorId,
      avgRating: 0,
      chapters: [],
    };
    enrollmentsStore = [];
    reviewsStore = [];
    reportsStore = [];
    notificationsStore = [];
    usersStore = new Map([
      [
        student1Id.toString(),
        {
          _id: student1Id,
          fullName: 'Học Viên Một',
          avatar: null,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          violationCount: 0,
          commentBannedUntil: null,
          violationHistory: [],
        },
      ],
      [
        student2Id.toString(),
        {
          _id: student2Id,
          fullName: 'Học Viên Hai',
          avatar: null,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          violationCount: 0,
          commentBannedUntil: null,
          violationHistory: [],
        },
      ],
      [
        student3Id.toString(),
        {
          _id: student3Id,
          fullName: 'Học Viên Ba',
          avatar: null,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          violationCount: 0,
          commentBannedUntil: null,
          violationHistory: [],
        },
      ],
      [
        instructorId.toString(),
        {
          _id: instructorId,
          fullName: 'Giảng Viên Phụ Trách',
          avatar: null,
          role: Role.INSTRUCTOR,
          status: UserStatus.ACTIVE,
          violationCount: 0,
          commentBannedUntil: null,
          violationHistory: [],
        },
      ],
    ]);

    const makeReviewDoc = (raw: any) => {
      const doc: any = {
        ...raw,
        save: vi.fn().mockImplementation(async () => {
          doc.updatedAt = new Date(Date.now() + 5000);
          return doc;
        }),
      };
      return doc;
    };

    const reviewModel: any = {
      find: vi.fn((filter: any) => {
        const getMatched = () =>
          reviewsStore.filter((r) => {
            if (
              filter?.courseId &&
              r.courseId.toString() !== filter.courseId.toString()
            ) {
              return false;
            }
            if (
              filter?.visibilityStatus &&
              r.visibilityStatus !== filter.visibilityStatus
            ) {
              return false;
            }
            if (filter?._id?.$in) {
              const ids = filter._id.$in.map((id: any) => id.toString());
              if (!ids.includes(r._id.toString())) return false;
            }
            return true;
          });
        return {
          sort: () => ({ exec: async () => getMatched() }),
          select: () => ({ exec: async () => getMatched() }),
          exec: async () => getMatched(),
        };
      }),
      findOne: vi.fn((filter: any) => ({
        exec: async () =>
          reviewsStore.find((r) => {
            if (filter._id && r._id.toString() !== filter._id.toString()) {
              return false;
            }
            if (
              filter.courseId &&
              r.courseId.toString() !== filter.courseId.toString()
            ) {
              return false;
            }
            if (
              filter.studentId &&
              r.studentId.toString() !== filter.studentId.toString()
            ) {
              return false;
            }
            if (
              filter.visibilityStatus &&
              r.visibilityStatus !== filter.visibilityStatus
            ) {
              return false;
            }
            return true;
          }) ?? null,
      })),
      findById: vi.fn((id: any) => ({
        exec: async () =>
          reviewsStore.find((r) => r._id.toString() === id.toString()) ?? null,
      })),
      create: vi.fn(async (payload: any) => {
        const now = new Date();
        const doc = makeReviewDoc({
          _id: new Types.ObjectId(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        });
        reviewsStore.push(doc);
        return doc;
      }),
    };

    const courseModel: any = {
      findById: vi.fn((id: any) => {
        const match =
          id.toString() === courseId.toString() ? courseDoc : null;
        return {
          select: () => ({
            lean: () => ({ exec: async () => match }),
            exec: async () => match,
          }),
          exec: async () => match,
        };
      }),
      find: vi.fn(() => ({
        select: () => ({ exec: async () => [courseDoc] }),
      })),
      findByIdAndUpdate: vi.fn((id: any, update: any) => ({
        exec: async () => {
          if (id.toString() === courseId.toString() && update?.$set) {
            Object.assign(courseDoc, update.$set);
          }
          return courseDoc;
        },
      })),
    };

    const enrollmentModel: any = {
      findOne: vi.fn(({ courseId: cId, studentId: sId }) => ({
        exec: async () =>
          enrollmentsStore.find(
            (e) =>
              e.courseId.toString() === cId.toString() &&
              e.studentId.toString() === sId.toString(),
          ) ?? null,
      })),
    };

    const userModel: any = {
      findById: vi.fn((id: any) => ({
        select: () => ({
          exec: async () => usersStore.get(id.toString()) ?? null,
        }),
      })),
      find: vi.fn((filter: any) => ({
        select: () => ({
          exec: async () => {
            if (filter?._id?.$in) {
              return filter._id.$in
                .map((id: any) => usersStore.get(id.toString()))
                .filter(Boolean);
            }
            return Array.from(usersStore.values());
          },
        }),
      })),
      findByIdAndUpdate: vi.fn((id: any, update: any) => ({
        exec: async () => {
          const u = usersStore.get(id.toString());
          if (!u) return null;
          if (update.$inc?.violationCount) {
            u.violationCount += update.$inc.violationCount;
          }
          if (update.$push?.violationHistory) {
            u.violationHistory.push(update.$push.violationHistory);
          }
          if (update.$set) {
            Object.assign(u, update.$set);
          }
          return u;
        },
      })),
    };

    const reportModel: any = {
      findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
        let existing = reportsStore.find(
          (r) =>
            r.reporterId.toString() === filter.reporterId.toString() &&
            r.targetId.toString() === filter.targetId.toString(),
        );
        if (existing) {
          Object.assign(existing, update.$set);
          return existing;
        }
        existing = {
          _id: new Types.ObjectId(),
          ...update.$setOnInsert,
          ...update.$set,
          createdAt: new Date(),
        };
        reportsStore.push(existing);
        return existing;
      }),
      findById: vi.fn((id: any) => ({
        exec: async () =>
          reportsStore.find((r) => r._id.toString() === id.toString()) ?? null,
      })),
      find: vi.fn((filter: any) => {
        const getMatched = () =>
          reportsStore.filter((r) => {
            if (
              filter?.targetId &&
              r.targetId.toString() !== filter.targetId.toString()
            ) {
              return false;
            }
            if (
              filter?.status?.$in &&
              !filter.status.$in.includes(r.status)
            ) {
              return false;
            }
            return true;
          });
        return {
          sort: () => ({ exec: async () => getMatched() }),
          exec: async () => getMatched(),
        };
      }),
      updateMany: vi.fn((filter: any, update: any) => ({
        exec: async () => {
          for (const r of reportsStore) {
            if (
              (!filter.targetId ||
                r.targetId.toString() === filter.targetId.toString()) &&
              (!filter.status?.$in || filter.status.$in.includes(r.status))
            ) {
              Object.assign(r, update.$set);
            }
          }
        },
      })),
    };

    const notificationModel: any = {
      create: vi.fn(async (payload: any) => {
        const doc = { _id: new Types.ObjectId(), ...payload };
        notificationsStore.push(doc);
        return doc;
      }),
    };

    const commentModel: any = {
      find: vi.fn(() => ({ exec: async () => [] })),
      findById: vi.fn(() => ({ exec: async () => null })),
    };

    const lessonProgressModel: any = {};

    reviewsService = new ReviewsService(
      reviewModel,
      courseModel,
      enrollmentModel,
      userModel,
      reportModel,
    );

    questionsService = new QuestionsService(
      commentModel,
      reportModel,
      notificationModel,
      courseModel,
      enrollmentModel,
      lessonProgressModel,
      userModel,
      reviewModel,
    );
  });

  it('chặn học viên chưa hoàn thành 100% khóa học gửi đánh giá', async () => {
    enrollmentsStore.push({
      courseId,
      studentId: student1Id,
      status: EnrollmentStatus.LEARNING,
      progressPercent: 60,
      completedAt: null,
    });

    await expect(
      reviewsService.upsertMyCourseReview(
        {
          userId: student1Id.toString(),
          email: 's1@test.com',
          role: Role.STUDENT,
        },
        courseId.toString(),
        { rating: 5, comment: 'Rất hay!' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cho phép học viên hoàn thành 100% gửi đánh giá, giữ quyền sửa kể cả khi khóa học thêm bài mới và ưu tiên đánh giá có chữ lên đầu', async () => {
    // Student 1 hoàn thành 100% -> chỉ chấm 4 sao (không viết chữ)
    enrollmentsStore.push({
      courseId,
      studentId: student1Id,
      status: EnrollmentStatus.COMPLETED,
      progressPercent: 100,
      completedAt: new Date(),
    });

    await reviewsService.upsertMyCourseReview(
      {
        userId: student1Id.toString(),
        email: 's1@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      { rating: 4, comment: '' },
    );
    expect(courseDoc.avgRating).toBe(4);

    // Student 2 hoàn thành 100% -> chấm 5 sao kèm nhận xét chữ
    enrollmentsStore.push({
      courseId,
      studentId: student2Id,
      status: EnrollmentStatus.COMPLETED,
      progressPercent: 100,
      completedAt: new Date(),
    });

    await reviewsService.upsertMyCourseReview(
      {
        userId: student2Id.toString(),
        email: 's2@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      { rating: 5, comment: 'Bài giảng chi tiết và thực tế!' },
    );

    // Điểm trung bình tính cả đánh giá có chữ và chỉ chấm sao: (4 + 5) / 2 = 4.5
    expect(courseDoc.avgRating).toBe(4.5);

    const list = await reviewsService.listCourseReviews(courseId.toString(), {});
    expect(list.summary.totalReviews).toBe(2);
    expect(list.summary.avgRating).toBe(4.5);
    // Đánh giá có chữ (Student 2) được đẩy lên đầu danh sách, đánh giá không chữ (Student 1) xuống dưới
    expect(list.items[0]!.author.id).toBe(student2Id.toString());
    expect(list.items[0]!.hasComment).toBe(true);
    expect(list.items[1]!.author.id).toBe(student1Id.toString());
    expect(list.items[1]!.hasComment).toBe(false);

    // Giảng viên thêm bài mới -> tiến độ Student 1 tụt xuống 80% (status = LEARNING)
    enrollmentsStore[0].status = EnrollmentStatus.LEARNING;
    enrollmentsStore[0].progressPercent = 80;
    enrollmentsStore[0].completedAt = null;

    // Student 1 vẫn giữ nguyên đánh giá và vẫn có quyền chỉnh sửa lên 5 sao
    const updated = await reviewsService.upsertMyCourseReview(
      {
        userId: student1Id.toString(),
        email: 's1@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      { rating: 5, comment: 'Cập nhật thêm nhận xét sau khi học bài mới' },
    );
    expect(updated.myReview.rating).toBe(5);
    expect(courseDoc.avgRating).toBe(5);
    expect(reviewsStore).toHaveLength(2);
  });

  it('chặn viết nhận xét chữ khi đang bị cấm bình luận (#035), và khi xóa mềm đánh giá vi phạm thì tự động trừ khỏi điểm trung bình khóa học', async () => {
    enrollmentsStore.push(
      {
        courseId,
        studentId: student1Id,
        status: EnrollmentStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
      },
      {
        courseId,
        studentId: student2Id,
        status: EnrollmentStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
      },
    );

    // Student 1 chấm 5 sao (không chữ) -> không thể bị báo cáo vi phạm
    const s1Res = await reviewsService.upsertMyCourseReview(
      {
        userId: student1Id.toString(),
        email: 's1@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      { rating: 5, comment: '' },
    );

    await expect(
      reviewsService.reportCourseReview(
        {
          userId: student2Id.toString(),
          email: 's2@test.com',
          role: Role.STUDENT,
        },
        courseId.toString(),
        s1Res.myReview.id,
        { reason: 'Thử báo cáo đánh giá không có chữ' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Student 2 gửi đánh giá 1 sao kèm lời lẽ vi phạm
    const s2Res = await reviewsService.upsertMyCourseReview(
      {
        userId: student2Id.toString(),
        email: 's2@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      { rating: 1, comment: 'Bình luận xúc phạm nghiêm trọng' },
    );
    expect(courseDoc.avgRating).toBe(3); // (5 + 1) / 2 = 3.0

    // Student 1 báo cáo đánh giá của Student 2
    await reviewsService.reportCourseReview(
      {
        userId: student1Id.toString(),
        email: 's1@test.com',
        role: Role.STUDENT,
      },
      courseId.toString(),
      s2Res.myReview.id,
      { reason: 'Ngôn từ xúc phạm trong phần đánh giá' },
    );
    expect(reportsStore).toHaveLength(1);
    expect(reportsStore[0].targetType).toBe(ReportTargetType.REVIEW);

    // Giảng viên xử lý báo cáo (DELETE_AND_REMIND) -> ẩn toàn bộ đánh giá vi phạm và tính lại avgRating = 5.0
    const resolveRes = await questionsService.resolveReport(
      {
        userId: instructorId.toString(),
        email: 'inst@test.com',
        role: Role.INSTRUCTOR,
      },
      reportsStore[0]._id.toString(),
      {
        action: ReportActionType.DELETE_AND_REMIND,
        note: 'Ngôn từ vi phạm tiêu chuẩn cộng đồng',
      },
    );
    expect(resolveRes.status).toBe(ReportStatus.RESOLVED);
    expect(courseDoc.avgRating).toBe(5);

    const publicListAfterHide = await reviewsService.listCourseReviews(
      courseId.toString(),
      {},
    );
    expect(publicListAfterHide.summary.totalReviews).toBe(1);
    expect(publicListAfterHide.summary.avgRating).toBe(5);

    // Nếu Student 3 đang trong thời gian bị cấm bình luận -> chặn gửi nhận xét có chữ
    usersStore.get(student3Id.toString()).commentBannedUntil = new Date(
      Date.now() + 3600_000,
    );
    enrollmentsStore.push({
      courseId,
      studentId: student3Id,
      status: EnrollmentStatus.COMPLETED,
      progressPercent: 100,
      completedAt: new Date(),
    });

    await expect(
      reviewsService.upsertMyCourseReview(
        {
          userId: student3Id.toString(),
          email: 's3@test.com',
          role: Role.STUDENT,
        },
        courseId.toString(),
        { rating: 5, comment: 'Cố tình bình luận khi đang bị cấm' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

