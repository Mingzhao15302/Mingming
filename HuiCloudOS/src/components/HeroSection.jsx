import React from 'react';

export default function HeroSection({ title, description, primaryAction, secondaryAction }) {
  return (
    <section
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 2rem',
        gap: '1.5rem',
        minHeight: '60vh'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 700 }}>{title}</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {primaryAction}
        {secondaryAction}
      </div>
    </section>
  );
}
