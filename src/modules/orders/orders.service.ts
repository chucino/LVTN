import { randomBytes, randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import {
  OrderStatus,
  PaymentMethod,
} from '../../common/constants/order.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Course } from '../courses/schemas/course.schema.js';
import { EnrollmentsService } from '../enrollments/enrollments.service.js';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema.js';
import { User } from '../users/schemas/user.schema.js';
import {
  AvailableCouponItemDto,
  CancelOrderDto,
  CouponPreviewResponseDto,
  CreateOrderDto,
  ManageOrdersQueryDto,
  ManageOrdersResponseDto,
  MyOrdersQueryDto,
  MyOrdersResponseDto,
  OrderDetailResponseDto,
  PayosWebhookPayloadDto,
  ValidateCouponDto,
} from './dto/order.dto.js';
import { PayosService } from './payos.service.js';
import { Order, OrderDocument } from './schemas/order.schema.js';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from './schemas/payment-transaction.schema.js';

const ORDER_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MIN_PAYOS_AMOUNT_VND = 2000;

interface BuiltinCouponRule {
  code: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  devOnly?: boolean;
  fixedFinalAmount?: number;
}

const BUILTIN_COUPONS: BuiltinCouponRule[] = [
  {
    code: 'NEXTCODE10',
    title: 'Giảm 10% học phí khóa học Pro (tối đa 100.000đ)',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscountAmount: 100000,
    minOrderAmount: 50000,
  },
  {
    code: 'SINHVIEN20',
    title: 'Ưu đãi 20% dành cho Học viên & Sinh viên (tối đa 200.000đ)',
    discountType: 'PERCENT',
    discountValue: 20,
    maxDiscountAmount: 200000,
    minOrderAmount: 100000,
  },
  {
    code: 'PRO50K',
    title: 'Giảm trực tiếp 50.000đ cho đơn từ 200.000đ',
    discountType: 'FIXED',
    discountValue: 50000,
    maxDiscountAmount: 50000,
    minOrderAmount: 200000,
  },
  {
    code: 'TEST2K',
    title: 'Mã kiểm thử giao dịch thật 2.000đ qua VietQR payOS',
    discountType: 'FIXED',
    discountValue: 0,
    maxDiscountAmount: null,
    minOrderAmount: 2000,
    devOnly: true,
    fixedFinalAmount: 2000,
  },
];

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function generateOrderCode(): string {
  const bytes = randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += ORDER_CODE_ALPHABET[bytes[i]! % ORDER_CODE_ALPHABET.length];
  }
  return `DH${suffix}`;
}

