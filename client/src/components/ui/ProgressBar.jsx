import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  brand:   'from-brand-500 to-brand-400',
  green:   'from-accent-600 to-accent-400',
  yellow:  'from-warn-500 to-warn-400',
  red:     'from-danger-600 to-danger-400',
  purple:  'from-purple-600 to-purple-400',
};

function getColor(value) {
  if (value >= 75) return 'green';
  if (value >= 50) return 'brand';
  if (value >= 30) return 'yellow';
  return 'red';
}

export default function ProgressBar({ value = 0, label = '', showValue = true, color, height = 'h-2' }) {
  const resolvedColor = color || getColor(value);
  const gradient = colorMap[resolvedColor] || colorMap.brand;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-white/60">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-white/80">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <div className={`progress-bar ${height}`}>
        <motion.div
          className={`progress-fill bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
