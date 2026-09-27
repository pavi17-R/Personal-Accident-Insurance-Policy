import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import { getDashboard } from '../services/api';
import {
  IconPolicy,
  IconClaims,
  IconFraud,
  IconUnderwriting,
  IconAlert,
  IconCheck
} from '../components/Icons';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => setError('Could not connect to PA Insurance backend. Ensure backend is running and MySQL is active.'));
  }, []);

  if (error) {
    return (
      <Layout title="Insurance Command Center" crumb="Home">
        <div className="alert alert-error">{error}</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Insurance Command Center" crumb="Home">
        <div className="skeleton" style={{ height: 140, marginBottom: 20 }}></div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          <div className="skeleton" style={{ height: 110 }}></div>
          <div className="skeleton" style={{ height: 110 }}></div>
          <div className="skeleton" style={{ height: 110 }}></div>
        </div>
      </Layout>
    );
  }

  // Calculate dynamic insights from real database records
  const totalPols = data.totalPolicies || 1;
  const lowRiskCount = data.riskDistribution?.find((r) => r.risk_tier === 'Low')?.count || 0;
  const medRiskCount = data.riskDistribution?.find((r) => r.risk_tier === 'Medium')?.count || 0;
  const highRiskCount = data.riskDistribution?.find((r) => r.risk_tier === 'High')?.count || 0;
  const lowRiskPct = Math.round((lowRiskCount / totalPols) * 100);
  const highRiskPct = Math.round((highRiskCount / totalPols) * 100);

  const fraudRate = data.totalClaims > 0 ? Math.round((data.totalHighFraudClaims / data.totalClaims) * 100) : 0;

  return (
    <Layout title="Insurance Command Center" crumb="Operations">
      {/* Banner / Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--slate-900)' }}>
            Insurance Command Center
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: 13.5, marginTop: 4 }}>
            Guidewire-inspired insurance operations with intelligent underwriting and claims intelligence.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/underwriting')}>
            <IconUnderwriting size={15} />
            <span>Underwriting Queue</span>
          </button>
          <button className="btn btn-accent" onClick={() => navigate('/policies/new')}>
            + New Submission
          </button>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="stat-card c-teal" onClick={() => navigate('/policies?status=Active')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">Active Policies</div>
            <IconPolicy size={18} color="var(--teal-600)" />
          </div>
          <div className="value">{data.activePolicies}</div>
          <div className="sub">In force ({Math.round(((data.activePolicies || 0) / totalPols) * 100)}% of book)</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/policies')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">Total Applications / Policies</div>
            <IconPolicy size={18} color="var(--navy-600)" />
          </div>
          <div className="value">{data.totalPolicies}</div>
          <div className="sub">{data.draftPolicies || 0} drafts awaiting bind</div>
        </div>

        <div className="stat-card c-teal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">In-Force Written Premium</div>
            <span style={{ fontSize: 18, color: 'var(--teal-600)', fontWeight: 700 }}>₹</span>
          </div>
          <div className="value">&#8377;{Number(data.inForcePremium || 0).toLocaleString('en-IN')}</div>
          <div className="sub">Total book: &#8377;{Number(data.totalPremium || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" onClick={() => navigate('/claims')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">Open Claims</div>
            <IconClaims size={18} color="var(--navy-600)" />
          </div>
          <div className="value">{data.openClaims}</div>
          <div className="sub">Submitted &amp; Under Investigation</div>
        </div>

        <div className="stat-card c-red" onClick={() => navigate('/underwriting')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">&#129504; High-Risk Applications</div>
            <IconAlert size={18} color="var(--red-600)" />
          </div>
          <div className="value">{data.highRiskPolicies}</div>
          <div className="sub">AI Underwriting tier = High (+35% loading)</div>
        </div>

        <div className="stat-card c-amber" onClick={() => navigate('/fraud-intelligence')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label">&#129504; AI Fraud Alerts</div>
            <IconFraud size={18} color="var(--amber-500)" />
          </div>
          <div className="value">{data.highFraudClaims}</div>
          <div className="sub">High fraud probability triage</div>
        </div>
      </div>

      {/* Main Operations Split */}
      <div className="detail-grid" style={{ marginBottom: 24 }}>
        {/* Section A: Portfolio Overview & Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Portfolio Lifecycle Overview</h3>
            <span className="link-cell" onClick={() => navigate('/policies')}>View Policy 360 &rarr;</span>
          </div>
          <div className="card-pad">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--slate-500)', fontWeight: 600 }}>Active In-Force</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal-600)', marginTop: 4 }}>{data.activePolicies}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--slate-500)', fontWeight: 600 }}>Draft / Pending</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0369A1', marginTop: 4 }}>{data.draftPolicies || 0}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--slate-500)', fontWeight: 600 }}>Renewing Soon</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber-500)', marginTop: 4 }}>{data.pendingRenewal || 0}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--slate-500)', fontWeight: 600 }}>Expired / Lapsed</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red-600)', marginTop: 4 }}>{data.expiredPolicies}</div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Customer</th>
                    <th>Coverage</th>
                    <th>Premium</th>
                    <th>Risk Tier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPolicies.map((p) => (
                    <tr key={p.policy_id} onClick={() => navigate(`/policies/${p.policy_id}`)} style={{ cursor: 'pointer' }}>
                      <td className="mono link-cell">{p.policy_number}</td>
                      <td>{p.full_name}</td>
                      <td>{p.coverage_type}</td>
                      <td>&#8377;{Number(p.premium).toLocaleString('en-IN')}</td>
                      <td><RiskBadge level={p.risk_tier || 'Low'} /></td>
                      <td><StatusBadge status={p.policy_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section B & G: AI Risk Distribution & Real AI Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Risk Distribution Card */}
          <div className="card">
            <div className="card-header">
              <h3>AI Underwriting Risk Distribution</h3>
              <span className="link-cell" onClick={() => navigate('/model-center')}>Model Metrics &rarr;</span>
            </div>
            <div className="card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>
                  Active scoring from <b>ml/risk_model.json</b> (81.75% Test Acc)
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: '#E7F6EC', border: '1px solid #BEE3C8', padding: '10px 12px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-600)' }}>LOW RISK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-600)', marginTop: 2 }}>{lowRiskCount}</div>
                  <div style={{ fontSize: 10.5, color: '#1E8449' }}>+0% base rate</div>
                </div>
                <div style={{ flex: 1, background: '#FCF3E3', border: '1px solid #F0DDB5', padding: '10px 12px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-500)' }}>MEDIUM RISK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber-500)', marginTop: 2 }}>{medRiskCount}</div>
                  <div style={{ fontSize: 10.5, color: '#8A5A0F' }}>+15% AI loading</div>
                </div>
                <div style={{ flex: 1, background: '#FCECEB', border: '1px solid #E8B4B1', padding: '10px 12px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red-600)' }}>HIGH RISK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red-600)', marginTop: 2 }}>{highRiskCount}</div>
                  <div style={{ fontSize: 10.5, color: '#C0362C' }}>+35% AI loading</div>
                </div>
              </div>

              {/* Progress Distribution Bar */}
              <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', background: 'var(--slate-200)' }}>
                <div style={{ width: `${(lowRiskCount / totalPols) * 100}%`, background: 'var(--green-600)' }} title={`Low Risk: ${lowRiskCount}`} />
                <div style={{ width: `${(medRiskCount / totalPols) * 100}%`, background: 'var(--amber-500)' }} title={`Medium Risk: ${medRiskCount}`} />
                <div style={{ width: `${(highRiskCount / totalPols) * 100}%`, background: 'var(--red-600)' }} title={`High Risk: ${highRiskCount}`} />
              </div>
            </div>
          </div>

          {/* Section G: Genuine Real Database AI Insights */}
          <div className="card">
            <div className="card-header">
              <h3>&#129504; AI Operational Insights</h3>
              <span style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>Database Derived</span>
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '10px 12px', borderRadius: 6 }}>
                <IconCheck size={16} color="#0284C7" />
                <div>
                  <b>Portfolio Quality:</b> {lowRiskPct}% of policies are rated <b>Low Risk</b>, qualifying for standard base rates without premium surcharge.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 12px', borderRadius: 6 }}>
                <IconAlert size={16} color="#D97706" />
                <div>
                  <b>Underwriting Exposure:</b> {highRiskPct}% of policies exhibit elevated occupation hazard or claim frequency, contributing extra risk loading to the premium pool.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 12px', borderRadius: 6 }}>
                <IconFraud size={16} color="#DC2626" />
                <div>
                  <b>Claims Fraud Rate:</b> {fraudRate}% of submitted claims have triggered AI red flags and are quarantined in <b>UnderReview</b> for manual SIU triage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Split: Fraud Watch & Underwriting Alerts & Renewal Radar */}
      <div className="detail-grid" style={{ marginBottom: 24 }}>
        {/* Section D: Fraud Watch */}
        <div className="card">
          <div className="card-header">
            <h3>&#129504; Claims Fraud Watchlist</h3>
            <span className="link-cell" onClick={() => navigate('/fraud-intelligence')}>Full Fraud Center &rarr;</span>
          </div>
          <div className="card-pad">
            {data.flaggedClaims.length === 0 ? (
              <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>No claims currently flagged for review.</p>
            ) : (
              <div className="insight-row">
                {data.flaggedClaims.map((c) => (
                  <div key={c.claim_id} className="insight-item" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                    <div style={{ flex: 1 }}>
                      <div className="ii-main" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{c.claim_number}</span>
                        <span style={{ color: 'var(--slate-400)' }}>&middot;</span>
                        <span>{c.full_name}</span>
                      </div>
                      <div className="ii-sub">
                        Policy: <span className="mono">{c.policy_number}</span> &middot; Claim: &#8377;{Number(c.claim_amount).toLocaleString('en-IN')}
                      </div>
                      {c.fraud_flags?.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c.fraud_flags.slice(0, 1).map((fl, i) => (
                            <span key={i} style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 4 }}>
                              &#9888;&#65039; {fl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <RiskBadge level={c.fraud_level} />
                      <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Score: {c.fraud_score}/100</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section E: Underwriting Alerts */}
        <div className="card">
          <div className="card-header">
            <h3>Underwriting Referrals &amp; Alerts</h3>
            <span className="link-cell" onClick={() => navigate('/underwriting')}>Underwriting Workbench &rarr;</span>
          </div>
          <div className="card-pad">
            {data.underwritingAlerts?.length === 0 ? (
              <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>All submissions are processed.</p>
            ) : (
              <div className="insight-row">
                {data.underwritingAlerts.map((u) => (
                  <div key={u.policy_id} className="insight-item" onClick={() => navigate(`/underwriting?policy_id=${u.policy_id}`)}>
                    <div style={{ flex: 1 }}>
                      <div className="ii-main" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono">{u.policy_number}</span>
                        <span style={{ color: 'var(--slate-400)' }}>&middot;</span>
                        <span>{u.full_name}</span>
                      </div>
                      <div className="ii-sub">
                        {u.occupation} &middot; {u.coverage_type} Coverage &middot; Sum Insured: &#8377;{Number(u.sum_insured).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#C0362C', fontWeight: 600, marginTop: 4 }}>
                        Loading: +{u.premium_loading_pct}% &middot; Status: {u.policy_status}
                      </div>
                    </div>
                    <div>
                      <RiskBadge level={u.risk_tier || 'High'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section F: Renewal Radar & Recent Activity */}
      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h3>Renewal Radar</h3>
            <span className="link-cell" onClick={() => navigate('/policies')}>Portfolio Management &rarr;</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy #</th>
                  <th>Customer</th>
                  <th>Expiration Date</th>
                  <th>Premium</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.renewalRadar.map((r) => (
                  <tr key={r.policy_id} onClick={() => navigate(`/policies/${r.policy_id}`)} style={{ cursor: 'pointer' }}>
                    <td className="mono link-cell">{r.policy_number}</td>
                    <td>{r.full_name}</td>
                    <td>{new Date(r.policy_end_date).toLocaleDateString('en-IN')}</td>
                    <td>&#8377;{Number(r.premium).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={r.policy_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Operations Audit Ledger</h3>
            <span className="link-cell" onClick={() => navigate('/activity-audit')}>Full Audit Log &rarr;</span>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recentActivities.slice(0, 6).map((a) => (
              <div key={a.activity_id} style={{ fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--navy-600)', marginTop: 5, flexShrink: 0 }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{a.description}</div>
                  <div style={{ color: 'var(--slate-500)', fontSize: 11, marginTop: 2 }}>
                    {new Date(a.created_at).toLocaleString('en-IN')} &middot; <span className="mono">{a.activity_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
