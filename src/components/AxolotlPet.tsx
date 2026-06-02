'use client';

import { useAuth } from '@/lib/auth-context';
import { LEVEL_THRESHOLDS, getNextLevelThreshold, feedAxolotl, addReward } from '@/lib/gamification';
import Image from 'next/image';
import styles from './AxolotlPet.module.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';

interface Props {
  variant?: 'floating' | 'dashboard';
}

export default function AxolotlPet({ variant = 'floating' }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const pathname = usePathname();
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (profile) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [profile]);

  if (!profile) return null;
  if (variant === 'floating' && pathname === '/') return null;

  const xp = profile.xp || 0;
  const level = profile.level || 1;
  const petName = profile.pet_name || 'Axolito';
  const coins = profile.coins || 0;
  const hunger = profile.hunger ?? 100;

  let imageSrc = '/images/axolotl/egg.png';
  if (level === 2) imageSrc = '/images/axolotl/baby.png';
  if (level === 3) imageSrc = '/images/axolotl/young.png';
  if (level >= 4) imageSrc = '/images/axolotl/adult.png';

  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === level);
  const nextThresholdXp = getNextLevelThreshold(xp);

  // Localized level title
  const levelTitles: Record<string, string> = {
    'Huevo': t.level_egg, 'Bebé': t.level_baby, 'Joven': t.level_young, 'Adulto': t.level_adult
  };
  const title = levelTitles[currentThreshold?.title || 'Adulto'] || t.level_adult;

  let progressPercent = 100;
  if (nextThresholdXp !== null && currentThreshold) {
    const xpIntoLevel = xp - currentThreshold.minXp;
    const xpNeededForLevel = nextThresholdXp - currentThreshold.minXp;
    progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));
  }

  const handleFeed = async () => {
    if (!user || coins < 15 || hunger >= 100) return;
    await addReward(user.id, 0, -15);
    await feedAxolotl(user.id, 30);
    if (refreshProfile) await refreshProfile();
  };

  if (variant === 'floating') {
    return (
      <div className={`${styles.floatingContainer} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.floatingTooltip}>
          <strong>{petName}</strong> ({t.axolotl_lvl} {level})<br/>
          {xp} XP
        </div>
        <div className={styles.floatingImageWrapper}>
          <Image src={imageSrc} alt={`Axolotl ${t.axolotl_lvl} ${level}`} fill className={styles.image} />
        </div>
      </div>
    );
  }

  // Dashboard variant
  return (
    <div className={styles.dashboardContainer} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowInfo(true)}
        style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'var(--color-surface-container-highest)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-on-surface)' }}
        aria-label="Info"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
      </button>

      {showInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowInfo(false)}>
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 className="headline-sm" style={{ marginBottom: '16px' }}>{t.axolotl_info_title}</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>+10 XP, +5 🪙:</strong> {t.axolotl_info_1}</li>
              <li><strong>+5 XP, +2 🪙:</strong> {t.axolotl_info_2}</li>
              <li><strong>+20%:</strong> {t.axolotl_info_3}</li>
              <li><strong>-15 🪙:</strong> {t.axolotl_info_4}</li>
            </ul>
            <p className="body-md" style={{ marginTop: '16px', color: 'var(--color-secondary)' }}>
              {t.axolotl_info_desc}
            </p>
            <button onClick={() => setShowInfo(false)} style={{ marginTop: '24px', width: '100%', padding: '12px', background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: '100px', fontWeight: 600, cursor: 'pointer' }}>
              {t.axolotl_info_ok}
            </button>
          </div>
        </div>
      )}

      <div className={styles.dashboardHeader}>
        <div className={styles.nameTag}>
          <span className="headline-sm">{petName}</span>
          <span className={styles.levelBadge}>{t.axolotl_lvl} {level}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '4px 12px', borderRadius: '20px' }}>
            {coins} 🪙
          </span>
          <span className={styles.titleBadge}>{title}</span>
        </div>
      </div>

      <div className={styles.dashboardMain}>
        <div className={styles.dashboardImageWrapper}>
          <Image src={imageSrc} alt={`Axolotl ${t.axolotl_lvl} ${level}`} fill className={styles.image} priority />
        </div>
      </div>

      <div className={styles.statsContainer}>
        {/* Hunger Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div className={styles.xpHeader}>
            <span className="label-sm">{t.axolotl_hunger}</span>
            <span className="label-sm" style={{ fontWeight: 600 }}>{hunger}%</span>
          </div>
          <div className={styles.progressBarBg} style={{ height: '8px' }}>
            <div className={styles.progressBarFill} style={{ width: `${hunger}%`, background: hunger > 50 ? '#34d399' : hunger > 20 ? '#fbbf24' : '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={handleFeed}
              disabled={coins < 15 || hunger >= 100}
              style={{
                fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', border: 'none',
                background: (coins < 15 || hunger >= 100) ? 'var(--color-surface-container-high)' : 'var(--color-primary-container)',
                color: (coins < 15 || hunger >= 100) ? 'var(--color-outline)' : 'var(--color-on-primary-container)',
                cursor: (coins < 15 || hunger >= 100) ? 'not-allowed' : 'pointer'
              }}
            >
              {t.axolotl_feed}
            </button>
          </div>
        </div>

        {/* XP Bar */}
        <div className={styles.xpHeader}>
          <span className="label-sm">{t.axolotl_xp}</span>
          <span className="label-sm" style={{ fontWeight: 600 }}>{xp} {nextThresholdXp ? `/ ${nextThresholdXp}` : ''}</span>
        </div>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>
        {nextThresholdXp === null ? (
          <p className={styles.maxLevelText}>{t.axolotl_max_level}</p>
        ) : (
          <p className={styles.nextLevelText}>{t.axolotl_xp_needed.replace('{n}', String(nextThresholdXp - xp))}</p>
        )}
      </div>
    </div>
  );
}
