import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/layout/Header';
import api from '../api/axios';
import { ExternalLink, CheckCircle, Circle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function CompanySheets() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [problems, setProblems] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // problemSlug -> solved
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const debounceRef = useRef(null);

  // Load companies list
  useEffect(() => {
    api.get('/companies').then(res => {
      setCompanies(res.data.companies || []);
      if (res.data.companies?.length > 0) {
        setSelectedCompany(res.data.companies[0].name);
      }
    });
  }, []);

  // Fetch problems from server (with server-side search and filter)
  const fetchProblems = useCallback(async (company, difficulty, searchTerm, pageNum) => {
    if (!company) return;
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 30 };
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get(`/companies/${company}/problems`, { params });
      setProblems(res.data.problems || []);
      setPagination(res.data.pagination || {});
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Fetch user problem statuses for the selected company
  const fetchStatuses = useCallback(async (company) => {
    if (!company) return;
    try {
      const res = await api.get(`/companies/${company}/statuses`);
      setStatusMap(res.data.statuses || {});
    } catch {
      setStatusMap({});
    }
  }, []);

  // When company or filter changes, reset search + page and fetch
  useEffect(() => {
    if (!selectedCompany) return;
    setSearch('');
    setPage(1);
    fetchProblems(selectedCompany, filter, '', 1);
    fetchStatuses(selectedCompany);
  }, [selectedCompany, filter, fetchProblems, fetchStatuses]);

  // When page changes (not caused by company/filter change)
  useEffect(() => {
    if (!selectedCompany) return;
    fetchProblems(selectedCompany, filter, search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounced server-side search — 300ms
  const handleSearchChange = (value) => {
    setSearch(value);
    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchProblems(selectedCompany, filter, value, 1);
    }, 300);
  };

  // Toggle problem status (optimistic update)
  const handleToggle = async (problemSlug) => {
    const currentSolved = !!statusMap[problemSlug];
    // Optimistic update
    setStatusMap(prev => ({ ...prev, [problemSlug]: !currentSolved }));
    try {
      const res = await api.post(`/companies/${selectedCompany}/problems/${problemSlug}/toggle`);
      // Confirm with server response
      setStatusMap(prev => ({ ...prev, [problemSlug]: res.data.solved }));
    } catch {
      // Revert on error
      setStatusMap(prev => ({ ...prev, [problemSlug]: currentSolved }));
    }
  };

  const cardClass = isDark ? 'card-dark' : 'card-light';

  const getDifficultyColor = (d) => {
    if (d === 'Easy') return 'var(--color-accent-green)';
    if (d === 'Hard') return 'var(--color-accent-red)';
    return 'var(--color-accent-orange)';
  };

  return (
    <div className="page-enter">
      <Header title="Company Sheets" subtitle="Practice problems frequently asked at top companies" />

      {/* Company Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {companies.map(c => (
          <button
            key={c.name}
            onClick={() => { setSelectedCompany(c.name); setFilter('All'); setPage(1); }}
            className={selectedCompany === c.name ? 'btn-glass-primary' : 'btn-glass'}
            style={{
              padding: '8px 18px', borderRadius: '10px',
              fontWeight: selectedCompany === c.name ? 600 : 400,
              fontSize: '0.85rem', cursor: 'pointer',
              color: selectedCompany === c.name
                ? 'var(--color-accent-orange)' : (isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)'),
            }}
          >
            {c.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginLeft: '4px', opacity: 0.7 }}>({c.totalProblems})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          {searchLoading
            ? <Loader2 size={15} className="spin" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent-orange)' }} />
            : <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }} />
          }
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search all problems..."
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px',
              border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
              backgroundColor: isDark ? 'var(--color-dark-surface)' : 'var(--color-light-surface)',
              color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
              fontSize: '0.88rem', outline: 'none',
            }}
          />
        </div>
        {['All', 'Easy', 'Medium', 'Hard'].map(d => (
          <button
            key={d}
            onClick={() => { setFilter(d); setPage(1); setSearch(''); }}
            className={filter === d ? 'btn-glass' : ''}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: filter === d ? undefined : '1px solid transparent',
              fontSize: '0.8rem', fontWeight: filter === d ? 600 : 400, cursor: 'pointer',
              background: filter === d ? undefined : 'transparent',
              color: d === 'All' ? (isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)') : getDifficultyColor(d),
              transition: 'all 0.2s ease',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Problems Table */}
      <div className={cardClass} style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 size={28} className="spin" style={{ color: 'var(--color-accent-orange)' }} />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}` }}>
                {['Status', 'Title', 'Difficulty', 'Acceptance', 'Frequency', 'Link'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', fontWeight: 500,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', fontSize: '0.88rem' }}>
                    {search ? `No problems matching "${search}"` : 'No problems found.'}
                  </td>
                </tr>
              ) : problems.map((p, idx) => {
                const isSolved = !!statusMap[p.problemSlug];
                return (
                  <tr key={idx} style={{
                    borderBottom: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
                    transition: 'background-color 0.15s',
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggle(p.problemSlug)}
                        title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                        className="btn-glass"
                        style={{
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '4px', borderRadius: '6px',
                        }}
                      >
                        {isSolved
                          ? <CheckCircle size={16} style={{ color: 'var(--color-accent-green)' }} />
                          : <Circle size={16} style={{ color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }} />
                        }
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 500, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                      {p.problemTitle}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: getDifficultyColor(p.difficulty) }}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                      {p.acceptance != null ? `${p.acceptance}%` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '60px', height: '4px', borderRadius: '2px', backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.frequency || 0}%`, backgroundColor: 'var(--color-accent-orange)', borderRadius: '2px' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer"
                        className="btn-glass"
                        style={{ color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px', textDecoration: 'none' }}>
                        <ExternalLink size={15} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
