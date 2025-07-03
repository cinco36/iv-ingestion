/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('processing_jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('file_id').references('id').inTable('files').onDelete('CASCADE');
    table.string('job_type', 50).notNullable();
    table.enum('status', ['queued', 'active', 'completed', 'failed', 'delayed']).defaultTo('queued');
    table.integer('priority').defaultTo(0);
    table.integer('progress').defaultTo(0).unsigned();
    table.integer('attempts').defaultTo(0).unsigned();
    table.integer('max_attempts').defaultTo(3).unsigned();
    table.jsonb('job_data');
    table.jsonb('result_data');
    table.text('error_message');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Check constraint for progress
    table.check('progress >= 0 AND progress <= 100');
    
    // Indexes
    table.index('file_id');
    table.index('status');
    table.index('priority');
    table.index('job_type');
    table.index('created_at');
    table.index(['status', 'priority']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('processing_jobs');
} 