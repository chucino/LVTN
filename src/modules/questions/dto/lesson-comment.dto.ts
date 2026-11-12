import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/constants/roles.enum.js';
import {
  CommentReactionType,
  CommentVisibilityStatus,
} from '../schemas/lesson-comment.schema.js';
import {
  ReportActionType,
  ReportStatus,
  ReportTargetType,
} from '../schemas/report.schema.js';

export class CreateLessonCommentDto {
  @ApiProperty({
    example: 'Cho em hỏi tại sao biến này lại nằm trong phạm vi closure ạ?',
    description: 'Nội dung bình luận hoặc câu trả lời (1..2000 ký tự)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @MinLength(1, { message: 'Nội dung bình luận tối thiểu 1 ký tự' })
  @MaxLength(2000, { message: 'Nội dung bình luận tối đa 2000 ký tự' })
  content!: string;

  @ApiPropertyOptional({
    example: '6650c1f6f2f4f6e4c8bfe999',
    description: 'ID của bình luận gốc nếu đây là câu trả lời (phản hồi)',
  })
  @IsOptional()
  @IsMongoId({ message: 'parentId không hợp lệ' })
  parentId?: string;

  @ApiPropertyOptional({
    example: '6650c1f6f2f4f6e4c8bfe111',
    description: 'ID của người dùng được gắn thẻ @Tên khi phản hồi',
  })
  @IsOptional()
  @IsMongoId({ message: 'replyToUserId không hợp lệ' })
  replyToUserId?: string;
}

export class ToggleCommentReactionDto {
  @ApiProperty({
    enum: CommentReactionType,
    example: CommentReactionType.LIKE,
    description: 'Loại biểu cảm (LIKE)',
  })
  @IsEnum(CommentReactionType, { message: 'Loại biểu cảm không hợp lệ' })
  type!: CommentReactionType;
}

export class ReportLessonCommentDto {
  @ApiProperty({
    example: 'Bình luận spam hoặc quảng cáo không liên quan bài học',
    description: 'Lý do báo cáo bình luận vi phạm',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn hoặc nhập lý do báo cáo' })
  @MaxLength(500, { message: 'Lý do báo cáo tối đa 500 ký tự' })
  reason!: string;
}

export class ResolveReportDto {
  @ApiProperty({
    enum: ReportActionType,
    example: ReportActionType.DELETE_AND_REMIND,
    description:
      'Hành động xử lý: DISMISS (Bỏ qua), DELETE_AND_REMIND (Xóa mềm bình luận & nhắc nhở, +1 vi phạm), ESCALATE (Chuyển lên Admin - chỉ Giảng viên), APPLY_PENALTY (Xử lý vi phạm & áp dụng hình phạt tự động - chỉ Admin)',
  })
  @IsEnum(ReportActionType, { message: 'Hành động xử lý không hợp lệ' })
  action!: ReportActionType;

  @ApiPropertyOptional({
    example: 'Bình luận chứa nội dung quảng cáo không phù hợp với bài học.',
    description: 'Ghi chú xử lý / lời nhắc gửi tới người dùng',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú xử lý tối đa 500 ký tự' })
  note?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Vi phạm đặc biệt nghiêm trọng: Admin đình chỉ tài khoản ngay (chỉ áp dụng cho APPLY_PENALTY)',
  })
  @IsOptional()
  @IsBoolean()
  severeViolation?: boolean;
}

export class ManageReportsQueryDto {
  @ApiPropertyOptional({
    example: '6650c1f6f2f4f6e4c8bfe125',
    description: 'Lọc theo khóa học',
  })
  @IsOptional()
  @IsMongoId({ message: 'courseId không hợp lệ' })
  courseId?: string;

  @ApiPropertyOptional({
    example: 'PENDING',
    description: 'Lọc theo trạng thái xử lý (ALL | PENDING | RESOLVED | DISMISSED)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CommentAuthorDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe111' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Quang' })
  fullName!: string;

  @ApiProperty({ example: null, nullable: true })
  avatar!: string | null;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role!: Role;

  @ApiPropertyOptional({
    example: false,
    description:
      'True khi người bình luận chính là Giảng viên được phân công phụ trách khóa học này (hiển thị nhãn TÁC GIẢ)',
  })
  isCourseAuthor?: boolean;
}

export class CommentReplyToUserDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe111' })
  userId!: string;

  @ApiProperty({ example: 'Nguyễn Quang' })
  fullName!: string;
}

export class CommentReactionSummaryItemDto {
  @ApiProperty({ enum: CommentReactionType })
  type!: CommentReactionType;

  @ApiProperty({ example: 2 })
  count!: number;
}

export class LessonCommentItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe888' })
  id!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  courseId!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe201' })
  lessonId!: string;

  @ApiProperty({ example: null, nullable: true })
  parentId!: string | null;

  @ApiProperty({ type: () => CommentReplyToUserDto, nullable: true })
  replyToUser!: CommentReplyToUserDto | null;

  @ApiProperty({ type: () => CommentAuthorDto })
  author!: CommentAuthorDto;

  @ApiProperty({ example: 'Bài giảng rất dễ hiểu, cảm ơn thầy!' })
  content!: string;

  @ApiProperty({
    enum: CommentVisibilityStatus,
    example: CommentVisibilityStatus.VISIBLE,
  })
  visibilityStatus!: CommentVisibilityStatus;

  @ApiProperty({ example: 3 })
  totalReactions!: number;

  @ApiProperty({ type: () => [CommentReactionSummaryItemDto] })
  reactionSummary!: CommentReactionSummaryItemDto[];

  @ApiProperty({
    enum: CommentReactionType,
    nullable: true,
    example: CommentReactionType.LIKE,
  })
  myReaction!: CommentReactionType | null;

  @ApiProperty({ example: false })
  isReportedByMe!: boolean;

  @ApiProperty({ example: 0 })
  reportsCount!: number;

  @ApiProperty({ example: true })
  canDelete!: boolean;

  @ApiProperty({ example: '2026-11-12T17:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: () => [LessonCommentItemDto] })
  replies!: LessonCommentItemDto[];
}

export class LessonCommentsResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  courseId!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe201' })
  lessonId!: string;

  @ApiProperty({ example: 47 })
  totalComments!: number;

  @ApiProperty({ example: 18 })
  totalRootComments!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description:
      'Thời điểm hết hạn cấm bình luận của người dùng hiện tại (null nếu không bị cấm)',
  })
  myCommentBannedUntil!: string | null;

  @ApiProperty({ type: () => [LessonCommentItemDto] })
  items!: LessonCommentItemDto[];
}

export class ViolationHistoryItemDto {
  @ApiProperty()
  reason!: string;

  @ApiProperty()
  actionTaken!: string;

  @ApiProperty()
  penaltySummary!: string;

  @ApiProperty()
  resolvedAt!: string;
}

export class ReportQueueItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ReportTargetType })
  targetType!: ReportTargetType;

