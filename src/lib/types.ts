import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  date: string; // Changed from time to a full ISO date string
  createdAt: Timestamp;
};

export type WeightEntry = {
  date: string;
  weight: number;
};

export type WeightMeasurement = {
  id: string;
  weight: number;
  date: string;
  createdAt: Timestamp;
};

// This type is for the static data in lib/data.ts, now used for icon mapping
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
};

// This type represents a static achievement definition, now stored locally.
export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
}

// This type represents an achievement earned by a user, stored in Firestore
export type UserAchievement = {
  id: string; // The document ID
  achievementId: string;
  dateEarned: Timestamp;
}


export type UserProfile = {
    id: string;
    email: string;
    name: string;
    currentWeight?: number;
    height?: number;
    weightGoal?: number;
    age?: number;
    gender?: string;
    activityLevel?: string;
    dietaryPreferences?: string;
    dailyCalorieGoal?: number;
}
    