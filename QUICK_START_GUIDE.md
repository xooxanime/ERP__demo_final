# 🚀 Quick Start Guide - SHRI Educational World

## Your Platform is Ready! ✅

Both servers are running and all features are working.

---

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 🔑 Login Credentials

### Admin Account
- **Email**: admin@ca.com
- **Password**: admin123
- **Access**: Full admin panel with all management features

### Test Student Account
- Create a new account at: http://localhost:5173/register
- Or use any existing student account

---

## 🎯 Quick Navigation Guide

### Public Pages (No Login Required)
```
Home Page:              http://localhost:5173/
All Courses:            http://localhost:5173/courses
Faculty Profiles:       http://localhost:5173/faculty
Study Materials:        http://localhost:5173/study-materials
Login:                  http://localhost:5173/login
Register:               http://localhost:5173/register
```

### Student Pages (Login Required)
```
Dashboard:              http://localhost:5173/student/dashboard
My Courses:             http://localhost:5173/student/my-courses
Live Classes:           http://localhost:5173/student/live-classes
Progress Tracking:      http://localhost:5173/student/progress
Profile:                http://localhost:5173/student/profile
```

### Admin Pages (Admin Login Required)
```
Dashboard:              http://localhost:5173/admin/dashboard
Manage Courses:         http://localhost:5173/admin/courses
Manage Faculty:         http://localhost:5173/admin/faculty
Manage Materials:       http://localhost:5173/admin/study-materials
Enrollments:            http://localhost:5173/admin/enrollments
Students:               http://localhost:5173/admin/students
Live Classes:           http://localhost:5173/admin/live-classes
Hero Section:           http://localhost:5173/admin/hero-section
```

---

## 📋 Testing Checklist

### ✅ Test Public Features
- [ ] Visit homepage and see all 6 features
- [ ] Browse courses
- [ ] View faculty profiles
- [ ] Browse study materials (can't download without login)
- [ ] Test dark mode toggle

### ✅ Test Student Features
- [ ] Register new student account
- [ ] Login as student
- [ ] Enroll in a course (requires payment setup)
- [ ] View my courses
- [ ] Check live classes
- [ ] View progress tracking
- [ ] Download study materials
- [ ] Update profile

### ✅ Test Admin Features
- [ ] Login as admin (admin@ca.com / admin123)
- [ ] View dashboard statistics
- [ ] Add a new faculty member
- [ ] Upload a study material
- [ ] Create a new course
- [ ] Schedule a live class
- [ ] View enrollments and students
- [ ] Update hero section with demo video

---

## 🎨 Feature Highlights

### 1. Faculty Management
**Admin**: Add faculty with name, email, qualification, experience, subjects, achievements, and photo  
**Public**: View all faculty profiles with beautiful cards

### 2. Study Materials
**Admin**: Upload materials with category, subject, file URL, and premium/free status  
**Students**: Filter by category/subject and download materials

### 3. Progress Tracking
**Students**: See detailed analytics with:
- Total courses enrolled
- Average completion percentage
- Total time spent learning
- Completed courses count
- Course-wise progress bars

### 4. Live Classes
**Admin**: Schedule classes with title, description, date, time, and meeting link  
**Students**: View upcoming classes and join with one click

### 5. Courses & Lectures
**Admin**: Create courses with modules and video lectures  
**Students**: Watch videos, mark as complete, track progress

### 6. Flexible Learning
- Lifetime access to enrolled courses
- Learn at your own pace
- Responsive design (mobile, tablet, desktop)
- Dark mode support

---

## 🛠️ Common Tasks

### Add a Faculty Member
1. Login as admin
2. Go to Admin → Faculty
3. Click "Add Faculty"
4. Fill in all details
5. Add subjects (comma-separated): `Accounting, Taxation, Auditing`
6. Add achievements (one per line)
7. Add image URL (or leave blank for avatar)
8. Click "Add Faculty"

### Upload Study Material
1. Login as admin
2. Go to Admin → Study Materials
3. Click "Add Material"
4. Enter title and description
5. Select category and subject
6. Upload file to cloud storage (Cloudinary/Google Drive)
7. Paste file URL
8. Select file type and enter size
9. Check "Premium" if needed
10. Click "Add Material"

### Schedule Live Class
1. Login as admin
2. Go to Admin → Live Classes
3. Click "Schedule Class"
4. Enter title, description, date, time
5. Add meeting link (Zoom/Google Meet)
6. Click "Schedule"

### Create a Course
1. Login as admin
2. Go to Admin → Courses
3. Click "Create Course"
4. Fill in course details
5. Add modules and videos
6. Set pricing
7. Publish course

---

## 📊 Database Collections

Your MongoDB has these collections:
- `users` - Students and admins
- `courses` - All courses
- `modules` - Course modules
- `enrollments` - Student enrollments
- `payments` - Payment records
- `liveclasses` - Live class schedules
- `faculty` - Faculty members (NEW)
- `studymaterials` - Study materials (NEW)
- `progress` - Student progress (NEW)
- `herosections` - Homepage hero section

---

## 🔧 Troubleshooting

### Frontend not loading?
```bash
cd frontend
npm run dev
```

### Backend not responding?
```bash
cd backend
npm run dev
```

### MongoDB connection error?
- Check if MongoDB is running
- Verify connection string in `backend/.env`

### Can't login as admin?
- Email: admin@ca.com
- Password: admin123
- Make sure you're using exact credentials (case-sensitive)

---

## 📱 Responsive Design

The platform works perfectly on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1280px+)

---

## 🎨 Theme Support

Toggle between:
- ☀️ Light Mode (default)
- 🌙 Dark Mode (click moon icon in navbar)

---

## 🚀 Next Steps

1. **Add Sample Data**:
   - Add 3-4 faculty members
   - Upload 5-10 study materials
   - Create 2-3 sample courses

2. **Test All Features**:
   - Test as admin
   - Test as student
   - Test on mobile device

3. **Customize**:
   - Update hero section with your demo video
   - Add your logo (save as `frontend/public/shri-logo.png`)
   - Customize colors in `frontend/tailwind.config.js`

4. **Deploy** (when ready):
   - Deploy backend to Heroku/Railway/Render
   - Deploy frontend to Vercel/Netlify
   - Update environment variables

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors (F12)
2. Check backend terminal for API errors
3. Verify MongoDB is connected
4. Ensure both servers are running

---

**Everything is ready! Start testing your platform now! 🎉**

Visit: http://localhost:5173
