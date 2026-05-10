import { PartialType } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto.js';

export class UpdateContentDto extends PartialType(CreateContentDto) {}
