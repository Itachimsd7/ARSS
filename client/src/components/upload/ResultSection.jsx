import React from 'react';
import { motion } from 'framer-motion';
import RevealOnScroll, { RevealChild } from '../ui/RevealOnScroll';
import AnimatedCounter from '../ui/AnimatedCounter';
import GlassCard from '../ui/GlassCard';
import MagneticButton from '../ui/MagneticButton';

function ScoreRing({ value, label, color }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  const colorMap = {
    brand: '#7c3aed',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#f43f5e',
  };
  const stroke = colorMap[color] || colorMap.brand;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28 group">
        {/* Glow behind ring */}
        <div className="absolute inset-0 rounded-full blur-[20px] opacity-20 transition-opacity duration-300 group-hover:opacity-40"
             style={{ background: stroke }} />
             
        <svg className="w-28 h-28 -rotate-90 relative z-10" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            <AnimatedCounter value={value} suffix="%" />
          </span>
        </div>
      </div>
      <p className="text-xs font-display font-medium text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function PremiumProgressBar({ value, label, color }) {
  const colorMap = {
    brand: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
    green: 'linear-gradient(90deg, #10b981, #34d399)',
    yellow: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    red: 'linear-gradient(90deg, #f43f5e, #fb7185)',
  };
  const bg = colorMap[color] || colorMap.brand;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-display font-medium mb-2">
        <span className="text-white/70">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden relative border border-white/5">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: bg }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
}

function getScoreColor(value) {
  if (value >= 75) return 'green';
  if (value >= 50) return 'brand';
  if (value >= 30) return 'yellow';
  return 'red';
}

