import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, PipelineStage, Types } from 'mongoose';
import { Role } from '../../common/constants/roles.enum.js';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import { UsersService } from '../users/users.service.js';
import {
  CreateChapterDto,
  CreateLessonDto,
  CreateManageCourseDto,
  CreateQuizQuestionDto,
  ManageCourseQueryDto,
  ManageCourseSort,
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
import { recalculateCourseTotals } from './course-totals.js';
import { getCourseReadiness } from './manage-course-readiness.js';
import {
  ManageCourseActor,
  ManageCourseAggregateRecord,
  ManageCourseItemAggregateRecord,
  serializeManageCourseDetail,
  serializeManageCourseItem,
} from './manage-course.serializer.js';
import { Category } from './schemas/category.schema.js';
import { Chapter, Course, Lesson } from './schemas/course.schema.js';

interface ManageCourseListAggregate {
  items: ManageCourseItemAggregateRecord[];
  totalCount: Array<{ total: number }>;
}

const instructorLookup: PipelineStage.FacetPipelineStage[] = [
  {
    $lookup: {
      from: 'users',
      localField: 'instructorId',
      foreignField: '_id',
      pipeline: [{ $project: { fullName: 1, avatar: 1 } }],
      as: 'instructor',
    },
  },
  { $unwind: '$instructor' },
  {
    $lookup: {
      from: 'categories',
      localField: 'categoryId',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1 } }],
      as: 'category',
    },
  },
  { $unwind: '$category' },
];

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function idString(id: Types.ObjectId | string): string {
  return (typeof id === 'string' ? id : id.toString()).toLowerCase();
}

function assertRole(actor: ManageCourseActor): void {
  if (actor.role !== Role.ADMIN && actor.role !== Role.INSTRUCTOR) {
    throw new ForbiddenException('Chỉ giảng viên hoặc quản trị viên được quản lý khóa học');
  }
  if (
    actor.role === Role.INSTRUCTOR &&
    !Types.ObjectId.isValid(actor.userId)
  ) {
    throw new ForbiddenException('Thông tin giảng viên không hợp lệ');
  }
}

function assertPricing(type: CourseType, price: number, discountPrice: number | null): void {
  if (type === CourseType.FREE && (price !== 0 || discountPrice !== null)) {
    throw new BadRequestException('Khóa học FREE phải có giá bằng 0 và không có giá ưu đãi');
  }
  if (type === CourseType.PRO) {
    if (price <= 0) {
      throw new BadRequestException('Khóa học PRO phải có giá lớn hơn 0');
    }
    if (
      discountPrice !== null &&
      (discountPrice <= 0 || discountPrice >= price)
    ) {
      throw new BadRequestException('Giá ưu đãi phải lớn hơn 0 và thấp hơn giá gốc');
    }
  }
}

function assertNoQuizNotesForFree(
  type: CourseType,
  fields: { note?: string | null; summary?: string | null },
): void {
  if (
    type === CourseType.FREE &&
    (fields.note !== undefined || fields.summary !== undefined)
  ) {
    throw new BadRequestException('Ghi chép và tóm tắt chỉ được dùng cho khóa học PRO');
  }
}

