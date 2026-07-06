import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import api from '../api/axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Code2, Send, Loader2 } from 'lucide-react';

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'go', 'rust', 'typescript'];
const COOKIE_KEY = 'codechemy_preferred_language';
const COOKIE_DAYS = 30;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function AICodeReview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();

  // Language preference from cookie
  const savedLang = getCookie(COOKIE_KEY);
  const defaultLang = savedLang && LANGUAGES.includes(savedLang) ? savedLang : 'python';

  // Pre-fill code from URL param (from AI Coach "Full Review" button)
  const urlCode = searchParams.get('code') ? decodeURIComponent(searchParams.get('code')) : '';

  const [code, setCode] = useState(urlCode);
  const [language, setLanguage] = useState(defaultLang);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cardClass = isDark ? 'card-dark' : 'card-light';

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCookie(COOKIE_KEY, lang, COOKIE_DAYS);
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/review', { code, language });
      setReview(res.data.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  // Parse review response into code block and summary
  const parseReview = (text) => {
    if (!text) return { code: '', summary: '' };
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
    const summaryStart = text.indexOf('**Summary**');
    const summaryAlt = text.indexOf('- **Correctness');
    const splitIdx = summaryStart !== -1 ? summaryStart : summaryAlt;

    return {
      code: codeMatch ? codeMatch[1].trim() : '',
      summary: splitIdx !== -1 ? text.slice(splitIdx) : text.replace(/```[\w]*\n[\s\S]*?```/, '').trim(),
    };
  };

  const parsed = parseReview(review);

  return (
    <div className="page-enter">
      <Header title="AI Code Review" subtitle="Get intelligent, line-by-line feedback on your code" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Input Panel */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Code2 size={20} style={{ color: 'var(--color-accent-orange)' }} />
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
              placeholder="Paste your code here..."
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
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-accent-red)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleReview}
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
            {loading ? <><Loader2 size={18} className="spin" /> Analysing...</> : <><Send size={16} /> Review Code</>}
          </button>
        </div>

        {/* Review Output / Spinner */}
        {(loading || review) && (
          <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading && !review ? (
              /* Centered spinner while waiting */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '16px' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--color-accent-orange)' }} />
                <p style={{ fontSize: '0.9rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                  Analysing your code…
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                  ⚗ Review Results
                </h3>

                {parsed.code && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                      Annotated Code
                    </h4>
                    <SyntaxHighlighter language={language} style={oneDark}
                      customStyle={{ borderRadius: '8px', fontSize: '0.8rem', maxHeight: '350px' }}>
                      {parsed.code}
                    </SyntaxHighlighter>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                    Summary
                  </h4>
                  <div style={{
                    fontSize: '0.88rem', lineHeight: 1.7,
                    color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {parsed.summary.split('\n').map((line, i) => {
                      if (line.startsWith('- **')) {
                        const [label, ...rest] = line.slice(2).split(':');
                        return (
                          <div key={i} style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700 }}>{label.replace(/\*\*/g, '')}:</span>
                            <span> {rest.join(':').replace(/\*\*/g, '')}</span>
                          </div>
                        );
                      }
                      return <div key={i}>{line}</div>;
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
