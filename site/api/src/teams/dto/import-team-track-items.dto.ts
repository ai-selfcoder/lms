import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, Matches } from 'class-validator';

export class ImportTeamTrackItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]+:[a-z0-9_-]+$/i, { each: true })
  taskIds!: string[];
}
