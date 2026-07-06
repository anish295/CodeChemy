import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LeetCodeUsernameModal from './LeetCodeUsernameModal';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div className="font-mono" style={{ color: 'var(--color-accent-orange)', fontSize: '1.1rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user hasn't set a LeetCode username yet, show the non-dismissable modal
  // overlaid on top of the children so the route renders but is blocked
  if (!user.leetcodeUsername) {
    return (
      <>
        {children}
        <LeetCodeUsernameModal />
      </>
    );
  }

  return children;
}
