# Consultation Request API Update - Current Country Field

## 🆕 New Feature: Current Country Field

The consultation request form now includes a `current_country` field to help admins understand the geographical location of clients.

## 📋 Updated API Endpoint

### POST `/api/consultation-requests`

**Description**: Submit a new consultation request from the website (PUBLIC endpoint)

**URL**: `https://apply-bureau-backend.vercel.app/api/consultation-requests`

### Request Body

```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "role_targets": "Software Engineer, Full Stack Developer",
  "location_preferences": "Remote, New York, San Francisco",
  "minimum_salary": "120000",
  "target_market": "Tech Startups",
  "employment_status": "Currently Employed",
  "package_interest": "Premium Package",
  "area_of_concern": "Interview preparation and salary negotiation",
  "consultation_window": "Weekday evenings",
  "current_country": "United States"
}
```

### Required Fields
- `full_name` (string) - Client's full name
- `email` (string) - Valid email address
- `role_targets` (string) - Target job roles

### Optional Fields
- `phone` (string) - Phone number
- `linkedin_url` (string) - LinkedIn profile URL
- `location_preferences` (string) - Preferred work locations
- `minimum_salary` (string) - Minimum salary expectation
- `target_market` (string) - Target industry/market
- `employment_status` (string) - Current employment status
- `package_interest` (string) - Service package interest
- `area_of_concern` (string) - Main areas needing help
- `consultation_window` (string) - Preferred consultation times
- **`current_country` (string) - Current country of residence** ⭐ **NEW**

### Response

**Success (201 Created):**
```json
{
  "id": "uuid-here",
  "status": "pending",
  "message": "Consultation request received successfully",
  "pdf_uploaded": false
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Missing required fields: full_name, email, role_targets"
}
```

## 📧 Email Updates

### Client Confirmation Email
The confirmation email sent to clients now includes:
- Target roles
- Package interest
- **Current country** ⭐ **NEW**
- Resume upload status

### Admin Notification Email
The admin notification email now includes:
- Client name and email
- Target roles
- Package interest
- **Current country** ⭐ **NEW**
- Employment status
- Area of concern
- Resume upload status

## 🗄️ Database Changes

### Required Migration
Run this SQL in Supabase SQL Editor:

```sql
-- Add current_country field to consultation_requests table
ALTER TABLE consultation_requests 
ADD COLUMN current_country TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN consultation_requests.current_country IS 'The country where the client is currently located';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_current_country 
ON consultation_requests(current_country);
```

## 🧪 Testing

### Test Script
Run the test script to verify the new field works:

```bash
node scripts/test-consultation-with-country.js
```

### Manual Testing

**Frontend Form Update Required:**
Add a country field to your consultation form:

```html
<select name="current_country" required>
  <option value="">Select your current country</option>
  <option value="United States">United States</option>
  <option value="Canada">Canada</option>
  <option value="United Kingdom">United Kingdom</option>
  <option value="Australia">Australia</option>
  <option value="Germany">Germany</option>
  <option value="France">France</option>
  <option value="Netherlands">Netherlands</option>
  <option value="Sweden">Sweden</option>
  <option value="Norway">Norway</option>
  <option value="Denmark">Denmark</option>
  <option value="Switzerland">Switzerland</option>
  <option value="Singapore">Singapore</option>
  <option value="Japan">Japan</option>
  <option value="South Korea">South Korea</option>
  <option value="India">India</option>
  <option value="Brazil">Brazil</option>
  <option value="Mexico">Mexico</option>
  <option value="Other">Other</option>
</select>
```

### cURL Test Example

```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/consultation-requests \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "role_targets": "Software Engineer",
    "current_country": "Canada"
  }'
```

## 📊 Admin Dashboard

The current country information will be visible to admins when they:
1. View consultation requests in the admin dashboard
2. Receive email notifications about new requests
3. Export consultation data for analysis

## 🚀 Deployment Status

- ✅ Backend code updated
- ✅ Email templates updated
- ✅ Test script created
- ⏳ Database migration needed (run ADD_CURRENT_COUNTRY_FIELD.sql)
- ⏳ Frontend form update needed

## 📝 Frontend Integration

Update your consultation form to include the current_country field and ensure it's sent in the POST request to the API endpoint.

The field is optional but recommended for better client insights and geographical analysis.