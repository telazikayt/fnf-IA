import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Song, GameState, Note, Direction, GameSettings } from '../types';
import { audioService } from '../services/audioEngine';
import { HIT_WINDOW, NOTE_SPEED, DIRECTIONS } from '../constants';
import Character from './Character';
import Arrow from './Arrow';
import HealthBar from './HealthBar';

interface GameEngineProps {
  song: Song;
  onExit: (score: number, status: 'won' | 'gameover') => void;
  settings: GameSettings;
}

const GameEngine: React.FC<GameEngineProps> = ({ song, onExit, settings }) => {
  // Game Loop State
  const [currentTime, setCurrentTime] = useState(0);
  const [gameState, setGameState] = useState<GameState>({
    health: 50,
    score: 0,
    combo: 0,
    misses: 0,
    status: 'playing',
  });
  
  // Visual States
  const [playerPose, setPlayerPose] = useState<Direction | 'idle' | 'miss'>('idle');
  const [opponentPose, setOpponentPose] = useState<Direction | 'idle'>('idle');
  const [beatToggle, setBeatToggle] = useState(false); // For character bobbing
  
  // Refs for high-freq updates
  const gameStateRef = useRef(gameState);
  const notesRef = useRef<Note[]>([]); // Initialize empty, set in effect
  const requestRef = useRef<number>(0);
  const pressedKeysRef = useRef<Record<string, boolean>>({});
  const lastBeatRef = useRef(0); // Stable ref for beat tracking

  // Initialize notes ref on song change
  useEffect(() => {
    notesRef.current = JSON.parse(JSON.stringify(song.notes));
  }, [song]);

  // Sync ref
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Helper to get direction from key based on settings
  const getDirectionFromKey = (key: string): Direction | undefined => {
    return (Object.keys(settings.keys) as Direction[]).find(
      dir => settings.keys[dir].toLowerCase() === key.toLowerCase()
    );
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current.status !== 'playing') return;
      
      const dir = getDirectionFromKey(e.key);
      
      if (dir && !pressedKeysRef.current[dir]) {
        pressedKeysRef.current[dir] = true;
        setPlayerPose(dir);
        checkHit(dir);
        // Reset pose to idle after a short delay
        setTimeout(() => setPlayerPose(prev => prev === dir ? 'idle' : prev), 200);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const dir = getDirectionFromKey(e.key);
      if (dir) {
        pressedKeysRef.current[dir] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings]); // Re-bind if settings change

  const checkHit = (dir: Direction) => {
    const time = audioService.getCurrentTime();
    
    // Find nearest unhit note of player type in this lane
    const noteIndex = notesRef.current.findIndex(n => 
      n.type === 'player' && 
      !n.hit && 
      n.direction === dir && 
      Math.abs(n.time - time) < HIT_WINDOW
    );

    if (noteIndex !== -1) {
      // Hit!
      notesRef.current[noteIndex].hit = true;
      audioService.playFeedback(dir);
      
      const noteTime = notesRef.current[noteIndex].time;
      const accuracy = Math.abs(noteTime - time);
      let scoreAdd = 100;
      let healthAdd = 4;
      
      if (accuracy < 50) { scoreAdd = 350; healthAdd = 6; } // Sick
      else if (accuracy < 100) { scoreAdd = 200; healthAdd = 4; } // Good
      else { scoreAdd = 50; healthAdd = 2; } // Bad

      setGameState(prev => ({
        ...prev,
        score: prev.score + scoreAdd,
        combo: prev.combo + 1,
        health: Math.min(100, prev.health + healthAdd)
      }));
    } else {
      // Ghost Tapping Check
      if (!settings.ghostTapping) {
        setGameState(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 10),
          health: Math.max(0, prev.health - 2),
          combo: 0,
          misses: prev.misses + 1
        }));
        setPlayerPose('miss');
      }
      // If Ghost Tapping is ON, we do nothing (no penalty)
    }
  };

  const gameLoop = useCallback(() => {
    const time = audioService.getCurrentTime();
    setCurrentTime(time);

    // Check Song End
    const lastNoteTime = notesRef.current.length > 0 ? notesRef.current[notesRef.current.length - 1].time : 0;
    if (notesRef.current.length > 0 && time > lastNoteTime + 2000) {
      onExit(gameStateRef.current.score, 'won');
      return;
    }

    // Beat Detection (for animations)
    const beatLen = 60000 / song.bpm;
    if (time - lastBeatRef.current > beatLen) {
      lastBeatRef.current = time;
      setBeatToggle(prev => !prev);
    }

    // Auto-play Opponent & Check Misses
    notesRef.current.forEach(note => {
      // Opponent Animation
      if (note.type === 'opponent' && !note.hit && time >= note.time) {
        note.hit = true;
        setOpponentPose(note.direction);
        setTimeout(() => setOpponentPose(prev => prev === note.direction ? 'idle' : prev), 200);
      }

      // Player Miss Detection
      // Miss logic always applies if the note passes the hit window, regardless of ghost tapping
      if (note.type === 'player' && !note.hit && !note.missed && time > note.time + HIT_WINDOW) {
        note.missed = true;
        setGameState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - 5), // Big penalty for missing a note entirely
          combo: 0,
          misses: prev.misses + 1
        }));
        setPlayerPose('miss');
      }
    });

    // Game Over Check
    if (gameStateRef.current.health <= 0) {
      audioService.stop();
      onExit(gameStateRef.current.score, 'gameover');
      return;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [song.bpm, onExit]); 

  useEffect(() => {
    // Start Game
    // Reset beat ref
    lastBeatRef.current = 0; 
    audioService.start(song.bpm, song.notes);
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      audioService.stop();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [song, gameLoop]);

  // Render Helpers
  const renderLane = (laneDir: Direction, isPlayer: boolean) => {
    // Filter visible notes
    const visibleNotes = notesRef.current.filter(n => 
      n.direction === laneDir && 
      n.type === (isPlayer ? 'player' : 'opponent') &&
      !n.hit &&
      // Only render notes within visual range (approx -200ms to +1500ms relative to now)
      n.time > currentTime - 200 &&
      n.time < currentTime + 1500
    );

    return (
      <div className="relative w-16 h-full mx-1">
        {/* Receptor */}
        <Arrow 
            direction={laneDir} 
            y={0} 
            staticArrow 
            pressed={isPlayer ? pressedKeysRef.current[laneDir] : opponentPose === laneDir} 
            isOpponent={!isPlayer}
            skin={settings.noteSkin}
        />
        
        {/* Notes */}
        {visibleNotes.map(note => {
           // Calculate Y position
           const timeDiff = note.time - currentTime;
           const yPos = 60 + (timeDiff * NOTE_SPEED); // 60 is receptor offset
           
           return (
             <Arrow 
                key={note.id} 
                direction={note.direction} 
                y={yPos}
                isOpponent={!isPlayer}
                skin={settings.noteSkin}
             />
           );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full h-full relative ${song.color ? '' : 'bg-gray-900'} overflow-hidden font-mono text-white select-none`}>
      
      {/* Dynamic Background */}
      <div 
        className={`absolute inset-0 opacity-80 ${beatToggle ? 'scale-[1.01]' : 'scale-100'} transition-transform duration-75`}
        style={{ backgroundColor: song.color || '#111827' }}
      >
          {/* Floor */}
          <div className="absolute bottom-0 w-full h-1/4 bg-black bg-opacity-40"></div>
          {/* Stage Lights */}
          <div className="absolute top-0 w-full flex justify-around opacity-30">
             <div className="w-20 h-96 bg-gradient-to-b from-white to-transparent blur-xl"></div>
             <div className="w-20 h-96 bg-gradient-to-b from-white to-transparent blur-xl"></div>
          </div>
      </div>

      {/* UI HUD Layer */}
      <div className="absolute top-4 w-full flex flex-col items-center z-50">
        <HealthBar health={gameState.health} iconP="" iconO="" />
        <div className="mt-2 text-xl font-bold drop-shadow-md">
           Score: {gameState.score} | Misses: {gameState.misses}
        </div>
        <div className="text-sm font-bold uppercase mt-1 px-3 py-1 bg-black bg-opacity-50 rounded-full">
            {song.difficulty}
        </div>
      </div>

      {/* Characters Layer */}
      <div className="absolute inset-0 flex justify-center items-end pb-32 z-10">
          
          {/* Opponent (Left) */}
          <div className="mr-32 relative">
             <Character type="antagonist" pose={opponentPose} beat={beatToggle} />
          </div>

          {/* Girlfriend (Middle/Back) */}
          <div className="mb-20 mx-4 opacity-90 scale-75">
             <Character type="support" pose="idle" beat={beatToggle} />
          </div>

          {/* Player (Right) */}
          <div className="ml-32 relative">
             <Character type="protagonist" pose={playerPose} beat={beatToggle} />
          </div>
      </div>

      {/* Note Lanes Layer (Top Overlay) */}
      <div className="absolute inset-0 flex justify-between px-10 z-30 pt-4 pointer-events-none">
          {/* Opponent Lanes */}
          <div className="flex">
             {DIRECTIONS.map(d => <div key={`opp-${d}`}>{renderLane(d, false)}</div>)}
          </div>

          {/* Player Lanes */}
          <div className="flex">
             {DIRECTIONS.map(d => <div key={`plr-${d}`}>{renderLane(d, true)}</div>)}
          </div>
      </div>
    </div>
  );
};

export default GameEngine;
