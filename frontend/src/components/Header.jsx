import { IconSearch, IconShield } from './Icons';

export default function Header({ title, crumb, onOpenSearch, onOpenGuidewireGuide }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">
          {crumb && <span className="crumb">{crumb} /</span>}
          <span>{title}</span>
        </div>
      </div>

      <div className="topbar-center">
        <button className="search-trigger-btn" onClick={onOpenSearch} type="button">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSearch size={15} color="var(--slate-400)" />
            <span>Search policies, claims, customers...</span>
          </div>
          <span className="kbd-shortcut">Ctrl K</span>
        </button>
      </div>

      <div className="topbar-actions">
        <button className="gw-badge-btn" onClick={onOpenGuidewireGuide} type="button" title="View Guidewire PolicyCenter/ClaimCenter Mapping">
          <IconShield size={14} color="#0284C7" />
          <span>Guidewire Alignment</span>
        </button>

        <div className="user-chip">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)', color: '#fff' }}>UW</div>
          <div>
            <div className="u-name">Underwriting Officer</div>
            <div className="u-role">PolicyCenter &middot; ClaimCenter</div>
          </div>
        </div>
      </div>
    </header>
  );
}
