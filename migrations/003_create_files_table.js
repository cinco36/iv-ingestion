/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('files', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('original_filename', 255).notNullable();
    table.string('stored_filename', 255).notNullable();
    table.string('file_type', 50).notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type', 100);
    table.string('upload_path', 500);
    table.string('content_hash', 64);
    table.enum('processing_status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.text('processing_error');
    table.timestamp('processing_started_at');
    table.timestamp('processing_completed_at');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    table.index('processing_status');
    table.index('content_hash');
    table.index('file_type');
    table.index('created_at');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('files');
} 