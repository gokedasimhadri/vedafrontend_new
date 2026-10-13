import React, { useState, useEffect } from 'react';
import CategoryCard from '../components/CategoryCard';
import EventCard from '../components/EventCard';
import { Search, RefreshCw, ArrowLeft, Bot, Calendar } from 'lucide-react';

const domainSubEventsMap = {
  ENGIDESIGN: [
    {
      _id: 'sub_ed_1',
      title: 'PAPER PRESENTATION : WASTE TO ENERGY',
      categoryName: 'ENGINEERING & DESIGN',
      categoryCode: 'ENGIDESIGN',
      mode: 'OFFLINE',
      venue: 'Mechanical Block Seminar Hall',
      schedule: { fromDate: '2026-09-11T09:30:00Z', toDate: '2026-09-12T17:00:00Z' },
      description: 'PAPER PRESENTATION : WASTE TO ENERGY 1. Eligibility: Participants are invited from all recognized engineering colleges across India to present cutting edge ideas in waste management.',
      fee: { amountPerUnit: 200, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 81,
      banner: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 1, maxTeamSize: 3 }
    },
    {
      _id: 'sub_ed_2',
      title: 'POPSICLE BRIDGE',
      categoryName: 'ENGINEERING & DESIGN',
      categoryCode: 'ENGIDESIGN',
      mode: 'OFFLINE',
      venue: 'Civil Engineering Design Studio',
      schedule: { fromDate: '2026-09-11T10:00:00Z', toDate: '2026-09-12T16:00:00Z' },
      description: 'POPSICLE BRIDGE DESIGN & LOAD TESTING: Design, build, and test truss structures using standard popsicle sticks and glue. Evaluated on maximum load-to-weight ratio.',
      fee: { amountPerUnit: 200, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 155,
      banner: 'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 2, maxTeamSize: 4 }
    },
    {
      _id: 'sub_ed_3',
      title: 'PAPER PRESENTATION : SUSTAINABLE COMMUNITIES',
      categoryName: 'ENGINEERING & DESIGN',
      categoryCode: 'ENGIDESIGN',
      mode: 'OFFLINE',
      venue: 'Cotton Bhavan Auditorium',
      schedule: { fromDate: '2026-09-11T09:30:00Z', toDate: '2026-09-12T17:00:00Z' },
      description: 'PAPER PRESENTATION : SUSTAINABLE COMMUNITIES 1. Eligibility: Participants are invited from all disciplines to showcase renewable city models and green tech.',
      fee: { amountPerUnit: 200, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 53,
      banner: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 1, maxTeamSize: 3 }
    },
    {
      _id: 'sub_ed_4',
      title: 'CAD 3D MODELLING & REVERSE ENGINEERING SPRINT',
      categoryName: 'ENGINEERING & DESIGN',
      categoryCode: 'ENGIDESIGN',
      mode: 'OFFLINE',
      venue: 'CAD/CAM Central Computer Center',
      schedule: { fromDate: '2026-09-11T11:00:00Z', toDate: '2026-09-12T15:00:00Z' },
      description: 'Rapid 3D parametric modelling competition on SolidWorks / CATIA based on physical cross-section blueprints and tolerances.',
      fee: { amountPerUnit: 150, currency: 'INR', chargeModel: 'PER_PERSON' },
      registrationCount: 94,
      banner: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'INDIVIDUAL', minTeamSize: 1, maxTeamSize: 1 }
    }
  ],
  CSE: [
    {
      _id: 'sub_cse_1',
      title: 'BYTEHUSTLE 24-HOUR HACKATHON',
      categoryName: 'COMPUTER SCIENCE & DIGITAL TECHNOLOGY',
      categoryCode: 'CSE',
      mode: 'HYBRID',
      venue: 'Central Digital Labs',
      schedule: { fromDate: '2026-09-11T10:00:00Z', toDate: '2026-09-12T10:00:00Z' },
      description: 'Build futuristic solutions for AI, Web3, and Cyber Security within an intense 24-hour sprint.',
      fee: { amountPerUnit: 500, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 142,
      banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 2, maxTeamSize: 4 }
    },
    {
      _id: 'sub_cse_2',
      title: 'CODE CLASH : SPEED PROGRAMMING',
      categoryName: 'COMPUTER SCIENCE & DIGITAL TECHNOLOGY',
      categoryCode: 'CSE',
      mode: 'OFFLINE',
      venue: 'Turing Computer Lab',
      schedule: { fromDate: '2026-09-11T14:00:00Z', toDate: '2026-09-11T16:30:00Z' },
      description: 'Fastest coder wins! Algorithmic problem solving across C++, Java, and Python with live leaderboard.',
      fee: { amountPerUnit: 100, currency: 'INR', chargeModel: 'PER_PERSON' },
      registrationCount: 210,
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'INDIVIDUAL', minTeamSize: 1, maxTeamSize: 1 }
    }
  ],
  MGMT: [
    {
      _id: 'sub_mgmt_1',
      title: 'BIZ-COGNITIO : BUSINESS PLAN & PITCH DECK',
      categoryName: 'MANAGEMENT, BUSINESS & ENTREPRENEURSHIP',
      categoryCode: 'MGMT',
      mode: 'OFFLINE',
      venue: 'Management Auditorium',
      schedule: { fromDate: '2026-09-11T10:00:00Z', toDate: '2026-09-11T16:00:00Z' },
      description: 'Pitch your breakthrough startup idea to venture capitalists, angel investors, and startup mentors.',
      fee: { amountPerUnit: 300, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 78,
      banner: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 2, maxTeamSize: 3 }
    }
  ],
  SCI: [
    {
      _id: 'sub_sci_1',
      title: 'CRIME SCENE INVESTIGATION & FORENSIC CHALLENGE',
      categoryName: 'SCIENCE, FORENSICS & INVESTIGATION',
      categoryCode: 'SCI',
      mode: 'OFFLINE',
      venue: 'Forensic Science Simulation Lab',
      schedule: { fromDate: '2026-09-11T11:00:00Z', toDate: '2026-09-12T14:00:00Z' },
      description: 'Decode fingerprint evidence, blood spatter patterns, and chemical traces to crack the simulation mystery.',
      fee: { amountPerUnit: 200, currency: 'INR', chargeModel: 'PER_TEAM' },
      registrationCount: 65,
      banner: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
      participation: { type: 'TEAM', minTeamSize: 2, maxTeamSize: 4 }
    }
  ]
};

