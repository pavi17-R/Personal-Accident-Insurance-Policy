import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getPolicyById, renewPolicy, calculatePremium } from '../services/api';

const addOneYear = (dateStr) => {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export default function PolicyRenew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [form, setForm] = useState({ policy_start_date: '', policy_end_date: '', sum_insured: '', coverage_type: '' });
  const [premiumPreview, setPremiumPreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPolicyById(id).then((res) => {
      const p = res.data.data;
      setPolicy(p);
      const newStart = p.policy_end_date.slice(0, 10) > new Date().toISOString().slice(0, 10)
        ? new Date(new Date(p.policy_end_date).getTime() + 86400000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      setForm({
        policy_start_date: newStart,
        policy_end_date: addOneYear(newStart),
        sum_insured: p.sum_insured,
        coverage_type: p.coverage_type
      });
    }).catch(() => setError('Policy not found'));
  }, [id]);

  useEffect(() => {
    if (form.coverage_type && form.sum_insured) {
      calculatePremium({ coverage_type: form.coverage_type, sum_insured: Number(form.sum_insured) })
        .then((res) => setPremiumPreview(res.data.data))
        .catch(() => setPremiumPreview(null));
    }
  }, [form.coverage_type, form.sum_insured]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (name === 'policy_start_date') updated.policy_end_date = addOneYear(value);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await renewPolicy(id, { ...form, sum_insured: Number(form.sum_insured) });
      navigate(`/policies/${res.data.data.policy_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to renew policy');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Layout title="Renew Policy" crumb="Policy Management"><div className="alert alert-error">{error}</div></Layout>;
  if (!policy) return <Layout title="Renew Policy" crumb="Policy Management"><div className="loading-text">Loading&hellip;</div></Layout>;

  return (
    <Layout title="Renew Policy" crumb="Policy Management">
      <div className="back-link" onClick={() => navigate(`/policies/${id}`)}>&larr; Back to Policy</div>
      <div className="page-header">
        <div>
          <h1>Renew Policy</h1>
          <p>Renewal transaction for <span className="mono">{policy.policy_number}</span></p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="detail-grid">
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14 }}>Existing Policy</h3>
            <div className="info-row"><span className="k">Policy Number</span><span className="v mono">{policy.policy_number}</span></div>
            <div className="info-row"><span className="k">Customer</span><span className="v">{policy.full_name}</span></div>
            <div className="info-row"><span className="k">Current Coverage</span><span className="v">{policy.coverage_type}</span></div>
            <div className="info-row"><span className="k">Current Sum Insured</span><span className="v">&#8377;{Number(policy.sum_insured).toLocaleString('en-IN')}</span></div>
            <div className="info-row"><span className="k">Current Premium</span><span className="v">&#8377;{Number(policy.premium).toLocaleString('en-IN')}</span></div>
            <div className="info-row"><span className="k">Current Status</span><span className="v"><StatusBadge status={policy.policy_status} /></span></div>

            <h3 style={{ margin: '22px 0 14px' }}>New Policy Period</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>New Start Date</label>
                <input type="date" name="policy_start_date" value={form.policy_start_date} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>New End Date</label>
                <input type="date" name="policy_end_date" value={form.policy_end_date} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Coverage Type</label>
                <select name="coverage_type" value={form.coverage_type} onChange={handleChange}>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Comprehensive">Comprehensive</option>
                </select>
              </div>
              <div className="form-field">
                <label>Sum Insured (&#8377;)</label>
                <input type="number" name="sum_insured" min="10000" step="10000" value={form.sum_insured} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate(`/policies/${id}`)}>Cancel</button>
              <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? 'Renewing...' : 'Confirm Renewal'}</button>
            </div>
          </div>

          <div className="premium-box">
            <div className="pb-label">New Annual Premium</div>
            <div className="pb-value">{premiumPreview ? `\u20B9${premiumPreview.premium.toLocaleString('en-IN')}` : '\u2014'}</div>
            {premiumPreview && (
              <div className="pb-formula">
                Recalculated using the same rule-based formula:<br />
                (Sum Insured &divide; 1000) &times; base rate ({premiumPreview.baseRate} for {form.coverage_type})
              </div>
            )}
          </div>
        </div>
      </form>
    </Layout>
  );
}
