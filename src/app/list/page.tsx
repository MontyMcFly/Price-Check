'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface ListItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    category: string;
  };
  bestPrice: number;
  bestStore: string;
}

export default function SmartList() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      const { data: listData, error: listError } = await supabase
        .from('shopping_list')
        .select(`
          id, 
          quantity, 
          product_id,
          products (id, name, category)
        `)
        .eq('status', 'pending');

      if (listError) {
        console.error('Error fetching list:', listError);
        setLoading(false);
        return;
      }

      const itemsWithPrices = await Promise.all(
        (listData || []).map(async (item) => {
          const { data: pricesData } = await supabase
            .from('prices')
            .select('price, stores(name)')
            .eq('product_id', item.product_id)
            .order('price', { ascending: true })
            .limit(1);

          const bestPriceObj = pricesData?.[0];
          
          return {
            id: item.id,
            quantity: item.quantity,
            product: Array.isArray(item.products) ? item.products[0] : item.products, // Type safety fallback
            bestPrice: bestPriceObj?.price || 0,
            bestStore: bestPriceObj?.stores ? (Array.isArray(bestPriceObj.stores) ? (bestPriceObj.stores[0] as any).name : (bestPriceObj.stores as any).name) : 'Unknown',
          } as ListItem;
        })
      );

      setItems(itemsWithPrices);
      setLoading(false);
    }

    fetchList();
  }, []);

  const totalEstimated = items.reduce((sum, item) => sum + (item.bestPrice * item.quantity), 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Smart List</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          {items.length} items • Estimated Total: <strong className="price-display" style={{fontSize: '18px'}}>${totalEstimated.toFixed(2)}</strong>
        </p>
      </header>

      {loading ? (
        <p className="body-md">Loading your list...</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>shopping_cart</span>
          <p className="body-lg" style={{ marginTop: 'var(--spacing-md)' }}>Your list is empty.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Add items to see price comparisons.</p>
        </div>
      ) : (
        <div className={styles.listGroup}>
          {items.map(item => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.itemHeader}>
                <h3 className="body-lg" style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown Product'}</h3>
                <span className={styles.quantity}>x{item.quantity}</span>
              </div>
              <div className={styles.priceInfo}>
                <span className="label-caps" style={{ color: 'var(--color-primary-container)' }}>Best Price at {item.bestStore}</span>
                <span className="price-display">${item.bestPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
