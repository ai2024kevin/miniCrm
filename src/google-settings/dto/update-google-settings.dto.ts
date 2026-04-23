import { IsOptional, IsString } from 'class-validator';

export class UpdateGoogleSettingsDto {
  @IsOptional()
  @IsString()
  spreadsheet_id?: string | null;

  @IsOptional()
  @IsString()
  folder_id?: string | null;

  @IsOptional()
  @IsString()
  title_prefix?: string | null;
}
