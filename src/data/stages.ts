import type { StageDefinition, StageId } from '../core/types';

export const STAGES: Record<StageId, StageDefinition> = {
  'open-field': {
    id: 'open-field',
    name: 'Open Field',
    description: 'Campo aberto para aprender os controles e a leitura do vento.',
    terrainSeed: 9917,
    eraId: 'classical',
    machineIds: ['ballista', 'onager'],
    spawnX: [0.17, 0.83],
    maxVisualContactDistance: 900,
  },
  'long-ridge': {
    id: 'long-ridge',
    name: 'Long Ridge',
    description: 'Uma frente extensa; a distância força o uso do radar.',
    terrainSeed: 22341,
    eraId: 'late-antiquity',
    machineIds: ['onager', 'traction-trebuchet'],
    spawnX: [0.08, 0.92],
    maxVisualContactDistance: 560,
  },
  'hidden-basin': {
    id: 'hidden-basin',
    name: 'Hidden Basin',
    description: 'Máquinas separadas por relevo e sem contato visual direto.',
    terrainSeed: 47829,
    eraId: 'high-medieval',
    machineIds: ['traction-trebuchet', 'counterweight-trebuchet'],
    spawnX: [0.07, 0.93],
    maxVisualContactDistance: 500,
  },
};

export const STAGE_ORDER: StageId[] = ['open-field', 'long-ridge', 'hidden-basin'];
