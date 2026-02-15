# Payment Confirmation Email Debug Guide

## Issue Summary

The payment confirmation endpoint (`POST /api/admin/concierge/payment-confirmation`) returns success but the registration email is not being delivered to the client.

## Root Cause Analysis

The email sending is wrapped in a try-catch block that **does not fail the request** even if the email fails to send. This is by design to ensure the payment confirmation succeeds even if email delivery fails, but it makes debugging difficult.

### Code Location

File: `backend/routes/adminConcierge.js` (lines 527-54