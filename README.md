# Apply Bureau Backend

A comprehensive, enterprise-grade backend system for managing business consultations, client applications, and administrative workflows. Built with Node.js, Express, and Supabase.

## 🚀 Features

### Core System
- **Advanced Authentication** - JWT-based auth with multi-role support (admin, super_admin, consultant, manager)
- **User Profile Management** - Comprehensive client profiles with business information and onboarding workflow
- **Application System** - Complete application lifecycle with priority levels, cost tracking, and satisfaction ratings
- **Consultation Management** - Advanced meeting scheduling with recordings, transcripts, and billing
- **Real-time Notifications** - Multi-channel notification system with email/SMS delivery
- **Lead Management** - Lead scoring, qualification, and conversion tracking
- **File Storage** - Secure document management with role-based access control

### Advanced Features
- **Lead Scoring & Qualification** - Automated lead assessment and prioritization
- **Satisfaction Ratings** - Client feedback collection and analysis
- **Cost Tracking & Billing** - Comprehensive financial tracking with hourly rates
- **Meeting Recordings** - Video/audio recording storage and management
- **UTM Tracking** - Marketing attribution and campaign tracking
- **Two-Factor Authentication** - Enhanced security with 2FA support
- **Account Security** - Login attempt monitoring and account lockout protection
- **Audit Logging** - Complete activity tracking and audit trails

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage with RLS policies
- **Email**: Nodemailer with SMTP integration
- **Real-time**: Supabase real-time subscriptions
- **Testing**: Jest with comprehensive test coverage

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

**Run this in your Supabase SQL Editor:**
```sql
-- Copy and paste the entire content of MASTER_SCHEMA.sql
-- This creates the complete database with all features
```

### Environment Variables

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Optional: Google Meet Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Start the Server

```bash
# Create your first admin user
npm run create-first-admin

# Start development server
npm run dev

# Start production server
npm start
```

## 📊 Database Schema

### Core Tables

#### **profiles** - User Profiles
Extended user profiles with comprehensive business information:
- Personal details (name, email, phone, company, position)
- Business information (industry, stage, revenue, team size)
- Goals and challenges
- Onboarding and approval status
- Marketing preferences and consent
- Activity tracking

#### **admin_users** - Administrative Users
Multi-role admin system with advanced features:
- Role hierarchy (admin, super_admin, consultant, manager)
- Department and specialization tracking
- Hourly rates and availability schedules
- Security features (2FA, account lockout, login tracking)
- Permission management

#### **applications** - Client Applications
Comprehensive application management:
- Multiple types (consultation, strategy_call, onboarding, follow_up, emergency)
- Priority levels (low, medium, high, urgent, critical)
- Cost estimation and tracking
- Document attachments
- Satisfaction ratings and feedback
- Tag-based organization

#### **consultations** - Meeting Management
Advanced consultation system:
- Multiple meeting types and formats
- Recording and transcript storage
- Billing and time tracking
- Action items and follow-up management
- Satisfaction ratings
- Meeting preparation and notes

#### **notifications** - Notification System
Multi-channel notification delivery:
- Various notification types and categories
- Priority levels and expiration
- Email and SMS delivery tracking
- Action buttons and URLs
- Read status and timestamps

#### **contact_submissions** - Lead Management
Public contact form with lead tracking:
- Lead scoring and qualification
- UTM tracking for marketing attribution
- Response time monitoring
- Conversion value tracking
- Tag-based organization

#### **consultation_requests** - Public Booking
Public consultation booking system:
- Detailed business information collection
- Preferred time scheduling
- Lead scoring and qualification
- Approval workflow
- Estimated value tracking

### Storage Buckets

- **documents** - User-uploaded documents
- **profiles** - Profile images and files
- **consultations** - Meeting materials
- **recordings** - Video/audio recordings
- **transcripts** - Meeting transcripts
- **admin-files** - Administrative documents
- **templates** - Document templates

## 🔌 API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

#### POST `/api/auth/login`
User login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/logout`
User logout (requires authentication)

#### GET `/api/auth/me`
Get current user profile (requires authentication)

#### POST `/api/auth/forgot-password`
Request password reset
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/auth/reset-password`
Reset password with token
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

### Profile Management (`/api/client`)

#### GET `/api/client/profile`
Get user profile (requires authentication)

