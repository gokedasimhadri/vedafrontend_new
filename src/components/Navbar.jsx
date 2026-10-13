import React from 'react';
import { Moon, Sun, ArrowRight } from 'lucide-react';

export default function Navbar({
  darkMode,
  setDarkMode,
  activePage = 'home',
  setActivePage,
  onRegisterClick
}) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Events' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'team', label: 'Team' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (pageId, e) => {
    e.preventDefault();
    if (setActivePage) {
      setActivePage(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="veda-navbar">
      <div className="veda-container">
        <div className="veda-nav-content">
          {/* Aditya University Branding & NAAC A++ */}
          <div
            className="brand-section"
            style={{ cursor: 'pointer' }}
            onClick={(e) => handleNavClick('home', e)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Aditya Gold University Emblem */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                fontWeight: '900',
                fontSize: '1.2rem'
              }}>
                AU
              </div>
              <div className="crest-text-wrap">
                <span className="crest-title" style={{ color: darkMode ? '#60a5fa' : '#0b2240' }}>ADITYA</span>
                <span className="crest-subtitle" style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}>UNIVERSITY</span>
              </div>
            </div>

            <div className="naac-badge" style={{ background: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
              <span className="naac-text">ACCREDITED BY</span>
              <span className="naac-grade" style={{ color: '#0284c7' }}>NAAC A++</span>
            </div>
          </div>

          {/* Dedicated Page Navigation Links */}
          <nav>
            <ul className="nav-links">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={(e) => handleNavClick(item.id, e)}
                      className={`nav-item-link ${isActive ? 'active' : ''}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? '#0284c7' : (darkMode ? '#cbd5e1' : '#64748b'),
                        fontWeight: isActive ? '800' : '600',
                        fontSize: '0.95rem',
                        padding: '8px 0'
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions: Dark mode + Register / Login */}
          <div className="nav-actions">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle-btn"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button onClick={onRegisterClick} className="btn-primary">
              <span>Register Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
