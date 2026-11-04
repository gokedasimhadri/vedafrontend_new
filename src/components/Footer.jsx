import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" style={{ background: '#07162c', color: '#f8fafc', padding: '60px 0 30px', borderTop: '1px solid #1e293b' }}>
      <div className="veda-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand & NAAC */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000' }}>AU</div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.05em' }}>ADITYA UNIVERSITY</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Aditya Nagar, ADB Road, Surampalem, Kakinada District, Andhra Pradesh, 533437.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0f274a', padding: '6px 12px', borderRadius: '6px', width: 'fit-content' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '800' }}>NAAC A++ ACCREDITED UNIVERSITY</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Quick Navigation</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#94a3b8' }}>
              <li><a href="#home" style={{ color: 'inherit', textDecoration: 'none' }}>VEDA 2k26 Home</a></li>
              <li><a href="#events" style={{ color: 'inherit', textDecoration: 'none' }}>All Technical Competitions</a></li>
              <li><a href="#schedule" style={{ color: 'inherit', textDecoration: 'none' }}>Two-Day Schedule</a></li>
              <li><a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Admin & Faculty Portal ↗</a></li>
            </ul>
          </div>

          {/* Contact & Helpdesk */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Fest Helpdesk</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="#38bdf8" /> veda2k26@aditya.ac.in
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="#38bdf8" /> +91 98480 12345 / 94401 98765
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={15} color="#38bdf8" /> www.adityauniversity.in
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          <div>Designed & Developed by <b>IT Applications</b></div>
        </div>
      </div>
    </footer>
  );
}
