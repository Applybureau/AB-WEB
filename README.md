# Apply Bureau Backend

🚀 **Professional Application & Interview Advisory System Backend**

A complete, production-ready backend system for Apply Bureau - helping professionals manage their job applications and career consultations with expert advisors.

## ✨ Features

- **🔐 Advanced Authentication** - JWT-based auth with role-based access control (Admin/Client)
- **📧 Professional Email System** - Beautiful, responsive email templates with Resend API
- **💼 Application Tracking** - Complete job application lifecycle management
- **📅 Consultation Scheduling** - Meeting scheduling with automated notifications
- **🔔 Real-time Notifications** - In-app and email notifications with Supabase Realtime
- **📊 Analytics Dashboard** - Comprehensive statistics and insights
- **🛡️ Enterprise Security** - Rate limiting, SQL injection protection, audit logging
- **📁 File Management** - Resume uploads with Supabase Storage
- **⚡ High Performance** - Caching, monitoring, and optimization features
- **🐳 Docker Ready** - Complete containerization support

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Email**: Resend API
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Caching**: In-memory with TTL
- **Security**: Helmet, CORS, Rate limiting
- **Monitoring**: Custom logging and performance tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Supabase account
- Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/jesusboy-ops/Apply_Bureau_backend.git
cd Apply_Bureau_backend/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Set up database
# Run the SQL scripts in your Supabase dashboard:
# 1. supabase-setup.sql
# 2. supabase-storage-setup.sql

# Create admin user
npm run create-admin

# Start the server
npm start
```

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/invite` - Admin invites new client
- `POST /api/auth/complete-registration` - Complete client registration
- `GET /api/auth/me` - Get current user info

### Dashboard & Analytics
- `GET /api/dashboard` - Get client dashboard data
- `GET /api/dashboard/stats` - Get detailed statistics

### Application Management
- `GET /api/applications` - List applications
- `POST /api/applications` - Create new application
- `PATCH /api/applications/:id` - Update application status
- `DELETE /api/applications/:id` - Delete application

### Consultation Management
- `GET /api/consultations` - List consultations
- `POST /api/consultations` - Schedule consultation
- `PATCH /api/consultations/:id` - Update consultation
- `DELETE /api/consultations/:id` - Cancel consultation

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/unread-count` - Get unread count

### File Upload
- `POST /api/upload/resume` - Upload resume
- `DELETE /api/upload/resume` - Delete resume

### Admin Endpoints
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/logs` - View system logs
- `POST /api/admin/cache/clear` - Clear cache

## 🎨 Email Templates

Professional, responsive email templates included:

- **Welcome Email** - Client invitation with registration link
- **Consultation Scheduled** - Meeting confirmation with details
- **Application Status Update** - Job application progress updates
- **Onboarding Reminder** - Complete profile setup

All templates feature:
- 📱 Mobile-responsive design
- 🎨 Professional styling with gradients
- 🖼️ Logo integration
- ✨ Modern UI components

## 🛡️ Security Features

- **JWT Authentication** with role-based access
- **Rate Limiting** (different limits per endpoint type)
- **SQL Injection Protection** with input sanitization
- **XSS Protection** with content filtering
- **CORS Configuration** for cross-origin security
- **Security Headers** with Helmet.js
- **Audit Logging** for all data changes
- **IP Blocking** for suspicious activity

## 📊 Monitoring & Performance

- **Advanced Logging** with file rotation
- **Performance Monitoring** with slow query detection
- **Memory Usage Tracking** with alerts
- **Cache Management** with TTL and cleanup
- **Health Check Endpoints** for uptime monitoring
- **Error Tracking** with detailed context

## 🐳 Deployment

### Docker Deployment

```bash
# Build and run with Docker
docker build -t apply-bureau-backend .
docker run -p 3000:3000 --env-file .env apply-bureau-backend

# Or use Docker Compose
docker-compose up -d
```

### Platform Deployment

Ready for deployment on:
- **Heroku** - `git push heroku main`
- **Railway** - `railway up`
- **Render** - Connect GitHub repo
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

### Production Checklist

```bash
# Verify production readiness
npm run deploy-check

# Run comprehensive tests
npm run production-ready

# Test all endpoints
npm run test-endpoints
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test-endpoints

# Run real-world tests (sends actual emails)
npm run test-real-world

# Run all tests
npm run full-test
```

## 📁 Project Structure

```
backend/
├── emails/
│   ├── assets/logo.png
│   └── templates/          # Professional email templates
├── routes/                 # API route handlers
├── controllers/            # Business logic controllers
├── utils/                  # Utility functions
│   ├── auth.js            # Authentication utilities
│   ├── email.js           # Email service
│   ├── cache.js           # Caching system
│   ├── security.js        # Security utilities
│   ├── logger.js          # Advanced logging
│   └── monitoring.js      # Performance monitoring
├── scripts/               # Setup and utility scripts
├── tests/                 # Test suites
├── server.js              # Main server file
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose setup
```

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run setup` - Verify setup and configuration
- `npm run create-admin` - Create admin user
- `npm run deploy-check` - Check production readiness
- `npm run test-real-world` - Test with real emails
- `npm run production-ready` - Full production verification

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@applybureau.com
- 📖 Documentation: [API Docs](API_DOCUMENTATION.md)
- 🐛 Issues: [GitHub Issues](https://github.com/jesusboy-ops/Apply_Bureau_backend/issues)

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] WebSocket real-time features
- [ ] Advanced analytics dashboard
- [ ] Mobile app API endpoints
- [ ] Third-party integrations (LinkedIn, Indeed)
- [ ] AI-powered resume optimization
- [ ] Video consultation support

---

**Built with ❤️ for career success**

*Apply Bureau - Your Partner in Professional Growth*