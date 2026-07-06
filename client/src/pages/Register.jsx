import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Cpu, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // This now calls the fixed AuthContext which securely points to port 5002
      await register(name, email, password);
      navigate('/'); // Redirects to dashboard on success
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
    backgroundColor: isDark ? 'var(--color-dark-surface)' : 'var(--color-light-surface)',
    color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        animation: 'var(--animate-slide-up)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Cpu size={36} style={{ color: 'var(--color-accent-orange)' }} />
            <span style={{ fontSize: '2rem', fontWeight: 800, color: isDark ? 'var(--color-dark-text)' : 'var(--color-accent-orange)' }}>
              CodeChemy
            </span>
          </div>
          <p style={{
            fontSize: '0.85rem',
            color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            Begin your coding transformation
          </p>
        </div>

        <div className={isDark ? 'card-dark' : 'card-light'} style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            Create Account
          </h2>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-accent-red)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(229,62,62,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }} />
              <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }} />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }} />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-glass-primary"
              style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}>
              {loading ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent-orange)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}