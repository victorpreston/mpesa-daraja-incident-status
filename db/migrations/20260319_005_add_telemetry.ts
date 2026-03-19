import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('daraja').createTable('telemetry_reports', (table) => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('service_id')
      .nullable()
      .references('id')
      .inTable('daraja.services')
      .onDelete('SET NULL');
    table.string('endpoint', 100).notNullable();
    table.string('error_type', 50).notNullable();
    table.integer('status_code').nullable();
    table.integer('latency_ms').notNullable();
    table.string('environment', 20).notNullable().defaultTo('sandbox');
    table.string('sdk_version', 20).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['id', 'created_at']);
    table.index(['service_id', 'created_at']);
    table.index(['endpoint', 'created_at']);
  });

  await knex.raw(`
    SELECT create_hypertable(
      'daraja.telemetry_reports',
      'created_at',
      if_not_exists => TRUE
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS daraja.telemetry_reports CASCADE');
}
