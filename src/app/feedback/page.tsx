'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useT } from '@/lib/i18n';

export default function Feedback() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          username: profile?.username || 'Anon',
          email: user?.email || 'No email',
        }),
      });

      if (!res.ok) throw new Error('Failed');

      setStatus('success');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (loading || !user) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">{t.fb_title}</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
          {t.fb_subtitle}
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.userInfo}>
          <div className={styles.userIcon}>
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <div className="label-sm" style={{ color: 'var(--color-secondary)' }}>Enviando como</div>
            <div className="body-md" style={{ fontWeight: 600 }}>{profile?.username} ({user.email})</div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.fb_message}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={styles.textarea}
            placeholder={t.fb_placeholder}
            required
            rows={5}
          />
        </div>

        {status === 'success' && <div className={styles.successMsg}>{t.fb_success}</div>}
        {status === 'error' && <div className={styles.errorMsg}>{t.fb_error}</div>}

        <button type="submit" disabled={status === 'loading' || !message.trim()} className={styles.submitBtn}>
          {status === 'loading' ? t.fb_sending : t.fb_send}
        </button>
      </form>
    </div>
  );
}
