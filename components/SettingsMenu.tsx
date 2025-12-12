import React, { useState, useEffect } from 'react';
import { GameSettings, Direction, NoteSkin } from '../types';
import { DIRECTIONS } from '../constants';
import { ArrowLeft, Circle, Octagon, ChevronUp, ChevronsUp, Download } from 'lucide-react';
import { audioService } from '../services/audioEngine';

interface SettingsMenuProps {
  settings: GameSettings;
  onUpdate: (newSettings: GameSettings) => void;
  onBack: () => void;
  installPrompt?: any;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdate, onBack, installPrompt }) => {
  const [bindingKey, setBindingKey] = useState<Direction | null>(null);

  const playHover = () => audioService.playSFX('scroll');
  const playSelect = () => audioService.playSFX('confirm');

  const updateSkin = (skin: NoteSkin) => {
    playSelect();
    onUpdate({ ...settings, noteSkin: skin });
  };

  const handleInstall = () => {
    if (installPrompt) {
        playSelect();
        installPrompt.prompt();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (bindingKey) {
        e.preventDefault();
        playSelect();
        const newSettings = {
          ...settings,
          keys: {
            ...settings.keys,
            [bindingKey]: e.key
          }
        };
        onUpdate(newSettings);
        setBindingKey(null);
      }
    };

    if (bindingKey) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindingKey, settings, onUpdate]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-y-auto py-10">
      <h2 className="text-5xl font-black mb-10 text-pink-500 italic drop-shadow-lg">CONFIGURAÇÕES</h2>

      <div className="bg-gray-800 p-8 rounded-xl border-4 border-gray-600 w-full max-w-2xl shadow-2xl space-y-8">
        
        {/* Install App (Only if available) */}
        {installPrompt && (
           <div className="flex items-center justify-between border-b border-gray-700 pb-6">
              <div>
                <div className="text-2xl font-bold text-cyan-400">Instalar Jogo</div>
                <div className="text-gray-400 text-sm">Baixar executável/App para Desktop</div>
              </div>
              <button 
                onMouseEnter={playHover}
                onClick={handleInstall}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 animate-pulse"
              >
                 <Download size={20} />
                 INSTALAR
              </button>
           </div>
        )}

        {/* Ghost Tapping */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-6">
          <div>
            <div className="text-2xl font-bold">Ghost Tapping</div>
            <div className="text-gray-400 text-sm">Não perde vida ao clicar sem nota</div>
          </div>
          <button 
            onMouseEnter={playHover}
            onClick={() => {
                playSelect();
                onUpdate({ ...settings, ghostTapping: !settings.ghostTapping });
            }}
            className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${settings.ghostTapping ? 'bg-green-500' : 'bg-red-500'}`}
          >
             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-200 ${settings.ghostTapping ? 'left-9' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Note Skin Selector */}
        <div className="border-b border-gray-700 pb-6">
            <div className="text-2xl font-bold mb-4">Design das Setas</div>
            <div className="grid grid-cols-4 gap-2">
                {/* Normal */}
                <button 
                  onMouseEnter={playHover}
                  onClick={() => updateSkin('Normal')}
                  className={`p-4 rounded-lg flex flex-col items-center border-2 ${settings.noteSkin === 'Normal' ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                    <ChevronUp size={32} />
                    <span className="text-xs mt-2">Normal</span>
                </button>
                {/* Circle */}
                <button 
                  onMouseEnter={playHover}
                  onClick={() => updateSkin('Circle')}
                  className={`p-4 rounded-lg flex flex-col items-center border-2 ${settings.noteSkin === 'Circle' ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                    <Circle size={32} />
                    <span className="text-xs mt-2">Circulo</span>
                </button>
                {/* Futuristic */}
                <button 
                  onMouseEnter={playHover}
                  onClick={() => updateSkin('Futuristic')}
                  className={`p-4 rounded-lg flex flex-col items-center border-2 ${settings.noteSkin === 'Futuristic' ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                    <ChevronsUp size={32} />
                    <span className="text-xs mt-2">Futuro</span>
                </button>
                {/* Crystal */}
                <button 
                  onMouseEnter={playHover}
                  onClick={() => updateSkin('Crystal')}
                  className={`p-4 rounded-lg flex flex-col items-center border-2 ${settings.noteSkin === 'Crystal' ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 hover:bg-gray-700'}`}
                >
                    <Octagon size={32} className="rotate-45" />
                    <span className="text-xs mt-2">Cristal</span>
                </button>
            </div>
        </div>

        {/* Keybindings */}
        <div>
          <div className="text-2xl font-bold mb-4">Controles</div>
          <div className="grid grid-cols-4 gap-4">
            {DIRECTIONS.map((dir) => (
              <div key={dir} className="flex flex-col items-center">
                <span className="uppercase text-gray-400 mb-2 font-bold text-sm">{dir}</span>
                <button
                  onMouseEnter={playHover}
                  onClick={() => {
                      playSelect();
                      setBindingKey(dir);
                  }}
                  className={`w-full py-4 rounded-lg font-mono text-xl border-2 transition-all ${
                    bindingKey === dir 
                      ? 'bg-yellow-500 border-yellow-300 text-black animate-pulse' 
                      : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {bindingKey === dir ? '...' : settings.keys[dir].toUpperCase()}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <button 
        onMouseEnter={playHover}
        onClick={() => {
            audioService.playSFX('back');
            onBack();
        }}
        className="mt-10 flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>
    </div>
  );
};

export default SettingsMenu;