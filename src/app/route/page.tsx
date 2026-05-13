'use client';

import styles from '../add/page.module.css'; // Reusing some container styles

export default function RouteOptimization() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Route Optimization</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Find the most efficient way to buy your list.</p>
      </header>

      <div className={styles.formSection} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary-container)' }}>map</span>
        <h3 className="headline-sm" style={{ marginTop: 'var(--spacing-md)' }}>Coming Soon</h3>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>We are building the smartest algorithm to save you gas and money.</p>
      </div>
    </div>
  );
}
