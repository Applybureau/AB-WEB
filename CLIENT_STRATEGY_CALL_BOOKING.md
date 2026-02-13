# Client Strategy Call Booking

**Production URL:** `https://jellyfish-app-t4m35.ondigitalocean.app`  
**Authentication:** Required (Client role)  
**Header:** `Authorization: Bearer <client_token>`

---

## Book Strategy Call

### Endpoint
```
POST /api/strategy-calls
```

### Description
Allows clients to book a strategy call by providing 1-3 preferred time slots. Admin will confirm one of the slots within 24 hours.

### Authentication
- **Required:** Yes
- **Role:** Client
- **Header:** `Authorization: Bearer <client_token>`

---

## Request Format

### Headers
```
Authorization: Bearer <client_token>
Cont