# E-Learning Backend - Complete Setup Instructions

## 🎯 What You Have

Your E-Learning backend is **fully configured** with:

✅ **Express.js** - Web framework  
✅ **MongoDB Atlas** - Cloud database (no localhost)  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Bcrypt** - Password hashing  
✅ **User Registration & Login** - Complete auth system  
✅ **CORS** - Configured for frontend  
✅ **Security** - Helmet, sanitization, rate limiting  
✅ **Port 10000** - Backend runs on this port  
✅ **Production Ready** - Deployment-ready code  

---

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up MongoDB Atlas
**Follow**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

This guide will walk you through:
- Creating a free MongoDB Atlas account
- Creating a database cluster
- Getting your connection string
- Adding it to your `.env` file

### 3. Configure .env
Copy from `.env.example` and update:
```bash
cp .env.example .env
```

Edit `.env` and replace:
```env
MONGODB_URI=mongodb+srv://username:password@cluster-url/elearning?retryWrites=true&w=majority
```

### 4. Start Backend
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 10000 in development mode
```

### 5. Test with Postman
**Follow**: [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)

This will teach you how to:
- Test user registration
- Test user login
- Get authorization token
- Test protected routes

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) | 📖 Step-by-step MongoDB Atlas setup (REQUIRED FIRST) |
| [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) | 📖 How to test API endpoints in Postman |
| [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md) | 📖 Complete backend setup guide |
| [CODE_REFERENCE.md](./CODE_REFERENCE.md) | 📖 Code reference and API documentation |
| `.env.example` | 📋 Environment variables template |

---

## 🔑 API Endpoints

All endpoints are at: `http://localhost:10000/api`

### Authentication Endpoints

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| POST | `/auth/register` | ❌ | Create new account |
| POST | `/auth/login` | ❌ | Login to account |
| GET | `/auth/me` | ✅ | Get your profile |
| PUT | `/auth/profile` | ✅ | Update your profile |
| POST | `/auth/forgot-password` | ❌ | Request password reset |
| PUT | `/auth/reset-password/:token` | ❌ | Reset password |

**✅ = Requires JWT token**

### Example API Calls

**Register:**
```bash
curl -X POST http://localhost:10000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "Password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:10000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   ├── cloudinary.js            # Image upload
│   │   └── razorpay.js              # Payments
│   │
│   ├── models/
│   │   ├── User.js                  # User schema (✅ active)
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   └── ...other models
│   │
│   ├── controllers/
│   │   ├── authController.js        # Register, login
│   │   ├── courseController.js
│   │   └── ...other controllers
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── courseRoutes.js
│   │   └── ...other routes
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js
│   │
│   └── server.js                    # Main Express app
│
├── .env                             # Your config (KEEP PRIVATE!)
├── .env.example                     # Template (SHARE THIS)
├── package.json                     # Dependencies
└── 📖 Documentation files (below)
```

---

## 🚀 Getting Started Steps

### Step 1: MongoDB Atlas Setup (10 minutes)
1. Open [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. Follow all steps carefully
3. Get your connection string
4. Add to `.env` file

### Step 2: Start Backend (1 minute)
```bash
cd backend
npm run dev
```

### Step 3: Test API (5 minutes)
1. Open [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)
2. Open Postman
3. Test all endpoints
4. Verify database connection

### Step 4: Connect Frontend (varies)
- Update your React frontend to use `http://localhost:10000/api`
- Store JWT token in localStorage
- Send token in Authorization header for protected routes

---

## 🔐 Security Features

✅ **Bcrypt Password Hashing** - 10 salt rounds  
✅ **JWT Authentication** - Secure tokens  
✅ **CORS Configured** - Frontend URL whitelisted  
✅ **Rate Limiting** - 1000 requests per 15 minutes  
✅ **Helmet** - Security headers added  
✅ **MongoDB Sanitization** - Injection prevention  
✅ **Email Validation** - RFC compliant  
✅ **Phone Validation** - 10-digit Indian format  
✅ **Role-Based Access** - admin/student roles  

---

## 📋 Configuration Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created and initialized
- [ ] Database user created with password
- [ ] IP address whitelisted
- [ ] Connection string copied
- [ ] `.env` file updated with connection string
- [ ] `npm install` completed
- [ ] `npm run dev` shows "MongoDB Connected"
- [ ] Postman tests pass
- [ ] Frontend can make API calls

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Check MongoDB cluster status (should be green)
- Verify IP is whitelisted in Network Access
- Check connection string in .env is correct
- Verify username/password are correct

### Issue: "Server won't start"
**Solution:**
- Run `npm install` again
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 10000 is already in use
- Verify .env file exists

### Issue: "CORS Error in browser"
**Solution:**
- Check `FRONTEND_URL` in .env matches your frontend
- Make sure frontend is running on correct port
- Verify credentials: true in CORS config

### Issue: "User already exists" error
**Solution:**
- Try logging in instead of registering
- Use a different email address
- Or check if user exists in MongoDB Atlas dashboard

---

## 📖 Detailed Documentation

For complete documentation, see:

1. **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** - Database setup with screenshots
2. **[POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)** - API testing guide with examples
3. **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** - Complete setup instructions
4. **[CODE_REFERENCE.md](./CODE_REFERENCE.md)** - Code explanations and API reference

---

## 🎓 Understanding the Flow

### Registration Flow
```
User fills registration form
    ↓
Frontend sends POST /api/auth/register
    ↓
Backend validates input
    ↓
Backend hashes password with bcrypt
    ↓
Backend saves user to MongoDB
    ↓
Backend generates JWT token
    ↓
Backend returns user data + token
    ↓
Frontend stores token in localStorage
    ↓
User can now make authenticated requests
```

### Login Flow
```
User enters email/password
    ↓
Frontend sends POST /api/auth/login
    ↓
Backend finds user by email
    ↓
Backend compares passwords with bcrypt
    ↓
Backend generates JWT token
    ↓
Backend returns user data + token
    ↓
Frontend stores token
    ↓
User is logged in
```

### Protected Route Flow
```
Frontend makes GET /api/auth/me
    ↓
Frontend adds Authorization: Bearer TOKEN header
    ↓
Backend middleware extracts token
    ↓
Backend verifies JWT signature
    ↓
Backend decodes token to get user ID
    ↓
Backend fetches user from database
    ↓
Backend returns user data
    ↓
Frontend receives profile
```

---

## 💡 Next Steps After Setup

1. ✅ Complete MongoDB Atlas setup (if not done)
2. ✅ Start backend server
3. ✅ Test all endpoints with Postman
4. ✅ Connect your React frontend
5. ✅ Test registration/login in browser
6. ✅ Set up additional API routes
7. ✅ Deploy to production

---

## 📞 Support Resources

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **JWT**: https://jwt.io/
- **Bcryptjs**: https://github.com/dcodeIO/bcrypt.js

---

## ✅ Your Backend is Production Ready!

- Database: MongoDB Atlas ✅
- Authentication: JWT + Bcrypt ✅
- API: RESTful Express.js ✅
- Security: Helmet, CORS, Rate Limiting ✅
- Port: 10000 ✅
- Deployment: Ready ✅

**Next**: Follow [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) to get started!

---

**Last Updated**: April 24, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
