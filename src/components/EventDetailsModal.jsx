import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, ShieldAlert, Phone, Mail, User, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

export default function EventDetailsModal({ event, onClose, onRegister, committeeMembers = [] }) {
  const [activeTab, setActiveTab] = useState('rules');

  if (!event) return null;

  // Normalize fee
  const feeAmount = event.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event.fee?.amount !== undefined ? event.fee.amount / 100 : 0);

  const isFree = !event.fee || event.fee.type === 'FREE' || feeAmount === 0;

  const formatDate = (isoString) => {
    if (!isoString) return '11 - 12 Sep, 2026';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '11 - 12 Sep, 2026';
    }
  };

  const getVenueString = (v) => {
    if (!v) return 'Aditya University Campus';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      return v.name || v.address || 'Aditya University Campus';
    }
    return 'Aditya University Campus';
  };

  const isSolo = event.participation?.type === 'INDIVIDUAL' || event.participation?.type === 'SINGLE';

  return (
    <div className="veda-modal-overlay" onClick={onClose}>
      <div className="veda-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Banner with Close button */}
        <div className="modal-header-banner" style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(11,34,64,0.92) 100%), url(${typeof event.banner === 'object' ? (event.banner?.url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80') : (event.banner || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '24px',
          minHeight: '160px'
        }}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>

          <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {(typeof event.categoryName === 'string' ? event.categoryName : event.categoryName?.name) || 'Technical Track'} • VEDA 2k26
          </span>
          <h2 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.25, marginTop: '4px' }}>
            {typeof event.title === 'string' ? event.title : 'Event Details'}
          </h2>
        </div>

        {/* Quick Meta Info Strip */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid var(--border-color)',
          padding: '12px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          fontSize: '0.82rem',
          color: 'var(--text-dark)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="#0284c7" />
            <span style={{ fontWeight: '600' }}>{formatDate(event.schedule?.fromDate)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="#0284c7" />
            <span style={{ fontWeight: '600' }} title={getVenueString(event.venue)}>{getVenueString(event.venue)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} color="#0284c7" />
            <span style={{ fontWeight: '600' }}>
              {isSolo
                ? 'Individual / Solo'
                : (event.participation?.minTeamSize ? `Team: ${event.participation.minTeamSize}-${event.participation.maxTeamSize} Members` : 'Team Event')}
            </span>
          </div>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{event.description}</p>
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
                {/* Faculty Coordinators */}
                {(event.coordinators?.faculty && event.coordinators.faculty.length > 0
                  ? event.coordinators.faculty
                  : committeeMembers.filter(m => m.role === 'Convener' || m.role === 'Member').map(m => ({
                    name: m.employee?.name || m.employee?.employeeName || m.name,
                    phone: m.employee?.phone || m.phone || '',
                    designation: m.employee?.designation || (m.role === 'Convener' ? 'Fest Convener' : 'Committee Member')
                  }))
                ).map((f, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{f.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '600' }}>{f.designation || 'Faculty Coordinator'}</div>
                    {f.phone && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} /> {f.phone}
                      </div>
                    )}
                  </div>
                ))}

                {/* Student Coordinators */}
                {(event.coordinators?.student && event.coordinators.student.length > 0
                  ? event.coordinators.student
                  : committeeMembers.filter(m => m.role === 'Student Coordinator' || m.rollNo).map(m => ({
                    name: m.studentName || m.name || m.rollNo,
                    phone: m.mobileNumber || m.phone || 'N/A',
                    rollNo: m.rollNo
                  }))
                ).map((s, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '600' }}>
                      Student Coordinator {s.rollNo ? `(${s.rollNo})` : ''}
                    </div>
                    {s.phone && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} /> {s.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row: Fee & Proceed to Register Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            marginTop: '10px'
          }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Registration Fee
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0284c7' }}>
                {isFree ? 'FREE ENTRY' : `₹ ${feeAmount} ${event.fee?.chargeModel === 'PER_TEAM' ? '/ Team' : '/ Participant'}`}
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onRegister(event);
              }}
              style={{
                background: 'linear-gradient(135deg, #071830 0%, #0284c7 100%)',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '9999px',
                fontSize: '0.96rem',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 132, 199, 0.35)';
              }}
            >
              <span>Register for Event</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
