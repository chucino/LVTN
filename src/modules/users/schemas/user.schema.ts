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
}

export const UserSchema = SchemaFactory.createForClass(User);

// Thêm virtual getter isActive để tiện kiểm tra
UserSchema.virtual('isActive').get(function (this: UserDocument) {
  return this.status === UserStatus.ACTIVE;
});
