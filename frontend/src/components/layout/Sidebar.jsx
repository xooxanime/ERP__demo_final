import { useState, createContext, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, FileText, ClipboardList,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Bell, CreditCard,
  Video, BookMarked, ListChecks, UserCog, Shield, Megaphone, PieChart,
  School, FolderOpen, CalendarDays, Award, HelpCircle, Home, ArrowRight, Brain, List
} from 'lucide-react';

const SidebarContext = createContext({});
export const useSidebar = () => useContext(SidebarContext);

const STUDENT_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'My Batch', icon: BookOpen, path: '/student/my-courses' },
  { label: 'Live Classes', icon: Video, path: '/student/live-classes' },
  { label: 'Fee & Payments', icon: CreditCard, path: '/student/payments' },
  { label: 'Notifications', icon: Bell, path: '/student/notifications' },
  { label: 'Profile', icon: Settings, path: '/student/profile' },
  { label: 'AI Assessment', icon: Brain, path: '/ai-assessment' },
];

const TEACHER_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'My Batches', icon: School, path: '/teacher/batches' },
  { label: 'Live Classes', icon: Video, path: '/teacher/live-classes' },
  { label: 'Notifications', icon: Bell, path: '/teacher/notifications' },
  { label: 'Profile', icon: Settings, path: '/teacher/profile' },
];


const PARENT_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: '/parent/dashboard' },
  { label: 'Courses', icon: BookOpen, path: '/parent/courses' },
  { label: 'Live Classes', icon: Video, path: '/parent/live-classes' },
  { label: 'Progress', icon: BarChart3, path: '/parent/progress' },
  { label: 'Attendance', icon: CalendarDays, path: '/parent/attendance' },
  { label: 'Billing & Fees', icon: CreditCard, path: '/parent/payments' },
  { label: 'Notifications', icon: Bell, path: '/parent/notifications' },
];

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { group: 'User Management' },
  { label: 'Students', icon: GraduationCap, path: '/admin/students' },
  { label: 'Teachers', icon: Users, path: '/admin/faculty' },
  { label: 'Access Requests', icon: ClipboardList, path: '/admin/approvals' },
  { label: 'Staff & Roles', icon: Shield, path: '/admin/roles' },
  { group: 'Academic' },
  { label: 'Live Classes', icon: Video, path: '/admin/live-classes' },
  { label: 'Batches', icon: School, path: '/admin/batches' },
  { group: 'Finance' },
  { label: 'Fees & Billing', icon: Award, path: '/admin/fees' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { group: 'Reports' },
  { label: 'Analytics', icon: PieChart, path: '/admin/analytics' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { group: 'System' },
  { label: 'Outbound Logs', icon: List, path: '/admin/settings?tab=logs' },
  { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { label: 'Hero Section', icon: Home, path: '/admin/hero-section' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

function NavGroup({ label }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{label}</p>
    </div>
  );
}

function SidebarNavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && item.path !== '/student/dashboard' && item.path !== '/teacher/dashboard' && location.pathname.startsWith(item.path));

  return (
    <NavLink to={item.path}
      className={cn('sidebar-link', isActive && 'active')}
    >
      <item.icon className="link-icon" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

 const navItems =
  user?.role === 'admin'
    ? ADMIN_NAV
    : user?.role === 'teacher'
    ? TEACHER_NAV
    : user?.role === 'parent'
    ? PARENT_NAV
    : STUDENT_NAV;

const roleLabel =
  user?.role === 'admin'
    ? 'Admin Panel'
    : user?.role === 'teacher'
    ? 'Teacher Portal'
    : user?.role === 'parent'
    ? 'Parent Portal'
    : 'Student Portal';

const roleColor =
  user?.role === 'admin'
    ? 'bg-violet-500'
    : user?.role === 'teacher'
    ? 'bg-emerald-500'
    : user?.role === 'parent'
    ? 'bg-amber-500'
    : 'bg-primary';
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={cn(
      'fixed top-0 left-0 h-screen bg-sidebar flex flex-col z-40 transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm', roleColor)}>
          S
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sidebar-foreground font-bold text-sm leading-tight font-display">Shri Education</p>
            <p className="text-sidebar-foreground/50 text-xs">{roleLabel}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar space-y-0.5">
        {navItems.map((item, i) =>
          item.group
            ? (!collapsed && <NavGroup key={i} label={item.group} />)
            : <SidebarNavItem key={item.path} item={item} collapsed={collapsed} />
        )}
      </nav>

      {/* Ask EduBot Card */}
      {!collapsed && user?.role === 'student' && (
        <div className="mx-4 my-4 p-4 rounded-3xl bg-[#151932] border border-[#242854] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 2A2 2 0 0010 4v1H8a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3h-2V4a2 2 0 00-2-2zM9 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-extrabold text-white">Ask EduBot</p>
              <p className="text-[9px] text-slate-400 font-semibold">Your AI Assistant</p>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
            className="flex h-9 items-center justify-between rounded-xl bg-[#5F4BF2] hover:bg-[#4E3CD9] px-4 text-xs font-bold text-white transition-colors"
          >
            <span>Chat Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* User + Collapse */}
      <div className="flex-shrink-0 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sidebar-foreground text-sm font-medium truncate">{user?.name}</p>
              <p className="text-sidebar-foreground/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <div className={cn('flex items-center px-2 pb-3 gap-1', collapsed ? 'flex-col' : '')}>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Logout'}
          </button>
          <button onClick={() => setCollapsed(v => !v)}
            className="flex items-center justify-center p-2 text-sidebar-foreground/50 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
