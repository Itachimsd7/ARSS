import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI } from '../../api/resumes';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] };

export default function ResumeUploader({ onResult, toast }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(''); // 'uploading' | 'processing' | ''

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      const err = rejected[0].errors[0];
      toast.error(err.code === 'file-too-large' ? 'File too large. Max 10 MB.' : 'Only PDF and DOCX files are accepted.');
      return;
    }
    if (accepted.length > 0) {
      setFile(accepted[0]);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setStage('uploading');

    try {
      const result = await resumeAPI.upload(file, (e) => {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
        if (pct === 100) setStage('processing');
      });

      if (result.success) {
        toast.success('Resume processed successfully!');
        onResult(result.data);
      } else {
        toast.error(result.message || 'Processing failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setStage('');
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setStage('');
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragActive
            ? 'border-brand-400 bg-brand-500/10 shadow-glow-sm'
            : file
            ? 'border-accent-500/50 bg-accent-500/5'
            : 'border-white/15 bg-white/3 hover:border-brand-500/50 hover:bg-brand-500/5'
          }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <AnimatePresence mode="wait">
            {isDragActive ? (
              <motion.div
                key="drag"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-5xl animate-bounce">📂</div>
                <p className="text-brand-400 font-semibold">Drop it here!</p>
              </motion.div>
            ) : file ? (
              <motion.div
                key="file"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-5xl">
                  {file.name.endsWith('.pdf') ? '📄' : '📝'}
                </div>
                <div>
                  <p className="font-semibold text-white">{file.name}</p>
                  <p className="text-sm text-white/40">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="text-xs text-danger-400 hover:text-danger-300 transition-colors"
                >
                  Remove file
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Drag & drop your resume here
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    or <span className="text-brand-400 underline">browse files</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  {['PDF', 'DOCX'].map((fmt) => (
                    <span key={fmt} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/50">
                      {fmt}
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/50">
                    Max 10 MB
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-sm text-white/70">
                  {stage === 'processing' ? 'AI is analyzing your resume...' : 'Uploading...'}
                </span>
              </div>
              <span className="text-sm font-semibold text-brand-400">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                animate={{ width: stage === 'processing' ? '100%' : `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {stage === 'processing' && (
              <div className="flex gap-2 flex-wrap">
                {['Parsing text', 'Extracting skills', 'Computing similarity', 'Classifying'].map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className="text-xs text-white/40 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent-400" />
                    {s}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full py-4 text-base"
      >
        {uploading ? (
          <>
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            {stage === 'processing' ? 'AI Processing...' : 'Uploading...'}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze with AI
          </>
        )}
      </button>

      {/* Privacy note */}
      <p className="text-center text-xs text-white/25">
        🔒 Your resume is processed securely and never shared with third parties.
      </p>
    </div>
  );
}
