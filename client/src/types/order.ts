export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type PaymentMethod = 'PAYOS_VIETQR' | 'SIMULATION' | 'MANUAL';

export interface AvailableCouponItem {
  code: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
}

export interface CouponPreviewResponse {
  valid: boolean;
  couponCode: string | null;
  message: string;
  originalPrice: number;
  courseDiscountPrice: number | null;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  availableCoupons: AvailableCouponItem[];
}

export interface OrderDetail {
  id: string;
  orderCode: string;
  payosOrderCode: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  instructorName: string;
  originalPrice: number;
  discountPrice: number | null;
  couponCode: string | null;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  qrImageUrl: string | null;
  bankBin: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  transferDescription: string | null;
  transactionReference: string | null;
  simulationEnabled: boolean;
  expiresAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface PaymentTransactionItem {
  id: string;
  orderId: string;
  orderCode: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  reference: string;
  provider: 'PAYOS' | 'SIMULATION' | 'MANUAL';
  transactionDateTime: string | null;
  createdAt: string;
}

export interface MyOrdersResponse {
  orders: OrderDetail[];
  transactions: PaymentTransactionItem[];
}

export interface ManageOrdersQuery {
  keyword?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface ManageOrdersStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface ManageOrdersResponse {
  items: OrderDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: ManageOrdersStats;
}
