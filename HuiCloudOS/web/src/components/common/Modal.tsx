import { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl space-y-6 p-8">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button onClick={onClose} className="bg-white/10 px-3 py-1 text-xs text-slate-100">
            关闭
          </Button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto text-slate-200">{children}</div>
      </div>
    </div>
  );
}
