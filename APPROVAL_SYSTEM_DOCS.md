# 🎯 Role-Based Approval System - Complete Implementation

## ✅ System Overview

A comprehensive role-based access control system with approval workflow for Teacher and Parent accounts has been implemented. Students get automatic access, while Teachers and Parents require admin approval.

---

## 🏗️ Architecture & Components

### Backend Models

#### 1. **User Model** (Updated)
- Added `parent` role to enum
- Added `approvalStatus`: pending | approved | rejected | auto-approved
- Added `approvalRequest`: Reference to ApprovalRequest
- Added `parentInfo`: Student name, email, relationship
- Added `teacherInfo`: Qualifications, experience, specialization, department
- Added `permissions`: Reference to Permission document

#### 2. **ApprovalRequest Model** (New)
Tracks all access requests:
```javascript
{
  userId, email, name, phone,
  requestedRole: teacher | parent,
  status: pending | approved | rejected,
  parentInfo | teacherInfo,
  approvedBy, approvedAt,
  rejectionReason,
  requestedAt
}
```

#### 3. **Permission Model** (New)
Defines granular permissions for each role:
- Dashboard (view, edit)
- Courses (view, create, edit, delete, enroll)
- Students (view, create, edit, delete, viewProgress)
- Payments (view, process, edit)
- StudyMaterials (view, upload, edit, delete)
- Approvals (viewRequests, approveReject)
- Faculty (view, create, edit, delete)
- Analytics (view)
- UserManagement (view, create, edit, delete)

---

## 🔄 Login Workflow

### Step 1: User Enters Credentials
- Email & Password on login page

### Step 2: Role Selection Modal
Shows three options:
- **Student**: Direct login (auto-approved)
- **Teacher**: Request approval (pending)
- **Parent**: Request approval (pending)

### Step 3: Role-Specific Actions

#### For Students:
- Login successful → Redirect to /student/dashboard

#### For Teachers/Parents:
- Show approval request form
- Collect role-specific information:
  - **Teacher**: Qualifications, experience, specialization, department
  - **Parent**: Student name, email, relationship
- Create ApprovalRequest in "pending" status
- Show message: "Your request is pending admin approval"

### Step 4: Admin Approval
- Admin views requests in `/admin/approvals`
- Approve → User can login with approved role
- Reject → User gets rejection reason

---

## 📱 Frontend Components

### 1. **RoleSelectionModal** (`components/RoleSelectionModal.jsx`)
- Displays role selection with icons
- Shows approval forms for teacher/parent
- Submits approval request to backend

### 2. **AdminApprovals** (`components/AdminApprovals.jsx`)
- List all pending/approved/rejected requests
- View detailed request information
- Approve or reject with reason
- Filter by status

### 3. **AdminPermissions** (`components/AdminPermissions.jsx`)
- Select role to manage permissions
- Checkbox interface for permission management
- Save permissions per role
- Visual representation of all permission modules

### 4. **Updated Login** (`pages/Login.jsx`)
- Integrated role selection modal
- Passes role to auth context
- Updated routing based on role

### 5. **Updated AdminSidebar** (`components/AdminSidebar.jsx`)
- Added "Access Requests" menu item
- Added "Permissions" menu item
- Updated routing

---

## 🔌 Backend API Endpoints

### Authentication Routes

#### POST `/api/auth/login`
**Enhanced to support role selection**
```javascript
{
  email: "user@email.com",
  password: "password",
  role: "student|teacher|parent"  // NEW
}
```

### Approval Routes (New)

#### POST `/api/approvals/request`
**Submit approval request** (Public)
```javascript
{
  name, email, phone, password,
  requestedRole: "teacher" | "parent",
  teacherInfo: {...},  // if teacher
  parentInfo: {...}    // if parent
}
```

#### GET `/api/approvals/requests`
**Get all requests** (Admin)
Query params: `status=all|pending|approved|rejected`

#### PUT `/api/approvals/:requestId`
**Approve or reject** (Admin)
```javascript
{
  action: "approve" | "reject",
  rejectionReason: "reason text"
}
```

### Permissions Routes (New)

#### GET `/api/permissions`
**Get all permissions** (Admin)

#### PUT `/api/permissions/:role`
**Update permissions for role** (Admin)

#### GET `/api/permissions/user/:userId`
**Get user permissions** (Private)

---

## 🗄️ Database Collections

### Seed Data Created

#### Permissions Seeded:
- **Student**: Limited access to courses and study materials
- **Teacher**: Course management, student progress tracking
- **Parent**: Student progress viewing, payment processing
- **Admin**: Full access to all features

#### Test Users Created:
1. **Teacher Account**
   - Email: `teacher@shri.com`
   - Password: `Teacher@123`
   - Status: Pending Approval

2. **Parent Account**
   - Email: `parent@shri.com`
   - Password: `Parent@123`
   - Status: Pending Approval

---

## 🧪 Testing the System

### Test Case 1: Teacher Approval Flow
1. Login with `teacher@shri.com` / `Teacher@123`
2. Select "Teacher" role
3. Fill in teacher information
4. Submit request
5. Expected: "Pending admin approval" message
6. Admin approves in `/admin/approvals`
7. Teacher can now login and access teacher dashboard

