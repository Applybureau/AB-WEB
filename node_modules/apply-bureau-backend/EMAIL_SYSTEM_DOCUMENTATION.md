# Apply Bureau Email System Documentation

## Overview
This document provides comprehensive documentation for the Apply Bureau email system, including email formats, data requirements, triggers, and token generation.

## Email System Architecture

### Core Components
- **Email Service**: `backend/utils/email.js` - Main email sending service using Resend
- **Templates**: `backend/emails/templates/` - HTML email templates
- **Security**: `backend/utils/emailSecurity.js` - Email security and token handling
- **Triggers**: Various route handlers that trigger email notifications

### Logo Configuration
- **Current Logo URL**: `https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png`
- **All templates updated**: ✅ 35 templates updated with new logo

## Email Templates and Triggers

### 1. Consultation Management Emails

#### Consultation Confirmed (`consultation_confirmed_concierge.html`)
**Trigger**: Admin confirms consultation with specific time slot
**Route**: `POST /api/admin/concierge/consultations/:id/confirm`
**Data Requirements**:
```javascript
{
  client_name: string,           // Required - Client's full name
  confirmed_date: string,        // Required - Selected date (YYYY-MM-DD)
  confirmed_time: string,        // Required - Selected time (HH:MM)
  meeting_details: string,       // Optional - Meeting description
  meeting_link: string,          // Optional - Video call link
  admin_name: string,           // Required - Admin's name
  next_steps: string,           // Optional - What happens next
  current_year: number          // Auto-generated
}
```
**Email Features**:
- Real meeting links with conditional display
- Fallback text when meeting link not provided
- Professional consultation confirmation format

#### Consultation Reschedule Request (`consultation_reschedule_request.html`)
**Trigger**: Admin requests new availability from client
**Route**: `POST /api/admin/concierge/consultations/:id/reschedule`
**Data Requirements**:
```javascript
{
  client_name: string,
  reschedule_reason: string,
  admin_name: string,
  new_times_url: string,        // Link to provide new times
  next_steps: string
}
```

#### Consultation Waitlisted (`consultation_waitlisted.html`)
**Trigger**: Admin adds consultation to waitlist
**Route**: `POST /api/admin/concierge/consultations/:id/waitlist`
**Data Requirements**:
```javascript
{
  client_name: string,
  waitlist_reason: string,
  admin_name: string,
  next_steps: string
}
```

### 2. Payment and Registration Emails

#### Payment Confirmed Welcome (`payment_confirmed_welcome_concierge.html`)
**Trigger**: Admin confirms payment and sends registration invite
**Route**: `POST /api/admin/concierge/payment-confirmation`
**Data Requirements**:
```javascript
{
  client_name: string,          // Required - Client's full name
  payment_amount: number,       // Required - Payment amount
  payment_date: string,         // Required - Payment date
  package_tier: string,         // Required - Package name
  package_type: string,         // Optional - Package type
  selected_services: string,    // Optional - Comma-separated services
  payment_method: string,       // Optional - Payment method
  payment_reference: string,    // Optional - Payment reference
  registration_url: string,     // Required - Registration link with token
  token_expiry: string,         // Required - Token expiration date
  admin_name: string,          // Required - Admin's name
  current_year: number         // Auto-generated
}
```
**Token Generation**:
```javascript
const token = jwt.sign(
  { 
    email: client_email,
    name: client_name,
    type: 'registration',
    payment_confirmed: true,
    consultation_id: consultation_id
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```
**Email Features**:
- Registration button with secure token link
- Conditional display of registration section
- 7-day token expiration notice

### 3. Admin Management Emails

#### Admin Password Reset (`admin_password_reset.html`)
**Trigger**: Super admin resets another admin's password
**Route**: `POST /api/admin-management/reset-password`
**Data Requirements**:
```javascript
{
  admin_name: string,           // Required - Target admin's name
  admin_email: string,          // Required - Target admin's email
  reset_by: string,            // Required - Who performed the reset
  new_password: string,         // Required - New password (plaintext)
  login_url: string,           // Required - Admin login URL
  current_year: number         // Auto-generated
}
```
**Email Features**:
- Real admin data (no placeholders)
- Secure password display in code block
- Security reminders and best practices
- Direct login link

#### Admin Welcome (`admin_welcome.html`)
**Trigger**: Super admin creates new admin account
**Route**: `POST /api/admin-management/admins`
**Data Requirements**:
```javascript
{
  admin_name: string,
  admin_email: string,
  login_url: string,
  super_admin_email: string,
  current_year: number
}
```

### 4. Application Management Emails

