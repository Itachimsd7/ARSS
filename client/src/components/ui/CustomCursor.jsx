import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const cursorX = useSpring(0, { stiffness: 800, damping: 35 });
  const cursorY = useSpring(0, { stiffness: 800, damping: 35 });
  const ringX = useSpring(0, { stiffness: 200, damping: 25 });
  const ringY = useSpring(0, { stiffness: 200, damping: 25 });

  useEffect(() => {
    // Only show custom cursor on devices with fine pointer
    const mq = window.matchMedia('(pointer: fine)');
    if (!mq.matches) return;

    const onMove = (e) => {
      setVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    // Detect hoverable elements
    const onOverInteractive = () => setHovering(true);
    const onOutInteractive = () => setHovering(false);

    const addHoverListeners = () => {
      const interactives = document.querySelectorAll('a, button, input, textarea, select, [role="button"], .cursor-hover');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', onOverInteractive);
        el.addEventListener('mouseleave', onOutInteractive);
      });
    };

    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      observer.disconnect();
    };
  }, [cursorX, cursorY, ringX, ringY]);

  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
    return null;
  }

  return (
    <>
      {/* Dot */}
      <motion.div
        style={{ x: cursorX, y: cursorY, opacity: visible ? 1 : 0 }}
        animate={{
          scale: clicking ? 0.5 : hovering ? 0.6 : 1,
        }}
        transition={{ scale: { type: 'spring', stiffness: 500, damping: 28 } }}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
      >
        <div
          className="w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            boxShadow: '0 0 10px rgba(139,92,246,0.6)',
          }}
        />
      </motion.div>

      {/* Ring */}
      <motion.div
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
        animate={{
          scale: clicking ? 0.7 : hovering ? 1.8 : 1,
          borderColor: hovering ? 'rgba(6,182,212,0.5)' : 'rgba(139,92,246,0.4)',
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
      >
        <div
          className="w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-300"
          style={{
            borderColor: 'inherit',
            background: hovering ? 'rgba(139,92,246,0.05)' : 'transparent',
          }}
        />
      </motion.div>
    </>
  );
}
