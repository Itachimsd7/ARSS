import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { updateCandidateStatus, deleteCandidate } from '../../store/slices/candidatesSlice';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import { adminAPI } from '../../api/admin';

export default function CandidateModal({ isOpen, onClose, candidateId, toast, onUpdate }) {
  const dispatch = useDispatch();
  const { selectedCandidate: candidate } = useSelector((state) => state.candidates);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (candidate) setNotes(candidate.adminNotes || '');
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      await dispatch(updateCandidateStatus({ id: candidate._id, status, adminNotes: notes })).unwrap();
      toast.success(`Candidate marked as ${status}`);
      onUpdate?.();
    } catch (err) {
      toast.error(err || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await dispatch(deleteCandidate(candidate._id)).unwrap();
      toast.success('Candidate deleted');
      onClose();
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to delete candidate');
    }
  };

  const scoreColor = candidate.matchPercentage >= 75 ? 'green' : candidate.matchPercentage >= 50 ? 'brand' : candidate.matchPercentage >= 30 ? 'yellow' : 'red';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-glow-md"
          >
            {/* Header */}
            <div className="sticky top-0 glass-dark border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-white">{candidate.name || 'Unknown Candidate'}</h2>
                <p className="text-xs text-white/40">{candidate.email} · {candidate.phone}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-brand-400">{Math.round((candidate.score || 0) * 100)}%</p>
                  <p className="text-xs text-white/50 mt-1">ATS Score</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-accent-400">{candidate.matchPercentage || 0}%</p>
                  <p className="text-xs text-white/50 mt-1">Match %</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-white mt-1">
                    <StatusBadge value={candidate.result} />
                  </p>
                  <p className="text-xs text-white/50 mt-2">AI Result</p>
                </div>
              </div>

              {/* Match bar */}
              <ProgressBar value={candidate.matchPercentage || 0} label="Resume Match" color={scoreColor} height="h-3" />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Education</p>
                  <p className="text-white font-medium">{candidate.education || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Experience</p>
                  <p className="text-white font-medium">{candidate.experience || 0} years</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">File</p>
                  <p className="text-white font-medium truncate">{candidate.fileName || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Uploaded</p>
                  <p className="text-white font-medium">{new Date(candidate.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Extracted Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(candidate.skills || []).map((s) => (
                    <span key={s} className="skill-badge">{s}</span>
                  ))}
                  {(candidate.skills || []).length === 0 && <span className="text-white/30 text-sm">None detected</span>}
                </div>
              </div>

              {/* Missing skills */}
              {(candidate.missingSkills || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.missingSkills.map((s) => (
                      <span key={s} className="skill-badge-missing">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                {(candidate.strengths || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {candidate.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                          <span className="text-accent-400 mt-0.5">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(candidate.weaknesses || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-danger-400 uppercase tracking-wider mb-2">Weaknesses</p>
                    <ul className="space-y-1">
                      {candidate.weaknesses.map((s, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                          <span className="text-danger-400 mt-0.5">✗</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {(candidate.suggestions || []).length > 0 && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">AI Suggestions</p>
                  <ul className="space-y-1.5">
                    {candidate.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                        <span className="text-brand-400 mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this candidate..."
                  className="input-field resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={updating}
                  className="btn-success"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => handleStatusUpdate('shortlisted')}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-warn-500/20 hover:bg-warn-500/30 text-warn-400 font-medium text-sm border border-warn-500/30 transition-all"
                >
                  ⭐ Shortlist
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="btn-danger"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => window.open(adminAPI.getDownloadUrl(candidate._id), '_blank')}
                  className="btn-secondary ml-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    confirmDelete
                      ? 'bg-danger-600 text-white'
                      : 'text-white/30 hover:text-danger-400 hover:bg-danger-500/10'
                  }`}
                >
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
