import React, { useState } from 'react';
import { Sparkles, Camera, Image as ImageIcon } from 'lucide-react';

export default function GallerySection() {
  const [filter, setFilter] = useState('ALL');

  const galleryItems = [
    { title: 'Grand Fest Inauguration Ceremony', category: 'CEREMONY', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' },
    { title: '24-Hour Code Sprint Hackathon', category: 'HACKATHON', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Autonomous RoboWars Combat Ring', category: 'ROBOTICS', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80' },
    { title: 'National Level Paper Presentations', category: 'ACADEMICS', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
    { title: 'Hardware & IoT Model Exhibition', category: 'EXPO', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80' },
    { title: 'Mega Valedictory & Cash Prize Distribution', category: 'CEREMONY', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80' }
  ];

  const filteredItems = filter === 'ALL' ? galleryItems : galleryItems.filter(item => item.category === filter);

  return (
    <section id="gallery" style={{ padding: '80px 0', background: 'var(--bg-card)' }}>
      <div className="veda-container">
        <div className="section-header-wrap">
          <span className="section-badge">MEMORIES & HIGHLIGHTS</span>
          <h2 className="section-main-title">Fest Moments Gallery</h2>
          <p className="section-subtext">Relive the high-voltage energy and innovations from previous editions of VEDA.</p>
        </div>

        {/* Gallery Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {['ALL', 'CEREMONY', 'HACKATHON', 'ROBOTICS', 'EXPO'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`cat-tab-btn ${filter === f ? 'active' : ''}`}
            >
              <Camera size={14} />
              <span>{f === 'ALL' ? 'All Highlights' : f}</span>
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '240px',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer'
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 40%, rgba(7, 22, 44, 0.9) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    {item.category}
                  </span>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', marginTop: '4px' }}>{item.title}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
