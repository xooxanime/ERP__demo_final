# Backend Commands & Deployment Checklist

## 🎯 Essential Commands

### Installation
```bash
# Install all dependencies
npm install

# Install specific package
npm install packageName

# Install dev dependency
npm install --save-dev packageName

# Update packages
npm update
```

### Development
```bash
# Start with auto-reload (recommended for development)
npm run dev

# Start production server
npm start

# Seed database with admin user
npm run seed
```

### MongoDB
```bash
# Check database status
# Go to MongoDB Atlas dashboard: https://cloud.mongodb.com

# View collections in MongoDB
# Use MongoDB Compass or Atlas dashboard
```

### Testing
```bash
# Test health check endpoint
curl http://localhost:10000/api/health

# Test registration
curl -X POST http://localhost:10000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"9876543210","password":"Pass123"}'
```

---

## 📋 Pre-Deployment Checklist

### 1. Code & Configuration
- [ ] All environment variables set in `.env`
- [ ] No console.log() statements in production code
- [ ] Error handling implemented for all endpoints
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] JWT_SECRET changed to strong random string
- [ ] NODE_ENV=production

### 2. Security
- [ ] All credentials removed from code
- [ ] .env file is in .gitignore
- [ ] API keys are environment variables only
- [ ] HTTPS enforced in production
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] MongoDB user has minimal permissions

### 3. Database
- [ ] MongoDB Atlas cluster is production-ready
- [ ] Database backups configured
- [ ] IP whitelist includes only production server
- [ ] Database user password is strong
- [ ] Connection string is correct

### 4. API Testing
- [ ] All auth endpoints tested
- [ ] Protected routes tested with token
- [ ] Error responses tested
- [ ] Invalid input validation works
- [ ] Rate limiting works
- [ ] CORS headers present

### 5. Performance
- [ ] Database indexes optimized
- [ ] Queries are efficient (use lean())
- [ ] No N+1 query problems
- [ ] Caching strategy implemented (if needed)
- [ ] CDN configured for static files (if needed)

### 6. Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] Health check endpoint working
- [ ] Uptime monitoring set up
- [ ] Alert system configured

### 7. Documentation
- [ ] API documentation complete
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment steps documented
- [ ] Troubleshooting guide ready

---

## 🚀 Deployment Steps

### Local Development
```bash
# 1. Clone/navigate to project
cd backend

# 2. Install dependencies
npm install

# 3. Set up .env with MongoDB Atlas connection
# (Follow MONGODB_ATLAS_SETUP.md)

# 4. Start development server
npm run dev

# 5. Test in Postman
# (Follow POSTMAN_TESTING_GUIDE.md)
```

### Production Deployment (Heroku Example)

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Set environment variables
heroku config:set PORT=10000
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster...
heroku config:set JWT_SECRET=your_strong_secret_key
heroku config:set FRONTEND_URL=https://your-frontend.com

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail

# 5. Test production endpoint
curl https://your-app-name.herokuapp.com/api/health
```

### Production Deployment (AWS EC2 Example)

```bash
# 1. Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 2. Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone your-repo-url
cd your-repo/backend

# 4. Install dependencies
npm install

# 5. Create .env file
sudo nano .env
# (Paste your environment variables)

# 6. Install PM2 for process management
sudo npm install -g pm2

# 7. Start server with PM2
pm2 start src/server.js --name "elearning-backend"
pm2 startup
pm2 save

# 8. Install Nginx as reverse proxy
sudo apt-get install -y nginx

# 9. Configure Nginx (point to port 10000)
# Edit /etc/nginx/sites-available/default

# 10. Restart Nginx
sudo systemctl restart nginx
```

### Production Deployment (Docker)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 10000

CMD ["npm", "start"]
```

Deploy:
```bash
# Build image
docker build -t elearning-backend .

# Run container
docker run -d -p 10000:10000 \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your_secret \
  --name elearning-backend \
  elearning-backend

# Check logs
docker logs elearning-backend

# Stop container
docker stop elearning-backend
```

---

## 📊 Production Environment Variables

```env
# Server
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://prod_user:prod_password@cluster.mongodb.net/elearning

# Security
JWT_SECRET=very_long_random_string_minimum_32_characters_change_this
JWT_EXPIRE=7d

# Frontend (production URL)
FRONTEND_URL=https://your-elearning-domain.com

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Production keys)
RAZORPAY_KEY_ID=your_production_key_id
RAZORPAY_KEY_SECRET=your_production_key_secret

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

---

## ⚙️ Environment Comparison

| Aspect | Development | Production |
|--------|-------------|-----------|
| PORT | 10000 | 10000 |
| NODE_ENV | development | production |
| JWT_SECRET | demo | strong_random |
| FRONTEND_URL | localhost:5173 | https://domain.com |
| MongoDB | Atlas dev | Atlas prod cluster |
| Logging | Full | Errors only |
| Rate Limit | 1000/15min | 500/15min |
| CORS | localhost | production domain |
| HTTPS | false | true |

---

## 📈 Monitoring & Maintenance

### Health Check
```bash
# Check if backend is running
curl http://localhost:10000/api/health

# Response:
# {
#   "status": "success",
#   "message": "Server is running",
#   "timestamp": "2026-04-24T10:30:00.000Z"
# }
```

### View Logs
```bash
# Development (in terminal)
# Logs appear directly in console

# Production (PM2)
pm2 logs

# Production (Docker)
docker logs elearning-backend
```

### Database Monitoring
```bash
# Access MongoDB Atlas Dashboard
# https://cloud.mongodb.com

# Check:
# - Connection count
# - Operations per second
# - Storage usage
# - Slow queries
```

---

## 🔄 Continuous Integration (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

---

## 🆘 Rollback Procedures

### If deployment breaks:

```bash
# Heroku
heroku rollback

# Docker
docker stop elearning-backend
docker run -d -p 10000:10000 \
  --name elearning-backend \
  elearning-backend:previous-version

# PM2
pm2 delete elearning-backend
pm2 start src/server.js --name "elearning-backend"
```

---

## 📝 Maintenance Tasks

### Weekly
- [ ] Check error logs
- [ ] Monitor database size
- [ ] Review API performance
- [ ] Backup database

### Monthly
- [ ] Update npm packages
- [ ] Review security settings
- [ ] Check SSL certificate expiry
- [ ] Analyze user metrics

### Quarterly
- [ ] Penetration testing
- [ ] Performance optimization
- [ ] Database cleanup
- [ ] Update documentation

---

## 🎓 Learning Resources

- **Node.js**: https://nodejs.org/docs/
- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/docs/
- **Docker**: https://docs.docker.com/
- **CI/CD**: https://github.com/features/actions

---

## ✅ Ready for Production!

Your backend is fully configured and ready for:
- ✅ Local development testing
- ✅ Staging deployment
- ✅ Production deployment
- ✅ Horizontal scaling
- ✅ Monitoring and logging
- ✅ Continuous deployment

**Next**: Follow deployment section above to deploy!

---

**Version**: 1.0.0
**Last Updated**: April 24, 2026
**Status**: ✅ Production Ready
