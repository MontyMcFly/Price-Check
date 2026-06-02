'use client';

import { useAuth } from '@/lib/auth-context';
import { LEVEL_THRESHOLDS, getNextLevelThreshold } from '@/lib/gamification';
import Image from 'next/image';
import styles from './AxolotlPet.module.css';
import { useState, useEffect } from 'react';

interface Props {
  variant?: 'floating' | 'dashboard';
}

export default function AxolotlPet({ variant = 'floating' }: Props) {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Small delay to animate in
  useEffect(() => {
    if (profile) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [profile]);

  if (!profile) return null;

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
    <div className={styles.dashboardContainer}>
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
