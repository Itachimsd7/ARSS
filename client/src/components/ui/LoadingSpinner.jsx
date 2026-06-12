import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  const containerSizes = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-24 h-24' };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-full blur-[10px] opacity-40 bg-brand-500" />
        
        {/* Orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border border-brand-500/20 border-t-brand-400 ${sizes[size]}`}
          style={{ margin: 'auto' }}
        />
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-2 rounded-full border border-cyan-500/20 border-b-cyan-400 ${sizes[size]}`}
          style={{ margin: 'auto', width: '80%', height: '80%' }}
        />

        {/* Core */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#fff]"
        />
      </div>
      {text && (
        <p className="text-white/50 text-sm font-display tracking-widest uppercase animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-space-950/80 backdrop-blur-md flex items-center justify-center z-[100]"
      >
        {spinner}
      </motion.div>
    );
  }

  return spinner;
}
