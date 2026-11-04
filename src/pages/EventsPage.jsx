import React, { useState, useEffect } from 'react';
import CategoryCard from '../components/CategoryCard';
import EventCard from '../components/EventCard';
import { Search, RefreshCw, ArrowLeft, Bot, Calendar } from 'lucide-react';

// Helper function to accurately match backend Central Events to their Category
const isEventInCategory = (event, category) => {
  if (!event || !category) return false;

  // 1. Match by Category ID (_id)
  const eventCatId = event.categoryId?._id
    ? String(event.categoryId._id)
    : (event.categoryId ? String(event.categoryId) : '');
  const catId = category._id ? String(category._id) : '';
  if (eventCatId && catId && eventCatId === catId) return true;

  // 2. Match by Category Name (case-insensitive & trimmed)
  const eventCatName = (typeof event.categoryName === 'string'
    ? event.categoryName
    : (event.categoryName?.name || '')).trim().toLowerCase();
  const catName = (category.name || '').trim().toLowerCase();
  if (eventCatName && catName && eventCatName === catName) return true;

  // 3. Match by Category Code (case-insensitive & trimmed)
  const eventCatCode = (event.categoryCode || '').trim().toUpperCase();
  const catCode = (category.code || '').trim().toUpperCase();
  if (eventCatCode && catCode && eventCatCode === catCode) return true;

  return false;
};

