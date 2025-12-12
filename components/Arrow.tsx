import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, Octagon } from 'lucide-react';
import { Direction, ARROW_COLORS, NoteSkin } from '../types';

interface ArrowProps {
  direction: Direction;
  y: number;
  staticArrow?: boolean;
  pressed?: boolean;
  isOpponent?: boolean;
  skin?: NoteSkin;
}

const Arrow: React.FC<ArrowProps> = ({ direction, y, staticArrow, pressed, isOpponent, skin = 'Normal' }) => {
  const size = 64; // px
  
  const getIcon = () => {
    // Skin Logic
    if (skin === 'Circle') {
       return <Circle size={size} strokeWidth={3} fill="currentColor" fillOpacity={0.3} />;
    }
    
    if (skin === 'Crystal') {
      return <Octagon size={size} strokeWidth={3} fill="currentColor" fillOpacity={0.5} className="rotate-45" />;
    }

    if (skin === 'Futuristic') {
        switch(direction) {
            case 'left': return <ChevronsLeft size={size} strokeWidth={3} />;
            case 'down': return <ChevronsDown size={size} strokeWidth={3} />;
            case 'up': return <ChevronsUp size={size} strokeWidth={3} />;
            case 'right': return <ChevronsRight size={size} strokeWidth={3} />;
        }
    }

    // Default 'Normal'
    switch(direction) {
      case 'left': return <ChevronLeft size={size} strokeWidth={3} />;
      case 'down': return <ChevronDown size={size} strokeWidth={3} />;
      case 'up': return <ChevronUp size={size} strokeWidth={3} />;
      case 'right': return <ChevronRight size={size} strokeWidth={3} />;
    }
  };

  const colorClass = isOpponent && !staticArrow ? 'text-gray-400' : ARROW_COLORS[direction];
  
  // Visual tweaks for static receptors vs moving notes
  const baseStyle = `absolute transform -translate-x-1/2 will-change-transform ${colorClass}`;
  
  // Static Receptors
  if (staticArrow) {
    return (
      <div 
        className={`${baseStyle} ${pressed ? 'brightness-150 scale-95' : 'opacity-80'}`}
        style={{ top: '60px', left: '50%' }}
      >
        <div className="bg-gray-800 bg-opacity-50 rounded-full p-1 border-4 border-current">
          {getIcon()}
        </div>
      </div>
    );
  }

  // Moving Notes
  // Notes originate from bottom (large Y) and move to top (small Y)
  return (
    <div 
      className={`${baseStyle} drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]`}
      style={{ 
        top: `${y}px`, 
        left: '50%',
        // Optimization: hide if off screen significantly
        display: y < -100 || y > 1000 ? 'none' : 'block'
      }}
    >
      <div className={`bg-white text-black p-0.5 border-2 border-current ${skin === 'Circle' ? 'rounded-full' : 'rounded-lg'}`}>
         {/* Inner colored part */}
         <div className={`text-white ${colorClass} bg-current ${skin === 'Circle' ? 'rounded-full' : 'rounded-md'}`}>
           {getIcon()}
         </div>
      </div>
    </div>
  );
};

export default React.memo(Arrow);
