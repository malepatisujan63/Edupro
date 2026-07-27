import React from 'react';

interface KoinexaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const KoinexaLogo: React.FC<KoinexaLogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-14 md:h-16', // significantly scaled up
    md: 'h-16 md:h-20',
    lg: 'h-24 md:h-32',
    xl: 'h-36 md:h-44',
  };

  return (
    <img 
      src="/koinexa-logo.png" 
      alt="Koinexa Logo" 
      className={`${sizes[size]} w-auto object-contain select-none ${className}`} 
      draggable={false}
    />
  );
};
