import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model, PipelineStage, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../common/constants/roles.enum.js';
import { CourseStatus, CourseType } from '../../common/constants/course.enum.js';
import { UsersService } from '../users/users.service.js';
import { Category } from './schemas/category.schema.js';
import { CourseManageService } from './course-manage.service.js';
import {
  CreateQuizQuestionDto,
  ManageCourseQueryDto,
  ManageCourseSort,
  ReorderChaptersDto,
  UpdateLessonDto,
  UpdateManageCourseDto,
  UpdateQuizQuestionDto,
} from './dto/manage-course.dto.js';
import { getManageCoursePermissions } from './manage-course.serializer.js';
import type { ManageCourseActor } from './manage-course.serializer.js';
import { Course } from './schemas/course.schema.js';
import { getCourseReadiness } from './manage-course-readiness.js';

const instructorId = new Types.ObjectId();
const otherInstructorId = new Types.ObjectId();
const categoryId = new Types.ObjectId();
const courseId = new Types.ObjectId();
const chapterId = new Types.ObjectId();
const lessonId = new Types.ObjectId();

function createCourse(status = CourseStatus.DRAFT) {
  const lesson = {
    _id: lessonId,
    title: '1.1 Bài học',
    order: 1,
    videoUrl: 'https://example.com/lesson.mp4',
    duration: 420,
    note: 'Ghi chú cũ',
    summary: 'Tóm tắt cũ',
    quizQuestions: [],
    hasQuiz: false,
  };
  const chapter = { _id: chapterId, title: 'Chương một', order: 1, lessons: [lesson] };
  return {
    _id: courseId,
    title: 'REST API với NestJS',
    description: 'Khóa học xây dựng REST API bằng NestJS.',
    type: CourseType.PRO,
    level: 'Có cơ bản',
    categoryId,
    instructorId,
    targetAudience: 'Người đã có kiến thức TypeScript cơ bản.',
    learningOutcomes: ['Tạo REST API có xác thực'],
    requirements: 'Đã cài Node.js và hiểu TypeScript.',
    price: 699000,
    discountPrice: null,
    thumbnail: null,
    avgRating: 0,
    totalChapters: 1,
    totalLessons: 1,
    totalDuration: 420,
    status,
    rejectReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    chapters: [chapter],
    save: vi.fn().mockResolvedValue(undefined),
  };
}

function createAggregateRecord(course: ReturnType<typeof createCourse>) {
  return {
    ...course,
    instructor: { _id: instructorId, fullName: 'Giảng viên A', avatar: null },
    category: { _id: categoryId, name: 'Lập trình Backend' },
  };
}

