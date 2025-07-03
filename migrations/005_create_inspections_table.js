/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('inspections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
    table.uuid('file_id').references('id').inTable('files').onDelete('SET NULL');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('inspector_name', 255);
    table.string('inspector_license', 100);
    table.string('inspector_company', 255);
    table.string('inspector_email', 255);
    table.string('inspector_phone', 50);
    table.date('inspection_date');
    table.enum('inspection_type', ['pre_purchase', 'pre_listing', 'new_construction', 'annual', 'warranty', 'insurance']);
    table.date('report_date');
    table.text('inspection_scope');
    table.enum('overall_condition', ['excellent', 'good', 'fair', 'poor', 'needs_attention']);
    table.integer('total_findings').defaultTo(0).unsigned();
    table.integer('critical_findings').defaultTo(0).unsigned();
    table.integer('major_findings').defaultTo(0).unsigned();
    table.integer('minor_findings').defaultTo(0).unsigned();
    table.decimal('data_quality_score', 5, 2).defaultTo(0.0);
    table.text('raw_text');
    table.jsonb('processed_data');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('property_id');
    table.index('user_id');
    table.index('inspection_date');
    table.index('inspection_type');
    table.index('overall_condition');
    table.index('created_at');
    table.index(['property_id', 'inspection_date']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('inspections');
} 