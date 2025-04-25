import { Generated, ColumnType } from 'kysely';

export interface InventoryTransactions {
  id: Generated<number>;
  item_id: number;
  type: 'purchase' | 'sale';
  transaction_qty: number;
  transaction_rate: number;
  created_date: ColumnType<Date, string | undefined, never>;
}

export interface InventoryLayers {
  id: Generated<number>;
  transaction_id: number;
  item_id: number;
  layer_consumption: string | null;
  remaining_layers: string;
  closing_amount: number;
  created_date: ColumnType<Date, string | undefined, never>;
}

export interface DB {
  inventory_transactions: InventoryTransactions;
  inventory_layers: InventoryLayers;
}