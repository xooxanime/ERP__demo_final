import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth & Layout
import { DashboardLayout } from './components/layout/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import TeacherRoute from './components/TeacherRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Shared
import ComingSoon from './pages/shared/ComingSoon';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import MyCourses from './pages/student/MyCourses';
import AllCourses from './pages/student/AllCourses';
import CourseContent from './pages/student/CourseContent';
import ProgressTracking from './pages/student/ProgressTracking';
import StudentProfile from './pages/student/Profile';
import StudentNotifications from './pages/student/Notifications';
import StudentLiveClasses from './pages/student/LiveClasses';
import StudentAssignments from './pages/student/Assignments';
import StudentTests from './pages/student/Tests';
import AIAssessment from './pages/student/ai-assessment/AIAssessment';

//Parent Dashboar
import ParentDashboard from './pages/parent/Dashboard';
import ParentCourses from './pages/parent/Courses';
import ParentProgress from './pages/parent/Progress';
import ParentAttendance from './pages/parent/Attendance';
import ParentNotifications from './pages/parent/Notifications';
import ParentLiveClasses from './pages/parent/LiveClasses';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherLiveClasses from './pages/teacher/LiveClasses';
import TeacherNotifications from './pages/teacher/Notifications';
import TeacherBatches from './pages/teacher/Batches';


// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCourses from './pages/admin/Courses';
import ManageCourseContent from './pages/admin/ManageCourseContent';
import AdminFaculty from './pages/admin/Faculty';
import AdminStudyMaterials from './pages/admin/StudyMaterials';
import AdminPayments from './pages/admin/PendingPayments';
import AdminStudents from './pages/admin/Students';
import AdminHeroSection from './pages/admin/HeroSection';
import AdminAnalytics from './pages/admin/Analytics';
import AdminNotifications from './pages/admin/Notifications';
import AdminApprovals from './components/AdminApprovals';
import AdminPermissions from './components/AdminPermissions';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';
import AdminLiveClasses from './pages/admin/LiveClasses';
import AdminBatches from './pages/admin/Batches';
import AdminFees from './pages/admin/Fees';
import StudentPayments from './pages/student/Payments';
import ParentPayments from './pages/parent/Payments';
import TeacherTestsResults from './pages/teacher/TestsResults';

// Wrapped route with DashboardLayout
function DashboardRoute({ children, Guard }) {
  return (
    <Guard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </Guard>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ── Student Routes ── */}
        <Route path="/student/dashboard" element={<DashboardRoute Guard={PrivateRoute}><StudentDashboard /></DashboardRoute>} />
        <Route path="/student/my-courses" element={<DashboardRoute Guard={PrivateRoute}><MyCourses /></DashboardRoute>} />
        <Route path="/student/courses" element={<DashboardRoute Guard={PrivateRoute}><AllCourses /></DashboardRoute>} />
        <Route path="/student/course/:id" element={<DashboardRoute Guard={PrivateRoute}><CourseContent /></DashboardRoute>} />
        <Route path="/student/live-classes" element={<DashboardRoute Guard={PrivateRoute}><StudentLiveClasses /></DashboardRoute>} />
        <Route path="/student/lectures" element={<DashboardRoute Guard={PrivateRoute}><Navigate to="/student/my-courses" replace /></DashboardRoute>} />
        <Route path="/student/assignments" element={<DashboardRoute Guard={PrivateRoute}><StudentAssignments /></DashboardRoute>} />
        <Route path="/student/tests" element={<DashboardRoute Guard={PrivateRoute}><StudentTests /></DashboardRoute>} />
        <Route path="/student/progress" element={<DashboardRoute Guard={PrivateRoute}><ProgressTracking /></DashboardRoute>} />
        <Route path="/student/payments" element={<DashboardRoute Guard={PrivateRoute}><StudentPayments /></DashboardRoute>} />
        <Route path="/student/notifications" element={<DashboardRoute Guard={PrivateRoute}><StudentNotifications /></DashboardRoute>} />
        <Route path="/student/profile" element={<DashboardRoute Guard={PrivateRoute}><StudentProfile /></DashboardRoute>} />
        <Route path="/ai-assessment" element={<DashboardRoute Guard={PrivateRoute}><AIAssessment /></DashboardRoute>} />

        {/* ── Teacher Routes ── */}
        <Route path="/teacher/dashboard" element={<DashboardRoute Guard={TeacherRoute}><TeacherDashboard /></DashboardRoute>} />
        <Route path="/teacher/batches" element={<DashboardRoute Guard={TeacherRoute}><TeacherBatches /></DashboardRoute>} />
        <Route path="/teacher/courses/:id/content" element={<DashboardRoute Guard={TeacherRoute}><ManageCourseContent /></DashboardRoute>} />
        <Route path="/teacher/live-classes" element={<DashboardRoute Guard={TeacherRoute}><TeacherLiveClasses /></DashboardRoute>} />
        <Route path="/teacher/materials" element={<DashboardRoute Guard={TeacherRoute}><AdminStudyMaterials /></DashboardRoute>} />
        <Route path="/teacher/assignments" element={<DashboardRoute Guard={TeacherRoute}><Navigate to="/teacher/batches" replace /></DashboardRoute>} />
        <Route path="/teacher/attendance" element={<DashboardRoute Guard={TeacherRoute}><Navigate to="/teacher/batches" replace /></DashboardRoute>} />
        <Route path="/teacher/tests" element={<DashboardRoute Guard={TeacherRoute}><Navigate to="/teacher/batches" replace /></DashboardRoute>} />
        <Route path="/teacher/tests-results" element={<DashboardRoute Guard={TeacherRoute}><TeacherTestsResults /></DashboardRoute>} />
        <Route path="/teacher/announcements" element={<DashboardRoute Guard={TeacherRoute}><TeacherNotifications /></DashboardRoute>} />
        <Route path="/teacher/notifications" element={<DashboardRoute Guard={TeacherRoute}><TeacherNotifications /></DashboardRoute>} />
        <Route path="/teacher/profile" element={<DashboardRoute Guard={TeacherRoute}><StudentProfile /></DashboardRoute>} />


        {/* ── Parent Routes ── */}
<Route
  path="/parent/dashboard"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentDashboard />
    </DashboardRoute>
  }
