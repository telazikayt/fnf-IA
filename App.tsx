import React, { useState, useEffect } from 'react';
import { SONGS, generateSong, WEEKS } from './services/songData';
import { Song, GameSettings, Week, Difficulty } from './types';
import GameEngine from './components/GameEngine';
import DialogueOverlay from './components/DialogueOverlay';
import SettingsMenu from './components/SettingsMenu';
import StoryMenu from './components/StoryMenu';
import { audioService } from './services/audioEngine';
import { Play, Music, Settings as SettingsIcon, BookOpen } from 'lucide-react';

type AppState = 'title' | 'menu' | 'storySelect' | 'freeplay' | 'playing' | 'dialogue' | 'results' | 'settings';

const App = () => {
  const [appState, setAppState] = useState<AppState>('title');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Game End State
  const [lastScore, setLastScore] = useState(0);
  const [lastStatus, setLastStatus] = useState<'won' | 'gameover'>('won');
  
  // Story Mode State
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('Normal');
  const [storySongIndex, setStorySongIndex] = useState(0);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [totalStoryScore, setTotalStoryScore] = useState(0);

  // Global Settings
  const [settings, setSettings] = useState<GameSettings>({
    ghostTapping: false,
    noteSkin: 'Normal',
    keys: {
      left: 'ArrowLeft',
      down: 'ArrowDown',
      up: 'ArrowUp',
      right: 'ArrowRight'
    }
  });

  // SFX Wrappers
  const playHover = () => audioService.playSFX('scroll');
  const playSelect = () => audioService.playSFX('confirm');
  const playBack = () => audioService.playSFX('back');

  // Handle Title Screen Input
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (appState === 'title' && e.key === 'Enter') {
        playSelect();
        await audioService.resumeContext();
        audioService.startMenuMusic();
        setAppState('menu');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState]);

  // Handle Menu Music Logic
  useEffect(() => {
    // If we are in menu states, ensure music plays
    if (['menu', 'freeplay', 'settings', 'results', 'storySelect'].includes(appState)) {
      audioService.startMenuMusic();
    } else {
      audioService.stopMenuMusic();
    }
  }, [appState]);

  // Capture Install Prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    });
  }, []);

  // --- ACTIONS ---

  const startFreeplay = (song: Song) => {
    playSelect();
    setSelectedSong(song);
    setIsStoryMode(false);
    setAppState('playing');
  };

  const openStoryMenu = () => {
      playSelect();
      setAppState('storySelect');
  };

  const startStoryWeek = (week: Week, diff: Difficulty) => {
    setIsStoryMode(true);
    setCurrentWeek(week);
    setCurrentDifficulty(diff);
    setStorySongIndex(0);
    setTotalStoryScore(0);
    
    // Load first song
    loadStoryLevel(week, 0, diff);
  };

  const loadStoryLevel = (week: Week, index: number, diff: Difficulty) => {
    if (index >= week.songs.length) {
      // Story Complete
      setLastScore(totalStoryScore);
      setLastStatus('won');
      setAppState('results');
      return;
    }
    
    // Generate song object from metadata + difficulty
    const meta = week.songs[index];
    const song = generateSong(meta, week.color, diff);
    
    setSelectedSong(song);
    
    // Check for dialogue
    if (song.dialogue && song.dialogue.length > 0) {
      setAppState('dialogue');
    } else {
      setAppState('playing');
    }
  };

  const handleDialogueComplete = () => {
    setAppState('playing');
  };

  const handleGameEnd = (score: number, status: 'won' | 'gameover') => {
    if (status === 'gameover') {
      setLastScore(score);
      setLastStatus('gameover');
      setAppState('results');
    } else {
      if (isStoryMode && currentWeek) {
        const newScore = totalStoryScore + score;
        setTotalStoryScore(newScore);
        const nextIndex = storySongIndex + 1;
        setStorySongIndex(nextIndex);
        loadStoryLevel(currentWeek, nextIndex, currentDifficulty);
      } else {
        setLastScore(score);
        setLastStatus('won');
        setAppState('results');
      }
    }
  };

  const handleResultsBack = () => {
    playBack();
    if (isStoryMode) {
      setAppState('storySelect'); // Back to week selection
    } else {
      setAppState('freeplay'); // Back to song select
    }
  };

  // --- RENDERERS ---

  if (appState === 'title') {
    return (
      <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background flash */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
        
        <div className="z-10 text-center animate-headbang">
          <h1 className="text-8xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[8px_8px_0_rgba(0,0,0,1)] border-4 border-transparent">
            FRIDAY NIGHT
          </h1>
          <h2 className="text-7xl font-black italic tracking-tighter text-white drop-shadow-[6px_6px_0_rgba(255,0,0,1)]">
            REACT
          </h2>
        </div>
        
        <div className="absolute bottom-20 text-3xl font-bold font-mono text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          APERTE ENTER PARA COMEÇAR O JOGO
        </div>
        
        <div className="absolute bottom-5 text-gray-600 text-xs">
          v1.5 - Story Update
        </div>
      </div>
    );
  }

  if (appState === 'playing' && selectedSong) {
    return <GameEngine song={selectedSong} onExit={handleGameEnd} settings={settings} />;
  }

  if (appState === 'dialogue' && selectedSong?.dialogue) {
     return (
       <div className="relative w-full h-full">
         <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
         <DialogueOverlay dialogue={selectedSong.dialogue} onComplete={handleDialogueComplete} />
       </div>
     );
  }

  if (appState === 'storySelect') {
      return <StoryMenu onSelect={startStoryWeek} onBack={() => { playBack(); setAppState('menu'); }} />;
  }

  if (appState === 'settings') {
    return (
      <SettingsMenu 
        settings={settings} 
        onUpdate={setSettings} 
        onBack={() => { playBack(); setAppState('menu'); }} 
        installPrompt={deferredPrompt}
      />
    );
  }

  if (appState === 'results') {
    return (
      <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center font-bold relative overflow-hidden">
        <div className={`text-6xl mb-8 ${lastStatus === 'won' ? 'text-green-500' : 'text-red-600'} animate-bounce z-10`}>
           {lastStatus === 'won' ? (isStoryMode ? "SEMANA COMPLETA!" : "MÚSICA COMPLETA!") : "GAME OVER"}
        </div>
        <div className="text-3xl mb-8 z-10">Pontuação: {isStoryMode ? totalStoryScore : lastScore}</div>
        
        <button 
          onMouseEnter={playHover}
          onClick={handleResultsBack}
          className="px-8 py-4 bg-white text-black text-xl rounded-full hover:scale-110 transition-transform font-bold z-10"
        >
          {isStoryMode ? "Voltar ao Menu" : "Voltar para Seleção"}
        </button>
      </div>
    );
  }

  if (appState === 'freeplay') {
     return (
       <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center p-10 overflow-y-auto">
         <h2 className="text-4xl font-black italic text-yellow-400 mb-10 drop-shadow-lg">JOGO LIVRE</h2>
         <div className="w-full max-w-md space-y-4 pb-20">
          {SONGS.map((song) => (
            <button
              key={song.id}
              onMouseEnter={playHover}
              onClick={() => startFreeplay(song)}
              className="w-full group relative flex items-center justify-between p-4 bg-gray-800 border-l-8 border-transparent hover:border-pink-500 hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl"
              style={{ borderLeftColor: song.color }}
            >
              <div className="flex items-center">
                <div className="bg-gray-900 p-3 rounded-full mr-4 group-hover:rotate-12 transition-transform">
                  <Music size={24} color={song.color} />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">{song.name}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-widest">{song.difficulty}</div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={32} fill="white" />
              </div>
            </button>
          ))}
         </div>
         <div className="fixed bottom-0 w-full bg-gradient-to-t from-black to-transparent p-10 flex justify-center pointer-events-none">
             <button 
                onClick={() => { playBack(); setAppState('menu'); }}
                className="text-gray-400 hover:text-white underline pointer-events-auto"
             >
               Voltar
             </button>
         </div>
       </div>
     );
  }

  // --- MAIN MENU ---
  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 to-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-pink-600 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="z-10 text-center mb-10 animate-bump">
        <h1 className="text-5xl font-black italic tracking-tighter mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          FRIDAY NIGHT
        </h1>
        <h2 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[2px_2px_0_rgba(255,0,0,1)]">
          REACT
        </h2>
      </div>

      <div className="z-10 flex flex-col gap-6 w-80">
        
        {/* Story Mode */}
        <button 
          onMouseEnter={playHover}
          onClick={openStoryMenu}
          className="bg-yellow-400 text-black border-4 border-white p-4 text-2xl font-bold uppercase tracking-wider hover:scale-110 transition-transform duration-200 shadow-lg flex items-center justify-center gap-3 group"
        >
          <BookOpen size={28} className="group-hover:animate-bounce"/>
          Modo História
        </button>

        {/* Freeplay */}
        <button 
          onMouseEnter={playHover}
          onClick={() => { playSelect(); setAppState('freeplay'); }}
          className="bg-cyan-500 text-white border-4 border-white p-4 text-2xl font-bold uppercase tracking-wider hover:scale-110 transition-transform duration-200 shadow-lg flex items-center justify-center gap-3 group"
        >
          <Music size={28} className="group-hover:animate-spin" />
          Jogo Livre
        </button>

        {/* Settings */}
        <button 
          onMouseEnter={playHover}
          onClick={() => { playSelect(); setAppState('settings'); }}
          className="bg-gray-700 text-gray-200 border-4 border-gray-400 p-4 text-2xl font-bold uppercase tracking-wider hover:scale-110 transition-transform duration-200 shadow-lg flex items-center justify-center gap-3"
        >
          <SettingsIcon size={28} />
          Configurações
        </button>
      </div>
    </div>
  );
};

export default App;