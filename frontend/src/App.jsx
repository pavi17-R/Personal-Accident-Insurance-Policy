import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import UnderwritingWorkbench from './pages/UnderwritingWorkbench';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetails from './pages/CustomerDetails';
import Policies from './pages/Policies';
import PolicyForm from './pages/PolicyForm';
import PolicyDetails from './pages/PolicyDetails';
import PolicyRenew from './pages/PolicyRenew';
import PolicyCancel from './pages/PolicyCancel';
import Claims from './pages/Claims';
import ClaimForm from './pages/ClaimForm';
import ClaimDetails from './pages/ClaimDetails';
import FraudIntelligence from './pages/FraudIntelligence';
import Analytics from './pages/Analytics';
import ModelCenter from './pages/ModelCenter';
import ActivityAudit from './pages/ActivityAudit';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/command-center" element={<Navigate to="/dashboard" replace />} />

        {/* Underwriting */}
        <Route path="/underwriting" element={<UnderwritingWorkbench />} />

        {/* PolicyCenter */}
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/new" element={<PolicyForm />} />
        <Route path="/policies/:id" element={<PolicyDetails />} />
        <Route path="/policies/:id/renew" element={<PolicyRenew />} />
        <Route path="/policies/:id/cancel" element={<PolicyCancel />} />

        {/* ClaimCenter */}
        <Route path="/claims" element={<Claims />} />
        <Route path="/claims/new" element={<ClaimForm />} />
        <Route path="/claims/:id" element={<ClaimDetails />} />
        <Route path="/fraud-intelligence" element={<FraudIntelligence />} />

        {/* Customers */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />

        {/* Analytics, Model Center, Audit */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/model-center" element={<ModelCenter />} />
        <Route path="/activity-audit" element={<ActivityAudit />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}
