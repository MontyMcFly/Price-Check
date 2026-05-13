'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setError(error.message);
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
        <h2 className="headline-sm">Create your account</h2>
        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginTop: '4px' }}>Start tracking prices for free</p>

        {error && <div className={`${styles.errorAlert} ${styles.form}`}>{error}</div>}

        <form onSubmit={handleSignup} className={styles.form}>
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
            />
          </div>
          <div className={styles.inputGroup}>
            <label className="label-sm">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className={styles.input}
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
              minLength={6}
              placeholder="Minimum 6 characters"
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
