'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

interface PurchasedItem {
  id: string;
  quantity: number;
  product_id: string;
  final_price: number;
  store_name: string;
  purchased_at: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
}

interface DayGroup {
  date: string; // YYYY-MM-DD
  label: string; // Human readable
  items: PurchasedItem[];
  total: number;
}

export default function History() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('shopping_list')
      .select(`id, quantity, product_id, final_price, store_name, purchased_at, products (id, name, category)`)
      .eq('status', 'purchased')
      .eq('user_id', user!.id)
      .not('purchased_at', 'is', null)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      setHistoryLoading(false);
      return;
    }

    // Group by day
    const groupMap = new Map<string, PurchasedItem[]>();
    for (const item of (data || [])) {
      const prod = Array.isArray(item.products) ? item.products[0] : item.products;
      const dateKey = new Date(item.purchased_at).toISOString().split('T')[0];
      const parsed: PurchasedItem = {
        id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        final_price: item.final_price || 0,
        store_name: item.store_name || 'Desconocida',
        purchased_at: item.purchased_at,
        product: prod,
      };
      if (!groupMap.has(dateKey)) groupMap.set(dateKey, []);
      groupMap.get(dateKey)!.push(parsed);
    }

    const groups: DayGroup[] = Array.from(groupMap.entries()).map(([date, items]) => {
      const d = new Date(date + 'T12:00:00');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (date === today.toISOString().split('T')[0]) {
        label = 'Hoy';
      } else if (date === yesterday.toISOString().split('T')[0]) {
        label = 'Ayer';
      } else {
        label = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      }

      return {
        date,
        label,
        items,
        total: items.reduce((sum, it) => sum + (it.final_price * it.quantity), 0),
      };
    });

    setDayGroups(groups);
    setHistoryLoading(false);
  }

  const handleUpdatePrice = async (item: PurchasedItem) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) return;

    // Update the shopping_list record
    await supabase
      .from('shopping_list')
      .update({ final_price: newPrice })
      .eq('id', item.id);

    // Also update the price in the prices table if it exists
    const { data: priceRecord } = await supabase
      .from('prices')
      .select('id, stores!inner(name)')
      .eq('product_id', item.product_id)
      .limit(10);

    // Find matching store price and update it
    if (priceRecord) {
      for (const pr of priceRecord) {
        const storeName = Array.isArray(pr.stores) ? (pr.stores[0] as any).name : (pr.stores as any).name;
        if (storeName === item.store_name) {
          await supabase.from('prices').update({ price: newPrice, date_recorded: new Date().toISOString().split('T')[0] }).eq('id', pr.id);
          break;
        }
      }
    }

    setEditingItem(null);
    setEditPrice('');
    fetchHistory();
  };

  if (loading) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Historial</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          Registro de tus compras completadas.
        </p>
      </header>

      {historyLoading ? (
        <p className="body-md">Cargando historial...</p>
      ) : dayGroups.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>receipt_long</span>
          <p className="body-lg" style={{ marginTop: 'var(--spacing-md)' }}>Sin historial todavía.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Marca productos como comprados en tu lista para crear tu historial.</p>
        </div>
      ) : (
        <div className={styles.dayList}>
          {dayGroups.map(group => {
            const isExpanded = expandedDay === group.date;
            return (
              <div key={group.date} className={styles.dayCard}>
                <button
                  className={styles.dayHeader}
                  onClick={() => setExpandedDay(isExpanded ? null : group.date)}
                >
                  <div>
                    <h3 className="body-lg" style={{ fontWeight: 600, textTransform: 'capitalize' }}>{group.label}</h3>
                    <span className="label-sm" style={{ color: 'var(--color-secondary)' }}>{group.items.length} producto{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="price-display" style={{ color: 'var(--color-primary)' }}>${group.total.toFixed(2)}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className={styles.dayItems}>
                    {group.items.map(item => (
                      <div key={item.id} className={styles.historyItem}>
                        <div style={{ flex: 1 }}>
                          <p className="body-md" style={{ fontWeight: 600 }}>{item.product?.name || 'Desconocido'}</p>
                          <p className="label-sm" style={{ color: 'var(--color-secondary)' }}>
                            {item.store_name} • x{item.quantity}
                          </p>
                        </div>

                        {editingItem === item.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className={styles.priceInput}
                              step="0.01"
                              min="0"
                              autoFocus
                            />
                            <button onClick={() => handleUpdatePrice(item)} className={styles.confirmBtn}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                            </button>
                            <button onClick={() => { setEditingItem(null); setEditPrice(''); }} className={styles.cancelBtn}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="price-display">${item.final_price.toFixed(2)}</span>
                            <button
                              onClick={() => { setEditingItem(item.id); setEditPrice(item.final_price.toString()); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)', padding: '4px' }}
                              aria-label="Actualizar precio"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className={styles.dayTotal}>
                      <span className="label-caps">Total del día</span>
                      <span className="price-display" style={{ fontSize: '22px', color: 'var(--color-primary)' }}>${group.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
