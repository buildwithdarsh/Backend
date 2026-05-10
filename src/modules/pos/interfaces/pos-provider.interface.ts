export interface IPosProvider {
  readonly providerName: string;
  syncMenu(orgId: string): Promise<PosSyncResult>;
  pushOrder(orgId: string, order: PosOrderPayload): Promise<PosOrderResult>;
}

export interface PosSyncResult {
  success: boolean;
  itemCount: number;
  errorMsg?: string;
}

export interface PosOrderPayload {
  orderId: string;
  orderNumber: string;
  items: PosOrderItem[];
  customerName: string;
  customerPhone: string;
  orderType: string;
  specialInstructions?: string;
}

export interface PosOrderItem {
  externalId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  options?: { externalId: string; name: string; quantity: number; price: number }[];
}

export interface PosOrderResult {
  success: boolean;
  posOrderId?: string;
  errorMsg?: string;
}
