import { FastifyInstance } from 'fastify';
import { db } from '../db/kyselyClient';
import { processInventory } from '../services/processInventory';

export async function registerProcessInventoryRoute(fastify: FastifyInstance) {
  fastify.post('/process-inventory', async (_, reply) => {
    await processInventory(db);
    reply.send({ status: 'success' });
  });
}