/>
<Route
  path="/parent/courses"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentCourses />
    </DashboardRoute>
  }
/>

<Route
  path="/parent/progress"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentProgress />
    </DashboardRoute>
  }
/>

<Route
  path="/parent/attendance"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentAttendance />
    </DashboardRoute>
  }
/>

<Route
  path="/parent/notifications"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentNotifications />
    </DashboardRoute>
  }
/>

<Route
  path="/parent/live-classes"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentLiveClasses />
    </DashboardRoute>
  }
/>
<Route
  path="/parent/payments"
  element={
    <DashboardRoute Guard={PrivateRoute}>
      <ParentPayments />
    </DashboardRoute>
  }
/>

        {/* ── Admin Routes ── */}
        <Route path="/admin/dashboard" element={<DashboardRoute Guard={AdminRoute}><AdminDashboard /></DashboardRoute>} />
        <Route path="/admin/students" element={<DashboardRoute Guard={AdminRoute}><AdminStudents /></DashboardRoute>} />
        <Route path="/admin/faculty" element={<DashboardRoute Guard={AdminRoute}><AdminFaculty /></DashboardRoute>} />
        <Route path="/admin/roles" element={<DashboardRoute Guard={AdminRoute}><AdminPermissions /></DashboardRoute>} />
        <Route path="/admin/courses" element={<DashboardRoute Guard={AdminRoute}><AdminCourses /></DashboardRoute>} />
        <Route path="/admin/live-classes" element={<DashboardRoute Guard={AdminRoute}><AdminLiveClasses /></DashboardRoute>} />
        <Route path="/admin/courses/:id/content" element={<DashboardRoute Guard={AdminRoute}><ManageCourseContent /></DashboardRoute>} />
        <Route path="/admin/batches" element={<DashboardRoute Guard={AdminRoute}><AdminBatches /></DashboardRoute>} />
        <Route path="/admin/study-materials" element={<DashboardRoute Guard={AdminRoute}><AdminStudyMaterials /></DashboardRoute>} />
        <Route path="/admin/payments" element={<DashboardRoute Guard={AdminRoute}><AdminPayments /></DashboardRoute>} />
        <Route path="/admin/fees" element={<DashboardRoute Guard={AdminRoute}><AdminFees /></DashboardRoute>} />
        <Route path="/admin/approvals" element={<DashboardRoute Guard={AdminRoute}><AdminApprovals /></DashboardRoute>} />
        <Route path="/admin/permissions" element={<DashboardRoute Guard={AdminRoute}><AdminPermissions /></DashboardRoute>} />
        <Route path="/admin/analytics" element={<DashboardRoute Guard={AdminRoute}><AdminAnalytics /></DashboardRoute>} />
        <Route path="/admin/reports" element={<DashboardRoute Guard={AdminRoute}><AdminReports /></DashboardRoute>} />
        <Route path="/admin/announcements" element={<DashboardRoute Guard={AdminRoute}><AdminNotifications /></DashboardRoute>} />
        <Route path="/admin/notifications" element={<DashboardRoute Guard={AdminRoute}><AdminNotifications /></DashboardRoute>} />
        <Route path="/admin/hero-section" element={<DashboardRoute Guard={AdminRoute}><AdminHeroSection /></DashboardRoute>} />
        <Route path="/admin/settings" element={<DashboardRoute Guard={AdminRoute}><AdminSettings /></DashboardRoute>} />
        <Route path="/admin/logs" element={<DashboardRoute Guard={AdminRoute}><AdminSettings /></DashboardRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </Router>
  );
}

export default App;
