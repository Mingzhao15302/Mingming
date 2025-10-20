import React, { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas3D } from './components/Canvas3D';
import { MarkerCard } from './components/MarkerCard';
import { ToastContainer } from './components/Toast';
import { useAppStore } from './store/useStore';

const App: React.FC = () => {
  const initialize = useAppStore((state) => state.initialize);
  const initialized = useAppStore((state) => state.initialized);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swUrl = new URL('./sw.ts', import.meta.url);
      navigator.serviceWorker
        .register(swUrl, { type: 'module' })
        .catch((error) => console.error('SW registration failed', error));
    }
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col bg-slate-950">
          <div className="flex flex-1 overflow-hidden">
            <section className="flex-1">
              {initialized ? (
                <Canvas3D />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  正在初始化数据存储...
                </div>
              )}
            </section>
            <aside className="h-full w-full max-w-md border-l border-slate-800 bg-slate-900/50">
              <MarkerCard />
            </aside>
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
