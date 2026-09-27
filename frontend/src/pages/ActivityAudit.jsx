import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getActivities } from '../services/api';
import { IconActivity, IconSearch } from '../components/Icons';

export default function ActivityAudit() {
  const [activities, setActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = { limit: 100 };
    if (search) params.search = search;
    if (selectedType && selectedType !== 'ALL') params.type = selectedType;

    getActivities(params)
      .then((res) => {
        if (res.data.success) {
          setActivities(res.data.data.activities);
          setTotal(res.data.data.total);
          if (res.data.data.activityTypes?.length > 0) {
            setActivityTypes(res.data.data.activityTypes);
          }
        }
      })
      .catch(() => setError('Failed to retrieve activity audit records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedType]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const getActivityBadgeColor = (type) => {
    if (type.includes('POLICY')) return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    if (type.includes('CLAIM')) return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    if (type.includes('CUSTOMER')) return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
    return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  };

  return (
    <Layout title="Operations Ledger &amp; Audit Trail" crumb="System Governance">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Enterprise Operations Audit Trail</h1>
          <p>
            Immutable event journal tracking all policy issuances, underwriting decisions, renewals, cancellations, and claim settlements.
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--slate-500)', fontWeight: 600 }}>
          {total} Total Audit Records
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="icon"><IconSearch size={15} color="var(--slate-400)" /></span>
          <input
            placeholder="Search audit descriptions, customer names, or policy numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="ALL">All Event Types</option>
          {activityTypes.map((t) => (
            <option key={t.activity_type} value={t.activity_type}>
              {t.activity_type} ({t.count})
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>Timestamp</th>
                <th style={{ width: 200 }}>Event Type</th>
                <th>Operation Description &amp; Audit Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: 24 }}>Loading audit records...</td></tr>
              )}
              {!loading && activities.length === 0 && (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                      <h4>No matching audit records</h4>
                      <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>Try clearing filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {activities.map((a) => {
                const style = getActivityBadgeColor(a.activity_type);
                return (
                  <tr key={a.activity_id}>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--slate-600)' }}>
                      {new Date(a.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          display: 'inline-block'
                        }}
                      >
                        {a.activity_type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-900)' }}>
                      {a.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