function getResultMessage(result) {
  switch (result) {
    case 'QUALIFIED': return { msg: 'Excellent match! Your profile is highly competitive.', color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/30' };
    case 'SHORTLIST': return { msg: 'Good potential. Address skill gaps to improve your chances.', color: 'text-warn-400', bg: 'bg-warn-500/10', border: 'border-warn-500/30' };
    case 'REJECT': return { msg: 'Significant gaps found. Consider tailoring your resume more closely.', color: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30' };
    default: return { msg: 'Analysis complete.', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' };
  }
}

export default function ResultSection({ data, onReset }) {
  const atsScore = Math.round((data.score || 0) * 100);
  const matchPct = data.matchPercentage || 0;
  const simPct = Math.round((data.similarity || 0) * 100);
  const scoreColor = getScoreColor(atsScore);
  const { msg, color, bg, border } = getResultMessage(data.result);

  return (
    <div className="space-y-6">
      {/* Result Banner */}
      <RevealOnScroll direction="down">
        <div className={`glass-glow rounded-3xl p-8 border ${border} ${bg} relative overflow-hidden`}>
          <div className="absolute inset-0 shimmer opacity-20" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  {data.name || 'Your Resume'}
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${border} ${color} bg-black/20`}>
                  {data.result}
                </div>
              </div>
              <p className={`text-base font-sans ${color}`}>{msg}</p>
            </div>
            <MagneticButton variant="secondary" onClick={onReset} className="flex-shrink-0">
              ← Analyze Another
            </MagneticButton>
          </div>
        </div>
      </RevealOnScroll>

      {/* Primary Metrics Grid */}
      <RevealOnScroll direction="up" stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealChild>
          <GlassCard tiltIntensity={5} glowColor="139,92,246" className="h-full flex flex-col justify-center">
            <h3 className="text-xs font-display font-bold text-white/50 uppercase tracking-widest mb-8 text-center">Score Overview</h3>
            <div className="flex justify-around flex-wrap gap-8">
              <ScoreRing value={atsScore} label="ATS Score" color={scoreColor} />
              <ScoreRing value={matchPct} label="Job Match" color={getScoreColor(matchPct)} />
              <ScoreRing value={simPct} label="Similarity" color={getScoreColor(simPct)} />
            </div>
          </GlassCard>
        </RevealChild>

        <RevealChild>
          <GlassCard tiltIntensity={5} className="h-full">
            <h3 className="text-xs font-display font-bold text-white/50 uppercase tracking-widest mb-6">Detailed Analysis</h3>
            <div className="space-y-2">
              <PremiumProgressBar value={atsScore} label="ATS Pipeline Score" color={scoreColor} />
              <PremiumProgressBar value={matchPct} label="Keyword Match Percentage" color={getScoreColor(matchPct)} />
              <PremiumProgressBar value={simPct} label="Semantic Content Similarity" color={getScoreColor(simPct)} />
              <PremiumProgressBar value={Math.min((data.experience || 0) / 5 * 100, 100)} label="Experience Weight (capped at 5yrs)" color="brand" />
            </div>
          </GlassCard>
        </RevealChild>
      </RevealOnScroll>

      {/* Skills Analysis */}
      <RevealOnScroll direction="up" stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealChild>
          <GlassCard tiltIntensity={3} glowColor="6,182,212">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-display font-semibold text-cyan-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detected Skills
              </h3>
              <span className="text-xs font-mono text-cyan-400/50 bg-cyan-400/10 px-2 py-1 rounded-full">
                {(data.skills || []).length} found
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.skills || []).map((s) => (
                <span key={s} className="skill-badge hover:-translate-y-0.5">{s}</span>
              ))}
              {(data.skills || []).length === 0 && (
                <p className="text-white/30 text-sm font-sans italic">No relevant skills detected.</p>
              )}
            </div>
          </GlassCard>
        </RevealChild>

        <RevealChild>
          <GlassCard tiltIntensity={3} glowColor="244,63,94">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-display font-semibold text-danger-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Missing Skills
              </h3>
              <span className="text-xs font-mono text-danger-400/50 bg-danger-400/10 px-2 py-1 rounded-full">
                {(data.missingSkills || []).length} gaps
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.missingSkills || []).map((s) => (
                <span key={s} className="skill-badge-missing hover:-translate-y-0.5">{s}</span>
              ))}
              {(data.missingSkills || []).length === 0 && (
                <p className="text-accent-400 text-sm font-sans font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All required core skills found!
                </p>
              )}
            </div>
          </GlassCard>
        </RevealChild>
      </RevealOnScroll>

      {/* Qualitative Feedback */}
      <RevealOnScroll direction="up" stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealChild>
          <GlassCard>
            <h3 className="text-xs font-display font-bold text-accent-400 uppercase tracking-widest mb-4">Strengths</h3>
            {(data.strengths || []).length > 0 ? (
              <ul className="space-y-3">
                {data.strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-white/80 font-sans"
                  >
                    <span className="text-accent-400 mt-0.5 flex-shrink-0 bg-accent-500/20 p-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-white/30 text-sm italic">No specific standout strengths detected.</p>
            )}
          </GlassCard>
        </RevealChild>

        <RevealChild>
          <GlassCard>
            <h3 className="text-xs font-display font-bold text-warn-400 uppercase tracking-widest mb-4">Areas to Improve</h3>
            {(data.weaknesses || []).length > 0 ? (
              <ul className="space-y-3">
                {data.weaknesses.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-white/80 font-sans"
                  >
                    <span className="text-warn-400 mt-0.5 flex-shrink-0 bg-warn-500/20 p-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-white/30 text-sm italic">No major weaknesses identified.</p>
            )}
          </GlassCard>
        </RevealChild>
      </RevealOnScroll>

      {/* AI Suggestions */}
      {(data.suggestions || []).length > 0 && (
        <RevealOnScroll direction="up">
          <div className="relative rounded-3xl overflow-hidden group">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-cyan-500 to-brand-500 opacity-20 pointer-events-none rounded-3xl" />
            <div className="absolute inset-[1px] bg-space-950/90 backdrop-blur-xl rounded-[23px] pointer-events-none" />
            
            <div className="relative p-8">
              <h3 className="text-sm font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Action Plan
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.suggestions.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-brand-500/30 transition-colors"
                  >
                    <span className="text-brand-400 font-display font-bold text-lg flex-shrink-0 w-6">0{i + 1}</span>
                    <p className="text-sm text-white/80 font-sans leading-relaxed">{s}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* Extracted Data Footer */}
      <RevealOnScroll direction="fade" delay={1}>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/30 bg-black/20 rounded-xl p-4 border border-white/5">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {data.email || 'No email found'}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {data.phone || 'No phone found'}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v7a7 7 0 0014 0v-7" /></svg>
            {data.education || 'Education parsing pending'}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1 font-bold text-white/50">
            {data.experience || 0} Yrs Exp
          </span>
        </div>
      </RevealOnScroll>
    </div>
  );
}
