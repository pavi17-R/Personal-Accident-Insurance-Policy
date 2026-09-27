import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../services/api';
import { IconSearch, IconPolicy, IconCustomers, IconClaims } from './Icons';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], policies: [], claims: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ customers: [], policies: [], claims: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ customers: [], policies: [], claims: [] });
      return;
    }

    setLoading(true);
    const t = setTimeout(() => {
      globalSearch(query)
        .then((res) => {
          if (res.data.success) {
            setResults(res.data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const totalResults = results.customers.length + results.policies.length + results.claims.length;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <IconSearch size={18} color="var(--slate-400)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search policies (PA-...), customers, claims (CLM-...), or names..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <span className="kbd-shortcut" style={{ fontSize: 11, background: 'var(--slate-100)', padding: '2px 6px', borderRadius: 4 }}>ESC</span>
        </div>

        <div className="search-results-list">
          {loading && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>Searching database...</div>}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>
              No matches found for &ldquo;<b>{query}</b>&rdquo;
            </div>
          )}

          {!loading && results.policies.length > 0 && (
            <div>
              <div className="search-group-title">Policies ({results.policies.length})</div>
              {results.policies.map((p) => (
                <div key={p.policy_id} className="search-result-item" onClick={() => handleSelect(`/policies/${p.policy_id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconPolicy size={16} color="var(--navy-600)" />
                    <div>
                      <div className="search-result-main">{p.policy_number} &middot; {p.full_name}</div>
                      <div className="search-result-sub">{p.coverage_type} Coverage &middot; &#8377;{Number(p.premium).toLocaleString('en-IN')}/yr</div>
                    </div>
                  </div>
                  <span className={`status-pill ${p.policy_status}`} style={{ fontSize: 11 }}>{p.policy_status}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results.customers.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="search-group-title">Customers ({results.customers.length})</div>
              {results.customers.map((c) => (
                <div key={c.customer_id} className="search-result-item" onClick={() => handleSelect(`/customers/${c.customer_id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconCustomers size={16} color="var(--teal-600)" />
                    <div>
                      <div className="search-result-main">{c.full_name} ({c.customer_code})</div>
                      <div className="search-result-sub">{c.occupation} &middot; {c.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{c.occupation_risk_category} Hazard</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results.claims.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="search-group-title">Claims ({results.claims.length})</div>
              {results.claims.map((cl) => (
                <div key={cl.claim_id} className="search-result-item" onClick={() => handleSelect(`/claims/${cl.claim_id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconClaims size={16} color="var(--red-600)" />
                    <div>
                      <div className="search-result-main">{cl.claim_number} &middot; {cl.full_name}</div>
                      <div className="search-result-sub">{cl.policy_number} &middot; &#8377;{Number(cl.claim_amount).toLocaleString('en-IN')} &middot; {cl.claim_type}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${cl.claim_status}`} style={{ fontSize: 11 }}>{cl.claim_status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