@Injectable()
export class CourseManageService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    private readonly usersService: UsersService,
  ) {}

  async listCourses(
    query: ManageCourseQueryDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseListDto> {
    assertRole(actor);
    const match: Record<string, unknown> = {};

    if (query.keyword) {
      match.title = {
        $regex: escapeRegularExpression(query.keyword.trim()),
        $options: 'i',
      };
    }
    if (query.status) match.status = query.status;
    if (query.type) match.type = query.type;
    if (query.categoryId) match.categoryId = new Types.ObjectId(query.categoryId);
    if (actor.role === Role.INSTRUCTOR) {
      match.instructorId = new Types.ObjectId(actor.userId);
    } else if (query.instructorId) {
      match.instructorId = new Types.ObjectId(query.instructorId);
    }

    const sort: Record<string, 1 | -1> =
      query.sort === ManageCourseSort.NEWEST
        ? { createdAt: -1 as const, _id: -1 as const }
        : query.sort === ManageCourseSort.TITLE_ASC
          ? { title: 1 as const, _id: 1 as const }
          : { updatedAt: -1 as const, createdAt: -1 as const, _id: -1 as const };
    const offset = (query.page - 1) * query.limit;
    const [result] = await this.courseModel
      .aggregate<ManageCourseListAggregate>([
        { $match: match },
        {
          $facet: {
            items: [
              { $sort: sort },
              { $skip: offset },
              { $limit: query.limit },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  thumbnail: 1,
                  type: 1,
                  level: 1,
                  price: 1,
                  discountPrice: 1,
                  avgRating: 1,
                  totalChapters: 1,
                  totalLessons: 1,
                  totalDuration: 1,
                  status: 1,
                  rejectReason: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  instructorId: 1,
                  categoryId: 1,
                },
              },
              ...instructorLookup,
            ],
            totalCount: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    const total = result?.totalCount[0]?.total ?? 0;

    return {
      items: (result?.items ?? []).map((course) =>
        serializeManageCourseItem(course, actor),
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  async getActiveInstructors(
    actor: ManageCourseActor,
  ): Promise<ManageInstructorOptionDto[]> {
    assertRole(actor);
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ quản trị viên được xem danh sách giảng viên');
    }
    return this.usersService.findActiveInstructors();
  }

  async createCourse(
    input: CreateManageCourseDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    assertRole(actor);
    assertPricing(input.type, input.price, input.discountPrice ?? null);
    await this.assertCategoryExists(input.categoryId);

    let instructorId = actor.userId;
    if (actor.role === Role.ADMIN) {
      if (!input.instructorId) {
        throw new BadRequestException('Quản trị viên phải chọn giảng viên cho khóa học');
      }
      if (!(await this.usersService.isActiveInstructor(input.instructorId))) {
        throw new BadRequestException('Giảng viên không tồn tại hoặc không ở trạng thái hoạt động');
      }
      instructorId = input.instructorId;
    }

    const course = await this.courseModel.create({
      title: input.title,
      description: input.description,
      type: input.type,
      level: input.level,
      categoryId: new Types.ObjectId(input.categoryId),
      instructorId: new Types.ObjectId(instructorId),
      targetAudience: input.targetAudience,
      learningOutcomes: [...input.learningOutcomes],
      requirements: input.requirements,
      price: input.price,
      discountPrice: input.discountPrice ?? null,
      thumbnail: input.thumbnail ?? null,
      status: CourseStatus.DRAFT,
      rejectReason: null,
      chapters: [],
    });
    return this.getCourse(course._id.toString(), actor);
  }

  async getCourse(
    id: string,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findCourseForActor(id, actor);
    const [aggregateCourse] = await this.courseModel
      .aggregate<ManageCourseAggregateRecord>([
        { $match: { _id: course._id } },
        ...instructorLookup,
      ])
      .exec();

    if (!aggregateCourse) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }
    return serializeManageCourseDetail(aggregateCourse, actor);
  }

  async updateCourse(
    id: string,
    input: UpdateManageCourseDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(id, actor);
    const nextType = input.type ?? course.type;
    let nextPrice = input.price ?? course.price;
    let nextDiscountPrice =
      input.discountPrice === undefined
        ? course.discountPrice
        : input.discountPrice;

    if (input.type !== undefined && input.type !== course.type) {
      if (course.status !== CourseStatus.DRAFT) {
        throw new ConflictException('Chỉ được đổi loại khóa học khi khóa đang ở trạng thái nháp');
      }
      if (nextType === CourseType.FREE) {
        nextPrice = 0;
        nextDiscountPrice = null;
      } else if (input.price === undefined || input.price <= 0) {
        throw new BadRequestException('Khi đổi sang PRO, request phải kèm giá lớn hơn 0');
      }
    }
    assertPricing(nextType, nextPrice, nextDiscountPrice ?? null);

    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    if (input.title !== undefined) course.title = input.title;
    if (input.description !== undefined) course.description = input.description;
    if (input.type !== undefined) course.type = input.type;
    if (input.level !== undefined) course.level = input.level;
    if (input.categoryId !== undefined) {
      course.categoryId = new Types.ObjectId(input.categoryId);
    }
    if (input.targetAudience !== undefined) {
      course.targetAudience = input.targetAudience;
    }
    if (input.learningOutcomes !== undefined) {
      course.learningOutcomes = [...input.learningOutcomes];
    }
    if (input.requirements !== undefined) course.requirements = input.requirements;
    if (input.price !== undefined || nextType === CourseType.FREE) {
      course.price = nextPrice;
    }
    if (input.discountPrice !== undefined || nextType === CourseType.FREE) {
      course.discountPrice = nextDiscountPrice ?? null;
    }
    if (input.thumbnail !== undefined) course.thumbnail = input.thumbnail;

    if (input.type !== undefined && nextType === CourseType.FREE) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          lesson.note = null;
          lesson.summary = null;
        }
      }
    }

    await course.save();
    return this.getCourse(id, actor);
  }

  async deleteCourse(
    id: string,
    actor: ManageCourseActor,
  ): Promise<{ message: string }> {
    const course = await this.findCourseForActor(id, actor);
    this.assertCanDelete(course, actor);
    const filter: Record<string, unknown> = {
      _id: course._id,
      status: course.status,
    };
    if (actor.role === Role.INSTRUCTOR) {
      filter.instructorId = new Types.ObjectId(actor.userId);
    }

    // learning-free/orders-payment must check existing enrollments and orders before enabling deletion.
    const result = await this.courseModel.deleteOne(filter).exec();
    if (result.deletedCount !== 1) {
      throw new ConflictException('Trạng thái khóa học đã thay đổi; vui lòng tải lại');
    }
    return { message: 'Đã xóa khóa học' };
  }

  async submitCourse(id: string, actor: ManageCourseActor): Promise<ManageCourseDetailDto> {
    return this.transitionCourse(id, actor, 'submit');
  }

  async withdrawCourse(id: string, actor: ManageCourseActor): Promise<ManageCourseDetailDto> {
    return this.transitionCourse(id, actor, 'withdraw');
  }

  async approveCourse(id: string, actor: ManageCourseActor): Promise<ManageCourseDetailDto> {
    return this.transitionCourse(id, actor, 'approve');
  }

  async rejectCourse(
    id: string,
    input: RejectManageCourseDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    return this.transitionCourse(id, actor, 'reject', input.reason.trim());
  }

  async hideCourse(id: string, actor: ManageCourseActor): Promise<ManageCourseDetailDto> {
    return this.transitionCourse(id, actor, 'hide');
  }

  async addChapter(
    courseId: string,
    input: CreateChapterDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    if (course.chapters.length >= 50) {
      throw new BadRequestException('Mỗi khóa học được có tối đa 50 chương');
    }
    course.chapters.push({
      _id: new Types.ObjectId(),
      title: input.title,
      order: course.chapters.length + 1,
      lessons: [],
    });
    return this.saveAndReturn(course, actor, true);
  }

  async updateChapter(
    courseId: string,
    chapterId: string,
    input: UpdateChapterDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    if (input.title === undefined) {
      throw new BadRequestException('Cần cung cấp tên chương để cập nhật');
    }
    const course = await this.findEditableCourse(courseId, actor);
    const chapter = this.findChapter(course, chapterId);
    chapter.title = input.title;
    return this.saveAndReturn(course, actor);
  }

  async deleteChapter(
    courseId: string,
    chapterId: string,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    const chapterIndex = course.chapters.findIndex(
      (chapter) => idString(chapter._id) === chapterId.toLowerCase(),
    );
    if (chapterIndex < 0) throw new NotFoundException('Không tìm thấy chương');
    course.chapters.splice(chapterIndex, 1);
    course.chapters.forEach((chapter, index) => {
      chapter.order = index + 1;
    });
    return this.saveAndReturn(course, actor, true);
  }

  async reorderChapters(
    courseId: string,
    input: ReorderChaptersDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    this.assertExactReorder(
      course.chapters.map((chapter) => idString(chapter._id)),
      input.chapterIds,
      'chương',
    );
    const byId = new Map(
      course.chapters.map((chapter) => [idString(chapter._id), chapter]),
    );
    course.chapters = input.chapterIds.map((id, index) => {
      const chapter = byId.get(id.toLowerCase());
      if (!chapter) throw new BadRequestException('Danh sách chương không hợp lệ');
      chapter.order = index + 1;
      return chapter;
    });
    return this.saveAndReturn(course, actor, true);
  }

  async addLesson(
    courseId: string,
    chapterId: string,
    input: CreateLessonDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    assertNoQuizNotesForFree(course.type, input);
    const chapter = this.findChapter(course, chapterId);
    if (chapter.lessons.length >= 50) {
      throw new BadRequestException('Mỗi chương được có tối đa 50 bài giảng');
    }
    chapter.lessons.push({
      _id: new Types.ObjectId(),
      title: input.title,
      order: chapter.lessons.length + 1,
      videoUrl: input.videoUrl,
      duration: input.duration,
      note: input.note ?? null,
      summary: input.summary ?? null,
      quizQuestions: [],
      hasQuiz: false,
    });
    return this.saveAndReturn(course, actor, true);
  }

  async updateLesson(
    courseId: string,
    chapterId: string,
    lessonId: string,
    input: UpdateLessonDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new BadRequestException('Cần cung cấp ít nhất một trường để cập nhật bài giảng');
    }
    const course = await this.findEditableCourse(courseId, actor);
    assertNoQuizNotesForFree(course.type, input);
    const lesson = this.findLesson(course, chapterId, lessonId);
    if (input.title !== undefined) lesson.title = input.title;
    if (input.videoUrl !== undefined) lesson.videoUrl = input.videoUrl;
    if (input.duration !== undefined) lesson.duration = input.duration;
    if (input.note !== undefined) lesson.note = input.note;
    if (input.summary !== undefined) lesson.summary = input.summary;
    return this.saveAndReturn(course, actor, input.duration !== undefined);
  }

  async deleteLesson(
    courseId: string,
    chapterId: string,
    lessonId: string,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    const chapter = this.findChapter(course, chapterId);
    const lessonIndex = chapter.lessons.findIndex(
      (lesson) => idString(lesson._id) === lessonId.toLowerCase(),
    );
    if (lessonIndex < 0) throw new NotFoundException('Không tìm thấy bài giảng');
    chapter.lessons.splice(lessonIndex, 1);
    chapter.lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    return this.saveAndReturn(course, actor, true);
  }

  async reorderLessons(
    courseId: string,
    chapterId: string,
    input: ReorderLessonsDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    const chapter = this.findChapter(course, chapterId);
    this.assertExactReorder(
      chapter.lessons.map((lesson) => idString(lesson._id)),
      input.lessonIds,
      'bài giảng',
    );
    const byId = new Map(
      chapter.lessons.map((lesson) => [idString(lesson._id), lesson]),
    );
    chapter.lessons = input.lessonIds.map((id, index) => {
      const lesson = byId.get(id.toLowerCase());
      if (!lesson) throw new BadRequestException('Danh sách bài giảng không hợp lệ');
      lesson.order = index + 1;
      return lesson;
    });
    return this.saveAndReturn(course, actor, true);
  }

  async addQuizQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    input: CreateQuizQuestionDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    const lesson = this.findLesson(course, chapterId, lessonId);
    const quizQuestions = lesson.quizQuestions ?? [];
    if (quizQuestions.length >= 10) {
      throw new BadRequestException('Mỗi bài giảng được có tối đa 10 câu trắc nghiệm');
    }
    this.assertValidQuestion(input);
    quizQuestions.push({
      _id: new Types.ObjectId(),
      content: input.content,
      options: [...input.options],
      correctOption: input.correctOption,
      explanation: input.explanation,
    });
    lesson.quizQuestions = quizQuestions;
    lesson.hasQuiz = quizQuestions.length > 0;
    return this.saveAndReturn(course, actor);
  }

  async updateQuizQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    questionId: string,
    input: UpdateQuizQuestionDto,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new BadRequestException('Cần cung cấp ít nhất một trường để cập nhật câu hỏi');
    }
    const course = await this.findEditableCourse(courseId, actor);
    const lesson = this.findLesson(course, chapterId, lessonId);
    const quizQuestions = lesson.quizQuestions ?? [];
    const question = quizQuestions.find(
      (item) => idString(item._id) === questionId.toLowerCase(),
    );
    if (!question) throw new NotFoundException('Không tìm thấy câu trắc nghiệm');

    const updatedQuestion = {
      content: input.content ?? question.content,
      options: input.options ?? question.options,
      correctOption: input.correctOption ?? question.correctOption,
      explanation: input.explanation ?? question.explanation,
    };
    this.assertValidQuestion(updatedQuestion);
    question.content = updatedQuestion.content;
    question.options = [...updatedQuestion.options];
    question.correctOption = updatedQuestion.correctOption;
    question.explanation = updatedQuestion.explanation;
    return this.saveAndReturn(course, actor);
  }

  async deleteQuizQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    questionId: string,
    actor: ManageCourseActor,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findEditableCourse(courseId, actor);
    const lesson = this.findLesson(course, chapterId, lessonId);
    const quizQuestions = lesson.quizQuestions ?? [];
    const questionIndex = quizQuestions.findIndex(
      (question) => idString(question._id) === questionId.toLowerCase(),
    );
    if (questionIndex < 0) {
      throw new NotFoundException('Không tìm thấy câu trắc nghiệm');
    }
    quizQuestions.splice(questionIndex, 1);
    lesson.quizQuestions = quizQuestions;
    lesson.hasQuiz = quizQuestions.length > 0;
    return this.saveAndReturn(course, actor);
  }

  private async transitionCourse(
    id: string,
    actor: ManageCourseActor,
    action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide',
    rejectReason?: string,
  ): Promise<ManageCourseDetailDto> {
    const course = await this.findCourseForActor(id, actor);
    const isAdmin = actor.role === Role.ADMIN;
    const transition = {
      submit: {
        from: [CourseStatus.DRAFT],
        to: CourseStatus.PENDING,
        allowed: isAdmin || actor.role === Role.INSTRUCTOR,
      },
      withdraw: {
        from: [CourseStatus.PENDING],
        to: CourseStatus.DRAFT,
        allowed: isAdmin || actor.role === Role.INSTRUCTOR,
      },
      approve: {
        from: [CourseStatus.PENDING, CourseStatus.HIDDEN],
        to: CourseStatus.APPROVED,
        allowed: isAdmin,
      },
      reject: {
        from: [CourseStatus.PENDING],
        to: CourseStatus.DRAFT,
        allowed: isAdmin,
      },
      hide: {
        from: [CourseStatus.APPROVED],
        to: CourseStatus.HIDDEN,
        allowed: isAdmin,
      },
    }[action];

    if (!transition.allowed) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }
    if (!transition.from.includes(course.status)) {
      throw new ConflictException(
        `Không thể ${this.actionLabel(action)} khóa học từ trạng thái ${course.status}`,
      );
    }
    if (action === 'submit' || action === 'approve') {
      const readiness = getCourseReadiness(course);
      if (!readiness.ready) {
        throw new BadRequestException({
          message: 'Khóa học chưa đủ điều kiện gửi duyệt',
          issues: readiness.issues,
          warnings: readiness.warnings,
          readiness,
        });
      }
    }
    if (
      action === 'reject' &&
      (!rejectReason || rejectReason.length < 10 || rejectReason.length > 500)
    ) {
      throw new BadRequestException('Lý do từ chối phải có từ 10 đến 500 ký tự');
    }

    const update: Record<string, unknown> = { status: transition.to };
    if (action === 'submit' || action === 'approve') update.rejectReason = null;
    if (action === 'reject') update.rejectReason = rejectReason;
    const changed = await this.courseModel
      .findOneAndUpdate(
        { _id: course._id, status: course.status },
        { $set: update },
        { new: true, runValidators: true },
      )
      .exec();
    if (!changed) {
      throw new ConflictException('Trạng thái khóa học đã thay đổi; vui lòng tải lại');
    }
    return this.getCourse(id, actor);
  }

  private actionLabel(action: string): string {
    const labels: Record<string, string> = {
      submit: 'gửi duyệt',
      withdraw: 'thu hồi',
      approve: 'duyệt',
      reject: 'từ chối',
      hide: 'ẩn',
    };
    return labels[action] ?? action;
  }

  private async findCourseForActor(id: string, actor: ManageCourseActor) {
    assertRole(actor);
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }
    const course = await this.courseModel.findById(id).exec();
    if (!course) throw new NotFoundException('Không tìm thấy khóa học');
    if (
      actor.role === Role.INSTRUCTOR &&
      idString(course.instructorId) !== actor.userId.toLowerCase()
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học của giảng viên khác');
    }
    return course;
  }

  private async findEditableCourse(id: string, actor: ManageCourseActor) {
    const course = await this.findCourseForActor(id, actor);
    if (
      actor.role === Role.INSTRUCTOR &&
      course.status !== CourseStatus.DRAFT &&
      course.status !== CourseStatus.APPROVED
    ) {
      throw new ConflictException(
        `Giảng viên không được chỉnh sửa khóa học ở trạng thái ${course.status}`,
      );
    }
    return course;
  }

  private assertCanDelete(course: Course, actor: ManageCourseActor): void {
    const allowed =
      course.status === CourseStatus.DRAFT ||
      (actor.role === Role.ADMIN && course.status === CourseStatus.HIDDEN);
    if (!allowed) {
      throw new ConflictException(
        'Chỉ được xóa khóa nháp; quản trị viên có thể xóa khóa đang ẩn',
      );
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    if (!(await this.categoryModel.exists({ _id: categoryId }).exec())) {
      throw new BadRequestException('Danh mục khóa học không tồn tại');
    }
  }

  private async saveAndReturn(
    course: HydratedDocument<Course>,
    actor: ManageCourseActor,
    recalculate = false,
  ): Promise<ManageCourseDetailDto> {
    await course.save();
    if (recalculate) {
      await recalculateCourseTotals(this.courseModel, course._id);
    }
    return this.getCourse(course._id.toString(), actor);
  }

  private findChapter(course: HydratedDocument<Course>, chapterId: string): Chapter {
    const chapter = course.chapters.find(
      (item) => idString(item._id) === chapterId.toLowerCase(),
    );
    if (!chapter) throw new NotFoundException('Không tìm thấy chương');
    return chapter;
  }

  private findLesson(
    course: HydratedDocument<Course>,
    chapterId: string,
    lessonId: string,
  ): Lesson {
    const chapter = this.findChapter(course, chapterId);
    const lesson = chapter.lessons.find(
      (item) => idString(item._id) === lessonId.toLowerCase(),
    );
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng');
    return lesson;
  }

  private assertExactReorder(
    currentIds: string[],
    requestedIds: string[],
    label: string,
  ): void {
    const normalizedRequested = new Set(
      requestedIds.map((id) => id.toLowerCase()),
    );
    if (
      normalizedRequested.size !== requestedIds.length ||
      requestedIds.length !== currentIds.length ||
      currentIds.some((id) => !normalizedRequested.has(id.toLowerCase()))
    ) {
      throw new BadRequestException(
        `Danh sách sắp xếp phải chứa đúng và đủ các ${label} hiện có, không trùng lặp`,
      );
    }
  }

  private assertValidQuestion(question: {
    content: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }): void {
    if (
      question.options.length < 2 ||
      question.options.length > 6 ||
      new Set(question.options).size !== question.options.length
    ) {
      throw new BadRequestException(
        'Câu trắc nghiệm cần từ 2 đến 6 đáp án không trùng nhau',
      );
    }
    if (
      !Number.isInteger(question.correctOption) ||
      question.correctOption < 0 ||
      question.correctOption >= question.options.length
    ) {
      throw new BadRequestException(
        'correctOption phải là chỉ số 0-based nằm trong options',
      );
    }
  }
}