export default function EventsPage({
  events = [],
  categories = [],
  selectedCategory = null,
  setSelectedCategory,
  userRegistrations = [],
  onRefresh,
  onViewDetails,
  onRegister,
  onMyPassesClick
}) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveCategory(selectedCategory);
    setSelectedSubcategory('ALL');
  }, [selectedCategory]);

  const displayCategories = categories;

  // Real live metrics dynamically calculated from backend events
  const totalBackendRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
  const liveTeamsCount = totalBackendRegistrations;
  const liveParticipantsCount = events.reduce(
    (sum, e) => sum + ((e.registrationCount || 0) * (e.participation?.minTeamSize || 1)),
    0
  );

  // If a category is selected (Level 2: Category Detail & Sub-Events View)
  const activeCatObj = activeCategory
    ? displayCategories.find(c =>
        c.code === activeCategory ||
        c._id === activeCategory ||
        c.name?.trim().toLowerCase() === String(activeCategory).trim().toLowerCase()
      )
    : null;

  // Real backend events strictly for this selected category
  const realCategoryEvents = activeCatObj
    ? events.filter(ev => isEventInCategory(ev, activeCatObj))
    : [];

  const filteredSubEvents = realCategoryEvents.filter(ev => {
    const matchesSearch = !searchQuery.trim() ||
      (typeof ev.title === 'string' && ev.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (typeof ev.description === 'string' && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubcategory = selectedSubcategory === 'ALL' ||
      ev.subcategoryId === selectedSubcategory ||
      ev.subcategoryCode === selectedSubcategory;

    return matchesSearch && matchesSubcategory;
  });

  const activeSubcats = Array.isArray(activeCatObj?.subcategories)
    ? activeCatObj.subcategories.filter(s => s.isActive !== false)
    : [];

  const totalCategoryEventsCount = realCategoryEvents.length;
  const totalCategoryTeamsCount = realCategoryEvents.reduce((acc, e) => acc + (e.registrationCount || 0), 0);
  const totalCategoryParticipantsCount = realCategoryEvents.reduce(
    (acc, e) => acc + ((e.registrationCount || 0) * (e.participation?.minTeamSize || 1)),
    0
  );

  let bannerUrl = typeof activeCatObj?.banner === 'object' && activeCatObj.banner?.url
    ? activeCatObj.banner.url
    : (typeof activeCatObj?.banner === 'string' && activeCatObj.banner
      ? activeCatObj.banner
      : 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80');

  if (bannerUrl && !bannerUrl.startsWith('http') && !bannerUrl.startsWith('/')) {
    bannerUrl = '/' + bannerUrl;
  }

  // =========================================================================
  // VIEW 2: INSIDE CATEGORY SUB-EVENTS VIEW
  // =========================================================================
  if (activeCatObj) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '100px' }}>
        {/* Full-width Category Banner */}
        <div style={{ position: 'relative', width: '100%', background: '#0a1d37', overflow: 'hidden' }}>
          {/* Right Edge Ribbon */}
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

          {/* Back to All Events Categories button */}
          <button
            onClick={() => {
              setActiveCategory(null);
              if (setSelectedCategory) setSelectedCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              zIndex: 20,
              background: 'rgba(11, 34, 64, 0.9)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to All Categories</span>
          </button>

          {/* Category Graphic Banner */}
          <div style={{
            width: '100%',
            height: '380px',
            maxHeight: '420px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 100%)'
          }}>
            <img
              src={bannerUrl}
              alt={activeCatObj.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';
              }}
            />
          </div>

          {/* Dark Navy Metric Strip Underneath */}
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
              position: 'relative'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                  {totalCategoryEventsCount}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  EVENTS
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.15)' }}></div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                  {totalCategoryTeamsCount}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  TEAMS COUNT
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.15)' }}></div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                  {totalCategoryParticipantsCount}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  PARTICIPANTS COUNT
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

        {/* Sub-Events List */}
        <div className="veda-container" style={{ paddingTop: '50px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '36px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '16px',
            gap: '16px'
          }}>
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#0b2240',
              margin: 0,
              fontFamily: 'Outfit, sans-serif'
            }}>
              {activeCatObj.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="form-control"
                  style={{ paddingLeft: '38px', borderRadius: '9999px', fontSize: '0.88rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="btn-outline"
                  style={{ borderRadius: '9999px', padding: '8px 16px', fontSize: '0.84rem' }}
                  title="Sync from Admin Portal"
                >
                  <RefreshCw size={14} />
                  <span>Sync Live</span>
                </button>
              )}
            </div>
          </div>

          {/* Subcategories Filter Tabs */}
          {activeSubcats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
              <button
                onClick={() => setSelectedSubcategory('ALL')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  border: selectedSubcategory === 'ALL' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: selectedSubcategory === 'ALL' ? '#0284c7' : '#ffffff',
                  color: selectedSubcategory === 'ALL' ? '#ffffff' : '#0b2240',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                All Activities ({realCategoryEvents.length})
              </button>
              {activeSubcats.map((sub) => (
                <button
                  key={sub._id || sub.code}
                  onClick={() => setSelectedSubcategory(sub.code || sub._id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '999px',
                    border: (selectedSubcategory === sub.code || selectedSubcategory === sub._id) ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: (selectedSubcategory === sub.code || selectedSubcategory === sub._id) ? '#0284c7' : '#ffffff',
                    color: (selectedSubcategory === sub.code || selectedSubcategory === sub._id) ? '#ffffff' : '#0b2240',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Real Events Grid or Empty State */}
          {filteredSubEvents.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '32px'
            }}>
              {filteredSubEvents.map((event) => (
                <EventCard
                  key={event._id || event.slug}
                  event={event}
                  userRegistrations={userRegistrations}
                  onViewDetails={onViewDetails}
                  onRegister={onRegister}
                  onMyPassesClick={onMyPassesClick}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '70px 24px',
              background: '#f8fafc',
              borderRadius: '24px',
              border: '1.5px dashed #cbd5e1',
              maxWidth: '640px',
              margin: '30px auto'
            }}>
              <Calendar size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0b2240', marginBottom: '8px' }}>
                No Events Available
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
                There are currently no events registered under <strong>{activeCatObj.name}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: FIRST EVENTS LANDING VIEW (EXPLORE EVENTS)
  // =========================================================================
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="veda-container">
        {/* Main Title: EXPLORE EVENTS with Live Sync */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '6px 16px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '800', marginBottom: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>LIVE DATA FROM CENTRAL EVENTS ADMIN PORTAL</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 0 0 6px' }}
                title="Refresh Live Data"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#071830',
            margin: '0 auto',
            fontFamily: 'Outfit, sans-serif'
          }}>
            EXPLORE EVENTS
          </h1>
        </div>

        {/* Dynamic Metric Pill Bar strictly reflecting backend data */}
        <div style={{
          maxWidth: '820px',
          margin: '0 auto 50px',
          background: '#071830',
          borderRadius: '24px',
          padding: '24px 40px',
          boxShadow: '0 8px 30px rgba(7, 24, 48, 0.25)',
          color: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: 1.1 }}>
                {liveTeamsCount}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                TEAMS COUNT
              </div>
            </div>

            <div style={{ width: '1.5px', height: '48px', background: 'rgba(255, 255, 255, 0.2)' }}></div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: 1.1 }}>
                {liveParticipantsCount}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                PARTICIPANTS COUNT
              </div>
            </div>
          </div>
        </div>

        {/* Category Cards Grid (Live Categories with real event counts) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}>
          {displayCategories.map((cat, idx) => {
            const catEvents = events.filter(e => isEventInCategory(e, cat));
            const count = catEvents.length;
            return (
              <CategoryCard
                key={cat._id || cat.code || idx}
                category={cat}
                eventCount={count}
                onSelectCategory={(selected) => {
                  setActiveCategory(selected.code || selected._id || selected.name);
                  if (setSelectedCategory) setSelectedCategory(selected.code || selected._id || selected.name);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
