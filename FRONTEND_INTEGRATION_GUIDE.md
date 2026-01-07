# 🔗 Frontend Integration Guide - Apply Bureau

## 🎯 **Quick Start**

### **Base URL**: `https://apply-bureau-backend.onrender.com/api`

### **Authentication Header**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🔐 **Authentication & Routing**

### **Login Flow**
```javascript
// 1. Login Request
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token, user } = await loginResponse.json();

// 2. Store token and route based on dashboard_type
localStorage.setItem('token', token);

if (user.dashboard_type === 'admin') {
  navigate('/admin/dashboard');
} else {
  navigate('/client/dashboard');
}
```

### **Get Current User**
```javascript
const userResponse = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { user } = await userResponse.json();
// user.dashboard_type determines routing
```

---

## 📊 **Dashboard APIs**

### **Admin Dashboard**
```javascript
// Get admin dashboard data
const adminDashboard = await fetch('/api/admin-dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response structure:
{
  "admin": {
    "id": "admin_id",
    "full_name": "Admin Name",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      // ... other permissions
    }
  },
  "dashboard_type": "admin",
  "stats": {
    "clients": {
      "total_clients": 25,
      "active_clients": 18,
      "new_clients_this_month": 5
    },
    "consultations": {
      "total_consultations": 45,
      "scheduled_consultations": 12,
      "completed_consultations": 33
    },
    "applications": {
      "total_applications": 120,
      "applications_by_status": {
        "applied": 30,
        "interview": 15,
        "offer": 8,
        "rejected": 67
      }
    }
  },
  "recent_activity": {
    "new_clients": [...],
    "upcoming_consultations": [...],
    "recent_applications": [...]
  },
  "quick_actions": [
    { "action": "invite_client", "label": "Invite New Client" },
    { "action": "schedule_consultation", "label": "Schedule Consultation" },
    // ... more actions
  ]
}
```

### **Client Dashboard**
```javascript
// Get client dashboard data
const clientDashboard = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response structure:
{
  "client": {
    "id": "client_id",
    "full_name": "Client Name",
    "email": "client@example.com",
    "onboarding_complete": true
  },
  "stats": {
    "total_applications": 15,
    "pending_applications": 5,
    "interviews_scheduled": 3,
    "offers_received": 1,
    "upcoming_consultations": 2
  },
  "recent_applications": [...],
  "upcoming_consultations": [...],
  "unread_notifications": [...]
}
```

---

## 👥 **Super Admin Management**

### **Check Super Admin Status**
```javascript
// Only admin@applybureau.com has super admin privileges
const isSuper = user.email === 'admin@applybureau.com' && user.role === 'admin';
```

### **List All Admins** (Super Admin Only)
```javascript
const adminsResponse = await fetch('/api/admin-management/admins', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { admins } = await adminsResponse.json();
// Each admin has: id, full_name, email, is_super_admin, can_be_modified, is_active
```

### **Create New Admin** (Super Admin Only)
```javascript
const formData = new FormData();
formData.append('full_name', 'New Admin Name');
formData.append('email', 'newadmin@example.com');
formData.append('password', 'securepassword123');
formData.append('phone', '+1234567890');
if (profilePicture) {
  formData.append('profile_picture', profilePicture);
}

const createResponse = await fetch('/api/admin-management/admins', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// Success: Admin created and welcome email sent
```

### **Admin Actions** (Super Admin Only)
```javascript
// Suspend Admin
await fetch(`/api/admin-management/admins/${adminId}/suspend`, {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Violation of company policy'
  })
});

// Reactivate Admin
await fetch(`/api/admin-management/admins/${adminId}/reactivate`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Reset Password
await fetch(`/api/admin-management/admins/${adminId}/reset-password`, {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_password: 'newpassword123'
  })
});

// Delete Admin
await fetch(`/api/admin-management/admins/${adminId}`, {
  method: 'DELETE',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Account no longer needed'
  })
});
```

---

## 📁 **File Management**

### **Upload Files**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('upload_purpose', 'resume'); // or 'profile_picture', 'document'

const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { file } = await uploadResponse.json();
// file.file_url contains the uploaded file URL
```

### **List User Files**
```javascript
const filesResponse = await fetch('/api/files?upload_purpose=resume', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { files } = await filesResponse.json();
```

---

## 📅 **Consultations with Google Meet**

### **Create Consultation**
```javascript
const consultationData = {
  client_id: 'client_uuid',
  scheduled_at: '2026-01-15T14:00:00Z',
  meeting_title: 'Career Strategy Session',
  meeting_description: 'Comprehensive career planning discussion',
  meeting_url: 'https://meet.google.com/abc-defg-hij', // Admin creates this
  preparation_notes: 'Please bring updated resume and target company list'
};

const consultationResponse = await fetch('/api/consultations', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(consultationData)
});

