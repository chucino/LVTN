import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { LessonStatus } from '../../../common/constants/learning.enum.js';

export type LessonProgressDocument = HydratedDocument<LessonProgress>;

@Schema({
  timestamps: true,
  collection: 'lesson_progresses',
})
export class LessonProgress {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    index: true,
  })
  enrollmentId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  lessonId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(LessonStatus),
    default: LessonStatus.LOCKED,
    index: true,
  })
  status!: LessonStatus;

  @Prop({ required: true, min: 0, default: 0 })
  lastPositionSec!: number;

  @Prop({ required: true, min: 0, default: 0 })
  watchedSeconds!: number;

  @Prop({ required: true, default: false })
  watchedFully!: boolean;

  @Prop({ required: true, default: false })
  quizPassed!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LessonProgressSchema =
  SchemaFactory.createForClass(LessonProgress);

LessonProgressSchema.index({ enrollmentId: 1, lessonId: 1 }, { unique: true });
