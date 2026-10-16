import React from 'react';
import HeroSection from '../components/HeroSection';
import CategoryCard from '../components/CategoryCard';
import EventCard from '../components/EventCard';
import { ArrowRight } from 'lucide-react';

export default function HomePage({
  events = [],
  categories = [],
  onNavigate,
  onSelectCategory,
  onViewDetails,
  onRegister
}) {
  // Compute event counts per category
  const eventsCountByCategory = events.reduce((acc, ev) => {
    if (ev.categoryId) acc[ev.categoryId] = (acc[ev.categoryId] || 0) + 1;
    if (ev.categoryCode) acc[ev.categoryCode] = (acc[ev.categoryCode] || 0) + 1;
    if (ev.categoryName) acc[ev.categoryName] = (acc[ev.categoryName] || 0) + 1;
    return acc;
  }, {});

  // Display all categories directly from backend central_event_categories
  const displayCategories = categories.length > 0 ? categories : [
    {
      _id: 'c1',
      name: 'ENGINEERING & DESIGN',
      code: 'ENGIDESIGN',
      banner: { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80' }
    }
  ];

  const featuredEvents = events.slice(0, 3);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <HeroSection
        onExploreEvents={() => onNavigate('events')}
        onRegisterClick={() => {
          if (events.length > 0) onRegister(events[0]);
          else onNavigate('events');
        }}
        totalEventsCount={events.length}
      />

      {/* Central Event Categories Section (Displaying live categories in clean cards) */}
      <section style={{ padding: '60px 0 40px' }}>
        <div className="veda-container">
          <div className="section-header-wrap" style={{ marginBottom: '36px' }}>
            <span className="section-badge">CENTRAL EVENT DOMAINS</span>
            <h2 className="section-main-title">Explore by Category</h2>
            <p className="section-subtext">
              Click on any domain to view all technical events, paper presentations, and competitions.
            </p>
          </div>

          {/* Centered Category Cards Flex/Grid (Never stretches full width) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '28px',
            marginBottom: '60px'
          }}>
            {displayCategories.map((cat, idx) => {
              const catEvents = events.filter(e => {
                const eCatId = e.categoryId?._id ? String(e.categoryId._id) : (e.categoryId ? String(e.categoryId) : '');
                const cId = cat._id ? String(cat._id) : '';
                if (eCatId && cId && eCatId === cId) return true;
                const eName = (e.categoryName || '').trim().toLowerCase();
                const cName = (cat.name || '').trim().toLowerCase();
                if (eName && cName && eName === cName) return true;
                return false;
              });
              const count = catEvents.length;
              return (
                <CategoryCard
                  key={cat._id || cat.code || idx}
                  category={cat}
                  eventCount={count}
                  onSelectCategory={(selected) => {
                    onSelectCategory(selected.code || selected._id || selected.name);
                    onNavigate('events');
                  }}
                />
              );
            })}
          </div>

          {/* Featured Events Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '16px'
          }}>
            <div>
              <span className="section-badge" style={{ marginBottom: '4px' }}>VEDA 2k26 SPOTLIGHT</span>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                color: '#0b2240',
                margin: 0
              }}>
                FEATURED EVENTS
              </h2>
            </div>
            <button
              onClick={() => onNavigate('events')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0284c7',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {featuredEvents.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '28px',
              paddingBottom: '40px'
            }}>
              {featuredEvents.map((event) => (
                <EventCard
                  key={event._id || event.slug}
                  event={event}
                  onViewDetails={onViewDetails}
                  onRegister={onRegister}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                Events added in Admin Portal will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
