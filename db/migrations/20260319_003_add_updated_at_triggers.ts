import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION daraja.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON daraja.services
    FOR EACH ROW EXECUTE FUNCTION daraja.update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON daraja.incidents
    FOR EACH ROW EXECUTE FUNCTION daraja.update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON daraja.subscribers
    FOR EACH ROW EXECUTE FUNCTION daraja.update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_aggregator_scores_updated_at
    BEFORE UPDATE ON daraja.aggregator_scores
    FOR EACH ROW EXECUTE FUNCTION daraja.update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'DROP TRIGGER IF EXISTS update_services_updated_at ON daraja.services',
  );
  await knex.raw(
    'DROP TRIGGER IF EXISTS update_incidents_updated_at ON daraja.incidents',
  );
  await knex.raw(
    'DROP TRIGGER IF EXISTS update_subscribers_updated_at ON daraja.subscribers',
  );
  await knex.raw(
    'DROP TRIGGER IF EXISTS update_aggregator_scores_updated_at ON daraja.aggregator_scores',
  );
  await knex.raw('DROP FUNCTION IF EXISTS daraja.update_updated_at_column()');
}
