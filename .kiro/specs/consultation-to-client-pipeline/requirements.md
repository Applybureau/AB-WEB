# Requirements Document

## Introduction

This document defines the requirements for refactoring the Apply Bureau workflow to support a multi-stage "Consultation-to-Client" pipeline. The system implements a 4-stage lifecycle for leads, fixes data visibility issues (PDF/Contact requests), and establishes a high-contrast UI/Email design system.

## Glossary

- **Lead**: A user who has submitted a consultation form but has not yet completed registration
- **Client**: A user who has completed the full registration process after approval
- **Consultation_Form**: The initial submission form including resume PDF upload
- **Pipeline**: The 4-stage workflow from lead submission to client registration
- **Dashboard_Link**: A unique, auto-verifying URL sent only upon approval
- **Passcode**: User-defined authentication credential set during registration
- **Contact_Request**: General inquiries submitted via the landing page contact form
- **Admin_Dashboard**: The administrative interface for managing leads and clients
- **Status_Transition**: Movement between pipeline stages that triggers automated emails
- **Registration_Token**: A signed JWT used to secure the dashboard link

## Requirements

### Requirement 1: Lead Submission (Stage 1)

**User Story:** As a prospective client, I want to submit a consultation form with my resume, so that I can begin the application process.

#### Acceptance Criteria

1. WHEN a user submits the consultation form, THE System SHALL capture all form fields including firstName, lastName, email, phone, subject, and message
2. WHEN a user uploads a PDF resume, THE System SHALL store the file in cloud storage (S3/Supabase) and link it to the submission ID immediately
3. WHEN a consultation is created, THE System SHALL set the initial status to "lead"
4. IF a PDF upload fails, THEN THE System SHALL return an error message and prevent form submission
5. THE System SHALL support both full form format {firstName, lastName, email, phone, subject, message} and simplified format {firstName, lastName, email, message, subject}

### Requirement 2: Under Review Status (Stage 2)

**User Story:** As an admin, I want to mark a lead as "under review", so that the applicant knows their profile is being evaluated.

#### Acceptance Criteria

1. WHEN an admin clicks "Review" on a consultation, THE System SHALL update the status to "under_review"
2. WHEN status changes to "under_review", THE System SHALL trigger Email #1 ("Profile under review")
3. THE Email_System SHALL render Email #1 with white text on dark background, centered Base64 logo, and NO dashboard link
4. THE System SHALL record the timestamp and admin ID for the status transition

### Requirement 3: Approval and Selection (Stage 3)

**User Story:** As an admin, I want to approve a lead, so that they can proceed to registration and become a client.

#### Acceptance Criteria

1. WHEN an admin selects "Accept" on a consultation, THE System SHALL update the status to "approved"
2. WHEN status changes to "approved", THE System SHALL generate a unique Registration_Token using signed JWT
3. WHEN status changes to "approved", THE System SHALL trigger Email #2 ("You have been selected")
4. THE Email_System SHALL include the unique Dashboard_Link ONLY in Email #2
5. THE Email_System SHALL display a red warning disclaimer: "Warning: You are not a client until registration is complete"
6. THE Registration_Token SHALL expire after 72 hours
7. THE System SHALL record the timestamp and admin ID for the approval

### Requirement 4: Onboarding and Registration (Stage 4)

**User Story:** As an approved lead, I want to complete my registration, so that I can become a full client.

#### Acceptance Criteria

1. WHEN a user clicks the Dashboard_Link, THE System SHALL verify the Registration_Token signature and expiration
2. IF the Registration_Token is invalid or expired, THEN THE System SHALL display an error and prevent access
3. WHEN the registration page loads, THE System SHALL pre-fill the email field from the token payload
4. WHEN a user submits a passcode, THE System SHALL validate it meets security requirements (minimum 8 characters)
5. WHEN a user completes the profile form, THE System SHALL capture: Full Name, Age, LinkedIn URL, Profile Picture, Resume Upload, Current Job, Target Job, Country, Location, Years of Experience, Phone Number
6. WHEN registration is complete, THE System SHALL update the status to "client" and create a user account
7. THE System SHALL store Profile Pictures in cloud storage linked to the user account

