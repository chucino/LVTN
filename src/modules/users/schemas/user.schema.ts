import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Role } from '../../../common/constants/roles.enum.js';
import { UserStatus } from '../../../common/constants/user-status.enum.js';

export type UserDocument = User & Document & { _id: Types.ObjectId; id: string };

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete (ret as any).passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date;

  @Prop({ trim: true, default: null })
  occupation?: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.STUDENT,
  })
  role: Role;

  @Prop({ type: String, default: null })
  avatar?: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
    index: true,
  })
  status: string;

  @Prop({
    // Chấp nhận cả string label lẫn ObjectId (Category module chưa triển khai)
    type: [{ type: MongooseSchema.Types.Mixed }],
    default: [],
  })
  interestedCategories: (Types.ObjectId | string)[];

  /** Số lần vi phạm đã được xác nhận (không tính báo cáo bị bỏ qua) */
  @Prop({ type: Number, default: 0, min: 0 })
  violationCount: number;

  /** Thời điểm hết hạn cấm bình luận (null = không bị cấm) */
  @Prop({ type: Date, default: null })
  commentBannedUntil?: Date | null;

  /** Lịch sử xử lý vi phạm của tài khoản */
  @Prop({
    type: [
      {
        _id: false,
        reportId: { type: MongooseSchema.Types.ObjectId },
        commentId: { type: MongooseSchema.Types.ObjectId },
        courseId: { type: MongooseSchema.Types.ObjectId },
        reason: { type: String },
        actionTaken: { type: String },
        penaltySummary: { type: String },
        resolvedBy: { type: MongooseSchema.Types.ObjectId },
        resolvedAt: { type: Date },
      },
    ],
    default: [],
  })
  violationHistory: Array<{
    reportId: Types.ObjectId;
    commentId: Types.ObjectId;
    courseId: Types.ObjectId;
    reason: string;
    actionTaken: string;
    penaltySummary: string;
    resolvedBy: Types.ObjectId;
    resolvedAt: Date;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Thêm virtual getter isActive để tiện kiểm tra
UserSchema.virtual('isActive').get(function (this: UserDocument) {
  return this.status === UserStatus.ACTIVE;
});
