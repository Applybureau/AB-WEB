const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testProgressEndpoint() {
  console.log('🧪 Testing Progress Endpoint\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as test client
    console.log('\n1️⃣ Logging in as test client...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'israelloko65@gmail.com',
      password: 'Great123@'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Step 2: Test progress endpoint
    console.log('\n2️⃣ Fetching progress data...');
    const progressResponse = await axios.get(
      `${BASE_URL}/api/client/dashboard/progress`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Progress endpoint successful\n');
    console.log('='.repeat(60));
    console.log('📊 PROGRESS DATA:');
    console.log('='.repeat(60));

    const data = progressResponse.data;

    // Overall Progress
    console.log('\n📈 OVERALL PROGRESS:');
    console.log(`  Progress: ${data.overall_progress.percentage}%`);
    console.log(`  Status: ${data.overall_progress.status_display} (${data.overall_progress.status_color})`);
    console.log(`  Days in Program: ${data.overall_progress.days_in_program}`);
    console.log(`  Start Date: ${data.overall_progress.start_date}`);

    // Milestones
    console.log('\n🎯 MILESTONES:');
    data.milestones.forEach(milestone => {
      const statusIcon = milestone.status === 'completed' ? '✅' : 
                        milestone.status === 'in_progress' ? '🔄' : '⏳';
      console.log(`  ${statusIcon} ${milestone.title}: ${milestone.progress}%`);
      console.log(`     ${milestone.description}`);
      if (milestone.current !== undefined) {
        console.log(`     Progress: ${milestone.current}/${milestone.target}`);
      }
    });

    // Application Metrics
    console.log('\n📊 APPLICATION METRICS:');
    console.log(`  Total Applications: ${data.application_metrics.total_applications}`);
    console.log(`  This Week: ${data.application_metrics.applications_this_week}`);
    console.log(`  This Month: ${data.application_metrics.applications_this_month}`);
    console.log(`  Response Rate: ${data.application_metrics.response_rate}%`);
    console.log(`  Interview Rate: ${data.application_metrics.interview_rate}%`);
    console.log(`  Avg Response Time: ${data.application_metrics.average_response_time_days} days`);

    // Status Breakdown
    console.log('\n📋 STATUS BREAKDOWN:');
    Object.entries(data.application_metrics.status_breakdown).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`  ${status}: ${count}`);
      }
    });

    // Weekly Activity
    console.log('\n📅 WEEKLY ACTIVITY (Last 4 Weeks):');
    data.weekly_activity.forEach(week => {
      console.log(`  ${week.week_start} to ${week.week_end}:`);
      console.log(`    Applications: ${week.applications_submitted}`);
      console.log(`    Responses: ${week.responses_received}`);
      console.log(`    Interviews: ${week.interviews_scheduled}`);
    });

    // Timeline
    console.log('\n⏰ RECENT TIMELINE:');
    data.timeline.slice(0, 5).forEach(event => {
      const icon = event.icon === 'briefcase' ? '💼' :
                   event.icon === 'calendar' ? '📅' :
                   event.icon === 'star' ? '⭐' : '📧';
      console.log(`  ${icon} ${event.title}`);
      console.log(`     ${event.description}`);
      console.log(`     ${new Date(event.date).toLocaleDateString()}`);
    });

    // Next Steps
    console.log('\n🎯 NEXT STEPS:');
    data.next_steps.forEach(step => {
      const priorityIcon = step.priority === 1 ? '🔴' :
                          step.priority === 2 ? '🟡' : '🟢';
      console.log(`  ${priorityIcon} ${step.title}`);
      console.log(`     ${step.description}`);
      console.log(`     Due: ${step.due_date}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

    // Output full JSON for inspection
    console.log('\n📄 Full JSON Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Run the test
testProgressEndpoint();
