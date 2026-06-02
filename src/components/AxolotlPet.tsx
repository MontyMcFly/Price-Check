'use client';

import { useAuth } from '@/lib/auth-context';
import { LEVEL_THRESHOLDS, getNextLevelThreshold, feedAxolotl, addReward } from '@/lib/gamification';
import Image from 'next/image';
import styles from './AxolotlPet.module.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  variant?: 'floating' | 'dashboard';
}

export default function AxolotlPet({ variant = 'floating' }: Props) {
  const { user, profile, refreshProfile } = useAuth();
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
  const coins = profile.coins || 0;
  const hunger = profile.hunger ?? 100;

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

  const handleFeed = async () => {
    if (!user || coins < 15 || hunger >= 100) return;
    // Pay 15 coins to feed
    await addReward(user.id, 0, -15);
    await feedAxolotl(user.id, 30);
    if (refreshProfile) await refreshProfile();
  };

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
            <h3 className="headline-sm" style={{ marginBottom: '16px' }}>¿Cómo cuidar a tu Axolote?</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>+10 XP y +5 🪙:</strong> Por registrar un nuevo producto o precio en el catálogo.</li>
              <li><strong>+5 XP y +2 🪙:</strong> Por marcar un producto como comprado en tu lista.</li>
              <li><strong>Alimentar (+20%):</strong> Tu Axolote come gratis al agregar algo a tu lista desde el catálogo.</li>
              <li><strong>Comprar Comida (-15 🪙):</strong> Aliméntalo con tus monedas desde el panel si tienes hambre y nada que comprar.</li>
            </ul>
            <p className="body-md" style={{ marginTop: '16px', color: 'var(--color-secondary)' }}>
              El hambre bajará automáticamente con el tiempo (-5% por hora). ¡Mantén a tu Axolote feliz y acumula XP para que evolucione de Huevo hasta Adulto!
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '4px 12px', borderRadius: '20px' }}>
            {coins} 🪙
          </span>
          <span className={styles.titleBadge}>{title}</span>
        </div>
      </div>
      
      <div className={styles.dashboardMain}>
        <div className={styles.dashboardImageWrapper}>
          <Image src={imageSrc} alt={`Axolotl Nivel ${level}`} fill className={styles.image} priority />
        </div>
      </div>

      <div className={styles.statsContainer}>
        {/* Hunger Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div className={styles.xpHeader}>
            <span className="label-sm">Hambre</span>
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
              Alimentar (15 🪙)
            </button>
          </div>
        </div>

        {/* XP Bar */}
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