#### PUT `/api/client/profile`
Update user profile (requires authentication)
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "Example Corp",
  "position": "CEO",
  "country": "United States",
  "current_country": "United States",
  "industry": "Technology",
  "business_stage": "Growth",
  "annual_revenue": "$1M-$5M",
  "team_size": "10-50",
  "primary_challenge": "Scaling operations",
  "goals": "Expand internationally",
  "timeline": "6-12 months",
  "budget_range": "$50K-$100K",
  "previous_experience": "Some consulting experience",
  "referral_source": "Google search",
  "additional_info": "Looking for strategic guidance",
  "preferred_contact_method": "email",
  "timezone": "America/New_York",
  "language_preference": "en",
  "marketing_consent": true
}
```

#### POST `/api/client/complete-profile`
Mark profile as completed (requires authentication)

#### POST `/api/client/upload-avatar`
Upload profile avatar (requires authentication)

### Application Management (`/api/applications`)

#### GET `/api/applications`
Get user applications with filtering and pagination
Query parameters:
- `status` - Filter by status
- `type` - Filter by type
- `priority` - Filter by priority
- `page` - Page number
- `limit` - Items per page

#### POST `/api/applications`
Create new application (requires authentication)
```json
{
  "type": "consultation",
  "title": "Business Strategy Consultation",
  "description": "Need help with expansion strategy",
  "priority": "high",
  "requirements": {
    "urgency": "high",
    "preferred_date": "2024-02-15",
    "duration": 90
  },
  "estimated_duration": 90,
  "deadline": "2024-02-20T00:00:00Z",
  "tags": ["strategy", "expansion"]
}
```

#### GET `/api/applications/:id`
Get specific application (requires authentication)

#### PUT `/api/applications/:id`
Update application (requires authentication)

#### DELETE `/api/applications/:id`
Delete application (requires authentication)

#### POST `/api/applications/:id/rate`
Rate completed application (requires authentication)
```json
{
  "satisfaction_rating": 5,
  "feedback": "Excellent service and valuable insights"
}
```

### Consultation Management (`/api/consultations`)

#### GET `/api/consultations`
Get user consultations with filtering
Query parameters:
- `status` - Filter by status
- `type` - Filter by type
- `upcoming` - Show only upcoming consultations
- `past` - Show only past consultations

#### POST `/api/consultations`
Create consultation (requires authentication)
```json
{
  "type": "initial",
  "title": "Initial Strategy Consultation",
  "description": "Discuss business expansion plans",
  "scheduled_at": "2024-02-15T10:00:00Z",
  "duration_minutes": 60,
  "timezone": "America/New_York",
  "meeting_preference": "video",
  "preparation_notes": "Please prepare financial statements",
  "agenda": [
    "Current business overview",
    "Expansion goals",
    "Resource requirements"
  ]
}
```

#### GET `/api/consultations/:id`
Get specific consultation (requires authentication)

#### PUT `/api/consultations/:id`
Update consultation (requires authentication)

#### POST `/api/consultations/:id/reschedule`
Reschedule consultation (requires authentication)
```json
{
  "scheduled_at": "2024-02-16T14:00:00Z",
  "reason": "Schedule conflict"
}
```

#### POST `/api/consultations/:id/complete`
Mark consultation as completed (requires authentication)
```json
{
  "notes": "Great discussion about expansion strategy",
  "action_items": [
    "Prepare market analysis",
    "Review financial projections"
  ],
  "follow_up_required": true,
  "follow_up_notes": "Schedule follow-up in 2 weeks",
  "satisfaction_rating": 5,
  "client_feedback": "Very helpful session"
}
```

#### POST `/api/consultations/:id/cancel`
Cancel consultation (requires authentication)
```json
{
  "reason": "Emergency came up"
}
```

### Notification Management (`/api/notifications`)

#### GET `/api/notifications`
Get user notifications with filtering
Query parameters:
- `read` - Filter by read status
- `type` - Filter by notification type
- `priority` - Filter by priority
- `category` - Filter by category

#### PUT `/api/notifications/:id/read`
Mark notification as read (requires authentication)

#### PUT `/api/notifications/mark-all-read`
Mark all notifications as read (requires authentication)

#### DELETE `/api/notifications/:id`
Delete notification (requires authentication)

#### GET `/api/notifications/unread-count`
Get unread notification count (requires authentication)

### File Upload (`/api/upload`)

#### POST `/api/upload/document`
Upload document (requires authentication)
- Multipart form data with file
- Supports PDF, DOC, DOCX, TXT files
- Max size: 10MB

#### POST `/api/upload/profile-image`
Upload profile image (requires authentication)
- Multipart form data with image file
- Supports JPG, PNG, GIF files
- Max size: 5MB

#### GET `/api/upload/file/:bucket/:path`
Download file (requires authentication and ownership)

#### DELETE `/api/upload/file/:bucket/:path`
Delete file (requires authentication and ownership)

### Public Endpoints (`/api/public`)

#### POST `/api/public/contact`
Submit contact form (no authentication required)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "position": "CEO",
  "country": "United States",
  "subject": "Business Inquiry",
  "message": "Interested in your consulting services",
  "source": "website",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "consulting"
}
```

