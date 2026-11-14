import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  CommentReport,
  CommentReportSchema,
  CommentVisibilityStatus,
} from '../../questions/schemas/lesson-comment.schema.js';

export type CourseReviewDocument = HydratedDocument<CourseReview>;

@Schema({
  timestamps: true,
  collection: 'course_reviews',
})
export class CourseReview {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  })
  courseId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  studentId!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, default: '', trim: true, maxlength: 2000 })
  comment!: string;

  @Prop({ type: Boolean, default: false, index: true })
  hasComment!: boolean;

  @Prop({
    type: String,
    enum: Object.values(CommentVisibilityStatus),
    default: CommentVisibilityStatus.VISIBLE,
    index: true,
  })
  visibilityStatus!: CommentVisibilityStatus;

  @Prop({ type: String, default: null })
  moderationNote!: string | null;

  /** Đã cộng +1 vi phạm cho tác giả đánh giá này hay chưa (mỗi đánh giá chỉ tính 1 lần) */
  @Prop({ type: Boolean, default: false })
  violationRecorded!: boolean;

  @Prop({ type: [CommentReportSchema], default: [] })
  reports!: CommentReport[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const CourseReviewSchema = SchemaFactory.createForClass(CourseReview);

CourseReviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
CourseReviewSchema.index({
  courseId: 1,
  visibilityStatus: 1,
  hasComment: -1,
  createdAt: -1,
});

