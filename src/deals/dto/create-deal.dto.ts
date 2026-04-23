import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDealDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  client_id?: number;

  @IsString()
  @MinLength(1)
  @Matches(/.*\S.*/)
  title!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsIn(['new', 'in_progress', 'won', 'lost'])
  stage!: 'new' | 'in_progress' | 'won' | 'lost';

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsDateString()
  close_date?: string | null;
}
