import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const LEARNING_EVENT_TYPES = ['started', 'run', 'failed', 'passed', 'hint', 'completed'] as const;

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
