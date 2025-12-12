import React from 'react';
import { Direction } from '../types';

interface CharacterProps {
  type: 'protagonist' | 'antagonist' | 'support';
  pose: Direction | 'idle' | 'miss';
  beat: boolean; // Toggle for idle bobbing
}

const Character: React.FC<CharacterProps> = ({ type, pose, beat }) => {
  // Squash and Stretch animation logic
  // When beat is true, we squash (scale Y down, X up)
  // When beat is false, we return to normal or slight stretch
  const squashClass = beat ? 'scale-y-90 scale-x-110 translate-y-2' : 'scale-y-100 scale-x-100 translate-y-0';
  
  // Color/Style mapping
  const styles = {
    protagonist: {
      body: 'fill-blue-500',
      hat: 'fill-red-500',
      acc: 'fill-gray-800', // Mic
      face: 'fill-blue-200'
    },
    antagonist: {
      body: 'fill-purple-700',
      hat: 'fill-transparent', // No hat usually
      acc: 'fill-yellow-400', // Gold chain/eyes
      face: 'fill-purple-300'
    },
    support: {
      body: 'fill-red-700', // Dress
      hat: 'fill-amber-700', // Hair
      acc: 'fill-gray-900', // Speakers
      face: 'fill-orange-200'
    }
  };

  const style = styles[type];
  
  const getPoseTransform = () => {
    switch(pose) {
      case 'left': return 'translate(-20, 0) skewX(-5deg)';
      case 'right': return 'translate(20, 0) skewX(5deg)';
      case 'up': return 'translate(0, -20) scaleY(1.1)';
      case 'down': return 'translate(0, 20) scaleY(0.9)';
      case 'miss': return 'rotate-12 opacity-50 grayscale'; 
      default: return 'translate(0, 0)';
    }
  };

  return (
    <div className={`relative transition-transform duration-100 origin-bottom ${squashClass}`}>
      <svg width="200" height="250" viewBox="0 0 200 250" className={`transition-transform duration-75 ${getPoseTransform()}`}>
        {/* Shadow */}
        <ellipse cx="100" cy="230" rx="60" ry="10" fill="rgba(0,0,0,0.5)" />
        
        {type === 'support' ? (
           // Girl on Speakers
           <g>
             <rect x="20" y="100" width="160" height="120" fill="#333" stroke="#555" strokeWidth="4" rx="5" />
             <circle cx="100" cy="160" r="40" fill="#222" />
             {/* Character */}
             <circle cx="100" cy="90" r="30" className={style.face} />
             <path d="M70,120 Q100,180 130,120" className={style.body} /> 
             {/* Hair */}
             <path d="M60,90 Q100,20 140,90 Q160,150 140,150" fill="none" stroke={style.hat.replace('fill-', '')} strokeWidth="20" />
           </g>
        ) : (
           // Singer
           <g>
             {/* Body */}
             <rect x="70" y="120" width="60" height="80" rx="10" className={style.body} />
             {/* Head */}
             <circle cx="100" cy="90" r="35" className={style.face} />
             
             {/* Hat / Hair */}
             {type === 'protagonist' && (
                <path d="M60,85 L140,85 L120,50 L80,50 Z" className={style.hat} />
             )}
             {type === 'antagonist' && (
                <path d="M65,70 Q100,40 135,70" fill="none" stroke="black" strokeWidth="5" /> // Horns/Hair spikes
             )}

             {/* Eyes */}
             <circle cx="90" cy="85" r="5" fill="black" />
             <circle cx="110" cy="85" r="5" fill="black" />
             {pose === 'miss' && type === 'protagonist' && (
               <path d="M85,80 L95,90 M95,80 L85,90" stroke="blue" strokeWidth="2" /> // X eyes
             )}

             {/* Mouth - Changes with input */}
             {pose === 'up' ? <ellipse cx="100" cy="105" rx="10" ry="15" fill="black" /> : 
              pose === 'down' ? <path d="M90,100 Q100,110 110,100" fill="none" stroke="black" strokeWidth="3" /> :
              <rect x="90" y="100" width="20" height="5" fill="black" /> }

             {/* Accessories */}
             {type === 'protagonist' && (
               <rect x="120" y="130" width="15" height="30" rx="5" fill="gray" stroke="black" /> // Mic
             )}
             {type === 'antagonist' && (
               <circle cx="100" cy="90" r="40" fill="none" stroke="purple" strokeWidth="2" opacity="0.3" /> // Aura
             )}
           </g>
        )}
      </svg>
    </div>
  );
};

export default Character;