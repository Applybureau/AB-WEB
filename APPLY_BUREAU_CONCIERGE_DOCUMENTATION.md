# Apply Bureau Concierge Backend - Complete Documentation

## 🎯 Overview

The Apply Bureau Concierge Backend implements a strictly gated, admin-driven service model where every client interaction requires manual approval from the Admin (Person B). This system moves away from public automation toward a personalized concierge experience with complete administrative control.

## 👥 Persona Framework

### Person A (Client/Prospect)
- **Public Access**: Can submit basic consultation requests
- **Restricted Portal**: No access until payment confirmed and profile unlocked
- **Gated Features**: All services require admin approval and manual triggers

### Person B (Admin/Concierge)
- **Gatekeeper Role**: Controls all client progression through the system
- **Manual Approval**: Validates consultations, confirms payments, unlocks services
- **Decision Maker**: Determines when clients advance to next phase

## 🔄 Complete Concierge Workflow

### Phase 1: Initial Contact (Public)
```
Client Action: Submit consultation request
↓
System: Store request with "pending" status
↓
Admin Action: Review and choose action (Confirm/Reschedule/Waitlist)
↓
System: Send appropriate email and update status
```

### Phase 2: Payment & Registration (Gated)
```
Admin Action: Manually confirm payment and generate invite
↓
System: Send registration email with 7-day token
↓
Client Action: Create account using secure token
↓
System: Account created but profile locked
```

### Phase 3: Onboarding (Approval Required)
```
Client Action: Complete 20-question onboarding questionnaire
↓
System: Set execution_status to "pending_approval"
↓
Admin Action: Review responses and approve profile
↓
System: Unlock profile and activate Application Tracker
```

### Phase 4: Application Execution (Concierge Managed)
```
Client Access: Application Tracker now unlocked
↓
Admin Action: Update application status to "interview"
↓
System: Automatically send interview notification email
↓
Client: Receives concierge-style interview guidance
```

## 🛠️ Technical Implementation

### Database Schema Changes

#### New Tables
1. **`client_onboarding_20q`** - 20-question onboarding with approval system
2. **Enhanced `consultation_requests`** - Simplified with admin gatekeeper controls
3. **Enhanced `registered_users`** - Profile unlock and payment confirmation tracking
4. **Enhanced `applications`** - Week grouping and interview notification tracking

#### Key Fields Added
- `admin_status` (pending/confirmed/rescheduled/waitlisted)
- `preferred_slots` (JSONB array of time options)
- `execution_status` (pending_approval/active/paused/completed)
- `profile_unlocked` (boolean gatekeeper control)
- `week_number` (for mobile application grouping)
- `interview_update_sent` (automated notification tracking)

### API Endpoints

#### Public Endpoints (No Authentication)
```
POST /api/public-consultations
- Simplified form: name, email, phone, 3 time slots only
- No document uploads or complex questions
- Sets admin_status to "pending"

POST /api/public-consultations/request-new-times/:id
- Client can provide new availability when requested
- Resets admin_status to "pending" for review
```

#### Admin Concierge Controls
```
GET  /api/admin/concierge/consultations
- List all consultation requests with gatekeeper actions
- Filter by admin_status (pending/confirmed/rescheduled/waitlisted)

POST /api/admin/concierge/consultations/:id/confirm
- Confirm one of three time slots
- Send confirmation email to client
- Update status to "confirmed"

POST /api/admin/concierge/consultations/:id/reschedule
- Request new availability from client
- Send reschedule email with reason
- Update status to "rescheduled"

POST /api/admin/concierge/consultations/:id/waitlist
- Add client to waitlist
- Send waitlist email with reason
- Update status to "waitlisted"

POST /api/admin/concierge/payment/confirm-and-invite
- Manually confirm payment received
- Generate 7-day registration token
- Send welcome email with registration link

POST /api/admin/concierge/onboarding/:id/approve
- Approve completed onboarding questionnaire
- Set execution_status to "active"
- Unlock profile and enable Application Tracker
```

#### Client Onboarding (20-Question System)
```
GET  /api/client/onboarding-20q/status
- Check onboarding and profile unlock status
- Returns discovery_mode information

POST /api/client/onboarding-20q/questionnaire
- Submit comprehensive 20-question form
- Sets execution_status to "pending_approval"
- Requires admin approval to activate

GET  /api/client/onboarding-20q/questionnaire
- Retrieve existing questionnaire responses
- Excludes admin-only fields
```

