import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import { getCustomerById } from '../services/api';
import { IconPolicy, IconClaims } from '../components/Icons';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCustomerById(id)
      .then((res) => {
        if (res.data.success) {
          setCustomer(res.data.data);
        }
      })
      .catch(() => setError('Customer account not found.'));
  }, [id]);

  if (error) {
    return (
      <Layout title="Customer 360" crumb="Account Management">
        <div className="alert alert-error">{error}</div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout title="Customer 360" crumb="Account Management">
        <div className="loading-text">Loading Customer 360 Dossier&hellip;</div>
      </Layout>
    );
  }

  const policies = customer.policies || [];
  const claims = customer.claims || [];

  const totalPremiumContributed = policies.reduce((acc, p) => acc + Number(p.premium || 0), 0);
  const activeCount = policies.filter((p) => p.policy_status === 'Active').length;

  return (
    <Layout title={`Customer 360: ${customer.full_name}`} crumb="Account Management">
      <div className="back-link" onClick={() => navigate('/customers')}>&larr; Back to Customers</div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1>{customer.full_name}</h1>
            <span className="mono font-bold" style={{ color: 'var(--slate-500)', fontSize: 16 }}>({customer.customer_code})</span>
            <RiskBadge level={customer.occupation_risk_category} />
          </div>
          <p style={{ marginTop: 4, color: 'var(--slate-500)', fontSize: 13 }}>
            Occupation: <b>{customer.occupation}</b> &middot; Active Policies: <b>{activeCount}</b> &middot; Total Claims: <b>{claims.length}</b>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(`/customers/${id}/edit`)}>Edit Account</button>
          <button className="btn btn-accent" onClick={() => navigate('/policies/new', { state: { customer_id: id } })}>
            + New Policy Submission
          </button>
        </div>
      </div>

      {/* Top Profile Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="label">Total Policies</div>
          <div className="value">{policies.length}</div>
          <div className="sub">{activeCount} currently active</div>
        </div>
        <div className="stat-card c-teal">
          <div className="label">Gross Written Premium</div>
          <div className="value">&#8377;{totalPremiumContributed.toLocaleString('en-IN')}</div>
          <div className="sub">Lifetime account value</div>
        </div>
        <div className="stat-card c-amber">
          <div className="label">Total Claims Filed</div>
          <div className="value">{claims.length}</div>
          <div className="sub">Across all policy periods</div>
        </div>
        <div className="stat-card">
          <div className="label">Occupation Hazard</div>
          <div className="value" style={{ fontSize: 20, marginTop: 4 }}>{customer.occupation_risk_category}</div>
          <div className="sub">Underwriting rating class</div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Account Details & Policies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3>Account Dossier &amp; Demographics</h3></div>
            <div className="card-pad">
              <div className="info-row"><span className="k">Customer ID</span><span className="v mono font-bold">{customer.customer_code}</span></div>
              <div className="info-row"><span className="k">Full Legal Name</span><span className="v">{customer.full_name}</span></div>
              <div className="info-row"><span className="k">Occupation</span><span className="v font-bold">{customer.occupation}</span></div>
              <div className="info-row"><span className="k">Occupation Hazard Category</span><span className="v"><RiskBadge level={customer.occupation_risk_category} /></span></div>
              <div className="info-row"><span className="k">Date of Birth</span><span className="v">{new Date(customer.date_of_birth).toLocaleDateString('en-IN')}</span></div>
              <div className="info-row"><span className="k">Gender</span><span className="v">{customer.gender}</span></div>
              <div className="info-row"><span className="k">Phone</span><span className="v">{customer.phone}</span></div>
              <div className="info-row"><span className="k">Email</span><span className="v">{customer.email}</span></div>
              <div className="info-row"><span className="k">Primary Address</span><span className="v">{customer.address}</span></div>
            </div>
          </div>

          {/* Associated Policies */}
          <div className="card">
            <div className="card-header">
              <h3>Policy Portfolio ({policies.length})</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Coverage Tier</th>
                    <th>Sum Insured</th>
                    <th>Annual Premium</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)' }}>No policies issued yet.</td></tr>
                  ) : (
                    policies.map((p) => (
                      <tr key={p.policy_id} onClick={() => navigate(`/policies/${p.policy_id}`)} style={{ cursor: 'pointer' }}>
                        <td className="mono link-cell font-bold">{p.policy_number}</td>
                        <td>{p.coverage_type}</td>
                        <td className="mono">&#8377;{Number(p.sum_insured).toLocaleString('en-IN')}</td>
                        <td className="mono font-bold">&#8377;{Number(p.premium).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={p.policy_status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Claims History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3>Claims History ({claims.length})</h3>
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claims.length === 0 ? (
                <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>No claims recorded for this customer account.</p>
              ) : (
                claims.map((cl) => (
                  <div
                    key={cl.claim_id}
                    className="insight-item"
                    onClick={() => navigate(`/claims/${cl.claim_id}`)}
                  >
                    <div>
                      <div className="ii-main" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono">{cl.claim_number}</span>
                        <span style={{ color: 'var(--slate-400)' }}>&middot;</span>
                        <StatusBadge status={cl.claim_status} />
                      </div>
                      <div className="ii-sub">
                        {cl.claim_type} &middot; Policy {cl.policy_number} &middot; &#8377;{Number(cl.claim_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <RiskBadge level={cl.fraud_level} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Underwriting Guidance Note */}
          <div className="card card-pad" style={{ background: '#F8FAFC' }}>
            <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--navy-900)' }}>Guidewire Account Entity</h4>
            <p style={{ fontSize: 12, color: 'var(--slate-600)', lineHeight: 1.6 }}>
              In Guidewire PolicyCenter, an <b>Account</b> links all policy periods, commercial and personal exposures, and claim history. This unified Customer 360 view feeds directly into the AI Underwriting model to compute <code>prior_claims</code> and <code>tenure_years</code>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
