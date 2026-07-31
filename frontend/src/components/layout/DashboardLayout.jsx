import { useState } from 'react';
import { cn } from '../../lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatbotWidget from '../chatbot/ChatbotWidget';

export function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar collapsed={false} setCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main content */}
      <div className={cn(
        'flex flex-col flex-1 min-h-screen transition-all duration-300',
        'lg:ml-0', // sidebar is fixed, so we need margin
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="flex-1 p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
        <ChatbotWidget />
      </div>
    </div>
  );
}

export default DashboardLayout;
