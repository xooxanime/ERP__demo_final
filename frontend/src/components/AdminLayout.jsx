import React from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-gray-50/30 dark:bg-slate-900/10 p-4 lg:p-6 transition-colors duration-200">
      {children}
    </div>
  );
};

export default AdminLayout;
