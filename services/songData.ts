import { Song, Note, Difficulty, Week, SongMetadata } from '../types';
import { DIRECTIONS } from '../constants';

// Helper to generate a sequence of notes
const generatePattern = (
  startTime: number, 
  bpm: number, 
  lengthBeats: number, 
  difficulty: Difficulty,
  isPlayer: boolean
): Note[] => {
  const notes: Note[] = [];
  const beatDur = 60000 / bpm;
  
  // Difficulty Density: Probability of a note appearing in a 16th slot
  let density = 0.2; // Default Easy
  switch(difficulty) {
    case 'Easy': density = 0.15; break;
    case 'Normal': density = 0.35; break;
    case 'Hard': density = 0.65; break;
    case 'Expert': density = 0.90; break;
  }

  for (let i = 0; i < lengthBeats; i++) {
    // 16th notes
    for (let j = 0; j < 4; j++) {
      if (Math.random() < density) {
        const time = startTime + (i * beatDur) + (j * (beatDur / 4));
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        notes.push({
          id: `note-${Math.random().toString(36).substr(2, 9)}`,
          time,
          direction,
          type: isPlayer ? 'player' : 'opponent',
        });
      }
    }
  }
  return notes;
};

// Generate Full Song based on Metadata and Difficulty
export const generateSong = (
  meta: SongMetadata,
  color: string,
  difficulty: Difficulty
): Song => {
  const notes: Note[] = [];
  const songLengthBeats = 128; // Standard length
  const beatDur = 60000 / meta.bpm;
  let currentTime = 2000; 

  // 4 bar loops
  for (let bar = 0; bar < songLengthBeats / 8; bar++) {
    // Opponent Turn
    const oppNotes = generatePattern(currentTime, meta.bpm, 4, difficulty, false);
    notes.push(...oppNotes);
    
    // Player Turn (Mirror opponent roughly)
    const playerStartTime = currentTime + (4 * beatDur);
    const playerNotes = oppNotes.map(n => ({
      ...n,
      id: `p-${n.id}`,
      time: n.time + (4 * beatDur),
      type: 'player' as const
    }));
    
    notes.push(...playerNotes);
    currentTime += 8 * beatDur;
  }

  return {
    id: meta.id,
    name: meta.name,
    bpm: meta.bpm,
    difficulty: difficulty,
    notes: notes.sort((a, b) => a.time - b.time),
    color: color,
    dialogue: meta.dialogue
  };
};

export const WEEKS: Week[] = [
  {
    id: 'week1',
    name: 'SEMANA 1: Daddy Dearest',
    antagonist: 'Dad',
    color: '#9333ea', // Purple
    description: 'Enfrente o pai ex-rockstar da sua namorada. Ele não aprova seu relacionamento.',
    backgroundTheme: 'bg-purple-900',
    songs: [
      { id: 'w1-1', name: 'Bopeebo', bpm: 100, dialogue: [
        { character: 'Dad', text: 'Você acha que tem o que é preciso?', side: 'left' },
        { character: 'BF', text: 'Beep boop!', side: 'right' }
      ]},
      { id: 'w1-2', name: 'Fresh', bpm: 120 },
      { id: 'w1-3', name: 'Dadbattle', bpm: 140 }
    ]
  },
  {
    id: 'week2',
    name: 'SEMANA 2: Spooky Month',
    antagonist: 'Spooky',
    color: '#ea580c', // Orange
    description: 'Duas crianças em fantasias de Halloween querem o seu doce (e sua alma).',
    backgroundTheme: 'bg-orange-900',
    songs: [
      { id: 'w2-1', name: 'Spookeez', bpm: 150, dialogue: [
        { character: 'Spooky', text: 'É O MÊS ASSUSTADOR!', side: 'left' },
        { character: 'BF', text: 'Skiddoo bop?', side: 'right' }
      ]},
      { id: 'w2-2', name: 'South', bpm: 165 },
      { id: 'w2-3', name: 'Monster', bpm: 95 }
    ]
  },
  {
    id: 'week3',
    name: 'SEMANA 3: Pico',
    antagonist: 'Pico',
    color: '#22c55e', // Green
    description: 'Um mercenário contratado pelo pai dela. Cuidado com a arma.',
    backgroundTheme: 'bg-green-900',
    songs: [
      { id: 'w3-1', name: 'Pico', bpm: 150, dialogue: [
        { character: 'Pico', text: 'Vou encher sua cara de chumbo, baixinho.', side: 'left' },
        { character: 'BF', text: 'Go pico yeah yeah!', side: 'right' }
      ]},
      { id: 'w3-2', name: 'Philly', bpm: 160 },
      { id: 'w3-3', name: 'Blammed', bpm: 180 }
    ]
  },
  {
    id: 'week4',
    name: 'SEMANA 4: Mommy Must Murder',
    antagonist: 'Mom',
    color: '#db2777', // Pink
    description: 'A mãe dela é ainda pior. Dance em cima de uma limusine em movimento!',
    backgroundTheme: 'bg-pink-900',
    songs: [
      { id: 'w4-1', name: 'Satin Panties', bpm: 110, dialogue: [
        { character: 'Mom', text: 'Acha que é bom o suficiente para minha bebê?', side: 'left' },
        { character: 'BF', text: 'Beep!', side: 'right' }
      ]},
      { id: 'w4-2', name: 'High', bpm: 125 },
      { id: 'w4-3', name: 'MILF', bpm: 180 }
    ]
  },
  {
    id: 'week5',
    name: 'SEMANA 5: Red Snow',
    antagonist: 'Monster',
    color: '#dc2626', // Red
    description: 'O Natal chegou, mas o Papai Noel trouxe um demônio comedor de gente.',
    backgroundTheme: 'bg-red-950',
    songs: [
      { id: 'w5-1', name: 'Cocoa', bpm: 100, dialogue: [
        { character: 'Mom', text: 'Vamos cantar canções de natal!', side: 'left' },
        { character: 'Dad', text: 'E MATAR O NAMORADO!', side: 'left' }
      ]},
      { id: 'w5-2', name: 'Eggnog', bpm: 130 },
      { id: 'w5-3', name: 'Winter Horrorland', bpm: 190, dialogue: [
        { character: 'Monster', text: 'Vou fazer caldo com seus ossos...', side: 'left' },
        { character: 'BF', text: '...beep?', side: 'right' }
      ]}
    ]
  }
];

// Flat list for Freeplay
export const SONGS: Song[] = WEEKS.flatMap(week => 
  week.songs.map(meta => generateSong(meta, week.color, 'Normal'))
);
