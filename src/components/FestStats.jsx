import React from 'react';
import { Trophy, Code2, Users2, Building2 } from 'lucide-react';

export default function FestStats() {
  const stats = [
    {
      icon: <Trophy size={26} />,
      number: '₹ 5,00,000+',
      label: 'Cash Prize Pool & Grants',
      color: '#f59e0b'
    },
    {
      icon: <Code2 size={26} />,
      number: '25+ Events',
      label: 'Technical Tracks & Workshops',
      color: '#0284c7'
    },
    {
      icon: <Users2 size={26} />,
      number: '10,000+',
      label: 'Registered Innovators',
      color: '#10b981'
    },
    {
      icon: <Building2 size={26} />,
      number: '150+ Colleges',
      label: 'Participating Across India',
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="fest-stats-strip">
      <div className="veda-container">
        <div className="stats-grid">
          {stats.map((s, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon-wrap" style={{ color: s.color, background: `${s.color}15` }}>
                {s.icon}
              </div>
              <div>
                <div className="stat-number">{s.number}</div>
                <div className="stat-title">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
