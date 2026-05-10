import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty()
  @IsString()
  value!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  label?: string;
}

class BulkSettingEntry {
  @IsString()
  group!: string;

  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({ type: [BulkSettingEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSettingEntry)
  settings!: BulkSettingEntry[];
}
