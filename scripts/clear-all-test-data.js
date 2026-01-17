require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function clearAllTestData() {
  console.log('🗑️  Clearing All Test Data from Database\n');
  console.log('='.repeat(70));
  console.log('⚠️  WARNING: This will delete ALL data EXCEPT admin accounts!');
  console.log('='.repeat(70));
  console.log('\nKeeping:');
  console.log('  ✅ Admin accounts (admins table)');
  console.log('  ✅ Admin accounts in clients table (role = admin)');
  console.log('\nDeleting:');
  console.log('  ❌ All consultation requests');
  console.log('  ❌ All contact requests');
  console.log('  ❌ All client accounts (role = client)');
  console.log('  ❌ All registered users');
  console.log('  ❌ All applications');
  console.log('  ❌ All notifications');
  console.log('  ❌ All messages');
  console.log('  ❌ All meetings');
  console.log('  ❌ All file uploads');
  console.log('\n' + '='.repeat(70));
  console.log('\nStarting cleanup in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  let totalDeleted = 0;

  try {
    // 1. Delete consultation requests
    console.log('1️⃣  Deleting consultation requests...');
    const { data: consultations, error: consultError } = await supabaseAdmin
      .from('consultation_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (consultError) {
      console.error('   ⚠️  Error:', consultError.message);
    } else {
      const count = consultations?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} consultation requests`);
    }

    // 2. Delete contact requests
    console.log('\n2️⃣  Deleting contact requests...');
    const { data: contacts, error: contactError } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (contactError) {
      console.error('   ⚠️  Error:', contactError.message);
    } else {
      const count = contacts?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} contact requests`);
    }

    // 3. Delete contact submissions (if different table)
    console.log('\n3️⃣  Deleting contact submissions...');
    const { data: submissions, error: submissionError } = await supabaseAdmin
      .from('contact_submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (submissionError) {
      console.error('   ⚠️  Error:', submissionError.message);
    } else {
      const count = submissions?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} contact submissions`);
    }

    // 4. Delete client accounts (keep admins)
    console.log('\n4️⃣  Deleting client accounts (keeping admins)...');
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .delete()
      .neq('role', 'admin'); // Keep admin accounts

    if (clientError) {
      console.error('   ⚠️  Error:', clientError.message);
    } else {
      const count = clients?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} client accounts`);
    }

    // 5. Delete registered users
    console.log('\n5️⃣  Deleting registered users...');
    const { data: registered, error: registeredError } = await supabaseAdmin
      .from('registered_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (registeredError) {
      console.error('   ⚠️  Error:', registeredError.message);
    } else {
      const count = registered?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} registered users`);
    }

    // 6. Delete applications
    console.log('\n6️⃣  Deleting applications...');
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (appError) {
      console.error('   ⚠️  Error:', appError.message);
    } else {
      const count = applications?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} applications`);
    }

    // 7. Delete notifications
    console.log('\n7️⃣  Deleting notifications...');
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (notifError) {
      console.error('   ⚠️  Error:', notifError.message);
    } else {
      const count = notifications?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} notifications`);
    }

    // 8. Delete messages
    console.log('\n8️⃣  Deleting messages...');
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (msgError) {
      console.error('   ⚠️  Error:', msgError.message);
    } else {
      const count = messages?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} messages`);
    }

    // 9. Delete meetings/consultations
    console.log('\n9️⃣  Deleting meetings/consultations...');
    const { data: meetings, error: meetError } = await supabaseAdmin
      .from('consultations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (meetError) {
      console.error('   ⚠️  Error:', meetError.message);
    } else {
      const count = meetings?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} meetings/consultations`);
    }

    // 10. Delete file uploads
    console.log('\n🔟  Deleting file uploads...');
    const { data: files, error: fileError } = await supabaseAdmin
      .from('file_uploads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (fileError) {
      console.error('   ⚠️  Error:', fileError.message);
    } else {
      const count = files?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} file uploads`);
    }

    // 11. Delete leads
    console.log('\n1️⃣1️⃣  Deleting leads...');
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (leadError) {
      console.error('   ⚠️  Error:', leadError.message);
    } else {
      const count = leads?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} leads`);
    }

    // 12. Delete strategy calls
    console.log('\n1️⃣2️⃣  Deleting strategy calls...');
    const { data: calls, error: callError } = await supabaseAdmin
      .from('strategy_calls')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (callError) {
      console.error('   ⚠️  Error:', callError.message);
    } else {
      const count = calls?.length || 0;
      totalDeleted += count;
      console.log(`   ✅ Deleted ${count} strategy calls`);
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
    console.log('   1. Deploy to Vercel');
    console.log('   2. Test with real data');
    console.log('   3. Admin login still works with existing credentials');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    console.error('Details:', error.message);
  }
}

// Run the cleanup
clearAllTestData();
