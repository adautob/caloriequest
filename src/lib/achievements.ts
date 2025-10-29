import type { AchievementDefinition } from './types';

// This file now serves as the single source of truth for all possible achievements.
export const allAchievements: AchievementDefinition[] = [
  {
    id: 'first-log',
    name: 'Primeiro Registro',
    description: 'Atualize seu perfil com suas informações pela primeira vez.',
  },
  {
    id: 'ai-genius',
    name: 'Gênio da IA',
    description: 'Use a projeção de meta da IA para criar um plano de emagrecimento.',
  },
  {
    id: 'calorie-goal',
    name: 'Meta Calórica',
    description: 'Atinja sua meta diária de calorias pela primeira vez.',
  },
  {
    id: 'consistent-week',
    name: 'Semana Consistente',
    description: 'Registre refeições por 7 dias consecutivos.',
  },
  {
    id: 'weight-loss-milestone',
    name: 'Marco Atingido',
    description: 'Alcance sua meta de peso.',
  },
  {
    id: 'monthly-marathon',
    name: 'Maratona Mensal',
    description: 'Registre refeições por 30 dias consecutivos.',
  },
];
