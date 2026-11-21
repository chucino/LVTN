import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  CouponPreviewResponse,
  ManageOrdersQuery,
  ManageOrdersResponse,
  MyOrdersResponse,
  OrderDetail,
  OrderStatus,
} from '@/types/order';

export const ordersApi = {
  async previewCheckout(
    courseId: string,
    couponCode?: string,
    signal?: AbortSignal,
  ): Promise<CouponPreviewResponse> {
    const response = await http.post<ApiResponse<CouponPreviewResponse>>(
      '/orders/preview',
      {
        courseId,
        couponCode: couponCode?.trim() || undefined,
      },
      { signal },
    );
    return response.data.data;
  },

  async createOrder(
    courseId: string,
    couponCode?: string,
  ): Promise<OrderDetail> {
    const response = await http.post<ApiResponse<OrderDetail>>('/orders', {
      courseId,
      couponCode: couponCode?.trim() || undefined,
    });
    return response.data.data;
  },

  async getMyOrders(
    status?: OrderStatus,
    signal?: AbortSignal,
  ): Promise<MyOrdersResponse> {
    const response = await http.get<ApiResponse<MyOrdersResponse>>(
      '/orders/my-orders',
      {
        params: status ? { status } : {},
        signal,
      },
    );
    return response.data.data;
  },

  async getOrderById(
    orderId: string,
    signal?: AbortSignal,
  ): Promise<OrderDetail> {
    const response = await http.get<ApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(orderId)}`,
      { signal },
    );
    return response.data.data;
  },

  async syncOrderPayment(orderId: string): Promise<OrderDetail> {
    const response = await http.post<ApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(orderId)}/sync-payment`,
    );
    return response.data.data;
  },

  async simulateOrderPayment(orderId: string): Promise<OrderDetail> {
    const response = await http.post<ApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(orderId)}/simulate-payment`,
    );
    return response.data.data;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<OrderDetail> {
    const response = await http.post<ApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      { reason },
    );
    return response.data.data;
  },

  async getManageOrders(
    params?: ManageOrdersQuery,
    signal?: AbortSignal,
  ): Promise<ManageOrdersResponse> {
    const response = await http.get<ApiResponse<ManageOrdersResponse>>(
      '/manage/orders',
      {
        params,
        signal,
      },
    );
    return response.data.data;
  },

  async confirmOrderManually(orderId: string): Promise<OrderDetail> {
    const response = await http.post<ApiResponse<OrderDetail>>(
      `/manage/orders/${encodeURIComponent(orderId)}/confirm`,
    );
    return response.data.data;
  },
};
