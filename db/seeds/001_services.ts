import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('daraja.services').del();

  await knex('daraja.services').insert([
    {
      name: 'STK Push',
      description: 'M-Pesa STK Push initiation and callback delivery',
      status: 'operational',
    },
    {
      name: 'OAuth',
      description: 'Daraja OAuth token generation',
      status: 'operational',
    },
    {
      name: 'C2B',
      description: 'Customer to Business payment flow',
      status: 'operational',
    },
    {
      name: 'B2C',
      description: 'Business to Customer payment flow',
      status: 'operational',
    },
    {
      name: 'Account Balance',
      description: 'Account balance query endpoint',
      status: 'operational',
    },
    {
      name: 'Transaction Status',
      description: 'Transaction status query',
      status: 'operational',
    },
    {
      name: 'Reversal',
      description: 'Transaction reversal endpoint',
      status: 'operational',
    },
  ]);
}
