import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TextPressure from '../components/ui/TextPressure';
import ScrollFloat from '../components/ui/ScrollFloat';
import GlareHover from '../components/ui/GlareHover';
import LightRays from '../components/ui/LightRays';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import RevealOnScroll, { RevealChild } from '../components/ui/RevealOnScroll';

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Results',      href: '#stats' },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Scoring',
    description: 'Advanced NLP pipeline scores resumes using TF-IDF, semantic similarity, and weighted skill matching — all in seconds.',
    accent: '#f59e0b',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'ATS Compatibility',
    description: 'Evaluate exactly how well your resume passes Applicant Tracking Systems before a recruiter ever sees it.',
    accent: '#3b82f6',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'Skill Gap Analysis',
    description: "Pinpoint exactly which skills you're missing and which you have — with precise keyword extraction from your resume.",
    accent: '#10b981',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Match Percentage',
    description: 'See a granular breakdown of how closely your experience, education, and skills align with the target role.',
    accent: '#f59e0b',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Action Plan',
    description: 'Get a prioritised AI-generated action plan with concrete suggestions to strengthen your resume for this role.',
    accent: '#fbbf24',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure & Private',
    description: 'Your resume is processed in an isolated pipeline and never stored beyond the analysis session. Your data stays yours.',
    accent: '#3b82f6',
  },
];

const STEPS = [
  { num: '01', title: 'Upload Your Resume',   body: 'Drop a PDF or DOCX file into the uploader — up to 5 MB, processed in seconds.' },
  { num: '02', title: 'AI Parses & Analyses', body: 'Our Python NLP pipeline extracts skills, experience, education and runs semantic matching.' },
  { num: '03', title: 'Receive Your Score',   body: 'Get a full breakdown: ATS score, keyword match %, similarity score, and skill gap list.' },
  { num: '04', title: 'Follow the Action Plan', body: 'Use the AI-generated recommendations to tailor your resume and boost your chances.' },
];

