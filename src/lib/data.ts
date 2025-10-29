import { Medal, Flame, Star, Zap, Trophy, BrainCircuit, ShieldQuestion } from 'lucide-react';

// This file now provides a mapping from achievement ID to a Lucide icon component.
export const achievementIcons: { [key: string]: React.ElementType } = {
  'first-log': Star,
  'consistent-week': Medal,
  'calorie-goal': Flame,
  'ai-genius': BrainCircuit,
  'weight-loss-milestone': Zap,
  'monthly-marathon': Trophy,
  'default': ShieldQuestion, // A default icon for any unmapped achievement
};
