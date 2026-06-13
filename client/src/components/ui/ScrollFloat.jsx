import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollFloat = ({
  children,
  scrollContainerRef,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=20%',
  scrollEnd = 'bottom bottom-=20%',
  stagger = 0.03,
  className = '',
  as: Tag = 'h2',
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const spans = el.querySelectorAll('.char');
    gsap.fromTo(
      spans,
      { opacity: 0, yPercent: 120 },
      {
        opacity: 1,
        yPercent: 0,
        duration: animationDuration,
        ease,
        stagger,
        scrollTrigger: {
          trigger: el,
          scroller: scrollContainerRef ? scrollContainerRef.current : undefined,
          start: scrollStart,
          end: scrollEnd,
          scrub: false,
        },
      }
    );
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, [animationDuration, ease, scrollStart, scrollEnd, stagger, scrollContainerRef]);

  const renderChars = (text) =>
    text.split('').map((char, i) => (
      <span key={i} className="char" style={{ display: 'inline-block' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  const content = typeof children === 'string'
    ? renderChars(children)
    : children;

  return (
    <Tag ref={containerRef} className={`scroll-float ${className}`}>
      <span className="scroll-float-text">{content}</span>
    </Tag>
  );
};

export default ScrollFloat;
