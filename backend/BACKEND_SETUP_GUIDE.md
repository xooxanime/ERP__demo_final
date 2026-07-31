# Backend Setup Guide - MongoDB Atlas & Login System

## Project Overview
Your E-Learning platform backend is now configured with:
- ✅ MongoDB Atlas cloud database
- ✅ User registration & login system
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ CORS & security middleware
- ✅ Express.js REST API
- ✅ Mongoose ODM
- ✅ Port 10000

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure MongoDB Atlas
Follow the step-by-step guide in [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

### 3. Copy Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster-url/elearning?retryWrites=true&w=majority
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 10000 in development mode
```

### 5. Test the API
- Open Postman
- Follow [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── cloudinary.js        # Image upload config
│   │   └── razorpay.js          # Payment config
│   │
│   ├── models/
│   │   ├── User.js              # User schema (name, email, password, role)
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── LiveClass.js
│   │   ├── Module.js
│   │   ├── Payment.js
│   │   ├── Progress.js
│   │   ├── StudyMaterial.js
│   │   └── Faculty.js
│   │
│   ├── controllers/
│   │   ├── authController.js    # Register, login, profile
│   │   ├── studentController.js
│   │   ├── adminController.js
│   │   ├── courseController.js
│   │   └── ... (other controllers)
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── courseRoutes.js      # /api/courses/*
│   │   ├── studentRoutes.js     # /api/student/*
│   │   └── ... (other routes)
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification (protect middleware)
│   │   └── errorHandler.js      # Error handling
│   │
│   ├── utils/
│   │   ├── sendEmail.js         # Email notifications
│   │   └── ... (helper functions)
│   │
│   └── server.js                # Express app initialization
│
├── .env                          # Environment variables (KEEP PRIVATE)
├── .env.example                  # Example env file (SHARE THIS)
├── package.json                  # Dependencies
├── MONGODB_ATLAS_SETUP.md        # MongoDB setup guide
├── POSTMAN_TESTING_GUIDE.md      # API testing guide
└── BACKEND_SETUP_GUIDE.md        # This file

```

## API Endpoints Summary

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new student |
| POST | `/login` | ❌ | Login user, returns JWT token |
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update user profile |
| POST | `/forgot-password` | ❌ | Request password reset |
| PUT | `/reset-password/:token` | ❌ | Reset password with token |

**✅ = Requires JWT token in Authorization header**

### Example API Calls

#### Register
```bash
POST http://localhost:10000/api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "Password123"
}
```

#### Login
```bash
POST http://localhost:10000/api/auth/login
{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Protected Data (with token)
```bash
GET http://localhost:10000/api/auth/me
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Environment Variables Explained

```env
# Server
PORT=10000                  # Backend runs on port 10000
NODE_ENV=development        # development or production

# Database (MongoDB Atlas)
# Format: mongodb+srv://username:password@cluster/database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/elearning

# Authentication
JWT_SECRET=your_secret_key  # Change in production! Minimum 32 characters
JWT_EXPIRE=7d              # Token expiration time

# Cloudinary (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Razorpay (optional - for payments)
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx

# Email (optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password

# Frontend
FRONTEND_URL=http://localhost:5173

# Agora (optional - for live classes)
AGORA_APP_ID=xxx
AGORA_APP_CERTIFICATE=xxx
```

## Security Features Implemented

✅ **Password Hashing**: Bcrypt (10 salt rounds)
✅ **JWT Authentication**: Secure token-based auth
✅ **CORS**: Restricted to frontend URL
✅ **Helmet**: Security headers
✅ **Rate Limiting**: 1000 requests per 15 minutes
✅ **MongoDB Sanitization**: Prevent injection attacks
✅ **Email Validation**: RFC compliant
✅ **Phone Validation**: 10-digit Indian format
✅ **Admin Authorization**: Role-based access control

## Common Development Tasks

### Add New API Endpoint

1. **Create a route** in `src/routes/newRoutes.js`:
```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/items', protect, getItems);

export default router;
```

2. **Create a controller** in `src/controllers/newController.js`:
```javascript
export const getItems = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { items: [] }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

3. **Import and use in** `src/server.js`:
```javascript
import newRoutes from './routes/newRoutes.js';
app.use('/api/new', newRoutes);
```

### Connect to Frontend

In your React frontend:

```javascript
// src/services/api.js
const API_URL = 'http://localhost:10000/api';

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  if (data.data?.token) {
    localStorage.setItem('token', data.data.token);
  }
  return data;
};

export const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Database Monitoring

### View Data in MongoDB Atlas
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click your cluster
3. Go to **Collections** tab
4. Browse your documents in real-time

### Database Structure
```
elearning/
├── users              # Stores registered users
│   ├── _id
│   ├── name
│   ├── email
│   ├── password (hashed)
│   ├── phone
│   ├── role
│   ├── enrolledCourses[]
│   ├── createdAt
│   └── updatedAt
│
├── courses            # Course information
├── enrollments        # User course enrollments
├── payments           # Payment records
├── liveClasses        # Live class sessions
├── modules            # Course modules
├── studyMaterials     # Study resources
├── progress           # User progress
└── faculty            # Instructor information
```

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
1. Check MongoDB Atlas is running (green status)
2. Verify IP is whitelisted (Security → Network Access)
3. Check connection string in .env is correct
4. Verify database user credentials

### Issue: "Token is invalid or expired"
**Solution:**
1. Generate new token with login
2. Update frontend's stored token
3. Check JWT_SECRET hasn't changed
4. Verify token is sent in Authorization header

### Issue: "CORS Error"
**Solution:**
1. Check FRONTEND_URL in .env matches your frontend
2. Ensure credentials: true in CORS options
3. Verify frontend URL has correct port

### Issue: "User already exists"
**Solution:**
1. Try logging in instead of registering
2. Use unique email for new registration
3. Check database for duplicate entries

## Deployment Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production in .env
- [ ] Update FRONTEND_URL to production frontend
- [ ] Whitelist only your production server IP in MongoDB
- [ ] Change database user password
- [ ] Enable email verification for signups
- [ ] Set up error logging and monitoring
- [ ] Enable HTTPS for all endpoints
- [ ] Review all API endpoints for security
- [ ] Set up CI/CD pipeline
- [ ] Test all endpoints thoroughly

## Support & Documentation

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [JWT Auth Guide](https://jwt.io/)
- [Bcryptjs Guide](https://github.com/dcodeIO/bcrypt.js)

## Next Steps

1. ✅ Complete [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. ✅ Test endpoints with [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)
3. ✅ Connect to frontend
4. ✅ Deploy to production

---

**Last Updated**: April 24, 2026
**Backend Port**: 10000
**Database**: MongoDB Atlas
