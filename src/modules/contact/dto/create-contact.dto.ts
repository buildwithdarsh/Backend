import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Contact email' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Message subject' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ description: 'Service type requested' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  service?: string;

  @ApiPropertyOptional({ description: 'Budget range' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  budget?: string;

  @ApiProperty({ description: 'Contact message' })
  @IsNotEmpty()
  @IsString()
  message!: string;
}
