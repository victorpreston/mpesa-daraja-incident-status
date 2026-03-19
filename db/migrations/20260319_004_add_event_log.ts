import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('daraja').createTable('event_log', (table) => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('topic', 255).notNullable();
    table.string('event_type', 100).notNullable();
    table.jsonb('payload').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['id', 'created_at']);
    table.index(['topic', 'created_at']);
    table.index(['event_type', 'created_at']);
  });

  await knex.raw(`
    SELECT create_hypertable(
      'daraja.event_log',
      'created_at',
      if_not_exists => TRUE
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS daraja.event_log CASCADE');
}
