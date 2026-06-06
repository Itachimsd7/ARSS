import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    desc: 'NLP-based extraction and TF-IDF cosine similarity scoring for precise resume matching.',
  },
  {
    icon: '⚡',
    title: 'Instant ATS Scoring',
    desc: 'Get your ATS score, match percentage, and detailed feedback in seconds.',
  },
  {
    icon: '🎯',
    title: 'Skill Gap Detection',
    desc: 'Identify exactly which skills are missing and what to add to improve your ranking.',
  },
  {
    icon: '📊',
    title: 'Detailed Analytics',
    desc: 'Strengths, weaknesses, AI suggestions, and job match analysis in one view.',
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'Your resume data is processed securely and never shared with third parties.',
  },
  {
    icon: '📱',
    title: 'PDF & DOCX Support',
    desc: 'Upload any standard resume format — PDF or Word document.',
  },
];

const STATS = [
  { value: '98%', label: 'Accuracy Rate' },
  { value: '<5s', label: 'Processing Time' },
  { value: '12+', label: 'Skills Detected' },
  { value: '3-tier', label: 'Classification' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-hero-gradient overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <span className="font-bold text-white">ARSS</span>
            <span className="text-white/30 text-sm hidden sm:block">AI Resume Screening</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin-login" className="text-sm text-white/50 hover:text-white transition-colors">
              Admin
            </Link>
            <Link to="/upload" className="btn-primary text-sm px-4 py-2">
              Screen My Resume
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 bg-grid">
        {/* Glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-brand-400 text-xs font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            AI-Powered Resume Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
          >
            Know Your{' '}
            <span className="text-gradient">Resume Score</span>
            <br />
            Before They Do
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-10"
          >
            Upload your resume and get an instant AI analysis — ATS score, skill gaps,
            match percentage, and actionable suggestions to land your next role.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/upload" className="btn-primary text-base px-8 py-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Resume — It's Free
            </Link>
            <Link to="/admin-login" className="btn-secondary text-base px-8 py-4">
              Admin Dashboard →
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center glass rounded-2xl p-4">
              <p className="text-2xl font-black text-gradient">{s.value}</p>
              <p className="text-xs text-white/50 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to{' '}
              <span className="text-gradient">Get Hired Faster</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-xl mx-auto">
              Our AI pipeline extracts, scores, and classifies your resume against real job requirements.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="card hover:border-brand-500/30 transition-all duration-300 group"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-4">
              How It Works
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { step: '01', title: 'Upload Resume', desc: 'Drag & drop your PDF or DOCX resume file.' },
              { step: '02', title: 'AI Processes', desc: 'NLP extracts skills, experience, and education. TF-IDF computes match score.' },
              { step: '03', title: 'Get Results', desc: 'Instant ATS score, skill gaps, strengths, and AI-powered suggestions.' },
            ].map((s) => (
              <motion.div key={s.step} variants={fadeUp} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-brand-400 font-black text-lg mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center glass rounded-3xl p-12 border border-brand-500/20 shadow-glow-sm"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Screen Your Resume?
          </h2>
          <p className="text-white/50 mb-8">
            Free, instant, and powered by real AI. No signup required.
          </p>
          <Link to="/upload" className="btn-primary text-base px-10 py-4">
            Get My ATS Score Now →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/30 text-sm">
          © 2024 ARSS — AI Resume Screening System. Built with React + Node.js + Python NLP.
        </p>
      </footer>
    </div>
  );
}
