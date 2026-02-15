require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const { sendEmail } = require('./utils/email');

async function testConfirmDirect() {
  console.log('🧪 Direct Strategy Call Confirmation Test\n');

  const strategyCallId = 'ac87b39e-175a-4716-a34b-f6b12465d25e';
  const selectedSlotIndex = 0;
  const meetingLink = 'https://meet.google.com/test-meeting';
  const adminNotes = 'Test confirmation';

  try {
    // 1. Get strategy call
    console.log('1️⃣ Fetching strategy call...');
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('id', strategyCallId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching strategy call:', fetchError);
      return;
    }

    console.log('✅ Found strategy call:');
    console.log('   Client:', strategyCall.client_name);
    console.log('   Email:', strategyCall.client_email);
    console.log('   Preferred slots:', JSON.stringify(strategyCall.preferred_slots, null, 2));

    // 2. Validate slot index
    console.log('\n2️⃣ Validating slot index...');
    const selectedSlot = strategyCall.preferred_slots[selectedSlotIndex];
    
    if (!selectedSlot) {
      console.error(`❌ Invalid slot index ${selectedSlotIndex}`);
      console.log(`   Available slots: ${strategyCall.preferred_slots.length}`);
      return;
    }

    console.log('✅ Selected slot:', JSON.stringify(selectedSlot, null, 2));

    // 3. Create confirmed time
    const confirmedTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);
    console.log('\n3️⃣ Confirmed time:', confirmedTime.toISOString());

    // 4. Get a real admin ID
    console.log('\n4️⃣ Getting admin ID...');
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, full_name')
      .limit(1)
      .single();

    const adminId = admin?.id || null;
    console.log('   Admin:', admin?.full_name || 'None', adminId ? `(${adminId})` : '');

    // 5. Update database
    console.log('\n5️⃣ Updating database...');
    const updateData = {
      admin_status: 'confirmed',
      status: 'confirmed',
      confirmed_time: confirmedTime.toISOString(),
      meeting_link: meetingLink,
      admin_notes: adminNotes,
      admin_action_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Skip admin_action_by due to FK constraint issues

    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update(updateData)
      .eq('id', strategyCallId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating strategy call:', updateError);
      return;
    }

    console.log('✅ Database updated successfully');
    console.log('   Status:', updatedCall.status);
    console.log('   Admin status:', updatedCall.admin_status);
    console.log('   Confirmed time:', updatedCall.confirmed_time);

    // 6. Send email
    console.log('\n6️⃣ Sending confirmation email...');
    try {
      await sendEmail(strategyCall.client_email, 'strategy_call_confirmed', {
        client_name: strategyCall.client_name,
        call_date: selectedSlot.date,
        call_time: selectedSlot.time,
        call_duration: '30 minutes',
        meeting_link: meetingLink || 'A Lead Strategist will contact you at the scheduled time.',
        admin_name: admin?.full_name || 'Apply Bureau Team',
        call_purpose: 'This call aligns your goals, role targets, and application strategy.',
        next_steps: 'Please mark this time in your calendar. We look forward to discussing your career goals!',
        user_id: strategyCall.client_id
      });

      console.log('✅ Email sent successfully to:', strategyCall.client_email);
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
      console.log('   (Database was still updated successfully)');
    }

    console.log('\n\n✅ CONFIRMATION COMPLETE!');
    console.log('\nSummary:');
    console.log('  • Strategy Call ID:', strategyCallId);
    console.log('  • Client:', strategyCall.client_name);
    console.log('  • Email:', strategyCall.client_email);
    console.log('  • Date:', selectedSlot.date);
    console.log('  • Time:', selectedSlot.time);
    console.log('  • Meeting Link:', meetingLink);
    console.log('  • Status: CONFIRMED');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testConfirmDirect();
