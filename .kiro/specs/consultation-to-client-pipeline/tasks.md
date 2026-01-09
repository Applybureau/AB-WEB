# Implementation Plan: Consultation-to-Client Pipeline

## Overview

This implementation plan transforms the Apply Bureau backend to support a 4-stage lead lifecycle pipeline. Tasks are organized to build incrementally, starting with database schema, then core services, controllers, routes, email templates, and finally testing.

## Tasks

- [x] 1. Database Schema Migration
  - [x] 1.1 Create migration script for leads table enhancements
    - Add status field with CHECK constraint (lead, under_review, approved, client, rejected)
    - Add pdf_url and pdf_path columns for resume storage
    - Add review stage fields (reviewed_at, reviewed_by)
    - Add approval stage fields (approved_at, approved_by, registration_token, token_expires_at, token_used)
    - Add registration stage fields (registered_at, user_id)
    - Add profile fields (age, linkedin_url, profile_pic_url, current_job, target_job, country, location, years_of_experience)
    - _Requirements: 1.2, 1.3, 2.4, 3.2, 3.7, 4.5_

  - [x] 1.2 Create contact_requests table
    - Define schema with first_name, last_name, email, phone, subject, message
    - Add status field (new, in_progress, handled, archived)
    - Add admin tracking fields (handled_by, handled_at, admin_notes)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.3 Create meetings table
    - Define schema with lead_id, admin_id, meeting_date, meeting_time, meeting_link
    - Add status field (scheduled, completed, cancelled)
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 1.4 Create users table for registered clients
    - Define schema with lead_id, email, passcode_hash, full_name, role
    - Add unique constraints on email and lead_id
    - _Requirements: 4.4, 4.6_

  - [x] 1.5 Create performance indexes
    - Add indexes on leads(status, email, created_at, registration_token)
    - Add indexes on contact_requests(email, status, created_at)
    - Add indexes on meetings(lead_id, meeting_date)
    - _Requirements: 9.1, 9.2_

- [x] 2. Token Service Implementation
  - [x] 2.1 Create tokenService.js utility
    - Implement generateRegistrationToken(consultationId, email) with 72h expiration
    - Implement verifyRegistrationToken(token) with signature and expiration checks
    - Implement invalidateToken(consultationId) to mark token as used
    - _Requirements: 3.2, 3.6, 11.1, 11.2, 11.3_

  - [ ] 2.2 Write property test for JWT token generation
    - **Property 6: JWT Token Generation Correctness**
    - **Validates: Requirements 3.2, 3.6, 11.1, 11.2**

  - [ ] 2.3 Write property test for token verification
    - **Property 7: Token Verification and Rejection**
    - **Validates: Requirements 4.1, 4.2, 11.3**

  - [ ] 2.4 Write property test for token single-use enforcement
    - **Property 8: Token Single-Use Enforcement**
    - **Validates: Requirements 11.4, 11.5**

- [x] 3. Email Service Enhancement
  - [x] 3.1 Add Base64 logo constant to email utility
    - Convert logo.png to Base64 string
    - Create LOGO_BASE64 constant in utils/email.js
    - _Requirements: 8.1_

  - [x] 3.2 Create Email #1 template (profile_under_review.html)
    - Dark background (#1a202c), white text (#FFFFFF)
    - Centered Base64 logo (width: 200px)
    - Container width: 800px
    - NO dashboard link
    - _Requirements: 2.3, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.3 Create Email #2 template (lead_selected.html)
    - Dark background, white text, centered Base64 logo
    - Include unique registration_url variable
    - Red (#FF0000) warning text: "Warning: You are not a client until registration is complete"
    - _Requirements: 3.4, 3.5, 8.6_

  - [x] 3.4 Create meeting_scheduled.html email template
    - Include meeting_date, meeting_time, meeting_link variables
    - Follow brand styling guidelines
    - _Requirements: 7.3, 7.4_

  - [ ] 3.5 Write property test for email styling compliance
    - **Property 10: Email Styling Compliance**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ] 3.6 Write property test for dashboard link exclusivity
    - **Property 9: Dashboard Link Exclusivity**
    - **Validates: Requirements 2.3, 3.4**

- [x] 4. Lead Controller Implementation
  - [x] 4.1 Create leadController.js with submitLead method
    - Accept form data (firstName, lastName, email, phone, subject, message)
    - Handle PDF file upload to Supabase Storage
    - Create lead record with status 'lead' and pdf_url
    - Support both full and simplified form formats
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ] 4.2 Write property test for form data capture
    - **Property 1: Form Data Capture Completeness**
    - **Validates: Requirements 1.1, 1.5**

  - [ ] 4.3 Write property test for initial status invariant
    - **Property 2: Initial Status Invariant**
    - **Validates: Requirements 1.3**

  - [x] 4.4 Implement markUnderReview method
    - Update status to 'under_review'
    - Record reviewed_at timestamp and reviewed_by admin ID
    - Trigger Email #1 (profile_under_review)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 4.5 Implement approveLead method
    - Update status to 'approved'
    - Generate registration token using tokenService
    - Set token_expires_at to 72 hours from now
    - Record approved_at timestamp and approved_by admin ID
    - Trigger Email #2 (lead_selected) with registration URL
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

  - [ ] 4.6 Write property test for status transition correctness
    - **Property 4: Status Transition Correctness**
    - **Validates: Requirements 2.1, 3.1, 4.6**

  - [ ] 4.7 Write property test for email triggering
    - **Property 5: Email Triggering on Status Change**
    - **Validates: Requirements 2.2, 3.3**

  - [ ] 4.8 Write property test for audit trail recording
    - **Property 12: Audit Trail Recording**
    - **Validates: Requirements 2.4, 3.7**

  - [x] 4.9 Implement verifyRegistrationToken method
    - Verify token using tokenService
    - Return email pre-filled from token payload
    - Return error for invalid/expired/used tokens
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.10 Implement completeRegistration method
    - Validate passcode meets security requirements (min 8 chars)
    - Hash passcode using bcrypt
    - Create user record in users table
    - Update lead status to 'client'
    - Store profile data (full_name, age, linkedin_url, etc.)
    - Invalidate registration token
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

