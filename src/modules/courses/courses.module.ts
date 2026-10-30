import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema.js';
import { Course, CourseSchema } from './schemas/course.schema.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { CourseManageController } from './course-manage.controller.js';
import { CourseManageService } from './course-manage.service.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [CoursesController, CourseManageController],
  providers: [CoursesService, CourseManageService, RolesGuard],
  exports: [CoursesService],
})
export class CoursesModule {}
