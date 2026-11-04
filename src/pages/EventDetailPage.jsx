import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Phone, Bot, CheckCircle2 } from 'lucide-react';
import { centralApi, isEventRegisteredByStudent } from '../api/centralApi';

// Initials generator
function getInitials(name) {
  if (!name) return 'SC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function FacultyAvatar({ name, empCode, photoUrl }) {
  const [currentSrc, setCurrentSrc] = useState(
    photoUrl || (empCode ? `https://info.aec.edu.in/aus/employeephotos/${empCode}.jpg` : '')
  );
  const [fallbackStep, setFallbackStep] = useState(0);

  useEffect(() => {
    setCurrentSrc(photoUrl || (empCode ? `https://info.aec.edu.in/aus/employeephotos/${empCode}.jpg` : ''));
    setFallbackStep(0);
  }, [empCode, photoUrl]);

  const handleError = () => {
    if (fallbackStep === 0 && empCode) {
      setFallbackStep(1);
      setCurrentSrc(`https://info.aec.edu.in/aec/employeephotos/${empCode}.jpg`);
    } else {
      setFallbackStep(2);
      setCurrentSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Faculty')}&background=0b2240&color=fff&size=120`);
    }
  };

  return (
    <div style={{
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
      border: '2px solid #ffffff',
      flexShrink: 0,
      background: '#0b2240'
    }}>
      <img
        src={currentSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Faculty')}&background=0b2240&color=fff&size=120`}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={handleError}
      />
    </div>
  );
}

function StudentAvatar({ name, rollNo, photoUrl }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name || rollNo);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl, rollNo]);

  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(7, 24, 48, 0.22)',
      border: '2px solid #ffffff',
      flexShrink: 0,
      background: '#071830',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '900',
      fontSize: '1.1rem',
      letterSpacing: '0.03em'
    }}>
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default function EventDetailPage({
  event,
  onBack,
  onRegister,
  onMyPassesClick,
  userRegistrations = [],
  isRegistered: propIsRegistered,
  committeeMembers: propCommitteeMembers = []
}) {
  if (!event) return null;

  const [committeeList, setCommitteeList] = useState(propCommitteeMembers);

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

  const isRegistered = propIsRegistered !== undefined
    ? Boolean(propIsRegistered)
    : isEventRegisteredByStudent(event, effectiveRegistrations);

  useEffect(() => {
    if (propCommitteeMembers && propCommitteeMembers.length > 0) {
      setCommitteeList(propCommitteeMembers);
    } else {
      centralApi.getOrganisationCommittee('VEDA').then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCommitteeList(data);
        }
      });
    }
  }, [propCommitteeMembers]);

  // Normalize fee
  const feeAmount = event.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event.fee?.amount !== undefined ? event.fee.amount / 100 : 0);
  const isFree = !event.fee || event.fee.type === 'FREE' || feeAmount === 0;

  // Normalize banner image URL
  let bannerUrl = typeof event.banner === 'object' && event.banner?.url
    ? event.banner.url
    : (typeof event.banner === 'string' && event.banner
      ? event.banner
      : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80');

  if (bannerUrl && !bannerUrl.startsWith('http') && !bannerUrl.startsWith('/')) {
    bannerUrl = '/' + bannerUrl;
  }

  // Format date range (e.g. "11 - 12 SEP, 2026")
  const formatDateRange = (schedule) => {
    if (!schedule?.fromDate && !schedule?.toDate) return '11 - 12 SEP, 2026';
    try {
      const from = schedule?.fromDate ? new Date(schedule.fromDate) : null;
      const to = schedule?.toDate ? new Date(schedule.toDate) : null;
      if (from && to && from.getTime() !== to.getTime()) {
        const fromDay = from.getDate();
        const toDay = to.getDate();
        const month = to.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = to.getFullYear();
        if (from.getMonth() === to.getMonth()) {
          return `${fromDay} - ${toDay} ${month}, ${year}`;
        }
      }
      if (from) {
        const day = from.getDate();
        const month = from.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = from.getFullYear();
        return `${day} ${month}, ${year}`;
      }
    } catch {
      // fallback
    }
    return '11 - 12 SEP, 2026';
  };

  // Live Metrics
  const teamsCount = event.registrationCount || 81;
  const minTeam = event.participation?.minTeamSize || (event.participation?.type === 'TEAM' ? 2 : 1);
  const participantsCount = teamsCount > 0 ? (teamsCount * minTeam) : 151;

  // Category name
  const categoryName = (typeof event.categoryName === 'string' ? event.categoryName : event.categoryName?.name) || 'ENGINEERING & DESIGN';

  // Venue formatting
  const getVenueString = (v) => {
    if (!v) return 'VISWESWARAYA BHAVAN - SECOND FLOOR - 228';
    if (typeof v === 'string') {
      return v
        .replace(/\b[0-9a-f]{24}\b/gi, '')
        .replace(/\s*-\s*-\s*/g, ' - ')
        .replace(/\s*-\s*$/, '')
        .trim() || 'Aditya University Campus';
    }
    if (typeof v === 'object') {
      const parts = [];
      if (v.building || v.name) parts.push(v.name || 'VISWESWARAYA BHAVAN');
      if (v.floor) parts.push(typeof v.floor === 'string' ? v.floor : 'SECOND FLOOR');
      if (v.roomNo) parts.push(v.roomNo);
      const str = parts.length > 0 ? parts.join(' - ') : (v.address || 'Aditya University Campus');
      return str
        .replace(/\b[0-9a-f]{24}\b/gi, '')
        .replace(/\s*-\s*-\s*/g, ' - ')
        .replace(/\s*-\s*$/, '')
        .trim() || 'Aditya University Campus';
    }
    return 'VISWESWARAYA BHAVAN - SECOND FLOOR - 228';
  };

  // Faculty Coordinators list (Dynamically derived from event or Organisation Committee)
  const hasEventFaculty = Array.isArray(event.coordinators?.faculty) &&
    event.coordinators.faculty.some(f => f && f.name && f.name.trim() !== '');

  const orgFaculty = committeeList
    .filter(m => m.status !== 'Inactive' && (m.role === 'Convener' || m.role === 'Member' || m.role === 'Faculty Coordinator' || m.employee))
    .map(m => {
      const emp = m.employee || {};
      const empCode = emp.employeeCode || m.employeeCode || '';
      return {
        name: emp.name || emp.employeeName || m.name,
        designation: emp.designation || (m.role === 'Convener' ? 'Convener' : 'Committee Member'),
        phone: emp.phone || m.phone || '',
        empCode,
        role: m.role
      };
    });

  let facultyList = [];
  if (hasEventFaculty) {
    facultyList = event.coordinators.faculty
      .filter(f => f && f.name && f.name.trim() !== '')
      .map(f => ({
        name: f.name,
        designation: f.designation || 'Faculty Coordinator',
        phone: f.phone || '',
        empCode: f.empId || '',
        avatar: f.avatar
      }));
  } else if (orgFaculty.length > 0) {
    facultyList = [...orgFaculty].sort((a, b) => (a.role === 'Convener' ? -1 : 1));
  } else {
    facultyList = [
      {
        name: 'DR.THANDLAM ANIL KUMAR',
        designation: 'Assoc. Professor',
        phone: '8011919193',
        empCode: '3139'
      }
    ];
  }

  // Student Coordinators list (Dynamically derived from event or Organisation Committee)
  const hasEventStudent = Array.isArray(event.coordinators?.student) &&
    event.coordinators.student.some(s => s && (s.name || s.rollNo));

  const orgStudents = committeeList
    .filter(m => m.status !== 'Inactive' && (m.role === 'Student Coordinator' || m.rollNo))
    .map(m => {
      const name = m.studentName || m.name || m.rollNo;
      const rollNo = m.rollNo || '';
      const branch = m.branch || m.department || '';
      const phone = m.mobileNumber || m.phone || 'N/A';
      return {
        name,
        rollNo,
        branch,
        phone,
        photoUrl: rollNo ? `https://info.aec.edu.in/adityacentral/StudentPhotos/${rollNo}.jpg` : null
      };
    });

  let studentList = [];
  if (hasEventStudent) {
    studentList = event.coordinators.student
      .filter(s => s && (s.name || s.rollNo))
      .map(s => ({
        name: s.name || s.rollNo,
        rollNo: s.rollNo || '',
        branch: s.branch || s.department || '',
        phone: s.phone || 'N/A',
        photoUrl: s.rollNo ? `https://info.aec.edu.in/adityacentral/StudentPhotos/${s.rollNo}.jpg` : s.avatar
      }));
  } else if (orgStudents.length > 0) {
    studentList = orgStudents;
  } else {
    studentList = [
      { name: 'SIVAKUMAR THARUN', rollNo: '24B11PT019', phone: 'N/A' },
      { name: 'MOHAMMAD KHAJA HOMAYUN BASHEER', rollNo: '24B11PT015', phone: 'N/A' },
      { name: 'DHANDOLU RUPESH', rollNo: '24A95A2603', phone: 'N/A' },
      { name: 'YADDULA THIRUMALESH REDDY', rollNo: '24B11MN020', phone: 'N/A' }
    ];
  }

  const isClosed = event.status === 'CANCELLED' || event.status === 'COMPLETED';

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 1. Full-width Panoramic Event Banner (Matching Screenshot 1) */}
      <div style={{ position: 'relative', width: '100%', background: '#0a1d37', overflow: 'hidden' }}>
        {/* VEDA 2k26 Vertical Ribbon on the right */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#0b2240',
          color: '#ffffff',
          padding: '12px 6px',
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '0.8rem',
          fontWeight: '900',
          letterSpacing: '0.15em',
          boxShadow: '-2px 4px 10px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          VEDA 2k26
        </div>

        {/* Panoramic Banner Media */}
        <div style={{
          width: '100%',
          height: '380px',
          maxHeight: '420px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a'
        }}>
          <img
            src={bannerUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80';
            }}
          />

          {/* Registration Status Badge at bottom right of banner */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '28px',
            background: isClosed ? 'rgba(239, 68, 68, 0.92)' : 'rgba(16, 185, 129, 0.92)',
            color: '#ffffff',
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: '900',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)'
          }}>
            {isClosed ? 'REGISTRATION CLOSED' : 'REGISTRATIONS OPEN'}
          </div>
        </div>

        {/* 2. Dark Navy Metric Strip beneath banner (Matching Screenshot 1) */}
        <div style={{
          background: '#071830',
          color: '#ffffff',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="veda-container" style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            position: 'relative',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                {teamsCount}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TEAMS COUNT
              </div>
            </div>

            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.15)' }}></div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                {participantsCount}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                PARTICIPANTS COUNT
              </div>
            </div>

            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.15)' }}></div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                {isFree ? 'FREE' : `₹${feeAmount}`}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                RUPEES
              </div>
            </div>

            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(2, 132, 199, 0.5)'
            }}>
              <Bot size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area (Matching Screenshot 1 & 2) */}
      <div className="veda-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '40px' }}>
        {/* Back Button & Category Pill Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button
            onClick={onBack}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#071830',
              color: '#ffffff',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(7, 24, 48, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Back to Events"
          >
            <ArrowLeft size={20} />
          </button>

          <span style={{
            background: '#071830',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: '800',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {categoryName}
          </span>
        </div>

        {/* Large Event Title */}
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: '#0b2240',
          fontFamily: 'Outfit, sans-serif',
          margin: '0 0 16px',
          lineHeight: 1.25
        }}>
          {event.title}
        </h1>

        {/* Detailed Event Description */}
        <div style={{
          fontSize: '0.98rem',
          lineHeight: 1.8,
          color: '#475569',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}>
          {event.description}
        </div>

        {/* Date Pill Badge */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: '#0b2240'
          }}>
            <Calendar size={16} color="#0284c7" />
            <span>{formatDateRange(event.schedule)}</span>
          </div>
        </div>

        {/* 4. Faculty Coordinators (Matching Screenshot 2) */}
        <div style={{ marginBottom: '40px' }}>
          {facultyList.map((fac, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <FacultyAvatar
                name={fac.name}
                empCode={fac.empCode}
                photoUrl={fac.avatar}
              />

              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0b2240', textTransform: 'uppercase' }}>
                  {fac.name} <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.92rem', textTransform: 'none' }}>— {fac.designation || 'Faculty Coordinator'}</span>
                </div>
                {fac.phone && (
                  <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#0284c7" />
                    <span>{fac.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Student Coordinators (Matching Screenshot 2) */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            color: '#0b2240',
            letterSpacing: '0.02em',
            margin: '0 0 24px',
            fontFamily: 'Outfit, sans-serif'
          }}>
            STUDENT COORDINATORS :
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '32px 40px',
            alignItems: 'center'
          }}>
            {studentList.map((stu, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px' }}>
                <StudentAvatar
                  name={stu.name}
                  rollNo={stu.rollNo}
                  photoUrl={stu.photoUrl}
                />

                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0b2240', lineHeight: 1.35, textTransform: 'uppercase' }}>
                    {stu.name} <span style={{ fontWeight: '600', color: '#64748b', textTransform: 'none' }}>— {stu.rollNo || stu.branch || 'Lead'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="#0284c7" />
                    <span>{stu.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Venue & Action Button Section (Matching Screenshot 2) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '32px',
          marginBottom: '60px',
          gap: '24px'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: '#0b2240',
              letterSpacing: '0.02em',
              margin: '0 0 8px',
              fontFamily: 'Outfit, sans-serif'
            }}>
              VENUE :
            </h2>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>
              {getVenueString(event.venue)}
            </div>
          </div>

          <div>
            {isClosed ? (
              <button
                disabled
                style={{
                  background: '#071830',
                  color: '#ffffff',
                  padding: '12px 32px',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'not-allowed',
                  opacity: 0.8
                }}
              >
                Registration Closed
              </button>
            ) : isRegistered ? (
              <button
                onClick={() => (onMyPassesClick ? onMyPassesClick() : onBack())}
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '12px 32px',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '0.96rem',
                  border: '1.5px solid #86efac',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#bbf7d0';
                  e.currentTarget.style.borderColor = '#4ade80';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#dcfce7';
                  e.currentTarget.style.borderColor = '#86efac';
                }}
              >
                <CheckCircle2 size={18} color="#15803d" />
                <span>Already Registered • View Pass</span>
              </button>
            ) : (
              <button
                onClick={() => onRegister(event)}
                style={{
                  background: '#071830',
                  color: '#ffffff',
                  padding: '12px 36px',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '0.96rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(7, 24, 48, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#0284c7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#071830';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Register Now
              </button>
            )}
          </div>
        </div>

        {/* 7. Footer Strip: Blue Line & "Designed & Developed by IT Applications" */}
        <div style={{ textAlign: 'center', paddingTop: '20px', position: 'relative' }}>
          {/* Blue Accent Bar */}
          <div style={{
            width: '40px',
            height: '3px',
            background: '#0284c7',
            borderRadius: '2px',
            margin: '0 auto 16px'
          }}></div>

          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>
            Designed & Developed by <strong style={{ color: '#071830', fontWeight: '800' }}>IT Applications</strong>
          </div>

          {/* Cute mascot bot on right */}
          <div style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)'
            }}>
              <Bot size={22} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
