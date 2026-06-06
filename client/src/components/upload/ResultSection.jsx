import React from 'react';
import { motion } from 'framer-motion';
import ProgressBar from '../ui/ProgressBar';
import StatusBadge from '../ui/StatusBadge';
import AnimatedCounter from '../ui/AnimatedCounter';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function ScoreRing({ value, label, color }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  const colorMap = {
    brand: '#6366f1',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
  };
  const stroke = colorMap[color] || colorMap.brand;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white">
            <AnimatedCounter value={value} suffix="%" />
          </span>
        </div>
      </div>
      <p className="text-xs text-white/50 text-center">{label}</p>
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
    case 'QUALIFIED': return { msg: 'Excellent! Your resume is highly competitive.', color: 'text-accent-400' };
    case 'SHORTLIST': return { msg: 'Good profile. A few improvements could make you stand out.', color: 'text-warn-400' };
    case 'REJECT': return { msg: 'Your resume needs significant improvements to match this role.', color: 'text-danger-400' };
    default: return { msg: 'Analysis complete.', color: 'text-white/60' };
  }
}

export default function ResultSection({ data, onReset }) {
  const atsScore = Math.round((data.score || 0) * 100);
  const matchPct = data.matchPercentage || 0;
  const simPct = Math.round((data.similarity || 0) * 100);
  const scoreColor = getScoreColor(atsScore);
  const { msg, color } = getResultMessage(data.result);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Result banner */}
      <motion.div
        variants={fadeUp}
        className={`glass rounded-2xl p-6 border ${
          data.result === 'QUALIFIED' ? 'border-accent-500/30 bg-accent-500/5' :
          data.result === 'SHORTLIST' ? 'border-warn-500/30 bg-warn-500/5' :
          'border-danger-500/30 bg-danger-500/5'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">
                {data.name || 'Your Resume'}
              </h2>
              <StatusBadge value={data.result} />
            </div>
            <p className={`text-sm ${color}`}>{msg}</p>
          </div>
          <button onClick={onReset} className="btn-secondary text-sm">
            ← Upload Another
          </button>
        </div>
      </motion.div>

      {/* Score rings */}
      <motion.div variants={fadeUp} className="card">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Score Overview</h3>
        <div className="flex justify-around flex-wrap gap-6">
          <ScoreRing value={atsScore} label="ATS Score" color={scoreColor} />
          <ScoreRing value={matchPct} label="Match %" color={getScoreColor(matchPct)} />
          <ScoreRing value={simPct} label="Similarity" color={getScoreColor(simPct)} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{data.experience || 0}</span>
            </div>
            <p className="text-xs text-white/50">Years Exp.</p>
          </div>
        </div>
      </motion.div>

      {/* Detailed scores */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Detailed Analysis</h3>
        <ProgressBar value={atsScore} label="ATS Score" color={scoreColor} height="h-3" />
        <ProgressBar value={matchPct} label="Job Match Percentage" color={getScoreColor(matchPct)} height="h-3" />
        <ProgressBar value={simPct} label="Content Similarity" color={getScoreColor(simPct)} height="h-3" />
        <ProgressBar value={Math.min((data.experience || 0) / 5 * 100, 100)} label="Experience Score" color="brand" height="h-3" />
      </motion.div>

      {/* Skills grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Extracted skills */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-accent-400">✓</span> Detected Skills
            <span className="ml-auto text-xs text-white/30">{(data.skills || []).length} found</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data.skills || []).map((s) => (
              <span key={s} className="skill-badge">{s}</span>
            ))}
            {(data.skills || []).length === 0 && (
              <p className="text-white/30 text-sm">No skills detected</p>
            )}
          </div>
        </div>

        {/* Missing skills */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-danger-400">✗</span> Missing Skills
            <span className="ml-auto text-xs text-white/30">{(data.missingSkills || []).length} missing</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data.missingSkills || []).map((s) => (
              <span key={s} className="skill-badge-missing">{s}</span>
            ))}
            {(data.missingSkills || []).length === 0 && (
              <p className="text-accent-400 text-sm">All required skills found! 🎉</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-3">Strengths</h3>
          {(data.strengths || []).length > 0 ? (
            <ul className="space-y-2">
              {data.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-white/70"
                >
                  <span className="text-accent-400 mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-white/30 text-sm">No specific strengths detected</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-danger-400 uppercase tracking-wider mb-3">Areas to Improve</h3>
          {(data.weaknesses || []).length > 0 ? (
            <ul className="space-y-2">
              {data.weaknesses.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-white/70"
                >
                  <span className="text-danger-400 mt-0.5 flex-shrink-0">→</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-accent-400 text-sm">No major weaknesses found!</p>
          )}
        </div>
      </motion.div>

      {/* AI Suggestions */}
      {(data.suggestions || []).length > 0 && (
        <motion.div variants={fadeUp} className="card border border-brand-500/20 bg-brand-500/5">
          <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Suggestions
          </h3>
          <ul className="space-y-3">
            {data.suggestions.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
              >
                <span className="text-brand-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                <p className="text-sm text-white/70">{s}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Candidate info */}
      <motion.div variants={fadeUp} className="card">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Extracted Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Name', value: data.name || '—' },
            { label: 'Email', value: data.email || '—' },
            { label: 'Phone', value: data.phone || '—' },
            { label: 'Education', value: data.education || '—' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-white/40 mb-1">{item.label}</p>
              <p className="text-sm text-white font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={fadeUp} className="text-center py-4">
        <p className="text-white/40 text-sm mb-4">
          Want to improve your score? Add the missing skills and re-upload.
        </p>
        <button onClick={onReset} className="btn-primary">
          Upload Improved Resume →
        </button>
      </motion.div>
    </motion.div>
  );
}
