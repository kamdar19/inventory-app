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
  console.debug("lastProcessedPerItem",lastProcessedPerItem);
  const itemLayersMap = new Map<number, Layer[]>();
  const lastTransactionIds = new Map<number, number>();

  for (const row of lastProcessedPerItem) {
    if (!lastTransactionIds.has(row.item_id)) {
      itemLayersMap.set(row.item_id, JSON.parse(row.remaining_layers));
      lastTransactionIds.set(row.item_id, row.transaction_id);
    }
  }
  console.debug("itemLayersMap",itemLayersMap);
  console.debug("lastTransactionIds",lastTransactionIds);
  // 2. Fetch all new transactions for all items
  const allTransactions = await db.selectFrom('inventory_transactions')
    .selectAll()
    .orderBy('id', 'asc')
    .execute();
    console.debug("allTransactions",allTransactions);
  // 3. Filter only new transactions per item
  const newTransactions = allTransactions.filter(tx => {
    const lastId = lastTransactionIds.get(tx.item_id) ?? 0;
    return tx.id > lastId;
  });
  console.debug("newTransactions",newTransactions);
  // 4. Process transactions
  for (const tx of newTransactions) {
    const layers = itemLayersMap.get(tx.item_id) ?? [];
    console.debug("layers",layers);
    const consumed: Layer[] = [];

    if (tx.type === 'purchase') {
      layers.push({ qty: tx.transaction_qty, rate: tx.transaction_rate });
    } else {
      console.debug("layers all",layers);
      let qtyToDeduct = tx.transaction_qty;
      console.debug("qtyToDeduct",qtyToDeduct);
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
    }

    const closingAmount = layers.reduce((sum, l) => sum + l.qty * l.rate, 0);

    await db.insertInto('inventory_layers').values({
      transaction_id: tx.id,
      item_id: tx.item_id,
      layer_consumption: tx.type === 'sale' ? JSON.stringify(consumed) : null,
      remaining_layers: JSON.stringify(layers),
      closing_amount: closingAmount,
      // created_date: tx.created_date,
    }).execute();

    itemLayersMap.set(tx.item_id, layers);
  }
}
