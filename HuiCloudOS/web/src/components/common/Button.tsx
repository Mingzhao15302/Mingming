import { ButtonHTMLAttributes } from 'react';

export default function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-sky-500/80 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-105 hover:bg-sky-400/80 ${className}`.trim()}
    />
  );
}
