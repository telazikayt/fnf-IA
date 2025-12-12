export type Direction = 'left' | 'down' | 'up' | 'right';

export interface Note {
  id: string;
  time: number; // The time in ms when the note should be hit
  direction: Direction;
  type: 'player' | 'opponent';
  length?: number; // For hold notes
  hit?: boolean;
  missed?: boolean;
}

export interface DialogueLine {
  character: string; // 'BF', 'Dad', 'GF', etc.
  text: string;
  side: 'left' | 'right';
}

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Expert';

export interface Week {
  id: string;
  name: string;
  antagonist: string;
  color: string;
  songs: SongMetadata[];
  description: string;
  backgroundTheme: string;
}

export interface SongMetadata {
  id: string;
  name: string;
  bpm: number;
  dialogue?: DialogueLine[];
}

export interface Song {
  id: string;
  name: string;
  bpm: number;
  difficulty: Difficulty;
  notes: Note[];
  color: string;
  dialogue?: DialogueLine[]; // Optional dialogue before song
}

export interface GameState {
  health: number; // 0 to 100, 50 is neutral
  score: number;
  combo: number;
  misses: number;
  status: 'menu' | 'playing' | 'gameover' | 'won';
}

export type NoteSkin = 'Normal' | 'Circle' | 'Futuristic' | 'Crystal';

export interface GameSettings {
  ghostTapping: boolean;
  noteSkin: NoteSkin;
  keys: Record<Direction, string>;
}

export const ARROW_COLORS = {
  left: 'text-purple-600',
  down: 'text-cyan-500',
  up: 'text-green-500',
  right: 'text-red-600',
};

export const ARROW_COLORS_HEX = {
  left: '#9333ea',
  down: '#06b6d4',
  up: '#22c55e',
  right: '#dc2626',
};
