import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeUploader from '../components/upload/ResumeUploader';
import ResultSection from '../components/upload/ResultSection';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import ParticleField from '../components/ui/ParticleField';

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
    <div className="min-h-screen bg-space-950 relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgba(124,58,237,0.08)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(6,182,212,0.05)' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <span className="text-white font-display font-bold text-sm">AI</span>
            </motion.div>
            <span className="font-display font-bold text-white group-hover:text-brand-300 transition-colors duration-300">ARSS</span>
          </Link>
          <div className="flex items-center gap-3">
            {result && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleReset}
                className="btn-secondary text-sm px-4 py-2"
              >
                ← Upload Another
              </motion.button>
            )}
            <Link to="/admin-login" className="text-sm text-white/30 hover:text-white transition-colors duration-300 font-display">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              {result ? (
                <>Your <span className="text-gradient">AI Analysis</span></>
              ) : (
                <>Screen Your <span className="text-gradient">Resume</span></>
              )}
            </h1>
            <p className="text-white/40 text-lg">
              {result
                ? "Here's what our AI found in your resume"
                : 'Upload your resume and get an instant AI-powered ATS score'}
            </p>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <ResumeUploader onResult={handleResult} toast={toast} />
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
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
