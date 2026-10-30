import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema.js';

export async function recalculateCourseTotals(
  courseModel: Model<Course>,
  courseId: string | Types.ObjectId,
): Promise<Pick<Course, 'totalChapters' | 'totalLessons' | 'totalDuration'>> {
  const course = await courseModel
    .findById(courseId)
    .select({ chapters: 1 })
    .lean()
    .exec();

  if (!course) {
    throw new NotFoundException('Không tìm thấy khóa học');
  }

  const chapters = course.chapters ?? [];
  const totalLessons = chapters.reduce(
    (count, chapter) => count + chapter.lessons.length,
    0,
  );
  const totalDuration = chapters.reduce(
    (duration, chapter) =>
      duration +
      chapter.lessons.reduce((chapterDuration, lesson) => {
        return chapterDuration + lesson.duration;
      }, 0),
    0,
  );
  const totals = {
    totalChapters: chapters.length,
    totalLessons,
    totalDuration,
  };

  await courseModel.updateOne({ _id: courseId }, { $set: totals }).exec();
  return totals;
}