describe('CourseManageService', () => {
  let service: CourseManageService;
  let course: ReturnType<typeof createCourse>;
  let findByIdExec: ReturnType<typeof vi.fn>;
  let aggregateExec: ReturnType<typeof vi.fn>;
  let aggregateMock: ReturnType<typeof vi.fn>;
  let findOneAndUpdateMock: ReturnType<typeof vi.fn>;

  const instructor: ManageCourseActor = {
    userId: instructorId.toString(),
    role: Role.INSTRUCTOR,
  };

  beforeEach(() => {
    course = createCourse();
    findByIdExec = vi.fn().mockResolvedValue(course);
    aggregateExec = vi.fn().mockImplementation(async () => [
      createAggregateRecord(course),
    ]);
    aggregateMock = vi.fn(() => ({ exec: aggregateExec }));
    findOneAndUpdateMock = vi.fn(
      (
        _filter: Record<string, unknown>,
        update: {
          $set: { status: CourseStatus; rejectReason?: string | null };
        },
      ) => ({
        exec: vi.fn().mockImplementation(async () => {
          course.status = update.$set.status;
          if ('rejectReason' in update.$set) {
            course.rejectReason = update.$set.rejectReason ?? null;
          }
          return course;
        }),
      }),
    );

    service = new CourseManageService(
      {
        findById: vi.fn(() => ({
          exec: findByIdExec,
          select: vi.fn(() => ({
            lean: vi.fn(() => ({
              exec: vi.fn().mockImplementation(async () => ({
                chapters: course.chapters,
              })),
            })),
          })),
        })),
        aggregate: aggregateMock,
        findOneAndUpdate: findOneAndUpdateMock,
        updateOne: vi.fn(() => ({ exec: vi.fn().mockResolvedValue({}) })),
      } as unknown as Model<Course>,
      {
        exists: vi.fn(() => ({ exec: vi.fn().mockResolvedValue(true) })),
      } as unknown as Model<Category>,
      {} as UsersService,
    );
  });

  it('blocks instructors from accessing another instructor course in the service', async () => {
    course.instructorId = otherInstructorId;

    await expect(service.getCourse(courseId.toString(), instructor)).rejects.toThrow(
      ForbiddenException,
    );
    expect(aggregateExec).not.toHaveBeenCalled();
  });

  it('denies access to unsupported roles in the service, not only in the route guard', async () => {
    const query = Object.assign(new ManageCourseQueryDto(), { page: 1, limit: 12 });
    await expect(
      service.listCourses(query, {
        userId: instructorId.toString(),
        role: Role.STUDENT,
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.listCourses(query, {
        userId: instructorId.toString(),
        role: Role.ACCOUNTANT,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('filters instructor lists by JWT identity and paginates in MongoDB', async () => {
    aggregateExec.mockResolvedValueOnce([
      { items: [], totalCount: [{ total: 13 }] },
    ]);
    const query = Object.assign(new ManageCourseQueryDto(), {
      page: 2,
      limit: 5,
      sort: ManageCourseSort.NEWEST,
      instructorId: otherInstructorId.toString(),
    });

    const result = await service.listCourses(query, instructor);
    const pipeline = aggregateMock.mock.calls[0][0] as PipelineStage[];

    expect(pipeline[0]).toMatchObject({
      $match: { instructorId },
    });
    expect(result).toMatchObject({ total: 13, page: 2, limit: 5, totalPages: 3 });
    const facet = pipeline.find(
      (stage): stage is PipelineStage.Facet => '$facet' in stage,
    );
    expect(facet?.$facet.items).toEqual(
      expect.arrayContaining([
        { $skip: 5 },
        { $limit: 5 },
        expect.objectContaining({
          $project: expect.not.objectContaining({ chapters: 1 }),
        }),
      ]),
    );
  });

  it('computes permissions from both course state and ownership', () => {
    expect(
      getManageCoursePermissions(CourseStatus.DRAFT, instructorId, instructor),
    ).toMatchObject({ canEdit: true, canSubmit: true, canDelete: true });
    expect(
      getManageCoursePermissions(CourseStatus.PENDING, instructorId, instructor),
    ).toMatchObject({ canEdit: false, canWithdraw: true });
    expect(
      getManageCoursePermissions(CourseStatus.APPROVED, otherInstructorId, instructor),
    ).toMatchObject({ canEdit: false, canHide: false });
    expect(
      getManageCoursePermissions(CourseStatus.HIDDEN, otherInstructorId, {
        userId: new Types.ObjectId().toString(),
        role: Role.ADMIN,
      }),
    ).toMatchObject({ canEdit: true, canApprove: true, canDelete: true });
  });

  it('reports readiness blockers and non-blocking PRO lesson warnings', () => {
    course.chapters[0].lessons[0].note = null;
    course.chapters[0].lessons[0].summary = null;
    const result = getCourseReadiness(course as unknown as Course);

    expect(result.ready).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.warnings).toHaveLength(1);

    course.chapters[0].lessons[0].videoUrl = '';
    const incomplete = getCourseReadiness(course as unknown as Course);
    expect(incomplete.ready).toBe(false);
    expect(incomplete.issues[0]).toContain('chưa có video');
  });

  it('allows valid DRAFT to PENDING transition with a conditional status update', async () => {
    const response = await service.submitCourse(courseId.toString(), instructor);

    expect(findOneAndUpdateMock).toHaveBeenCalledOnce();
    expect(findOneAndUpdateMock.mock.calls[0][0]).toMatchObject({
      _id: courseId,
      status: CourseStatus.DRAFT,
    });
    expect(findOneAndUpdateMock.mock.calls[0][1]).toEqual({
      $set: { status: CourseStatus.PENDING, rejectReason: null },
    });
    expect(response.status).toBe(CourseStatus.PENDING);
    expect(response.permissions.canEdit).toBe(false);
  });

  it('supports withdraw, reject, approve, hide, and re-approve transitions', async () => {
    course.status = CourseStatus.PENDING;
    expect(
      (await service.withdrawCourse(courseId.toString(), instructor)).status,
    ).toBe(CourseStatus.DRAFT);

    course.status = CourseStatus.PENDING;
    const admin: ManageCourseActor = {
      userId: new Types.ObjectId().toString(),
      role: Role.ADMIN,
    };
    const rejected = await service.rejectCourse(
      courseId.toString(),
      { reason: 'Cần bổ sung thêm bài thực hành.' },
      admin,
    );
    expect(rejected.status).toBe(CourseStatus.DRAFT);
    expect(rejected.rejectReason).toBe('Cần bổ sung thêm bài thực hành.');

    course.status = CourseStatus.PENDING;
    expect(
      (await service.approveCourse(courseId.toString(), admin)).status,
    ).toBe(CourseStatus.APPROVED);
    expect(
      (await service.hideCourse(courseId.toString(), admin)).status,
    ).toBe(CourseStatus.HIDDEN);
    expect(
      (await service.approveCourse(courseId.toString(), admin)).status,
    ).toBe(CourseStatus.APPROVED);
  });

  it('rejects invalid status transitions with 409', async () => {
    course.status = CourseStatus.APPROVED;

    await expect(service.submitCourse(courseId.toString(), instructor)).rejects.toThrow(
      ConflictException,
    );
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it('blocks instructor edits while the course is PENDING', async () => {
    course.status = CourseStatus.PENDING;

    await expect(
      service.updateCourse(courseId.toString(), { title: 'Tiêu đề mới' }, instructor),
    ).rejects.toThrow(ConflictException);
    expect(course.save).not.toHaveBeenCalled();
  });

  it('clears PRO-only lesson fields and resets pricing when changing DRAFT to FREE', async () => {
    const response = await service.updateCourse(
      courseId.toString(),
      { type: CourseType.FREE, price: 500000 },
      instructor,
    );

    expect(course.type).toBe(CourseType.FREE);
    expect(course.price).toBe(0);
    expect(course.discountPrice).toBeNull();
    expect(course.chapters[0].lessons[0].note).toBeNull();
    expect(course.chapters[0].lessons[0].summary).toBeNull();
    expect(response.type).toBe(CourseType.FREE);
  });

  it('rejects reorder requests that do not contain exactly the existing chapter IDs', async () => {
    const request: ReorderChaptersDto = { chapterIds: [] };

    await expect(
      service.reorderChapters(courseId.toString(), request, instructor),
    ).rejects.toThrow(BadRequestException);
    expect(course.save).not.toHaveBeenCalled();
  });

  it('reorders chapters and assigns continuous order values', async () => {
    const secondChapterId = new Types.ObjectId();
    course.chapters.push({
      _id: secondChapterId,
      title: 'Chương hai',
      order: 2,
      lessons: [],
    });

    await service.reorderChapters(
      courseId.toString(),
      {
        chapterIds: [secondChapterId.toString().toUpperCase(), chapterId.toString()],
      },
      instructor,
    );

    expect(course.chapters.map((chapter) => chapter._id.toString())).toEqual([
      secondChapterId.toString(),
      chapterId.toString(),
    ]);
    expect(course.chapters.map((chapter) => chapter.order)).toEqual([1, 2]);
  });

  it('rejects quiz answers outside the zero-based options range', async () => {
    const question: CreateQuizQuestionDto = {
      content: 'NestJS module dùng để làm gì?',
      options: ['A', 'B'],
      correctOption: 2,
      explanation: 'Giải thích đáp án đúng.',
    };

    await expect(
      service.addQuizQuestion(
        courseId.toString(),
        chapterId.toString(),
        lessonId.toString(),
        question,
        instructor,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(course.save).not.toHaveBeenCalled();
  });

  it('rejects null for non-nullable patch fields while allowing nullable lesson notes', async () => {
    const invalidLesson = plainToInstance(UpdateLessonDto, { videoUrl: null });
    const invalidCourse = plainToInstance(UpdateManageCourseDto, { title: null });
    const invalidQuestion = plainToInstance(UpdateQuizQuestionDto, {
      content: null,
    });
    const nullableNote = plainToInstance(UpdateLessonDto, { note: null });

    expect(await validate(invalidLesson)).not.toHaveLength(0);
    expect(await validate(invalidCourse)).not.toHaveLength(0);
    expect(await validate(invalidQuestion)).not.toHaveLength(0);
    expect(await validate(nullableNote)).toHaveLength(0);
  });
});
