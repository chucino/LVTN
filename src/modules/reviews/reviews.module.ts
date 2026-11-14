import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../courses/schemas/course.schema.js';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema.js';
import { Report, ReportSchema } from '../questions/schemas/report.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import {
  CourseReview,
  CourseReviewSchema,
} from './schemas/course-review.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseReview.name, schema: CourseReviewSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

