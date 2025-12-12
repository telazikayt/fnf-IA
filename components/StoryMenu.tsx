import React, { useState } from 'react';
import { WEEKS } from '../services/songData';
import { Difficulty, Week } from '../types';
import { ArrowLeft, ArrowRight, Skull, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { audioService } from '../services/audioEngine';

interface StoryMenuProps {
  onSelect: (week: Week, difficulty: Difficulty) => void;
  onBack: () => void;
}

const StoryMenu: React.FC<StoryMenuProps> = ({ onSelect, onBack }) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');

  const currentWeek = WEEKS[selectedWeekIndex];

  const handleScroll = (delta: number) => {
    audioService.playSFX('scroll');
    let nextIndex = selectedWeekIndex + delta;
    if (nextIndex < 0) nextIndex = WEEKS.length - 1;
    if (nextIndex >= WEEKS.length) nextIndex = 0;
    setSelectedWeekIndex(nextIndex);
  };

  const handleDifficulty = (delta: number) => {
    audioService.playSFX('scroll');
    const diffs: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Expert'];
    let idx = diffs.indexOf(difficulty) + delta;
    if (idx < 0) idx = diffs.length - 1;
    if (idx >= diffs.length) idx = 0;
    setDifficulty(diffs[idx]);
  };

  const handleConfirm = () => {
    audioService.playSFX('confirm');
    onSelect(currentWeek, difficulty);
  };

  const getDifficultyColor = () => {
    switch(difficulty) {
        case 'Easy': return 'text-green-400';
        case 'Normal': return 'text-yellow-400';
        case 'Hard': return 'text-red-500';
        case 'Expert': return 'text-purple-500';
    }
  };

  const getDifficultyIcon = () => {
    switch(difficulty) {
        case 'Easy': return <ShieldCheck size={40} />;
        case 'Normal': return <Zap size={40} />;
        case 'Hard': return <AlertTriangle size={40} />;
        case 'Expert': return <Skull size={40} />;
    }
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col overflow-hidden relative">
      
      {/* Dynamic Background based on Week */}
      <div className={`absolute inset-0 transition-colors duration-500 opacity-40 ${currentWeek.backgroundTheme}`}></div>

      {/* Header */}
      <div className="z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black to-transparent">
         <h1 className="text-4xl font-black italic">MODO HISTÓRIA</h1>
         <div className="text-xl font-mono">PONTUAÇÃO SEMANA: 0</div>
      </div>

      <div className="flex-1 flex z-10">
        
        {/* Left: Week List */}
        <div className="w-1/2 flex flex-col items-center justify-center space-y-4">
            {WEEKS.map((week, idx) => {
                const isSelected = idx === selectedWeekIndex;
                return (
                    <div 
                        key={week.id}
                        className={`transition-all duration-300 transform ${isSelected ? 'scale-110 opacity-100 translate-x-10' : 'scale-90 opacity-40'}`}
                    >
                        <div 
                           className="text-4xl font-black uppercase tracking-wider italic drop-shadow-lg"
                           style={{ 
                               color: isSelected ? week.color : '#ccc',
                               textShadow: isSelected ? `0 0 20px ${week.color}` : 'none'
                           }}
                        >
                            {week.name}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Right: Character & Difficulty */}
        <div className="w-1/2 flex flex-col items-center justify-center relative">
            
            {/* Character Placeholder (Colored Box for now representing antagonist) */}
            <div 
                className="w-64 h-80 mb-10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center transition-colors duration-500"
                style={{ backgroundColor: currentWeek.color }}
            >
                <span className="text-6xl font-black mix-blend-multiply opacity-50">{currentWeek.antagonist}</span>
            </div>

            {/* Difficulty Selector */}
            <div className="bg-gray-900 border-4 border-gray-600 rounded-xl p-6 w-80 flex flex-col items-center relative">
                <div className="absolute -top-6 bg-black px-4 py-1 rounded border border-gray-600 font-bold uppercase tracking-widest text-sm text-gray-400">
                    Dificuldade
                </div>
                
                <div className="flex items-center justify-between w-full mb-2">
                   <button onClick={() => handleDifficulty(-1)} className="hover:scale-125 transition-transform">
                       <ArrowLeft size={32} />
                   </button>
                   
                   <div className={`flex flex-col items-center ${getDifficultyColor()}`}>
                       {getDifficultyIcon()}
                       <span className="text-2xl font-black uppercase mt-2">{difficulty === 'Expert' ? 'Extremo' : difficulty === 'Easy' ? 'Fácil' : difficulty === 'Normal' ? 'Normal' : 'Difícil'}</span>
                   </div>

                   <button onClick={() => handleDifficulty(1)} className="hover:scale-125 transition-transform">
                       <ArrowRight size={32} />
                   </button>
                </div>
            </div>

            <div className="mt-8 bg-black bg-opacity-70 p-4 rounded text-center max-w-md text-gray-300 italic border-l-4" style={{ borderColor: currentWeek.color }}>
                {currentWeek.description}
            </div>

        </div>
      </div>

      {/* Footer Controls */}
      <div className="z-10 p-10 flex justify-between items-end bg-gradient-to-t from-black to-transparent">
          <button 
             onClick={() => {
                 audioService.playSFX('back');
                 onBack();
             }}
             className="text-2xl font-bold hover:text-red-500 transition-colors"
          >
              VOLTAR
          </button>
          
          <div className="flex flex-col items-end">
             <div className="text-gray-400 text-sm mb-2">Use as setas para navegar</div>
             <button 
                onClick={handleConfirm}
                className="px-8 py-3 bg-white text-black text-2xl font-black rounded hover:scale-110 transition-transform uppercase"
             >
                 Começar Semana
             </button>
          </div>
      </div>

      {/* Invisible Overlay for Keyboard Nav */}
      <div 
         className="absolute inset-0 outline-none" 
         tabIndex={0} 
         autoFocus
         onKeyDown={(e) => {
             if (e.key === 'ArrowUp') handleScroll(-1);
             if (e.key === 'ArrowDown') handleScroll(1);
             if (e.key === 'ArrowLeft') handleDifficulty(-1);
             if (e.key === 'ArrowRight') handleDifficulty(1);
             if (e.key === 'Enter') handleConfirm();
             if (e.key === 'Escape') onBack();
         }}
      />
    </div>
  );
};

export default StoryMenu;
