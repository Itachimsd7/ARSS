import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import ParticleField from '../components/ui/ParticleField';
import GlassCard from '../components/ui/GlassCard';
import MagneticButton from '../components/ui/MagneticButton';
import RevealOnScroll, { RevealChild } from '../components/ui/RevealOnScroll';
import { AnimatedText, GradientText } from '../components/ui/AnimatedText';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'AI-Powered Analysis',
    desc: 'NLP-based extraction and TF-IDF cosine similarity scoring for precise resume matching.',
    color: '139,92,246',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant ATS Scoring',
    desc: 'Get your ATS score, match percentage, and detailed feedback in seconds.',
    color: '6,182,212',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Skill Gap Detection',
    desc: 'Identify exactly which skills are missing and what to add to improve your ranking.',
    color: '16,185,129',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: 'Detailed Analytics',
    desc: 'Strengths, weaknesses, AI suggestions, and job match analysis in one view.',
    color: '139,92,246',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'Your resume data is processed securely and never shared with third parties.',
    color: '6,182,212',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'PDF & DOCX Support',
    desc: 'Upload any standard resume format — PDF or Word document.',
    color: '16,185,129',
  },
];

const STATS = [
  { value: 98, suffix: '%', label: 'Accuracy Rate' },
  { value: 5, prefix: '<', suffix: 's', label: 'Processing Time' },
  { value: 12, suffix: '+', label: 'Skills Detected' },
  { value: 3, suffix: '-tier', label: 'Classification' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-space-950 overflow-x-hidden">
      {/* ─── Nav ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <span className="text-white font-display font-bold text-sm">AI</span>
            </motion.div>
            <div>
              <span className="font-display font-bold text-white text-lg">ARSS</span>
              <span className="text-white/25 text-xs ml-2 hidden sm:inline">AI Resume Screening</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin-login" className="text-sm text-white/40 hover:text-white transition-colors duration-300 font-display">
              Admin
            </Link>
            <Link to="/upload" className="btn-primary text-sm px-5 py-2.5">
              Screen My Resume
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 min-h-[90vh] flex items-center">
        {/* Particle background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ParticleField particleCount={50} />
        </div>

        {/* Glow orbs with parallax */}
        <motion.div style={{ y: parallaxY }} className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: 'rgba(124,58,237,0.15)' }} />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ background: 'rgba(6,182,212,0.08)' }} />
          <div className="absolute bottom-20 left-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
            style={{ background: 'rgba(16,185,129,0.06)' }} />
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

        <motion.div style={{ opacity: parallaxOpacity }} className="relative max-w-5xl mx-auto text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass border-brand-500/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-glow-pulse" />
            <span className="text-brand-300 text-sm font-display font-medium">AI-Powered Resume Intelligence</span>
          </motion.div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[1.05] mb-8">
            <AnimatedText text="Know Your" delay={0.2} stagger={0.08} />
            <br />
            <GradientText>
              <AnimatedText text="Resume Score" delay={0.5} stagger={0.08} />
            </GradientText>
            <br />
            <AnimatedText text="Before They Do" delay={0.8} stagger={0.08} />
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-sans leading-relaxed"
          >
            Upload your resume and get an instant AI analysis — ATS score, skill gaps,
            match percentage, and actionable suggestions to land your next role.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/upload">
              <MagneticButton variant="primary" className="text-base px-8 py-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Resume — It's Free
              </MagneticButton>
            </Link>
            <Link to="/admin-login">
              <MagneticButton variant="secondary" className="text-base px-8 py-4">
                Admin Dashboard →
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats ────────────────────────────────────── */}
      <section className="relative py-8 px-6">
        <RevealOnScroll direction="up" stagger={0.1} className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <RevealChild key={s.label}>
              <GlassCard className="text-center" tiltIntensity={8}>
                <p className="text-3xl font-display font-bold text-gradient mb-1">
                  {s.prefix || ''}<AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-white/40 font-display">{s.label}</p>
              </GlassCard>
            </RevealChild>
          ))}
        </RevealOnScroll>
      </section>

      {/* ─── Features ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Everything You Need to <GradientText>Get Hired Faster</GradientText>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-lg">
              Our AI pipeline extracts, scores, and classifies your resume against real job requirements.
            </p>
          </RevealOnScroll>

          <RevealOnScroll direction="up" stagger={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <RevealChild key={f.title}>
                <GlassCard glowColor={f.color} className="h-full cursor-hover">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `rgba(${f.color},0.12)`, color: `rgb(${f.color})` }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-display font-semibold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
                </GlassCard>
              </RevealChild>
            ))}
          </RevealOnScroll>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 60%)' }} />

        <div className="relative max-w-4xl mx-auto">
          <RevealOnScroll direction="up" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">Three simple steps to your AI-powered resume analysis</p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(6,182,212,0.3), transparent)' }} />

            {[
              { step: '01', title: 'Upload Resume', desc: 'Drag & drop your PDF or DOCX resume file.', color: '#8b5cf6' },
              { step: '02', title: 'AI Processes', desc: 'NLP extracts skills, experience, and education. TF-IDF computes match score.', color: '#06b6d4' },
              { step: '03', title: 'Get Results', desc: 'Instant ATS score, skill gaps, strengths, and AI-powered suggestions.', color: '#10b981' },
            ].map((s, i) => (
              <RevealOnScroll key={s.step} direction="up" delay={i * 0.15}>
                <div className="text-center relative">
                  <motion.div
                    whileHover={{ scale: 1.1, y: -4 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
                    style={{
                      background: `linear-gradient(135deg, ${s.color}20, ${s.color}05)`,
                      border: `1px solid ${s.color}40`,
                      boxShadow: `0 0 20px ${s.color}20`,
                    }}
                  >
                    <span className="font-display font-bold text-xl" style={{ color: s.color }}>{s.step}</span>
                  </motion.div>
                  <h3 className="font-display font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{s.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6">
        <RevealOnScroll direction="scale">
          <div className="max-w-2xl mx-auto text-center relative">
            {/* Background glow */}
            <div className="absolute -inset-20 rounded-full blur-[100px] opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent)' }} />

            <div className="relative glass-glow rounded-3xl p-14">
              <h2 className="text-4xl font-display font-bold text-white mb-4">
                Ready to Screen Your Resume?
              </h2>
              <p className="text-white/45 mb-10 text-lg">
                Free, instant, and powered by real AI. No signup required.
              </p>
              <Link to="/upload">
                <MagneticButton variant="primary" className="text-base px-10 py-4">
                  Get My ATS Score Now →
                </MagneticButton>
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <span className="text-white font-display font-bold text-xs">AI</span>
            </div>
            <span className="text-white/30 text-sm font-display">ARSS — AI Resume Screening System</span>
          </div>
          <p className="text-white/20 text-xs">
            Built with React + Node.js + Python NLP  •  © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
