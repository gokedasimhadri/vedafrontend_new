import React from 'react';
import { Calendar, Clock, MapPin, Award, Terminal, Cpu, Flame } from 'lucide-react';

export default function FestTimeline({ events = [] }) {
  // Format real events from backend if available
  const realEventsFormatted = events.filter(e => e.schedule?.fromDate).map(e => {
    const d = new Date(e.schedule.fromDate);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const venueStr = typeof e.venue === 'object' ? (e.venue?.name || e.venue?.address || 'Campus Venue') : (e.venue || 'Campus Venue');
    return {
      date: d.toDateString(),
      time: timeStr !== 'Invalid Date' ? timeStr : '10:00 AM',
      title: e.title || 'Technical Event',
      venue: venueStr,
      category: e.categoryName || 'Technical'
    };
  });

  const defaultScheduleDays = [
    {
      day: 'Day 1 - March 12, 2026',
      subtitle: 'Inauguration & Flagship Battles',
      events: [
        { time: '09:00 AM - 10:30 AM', title: 'Grand Inauguration Ceremony & Keynote by Tech Dignitaries', venue: 'K.L. Rao Central Auditorium' },
        { time: '11:00 AM - 04:30 PM', title: 'National Technical Paper Presentations (All Branches)', venue: 'Bill Gates & Cotton Bhavans' },
        { time: '11:30 AM (24-Hour Kickoff)', title: 'ByteHustle 24-Hour Hackathon Commences', venue: 'Central Library Digital Labs' },
        { time: '02:00 PM - 05:00 PM', title: 'Grand Project & Innovation Model Expo (Day 1)', venue: 'Indoor Stadium Arena' }
      ]
    },
    {
      day: 'Day 2 - March 13, 2026',
      subtitle: 'Finals, Robotics & Mega Valedictory',
      events: [
        { time: '09:30 AM - 01:30 PM', title: 'RoboQuest: Autonomous Maze & 15kg RoboWars Arena', venue: 'OAT Central Combat Arena' },
        { time: '10:00 AM - 01:00 PM', title: 'Generative AI & LLM Systems Masterclass', venue: 'Visvesvaraya Auditorium' },
        { time: '02:00 PM - 03:30 PM', title: 'BrainBusters Grand Live Stage Finale', venue: 'Aryabhata Hall' },
        { time: '04:30 PM - 07:00 PM', title: 'Grand Valedictory, ₹5 Lakhs Prize Distribution & Celebrity DJ Night', venue: 'Main University Grounds' }
      ]
    }
  ];

  // Merge real backend events into Day 1 schedule if present
  const scheduleDays = defaultScheduleDays.map((sched, idx) => {
    if (idx === 0 && realEventsFormatted.length > 0) {
      return {
        ...sched,
        events: [
          ...realEventsFormatted.map(re => ({
            time: re.time,
            title: `${re.title} (${re.category})`,
            venue: re.venue
          })),
          ...sched.events
        ]
      };
    }
    return sched;
  });

  return (
    <section id="schedule" style={{ padding: '80px 0', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="veda-container">
        <div className="section-header-wrap">
          <span className="section-badge">FEST SCHEDULE & AGENDA</span>
          <h2 className="section-main-title">Two Days of Pure Innovation</h2>
          <p className="section-subtext">Plan your itinerary across technical symposiums, hack sprints, and combat arenas.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
          {scheduleDays.map((sched, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '14px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>{sched.subtitle}</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginTop: '2px' }}>{sched.day}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {sched.events.map((ev, eIdx) => (
                  <div key={eIdx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', marginTop: '7px', flexShrink: 0 }}></div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', fontFamily: 'Space Grotesk' }}>{ev.time}</div>
                      <div style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-dark)' }}>{ev.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={12} /> {ev.venue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
