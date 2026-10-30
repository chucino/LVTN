import { Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import mongoose, { Model } from 'mongoose';
import { Role } from '../common/constants/roles.enum.js';
import { UserStatus } from '../common/constants/user-status.enum.js';
import {
  Category,
  CategorySchema,
} from '../modules/courses/schemas/category.schema.js';
import {
  Course,
  CourseSchema,
} from '../modules/courses/schemas/course.schema.js';
import {
  SEED_CATEGORIES,
  SEED_COURSES,
  SEED_INSTRUCTORS,
} from './courses.seed-data.js';
import { recalculateCourseTotals } from '../modules/courses/course-totals.js';
import { User, UserSchema } from '../modules/users/schemas/user.schema.js';

const logger = new Logger('CoursesSeed');
const DEVELOPMENT_SEED_PASSWORD = 'NextCodeSeed@123';
export const PLACEHOLDER_VIDEO = 'PLACEHOLDER_VIDEO';

function buildChapters(
  course: (typeof SEED_COURSES)[number],
  lessonCounter: { value: number },
) {
  return course.chapters.map((chapter, chapterIndex) => ({
    title: chapter.title,
    order: chapterIndex + 1,
    lessons: chapter.lessons.map((topic, lessonIndex) => {
      lessonCounter.value += 1;
      const lesson: Record<string, string | number | boolean | null> = {
        title: `${chapterIndex + 1}.${lessonIndex + 1} ${topic}`,
        order: lessonIndex + 1,
        videoUrl: PLACEHOLDER_VIDEO,
        duration: [360, 480, 600][(lessonCounter.value - 1) % 3],
        hasQuiz: lessonCounter.value % 4 === 0,
        note: null,
        summary: null,
      };

      if (course.type === 'PRO') {
        lesson.note = `Ghi chép mẫu: ${topic}. Hãy thực hành lại ví dụ trong bài và lưu ý các khái niệm chính.`;
        lesson.summary = `Tóm tắt: ${topic}; vận dụng kiến thức vào bài tập của chương.`;
      }

      return lesson;
    }),
  }));
}

async function seedInstructors(
  userModel: Model<User>,
  password: string,
): Promise<Map<string, mongoose.Types.ObjectId>> {
  const passwordHash = await argon2.hash(password);
  const instructorIds = new Map<string, mongoose.Types.ObjectId>();

  for (const instructor of SEED_INSTRUCTORS) {
    const user = await userModel
      .findOneAndUpdate(
        { email: instructor.email },
        {
          $set: {
            fullName: instructor.fullName,
            role: Role.INSTRUCTOR,
            status: UserStatus.ACTIVE,
            avatar: null,
          },
          $setOnInsert: {
            email: instructor.email,
            passwordHash,
            interestedCategories: [],
            dateOfBirth: null,
            occupation: 'Giảng viên',
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .select({ _id: 1 })
      .exec();

    if (!user) {
      throw new Error(`Không thể tạo tài khoản giảng viên ${instructor.email}`);
    }
    instructorIds.set(instructor.email, user._id);
  }

  return instructorIds;
}

async function seedCourses(
  categoryModel: Model<Category>,
  courseModel: Model<Course>,
  instructorIds: Map<string, mongoose.Types.ObjectId>,
): Promise<void> {
  for (const name of SEED_CATEGORIES) {
    await categoryModel.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, runValidators: true },
    );
  }

  const categories = await categoryModel
    .find({}, { _id: 1, name: 1 })
    .lean()
    .exec();
  const categoryIds = new Map(
    categories.map((category) => [category.name, category._id]),
  );
  const lessonCounter = { value: 0 };

  for (const course of SEED_COURSES) {
    const instructorId = instructorIds.get(course.instructorEmail);
    const categoryId = categoryIds.get(course.categoryName);
    if (!instructorId || !categoryId) {
      throw new Error(
        `Thiếu giảng viên hoặc danh mục của khóa "${course.title}"`,
      );
    }

    await courseModel
      .findOneAndUpdate(
        { title: course.title },
        {
          $set: {
            description: course.description,
            type: course.type,
            level: course.level,
            targetAudience: course.targetAudience,
            learningOutcomes: course.learningOutcomes,
            requirements: course.requirements,
            price: course.price,
            discountPrice: course.discountPrice,
            status: course.status,
            instructorId,
            categoryId,
            avgRating: course.avgRating,
            thumbnail: null,
          },
          $setOnInsert: {
            chapters: buildChapters(course, lessonCounter),
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  for (const course of SEED_COURSES) {
    const seededCourse = await courseModel
      .findOne({ title: course.title }, { _id: 1 })
      .lean()
      .exec();
    if (!seededCourse) {
      throw new Error(`Không thể tạo khóa học "${course.title}"`);
    }
    await recalculateCourseTotals(courseModel, seededCourse._id);
  }
}

export async function runCoursesSeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Seeder khóa học bị vô hiệu hóa trong môi trường production',
    );
  }

  const password =
    process.env.SEED_INSTRUCTOR_PASSWORD ??
    (process.env.NODE_ENV === 'development'
      ? DEVELOPMENT_SEED_PASSWORD
      : undefined);
  if (!password) {
    throw new Error(
      'Cần đặt SEED_INSTRUCTOR_PASSWORD hoặc NODE_ENV=development để dùng mật khẩu seed mặc định',
    );
  }

  const uri =
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nextcode_db';
  await mongoose.connect(uri);

  try {
    const userModel = mongoose.model<User>(User.name, UserSchema, 'users');
    const categoryModel = mongoose.model<Category>(
      Category.name,
      CategorySchema,
      'categories',
    );
    const courseModel = mongoose.model<Course>(
      Course.name,
      CourseSchema,
      'courses',
    );

    const instructorIds = await seedInstructors(userModel, password);
    await seedCourses(categoryModel, courseModel, instructorIds);
    logger.log(
      `Seed hoàn tất: ${SEED_CATEGORIES.length} danh mục, ${SEED_INSTRUCTORS.length} giảng viên, ${SEED_COURSES.length} khóa học.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

runCoursesSeed().catch((error: unknown) => {
  logger.error(
    'Seed khóa học thất bại',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
