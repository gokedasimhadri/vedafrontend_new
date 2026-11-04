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
  Loader2,
  Sparkles
} from 'lucide-react';
import { centralApi, EVENT_TYPE, EVENT_ACADEMIC_YEAR, matchesAcademicYear, isRealRazorpayOrderId } from '../api/centralApi';

/**
 * Helper to calculate fee in Rupees (converting paise to rupees if >= 100)
 */
export const getFeeInRupees = (reg, matchedEvent) => {
  // 1. Check matched event from central_events
  if (matchedEvent?.fee) {
    if (matchedEvent.fee.type === 'FREE') return 0;
    if (matchedEvent.fee.amountPerUnit !== undefined && matchedEvent.fee.amountPerUnit !== null) {
      return Number(matchedEvent.fee.amountPerUnit);
    }
    if (matchedEvent.fee.amount !== undefined && matchedEvent.fee.amount !== null) {
      const val = Number(matchedEvent.fee.amount);
      return val >= 100 ? val / 100 : val;
    }
  }

  // 2. Check registration fee
  if (reg?.fee) {
    if (reg.fee.type === 'FREE') return 0;
    if (reg.fee.amountPerUnit !== undefined && reg.fee.amountPerUnit !== null) {
      return Number(reg.fee.amountPerUnit);
    }
    if (reg.fee.amount !== undefined && reg.fee.amount !== null) {
      const val = Number(reg.fee.amount);
      return val >= 100 ? val / 100 : val;
    }
  }

  // 3. Check payment data
  if (reg?.paymentData?.amount !== undefined && reg.paymentData.amount !== null) {
    const val = Number(reg.paymentData.amount);
    return val >= 100 ? val / 100 : val;
  }

  return 0;
};

export const getStatusBadge = (reg) => {
  if (!reg) {
    return { label: 'PENDING', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: <Clock size={13} /> };
  }
  const payStatus = reg?.paymentData?.status || reg?.payment?.status || reg?.paymentStatus;
  const regStatus = reg?.status;

  if (regStatus === 'CONFIRMED' || payStatus === 'PAID') {
    return { label: 'CONFIRMED', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: <CheckCircle2 size={13} /> };
  }
  if (regStatus === 'CANCELLED') {
    return { label: 'CANCELLED', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: <XCircle size={13} /> };
  }
  if (payStatus === 'FAILED') {
    return { label: 'PAYMENT FAILED', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: <XCircle size={13} /> };
  }
  if (payStatus === 'CREATED' || payStatus === 'ATTEMPTED' || reg?.payment?.status === 'PENDING' || regStatus === 'PENDING') {
    return { label: 'PAYMENT PENDING', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: <Clock size={13} /> };
  }
  if (payStatus === 'FREE' || reg?.payment?.status === 'FREE') {
    return { label: 'FREE • CONFIRMED', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: <CheckCircle2 size={13} /> };
  }
  return { label: 'PAYMENT PENDING', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: <Clock size={13} /> };
};

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

export const isConfirmed = (reg) => {
  const badge = getStatusBadge(reg);
  return badge.label.includes('CONFIRMED');
};

/**
 * MyRegistrationsPage
 * Displays event registrations for the logged-in student strictly scoped to:
 *   - typeCode: VEDA
 *   - academicYear: EVENT_ACADEMIC_YEAR (from .env e.g. 2026-2027)
 * Reads from:
 *   - central_event_student_registrations (Step 2 data: typeCode="VEDA", academicYear="2026-2027", participants, team)
 *   - central_event_student_payments (Step 3 data: Razorpay, payment reference)
 */
