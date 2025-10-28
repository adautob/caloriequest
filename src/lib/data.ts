import { Medal, Flame, Star, Zap, Trophy, BrainCircuit } from 'lucide-react';
import type { Meal, WeightEntry, Achievement } from './types';

export const dailyMeals: Meal[] = [
  { id: '1', name: 'Ovos com Abacate', calories: 350, protein: 20, carbs: 5, fat: 28, time: '08:00' },
  { id: '2', name: 'Frango Grelhado e Salada', calories: 450, protein: 40, carbs: 10, fat: 27, time: '13:00' },
  { id: '3', name: 'Iogurte Grego com Frutas', calories: 200, protein: 15, carbs: 25, fat: 4, time: '16:30' },
];

export const weightHistory: WeightEntry[] = [
  { date: '2024-07-01', weight: 85 },
  { date: '2024-07-08', weight: 84.5 },
  { date: '2024-07-15', weight: 84 },
  { date: '2024-07-22', weight: 83 },
  { date: '2024-07-29', weight: 82.5 },
];

export const achievements: Achievement[] = [
  { id: '1', name: 'Primeiro Registro', description: 'Você registrou sua primeira refeição!', icon: Star, unlocked: true },
  { id: '2', name: 'Semana Consistente', description: 'Registrou refeições por 7 dias seguidos.', icon: Medal, unlocked: true },
  { id: '3', name: 'Meta de Calorias', description: 'Atingiu sua meta diária de calorias.', icon: Flame, unlocked: true },
  { id: '4', name: 'Gênio da IA', description: 'Usou a projeção de meta pela primeira vez.', icon: BrainCircuit, unlocked: false },
  { id: '5', name: 'Peso Perdido', description: 'Perdeu seus primeiros 2kg.', icon: Zap, unlocked: true },
  { id: '6', name: 'Maratona Mensal', description: 'Registrou refeições por 30 dias.', icon: Trophy, unlocked: false },
];
