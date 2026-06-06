import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchStats } from '../../store/slices/candidatesSlice';
import AnimatedCounter from '../ui/AnimatedCounter';
import LoadingSpinner from '../ui/LoadingSpinner';

const STAT_CARDS = [
  { key: 'total',       label: 'Total Resumes',    color: 'brand',  icon: '📄' },
  { key: 'shortlisted', label: 'Shortlisted',       color: 'yellow', icon: '⭐' },
  { key: 'accepted',    label: 'Accepted',           color: 'green',  icon: '✅' },
  { key: 'rejected',    label: 'Rejected',           color: 'red',    icon: '❌' },
  { key: 'qualified',   label: 'AI Qualified',       color: 'purple', icon: '🤖' },
  { key: 'avgScore',    label: 'Avg ATS Score',      color: 'brand',  icon: '📊', suffix: '%' },
  { key: 'recentUploads', label: 'Last 7 Days',      color: 'green',  icon: '📈' },
  { key: 'pending',     label: 'Pending Review',     color: 'yellow', icon: '⏳' },
];

const COLOR_MAP = {
  brand: 'from-brand-500/20 to-brand-600/10 border-brand-500/30 text-brand-400',
  yellow: 'from-warn-500/20 to-warn-600/10 border-warn-500/30 text-warn-400',
  green: 'from-accent-500/20 to-accent-600/10 border-accent-500/30 text-accent-400',
  red: 'from-danger-500/20 to-danger-600/10 border-danger-500/30 text-danger-400',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function OverviewTab({ toast }) {
  const dispatch = useDispatch();
  const { stats, statsLoading } = useSelector((state) => state.candidates);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  if (statsLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const s = stats || {};

  const pieData = [
    { name: 'Shortlisted', value: s.shortlisted || 0 },
    { name: 'Pending',     value: s.pending || 0 },
    { name: 'Accepted',    value: s.accepted || 0 },
    { name: 'Rejected',    value: s.rejected || 0 },
  ].filter((d) => d.value > 0);

  const barData = (s.scoreDistribution || []).map((d) => ({
    range: `${d._id}–${Number(d._id) + 25}%`,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STAT_CARDS.map((card) => (
          <motion.div
            key={card.key}
            variants={item}
            className={`stat-card bg-gradient-to-br border ${COLOR_MAP[card.color]}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-2xl font-bold ${COLOR_MAP[card.color].split(' ').pop()}`}>
                <AnimatedCounter value={s[card.key] || 0} suffix={card.suffix || ''} />
              </span>
            </div>
            <p className="text-xs text-white/50 font-medium">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — score distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Score Distribution</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">
              No data yet
            </div>
          )}
        </motion.div>

        {/* Pie chart — status breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Candidate Status Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">
              No data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Processing status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="text-sm font-semibold text-white mb-4">AI Processing Pipeline Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Resume Parser',    status: 'active',   color: 'accent' },
            { label: 'NLP Extractor',    status: 'active',   color: 'accent' },
            { label: 'TF-IDF Matcher',   status: 'active',   color: 'accent' },
            { label: 'AI Classifier',    status: 'active',   color: 'accent' },
          ].map((service) => (
            <div key={service.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-xs text-white/70">{service.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
