import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const animations = {
  up: { hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -60 }, show: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
};

export default function RevealOnScroll({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  stagger = 0,
  className = '',
  once = true,
  threshold = 0.15,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: threshold });

  const variant = animations[direction] || animations.up;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: variant.hidden,
        show: {
          ...variant.show,
          transition: {
            duration,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Child wrapper for stagger animations
export function RevealChild({ children, direction = 'up', className = '' }) {
  const variant = animations[direction] || animations.up;
  return (
    <motion.div
      variants={{
        hidden: variant.hidden,
        show: {
          ...variant.show,
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