export default function MyRegistrationsPage({ currentUser, events = [], onRegisterMore, onRegistrationUpdated }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const rollOrId = currentUser?.roll || currentUser?.rollNumber || currentUser?._id;
  const currentEventType = (import.meta.env.VITE_EVENT_TYPE || EVENT_TYPE || 'VEDA').toUpperCase();
  const currentAcademicYear = (import.meta.env.VITE_EVENT_ACADEMIC_YEAR || import.meta.env.EVENT_ACADEMIC_YEAR || EVENT_ACADEMIC_YEAR || '2026-2027').trim();

  const fetchRegistrations = useCallback(async (silent = false) => {
    if (!rollOrId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      // Step 2 & 3: Query backend specifically for VEDA registrations for the academic year
      const data = await centralApi.getStudentRegistrationsWithPayments(rollOrId, currentEventType, currentAcademicYear);

      // Strict enforcement: Discard any records belonging to other typeCodes (e.g. COLORS) or other academic years
      const vedaOnly = (data || []).filter(reg => {
        if (!reg || typeof reg !== 'object') return false;

        // 1. Direct typeCode check from central_event_student_registrations
        const tc = (reg.typeCode || reg.eventType || reg.event?.typeCode || reg.eventId?.typeCode || '').trim().toUpperCase();
        if (tc) {
          if (tc !== currentEventType) return false;
        }

        // 2. Reject explicit other fests (COLORS, CLR, MAYA)
        const regNum = String(reg.registrationNumber || '').toUpperCase();
        if (regNum.includes('COLOR') || regNum.includes('CLR') || regNum.includes('MAYA')) {
          return false;
        }

        // 3. Academic Year verification
        const regYear = reg.academicYear || reg.academic_year || reg.event?.academicYear || reg.eventId?.academicYear || reg.event?.academic_year || reg.eventId?.academic_year;
        if (regYear && !matchesAcademicYear(regYear, currentAcademicYear)) {
          return false;
        }

        // 4. Match against known VEDA events list (by eventId, eventSlug, eventTitle)
        if (Array.isArray(events) && events.length > 0) {
          const regEventId = reg.eventId?._id ? String(reg.eventId._id) : (reg.eventId ? String(reg.eventId) : '');
          if (regEventId && events.some(e => String(e._id) === regEventId)) return true;
          if (reg.eventSlug && events.some(e => e.slug && e.slug.toLowerCase() === String(reg.eventSlug).toLowerCase())) return true;
          if (reg.eventTitle && events.some(e => e.title && e.title.trim().toLowerCase() === String(reg.eventTitle).trim().toLowerCase())) return true;
        }

        // 5. Accept if registrationNumber contains VEDA or VED
        if (regNum.includes(currentEventType) || regNum.includes('VED')) {
          return true;
        }

        // Default: if type matches or confirmed
        if (tc === currentEventType) return true;

        return false;
      });

      setRegistrations(vedaOnly);
    } catch (err) {
      setError(err.message || 'Failed to load registrations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rollOrId, currentEventType, currentAcademicYear, events]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Step 3: Find registrations requiring payment
  const pendingRegistrations = (registrations || []).filter(r => {
    if (!r) return false;
    const badge = getStatusBadge(r);
    const mEvt = events?.find(e =>
      (r.eventId?._id && String(e._id) === String(r.eventId._id)) ||
      (r.eventId && String(e._id) === String(r.eventId)) ||
      (e.slug && r.eventSlug && e.slug.toLowerCase() === r.eventSlug.toLowerCase()) ||
      (e.title && r.eventTitle && e.title.trim().toLowerCase() === r.eventTitle.trim().toLowerCase())
    );
    const fee = getFeeInRupees(r, mEvt);
    return !badge.label.includes('CONFIRMED') && fee > 0;
  });
  const hasPendingPayment = pendingRegistrations.length > 0;

  // Step 3 Payment Handler: Initiates Razorpay payment for pending registrations
  const handlePayRegistration = async (reg, feeInRupees) => {
    setPayingId(reg._id);
    setError('');
    setPaymentSuccessMsg('');

    try {
      // Find matched event from loaded VEDA events
      const matchedEvent = events?.find(e =>
        (reg.eventId?._id && String(e._id) === String(reg.eventId._id)) ||
        (reg.eventId && String(e._id) === String(reg.eventId)) ||
        (e.slug && reg.eventSlug && e.slug.toLowerCase() === reg.eventSlug.toLowerCase()) ||
        (e.title && reg.eventTitle && e.title.trim().toLowerCase() === reg.eventTitle.trim().toLowerCase())
      );

      // Create or get Razorpay order from backend
      const orderData = await centralApi.createOrGetPaymentOrder({
        registrationId: reg._id,
        reg,
        event: matchedEvent,
        amountInRupees: feeInRupees,
        currentUser
      });

      if (!orderData || !orderData.order) {
        throw new Error('Unable to create payment order. Please refresh and try again.');
      }

      // Launch Razorpay checkout
      triggerRazorpayPayment(reg, orderData.order, matchedEvent, feeInRupees);
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setPayingId(null);
    }
  };

  // Trigger Razorpay payment modal
  const triggerRazorpayPayment = (reg, order, matchedEvent, feeInRupees) => {
    const paidAmount = feeInRupees || (order?.amount ? order.amount / 100 : (getFeeInRupees(reg, matchedEvent) || 1));
    const launch = () => {
      if (!window.Razorpay) {
        alert('Payment gateway is loading. Please click Pay Now in a moment.');
        setPayingId(null);
        return;
      }

      const lead = reg.participant || reg.participants?.[0] || {
        name: currentUser?.name || 'Student',
        email: currentUser?.email || 'student@adityauniversity.in',
        phone: currentUser?.mobile || currentUser?.phone || '9999999999'
      };

      const isRealOrderId = isRealRazorpayOrderId(order?.id);

      const options = {
        key: order?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order?.amount || 100,
        currency: order?.currency || 'INR',
        name: 'Aditya University - VEDA 2k26',
        description: `Registration Fee: ${reg.eventTitle || matchedEvent?.title || 'Event'}`,
        ...(isRealOrderId ? { order_id: order.id } : {}),
        image: 'https://info.aec.edu.in/favicon.ico',
        prefill: {
          name: lead.name,
          email: lead.email,
          contact: lead.phone
        },
        theme: {
          color: '#0284c7'
        },
        handler: async function (paymentResponse) {
          setPayingId(reg._id);
          try {
            const verifyRes = await centralApi.verifyRegistrationPayment({
              registrationId: reg._id,
              registrationNumber: reg.registrationNumber,
              paymentReference: reg.payment?.paymentReference || reg.paymentReference || `PAY-${reg.registrationNumber}`,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature
            });

            if (verifyRes.success) {
              setPaymentSuccessMsg(`✓ Step 3 Payment confirmed for ${reg.eventTitle}! Your official pass is now verified.`);
              // Optimistically update local registration status immediately
              setRegistrations(prev => prev.map(r => {
                if (r._id === reg._id) {
                  return {
                    ...r,
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    payment: {
                      ...(r.payment || {}),
                      status: 'PAID',
                      amount: paidAmount,
                      paidAt: new Date().toISOString(),
                      paymentId: paymentResponse.razorpay_payment_id,
                      orderId: paymentResponse.razorpay_order_id
                    },
                    paymentData: {
                      ...(r.paymentData || {}),
                      status: 'PAID',
                      amount: paidAmount,
                      verifiedAt: new Date().toISOString(),
                      razorpay: {
                        paymentId: paymentResponse.razorpay_payment_id,
                        orderId: paymentResponse.razorpay_order_id,
                        signatureVerified: true
                      }
                    }
                  };
                }
                return r;
              }));
              await fetchRegistrations(true);
              onRegistrationUpdated && onRegistrationUpdated();
              setExpandedId(reg._id);
            } else {
              alert(verifyRes.message || 'Payment verification failed.');
            }
          } catch (vErr) {
            console.error('Verification error:', vErr);
            alert(vErr.message || 'Payment verification error. If money was deducted, your registration will be updated shortly.');
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResp) {
        console.warn('Payment notice:', failResp);
        const desc = failResp.error?.description;
        if (desc && desc !== 'Payment failed' && !desc.toLowerCase().includes('cancel')) {
          alert(`Payment notice: ${desc}`);
        }
        setPayingId(null);
      });
      rzp.open();
    };

    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = launch;
      script.onerror = () => {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setPayingId(null);
      };
      document.body.appendChild(script);
    } else {
      launch();
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px'
      }}>
        <Loader2 size={36} style={{ color: '#0284c7', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.95rem' }}>
          Loading your {currentEventType} registrations for {currentAcademicYear}...
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                VEDA 2k26 • Event Registration Portal
              </span>
              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                AY {currentAcademicYear}
              </span>
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
            { step: '2', label: 'Event Registration', sub: `central_event_student_registrations (typeCode: ${currentEventType}, academicYear: ${currentAcademicYear})`, done: registrations.length > 0 },
            {
              step: '3',
              label: hasPendingPayment ? 'Payment Data (Action Required)' : 'Payment Data',
              sub: 'central_event_student_payments',
              done: registrations.some(r => r.paymentData?.status === 'PAID' || r.status === 'CONFIRMED' || r.payment?.status === 'PAID' || r.payment?.status === 'FREE'),
              pending: hasPendingPayment
            }
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: s.done ? '#10b981' : (s.pending ? '#d97706' : '#334155'),
                  color: '#fff', fontSize: '0.75rem', fontWeight: '900', flexShrink: 0
                }}>
                  {s.done ? '✓' : (s.pending ? '!' : s.step)}
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

        {/* Step 3 Action Required Notification Banner */}
        {hasPendingPayment && (
          <div style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#d97706', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '1rem', flexShrink: 0
              }}>
                3
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Step 3: Registration Payment Required</span>
                  <span style={{ background: '#fde68a', color: '#92400e', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: '800' }}>
                    {pendingRegistrations.length} PENDING
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px' }}>
                  Please complete payment to confirm your event pass and persist transaction in <code>central_event_student_payments</code>.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const first = pendingRegistrations[0];
                if (first) {
                  const mEvt = events?.find(e => String(e._id) === String(first.eventId?._id || first.eventId));
                  handlePayRegistration(first, getFeeInRupees(first, mEvt));
                }
              }}
              disabled={!!payingId}
              className="btn-primary"
              style={{
                padding: '9px 20px',
                fontSize: '0.86rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <CreditCard size={15} />
              <span>Pay Fee via Razorpay</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Payment Success Alert */}
      {paymentSuccessMsg && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px',
          background: '#f0fdf4', border: '1.5px solid #86efac',
          color: '#15803d', display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '20px', fontWeight: '700', fontSize: '0.92rem'
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

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
            No {currentEventType} Registrations for {currentAcademicYear}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            You haven't registered for any {currentEventType} {currentAcademicYear} events yet. Browse events and secure your spot!
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

          // Accurately find matched event to fetch current fee and details
          const matchedEvent = events?.find(e =>
            (reg.eventId?._id && String(e._id) === String(reg.eventId._id)) ||
            (reg.eventId && String(e._id) === String(reg.eventId)) ||
            (e.slug && reg.eventSlug && e.slug.toLowerCase() === reg.eventSlug.toLowerCase()) ||
            (e.title && reg.eventTitle && e.title.trim().toLowerCase() === reg.eventTitle.trim().toLowerCase())
          );

          // Correct Fee in Rupees (converting 100 paise -> ₹1)
          const feeAmount = getFeeInRupees(reg, matchedEvent);
          const isFree = feeAmount === 0 || reg.fee?.type === 'FREE' || reg.payment?.status === 'FREE' || matchedEvent?.fee?.type === 'FREE';

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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Step 3 Payment Option directly on card */}
                    {!confirmed && !isFree && (
                      <button
                        onClick={() => handlePayRegistration(reg, feeAmount)}
                        disabled={payingId === reg._id}
                        className="btn-primary"
                        style={{
                          padding: '7px 15px',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                          cursor: 'pointer'
                        }}
                      >
                        {payingId === reg._id ? (
                          <>
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={14} />
                            <span>Pay ₹{feeAmount} Now</span>
                          </>
                        )}
                      </button>
                    )}

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
              </div>

              {/* Expanded Pass Details */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  padding: '20px',
                  background: '#fafbfc',
                  display: 'flex', flexDirection: 'column', gap: '18px'
                }}>

                  {/* Step 3: Complete Payment Process Action Banner */}
                  {!confirmed && !isFree && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: '#0284c7', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '900', fontSize: '1.1rem', flexShrink: 0
                        }}>
                          3
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Step 3: Payment Process Required</span>
                            <span style={{ background: '#bae6fd', color: '#0369a1', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: '800' }}>
                              FEE: ₹{feeAmount}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '2px' }}>
                            Your event registration (Step 2) is recorded. Complete payment of ₹{feeAmount} via Razorpay to confirm and unlock your official pass.
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePayRegistration(reg, feeAmount)}
                        disabled={payingId === reg._id}
                        className="btn-primary"
                        style={{
                          padding: '10px 22px',
                          fontSize: '0.88rem',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          boxShadow: '0 3px 12px rgba(2, 132, 199, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {payingId === reg._id ? (
                          <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Opening Gateway...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            <span>Pay ₹{feeAmount} via Razorpay</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {/* Official Pass Ticket */}
                  <div style={{
                    background: '#ffffff', border: `2px dashed ${confirmed ? '#0284c7' : '#d97706'}`,
                    borderRadius: '14px', padding: '20px',
                    boxShadow: '0 2px 12px rgba(2,132,199,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Registration Pass ID</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284c7', fontFamily: 'Space Grotesk' }}>{reg.registrationNumber}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Academic Year</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Space Grotesk' }}>
                          {reg.academicYear || reg.academic_year || currentAcademicYear}
                        </div>
                      </div>
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
                              {isFree ? 'FREE' : `₹${feeAmount}`}
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

                  {/* Action Button: Print if confirmed, Complete Payment if pending */}
                  {confirmed ? (
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
                  ) : !isFree && (
                    <button
                      onClick={() => handlePayRegistration(reg, feeAmount)}
                      disabled={payingId === reg._id}
                      className="btn-primary"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '12px',
                        borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {payingId === reg._id ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Opening Payment Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          <span>Complete Payment (₹{feeAmount}) via Razorpay</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
}
