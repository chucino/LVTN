import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizAnswerItemDto {
  @ApiProperty({
    example: '6650c1f6f2f4f6e4c8bfe130',
    description: 'Mongo ObjectId của câu hỏi trắc nghiệm',
  })
  @IsMongoId({ message: 'questionId phải là Mongo ObjectId hợp lệ' })
  questionId!: string;

  @ApiProperty({
    example: 1,
    description: 'Chỉ số đáp án học viên lựa chọn (0-based)',
  })
  @Type(() => Number)
  @IsInt({ message: 'selectedOption phải là số nguyên' })
  @Min(0, { message: 'selectedOption không được nhỏ hơn 0' })
  selectedOption!: number;
}

export class SubmitQuizDto {
  @ApiProperty({
    type: [QuizAnswerItemDto],
    description: 'Danh sách câu trả lời cho các câu hỏi trắc nghiệm của bài giảng',
  })
  @IsArray({ message: 'answers phải là một mảng' })
  @ArrayMinSize(1, { message: 'Cần gửi ít nhất 1 câu trả lời' })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers!: QuizAnswerItemDto[];
}

