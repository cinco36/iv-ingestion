/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 50).notNullable();
    table.uuid('resource_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.inet('ip_address');
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('resource_type');
    table.index('resource_id');
    table.index('created_at');
    table.index(['resource_type', 'resource_id']);
    table.index(['user_id', 'created_at']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
} 