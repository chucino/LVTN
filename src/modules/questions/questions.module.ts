import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../courses/schemas/course.schema.js';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema.js';
import {
  LessonProgress,
  LessonProgressSchema,
} from '../enrollments/schemas/lesson-progress.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import {
  ManageReportsController,
  NotificationsController,
  QuestionsController,
} from './questions.controller.js';
import { QuestionsService } from './questions.service.js';
import {
  LessonComment,
  LessonCommentSchema,
} from './schemas/lesson-comment.schema.js';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema.js';
import { Report, ReportSchema } from './schemas/report.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LessonComment.name, schema: LessonCommentSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    QuestionsController,
    ManageReportsController,
    NotificationsController,
  ],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
