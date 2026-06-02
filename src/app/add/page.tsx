'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import ProductPriceForm from '@/components/ProductPriceForm';
import styles from './page.module.css';
import { useT } from '@/lib/i18n';

export default function AddProduct() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">{t.add_title}</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          {t.add_subtitle}
        </p>
      </header>
      <ProductPriceForm />
    </div>
  );
}