### Test Case 2: Parent Approval Flow
1. Login with `parent@shri.com` / `Parent@123`
2. Select "Parent" role
3. Fill in parent information (student details)
4. Submit request
5. Expected: "Pending admin approval" message
6. Admin approves in `/admin/approvals`
7. Parent can now login and access parent dashboard

### Test Case 3: Student Direct Access
1. Login with `student@shri.com` / `Student@123`
2. Select "Student" role
3. Expected: Instant access to student dashboard
4. No approval needed

### Test Case 4: Permission Management
1. Navigate to `/admin/permissions`
2. Select a role (e.g., "teacher")
3. Toggle permissions on/off
4. Save changes
5. Verify permissions are updated in database

---

## 📋 Admin Dashboard - New Sections

### Access Requests Section
- **Path**: `/admin/approvals`
- **Features**:
  - View all pending requests
  - Filter by status (pending, approved, rejected)
  - View request details (qualifications, student info, etc.)
  - Approve with one click
  - Reject with custom reason
  - Email notifications sent to users

### Permissions Section
- **Path**: `/admin/permissions`
- **Features**:
  - Select role to manage
  - Toggle granular permissions
  - Visual module-based permission organization
  - Save and reset functionality
  - Real-time updates

---

## 🔐 Security Features

1. **JWT Token Validation**: All protected routes require valid token
2. **Role-Based Authorization**: Middleware checks user role before access
3. **Admin-Only Operations**: Approval/rejection only by admin
4. **Permission Caching**: Permissions loaded with user on login
5. **Email Notifications**: Users notified of approval/rejection status
6. **Status Validation**: Can't re-approve already processed requests

---

## 📊 Approval Request States

```
┌─────────────┐
│   PENDING   │  ← Initial state when submitted
└──────┬──────┘
       │
       ├─→ [Admin Approves]
       │      │
       │      └─→ ┌──────────┐
       │         │ APPROVED │ ← User can now login
       │         └──────────┘
       │
       └─→ [Admin Rejects]
              │
              └─→ ┌──────────┐
                  │ REJECTED │ ← User blocked, needs reapply
                  └──────────┘
```

---

## 🎯 Key Features Implemented

✅ **Role Selection Modal** - Beautiful UI for role choice
✅ **Approval Request System** - Track all access requests
✅ **Admin Approval Dashboard** - Manage requests with filters
✅ **Permissions Management** - Granular role-based permissions
✅ **Email Notifications** - Users notified of approval/rejection
✅ **Status Tracking** - View current status of requests
✅ **Detailed Information** - Capture teacher qualifications, parent info
✅ **Rejection Reasons** - Admins can explain rejections
✅ **Test Data** - Pre-configured accounts for testing
✅ **Frontend Routes** - Integrated new pages into navigation
✅ **Backend Routes** - Complete API endpoints
✅ **Database Models** - Proper schema design with relationships

---

## 📝 File Structure

### Backend Files Created:
```
backend/src/
├── models/
│   ├── ApprovalRequest.js  ← NEW
│   ├── Permission.js       ← NEW
│   └── User.js             ← UPDATED
├── controllers/
│   ├── authController.js   ← UPDATED
│   └── approvalController.js ← NEW
├── routes/
│   ├── authRoutes.js       ← UPDATED
│   └── approvalRoutes.js   ← NEW
└── scripts/
    ├── seedPermissions.js  ← NEW
    └── seedTestUsers.js    ← NEW
```

### Frontend Files Created:
```
frontend/src/
├── components/
│   ├── AdminApprovals.jsx      ← NEW
│   ├── AdminPermissions.jsx    ← NEW
│   ├── RoleSelectionModal.jsx  ← NEW
│   ├── AdminSidebar.jsx        ← UPDATED
│   └── ...
├── pages/
│   ├── Login.jsx               ← UPDATED
│   └── ...
└── context/
    └── AuthContext.jsx         ← UPDATED
```

---

## 🚀 Next Steps / Optional Enhancements

1. **Batch Operations**: Approve multiple requests at once
2. **Analytics**: Track approval/rejection rates
3. **Auto-Approval Rules**: Set criteria for auto-approval
4. **Appeal System**: Users can appeal rejections
5. **Audit Logs**: Track all approvals with timestamps
6. **Email Templates**: Customizable approval/rejection emails
7. **Parent-Student Linking**: Auto-link parent to student
8. **Role Upgrade Path**: Allow students to upgrade to teacher/parent
9. **Permission Inheritance**: Parent inherits some student permissions
10. **Activity Monitoring**: Track what each role accesses

---

## 📞 Support & Troubleshooting

### Issue: "404 Not Found" on approval endpoints
- Ensure backend server is restarted after code changes
- Check `/api/approvals/requests` endpoint exists
- Verify token is sent in Authorization header

### Issue: Role modal not showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check React console for errors

### Issue: Permissions not saving
- Verify admin role
- Check MongoDB connection
- Review permissions JSON structure

---

## 📚 Database Queries for Testing

```javascript
// Check pending approval requests
db.approvalrequests.find({ status: "pending" })

// Get all teacher requests
db.approvalrequests.find({ requestedRole: "teacher" })

// Get user with permissions
db.users.findOne({ email: "teacher@shri.com" }).populate("permissions")

// Check all permissions
db.permissions.find({})
```

---

**Implementation Date**: June 3, 2026
**Status**: ✅ Complete and Ready for Testing
**Test Coverage**: Teacher, Parent, Student, Admin flows