- [ ] 5. Checkpoint - Core Pipeline Logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Contact Request Controller Implementation
  - [x] 6.1 Create contactRequestController.js with submitContactRequest method
    - Accept both full format {firstName, lastName, email, phone, subject, message}
    - Accept simplified format {firstName, lastName, email, message, subject}
    - Create record with status 'new'
    - _Requirements: 6.2, 6.3_

  - [x] 6.2 Implement getContactRequests method for admin
    - Support pagination with page and limit parameters
    - Support filtering by status
    - Support search by email or name
    - Return total count for pagination UI
    - _Requirements: 6.4, 9.4_

  - [ ] 6.3 Write property test for pagination correctness
    - **Property 11: Pagination Correctness**
    - **Validates: Requirements 9.4, 6.4**

  - [x] 6.4 Implement updateContactRequestStatus method
    - Update status (new, in_progress, handled, archived)
    - Record handled_by and handled_at
    - Store admin_notes if provided
    - _Requirements: 6.5_

- [x] 7. Meeting Controller Implementation
  - [x] 7.1 Create meetingController.js with scheduleMeeting method
    - Accept lead_id, meeting_date, meeting_time, meeting_link
    - Create meeting record
    - Trigger meeting_scheduled email with meeting details
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Routes Configuration
  - [x] 8.1 Create leads routes (routes/leads.js)
    - POST /api/leads - Submit lead (public)
    - GET /api/leads - Get all leads (admin)
    - GET /api/leads/:id - Get lead details with pdf_url (admin)
    - PATCH /api/leads/:id/review - Mark under review (admin)
    - PATCH /api/leads/:id/approve - Approve lead (admin)
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 8.2 Create registration routes (routes/registration.js)
    - GET /api/register/verify - Verify token and get email
    - POST /api/register/complete - Complete registration with passcode and profile
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.3 Create contact request routes (routes/contactRequests.js)
    - POST /api/contact-requests - Submit contact request (public)
    - GET /api/contact-requests - Get all contact requests (admin)
    - PATCH /api/contact-requests/:id - Update status (admin)
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [x] 8.4 Create meeting routes (routes/meetings.js)
    - POST /api/meetings - Schedule meeting (admin)
    - GET /api/meetings - Get all meetings (admin)
    - _Requirements: 7.1_

  - [x] 8.5 Register all routes in server.js
    - Import and mount leads, registration, contactRequests, meetings routes
    - Apply authentication middleware to admin routes
    - _Requirements: All_

- [ ] 9. File Upload Enhancement
  - [ ] 9.1 Update upload utility for lead PDF handling
    - Create uploadLeadResume function
    - Store in 'lead-resumes' bucket with unique path
    - Return both path and public URL
    - _Requirements: 1.2, 10.1, 10.4_

  - [ ] 9.2 Add profile picture upload support
    - Create uploadProfilePicture function
    - Store in 'profile-pictures' bucket
    - Generate signed URLs with expiration
    - _Requirements: 4.7, 10.2, 10.5_

  - [ ] 9.3 Write property test for cloud file storage
    - **Property 3: Cloud File Storage Round-Trip**
    - **Validates: Requirements 1.2, 10.1, 10.4**

- [ ] 10. Checkpoint - Full Feature Implementation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration Testing
  - [ ] 11.1 Write integration test for full pipeline flow
    - Submit lead with PDF → Review → Approve → Register → Verify client status
    - Verify all status transitions and email triggers
    - _Requirements: All pipeline requirements_

  - [ ] 11.2 Write integration test for contact request flow
    - Submit contact request → Admin views → Admin marks handled
    - Verify pagination and filtering
    - _Requirements: 6.1-6.5_

  - [ ] 11.3 Write integration test for meeting scheduling
    - Schedule meeting → Verify email sent with correct details
    - _Requirements: 7.1-7.5_

- [ ] 12. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
