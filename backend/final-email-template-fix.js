const fs = require('fs');
const path = require('path');

async function finalEmailTemplateFix() {
  console.log('🔧 Final Email Template Fix...\n');

  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

  for (const templateFile of templateFiles) {
    const filePath = path.join(templatesDir, templateFile);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    console.log(`📧 Processing ${templateFile}:`);

    // Fix all remaining button colors
    const colorFixes = [
      { from: /#10B981/g, to: '#000000', name: 'Green buttons' },
      { from: /#25D366/g, to: '#000000', name: 'WhatsApp green buttons' },
      { from: /#0D9488/g, to: '#000000', name: 'Teal buttons' },
      { from: /#059669/g, to: '#000000', name: 'Dark green buttons' },
      { from: /#16A34A/g, to: '#000000', name: 'Success green buttons' },
      { from: /#22C55E/g, to: '#000000', name: 'Light green buttons' },
      { from: /#15803D/g, to: '#000000', name: 'Forest green buttons' },
      { from: /#166534/g, to: '#000000', name: 'Dark forest green buttons' }
    ];

    colorFixes.forEach(fix => {
      const matches = content.match(fix.from);
      if (matches) {
        content = content.replace(fix.from, fix.to);
        console.log(`   ✓ Fixed ${matches.length} ${fix.name}`);
        changed = true;
      }
    });

    // Ensure all buttons have white text
    content = content.replace(
      /style="([^"]*background[^"]*#000000[^"]*)"(?![^>]*color:\s*#FFFFFF)/g,
      function(match, styleContent) {
        if (!styleContent.includes('color:')) {
          return match.replace(styleContent, styleContent + '; color: #FFFFFF');
        }
        return match;
      }
    );

    // Fix footer background colors that might have been changed incorrectly
    content = content.replace(
      /background-color:\s*#000000;([^}]*)(padding:\s*[^;]*40px[^;]*background-color:\s*#F1F5F9|background-color:\s*#0F172A)/g,
      function(match) {
        if (match.includes('#F1F5F9')) {
          return match.replace('#000000', '#F1F5F9');
        } else if (match.includes('#0F172A')) {
          return match.replace('#000000', '#0F172A');
        }
        return match;
      }
    );

    // Add contact email to templates that don't have it (admin notification templates)
    if (!content.includes('hello@applybureau.com') && !content.includes('Questions? Contact us')) {
      // Find the closing table tag before </body>
      const footerInsert = `
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F1F5F9;">
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #64748B; font-size: 14px; margin: 0 0 10px 0; text-align: center;">
                                Questions? Contact us at <a href="mailto:hello@applybureau.com" style="color: #64748B; text-decoration: none;">hello@applybureau.com</a>
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #94A3B8; font-size: 12px; margin: 0; text-align: center;">
                                © 2024 Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>`;

      if (content.includes('</table>') && content.includes('</body>')) {
        const lastTableIndex = content.lastIndexOf('</table>');
        if (lastTableIndex > -1) {
          content = content.substring(0, lastTableIndex) + footerInsert + '\n                </table>' + content.substring(lastTableIndex + 8);
          console.log('   ✓ Added contact footer');
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('   ✅ Template updated');
    } else {
      console.log('   ℹ️  No changes needed');
    }
    console.log();
  }

  console.log('🎉 Final Email Template Fix Complete!\n');
}

// Run the fix
if (require.main === module) {
  finalEmailTemplateFix().catch(console.error);
}

module.exports = finalEmailTemplateFix;