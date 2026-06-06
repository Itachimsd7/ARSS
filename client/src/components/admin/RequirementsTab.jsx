import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchConfig, saveConfig, clearSaved } from '../../store/slices/configSlice';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function RequirementsTab({ toast }) {
  const dispatch = useDispatch();
  const { data, loading, saving, saved } = useSelector((state) => state.config);

  const [form, setForm] = useState({
    job_description: '',
    skills: [],
    min_experience: 1,
    education: 'btech',
    atsThresholds: { qualified: 75, shortlist: 40 },
    experiencePriority: 'medium',
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  useEffect(() => {
    if (data) {
      setForm({
        job_description: data.job_description || '',
        skills: data.skills || [],
        min_experience: data.min_experience || 1,
        education: data.education || 'btech',
        atsThresholds: data.atsThresholds || { qualified: 75, shortlist: 40 },
        experiencePriority: data.experiencePriority || 'medium',
      });
    }
  }, [data]);

  useEffect(() => {
    if (saved) {
      toast.success('Requirements saved successfully');
      dispatch(clearSaved());
    }
  }, [saved, toast, dispatch]);

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSave = () => {
    dispatch(saveConfig(form));
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner text="Loading configuration..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Job Description */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h3 className="text-sm font-semibold text-white mb-1">Job Description</h3>
        <p className="text-xs text-white/40 mb-3">Used by the AI to compute resume match scores</p>
        <textarea
          value={form.job_description}
          onChange={(e) => setForm({ ...form, job_description: e.target.value })}
          rows={5}
          className="input-field resize-none"
          placeholder="Describe the ideal candidate and required skills..."
        />
      </motion.div>

      {/* Required Skills */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h3 className="text-sm font-semibold text-white mb-1">Required Skills</h3>
        <p className="text-xs text-white/40 mb-3">Skills the AI will check for in each resume</p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Add a skill (press Enter)"
            className="input-field flex-1"
          />
          <button onClick={addSkill} className="btn-primary px-4">Add</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {form.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/25">
              {s}
              <button onClick={() => removeSkill(s)} className="text-brand-400/60 hover:text-danger-400 transition-colors">×</button>
            </span>
          ))}
          {form.skills.length === 0 && <p className="text-white/30 text-sm">No skills added yet</p>}
        </div>
      </motion.div>

      {/* ATS Thresholds */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 className="text-sm font-semibold text-white mb-1">ATS Score Thresholds</h3>
        <p className="text-xs text-white/40 mb-4">Scores are 0–100. Candidates below shortlist threshold are auto-rejected.</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/60">Qualified threshold</label>
              <span className="text-xs font-semibold text-accent-400">{form.atsThresholds.qualified}%</span>
            </div>
            <input
              type="range" min={50} max={95} step={5}
              value={form.atsThresholds.qualified}
              onChange={(e) => setForm({ ...form, atsThresholds: { ...form.atsThresholds, qualified: Number(e.target.value) } })}
              className="w-full accent-brand-500"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/60">Shortlist threshold</label>
              <span className="text-xs font-semibold text-warn-400">{form.atsThresholds.shortlist}%</span>
            </div>
            <input
              type="range" min={10} max={70} step={5}
              value={form.atsThresholds.shortlist}
              onChange={(e) => setForm({ ...form, atsThresholds: { ...form.atsThresholds, shortlist: Number(e.target.value) } })}
              className="w-full accent-warn-500"
            />
          </div>
        </div>

        {/* Visual threshold display */}
        <div className="mt-4 h-6 rounded-full overflow-hidden flex text-xs">
          <div style={{ width: `${form.atsThresholds.shortlist}%` }} className="bg-danger-500/40 flex items-center justify-center text-danger-300">
            Reject
          </div>
          <div style={{ width: `${form.atsThresholds.qualified - form.atsThresholds.shortlist}%` }} className="bg-warn-500/40 flex items-center justify-center text-warn-300">
            Shortlist
          </div>
          <div className="flex-1 bg-accent-500/40 flex items-center justify-center text-accent-300">
            Qualified
          </div>
        </div>
      </motion.div>

      {/* Experience & Education */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Experience & Education</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Minimum Experience (years)</label>
            <input
              type="number" min={0} max={20}
              value={form.min_experience}
              onChange={(e) => setForm({ ...form, min_experience: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Required Education</label>
            <select
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="input-field"
            >
              <option value="btech">B.Tech / B.E</option>
              <option value="mtech">M.Tech</option>
              <option value="bsc">B.Sc</option>
              <option value="msc">M.Sc</option>
              <option value="mca">MCA</option>
              <option value="phd">PhD</option>
              <option value="">Any</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Experience Priority</label>
            <select
              value={form.experiencePriority}
              onChange={(e) => setForm({ ...form, experiencePriority: e.target.value })}
              className="input-field"
            >
              <option value="low">Low (10% weight)</option>
              <option value="medium">Medium (30% weight)</option>
              <option value="high">High (50% weight)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <>
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Requirements
            </>
          )}
        </button>
      </div>
    </div>
  );
}
