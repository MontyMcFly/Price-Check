'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Generate the internal email from username
    const email = `${username.trim().toLowerCase()}@pricecheck.app`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Invalid username or password.');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <span className={`material-symbols-outlined ${styles.logoIcon}`}>price_check</span>
        <h1 className="headline-lg" style={{ marginTop: 'var(--spacing-sm)' }}>Price Check</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Smart savings, every day.</p>
      </div>

      <div className={styles.card}>
        <h2 className="headline-sm">Welcome back</h2>
        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginTop: '4px' }}>Sign in to access your shopping list</p>

        {error && <div className={`${styles.errorAlert} ${styles.form}`}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className="label-sm">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="e.g. Puguita"
              className={styles.input}
              autoCapitalize="none"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className="label-sm">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={styles.footerLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
