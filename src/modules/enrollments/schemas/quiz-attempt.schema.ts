import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type QuizAttemptDocument = HydratedDocument<QuizAttempt>;

@Schema({
  timestamps: false,
  collection: 'quiz_attempts',
})
export class QuizAttempt {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  studentId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  questionId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  selectedOption!: number;

  @Prop({ required: true })
  isCorrect!: boolean;

  @Prop({ type: Date, required: true, default: () => new Date() })
  attemptedAt!: Date;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);

QuizAttemptSchema.index({ studentId: 1, questionId: 1, attemptedAt: -1 });

