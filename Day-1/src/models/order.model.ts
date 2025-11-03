export interface OrderItem {
    productId: number;
    quantity: number;
    unitPrice: number;     // copied from product at order time
    lineTotal: number;     // unitPrice * quantity
}

export interface Order {
    id: number;
    customerName: string;
    items: OrderItem[];
    total: number;         // sum of lineTotals
    createdAt: string;
    updatedAt: string;
}
  