import Modal from './Modal';
import { IconShield } from './Icons';

export default function GuidewireModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Modal title="Guidewire Insurance Suite Concept Mapping" onClose={onClose}>
      <div className="gw-modal-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#0369A1', color: '#fff', padding: 6, borderRadius: 6, display: 'flex' }}>
            <IconShield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>PA INSURE Architecture Alignment</div>
            <div style={{ fontSize: 11.5, color: 'var(--slate-500)' }}>
              Independent Full-Stack Insurance Platform inspired by Guidewire PolicyCenter &amp; ClaimCenter
            </div>
          </div>
        </div>

        <div className="gw-flow-box">
          <b>Core Operations Flow:</b><br />
          <code>
            Customer &rarr; Account / Application &rarr; AI Underwriting &rarr; Risk Loading &rarr; Bound Policy &rarr; Policy Management &rarr; Renewal / Cancellation &rarr; Claim Intake &rarr; AI Fraud Screening &rarr; Adjuster Adjudication &rarr; Settlement
          </code>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--slate-600)', lineHeight: 1.6 }}>
          <b>Academic &amp; Architectural Positioning:</b> This project is an independent implementation created to demonstrate real-world property &amp; casualty (P&amp;C) personal accident insurance workflows. Rather than a superficial CRUD form, the platform is architected around the core domain concepts popularized by Guidewire&rsquo;s enterprise software suite:
        </p>

        <h4 style={{ fontSize: 13, marginTop: 14, color: 'var(--navy-900)' }}>1. PolicyCenter Concept Mapping</h4>
        <table className="gw-concept-table">
          <thead>
            <tr>
              <th>Guidewire PolicyCenter Concept</th>
              <th>PA INSURE Implementation</th>
              <th>Domain Function</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Account &amp; Contact</b></td>
              <td><code>customers</code> entity &amp; Customer 360&deg;</td>
              <td>Policyholder identity, contact dossier, occupation hazard classification</td>
            </tr>
            <tr>
              <td><b>Submission &amp; Underwriting</b></td>
              <td>Underwriting Workbench &amp; <code>/underwriting</code></td>
              <td>Risk profiling, underwriting referral rules, manual approve/refer/decline</td>
            </tr>
            <tr>
              <td><b>Policy &amp; PolicyPeriod</b></td>
              <td><code>policies</code> table &amp; Policy 360&deg;</td>
              <td>Time-bound in-force contracts with terms, effective/expiry dates, and parent lineage</td>
            </tr>
            <tr>
              <td><b>Product Model (Coverages)</b></td>
              <td><code>policy_coverages</code> line items</td>
              <td>Accidental Death, Permanent Disability, and Medical Expense benefit limits</td>
            </tr>
            <tr>
              <td><b>Rating Engine &amp; Rate Books</b></td>
              <td><code>premiumService.js</code> (Base Rate + AI Loading)</td>
              <td>Actuarial base rating per ₹1,000 Sum Insured + dynamic ML risk loading (+0%/+15%/+35%)</td>
            </tr>
            <tr>
              <td><b>Policy Lifecycle Jobs</b></td>
              <td>Issuance, Renewal (lineage chain), Cancellation</td>
              <td>Draft &rarr; Active &rarr; Renewed / Expired / Cancelled state machine</td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ fontSize: 13, marginTop: 18, color: 'var(--navy-900)' }}>2. ClaimCenter Concept Mapping</h4>
        <table className="gw-concept-table">
          <thead>
            <tr>
              <th>Guidewire ClaimCenter Concept</th>
              <th>PA INSURE Implementation</th>
              <th>Domain Function</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>First Notice of Loss (FNOL)</b></td>
              <td>Claim Filing Workspace &amp; Intake Form</td>
              <td>Incident capture, loss description, incident date vs policy term validation</td>
            </tr>
            <tr>
              <td><b>Exposure &amp; Coverage Limit Check</b></td>
              <td>Coverage verification in <code>claimController.js</code></td>
              <td>Enforces claim amount &le; purchased coverage limit for the claimed line</td>
            </tr>
            <tr>
              <td><b>Adjuster Review &amp; Adjudication</b></td>
              <td>Claims Intelligence Center &amp; Claim Details</td>
              <td>Adjuster decision notes, Approve, Reject, and Mark Paid operations</td>
            </tr>
            <tr>
              <td><b>SIU Referral (Fraud Triage)</b></td>
              <td>AI Fraud Model &amp; Fraud Watchlist</td>
              <td>Auto-routes High fraud probability claims to <code>UnderReview</code> with explainable flags</td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ fontSize: 13, marginTop: 18, color: 'var(--navy-900)' }}>3. Guidewire Predict / Cyence Integration</h4>
        <p style={{ fontSize: 12.5, color: 'var(--slate-600)', lineHeight: 1.6 }}>
          In modern Guidewire Cloud deployments, <b>Guidewire Predict</b> injects machine learning scores directly into PolicyCenter and ClaimCenter workflows. PA INSURE reflects this design: the ML models score applicants at point-of-quote and claims at submission, surfacing <b>explainable factors and red flags</b> to the human underwriter and adjuster before binding or settlement.
        </p>
      </div>
    </Modal>
  );
}
