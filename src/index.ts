// import { insertTransaction } from './services/inventoryService';

// async function run() {
//   await insertTransaction({
//     item_id: 1,
//     type: 'purchase',
//     transaction_qty: 10,
//     transaction_rate: 5,
//   });

//   await insertTransaction({
//     item_id: 1,
//     type: 'sale',
//     transaction_qty: 5,
//     transaction_rate: 6, // selling rate (optional in logic)
//   });

//   console.log('Transactions inserted.');
// }

// run();

import { db } from './db/kyselyClient';
import { processInventory } from './services/processInventory';

processInventory(db).then(() => {
  console.log('Inventory processing complete.');
  process.exit(0);
});
