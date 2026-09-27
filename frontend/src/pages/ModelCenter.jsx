import Layout from '../components/Layout';
import { IconModelCenter, IconCheck } from '../components/Icons';

export default function ModelCenter() {
  return (
    <Layout title="AI Model Center & Governance" crumb="Predictive Intelligence">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>AI Model Center &amp; Governance</h1>
          <p>
            Architectural documentation and verified offline test benchmarks for the two scikit-learn models powering PA INSURE.
          </p>
        </div>
      </div>

      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, lineHeight: 1.6, color: '#0369A1' }}>
        <b>Verified Repository Model Metrics:</b> Values and confusion matrices displayed below reflect the actual evaluation run from <code>ml/train_models.py</code> recorded in <code>ml/MODEL_METRICS.md</code>. Inference executes at runtime in pure JavaScript (<code>backend/services/mlService.js</code>) using exported coefficients from <code>ml/*.json</code>.
      </div>

      {/* Model 1: Underwriting Risk Model */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#0284C7', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                MODEL 01
              </span>
              <h2 style={{ fontSize: 18, color: 'var(--navy-900)' }}>Underwriting Risk Tier Engine</h2>
            </div>
            <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 4 }}>
              Multinomial Logistic Regression with Softmax Activation &middot; <code>ml/risk_model.json</code>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Held-out Test Accuracy</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--teal-600)' }}>81.75%</div>
            <div style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>Macro F1: <b>0.7913</b></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Training Dataset</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>3,200 Samples</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Held-out Test Set</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>800 Samples (20%)</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Output Classes</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Low, Medium, High</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Rating Impact</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>+0%, +15%, +35% Loading</div>
          </div>
        </div>

        {/* Features list */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-600)', letterSpacing: '0.04em' }}>
            Input Feature Vector (Standardized via StandardScaler):
          </div>
          <div className="feature-tag-list">
            <span className="feature-tag">1. age (18 - 65)</span>
            <span className="feature-tag">2. occupation_risk (0=Low, 1=Medium, 2=High)</span>
            <span className="feature-tag">3. coverage_type (0=Basic, 1=Standard, 2=Comprehensive)</span>
            <span className="feature-tag">4. sum_insured_lakh (Sum Insured / 1,00,000)</span>
            <span className="feature-tag">5. prior_claims (Lifetime count)</span>
            <span className="feature-tag">6. tenure_years (Customer loyalty)</span>
          </div>
        </div>

        {/* Confusion Matrix & Classification Report Split */}
        <div className="detail-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: 6 }}>
              3&times;3 Test Confusion Matrix (Rows=Actual, Cols=Predicted):
            </div>
            <table className="confusion-matrix-table">
              <thead>
                <tr>
                  <th>Actual \ Predicted</th>
                  <th>Pred: Low</th>
                  <th>Pred: Medium</th>
                  <th>Pred: High</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual: Low</th>
                  <td className="highlight">395 (Correct)</td>
                  <td>45</td>
                  <td>0</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual: Medium</th>
                  <td>51</td>
                  <td className="highlight">167 (Correct)</td>
                  <td>22</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual: High</th>
                  <td>0</td>
                  <td>28</td>
                  <td className="highlight">92 (Correct)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: 6 }}>
              Class Precision, Recall &amp; F1-Scores:
            </div>
            <table className="confusion-matrix-table">
              <thead>
                <tr>
                  <th>Risk Tier</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Low Risk</td>
                  <td>0.89</td>
                  <td>0.90</td>
                  <td className="font-bold">0.89</td>
                  <td>440</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Medium Risk</td>
                  <td>0.70</td>
                  <td>0.70</td>
                  <td className="font-bold">0.70</td>
                  <td>240</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>High Risk</td>
                  <td>0.81</td>
                  <td>0.77</td>
                  <td className="font-bold">0.79</td>
                  <td>120</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Model 2: Claims Fraud Detection Model */}
      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#DC2626', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                MODEL 02
              </span>
              <h2 style={{ fontSize: 18, color: 'var(--navy-900)' }}>Claims Fraud Detection &amp; SIU Triage Engine</h2>
            </div>
            <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 4 }}>
              Binary Logistic Regression (Class-Balanced Loss) &middot; <code>ml/fraud_model.json</code>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Held-out Test Accuracy</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy-900)' }}>67.67%</div>
            <div style={{ fontSize: 11.5, color: '#C0362C' }}>Fraud Recall: <b>67%</b> &middot; F1: <b>0.4425</b></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Training Dataset</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>2,400 Samples</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Test Dataset</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>600 Samples (20%)</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Fraud Prevalence</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>19.10% Base Rate</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Tuning Strategy</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Recall-Biased (SIU)</div>
          </div>
        </div>

        {/* Features list */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-600)', letterSpacing: '0.04em' }}>
            Input Feature Vector (Standardized via StandardScaler):
          </div>
          <div className="feature-tag-list">
            <span className="feature-tag">1. claim_to_sum_insured_ratio (Ratio clamped &le; 1.2)</span>
            <span className="feature-tag">2. days_since_policy_start (Policy inception timing)</span>
            <span className="feature-tag">3. days_to_file (Reporting latency)</span>
            <span className="feature-tag">4. prior_claims_12m (Recent claim frequency)</span>
            <span className="feature-tag">5. claim_type_risk (Medical=0, Disability=1, Death=2)</span>
            <span className="feature-tag">6. is_near_policy_end (1 if &le;30 days before expiration)</span>
          </div>
        </div>

        {/* Confusion Matrix & Viva Rationale Split */}
        <div className="detail-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: 6 }}>
              2&times;2 Test Confusion Matrix (Rows=Actual, Cols=Predicted):
            </div>
            <table className="confusion-matrix-table">
              <thead>
                <tr>
                  <th>Actual \ Predicted</th>
                  <th>Pred: Legit Claim</th>
                  <th>Pred: Fraudulent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual: Legit (485)</th>
                  <td className="highlight">329 (True Negative)</td>
                  <td>156 (False Positive)</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual: Fraud (115)</th>
                  <td>38 (False Negative)</td>
                  <td className="highlight">77 (True Positive - Caught)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px 16px', borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, color: '#92400E' }}>
            <b>Viva Rationale: Why Recall (67%) is Prioritized over Precision (33%):</b><br />
            In insurance claims fraud triage, an undetected fraudulent claim (<b>False Negative</b>) results in a catastrophic direct financial loss of the entire claim payout (e.g. ₹5,00,000). In contrast, flagging an honest claim for adjuster verification (<b>False Positive</b>) simply routes it to human review (an adjuster spends 10 minutes checking receipts). The model is therefore deliberately class-balanced to maximize recall.
          </div>
        </div>
      </div>
    </Layout>
  );
}
