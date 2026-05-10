import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryZoneDto } from './create-delivery-zone.dto.js';

export class UpdateDeliveryZoneDto extends PartialType(CreateDeliveryZoneDto) {}
