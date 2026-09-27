import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDashboard, getPolicies, getClaims } from '../services/api';
import { IconAnalytics } from '../components/Icons';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => setError('Failed to load portfolio analytics from database.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return <Layout title="Analytics" crumb="Intelligence"><div className="alert alert-error">{error}</div></Layout>;
  }

  if (loading || !data) {
    return (
      <Layout title="Analytics" crumb="Intelligence">
        <div className="skeleton" style={{ height: 180, marginBottom: 20 }}></div>
        <div className="detail-grid">
          <div className="skeleton" style={{ height: 260 }}></div>
          <div className="skeleton" style={{ height: 260 }}></div>
        </div>
      </Layout>
    );
  }

  const totalPremium = data.totalPremium || 1;
  const totalPolicies = data.totalPolicies || 1;
  const totalClaims = data.totalClaims || 1;

  return (
    <Layout title="Insurance Operations Analytics" crumb="Intelligence">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Insurance Portfolio &amp; Loss Analytics</h1>
          <p>
            Real database metrics calculated from MySQL tables &mdash; zero synthetic or mocked values.
          </p>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="label">Total In-Force Premium</div>
          <div className="value">&#8377;{Number(data.inForcePremium).toLocaleString('en-IN')}</div>
          <div className="sub">Active written premium</div>
        </div>

        <div className="stat-card c-teal">
          <div className="label">Total Cumulative Premium</div>
          <div className="value">&#8377;{Number(data.totalPremium).toLocaleString('en-IN')}</div>
          <div className="sub">Across all policy terms</div>
        </div>

        <div className="stat-card c-amber">
          <div className="label">Total Claims Payout</div>
          <div className="value">&#8377;{Number(data.totalClaimPayout).toLocaleString('en-IN')}</div>
          <div className="sub">Approved &amp; Paid disbursements</div>
        </div>

        <div className="stat-card">
          <div className="label">Loss Ratio Exposure</div>
          <div className="value" style={{ fontSize: 24, marginTop: 4 }}>
            {data.inForcePremium > 0
              ? `${Math.round((data.totalClaimPayout / data.inForcePremium) * 100)}%`
              : '0%'}
          </div>
          <div className="sub">Claims Payout / In-Force Premium</div>
        </div>
      </div>

      <div className="detail-grid" style={{ marginBottom: 20 }}>
        {/* Chart 1: Premium by Coverage Type */}
        <div className="card card-pad">
          <div className="card-header" style={{ padding: '0 0 14px' }}>
            <h3>Gross Premium by Coverage Package</h3>
          </div>
          {data.coverageTypeDistribution?.length === 0 ? (
            <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>No policy data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.coverageTypeDistribution.map((row) => {
                const pct = Math.round((Number(row.sum_premium) / totalPremium) * 100);
                return (
                  <div key={row.coverage_type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{row.coverage_type} Coverage</span>
                      <span className="mono font-bold">&#8377;{Number(row.sum_premium).toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: 'var(--slate-200)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: row.coverage_type === 'Comprehensive' ? '#0369A1' : row.coverage_type === 'Standard' ? '#0D9488' : '#64748B'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Policy Status Lifecycle Breakdown */}
        <div className="card card-pad">
          <div className="card-header" style={{ padding: '0 0 14px' }}>
            <h3>Policy Lifecycle Status Distribution</h3>
          </div>
          {data.policiesByStatus?.length === 0 ? (
            <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>No policies recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.policiesByStatus.map((row) => {
                const pct = Math.round((Number(row.count) / totalPolicies) * 100);
                return (
                  <div key={row.policy_status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{row.policy_status}</span>
                      <span className="mono font-bold">{row.count} policies ({pct}%)</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: 'var(--slate-200)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: row.policy_status === 'Active' ? '#10B981' : row.policy_status === 'Draft' ? '#0284C7' : row.policy_status === 'Expired' ? '#EF4444' : '#F59E0B'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Chart 3: AI Underwriting Risk Distribution */}
        <div className="card card-pad">
          <div className="card-header" style={{ padding: '0 0 14px' }}>
            <h3>AI Underwriting Risk Tier Breakdown</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.riskDistribution?.map((row) => {
              const pct = Math.round((Number(row.count) / totalPolicies) * 100);
              return (
                <div key={row.risk_tier}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{row.risk_tier} Risk ({row.risk_tier === 'High' ? '+35%' : row.risk_tier === 'Medium' ? '+15%' : '0%'} loading)</span>
                    <span className="mono font-bold">{row.count} policies ({pct}%)</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--slate-200)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: row.risk_tier === 'High' ? '#EF4444' : row.risk_tier === 'Medium' ? '#F59E0B' : '#10B981'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Claims Resolution Funnel */}
        <div className="card card-pad">
          <div className="card-header" style={{ padding: '0 0 14px' }}>
            <h3>Claims Adjudication Funnel</h3>
          </div>
          {data.claimsByStatus?.length === 0 ? (
            <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>No claims recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.claimsByStatus.map((row) => {
                const pct = Math.round((Number(row.count) / totalClaims) * 100);
                return (
                  <div key={row.claim_status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{row.claim_status}</span>
                      <span className="mono font-bold">{row.count} claims &middot; &#8377;{Number(row.sum_amount).toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: 'var(--slate-200)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: row.claim_status === 'Approved' || row.claim_status === 'Paid' ? '#10B981' : row.claim_status === 'UnderReview' ? '#F59E0B' : row.claim_status === 'Rejected' ? '#EF4444' : '#0284C7'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