#### Application Tracker (Profile-Gated)
```
GET  /api/applications/discovery-mode
- Check if Application Tracker is locked
- Returns discovery mode status and requirements

GET  /api/applications/weekly
- Mobile-optimized weekly application grouping
- Uses week_number for efficient mobile scaling

PATCH /api/applications/:id
- Enhanced with automated interview notifications
- Sends concierge email when status changes to "interview"
```

### Middleware Guards

#### Profile Unlock Guard
```javascript
// middleware/profileGuard.js
isProfileUnlocked(req, res, next)
- Checks if client profile is unlocked
- Validates execution_status is "active"
- Blocks access to Application Tracker if locked

discoveryModeInfo(req, res, next)
- Provides discovery mode status information
- Shows appropriate messaging for locked profiles
```

### Email Templates (Concierge Branded)

#### Consultation Workflow
- `consultation_confirmed_concierge.html` - Professional confirmation with meeting details
- `consultation_reschedule_request.html` - Reschedule request with new times link
- `consultation_waitlisted.html` - Waitlist notification with next steps

#### Payment & Registration
- `payment_confirmed_welcome_concierge.html` - Welcome email with registration link
- `onboarding_submitted_pending_approval.html` - Onboarding submission confirmation

#### Application Management
- `interview_update_concierge.html` - Automated interview notification
- `profile_unlocked_tracker_active.html` - Profile activation notification

### Notification System (Enhanced)

#### New Notification Types
- `CONSULTATION_CONFIRMED_BY_ADMIN`
- `CONSULTATION_RESCHEDULED_BY_ADMIN`
- `CONSULTATION_WAITLISTED_BY_ADMIN`
- `PAYMENT_CONFIRMED_INVITE_SENT`
- `ONBOARDING_COMPLETED_NEEDS_APPROVAL`
- `PROFILE_UNLOCKED_BY_ADMIN`
- `INTERVIEW_REQUEST_RECEIVED`

#### Concierge Notification Helpers
```javascript
NotificationHelpers.consultationConfirmedByAdmin(consultation, admin)
NotificationHelpers.paymentConfirmedAndInviteSent(paymentData)
NotificationHelpers.onboardingCompletedNeedsApproval(userId, onboarding)
NotificationHelpers.profileUnlockedByAdmin(profileData)
NotificationHelpers.interviewRequestReceived(userId, application)
```

## 🎨 User Experience Flow

### Client Journey (Person A)

#### 1. Initial Contact
- **Simple Form**: Name, email, phone, 3 time slots
- **No Uploads**: No resume or document requirements
- **Clear Messaging**: "Request received. We will confirm your consultation shortly."

#### 2. Waiting Period
- **Admin Review**: Request appears in admin dashboard
- **Gatekeeper Actions**: Admin can confirm, reschedule, or waitlist
- **Email Updates**: Client receives appropriate status emails

#### 3. Payment Process
- **Manual Confirmation**: Admin manually records payment
- **Registration Invite**: 7-day token sent via email
- **Account Creation**: Client creates secure account

#### 4. Onboarding Phase
- **20 Questions**: Comprehensive career questionnaire
- **Pending Approval**: Profile locked until admin review
- **Discovery Mode**: Limited access with clear next steps

#### 5. Profile Activation
- **Admin Approval**: Manual review and approval
- **Tracker Unlocked**: Full Application Tracker access
- **Concierge Support**: Ongoing admin-managed experience

### Admin Experience (Person B)

#### 1. Consultation Management
- **Dashboard View**: All requests with action buttons
- **Quick Actions**: Confirm/Reschedule/Waitlist with one click
- **Time Selection**: Choose from 3 client-provided slots
- **Reason Tracking**: Document decisions for client communication

#### 2. Payment & Registration
- **Manual Recording**: Confirm payments received via Interac e-transfer
- **Token Generation**: Secure 7-day registration links
- **Client Onboarding**: Monitor registration completion

#### 3. Profile Management
- **Onboarding Review**: Detailed 20-question responses
- **Approval Control**: Unlock profiles when ready
- **Tracker Activation**: Enable Application Tracker access

