import { PartialType } from '@nestjs/swagger';
import { CreateRewardDto } from './create-reward.dto.js';

export class UpdateRewardDto extends PartialType(CreateRewardDto) {}
