import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const LEARNING_EVENT_TYPES = [
  'landing_view', 'goal_selected', 'diagnostic_started', 'diagnostic_completed',
  'first_task_started', 'started', 'run', 'feedback', 'first_pass', 'passed',
  'failed', 'hint', 'completed', 'topic_completed', 'artifact_saved',
  'report_created', 'report_shared', 'account_created', 'checkout_started',
  'subscription_started', 'cancelled',
] as const;

export class LearningEventDto {
  @IsString()
  @MaxLength(180)
  id!: string;

  @IsIn(LEARNING_EVENT_TYPES)
  type!: (typeof LEARNING_EVENT_TYPES)[number];

  @IsString()
  @MaxLength(180)
  itemId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  courseId?: string;

  @IsDateString()
  at!: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, string | number | boolean>;
}

export class SyncEventsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => LearningEventDto)
  events!: LearningEventDto[];
}
