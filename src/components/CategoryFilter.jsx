import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory, eventsCountByCategory }) {
  // Always include 'ALL' as the first option
  const allTabs = [
    { _id: 'ALL', code: 'ALL', name: 'All Categories' },
    ...categories
  ];

  return (
    <div className="category-tabs-scroll">
      {allTabs.map((cat) => {
        const isSelected = selectedCategory === cat.code || selectedCategory === cat._id;
        const count =
          cat.code === 'ALL'
            ? Object.values(eventsCountByCategory).reduce((a, b) => a + b, 0)
            : (eventsCountByCategory[cat._id] ?? eventsCountByCategory[cat.code] ?? eventsCountByCategory[cat.name] ?? 0);

        return (
          <button
            key={cat._id || cat.code}
            onClick={() => onSelectCategory(cat.code || cat._id)}
            className={`cat-tab-btn ${isSelected ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            <span>{cat.name}</span>
            {count > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(2, 132, 199, 0.1)',
                  color: isSelected ? '#ffffff' : '#0284c7',
                  fontWeight: '700'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
