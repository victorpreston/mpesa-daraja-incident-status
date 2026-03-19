import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS timescaledb');

  await knex.schema.withSchema('daraja').createTable('probe_results', (table) => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('service_id')
      .notNullable()
      .references('id')
      .inTable('daraja.services')
      .onDelete('CASCADE');
    table.string('probe_type', 100).notNullable();
    table.string('status', 50).notNullable();
    table.integer('latency_ms');
    table.text('error_message');
    table.jsonb('response_body');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['id', 'created_at']);
  });

  await knex.raw(`
    SELECT create_hypertable(
      'daraja.probe_results',
      'created_at',
      if_not_exists => TRUE
    )
  `);

  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_probe_results_service_created ON daraja.probe_results (service_id, created_at DESC)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS daraja.probe_results CASCADE');
}
