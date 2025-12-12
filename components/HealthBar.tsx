import React from 'react';

interface HealthBarProps {
  health: number; // 0 to 100
  iconP: string; // url or just logic
  iconO: string;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  // Health 0 = Player Dead (Bar full of Opponent color)
  // Health 100 = Opponent Dead (Bar full of Player color)
  // 50 = Center
  
  const clampedHealth = Math.max(0, Math.min(100, health));
  
  return (
    <div className="w-[600px] h-14 bg-gray-900 border-4 border-black rounded-full relative overflow-hidden shadow-xl">
      {/* Opponent Side (Red/Purple) - Base Background */}
      <div className="absolute inset-0 bg-red-600"></div>
      
      {/* Player Side (Green/Blue) - Width varies */}
      <div 
        className="absolute right-0 top-0 bottom-0 bg-green-500 transition-all duration-200 ease-out"
        style={{ width: `${clampedHealth}%` }}
      ></div>
      
      {/* Icons attached to the split line */}
      <div 
        className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-200 ease-out flex items-center justify-center"
        style={{ right: `${clampedHealth}%`, transform: `translate(50%, -50%)` }}
      >
        {/* Opponent Icon */}
        <div className="w-12 h-12 bg-purple-700 rounded-full border-2 border-white mr-1 shadow-lg flex items-center justify-center">
             <span className="text-xl">😈</span>
        </div>
        
        {/* Player Icon */}
        <div className="w-12 h-12 bg-blue-500 rounded-full border-2 border-white ml-1 shadow-lg flex items-center justify-center">
            <span className="text-xl">🧢</span>
        </div>
      </div>
    </div>
  );
};

export default HealthBar;
