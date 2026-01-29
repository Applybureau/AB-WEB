const fs = require('fs');
const path = require('path');
const whatsappManager = require('./utils/whatsapp');

async function testWhatsAppEmailTemplates() {
  console.log('🔍 Testing WhatsApp Email Template Integration...\n');

  // Test 1: Check which templates support WhatsApp
  console.log('1. Scanning Email Templates for WhatsApp Support:');
  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));
  
  const whatsappTemplates = [];
  
  templateFiles.forEach(file => {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('whatsapp') || content.includes('WhatsApp')) {
      whatsappTemplates.push(file);
      console.log(`   ✓ ${file} - Contains WhatsApp support`);
    }
  });
  
  console.log(`\n   Found ${whatsappTemplates.length} templates with WhatsApp support out of ${templateFiles.length} total templates\n`);

  // Test 2: Analyze WhatsApp template features
  console.log('2. Analyzing WhatsApp Template Features:');
  
  whatsappTemplates.forEach(templateFile => {
    console.log(`\n   📧 ${templateFile}:`);
    const filePath = path.join(templatesDir, templateFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for WhatsApp-specific features
    const features = [];
    if (content.includes('{{#if is_whatsapp_call}}')) features.push('Conditional WhatsApp content');
    if (content.includes('{{whatsapp_number}}')) features.push('WhatsApp number display');
    if (content.includes('{{whatsapp_web_link}}')) features.push('WhatsApp web link');
    if (content.includes('{{whatsapp_instructions}}')) features.push('WhatsApp instructions loop');
    if (content.includes('#25D366')) features.push('WhatsApp green color');
    if (content.includes('Open WhatsApp')) features.push('WhatsApp button');
    
    features.forEach(feature => {
      console.log(`     - ${feature}`);
    });
    
    if (features.length === 0) {
      console.log('     - Basic WhatsApp mention only');
    }
  });

  // Test 3: Generate template data for WhatsApp consultation
  console.log('\n3. Testing Template Data Generation:');
  
  const mockConsultation = {
    id: 'test-whatsapp-123',
    prospect_name: 'Sarah Johnson',
    prospect_email: 'sarah.johnson@test.com',
    communication_method: 'whatsapp_call',
    whatsapp_number: '+1555987654',
    admin_whatsapp_number: '+1555123456',
    scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: 'confirmed',
    consultation_type: 'strategy_call'
  };

  const contactInfo = whatsappManager.generateWhatsAppContactInfo(mockConsultation);
  const instructions = whatsappManager.createWhatsAppInstructions(mockConsultation);

  // Generate template data that would be used in email rendering
  const templateData = {
    // Basic consultation data
    prospect_name: mockConsultation.prospect_name,
    consultation_date: contactInfo.formattedDate,
    consultation_time: contactInfo.formattedTime,
    
    // WhatsApp-specific data
    is_whatsapp_call: mockConsultation.communication_method === 'whatsapp_call',
    whatsapp_number: contactInfo.adminNumber,
    whatsapp_web_link: contactInfo.whatsappWebLink,
    whatsapp_instructions: instructions.instructions,
    backup_options: instructions.backupOptions,
    
    // Additional context
    business_name: whatsappManager.businessName,
    consultation_message: contactInfo.consultationMessage
  };

  console.log('   ✓ Generated template data:');
  console.log(`     - Prospect Name: ${templateData.prospect_name}`);
  console.log(`     - Is WhatsApp Call: ${templateData.is_whatsapp_call}`);
  console.log(`     - WhatsApp Number: ${templateData.whatsapp_number}`);
  console.log(`     - WhatsApp Web Link: ${templateData.whatsapp_web_link}`);
  console.log(`     - Instructions Count: ${templateData.whatsapp_instructions.length}`);
  console.log(`     - Backup Options Count: ${templateData.backup_options.length}`);

  // Test 4: Simulate template rendering (basic string replacement)
  console.log('\n4. Testing Template Rendering Simulation:');
  
  const testTemplate = `
    <h2>Consultation Confirmed for {{prospect_name}}</h2>
    <p>Date: {{consultation_date}} at {{consultation_time}}</p>
    
    {{#if is_whatsapp_call}}
    <div class="whatsapp-section">
      <h3>WhatsApp Call Details</h3>
      <p>WhatsApp Number: {{whatsapp_number}}</p>
      <a href="{{whatsapp_web_link}}" style="background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none;">
        Open WhatsApp
      </a>
      
      <h4>Instructions:</h4>
      <ul>
        {{#each whatsapp_instructions}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    {{/if}}
  `;

  // Simple template rendering simulation
  let renderedTemplate = testTemplate
    .replace(/\{\{prospect_name\}\}/g, templateData.prospect_name)
    .replace(/\{\{consultation_date\}\}/g, templateData.consultation_date)
    .replace(/\{\{consultation_time\}\}/g, templateData.consultation_time)
    .replace(/\{\{whatsapp_number\}\}/g, templateData.whatsapp_number)
    .replace(/\{\{whatsapp_web_link\}\}/g, templateData.whatsapp_web_link);

  // Handle conditional rendering
  if (templateData.is_whatsapp_call) {
    renderedTemplate = renderedTemplate.replace(/\{\{#if is_whatsapp_call\}\}/g, '');
    renderedTemplate = renderedTemplate.replace(/\{\{\/if\}\}/g, '');
    
    // Handle instructions loop
    let instructionsList = '';
    templateData.whatsapp_instructions.forEach(instruction => {
      instructionsList += `        <li>${instruction}</li>\n`;
    });
    renderedTemplate = renderedTemplate.replace(/\{\{#each whatsapp_instructions\}\}\s*<li>\{\{this\}\}<\/li>\s*\{\{\/each\}\}/g, instructionsList);
  }

  console.log('   ✓ Rendered template preview:');
  console.log(renderedTemplate);

  // Test 5: Check template compatibility
  console.log('\n5. Template Compatibility Check:');
  
  const requiredWhatsAppFields = [
    'is_whatsapp_call',
    'whatsapp_number', 
    'whatsapp_web_link',
    'whatsapp_instructions'
  ];

  whatsappTemplates.forEach(templateFile => {
    const filePath = path.join(templatesDir, templateFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n   📧 ${templateFile} compatibility:`);
    
    requiredWhatsAppFields.forEach(field => {
      const hasField = content.includes(`{{${field}}`) || content.includes(`{{#if ${field}}`) || content.includes(`{{#each ${field}}`);
      console.log(`     ${hasField ? '✓' : '❌'} ${field}`);
    });
  });

  console.log('\n🎉 WhatsApp Email Template Test Complete!\n');
}

// Run the test
if (require.main === module) {
  testWhatsAppEmailTemplates().catch(console.error);
}

module.exports = testWhatsAppEmailTemplates;