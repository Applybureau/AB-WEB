# Apply Bureau Backend - Deployment Guide

## Quick Start

### 1. System Check
```bash
npm run final-check
```

This will verify:
- ✓ Environment configuration
- ✓ Dependencies installed
- ✓ Core files present
- ✓ Routes and controllers
- ✓ Tests and templates
- ✓ Git configuration

### 2. Run Tests
```bash
npm test
```

All tests should pass before deployment.

### 3. Health Check
```bash
npm run health-check
```

Verifies:
- Database connectivity
- Email service status
- API endpoints
- System resources

### 4. Deploy

#### Option A: Using Render
1. Create account at https://render.com
2. Connect your GitHub repository
3. Create new Web Service
4. Set environment variables
5. Deploy

#### Option B: Using Railway
1. Create account at https://railway.app
2. Create new project from GitHub
3. Add environment variables
4. Deploy automatically

#### Option C: Using Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Set environment variables in dashboard

## Environment Variables

Required for production:

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Email
RESEND_API_KEY=your_resend_key

# Security
JWT_SECRET=your_strong_random_secret

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

## Database Setup

1. Go to your Supabase project
2. Open SQL Editor
3. Copy content from `MASTER_DATABASE_SCHEMA.sql`
4. Execute the script
5. Verify tables created successfully

## Post-Deployment

### Create Admin User
```bash
npm run create-first-admin
```

### Verify Deployment
```bash
curl https://your-api-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "email": "operational"
}
```

## Monitoring

### Check Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Security logs: `logs/security.log`

### Health Endpoint
Monitor: `GET /health`

Returns system status and uptime.

## Troubleshooting

### Database Connection Issues
- Verify SUPABASE_URL and keys
- Check Supabase project status
- Verify RLS policies

### Email Not Sending
- Verify RESEND_API_KEY
- Check Resend dashboard
- Review email logs

### Authentication Errors
- Verify JWT_SECRET matches
- Check token expiration
- Clear old tokens

## Security Checklist

- [ ] Strong JWT_SECRET set
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] File upload limits set
- [ ] Admin accounts secured

## Performance Optimization

- Enable caching for static content
- Use CDN for file storage
- Monitor database query performance
- Implement connection pooling
- Enable compression

## Backup Strategy

1. **Database**: Supabase automatic backups
2. **Files**: Supabase Storage redundancy
3. **Code**: GitHub repository
4. **Environment**: Secure .env backup

## Support

For issues:
1. Check logs
2. Run health check
3. Review API documentation
4. Contact development team

---

**Last Updated:** January 14, 2024
