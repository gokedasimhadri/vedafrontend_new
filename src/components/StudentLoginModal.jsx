import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, User, Sparkles } from 'lucide-react';
import { centralApi } from '../api/centralApi';

export default function StudentLoginModal({ isOpen, onClose, onLoginSuccess, initialEmail = '' }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  // Sign up fields
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [college, setCollege] = useState('Aditya University');
  const [otherCollege, setOtherCollege] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Male');

  if (!isOpen) return null;

  // Auto-fill student details via ECAP lookup when roll number changes
  const handleRollBlur = async () => {
    const cleanRoll = roll.trim().toUpperCase();
    if (cleanRoll.length >= 6 && college === 'Aditya University') {
      setLookupLoading(true);
      try {
        const studentInfo = await centralApi.lookupStudentByRoll(cleanRoll);
        if (studentInfo) {
          const sName = studentInfo.studentname || studentInfo.studentName || studentInfo.name;
          const sMobile = studentInfo.mobilenumber || studentInfo.mobileNumber || studentInfo.phone;
          if (sName && !name) setName(sName);
          if (sMobile && !mobile) setMobile(sMobile);
        }
      } catch (e) {
        // quiet fallback
      } finally {
        setLookupLoading(false);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both Email Address and Password');
      return;
    }

    setLoading(true);
    try {
      const res = await centralApi.studentLogin(email.trim(), password);
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

    if (!name.trim() || !roll.trim() || !email.trim() || !mobile.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        roll: roll.trim().toUpperCase(),
        college,
        otherCollege: college === 'Other' ? otherCollege.trim() : '',
        gender,
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim()
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
        setError(res.error || 'Sign up failed.');
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 24, 48, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
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
          padding: '42px 38px 36px',
          maxWidth: isSignUp ? '520px' : '440px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header (Matching User Screenshot) */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '1.9rem',
              fontWeight: '900',
              color: '#071830',
              margin: '0 0 8px',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            {isSignUp ? 'Student Sign Up' : 'Student Login'}
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.5,
              fontWeight: '500'
            }}
          >
            {isSignUp
              ? 'Create your account to register for events & view receipts'
              : 'Please log in to manage registrations and view receipts'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.86rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: '0.86rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp ? (
            /* Sign Up Fields */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Student Roll Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value.toUpperCase())}
                    onBlur={handleRollBlur}
                    placeholder="e.g. 24B11PT019"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.94rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                    onBlurCapture={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {lookupLoading && (
                    <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '14px', color: '#0284c7' }} />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.94rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    College *
                  </label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      background: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="Aditya University">Aditya University</option>
                    <option value="AEC">Aditya Engineering College (AEC)</option>
                    <option value="ACET">Aditya College of Engg & Tech</option>
                    <option value="Other">Other College</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.94rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {college === 'Other' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    College Name
                  </label>
                  <input
                    type="text"
                    value={otherCollege}
                    onChange={(e) => setOtherCollege(e.target.value)}
                    placeholder="Enter your college name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.94rem',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@adityauniversity.in"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.94rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.94rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Login Fields (Matching Screenshot Exactly) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@adityauniversity.in"
                  required
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
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
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
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
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Row (Matching User Screenshot) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '32px'
            }}
          >
            {/* Need to Sign Up? or Already have an account? */}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#071830',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {isSignUp ? 'Already have an account? Log In' : 'Need to Sign Up?'}
            </button>

            {/* Login / Sign Up Submit Button */}
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
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(7, 24, 48, 0.25)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#0284c7';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#071830';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
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
