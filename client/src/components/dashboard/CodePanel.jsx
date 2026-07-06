import { useTheme } from '../../context/ThemeContext';
import { Copy } from 'lucide-react';

const sampleCode = `# Inefficient: Adjacency Matrix O(V^2) space
graph_matrix = [[0] * V for _ in range(V)]

# Better: Adjacency List O(V + E) space
from collections import defaultdict
graph_list = defaultdict(list)

def add_edge(u, v):
    graph_list[u].append(v)
    graph_list[v].append(u)

# Why adjacency list?
# - Sparse graphs: E << V^2
# - Iteration over neighbors: O(degree)
# - Memory efficient for large graphs`;

export default function CodePanel() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCode);
  };

  // Syntax-colored tokens
  const renderLine = (line, idx) => {
    // Simple syntax highlighting
    const colorize = (text) => {
      const parts = [];
      let remaining = text;
      let key = 0;

      const patterns = [
        { regex: /(#[^\n]*)/, color: isDark ? '#6A9955' : '#6A9955' }, // comments
        { regex: /(def |class |from |import |for |in |if |return )/, color: '#C586C0' }, // keywords
        { regex: /(\b\d+\b)/, color: '#B5CEA8' }, // numbers
        { regex: /(["'][^"']*["'])/, color: '#CE9178' }, // strings
        { regex: /(graph_matrix|graph_list|add_edge|defaultdict|range|append|list)/, color: '#DCDCAA' }, // functions
      ];

      // Check for comment first (takes the whole line)
      if (remaining.trim().startsWith('#')) {
        return [<span key={0} style={{ color: '#6A9955', fontStyle: 'italic' }}>{remaining}</span>];
      }

      // Simple keyword highlighting
      const keywords = ['def ', 'class ', 'from ', 'import ', 'for ', 'in ', 'if ', 'return '];
      const functions = ['graph_matrix', 'graph_list', 'add_edge', 'defaultdict', 'range', 'append', 'list'];
      const builtins = ['V', 'u', 'v'];

      const tokens = remaining.split(/(\s+|[[\](){}:,=*])/);
      return tokens.map((token, i) => {
        if (keywords.some(k => k.trim() === token)) {
          return <span key={i} style={{ color: '#C586C0' }}>{token}</span>;
        }
        if (functions.includes(token)) {
          return <span key={i} style={{ color: '#DCDCAA' }}>{token}</span>;
        }
        if (/^\d+$/.test(token)) {
          return <span key={i} style={{ color: '#B5CEA8' }}>{token}</span>;
        }
        if (token === '0') {
          return <span key={i} style={{ color: '#B5CEA8' }}>{token}</span>;
        }
        return <span key={i} style={{ color: '#D4D4D4' }}>{token}</span>;
      });
    };

    return (
      <div key={idx} style={{
        minHeight: line.trim() === '' ? '20px' : 'auto',
        lineHeight: '22px',
      }}>
        {line.trim() === '' ? '\u00A0' : colorize(line)}
      </div>
    );
  };

  const lines = sampleCode.split('\n');

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#1E1E1E',
      animation: 'var(--animate-slide-up)',
      border: isDark ? '1px solid var(--color-dark-border)' : '1px solid #2A2A2A',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: '#252525',
        borderBottom: '1px solid #333',
      }}>
        {!isDark ? (
          // Light mode: traffic light dots
          <div style={{ display: 'flex', gap: '7px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
          </div>
        ) : (
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: '#888',
            textTransform: 'lowercase',
          }}>
            python
          </span>
        )}

        {!isDark ? (
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: '#888',
          }}>
            graph_representation.py
          </span>
        ) : (
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              display: 'flex',
              padding: '4px',
              transition: 'color 0.2s',
            }}
          >
            <Copy size={14} />
          </button>
        )}
      </div>

      {/* Code content */}
      <div style={{
        padding: '16px 20px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        lineHeight: '22px',
        overflowX: 'auto',
      }}>
        {lines.map((line, idx) => renderLine(line, idx))}
      </div>
    </div>
  );
}
