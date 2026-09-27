import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCustomers, deleteCustomer } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { IconSearch } from '../components/Icons';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = (q = '') => {
    setLoading(true);
    getCustomers(q)
      .then((res) => {
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      })
      .catch(() => setError('Failed to load customers.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer ${name}? Action cannot be undone and will be blocked if active policies exist.`)) return;
    try {
      await deleteCustomer(id);
      load(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const filtered = customers.filter((c) => {
    if (!hazardFilter) return true;
    return c.occupation_risk_category === hazardFilter;
  });

  return (
    <Layout title="Policyholder Accounts" crumb="Customer 360">
      <div className="page-header">
        <div>
          <h1>Customer &amp; Account Management</h1>
          <p>
            Guidewire Account &amp; Contact equivalent &mdash; customer dossier, occupation hazard tier, and exposure history.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/customers/new')}>
          + Onboard New Customer
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="icon"><IconSearch size={15} color="var(--slate-400)" /></span>
          <input
            placeholder="Search by customer name, code (CUST-...), email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={hazardFilter} onChange={(e) => setHazardFilter(e.target.value)}>
          <option value="">All Hazard Tiers</option>
          <option value="Low">Low Hazard (Office/Desk)</option>
          <option value="Medium">Medium Hazard (Field/Travel)</option>
          <option value="High">High Hazard (Hazardous Site)</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Occupation &amp; Hazard Tier</th>
                <th>Gender</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>Loading customer accounts...</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                      <h4>No customers found</h4>
                      <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>Try adjusting your search criteria or register a new customer.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.customer_id}>
                  <td className="mono font-bold link-cell" onClick={() => navigate(`/customers/${c.customer_id}`)}>
                    {c.customer_code}
                  </td>
                  <td className="link-cell font-bold" onClick={() => navigate(`/customers/${c.customer_id}`)}>
                    {c.full_name}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{c.occupation}</span>
                      <RiskBadge level={c.occupation_risk_category} />
                    </div>
                  </td>
                  <td>{c.gender}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/customers/${c.customer_id}`)}>
                        Customer 360&deg;
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/customers/${c.customer_id}/edit`)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.customer_id, c.full_name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
