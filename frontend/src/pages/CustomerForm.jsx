import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCustomerById, createCustomer, updateCustomer } from '../services/api';

const empty = { full_name: '', date_of_birth: '', gender: 'Male', phone: '', email: '', address: '', occupation: '', occupation_risk_category: 'Low' };

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getCustomerById(id).then((res) => {
        const c = res.data.data;
        setForm({
          full_name: c.full_name,
          date_of_birth: c.date_of_birth?.slice(0, 10),
          gender: c.gender,
          phone: c.phone,
          email: c.email,
          address: c.address,
          occupation: c.occupation || '',
          occupation_risk_category: c.occupation_risk_category || 'Low'
        });
      });
    }
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateCustomer(id, form);
        navigate(`/customers/${id}`);
      } else {
        const res = await createCustomer(form);
        navigate(`/customers/${res.data.data.customer_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title={isEdit ? 'Edit Customer' : 'New Customer'} crumb="Account Management">
      <div className="back-link" onClick={() => navigate('/customers')}>&larr; Back to Customers</div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p>{isEdit ? 'Update policyholder account details' : 'Register a new policyholder account'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card card-pad">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field full">
              <label>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="e.g. Arun Kumar" />
            </div>
            <div className="form-field">
              <label>Date of Birth</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="10-digit mobile number" />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="name@example.com" />
            </div>
            <div className="form-field full">
              <label>Address</label>
              <textarea name="address" rows="3" value={form.address} onChange={handleChange} required placeholder="Street, City, State" />
            </div>
            <div className="form-field">
              <label>Occupation</label>
              <input name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Software Engineer" />
              <span className="hint">Used by the AI underwriting risk model</span>
            </div>
            <div className="form-field">
              <label>Occupation Hazard Class</label>
              <select name="occupation_risk_category" value={form.occupation_risk_category} onChange={handleChange}>
                <option value="Low">Low &mdash; office / desk-based</option>
                <option value="Medium">Medium &mdash; frequent travel / field work</option>
                <option value="High">High &mdash; hazardous / physical site work</option>
              </select>
              <span className="hint">Underwriter-assigned hazard class, feeds the risk model</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/customers')}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