### Requirement 5: Admin Dashboard - Consultations View

**User Story:** As an admin, I want to view and manage consultation submissions, so that I can process leads efficiently.

#### Acceptance Criteria

1. WHEN an admin views the Consultations page, THE Admin_Dashboard SHALL display all consultation submissions with their current status
2. WHEN viewing a consultation, THE Admin_Dashboard SHALL render the submitted PDF resume directly on the page
3. THE Admin_Dashboard SHALL use solid white background containers with solid black text
4. THE Admin_Dashboard SHALL display data in a clean, professional grid layout
5. WHEN an admin filters consultations, THE System SHALL support filtering by status (lead, under_review, approved, client)

### Requirement 6: Admin Dashboard - Contact Requests Page

**User Story:** As an admin, I want to view general contact form submissions, so that I can respond to inquiries.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a dedicated "Contact Requests" page
2. WHEN viewing Contact Requests, THE System SHALL display all submissions from the landing page contact form
3. THE System SHALL correctly parse and display both full format {firstName, lastName, email, phone, subject, message} and simplified format {firstName, lastName, email, message, subject}
4. THE Admin_Dashboard SHALL display contact requests in a sortable, paginated list
5. WHEN an admin marks a contact request as handled, THE System SHALL update its status accordingly

### Requirement 7: Meeting Management

**User Story:** As an admin, I want to schedule meetings with clients, so that I can conduct consultations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a meeting scheduling interface
2. WHEN an admin inputs meeting details, THE System SHALL capture: Meeting Date, Time, and Link
3. WHEN a meeting is scheduled, THE System SHALL trigger a "Meeting Scheduled" email to the client
4. THE Email_System SHALL inject the meeting date, time, and link into the email template
5. THE System SHALL store meeting details linked to the client record

### Requirement 8: Email System Design Standards

**User Story:** As a system administrator, I want consistent email branding, so that emails avoid spam filters and maintain brand identity.

#### Acceptance Criteria

1. THE Email_System SHALL use Base64 encoding for the logo image: <img src="data:image/png;base64,[DATA]" alt="Apply Bureau Logo" width="200">
2. THE Email_System SHALL center the logo in all email templates
3. THE Email_System SHALL use a container width between 650px and 800px
4. THE Email_System SHALL use dark/professional background colors
5. THE Email_System SHALL use white (#FFFFFF) for body text
6. THE Email_System SHALL use bright red (#FF0000) for warnings, errors, and emergency notices
7. THE Email_System SHALL use brand accent color for buttons and links

### Requirement 9: Database Optimization

**User Story:** As a system administrator, I want optimized database performance, so that the system handles high volume without latency.

#### Acceptance Criteria

1. THE System SHALL create indexes on consultation_requests table for: status, email, created_at
2. THE System SHALL create indexes on contact_inquiries table for: email, created_at, status
3. THE System SHALL support 10,000+ entries in both tables without performance degradation
4. WHEN querying large datasets, THE System SHALL use pagination with configurable page sizes

### Requirement 10: File Storage Architecture

**User Story:** As a system administrator, I want cloud-based file storage, so that the system scales without breaking under high volume.

#### Acceptance Criteria

1. THE System SHALL store all PDF resumes in cloud storage (S3 or Supabase Storage)
2. THE System SHALL store all profile pictures in cloud storage
3. THE System SHALL NOT store files on the local server filesystem
4. WHEN a file is uploaded, THE System SHALL return a cloud storage URL
5. THE System SHALL generate signed URLs for secure file access with expiration

### Requirement 11: Security - Registration Token

**User Story:** As a security administrator, I want secure registration links, so that unauthorized users cannot access the registration form.

#### Acceptance Criteria

1. THE System SHALL generate Registration_Tokens using signed JWTs with a secret key
2. THE Registration_Token SHALL contain: consultation_id, email, expiration timestamp
3. WHEN verifying a token, THE System SHALL check signature validity and expiration
4. IF a token is reused after registration completion, THEN THE System SHALL reject it
5. THE System SHALL invalidate the token upon successful registration completion
