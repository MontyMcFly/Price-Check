'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import { useT } from '@/lib/i18n';

interface LeaderboardUser {
  id: string;
  username: string;
  xp: number;
  level: number;
  pet_name: string;
  priceCount: number;
}

export default function Leaderboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchLeaderboard();
  }, [user]);

  async function fetchLeaderboard() {
    setLbLoading(true);

    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, xp, level, pet_name')
      .order('xp', { ascending: false });

    if (!profiles) { setLbLoading(false); return; }

    // Get price counts per user
    const { data: priceCounts } = await supabase
      .from('prices')
      .select('user_id');

    const countMap = new Map<string, number>();
    if (priceCounts) {
      for (const p of priceCounts) {
        if (p.user_id) {
          countMap.set(p.user_id, (countMap.get(p.user_id) || 0) + 1);
        }
      }
    }

    const leaderboard: LeaderboardUser[] = profiles.map(p => ({
      id: p.id,
      username: p.username || 'Anon',
      xp: p.xp || 0,
      level: p.level || 1,
      pet_name: p.pet_name || 'Axolito',
      priceCount: countMap.get(p.id) || 0,
    }));

    setUsers(leaderboard);
    setLbLoading(false);
  }

  function getAxolotlSrc(level: number) {
    if (level >= 4) return '/images/axolotl/adult.png';
    if (level === 3) return '/images/axolotl/young.png';
    if (level === 2) return '/images/axolotl/baby.png';
    return '/images/axolotl/egg.png';
  }

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">{t.lb_title}</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>{t.lb_subtitle}</p>
      </header>

      {lbLoading ? (
        <p className="body-md">{t.lb_loading}</p>
      ) : users.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>leaderboard</span>
          <p className="body-lg" style={{ marginTop: '12px' }}>{t.lb_empty}</p>
        </div>
      ) : (
        <div className={styles.leaderboardList}>
          {users.map((u, idx) => {
            const isMe = u.id === user?.id;
            return (
              <div key={u.id} className={`${styles.userCard} ${isMe ? styles.userCardMe : ''} ${idx < 3 ? styles.userCardTop : ''}`}>
                <div className={styles.rank}>
                  {idx < 3 ? (
                    <span style={{ fontSize: '24px' }}>{medals[idx]}</span>
                  ) : (
                    <span className={styles.rankNumber}>#{idx + 1}</span>
                  )}
                </div>

                <div className={styles.petAvatar}>
                  <Image src={getAxolotlSrc(u.level)} alt={u.pet_name} fill style={{ objectFit: 'contain' }} />
                </div>

                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {u.username} {isMe && <span className={styles.youBadge}>{t.lb_you}</span>}
                  </div>
                  <div className={styles.petNameLabel}>{u.pet_name}</div>
                </div>

                <div className={styles.userStats}>
                  <div className={styles.xpValue}>{u.xp} XP</div>
                  <div className={styles.priceCount}>{u.priceCount} {t.lb_products}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
