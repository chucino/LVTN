import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, RolesGuard],
  exports: [UploadsService],
})
export class UploadsModule {}

