import { Types } from 'mongoose';
import {
  CategoryCourseResponseDto,
  ChapterPublicResponseDto,
  CourseCardResponseDto,
  CourseDetailResponseDto,
  InstructorCourseResponseDto,
  LessonPublicResponseDto,
} from '../dto/course-response.dto.js';
import { CourseLevel } from '../../../common/constants/course-level.constant.js';
import { CourseType } from '../../../common/constants/course.enum.js';

export interface CourseAggregateRecord {
  _id: Types.ObjectId | string;
  title: string;
  thumbnail: string | null;
  type: CourseType;
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  avgRating: number;
  totalChapters: number;
  totalLessons: number;
  totalDuration: number;
  instructor: {
    _id: Types.ObjectId | string;
    fullName: string;
    avatar: string | null;
  };
  category: {
    _id: Types.ObjectId | string;
    name: string;
  };
}

interface LessonAggregateRecord {
  _id: Types.ObjectId | string;
  title: string;
  order: number;
  duration: number;
  hasQuiz: boolean;
}

interface ChapterAggregateRecord {
  _id: Types.ObjectId | string;
  title: string;
  order: number;
  lessons: LessonAggregateRecord[];
}

export interface CourseDetailAggregateRecord extends CourseAggregateRecord {
  description: string;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  chapters: ChapterAggregateRecord[];
}

function idToString(id: Types.ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString();
}

function serializeInstructor(
  instructor: CourseAggregateRecord['instructor'],
): InstructorCourseResponseDto {
  return {
    id: idToString(instructor._id),
    fullName: instructor.fullName,
    avatar: instructor.avatar ?? null,
  };
}

function serializeCategory(
  category: CourseAggregateRecord['category'],
): CategoryCourseResponseDto {
  return {
    id: idToString(category._id),
    name: category.name,
  };
}

export function serializeCourseCard(
  course: CourseAggregateRecord,
): CourseCardResponseDto {
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
    category: serializeCategory(course.category),
  };
}

function serializeLesson(
  lesson: LessonAggregateRecord,
): LessonPublicResponseDto {
  return {
    id: idToString(lesson._id),
    title: lesson.title,
    order: lesson.order,
    duration: lesson.duration,
    hasQuiz: lesson.hasQuiz,
  };
}

function serializeChapter(
  chapter: ChapterAggregateRecord,
): ChapterPublicResponseDto {
  return {
    id: idToString(chapter._id),
    title: chapter.title,
    order: chapter.order,
    lessons: [...chapter.lessons]
      .sort((left, right) => left.order - right.order)
      .map(serializeLesson),
  };
}

export function serializeCourseDetail(
  course: CourseDetailAggregateRecord,
): CourseDetailResponseDto {
  return {
    ...serializeCourseCard(course),
    description: course.description,
    targetAudience: course.targetAudience,
    learningOutcomes: [...course.learningOutcomes],
    requirements: course.requirements,
    chapters: [...course.chapters]
      .sort((left, right) => left.order - right.order)
      .map(serializeChapter),
  };
}
