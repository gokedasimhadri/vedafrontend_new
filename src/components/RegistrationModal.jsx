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
import {
  centralApi,
  isRealRazorpayOrderId,
  isEventRegisteredByStudent,
  matchBranchToDepartment
} from '../api/centralApi';

export default function RegistrationModal({
  event,
  onClose,
  currentUser,
  onRequestLogin,
  onSuccess,
  userRegistrations = []
}) {
  const [loading, setLoading] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // Load active event departments directly from eventdepartments collection
  useEffect(() => {
    let isMounted = true;
    centralApi.getEventDepartments()
      .then(depts => {
        if (isMounted && Array.isArray(depts)) {
          setDepartmentsList(depts);
        }
      })
      .catch(err => {
        console.error('Failed to load event departments from collection:', err);
      })
      .finally(() => {
        if (isMounted) setDepartmentsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const lookupTimeouts = React.useRef({});

  const effectiveRegistrations = Array.isArray(userRegistrations) && userRegistrations.length > 0
    ? userRegistrations
    : (() => {
        try {
          const raw = localStorage.getItem('veda_student_registrations');
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

  const isAlreadyRegistered = isEventRegisteredByStudent(event, effectiveRegistrations);
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
    const cleanRoll = (currentUser?.roll || currentUser?.rollNumber || '').toUpperCase();
    let col = currentUser?.college || '';
    if (!col) {
      if (cleanRoll.includes('A9')) col = 'AEC';
      else if (cleanRoll.includes('P3')) col = 'ACET';
      else col = 'Aditya University';
    }

    const lead = {
      rollNumber: cleanRoll,
      name: currentUser?.name || '',
      college: col,
      gender: currentUser?.gender || 'Male',
      phone: currentUser?.mobile || currentUser?.phone || '',
      email: currentUser?.email || '',
      year: currentUser?.year || 'Select',
      department: currentUser?.department || 'Select',
      branch: currentUser?.branch || '',
      location: currentUser?.location || '',
      isLead: true
    };

    if (isTeam && minTeamSize > 1) {
      const initialList = [lead];
      for (let i = 1; i < minTeamSize; i++) {
        initialList.push({
          rollNumber: '',
          name: '',
          college: lead.college,
          gender: 'Select',
          phone: '',
          email: '',
          year: 'Select',
          department: 'Select',
          branch: '',
          location: '',
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
        let sCollege = studentData.college || studentData.College || studentData.collegename || '';
        if (!sCollege) {
          if (cleanRoll.includes('A9')) sCollege = 'AEC';
          else if (cleanRoll.includes('P3')) sCollege = 'ACET';
          else sCollege = 'Aditya University';
        }

        let sGender = studentData.gender || studentData.Gender || 'Male';
        if (sGender.toUpperCase() === 'M' || sGender.toUpperCase() === 'MALE') sGender = 'Male';
        else if (sGender.toUpperCase() === 'F' || sGender.toUpperCase() === 'FEMALE') sGender = 'Female';

        const sBranch = String(studentData.branch || studentData.Branch || '').trim();
        let sYear = studentData.year || '';
        if (!sYear || sYear === 'Select') {
          const sSem = String(studentData.semester || studentData.semestername || '').toUpperCase();
          if (sSem.includes('VIII') || sSem.includes('VII') || sSem.includes('4/4') || sSem.includes('4TH')) sYear = '4th Year';
          else if (sSem.includes('VI') || sSem.includes('V') || sSem.includes('3/4') || sSem.includes('3RD')) sYear = '3rd Year';
          else if (sSem.includes('IV') || sSem.includes('III') || sSem.includes('2/4') || sSem.includes('2ND')) sYear = '2nd Year';
          else if (sSem.includes('II') || sSem.includes('I') || sSem.includes('1/4') || sSem.includes('1ST')) sYear = '1st Year';
          else sYear = 'Select';
        }

        const sLocation = studentData.location || '';
        // Automatically match branch against department name & alternative names from backend!
        const matchedDept = matchBranchToDepartment(sBranch, departmentsList) || 'Select';

        setParticipants(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              rollNumber: cleanRoll,
              name: sName || updated[index].name,
              college: sCollege,
              gender: sGender,
              phone: sMobile ? String(sMobile).replace(/\D/g, '').slice(-10) : updated[index].phone,
              email: sEmail || updated[index].email,
              year: sYear,
              branch: sBranch || updated[index].branch,
              location: sLocation || updated[index].location,
              department: matchedDept !== 'Select' ? matchedDept : updated[index].department
            };
          }
          return updated;
        });

        setErrors(prev => {
          const nextErr = { ...prev };
          delete nextErr[`rollNumber_${index}`];
          if (sName) delete nextErr[`name_${index}`];
          if (sMobile) delete nextErr[`phone_${index}`];
          if (sEmail) delete nextErr[`email_${index}`];
          return nextErr;
        });

        if (index === 0) {
          setAutoPopulatedMsg(`✓ Profile auto-filled for ${sName || cleanRoll} (${matchedDept !== 'Select' ? matchedDept : sBranch})`);
        }
      }
    } catch (err) {
      console.warn('Auto-populate error for participant:', err);
    } finally {
      setAutoPopulatingIndices(prev => ({ ...prev, [index]: false }));
    }
  };

  // If lead participant has roll number on mount, auto-populate all details
  useEffect(() => {
    if (participants[0]?.rollNumber && participants[0].rollNumber.length >= 5) {
      autoPopulateParticipant(0, participants[0].rollNumber);
    }
  }, [departmentsList]);

  // When departments are loaded from eventdepartments collection, auto-match departments for any participant with branch
  useEffect(() => {
    if (departmentsList.length > 0) {
      setParticipants(prev => prev.map(p => {
        if (p.branch && (!p.department || p.department === 'Select')) {
          const autoDept = matchBranchToDepartment(p.branch, departmentsList);
          if (autoDept && autoDept !== 'Select') {
            return { ...p, department: autoDept };
          }
        }
        return p;
      }));
    }
  }, [departmentsList]);

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    if (!updated[index]) return;

    if (field === 'rollNumber') {
      const cleanRoll = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      updated[index][field] = cleanRoll;
      if (cleanRoll.length >= 5) {
        clearTimeout(lookupTimeouts.current[index]);
        lookupTimeouts.current[index] = setTimeout(() => {
          autoPopulateParticipant(index, cleanRoll);
        }, 500);
      }
    } else if (field === 'name') {
      updated[index][field] = value.replace(/[^a-zA-Z\s.]/g, '').slice(0, 60);
    } else if (field === 'phone') {
      updated[index][field] = value.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'email') {
      updated[index][field] = value.trim();
    } else if (field === 'branch') {
      updated[index][field] = value;
      const autoDept = matchBranchToDepartment(value, departmentsList);
      if (autoDept && autoDept !== 'Select') {
        updated[index].department = autoDept;
      }
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
          rollNumber: '',
          name: '',
          college: participants[0]?.college || 'ACET',
          gender: 'Select',
          phone: '',
          email: '',
          year: 'Select',
          department: 'Select',
          branch: '',
          location: '',
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
        gender: m.gender || 'Male',
        department: m.department || lead.department,
        branch: m.branch || '',
        year: m.year || lead.year,
        location: m.location || ''
      }));

      const payload = {
        eventId: event?._id,
        eventSlug: event?.slug,
        eventTitle: event?.title,
        typeCode: (import.meta.env.VITE_EVENT_TYPE || import.meta.env.EVENT_TYPE || event?.typeCode || 'VEDA').toUpperCase(),
        academicYear: import.meta.env.VITE_EVENT_ACADEMIC_YEAR || import.meta.env.EVENT_ACADEMIC_YEAR || event?.academicYear || '2026-2027',
        academic_year: import.meta.env.VITE_EVENT_ACADEMIC_YEAR || import.meta.env.EVENT_ACADEMIC_YEAR || event?.academic_year || '2026-2027',
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
          gender: p.gender || 'Male',
          department: p.department || lead.department,
          branch: p.branch || '',
          year: p.year || lead.year,
          location: p.location || '',
          isLead: !!p.isLead
        })),
        participant: {
          name: lead.name.trim(),
          rollNumber: lead.rollNumber.trim().toUpperCase(),
          email: lead.email.trim().toLowerCase(),
          phone: lead.phone.trim(),
          college: lead.college || 'ACET',
          gender: lead.gender || 'Male',
          department: lead.department || 'Select',
          branch: lead.branch || '',
          year: lead.year || 'Select',
          location: lead.location || ''
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
    const isRealOrderId = isRealRazorpayOrderId(order?.id);

    const options = {
      key: order?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order?.amount || 100,
      currency: order?.currency || 'INR',
      name: 'Aditya University - VEDA 2k26',
      description: `Registration Fee: ${event?.title || 'Event'} (${participants.length} Participants)`,
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
        setLoading(true);
        try {
          // Save payment data into central_event_student_payments collection
          const verifyRes = await centralApi.verifyRegistrationPayment({
            registrationId: registration._id,
            registrationNumber: registration.registrationNumber,
            paymentReference: registration.paymentReference || `PAY-${registration.registrationNumber}`,
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
      console.warn('Payment notice:', failResp);
      const desc = failResp.error?.description;
      if (desc && desc !== 'Payment failed' && !desc.toLowerCase().includes('cancel')) {
        alert(`Payment notice: ${desc}`);
      }
      setLoading(false);
    });
    rzp.open();
  };

  return (
    <div className="veda-modal-overlay" onClick={onClose}>
      <div
        className="veda-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '940px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
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
          {isAlreadyRegistered ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#dcfce7',
                border: '2px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#15803d',
                boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>
                Already Registered!
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                You have already registered for <strong>{event?.title}</strong>. Your pass and details are safely stored in your account.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSuccess && onSuccess();
                  }}
                  className="btn-primary"
                  style={{ padding: '11px 26px', borderRadius: '9999px', fontSize: '0.92rem', fontWeight: '800' }}
                >
                  View My Passes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #cbd5e1',
                    color: '#475569',
                    padding: '11px 22px',
                    borderRadius: '9999px',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : successData ? (
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
                        College: <strong style={{ color: '#334155' }}>{p.college || '—'}</strong>
                      </div>
                      <div>
                        Gender: <strong style={{ color: '#334155' }}>{p.gender || '—'}</strong>
                      </div>
                      <div>
                        Department: <strong style={{ color: '#0284c7' }}>{p.department || '—'}</strong>
                      </div>
                      {p.branch && (
                        <div>
                          Branch: <strong style={{ color: '#334155' }}>{p.branch}</strong>
                        </div>
                      )}
                      <div>
                        Year of study: <strong style={{ color: '#334155' }}>{p.year || '—'}</strong>
                      </div>
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
                      {p.location && (
                        <div style={{ gridColumn: '1 / -1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Location: <strong style={{ color: '#334155' }}>{p.location}</strong>
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
                      placeholder="Team Name"
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

                      {/* Participant Fields Grid (Matching Reference Image 1 Layout) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Row 1: Roll Number | Name | College | Gender */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '16px'
                        }}>
                          {/* Roll Number */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                Roll Number
                              </label>
                              {isLookingUp && (
                                <span style={{ fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                                  <Loader2 size={12} className="animate-spin" /> Fetching...
                                </span>
                              )}
                            </div>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                required
                                placeholder="Roll Number"
                                value={p.rollNumber}
                                onChange={(e) => handleParticipantChange(index, 'rollNumber', e.target.value)}
                                onBlur={(e) => {
                                  if (e.target.value && e.target.value.length >= 5) {
                                    autoPopulateParticipant(index, e.target.value);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  height: '42px',
                                  padding: '8px 12px',
                                  background: '#f8fafc',
                                  border: errors[`rollNumber_${index}`] ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '0.88rem',
                                  fontWeight: '700',
                                  color: '#0f172a',
                                  textTransform: 'uppercase',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            {errors[`rollNumber_${index}`] && (
                              <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px' }}>
                                {errors[`rollNumber_${index}`]}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Name"
                              value={p.name}
                              onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: errors[`name_${index}`] ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            {errors[`name_${index}`] && (
                              <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px' }}>
                                {errors[`name_${index}`]}
                              </div>
                            )}
                          </div>

                          {/* College */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              College
                            </label>
                            <select
                              value={p.college || 'ACET'}
                              onChange={(e) => handleParticipantChange(index, 'college', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="ACET">ACET</option>
                              <option value="AEC">AEC</option>
                              <option value="Aditya University">Aditya University</option>
                            </select>
                          </div>

                          {/* Gender */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Gender
                            </label>
                            <select
                              value={p.gender || 'Male'}
                              onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="Select">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Mobile | Email | Year of study | Departments */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '16px'
                        }}>
                          {/* Mobile */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Mobile
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Mobile"
                              value={p.phone}
                              onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: errors[`phone_${index}`] ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            {errors[`phone_${index}`] && (
                              <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px' }}>
                                {errors[`phone_${index}`]}
                              </div>
                            )}
                          </div>

                          {/* Email */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Email
                            </label>
                            <input
                              type="email"
                              placeholder="Email"
                              value={p.email}
                              onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: errors[`email_${index}`] ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            {errors[`email_${index}`] && (
                              <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px' }}>
                                {errors[`email_${index}`]}
                              </div>
                            )}
                          </div>

                          {/* Year of study */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Year of study
                            </label>
                            <select
                              value={p.year || 'Select'}
                              onChange={(e) => handleParticipantChange(index, 'year', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="Select">Select</option>
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                            </select>
                          </div>

                          {/* Departments (auto-selected from branch matching name or alternativeNames!) */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Departments
                            </label>
                            <select
                              value={p.department || 'Select'}
                              onChange={(e) => handleParticipantChange(index, 'department', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '700',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              {p.department && p.department !== 'Select' ? (
                                <option value={p.department}>{p.department}</option>
                              ) : (
                                <option value="Select">Select</option>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Row 3: Branch | Location */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '16px'
                        }}>
                          {/* Branch (Not editable, auto-populated from roll number) */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Branch
                            </label>
                            <input
                              type="text"
                              readOnly
                              tabIndex={-1}
                              placeholder="Branch"
                              value={p.branch || ''}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '700',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box',
                                cursor: 'not-allowed',
                                userSelect: 'none'
                              }}
                              title="Branch is auto-populated from roll number and cannot be edited"
                            />
                          </div>

                          {/* Location */}
                          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                              Location
                            </label>
                            <input
                              type="text"
                              placeholder="Location"
                              value={p.location || ''}
                              onChange={(e) => handleParticipantChange(index, 'location', e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                      </div>
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
