import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { verifyToken } from '../store/slices/authSlice';
import AdminLayout from '../layouts/AdminLayout';
import OverviewTab from '../components/admin/OverviewTab';
import ResumeDatabaseTab from '../components/admin/ResumeDatabaseTab';
import CandidatesTab from '../components/admin/CandidatesTab';
import RequirementsTab from '../components/admin/RequirementsTab';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    dispatch(verifyToken());
  }, [dispatch]);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':    return <OverviewTab toast={toast} />;
      case 'resumes':     return <ResumeDatabaseTab toast={toast} />;
      case 'candidates':  return <CandidatesTab toast={toast} />;
      case 'config':      return <RequirementsTab toast={toast} />;
      default:            return <OverviewTab toast={toast} />;
    }
  };

  return (
    <>
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTab()}
      </AdminLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
