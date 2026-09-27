import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskGauge from '../components/RiskGauge';
import { getCustomers, createPolicy, calculatePremium, assessRisk } from '../services/api';

const COVERAGE_OPTIONS = [
  { key: 'Accidental Death', sub: 'Lump-sum capital benefit paid to nominee upon fatal accident' },
  { key: 'Permanent Disability', sub: 'Scaled compensation paid for permanent partial or total disability' },
  { key: 'Medical Expense Coverage', sub: 'Reimbursement of medical and hospitalization costs from accident' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const oneYearLaterISO = (dateStr) => {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export default function PolicyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedCustomer = location.state?.customer_id || '';

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_id: preselectedCustomer,
    coverage_type: 'Standard',
    sum_insured: 500000,
    policy_start_date: todayISO(),
    policy_end_date: oneYearLaterISO(todayISO()),
    policy_status: 'Draft'
  });
  const [selectedCoverages, setSelectedCoverages] = useState(['Accidental Death']);
  const [premiumPreview, setPremiumPreview] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCustomers().then((res) => {
      if (res.data.success) setCustomers(res.data.data);
    });
  }, []);

  const selectedCustomerObj = customers.find((c) => String(c.customer_id) === String(form.customer_id));

  // Live AI underwriting risk assessment
  useEffect(() => {
    if (!form.customer_id || !form.coverage_type || !form.sum_insured) {
      setRiskAssessment(null);
      return;
    }
    setRiskLoading(true);
    const t = setTimeout(() => {
      assessRisk({
        customer_id: form.customer_id,
        coverage_type: form.coverage_type,
        sum_insured: Number(form.sum_insured),
        policy_start_date: form.policy_start_date
      })
        .then((res) => setRiskAssessment(res.data.data))
        .catch(() => setRiskAssessment(null))
        .finally(() => setRiskLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [form.customer_id, form.coverage_type, form.sum_insured, form.policy_start_date]);

  // Live premium calculation with AI risk loading
  useEffect(() => {
    if (form.coverage_type && form.sum_insured > 0) {
      calculatePremium({
        coverage_type: form.coverage_type,
        sum_insured: Number(form.sum_insured),
        premium_loading_pct: riskAssessment?.premiumLoadingPct || 0
      })
        .then((res) => setPremiumPreview(res.data.data))
        .catch(() => setPremiumPreview(null));
    }
  }, [form.coverage_type, form.sum_insured, riskAssessment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (name === 'policy_start_date') {
        updated.policy_end_date = oneYearLaterISO(value);
      }
      return updated;
    });
  };

  const toggleCoverage = (key) => {
    setSelectedCoverages((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_id) { setError('Please select a customer'); return; }
    if (selectedCoverages.length === 0) { setError('Please select at least one coverage option'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        sum_insured: Number(form.sum_insured),
        coverages: selectedCoverages.map((c) => ({ coverage_name: c, coverage_amount: Number(form.sum_insured) }))
      };
      const res = await createPolicy(payload);
      navigate(`/policies/${res.data.data.policy_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="New Policy Submission" crumb="PolicyCenter">
      <div className="back-link" onClick={() => navigate('/policies')}>&larr; Back to Policies Portfolio</div>
      <div className="page-header">
        <div>
          <h1>Create Personal Accident Submission</h1>
          <p>Guidewire PolicyCenter New Business Workflow &mdash; live AI underwriting scoring &amp; premium rating.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="detail-grid">
          <div className="card card-pad">
            <h3 style={{ marginBottom: 18 }}>Submission Details</h3>
            <div className="form-grid">
              <div className="form-field full">
                <label>Policyholder Account</label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                  <option value="">-- Select registered customer --</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_code} &middot; {c.full_name} ({c.occupation} - {c.occupation_risk_category} Hazard)
                    </option>
                  ))}
                </select>
                {selectedCustomerObj && (
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>
                    Occupation: <b>{selectedCustomerObj.occupation}</b> &middot; Hazard Class: <b>{selectedCustomerObj.occupation_risk_category}</b>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Coverage Package Tier</label>
                <select name="coverage_type" value={form.coverage_type} onChange={handleChange}>
                  <option value="Basic">Basic (₹2.50 per ₹1,000)</option>
                  <option value="Standard">Standard (₹3.50 per ₹1,000)</option>
                  <option value="Comprehensive">Comprehensive (₹5.00 per ₹1,000)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Requested Sum Insured (&#8377;)</label>
                <input type="number" name="sum_insured" min="50000" step="50000" value={form.sum_insured} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label>Effective Inception Date</label>
                <input type="date" name="policy_start_date" value={form.policy_start_date} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label>Expiration Date</label>
                <input type="date" name="policy_end_date" value={form.policy_end_date} onChange={handleChange} required />
                <span className="hint">Defaults to 1-year annual term</span>
              </div>

              <div className="form-field full">
                <label>Issuance Workflow Action</label>
                <select name="policy_status" value={form.policy_status} onChange={handleChange}>
                  <option value="Draft">Save as Draft (Refer to Underwriting Workbench)</option>
                  <option value="Active">Bind &amp; Issue Immediately (Active In Force)</option>
                </select>
              </div>

              <div className="form-field full">
                <label>Coverage Benefit Options</label>
                <div className="coverage-options">
                  {COVERAGE_OPTIONS.map((opt) => (
                    <label key={opt.key} className={`coverage-card ${selectedCoverages.includes(opt.key) ? 'checked' : ''}`}>
                      <input type="checkbox" checked={selectedCoverages.includes(opt.key)} onChange={() => toggleCoverage(opt.key)} />
                      <div>
                        <div className="cc-title">{opt.key}</div>
                        <div className="cc-sub">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/policies')}>Cancel</button>
              <button type="submit" className="btn btn-accent" disabled={saving}>
                {saving ? 'Processing Submission...' : form.policy_status === 'Active' ? 'Approve & Bind Policy' : 'Save Submission to Queue'}
              </button>
            </div>
          </div>

          {/* Right Column: AI Underwriting & Live Premium */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* AI Risk Assessment */}
              <div className="ai-panel">
                <div className="ai-label">&#129504; Live AI Underwriting Engine</div>
                {!form.customer_id && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: '#93A9C2' }}>
                    Select a customer account to trigger real-time AI risk scoring.
                  </div>
                )}
                {riskLoading && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: '#93A9C2' }}>
                    Running inference (Standardizing features &amp; calculating softmax)...
                  </div>
                )}
                {!riskLoading && riskAssessment && (
                  <>
                    <RiskGauge
                      score={riskAssessment.riskScore}
                      tier={riskAssessment.riskTier}
                      label="Underwriting Risk Score"
                    />
                    <div style={{ fontSize: 12, color: '#C7D5E5', marginTop: 8, textAlign: 'center' }}>
                      Premium Loading: <b>+{riskAssessment.premiumLoadingPct}%</b>
                    </div>
                    <ul className="ai-reasons">
                      {riskAssessment.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                    <div className="ai-note">
                      Multinomial Logistic Regression &middot; Test Accuracy: 81.75% &middot; ml/risk_model.json
                    </div>
                  </>
                )}
              </div>

              {/* Live Premium Box */}
              <div className="premium-box">
                <div className="pb-label">Estimated Annual Premium</div>
                <div className="pb-value">
                  {premiumPreview ? `\u20B9${premiumPreview.premium.toLocaleString('en-IN')}` : '\u2014'}
                </div>
                {premiumPreview && (
                  <div className="pb-formula">
                    Base: (&#8377;{Number(form.sum_insured).toLocaleString('en-IN')} &divide; 1,000) &times; {premiumPreview.baseRate} = &#8377;{premiumPreview.basePremium.toLocaleString('en-IN')}<br />
                    {premiumPreview.premiumLoadingPct > 0
                      ? <>AI Loading Surcharge: +{premiumPreview.premiumLoadingPct}% &rarr; &#8377;{premiumPreview.premium.toLocaleString('en-IN')}</>
                      : <>Standard Rate Tier: No risk loading applied</>}
                    <br />Statutory floor: &#8377;500
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}
