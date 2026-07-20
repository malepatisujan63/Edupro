import React from 'react';

interface KoinexaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const KoinexaLogo: React.FC<KoinexaLogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-14',
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
