import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SubmissionDetail from './pages/SubmissionDetail';
import CompanySheets from './pages/CompanySheets';
import AICodeReview from './pages/AICodeReview';
import AIHintGenerator from './pages/AIHintGenerator';
import VSRanking from './pages/VSRanking';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <Routes>
              {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/submissions" element={
              <ProtectedRoute>
                <AppLayout><SubmissionDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/submissions/:submissionId" element={
              <ProtectedRoute>
                <AppLayout><SubmissionDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/company-sheets" element={
              <ProtectedRoute>
                <AppLayout><CompanySheets /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-review" element={
              <ProtectedRoute>
                <AppLayout><AICodeReview /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-hints" element={
              <ProtectedRoute>
                <AppLayout><AIHintGenerator /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/vs-ranking" element={
              <ProtectedRoute>
                <AppLayout><VSRanking /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />
            </Routes>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
