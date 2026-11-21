import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
} from '../../../common/constants/order.enum.js';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
  collection: 'orders',
})
export class Order {
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  orderCode!: string;

  @Prop({
    type: Number,
    required: true,
    unique: true,
    index: true,
  })
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
  originalPrice!: number;

  @Prop({ type: Number, default: null, min: 0 })
  discountPrice!: number | null;

  @Prop({ type: String, default: null, uppercase: true, trim: true })
  couponCode!: string | null;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  discountAmount!: number;

  @Prop({ type: Number, required: true, min: 0 })
  finalAmount!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status!: OrderStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.PAYOS_VIETQR,
  })
  paymentMethod!: PaymentMethod;

  @Prop({ type: String, default: null })
  paymentLinkId!: string | null;

  @Prop({ type: String, default: null })
  checkoutUrl!: string | null;

  @Prop({ type: String, default: null })
  qrCode!: string | null;

  @Prop({ type: String, default: null })
  qrImageUrl!: string | null;

  @Prop({ type: String, default: null })
  bankBin!: string | null;

  @Prop({ type: String, default: null })
  bankName!: string | null;

  @Prop({ type: String, default: null })
  accountNumber!: string | null;

  @Prop({ type: String, default: null })
  accountName!: string | null;

  @Prop({ type: String, default: null })
  transferDescription!: string | null;

  @Prop({ type: String, default: null })
  transactionReference!: string | null;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  paidAt!: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt!: Date | null;

  @Prop({ type: String, default: null })
  cancelReason!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ studentId: 1, createdAt: -1 });
OrderSchema.index({ studentId: 1, courseId: 1, status: 1 });
OrderSchema.index({ status: 1, expiresAt: 1 });
