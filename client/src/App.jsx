import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const LandingPage    = lazy(() => import('./pages/LandingPage.jsx'))
const UploadPage     = lazy(() => import('./pages/UploadPage.jsx'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))

function Fallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#030014',
      color: '#8b5cf6',
      fontSize: 16,
      gap: 12,
      fontFamily: 'Space Grotesk, system-ui, sans-serif',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid rgba(139,92,246,0.2)',
        borderTopColor: '#8b5cf6',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth)
  return token ? children : <Navigate to="/admin-login" replace />
}

function PublicAdminRoute({ children }) {
  const { token } = useSelector((state) => state.auth)
  return token ? <Navigate to="/admin-dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route
            path="/admin-login"
            element={
              <PublicAdminRoute>
                <AdminLoginPage />
              </PublicAdminRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
