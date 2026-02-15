// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

/**
 * CLEAR ALL TEST DATA - PRODUCTION RESET SCRIPT
 * 
 * This script will:
 * 1. Delete all uploaded files from storage
 * 2. Delete all consultations/consultation requests
 * 3. Delete all applications
 * 4. Delete all clients (registered_users with role='client')
 * 5. Delete all test admins (keep only super admin)
 * 6. Delete all messages, notifications, and related data
 * 
 * ⚠️  WARNING: THIS IS DESTRUCTIVE AND CANNOT BE UNDONE!
 */

// Super admin email to preserve (CHANGE THIS TO YOUR ACTUAL SUPER ADMIN EMAIL)
const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';

async function clearAllTestData() {
  console.log('🚨 CLEARING ALL TEST DATA\n');
  console.log('='.repeat(70));
  console.log('\n⚠️  WARNING: This will delete ALL data except super admin!');
  console.log(`   Super admin to preserve: ${SUPER_ADMIN_EMAIL}\n`);
  console.log('='.repeat(70));
  
  const results = {
    storage_files_deleted: 0,
    consultations_deleted: 0,
    consultation_requests_deleted: 0,
    applications_deleted: 0,
    clients_deleted: 0,
    admins_deleted: 0,
    messages_deleted: 0,
    notifications_deleted: 0,
    errors: []
  };

  try {
    // ==================== STEP 1: DELETE STORAGE FILES ====================
    console.log('\n📦 STEP 1: Deleting all uploaded files from storage...\n');
    
    try {
      // List all buckets
      const { data: buckets, error: bucketsError } = await supabaseAdmin
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.log('⚠️  Could not list storage buckets:', bucketsError.message);
      } else if (buckets && buckets.length > 0) {
        console.log(`Found ${buckets.length} storage bucket(s)\n`);
        
        for (const bucket of buckets) {
          console.log(`Clearing bucket: ${bucket.name}`);
          
          try {
            // List all files in bucket
            const { data: files, error: listError } = await supabaseAdmin
              .storage
              .from(bucket.name)
              .list('', {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' }
              });
            
            if (listError) {
              console.log(`  ⚠️  Could not list files in ${bucket.name}:`, listError.message);
              continue;
            }
            
            if (files && files.length > 0) {
              console.log(`  Found ${files.length} file(s) in ${bucket.name}`);
              
              // Delete files in batches
              const filePaths = files.map(file => file.name);
              const { data: deleteData, error: deleteError } = await supabaseAdmin
                .storage
                .from(bucket.name)
                .remove(filePaths);
              
              if (deleteError) {
                console.log(`  ❌ Error deleting files:`, deleteError.message);
                results.errors.push(`Storage ${bucket.name}: ${deleteError.message}`);
              } else {
                results.storage_files_deleted += files.length;
                console.log(`  ✅ Deleted ${files.length} file(s) from ${bucket.name}`);
              }
            } else {
              console.log(`  No files in ${bucket.name}`);
            }
          } catch (bucketError) {
            console.log(`  ⚠️  Error processing bucket ${bucket.name}:`, bucketError.message);
          }
        }
      } else {
        console.log('No storage buckets found');
      }
    } catch (storageError) {
      console.log('⚠️  Storage cleanup error:', storageError.message);
      results.errors.push(`Storage: ${storageError.message}`);
    }

    // ==================== STEP 2: DELETE MESSAGES ====================
    console.log('\n💬 STEP 2: Deleting all messages...\n');
    
    try {
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (messagesError) {
        console.log('⚠️  Could not delete messages:', messagesError.message);
        results.errors.push(`Messages: ${messagesError.message}`);
      } else {
        results.messages_deleted = messages?.length || 0;
        console.log(`✅ Deleted ${results.messages_deleted} message(s)`);
      }
    } catch (error) {
      console.log('⚠️  Messages table may not exist:', error.message);
    }

    // ==================== STEP 3: DELETE NOTIFICATIONS ====================
    console.log('\n🔔 STEP 3: Deleting all notifications...\n');
    
    try {
      const { data: notifications, error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (notificationsError) {
        console.log('⚠️  Could not delete notifications:', notificationsError.message);
        results.errors.push(`Notifications: ${notificationsError.message}`);
      } else {
        results.notifications_deleted = notifications?.length || 0;
        console.log(`✅ Deleted ${results.notifications_deleted} notification(s)`);
      }
    } catch (error) {
      console.log('⚠️  Notifications table may not exist:', error.message);
    }

    // ==================== STEP 4: DELETE APPLICATIONS ====================
    console.log('\n📋 STEP 4: Deleting all applications...\n');
    
    try {
      const { data: applications, error: applicationsError } = await supabaseAdmin
        .from('applications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (applicationsError) {
        console.log('⚠️  Could not delete applications:', applicationsError.message);
        results.errors.push(`Applications: ${applicationsError.message}`);
      } else {
        results.applications_deleted = applications?.length || 0;
        console.log(`✅ Deleted ${results.applications_deleted} application(s)`);
      }
    } catch (error) {
      console.log('⚠️  Applications table may not exist:', error.message);
    }

    // ==================== STEP 5: DELETE CONSULTATIONS ====================
    console.log('\n📅 STEP 5: Deleting all consultations...\n');
    
    try {
      const { data: consultations, error: consultationsError } = await supabaseAdmin
        .from('consultations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (consultationsError) {
        console.log('⚠️  Could not delete consultations:', consultationsError.message);
        results.errors.push(`Consultations: ${consultationsError.message}`);
      } else {
        results.consultations_deleted = consultations?.length || 0;
        console.log(`✅ Deleted ${results.consultations_deleted} consultation(s)`);
      }
    } catch (error) {
      console.log('⚠️  Consultations table may not exist:', error.message);
    }

    // ==================== STEP 6: DELETE CONSULTATION REQUESTS ====================
    console.log('\n📝 STEP 6: Deleting all consultation requests...\n');
    
    try {
      const { data: requests, error: requestsError } = await supabaseAdmin
        .from('consultation_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (requestsError) {
        console.log('⚠️  Could not delete consultation requests:', requestsError.message);
        results.errors.push(`Consultation Requests: ${requestsError.message}`);
      } else {
        results.consultation_requests_deleted = requests?.length || 0;
        console.log(`✅ Deleted ${results.consultation_requests_deleted} consultation request(s)`);
      }
    } catch (error) {
      console.log('⚠️  Consultation requests table may not exist:', error.message);
    }

    // ==================== STEP 7: DELETE CONTACT REQUESTS ====================
    console.log('\n📧 STEP 7: Deleting all contact requests...\n');
    
    try {
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('contact_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (contactsError) {
        console.log('⚠️  Could not delete contact requests:', contactsError.message);
      } else {
        console.log(`✅ Deleted ${contacts?.length || 0} contact request(s)`);
      }
    } catch (error) {
      console.log('⚠️  Contact requests table may not exist:', error.message);
    }

    // ==================== STEP 8: DELETE ALL CLIENTS ====================
    console.log('\n👥 STEP 8: Deleting all clients...\n');
    
    // Delete from registered_users table
    try {
      const { data: regClients, error: regClientsError } = await supabaseAdmin
        .from('registered_users')
        .delete()
        .eq('role', 'client')
        .select();
      
      if (regClientsError) {
        console.log('⚠️  Could not delete clients from registered_users:', regClientsError.message);
        results.errors.push(`Registered Users (clients): ${regClientsError.message}`);
      } else {
        const count = regClients?.length || 0;
        results.clients_deleted += count;
        console.log(`✅ Deleted ${count} client(s) from registered_users`);
      }
    } catch (error) {
      console.log('⚠️  Registered_users table may not exist:', error.message);
    }

    // Delete from clients table
    try {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('clients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (clientsError) {
        console.log('⚠️  Could not delete from clients table:', clientsError.message);
        results.errors.push(`Clients: ${clientsError.message}`);
      } else {
        const count = clients?.length || 0;
        console.log(`✅ Deleted ${count} record(s) from clients table`);
      }
    } catch (error) {
      console.log('⚠️  Clients table may not exist:', error.message);
    }

    // ==================== STEP 9: DELETE TEST ADMINS ====================
    console.log('\n👨‍💼 STEP 9: Deleting test admins (preserving super admin)...\n');
    
    console.log(`Preserving super admin: ${SUPER_ADMIN_EMAIL}`);
    
    // Delete from admins table
    try {
      const { data: admins, error: adminsError } = await supabaseAdmin
        .from('admins')
        .delete()
        .neq('email', SUPER_ADMIN_EMAIL)
        .select();
      
      if (adminsError) {
        console.log('⚠️  Could not delete admins:', adminsError.message);
        results.errors.push(`Admins: ${adminsError.message}`);
      } else {
        results.admins_deleted = admins?.length || 0;
        console.log(`✅ Deleted ${results.admins_deleted} test admin(s) from admins table`);
      }
    } catch (error) {
      console.log('⚠️  Admins table may not exist:', error.message);
    }

    // Delete admin users from registered_users
    try {
      const { data: regAdmins, error: regAdminsError } = await supabaseAdmin
        .from('registered_users')
        .delete()
        .eq('role', 'admin')
        .neq('email', SUPER_ADMIN_EMAIL)
        .select();
      
      if (regAdminsError) {
        console.log('⚠️  Could not delete admins from registered_users:', regAdminsError.message);
      } else {
        console.log(`✅ Deleted ${regAdmins?.length || 0} test admin(s) from registered_users`);
      }
    } catch (error) {
      console.log('⚠️  Could not delete from registered_users:', error.message);
    }

    // ==================== STEP 10: DELETE OTHER TABLES ====================
    console.log('\n🗑️  STEP 10: Deleting other test data...\n');
    
    const otherTables = [
      'twenty_questions',
      'strategy_calls',
      'interviews',
      'leads',
      'meetings',
      'client_files',
      'application_logs'
    ];
    
    for (const tableName of otherTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select();
        
        if (error) {
          console.log(`⚠️  Could not delete from ${tableName}:`, error.message);
        } else {
          console.log(`✅ Deleted ${data?.length || 0} record(s) from ${tableName}`);
        }
      } catch (error) {
        console.log(`⚠️  Table ${tableName} may not exist`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(70));
    console.log('📊 CLEANUP SUMMARY\n');
    
    console.log('Data Deleted:');
    console.log(`  • Storage Files: ${results.storage_files_deleted}`);
    console.log(`  • Consultations: ${results.consultations_deleted}`);
    console.log(`  • Consultation Requests: ${results.consultation_requests_deleted}`);
    console.log(`  • Applications: ${results.applications_deleted}`);
    console.log(`  • Clients: ${results.clients_deleted}`);
    console.log(`  • Test Admins: ${results.admins_deleted}`);
    console.log(`  • Messages: ${results.messages_deleted}`);
    console.log(`  • Notifications: ${results.notifications_deleted}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ Super Admin Preserved:');
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    
    // Verify super admin still exists
    try {
      const { data: superAdmin, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, full_name, role')
        .eq('email', SUPER_ADMIN_EMAIL)
        .single();
      
      if (error || !superAdmin) {
        console.log('\n⚠️  WARNING: Super admin not found! You may need to recreate it.');
      } else {
        console.log(`  Name: ${superAdmin.full_name || 'N/A'}`);
        console.log(`  Role: ${superAdmin.role || 'admin'}`);
        console.log(`  ID: ${superAdmin.id}`);
      }
    } catch (error) {
      console.log('\n⚠️  Could not verify super admin:', error.message);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Database cleanup complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Verify super admin can still login');
    console.log('   2. Test creating new clients');
    console.log('   3. Test file uploads');
    console.log('   4. Monitor for any issues\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during cleanup:', error);
    throw error;
  }
}

// Confirmation prompt
async function confirmAndRun() {
  console.log('\n⚠️  ⚠️  ⚠️  DANGER ZONE ⚠️  ⚠️  ⚠️\n');
  console.log('This script will DELETE ALL DATA except the super admin!');
  console.log(`Super admin email: ${SUPER_ADMIN_EMAIL}`);
  console.log('\nThis action CANNOT be undone!\n');
  console.log('To proceed, edit this script and set CONFIRMED = true\n');
  
  const CONFIRMED = true; // Change to true to run
  
  if (!CONFIRMED) {
    console.log('❌ Script not confirmed. Exiting safely.\n');
    console.log('To run this script:');
    console.log('1. Edit backend/clear-all-test-data.js');
    console.log('2. Set SUPER_ADMIN_EMAIL to your actual super admin email');
    console.log('3. Set CONFIRMED = true');
    console.log('4. Run: node backend/clear-all-test-data.js\n');
    return;
  }
  
  console.log('✅ Confirmation received. Starting cleanup in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await clearAllTestData();
}

// Run if called directly
if (require.main === module) {
  confirmAndRun()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAllTestData };
