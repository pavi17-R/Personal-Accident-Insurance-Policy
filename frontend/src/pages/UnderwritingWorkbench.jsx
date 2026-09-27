import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import RiskGauge from '../components/RiskGauge';
import Modal from '../components/Modal';
import { getPolicies, getPolicyById, bindPolicy, declinePolicy } from '../services/api';
import { IconUnderwriting, IconCheck, IconAlert } from '../components/Icons';

export default function UnderwritingWorkbench() {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, title: '', prompt: '', note: '' });
  const [actionBusy, setActionBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const preselectedId = searchParams.get('policy_id');

  const loadQueue = async () => {
    setLoadingList(true);
    try {
      const res = await getPolicies();
      if (res.data.success) {
        setPolicies(res.data.data);
        const match = preselectedId
          ? res.data.data.find((p) => String(p.policy_id) === String(preselectedId))
          : res.data.data.find((p) => p.policy_status === 'Draft') || res.data.data[0];

        if (match) {
          loadPolicyDetail(match.policy_id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  const loadPolicyDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getPolicyById(id);
      if (res.data.success) {
        setSelectedPolicy(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [preselectedId]);

  const handleAction = async () => {
    if (!selectedPolicy || !confirmModal.action) return;
    setActionBusy(true);

    try {
      if (confirmModal.action === 'BIND') {
        await bindPolicy(selectedPolicy.policy_id);
        setToastMessage(`Policy ${selectedPolicy.policy_number} has been successfully Approved and Bound!`);
      } else if (confirmModal.action === 'DECLINE') {
        await declinePolicy(selectedPolicy.policy_id, { reason: confirmModal.note });
        setToastMessage(`Policy ${selectedPolicy.policy_number} declined.`);
      }

      setConfirmModal({ open: false, action: null, title: '', prompt: '', note: '' });
      await loadQueue();
      await loadPolicyDetail(selectedPolicy.policy_id);
    } catch (err) {
      alert(err.response?.data?.message || 'Underwriting action failed');
    } finally {
      setActionBusy(false);
    }
  };

  // Compute explainable factors for the selected policy
  const getExplainableFactors = (p) => {
    if (!p) return [];
    const factors = [];
    if (p.occupation_risk_category === 'High') {
      factors.push({ name: 'Occupation Hazard', impact: '+35% Loading Risk', desc: `Customer occupation is classified as High Hazard (${p.occupation})` });
    } else if (p.occupation_risk_category === 'Medium') {
      factors.push({ name: 'Occupation Hazard', impact: '+15% Loading Risk', desc: `Customer occupation involves travel or field operations (${p.occupation})` });
    } else {
      factors.push({ name: 'Occupation Hazard', impact: 'Neutral', desc: `Sedentary/office occupation hazard level: ${p.occupation || 'Low'}` });
    }

    if (p.coverage_type === 'Comprehensive') {
      factors.push({ name: 'Coverage Scope', impact: 'Elevated Exposure', desc: 'Comprehensive package incorporates Death, Permanent Disability, and Medical Reimbursement.' });
    } else {
      factors.push({ name: 'Coverage Scope', impact: 'Standard Exposure', desc: `${p.coverage_type} coverage package limit selected.` });
    }

    if (Number(p.sum_insured) >= 1000000) {
      factors.push({ name: 'Sum Insured Exposure', impact: 'High Financial Limit', desc: `Requested sum insured (₹${Number(p.sum_insured).toLocaleString('en-IN')}) exceeds standard underwriting threshold.` });
    }

    if (p.risk_tier === 'Low') {
      factors.push({ name: 'Standard Risk Profile', impact: '0% Loading', desc: 'No elevated risk factors detected. Standard base rate pricing approved.' });
    }

    return factors;
  };

  return (
    <Layout title="Underwriting Workbench" crumb="PolicyCenter">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Underwriting Workbench</h1>
          <p>
            Submission review, live AI risk evaluation, premium loading audit, and binding decision workbench.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/policies/new')}>+ Create New Submission</button>
          <button className="btn btn-outline" onClick={() => navigate('/policies')}>Portfolio View</button>
        </div>
      </div>

      {toastMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <IconCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="uw-grid">
        {/* Left Column: Underwriting Queue */}
        <div className="card">
          <div className="card-header">
            <h3>Underwriting Queue ({policies.length})</h3>
          </div>
          <div className="card-pad" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)' }}>Loading queue...</div>
            ) : (
              policies.map((p) => {
                const isSelected = selectedPolicy?.policy_id === p.policy_id;
                return (
                  <div
                    key={p.policy_id}
                    className={`uw-queue-item ${isSelected ? 'active' : ''}`}
                    onClick={() => loadPolicyDetail(p.policy_id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono link-cell" style={{ fontWeight: 700 }}>{p.policy_number}</span>
                      <StatusBadge status={p.policy_status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-800)', marginTop: 4 }}>
                      {p.full_name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 2 }}>
                      {p.coverage_type} &middot; Sum Insured: &#8377;{Number(p.sum_insured).toLocaleString('en-IN')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <RiskBadge level={p.risk_tier || 'Low'} />
                      <span style={{ fontSize: 11, color: 'var(--slate-600)', fontWeight: 600 }}>
                        &#8377;{Number(p.premium).toLocaleString('en-IN')}/yr
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Underwriting Workspace */}
        <div>
          {loadingDetail || !selectedPolicy ? (
            <div className="card card-pad" style={{ textAlign: 'center', padding: 50, color: 'var(--slate-500)' }}>
              Select a policy submission from the queue to start underwriter review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Submission Header Card */}
              <div className="card card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 className="mono" style={{ fontSize: 20 }}>{selectedPolicy.policy_number}</h2>
                      <StatusBadge status={selectedPolicy.policy_status} />
                      <RiskBadge level={selectedPolicy.risk_tier || 'Low'} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4 }}>
                      Account: <span className="link-cell" onClick={() => navigate(`/customers/${selectedPolicy.customer_id}`)}>{selectedPolicy.full_name} ({selectedPolicy.customer_code})</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--slate-500)', letterSpacing: '0.05em' }}>Bound Annual Premium</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy-900)' }}>
                      &#8377;{Number(selectedPolicy.premium).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

                {/* Application Information Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Applicant Occupation</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{selectedPolicy.occupation}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Hazard Tier: <b>{selectedPolicy.occupation_risk_category}</b></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Coverage Type</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{selectedPolicy.coverage_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{selectedPolicy.coverages?.length || 1} benefit lines</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Requested Sum Insured</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>&#8377;{Number(selectedPolicy.sum_insured).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Max liability limit</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Policy Term</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                      {new Date(selectedPolicy.policy_start_date).toLocaleDateString('en-IN')} &rarr; {new Date(selectedPolicy.policy_end_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Risk Assessment & Premium Rating Split */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
                {/* Visual Risk Gauge */}
                <div className="card card-pad" style={{ background: 'var(--navy-900)', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: 11.5, textTransform: 'uppercase', color: '#93A9C2', letterSpacing: '0.05em' }}>
                    AI Underwriting Engine
                  </div>
                  <RiskGauge
                    score={selectedPolicy.risk_score || 25}
                    tier={selectedPolicy.risk_tier || 'Low'}
                    label="Trained Logistic Regression"
                  />
                  <div style={{ fontSize: 11.5, color: '#93A9C2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 10 }}>
                    Applied Loading: <b>+{selectedPolicy.premium_loading_pct}%</b>
                  </div>
                </div>

                {/* Rating Calculation Formula Breakdown */}
                <div className="card card-pad">
                  <h3 style={{ marginBottom: 12 }}>Rating Engine &amp; Premium Breakdown</h3>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--slate-600)' }}>Base Rate ({selectedPolicy.coverage_type})</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {selectedPolicy.coverage_type === 'Comprehensive' ? '5.0' : selectedPolicy.coverage_type === 'Standard' ? '3.5' : '2.5'} per ₹1,000
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--slate-600)' }}>Sum Insured Base Amount</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        &#8377;{Number(selectedPolicy.sum_insured).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--slate-600)' }}>AI Risk Loading (+{selectedPolicy.premium_loading_pct}%)</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: selectedPolicy.premium_loading_pct > 0 ? '#C0362C' : 'var(--green-600)' }}>
                        {selectedPolicy.premium_loading_pct > 0 ? `+${selectedPolicy.premium_loading_pct}% surcharge` : '₹0 (Standard Tier)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', alignItems: 'center' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy-900)' }}>Final Annual Premium</span>
                      <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy-900)' }}>
                        &#8377;{Number(selectedPolicy.premium).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 8 }}>
                    Formula: <code>(Sum Insured / 1000) &times; Base Rate &times; (1 + Loading%)</code> with ₹500 floor.
                  </div>
                </div>
              </div>

              {/* Explainable AI Risk Factors */}
              <div className="card card-pad">
                <h3 style={{ marginBottom: 12 }}>Explainable Underwriting Factors</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {getExplainableFactors(selectedPolicy).map((fac, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 6 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-900)' }}>{fac.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{fac.desc}</div>
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: fac.impact.includes('Loading') ? '#FEE2E2' : '#E0F2FE', color: fac.impact.includes('Loading') ? '#991B1B' : '#0369A1' }}>
                        {fac.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Underwriting Decision Bar */}
              <div className="uw-decision-bar">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Underwriting Authority Decision</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    Current Status: <b>{selectedPolicy.policy_status}</b> &middot; Select adjudication action
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {selectedPolicy.policy_status === 'Draft' && (
                    <>
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            action: 'DECLINE',
                            title: 'Decline Insurance Application',
                            prompt: `Are you sure you want to decline submission ${selectedPolicy.policy_number} for ${selectedPolicy.full_name}?`,
                            note: ''
                          })
                        }
                      >
                        Decline Submission
                      </button>
                      <button
                        className="btn btn-accent"
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            action: 'BIND',
                            title: 'Approve & Bind Policy',
                            prompt: `Approve and bind policy ${selectedPolicy.policy_number} for ${selectedPolicy.full_name} with premium ₹${Number(selectedPolicy.premium).toLocaleString('en-IN')}? This will put the policy into Active in-force status.`,
                            note: ''
                          })
                        }
                      >
                        <IconCheck size={16} />
                        <span>Approve &amp; Bind Policy</span>
                      </button>
                    </>
                  )}

                  {selectedPolicy.policy_status === 'Active' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 600 }}>
                        &#10003; Policy is currently Active and in-force.
                      </span>
                      <button className="btn btn-outline" onClick={() => navigate(`/policies/${selectedPolicy.policy_id}`)}>
                        Open Policy 360&deg;
                      </button>
                    </div>
                  )}

                  {selectedPolicy.policy_status === 'Cancelled' && (
                    <span style={{ fontSize: 12, color: 'var(--red-600)', fontWeight: 600 }}>
                      Policy was declined / cancelled.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <Modal title={confirmModal.title} onClose={() => setConfirmModal({ open: false, action: null, title: '', prompt: '', note: '' })}>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13.5, color: 'var(--slate-800)', lineHeight: 1.5, marginBottom: 16 }}>
              {confirmModal.prompt}
            </p>

            {confirmModal.action === 'DECLINE' && (
              <div className="form-field full" style={{ marginBottom: 16 }}>
                <label>Decline Rationale / Underwriter Notes</label>
                <textarea
                  rows="3"
                  value={confirmModal.note}
                  onChange={(e) => setConfirmModal({ ...confirmModal, note: e.target.value })}
                  placeholder="e.g. Excessive occupation hazard, prior claim severity, or sum insured out of bounds."
                />
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={actionBusy}
                onClick={() => setConfirmModal({ open: false, action: null, title: '', prompt: '', note: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={confirmModal.action === 'DECLINE' ? 'btn btn-danger' : 'btn btn-accent'}
                disabled={actionBusy}
                onClick={handleAction}
              >
                {actionBusy ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
