import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import { getClaimById, decideClaim, markClaimPaid } from '../services/api';
import { IconClaims, IconAlert, IconCheck } from '../components/Icons';

export default function ClaimDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    getClaimById(id)
      .then((res) => {
        if (res.data.success) {
          setClaim(res.data.data);
          if (res.data.data.decision_notes) {
            setNotes(res.data.data.decision_notes);
          }
        }
      })
      .catch(() => setError('Claim not found or server error.'));
  };

  useEffect(() => { load(); }, [id]);

  const handleDecide = async (decision) => {
    if (decision === 'Rejected' && !window.confirm('Reject this claim? This will record an official denial on the claim record.')) return;
    setBusy(true);
    try {
      await decideClaim(id, { decision, decision_notes: notes });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record adjudication decision');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm(`Disburse payout of ₹${Number(claim.claim_amount).toLocaleString('en-IN')} for claim ${claim.claim_number}?`)) return;
    setBusy(true);
    try {
      await markClaimPaid(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disburse payment');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Layout title="Claim Details" crumb="ClaimCenter"><div className="alert alert-error">{error}</div></Layout>;
  if (!claim) return <Layout title="Claim Details" crumb="ClaimCenter"><div className="loading-text">Loading Claim Dossier&hellip;</div></Layout>;

  const canDecide = ['Submitted', 'UnderReview'].includes(claim.claim_status);
  const canMarkPaid = claim.claim_status === 'Approved';

  // Claim lifecycle stage
  const getClaimStage = (st) => {
    if (st === 'Submitted') return 1;
    if (st === 'UnderReview') return 2;
    if (st === 'Approved') return 4;
    if (st === 'Rejected') return -1;
    if (st === 'Paid') return 5;
    return 1;
  };

  const cStage = getClaimStage(claim.claim_status);

  return (
    <Layout title={`Claim Adjudication: ${claim.claim_number}`} crumb="ClaimCenter">
      <div className="back-link" onClick={() => navigate('/claims')}>&larr; Back to Claims Portfolio</div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="mono" style={{ fontSize: 24 }}>{claim.claim_number}</h1>
            <StatusBadge status={claim.claim_status} />
            <RiskBadge level={claim.fraud_level} />
          </div>
          <p style={{ marginTop: 4, color: 'var(--slate-500)', fontSize: 13 }}>
            Filed against policy <b className="mono link-cell" onClick={() => navigate(`/policies/${claim.policy_id}`)}>{claim.policy_number}</b> for claimant <b className="link-cell" onClick={() => navigate(`/customers/${claim.customer_id}`)}>{claim.full_name} ({claim.customer_code})</b>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--slate-500)', letterSpacing: '0.05em' }}>Claimed Amount</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy-900)' }}>
            &#8377;{Number(claim.claim_amount).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Claim Workflow Timeline Tracker */}
      <div className="lifecycle-tracker">
        <div className={`lifecycle-step ${cStage >= 1 ? (cStage > 1 ? 'completed' : 'current') : ''}`}>
          <div className="step-circle">1</div>
          <div className="step-label">First Notice of Loss</div>
        </div>
        <div className={`lifecycle-step ${cStage >= 2 ? (cStage > 2 ? 'completed' : 'current') : ''}`}>
          <div className="step-circle">2</div>
          <div className="step-label">AI Fraud Screening</div>
        </div>
        <div className={`lifecycle-step ${cStage >= 3 || cStage === -1 ? 'completed' : 'current'}`}>
          <div className="step-circle">3</div>
          <div className="step-label">SIU / Adjuster Review</div>
        </div>
        <div className={`lifecycle-step ${cStage >= 4 ? (cStage > 4 ? 'completed' : 'current') : ''} ${claim.claim_status === 'Rejected' ? 'declined' : ''}`}>
          <div className="step-circle">4</div>
          <div className="step-label">{claim.claim_status === 'Rejected' ? 'Claim Rejected' : 'Claim Approved'}</div>
        </div>
        <div className={`lifecycle-step ${cStage >= 5 ? 'completed' : ''}`}>
          <div className="step-circle">5</div>
          <div className="step-label">Settlement / Paid</div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Claim Information & Policy Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14 }}>Incident &amp; Claim Details</h3>
            <div className="info-row"><span className="k">Benefit Line Claimed</span><span className="v font-bold">{claim.claim_type}</span></div>
            <div className="info-row"><span className="k">Claim Amount</span><span className="v mono font-bold">&#8377;{Number(claim.claim_amount).toLocaleString('en-IN')}</span></div>
            <div className="info-row"><span className="k">Incident Occurrence Date</span><span className="v">{claim.incident_date?.slice(0, 10)}</span></div>
            <div className="info-row"><span className="k">Formal Notice Filed Date</span><span className="v">{claim.filed_date?.slice(0, 10)}</span></div>
            <div className="info-row">
              <span className="k">Incident Narrative</span>
              <span className="v" style={{ textAlign: 'left', maxWidth: 360, lineHeight: 1.6 }}>{claim.description}</span>
            </div>
            {claim.decided_at && (
              <div className="info-row"><span className="k">Adjudicated At</span><span className="v">{new Date(claim.decided_at).toLocaleString('en-IN')}</span></div>
            )}
            {claim.decision_notes && (
              <div className="info-row"><span className="k">Adjuster Findings</span><span className="v font-bold">{claim.decision_notes}</span></div>
            )}
          </div>

          {/* Policy Verification & Exposure Check */}
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14 }}>Underlying Policy &amp; Exposure Verification</h3>
            <div className="info-row">
              <span className="k">Policy Number</span>
              <span className="v mono link-cell" onClick={() => navigate(`/policies/${claim.policy_id}`)}>{claim.policy_number}</span>
            </div>
            <div className="info-row"><span className="k">Policy Coverage Tier</span><span className="v">{claim.coverage_type}</span></div>
            <div className="info-row"><span className="k">Policy Total Sum Insured</span><span className="v mono font-bold">&#8377;{Number(claim.sum_insured).toLocaleString('en-IN')}</span></div>
            <div className="info-row">
              <span className="k">Policy Term Period</span>
              <span className="v" style={{ fontSize: 12 }}>
                {new Date(claim.policy_start_date).toLocaleDateString('en-IN')} &rarr; {new Date(claim.policy_end_date).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="info-row">
              <span className="k">Exposure Ratio</span>
              <span className="v mono">
                {Math.round((Number(claim.claim_amount) / Number(claim.sum_insured)) * 100)}% of Sum Insured
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Fraud Screening & Adjuster Adjudication */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* AI Fraud Panel */}
          <div className="ai-panel">
            <div className="ai-label">&#129504; AI Fraud Detection Model Assessment</div>
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <RiskGauge
                score={claim.fraud_score}
                tier={claim.fraud_level}
                label="Statistical Fraud Probability"
              />
            </div>
            <div style={{ fontSize: 12, color: '#C7D5E5', textAlign: 'center', marginBottom: 12 }}>
              Classification: <b>{claim.fraud_level} Risk Tier</b> &middot; Score: <b>{claim.fraud_score}/100</b>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12 }}>
              <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93A9C2', marginBottom: 8 }}>
                Explainable SIU Red Flags
              </div>
              {claim.fraud_flags && claim.fraud_flags.length > 0 ? (
                <ul className="flag-list">
                  {claim.fraud_flags.map((flag, idx) => (
                    <li key={idx}>&#9888;&#65039; {flag}</li>
                  ))}
                </ul>
              ) : (
                <ul className="flag-list empty">
                  <li>&#9989; No anomalous indicators or policy timing red flags detected.</li>
                </ul>
              )}
            </div>

            <div className="ai-note">
              Binary Logistic Regression (Class-balanced) &middot; Tuned for high recall to prevent undetected loss leakage &middot; Adjuster makes final decision.
            </div>
          </div>

          {/* Adjuster Decision Workbench */}
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14 }}>Adjuster Decision Workbench</h3>
            {canDecide ? (
              <div>
                <div className="form-field full" style={{ marginBottom: 14 }}>
                  <label>Adjudication Notes / Findings Rationale</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter adjuster findings, document verification details, or investigation summary..."
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-danger" disabled={busy} onClick={() => handleDecide('Rejected')}>
                    Reject Claim
                  </button>
                  <button className="btn btn-accent" disabled={busy} onClick={() => handleDecide('Approved')}>
                    <IconCheck size={16} />
                    <span>Approve Claim</span>
                  </button>
                </div>
              </div>
            ) : canMarkPaid ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 14 }}>
                  Claim has been approved by the adjuster. Awaiting disbursement of payment.
                </div>
                <button className="btn btn-accent" style={{ width: '100%' }} disabled={busy} onClick={handleMarkPaid}>
                  Disburse Payment (&#8377;{Number(claim.claim_amount).toLocaleString('en-IN')})
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>
                Status: <StatusBadge status={claim.claim_status} /><br />
                {claim.claim_status === 'Paid' && 'This claim has been settled and marked as Paid.'}
                {claim.claim_status === 'Rejected' && 'This claim was rejected by the claims adjuster.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
