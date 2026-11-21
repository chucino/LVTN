import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  OrderStatus,
  PaymentMethod,
} from '../../../common/constants/order.enum.js';

export class CreateOrderDto {
  @ApiProperty({
    example: '6650c1f6f2f4f6e4c8bfe125',
    description: 'Mongo ObjectId của khóa học PRO cần mua',
  })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({
    example: 'NEXTCODE10',
    description: 'Mã giảm giá (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}

export class ValidateCouponDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({ example: 'NEXTCODE10' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({
    example: 'Đổi ý hoặc chọn mã giảm giá khác',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}

export class MyOrdersQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class ManageOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo mã đơn hàng, tên/email học viên hoặc tên khóa học',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  keyword?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}

export class PayosWebhookPayloadDto {
  @ApiPropertyOptional({ example: '00' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'success' })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiProperty({
    description: 'Dữ liệu giao dịch do payOS gửi về',
  })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiProperty({
    description: 'Chữ ký HMAC-SHA256 của payOS',
  })
  @IsString()
  @IsNotEmpty()
  signature!: string;
}

export class AvailableCouponItemDto {
  @ApiProperty({ example: 'NEXTCODE10' })
  code!: string;

  @ApiProperty({ example: 'Giảm 10% học phí khóa học Pro (tối đa 100.000đ)' })
  title!: string;

  @ApiProperty({ example: 'PERCENT' })
  discountType!: 'PERCENT' | 'FIXED';

  @ApiProperty({ example: 10 })
  discountValue!: number;

  @ApiProperty({ example: 100000 })
  maxDiscountAmount!: number | null;

  @ApiProperty({ example: 100000 })
  minOrderAmount!: number;
}

export class CouponPreviewResponseDto {
  @ApiProperty()
  valid!: boolean;

  @ApiProperty({ nullable: true })
  couponCode!: string | null;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  originalPrice!: number;

  @ApiProperty({ nullable: true })
  courseDiscountPrice!: number | null;

  @ApiProperty()
  baseAmount!: number;

  @ApiProperty()
  discountAmount!: number;

  @ApiProperty()
  finalAmount!: number;

  @ApiProperty({ type: [AvailableCouponItemDto] })
  availableCoupons!: AvailableCouponItemDto[];
}

export class OrderDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'DH8K2M9' })
  orderCode!: string;

  @ApiProperty({ example: 173165432199 })
  payosOrderCode!: number;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  studentEmail!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseTitle!: string;

  @ApiProperty({ nullable: true })
  courseThumbnail!: string | null;

  @ApiProperty()
  instructorName!: string;

  @ApiProperty()
  originalPrice!: number;

  @ApiProperty({ nullable: true })
  discountPrice!: number | null;

  @ApiProperty({ nullable: true })
  couponCode!: string | null;

  @ApiProperty()
  discountAmount!: number;

  @ApiProperty()
  finalAmount!: number;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiProperty({ nullable: true })
  paymentLinkId!: string | null;

  @ApiProperty({ nullable: true })
  checkoutUrl!: string | null;

  @ApiProperty({ nullable: true })
  qrCode!: string | null;

  @ApiProperty({ nullable: true })
  qrImageUrl!: string | null;

  @ApiProperty({ nullable: true })
  bankBin!: string | null;

  @ApiProperty({ nullable: true })
  bankName!: string | null;

  @ApiProperty({ nullable: true })
  accountNumber!: string | null;

  @ApiProperty({ nullable: true })
  accountName!: string | null;

  @ApiProperty({ nullable: true })
  transferDescription!: string | null;

  @ApiProperty({ nullable: true })
  transactionReference!: string | null;

  @ApiProperty()
  simulationEnabled!: boolean;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ nullable: true })
  paidAt!: string | null;

  @ApiProperty({ nullable: true })
  cancelledAt!: string | null;

  @ApiProperty({ nullable: true })
  cancelReason!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class PaymentTransactionItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  orderCode!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseTitle!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  reference!: string;

  @ApiProperty({ enum: ['PAYOS', 'SIMULATION', 'MANUAL'] })
  provider!: 'PAYOS' | 'SIMULATION' | 'MANUAL';

  @ApiProperty({ nullable: true })
  transactionDateTime!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class MyOrdersResponseDto {
  @ApiProperty({ type: [OrderDetailResponseDto] })
  orders!: OrderDetailResponseDto[];

  @ApiProperty({ type: [PaymentTransactionItemDto] })
  transactions!: PaymentTransactionItemDto[];
}

export class ManageOrdersStatsDto {
  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  completedOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  cancelledOrders!: number;

  @ApiProperty()
  totalRevenue!: number;
}

export class ManageOrdersResponseDto {
  @ApiProperty({ type: [OrderDetailResponseDto] })
  items!: OrderDetailResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: ManageOrdersStatsDto })
  stats!: ManageOrdersStatsDto;
}