#### POST `/api/public/consultation-request`
Request consultation (no authentication required)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "position": "CEO",
  "country": "United States",
  "current_country": "United States",
  "business_stage": "Growth",
  "industry": "Technology",
  "annual_revenue": "$1M-$5M",
  "team_size": "10-50",
  "primary_challenge": "Scaling operations",
  "goals": "Expand internationally",
  "urgency": "high",
  "budget_range": "$50K-$100K",
  "consultation_type": "initial",
  "preferred_times": [
    "2024-02-15T10:00:00Z",
    "2024-02-15T14:00:00Z",
    "2024-02-16T10:00:00Z"
  ],
  "timezone": "America/New_York",
  "duration_preference": 90,
  "meeting_preference": "video",
  "message": "Looking for strategic guidance on international expansion",
  "source": "website",
  "utm_source": "linkedin",
  "utm_medium": "social",
  "utm_campaign": "expansion"
}
```

## 🔐 Admin Endpoints

### Admin Authentication (`/api/admin`)

#### POST `/api/admin/login`
Admin login
```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

#### GET `/api/admin/me`
Get admin profile (requires admin authentication)

#### POST `/api/admin/logout`
Admin logout (requires admin authentication)

### Admin Dashboard (`/api/admin/dashboard`)

#### GET `/api/admin/dashboard/stats`
Get comprehensive dashboard statistics
- User counts and growth metrics
- Application statistics by status/type
- Consultation metrics and revenue
- Lead conversion rates
- Recent activity summary

#### GET `/api/admin/dashboard/recent-activity`
Get recent system activity

#### GET `/api/admin/dashboard/pending-approvals`
Get items pending approval

#### GET `/api/admin/dashboard/revenue-analytics`
Get revenue and billing analytics

### User Management (`/api/admin/users`)

#### GET `/api/admin/users`
Get all users with advanced filtering
Query parameters:
- `status` - Filter by profile status
- `search` - Search by name/email
- `country` - Filter by country
- `business_stage` - Filter by business stage
- `created_after` - Filter by creation date
- `page` - Page number
- `limit` - Items per page

#### GET `/api/admin/users/:id`
Get specific user details

#### PUT `/api/admin/users/:id`
Update user information

#### PUT `/api/admin/users/:id/approve`
Approve user profile
```json
{
  "notes": "Profile approved - all requirements met"
}
```

#### PUT `/api/admin/users/:id/reject`
Reject user profile
```json
{
  "reason": "Incomplete business information",
  "notes": "Please provide detailed business plan"
}
```

#### DELETE `/api/admin/users/:id`
Delete user account

#### GET `/api/admin/users/:id/activity`
Get user activity log

### Application Management (`/api/admin/applications`)

#### GET `/api/admin/applications`
Get all applications with filtering

#### GET `/api/admin/applications/:id`
Get specific application

#### PUT `/api/admin/applications/:id`
Update application

#### PUT `/api/admin/applications/:id/approve`
Approve application
```json
{
  "estimated_cost": 5000,
  "assigned_to": "consultant_user_id",
  "notes": "Approved for strategy consultation"
}
```

#### PUT `/api/admin/applications/:id/reject`
Reject application
```json
{
  "reason": "Does not meet minimum requirements",
  "notes": "Company too small for our services"
}
```

#### PUT `/api/admin/applications/:id/assign`
Assign application to consultant
```json
{
  "assigned_to": "consultant_user_id",
  "notes": "Assigned to senior consultant"
}
```

### Consultation Management (`/api/admin/consultations`)

#### GET `/api/admin/consultations`
Get all consultations with filtering

#### POST `/api/admin/consultations`
Create consultation for user

#### PUT `/api/admin/consultations/:id`
Update consultation

#### POST `/api/admin/consultations/:id/generate-meeting-link`
Generate Google Meet link

#### PUT `/api/admin/consultations/:id/complete`
Mark consultation as completed
```json
{
  "notes": "Excellent consultation session",
  "action_items": ["Follow up on market research"],
  "billable_hours": 1.5,
  "hourly_rate": 200,
  "internal_rating": 5,
  "internal_notes": "Client very engaged"
}
```

### Lead Management (`/api/admin/leads`)

#### GET `/api/admin/leads/contacts`
Get all contact submissions with lead scoring

#### GET `/api/admin/leads/consultation-requests`
Get all consultation requests with qualification status

#### PUT `/api/admin/leads/contacts/:id/qualify`
Qualify contact lead
```json
{
  "lead_score": 85,
  "qualification_notes": "High-value prospect",
  "estimated_value": 25000,
  "priority": "high"
}
```

