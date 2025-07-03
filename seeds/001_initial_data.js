/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing data
  await knex('audit_logs').del();
  await knex('findings').del();
  await knex('inspections').del();
  await knex('processing_jobs').del();
  await knex('files').del();
  await knex('properties').del();
  await knex('users').del();

  // Insert test users
  const users = await knex('users').insert([
    {
      email: 'admin@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJELpWm', // password123
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      email_verified: true,
    },
    {
      email: 'inspector@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJELpWm', // password123
      first_name: 'John',
      last_name: 'Inspector',
      role: 'inspector',
      email_verified: true,
    },
    {
      email: 'user@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJELpWm', // password123
      first_name: 'Jane',
      last_name: 'User',
      role: 'user',
      email_verified: true,
    },
  ]).returning('*');

  // Insert test properties
  const properties = await knex('properties').insert([
    {
      address_line1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip_code: '90210',
      country: 'USA',
      property_type: 'single_family',
      year_built: 1990,
      square_feet: 2000,
      bedrooms: 3,
      bathrooms: 2.5,
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      address_line1: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zip_code: '10001',
      country: 'USA',
      property_type: 'condo',
      year_built: 2005,
      square_feet: 1500,
      bedrooms: 2,
      bathrooms: 2.0,
      latitude: 40.7128,
      longitude: -74.0060,
    },
  ]).returning('*');

  // Insert test files
  const files = await knex('files').insert([
    {
      user_id: users[2].id, // user@example.com
      original_filename: 'inspection_report_1.pdf',
      stored_filename: 'file_1_20231201.pdf',
      file_type: 'pdf',
      file_size: 1024000,
      mime_type: 'application/pdf',
      upload_path: '/uploads/file_1_20231201.pdf',
      content_hash: 'abc123def456',
      processing_status: 'completed',
      processing_completed_at: new Date(),
    },
    {
      user_id: users[2].id, // user@example.com
      original_filename: 'inspection_report_2.pdf',
      stored_filename: 'file_2_20231202.pdf',
      file_type: 'pdf',
      file_size: 2048000,
      mime_type: 'application/pdf',
      upload_path: '/uploads/file_2_20231202.pdf',
      content_hash: 'def456ghi789',
      processing_status: 'processing',
      processing_started_at: new Date(),
    },
  ]).returning('*');

  // Insert test inspections
  const inspections = await knex('inspections').insert([
    {
      property_id: properties[0].id,
      file_id: files[0].id,
      user_id: users[2].id, // user@example.com
      inspector_name: 'John Inspector',
      inspector_license: 'CA123456',
      inspector_company: 'ABC Inspections',
      inspector_email: 'john@abcinspections.com',
      inspector_phone: '(555) 123-4567',
      inspection_date: '2023-12-01',
      inspection_type: 'pre_purchase',
      report_date: '2023-12-02',
      inspection_scope: 'Complete home inspection including structural, electrical, plumbing, and HVAC systems.',
      overall_condition: 'good',
      total_findings: 15,
      critical_findings: 1,
      major_findings: 3,
      minor_findings: 11,
      data_quality_score: 85.5,
    },
    {
      property_id: properties[1].id,
      file_id: files[1].id,
      user_id: users[2].id, // user@example.com
      inspector_name: 'Jane Inspector',
      inspector_license: 'NY789012',
      inspector_company: 'XYZ Inspections',
      inspector_email: 'jane@xyzinspections.com',
      inspector_phone: '(555) 987-6543',
      inspection_date: '2023-12-02',
      inspection_type: 'pre_listing',
      report_date: '2023-12-03',
      inspection_scope: 'Pre-listing inspection focusing on major systems and safety issues.',
      overall_condition: 'excellent',
      total_findings: 8,
      critical_findings: 0,
      major_findings: 1,
      minor_findings: 7,
      data_quality_score: 92.0,
    },
  ]).returning('*');

  // Insert test findings
  await knex('findings').insert([
    {
      inspection_id: inspections[0].id,
      category: 'electrical',
      subcategory: 'outlets',
      severity: 'critical',
      title: 'Unsafe Electrical Outlet',
      description: 'Found an electrical outlet with exposed wiring that poses a fire hazard.',
      location: 'Kitchen, above counter',
      recommendation: 'Immediate replacement of outlet and wiring by licensed electrician.',
      estimated_cost: 250.00,
      priority: 1,
      page_number: 5,
      section_reference: 'Electrical Systems - Outlets',
    },
    {
      inspection_id: inspections[0].id,
      category: 'plumbing',
      subcategory: 'pipes',
      severity: 'major',
      title: 'Leaking Pipe Under Sink',
      description: 'Water leak detected under kitchen sink, causing water damage to cabinet.',
      location: 'Kitchen sink cabinet',
      recommendation: 'Repair or replace leaking pipe and assess water damage.',
      estimated_cost: 150.00,
      priority: 2,
      page_number: 8,
      section_reference: 'Plumbing Systems - Kitchen',
    },
    {
      inspection_id: inspections[0].id,
      category: 'hvac',
      subcategory: 'air_filter',
      severity: 'minor',
      title: 'Dirty Air Filter',
      description: 'HVAC air filter is dirty and needs replacement.',
      location: 'HVAC unit in garage',
      recommendation: 'Replace air filter and consider regular maintenance schedule.',
      estimated_cost: 25.00,
      priority: 5,
      page_number: 12,
      section_reference: 'HVAC Systems - Air Quality',
    },
    {
      inspection_id: inspections[1].id,
      category: 'structural',
      subcategory: 'foundation',
      severity: 'minor',
      title: 'Minor Foundation Settlement',
      description: 'Minor settlement cracks observed in foundation, typical for age of home.',
      location: 'Foundation walls',
      recommendation: 'Monitor cracks for changes and consider professional assessment if they widen.',
      estimated_cost: 0.00,
      priority: 4,
      page_number: 3,
      section_reference: 'Structural Systems - Foundation',
    },
  ]);

  // Insert test processing jobs
  await knex('processing_jobs').insert([
    {
      file_id: files[0].id,
      job_type: 'pdf_extraction',
      status: 'completed',
      progress: 100,
      attempts: 1,
      job_data: { extraction_method: 'ocr' },
      result_data: { pages_extracted: 15, text_quality: 0.85 },
      started_at: new Date(Date.now() - 3600000), // 1 hour ago
      completed_at: new Date(Date.now() - 3500000), // 58 minutes ago
    },
    {
      file_id: files[1].id,
      job_type: 'pdf_extraction',
      status: 'active',
      progress: 45,
      attempts: 1,
      job_data: { extraction_method: 'ocr' },
      started_at: new Date(Date.now() - 300000), // 5 minutes ago
    },
  ]);

  console.log('✅ Seed data inserted successfully');
} 