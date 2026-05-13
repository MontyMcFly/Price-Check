'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function Dashboard() {
  const [savings, setSavings] = useState(142.50);
  const [itemsOnList, setItemsOnList] = useState(3);
  const [bestSavings, setBestSavings] = useState<{ id: string; name: string; price: number }[]>([]);

  useEffect(() => {
    // In a real scenario, we would fetch data from Supabase here
    // supabase.from('products').select('*').then(...)
    
    // For now, using mock data mimicking the design
    setBestSavings([
      { id: '1', name: 'Sony WH-1000XM4', price: 298.00 },
      { id: '2', name: 'Apple Watch Series 8', price: 399.00 }
    ]);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className="headline-lg">Price Check</h1>
        <h2 className="headline-md" style={{ marginTop: 'var(--spacing-lg)' }}>Hello, Alex 👋</h2>
        <p className="body-lg" style={{ color: 'var(--color-secondary)' }}>Ready to find the best deals today?</p>
      </header>

      <section className={styles.summaryCard}>
        <div className={styles.savingsInfo}>
          <span className="price-display">${savings.toFixed(2)}</span>
          <span className="label-caps">Target</span>
        </div>
        <p className="body-md">{itemsOnList} items on list • Save $18</p>
      </section>

      <section className={styles.section}>
        <h3 className="headline-sm">Today's Best Savings</h3>
        <div className={styles.cardList}>
          {bestSavings.map(item => (
            <div key={item.id} className={styles.productCard}>
              <h4 className="body-lg" style={{ fontWeight: 600 }}>{item.name}</h4>
              <p className="price-display">${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className="headline-sm">Recently Watched</h3>
        <div className={styles.cardList}>
          <div className={styles.productCard}>
            <h4 className="body-lg" style={{ fontWeight: 600 }}>MacBook Air M2</h4>
          </div>
          <div className={styles.productCard}>
            <h4 className="body-lg" style={{ fontWeight: 600 }}>Breville Barista Express</h4>
          </div>
        </div>
      </section>
    </div>
  );
}
