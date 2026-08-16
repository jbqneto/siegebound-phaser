import type { BattlefieldConditionDefinition, ConditionId } from '../core/types';

export const CONDITIONS: Record<ConditionId, BattlefieldConditionDefinition> = {
  normal: {
    id: 'normal',
    name: 'CALM FIELD',
    description: 'Condições normais de cerco.',
    windMultiplier: 1,
    gravityMultiplier: 1,
    velocityMultiplier: 1,
  },
  'strong-gust': {
    id: 'strong-gust',
    name: 'STRONG GUST',
    description: 'O vento afeta o projétil com força ampliada.',
    windMultiplier: 1.8,
    gravityMultiplier: 1,
    velocityMultiplier: 1,
  },
  'wind-shift': {
    id: 'wind-shift',
    name: 'WIND SHIFT',
    description: 'A corrente muda de sentido.',
    windMultiplier: -1,
    gravityMultiplier: 1,
    velocityMultiplier: 1,
  },
  updraft: {
    id: 'updraft',
    name: 'THERMAL UPDRAFT',
    description: 'A corrente ascendente prolonga o voo.',
    windMultiplier: 1,
    gravityMultiplier: 0.72,
    velocityMultiplier: 1,
  },
  'heavy-rain': {
    id: 'heavy-rain',
    name: 'HEAVY RAIN',
    description: 'A chuva reduz a velocidade inicial dos disparos.',
    windMultiplier: 0.72,
    gravityMultiplier: 1.08,
    velocityMultiplier: 0.9,
  },
  'supply-restriction': {
    id: 'supply-restriction',
    name: 'SUPPLY RESTRICTION',
    description: 'A próxima janela de suprimentos está fechada.',
    windMultiplier: 1,
    gravityMultiplier: 1,
    velocityMultiplier: 1,
  },
};

export const CONDITION_ORDER: ConditionId[] = [
  'normal',
  'strong-gust',
  'wind-shift',
  'updraft',
  'heavy-rain',
  'supply-restriction',
];
