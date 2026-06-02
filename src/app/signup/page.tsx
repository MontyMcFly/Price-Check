'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css';
import { useT } from '@/lib/i18n';

export default function Signup() {
  const router = useRouter();
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError(t.signup_error_username);
      setLoading(false);
      return;
    }

    const email = `${trimmedUsername.toLowerCase()}@pricecheck.app`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: trimmedUsername } },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setError(t.signup_error_taken);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <span className={`material-symbols-outlined ${styles.logoIcon}`}>price_check</span>
        <h1 className="headline-lg" style={{ marginTop: 'var(--spacing-sm)' }}>{t.login_title}</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>{t.login_subtitle}</p>
      </div>

      <div className={styles.card}>
        <h2 className="headline-sm">{t.signup_title}</h2>
        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginTop: '4px' }}>{t.signup_subtitle}</p>

        {error && <div className={`${styles.errorAlert} ${styles.form}`}>{error}</div>}

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className="label-sm">{t.login_username}</label>
            <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. Puguita" className={styles.input} autoCapitalize="none" />
          </div>
          <div className={styles.inputGroup}>
            <label className="label-sm">{t.login_password}</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder={t.signup_password_placeholder} className={styles.input} />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? t.signup_loading : t.signup_submit}
          </button>
        </form>

        <p className={styles.footer}>
          {t.signup_has_account}{' '}
          <Link href="/login" className={styles.footerLink}>{t.signup_signin}</Link>
        </p>
      </div>
    </div>
  );
}
