import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CertificatesModule } from '../certificates/certificates.module.js';
import { Course, CourseSchema } from '../courses/schemas/course.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema.js';
import {
  LessonProgress,
  LessonProgressSchema,
} from './schemas/lesson-progress.schema.js';
import {
  QuizAttempt,
  QuizAttemptSchema,
} from './schemas/quiz-attempt.schema.js';

@Module({
  imports: [
    CertificatesModule,
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, RolesGuard],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}

