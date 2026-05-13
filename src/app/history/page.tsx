'use client';

import styles from '../add/page.module.css'; 

export default function History() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Savings History</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Review your past purchases and total savings.</p>
      </header>

      <div className={styles.formSection} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary-container)' }}>savings</span>
        <h3 className="headline-sm" style={{ marginTop: 'var(--spacing-md)' }}>No History Yet</h3>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Start checking off items from your smart list to build your history.</p>
      </div>
    </div>
  );
}