  @ApiProperty()
  targetId!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseTitle!: string;

  @ApiProperty()
  lessonId!: string;

  @ApiProperty()
  lessonTitle!: string;

  @ApiProperty({ type: () => CommentAuthorDto })
  reporter!: CommentAuthorDto;

  @ApiProperty({ type: () => CommentAuthorDto })
  targetAuthor!: CommentAuthorDto;

  @ApiProperty({ example: 0 })
  targetAuthorViolationCount!: number;

  @ApiProperty({ nullable: true })
  targetAuthorCommentBannedUntil!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  targetAuthorStatus!: string;

  @ApiProperty({ example: 1, description: 'Số học viên cùng báo cáo bình luận này' })
  duplicateReportCount!: number;

  @ApiProperty({
    type: () => [ViolationHistoryItemDto],
    description: 'Lịch sử vi phạm gần nhất của tác giả bình luận (chỉ Admin nhận)',
  })
  targetAuthorViolationHistory!: ViolationHistoryItemDto[];

  @ApiProperty()
  commentContent!: string;

  @ApiProperty({ enum: CommentVisibilityStatus })
  commentVisibilityStatus!: CommentVisibilityStatus;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ enum: ReportStatus })
  status!: ReportStatus;

  @ApiProperty()
  escalatedToAdmin!: boolean;

  @ApiProperty({ enum: ReportActionType, nullable: true })
  actionTaken!: ReportActionType | null;

  @ApiProperty({ nullable: true })
  moderationNote!: string | null;

  @ApiProperty({ type: () => CommentAuthorDto, nullable: true })
  resolvedBy!: CommentAuthorDto | null;

  @ApiProperty({ nullable: true })
  resolvedAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class ManageReportsResponseDto {
  @ApiProperty({ type: () => [ReportQueueItemDto] })
  items!: ReportQueueItemDto[];

  @ApiProperty()
  summary!: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };

  @ApiProperty()
  courses!: Array<{ id: string; title: string }>;
}

export class NotificationItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ nullable: true })
  courseId!: string | null;

  @ApiProperty({ nullable: true })
  lessonId!: string | null;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: string;
}
