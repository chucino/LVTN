import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
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
import { OrdersService } from './orders.service.js';

@ApiTags('Orders & Payments (payOS)')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/preview')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Xem trước số tiền thanh toán khóa học Pro và kiểm tra mã giảm giá (tính toán tại Server)',
  })
  @ApiResponse({ status: 200, type: CouponPreviewResponseDto })
  previewCheckout(
    @Body() dto: ValidateCouponDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CouponPreviewResponseDto> {
    return this.ordersService.previewCheckout(user.userId, dto);
  }

  @Post('orders')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Tạo đơn hàng mua khóa học Pro và khởi tạo mã thanh toán VietQR qua cổng payOS',
  })
  @ApiResponse({ status: 201, type: OrderDetailResponseDto })
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.createOrder(user.userId, dto);
  }

  @Get('orders/my-orders')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng và lịch sử giao dịch của học viên',
  })
  @ApiResponse({ status: 200, type: MyOrdersResponseDto })
  getMyOrders(
    @Query() query: MyOrdersQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<MyOrdersResponseDto> {
    return this.ordersService.getMyOrders(user.userId, query);
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({
    summary:
      'Xem chi tiết đơn hàng và thông tin mã QR thanh toán (tự động đồng bộ trạng thái từ payOS)',
  })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của đơn hàng' })
  @ApiResponse({ status: 200, type: OrderDetailResponseDto })
  getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getOrderByIdForUser(id, user);
  }

  @Post('orders/:id/sync-payment')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Chủ động đồng bộ trạng thái thanh toán trực tiếp từ cổng payOS và tự động mở khóa học nếu đã thanh toán',
  })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của đơn hàng' })
  @ApiResponse({ status: 200, type: OrderDetailResponseDto })
  syncOrderPayment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.syncOrderPayment(id, user);
  }

  @Post('orders/:id/simulate-payment')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Giả lập thanh toán thành công (chỉ hoạt động khi PAYMENT_SIMULATION_ENABLED=true phục vụ demo luận văn)',
  })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của đơn hàng' })
  @ApiResponse({ status: 200, type: OrderDetailResponseDto })
  simulateOrderPayment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.simulateOrderPayment(id, user);
  }

  @Post('orders/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy đơn hàng đang chờ thanh toán và hủy link thanh toán trên payOS',
  })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của đơn hàng' })
  @ApiResponse({ status: 200, type: OrderDetailResponseDto })
  cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.cancelOrder(id, user, dto);
  }

  @Post('payments/payos/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Webhook nhận thông báo biến động số dư tự động từ cổng thanh toán payOS (xác thực HMAC-SHA256)',
  })
  handlePayosWebhook(
    @Body() payload: PayosWebhookPayloadDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.ordersService.handlePayosWebhook(payload);
  }

  @Get('manage/orders')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({
    summary: 'Admin / Kế toán xem danh sách đơn hàng và thống kê doanh thu',
  })
  @ApiResponse({ status: 200, type: ManageOrdersResponseDto })
  getManageOrders(
    @Query() query: ManageOrdersQueryDto,
  ): Promise<ManageOrdersResponseDto> {
    return this.ordersService.getManageOrders(query);
  }

  @Post('manage/orders/:id/confirm')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Admin / Kế toán xác nhận thanh toán thủ công cho đơn hàng và cấp quyền học khóa Pro',
  })
  @ApiParam({ name: 'id', description: 'Mongo ObjectId của đơn hàng' })
  @ApiResponse({ status: 200, type: OrderDetailResponseDto })
  confirmOrderManually(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.confirmOrderManually(id, user);
  }
}
