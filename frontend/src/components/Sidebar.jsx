import { NavLink } from 'react-router-dom';
import {
  IconCommandCenter,
  IconUnderwriting,
  IconPolicy,
  IconClaims,
  IconFraud,
  IconCustomers,
  IconAnalytics,
  IconModelCenter,
  IconActivity,
  IconShield
} from './Icons';

const navItems = [
  { to: '/dashboard', label: 'Command Center', icon: IconCommandCenter },
  { to: '/underwriting', label: 'Underwriting', icon: IconUnderwriting },
  { to: '/policies', label: 'Policy 360', icon: IconPolicy },
  { to: '/claims', label: 'Claims', icon: IconClaims },
  { to: '/fraud-intelligence', label: 'Fraud Intelligence', icon: IconFraud },
  { to: '/customers', label: 'Customers', icon: IconCustomers },
  { to: '/analytics', label: 'Analytics', icon: IconAnalytics },
  { to: '/model-center', label: 'Model Center', icon: IconModelCenter },
  { to: '/activity-audit', label: 'Activity / Audit', icon: IconActivity }
];

export default function Sidebar({ onOpenGuidewireGuide }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="shield" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}>
          <IconShield size={20} color="#fff" />
        </div>
        <div className="brand-text">
          <div className="name" style={{ letterSpacing: '0.04em', fontWeight: 800 }}>PA INSURE</div>
          <div className="sub" style={{ fontSize: '9.5px', color: '#7DD3FC' }}>AI Insurance Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Operations Suite</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span className="icon"><Icon size={17} /></span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Architecture</div>
        <div
          className="sidebar-link"
          onClick={onOpenGuidewireGuide}
          style={{ cursor: 'pointer', color: '#93A9C2' }}
        >
          <span className="icon"><IconShield size={17} color="#38BDF8" /></span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            Guidewire Concepts
            <span style={{ fontSize: 9.5, background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
              ALIGNED
            </span>
          </span>
        </div>
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', fontSize: 11, color: '#93A9C2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>MySQL &middot; ML Engine Online</span>
        </div>
        <div>Guidewire Policy &amp; Claim Architecture</div>
      </div>
    </aside>
  );
}
