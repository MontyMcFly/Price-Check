'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useT } from '@/lib/i18n';

export default function Login() {
  const router = useRouter();
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = `${username.trim().toLowerCase()}@pricecheck.app`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t.login_error);
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
        <h2 className="headline-sm">{t.login_welcome}</h2>
        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginTop: '4px' }}>{t.login_subtitle2}</p>

        {error && <div className={`${styles.errorAlert} ${styles.form}`}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className="label-sm">{t.login_username}</label>
            <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder={t.login_username_placeholder} className={styles.input} autoCapitalize="none" />
          </div>
          <div className={styles.inputGroup}>
            <label className="label-sm">{t.login_password}</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={styles.input} />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? t.login_loading : t.login_submit}
          </button>
        </form>

        <p className={styles.footer}>
          {t.login_no_account}{' '}
          <Link href="/signup" className={styles.footerLink}>{t.login_create}</Link>
        </p>
      </div>
    </div>
  );
}