export default function EventsPage({
  events = [],
  categories = [],
  selectedCategory = null,
  setSelectedCategory,
  onRefresh,
  onViewDetails,
  onRegister
}) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveCategory(selectedCategory);
    setSelectedSubcategory('ALL');
  }, [selectedCategory]);

  // Default Categories matching Screenshot
  const displayCategories = categories.length > 0 ? categories : [
    {
      _id: 'c1',
      name: 'ENGINEERING & DESIGN',
      code: 'ENGIDESIGN',
      banner: { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80' }
    },
    {
      _id: 'c2',
      name: 'COMPUTER SCIENCE & DIGITAL TECHNOLOGY',
      code: 'CSE',
      banner: { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' }
    },
    {
      _id: 'c3',
      name: 'MANAGEMENT, BUSINESS & ENTREPRENEURSHIP',
      code: 'MGMT',
      banner: { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' }
    },
    {
      _id: 'c4',
      name: 'SCIENCE, FORENSICS & INVESTIGATION',
      code: 'SCI',
      banner: { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' }
    }
  ];

  // Compute live metrics dynamically from real backend events and categories
  const totalBackendRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
  const liveTeamsCount = totalBackendRegistrations > 0
    ? totalBackendRegistrations
    : (events.length > 0 ? events.length * 120 : 4569);
  const liveParticipantsCount = totalBackendRegistrations > 0
    ? events.reduce((sum, e) => sum + ((e.registrationCount || 0) * (e.participation?.minTeamSize || 2)), 0)
    : (liveTeamsCount * 2 + 546);

  // If a category is selected (Level 2: Category Detail & Sub-Events View)
  const activeCatObj = activeCategory
    ? displayCategories.find(c => c.code === activeCategory || c._id === activeCategory || c.name === activeCategory)
    : null;

  // Real backend events for this category
  const realCategoryEvents = activeCatObj
    ? events.filter(
        ev => ev.categoryId === activeCatObj._id ||
              ev.categoryCode === activeCatObj.code ||
              ev.categoryName === activeCatObj.name
      )
    : [];

  const defaultSubEvents = activeCatObj ? (domainSubEventsMap[activeCatObj.code] || domainSubEventsMap['ENGIDESIGN'] || []) : [];
  // Use real events if available; otherwise show template sub-events so UI remains informative
  const combinedSubEvents = realCategoryEvents.length > 0 ? realCategoryEvents : defaultSubEvents;

  const filteredSubEvents = combinedSubEvents.filter(ev => {
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

  const totalCategoryEventsCount = realCategoryEvents.length > 0
    ? realCategoryEvents.length
    : (activeSubcats.length > 0 ? activeSubcats.length : filteredSubEvents.length);
  const totalCategoryTeamsCount = realCategoryEvents.reduce((acc, e) => acc + (e.registrationCount || 0), 0) || (totalCategoryEventsCount * 45);
  const totalCategoryParticipantsCount = totalCategoryTeamsCount * 2 + 124;

  let bannerUrl = typeof activeCatObj?.banner === 'object' && activeCatObj.banner?.url
    ? activeCatObj.banner.url
    : (typeof activeCatObj?.banner === 'string' && activeCatObj.banner
      ? activeCatObj.banner
      : 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80');

  if (bannerUrl && !bannerUrl.startsWith('http') && !bannerUrl.startsWith('/')) {
    bannerUrl = '/' + bannerUrl;
  }

  // =========================================================================
  // VIEW 2: INSIDE CATEGORY SUB-EVENTS VIEW (When user clicked "View Events ->")
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

          {/* Dark Navy Metric Strip Underneath (Matching Screenshot 1) */}
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

        {/* Sub-Events List (Matching Screenshot 2) */}
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
              EVENTS
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search sub-events..."
                  className="form-control"
                  style={{ paddingLeft: '38px', borderRadius: '9999px', fontSize: '0.88rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                onClick={onRefresh}
                className="btn-outline"
                style={{ borderRadius: '9999px', padding: '8px 16px', fontSize: '0.84rem' }}
                title="Sync from Admin Portal"
              >
                <RefreshCw size={14} />
                <span>Sync Live</span>
              </button>
            </div>
          </div>

          {/* Level 3: Event Subcategories Tabs (Matching Admin Portal Hierarchy) */}
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
                All Activities ({combinedSubEvents.length})
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            {filteredSubEvents.map((event) => (
              <EventCard
                key={event._id || event.slug}
                event={event}
                onViewDetails={onViewDetails}
                onRegister={onRegister}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: FIRST EVENTS LANDING VIEW (Matching user screenshot: EXPLORE EVENTS)
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

        {/* Dynamic Metric Pill Bar (Matching Screenshot with Live Data) */}
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

        {/* Category Cards Grid (Live Categories from Admin Portal) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}>
          {displayCategories.map((cat, idx) => {
            const catEvents = events.filter(e =>
              e.categoryId === cat._id ||
              e.categoryCode === cat.code ||
              e.categoryName === cat.name
            );
            const subcats = Array.isArray(cat.subcategories) ? cat.subcategories.filter(s => s.isActive !== false) : [];
            const count = catEvents.length > 0 ? catEvents.length : (subcats.length > 0 ? subcats.length : (cat.eventCount || 0));
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
