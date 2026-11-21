import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

@Schema({
  timestamps: true,
  collection: 'payment_transactions',
})
export class PaymentTransaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  orderId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  orderCode!: string;

  @Prop({ type: Number, required: true, index: true })
  payosOrderCode!: number;

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

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  reference!: string;

  @Prop({
    type: String,
    enum: ['PAYOS', 'SIMULATION', 'MANUAL'],
    required: true,
  })
  provider!: 'PAYOS' | 'SIMULATION' | 'MANUAL';

  @Prop({
    type: String,
    enum: ['SUCCESS', 'IGNORED', 'FAILED'],
    default: 'SUCCESS',
  })
  status!: 'SUCCESS' | 'IGNORED' | 'FAILED';

  @Prop({ type: String, default: null })
  counterAccountBankId!: string | null;

  @Prop({ type: String, default: null })
  counterAccountName!: string | null;

  @Prop({ type: String, default: null })
  counterAccountNumber!: string | null;

  @Prop({ type: String, default: null })
  transactionDateTime!: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  rawPayload!: Record<string, unknown>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);

PaymentTransactionSchema.index({ studentId: 1, createdAt: -1 });
