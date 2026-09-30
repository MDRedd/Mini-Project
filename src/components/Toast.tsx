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
                bg: 'bg-white/95 border-rose-200 text-slate-800 shadow-rose-500/10',
                icon: <XCircle className="w-5 h-5 text-rose-600" />,
                iconBg: 'bg-rose-100/80 text-rose-600',
                borderAccent: 'border-l-4 border-l-rose-500',
              };
            }
            if (isSuccess) {
              return {
                bg: 'bg-white/95 border-emerald-200 text-slate-800 shadow-emerald-500/10',
                icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                iconBg: 'bg-emerald-100/80 text-emerald-600',
                borderAccent: 'border-l-4 border-l-emerald-500',
              };
            }
            if (isWarning) {
              return {
                bg: 'bg-white/95 border-amber-200 text-slate-800 shadow-amber-500/10',
                icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
                iconBg: 'bg-amber-100/80 text-amber-600',
                borderAccent: 'border-l-4 border-l-amber-500',
              };
            }
            return {
              bg: 'bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-500/10',
              icon: <Info className="w-5 h-5 text-indigo-600" />,
              iconBg: 'bg-indigo-100/80 text-indigo-600',
              borderAccent: 'border-l-4 border-l-indigo-500',
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
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-md border text-sm transition-all duration-200 ${theme.bg} ${theme.borderAccent}`}
            >
              <div className={`p-1.5 rounded-xl flex-shrink-0 mt-0.5 ${theme.iconBg}`}>
                {theme.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 tracking-tight text-xs sm:text-sm">{toast.title}</p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed break-words">{toast.message}</p>
              </div>

              <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-700 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
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
