import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchCandidates, updateCandidateStatus, setSelectedCandidate } from '../../store/slices/candidatesSlice';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import LoadingSpinner from '../ui/LoadingSpinner';
import CandidateModal from './CandidateModal';

const STATUS_ACTIONS = [
  { status: 'accepted',   label: 'Accept',     color: 'text-accent-400 hover:bg-accent-500/10' },
  { status: 'shortlisted',label: 'Shortlist',  color: 'text-warn-400 hover:bg-warn-500/10' },
  { status: 'rejected',   label: 'Reject',     color: 'text-danger-400 hover:bg-danger-500/10' },
  { status: 'pending',    label: 'Reset',      color: 'text-white/40 hover:bg-white/5' },
];

export default function CandidatesTab({ toast }) {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((state) => state.candidates);
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchCandidates({ page, limit: 10, result: resultFilter, sortBy: 'score', sortOrder: 'desc' }));
  }, [dispatch, page, resultFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (candidate, status, e) => {
    e.stopPropagation();
    setUpdating(candidate._id);
    try {
      await dispatch(updateCandidateStatus({ id: candidate._id, status })).unwrap();
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const openModal = (c) => {
    dispatch(setSelectedCandidate(c));
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-3 items-center">
        <p className="text-sm text-white/60">Filter by AI result:</p>
        {['', 'QUALIFIED', 'SHORTLIST', 'REJECT'].map((r) => (
          <button
            key={r}
            onClick={() => { setResultFilter(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              resultFilter === r
                ? 'bg-brand-600 text-white'
                : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
        <button onClick={load} className="ml-auto btn-secondary px-3 py-1.5 text-xs">
          Refresh
        </button>
      </div>

      {/* Candidate cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner text="Loading candidates..." />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30">
          <p className="text-sm">No candidates found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 cursor-pointer hover:border-brand-500/30 transition-all"
              onClick={() => openModal(c)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {(c.name || 'U')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{c.name || 'Unknown'}</h3>
                    <StatusBadge value={c.result} />
                    <StatusBadge value={c.status} />
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{c.email} · {c.experience || 0} yrs exp · {c.education || '—'}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(c.skills || []).slice(0, 5).map((s) => (
                      <span key={s} className="skill-badge">{s}</span>
                    ))}
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 max-w-xs">
                    <ProgressBar value={c.matchPercentage || 0} label="Match" height="h-1.5" />
                  </div>
                </div>

                {/* Score + actions */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-400">{Math.round((c.score || 0) * 100)}%</p>
                    <p className="text-xs text-white/40">ATS Score</p>
                  </div>

                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {STATUS_ACTIONS.filter((a) => a.status !== c.status).slice(0, 2).map((action) => (
                      <button
                        key={action.status}
                        onClick={(e) => handleStatus(c, action.status, e)}
                        disabled={updating === c._id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${action.color} border border-white/5`}
                      >
                        {updating === c._id ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30">
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-white/50">
            {page} / {pagination.pages}
          </span>
          <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30">
            Next
          </button>
        </div>
      )}

      <CandidateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        candidateId={null}
        toast={toast}
        onUpdate={load}
      />
    </div>
  );
}