// Success: Consultation created and emails sent to client and admin
```

### **List Consultations**
```javascript
const consultationsResponse = await fetch('/api/consultations', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { consultations } = await consultationsResponse.json();
```

---

## 📧 **Email Notifications**

### **Automatic Email Triggers**
All these actions automatically send professional emails:

1. **Admin Creation** → Welcome email with login credentials
2. **Admin Suspension** → Suspension notification
3. **Admin Reactivation** → Reactivation notification
4. **Admin Deletion** → Deletion notification
5. **Password Reset** → New password notification
6. **Consultation Scheduled** → Meeting confirmation with Google Meet link

### **Email Features**
- Professional Apply Bureau branding
- Green (#10b981) and light blue (#06b6d4) color scheme
- Responsive design for all devices
- Clear call-to-action buttons
- Contact information for support

---

## 🛡️ **Security & Permissions**

### **Role-Based Access**
```javascript
// Check user permissions
const canManageAdmins = user.email === 'admin@applybureau.com' && user.role === 'admin';
const isAdmin = user.role === 'admin';
const isClient = user.role === 'client';

// Route protection
if (canManageAdmins) {
  // Show admin management features
}

if (isAdmin) {
  // Show admin dashboard and features
} else {
  // Show client dashboard only
}
```

### **Protected Routes**
- `/admin/*` - Requires `user.role === 'admin'`
- `/admin/manage-admins` - Requires `user.email === 'admin@applybureau.com'`
- `/client/*` - Requires `user.role === 'client'`

---

## 🎨 **UI Component Examples**

### **Admin Management Table**
```jsx
function AdminManagementTable({ admins, onSuspend, onReactivate, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Super Admin</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {admins.map(admin => (
          <tr key={admin.id}>
            <td>{admin.full_name}</td>
            <td>{admin.email}</td>
            <td>
              <span className={admin.is_active ? 'status-active' : 'status-inactive'}>
                {admin.is_active ? 'Active' : 'Suspended'}
              </span>
            </td>
            <td>{admin.is_super_admin ? '👑 Super Admin' : 'Admin'}</td>
            <td>
              {admin.can_be_modified && (
                <>
                  {admin.is_active ? (
                    <button onClick={() => onSuspend(admin.id)}>Suspend</button>
                  ) : (
                    <button onClick={() => onReactivate(admin.id)}>Reactivate</button>
                  )}
                  <button onClick={() => onDelete(admin.id)}>Delete</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### **Create Admin Form**
```jsx
function CreateAdminForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    profile_picture: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        minLength={6}
        required
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFormData({...formData, profile_picture: e.target.files[0]})}
      />
      <button type="submit">Create Admin</button>
    </form>
  );
}
```

---

## 🚀 **Error Handling**

### **Common Error Responses**
```javascript
// 401 Unauthorized
{
  "error": "Access token required"
}

// 403 Forbidden
{
  "error": "Super admin access required"
}

// 400 Bad Request
{
  "error": "Validation error",
  "details": ["Email is required", "Password must be at least 6 characters"]
}

// 429 Rate Limited
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

### **Error Handling Example**
```javascript
try {
  const response = await fetch('/api/admin-management/admins', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(adminData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const result = await response.json();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Admin creation failed:', error.message);
}
```

---

## 🎯 **Implementation Checklist**

### **Authentication & Routing**
- [ ] Implement login with dashboard_type routing
- [ ] Add role-based navigation guards
- [ ] Store JWT token securely
- [ ] Handle token expiration

### **Admin Dashboard**
- [ ] Build admin dashboard with statistics
- [ ] Add client management interface
- [ ] Implement consultation scheduling
- [ ] Create analytics and reports view

### **Super Admin Features**
- [ ] Build admin management table
- [ ] Create admin creation form with file upload
- [ ] Add suspend/reactivate/delete actions
- [ ] Implement password reset functionality
- [ ] Add system settings panel

### **File Management**
- [ ] Build file upload components
- [ ] Add resume preview functionality
- [ ] Implement profile picture uploads
- [ ] Create file management interface

### **Consultations**
- [ ] Build consultation scheduling form
- [ ] Add Google Meet link integration
- [ ] Implement consultation management
- [ ] Create meeting preparation interface

---

## 📞 **Support**

### **Super Admin Contact**: `admin@applybureau.com`
### **API Documentation**: Available in repository
### **Backend Status**: https://apply-bureau-backend.onrender.com/api/health

**The backend is fully operational and ready for frontend integration!** 🚀