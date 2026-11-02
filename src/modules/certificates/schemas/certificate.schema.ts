import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CertificateStatus } from '../../../common/constants/learning.enum.js';

export type CertificateDocument = HydratedDocument<Certificate>;

@Schema({
  timestamps: true,
  collection: 'certificates',
})
export class Certificate {
  @Prop({ required: true, unique: true, trim: true, uppercase: true, index: true })
  certificateCode!: string;

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
  issuedAt!: Date;

  @Prop({ required: true, trim: true })
  qrCode!: string;

  @Prop({ type: String, default: null })
  fileUrl!: string | null;

  @Prop({
    type: String,
    enum: Object.values(CertificateStatus),
    default: CertificateStatus.VALID,
    index: true,
  })
  status!: CertificateStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

CertificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

