import { PartialType } from '@nestjs/swagger';
import { CreateEndUserDto } from './create-end-user.dto.js';

export class UpdateEndUserDto extends PartialType(CreateEndUserDto) {}
