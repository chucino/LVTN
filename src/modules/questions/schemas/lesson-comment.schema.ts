import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum CommentReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  CARE = 'CARE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

export enum CommentVisibilityStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}

@Schema({ _id: false })
export class CommentReplyToUser {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  fullName!: string;
}

export const CommentReplyToUserSchema =
  SchemaFactory.createForClass(CommentReplyToUser);

@Schema({ _id: false })
export class CommentReaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(CommentReactionType),
    required: true,
  })
  type!: CommentReactionType;
}

export const CommentReactionSchema =
  SchemaFactory.createForClass(CommentReaction);

@Schema({ _id: false })
export class CommentReport {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  reason!: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const CommentReportSchema = SchemaFactory.createForClass(CommentReport);

export type LessonCommentDocument = HydratedDocument<LessonComment>;

@Schema({
  timestamps: true,
  collection: 'lesson_comments',
})
export class LessonComment {
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'LessonComment',
    default: null,
    index: true,
  })
  parentId!: Types.ObjectId | null;

  @Prop({
    type: CommentReplyToUserSchema,
    default: null,
  })
  replyToUser!: CommentReplyToUser | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  content!: string;

  @Prop({
    type: String,
    enum: Object.values(CommentVisibilityStatus),
    default: CommentVisibilityStatus.VISIBLE,
    index: true,
  })
  visibilityStatus!: CommentVisibilityStatus;

  @Prop({ type: String, default: null })
  moderationNote!: string | null;

  /** Đã cộng +1 vi phạm cho tác giả bình luận này hay chưa (mỗi bình luận chỉ tính 1 lần) */
  @Prop({ type: Boolean, default: false })
  violationRecorded!: boolean;

  @Prop({ type: [CommentReactionSchema], default: [] })
  reactions!: CommentReaction[];

  @Prop({ type: [CommentReportSchema], default: [] })
  reports!: CommentReport[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const LessonCommentSchema = SchemaFactory.createForClass(LessonComment);

LessonCommentSchema.index({
  courseId: 1,
  lessonId: 1,
  parentId: 1,
  createdAt: -1,
});
