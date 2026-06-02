import { supabase } from './supabase';

export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Huevo' },
  { level: 2, minXp: 50, title: 'Bebé' },
  { level: 3, minXp: 150, title: 'Joven' },
  { level: 4, minXp: 300, title: 'Adulto' },
];

export function getLevelFromXp(xp: number): number {
  let currentLevel = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXp) {
      currentLevel = threshold.level;
    }
  }
  return currentLevel;
}

export function getNextLevelThreshold(xp: number): number | null {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp < threshold.minXp) {
      return threshold.minXp;
    }
  }
  return null; // Max level reached
}

export async function addXp(userId: string, amount: number): Promise<void> {
  // First, get current XP
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error('Error fetching profile for XP update:', fetchError);
    return;
  }

  const newXp = (profile.xp || 0) + amount;
  const newLevel = getLevelFromXp(newXp);

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating XP:', updateError);
  }
}