#### PUT `/api/admin/leads/consultation-requests/:id/approve`
Approve consultation request
```json
{
  "estimated_value": 15000,
  "assigned_to": "consultant_user_id",
  "notes": "Approved for initial consultation"
}
```

### Analytics & Reporting (`/api/admin/analytics`)

#### GET `/api/admin/analytics/revenue`
Get revenue analytics and trends

#### GET `/api/admin/analytics/conversions`
Get lead conversion analytics

#### GET `/api/admin/analytics/satisfaction`
Get satisfaction rating analytics

#### GET `/api/admin/analytics/performance`
Get consultant performance metrics

### Admin User Management (`/api/admin/admin-users`)

#### GET `/api/admin/admin-users`
Get all admin users (requires super admin)

#### POST `/api/admin/admin-users`
Create new admin user (requires super admin)
```json
{
  "email": "newadmin@example.com",
  "full_name": "New Admin",
  "role": "consultant",
  "department": "Strategy",
  "specializations": ["Business Strategy", "Market Analysis"],
  "hourly_rate": 150,
  "permissions": {
    "users": ["read", "write"],
    "applications": ["read", "write"],
    "consultations": ["read", "write"]
  }
}
```

#### PUT `/api/admin/admin-users/:id`
Update admin user (requires super admin)

#### PUT `/api/admin/admin-users/:id/deactivate`
Deactivate admin user (requires super admin)

#### PUT `/api/admin/admin-users/:id/activate`
Activate admin user (requires super admin)

## 🔒 Security Features

### Authentication & Authorization
- **JWT Token Validation** for all protected endpoints
- **Role-based Access Control** (RBAC) for admin functions
- **Row Level Security (RLS)** on all database tables
- **Multi-role Support** (admin, super_admin, consultant, manager)

### Account Security
- **Password Strength Requirements**
- **Failed Login Attempt Tracking**
- **Account Lockout Protection**
- **Two-Factor Authentication Support**
- **Session Management**

### Data Protection
- **Input Validation** using Joi schemas
- **SQL Injection Prevention**
- **XSS Protection** with helmet.js
- **Rate Limiting** on all endpoints
- **File Upload Validation** with type and size limits

### Audit & Monitoring
- **Activity Logging** for all user actions
- **Login Monitoring** and suspicious activity detection
- **Data Change Tracking** with timestamps
- **Performance Monitoring** with slow query detection

## 📈 Performance Features

### Database Optimization
- **20+ Performance Indexes** including GIN indexes for arrays
- **Query Optimization** with proper joins and filtering
- **Connection Pooling** for database connections
- **Caching Strategies** for frequently accessed data

### API Performance
- **Pagination** for large data sets
- **Filtering and Search** capabilities
- **Response Compression** with gzip
- **Request Rate Limiting** to prevent abuse

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.js

# Run integration tests
npm run test:integration

# Run health check
npm run health-check

# Verify setup
npm run verify-setup
```

## 🚀 Deployment

### Prerequisites
1. Supabase project with PostgreSQL database
2. SMTP email service (Gmail, SendGrid, etc.)
3. Node.js 18+ hosting platform

### Deployment Steps
1. **Database Setup**: Run `MASTER_SCHEMA.sql` in Supabase SQL Editor
2. **Environment**: Configure all environment variables
3. **Admin User**: Create first admin user with `npm run create-first-admin`
4. **Deploy**: Deploy to your hosting platform
5. **Verify**: Test all endpoints with `npm run health-check`

### Recommended Platforms
- **Render**: Easy deployment with automatic builds
- **Railway**: Simple setup with database integration
- **Vercel**: Serverless deployment option
- **DigitalOcean**: Full control with App Platform

## 📊 Monitoring & Analytics

### Built-in Analytics
- **User Growth Metrics** - Registration and activation rates
- **Lead Conversion Tracking** - From contact to client conversion
- **Revenue Analytics** - Consultation revenue and trends
- **Satisfaction Metrics** - Client satisfaction ratings and feedback
- **Performance Metrics** - Consultant performance and utilization

### Health Monitoring
- **Database Connectivity** monitoring
- **Email Service Status** checking
- **Storage Availability** verification
- **API Response Times** tracking
- **Error Rate Monitoring**

## 🤝 Support

For issues or questions:
1. Check the API documentation above
2. Review the database schema in `MASTER_SCHEMA.sql`
3. Run health checks with `npm run health-check`
4. Check logs for error details
5. Verify environment configuration

## 📄 License

MIT License

---

**Built for professional consulting businesses that need enterprise-grade features and scalability.**