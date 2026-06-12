import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function GlassCard({ children, className = '', glowColor = '139,92,246', tiltIntensity = 15 }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [tiltIntensity, -tiltIntensity]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-tiltIntensity, tiltIntensity]), { stiffness: 300, damping: 30 });

  const glowX = useTransform(x, [0, 1], [0, 100]);
  const glowY = useTransform(y, [0, 1], [0, 100]);

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const onMouseLeave = () => {
    setHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative group ${className}`}
    >
      {/* Glow effect on hover */}
      {hovered && (
        <motion.div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${glowX.get()}% ${glowY.get()}%, rgba(${glowColor},0.12), transparent 40%)`,
          }}
        />
      )}

      {/* Card surface */}
      <div className="relative glass rounded-2xl p-6 h-full overflow-hidden transition-all duration-500 group-hover:border-brand-500/20"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Inner shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(${glowColor},0.06), transparent 40%)`,
          }}
        />
        <div style={{ transform: 'translateZ(20px)' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
