'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import ProductPriceForm from '@/components/ProductPriceForm';
import styles from './page.module.css';

export default function AddProduct() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Registrar Precio</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          Agrega un producto y el precio que encontraste.
        </p>
      </header>
      <ProductPriceForm />
    </div>
  );
}
