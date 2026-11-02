import React from 'react';
import { Calendar, Users, UserCheck, IndianRupee, ArrowRight, Cpu } from 'lucide-react';

export default function EventCard({ event, onViewDetails, onRegister }) {
  // Normalize fee
  const feeAmount = event.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event.fee?.amount !== undefined ? event.fee.amount / 100 : 0);

  const isFree = !event.fee || event.fee.type === 'FREE' || feeAmount === 0;

  // Normalize banner image URL
  const bannerUrl = typeof event.banner === 'object' && event.banner?.url
    ? event.banner.url
    : (typeof event.banner === 'string' && event.banner
      ? event.banner
      : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80');

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

  const teamsCount = event.registrationCount || 0;
  const minTeam = event.participation?.minTeamSize || (event.participation?.type === 'TEAM' ? 2 : 1);
  const participantsCount = teamsCount > 0 ? teamsCount * minTeam : 0;

  const titleString = typeof event.title === 'string' ? event.title : 'Event';
  const descString = typeof event.description === 'string' ? event.description : '';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(11, 34, 64, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = '#818cf8';
        e.currentTarget.style.boxShadow = '0 14px 32px rgba(99, 102, 241, 0.16)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(11, 34, 64, 0.06)';
      }}
      onClick={() => onViewDetails && onViewDetails(event)}
    >
      {/* Top Date Pill Badge (Matching Screenshot 1) */}
      <div style={{ paddingTop: '18px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#071830',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '6px 14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '0.8rem',
          fontWeight: '800',
          letterSpacing: '0.04em',
          boxShadow: '0 2px 6px rgba(7, 24, 48, 0.25)'
        }}>
          <Calendar size={15} color="#ffffff" />
          <span>{formatDateRange(event.schedule)}</span>
        </div>
      </div>

      {/* Circular Image Container with dashed blue border and chip icon (Matching Screenshot 1) */}
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
          {/* Dashed circular border ring */}
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: '2px dashed #0284c7',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.06) 0%, rgba(2, 132, 199, 0) 70%)'
          }}>
            <img
              src={bannerUrl}
              alt={titleString}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>

          {/* Blue Chip Badge at bottom-left */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#0284c7',
            border: '3px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)'
          }}>
            <Cpu size={19} color="#ffffff" />
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div style={{
        padding: '16px 20px 14px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexGrow: 1
      }}>
        {/* Title */}
        <h3 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.15rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          color: '#0b2240',
          lineHeight: 1.3,
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }} title={titleString}>
          {titleString}
        </h3>

        {/* Short Description */}
        <p style={{
          fontSize: '0.84rem',
          color: '#64748b',
          lineHeight: 1.45,
          margin: '0 0 12px',
          maxWidth: '280px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.5em'
        }}>
          {descString || `${titleString} - National Level Technical Event in VEDA 2k26.`}
        </p>

        {/* Gradient Underline Bar */}
        <div style={{
          width: '75%',
          height: '3px',
          background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 60%, rgba(241, 245, 249, 0.4) 100%)',
          borderRadius: '2px',
          marginBottom: '16px'
        }}></div>

        {/* 3 Circular Metrics: Teams, Participants, Fee (Matching Screenshot 1) */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 4px'
        }}>
          {/* Teams Stat */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} color="#7c3aed" />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Teams</span>
            <span style={{ fontSize: '0.98rem', color: '#7c3aed', fontWeight: '800' }}>
              {teamsCount}
            </span>
          </div>

          {/* Participants Stat */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={18} color="#0284c7" />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Participants</span>
            <span style={{ fontSize: '0.98rem', color: '#0284c7', fontWeight: '800' }}>
              {participantsCount}
            </span>
          </div>

          {/* Fee Stat */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e0f7fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IndianRupee size={18} color="#0284c7" />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Fee</span>
            <span style={{ fontSize: '0.98rem', color: '#0284c7', fontWeight: '800' }}>
              {isFree ? 'Free' : `₹${feeAmount}`}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Strip with "View Details" and "Register Now" Buttons */}
      <div style={{
        background: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails(event);
          }}
          style={{
            background: 'transparent',
            color: '#071830',
            padding: '7px 14px',
            borderRadius: '9999px',
            fontSize: '0.84rem',
            fontWeight: '700',
            border: '1.5px solid #cbd5e1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#0284c7';
            e.currentTarget.style.color = '#0284c7';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#071830';
          }}
        >
          <span>Details</span>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRegister && onRegister(event);
          }}
          style={{
            background: '#071830',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.86rem',
            fontWeight: '800',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(7, 24, 48, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#0284c7';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#071830';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>Register Now</span>
        </button>
      </div>
    </div>
  );
}
