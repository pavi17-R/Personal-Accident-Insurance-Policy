import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import { getPolicyById, bindPolicy, declinePolicy } from '../services/api';
import { IconPolicy, IconClaims, IconCheck, IconAlert } from '../components/Icons';

export default function PolicyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    getPolicyById(id)
      .then((res) => {
        if (res.data.success) {
          setPolicy(res.data.data);
        }
      })
      .catch(() => setError('Policy not found or server error.'));
  };

  useEffect(() => { load(); }, [id]);

  if (error) {
    return <Layout title="Policy 360" crumb="Portfolio"><div className="alert alert-error">{error}</div></Layout>;
  }
  if (!policy) {
    return <Layout title="Policy 360" crumb="Portfolio"><div className="loading-text">Loading Policy 360&hellip;</div></Layout>;
  }

  const canRenew = ['Active', 'Expired'].includes(policy.policy_status);
  const canCancel = ['Active', 'Draft'].includes(policy.policy_status);
  const canClaim = ['Active', 'Expired'].includes(policy.policy_status);
  const isDraft = policy.policy_status === 'Draft';

  const handleQuickBind = async () => {
    if (!window.confirm(`Issue and bind policy ${policy.policy_number} as Active in-force?`)) return;
    setBusy(true);
    try {
      await bindPolicy(policy.policy_id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to bind policy');
    } finally {
      setBusy(false);
    }
  };

  // Lifecycle stage mapping
  const getLifecycleState = (status) => {
    if (status === 'Draft') return 1; // Application / Underwriting
    if (status === 'Active') return 3; // Bound & In Force
    if (status === 'Renewed') return 4; // Renewed
    if (status === 'Expired') return 4; // Expired
    if (status === 'Cancelled') return -1; // Cancelled
    return 1;
  };

  const stage = getLifecycleState(policy.policy_status);

  return (
    <Layout title={`Policy 360: ${policy.policy_number}`} crumb="PolicyCenter">
      <div className="back-link" onClick={() => navigate('/policies')}>&larr; Back to Policies Portfolio</div>

      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="mono" style={{ fontSize: 24 }}>{policy.policy_number}</h1>
            <StatusBadge status={policy.policy_status} />
            <RiskBadge level={policy.risk_tier || 'Low'} />
          </div>
          <p style={{ marginTop: 4, color: 'var(--slate-500)', fontSize: 13 }}>
            Personal Accident Insurance &middot; {policy.coverage_type} Tier &middot; Account: <b className="link-cell" onClick={() => navigate(`/customers/${policy.customer_id}`)}>{policy.full_name} ({policy.customer_code})</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isDraft && (
            <button className="btn btn-accent" disabled={busy} onClick={handleQuickBind}>
              <IconCheck size={16} />
              <span>Approve &amp; Bind</span>
            </button>
          )}
          {canClaim && (
            <button className="btn btn-outline" onClick={() => navigate('/claims/new', { state: { policy_id: policy.policy_id } })}>
              File a Claim
            </button>
          )}
          {canRenew && (
            <button className="btn btn-outline" onClick={() => navigate(`/policies/${id}/renew`)}>
              Renew Policy
            </button>
          )}
          {canCancel && (
            <button className="btn btn-danger" onClick={() => navigate(`/policies/${id}/cancel`)}>
              Cancel Policy
            </button>
          )}
        </div>
      </div>

      {/* Policy Lifecycle Visual Timeline */}
      <div className="lifecycle-tracker">
        <div className={`lifecycle-step ${stage >= 1 ? (stage > 1 ? 'completed' : 'current') : ''}`}>
          <div className="step-circle">1</div>
          <div className="step-label">Application</div>
        </div>
        <div className={`lifecycle-step ${stage >= 2 ? (stage > 2 ? 'completed' : 'current') : ''}`}>
          <div className="step-circle">2</div>
          <div className="step-label">AI Underwriting</div>
        </div>
        <div className={`lifecycle-step ${stage >= 3 ? (stage > 3 ? 'completed' : 'current') : ''} ${policy.policy_status === 'Cancelled' ? 'declined' : ''}`}>
          <div className="step-circle">3</div>
          <div className="step-label">{policy.policy_status === 'Cancelled' ? 'Cancelled / Declined' : 'Bound & In Force'}</div>
        </div>
        <div className={`lifecycle-step ${stage >= 4 ? 'completed' : ''}`}>
          <div className="step-circle">4</div>
          <div className="step-label">Renewal / Closed</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'coverage' ? 'active' : ''}`} onClick={() => setActiveTab('coverage')}>
          Coverages <span className="tab-badge">{policy.coverages?.length || 0}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'premium' ? 'active' : ''}`} onClick={() => setActiveTab('premium')}>
          Rating &amp; Premium
        </button>
        <button className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`} onClick={() => setActiveTab('risk')}>
          AI Risk Assessment
        </button>
        <button className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
          Claims <span className="tab-badge">{policy.claims?.length || 0}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'renewal' ? 'active' : ''}`} onClick={() => setActiveTab('renewal')}>
          Renewal Lineage <span className="tab-badge">{policy.renewals?.length || 0}</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="card">
              <div className="card-header"><h3>Policy Summary</h3></div>
              <div className="card-pad">
                <div className="info-row"><span className="k">Policy Number</span><span className="v mono font-bold">{policy.policy_number}</span></div>
                <div className="info-row"><span className="k">Line of Business</span><span className="v">{policy.policy_type}</span></div>
                <div className="info-row"><span className="k">Coverage Tier</span><span className="v font-bold">{policy.coverage_type}</span></div>
                <div className="info-row"><span className="k">Total Sum Insured</span><span className="v font-bold">&#8377;{Number(policy.sum_insured).toLocaleString('en-IN')}</span></div>
                <div className="info-row"><span className="k">Gross Annual Premium</span><span className="v font-bold">&#8377;{Number(policy.premium).toLocaleString('en-IN')}</span></div>
                <div className="info-row"><span className="k">Policy Status</span><span className="v"><StatusBadge status={policy.policy_status} /></span></div>
                <div className="info-row"><span className="k">Effective Start Date</span><span className="v">{new Date(policy.policy_start_date).toLocaleDateString('en-IN')}</span></div>
                <div className="info-row"><span className="k">Policy Expiry Date</span><span className="v">{new Date(policy.policy_end_date).toLocaleDateString('en-IN')}</span></div>
                {policy.parent_policy_id && (
                  <div className="info-row"><span className="k">Renewed From Predecessor</span><span className="v mono link-cell" onClick={() => navigate(`/policies/${policy.parent_policy_id}`)}>Policy #{policy.parent_policy_id}</span></div>
                )}
              </div>
            </div>

            {policy.cancellation && (
              <div className="card" style={{ borderColor: 'var(--red-600)' }}>
                <div className="card-header" style={{ background: '#FDF2F2' }}><h3 style={{ color: 'var(--red-600)' }}>Cancellation Record</h3></div>
                <div className="card-pad">
                  <div className="info-row"><span className="k">Cancellation Date</span><span className="v">{policy.cancellation.cancellation_date}</span></div>
                  <div className="info-row"><span className="k">Cancellation Reason</span><span className="v">{policy.cancellation.cancellation_reason}</span></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="card">
              <div className="card-header"><h3>Policyholder Account Details</h3></div>
              <div className="card-pad">
                <div className="info-row"><span className="k">Account Name</span><span className="v link-cell" onClick={() => navigate(`/customers/${policy.customer_id}`)}>{policy.full_name}</span></div>
                <div className="info-row"><span className="k">Customer ID</span><span className="v mono">{policy.customer_code}</span></div>
                <div className="info-row"><span className="k">Occupation</span><span className="v">{policy.occupation || 'Software Engineer'}</span></div>
                <div className="info-row"><span className="k">Hazard Class</span><span className="v"><RiskBadge level={policy.occupation_risk_category || 'Low'} /></span></div>
                <div className="info-row"><span className="k">Phone</span><span className="v">{policy.phone}</span></div>
                <div className="info-row"><span className="k">Email</span><span className="v">{policy.email}</span></div>
                <div className="info-row"><span className="k">Address</span><span className="v">{policy.address}</span></div>
              </div>
            </div>

            <div className="card card-pad" style={{ background: 'var(--navy-900)', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#93A9C2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Underwriting Risk Tier
              </div>
              <RiskGauge score={policy.risk_score || 20} tier={policy.risk_tier || 'Low'} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coverage */}
      {activeTab === 'coverage' && (
        <div className="card">
          <div className="card-header">
            <h3>Coverages &amp; Benefit Line Items</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coverage Line Item</th>
                  <th>Maximum Benefit Limit</th>
                  <th>Exposure Basis</th>
                </tr>
              </thead>
              <tbody>
                {policy.coverages?.map((c) => (
                  <tr key={c.coverage_id}>
                    <td style={{ fontWeight: 600 }}>{c.coverage_name}</td>
                    <td className="mono font-bold">&#8377;{Number(c.coverage_amount).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--slate-500)', fontSize: 12 }}>
                      {c.coverage_name === 'Accidental Death' ? '100% Capital Sum Insured' : c.coverage_name === 'Permanent Disability' ? 'Up to 100% of Sum Insured' : 'Hospitalization Reimbursement Limit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Rating & Premium */}
      {activeTab === 'premium' && (
        <div className="card card-pad" style={{ maxWidth: 800 }}>
          <h3 style={{ marginBottom: 16 }}>Rating Formula Breakdown</h3>
          <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
            <div className="info-row">
              <span className="k">Coverage Tier Base Rate</span>
              <span className="v mono">
                {policy.coverage_type === 'Comprehensive' ? '₹5.00 per ₹1,000' : policy.coverage_type === 'Standard' ? '₹3.50 per ₹1,000' : '₹2.50 per ₹1,000'}
              </span>
            </div>
            <div className="info-row">
              <span className="k">Sum Insured Limit</span>
              <span className="v mono font-bold">&#8377;{Number(policy.sum_insured).toLocaleString('en-IN')}</span>
            </div>
            <div className="info-row">
              <span className="k">Calculated Base Premium</span>
              <span className="v mono font-bold">
                &#8377;{Math.round(((Number(policy.sum_insured) / 1000) * (policy.coverage_type === 'Comprehensive' ? 5.0 : policy.coverage_type === 'Standard' ? 3.5 : 2.5)) * 100) / 100}
              </span>
            </div>
            <div className="info-row">
              <span className="k">AI Underwriting Risk Loading</span>
              <span className="v mono font-bold" style={{ color: policy.premium_loading_pct > 0 ? '#C0362C' : 'var(--green-600)' }}>
                +{policy.premium_loading_pct}% ({policy.risk_tier || 'Low'} Tier)
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
            <div className="info-row" style={{ alignItems: 'center' }}>
              <span className="k" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-900)' }}>Bound Annual Premium</span>
              <span className="v mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy-900)' }}>
                &#8377;{Number(policy.premium).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Risk Assessment */}
      {activeTab === 'risk' && (
        <div className="detail-grid">
          <div className="card card-pad" style={{ background: 'var(--navy-900)', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#93A9C2' }}>Trained ML Risk Engine</div>
            <RiskGauge score={policy.risk_score || 20} tier={policy.risk_tier || 'Low'} />
            <div style={{ marginTop: 14, fontSize: 12, color: '#93A9C2' }}>
              Multinomial Logistic Regression Model (Test Accuracy: 81.75%)
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 12 }}>Underwriting Factors Evaluated</h3>
            <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: 'var(--slate-700)' }}>
              <li>Occupation Category: <b>{policy.occupation_risk_category || 'Low'}</b> hazard class ({policy.occupation || 'Standard'})</li>
              <li>Requested Benefit: <b>{policy.coverage_type}</b> line</li>
              <li>Requested Liability: <b>&#8377;{Number(policy.sum_insured).toLocaleString('en-IN')}</b></li>
              <li>Premium Loading Applied: <b>+{policy.premium_loading_pct}%</b></li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 5: Claims */}
      {activeTab === 'claims' && (
        <div className="card">
          <div className="card-header">
            <h3>Claims History ({policy.claims?.length || 0})</h3>
            {canClaim && (
              <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={() => navigate('/claims/new', { state: { policy_id: policy.policy_id } })}>
                + File New Claim
              </button>
            )}
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Claim Type</th>
                  <th>Incident Date</th>
                  <th>Claim Amount</th>
                  <th>Fraud Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!policy.claims || policy.claims.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)' }}>No claims filed against this policy.</td></tr>
                ) : (
                  policy.claims.map((cl) => (
                    <tr key={cl.claim_id} onClick={() => navigate(`/claims/${cl.claim_id}`)} style={{ cursor: 'pointer' }}>
                      <td className="mono link-cell">{cl.claim_number}</td>
                      <td>{cl.claim_type}</td>
                      <td>{cl.incident_date?.slice(0, 10)}</td>
                      <td>&#8377;{Number(cl.claim_amount).toLocaleString('en-IN')}</td>
                      <td><RiskBadge level={cl.fraud_level} /></td>
                      <td><StatusBadge status={cl.claim_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Renewal Lineage */}
      {activeTab === 'renewal' && (
        <div className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Policy Renewal Lineage</h3>
          {policy.renewals?.length === 0 ? (
            <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>This is an original policy issuance (no renewal transactions on record).</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Old Policy</th>
                    <th>New Policy</th>
                    <th>Renewal Date</th>
                    <th>Old Premium</th>
                    <th>New Premium</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.renewals.map((r) => (
                    <tr key={r.renewal_id}>
                      <td className="mono">{r.old_policy_number}</td>
                      <td className="mono font-bold link-cell" onClick={() => navigate(`/policies/${r.new_policy_id}`)}>
                        {r.new_policy_number}
                      </td>
                      <td>{new Date(r.renewal_date).toLocaleDateString('en-IN')}</td>
                      <td>&#8377;{Number(r.old_premium).toLocaleString('en-IN')}</td>
                      <td className="font-bold">&#8377;{Number(r.new_premium).toLocaleString('en-IN')}</td>
                      <td>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
