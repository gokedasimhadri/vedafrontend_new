import React from 'react';
import { Mail, Phone, Award, UserCheck, ShieldCheck } from 'lucide-react';

export default function TeamSection({ categories = [], events = [] }) {
  // Extract ALL category coordinators dynamically from backend categories (supports multiple coordinators per category)
  const categoryCoordinators = [];
  categories.forEach(cat => {
    if (Array.isArray(cat.coordinators) && cat.coordinators.length > 0) {
      cat.coordinators.forEach(coord => {
        if (coord && coord.name) {
          categoryCoordinators.push({
            name: coord.name,
            empId: coord.empId || '',
            designation: coord.designation || 'Faculty Coordinator',
            department: coord.department || '',
            role: `${cat.name} Coordinator`,
            email: coord.email || 'coordinator@adityauniversity.in',
            phone: coord.phone || '+91 98480 12345',
            category: cat.name
          });
        }
      });
    } else if (cat.coordinator && cat.coordinator.name) {
      categoryCoordinators.push({
        name: cat.coordinator.name,
        empId: cat.coordinator.empId || '',
        designation: cat.coordinator.designation || 'Faculty Coordinator',
        department: cat.coordinator.department || '',
        role: `${cat.name} Coordinator`,
        email: cat.coordinator.email || 'coordinator@adityauniversity.in',
        phone: cat.coordinator.phone || '+91 98480 12345',
        category: cat.name
      });
    }
  });

  // Extract any event coordinators from live events
  events.forEach(ev => {
    if (Array.isArray(ev.coordinators?.faculty)) {
      ev.coordinators.faculty.forEach(f => {
        if (f && f.name && !categoryCoordinators.some(c => c.name === f.name)) {
          categoryCoordinators.push({
            name: f.name,
            empId: f.empId || '',
            designation: 'Event Faculty Lead',
            department: '',
            role: `${ev.title || 'Event'} Lead`,
            email: f.email || 'events@adityauniversity.in',
            phone: f.phone || '+91 98480 12345',
            category: ev.categoryName || 'Technical'
          });
        }
      });
    }
  });

  const leadershipTeam = [
    {
      name: 'Dr. N. Sesha Reddy',
      role: 'Chief Patron',
      designation: 'Chairman, Aditya University',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Dr. N. Suguna Reddy',
      role: 'Patron',
      designation: 'Secretary, Aditya University',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Dr. M. Sreenivasa Reddy',
      role: 'General Convener',
      designation: 'Principal & Dean - Academics',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const studentCoordinators = [
    { name: 'K. V. Sai Tharun', dept: 'CSE (AI & ML)', role: 'Student President', phone: '+91 91234 56780', email: 'saitharun@gmail.com' },
    { name: 'P. Ananya Sharma', dept: 'IT', role: 'Hackathon Lead', phone: '+91 98765 01234', email: 'ananya.s@gmail.com' },
    { name: 'M. Rakesh Varma', dept: 'Robotics & Mech', role: 'Robotics Lead', phone: '+91 98491 23987', email: 'rakesh.v@gmail.com' },
    { name: 'T. Haritha Reddy', dept: 'ECE', role: 'Event Operations Lead', phone: '+91 97012 34567', email: 'haritha.r@gmail.com' }
  ];

  return (
    <section id="team" style={{ padding: '80px 0', background: 'var(--bg-main)' }}>
      <div className="veda-container">
        <div className="section-header-wrap">
          <span className="section-badge">ORGANIZING COMMITTEE</span>
          <h2 className="section-main-title">The Minds Behind VEDA 2k26</h2>
          <p className="section-subtext">
            Dedicated faculty conveners, domain coordinators, and student leaders driving innovation.
          </p>
        </div>

        {/* Leadership & Patron Section */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', color: '#0284c7', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Patrons & Fest Conveners
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {leadershipTeam.map((leader, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #0b2240 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}>
                  {leader.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{leader.role}</div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>{leader.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{leader.designation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Backend Category Coordinators (e.g. GOKEDA SIMHADRI) */}
        {categoryCoordinators.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', color: '#10b981', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Central Category Coordinators (Live from Backend)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {categoryCoordinators.map((coord, idx) => (
                <div key={idx} style={{ background: 'var(--bg-card)', border: '1.5px solid #10b981', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)', display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.3rem', flexShrink: 0 }}>
                    {coord.name ? coord.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '999px', fontWeight: '700' }}>
                      {coord.category}
                    </span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>{coord.name}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{coord.designation} {coord.empId ? `(${coord.empId})` : ''}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '0.82rem', color: '#0284c7' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {coord.phone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {coord.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Organizing Leads */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', color: '#f59e0b', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Core Team
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {studentCoordinators.map((st, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' }}>{st.role}</div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>{st.name}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Dept of {st.dept}</p>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} color="#0284c7" /> {st.phone}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color="#0284c7" /> {st.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
