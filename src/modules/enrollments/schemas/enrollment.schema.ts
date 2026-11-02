import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { EnrollmentStatus } from '../../../common/constants/learning.enum.js';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({
  timestamps: true,
  collection: 'enrollments',
})
export class Enrollment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  studentId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  })
  courseId!: Types.ObjectId;

  @Prop({ type: Date, required: true, default: () => new Date() })
  enrolledAt!: Date;

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  progressPercent!: number;

  @Prop({
    type: String,
    enum: Object.values(EnrollmentStatus),
    default: EnrollmentStatus.LEARNING,
    index: true,
  })
  status!: EnrollmentStatus;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  lastLessonId!: Types.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

