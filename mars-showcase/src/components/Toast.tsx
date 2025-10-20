import React from 'react';
import { useAppStore } from '../store/useStore';

const levelStyles: Record<string, string> = {
  info: 'bg-slate-800 text-slate-100',
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white'
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const dismiss = useAppStore((state) => state.dismissToast);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[220px] rounded px-4 py-2 shadow-lg ${levelStyles[toast.level]}`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-xs text-white/80 hover:text-white"
            >
              关闭
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
