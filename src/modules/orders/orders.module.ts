import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Course, CourseSchema } from '../courses/schemas/course.schema.js';
import { EnrollmentsModule } from '../enrollments/enrollments.module.js';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PayosService } from './payos.service.js';
import { Order, OrderSchema } from './schemas/order.schema.js';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema.js';

@Module({
  imports: [
    EnrollmentsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PayosService, RolesGuard],
  exports: [OrdersService, PayosService],
})
export class OrdersModule {}
