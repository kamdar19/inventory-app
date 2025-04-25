export interface InventoryTransaction {
    id: number;
    item_id: number;
    type: 'purchase' | 'sale';
    transaction_qty: number;
    transaction_rate: number;
  }
  
  export interface Layer {
    qty: number;
    rate: number;
  }
  