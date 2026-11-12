import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum NotificationType {
  MODERATION_REMINDER = 'MODERATION_REMINDER',
  MODERATION_WARNING = 'MODERATION_WARNING',
  MODERATION_RESTORED = 'MODERATION_RESTORED',
  REPORT_RESULT = 'REPORT_RESULT',
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  recipientId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type!: NotificationType;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  message!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    default: null,
  })
  courseId!: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: null,
  })
  lessonId!: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false, index: true })
  isRead!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

