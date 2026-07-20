import React from 'react';

interface KoinexaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const KoinexaLogo: React.FC<KoinexaLogoProps> = ({ className = '', size = 'md' }) => {
  // Size mapping for the 'K' mark
  const sizes = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-8 h-8 text-xl',
    lg: 'w-10 h-10 text-2xl',
    xl: 'w-14 h-14 text-4xl',
  };

  // Size mapping for the text
  const textSizes = {
    sm: 'text-[1.1rem]',
    md: 'text-[1.35rem]',
    lg: 'text-[1.75rem]',
    xl: 'text-[2.2rem]',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ── Visual 'K' Mark matching the uploaded logo ── */}
      <div className={`relative flex items-center justify-center font-black text-white shrink-0 ${sizes[size]} rounded-lg`}
           style={{ 
             background: 'linear-gradient(135deg, #00CFFF 0%, #4169E1 50%, #9B5DE5 100%)',
             boxShadow: '0 4px 14px rgba(65,105,225,0.4)',
             clipPath: 'polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 35% 45%, 100% 0, 100% 35%, 55% 55%, 100% 100%, 65% 100%, 35% 65%, 35% 100%, 0 100%)' // Approximating the 'K' shape if needed, but a standard K with custom font looks cleaner.
           }}>
        {/* We'll use a clean typographic K with the gradient background instead of clip-path for perfection */}
        <span className="z-10 tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>K</span>
        
        {/* Simulating the "stacked papers" look from the logo */}
        <div className="absolute -bottom-1 -right-1 w-full h-full rounded-lg opacity-40 z-0" 
             style={{ background: 'linear-gradient(135deg, #9B5DE5 0%, #4169E1 100%)' }} />
        <div className="absolute -bottom-2 -right-2 w-full h-full rounded-lg opacity-20 z-0" 
             style={{ background: '#9B5DE5' }} />
      </div>

      {/* ── "koinexa" Text with the gradient 'x' ── */}
      <div className={`font-bold tracking-tight text-white flex items-center ${textSizes[size]}`}
           style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <span>koine</span>
        <span style={{ 
          background: 'linear-gradient(135deg, #00CFFF 0%, #4169E1 50%, #9B5DE5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>x</span>
        <span>a</span>
      </div>
    </div>
  );
};
