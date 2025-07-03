/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('findings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('inspection_id').references('id').inTable('inspections').onDelete('CASCADE');
    table.enum('category', ['structural', 'electrical', 'plumbing', 'hvac', 'roofing', 'exterior', 'interior', 'insulation', 'ventilation', 'foundation', 'safety', 'other']).notNullable();
    table.string('subcategory', 100);
    table.enum('severity', ['critical', 'major', 'minor', 'informational']).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('location', 255);
    table.text('recommendation');
    table.decimal('estimated_cost', 10, 2);
    table.integer('priority').defaultTo(0);
    table.integer('page_number');
    table.string('section_reference', 100);
    table.jsonb('images');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('inspection_id');
    table.index('category');
    table.index('severity');
    table.index('priority');
    table.index(['inspection_id', 'category']);
    table.index(['inspection_id', 'severity']);
    table.index('created_at');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('findings');
} 