'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { addReward } from '@/lib/gamification';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

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
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchList();
  }, [user]);

  async function fetchList() {
    setListLoading(true);
    const { data: listData, error: listError } = await supabase
      .from('shopping_list')
      .select(`id, quantity, product_id, products (id, name, category)`)
      .eq('status', 'pending')
      .eq('user_id', user!.id);

    if (listError) {
      console.error('Error fetching list:', listError);
      setListLoading(false);
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
        const prod = Array.isArray(item.products) ? item.products[0] : item.products;

        return {
          id: item.id,
          quantity: item.quantity,
          product: prod,
          bestPrice: bestPriceObj?.price || 0,
          bestStore: bestPriceObj?.stores ? (Array.isArray(bestPriceObj.stores) ? (bestPriceObj.stores[0] as any).name : (bestPriceObj.stores as any).name) : 'No price yet',
        } as ListItem;
      })
    );

    setItems(itemsWithPrices);
    setListLoading(false);
  }

  const handleRemove = async (id: string) => {
    // Instead of deleting, mark as purchased and award XP
    await supabase.from('shopping_list').update({ status: 'purchased' }).eq('id', id);
    if (user) {
      await addReward(user.id, 5, 2);
      await refreshProfile();
      // Optional: Add a local state for toast notification
      alert('+5 XP y +2 🪙 para tu Axolotl por completar un pendiente!');
    }
    setItems(items.filter(i => i.id !== id));
  };

  const totalEstimated = items.reduce((sum, item) => sum + (item.bestPrice * item.quantity), 0);

  if (loading) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">My List</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          {items.length} items{totalEstimated > 0 ? ` • Est. total: ` : ''}
          {totalEstimated > 0 && <strong className="price-display" style={{ fontSize: '18px' }}>${totalEstimated.toFixed(2)}</strong>}
        </p>
      </header>

      {listLoading ? (
        <p className="body-md">Loading your list...</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>shopping_cart</span>
          <p className="body-lg" style={{ marginTop: 'var(--spacing-md)' }}>Your list is empty.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Go to the Catalog and tap + to add products.</p>
        </div>
      ) : (
        <div className={styles.listGroup}>
          {items.map(item => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.itemHeader}>
                <h3 className="body-lg" style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown'}</h3>
                <button
                  onClick={() => handleRemove(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}
                  aria-label="Remove from list"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove_circle</span>
                </button>
              </div>
              <div className={styles.priceInfo}>
                <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>
                  {item.bestPrice > 0 ? `Best at ${item.bestStore}` : 'No price recorded yet'}
                </span>
                {item.bestPrice > 0 && <span className="price-display">${item.bestPrice.toFixed(2)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
