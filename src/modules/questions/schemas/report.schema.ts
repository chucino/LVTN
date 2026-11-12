import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum ReportTargetType {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
  REVIEW = 'REVIEW',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ReportActionType {
  DISMISS = 'DISMISS',
  DELETE_AND_REMIND = 'DELETE_AND_REMIND',
  ESCALATE = 'ESCALATE',
  APPLY_PENALTY = 'APPLY_PENALTY',
}

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  timestamps: true,
  collection: 'reports',
})
export class Report {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  reporterId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ReportTargetType),
    required: true,
    index: true,
  })
  targetType!: ReportTargetType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  targetId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  targetAuthorId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  })
  courseId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  lessonId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  reason!: string;

  @Prop({
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
    index: true,
  })
  status!: ReportStatus;

  /**
   * Khi bình luận bị báo cáo là của chính Giảng viên phụ trách khóa học,
   * hoặc khi Giảng viên bấm "Chuyển lên Admin", cờ này = true để chuyển thẳng vào hàng đợi của Admin.
   */
  @Prop({ type: Boolean, default: false, index: true })
  escalatedToAdmin!: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  resolvedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  resolvedAt!: Date | null;

  @Prop({
    type: String,
    enum: Object.values(ReportActionType),
    default: null,
  })
  actionTaken!: ReportActionType | null;

  @Prop({ type: String, default: null })
  moderationNote!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ courseId: 1, status: 1, createdAt: -1 });
ReportSchema.index({ status: 1, escalatedToAdmin: 1, createdAt: -1 });

