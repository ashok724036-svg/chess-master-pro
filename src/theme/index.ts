// ============================================================
// theme/index.ts — Board & UI Theme Configuration
// ============================================================

import { BoardTheme, TimeControl } from '../types/chess.types';

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'wood',
    label: 'Wood',
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    highlightLight: '#F7EC7A',
    highlightDark: '#DAC34A',
    lastMoveLight: '#CDD16F',
    lastMoveDark: '#AABA43',
  },
  {
    id: 'marble',
    label: 'Marble',
    lightSquare: '#E8DFD0',
    darkSquare: '#8A7E6D',
    highlightLight: '#F5EDA5',
    highlightDark: '#C8B95A',
    lastMoveLight: '#D4C98A',
    lastMoveDark: '#B8A84A',
  },
  {
    id: 'green',
    label: 'Classic',
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
    highlightLight: '#F7F783',
    highlightDark: '#BBD754',
    lastMoveLight: '#CDD16F',
    lastMoveDark: '#AABA43',
  },
  {
    id: 'dark',
    label: 'Dark',
    lightSquare: '#7A6E5F',
    darkSquare: '#3D3028',
    highlightLight: '#9D8F50',
    highlightDark: '#6A5C2A',
    lastMoveLight: '#8A9040',
    lastMoveDark: '#5A6028',
  },
  {
    id: 'ice',
    label: 'Ice',
    lightSquare: '#DDE6ED',
    darkSquare: '#6B90B2',
    highlightLight: '#F0F7A0',
    highlightDark: '#C5D958',
    lastMoveLight: '#B8D0E0',
    lastMoveDark: '#4A78A0',
  },
];

export const APP_COLORS = {
  bg: '#1A1A1A',
  surface: '#252525',
  card: '#2D2D2D',
  border: '#383838',
  text: '#E8E4D9',
  muted: '#8A8070',
  accent: '#E8C97A',
  accentDim: 'rgba(232, 201, 122, 0.15)',
  white: '#F5F0E8',
  danger: '#C0392B',
  success: '#27AE60',
  info: '#2980B9',
  check: 'rgba(231, 76, 60, 0.7)',
};

export const TIME_CONTROLS: TimeControl[] = [
  { label: '1+0', seconds: 60,   increment: 0, category: 'bullet'    },
  { label: '2+1', seconds: 120,  increment: 1, category: 'bullet'    },
  { label: '3+0', seconds: 180,  increment: 0, category: 'blitz'     },
  { label: '3+2', seconds: 180,  increment: 2, category: 'blitz'     },
  { label: '5+0', seconds: 300,  increment: 0, category: 'blitz'     },
  { label: '5+3', seconds: 300,  increment: 3, category: 'blitz'     },
  { label: '10+0',seconds: 600,  increment: 0, category: 'rapid'     },
  { label: '15+10',seconds:900,  increment:10, category: 'rapid'     },
  { label: '30+0',seconds: 1800, increment: 0, category: 'classical' },
];

export const DEFAULT_BOARD_THEME = BOARD_THEMES[0];
export const DEFAULT_TIME_CONTROL = TIME_CONTROLS[4]; // 5+0 Blitz
