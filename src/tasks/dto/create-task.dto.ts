import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  client_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  deal_id?: number | null;

  @IsString()
  @MinLength(1)
  @Matches(/.*\S.*/)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsIn(['todo', 'doing', 'done'])
  status!: 'todo' | 'doing' | 'done';

  @IsBoolean()
  is_done!: boolean;

  @IsOptional()
  @IsDateString()
  due_date?: string | null;
}
