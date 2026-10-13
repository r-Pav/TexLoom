import type { GradientStop } from './types';

export interface GradientPreset {
  id: string;
  zh: string;
  stops: GradientStop[];
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'mono',
    zh: '石墨',
    stops: [
      { t: 0, color: '#000000' },
      { t: 1, color: '#ffffff' },
    ],
  },
  {
    id: 'ember',
    zh: '余烬',
    stops: [
      { t: 0, color: '#000000' },
      { t: 0.45, color: '#7a1608' },
      { t: 0.75, color: '#e04e12' },
      { t: 1, color: '#ffd23e' },
    ],
  },
  {
    id: 'lagoon',
    zh: '青潭',
    stops: [
      { t: 0, color: '#001014' },
      { t: 0.5, color: '#0b6b5d' },
      { t: 1, color: '#b9f3d9' },
    ],
  },
  {
    id: 'neon',
    zh: '霓虹',
    stops: [
      { t: 0, color: '#120024' },
      { t: 0.5, color: '#a3129c' },
      { t: 1, color: '#31e6ff' },
    ],
  },
  {
    id: 'dawn',
    zh: '晨曦',
    stops: [
      { t: 0, color: '#0b0620' },
      { t: 0.55, color: '#b1338a' },
      { t: 1, color: '#ffd9a0' },
    ],
  },
];


export const CUSTOM_DEFAULT: GradientStop[] = [
  { t: 0, color: '#061018' },
  { t: 0.5, color: '#1e6f5c' },
  { t: 1, color: '#e8fff4' },
];
