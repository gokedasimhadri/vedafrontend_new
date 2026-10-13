import React from 'react';
import FestTimeline from '../components/FestTimeline';

export default function SchedulePage({ events = [] }) {
  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg-main)' }}>
      <FestTimeline events={events} />
    </div>
  );
}
