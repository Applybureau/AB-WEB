require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function clearAllTestDataSafe() {
  console.log('🗑️  Clearing All Test Data from Database (Safe Mode)\n');
  console.log('='.repeat(70));
  console.log('⚠️  WARNING: This will delete ALL data EXCEPT admin accounts!');
  console.log('='.repeat(70));
  console.log('\nKeeping:');
  console.log('  ✅ Admin accounts (admins table)');
  console.log('  ✅ Admin accounts in clients table (role = admin)');
  console.log('\nDeleting (in correct order to handle foreign keys):');
  console.log('  ❌ All dependent records first');
  console.log('  ❌ Then parent records');
  console.log('\n' + '='.repeat(70));
  console.log('\nStarting cleanup in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  let totalDeleted = 0;

  try {
    // Delete in order to respect foreign key constraints
    // Children first, then parents

    // 1. Delete client_onboarding_20q (has FK to registered_users)
    console.log('1️⃣  Deleting client onboarding records...');
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (onboardingError) {
      console.error('   ⚠️  Error:', onboardingError.message);
    } else {
      const count = onboarding?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} onboarding records`);
    }

    // 2. Delete applications (might have FK to clients)
    console.log('\n2️⃣  Deleting applications...');
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (appError) {
      console.error('   ⚠️  Error:', appError.message);
    } else {
      const count = applications?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} applications`);
    }

    // 3. Delete notifications
    console.log('\n3️⃣  Deleting notifications...');
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (notifError) {
      console.error('   ⚠️  Error:', notifError.message);
    } else {
      const count = notifications?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} notifications`);
    }

    // 4. Delete messages
    console.log('\n4️⃣  Deleting messages...');
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (msgError) {
      console.error('   ⚠️  Error:', msgError.message);
    } else {
      const count = messages?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} messages`);
    }

    // 5. Delete meetings/consultations
    console.log('\n5️⃣  Deleting meetings/consultations...');
    const { data: meetings, error: meetError } = await supabaseAdmin
      .from('consultations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (meetError) {
      console.error('   ⚠️  Error:', meetError.message);
    } else {
      const count = meetings?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} meetings/consultations`);
    }

    // 6. Delete file uploads
    console.log('\n6️⃣  Deleting file uploads...');
    const { data: files, error: fileError } = await supabaseAdmin
      .from('file_uploads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (fileError) {
      console.error('   ⚠️  Error:', fileError.message);
    } else {
      const count = files?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} file uploads`);
    }

    // 7. Delete strategy calls
    console.log('\n7️⃣  Deleting strategy calls...');
    const { data: calls, error: callError } = await supabaseAdmin
      .from('strategy_calls')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (callError) {
      console.error('   ⚠️  Error:', callError.message);
    } else {
      const count = calls?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} strategy calls`);
    }

    // 8. Delete leads
    console.log('\n8️⃣  Deleting leads...');
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (leadError) {
      console.error('   ⚠️  Error:', leadError.message);
    } else {
      const count = leads?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} leads`);
    }

    // 9. Delete consultation requests
    console.log('\n9️⃣  Deleting consultation requests...');
    const { data: consultations, error: consultError } = await supabaseAdmin
      .from('consultation_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (consultError) {
      console.error('   ⚠️  Error:', consultError.message);
    } else {
      const count = consultations?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} consultation requests`);
    }

    // 10. Delete contact requests
    console.log('\n🔟  Deleting contact requests...');
    const { data: contacts, error: contactError } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (contactError) {
      console.error('   ⚠️  Error:', contactError.message);
    } else {
      const count = contacts?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} contact requests`);
    }

    // 11. Delete contact submissions
    console.log('\n1️⃣1️⃣  Deleting contact submissions...');
    const { data: submissions, error: submissionError } = await supabaseAdmin
      .from('contact_submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (submissionError) {
      console.error('   ⚠️  Error:', submissionError.message);
    } else {
      const count = submissions?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} contact submissions`);
    }

    // 12. Delete registered users (after all dependencies)
    console.log('\n1️⃣2️⃣  Deleting registered users...');
    const { data: registered, error: registeredError } = await supabaseAdmin
      .from('registered_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (registeredError) {
      console.error('   ⚠️  Error:', registeredError.message);
    } else {
      const count = registered?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} registered users`);
    }

    // 13. Delete client accounts (keep admins) - LAST
    console.log('\n1️⃣3️⃣  Deleting client accounts (keeping admins)...');
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .delete()
      .neq('role', 'admin');

    if (clientError) {
      console.error('   ⚠️  Error:', clientError.message);
    } else {
      const count = clients?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} client accounts`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log(`\n📊 Total records deleted: ${totalDeleted}`);
    console.log('\n✅ Admin accounts preserved:');
    
    // Check remaining admins
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, role, is_active');

    if (!adminError && admins) {
      console.log(`\n   Admins table: ${admins.length} accounts`);
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.full_name}) - ${admin.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    const { data: clientAdmins, error: clientAdminError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (!clientAdminError && clientAdmins) {
      console.log(`\n   Clients table (admins): ${clientAdmins.length} accounts`);
      clientAdmins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.full_name})`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 Database is now clean and ready for production!');
    console.log('\n💡 You can now:');
    console.log('   1. Deploy to Vercel: vercel --prod');
    console.log('   2. Test with real data');
    console.log('   3. Admin login: admin@applybureau.com / Admin@123456');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    console.error('Details:', error.message);
  }
}

// Run the cleanup
clearAllTestDataSafe();
