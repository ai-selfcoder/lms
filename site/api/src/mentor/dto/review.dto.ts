import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  taskId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60_000)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  problem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  testOutput?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  type?: string; // "functional" | "review"
}
