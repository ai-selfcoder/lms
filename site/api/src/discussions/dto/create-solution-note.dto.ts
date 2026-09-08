import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSolutionNoteDto {
  @IsString()
  @MinLength(24)
  @MaxLength(1500)
  body!: string;
}
