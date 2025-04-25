import { Kysely } from 'kysely';
import { DB } from '../db/schema';
import { Layer } from '../models/inventory';

export async function processInventory(db: Kysely<DB>) {
  // 1. Get last processed transaction ID
  const lastProcessed = await db
    .selectFrom('inventory_layers')
    .select('transaction_id')
    .orderBy('transaction_id', 'desc')
    .limit(1)
    .executeTakeFirst();

  const lastTransactionId = lastProcessed?.transaction_id ?? 0;

  // 2. Only fetch new transactions
  const transactions = await db.selectFrom('inventory_transactions')
    .selectAll()
    .where('id', '>', lastTransactionId)
    .orderBy('id', 'asc')
    .execute();

  const itemLayersMap = new Map<number, Layer[]>();

  // 3. Seed item-wise remaining layers from DB
  const latestLayers = await db.selectFrom('inventory_layers')
    .select(['item_id', 'remaining_layers'])
    .where('transaction_id', '=', lastTransactionId)
    .execute();

  for (const row of latestLayers) {
    itemLayersMap.set(row.item_id, JSON.parse(row.remaining_layers));
  }

  // 4. Process new transactions
  for (const tx of transactions) {
    const layers = itemLayersMap.get(tx.item_id) ?? [];
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
    }

    const closingAmount = layers.reduce((sum, l) => sum + l.qty * l.rate, 0);

    await db.insertInto('inventory_layers').values({
      transaction_id: tx.id,
      item_id: tx.item_id,
      layer_consumption: tx.type === 'sale' ? JSON.stringify(consumed) : null,
      remaining_layers: JSON.stringify(layers),
      closing_amount: closingAmount,
      //created_date: tx.created_date,
    }).execute();

    itemLayersMap.set(tx.item_id, layers);
  }
}