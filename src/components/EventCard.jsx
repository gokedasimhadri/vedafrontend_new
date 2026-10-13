import React from 'react';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';

export default function EventCard({ event, onViewDetails, onRegister }) {
  // Normalize fee
  const feeAmount = event.fee?.amountPerUnit !== undefined
    ? event.fee.amountPerUnit
    : (event.fee?.amount !== undefined ? event.fee.amount / 100 : 0);

  const isFree = !event.fee || event.fee.type === 'FREE' || feeAmount === 0;
  const isFillingFast = event.capacity && (event.registrationCount / event.capacity) > 0.7;

  // Normalize banner image URL
  const bannerUrl = typeof event.banner === 'object' && event.banner?.url
    ? event.banner.url
    : (typeof event.banner === 'string' && event.banner ? event.banner : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80');

  const formatDate = (isoString) => {
    if (!isoString) return 'TBA';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'TBA';
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

  const getCategoryString = () => {
    if (typeof event.categoryName === 'string' && event.categoryName) return event.categoryName;
    if (typeof event.categoryName === 'object' && event.categoryName?.name) return event.categoryName.name;
    if (typeof event.organizer === 'string' && event.organizer) return event.organizer;
    if (typeof event.organizer === 'object' && event.organizer?.name) return event.organizer.name;
    return 'VEDA Technical';
  };

  const isSolo = event.participation?.type === 'INDIVIDUAL' || event.participation?.type === 'SINGLE';

  return (
    <div className="event-card">
      {/* Card Banner with Badges */}
      <div className="event-card-media">
        <img
          src={bannerUrl}
          alt={typeof event.title === 'string' ? event.title : 'Event'}
          className="event-card-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';
          }}
        />
        <div className="event-card-overlay">
          <div className="card-top-badges">
            <span className="badge-tag badge-veda">VEDA 2k26</span>
            {isFree ? (
              <span className="badge-tag badge-free">Free Entry</span>
            ) : (
              <span className="badge-tag badge-paid">₹{feeAmount} {event.fee?.chargeModel === 'PER_TEAM' ? '/ Team' : '/ Head'}</span>
            )}
          </div>

          <div className="card-bottom-info">
            <span style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
              {typeof event.mode === 'string' ? event.mode : 'OFFLINE'}
            </span>
            {isFillingFast && (
              <span style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-dot" style={{ background: '#ef4444' }}></span> Fast Filling
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="event-card-body">
        <div>
          <span className="event-dept-label">
            {getCategoryString()}
          </span>
          <h3 className="event-card-title">{typeof event.title === 'string' ? event.title : 'Event'}</h3>
        </div>

        {event.description && typeof event.description === 'string' && (
          <p className="event-card-desc">{event.description}</p>
        )}

        {/* Metadata List */}
        <div className="event-meta-list">
          <div className="event-meta-row">
            <Calendar size={15} color="#0284c7" />
            <span>{formatDate(event.schedule?.fromDate)}</span>
          </div>
          <div className="event-meta-row">
            <MapPin size={15} color="#0284c7" />
            <span>{getVenueString(event.venue)}</span>
          </div>
          <div className="event-meta-row">
            <Users size={15} color="#0284c7" />
            <span>
              {isSolo
                ? 'Individual / Solo'
                : (event.participation?.minTeamSize ? `Team: ${event.participation.minTeamSize}-${event.participation.maxTeamSize} Members` : 'Open Entry')}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="event-card-footer">
          <button
            onClick={() => onViewDetails(event)}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.86rem' }}
          >
            <span>Details</span>
            <ArrowUpRight size={15} />
          </button>

          <button
            onClick={() => onRegister(event)}
            className="btn-primary"
            style={{ padding: '9px 20px', fontSize: '0.88rem' }}
          >
            <span>Register</span>
          </button>
        </div>
      </div>
    </div>
  );
}
