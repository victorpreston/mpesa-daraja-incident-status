import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE SCHEMA IF NOT EXISTS daraja');

  await knex.schema.withSchema('daraja').createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable().unique();
    table.text('description');
    table.string('status', 50).defaultTo('operational');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.withSchema('daraja').createTable('incidents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('service_id')
      .notNullable()
      .references('id')
      .inTable('daraja.services')
      .onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('status', 50).defaultTo('investigating');
    table.string('severity', 50).defaultTo('major');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at').nullable();
    table.string('impact', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['service_id', 'status']);
  });

  await knex.schema
    .withSchema('daraja')
    .createTable('incident_updates', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table
        .uuid('incident_id')
        .notNullable()
        .references('id')
        .inTable('daraja.incidents')
        .onDelete('CASCADE');
      table.text('message').notNullable();
      table.string('status', 50);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['incident_id']);
    });

  await knex.schema.withSchema('daraja').createTable('subscribers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255);
    table.text('slack_webhook_url');
    table.text('discord_webhook_url');
    table.text('custom_webhook_url');
    table.string('browser_token', 500);
    table
      .specificType('subscribed_services', 'UUID[]')
      .defaultTo(knex.raw('ARRAY[]::UUID[]'));
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['email']);
  });

  await knex.schema
    .withSchema('daraja')
    .createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table
        .uuid('incident_id')
        .notNullable()
        .references('id')
        .inTable('daraja.incidents')
        .onDelete('CASCADE');
      table
        .uuid('subscriber_id')
        .notNullable()
        .references('id')
        .inTable('daraja.subscribers')
        .onDelete('CASCADE');
      table.string('channel', 100).notNullable();
      table.string('status', 50).defaultTo('pending');
      table.timestamp('sent_at');
      table.text('error_message');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['incident_id', 'channel']);
      table.index(['subscriber_id']);
    });

  await knex.schema
    .withSchema('daraja')
    .createTable('aggregator_scores', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table
        .uuid('service_id')
        .notNullable()
        .references('id')
        .inTable('daraja.services')
        .onDelete('CASCADE');
      table.decimal('health_score', 5, 2);
      table.integer('failure_count').defaultTo(0);
      table.integer('success_count').defaultTo(0);
      table.decimal('last_30_minutes_availability', 5, 2);
      table.decimal('last_hour_availability', 5, 2);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['service_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('daraja').dropTableIfExists('notifications');
  await knex.schema.withSchema('daraja').dropTableIfExists('aggregator_scores');
  await knex.schema.withSchema('daraja').dropTableIfExists('incident_updates');
  await knex.schema.withSchema('daraja').dropTableIfExists('incidents');
  await knex.schema.withSchema('daraja').dropTableIfExists('subscribers');
  await knex.schema.withSchema('daraja').dropTableIfExists('services');
}
