import React, { useState } from 'react';
import { DialogueLine } from '../types';

interface DialogueOverlayProps {
  dialogue: DialogueLine[];
  onComplete: () => void;
}

const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ dialogue, onComplete }) => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < dialogue.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  const currentLine = dialogue[index];
  const isLeft = currentLine.side === 'left';

  return (
    <div 
      className="absolute inset-0 z-[60] bg-black bg-opacity-70 flex flex-col justify-end pb-10"
      onClick={handleNext}
    >
      <div className="w-full max-w-4xl mx-auto relative px-4">
        {/* Character Portrait Placeholder */}
        <div className={`absolute bottom-full mb-4 ${isLeft ? 'left-10' : 'right-10'}`}>
             <div className={`w-40 h-40 ${isLeft ? 'bg-purple-600' : 'bg-blue-500'} rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center text-4xl`}>
                {isLeft ? '😈' : '🧢'}
             </div>
        </div>

        {/* Text Box */}
        <div className="bg-gray-900 border-4 border-white p-6 rounded-xl shadow-2xl relative">
          <h3 className={`text-xl font-bold mb-2 ${isLeft ? 'text-purple-400 text-left' : 'text-blue-400 text-right'}`}>
            {currentLine.character}
          </h3>
          <p className="text-2xl text-white font-mono leading-relaxed">
            {currentLine.text}
          </p>
          <div className="absolute bottom-4 right-4 text-sm text-gray-400 animate-pulse">
            Clique para continuar...
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueOverlay;
