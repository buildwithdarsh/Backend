import { PartialType } from '@nestjs/swagger';
import { CreateSegmentDto } from './create-segment.dto.js';

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) {}
