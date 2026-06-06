import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCandidates, setSelectedCandidate } from '../../store/slices/candidatesSlice';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import LoadingSpinner from '../ui/LoadingSpinner';
import CandidateModal from './CandidateModal';
import { adminAPI } from '../../api/admin';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Upload Date' },
  { value: 'score', label: 'ATS Score' },
  { value: 'name', label: 'Name' },
  { value: 'matchPercentage', label: 'Match %' },
];

export default function ResumeDatabaseTab({ toast }) {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((state) => state.candidates);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchCandidates({ page, limit: 10, search, status: statusFilter, sortBy, sortOrder }));
  }, [dispatch, page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openModal = (candidate) => {
    dispatch(setSelectedCandidate(candidate));
    setSelectedId(candidate._id);
    setModalOpen(true);
  };

  const handleDownload = (id, e) => {
    e.stopPropagation();
    window.open(adminAPI.getDownloadUrl(id), '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, skill..."
            className="input-field pl-9"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); setPage(1); }}
          className="btn-secondary px-3 py-2.5"
          title="Toggle sort order"
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </button>

        <button onClick={load} className="btn-secondary px-3 py-2.5" title="Refresh">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner text="Loading resumes..." />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No resumes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header text-left">Candidate</th>
                  <th className="table-header text-left">Skills</th>
                  <th className="table-header text-center">ATS Score</th>
                  <th className="table-header text-center">Match</th>
                  <th className="table-header text-center">AI Result</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Uploaded</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {list.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row cursor-pointer"
                      onClick={() => openModal(c)}
                    >
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-white">{c.name || 'Unknown'}</p>
                          <p className="text-xs text-white/40">{c.email || '—'}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(c.skills || []).slice(0, 3).map((s) => (
                            <span key={s} className="skill-badge">{s}</span>
                          ))}
                          {(c.skills || []).length > 3 && (
                            <span className="skill-badge">+{c.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-brand-400">
                          {Math.round((c.score || 0) * 100)}%
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="w-24">
                          <ProgressBar value={c.matchPercentage || 0} showValue={false} height="h-1.5" />
                          <p className="text-xs text-center text-white/50 mt-0.5">{c.matchPercentage || 0}%</p>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge value={c.result} />
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge value={c.status} />
                      </td>
                      <td className="table-cell text-center text-xs text-white/40">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(c); }}
                            className="p-1.5 rounded-lg text-white/40 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                            title="View details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDownload(c._id, e)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                            title="Download resume"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40">
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Candidate detail modal */}
      <CandidateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        candidateId={selectedId}
        toast={toast}
        onUpdate={load}
      />
    </div>
  );
}
