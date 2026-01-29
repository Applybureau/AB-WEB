# WhatsApp Consultation Feature Documentation

## Overview

The Apply Bureau backend now supports WhatsApp consultations as an alternative to video calls. This feature allows clients to have consultations via WhatsApp calls, providing more flexibility and accessibility for clients who prefer or need this communication method.

## 🚀 Key Features

- **Multiple Communication Methods**: Video call, WhatsApp call, and phone call options
- **WhatsApp Number Validation**: Automatic formatting and validation of WhatsApp numbers
- **Smart Contact Information**: Generates WhatsApp web links and contact instructions
- **Email Integration**: WhatsApp-specific email templates and notifications
- **Admin Management**: Full admin control over WhatsApp consultation settings

## 📊 Database Schema Changes

### Consultations Table Updates

```sql
-- Communication method options
ALTER TABLE consultations 
ADD COLUMN communication_method TEXT DEFAULT 'video_call' 
CHECK (communication_method IN ('video_call', 'whatsapp_call', 'phone_call'));

-- Client WhatsApp number
ALTER TABLE consultations 
ADD COLUMN whatsapp_number TEXT;

-- Admin WhatsApp number for contact
ALTER TABLE consultations 
ADD COLUMN admin_whatsapp_number TEXT;
```

### Communication Methods
- `video_call` - Traditional Google Meet/Zoom consultation (default)
- `whatsapp_call` - WhatsApp voice/video call
- `phone_call` - Regular phone call

## 🔗 API Endpoints

### 1. Confirm Consultation with Communication Method

**Endpoint**: `POST /api/consultation-management/:id/confirm-with-method`

**Authentication**: Admin token required

**Purpose**: Confirm a consultation and set the communication method (including WhatsApp)

#### Request Body
```json
{
  "selected_slot_index": 0,
  "communication_method": "whatsapp_call",
  "whatsapp_number": "+1234567890",
  "admin_whatsapp_number": "+1987654321",
  "meeting_details": "WhatsApp consultation confirmed",
  "admin_notes": "Client prefers WhatsApp communication"
}
```

