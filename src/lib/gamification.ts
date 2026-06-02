import { supabase } from './supabase';

export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Huevo' },
  { level: 2, minXp: 400, title: 'Bebé' },
  { level: 3, minXp: 800, title: 'Joven' },
  { level: 4, minXp: 1600, title: 'Adulto' },
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

export async function addReward(userId: string, xpAmount: number, coinAmount: number): Promise<void> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('xp, level, coins')
    .eq('id', userId)
    .single();

  if (error || !profile) return;

  const newXp = (profile.xp || 0) + xpAmount;
  const newCoins = (profile.coins || 0) + coinAmount;
  const newLevel = getLevelFromXp(newXp);

  await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel, coins: newCoins })
    .eq('id', userId);
}

export async function feedAxolotl(userId: string, amount: number): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('hunger')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const newHunger = Math.min(100, (profile.hunger || 0) + amount);
  await supabase
    .from('profiles')
    .update({ hunger: newHunger })
    .eq('id', userId);
}

export async function syncHunger(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('hunger, last_hunger_update')
    .eq('id', userId)
    .single();

  if (!profile) return;
  
  const lastUpdate = new Date(profile.last_hunger_update || Date.now());
  const now = new Date();
  const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  // Only update if at least an hour has passed to avoid unnecessary DB writes
  if (hoursPassed >= 1) {
    const hungerDecay = Math.floor(hoursPassed) * 5; // Pierde 5 de hambre por hora
    const newHunger = Math.max(0, (profile.hunger ?? 100) - hungerDecay);
    
    await supabase
      .from('profiles')
      .update({ 
        hunger: newHunger, 
        last_hunger_update: new Date().toISOString() 
      })
      .eq('id', userId);
  }
}
