"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inventoryService_1 = require("./services/inventoryService");
async function run() {
    await (0, inventoryService_1.insertTransaction)({
        item_id: 1,
        type: 'purchase',
        transaction_qty: 10,
        transaction_rate: 5,
    });
    await (0, inventoryService_1.insertTransaction)({
        item_id: 1,
        type: 'sale',
        transaction_qty: 5,
        transaction_rate: 6, // selling rate (optional in logic)
    });
    console.log('Transactions inserted.');
}
run();
