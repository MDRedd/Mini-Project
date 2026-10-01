import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          const getToastTheme = () => {
            if (isError) {
              return {
                bg: 'bg-[#0d1629]/95 border-rose-500/40 text-slate-100 shadow-2xl shadow-rose-950/50',
                icon: <XCircle className="w-5 h-5 text-rose-400" />,
                iconBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
                borderAccent: 'border-l-4 border-l-rose-500',
              };
            }
            if (isSuccess) {
              return {
                bg: 'bg-[#0d1629]/95 border-emerald-500/40 text-slate-100 shadow-2xl shadow-emerald-950/50',
                icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
                iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                borderAccent: 'border-l-4 border-l-emerald-500',
              };
            }
            if (isWarning) {
              return {
                bg: 'bg-[#0d1629]/95 border-amber-500/40 text-slate-100 shadow-2xl shadow-amber-950/50',
                icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
                iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                borderAccent: 'border-l-4 border-l-amber-500',
              };
            }
            return {
              bg: 'bg-[#0d1629]/95 border-blue-500/40 text-slate-100 shadow-2xl shadow-blue-950/50',
              icon: <Info className="w-5 h-5 text-blue-400" />,
              iconBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
              borderAccent: 'border-l-4 border-l-amber-500',
            };
          };

          const theme = getToastTheme();

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border text-sm transition-all duration-200 ${theme.bg} ${theme.borderAccent}`}
            >
              <div className={`p-1.5 rounded-xl flex-shrink-0 mt-0.5 ${theme.iconBg}`}>
                {theme.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-white tracking-tight text-xs sm:text-sm">{toast.title}</p>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
              </div>

              <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-100 rounded-lg p-1 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
