'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import styles from './page.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AxolotlPet from '@/components/AxolotlPet';
import { useT, useLanguage } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useLanguage();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [listCount, setListCount] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentProducts(products || []);

      const { count } = await supabase
        .from('shopping_list')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('user_id', user!.id);

      setListCount(count || 0);
      setProductsLoading(false);
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p className="body-md">{t.dash_loading}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="headline-lg">Price Check</h1>
            <h2 className="headline-md" style={{ marginTop: 'var(--spacing-sm)' }}>
              {t.dash_hello}, {profile?.username || 'there'} 👋
            </h2>
            <p className="body-md" style={{ color: 'var(--color-secondary)' }}>{t.dash_greeting}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                backgroundColor: 'transparent',
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                color: 'var(--color-primary)', fontWeight: 600,
                fontSize: '13px', border: '1px solid var(--color-primary)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span>
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            <button onClick={signOut} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              backgroundColor: 'transparent',
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              color: 'var(--color-secondary)', fontWeight: 600,
              fontSize: '13px', border: '1px solid var(--color-outline-variant)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
              {t.dash_signout}
            </button>
          </div>
        </div>
      </header>

      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <AxolotlPet variant="dashboard" />
      </section>

      <Link href="/leaderboard" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', marginBottom: 'var(--spacing-xl)',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e',
        borderRadius: 'var(--radius-xl)', fontWeight: 700, fontSize: '16px',
        textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
        border: '1px solid #fcd34d', transition: 'transform 0.15s'
      }}>
        {t.lb_view}
      </Link>

      <section className={styles.summaryCard}>
        <div className={styles.savingsInfo}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>shopping_basket</span>
          <span className="headline-md" style={{ color: 'var(--color-primary)' }}>{listCount}</span>
        </div>
        <p className="body-md">{t.dash_items_on_list}</p>
        <Link href="/list" style={{
          display: 'inline-block', marginTop: 'var(--spacing-sm)',
          color: 'var(--color-primary)', fontWeight: 600, fontSize: '14px'
        }}>
          {t.dash_view_list}
        </Link>
      </section>

      <section className={styles.section}>
        <h3 className="headline-sm">{t.dash_recent}</h3>
        {productsLoading ? (
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>{t.dash_loading}</p>
        ) : recentProducts.length === 0 ? (
          <div className={styles.emptyCard}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-outline-variant)' }}>inventory_2</span>
            <p className="body-md" style={{ color: 'var(--color-secondary)', marginTop: 'var(--spacing-sm)' }}>
              {t.dash_no_products} <Link href="/add" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t.dash_add_first}</Link>
            </p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {recentProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div>
                  <h4 className="body-lg" style={{ fontWeight: 600 }}>{product.name}</h4>
                  <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>{product.category || 'General'}</span>
                </div>
                <span className="label-caps" style={{ color: 'var(--color-outline)' }}>
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/feedback" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', marginTop: 'var(--spacing-md)',
        background: 'transparent', color: 'var(--color-secondary)',
        border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)',
        fontWeight: 600, fontSize: '14px', textDecoration: 'none'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
        {t.fb_link}
      </Link>
    </div>
  );
}
