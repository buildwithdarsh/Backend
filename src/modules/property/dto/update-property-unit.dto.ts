import { PartialType } from '@nestjs/swagger';
import { CreatePropertyUnitDto } from './create-property-unit.dto.js';

export class UpdatePropertyUnitDto extends PartialType(CreatePropertyUnitDto) {}
