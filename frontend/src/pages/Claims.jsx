import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import { getClaims } from '../services/api';
import { IconSearch, IconClaims, IconFraud } from '../components/Icons';

export default function Claims() {
  const [searchParams] = useSearchParams();
  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fraudLevel, setFraudLevel] = useState(searchParams.get('fraud_level') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (fraudLevel) params.fraud_level = fraudLevel;
    getClaims(params)
      .then((res) => {
        if (res.data.success) {
          setClaims(res.data.data);
        }
      })
      .catch(() => setError('Failed to load claims.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, fraudLevel]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <Layout title="Claims Intelligence & Adjuster Workbench" crumb="ClaimCenter">
      <div className="page-header">
        <div>
          <h1>Claims Intelligence &amp; Adjudication</h1>
          <p>
            Guidewire ClaimCenter-inspired claims workspace with real-time AI fraud screening and SIU referral triage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/fraud-intelligence')}>
            <IconFraud size={15} color="var(--amber-500)" />
            <span>Fraud Intelligence Center</span>
          </button>
          <button className="btn btn-accent" onClick={() => navigate('/claims/new')}>
            + File a Claim
          </button>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="nav-tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>
          All Claims ({claims.length})
        </button>
        <button className={`tab-btn ${status === 'UnderReview' ? 'active' : ''}`} onClick={() => setStatus('UnderReview')}>
          Under Investigation (SIU)
        </button>
        <button className={`tab-btn ${status === 'Submitted' ? 'active' : ''}`} onClick={() => setStatus('Submitted')}>
          Submitted
        </button>
        <button className={`tab-btn ${status === 'Approved' ? 'active' : ''}`} onClick={() => setStatus('Approved')}>
          Approved
        </button>
        <button className={`tab-btn ${status === 'Paid' ? 'active' : ''}`} onClick={() => setStatus('Paid')}>
          Settled / Paid
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="icon"><IconSearch size={15} color="var(--slate-400)" /></span>
          <input
            placeholder="Search by claim number (CLM-...), policy number, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={fraudLevel} onChange={(e) => setFraudLevel(e.target.value)}>
          <option value="">All Fraud Levels</option>
          <option value="Low">Low Fraud Risk</option>
          <option value="Medium">Medium Fraud Risk</option>
          <option value="High">High Fraud Risk (SIU Triage)</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim Number</th>
                <th>Policy Number</th>
                <th>Claimant</th>
                <th>Claim Type</th>
                <th>Claimed Amount</th>
                <th>AI Fraud Score</th>
                <th>Fraud Risk Tier</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>Loading claims records...</td></tr>}
              {!loading && claims.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                      <h4>No matching claims found</h4>
                      <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>Try adjusting your search criteria or filing a new claim.</p>
                    </div>
                  </td>
                </tr>
              )}
              {claims.map((c) => (
                <tr key={c.claim_id}>
                  <td className="link-cell mono font-bold" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                    {c.claim_number}
                  </td>
                  <td className="mono link-cell" onClick={() => navigate(`/policies/${c.policy_id}`)}>
                    {c.policy_number}
                  </td>
                  <td>{c.full_name}</td>
                  <td>{c.claim_type}</td>
                  <td className="mono font-bold">&#8377;{Number(c.claim_amount).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 44, height: 6, borderRadius: 3, background: 'var(--slate-200)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${c.fraud_score}%`,
                            background: c.fraud_level === 'High' ? 'var(--red-600)' : c.fraud_level === 'Medium' ? 'var(--amber-500)' : 'var(--green-600)'
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: 11.5, fontWeight: 600 }}>{c.fraud_score}/100</span>
                    </div>
                  </td>
                  <td><RiskBadge level={c.fraud_level} /></td>
                  <td><StatusBadge status={c.claim_status} /></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                      Adjudicate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
