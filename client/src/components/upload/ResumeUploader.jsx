import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI } from '../../api/resumes';
import GlassCard from '../ui/GlassCard';
import MagneticButton from '../ui/MagneticButton';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ResumeUploader({ onResult, toast }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateFile = (f) => {
    if (!f) return false;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(f.type)) {
      toast.error('Only PDF and DOCX files are supported');
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be smaller than 5MB');
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(10);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const interval = setInterval(() => {
        setProgress((p) => (p < 85 ? p + Math.random() * 15 : p));
      }, 500);

      const response = await resumeAPI.upload(formData);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setLoading(false);
        onResult(response.data);
        toast.success('Resume analyzed successfully!');
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setProgress(0);
      toast.error(err.response?.data?.message || 'Error analyzing resume');
    }
  };

  return (
    <GlassCard className="w-full relative" tiltIntensity={5}>
      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-full relative rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'bg-brand-500/10 border-brand-500/50 shadow-glow-sm'
                  : 'bg-white/[0.02] border-white/10 hover:border-brand-500/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Animated Dashed Border using SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" rx="16" fill="none"
                  stroke={isDragging ? '#06b6d4' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="2" strokeDasharray="8 8"
                  className={isDragging ? 'animate-[dash_1s_linear_infinite]' : ''}
                />
              </svg>

              <style>{`@keyframes dash { to { stroke-dashoffset: -16; } }`}</style>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx"
              />

              <motion.div
                animate={isDragging ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative cursor-hover"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}
              >
                {/* Orbital glow */}
                {isDragging && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-2 rounded-full border border-brand-500/30"
                  >
                     <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-cyan-400" />
                  </motion.div>
                )}

                <svg className={`w-10 h-10 transition-colors ${isDragging ? 'text-cyan-400' : 'text-brand-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </motion.div>

              <h3 className="text-2xl font-display font-semibold text-white mb-2">
                {isDragging ? 'Drop it here!' : 'Upload your resume'}
              </h3>
              <p className="text-white/40 mb-8 font-sans">
                Drag and drop your PDF or DOCX file, or click to browse. Max 5MB.
              </p>

              <MagneticButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-display transition-all"
              >
                Browse Files
              </MagneticButton>
            </div>

            {/* File Preview */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full mt-6"
                >
                  <div className="glass-glow p-4 rounded-xl flex items-center justify-between border border-brand-500/20">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate font-sans">{file.name}</p>
                        <p className="text-xs text-white/40 font-mono mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-2 text-white/40 hover:text-danger-400 hover:bg-danger-400/10 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <MagneticButton
                    variant="primary"
                    onClick={handleSubmit}
                    className="w-full mt-4 py-4 font-display font-semibold text-lg group relative overflow-hidden"
                  >
                    {/* Animated gradient sweep */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Resume Now
                    </span>
                  </MagneticButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <LoadingSpinner size="lg" />
            <h3 className="text-2xl font-display font-semibold text-white mt-8 mb-2">
              <span className="text-gradient">AI is analyzing</span> your resume
            </h3>
            <p className="text-white/40 text-sm max-w-sm font-sans mb-8">
              Extracting skills, evaluating experience, and computing TF-IDF match scores...
            </p>

            <div className="w-full max-w-md relative">
              <div className="flex justify-between text-xs text-white/50 font-mono mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden relative">
                {/* Track glow */}
                <div className="absolute inset-0 shadow-inner-glow pointer-events-none" />
                {/* Progress bar */}
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    boxShadow: '0 0 10px rgba(6,182,212,0.5)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.5 }}
                >
                   <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
