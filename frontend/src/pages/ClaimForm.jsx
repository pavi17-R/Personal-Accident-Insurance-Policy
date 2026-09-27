import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskGauge from '../components/RiskGauge';
import { getPolicies, createClaim, assessFraud } from '../services/api';

const CLAIM_TYPES = ['Accidental Death', 'Permanent Disability', 'Medical Expense Coverage'];
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ClaimForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedPolicy = location.state?.policy_id || '';

  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({
    policy_id: preselectedPolicy,
    claim_type: 'Medical Expense Coverage',
    incident_date: todayISO(),
    filed_date: todayISO(),
    claim_amount: '',
    description: ''
  });
  const [fraudAssessment, setFraudAssessment] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPolicies().then((res) => {
      if (res.data.success) {
        setPolicies(res.data.data.filter((p) => ['Active', 'Expired'].includes(p.policy_status)));
      }
    });
  }, []);

  useEffect(() => {
    if (!form.policy_id || !form.claim_type || !form.claim_amount || !form.incident_date) {
      setFraudAssessment(null);
      return;
    }
    setFraudLoading(true);
    const t = setTimeout(() => {
      assessFraud({
        policy_id: form.policy_id,
        claim_type: form.claim_type,
        claim_amount: Number(form.claim_amount),
        incident_date: form.incident_date,
        filed_date: form.filed_date
      })
        .then((res) => setFraudAssessment(res.data.data))
        .catch(() => setFraudAssessment(null))
        .finally(() => setFraudLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [form.policy_id, form.claim_type, form.claim_amount, form.incident_date, form.filed_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await createClaim({ ...form, claim_amount: Number(form.claim_amount) });
      navigate(`/claims/${res.data.data.claim_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSaving(false);
    }
  };

  const selectedPolicy = policies.find((p) => String(p.policy_id) === String(form.policy_id));

  return (
    <Layout title="First Notice of Loss (FNOL)" crumb="ClaimCenter">
      <div className="back-link" onClick={() => navigate('/claims')}>&larr; Back to Claims Portfolio</div>
      <div className="page-header">
        <div>
          <h1>First Notice of Loss (FNOL) &amp; Claim Intake</h1>
          <p>
            Guidewire ClaimCenter-inspired claim submission with live AI fraud scoring and policy exposure validation.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="detail-grid">
          <div className="card card-pad">
            <h3 style={{ marginBottom: 18 }}>Claim Intake Dossier</h3>
            <div className="form-grid">
              <div className="form-field full">
                <label>Policy Contract</label>
                <select name="policy_id" value={form.policy_id} onChange={handleChange} required>
                  <option value="">-- Select policy (Active or Expired only) --</option>
                  {policies.map((p) => (
                    <option key={p.policy_id} value={p.policy_id}>
                      {p.policy_number} &middot; {p.full_name} &middot; {p.coverage_type} (Limit: &#8377;{Number(p.sum_insured).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
                {selectedPolicy && (
                  <span className="hint">
                    Policy Sum Insured: &#8377;{Number(selectedPolicy.sum_insured).toLocaleString('en-IN')} &middot; Status: {selectedPolicy.policy_status}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Benefit Line Claimed</label>
                <select name="claim_type" value={form.claim_type} onChange={handleChange}>
                  {CLAIM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="hint">Must match an insured coverage option</span>
              </div>

              <div className="form-field">
                <label>Claimed Amount (&#8377;)</label>
                <input type="number" name="claim_amount" min="1" step="500" value={form.claim_amount} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label>Date of Incident</label>
                <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label>Date of Formal Notice</label>
                <input type="date" name="filed_date" value={form.filed_date} onChange={handleChange} required />
              </div>

              <div className="form-field full">
                <label>Incident Occurrence Narrative &amp; Loss Details</label>
                <textarea
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                  required
                  placeholder="Detail the circumstances of the accidental loss, hospitalization records, police FIR (if applicable), and medical reports..."
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/claims')}>Cancel</button>
              <button type="submit" className="btn btn-accent" disabled={saving}>
                {saving ? 'Transmitting Claim...' : 'File Claim & Submit for Triage'}
              </button>
            </div>
          </div>

          {/* Right Column: AI Fraud Screening Preview */}
          <div className="ai-panel">
            <div className="ai-label">&#129504; Live AI Fraud Screening Engine</div>
            {!form.policy_id && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: '#93A9C2' }}>
                Select a policy contract and enter the loss amount to run pre-submission fraud screening.
              </div>
            )}
            {fraudLoading && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: '#93A9C2' }}>
                Evaluating claim-to-sum-insured ratio, policy tenure, and reporting latency...
              </div>
            )}
            {!fraudLoading && fraudAssessment && (
              <>
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <RiskGauge
                    score={fraudAssessment.fraudScore}
                    tier={fraudAssessment.fraudLevel}
                    label="Fraud Probability"
                  />
                </div>
                <div style={{ fontSize: 12, color: '#C7D5E5', textAlign: 'center', marginBottom: 12 }}>
                  Triage Tier: <b>{fraudAssessment.fraudLevel}</b> &middot; Score: <b>{fraudAssessment.fraudScore}/100</b>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93A9C2', marginBottom: 6 }}>
                    Triggered Red Flags
                  </div>
                  {fraudAssessment.flags.length > 0 ? (
                    <ul className="ai-reasons">
                      {fraudAssessment.flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 12, color: '#A7F3D0' }}>&#10003; No suspicious anomalies detected</div>
                  )}
                </div>

                {fraudAssessment.fraudLevel === 'High' && (
                  <div className="ai-note" style={{ color: '#FCA5A5' }}>
                    <b>Automated Triage Notice:</b> High-risk claims will automatically route to <b>UnderReview</b> for SIU adjuster investigation before approval.
                  </div>
                )}
                <div className="ai-note">
                  Binary Logistic Regression &middot; Test Accuracy: 67.67% (Recall-Tuned) &middot; ml/fraud_model.json
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </Layout>
  );
}
