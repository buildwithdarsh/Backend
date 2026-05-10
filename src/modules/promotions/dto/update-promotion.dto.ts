import { PartialType } from '@nestjs/swagger';
import { CreatePromotionDto } from './create-promotion.dto.js';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}
