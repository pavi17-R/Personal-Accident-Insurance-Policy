import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPolicyById, cancelPolicy } from '../services/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PolicyCancel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [form, setForm] = useState({ cancellation_reason: '', cancellation_date: todayISO() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPolicyById(id).then((res) => setPolicy(res.data.data)).catch(() => setError('Policy not found'));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await cancelPolicy(id, form);
      navigate(`/policies/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel policy');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Layout title="Cancel Policy" crumb="Policy Management"><div className="alert alert-error">{error}</div></Layout>;
  if (!policy) return <Layout title="Cancel Policy" crumb="Policy Management"><div className="loading-text">Loading&hellip;</div></Layout>;

  return (
    <Layout title="Cancel Policy" crumb="Policy Management">
      <div className="back-link" onClick={() => navigate(`/policies/${id}`)}>&larr; Back to Policy</div>
      <div className="page-header">
        <div>
          <h1>Cancel Policy</h1>
          <p>Cancellation transaction for <span className="mono">{policy.policy_number}</span></p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card card-pad" style={{ maxWidth: 560 }}>
        <div className="alert alert-info">
          You are about to cancel policy <strong className="mono">{policy.policy_number}</strong> held by <strong>{policy.full_name}</strong>. This action cannot be undone.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid single">
            <div className="form-field">
              <label>Cancellation Reason</label>
              <select name="cancellation_reason" value={form.cancellation_reason} onChange={(e) => setForm({ ...form, cancellation_reason: e.target.value })} required>
                <option value="">-- Select reason --</option>
                <option>Customer requested cancellation</option>
                <option>Non-payment of premium</option>
                <option>Policy replaced with new coverage</option>
                <option>Duplicate policy issued in error</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Cancellation Date</label>
              <input type="date" value={form.cancellation_date} onChange={(e) => setForm({ ...form, cancellation_date: e.target.value })} required />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/policies/${id}`)}>Go Back</button>
            <button type="submit" className="btn btn-danger" disabled={saving} style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)' }}>
              {saving ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
