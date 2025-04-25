import { Kysely } from 'kysely';
import { DB } from '../db/schema';
import { Layer } from '../models/inventory';

export async function processInventory(db: Kysely<DB>) {
  // 1. Get last processed transaction per item
  const lastProcessedPerItem = await db.selectFrom('inventory_layers')
    .select(['item_id', 'transaction_id', 'remaining_layers'])
    .orderBy('item_id', 'asc')
    .orderBy('transaction_id', 'desc')
    .execute();

  const itemLayersMap = new Map<number, Layer[]>();
  const lastTransactionIds = new Map<number, number>();

  for (const row of lastProcessedPerItem) {
    if (!lastTransactionIds.has(row.item_id)) {
      itemLayersMap.set(row.item_id, JSON.parse(row.remaining_layers));
      lastTransactionIds.set(row.item_id, row.transaction_id);
    }
  }

  // 2. Fetch all transactions
  const allTransactions = await db.selectFrom('inventory_transactions')
    .selectAll()
    .orderBy('id', 'asc')
    .execute();

  // 3. Filter only new transactions per item
  const newTransactions = allTransactions.filter(tx => {
    const lastId = lastTransactionIds.get(tx.item_id) ?? 0;
    return tx.id > lastId;
  });

  // 4. Group transactions by item
  const transactionsByItem = new Map<number, typeof allTransactions>();

  for (const tx of newTransactions) {
    const txList = transactionsByItem.get(tx.item_id) ?? [];
    txList.push(tx);
    transactionsByItem.set(tx.item_id, txList);
  }

  // 5. Process per item, sorting purchases before sales
  for (const [itemId, transactions] of transactionsByItem.entries()) {
    const layers = itemLayersMap.get(itemId) ?? [];

    // Sort: purchases first, then sales (both ascending by id)
    const sortedTxs = transactions.sort((a, b) => {
      if (a.type === b.type) return a.id - b.id;
      return a.type === 'purchase' ? -1 : 1;
    });

    for (const tx of sortedTxs) {
      const consumed: Layer[] = [];

      if (tx.type === 'purchase') {
        layers.push({ qty: tx.transaction_qty, rate: tx.transaction_rate });
      } else {
        let qtyToDeduct = tx.transaction_qty;
        while (qtyToDeduct > 0 && layers.length > 0) {
          const layer = layers[0];
          if (layer.qty <= qtyToDeduct) {
            consumed.push({ ...layer });
            qtyToDeduct -= layer.qty;
            layers.shift();
          } else {
            consumed.push({ qty: qtyToDeduct, rate: layer.rate });
            layer.qty -= qtyToDeduct;
            qtyToDeduct = 0;
          }
        }

        if (qtyToDeduct > 0) {
          console.warn(`Insufficient stock for item ${itemId} in transaction ${tx.id}`);
        }
      }

      const closingAmount = layers.reduce((sum, l) => sum + l.qty * l.rate, 0);

      await db.insertInto('inventory_layers').values({
        transaction_id: tx.id,
        item_id: tx.item_id,
        layer_consumption: tx.type === 'sale' ? JSON.stringify(consumed) : null,
        remaining_layers: JSON.stringify(layers),
        closing_amount: closingAmount,
      }).execute();
    }

    itemLayersMap.set(itemId, layers);
  }
}
