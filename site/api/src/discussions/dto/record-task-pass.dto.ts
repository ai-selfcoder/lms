import { IsString, Matches, MaxLength } from 'class-validator';

export class RecordTaskPassDto {
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9_-]+:[a-z0-9_-]+$/i)
  taskId!: string;

  @IsString()
  @MaxLength(1024)
  proof!: string;
}
