import { IsObject, IsOptional, IsString } from 'class-validator';

// Bulk sync. Merge semantics: only the union of mentioned taskIds is touched.
export class SyncProgressDto {
  @IsOptional()
  @IsString({ each: true })
  solved?: string[];

  @IsOptional()
  @IsObject()
  solvedAt?: Record<string, string>;

  @IsOptional()
  @IsObject()
  code?: Record<string, string>;
}

// Single-task upsert.
export class UpsertTaskDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  solved?: boolean;
}
