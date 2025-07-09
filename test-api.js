import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing IV Ingestion API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Swagger UI
    console.log('2. Testing Swagger UI...');
    const swaggerResponse = await fetch(`${BASE_URL}/api-docs`);
    console.log('✅ Swagger UI Status:', swaggerResponse.status);
    console.log('📖 Swagger UI available at: http://localhost:3000/api-docs');
    console.log('');

    // Test 3: API Documentation
    console.log('3. Testing API Documentation...');
    const docsResponse = await fetch(`${BASE_URL}/api/v1/docs`);
    console.log('✅ API Docs Status:', docsResponse.status);
    console.log('');

    console.log('🎉 Basic API tests completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Set up PostgreSQL database (Docker or local)');
    console.log('2. Run migrations: npm run migrate');
    console.log('3. Run seeds: npm run seed');
    console.log('4. Test authentication endpoints');
    console.log('');
    console.log('🔗 Useful URLs:');
    console.log('- Health Check: http://localhost:3000/health');
    console.log('- Swagger UI: http://localhost:3000/api-docs');
    console.log('- API Base: http://localhost:3000/api/v1');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('');
    console.log('💡 Make sure your server is running with: npm run dev');
  }
}

testAPI(); 