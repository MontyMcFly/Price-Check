'use client';

import { useAuth } from '@/lib/auth-context';
import { LEVEL_THRESHOLDS, getNextLevelThreshold } from '@/lib/gamification';
import Image from 'next/image';
import styles from './AxolotlPet.module.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  variant?: 'floating' | 'dashboard';
}

export default function AxolotlPet({ variant = 'floating' }: Props) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Small delay to animate in
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

  // Determine Image based on level
  let imageSrc = '/images/axolotl/egg.png';
  if (level === 2) imageSrc = '/images/axolotl/baby.png';
  if (level === 3) imageSrc = '/images/axolotl/young.png';
  if (level >= 4) imageSrc = '/images/axolotl/adult.png';

  // Get current level threshold info
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === level);
  const nextThresholdXp = getNextLevelThreshold(xp);

  const title = currentThreshold?.title || 'Adulto';

  // Calculate progress percentage for the progress bar
  let progressPercent = 100;
  if (nextThresholdXp !== null && currentThreshold) {
    const xpIntoLevel = xp - currentThreshold.minXp;
    const xpNeededForLevel = nextThresholdXp - currentThreshold.minXp;
    progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));
  }

  if (variant === 'floating') {
    return (
      <div className={`${styles.floatingContainer} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.floatingTooltip}>
          <strong>{petName}</strong> (Nvl {level})<br/>
          {xp} XP
        </div>
        <div className={styles.floatingImageWrapper}>
          <Image src={imageSrc} alt={`Axolotl Nivel ${level}`} fill className={styles.image} />
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
        aria-label="Información de XP"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
      </button>

      {showInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowInfo(false)}>
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 className="headline-sm" style={{ marginBottom: '16px' }}>¿Cómo crecer a tu Axolote?</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>+10 XP:</strong> Por registrar un nuevo producto o precio en el catálogo.</li>
              <li><strong>+5 XP:</strong> Por marcar un producto como comprado en tu lista de compras.</li>
            </ul>
            <p className="body-md" style={{ marginTop: '16px', color: 'var(--color-secondary)' }}>
              Acumula XP para que tu Axolote suba de nivel. ¡Pasará de huevo, a bebé, a joven y finalmente a adulto!
            </p>
            <button onClick={() => setShowInfo(false)} style={{ marginTop: '24px', width: '100%', padding: '12px', background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: '100px', fontWeight: 600, cursor: 'pointer' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className={styles.dashboardHeader}>
        <div className={styles.nameTag}>
          <span className="headline-sm">{petName}</span>
          <span className={styles.levelBadge}>Nvl {level}</span>
        </div>
        <span className={styles.titleBadge}>{title}</span>
      </div>
      
      <div className={styles.dashboardMain}>
        <div className={styles.dashboardImageWrapper}>
          <Image src={imageSrc} alt={`Axolotl Nivel ${level}`} fill className={styles.image} priority />
        </div>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.xpHeader}>
          <span className="label-sm">Experiencia (XP)</span>
          <span className="label-sm" style={{ fontWeight: 600 }}>{xp} {nextThresholdXp ? `/ ${nextThresholdXp}` : ''}</span>
        </div>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>
        {nextThresholdXp === null ? (
          <p className={styles.maxLevelText}>¡Nivel máximo alcanzado!</p>
        ) : (
          <p className={styles.nextLevelText}>Faltan {nextThresholdXp - xp} XP para crecer</p>
        )}
      </div>
    </div>
  );
}
