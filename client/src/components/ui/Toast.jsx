import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOAST_ICONS = {
  success: (
    <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  error: (
    <div className="w-8 h-8 rounded-full bg-danger-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
  info: (
    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

export function Toast({ id, message, type = 'info', removeToast, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, removeToast, duration]);

  const borderColors = {
    success: 'border-accent-500/30',
    error: 'border-danger-500/30',
    info: 'border-brand-500/30',
  };

  const glowColors = {
    success: 'rgba(16,185,129,0.1)',
    error: 'rgba(244,63,94,0.1)',
    info: 'rgba(139,92,246,0.1)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`glass-dark rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md border pointer-events-auto ${borderColors[type]}`}
      style={{ boxShadow: `0 10px 40px -10px ${glowColors[type]}` }}
    >
      {TOAST_ICONS[type]}
      <p className="text-sm font-sans text-white/90 flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-white/30 hover:text-white transition-colors p-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full rounded-b-2xl overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="h-full rounded-b-2xl"
          style={{
            background: type === 'success' ? '#10b981' : type === 'error' ? '#f43f5e' : '#7c3aed',
          }}
        />
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