const STATS = [
  { value: 98,  suffix: '%',  label: 'ATS Parse Accuracy' },
  { value: 3,   suffix: 's',  label: 'Average Analysis Time' },
  { value: 50,  suffix: '+',  label: 'Skills Tracked' },
  { value: 10,  suffix: 'k+', label: 'Resumes Processed' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#04071e' }}>

      {/* ── LightRays background — fixed, full screen ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#f5a623"
          raysSpeed={0.6}
          lightSpread={0.65}
          rayLength={1.6}
          pulsating={true}
          fadeDistance={1.2}
          saturation={0.85}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0.04}
          distortion={0.03}
        />
      </div>

      {/* Dark overlay so text stays readable over the rays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(4,7,30,0.55) 0%, rgba(4,7,30,0.2) 40%, rgba(4,7,30,0.7) 100%)' }} />

      {/* All page content sits above galaxy */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* ── Nav ── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 flex items-center justify-between px-6 md:px-10 py-4"
          style={{
            background: 'rgba(4,7,30,0.75)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(245,158,11,0.1)',
            zIndex: 50,
          }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d97706, #3b82f6)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-display font-semibold text-white tracking-tight text-lg">ARSS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm font-sans text-white/50 hover:text-white transition-colors duration-200">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin-login"
              className="hidden md:block text-sm font-sans text-white/35 hover:text-white/70 transition-colors duration-200">
              Admin
            </Link>
            <Link to="/upload"
              className="px-4 py-2 rounded-lg text-sm font-display font-semibold text-white transition-all duration-200 hover:shadow-glow-sm"
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
              Get Started
            </Link>
          </div>
        </motion.nav>

        {/* ── Hero ── */}
        <section className="relative pt-28 pb-20 px-6 flex flex-col items-center text-center min-h-screen justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-display font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            AI-Powered Resume Intelligence
          </motion.div>

          {/* TextPressure headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-3xl mx-auto mb-6"
            style={{ height: 110 }}
          >
            <TextPressure
              text="KNOW YOUR SCORE"
              fontFamily="Compressa VF"
              fontUrl="https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2"
              width={true}
              weight={true}
              italic={true}
              textColor="#ffffff"
              minFontSize={28}
            />
          </motion.div>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="max-w-xl text-base md:text-lg font-sans leading-relaxed mb-10"
            style={{ color: 'rgba(255,255,255,0.52)' }}
          >
            Upload your resume and let our AI pipeline analyse it against the job market —
            skill gaps, ATS score, semantic match and an action plan, in under 5 seconds.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/upload"
              className="group relative px-8 py-3.5 rounded-xl font-display font-semibold text-sm text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #d97706, #3b82f6)',
                boxShadow: '0 0 24px rgba(245,158,11,0.3)',
              }}>
              <span className="relative z-10 flex items-center gap-2">
                Analyse My Resume
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <a href="#features"
              className="px-8 py-3.5 rounded-xl font-display font-semibold text-sm transition-colors duration-200 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}>
              See How It Works
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(245,158,11,0.5)' }} />
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats strip ── */}
        <section id="stats" className="relative py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
              style={{ background: 'rgba(245,158,11,0.08)' }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.09 }}
                  className="flex flex-col items-center py-8 px-4 text-center"
                  style={{ background: 'rgba(4,7,30,0.88)', backdropFilter: 'blur(12px)' }}
                >
                  <span className="text-3xl md:text-4xl font-display font-bold mb-1.5"
                    style={{ color: '#fbbf24' }}>
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-xs font-sans tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="relative py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <ScrollFloat
                as="h2"
                animationDuration={0.75}
                stagger={0.035}
                className="font-display font-bold text-white mb-4 block"
              >
                Everything You Need to Get Hired
              </ScrollFloat>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="font-sans text-base max-w-xl mx-auto"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                A complete screening intelligence suite — built to give candidates the edge
                that hiring platforms don't provide.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                >
                  <GlareHover
                    width="100%"
                    height="auto"
                    background="rgba(4,7,30,0.7)"
                    borderRadius="16px"
                    borderColor="rgba(245,158,11,0.1)"
                    glareColor={f.accent}
                    glareOpacity={0.22}
                    glareSize={270}
                    transitionDuration={600}
                    style={{ display: 'block', minHeight: '176px', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="p-6 flex flex-col gap-4 text-left">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${f.accent}15`, color: f.accent }}>
                        {f.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-white text-base mb-1.5">{f.title}</h3>
                        <p className="text-sm font-sans leading-relaxed" style={{ color: 'rgba(255,255,255,0.44)' }}>{f.description}</p>
                      </div>
                    </div>
                  </GlareHover>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="relative py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <ScrollFloat
                as="h2"
                animationDuration={0.75}
                stagger={0.035}
                className="font-display font-bold text-white mb-4 block"
              >
                From Upload to Insight in 4 Steps
              </ScrollFloat>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="font-sans text-base max-w-lg mx-auto"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                No sign-up. No waiting. Just drag, drop, and get your score.
              </motion.p>
            </div>

            <div className="flex flex-col gap-8 relative">
              {/* Connector line */}
              <div className="absolute left-7 top-8 bottom-8 w-px"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.3) 25%, rgba(59,130,246,0.25) 75%, transparent)' }} />

              {STEPS.map((step, i) => (
                <RevealOnScroll key={step.num} direction="left" delay={i * 0.08}>
                  <div className="flex items-start gap-6 pl-1">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-sm z-10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(59,130,246,0.1))',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#fbbf24',
                      }}>
                      {step.num}
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="font-display font-semibold text-white text-lg mb-1.5">{step.title}</h3>
                      <p className="text-sm font-sans leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.44)' }}>{step.body}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <RevealOnScroll direction="up">
              <div className="relative rounded-3xl overflow-hidden p-px"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.45), rgba(59,130,246,0.25), rgba(245,158,11,0.12))' }}>
                <div className="rounded-[23px] p-12 md:p-16 text-center relative overflow-hidden"
                  style={{ background: 'rgba(4,7,30,0.92)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 65%)' }} />

                  <span className="inline-block px-3 py-1 rounded-full text-xs font-display font-semibold tracking-widest uppercase mb-6"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                    Free — No sign-up required
                  </span>

                  <h2 className="font-display font-bold text-white text-3xl md:text-4xl mb-4 leading-tight">
                    Ready to beat the{' '}
                    <span className="text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #3b82f6)' }}>
                      ATS filter?
                    </span>
                  </h2>

                  <p className="font-sans text-base mb-10 max-w-md mx-auto leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.46)' }}>
                    Upload your resume now and get a full AI-powered analysis — score, skill gaps,
                    match percentage and your personal improvement roadmap.
                  </p>

                  <Link to="/upload"
                    className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-display font-semibold text-sm text-white transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #d97706, #3b82f6)',
                      boxShadow: '0 0 28px rgba(245,158,11,0.28)',
                    }}>
                    Analyse My Resume Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d97706, #3b82f6)' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>ARSS</span>
            </div>

            <p className="text-xs font-sans text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
              AI Resume Screening System &mdash; Built for modern hiring intelligence.
            </p>

            <div className="flex items-center gap-6">
              <Link to="/upload" className="text-xs font-sans transition-colors hover:text-white/60"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                Screen Resume
              </Link>
              <Link to="/admin-login" className="text-xs font-sans transition-colors hover:text-white/60"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                Admin
              </Link>
            </div>
          </div>
        </footer>

      </div>{/* end content wrapper */}
    </div>
  );
}
