import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import { getPolicies } from '../services/api';
import { IconSearch } from '../components/Icons';

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskTier, setRiskTier] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = (params = {}) => {
    setLoading(true);
    getPolicies(params)
      .then((res) => {
        if (res.data.success) {
          setPolicies(res.data.data);
        }
      })
      .catch(() => setError('Failed to load policies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      load(params);
    }, 300);
    return () => clearTimeout(t);
  }, [search, status]);

  const filteredPolicies = policies.filter((p) => {
    if (!riskTier) return true;
    return p.risk_tier === riskTier;
  });

  return (
    <Layout title="Policy Portfolio" crumb="PolicyCenter">
      <div className="page-header">
        <div>
          <h1>Policy Portfolio &amp; Administration</h1>
          <p>Guidewire PolicyCenter-inspired policy management, in-force contracts, and term lifecycle.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/underwriting')}>Underwriting Workbench</button>
          <button className="btn btn-accent" onClick={() => navigate('/policies/new')}>+ New Submission</button>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="icon"><IconSearch size={15} color="var(--slate-400)" /></span>
          <input
            placeholder="Search by policy number (PA-...) or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Renewed">Renewed</option>
        </select>
        <select className="filter-select" value={riskTier} onChange={(e) => setRiskTier(e.target.value)}>
          <option value="">All Risk Tiers</option>
          <option value="Low">Low Risk (0%)</option>
          <option value="Medium">Medium Risk (+15%)</option>
          <option value="High">High Risk (+35%)</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Number</th>
                <th>Policyholder Account</th>
                <th>Coverage Tier</th>
                <th>Sum Insured</th>
                <th>Annual Premium</th>
                <th>AI Risk Tier</th>
                <th>Policy Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>Loading policy records...</td></tr>}
              {!loading && filteredPolicies.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                      <h4>No matching policies found</h4>
                      <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>Try adjusting your search query or status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredPolicies.map((p) => (
                <tr key={p.policy_id}>
                  <td className="mono link-cell font-bold" onClick={() => navigate(`/policies/${p.policy_id}`)}>
                    {p.policy_number}
                  </td>
                  <td>
                    <span className="link-cell" onClick={() => navigate(`/customers/${p.customer_id}`)}>
                      {p.full_name}
                    </span>
                  </td>
                  <td>{p.coverage_type}</td>
                  <td className="mono">&#8377;{Number(p.sum_insured).toLocaleString('en-IN')}</td>
                  <td className="mono font-bold">&#8377;{Number(p.premium).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(p.policy_start_date).toLocaleDateString('en-IN')} &rarr; {new Date(p.policy_end_date).toLocaleDateString('en-IN')}
                  </td>
                  <td><RiskBadge level={p.risk_tier || 'Low'} /></td>
                  <td><StatusBadge status={p.policy_status} /></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/policies/${p.policy_id}`)}>
                      Policy 360&deg;
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
