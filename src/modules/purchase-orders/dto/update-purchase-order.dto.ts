import { IsIn, IsString } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status!: string;
}
