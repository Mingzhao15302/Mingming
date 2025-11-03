import React from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

export const Layout = ({ children }) => {
  return (
    <div className="app-shell">
      <Header />
      <div className="shell-body" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        <Sidebar />
        <main className="page-container" role="main" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
