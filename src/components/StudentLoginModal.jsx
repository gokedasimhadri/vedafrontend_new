import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, User, Sparkles, Building, Phone, Mail, Lock, ShieldCheck } from 'lucide-react';
import { centralApi } from '../api/centralApi';

export default function StudentLoginModal({ isOpen, onClose, onLoginSuccess, initialEmail = '', defaultMode = 'signup' }) {
  // Mode toggle: true = Student Registration / Sign Up, false = Student Login
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [autoPopulatedMsg, setAutoPopulatedMsg] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form states
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form states
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('Aditya University');
  const [otherCollege, setOtherCollege] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [year, setYear] = useState('');

  // Reset or clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setAutoPopulatedMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-fill student details via Aditya ECAP API lookup
  const autoPopulateFromRoll = async (rollNo) => {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    if (cleanRoll.length < 5) return;

    setLookupLoading(true);
    setAutoPopulatedMsg('');
    try {
      const studentData = await centralApi.lookupStudentByRoll(cleanRoll);
      if (studentData && (studentData.name || studentData.studentname || studentData.rollno)) {
        const sName = studentData.name || studentData.studentname || '';
        const sMobile = studentData.mobile || studentData.mobilenumber || '';
        const sEmail = studentData.email || studentData.emailid || `${cleanRoll.toLowerCase()}@adityauniversity.in`;
        let sBranch = studentData.branch || '';
        const sGender = studentData.gender || '';
        const sSem = studentData.semester || studentData.semestername || '';

        // Normalize branch code: e.g. MEC -> MECH, CIV -> CIVIL, INF -> IT
        if (sBranch.toUpperCase() === 'MEC') sBranch = 'MECH';
        else if (sBranch.toUpperCase() === 'CIV') sBranch = 'CIVIL';
        else if (sBranch.toUpperCase() === 'INF') sBranch = 'IT';

        if (sName) setName(sName);
        if (sMobile) setMobile(String(sMobile).replace(/\D/g, '').slice(-10));
        if (sEmail) setEmail(sEmail.toLowerCase());
        if (sBranch) setBranch(sBranch.toUpperCase());

        // Gender mapping (Male / Female / Other)
        if (sGender) {
          const g = String(sGender).trim().toLowerCase();
          if (g.startsWith('f')) setGender('Female');
          else if (g.startsWith('m')) setGender('Male');
          else setGender('Other');
        }

        // College mapping based on roll number code or college name
        if (cleanRoll.includes('A9')) {
          setCollege('AEC');
        } else if (cleanRoll.includes('P3')) {
          setCollege('ACET');
        } else if (cleanRoll.includes('MH') || cleanRoll.includes('B1') || cleanRoll.includes('PT') || cleanRoll.includes('AU')) {
          setCollege('Aditya University');
        } else if (studentData.college || studentData.collegename) {
          const col = String(studentData.college || studentData.collegename).toLowerCase();
          if (col.includes('aec') || col.includes('aditya engineering college')) {
            setCollege('AEC');
          } else if (col.includes('acet') || col.includes('technology')) {
            setCollege('ACET');
          } else if (col.includes('university') || col.includes('aditya')) {
            setCollege('Aditya University');
          } else {
            setCollege('Other');
            setOtherCollege(studentData.college || studentData.collegename);
          }
        }

        // Year of study mapping (1st Year, 2nd Year, 3rd Year, 4th Year)
        let detectedYear = '';
        const semUpper = sSem.toUpperCase();
        if (semUpper.includes('VII') || semUpper.includes('VIII') || semUpper.includes('4/4') || semUpper.includes('4TH') || semUpper.includes('7') || semUpper.includes('8')) {
          detectedYear = '4th Year';
        } else if (semUpper.includes('V') || semUpper.includes('VI') || semUpper.includes('3/4') || semUpper.includes('3RD') || semUpper.includes('5') || semUpper.includes('6')) {
          detectedYear = '3rd Year';
        } else if (semUpper.includes('III') || semUpper.includes('IV') || semUpper.includes('2/4') || semUpper.includes('2ND') || semUpper.includes('3') || semUpper.includes('4')) {
          detectedYear = '2nd Year';
        } else if (semUpper.includes('I') || semUpper.includes('II') || semUpper.includes('1/4') || semUpper.includes('1ST') || semUpper.includes('1') || semUpper.includes('2')) {
          detectedYear = '1st Year';
        } else if (studentData.batch || studentData.joinedbatch) {
          const b = parseInt(studentData.batch || studentData.joinedbatch, 10);
          if (b <= 2023) detectedYear = '4th Year';
          else if (b === 2024) detectedYear = '3rd Year';
          else if (b === 2025) detectedYear = '2nd Year';
          else if (b >= 2026) detectedYear = '1st Year';
        }
        if (detectedYear) setYear(detectedYear);

        const yearLabel = detectedYear ? `, ${detectedYear}` : '';
        const branchLabel = sBranch ? ` (${sBranch.toUpperCase()}${yearLabel})` : '';
        setAutoPopulatedMsg(`✓ Profile auto-populated for ${sName || cleanRoll}${branchLabel}`);
        setError('');
      } else {
        if (cleanRoll.length >= 8) {
          setAutoPopulatedMsg('ℹ Roll not found in ECAP. You can enter details manually.');
        }
      }
    } catch (err) {
      console.warn('Auto-populate lookup error:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRollChange = (val) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setRoll(cleaned);
    setAutoPopulatedMsg('');

    // Trigger auto-population with debounce
    if (cleaned.length >= 6) {
      clearTimeout(window._vedaLoginRollLookupTimer);
      const delay = cleaned.length >= 10 ? 300 : 500;
      window._vedaLoginRollLookupTimer = setTimeout(() => {
        autoPopulateFromRoll(cleaned);
      }, delay);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both Email Address and Password');
      return;
    }

    setLoading(true);
    try {
      const res = await centralApi.studentLogin(loginEmail.trim(), loginPassword);
      if (res.success && res.student) {
        localStorage.setItem('veda_student', JSON.stringify(res.student));
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.student);
          onClose();
        }, 600);
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Account not found or wrong password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const cleanRoll = roll.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const cleanBranch = branch.trim();

    if (!cleanRoll || !cleanName || !cleanBranch || !cleanEmail || !college || !gender || !cleanMobile || !password || !year) {
      setError('Please fill in all required fields.');
      return;
    }

    if (cleanRoll.length < 4) {
      setError('Roll Number must contain at least 4 alphanumeric characters.');
      return;
    }

    if (cleanName.length < 2) {
      setError('Full Name must contain at least 2 letters.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanMobile.length !== 10) {
      setError(`Mobile Number must be exactly 10 digits (${cleanMobile.length}/10 entered).`);
      return;
    }

    if (!/^[6-9]/.test(cleanMobile)) {
      setError('Mobile Number must start with 6, 7, 8, or 9.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: cleanName,
        roll: cleanRoll,
        branch: cleanBranch,
        college,
        otherCollege: college === 'Other' ? otherCollege.trim() : '',
        gender,
        mobile: cleanMobile,
        email: cleanEmail,
        password: password.trim(),
        year
      };

      const res = await centralApi.studentRegister(payload);
      if (res.success && res.student) {
        localStorage.setItem('veda_student', JSON.stringify(res.student));
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.student);
          onClose();
        }, 700);
      } else {
        setError(res.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.92rem',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '15px',
    paddingRight: '38px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '5px'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 24, 48, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: isSignUp ? '30px 36px 26px' : '36px 36px 30px',
          maxWidth: isSignUp ? '740px' : '430px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'background 0.2s ease',
            zIndex: 10
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          title="Close"
        >
          <X size={17} />
        </button>

        {/* Modal Header (Exact User Screenshot Typography) */}
        <div style={{ textAlign: 'center', marginBottom: '18px', padding: '0 8px' }}>
          <h2
            style={{
              fontSize: isSignUp ? '1.85rem' : '1.75rem',
              fontWeight: '900',
              color: '#071830',
              margin: '0 0 6px',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            {isSignUp ? 'Student Registration' : 'Student Login'}
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748b',
              margin: '0 auto',
              maxWidth: '560px',
              lineHeight: 1.5,
              fontWeight: '500'
            }}
          >
            {isSignUp
              ? 'Create your profile seamlessly using the Sign Up/Login link at the top right, and get ready to participate in an array of technical and non-technical events.'
              : 'Please enter your registered Email Address and Password to log in and manage your event passes.'}
          </p>

          {/* Auto-populate notification pill */}
          {autoPopulatedMsg && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginTop: '8px',
                border: '1px solid #bbf7d0'
              }}
            >
              <CheckCircle2 size={14} />
              <span>{autoPopulatedMsg}</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.84rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: '0.84rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp ? (
            /* ========================================================== */
            /* STUDENT REGISTRATION / SIGN UP FORM (BALANCED 2-COL GRID)  */
            /* ========================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Roll Number | Full Name */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Roll Number</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={roll}
                      onChange={(e) => handleRollChange(e.target.value)}
                      onBlur={() => roll.length >= 5 && autoPopulateFromRoll(roll)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          autoPopulateFromRoll(roll);
                        }
                      }}
                      placeholder="Enter Roll Number (e.g. 19A91A0341)"
                      required
                      style={{
                        ...inputStyle,
                        paddingRight: lookupLoading ? '40px' : (roll.length >= 6 ? '78px' : '14px')
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlurCapture={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {lookupLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ position: 'absolute', right: '12px', color: '#0284c7' }}
                      />
                    ) : (
                      roll.length >= 6 && (
                        <button
                          type="button"
                          onClick={() => autoPopulateFromRoll(roll)}
                          style={{
                            position: 'absolute',
                            right: '6px',
                            background: '#eff6ff',
                            color: '#0284c7',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = '#dbeafe')}
                          onMouseOut={(e) => (e.currentTarget.style.background = '#eff6ff')}
                          title="Click to fetch student details from ECAP"
                        >
                          <Sparkles size={12} />
                          Fetch
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Branch | Email Address */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value.toUpperCase())}
                    placeholder="e.g. CSE, ECE, MECH"
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@adityauniversity.in"
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Row 3: College | Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>College</label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    style={selectStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>Choose...</option>
                    <option value="Aditya University">Aditya University</option>
                    <option value="AEC">Aditya Engineering College (AEC)</option>
                    <option value="ACET">Aditya College of Engineering & Technology (ACET)</option>
                    <option value="Other">Other College</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    style={selectStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Optional: If College is Other */}
              {college === 'Other' && (
                <div>
                  <label style={labelStyle}>Other College Name</label>
                  <input
                    type="text"
                    value={otherCollege}
                    onChange={(e) => setOtherCollege(e.target.value)}
                    placeholder="Enter your college or institution name"
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Row 4: Year of Study | Mobile Number */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Year of Study</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    style={selectStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      required
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Password | Confirm Password (Clean Symmetrical Pairing) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      style={{
                        ...inputStyle,
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                      style={{
                        ...inputStyle,
                        paddingRight: '40px',
                        borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : '#e2e8f0'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#ef4444' : '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span style={{ fontSize: '0.76rem', color: '#ef4444', fontWeight: '600', marginTop: '3px', display: 'block' }}>
                      Passwords do not match
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* STUDENT LOGIN FORM                                         */
            /* ========================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Email Address or Roll Number</label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. 24B11PT019 or student@adityauniversity.in"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{
                      ...inputStyle,
                      paddingRight: '40px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Row (Exact User Screenshot Style) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '22px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            {/* Toggle Link: Already Signed Up? Login OR Need to Sign Up? */}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMsg('');
                setAutoPopulatedMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#071830',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'none',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {isSignUp ? 'Already Signed Up? Login' : 'Need to Sign Up? Register'}
            </button>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#071830',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '11px 36px',
                fontWeight: '800',
                fontSize: '0.94rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(7, 24, 48, 0.22)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#0284c7';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.35)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#071830';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(7, 24, 48, 0.22)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Logging in...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Sign Up' : 'Login'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
