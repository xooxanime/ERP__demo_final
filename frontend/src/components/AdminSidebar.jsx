import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiUserCheck, FiVideo, FiSettings, FiBarChart2, FiAward, FiFile, FiCheckCircle, FiLock } from 'react-icons/fi';

const AdminSidebar = ({ onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: <FiBarChart2 />, label: 'Dashboard' },
    { path: '/admin/faculty', icon: <FiAward />, label: 'Faculty' },
    { path: '/admin/payments', icon: <FiFile />, label: 'Pending Payments' },
    { path: '/admin/students', icon: <FiUsers />, label: 'Students' },
    { path: '/admin/approvals', icon: <FiCheckCircle />, label: 'Access Requests' },
    { path: '/admin/permissions', icon: <FiLock />, label: 'Permissions' },
    { path: '/admin/hero-section', icon: <FiSettings />, label: 'Hero Section' },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col p-4 text-card-foreground">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Admin Panel
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your platform
        </p>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white font-bold'
                  : 'text-foreground hover:bg-muted font-medium'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-muted/60 rounded-lg border border-border">
        <p className="text-sm text-foreground mb-2">
          <strong>Quick Stats</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          View detailed analytics in Dashboard
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;
