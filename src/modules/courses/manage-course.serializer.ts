import { Types } from 'mongoose';
import { Role } from '../../common/constants/roles.enum.js';
import { CourseStatus } from '../../common/constants/course.enum.js';
import {
  ManageChapterDto,
  ManageCourseDetailDto,
  ManageCourseItemDto,
  ManageCoursePermissionsDto,
  ManageInstructorDto,
  ManageQuizQuestionDto,
} from './dto/manage-course-response.dto.js';
import { Course } from './schemas/course.schema.js';
import { getCourseReadiness } from './manage-course-readiness.js';

export interface ManageCourseActor {
  userId: string;
  role: string;
}

export interface ManageCourseItemAggregateRecord
  extends Pick<
    Course,
    | 'title'
    | 'thumbnail'
    | 'type'
    | 'level'
    | 'price'
    | 'discountPrice'
    | 'avgRating'
    | 'totalChapters'
    | 'totalLessons'
    | 'totalDuration'
    | 'status'
    | 'rejectReason'
    | 'createdAt'
    | 'updatedAt'
    | 'categoryId'
  > {
  _id: Types.ObjectId | string;
  instructorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  instructor: {
    _id: Types.ObjectId | string;
    fullName: string;
    avatar: string | null;
  };
  category: { _id: Types.ObjectId | string; name: string };
}

export interface ManageCourseAggregateRecord
  extends ManageCourseItemAggregateRecord,
    Pick<
      Course,
      | 'description'
      | 'targetAudience'
      | 'learningOutcomes'
      | 'requirements'
      | 'chapters'
    > {}

function idToString(id: Types.ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString();
}

function toIsoDate(value: Date | string | undefined): string {
  return value ? new Date(value).toISOString() : new Date(0).toISOString();
}

export function getManageCoursePermissions(
  status: CourseStatus,
  instructorId: Types.ObjectId | string,
  actor: ManageCourseActor,
): ManageCoursePermissionsDto {
  const isAdmin = actor.role === Role.ADMIN;
  const isOwner =
    actor.role === Role.INSTRUCTOR &&
    idToString(instructorId).toLowerCase() === actor.userId.toLowerCase();
  const canManageOwn = isAdmin || isOwner;

  return {
    canEdit: isAdmin || (isOwner && [CourseStatus.DRAFT, CourseStatus.APPROVED].includes(status)),
    canSubmit: canManageOwn && status === CourseStatus.DRAFT,
    canWithdraw: canManageOwn && status === CourseStatus.PENDING,
    canDelete:
      (canManageOwn && status === CourseStatus.DRAFT) ||
      (isAdmin && status === CourseStatus.HIDDEN),
    canApprove:
      isAdmin && [CourseStatus.PENDING, CourseStatus.HIDDEN].includes(status),
    canReject: isAdmin && status === CourseStatus.PENDING,
    canHide: isAdmin && status === CourseStatus.APPROVED,
  };
}

function serializeInstructor(
  instructor: ManageCourseItemAggregateRecord['instructor'],
): ManageInstructorDto {
  return {
    id: idToString(instructor._id),
    fullName: instructor.fullName,
    avatar: instructor.avatar ?? null,
  };
}

function serializeQuizQuestion(question: {
  _id: Types.ObjectId | string;
  content: string;
  options: string[];
  correctOption: number;
  explanation: string;
}): ManageQuizQuestionDto {
  return {
    id: idToString(question._id),
    content: question.content,
    options: [...question.options],
    correctOption: question.correctOption,
    explanation: question.explanation,
  };
}

function serializeChapter(chapter: Course['chapters'][number]): ManageChapterDto {
  return {
    id: chapter._id.toString(),
    title: chapter.title,
    order: chapter.order,
    lessons: [...(chapter.lessons ?? [])]
      .sort((left, right) => left.order - right.order)
      .map((lesson) => ({
        id: lesson._id.toString(),
        title: lesson.title,
        order: lesson.order,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        note: lesson.note ?? null,
        summary: lesson.summary ?? null,
        hasQuiz: (lesson.quizQuestions?.length ?? 0) > 0,
        quizQuestions: [...(lesson.quizQuestions ?? [])].map(serializeQuizQuestion),
      })),
  };
}

export function serializeManageCourseItem(
  course: ManageCourseItemAggregateRecord,
  actor: ManageCourseActor,
): ManageCourseItemDto {
  const createdAt = toIsoDate(course.createdAt);
  return {
    id: idToString(course._id),
    title: course.title,
    thumbnail: course.thumbnail ?? null,
    type: course.type,
    level: course.level,
    price: course.price,
    discountPrice: course.discountPrice ?? null,
    avgRating: course.avgRating,
    totalChapters: course.totalChapters,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    instructor: serializeInstructor(course.instructor),
    category: {
      id: idToString(course.category._id),
      name: course.category.name,
    },
    status: course.status,
    rejectReason: course.rejectReason ?? null,
    createdAt,
    updatedAt: toIsoDate(course.updatedAt ?? course.createdAt),
    permissions: getManageCoursePermissions(
      course.status,
      course.instructorId,
      actor,
    ),
  };
}

export function serializeManageCourseDetail(
  course: ManageCourseAggregateRecord,
  actor: ManageCourseActor,
): ManageCourseDetailDto {
  return {
    ...serializeManageCourseItem(course, actor),
    description: course.description,
    targetAudience: course.targetAudience,
    learningOutcomes: [...course.learningOutcomes],
    requirements: course.requirements,
    readiness: getCourseReadiness(course),
    chapters: [...course.chapters]
      .sort((left, right) => left.order - right.order)
      .map(serializeChapter),
  };
}
