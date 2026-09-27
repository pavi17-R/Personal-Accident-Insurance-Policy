import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import RiskGauge from '../components/RiskGauge';
import { getClaims, getDashboard } from '../services/api';
import { IconFraud, IconAlert, IconCheck } from '../components/Icons';

export default function FraudIntelligence() {
  const [claims, setClaims] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getClaims(), getDashboard()])
      .then(([claimsRes, dashRes]) => {
        if (claimsRes.data.success) setClaims(claimsRes.data.data);
        if (dashRes.data.success) setDashboardData(dashRes.data.data);
      })
      .catch(() => setError('Failed to load fraud intelligence data.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return <Layout title="Fraud Intelligence" crumb="ClaimCenter"><div className="alert alert-error">{error}</div></Layout>;
  }

  const totalClaims = claims.length || 1;
  const highFraudClaims = claims.filter((c) => c.fraud_level === 'High');
  const medFraudClaims = claims.filter((c) => c.fraud_level === 'Medium');
  const lowFraudClaims = claims.filter((c) => c.fraud_level === 'Low');
  const underReviewClaims = claims.filter((c) => c.claim_status === 'UnderReview');

  const fraudRate = Math.round((highFraudClaims.length / totalClaims) * 100);

  return (
    <Layout title="Fraud Intelligence & SIU Surveillance" crumb="ClaimCenter">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Fraud Intelligence &amp; SIU Surveillance</h1>
          <p>
            Automated Special Investigation Unit (SIU) triage, anomaly screening, and high-risk claim watchlist.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/claims/new')}>
          + File New Claim
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="label">Total Screened Claims</div>
          <div className="value">{claims.length}</div>
          <div className="sub">100% evaluated by AI model</div>
        </div>

        <div className="stat-card c-red">
          <div className="label">High Fraud Probability</div>
          <div className="value">{highFraudClaims.length}</div>
          <div className="sub">{fraudRate}% of total intake</div>
        </div>

        <div className="stat-card c-amber">
          <div className="label">Under SIU Investigation</div>
          <div className="value">{underReviewClaims.length}</div>
          <div className="sub">Quarantined for manual review</div>
        </div>

        <div className="stat-card c-teal">
          <div className="label">Clean Claims (Low Risk)</div>
          <div className="value">{lowFraudClaims.length}</div>
          <div className="sub">Fast-track eligible</div>
        </div>
      </div>

      {/* Fraud Distribution & SIU Rationale Split */}
      <div className="detail-grid" style={{ marginBottom: 24 }}>
        {/* Fraud Risk Distribution */}
        <div className="card card-pad">
          <div className="card-header" style={{ padding: '0 0 14px' }}>
            <h3>Fraud Risk Distribution Breakdown</h3>
            <span className="link-cell" onClick={() => navigate('/model-center')}>View Model Metrics &rarr;</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#E7F6EC', border: '1px solid #BEE3C8', padding: '12px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-600)' }}>LOW FRAUD RISK</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-600)', marginTop: 2 }}>{lowFraudClaims.length}</div>
              <div style={{ fontSize: 11, color: '#1E8449' }}>Score &lt; 30/100</div>
            </div>
            <div style={{ flex: 1, background: '#FCF3E3', border: '1px solid #F0DDB5', padding: '12px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-500)' }}>MEDIUM FRAUD RISK</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber-500)', marginTop: 2 }}>{medFraudClaims.length}</div>
              <div style={{ fontSize: 11, color: '#8A5A0F' }}>Score 30 - 59/100</div>
            </div>
            <div style={{ flex: 1, background: '#FCECEB', border: '1px solid #E8B4B1', padding: '12px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red-600)' }}>HIGH FRAUD RISK</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red-600)', marginTop: 2 }}>{highFraudClaims.length}</div>
              <div style={{ fontSize: 11, color: '#C0362C' }}>Score &ge; 60/100 (SIU Triage)</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--slate-200)', marginBottom: 12 }}>
            <div style={{ width: `${(lowFraudClaims.length / totalClaims) * 100}%`, background: 'var(--green-600)' }} />
            <div style={{ width: `${(medFraudClaims.length / totalClaims) * 100}%`, background: 'var(--amber-500)' }} />
            <div style={{ width: `${(highFraudClaims.length / totalClaims) * 100}%`, background: 'var(--red-600)' }} />
          </div>

          <div style={{ fontSize: 12, color: 'var(--slate-500)', lineHeight: 1.5 }}>
            Automated threshold routing: Claims scored <b>&ge;60</b> are automatically prevented from auto-approval and assigned to <b>UnderReview</b> status.
          </div>
        </div>

        {/* Explainable Detection Rules */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Explainable Red Flag Indicators</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Claim-to-Sum-Insured Exposure Ratio</div>
              <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>Claims requesting &ge;85% of total policy sum insured trigger high financial severity alert.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Policy Inception Timing Anomaly</div>
              <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>Incidents occurring within 30 days of policy binding receive heightened scrutiny for pre-existing loss.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Filing Latency Delay</div>
              <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>Claims filed &gt;60 days after the occurrence date are flagged for delayed notice investigation.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>High Claim Frequency Pattern</div>
              <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>Policyholders with &ge;2 prior claims in the preceding 12 months trigger repeat claimant rules.</div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Risk Fraud Watchlist Table */}
      <div className="card">
        <div className="card-header">
          <h3>High-Risk Claims Watchlist</h3>
          <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Flagged for Adjuster Investigation</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policy #</th>
                <th>Claimant</th>
                <th>Claim Amount</th>
                <th>Fraud Score</th>
                <th>Red Flags Detected</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {highFraudClaims.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)' }}>
                    No claims currently flagged as High fraud risk.
                  </td>
                </tr>
              ) : (
                highFraudClaims.map((c) => {
                  const flags = typeof c.fraud_flags === 'string' ? JSON.parse(c.fraud_flags) : (c.fraud_flags || []);
                  return (
                    <tr key={c.claim_id}>
                      <td className="mono link-cell font-bold" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                        {c.claim_number}
                      </td>
                      <td className="mono">{c.policy_number}</td>
                      <td>{c.full_name}</td>
                      <td className="mono font-bold">&#8377;{Number(c.claim_amount).toLocaleString('en-IN')}</td>
                      <td>
                        <span className="mono font-bold" style={{ color: 'var(--red-600)', fontSize: 13 }}>
                          {c.fraud_score}/100
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {flags.map((f, i) => (
                            <span key={i} style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                              &#9888;&#65039; {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><StatusBadge status={c.claim_status} /></td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
