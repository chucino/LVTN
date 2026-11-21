import { createHmac } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import {
  OrderStatus,
  PaymentMethod,
} from '../../common/constants/order.enum.js';
import { Role } from '../../common/constants/roles.enum.js';
import { Course } from '../courses/schemas/course.schema.js';
import { EnrollmentsService } from '../enrollments/enrollments.service.js';
import { EnrollmentDocument } from '../enrollments/schemas/enrollment.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { OrdersService } from './orders.service.js';
import { PayosService } from './payos.service.js';
import { OrderDocument } from './schemas/order.schema.js';
import { PaymentTransactionDocument } from './schemas/payment-transaction.schema.js';

const TEST_CHECKSUM_KEY = 'test_checksum_key_for_payos_hmac_sha256_verification';

describe('PayosService & OrdersService', () => {
  let payosService: PayosService;
  let ordersService: OrdersService;
  let configValues: Record<string, string>;

  const studentId = new Types.ObjectId();
  const courseId = new Types.ObjectId();
  const orderId = new Types.ObjectId();

  const mockOrderModel = {
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    exists: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  };

  const mockTransactionModel = {
    exists: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  };

  const mockCourseModel = {
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
  };

  const mockUserModel = {
    findById: vi.fn(),
    find: vi.fn(),
  };

  const mockEnrollmentModel = {
    exists: vi.fn(),
  };

  const mockEnrollmentsService = {
    createEnrollmentForCompletedOrder: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    configValues = {
      NODE_ENV: 'development',
      PAYOS_CLIENT_ID: 'client-id-123',
      PAYOS_API_KEY: 'api-key-123',
      PAYOS_CHECKSUM_KEY: TEST_CHECKSUM_KEY,
      PAYMENT_SIMULATION_ENABLED: 'true',
      ORDER_EXPIRE_MINUTES: '15',
      CLIENT_ORIGIN: 'http://localhost:5173',
    };

    const configService = {
      get: vi.fn((key: string, defaultVal?: unknown) =>
        key in configValues ? configValues[key] : defaultVal,
      ),
    } as unknown as ConfigService;

    payosService = new PayosService(configService);
    ordersService = new OrdersService(
      mockOrderModel as unknown as Model<OrderDocument>,
      mockTransactionModel as unknown as Model<PaymentTransactionDocument>,
      mockCourseModel as unknown as Model<Course>,
      mockUserModel as unknown as Model<User>,
      mockEnrollmentModel as unknown as Model<EnrollmentDocument>,
      configService,
      payosService,
      mockEnrollmentsService as unknown as EnrollmentsService,
    );
  });

  it('tính chữ ký tạo link thanh toán và xác thực chữ ký Webhook payOS chuẩn HMAC-SHA256', () => {
    const signature = payosService.createPaymentRequestSignature({
      amount: 499000,
      cancelUrl: 'http://localhost:5173/cancel',
      description: 'NEXTCODE DH8K2M9',
      orderCode: 123456789,
      returnUrl: 'http://localhost:5173/success',
    });

    expect(signature).toHaveLength(64);

    const webhookData = {
      orderCode: 123456789,
      amount: 499000,
      description: 'NEXTCODE DH8K2M9',
      accountNumber: '0381234567',
      reference: 'FT26320123456',
      transactionDateTime: '2026-11-15 14:30:00',
      currency: 'VND',
      paymentLinkId: 'plink_123',
      code: '00',
      desc: 'success',
    };

    const sortedQuery = Object.keys(webhookData)
      .sort()
      .map((k) => `${k}=${String(webhookData[k as keyof typeof webhookData])}`)
      .join('&');
    const validWebhookSig = createHmac('sha256', TEST_CHECKSUM_KEY)
      .update(sortedQuery)
      .digest('hex');

    expect(
      payosService.verifyWebhookSignature(webhookData, validWebhookSig),
    ).toBe(true);
    expect(
      payosService.verifyWebhookSignature(webhookData, '0'.repeat(64)),
    ).toBe(false);
  });

  it('tính toán đúng giá khóa học Pro từ DB và áp dụng mã giảm giá NEXTCODE10 / TEST2K', async () => {
    mockCourseModel.findOne.mockReturnValue({
      lean: () => ({
        exec: vi.fn().mockResolvedValue({
          _id: courseId,
          title: 'Fullstack NestJS & Vue 3 Pro',
          type: CourseType.PRO,
          status: CourseStatus.APPROVED,
          price: 600000,
          discountPrice: 500000,
        }),
      }),
    });
    mockEnrollmentModel.exists.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    const preview10 = await ordersService.previewCheckout(
      studentId.toString(),
      {
        courseId: courseId.toString(),
        couponCode: 'NEXTCODE10',
      },
    );

    expect(preview10.baseAmount).toBe(500000);
    expect(preview10.discountAmount).toBe(50000);
    expect(preview10.finalAmount).toBe(450000);

    const preview2k = await ordersService.previewCheckout(
      studentId.toString(),
      {
        courseId: courseId.toString(),
        couponCode: 'TEST2K',
      },
    );
    expect(preview2k.finalAmount).toBe(2000);
  });

  it('chặn tạo đơn hàng nếu học viên đã sở hữu khóa học', async () => {
    mockCourseModel.findOne.mockReturnValue({
      lean: () => ({
        exec: vi.fn().mockResolvedValue({
          _id: courseId,
          title: 'Fullstack NestJS & Vue 3 Pro',
          type: CourseType.PRO,
          status: CourseStatus.APPROVED,
          price: 500000,
          discountPrice: null,
        }),
      }),
    });
    mockEnrollmentModel.exists.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    });

    await expect(
      ordersService.previewCheckout(studentId.toString(), {
        courseId: courseId.toString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('xử lý Webhook payOS thành công, cập nhật trạng thái COMPLETED và mở khóa học Pro', async () => {
    const saveOrder = vi.fn().mockResolvedValue(undefined);
    const pendingOrder = {
      _id: orderId,
      orderCode: 'DH8K2M9A',
      payosOrderCode: 987654321,
      studentId,
      courseId,
      originalPrice: 500000,
      discountPrice: null,
      couponCode: null,
      discountAmount: 0,
      finalAmount: 500000,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PAYOS_VIETQR,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
      save: saveOrder,
    };

    mockOrderModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(pendingOrder),
    });
    mockTransactionModel.exists.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    mockTransactionModel.create.mockResolvedValue({});
    mockEnrollmentsService.createEnrollmentForCompletedOrder.mockResolvedValue(
      {},
    );

    const webhookData = {
      orderCode: 987654321,
      amount: 500000,
      description: 'NEXTCODE DH8K2M9A',
      reference: 'MBVCB.99887766',
      code: '00',
    };
    const sortedQuery = Object.keys(webhookData)
      .sort()
      .map((k) => `${k}=${String(webhookData[k as keyof typeof webhookData])}`)
      .join('&');
    const signature = createHmac('sha256', TEST_CHECKSUM_KEY)
      .update(sortedQuery)
      .digest('hex');

    const res = await ordersService.handlePayosWebhook({
      code: '00',
      desc: 'success',
      success: true,
      data: webhookData,
      signature,
    });

    expect(res.success).toBe(true);
    expect(pendingOrder.status).toBe(OrderStatus.COMPLETED);
    expect(saveOrder).toHaveBeenCalledTimes(1);
    expect(
      mockEnrollmentsService.createEnrollmentForCompletedOrder,
    ).toHaveBeenCalledWith(studentId.toString(), courseId.toString());
  });

  it('từ chối giả lập thanh toán khi PAYMENT_SIMULATION_ENABLED=false hoặc NODE_ENV=production', async () => {
    configValues.PAYMENT_SIMULATION_ENABLED = 'false';

    await expect(
      ordersService.simulateOrderPayment(orderId.toString(), {
        userId: studentId.toString(),
        email: 'student@nextcode.vn',
        role: Role.STUDENT,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      ordersService.handlePayosWebhook({
        data: { orderCode: 123, amount: 2000 },
        signature: 'invalid',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
