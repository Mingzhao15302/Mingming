import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface AppShellProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function AppShell({ children, showFooter = true }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
