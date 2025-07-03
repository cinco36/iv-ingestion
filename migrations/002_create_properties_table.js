/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('properties', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('address_line1', 255).notNullable();
    table.string('address_line2', 255);
    table.string('city', 100).notNullable();
    table.string('state', 50).notNullable();
    table.string('zip_code', 20).notNullable();
    table.string('country', 50).defaultTo('USA');
    table.enum('property_type', ['single_family', 'condo', 'townhouse', 'multi_family', 'commercial']);
    table.integer('year_built');
    table.integer('square_feet');
    table.decimal('lot_size', 10, 2);
    table.integer('bedrooms');
    table.decimal('bathrooms', 3, 1);
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('city');
    table.index('state');
    table.index('zip_code');
    table.index('property_type');
    table.index(['latitude', 'longitude']);
    table.index('created_at');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('properties');
} 