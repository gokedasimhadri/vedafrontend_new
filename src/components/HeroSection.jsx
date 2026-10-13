import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Award, Users, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function HeroSection({ onExploreEvents, onRegisterClick, totalEventsCount }) {
  // Countdown to VEDA 2k26 Fest (e.g. March 12, 2026)
  const [timeLeft, setTimeLeft] = useState({ days: 24, hours: 14, minutes: 35, seconds: 12 });

  useEffect(() => {
    const festDate = new Date('2026-03-12T09:00:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = festDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="veda-hero">
      <div className="veda-container">
        <div className="hero-grid">
          {/* Left Hero Content */}
          <div className="hero-content">
            <div className="fest-badge">
              <span className="pulse-dot"></span>
              <span>National Level Technical & Innovation Fest</span>
            </div>

            <div>
              <h1 className="hero-title-veda">
                VEDA <span className="hero-title-year">2k26</span>
              </h1>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>
                Ignite Innovation • Code the Future • Transform Tomorrow
              </p>
            </div>

            <p className="hero-tagline">
              Join India's most prestigious annual collegiate technical festival at Aditya University.
              Compete in flagship Paper Presentations, 24-Hour Hackathons, Autonomous Robotics, and Project Expos with innovators across the nation.
            </p>

            {/* Countdown Box */}
            <div className="countdown-box">
              <div className="time-unit">
                <span className="time-val">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="time-label">Days</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-unit">
                <span className="time-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="time-label">Hours</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-unit">
                <span className="time-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="time-label">Mins</span>
              </div>
              <span className="time-sep">:</span>
              <div className="time-unit">
                <span className="time-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="time-label">Secs</span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
              <button onClick={onExploreEvents} className="btn-cyan">
                <Layers size={18} />
                <span>Explore Events ({totalEventsCount})</span>
              </button>
              <button onClick={onRegisterClick} className="btn-outline">
                <span>Direct Registration</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Hero Futuristic Tech Graphic matching user screenshot */}
          <div className="hero-art-wrapper">
            <svg className="hero-tech-svg" viewBox="0 0 600 450" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0b2240"/>
                  <stop offset="100%" stopColor="#0284c7"/>
                </linearGradient>
              </defs>

              {/* Central Glowing Cyber Grid Sphere */}
              <circle cx="360" cy="220" r="140" stroke="url(#grad1)" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6"/>
              <circle cx="360" cy="220" r="105" stroke="#0284c7" strokeWidth="1.5" opacity="0.4"/>
              <ellipse cx="360" cy="220" rx="140" ry="50" stroke="#00d4ff" strokeWidth="1.5" opacity="0.5"/>
              <ellipse cx="360" cy="220" rx="50" ry="140" stroke="#0284c7" strokeWidth="1.5" opacity="0.5"/>

              {/* Neural AI Core Chip */}
              <rect x="220" y="70" width="70" height="70" rx="12" fill="#0c1e3a" stroke="#00d4ff" strokeWidth="2.5"/>
              <text x="255" y="112" fill="#00d4ff" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="Space Grotesk">AI</text>
              {/* Chip Pins */}
              <path d="M235 60v10M255 60v10M275 60v10M235 140v10M255 140v10M275 140v10M210 85h10M210 105h10M210 125h10M290 85h10M290 105h10M290 125h10" stroke="#0284c7" strokeWidth="2"/>

              {/* Circuit Trace Lines & Nodes */}
              <path d="M120 180 L180 180 L220 120" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2"/>
              <circle cx="120" cy="180" r="5" fill="#00d4ff"/>
              
              <path d="M255 150 L255 240 L310 270" stroke="#38bdf8" strokeWidth="2"/>
              <circle cx="310" cy="270" r="6" fill="#f59e0b"/>

              {/* Robotic Arm Silhouette Motif */}
              <path d="M440 80 L480 130 L460 190 L520 220" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="440" cy="80" r="16" fill="#0b2240" stroke="#00d4ff" strokeWidth="3"/>
              <circle cx="480" cy="130" r="10" fill="#0284c7"/>
              <circle cx="460" cy="190" r="8" fill="#00d4ff"/>
              {/* Robotic Gripper */}
              <path d="M510 210 L530 220 L510 230" stroke="#00d4ff" strokeWidth="4" strokeLinecap="round"/>

              {/* Wind Turbine & Green Tech Motif */}
              <path d="M150 250 L150 360" stroke="#0b2240" strokeWidth="4"/>
              <path d="M150 250 L120 230 M150 250 L180 230 M150 250 L150 210" stroke="#0284c7" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="150" cy="250" r="7" fill="#10b981"/>

              {/* Solar Array Grid Icon */}
              <polygon points="100,340 180,340 160,370 80,370" fill="url(#grad2)" stroke="#38bdf8" strokeWidth="1.5"/>
              <line x1="140" y1="340" x2="120" y2="370" stroke="#38bdf8" strokeWidth="1"/>
              <line x1="90" y1="355" x2="170" y2="355" stroke="#38bdf8" strokeWidth="1"/>

              {/* University Campus Building Outline */}
              <rect x="240" y="320" width="220" height="60" rx="4" fill="none" stroke="#0b2240" strokeWidth="3"/>
              {/* Building Pillars */}
              <line x1="270" y1="335" x2="270" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              <line x1="300" y1="335" x2="300" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              <line x1="330" y1="335" x2="330" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              <line x1="360" y1="335" x2="360" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              <line x1="390" y1="335" x2="390" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              <line x1="420" y1="335" x2="420" y2="380" stroke="#0284c7" strokeWidth="2.5"/>
              {/* Building Pediment Triangle */}
              <polygon points="230,320 350,285 470,320" fill="none" stroke="#0b2240" strokeWidth="3"/>

              {/* Floating Orbiting Tech Badges */}
              <g transform="translate(480, 290)">
                <rect width="80" height="34" rx="17" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.1))"/>
                <circle cx="17" cy="17" r="10" fill="#10b981"/>
                <text x="46" y="22" fill="#0f172a" fontSize="11" fontWeight="bold">₹ 5L+ Pool</text>
              </g>

              <g transform="translate(80, 110)">
                <rect width="90" height="34" rx="17" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.1))"/>
                <circle cx="17" cy="17" r="10" fill="#0284c7"/>
                <text x="52" y="22" fill="#0f172a" fontSize="11" fontWeight="bold">IEEE Certs</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