#### 4. Ongoing Concierge
- **Application Updates**: Trigger automated interview notifications
- **Status Management**: Control client progression
- **Communication**: Professional email templates for all interactions

## 📱 Mobile Optimization

### Weekly Application Grouping
- **Week Numbers**: Applications grouped by week for mobile scaling
- **Efficient Queries**: Optimized database queries for mobile performance
- **Compact Display**: Week-based view reduces mobile scrolling

### Discovery Mode
- **Locked State**: Clear messaging when features are locked
- **Progress Indicators**: Show completion status and next steps
- **Mobile-Friendly**: Optimized for mobile onboarding experience

## 🔒 Security Features

### Gatekeeper Controls
- **Admin Approval**: All major actions require admin confirmation
- **Profile Locks**: Application Tracker locked until approval
- **Token Security**: 7-day expiring registration tokens
- **Role Validation**: Strict role-based access control

### Data Protection
- **Encrypted Storage**: Secure handling of client information
- **Audit Trails**: Track all admin actions and decisions
- **Access Logging**: Monitor profile unlock and access patterns

## 🚀 Deployment & Configuration

### Environment Variables
```
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
```

### Database Setup
1. Run `CONCIERGE_REFACTOR_SCHEMA.sql` in Supabase SQL Editor
2. Verify new tables and functions are created
3. Test admin and client role permissions

### Route Configuration
```javascript
// server.js
app.use('/api/public-consultations', publicConsultationsRoutes);
app.use('/api/admin/concierge', adminConciergeRoutes);
app.use('/api/client/onboarding-20q', clientOnboarding20QRoutes);
```

## 📊 Key Metrics & Analytics

### Admin Dashboard Metrics
- **Consultation Conversion**: Pending → Confirmed → Completed
- **Payment Processing**: Manual confirmation tracking
- **Onboarding Approval**: Time from submission to approval
- **Profile Activation**: Tracker unlock rates

### Client Experience Metrics
- **Response Times**: Admin action to client notification
- **Completion Rates**: Onboarding questionnaire completion
- **Engagement**: Application Tracker usage post-unlock
- **Interview Success**: Automated notification effectiveness

## 🎯 Success Criteria

### Gatekeeper Control
- ✅ No automatic approvals or instant access
- ✅ All client progression requires admin action
- ✅ Clear admin dashboard with action buttons
- ✅ Professional email communications for all interactions

### Client Experience
- ✅ Simplified initial consultation request
- ✅ Clear messaging about manual approval process
- ✅ Comprehensive onboarding questionnaire
- ✅ Locked state with clear next steps
- ✅ Unlocked experience with full tracker access

### Technical Implementation
- ✅ Database schema supports gatekeeper model
- ✅ API endpoints provide admin control
- ✅ Middleware enforces profile locks
- ✅ Email templates maintain professional branding
- ✅ Mobile optimization for application tracking

## 🔄 Future Enhancements

### Phase 2 Considerations
- **Advanced Analytics**: Detailed client progression metrics
- **Bulk Actions**: Admin tools for managing multiple clients
- **Custom Workflows**: Configurable approval processes
- **Integration APIs**: Connect with external CRM systems
- **Mobile App**: Native mobile application for clients

### Scalability Features
- **Admin Teams**: Multiple admin users with role permissions
- **Client Segmentation**: Different workflows for different tiers
- **Automated Reminders**: Follow-up systems for pending actions
- **Performance Monitoring**: Real-time system health tracking

---

## 📞 Support & Maintenance

### Admin Training
- **Dashboard Navigation**: How to use concierge controls
- **Email Templates**: Understanding automated communications
- **Client Management**: Best practices for gatekeeper role
- **Troubleshooting**: Common issues and solutions

### Technical Support
- **Database Monitoring**: Track schema performance
- **Email Delivery**: Monitor Resend API usage
- **Security Audits**: Regular access control reviews
- **Performance Optimization**: Query and response time monitoring

---

**The Apply Bureau Concierge Backend successfully transforms the system from automated workflows to a premium, admin-controlled concierge experience. Every client interaction is now gated by manual approval, ensuring personalized service and complete administrative control over the client journey.**``````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````