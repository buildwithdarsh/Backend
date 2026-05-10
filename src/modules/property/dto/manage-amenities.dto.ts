import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManageAmenitiesDto {
  @ApiProperty({ description: 'Amenity IDs to associate', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  amenityIds!: string[];
}