#### Response
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "consultation-id",
    "status": "confirmed",
    "communication_method": "whatsapp_call",
    "scheduled_at": "2024-03-15T10:00:00Z",
    "client_whatsapp": "+1234567890"
  },
  "confirmed_slot": {
    "date": "2024-03-15",
    "time": "10:00"
  },
  "confirmed_time": "2024-03-15T10:00:00Z"
}
```

### 2. Update Consultation (Including WhatsApp Details)

**Endpoint**: `PUT /api/consultation-management/:id`

**Authentication**: Admin token required

**Purpose**: Update consultation details including WhatsApp information

#### Request Body
```json
{
  "status": "confirmed",
  "communication_method": "whatsapp_call",
  "whatsapp_number": "+1234567890",
  "admin_whatsapp_number": "+1987654321",
  "admin_message": "Looking forward to our WhatsApp consultation!"
}
```

### 3. Confirm Specific Time Slot

**Endpoint**: `POST /api/consultation-management/:id/confirm-time`

**Authentication**: Admin token required

**Purpose**: Confirm a specific time slot (works with all communication methods)

## 📱 WhatsApp Integration Features

### WhatsApp Manager Utility

The `WhatsAppManager` class provides comprehensive WhatsApp functionality:

#### Key Methods

1. **`formatWhatsAppNumber(number)`**
   - Formats phone numbers to international WhatsApp format
   - Handles various input formats (US, international, etc.)
   - Returns properly formatted number with country code

2. **`generateWhatsAppContactInfo(consultation)`**
   - Creates WhatsApp web links for easy access
   - Generates consultation-specific messages
   - Formats dates and times for display

3. **`createWhatsAppInstructions(consultation)`**
   - Provides step-by-step instructions for clients
   - Includes backup options and troubleshooting
   - Returns formatted contact information

4. **`isValidWhatsAppNumber(number)`**
   - Validates WhatsApp number format
   - Ensures minimum length and country code requirements

5. **`generateReminderMessage(consultation, hours)`**
   - Creates reminder messages for WhatsApp consultations
   - Customizable timing (default 24 hours before)

### WhatsApp Contact Information Generation

When a consultation is confirmed with WhatsApp method, the system generates:

```javascript
{
  adminNumber: "+1987654321",
  clientNumber: "+1234567890", 
  whatsappWebLink: "https://wa.me/1987654321?text=Hello!%20This%20is%20Apply%20Bureau...",
  consultationMessage: "Hello! This is Apply Bureau. I'm ready for our consultation...",
  formattedDate: "Friday, March 15, 2024",
  formattedTime: "10:00 AM EST",
  instructions: [
    "Save this WhatsApp number: +1987654321",
    "Make sure you have WhatsApp installed on your phone",
    "At the scheduled time, call the saved number via WhatsApp",
    "If no answer, please send a WhatsApp message first",
    "Have a stable internet connection for the best call quality"
  ],
  backupOptions: [
    "If WhatsApp call fails, we can switch to a regular phone call",
    "Meeting link is also available as backup if needed"
  ]
}
```

## 📧 Email Template Integration

### WhatsApp-Specific Email Data

When sending confirmation emails for WhatsApp consultations, additional template variables are available:

```javascript
{
  // Standard consultation data
  prospect_name: "John Doe",
  consultation_date: "Friday, March 15, 2024",
  consultation_time: "10:00 AM EST",
  
  // WhatsApp-specific data
  is_whatsapp_call: true,
  whatsapp_number: "+1987654321",
  whatsapp_instructions: ["Save this number...", "Install WhatsApp..."],
  whatsapp_web_link: "https://wa.me/1987654321?text=...",
  
  // Communication method flags
  is_video_call: false,
  communication_method: "whatsapp_call"
}
```

### Email Templates Supporting WhatsApp

The following email templates have been updated to support WhatsApp consultations:

- `consultation_confirmed.html` - Main confirmation email
- `consultation_reminder.html` - Reminder emails
- `consultation_rescheduled.html` - Rescheduling notifications
- `admin_meeting_link_notification.html` - Admin notifications

## 🔧 Configuration

### Environment Variables

```bash
# Admin WhatsApp number (fallback if not specified per consultation)
ADMIN_WHATSAPP_NUMBER=+1234567890

# Business name for WhatsApp messages
BUSINESS_NAME="Apply Bureau"
```

### WhatsApp Number Format Requirements

- Must include country code
- Minimum 10 digits (US format) or 12+ digits (international)
- Automatically formatted to international format (+1234567890)
- Validated before saving to database

## 🎯 Usage Examples

### 1. Confirming a WhatsApp Consultation

```javascript
// Admin confirms consultation with WhatsApp
const response = await fetch('/api/consultation-management/123/confirm-with-method', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    selected_slot_index: 0,
    communication_method: 'whatsapp_call',
    whatsapp_number: '+1234567890',
    admin_whatsapp_number: '+1987654321',
    meeting_details: 'WhatsApp consultation confirmed for career guidance'
  })
});
```

### 2. Updating WhatsApp Information

```javascript
// Update existing consultation with WhatsApp details
const response = await fetch('/api/consultation-management/123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    communication_method: 'whatsapp_call',
    whatsapp_number: '+1234567890',
    admin_whatsapp_number: '+1987654321'
  })
});
```

## 🔍 Validation and Error Handling

### WhatsApp Number Validation

```javascript
// Valid formats accepted:
"+1234567890"     // International format
"1234567890"      // US format (auto-converted to +1234567890)
"(123) 456-7890"  // US format with formatting
"+44 20 7946 0958" // UK format

// Invalid formats rejected:
"123456789"       // Too short
"abc123def"       // Contains letters
""                // Empty string
```

### Error Responses

```json
// Invalid WhatsApp number
{
  "error": "Invalid WhatsApp number format"
}

// Invalid communication method
{
  "error": "Invalid communication method. Must be one of: video_call, whatsapp_call, phone_call"
}

