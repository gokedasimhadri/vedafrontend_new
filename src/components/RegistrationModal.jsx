import React, { useState } from 'react';
import { X, CheckCircle2, User, Mail, Phone, Building, Plus, Trash2, ShieldCheck, QrCode, ArrowRight, CreditCard, Loader2, Sparkles } from 'lucide-react';
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

export default function RegistrationModal({ event, onClose, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [autoPopulatedMsg, setAutoPopulatedMsg] = useState('');

  const [formData, setFormData] = useState({
    rollNumber: currentUser?.roll || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.mobile || '',
    college: currentUser?.college || 'Aditya University',
    department: 'CSE',
    year: '3rd Year',
    teamName: '',
    teamMembers: []
  });

  const [errors, setErrors] = useState({});

  const isTeam = event?.participation?.type === 'TEAM';
  const maxMembers = event?.participation?.maxTeamSize || 4;

  const feeInRupees = event?.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event?.fee?.amount !== undefined ? event.fee.amount / 100 : 0);
  const isPaid = feeInRupees > 0;

  // Auto-populate student details by calling Aditya ECAP API with .env key
  const autoPopulateFromRoll = async (rollNo) => {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    if (cleanRoll.length < 5) return;

    setIsAutoPopulating(true);
    setAutoPopulatedMsg('');
    try {
      const studentData = await centralApi.lookupStudentByRoll(cleanRoll);
      if (studentData) {
        const studentName = studentData.studentname || studentData.StudentName || studentData.name || '';
        const studentMobile = studentData.mobilenumber || studentData.MobileNumber || studentData.phone || studentData.mobile || '';
        const studentEmail = studentData.email || studentData.Email || studentData.studentemail || `${cleanRoll.toLowerCase()}@adityauniversity.in`;
        const studentCollege = studentData.college || studentData.College || studentData.collegename || 'Aditya University';
        const studentBranch = studentData.branch || studentData.Branch || studentData.department || '';

        setFormData(prev => ({
          ...prev,
          rollNumber: cleanRoll,
          name: studentName || prev.name,
          phone: studentMobile ? String(studentMobile).replace(/\D/g, '').slice(0, 10) : prev.phone,
          email: studentEmail || prev.email,
          college: studentCollege || prev.college,
          department: mapBranchToDepartment(studentBranch) || prev.department
        }));

        setErrors(prev => {
          const nextErr = { ...prev };
          delete nextErr.rollNumber;
          if (studentName) delete nextErr.name;
          if (studentEmail) delete nextErr.email;
          if (studentMobile) delete nextErr.phone;
          return nextErr;
        });

        setAutoPopulatedMsg(`✓ Auto-populated: ${studentName || cleanRoll}`);
      }
    } catch (err) {
      console.warn('Auto-populate lookup error:', err);
    } finally {
      setIsAutoPopulating(false);
    }
  };

  // Auto-populate when modal opens if roll number is already available
  React.useEffect(() => {
    if (formData.rollNumber && formData.rollNumber.length >= 6 && !formData.name) {
      autoPopulateFromRoll(formData.rollNumber);
    }
  }, []);

  const handleNameChange = (val) => {
    const cleaned = val.replace(/[^a-zA-Z\s.]/g, '').slice(0, 50);
    setFormData(prev => ({ ...prev, name: cleaned }));
    if (cleaned.trim().length > 0 && cleaned.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must contain at least 2 letters' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
  };

  const handleRollNumberChange = (val) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, rollNumber: cleaned }));
    setAutoPopulatedMsg('');
    if (cleaned.length > 0 && cleaned.length < 4) {
      setErrors(prev => ({ ...prev, rollNumber: 'Roll Number must be at least 4 characters' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.rollNumber;
        return copy;
      });
    }

    // Auto-populate on typing (debounced)
    if (cleaned.length >= 6) {
      clearTimeout(window._vedaRollLookupTimer);
      window._vedaRollLookupTimer = setTimeout(() => {
        autoPopulateFromRoll(cleaned);
      }, 400);
    }
  };

  const handleEmailChange = (val) => {
    const cleaned = val.trim();
    setFormData(prev => ({ ...prev, email: cleaned }));
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (cleaned.length > 0 && !emailRegex.test(cleaned)) {
      setErrors(prev => ({ ...prev, email: 'Enter a valid email address (e.g. name@domain.com)' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.email;
        return copy;
      });
    }
  };

  const handlePhoneChange = (val) => {
    // Only accept numeric digits, strictly maximum 10 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: digitsOnly }));
    if (digitsOnly.length > 0 && !/^[6-9]/.test(digitsOnly)) {
      setErrors(prev => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9' }));
    } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setErrors(prev => ({ ...prev, phone: `Must be exactly 10 digits (${digitsOnly.length}/10 entered)` }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.phone;
        return copy;
      });
    }
  };

  const handleAddMember = () => {
    if (formData.teamMembers.length < maxMembers - 1) {
      setFormData({
        ...formData,
        teamMembers: [...formData.teamMembers, { name: '', rollNumber: '', email: '', phone: '' }]
      });
    }
  };

  // Auto-populate team member from roll number
  const autoPopulateMemberFromRoll = async (index, rollNo) => {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    if (cleanRoll.length < 5) return;
    try {
      const studentData = await centralApi.lookupStudentByRoll(cleanRoll);
      if (studentData) {
        const sName = studentData.studentname || studentData.StudentName || studentData.name || '';
        const sMobile = studentData.mobilenumber || studentData.MobileNumber || studentData.phone || '';
        const sEmail = studentData.email || studentData.Email || `${cleanRoll.toLowerCase()}@adityauniversity.in`;
        
        setFormData(prev => {
          const updated = [...prev.teamMembers];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              rollNumber: cleanRoll,
              name: sName || updated[index].name,
              phone: sMobile ? String(sMobile).replace(/\D/g, '').slice(0, 10) : updated[index].phone,
              email: sEmail || updated[index].email
            };
          }
          return { ...prev, teamMembers: updated };
        });
      }
    } catch (e) {
      // quiet fallback
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...formData.teamMembers];
    if (field === 'name') {
      updated[index][field] = value.replace(/[^a-zA-Z\s.]/g, '').slice(0, 50);
    } else if (field === 'rollNumber') {
      const cleanRoll = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      updated[index][field] = cleanRoll;
      if (cleanRoll.length >= 6) {
        clearTimeout(window[`_memberTimer_${index}`]);
        window[`_memberTimer_${index}`] = setTimeout(() => {
          autoPopulateMemberFromRoll(index, cleanRoll);
        }, 400);
      }
    } else if (field === 'phone') {
      updated[index][field] = value.replace(/\D/g, '').slice(0, 10);
    } else {
      updated[index][field] = value;
    }
    setFormData({ ...formData, teamMembers: updated });
  };

  const handleRemoveMember = (index) => {
    const updated = formData.teamMembers.filter((_, i) => i !== index);
    setFormData({ ...formData, teamMembers: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation check
    const newErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedRoll = formData.rollNumber.trim().toUpperCase();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim().replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 2) {
      newErrors.name = 'Full Name is required (letters only, min 2 chars)';
    }

    if (!trimmedRoll || trimmedRoll.length < 4) {
      newErrors.rollNumber = 'Valid Roll Number is required (min 4 characters)';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Valid Email Address is required';
    }

    if (!trimmedPhone || !/^[6-9]\d{9}$/.test(trimmedPhone)) {
      newErrors.phone = 'Valid 10-digit WhatsApp number required (starts with 6, 7, 8, or 9)';
    }

    if (isTeam && (!formData.teamName || formData.teamName.trim().length < 2)) {
      newErrors.teamName = 'Team Name is required (min 2 characters)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        eventId: event?._id,
        eventSlug: event?.slug,
        eventTitle: event?.title,
        typeCode: 'VEDA',
        participant: {
          name: formData.name,
          rollNumber: formData.rollNumber,
          email: formData.email,
          phone: formData.phone,
          college: formData.college,
          department: formData.department,
          year: formData.year
        },
        teamName: isTeam ? formData.teamName : undefined,
        teamMembers: isTeam ? formData.teamMembers : undefined,
        fee: event?.fee
      };

      const res = await centralApi.submitRegistration(payload);

      if (res.isFree || !res.order) {
        // Free Event -> Directly confirmed!
        setSuccessData(res.data);
      } else {
        // Paid Event -> Show Pay Option Screen as requested!
        setPendingPayment({
          registration: res.data,
          order: res.order
        });
      }
    } catch (err) {
      alert(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!pendingPayment || !pendingPayment.order) return;

    if (!window.Razorpay) {
      alert('Razorpay payment gateway is loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    const { registration, order } = pendingPayment;

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'Aditya University - VEDA 2k26',
      description: `Registration Fee for ${event?.title || 'Event'}`,
      order_id: order.id,
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAA',
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: {
        color: '#0284c7'
      },
      handler: async function (paymentResponse) {
        setLoading(true);
        try {
          const verifyRes = await centralApi.verifyRegistrationPayment({
            registrationId: registration._id,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature
          });
          if (verifyRes.success) {
            setPendingPayment(null);
            setSuccessData(verifyRes.data);
          } else {
            alert(verifyRes.message || 'Payment verification failed.');
          }
        } catch (vErr) {
          alert(vErr.message || 'Payment verification failed. Please contact the registration desk.');
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
      <div className="veda-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-main)'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase' }}>
              VEDA 2k26 • Registration Desk
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              {event?.title || 'Event Registration'}
            </h3>
          </div>
          <button className="modal-close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body-pad">
          {successData ? (
            /* Success Confirmation Screen */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Registration Confirmed!</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.95rem' }}>
                You have successfully registered for <strong>{event?.title}</strong> in VEDA 2k26.
              </p>

              {/* Registration Pass Ticket Box */}
              <div style={{
                background: 'var(--bg-main)',
                border: '2px dashed #0284c7',
                borderRadius: '12px',
                padding: '20px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reg ID:</span>
                  <span style={{ fontWeight: '800', fontFamily: 'Space Grotesk', color: '#0284c7' }}>{successData.registrationNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead Participant:</span>
                  <span style={{ fontWeight: '700' }}>{formData.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Venue & Reporting:</span>
                  <span style={{ fontWeight: '600' }}>
                    {typeof event?.venue === 'object' ? (event?.venue?.name || event?.venue?.address || 'Aditya University Campus') : (event?.venue || 'Aditya University Campus')}
                  </span>
                </div>
              </div>

              <button onClick={onClose} className="btn-primary" style={{ marginTop: '10px' }}>
                <span>Back to Events Catalog</span>
              </button>
            </div>
          ) : pendingPayment ? (
            /* Payment Option Screen (Requested: "regiter iyyaka tharavatha pay option chupichalui click chesaka payment avvali") */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '16px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
              }}>
                <CreditCard size={32} />
              </div>

              <div>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Payment Pending
                </span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '4px' }}>
                  Registration Submitted!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                  Your details have been saved. Complete the payment below to confirm your spot in <strong>{event?.title}</strong>.
                </p>
              </div>

              {/* Payment Summary Box */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registration ID:</span>
                  <span style={{ fontWeight: '800', fontFamily: 'Space Grotesk', color: '#0284c7' }}>
                    {pendingPayment.registration?.registrationNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead Participant:</span>
                  <span style={{ fontWeight: '700' }}>{formData.name} ({formData.rollNumber})</span>
                </div>
                {isTeam && formData.teamName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Team Name:</span>
                    <span style={{ fontWeight: '700' }}>{formData.teamName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>Total Fee Payable:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7', fontFamily: 'Space Grotesk' }}>
                    ₹{feeInRupees}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Official Razorpay Gateway (UPI, GPay, PhonePe, Cards, NetBanking)</span>
              </div>

              {/* Pay Now CTA */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '1.02rem',
                  fontWeight: '800',
                  boxShadow: '0 4px 16px rgba(11, 34, 64, 0.25)'
                }}
              >
                {loading ? 'Opening Payment Gateway...' : `Pay ₹${feeInRupees} & Confirm Pass`}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {isTeam && (
                <div className="form-group">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberKnights"
                    className={`form-control ${errors.teamName ? 'is-invalid' : ''}`}
                    value={formData.teamName}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 50);
                      setFormData({ ...formData, teamName: val });
                      if (val.trim().length >= 2) {
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
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '14px' }}>
                {/* Roll Number - First Field with Auto-populate */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Roll Number / ID *</span>
                    <button
                      type="button"
                      onClick={() => autoPopulateFromRoll(formData.rollNumber)}
                      disabled={isAutoPopulating}
                      title="Click to fetch student details"
                      style={{
                        background: 'rgba(2, 132, 199, 0.08)',
                        border: '1px solid rgba(2, 132, 199, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Sparkles size={12} /> Auto-fill
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24B11PT019"
                      className={`form-control ${errors.rollNumber ? 'is-invalid' : ''}`}
                      value={formData.rollNumber}
                      onChange={(e) => handleRollNumberChange(e.target.value)}
                      onBlur={() => autoPopulateFromRoll(formData.rollNumber)}
                      style={{ textTransform: 'uppercase', paddingRight: isAutoPopulating ? '36px' : '12px', fontWeight: '600' }}
                    />
                    {isAutoPopulating && (
                      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#0284c7' }}>
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  {autoPopulatedMsg && (
                    <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <CheckCircle2 size={13} />
                      <span>{autoPopulatedMsg}</span>
                    </div>
                  )}
                  {errors.rollNumber && <div className="form-error-msg">{errors.rollNumber}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">{isTeam ? 'Team Lead Name *' : 'Full Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vishnu Vardhan"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  {errors.name && <div className="form-error-msg">{errors.name}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@aditya.ac.in"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                  {errors.email && <div className="form-error-msg">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Mobile No *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">College / University *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-control"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="CSE">CSE / AI & ML / Data Science</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                    <option value="AGRI">Agricultural Engineering</option>
                    <option value="PHARMACY">Pharmacy / Management</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Team Members Section */}
              {isTeam && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Additional Team Members ({formData.teamMembers.length} / {maxMembers - 1})
                    </label>
                    {formData.teamMembers.length < maxMembers - 1 && (
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="btn-outline"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      >
                        <Plus size={14} /> Add Member
                      </button>
                    )}
                  </div>

                  {formData.teamMembers.map((member, index) => (
                    <div key={index} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Roll No"
                        required
                        className="form-control"
                        style={{ width: '140px', textTransform: 'uppercase' }}
                        value={member.rollNumber}
                        onChange={(e) => handleMemberChange(index, 'rollNumber', e.target.value)}
                        onBlur={() => autoPopulateMemberFromRoll(index, member.rollNumber)}
                      />
                      <input
                        type="text"
                        placeholder={`Member ${index + 2} Name`}
                        required
                        className="form-control"
                        style={{ flex: 1 }}
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}
              >
                {loading
                  ? 'Submitting...'
                  : (isPaid ? 'Submit & Proceed to Pay' : 'Complete Free Registration')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
