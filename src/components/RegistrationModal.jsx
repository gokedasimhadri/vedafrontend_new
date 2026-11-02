import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building,
  Plus,
  Trash2,
  ShieldCheck,
  QrCode,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Loader2,
  Sparkles,
  Users,
  Check,
  AlertCircle,
  Printer
} from 'lucide-react';
import { centralApi } from '../api/centralApi';

function mapBranchToDepartment(branchStr) {
  if (!branchStr) return 'CSE';
  const b = branchStr.toUpperCase();
  if (b.includes('CS') || b.includes('AI') || b.includes('DATA') || b.includes('ML') || b.includes('COMPUT')) return 'CSE';
  if (b.includes('IT') || b.includes('INFO')) return 'IT';
  if (b.includes('EC') || b.includes('COMMUN')) return 'ECE';
  if (b.includes('EE') || b.includes('ELECTR')) return 'EEE';
  if (b.includes('ME') || b.includes('ROBOT')) return 'MECH';
  if (b.includes('CIVIL')) return 'CIVIL';
  if (b.includes('AGRI')) return 'AGRI';
  if (b.includes('PHARM') || b.includes('MGMT') || b.includes('MBA') || b.includes('BBA')) return 'PHARMACY';
  return 'CSE';
}

export default function RegistrationModal({ event, onClose, currentUser, onRequestLogin, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(2); // Step 2 (Form) -> Step 3 (Review & Payment)
  const [successData, setSuccessData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [autoPopulatingIndices, setAutoPopulatingIndices] = useState({});
  const [autoPopulatedMsg, setAutoPopulatedMsg] = useState('');
  const [errors, setErrors] = useState({});

  // Participation logic based on event
  const isTeam = event?.participation?.type === 'TEAM' || (event?.participation?.maxTeamSize && event.participation.maxTeamSize > 1);
  const minTeamSize = event?.participation?.minTeamSize || (isTeam ? 2 : 1);
  const maxTeamSize = event?.participation?.maxTeamSize || (isTeam ? 5 : 1);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState(() => {
    const lead = {
      name: currentUser?.name || '',
      rollNumber: (currentUser?.roll || currentUser?.rollNumber || '').toUpperCase(),
      email: currentUser?.email || '',
      phone: currentUser?.mobile || currentUser?.phone || '',
      college: currentUser?.college || 'Aditya University',
      department: currentUser?.branch || currentUser?.department || 'CSE',
      year: currentUser?.year || '3rd Year',
      isLead: true
    };

    if (isTeam && minTeamSize > 1) {
      const initialList = [lead];
      for (let i = 1; i < minTeamSize; i++) {
        initialList.push({
          name: '',
          rollNumber: '',
          email: '',
          phone: '',
          college: lead.college,
          department: lead.department,
          year: lead.year,
          isLead: false
        });
      }
      return initialList;
    }
    return [lead];
  });

  const feeInRupees = event?.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event?.fee?.amount !== undefined ? event.fee.amount / 100 : 0);
  const isPaid = feeInRupees > 0;

  // Auto-populate helper for any participant index
  const autoPopulateParticipant = async (index, rollNo) => {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    if (cleanRoll.length < 5) return;

    setAutoPopulatingIndices(prev => ({ ...prev, [index]: true }));
    try {
      const studentData = await centralApi.lookupStudentByRoll(cleanRoll);
      if (studentData) {
        const sName = studentData.studentname || studentData.StudentName || studentData.name || '';
        const sMobile = studentData.mobilenumber || studentData.MobileNumber || studentData.phone || studentData.mobile || '';
        const sEmail = studentData.email || studentData.emailid || studentData.Email || studentData.studentemail || `${cleanRoll.toLowerCase()}@adityauniversity.in`;
        let sCollege = studentData.college || studentData.College || studentData.collegename || 'Aditya University';
        if (cleanRoll.includes('A9')) sCollege = 'AEC';
        else if (cleanRoll.includes('P3')) sCollege = 'ACET';
        else if (cleanRoll.includes('MH') || cleanRoll.includes('B1') || cleanRoll.includes('PT') || cleanRoll.includes('AU')) sCollege = 'Aditya University';

        const sBranch = studentData.branch || studentData.Branch || studentData.department || '';
        let sYear = '';
        const sSem = (studentData.semester || studentData.semestername || '').toUpperCase();
        if (sSem.includes('VII') || sSem.includes('VIII') || sSem.includes('4/4') || sSem.includes('4TH')) sYear = '4th Year';
        else if (sSem.includes('V') || sSem.includes('VI') || sSem.includes('3/4') || sSem.includes('3RD')) sYear = '3rd Year';
        else if (sSem.includes('III') || sSem.includes('IV') || sSem.includes('2/4') || sSem.includes('2ND')) sYear = '2nd Year';
        else if (sSem.includes('I') || sSem.includes('II') || sSem.includes('1/4') || sSem.includes('1ST')) sYear = '1st Year';

        setParticipants(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              rollNumber: cleanRoll,
              name: sName || updated[index].name,
              phone: sMobile ? String(sMobile).replace(/\D/g, '').slice(-10) : updated[index].phone,
              email: sEmail || updated[index].email,
              college: sCollege || updated[index].college,
              year: sYear || updated[index].year,
              department: mapBranchToDepartment(sBranch) || updated[index].department
            };
          }
          return updated;
        });

        setErrors(prev => {
          const nextErr = { ...prev };
          delete nextErr[`roll_${index}`];
          if (sName) delete nextErr[`name_${index}`];
          if (sMobile) delete nextErr[`phone_${index}`];
          if (sEmail) delete nextErr[`email_${index}`];
          return nextErr;
        });

        if (index === 0) {
          setAutoPopulatedMsg(`✓ Profile auto-filled for ${sName || cleanRoll}`);
        }
      }
    } catch (err) {
      console.warn('Auto-populate error for participant:', err);
    } finally {
      setAutoPopulatingIndices(prev => ({ ...prev, [index]: false }));
    }
  };

  // If lead participant has roll number but missing details, auto-fill once on mount
  useEffect(() => {
    if (participants[0]?.rollNumber && participants[0].rollNumber.length >= 6 && !participants[0].name) {
      autoPopulateParticipant(0, participants[0].rollNumber);
    }
  }, []);

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    if (!updated[index]) return;

    if (field === 'rollNumber') {
      const cleanRoll = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      updated[index][field] = cleanRoll;
      if (cleanRoll.length >= 6) {
        clearTimeout(window[`_regRollTimer_${index}`]);
        window[`_regRollTimer_${index}`] = setTimeout(() => {
          autoPopulateParticipant(index, cleanRoll);
        }, 400);
      }
    } else if (field === 'name') {
      updated[index][field] = value.replace(/[^a-zA-Z\s.]/g, '').slice(0, 60);
    } else if (field === 'phone') {
      updated[index][field] = value.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'email') {
      updated[index][field] = value.trim();
    } else {
      updated[index][field] = value;
    }

    setParticipants(updated);

    // Clear specific error if now valid
    setErrors(prev => {
      const cp = { ...prev };
      delete cp[`${field}_${index}`];
      return cp;
    });
  };

  // Team Size controls
  const handleSetTeamSize = (newSize) => {
    const targetSize = Math.max(minTeamSize, Math.min(maxTeamSize, newSize));
    if (targetSize === participants.length) return;

    if (targetSize > participants.length) {
      const needed = targetSize - participants.length;
      const additional = [];
      for (let i = 0; i < needed; i++) {
        additional.push({
          name: '',
          rollNumber: '',
          email: '',
          phone: '',
          college: participants[0]?.college || 'Aditya University',
          department: participants[0]?.department || 'CSE',
          year: participants[0]?.year || '3rd Year',
          isLead: false
        });
      }
      setParticipants([...participants, ...additional]);
    } else {
      setParticipants(participants.slice(0, targetSize));
    }
  };

  const handleAddParticipant = () => {
    if (participants.length < maxTeamSize) {
      handleSetTeamSize(participants.length + 1);
    }
  };

  const handleRemoveParticipant = (index) => {
    if (index === 0) return; // Cannot remove lead
    if (participants.length > minTeamSize) {
      const updated = participants.filter((_, i) => i !== index);
      setParticipants(updated);
    }
  };

  // Validate Step 2 Form
  const validateForm = () => {
    const newErrors = {};

    if (isTeam && (!teamName || teamName.trim().length < 2)) {
      newErrors.teamName = 'Team name is required (minimum 2 characters)';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const rollSet = new Set();

    participants.forEach((p, idx) => {
      const label = idx === 0 ? 'Team Lead' : `Member ${idx + 1}`;

      if (!p.name || p.name.trim().length < 2) {
        newErrors[`name_${idx}`] = `${label} name is required (letters only)`;
      }

      const cleanRoll = (p.rollNumber || '').trim().toUpperCase();
      if (!cleanRoll || cleanRoll.length < 4) {
        newErrors[`rollNumber_${idx}`] = `${label} roll number must be at least 4 alphanumeric chars`;
      } else if (rollSet.has(cleanRoll)) {
        newErrors[`rollNumber_${idx}`] = `Duplicate roll number (${cleanRoll}) in the team`;
      } else {
        rollSet.add(cleanRoll);
      }

      if (idx === 0) {
        // Lead requires email and phone
        if (!p.email || !emailRegex.test(p.email.trim())) {
          newErrors[`email_${idx}`] = 'Valid email address is required for Team Lead';
        }
        if (!p.phone || !/^[6-9]\d{9}$/.test(p.phone.trim())) {
          newErrors[`phone_${idx}`] = 'Valid 10-digit WhatsApp number required (starts with 6-9)';
        }
      } else {
        // Additional members require phone, email optional
        if (p.phone && !/^[6-9]\d{9}$/.test(p.phone.trim())) {
          newErrors[`phone_${idx}`] = 'Must be a valid 10-digit phone number';
        }
        if (p.email && !emailRegex.test(p.email.trim())) {
          newErrors[`email_${idx}`] = 'Invalid email format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 -> Step 3: Transition to Review Participants Screen
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setCurrentStep(3);
    }
  };

  // Step 3: Confirm Registration & Trigger Payment
  const handleConfirmAndPay = async () => {
    setLoading(true);
    try {
      const lead = participants[0];
      const additionalMembers = participants.slice(1).map(m => ({
        name: m.name.trim(),
        rollNumber: m.rollNumber.trim().toUpperCase(),
        phone: m.phone ? m.phone.trim() : '',
        email: m.email ? m.email.trim() : '',
        college: m.college || lead.college,
        department: m.department || lead.department,
        year: m.year || lead.year
      }));

      const payload = {
        eventId: event?._id,
        eventSlug: event?.slug,
        eventTitle: event?.title,
        typeCode: 'VEDA',
        studentAccountId: currentUser?._id || null,
        teamSize: participants.length,
        teamName: isTeam ? teamName.trim() : null,
        // Step 2: Store all participants in central_event_student_registrations based on team size
        participants: participants.map(p => ({
          name: p.name.trim(),
          rollNumber: p.rollNumber.trim().toUpperCase(),
          email: p.email ? p.email.trim() : '',
          phone: p.phone ? p.phone.trim() : '',
          college: p.college || lead.college,
          department: p.department || lead.department,
          year: p.year || lead.year,
          isLead: !!p.isLead
        })),
        participant: {
          name: lead.name.trim(),
          rollNumber: lead.rollNumber.trim().toUpperCase(),
          email: lead.email.trim().toLowerCase(),
          phone: lead.phone.trim(),
          college: lead.college || 'Aditya University',
          department: lead.department || 'CSE',
          year: lead.year || '3rd Year'
        },
        teamMembers: additionalMembers,
        fee: event?.fee
      };

      const res = await centralApi.submitRegistration(payload);

      if (res.isFree || !res.order) {
        // Free Event -> Confirmed immediately!
        setSuccessData(res.data);
        if (onSuccess) setTimeout(() => onSuccess(), 3500); // Auto-navigate to My Passes after 3.5s
      } else {
        // Step 3: Paid Event -> Launch Razorpay Payment & save into central_event_student_payments
        setPendingPayment({
          registration: res.data,
          order: res.order
        });
        triggerRazorpay(res.data, res.order);
      }
    } catch (err) {
      alert(err.message || 'Registration failed. Please check participant details.');
    } finally {
      setLoading(false);
    }
  };

  // Launch Razorpay and save to central_event_student_payments
  const triggerRazorpay = (registration, order) => {
    if (!window.Razorpay) {
      alert('Razorpay payment gateway is loading. Please click Pay Now in a moment.');
      return;
    }

    const lead = participants[0];
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'Aditya University - VEDA 2k26',
      description: `Registration Fee: ${event?.title || 'Event'} (${participants.length} Participants)`,
      order_id: order.id,
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAA',
      prefill: {
        name: lead.name,
        email: lead.email,
        contact: lead.phone
      },
      theme: {
        color: '#0284c7'
      },
      handler: async function (paymentResponse) {
        setLoading(true);
        try {
          // Save payment data into central_event_student_payments collection
          const verifyRes = await centralApi.verifyRegistrationPayment({
            registrationId: registration._id,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature
          });

          if (verifyRes.success) {
            setPendingPayment(null);
            setSuccessData(verifyRes.data);
            if (onSuccess) setTimeout(() => onSuccess(), 3500); // Auto-navigate to My Passes after 3.5s
          } else {
            alert(verifyRes.message || 'Payment verification failed.');
          }
        } catch (vErr) {
          alert(vErr.message || 'Payment verification error. If money was deducted, your registration will be updated shortly.');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (failResp) {
      alert(`Payment failed: ${failResp.error?.description || 'Transaction unsuccessful'}`);
      setLoading(false);
    });
    rzp.open();
  };

  return (
    <div className="veda-modal-overlay" onClick={onClose}>
      <div
        className="veda-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: currentStep === 3 && !successData ? '720px' : '680px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-main)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                VEDA 2k26 • Event Registration Desk
              </span>
              <span style={{
                background: isTeam ? '#e0f2fe' : '#f1f5f9',
                color: isTeam ? '#0284c7' : '#475569',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {isTeam ? `TEAM (${participants.length} MEMBERS)` : 'INDIVIDUAL'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-dark)', marginTop: '2px' }}>
              {event?.title || 'Event Registration'}
            </h3>
          </div>
          <button className="modal-close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 3-Step Process Progress Bar */}
        <div style={{
          background: '#f1f5f9',
          padding: '12px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Step 1 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900'
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>
                Step 1: Account
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                {currentUser?.name ? `${currentUser.name.split(' ')[0]} (${currentUser.roll || currentUser.rollNumber})` : 'Verified'}
              </div>
            </div>
          </div>

          <div style={{ height: '2px', flex: 1, background: '#cbd5e1', margin: '0 12px' }} />

          {/* Step 2 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: currentStep >= 2 ? (currentStep > 2 || successData ? '#10b981' : '#0284c7') : '#94a3b8',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900'
            }}>
              {currentStep > 2 || successData ? '✓' : '2'}
            </div>
            <div>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                color: currentStep >= 2 ? '#0284c7' : '#64748b',
                textTransform: 'uppercase'
              }}>
                Step 2: Participants
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
              </div>
            </div>
          </div>

          <div style={{ height: '2px', flex: 1, background: currentStep >= 3 ? '#0284c7' : '#cbd5e1', margin: '0 12px' }} />

          {/* Step 3 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: successData ? '#10b981' : (currentStep === 3 ? '#0284c7' : '#94a3b8'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900'
            }}>
              {successData ? '✓' : '3'}
            </div>
            <div>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                color: currentStep === 3 ? '#0284c7' : (successData ? '#10b981' : '#64748b'),
                textTransform: 'uppercase'
              }}>
                Step 3: Review & Pay
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                {isPaid ? `₹${feeInRupees}` : 'FREE'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-pad" style={{ padding: '24px' }}>
          {successData ? (
            /* ==============================================================
               SUCCESS / CONFIRMED PASS SCREEN (With full participants list)
               ============================================================== */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                boxShadow: '0 4px 16px rgba(22, 163, 74, 0.25)'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <div>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Registration Confirmed • Pass Generated
                </span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#0f172a', marginTop: '8px', marginBottom: '4px' }}>
                  You're Ready for VEDA 2k26!
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto' }}>
                  Successfully registered for <strong>{event?.title}</strong>. Your official entry pass details are shown below.
                </p>
              </div>

              {/* Official Pass Ticket Box */}
              <div style={{
                background: '#ffffff',
                border: '2px dashed #0284c7',
                borderRadius: '16px',
                padding: '22px',
                width: '100%',
                textAlign: 'left',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Registration Pass ID</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0284c7', fontFamily: 'Space Grotesk' }}>
                      {successData.registrationNumber}
                    </div>
                  </div>
                  {successData.paymentReference && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Payment Ref</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', fontFamily: 'Space Grotesk' }}>
                        {successData.paymentReference}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.88rem', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Event Name:</span>
                    <strong style={{ color: '#0f172a' }}>{event?.title}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Venue:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {typeof event?.venue === 'object' ? (event?.venue?.name || event?.venue?.address || 'Aditya University') : (event?.venue || 'Aditya University')}
                    </strong>
                  </div>
                  {successData.teamName && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Team Name:</span>
                      <strong style={{ color: '#0f172a' }}>{successData.teamName}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Total Participants:</span>
                    <strong style={{ color: '#0f172a' }}>{successData.teamSize || participants.length} Members</strong>
                  </div>
                </div>

                {/* Registered Participants Table */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Registered Participants:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(successData.participants && successData.participants.length > 0 ? successData.participants : participants).map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.84rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: p.isLead ? '#0284c7' : '#94a3b8',
                            color: '#ffffff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: '900'
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: '800', color: '#0f172a' }}>{p.name}</span>
                          {p.isLead && (
                            <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                              LEAD
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', color: '#475569' }}>
                          {p.rollNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-outline"
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  <Printer size={16} /> Print / Save Pass
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  Done • Back to Events
                </button>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* ==============================================================
               STEP 3: DISPLAY PARTICIPANTS DATA AT UI & PROCEED TO PAYMENT
               ============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  <ShieldCheck size={16} /> Step 3: Review Participants & Payment Confirmation
                </div>
                <h4 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: '4px 0 6px' }}>
                  Please Verify Your Participants Data
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Review all team member details below. Once confirmed, payment details will be securely saved into the <strong>central_event_student_payments</strong> collection.
                </p>
              </div>

              {/* Event & Team Header Card */}
              <div style={{
                background: '#071830',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
                    {isTeam ? `Team Event • ${participants.length} Participants` : 'Solo Event'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900' }}>
                    {event?.title}
                  </div>
                  {isTeam && teamName && (
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' }}>
                      Team Name: <strong>{teamName}</strong>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Fee Payable
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#38bdf8', fontFamily: 'Space Grotesk' }}>
                    {isPaid ? `₹${feeInRupees}` : 'FREE'}
                  </div>
                </div>
              </div>

              {/* Participants Data UI Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Participants List ({participants.length}):</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                    Target: central_event_student_registrations
                  </span>
                </div>

                {participants.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: p.isLead ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: p.isLead ? '#0284c7' : '#e2e8f0',
                          color: p.isLead ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '900'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                          {p.name}
                        </span>
                        {p.isLead ? (
                          <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                            TEAM LEAD
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            MEMBER {idx + 1}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.92rem', fontWeight: '800', color: '#0284c7' }}>
                        {p.rollNumber}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                      <div>
                        Department: <strong style={{ color: '#334155' }}>{p.department || 'CSE'}</strong>
                      </div>
                      {p.year && (
                        <div>
                          Year: <strong style={{ color: '#334155' }}>{p.year}</strong>
                        </div>
                      )}
                      {p.phone && (
                        <div>
                          Mobile: <strong style={{ color: '#334155' }}>{p.phone}</strong>
                        </div>
                      )}
                      {p.email && (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Email: <strong style={{ color: '#334155' }}>{p.email}</strong>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

              {/* Step 3 Collection Persistence Note */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <strong>End-to-End Persistence Pipeline:</strong> Registration records store all {participants.length} participant(s) into <code>central_event_student_registrations</code>, and payment data will be recorded in <code>central_event_student_payments</code>.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={loading}
                  className="btn-outline"
                  style={{ flex: 1, padding: '13px', justifyContent: 'center', fontWeight: '700' }}
                >
                  <ArrowLeft size={16} /> Edit Participants
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndPay}
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '13px',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving & Processing...
                    </>
                  ) : (
                    <>
                      {isPaid ? `Confirm & Pay ₹${feeInRupees}` : 'Confirm Free Registration'} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ==============================================================
               STEP 2: PARTICIPANTS ENTRY FORM BASED ON TEAM SIZE
               ============================================================== */
            <form onSubmit={handleProceedToReview} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Team Information Bar (If Team Event) */}
              {isTeam && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: '800', color: '#0f172a' }}>
                      Team Size Selection *
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                      Allowed: {minTeamSize} to {maxTeamSize} members
                    </span>
                  </div>

                  {/* Team Size Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, i) => minTeamSize + i).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSetTeamSize(size)}
                        style={{
                          flex: 1,
                          minWidth: '70px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: participants.length === size ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          background: participants.length === size ? '#e0f2fe' : '#ffffff',
                          color: participants.length === size ? '#0284c7' : '#334155',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Users size={14} />
                        <span>{size} Members</span>
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CodeCraft / Innovators"
                      className={`form-control ${errors.teamName ? 'is-invalid' : ''}`}
                      value={teamName}
                      onChange={(e) => {
                        setTeamName(e.target.value.slice(0, 50));
                        if (errors.teamName) {
                          setErrors(prev => {
                            const cp = { ...prev };
                            delete cp.teamName;
                            return cp;
                          });
                        }
                      }}
                    />
                    {errors.teamName && <div className="form-error-msg">{errors.teamName}</div>}
                  </div>
                </div>
              )}

              {/* Dynamic Participants Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {participants.map((p, index) => {
                  const isLead = index === 0;
                  const isLookingUp = !!autoPopulatingIndices[index];

                  return (
                    <div
                      key={index}
                      style={{
                        background: '#ffffff',
                        border: isLead ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Participant Header Strip */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isLead ? '#0284c7' : '#64748b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.74rem',
                            fontWeight: '900'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                            {isLead ? (isTeam ? 'Participant 1 (Team Lead)' : 'Participant Details') : `Participant ${index + 1} (Team Member)`}
                          </span>
                          {isLead && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                              LEAD
                            </span>
                          )}
                        </div>

                        {!isLead && participants.length > minTeamSize && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(index)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                            title="Remove this member"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      {/* Participant Fields Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '12px' }}>
                        {/* Roll Number with Auto-fill */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Roll Number *</label>
                            <button
                              type="button"
                              onClick={() => autoPopulateParticipant(index, p.rollNumber)}
                              disabled={isLookingUp}
                              style={{
                                background: 'rgba(2, 132, 199, 0.08)',
                                border: '1px solid rgba(2, 132, 199, 0.2)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                color: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                                fontWeight: '700'
                              }}
                            >
                              <Sparkles size={11} /> Auto-fill
                            </button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 24B11PT019"
                              className={`form-control ${errors[`rollNumber_${index}`] ? 'is-invalid' : ''}`}
                              value={p.rollNumber}
                              onChange={(e) => handleParticipantChange(index, 'rollNumber', e.target.value)}
                              onBlur={() => autoPopulateParticipant(index, p.rollNumber)}
                              style={{ textTransform: 'uppercase', fontWeight: '700' }}
                            />
                            {isLookingUp && (
                              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }}>
                                <Loader2 size={16} className="animate-spin" />
                              </div>
                            )}
                          </div>
                          {errors[`rollNumber_${index}`] && <div className="form-error-msg">{errors[`rollNumber_${index}`]}</div>}
                        </div>

                        {/* Full Name */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ marginBottom: '4px' }}>Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Full legal name"
                            className={`form-control ${errors[`name_${index}`] ? 'is-invalid' : ''}`}
                            value={p.name}
                            onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                          />
                          {errors[`name_${index}`] && <div className="form-error-msg">{errors[`name_${index}`]}</div>}
                        </div>
                      </div>

                      {/* Contact & Branch Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ marginBottom: '4px' }}>
                            WhatsApp Mobile {isLead ? '*' : '(Optional)'}
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            required={isLead}
                            placeholder="10-digit mobile"
                            className={`form-control ${errors[`phone_${index}`] ? 'is-invalid' : ''}`}
                            value={p.phone}
                            onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                          />
                          {errors[`phone_${index}`] && <div className="form-error-msg">{errors[`phone_${index}`]}</div>}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ marginBottom: '4px' }}>Department *</label>
                          <select
                            className="form-control"
                            value={p.department || 'CSE'}
                            onChange={(e) => handleParticipantChange(index, 'department', e.target.value)}
                          >
                            <option value="CSE">CSE / AI & ML / Data Science</option>
                            <option value="IT">Information Technology</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="MECH">Mechanical</option>
                            <option value="CIVIL">Civil Engineering</option>
                            <option value="AGRI">Agricultural</option>
                            <option value="PHARMACY">Pharmacy / Management</option>
                          </select>
                        </div>
                      </div>

                      {/* Lead Email */}
                      {isLead && (
                        <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                          <label className="form-label" style={{ marginBottom: '4px' }}>Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="student@aditya.ac.in"
                            className={`form-control ${errors[`email_${index}`] ? 'is-invalid' : ''}`}
                            value={p.email}
                            onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                          />
                          {errors[`email_${index}`] && <div className="form-error-msg">{errors[`email_${index}`]}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Member Button if team can take more */}
              {isTeam && participants.length < maxTeamSize && (
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="btn-outline"
                  style={{ padding: '10px', justifyContent: 'center', fontWeight: '700', borderStyle: 'dashed' }}
                >
                  <Plus size={16} /> Add Another Participant ({participants.length}/{maxTeamSize})
                </button>
              )}

              {autoPopulatedMsg && (
                <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                  <CheckCircle2 size={14} />
                  <span>{autoPopulatedMsg}</span>
                </div>
              )}

              {/* Submit to Review Button */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontWeight: '800',
                  fontSize: '1rem',
                  marginTop: '8px'
                }}
              >
                <span>Review Participants & Proceed to Step 3</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
