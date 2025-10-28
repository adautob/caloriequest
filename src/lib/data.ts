import { Medal, Flame, Star, Zap, Trophy, BrainCircuit } from 'lucide-react';
import type { WeightEntry, Achievement } from './types';

// This file is now deprecated for meals, but we keep it for achievements and weight history for now.

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
