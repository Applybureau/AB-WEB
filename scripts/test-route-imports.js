console.log('🧪 Testing route file imports...');

try {
  console.log('1. Testing consultationsCombined.js import...');
  const consultationsCombined = require('../routes/consultationsCombined');
  console.log('✅ consultationsCombined.js imported successfully');
  
  console.log('2. Testing contact.js import...');
  const contact = require('../routes/contact');
  console.log('✅ contact.js imported successfully');
  
  console.log('3. Testing if routes are Express routers...');
  console.log('   consultationsCombined type:', typeof consultationsCombined);
  console.log('   contact type:', typeof contact);
  
  console.log('\n✅ All route files imported successfully!');
  
} catch (error) {
  console.error('❌ Error importing route files:', error.message);
  console.error('Stack trace:', error.stack);
}