#### Application Update (`application_update.html`)
**Trigger**: Admin updates application status
**Route**: Various application management endpoints
**Data Requirements**:
```javascript
{
  client_name: string,
  company_name: string,
  position_title: string,
  application_status: string,
  message: string,
  next_steps: string,
  reply_to: string,            // Consultant email for replies
  current_year: number
}
```

### 5. Onboarding Emails

#### Onboarding Completed (`onboarding_completed.html`)
**Trigger**: Client completes 20Q onboarding
**Route**: Client onboarding completion
**Data Requirements**:
```javascript
{
  client_name: string,
  dashboard_url: string,
  next_steps: string,
  current_year: number
}
```

## Email Security Features

### Token Generation
All registration and secure links use JWT tokens with:
- 7-day expiration for registration tokens
- User-specific data embedded
- Secure random generation
- Single-use validation

### Security Headers
```javascript
const headers = {
  'X-Priority': '1',
  'X-MSMail-Priority': 'High',
  'Importance': 'high'
};
```

### Content Security
- HTML sanitization
- Safe URL generation
- Secure image embedding
- Anti-phishing measures

## Email Configuration

### Environment Variables
```bash
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=https://your-frontend-url.com
JWT_SECRET=your_jwt_secret
EMAIL_TESTING_MODE=false  # Set to 'true' for testing
```

### Testing Mode
When `EMAIL_TESTING_MODE=true`:
- All emails redirect to `israelloko65@gmail.com`
- Testing notice added to email content
- Original recipient shown in notice

### From Address
- **Production**: `Apply Bureau <admin@applybureau.com>`
- **Verified Domain**: `applybureau.com`

## Template Variables System

### Global Variables (Available in all templates)
```javascript
{
  dashboard_link: string,       // Frontend dashboard URL
  support_email: string,        // 'applybureau@gmail.com'
  company_name: string,         // 'Apply Bureau'
  current_year: number,         // Current year
  logo_url: string,            // New Cloudinary logo URL
  unsubscribe_url: string,     // Secure unsubscribe link
  preferences_url: string      // Email preferences link
}
```

### Conditional Template Logic
Templates support Handlebars-style conditionals:
```html
{{#if meeting_link}}
  <a href="{{meeting_link}}">Join Meeting</a>
{{else}}
  Meeting link will be provided separately
{{/if}}
```

## Email Delivery Status

### Success Indicators
- ✅ Logo updated across all templates
- ✅ Real data implementation (no placeholders)
- ✅ Token generation working
- ✅ Conditional content display
- ✅ Security features implemented

### Recent Fixes Applied
1. **Logo Update**: All 35 templates updated with new Cloudinary URL
2. **Admin Password Reset**: Now uses real admin data instead of placeholders
3. **Consultation Confirmation**: Includes conditional meeting links
4. **Payment Confirmation**: Includes registration tokens and links
5. **Template Consistency**: All templates use real data with fallbacks

## Monitoring and Debugging

### Email Logs
All email sending is logged with:
- Recipient email
- Template used
- Success/failure status
- Error details if failed

### Common Issues and Solutions
1. **Missing meeting links**: Templates now have conditional display
2. **Placeholder data**: All templates updated to use real data
3. **Token expiration**: 7-day expiration with clear messaging
4. **Logo display**: Updated to new Cloudinary URL across all templates

## API Endpoints Summary

### Consultation Management
- `POST /api/admin/concierge/consultations/:id/confirm` - Confirm consultation
- `POST /api/admin/concierge/consultations/:id/reschedule` - Request reschedule
- `POST /api/admin/concierge/consultations/:id/waitlist` - Add to waitlist

### Payment and Registration
- `POST /api/admin/concierge/payment-confirmation` - Confirm payment and send invite
- `POST /api/admin/concierge/payment/confirm-and-invite` - Alternative payment confirmation

### Admin Management
- `POST /api/admin-management/reset-password` - Reset admin password
- `POST /api/admin-management/admins` - Create new admin

### Application Management
- Various application endpoints trigger status update emails

## Best Practices

### Email Content
- Always provide fallback text for optional fields
- Use conditional logic for optional content
- Include clear call-to-action buttons
- Provide contact information for support

### Data Handling
- Validate all required fields before sending
- Use real data, never placeholder text
- Include expiration dates for time-sensitive content
- Log all email attempts for debugging

### Security
- Use secure token generation for all links
- Implement proper email headers
- Validate recipient addresses
- Use HTTPS for all embedded links

## Maintenance

### Regular Tasks
- Monitor email delivery rates
- Update templates as needed
- Rotate JWT secrets periodically
- Review and update logo/branding

### Template Updates
When updating templates:
1. Test with real data
2. Verify conditional logic
3. Check mobile responsiveness
4. Validate all links
5. Update documentation

---

**Last Updated**: January 27, 2026
**Version**: 2.0
**Status**: Production Ready ✅