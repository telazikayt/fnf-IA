import { Direction } from './types';

export const DIRECTIONS: Direction[] = ['left', 'down', 'up', 'right'];

export const HIT_WINDOW = 150; // ms window to hit a note
export const PERFECT_WINDOW = 50; // ms for perfect hit
export const NOTE_SPEED = 0.5; // pixels per ms (approx)
export const SCROLL_SPEED_MODIFIER = 600; // Visual scroll speed

export const KEY_MAPPING: Record<string, Direction> = {
  'ArrowLeft': 'left',
  'a': 'left',
  'ArrowDown': 'down',
  's': 'down',
  'ArrowUp': 'up',
  'w': 'up',
  'ArrowRight': 'right',
  'd': 'right',
};
