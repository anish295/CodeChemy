import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/layout/Header';
import api from '../api/axios';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Lightbulb, Send, Loader2, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'go', 'rust', 'typescript'];
const COOKIE_KEY = 'codechemy_preferred_language';
const COOKIE_DAYS = 30;
const MAX_FOLLOWUPS = 5;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function AIHintGenerator() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const savedLang = getCookie(COOKIE_KEY);
  const defaultLang = savedLang && LANGUAGES.includes(savedLang) ? savedLang : 'python';

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(defaultLang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Conversation thread: array of { role: 'hint'|'followup', text }
  const [thread, setThread] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const threadEndRef = useRef(null);

  const cardClass = isDark ? 'card-dark' : 'card-light';

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCookie(COOKIE_KEY, lang, COOKIE_DAYS);
  };

  // Get initial hint
  const handleHint = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setThread([]); // Reset conversation on new code submission
    try {
      const res = await api.post('/ai/hint', { code, language });
      setThread([{ role: 'hint', text: res.data.hint, label: 'Initial Hint' }]);
      setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Hint generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit follow-up question
  const handleFollowUp = async () => {
    if (!followUpInput.trim() || followUpLoading) return;

    const followUpCount = thread.filter(t => t.role === 'followup').length;
    if (followUpCount >= MAX_FOLLOWUPS) return;

    const question = followUpInput.trim();
    setFollowUpInput('');
    setFollowUpLoading(true);

    // Add user question to thread
    setThread(prev => [...prev, { role: 'user', text: question }]);

    // Get the last hint for context
    const lastHint = [...thread].reverse().find(t => t.role === 'hint' || t.role === 'followup');

    try {
      const res = await api.post('/ai/hint', {
        code,
        language,
        followUp: question,
        previousHint: lastHint?.text || '',
      });
      setThread(prev => [...prev, { role: 'followup', text: res.data.hint, label: `Follow-up ${followUpCount + 1}` }]);
      setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setThread(prev => prev.slice(0, -1)); // Remove user question on error
      setError(err.response?.data?.message || 'Follow-up failed');
    } finally {
      setFollowUpLoading(false);
    }
  };

  const followUpCount = thread.filter(t => t.role === 'followup').length;
  const maxReached = followUpCount >= MAX_FOLLOWUPS;
  const hasHint = thread.length > 0;

  return (
    <div className="page-enter">
      <Header title="AI Hint Generator" subtitle="Get a gentle nudge without spoiling the solution" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Input Panel */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lightbulb size={20} style={{ color: 'var(--color-accent-orange)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                Your Code
              </h3>
            </div>
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="btn-glass"
              style={{
                padding: '6px 12px', borderRadius: '8px',
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem', outline: 'none',
              }}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div data-color-mode="dark" style={{ flex: 1, minHeight: '280px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}` }}>
            <CodeEditor
              value={code}
              language={language}
              placeholder="Paste the code you're stuck on..."
              onChange={(evn) => setCode(evn.target.value)}
              padding={16}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                backgroundColor: '#1E1E1E',
                minHeight: '280px',
              }}
            />
          </div>

          {error && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            onClick={handleHint}
            disabled={loading || !code.trim()}
            className="btn-glass-primary"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: '16px', padding: '12px', borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !code.trim() ? 0.6 : 1,
            }}
          >
            {loading ? <><Loader2 size={18} className="spin" /> Thinking...</> : <><Lightbulb size={16} /> Get Hint</>}
          </button>
        </div>

        {/* Hint Output + Follow-up thread */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          {loading && !hasHint ? (
            /* Spinner while loading initial hint */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <Loader2 size={40} className="spin" style={{ color: 'var(--color-accent-orange)' }} />
              <p style={{ fontSize: '0.9rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                Generating your hint…
              </p>
            </div>
          ) : !hasHint ? (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px' }}>
              <Lightbulb size={48} style={{ color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', textAlign: 'center' }}>
                Paste your code and click "Get Hint" to receive a conceptual nudge without spoiling the solution.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation thread */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {thread.map((entry, idx) => {
                  if (entry.role === 'user') {
                    return (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'flex-end',
                      }}>
                        <div style={{
                          maxWidth: '85%', padding: '12px 16px', borderRadius: '12px 12px 4px 12px',
                          backgroundColor: 'var(--color-accent-orange)', color: '#fff',
                          fontSize: '0.88rem', lineHeight: 1.6,
                        }}>
                          {entry.text}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                      }}>
                        <Sparkles size={14} style={{ color: 'var(--color-accent-orange)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                          {entry.label || 'Hint'}
                        </span>
                      </div>
                      <div style={{
                        padding: '16px 18px', borderRadius: '4px 12px 12px 12px',
                        borderLeft: '4px solid var(--color-accent-orange)',
                        backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-accent-orange-bg)',
                      }}>
                        <p style={{
                          fontSize: '0.9rem', lineHeight: 1.75,
                          color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                          fontWeight: 500,
                        }}>
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Follow-up input */}
              {maxReached ? (
                <div style={{
                  padding: '12px 14px', borderRadius: '10px',
                  backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                  fontSize: '0.82rem', textAlign: 'center',
                  color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                }}>
                  Maximum follow-ups reached ({MAX_FOLLOWUPS}). Submit new code to start fresh.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  borderTop: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
                  paddingTop: '14px',
                }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <MessageCircle size={14} style={{
                      position: 'absolute', left: '12px', top: '12px',
                      color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                    }} />
                    <input
                      value={followUpInput}
                      onChange={e => setFollowUpInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleFollowUp()}
                      placeholder={`Ask a follow-up… (${MAX_FOLLOWUPS - followUpCount} remaining)`}
                      disabled={followUpLoading}
                      style={{
                        width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
                        border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
                        backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                        color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                        fontSize: '0.85rem', outline: 'none',
                      }}
                    />
                  </div>
                  <button
                    onClick={handleFollowUp}
                    disabled={followUpLoading || !followUpInput.trim()}
                    className="btn-glass-primary"
                    style={{
                      padding: '10px 14px', borderRadius: '10px',
                      color: '#fff',
                      cursor: followUpLoading || !followUpInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: followUpLoading || !followUpInput.trim() ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
                    }}
                  >
                    {followUpLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
