import React from 'react';
import TeamSection from '../components/TeamSection';

export default function TeamPage({ categories = [], events = [], committeeMembers = [] }) {
  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg-main)' }}>
      <TeamSection categories={categories} events={events} committeeMembers={committeeMembers} />
    </div>
  );
}
