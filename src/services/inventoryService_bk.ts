import { db } from '../db/connection';

type Layer = { qty: number; rate: number };

async function getLayers(item_id: number): Promise<Layer[]> {
  const [rows] = await db.query<any[]>(
    `SELECT remaining_layers FROM inventory_layers 
     WHERE item_id = ? ORDER BY id DESC LIMIT 1`, [item_id]
  );
  if (rows.length === 0) return [];
  return JSON.parse(rows[0].remaining_layers || '[]');
}

function calculateClosingAmount(layers: Layer[]): number {
  return layers.reduce((sum, l) => sum + l.qty * l.rate, 0);
}

export async function insertTransaction({
  item_id,
  type,
  transaction_qty,
  transaction_rate,
}: {
  item_id: number;
  type: 'purchase' | 'sale';
  transaction_qty: number;
  transaction_rate: number;
}) {
  let layers = await getLayers(item_id);
  const layer_consumption: Layer[] = [];

  if (type === 'purchase') {
    layers.push({ qty: transaction_qty, rate: transaction_rate });
  } else {
    let remaining = transaction_qty;
    const newLayers: Layer[] = [];

    for (const layer of layers) {
      if (remaining === 0) {
        newLayers.push(layer);
        continue;
      }
      if (layer.qty <= remaining) {
        layer_consumption.push({ ...layer });
        remaining -= layer.qty;
      } else {
        layer_consumption.push({ qty: remaining, rate: layer.rate });
        newLayers.push({ qty: layer.qty - remaining, rate: layer.rate });
        remaining = 0;
      }
    }

    layers = newLayers;
  }

  const closing_amount = calculateClosingAmount(layers);

  const [result] = await db.query<any>(
    `INSERT INTO inventory_transactions (item_id, type, transaction_qty, transaction_rate)
     VALUES (?, ?, ?, ?)`,
    [item_id, type, transaction_qty, transaction_rate]
  );
  const transaction_id = result.insertId;

  await db.query(
    `INSERT INTO inventory_layers (transaction_id, item_id, layer_consumption, remaining_layers, closing_amount)
     VALUES (?, ?, ?, ?, ?)`,
    [
      transaction_id,
      item_id,
      JSON.stringify(layer_consumption),
      JSON.stringify(layers),
      closing_amount,
    ]
  );
}
