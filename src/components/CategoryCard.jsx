import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

const categoryDefaultImages = {
  ENGIDESIGN: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  ROBOTICS: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
  HACKATHONS: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  CSE: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  TPP: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  MGMT: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  SCI: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
};

export default function CategoryCard({ category, eventCount = 0, onSelectCategory }) {
  const codeUpper = (category.code || '').toUpperCase();
  const fallbackImg = categoryDefaultImages[codeUpper] || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';

  // Normalize banner URL
  let bannerUrl = typeof category.banner === 'object' && category.banner?.url
    ? category.banner.url
    : (typeof category.banner === 'string' && category.banner ? category.banner : fallbackImg);

  if (bannerUrl && !bannerUrl.startsWith('http') && !bannerUrl.startsWith('/')) {
    bannerUrl = '/' + bannerUrl;
  }

  // Live coordinator from Admin Portal
  const coordinatorName = category.coordinator?.name || (Array.isArray(category.coordinators) && category.coordinators[0]?.name) || null;
  const subcatsCount = Array.isArray(category.subcategories) ? category.subcategories.filter(s => s.isActive !== false).length : 0;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e0e7ff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
        maxWidth: '100%',
        margin: '0 auto',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = '#818cf8';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.16)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#e0e7ff';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.08)';
      }}
      onClick={() => onSelectCategory(category)}
    >
      {/* Top Banner Media */}
      <div style={{ padding: '18px 18px 0', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{
          width: '100%',
          height: '180px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#0b2240',
          position: 'relative'
        }}>
          <img
            src={bannerUrl}
            alt={category.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              e.target.src = fallbackImg;
            }}
          />

          {subcatsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(7, 24, 48, 0.85)',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '6px',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.04em'
            }}>
              {subcatsCount} Tracks
            </span>
          )}
        </div>
      </div>

      {/* Category Title with Purple Accent Underline (Matching Screenshot 2) */}
      <div style={{
        padding: '18px 16px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1
      }}>
        <h3 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.15rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          color: '#0b2240',
          lineHeight: 1.35,
          margin: '0 0 8px'
        }}>
          {category.name}
        </h3>

        {/* Purple gradient underline accent */}
        <div style={{
          width: '50px',
          height: '3px',
          background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 100%)',
          borderRadius: '2px',
          marginBottom: coordinatorName ? '10px' : '0'
        }}></div>

        {coordinatorName && (
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
            Lead: <strong style={{ color: '#0b2240' }}>{coordinatorName}</strong>
          </span>
        )}
      </div>

      {/* Bottom Footer Strip (Matching Screenshot 2) */}
      <div style={{
        background: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '800', color: '#0b2240' }}>
          <Calendar size={18} color="#8b5cf6" />
          <span>{eventCount} {eventCount === 1 ? 'Event' : 'Events'}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCategory(category);
          }}
          style={{
            background: '#071830',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '700',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(7, 24, 48, 0.25)'
          }}
        >
          <span>View Events</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
