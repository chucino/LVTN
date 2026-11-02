import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import {
  CertificateStatus,
  EnrollmentStatus,
  LessonStatus,
} from '../../common/constants/learning.enum.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsService', () => {
  const studentId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe001').toString();
  const instructorId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe002');
  const categoryId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe003');
  const freeCourseId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe100').toString();
  const proCourseId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe200').toString();

  const chapter1Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe301');
  const lesson1Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe401');
  const lesson2Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe402');
  const lesson3Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe403');

  const q1Id = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe501');
  const q2AId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe502');
  const q2BId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe503');
  const q2CId = new Types.ObjectId('6650c1f6f2f4f6e4c8bfe504');

  const sampleFreeCourse = {
    _id: new Types.ObjectId(freeCourseId),
    title: 'Nền tảng HTML & CSS',
    description: 'Khóa học miễn phí nền tảng Web',
    type: CourseType.FREE,
    level: 'Người mới bắt đầu',
    status: CourseStatus.APPROVED,
    instructorId,
    categoryId,
    price: 0,
    discountPrice: null,
    totalChapters: 1,
    totalLessons: 3,
    totalDuration: 900,
    chapters: [
      {
        _id: chapter1Id,
        title: 'Chương 1: Khởi đầu',
        order: 1,
        lessons: [
          {
            _id: lesson1Id,
            title: '1.1 Giới thiệu (Không có trắc nghiệm)',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/video1',
            duration: 300,
            note: null,
            summary: null,
            hasQuiz: false,
            quizQuestions: [],
          },
          {
            _id: lesson2Id,
            title: '1.2 Cấu trúc HTML (1 câu trắc nghiệm - cần đúng 100%)',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/video2',
            duration: 300,
            note: null,
            summary: null,
            hasQuiz: true,
            quizQuestions: [
              {
                _id: q1Id,
                content: 'Thẻ nào tạo tiêu đề lớn nhất?',
                options: ['<div>', '<h1>', '<h6>'],
                correctOption: 1,
                explanation: '<h1> là thẻ tiêu đề cấp 1 lớn nhất.',
              },
            ],
          },
          {
            _id: lesson3Id,
            title: '1.3 CSS Flexbox (3 câu trắc nghiệm - cần đúng >= 70%)',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/video3',
            duration: 300,
            note: null,
            summary: null,
            hasQuiz: true,
            quizQuestions: [
              {
                _id: q2AId,
                content: 'Thuộc tính kích hoạt Flexbox?',
                options: ['display: flex', 'display: block'],
                correctOption: 0,
                explanation: 'display: flex kích hoạt Flexbox container.',
              },
              {
                _id: q2BId,
                content: 'Căn giữa theo trục chính dùng thuộc tính nào?',
                options: ['align-items', 'justify-content'],
                correctOption: 1,
                explanation: 'justify-content căn chỉnh theo trục chính.',
              },
              {
                _id: q2CId,
                content: 'Đổi hướng trục chính thành cột dùng giá trị nào?',
                options: ['flex-direction: column', 'flex-wrap: wrap'],
                correctOption: 0,
                explanation: 'flex-direction: column đổi trục chính thành dọc.',
              },
            ],
          },
        ],
      },
    ],
  };

  const sampleProCourse = {
    ...sampleFreeCourse,
    _id: new Types.ObjectId(proCourseId),
    title: 'NestJS Chuyên sâu (Pro)',
    type: CourseType.PRO,
    price: 599000,
  };

  let enrollmentsStore: any[];
  let lessonProgressStore: any[];
  let quizAttemptsStore: any[];
  let service: EnrollmentsService;
  let issuedCertificateCount: number;

  beforeEach(() => {
    enrollmentsStore = [];
    lessonProgressStore = [];
    quizAttemptsStore = [];
    issuedCertificateCount = 0;

    const makeEnrollmentDoc = (raw: any) => {
      const doc = {
        ...raw,
        save: vi.fn().mockImplementation(async () => doc),
      };
      return doc;
    };

    const makeProgressDoc = (raw: any) => {
      const doc = {
        ...raw,
        save: vi.fn().mockImplementation(async () => doc),
      };
      return doc;
    };

    const enrollmentModel: any = {
      findOne: vi.fn(({ studentId: sId, courseId: cId }) => ({
        exec: async () =>
          enrollmentsStore.find(
            (e) =>
              e.studentId.toString() === sId.toString() &&
              e.courseId.toString() === cId.toString(),
          ) ?? null,
      })),
      find: vi.fn(({ studentId: sId, status }) => ({
        sort: () => ({
          exec: async () =>
            enrollmentsStore.filter(
              (e) =>
                e.studentId.toString() === sId.toString() &&
                (!status || e.status === status),
            ),
        }),
      })),
      create: vi.fn(async (payload) => {
        const doc = makeEnrollmentDoc({
          _id: new Types.ObjectId(),
          ...payload,
        });
        enrollmentsStore.push(doc);
        return doc;
      }),
    };

    const lessonProgressModel: any = {
      insertMany: vi.fn(async (items: any[]) => {
        const created = items.map((item) =>
          makeProgressDoc({
            _id: new Types.ObjectId(),
            ...item,
          }),
        );
        lessonProgressStore.push(...created);
        return created;
      }),
      find: vi.fn(({ enrollmentId }) => ({
        exec: async () =>
          lessonProgressStore.filter(
            (p) => p.enrollmentId.toString() === enrollmentId.toString(),
          ),
      })),
      create: vi.fn(async (payload) => {
        const doc = makeProgressDoc({
          _id: new Types.ObjectId(),
          ...payload,
        });
        lessonProgressStore.push(doc);
        return doc;
      }),
    };

    const quizAttemptModel: any = {
      insertMany: vi.fn(async (items: any[]) => {
        quizAttemptsStore.push(...items);
        return items;
      }),
    };

    const courseModel: any = {
      findOne: vi.fn(({ _id, status }) => ({
        lean: () => ({
          exec: async () => {
            if (status !== CourseStatus.APPROVED) return null;
            if (_id.toString() === freeCourseId) return sampleFreeCourse;
            if (_id.toString() === proCourseId) return sampleProCourse;
            return null;
          },
        }),
      })),
      findById: vi.fn((id) => ({
        lean: () => ({
          exec: async () => {
            if (id.toString() === freeCourseId) return sampleFreeCourse;
            if (id.toString() === proCourseId) return sampleProCourse;
            return null;
          },
        }),
      })),
    };

    const userModel: any = {
      findById: vi.fn(() => ({
        lean: () => ({
          exec: async () => ({ fullName: 'Nguyễn Minh An' }),
        }),
      })),
    };

    const certificatesService: any = {
      findByStudentAndCourse: vi.fn(async () =>
        issuedCertificateCount > 0
          ? { certificateCode: 'NC-2026-TESTCODE' }
          : null,
      ),
      issueForEnrollment: vi.fn(async () => {
        issuedCertificateCount += 1;
        return {
          id: new Types.ObjectId().toString(),
          certificateCode: 'NC-2026-TESTCODE',
          courseId: freeCourseId,
          courseTitle: sampleFreeCourse.title,
          instructorName: 'Nguyễn Minh An',
          studentName: 'Trần Văn Học Viên',
          issuedAt: new Date().toISOString(),
          qrCode: '/certificates/verify/NC-2026-TESTCODE',
          fileUrl: null,
          status: CertificateStatus.VALID,
        };
      }),
    };

    service = new EnrollmentsService(
      enrollmentModel,
      lessonProgressModel,
      quizAttemptModel,
      courseModel,
      userModel,
      certificatesService,
    );
  });

  it('cho phép học viên đăng ký khóa học FREE ngay lập tức và chỉ mở bài đầu tiên', async () => {
    const overview = await service.enrollCourse(studentId, freeCourseId);

    expect(overview.courseId).toBe(freeCourseId);
    expect(overview.status).toBe(EnrollmentStatus.LEARNING);
    expect(overview.progressPercent).toBe(0);
    expect(overview.lastLessonId).toBe(lesson1Id.toString());

    const lessons = overview.chapters[0]!.lessons;
    expect(lessons).toHaveLength(3);
    expect(lessons[0]!.status).toBe(LessonStatus.UNLOCKED);
    expect(lessons[1]!.status).toBe(LessonStatus.LOCKED);
    expect(lessons[2]!.status).toBe(LessonStatus.LOCKED);

    await expect(
      service.enrollCourse(studentId, freeCourseId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('chặn đăng ký trực tiếp khóa học PRO khi chưa qua luồng thanh toán', async () => {
    await expect(
      service.enrollCourse(studentId, proCourseId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('kiểm soát học tuần tự, làm trắc nghiệm 1 câu (100%) & nhiều câu (>=70%), và cấp chứng chỉ khi hoàn thành', async () => {
    await service.enrollCourse(studentId, freeCourseId);

    // 1. Không được xem bài 2 khi bài 1 chưa hoàn thành
    await expect(
      service.getLessonForLearning(
        studentId,
        freeCourseId,
        lesson2Id.toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // 2. Xem hết video bài 1 (không có quiz) -> tự động COMPLETED bài 1 và mở khóa bài 2
    const step1 = await service.updateLessonProgress(
      studentId,
      freeCourseId,
      lesson1Id.toString(),
      { lastPositionSec: 300, watchedFully: true },
    );
    expect(step1.status).toBe(LessonStatus.COMPLETED);
    expect(step1.unlockedNextLessonId).toBe(lesson2Id.toString());
    expect(step1.courseProgressPercent).toBe(33);

    // 3. Truy cập bài 2: mới mở khóa, chưa xem hết video nên chưa mở câu hỏi trắc nghiệm
    const lesson2BeforeWatch = await service.getLessonForLearning(
      studentId,
      freeCourseId,
      lesson2Id.toString(),
    );
    expect(lesson2BeforeWatch.quizUnlocked).toBe(false);
    expect(lesson2BeforeWatch.quizQuestions).toHaveLength(0);

    // Thử nộp quiz khi chưa xem hết video -> bị chặn BadRequestException
    await expect(
      service.submitLessonQuiz(studentId, freeCourseId, lesson2Id.toString(), {
        answers: [{ questionId: q1Id.toString(), selectedOption: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // 4. Đánh dấu đã xem hết video bài 2 -> mở câu hỏi trắc nghiệm nhưng chưa hoàn thành bài
    const step2Watch = await service.updateLessonProgress(
      studentId,
      freeCourseId,
      lesson2Id.toString(),
      { lastPositionSec: 300, watchedFully: true },
    );
    expect(step2Watch.status).toBe(LessonStatus.UNLOCKED);
    expect(step2Watch.quizUnlocked).toBe(true);

    // 5. Bài 2 có 1 câu hỏi -> chọn sai (0%) thì chưa qua, không lộ explanation, được làm lại
    const quiz2Wrong = await service.submitLessonQuiz(
      studentId,
      freeCourseId,
      lesson2Id.toString(),
      {
        answers: [{ questionId: q1Id.toString(), selectedOption: 0 }],
      },
    );
    expect(quiz2Wrong.passed).toBe(false);
    expect(quiz2Wrong.canRetry).toBe(true);
    expect(quiz2Wrong.results[0]!.explanation).toBeNull();
    expect(quiz2Wrong.lessonStatus).toBe(LessonStatus.UNLOCKED);

    // Chọn đúng (100%) -> qua bài 2, trả về explanation và mở bài 3
    const quiz2Right = await service.submitLessonQuiz(
      studentId,
      freeCourseId,
      lesson2Id.toString(),
      {
        answers: [{ questionId: q1Id.toString(), selectedOption: 1 }],
      },
    );
    expect(quiz2Right.passed).toBe(true);
    expect(quiz2Right.results[0]!.explanation).toContain('<h1>');
    expect(quiz2Right.lessonStatus).toBe(LessonStatus.COMPLETED);
    expect(quiz2Right.unlockedNextLessonId).toBe(lesson3Id.toString());
    expect(quiz2Right.courseProgressPercent).toBe(67);

    // 6. Bài 3 có 3 câu hỏi (cần >= 70% tức là đúng 3/3 vì 2/3 = 66.67% < 70%)
    await service.updateLessonProgress(
      studentId,
      freeCourseId,
      lesson3Id.toString(),
      { lastPositionSec: 300, watchedFully: true },
    );

    const quiz3TwoCorrect = await service.submitLessonQuiz(
      studentId,
      freeCourseId,
      lesson3Id.toString(),
      {
        answers: [
          { questionId: q2AId.toString(), selectedOption: 0 }, // đúng
          { questionId: q2BId.toString(), selectedOption: 1 }, // đúng
          { questionId: q2CId.toString(), selectedOption: 1 }, // sai
        ],
      },
    );
    expect(quiz3TwoCorrect.passed).toBe(false);
    expect(quiz3TwoCorrect.scorePercent).toBe(67);
    expect(quiz3TwoCorrect.requiredPassPercent).toBe(70);
    expect(quiz3TwoCorrect.certificate).toBeNull();

    // Làm lại đúng 3/3 (100% >= 70%) -> hoàn thành khóa học 100% và cấp chứng chỉ!
    const quiz3AllCorrect = await service.submitLessonQuiz(
      studentId,
      freeCourseId,
      lesson3Id.toString(),
      {
        answers: [
          { questionId: q2AId.toString(), selectedOption: 0 },
          { questionId: q2BId.toString(), selectedOption: 1 },
          { questionId: q2CId.toString(), selectedOption: 0 },
        ],
      },
    );
    expect(quiz3AllCorrect.passed).toBe(true);
    expect(quiz3AllCorrect.courseProgressPercent).toBe(100);
    expect(quiz3AllCorrect.enrollmentStatus).toBe(EnrollmentStatus.COMPLETED);
    expect(quiz3AllCorrect.certificate?.certificateCode).toBe(
      'NC-2026-TESTCODE',
    );
  });
});
