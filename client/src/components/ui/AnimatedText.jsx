import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedText({ text, className = '', delay = 0, stagger = 0.03, type = 'words' }) {
  if (type === 'chars') {
    const chars = text.split('');
    return (
      <span className={className} aria-label={text}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: delay + i * stagger,
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{ display: 'inline-block' }}
            aria-hidden="true"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    );
  }

  // Word-by-word (default)
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
          aria-hidden="true"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function GradientText({ children, className = '' }) {
  return (
    <span className={`text-gradient-hero ${className}`}>
      {children}
    </span>
  );
}

export function TypewriterText({ text, className = '', speed = 50, delay = 0 }) {
  const [displayed, setDisplayed] = React.useState('');

  React.useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="text-brand-400"
      >
        |
      </motion.span>
    </span>
  );
}
