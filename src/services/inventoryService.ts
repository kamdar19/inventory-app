// import db from '../db/connection';

// // Function to get the last layer for a specific item
// async function getLayers(item_id: number) {
//   const [rows] = await db.promise().query(
//     `SELECT remaining_layers FROM inventory_transactions WHERE item_id = ? ORDER BY id DESC LIMIT 1`,
//     [item_id]
//   );

// //   if (rows.length === 0) {
// //     return [];
// //   }
  
// //   return JSON.parse(rows[0].remaining_layers || '[]');
// }

// // Function to calculate closing amount from layers
// function calculateClosingAmount(layers: any[]) {
//   return layers.reduce((sum, layer) => sum + (layer.qty * layer.rate), 0);
// }

// // Function to insert a transaction and update layers
// export async function insertTransaction({ item_id, type, transaction_qty, transaction_rate }: any) {
//   let layers = await getLayers(item_id);
//   let layer_consumption = [];

//   if (type === 'purchase') {
//    // layers.push({ qty: transaction_qty, rate: transaction_rate });
//   } else {
//     let remaining = transaction_qty;
//     let newLayers = [];

// //     for (let layer of layers) {
// //       if (remaining === 0) {
// //         newLayers.push(layer);
// //         continue;
// //       }
// //       if (layer.qty <= remaining) {
// //         layer_consumption.push({ ...layer });
// //         remaining -= layer.qty;
// //       } else {
// //         layer_consumption.push({ qty: remaining, rate: layer.rate });
// //         newLayers.push({ qty: layer.qty - remaining, rate: layer.rate });
// //         remaining = 0;
// //       }
// //     }
// //     layers = newLayers;
// //   }

//   //const closing_amount = calculateClosingAmount(layers);

//   // Insert transaction into inventory_transactions table
//   await db.promise().query(
//     `INSERT INTO inventory_transactions (item_id, type, transaction_qty, transaction_rate, layer_consumption, remaining_layers, closing_amount)
//      VALUES (?, ?, ?, ?, ?, ?, ?)`,
//     [
//       item_id,
//       type,
//       transaction_qty,
//       transaction_rate,
//       //JSON.stringify(layer_consumption),
//       JSON.stringify(layers),
//       //closing_amount
//     ]
//   );

//   // Insert into inventory_layers table
//   const transactionResult: any = await db.promise().query(
//     `SELECT LAST_INSERT_ID() AS transaction_id`
//   );

//   const transaction_id = transactionResult[0]?.transaction_id;

//   if (transaction_id) {
//     await db.promise().query(
//       `INSERT INTO inventory_layers (transaction_id, item_id, layer_consumption, remaining_layers, closing_amount)
//        VALUES (?, ?, ?, ?, ?)`,
//       [
//         transaction_id,
//         item_id,
//        // JSON.stringify(layer_consumption),
//         JSON.stringify(layers),
//        // closing_amount
//       ]
//     );
//   }
// }
