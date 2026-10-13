import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, ShieldAlert, Phone, Mail, User, Calendar, MapPin, Layers, ArrowRight } from 'lucide-react';

export default function EventDetailsModal({ event, onClose, onRegister }) {
  const [activeTab, setActiveTab] = useState('rules');

  if (!event) return null;

  return (
    <div className="veda-modal-overlay" onClick={onClose}>
      <div className="veda-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Banner with Close button */}
        <div className="modal-header-banner" style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,34,64,0.9) 100%), url(${typeof event.banner === 'object' ? (event.banner?.url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80') : (event.banner || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '24px'
        }}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>

          <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {(typeof event.categoryName === 'string' ? event.categoryName : event.categoryName?.name) || 'Technical Track'} • VEDA 2k26
          </span>
          <h2 style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2, marginTop: '4px' }}>
            {typeof event.title === 'string' ? event.title : 'Event Details'}
          </h2>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 24px',
          background: 'var(--bg-main)'
        }}>
          {['rules', 'prizes', 'coordinators'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '14px 18px',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                color: activeTab === tab ? '#0284c7' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2.5px solid #0284c7' : '2.5px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'rules' && 'Rules & Guidelines'}
              {tab === 'prizes' && 'Prizes & Rewards'}
              {tab === 'coordinators' && 'Coordinators & Help'}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body-pad">
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Event Overview</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{event.description}</p>
              </div>

              {event.rules && event.rules.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} color="#0284c7" />
                    <span>Rules & Regulations</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {event.rules.map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-dark)' }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.outcomes && event.outcomes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Key Takeaways & Certification</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {event.outcomes.map((item, idx) => (
                      <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' }}>
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prizes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid #fcd34d', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <Trophy size={32} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '700' }}>1st Prize (Winner)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#b45309' }}>{event.prizes?.first || '₹ 15,000'}</div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.05) 100%)', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <Trophy size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700' }}>2nd Prize (Runner-up)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#334155' }}>{event.prizes?.second || '₹ 10,000'}</div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(180, 83, 9, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%)', border: '1px solid #fed7aa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <Trophy size={32} color="#d97706" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#9a3412', fontWeight: '700' }}>3rd Prize (Special)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#c2410c' }}>{event.prizes?.third || '₹ 5,000'}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                * All certified participants receive verified IEEE / Aditya University participation certificates.
              </p>
            </div>
          )}

          {activeTab === 'coordinators' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '1.1rem' }}>Faculty & Student Leads</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {event.coordinators?.faculty?.map((f, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{f.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '600' }}>Faculty Coordinator</div>
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> {f.phone}
                    </div>
                  </div>
                ))}

                {event.coordinators?.student?.map((s, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '600' }}>Student Coordinator</div>
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> {s.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            marginTop: '10px'
          }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Fee</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7' }}>
                {!event.fee || event.fee.type === 'FREE' ? 'FREE ENTRY' : `₹ ${event.fee?.amountPerUnit} ${event.fee?.chargeModel === 'PER_TEAM' ? '/ Team' : '/ Participant'}`}
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onRegister(event);
              }}
              className="btn-cyan"
            >
              <span>Proceed to Register</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