function generatePayosOrderCode(): number {
  const timePart = Date.now().toString().slice(-9);
  const randPart = randomInt(100, 999).toString();
  return Number(`${timePart}${randPart}`);
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly transactionModel: Model<PaymentTransactionDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    private readonly configService: ConfigService,
    private readonly payosService: PayosService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  isSimulationEnabled(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      return false;
    }
    const raw = this.configService
      .get<string>('PAYMENT_SIMULATION_ENABLED', 'true')
      .toLowerCase()
      .trim();
    return raw === 'true' || raw === '1';
  }

  private getOrderExpireMinutes(): number {
    const minutes = Number(
      this.configService.get<string | number>('ORDER_EXPIRE_MINUTES', 15),
    );
    return Number.isFinite(minutes) && minutes >= 5 ? minutes : 15;
  }

  private getPrimaryClientOrigin(): string {
    const raw = this.configService.get<string>(
      'CLIENT_ORIGIN',
      'http://localhost:5173',
    );
    const first = raw
      .split(',')
      .map((item) => item.trim())
      .find(Boolean);
    return (first ?? 'http://localhost:5173').replace(/\/+$/, '');
  }

  private getAvailableCouponRules(): BuiltinCouponRule[] {
    const sim = this.isSimulationEnabled();
    return BUILTIN_COUPONS.filter((c) => !c.devOnly || sim);
  }

  private computePriceAndCoupon(
    course: Course,
    rawCouponCode?: string | null,
  ): {
    originalPrice: number;
    courseDiscountPrice: number | null;
    baseAmount: number;
    couponCode: string | null;
    discountAmount: number;
    finalAmount: number;
    validCoupon: boolean;
    message: string;
  } {
    const originalPrice = Math.max(0, Math.round(course.price ?? 0));
    const courseDiscountPrice =
      course.discountPrice !== null &&
      course.discountPrice !== undefined &&
      course.discountPrice >= 0 &&
      course.discountPrice < originalPrice
        ? Math.round(course.discountPrice)
        : null;

    const baseAmount = Math.max(
      MIN_PAYOS_AMOUNT_VND,
      courseDiscountPrice ?? originalPrice,
    );

    const normalizedCode = rawCouponCode?.trim().toUpperCase() || '';
    if (!normalizedCode) {
      return {
        originalPrice,
        courseDiscountPrice,
        baseAmount,
        couponCode: null,
        discountAmount: 0,
        finalAmount: baseAmount,
        validCoupon: true,
        message: 'Chưa áp dụng mã giảm giá',
      };
    }

    const rule = this.getAvailableCouponRules().find(
      (item) => item.code === normalizedCode,
    );

    if (!rule) {
      throw new BadRequestException(
        `Mã giảm giá "${normalizedCode}" không tồn tại hoặc đã hết hạn`,
      );
    }

    if (baseAmount < rule.minOrderAmount) {
      throw new BadRequestException(
        `Mã "${rule.code}" chỉ áp dụng cho đơn hàng từ ${rule.minOrderAmount.toLocaleString('vi-VN')}đ`,
      );
    }

    let discountAmount = 0;
    if (rule.fixedFinalAmount !== undefined) {
      discountAmount = Math.max(0, baseAmount - rule.fixedFinalAmount);
    } else if (rule.discountType === 'PERCENT') {
      const rawDiscount = Math.round((baseAmount * rule.discountValue) / 100);
      discountAmount =
        rule.maxDiscountAmount !== null
          ? Math.min(rawDiscount, rule.maxDiscountAmount)
          : rawDiscount;
    } else {
      discountAmount = rule.discountValue;
    }

    const finalAmount = Math.max(
      MIN_PAYOS_AMOUNT_VND,
      baseAmount - discountAmount,
    );
    const actualDiscount = Math.max(0, baseAmount - finalAmount);

    return {
      originalPrice,
      courseDiscountPrice,
      baseAmount,
      couponCode: rule.code,
      discountAmount: actualDiscount,
      finalAmount,
      validCoupon: true,
      message: `Đã áp dụng mã ${rule.code}: giảm ${actualDiscount.toLocaleString('vi-VN')}đ`,
    };
  }

  async previewCheckout(
    studentId: string,
    dto: ValidateCouponDto,
  ): Promise<CouponPreviewResponseDto> {
    if (!isValidObjectId(dto.courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const course = await this.courseModel
      .findOne({
        _id: new Types.ObjectId(dto.courseId),
        status: CourseStatus.APPROVED,
      })
      .lean()
      .exec();

    if (!course) {
      throw new NotFoundException(
        'Không tìm thấy khóa học hoặc khóa học chưa được xuất bản',
      );
    }

    if (course.type !== CourseType.PRO) {
      throw new BadRequestException(
        'Khóa học miễn phí không cần tạo đơn thanh toán',
      );
    }

    const existingEnrollment = await this.enrollmentModel
      .exists({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(dto.courseId),
      })
      .exec();

    if (existingEnrollment) {
      throw new ConflictException('Bạn đã đăng ký khóa học này trước đó');
    }

    const pricing = this.computePriceAndCoupon(course, dto.couponCode);
    const availableCoupons: AvailableCouponItemDto[] =
      this.getAvailableCouponRules().map((rule) => ({
        code: rule.code,
        title: rule.title,
        discountType: rule.discountType,
        discountValue:
          rule.fixedFinalAmount !== undefined
            ? Math.max(0, pricing.baseAmount - rule.fixedFinalAmount)
            : rule.discountValue,
        maxDiscountAmount: rule.maxDiscountAmount,
        minOrderAmount: rule.minOrderAmount,
      }));

    return {
      valid: pricing.validCoupon,
      couponCode: pricing.couponCode,
      message: pricing.message,
      originalPrice: pricing.originalPrice,
      courseDiscountPrice: pricing.courseDiscountPrice,
      baseAmount: pricing.baseAmount,
      discountAmount: pricing.discountAmount,
      finalAmount: pricing.finalAmount,
      availableCoupons,
    };
  }

  async createOrder(
    studentId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDetailResponseDto> {
    if (!isValidObjectId(dto.courseId)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const courseObjectId = new Types.ObjectId(dto.courseId);
    const studentObjectId = new Types.ObjectId(studentId);

    const course = await this.courseModel
      .findOne({
        _id: courseObjectId,
        status: CourseStatus.APPROVED,
      })
      .lean()
      .exec();

    if (!course) {
      throw new NotFoundException(
        'Không tìm thấy khóa học hoặc khóa học chưa được xuất bản',
      );
    }

    if (course.type !== CourseType.PRO) {
      throw new BadRequestException(
        'Khóa học miễn phí không cần thanh toán. Bạn có thể đăng ký học trực tiếp.',
      );
    }

    const existingEnrollment = await this.enrollmentModel
      .exists({
        studentId: studentObjectId,
        courseId: courseObjectId,
      })
      .exec();

    if (existingEnrollment) {
      throw new ConflictException('Bạn đã sở hữu khóa học này');
    }

    const pricing = this.computePriceAndCoupon(course, dto.couponCode);

    // Kiểm tra các đơn PENDING hiện có của học viên cho khóa học này
    const pendingOrders = await this.orderModel
      .find({
        studentId: studentObjectId,
        courseId: courseObjectId,
        status: OrderStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .exec();

    const now = new Date();
    for (const pending of pendingOrders) {
      await this.syncOrderWithPayosInternal(pending);
      if (pending.status === OrderStatus.COMPLETED) {
        return this.serializeOrder(pending);
      }

      if (pending.expiresAt <= now) {
        pending.status = OrderStatus.EXPIRED;
        pending.cancelledAt = now;
        pending.cancelReason = 'Đơn hàng hết thời gian chờ thanh toán';
        await pending.save();
        continue;
      }

      const sameCoupon = (pending.couponCode ?? null) === pricing.couponCode;
      const sameAmount = pending.finalAmount === pricing.finalAmount;

      if (sameCoupon && sameAmount && pending.qrCode && pending.checkoutUrl) {
        return this.serializeOrder(pending);
      }

      // Nếu học viên đổi mã giảm giá khác, hủy đơn chờ cũ để tạo mã QR mới đúng số tiền
      pending.status = OrderStatus.CANCELLED;
      pending.cancelledAt = now;
      pending.cancelReason = 'Thay thế bởi đơn hàng mới';
      await pending.save();
      await this.payosService.cancelPaymentLink(
        pending.payosOrderCode,
        'Tạo đơn hàng mới với số tiền cập nhật',
      );
    }

    let orderCode = generateOrderCode();
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.orderModel.exists({ orderCode }).exec();
      if (!exists) break;
      orderCode = generateOrderCode();
    }

    let payosOrderCode = generatePayosOrderCode();
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.orderModel.exists({ payosOrderCode }).exec();
      if (!exists) break;
      payosOrderCode = generatePayosOrderCode();
    }

    const expireMinutes = this.getOrderExpireMinutes();
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
    const expiredAtUnix = Math.floor(expiresAt.getTime() / 1000);
    const clientOrigin = this.getPrimaryClientOrigin();

    // Tạo bản ghi đơn hàng trước để lấy ObjectId cho returnUrl / cancelUrl
    const createdOrder = new this.orderModel({
      orderCode,
      payosOrderCode,
      studentId: studentObjectId,
      courseId: courseObjectId,
      originalPrice: pricing.originalPrice,
      discountPrice: pricing.courseDiscountPrice,
      couponCode: pricing.couponCode,
      discountAmount: pricing.discountAmount,
      finalAmount: pricing.finalAmount,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PAYOS_VIETQR,
      transferDescription: `NEXTCODE ${orderCode}`,
      expiresAt,
    });

    const orderIdStr = createdOrder._id.toString();
    const returnUrl = `${clientOrigin}/checkout/${dto.courseId}?orderId=${orderIdStr}&payment=success`;
    const cancelUrl = `${clientOrigin}/checkout/${dto.courseId}?orderId=${orderIdStr}&payment=cancel`;

    const payosLink = await this.payosService.createPaymentLink({
      orderCode: payosOrderCode,
      amount: pricing.finalAmount,
      description: `NEXTCODE ${orderCode}`,
      returnUrl,
      cancelUrl,
      expiredAt: expiredAtUnix,
    });

    createdOrder.paymentLinkId = payosLink.paymentLinkId;
    createdOrder.checkoutUrl = payosLink.checkoutUrl;
    createdOrder.qrCode = payosLink.qrCode;
    createdOrder.qrImageUrl = payosLink.qrImageUrl;
    createdOrder.bankBin = payosLink.bin;
    createdOrder.bankName = payosLink.bankName;
    createdOrder.accountNumber = payosLink.accountNumber;
    createdOrder.accountName = payosLink.accountName;
    createdOrder.transferDescription = payosLink.description;

    await createdOrder.save();
    return this.serializeOrder(createdOrder);
  }

  async getOrderByIdForUser(
    orderId: string,
    user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.findOrderOrThrow(orderId);
    this.assertCanAccessOrder(order, user);

    if (order.status === OrderStatus.PENDING) {
      await this.syncOrderWithPayosInternal(order);
      if (
        order.status === OrderStatus.PENDING &&
        order.expiresAt <= new Date()
      ) {
        order.status = OrderStatus.EXPIRED;
        order.cancelledAt = new Date();
        order.cancelReason = 'Đơn hàng quá hạn thanh toán';
        await order.save();
      }
    }

    return this.serializeOrder(order);
  }

  async syncOrderPayment(
    orderId: string,
    user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.findOrderOrThrow(orderId);
    this.assertCanAccessOrder(order, user);

    if (order.status === OrderStatus.PENDING) {
      await this.syncOrderWithPayosInternal(order);
    }

    return this.serializeOrder(order);
  }

  async handlePayosWebhook(
    payload: PayosWebhookPayloadDto,
  ): Promise<{ success: boolean; message: string }> {
    const isValid = this.payosService.verifyWebhookSignature(
      payload.data,
      payload.signature,
    );

    if (!isValid) {
      this.logger.warn('Từ chối webhook payOS do chữ ký không hợp lệ');
      throw new BadRequestException('Chữ ký webhook không hợp lệ');
    }

    const data = payload.data;
    const payosOrderCode = Number(data.orderCode);
    const amount = Number(data.amount ?? 0);
    const reference = String(
      data.reference || `PAYOS-${payosOrderCode}-${Date.now()}`,
    ).trim();
    const txCode = String(data.code ?? payload.code ?? '');

    if (!Number.isFinite(payosOrderCode) || payosOrderCode <= 0) {
      return { success: true, message: 'Dữ liệu kiểm thử đã được ghi nhận' };
    }

    const order = await this.orderModel
      .findOne({ payosOrderCode })
      .exec();

    // Khi bấm nút "Kiểm tra" webhook trên trang quản trị payOS, payOS gửi orderCode mẫu (ví dụ 123)
    if (!order) {
      this.logger.log(
        `Nhận webhook kiểm thử từ payOS (orderCode=${payosOrderCode})`,
      );
      return {
        success: true,
        message: 'Xác thực kết nối Webhook payOS thành công',
      };
    }

    if (txCode && txCode !== '00') {
      return {
        success: true,
        message: 'Bỏ qua giao dịch chưa thành công',
      };
    }

    if (amount < order.finalAmount) {
      this.logger.warn(
        `Đơn ${order.orderCode} nhận số tiền ${amount}đ thấp hơn số tiền cần thanh toán ${order.finalAmount}đ`,
      );
      await this.recordTransactionIfNotExists({
        order,
        amount,
        reference,
        provider: 'PAYOS',
        status: 'FAILED',
        data,
      });
      return {
        success: true,
        message: 'Số tiền chuyển khoản chưa đủ để hoàn tất đơn hàng',
      };
    }

    await this.completeOrderWithTransaction({
      order,
      amount,
      reference,
      paymentMethod: PaymentMethod.PAYOS_VIETQR,
      provider: 'PAYOS',
      data,
    });

    return {
      success: true,
      message: 'Xử lý thanh toán đơn hàng thành công',
    };
  }

  async simulateOrderPayment(
    orderId: string,
    user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    if (!this.isSimulationEnabled()) {
      throw new ForbiddenException(
        'Chức năng giả lập thanh toán đã bị khóa trên môi trường Production',
      );
    }

    const order = await this.findOrderOrThrow(orderId);
    this.assertCanAccessOrder(order, user);

    if (order.status === OrderStatus.COMPLETED) {
      return this.serializeOrder(order);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể giả lập thanh toán cho đơn hàng đang ở trạng thái Chờ thanh toán',
      );
    }

    const reference = `SIM-${order.orderCode}-${Date.now()}`;
    await this.completeOrderWithTransaction({
      order,
      amount: order.finalAmount,
      reference,
      paymentMethod: PaymentMethod.SIMULATION,
      provider: 'SIMULATION',
      data: {
        simulatedBy: user.userId,
        simulatedAt: new Date().toISOString(),
      },
    });

    await this.payosService.cancelPaymentLink(
      order.payosOrderCode,
      'Đã xác nhận qua chế độ mô phỏng luận văn',
    );

    return this.serializeOrder(order);
  }

  async confirmOrderManually(
    orderId: string,
    adminUser: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.findOrderOrThrow(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      return this.serializeOrder(order);
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Không thể xác nhận đơn hàng đã bị hủy',
      );
    }

    const reference = `MANUAL-${order.orderCode}-${Date.now()}`;
    await this.completeOrderWithTransaction({
      order,
      amount: order.finalAmount,
      reference,
      paymentMethod: PaymentMethod.MANUAL,
      provider: 'MANUAL',
      data: {
        confirmedBy: adminUser.userId,
        confirmedRole: adminUser.role,
        confirmedAt: new Date().toISOString(),
      },
    });

    await this.payosService.cancelPaymentLink(
      order.payosOrderCode,
      'Admin/Kế toán đã xác nhận thủ công',
    );

    return this.serializeOrder(order);
  }

  async cancelOrder(
    orderId: string,
    user: CurrentUserData,
    dto: CancelOrderDto,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.findOrderOrThrow(orderId);
    this.assertCanAccessOrder(order, user);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn hàng đã hoàn tất thanh toán, không thể hủy',
      );
    }

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason =
        dto.reason?.trim() || 'Người dùng chủ động hủy đơn hàng';
      await order.save();
      await this.payosService.cancelPaymentLink(
        order.payosOrderCode,
        order.cancelReason,
      );
    }

    return this.serializeOrder(order);
  }

  async getMyOrders(
    studentId: string,
    query: MyOrdersQueryDto,
  ): Promise<MyOrdersResponseDto> {
    const studentObjectId = new Types.ObjectId(studentId);
    const filter: Record<string, unknown> = {
      studentId: studentObjectId,
    };
    if (query.status) {
      filter.status = query.status;
    }

    const orders = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Tự động kiểm tra các đơn PENDING gần đây
    const now = new Date();
    for (const order of orders) {
      if (order.status === OrderStatus.PENDING) {
        if (order.expiresAt <= now) {
          order.status = OrderStatus.EXPIRED;
          order.cancelledAt = now;
          order.cancelReason = 'Đơn hàng quá hạn thanh toán';
          await order.save();
        }
      }
    }

    const serializedOrders = await Promise.all(
      orders.map((order) => this.serializeOrder(order)),
    );

    const txDocs = await this.transactionModel
      .find({
        studentId: studentObjectId,
        status: 'SUCCESS',
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const courseIds = Array.from(
      new Set(txDocs.map((tx) => tx.courseId.toString())),
    ).map((id) => new Types.ObjectId(id));

    const courses = await this.courseModel
      .find({ _id: { $in: courseIds } }, { title: 1 })
      .lean()
      .exec();
    const courseTitleMap = new Map(
      courses.map((c) => [c._id.toString(), c.title]),
    );

    return {
      orders: serializedOrders,
      transactions: txDocs.map((tx) => ({
        id: tx._id.toString(),
        orderId: tx.orderId.toString(),
        orderCode: tx.orderCode,
        courseId: tx.courseId.toString(),
        courseTitle:
          courseTitleMap.get(tx.courseId.toString()) ?? 'Khóa học NextCode',
        amount: tx.amount,
        reference: tx.reference,
        provider: tx.provider,
        transactionDateTime: tx.transactionDateTime,
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  }

  async getManageOrders(
    query: ManageOrdersQueryDto,
  ): Promise<ManageOrdersResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 12));

    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      const [matchedUsers, matchedCourses] = await Promise.all([
        this.userModel
          .find(
            { $or: [{ fullName: regex }, { email: regex }] },
            { _id: 1 },
          )
          .lean()
          .exec(),
        this.courseModel.find({ title: regex }, { _id: 1 }).lean().exec(),
      ]);

      filter.$or = [
        { orderCode: regex },
        { studentId: { $in: matchedUsers.map((u) => u._id) } },
        { courseId: { $in: matchedCourses.map((c) => c._id) } },
      ];
    }

    const [
      total,
      orders,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      revenueAgg,
    ] = await Promise.all([
      this.orderModel.countDocuments(filter).exec(),
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments().exec(),
      this.orderModel
        .countDocuments({ status: OrderStatus.COMPLETED })
        .exec(),
      this.orderModel
        .countDocuments({ status: OrderStatus.PENDING })
        .exec(),
      this.orderModel
        .countDocuments({
          status: { $in: [OrderStatus.CANCELLED, OrderStatus.EXPIRED] },
        })
        .exec(),
      this.orderModel
        .aggregate<{ totalRevenue: number }>([
          { $match: { status: OrderStatus.COMPLETED } },
          { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
        ])
        .exec(),
    ]);

    const items = await Promise.all(
      orders.map((order) => this.serializeOrder(order)),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue: revenueAgg[0]?.totalRevenue ?? 0,
      },
    };
  }

  private async syncOrderWithPayosInternal(
    order: OrderDocument,
  ): Promise<void> {
    if (order.status !== OrderStatus.PENDING) return;

    const info = await this.payosService.getPaymentLinkInfo(
      order.payosOrderCode,
    );
    if (!info) return;

    if (info.status === 'PAID' && info.amountPaid >= order.finalAmount) {
      const firstTx = info.transactions?.[0];
      const reference =
        firstTx?.reference || `PAYOS-${order.payosOrderCode}-${info.id}`;

      await this.completeOrderWithTransaction({
        order,
        amount: info.amountPaid,
        reference,
        paymentMethod: PaymentMethod.PAYOS_VIETQR,
        provider: 'PAYOS',
        data: (firstTx as unknown as Record<string, unknown>) ?? {
          payosStatus: info.status,
          paymentLinkId: info.id,
        },
      });
      return;
    }

    if (info.status === 'CANCELLED') {
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason =
        order.cancelReason ?? 'Đã hủy trên cổng thanh toán payOS';
      await order.save();
    } else if (info.status === 'EXPIRED') {
      order.status = OrderStatus.EXPIRED;
      order.cancelledAt = new Date();
      order.cancelReason =
        order.cancelReason ?? 'Hết thời hạn thanh toán trên payOS';
      await order.save();
    }
  }

  private async completeOrderWithTransaction(params: {
    order: OrderDocument;
    amount: number;
    reference: string;
    paymentMethod: PaymentMethod;
    provider: 'PAYOS' | 'SIMULATION' | 'MANUAL';
    data: Record<string, unknown>;
  }): Promise<void> {
    const { order, amount, reference, paymentMethod, provider, data } = params;

    await this.recordTransactionIfNotExists({
      order,
      amount,
      reference,
      provider,
      status: 'SUCCESS',
      data,
    });

    if (order.status !== OrderStatus.COMPLETED) {
      order.status = OrderStatus.COMPLETED;
      order.paymentMethod = paymentMethod;
      order.transactionReference = reference;
      order.paidAt = new Date();
      order.cancelledAt = null;
      order.cancelReason = null;
      await order.save();
    }

    await this.enrollmentsService.createEnrollmentForCompletedOrder(
      order.studentId.toString(),
      order.courseId.toString(),
    );
  }

  private async recordTransactionIfNotExists(params: {
    order: OrderDocument;
    amount: number;
    reference: string;
    provider: 'PAYOS' | 'SIMULATION' | 'MANUAL';
    status: 'SUCCESS' | 'IGNORED' | 'FAILED';
    data: Record<string, unknown>;
  }): Promise<void> {
    const { order, amount, reference, provider, status, data } = params;
    const exists = await this.transactionModel.exists({ reference }).exec();
    if (exists) return;

    try {
      await this.transactionModel.create({
        orderId: order._id,
        orderCode: order.orderCode,
        payosOrderCode: order.payosOrderCode,
        studentId: order.studentId,
        courseId: order.courseId,
        amount,
        reference,
        provider,
        status,
        counterAccountBankId:
          typeof data.counterAccountBankId === 'string'
            ? data.counterAccountBankId
            : null,
        counterAccountName:
          typeof data.counterAccountName === 'string'
            ? data.counterAccountName
            : null,
        counterAccountNumber:
          typeof data.counterAccountNumber === 'string'
            ? data.counterAccountNumber
            : null,
        transactionDateTime:
          typeof data.transactionDateTime === 'string'
            ? data.transactionDateTime
            : new Date().toISOString(),
        rawPayload: data,
      });
    } catch {
      // Bỏ qua lỗi trùng khóa unique nếu 2 request song song cùng ghi 1 reference
    }
  }

  private async findOrderOrThrow(orderId: string): Promise<OrderDocument> {
    if (!isValidObjectId(orderId)) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const order = await this.orderModel
      .findById(new Types.ObjectId(orderId))
      .exec();

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  private assertCanAccessOrder(
    order: OrderDocument,
    user: CurrentUserData,
  ): void {
    if (user.role === Role.ADMIN || user.role === Role.ACCOUNTANT) {
      return;
    }
    if (order.studentId.toString() !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn hàng này');
    }
  }

  private async serializeOrder(
    order: OrderDocument,
  ): Promise<OrderDetailResponseDto> {
    const [student, course] = await Promise.all([
      this.userModel
        .findById(order.studentId, { fullName: 1, email: 1 })
        .lean()
        .exec(),
      this.courseModel
        .findById(order.courseId, {
          title: 1,
          thumbnail: 1,
          instructorId: 1,
        })
        .lean()
        .exec(),
    ]);

    const instructor = course?.instructorId
      ? await this.userModel
          .findById(course.instructorId, { fullName: 1 })
          .lean()
          .exec()
      : null;

    return {
      id: order._id.toString(),
      orderCode: order.orderCode,
      payosOrderCode: order.payosOrderCode,
      studentId: order.studentId.toString(),
      studentName: student?.fullName ?? 'Học viên NextCode',
      studentEmail: student?.email ?? '',
      courseId: order.courseId.toString(),
      courseTitle: course?.title ?? 'Khóa học Pro NextCode',
      courseThumbnail: course?.thumbnail ?? null,
      instructorName: instructor?.fullName ?? 'Giảng viên NextCode',
      originalPrice: order.originalPrice,
      discountPrice: order.discountPrice ?? null,
      couponCode: order.couponCode ?? null,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentLinkId: order.paymentLinkId ?? null,
      checkoutUrl: order.checkoutUrl ?? null,
      qrCode: order.qrCode ?? null,
      qrImageUrl: order.qrImageUrl ?? null,
      bankBin: order.bankBin ?? null,
      bankName: order.bankName ?? null,
      accountNumber: order.accountNumber ?? null,
      accountName: order.accountName ?? null,
      transferDescription: order.transferDescription ?? null,
      transactionReference: order.transactionReference ?? null,
      simulationEnabled: this.isSimulationEnabled(),
      expiresAt: order.expiresAt.toISOString(),
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
      cancelReason: order.cancelReason ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
