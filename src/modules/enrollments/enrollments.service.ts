import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import {
  EnrollmentStatus,
  LessonStatus,
} from '../../common/constants/learning.enum.js';
import { CertificatesService } from '../certificates/certificates.service.js';
import { CertificateResponseDto } from '../certificates/dto/certificate-response.dto.js';
import { Chapter, Course, Lesson } from '../courses/schemas/course.schema.js';
import { User } from '../users/schemas/user.schema.js';
import {
  CourseLearningOverviewDto,
  CurriculumChapterItemDto,
  EnrollmentStatusResponseDto,
  LessonLearningDetailDto,
  LessonProgressUpdateResponseDto,
  MyEnrolledCourseItemDto,
  QuizQuestionResultItemDto,
  SubmitQuizResponseDto,
} from './dto/enrollment-response.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import {
  MyCoursesQueryDto,
  UpdateLessonProgressDto,
} from './dto/update-lesson-progress.dto.js';
import {
  Enrollment,
  EnrollmentDocument,
} from './schemas/enrollment.schema.js';
import {
  LessonProgress,
  LessonProgressDocument,
} from './schemas/lesson-progress.schema.js';
import {
  QuizAttempt,
  QuizAttemptDocument,
} from './schemas/quiz-attempt.schema.js';

interface OrderedLessonEntry {
  chapter: Chapter;
  lesson: Lesson;
  hasQuiz: boolean;
  quizCount: number;
}

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function flattenOrderedLessons(course: Course): OrderedLessonEntry[] {
  const sortedChapters = [...(course.chapters ?? [])].sort(
    (a, b) => a.order - b.order || a._id.toString().localeCompare(b._id.toString()),
  );
  const result: OrderedLessonEntry[] = [];
  for (const chapter of sortedChapters) {
    const sortedLessons = [...(chapter.lessons ?? [])].sort(
      (a, b) => a.order - b.order || a._id.toString().localeCompare(b._id.toString()),
    );
    for (const lesson of sortedLessons) {
      const quizCount = lesson.quizQuestions?.length ?? 0;
      result.push({
        chapter,
        lesson,
        hasQuiz: quizCount > 0,
        quizCount,
      });
    }
  }
  return result;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(QuizAttempt.name)
    private readonly quizAttemptModel: Model<QuizAttemptDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly certificatesService: CertificatesService,
  ) {}

  /**
   * Học viên đăng ký khóa học FREE (tạo Enrollment và mở khóa bài học đầu tiên).
   * Với khóa học PRO, chặn đăng ký trực tiếp và yêu cầu đi qua luồng đơn hàng/thanh toán.
   */
  async enrollCourse(
    studentId: string,
    courseId: string,
  ): Promise<CourseLearningOverviewDto> {
    const course = await this.findApprovedCourseOrThrow(courseId);

    if (course.type === CourseType.PRO) {
      throw new ForbiddenException(
        'Khóa học Pro yêu cầu tạo đơn hàng và hoàn tất thanh toán trước khi vào học',
      );
    }

    const studentObjectId = new Types.ObjectId(studentId);
    const courseObjectId = new Types.ObjectId(courseId);

    const existing = await this.enrollmentModel
      .findOne({
        studentId: studentObjectId,
        courseId: courseObjectId,
      })
      .exec();

    if (existing) {
      throw new ConflictException('Bạn đã đăng ký khóa học này trước đó');
    }

    await this.initializeEnrollment(studentObjectId, courseObjectId, course);
    return this.getCourseLearning(studentId, courseId);
  }

  /**
   * Hàm nội bộ dùng cho module Orders/Payments gọi khi đơn hàng khóa PRO hoàn tất.
   */
  async createEnrollmentForCompletedOrder(
    studentId: string,
    courseId: string,
  ): Promise<CourseLearningOverviewDto> {
    const course = await this.findApprovedCourseOrThrow(courseId);
    const studentObjectId = new Types.ObjectId(studentId);
    const courseObjectId = new Types.ObjectId(courseId);

    const existing = await this.enrollmentModel
      .findOne({
        studentId: studentObjectId,
        courseId: courseObjectId,
      })
      .exec();

    if (!existing) {
      await this.initializeEnrollment(studentObjectId, courseObjectId, course);
    }

    return this.getCourseLearning(studentId, courseId);
  }

  async getEnrollmentStatus(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentStatusResponseDto> {
    if (!isValidObjectId(courseId) || !isValidObjectId(userId)) {
      return {
        enrolled: false,
        enrollmentId: null,
        status: null,
        progressPercent: 0,
        lastLessonId: null,
        enrolledAt: null,
        completedAt: null,
        certificateCode: null,
      };
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(courseId),
      })
      .exec();

    if (!enrollment) {
      return {
        enrolled: false,
        enrollmentId: null,
        status: null,
        progressPercent: 0,
        lastLessonId: null,
        enrolledAt: null,
        completedAt: null,
        certificateCode: null,
      };
    }

    const cert = await this.certificatesService.findByStudentAndCourse(
      userId,
      courseId,
    );

    return {
      enrolled: true,
      enrollmentId: enrollment._id.toString(),
      status: enrollment.status,
      progressPercent: enrollment.progressPercent,
      lastLessonId: enrollment.lastLessonId
        ? enrollment.lastLessonId.toString()
        : null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt
        ? enrollment.completedAt.toISOString()
        : null,
      certificateCode: cert?.certificateCode ?? null,
    };
  }

  async getMyCourses(
    studentId: string,
    query: MyCoursesQueryDto,
  ): Promise<MyEnrolledCourseItemDto[]> {
    const filter: Record<string, unknown> = {
      studentId: new Types.ObjectId(studentId),
    };
    if (query.status) {
      filter.status = query.status;
    }

    const enrollments = await this.enrollmentModel
      .find(filter)
      .sort({ updatedAt: -1, enrolledAt: -1 })
      .exec();

    const items: MyEnrolledCourseItemDto[] = [];
    for (const enrollment of enrollments) {
      const course = await this.courseModel
        .findById(enrollment.courseId)
        .lean()
        .exec();
      if (!course) continue;

      const [instructor, cert] = await Promise.all([
        this.userModel
          .findById(course.instructorId, { fullName: 1 })
          .lean()
          .exec(),
        this.certificatesService.findByStudentAndCourse(
          studentId,
          enrollment.courseId,
        ),
      ]);

      items.push({
        enrollmentId: enrollment._id.toString(),
        courseId: enrollment.courseId.toString(),
        title: course.title,
        thumbnail: course.thumbnail ?? null,
        type: course.type,
        level: course.level,
        totalLessons: course.totalLessons,
        totalDuration: course.totalDuration,
        instructorName: instructor?.fullName ?? 'Giảng viên NextCode',
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        lastLessonId: enrollment.lastLessonId
          ? enrollment.lastLessonId.toString()
          : null,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt
          ? enrollment.completedAt.toISOString()
          : null,
        certificateCode: cert?.certificateCode ?? null,
      });
    }

    return items;
  }

  async getCourseLearning(
    studentId: string,
    courseId: string,
  ): Promise<CourseLearningOverviewDto> {
    const { course, enrollment } = await this.findEnrollmentAndCourseOrThrow(
      studentId,
      courseId,
    );
    const orderedLessons = flattenOrderedLessons(course);
    const progressMap = await this.ensureLessonProgressMap(
      enrollment,
      orderedLessons,
    );

    const sortedChapters = [...(course.chapters ?? [])].sort(
      (a, b) => a.order - b.order || a._id.toString().localeCompare(b._id.toString()),
    );

    let completedLessons = 0;
    const chapters: CurriculumChapterItemDto[] = sortedChapters.map(
      (chapter) => {
        const sortedLessons = [...(chapter.lessons ?? [])].sort(
          (a, b) =>
            a.order - b.order || a._id.toString().localeCompare(b._id.toString()),
        );
        return {
          id: chapter._id.toString(),
          title: chapter.title,
          order: chapter.order,
          lessons: sortedLessons.map((lesson) => {
            const prog = progressMap.get(lesson._id.toString())!;
            if (prog.status === LessonStatus.COMPLETED) {
              completedLessons += 1;
            }
            const quizCount = lesson.quizQuestions?.length ?? 0;
            return {
              id: lesson._id.toString(),
              title: lesson.title,
              order: lesson.order,
              duration: lesson.duration,
              hasQuiz: quizCount > 0,
              quizCount,
              status: prog.status,
              lastPositionSec: prog.lastPositionSec,
              watchedFully: prog.watchedFully,
              quizPassed: prog.quizPassed,
            };
          }),
        };
      },
    );

    let certificate: CertificateResponseDto | null = null;
    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      certificate = await this.certificatesService.issueForEnrollment(
        studentId,
        courseId,
      );
    }

    return {
      enrollmentId: enrollment._id.toString(),
      courseId: course._id.toString(),
      courseTitle: course.title,
      courseType: course.type,
      status: enrollment.status,
      progressPercent: enrollment.progressPercent,
      completedLessons,
      totalLessons: orderedLessons.length,
      lastLessonId: enrollment.lastLessonId
        ? enrollment.lastLessonId.toString()
        : orderedLessons[0]?.lesson._id.toString() ?? null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt
        ? enrollment.completedAt.toISOString()
        : null,
      certificate,
      chapters,
    };
  }

  async getLessonForLearning(
    studentId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonLearningDetailDto> {
    if (!isValidObjectId(lessonId)) {
      throw new NotFoundException('Không tìm thấy bài giảng');
    }

    const { course, enrollment } = await this.findEnrollmentAndCourseOrThrow(
      studentId,
      courseId,
    );
    const orderedLessons = flattenOrderedLessons(course);
    const progressMap = await this.ensureLessonProgressMap(
      enrollment,
      orderedLessons,
    );

    const lessonIndex = orderedLessons.findIndex(
      (entry) => entry.lesson._id.toString() === lessonId,
    );
    if (lessonIndex === -1) {
      throw new NotFoundException('Không tìm thấy bài giảng trong khóa học này');
    }

    const entry = orderedLessons[lessonIndex]!;
    const progress = progressMap.get(lessonId)!;

    if (progress.status === LessonStatus.LOCKED) {
      throw new ForbiddenException(
        'Bài học này đang bị khóa. Bạn cần hoàn thành bài học trước đó để mở khóa.',
      );
    }

    // Lưu lại bài đang học dở để lần sau học viên vào tiếp tục
    if (enrollment.lastLessonId?.toString() !== lessonId) {
      enrollment.lastLessonId = entry.lesson._id;
      await enrollment.save();
    }

    const quizCount = entry.quizCount;
    const hasQuiz = entry.hasQuiz;
    const requiredPassPercent = quizCount <= 1 ? 100 : 70;
    const quizUnlocked = hasQuiz && progress.watchedFully;
    const quizLockedReason = !hasQuiz
      ? null
      : progress.watchedFully
        ? null
        : 'Vui lòng xem hết video bài giảng trước khi làm câu hỏi trắc nghiệm';

    const previousEntry = lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : null;
    const nextEntry =
      lessonIndex + 1 < orderedLessons.length
        ? orderedLessons[lessonIndex + 1]
        : null;
    const nextProgress = nextEntry
      ? progressMap.get(nextEntry.lesson._id.toString())
      : null;

    return {
      id: entry.lesson._id.toString(),
      chapterId: entry.chapter._id.toString(),
      chapterTitle: entry.chapter.title,
      title: entry.lesson.title,
      order: entry.lesson.order,
      videoUrl: entry.lesson.videoUrl,
      duration: entry.lesson.duration,
      note: entry.lesson.note ?? null,
      summary: entry.lesson.summary ?? null,
      hasQuiz,
      quizCount,
      requiredPassPercent,
      status: progress.status,
      lastPositionSec: progress.lastPositionSec,
      watchedFully: progress.watchedFully,
      quizPassed: progress.quizPassed,
      quizUnlocked,
      quizLockedReason,
      quizQuestions: quizUnlocked
        ? (entry.lesson.quizQuestions ?? []).map((q) => ({
            id: q._id.toString(),
            content: q.content,
            options: q.options,
            correctOption: progress.quizPassed ? q.correctOption : null,
            explanation: progress.quizPassed ? q.explanation : null,
          }))
        : [],
      previousLessonId: previousEntry
        ? previousEntry.lesson._id.toString()
        : null,
      nextLessonId: nextEntry ? nextEntry.lesson._id.toString() : null,
      nextLessonUnlocked: nextProgress
        ? nextProgress.status !== LessonStatus.LOCKED
        : false,
    };
  }

  async updateLessonProgress(
    studentId: string,
    courseId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ): Promise<LessonProgressUpdateResponseDto> {
    if (!isValidObjectId(lessonId)) {
      throw new NotFoundException('Không tìm thấy bài giảng');
    }

    const { course, enrollment } = await this.findEnrollmentAndCourseOrThrow(
      studentId,
      courseId,
    );
    const orderedLessons = flattenOrderedLessons(course);
    const progressMap = await this.ensureLessonProgressMap(
      enrollment,
      orderedLessons,
    );

    const lessonIndex = orderedLessons.findIndex(
      (entry) => entry.lesson._id.toString() === lessonId,
    );
    if (lessonIndex === -1) {
      throw new NotFoundException('Không tìm thấy bài giảng trong khóa học này');
    }

    const entry = orderedLessons[lessonIndex]!;
    const progress = progressMap.get(lessonId)!;

    if (progress.status === LessonStatus.LOCKED) {
      throw new ForbiddenException(
        'Bài học này đang bị khóa. Bạn cần hoàn thành bài học trước đó trước.',
      );
    }

    const maxDuration = entry.lesson.duration;
    const clampedPosition =
      maxDuration > 0
        ? Math.min(dto.lastPositionSec, maxDuration)
        : dto.lastPositionSec;

    progress.lastPositionSec = Math.max(progress.lastPositionSec, clampedPosition);
    enrollment.lastLessonId = entry.lesson._id;

    const reachedEndByPosition =
      maxDuration > 0 && clampedPosition >= maxDuration;
    if (dto.watchedFully === true || reachedEndByPosition) {
      progress.watchedFully = true;
      if (maxDuration > 0) {
        progress.lastPositionSec = maxDuration;
      }
    }

    let unlockedNextLessonId: string | null = null;
    let certificate: CertificateResponseDto | null = null;

    // Nếu bài học không có câu hỏi trắc nghiệm, xem hết video là hoàn thành bài ngay
    if (progress.watchedFully && !entry.hasQuiz) {
      progress.quizPassed = true;
      const advanceResult = await this.completeLessonAndAdvance(
        studentId,
        courseId,
        enrollment,
        orderedLessons,
        progressMap,
        lessonIndex,
      );
      unlockedNextLessonId = advanceResult.unlockedNextLessonId;
      certificate = advanceResult.certificate;
    } else {
      await Promise.all([progress.save(), enrollment.save()]);
      if (enrollment.status === EnrollmentStatus.COMPLETED) {
        certificate = await this.certificatesService.issueForEnrollment(
          studentId,
          courseId,
        );
      }
    }

    return {
      lessonId,
      status: progress.status,
      lastPositionSec: progress.lastPositionSec,
      watchedFully: progress.watchedFully,
      quizPassed: progress.quizPassed,
      quizUnlocked: entry.hasQuiz && progress.watchedFully,
      unlockedNextLessonId,
      courseProgressPercent: enrollment.progressPercent,
      enrollmentStatus: enrollment.status,
      certificate,
    };
  }

  async submitLessonQuiz(
    studentId: string,
    courseId: string,
    lessonId: string,
    dto: SubmitQuizDto,
  ): Promise<SubmitQuizResponseDto> {
    if (!isValidObjectId(lessonId)) {
      throw new NotFoundException('Không tìm thấy bài giảng');
    }

    const { course, enrollment } = await this.findEnrollmentAndCourseOrThrow(
      studentId,
      courseId,
    );
    const orderedLessons = flattenOrderedLessons(course);
    const progressMap = await this.ensureLessonProgressMap(
      enrollment,
      orderedLessons,
    );

    const lessonIndex = orderedLessons.findIndex(
      (entry) => entry.lesson._id.toString() === lessonId,
    );
    if (lessonIndex === -1) {
      throw new NotFoundException('Không tìm thấy bài giảng trong khóa học này');
    }

    const entry = orderedLessons[lessonIndex]!;
    const progress = progressMap.get(lessonId)!;

    if (progress.status === LessonStatus.LOCKED) {
      throw new ForbiddenException(
        'Bài học này đang bị khóa. Bạn cần hoàn thành bài học trước đó trước.',
      );
    }

    const questions = entry.lesson.quizQuestions ?? [];
    if (questions.length === 0) {
      throw new BadRequestException('Bài giảng này không có câu hỏi trắc nghiệm');
    }

    if (!progress.watchedFully) {
      throw new BadRequestException(
        'Vui lòng xem hết video bài giảng trước khi làm câu hỏi trắc nghiệm',
      );
    }

    const answerMap = new Map<string, number>();
    for (const item of dto.answers) {
      const qId = item.questionId.toLowerCase();
      if (answerMap.has(qId)) {
        throw new BadRequestException(
          `Câu hỏi ${item.questionId} bị gửi trùng lặp trong danh sách trả lời`,
        );
      }
      answerMap.set(qId, item.selectedOption);
    }

    if (answerMap.size !== questions.length) {
      throw new BadRequestException(
        `Cần trả lời đầy đủ tất cả ${questions.length} câu hỏi trắc nghiệm của bài giảng`,
      );
    }

    const studentObjectId = new Types.ObjectId(studentId);
    const now = new Date();
    const attemptsToInsert: Array<{
      studentId: Types.ObjectId;
      questionId: Types.ObjectId;
      selectedOption: number;
      isCorrect: boolean;
      attemptedAt: Date;
    }> = [];
    const results: QuizQuestionResultItemDto[] = [];
    let correctCount = 0;

    for (const question of questions) {
      const qId = question._id.toString().toLowerCase();
      const selectedOption = answerMap.get(qId);
      if (selectedOption === undefined) {
        throw new BadRequestException(
          `Thiếu câu trả lời cho câu hỏi ${question._id.toString()}`,
        );
      }
      if (selectedOption < 0 || selectedOption >= question.options.length) {
        throw new BadRequestException(
          `Đáp án đã chọn cho câu hỏi ${question._id.toString()} nằm ngoài phạm vi lựa chọn`,
        );
      }

      const isCorrect = selectedOption === question.correctOption;
      if (isCorrect) {
        correctCount += 1;
      }

      attemptsToInsert.push({
        studentId: studentObjectId,
        questionId: question._id,
        selectedOption,
        isCorrect,
        attemptedAt: now,
      });

      results.push({
        questionId: question._id.toString(),
        selectedOption,
        isCorrect,
        // Chỉ khi trả lời đúng mới hiển thị lời giải thích vì sao đáp án đó đúng
        explanation: isCorrect ? question.explanation : null,
      });
    }

    await this.quizAttemptModel.insertMany(attemptsToInsert);

    const totalQuestions = questions.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    // Quy tắc chấm: 1 câu yêu cầu đúng 100%, nhiều câu (>= 2) yêu cầu đúng từ 70% trở lên
    const requiredPassPercent = totalQuestions === 1 ? 100 : 70;
    const passed =
      totalQuestions === 1
        ? correctCount === 1
        : correctCount / totalQuestions >= 0.7;

    enrollment.lastLessonId = entry.lesson._id;
    let unlockedNextLessonId: string | null = null;
    let certificate: CertificateResponseDto | null = null;

    if (passed) {
      progress.quizPassed = true;
      const advanceResult = await this.completeLessonAndAdvance(
        studentId,
        courseId,
        enrollment,
        orderedLessons,
        progressMap,
        lessonIndex,
      );
      unlockedNextLessonId = advanceResult.unlockedNextLessonId;
      certificate = advanceResult.certificate;
    } else {
      await enrollment.save();
    }

    return {
      lessonId,
      totalQuestions,
      correctCount,
      scorePercent,
      requiredPassPercent,
      passed,
      canRetry: !passed,
      lessonStatus: progress.status,
      unlockedNextLessonId,
      courseProgressPercent: enrollment.progressPercent,
      enrollmentStatus: enrollment.status,
      certificate,
      results,
    };
  }

  private async initializeEnrollment(
    studentObjectId: Types.ObjectId,
    courseObjectId: Types.ObjectId,
    course: Course,
  ): Promise<EnrollmentDocument> {
    const orderedLessons = flattenOrderedLessons(course);
    if (orderedLessons.length === 0) {
      throw new BadRequestException(
        'Khóa học chưa có bài giảng nào để bắt đầu học',
      );
    }

    const firstLessonId = orderedLessons[0]!.lesson._id;
    const enrollment = await this.enrollmentModel.create({
      studentId: studentObjectId,
      courseId: courseObjectId,
      enrolledAt: new Date(),
      progressPercent: 0,
      status: EnrollmentStatus.LEARNING,
      completedAt: null,
      lastLessonId: firstLessonId,
    });

    const progressDocs = orderedLessons.map((entry, index) => ({
      enrollmentId: enrollment._id,
      lessonId: entry.lesson._id,
      status: index === 0 ? LessonStatus.UNLOCKED : LessonStatus.LOCKED,
      lastPositionSec: 0,
      watchedFully: false,
      quizPassed: false,
    }));

    await this.lessonProgressModel.insertMany(progressDocs);
    return enrollment;
  }

  private async completeLessonAndAdvance(
    studentId: string,
    courseId: string,
    enrollment: EnrollmentDocument,
    orderedLessons: OrderedLessonEntry[],
    progressMap: Map<string, LessonProgressDocument>,
    lessonIndex: number,
  ): Promise<{
    unlockedNextLessonId: string | null;
    certificate: CertificateResponseDto | null;
  }> {
    const currentEntry = orderedLessons[lessonIndex]!;
    const currentProgress = progressMap.get(
      currentEntry.lesson._id.toString(),
    )!;

    currentProgress.status = LessonStatus.COMPLETED;
    await currentProgress.save();

    let unlockedNextLessonId: string | null = null;
    const nextEntry =
      lessonIndex + 1 < orderedLessons.length
        ? orderedLessons[lessonIndex + 1]
        : null;

    if (nextEntry) {
      const nextProgress = progressMap.get(nextEntry.lesson._id.toString());
      if (nextProgress && nextProgress.status === LessonStatus.LOCKED) {
        nextProgress.status = LessonStatus.UNLOCKED;
        await nextProgress.save();
        unlockedNextLessonId = nextEntry.lesson._id.toString();
      }
      enrollment.lastLessonId = nextEntry.lesson._id;
    }

    const totalLessons = orderedLessons.length;
    let completedCount = 0;
    for (const entry of orderedLessons) {
      const p = progressMap.get(entry.lesson._id.toString());
      if (p?.status === LessonStatus.COMPLETED) {
        completedCount += 1;
      }
    }

    enrollment.progressPercent =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;

    let certificate: CertificateResponseDto | null = null;
    if (completedCount === totalLessons && totalLessons > 0) {
      enrollment.progressPercent = 100;
      if (enrollment.status !== EnrollmentStatus.COMPLETED) {
        enrollment.status = EnrollmentStatus.COMPLETED;
        enrollment.completedAt = new Date();
      }
      await enrollment.save();
      certificate = await this.certificatesService.issueForEnrollment(
        studentId,
        courseId,
      );
    } else {
      await enrollment.save();
    }

    return { unlockedNextLessonId, certificate };
  }

  private async findApprovedCourseOrThrow(
    courseId: string,
  ): Promise<Course & { _id: Types.ObjectId }> {
    if (!isValidObjectId(courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const course = await this.courseModel
      .findOne({
        _id: new Types.ObjectId(courseId),
        status: CourseStatus.APPROVED,
      })
      .lean()
      .exec();

    if (!course) {
      throw new NotFoundException(
        'Khóa học không tồn tại hoặc chưa được duyệt công khai',
      );
    }

    return course as Course & { _id: Types.ObjectId };
  }

  private async findEnrollmentAndCourseOrThrow(
    studentId: string,
    courseId: string,
  ): Promise<{
    course: Course & { _id: Types.ObjectId };
    enrollment: EnrollmentDocument;
  }> {
    if (!isValidObjectId(courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const [course, enrollment] = await Promise.all([
      this.courseModel
        .findOne({
          _id: new Types.ObjectId(courseId),
          status: CourseStatus.APPROVED,
        })
        .lean()
        .exec(),
      this.enrollmentModel
        .findOne({
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId),
        })
        .exec(),
    ]);

    if (!course) {
      throw new NotFoundException(
        'Khóa học không tồn tại hoặc chưa được duyệt công khai',
      );
    }

    if (!enrollment) {
      throw new ForbiddenException(
        'Bạn chưa đăng ký khóa học này nên không thể truy cập nội dung bài giảng',
      );
    }

    return {
      course: course as Course & { _id: Types.ObjectId },
      enrollment,
    };
  }

  private async ensureLessonProgressMap(
    enrollment: EnrollmentDocument,
    orderedLessons: OrderedLessonEntry[],
  ): Promise<Map<string, LessonProgressDocument>> {
    const existingList = await this.lessonProgressModel
      .find({ enrollmentId: enrollment._id })
      .exec();

    const map = new Map<string, LessonProgressDocument>();
    for (const item of existingList) {
      map.set(item.lessonId.toString(), item);
    }

    for (let i = 0; i < orderedLessons.length; i += 1) {
      const lessonId = orderedLessons[i]!.lesson._id;
      const key = lessonId.toString();
      if (!map.has(key)) {
        const prevEntry = i > 0 ? orderedLessons[i - 1] : null;
        const prevProgress = prevEntry
          ? map.get(prevEntry.lesson._id.toString())
          : null;
        const shouldUnlock =
          i === 0 || prevProgress?.status === LessonStatus.COMPLETED;

        const created = await this.lessonProgressModel.create({
          enrollmentId: enrollment._id,
          lessonId,
          status: shouldUnlock ? LessonStatus.UNLOCKED : LessonStatus.LOCKED,
          lastPositionSec: 0,
          watchedFully: false,
          quizPassed: false,
        });
        map.set(key, created);
      }
    }

    return map;
  }
}

