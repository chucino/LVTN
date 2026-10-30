import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { COURSE_LEVELS } from '../../../common/constants/course-level.constant.js';
import type { CourseLevel } from '../../../common/constants/course-level.constant.js';
import {
  CourseStatus,
  CourseType,
} from '../../../common/constants/course.enum.js';
import { Category } from './category.schema.js';

@Schema({ _id: true })
export class QuizQuestion {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ type: [String], required: true })
  options!: string[];

  @Prop({ required: true, min: 0 })
  correctOption!: number;

  @Prop({ required: true, trim: true })
  explanation!: string;
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ _id: true })
export class Lesson {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, min: 1 })
  order!: number;

  @Prop({ required: true, trim: true })
  videoUrl!: string;

  @Prop({ required: true, min: 0 })
  duration!: number;

  @Prop({ type: String, default: null })
  note!: string | null;

  @Prop({ type: String, default: null })
  summary!: string | null;

  @Prop({ type: [QuizQuestionSchema], default: [] })
  quizQuestions!: QuizQuestion[];

  @Prop({ default: false })
  hasQuiz!: boolean;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

@Schema({ _id: true })
export class Chapter {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, min: 1 })
  order!: number;

  @Prop({ type: [LessonSchema], default: [] })
  lessons!: Lesson[];
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

@Schema({
  timestamps: true,
  collection: 'courses',
})
export class Course {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: String, enum: Object.values(CourseType), required: true })
  type!: CourseType;

  @Prop({ type: String, enum: COURSE_LEVELS, required: true })
  level!: CourseLevel;

  @Prop({ required: true, trim: true })
  targetAudience!: string;

  @Prop({ type: [String], required: true, default: [] })
  learningOutcomes!: string[];

  @Prop({ required: true, trim: true })
  requirements!: string;

  @Prop({ required: true, min: 0, default: 0 })
  price!: number;

  @Prop({ type: Number, min: 0, default: null })
  discountPrice!: number | null;

  @Prop({
    type: String,
    enum: Object.values(CourseStatus),
    default: CourseStatus.DRAFT,
    index: true,
  })
  status!: CourseStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  instructorId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
    index: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 5, default: 0 })
  avgRating!: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalChapters!: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalLessons!: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalDuration!: number;

  @Prop({ type: String, default: null })
  thumbnail!: string | null;

  @Prop({ type: String, default: null })
  rejectReason!: string | null;

  @Prop({ type: [ChapterSchema], default: [] })
  chapters!: Chapter[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({ status: 1, createdAt: -1 });
CourseSchema.index({ status: 1, avgRating: -1, createdAt: -1 });