// Missing required fields
{
  "error": "WhatsApp number is required for WhatsApp consultations"
}
```

## 📊 Logging and Monitoring

### WhatsApp Activity Logging

All WhatsApp consultation activities are logged:

```javascript
// Automatic logging for:
whatsappManager.logWhatsAppActivity(consultationId, 'consultation_confirmed', {
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  adminWhatsApp: '+1987654321',
  clientWhatsApp: '+1234567890'
});
```

### Log Categories

- `consultation_confirmed` - WhatsApp consultation confirmed
- `number_validated` - WhatsApp number validation
- `instructions_generated` - Contact instructions created
- `reminder_sent` - WhatsApp reminder sent

## 🚀 Frontend Integration

### Client-Side Implementation

```javascript
// When booking a consultation, clients can select WhatsApp
const bookingData = {
  prospect_name: "John Doe",
  prospect_email: "john@example.com",
  prospect_phone: "+1234567890",
  communication_preference: "whatsapp_call", // New field
  whatsapp_number: "+1234567890", // Optional: different from phone
  preferred_slots: [
    { date: "2024-03-15", time: "10:00" }
  ]
};
```

### Admin Dashboard Integration

```javascript
// Admin can set communication method when confirming
const confirmConsultation = async (consultationId, method, details) => {
  const payload = {
    communication_method: method,
    ...details
  };
  
  if (method === 'whatsapp_call') {
    payload.whatsapp_number = details.clientWhatsApp;
    payload.admin_whatsapp_number = details.adminWhatsApp;
  }
  
  return await confirmConsultationWithMethod(consultationId, payload);
};
```

## 🔒 Security Considerations

### Phone Number Privacy

- WhatsApp numbers are stored securely in the database
- Admin WhatsApp numbers can be different per consultation
- Numbers are validated and formatted consistently
- Access restricted to authenticated admin users

### Data Protection

- WhatsApp communication logs include minimal PII
- Numbers are formatted but not exposed in public APIs
- Admin access required for all WhatsApp management functions

## 📈 Benefits

### For Clients
- **Accessibility**: Use familiar WhatsApp interface
- **Global Reach**: Works internationally without additional costs
- **Flexibility**: Voice or video calls through WhatsApp
- **Reliability**: Backup options if WhatsApp fails

### For Admins
- **Unified Management**: All consultation types in one system
- **Clear Instructions**: Automated client guidance
- **Professional Setup**: Branded messages and templates
- **Tracking**: Full audit trail of WhatsApp consultations

## 🔄 Migration and Compatibility

### Existing Consultations
- All existing consultations default to `video_call` method
- No breaking changes to existing functionality
- Backward compatible with current email templates

### Database Migration
```sql
-- Safe migration - adds columns without affecting existing data
ALTER TABLE consultations ADD COLUMN communication_method TEXT DEFAULT 'video_call';
ALTER TABLE consultations ADD COLUMN whatsapp_number TEXT;
ALTER TABLE consultations ADD COLUMN admin_whatsapp_number TEXT;
```

## 📞 Support and Troubleshooting

### Common Issues

1. **Invalid WhatsApp Number**
   - Ensure country code is included
   - Use international format (+1234567890)
   - Remove special characters except +

2. **WhatsApp Call Quality**
   - Recommend stable internet connection
   - Provide backup phone call option
   - Include troubleshooting in client instructions

3. **Client Setup Issues**
   - Automated instructions in confirmation email
   - WhatsApp web link for easy access
   - Admin contact information for support

### Testing WhatsApp Integration

```bash
# Test WhatsApp number validation
node test-whatsapp-feature.js

# Test email template with WhatsApp data
node test-whatsapp-email-templates.js

# Test API integration
node test-whatsapp-api-integration.js
```

---

## 🎉 Conclusion

The WhatsApp consultation feature provides a comprehensive solution for conducting consultations via WhatsApp, offering clients more flexibility while maintaining professional standards and admin control. The feature is fully integrated with the existing consultation management system and email notification infrastructure.

**Production Ready**: ✅ All features tested and deployed
**Admin Access**: Full control over WhatsApp consultation settings
**Client Experience**: Seamless WhatsApp consultation booking and management