import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Users,
  Calendar,
  RefreshCw,
  Printer,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { centralApi } from '../api/centralApi';

/**
 * MyRegistrationsPage
 * Displays all event registrations for the logged-in student with payment status.
 * Reads from:
 *   - central_event_student_registrations (Step 2 data: participants, team)
 *   - central_event_student_payments (Step 3 data: Razorpay, payment reference)
 */
export default function MyRegistrationsPage({ currentUser, onRegisterMore }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const rollOrId = currentUser?.roll || currentUser?.rollNumber || currentUser?._id;

  const fetchRegistrations = useCallback(async (silent = false) => {
    if (!rollOrId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      // Fetch from both collections via the with-payments endpoint
      const data = await centralApi.getStudentRegistrationsWithPayments(rollOrId);
      setRegistrations(data);
    } catch (err) {
      setError(err.message || 'Failed to load registrations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rollOrId]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const getStatusBadge = (reg) => {
    const payStatus = reg.paymentData?.status || reg.payment?.status;
    const regStatus = reg.status;

    if (regStatus === 'CONFIRMED' || payStatus === 'PAID') {
      return { label: 'CONFIRMED', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: <CheckCircle2 size={13} /> };
    }
    if (regStatus === 'CANCELLED') {
      return { label: 'CANCELLED', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: <XCircle size={13} /> };
    }
    if (payStatus === 'FAILED') {
      return { label: 'PAYMENT FAILED', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: <XCircle size={13} /> };
    }
    if (payStatus === 'CREATED' || payStatus === 'ATTEMPTED' || reg.payment?.status === 'PENDING') {
      return { label: 'PAYMENT PENDING', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: <Clock size={13} /> };
    }
    if (payStatus === 'FREE' || reg.payment?.status === 'FREE') {
      return { label: 'FREE • CONFIRMED', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: <CheckCircle2 size={13} /> };
    }
    return { label: 'PENDING', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: <Clock size={13} /> };
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const isConfirmed = (reg) => {
    const badge = getStatusBadge(reg);
    return badge.label.includes('CONFIRMED');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px'
      }}>
        <Loader2 size={36} style={{ color: '#0284c7', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.95rem' }}>
          Loading your registrations from database...
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              VEDA 2k26 • Event Registration Portal
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#071830', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              My Passes & Registrations
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
              Logged in as <strong style={{ color: '#0284c7' }}>{currentUser?.name}</strong>
              {currentUser?.roll && <span> • Roll: <strong>{currentUser.roll}</strong></span>}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => fetchRegistrations(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                color: '#475569', borderRadius: '9999px',
                padding: '8px 16px', fontWeight: '700', fontSize: '0.82rem',
                cursor: refreshing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {onRegisterMore && (
              <button
                onClick={onRegisterMore}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                <span>Register for Event</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 3-Step Pipeline Banner */}
        <div style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, #071830 0%, #0b2e52 100%)',
          borderRadius: '14px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap'
        }}>
          {[
            { step: '1', label: 'Student Account', sub: 'central_event_student_account', done: true },
            { step: '2', label: 'Event Registration', sub: 'central_event_student_registrations', done: registrations.length > 0 },
            { step: '3', label: 'Payment Data', sub: 'central_event_student_payments', done: registrations.some(r => r.paymentData || r.payment?.status === 'PAID' || r.payment?.status === 'FREE') }
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: s.done ? '#10b981' : '#334155',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.75rem', fontWeight: '900', flexShrink: 0
                }}>
                  {s.done ? '✓' : s.step}
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: s.done ? '#86efac' : '#94a3b8', textTransform: 'uppercase' }}>
                    Step {s.step}: {s.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'Space Grotesk', marginTop: '1px' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, minWidth: '20px', height: '2px', background: '#1e3a5f', margin: '0 4px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px',
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '20px', fontWeight: '600', fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!error && registrations.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '70px 24px',
          background: '#ffffff', borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: '#94a3b8'
          }}>
            <Ticket size={36} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            No Registrations Yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            You haven't registered for any VEDA 2k26 events yet. Browse events and secure your spot!
          </p>
          {onRegisterMore && (
            <button onClick={onRegisterMore} className="btn-primary" style={{ padding: '12px 28px' }}>
              <span>Browse Events & Register</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Registration Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {registrations.map((reg, idx) => {
          const badge = getStatusBadge(reg);
          const confirmed = isConfirmed(reg);
          const isExpanded = expandedId === reg._id;
          const lead = reg.participant || (reg.participants && reg.participants.find(p => p.isLead)) || reg.participants?.[0];
          const feeAmount = reg.fee?.amount || reg.paymentData?.amount || 0;
          const isFree = feeAmount === 0 || reg.payment?.status === 'FREE';

          return (
            <div
              key={reg._id || idx}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: `1.5px solid ${confirmed ? '#bbf7d0' : '#e2e8f0'}`,
                boxShadow: confirmed ? '0 4px 20px rgba(21, 128, 61, 0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Card Header */}
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: badge.bg, color: badge.color,
                    border: `1px solid ${badge.border}`,
                    padding: '3px 10px', borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.04em', marginBottom: '8px'
                  }}>
                    {badge.icon} {badge.label}
                  </span>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {reg.eventTitle}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                    <span style={{ fontFamily: 'Space Grotesk', color: '#0284c7', fontWeight: '800' }}>
                      #{reg.registrationNumber}
                    </span>
                    {reg.teamName && (
                      <span>Team: <strong style={{ color: '#334155' }}>{reg.teamName}</strong></span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={13} /> {reg.teamSize || reg.participants?.length || 1} Participant(s)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {formatDate(reg.created_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Fee</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: isFree ? '#15803d' : '#0f172a', fontFamily: 'Space Grotesk' }}>
                      {isFree ? 'FREE' : `₹${feeAmount}`}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : reg._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '6px 12px',
                      color: '#64748b', fontWeight: '700', fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Hide' : 'View Pass'}
                  </button>
                </div>
              </div>

              {/* Expanded Pass Details */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  padding: '20px',
                  background: '#fafbfc',
                  display: 'flex', flexDirection: 'column', gap: '18px'
                }}>

                  {/* Official Pass Ticket */}
                  <div style={{
                    background: '#ffffff', border: '2px dashed #0284c7',
                    borderRadius: '14px', padding: '20px',
                    boxShadow: '0 2px 12px rgba(2,132,199,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Registration Pass ID</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284c7', fontFamily: 'Space Grotesk' }}>{reg.registrationNumber}</div>
                      </div>
                      {reg.paymentData?.paymentReference && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Payment Ref</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#10b981', fontFamily: 'Space Grotesk' }}>{reg.paymentData.paymentReference}</div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Participants from central_event_student_registrations */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} /> Participants ({reg.participants?.length || 1}) — central_event_student_registrations
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(reg.participants && reg.participants.length > 0 ? reg.participants : [lead]).filter(Boolean).map((p, pIdx) => (
                          <div key={pIdx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#f8fafc', padding: '8px 12px', borderRadius: '8px',
                            fontSize: '0.85rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: p.isLead ? '#0284c7' : '#94a3b8',
                                color: '#fff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', flexShrink: 0
                              }}>{pIdx + 1}</span>
                              <div>
                                <span style={{ fontWeight: '800', color: '#0f172a' }}>{p.name}</span>
                                {p.isLead && (
                                  <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>LEAD</span>
                                )}
                                {(p.department || p.year) && (
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>
                                    {p.department}{p.year ? ` • ${p.year}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', color: '#475569', fontSize: '0.82rem' }}>{p.rollNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Payment data from central_event_student_payments */}
                    {(reg.paymentData || !isFree) && (
                      <div style={{
                        borderTop: '1px solid #f1f5f9', paddingTop: '12px',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <CreditCard size={13} /> Payment Info — central_event_student_payments
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
                          {reg.paymentData?.razorpay?.orderId && (
                            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Order ID</div>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#334155', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                                {reg.paymentData.razorpay.orderId}
                              </div>
                            </div>
                          )}
                          {reg.paymentData?.razorpay?.paymentId && (
                            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Payment ID</div>
                              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#334155', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                                {reg.paymentData.razorpay.paymentId}
                              </div>
                            </div>
                          )}
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Amount</div>
                            <div style={{ fontWeight: '800', color: '#0f172a' }}>
                              {isFree ? 'FREE' : `₹${reg.paymentData?.amount || feeAmount}`}
                            </div>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Payment Status</div>
                            <div style={{ fontWeight: '800', color: badge.color }}>{badge.label}</div>
                          </div>
                          {reg.paymentData?.razorpay?.method && (
                            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Method</div>
                              <div style={{ fontWeight: '700', color: '#334155', textTransform: 'capitalize' }}>
                                {reg.paymentData.razorpay.method}
                              </div>
                            </div>
                          )}
                          {reg.paymentData?.verifiedAt && (
                            <div style={{ background: '#f0fdf4', padding: '8px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                              <div style={{ color: '#15803d', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Verified At</div>
                              <div style={{ fontWeight: '700', color: '#15803d', fontSize: '0.78rem' }}>
                                {formatDate(reg.paymentData.verifiedAt)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Security verified badge */}
                        {reg.paymentData?.razorpay?.signatureVerified && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '8px', padding: '8px 12px',
                            fontSize: '0.78rem', color: '#15803d', fontWeight: '700', marginTop: '4px'
                          }}>
                            <ShieldCheck size={14} />
                            HMAC-SHA256 Signature Verified • Secure Payment Confirmed
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Print Pass Button */}
                  {confirmed && (
                    <button
                      onClick={() => window.print()}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '11px',
                        background: 'transparent', border: '1.5px solid #e2e8f0',
                        borderRadius: '10px', color: '#475569', fontWeight: '700',
                        fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.color = '#0284c7'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                    >
                      <Printer size={15} /> Print / Save This Pass
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {registrations.length > 0 && (
        <div style={{
          marginTop: '28px', padding: '12px 16px', borderRadius: '10px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '0.8rem', color: '#64748b'
        }}>
          <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            <strong>Data Sources:</strong> Registration details from <code>central_event_student_registrations</code> •
            Payment records from <code>central_event_student_payments</code> •
            Account from <code>central_event_student_account</code>
          </span>
        </div>
      )}
    </div>
  );
}
