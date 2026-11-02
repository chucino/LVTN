import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Course, CourseSchema } from '../courses/schemas/course.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { CertificatesController } from './certificates.controller.js';
import { CertificatesService } from './certificates.service.js';
import {
  Certificate,
  CertificateSchema,
} from './schemas/certificate.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, RolesGuard],
  exports: [CertificatesService],
})
export class CertificatesModule {}

