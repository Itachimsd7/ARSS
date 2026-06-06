import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeUploader from '../components/upload/ResumeUploader';
import ResultSection from '../components/upload/ResultSection';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function UploadPage() {
  const [result, setResult] = useState(null);
  const { toasts, removeToast, toast } = useToast();

  const handleResult = (data) => {
    setResult(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-hero-gradient bg-grid">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <span className="font-bold text-white">ARSS</span>
          </Link>
          <div className="flex items-center gap-3">
            {result && (
              <button onClick={handleReset} className="btn-secondary text-sm px-4 py-2">
                ← Upload Another
              </button>
            )}
            <Link to="/admin-login" className="text-sm text-white/40 hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl font-black text-white mb-3">
              {result ? 'Your AI Analysis' : 'Screen Your Resume'}
            </h1>
            <p className="text-white/50">
              {result
                ? 'Here\'s what our AI found in your resume'
                : 'Upload your resume and get an instant AI-powered ATS score'}
            </p>
          </motion.div>

          {/* Upload section — always visible until result */}
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ResumeUploader onResult={handleResult} toast={toast} />
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ResultSection data={result} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
