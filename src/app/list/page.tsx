'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { addReward } from '@/lib/gamification';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

interface ListItem {
  id: string;
  quantity: number;
  product_id: string;
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
  const t = useT();
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
          product_id: item.product_id,
          product: prod,
          bestPrice: bestPriceObj?.price || 0,
          bestStore: bestPriceObj?.stores ? (Array.isArray(bestPriceObj.stores) ? (bestPriceObj.stores[0] as any).name : (bestPriceObj.stores as any).name) : '',
        } as ListItem;
      })
    );

    setItems(itemsWithPrices);
    setListLoading(false);
  }

  const handleRemoveFromList = async (id: string) => {
    if (!confirm(t.list_confirm_remove)) return;
    await supabase.from('shopping_list').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const handleMarkPurchased = async (item: ListItem) => {
    await supabase
      .from('shopping_list')
      .update({
        status: 'purchased',
        purchased_at: new Date().toISOString(),
        final_price: item.bestPrice,
        store_name: item.bestStore,
      })
      .eq('id', item.id);

    if (user) {
      await addReward(user.id, 5, 2);
      await refreshProfile();
    }
    setItems(items.filter(i => i.id !== item.id));
  };

  const totalEstimated = items.reduce((sum, item) => sum + (item.bestPrice * item.quantity), 0);

  if (loading) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">{t.list_title}</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          {items.length} {t.list_products}{totalEstimated > 0 ? ` • ${t.list_est_total} ` : ''}
          {totalEstimated > 0 && <strong className="price-display" style={{ fontSize: '18px' }}>${totalEstimated.toFixed(2)}</strong>}
        </p>
      </header>

      {listLoading ? (
        <p className="body-md">{t.list_loading}</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>shopping_cart</span>
          <p className="body-lg" style={{ marginTop: 'var(--spacing-md)' }}>{t.list_empty}</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>{t.list_empty_hint}</p>
        </div>
      ) : (
        <div className={styles.listGroup}>
          {items.map(item => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.itemHeader}>
                <h3 className="body-lg" style={{ fontWeight: 600 }}>{item.product?.name || t.history_unknown}</h3>
              </div>
              <div className={styles.priceInfo}>
                <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>
                  {item.bestPrice > 0 ? `${t.list_best_at} ${item.bestStore}` : t.list_no_price}
                </span>
                {item.bestPrice > 0 && <span className="price-display">${item.bestPrice.toFixed(2)}</span>}
              </div>
              <div className={styles.actionRow}>
                <button onClick={() => handleRemoveFromList(item.id)} className={styles.removeBtn} aria-label={t.list_remove}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  {t.list_remove}
                </button>
                <button onClick={() => handleMarkPurchased(item)} className={styles.purchasedBtn} aria-label={t.list_purchased}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  {t.list_purchased}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
