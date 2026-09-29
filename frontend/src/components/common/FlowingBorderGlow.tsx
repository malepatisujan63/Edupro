import React from 'react';

interface FlowingBorderGlowProps {
  isActive: boolean;
  borderRadius?: string;
  intensity?: 'normal' | 'vivid';
  className?: string;
}

const getLayerRadii = (baseRadius: string) => {
  if (baseRadius === 'rounded-full') {
    return {
      outer: 'rounded-full',
      mid: 'rounded-full',
      inner: 'rounded-full',
    };
  }
  if (baseRadius.includes('rounded-[28px]')) {
    return {
      outer: 'rounded-[36px]',
      mid: 'rounded-[32px]',
      inner: 'rounded-[29px]',
    };
  }
  if (baseRadius.includes('rounded-[32px]')) {
    return {
      outer: 'rounded-[40px]',
      mid: 'rounded-[36px]',
      inner: 'rounded-[33px]',
    };
  }
  if (baseRadius.includes('rounded-3xl')) {
    return {
      outer: 'rounded-[32px]',
      mid: 'rounded-[28px]',
      inner: 'rounded-[25px]',
    };
  }
  if (baseRadius.includes('rounded-2xl')) {
    return {
      outer: 'rounded-[24px]',
      mid: 'rounded-[20px]',
      inner: 'rounded-[17px]',
    };
  }
  return {
    outer: baseRadius,
    mid: baseRadius,
    inner: baseRadius,
  };
};

export const FlowingBorderGlow: React.FC<FlowingBorderGlowProps> = ({
  isActive,
  borderRadius = 'rounded-full',
  intensity = 'vivid',
  className = '',
}) => {
  if (!isActive) return null;

  const radii = getLayerRadii(borderRadius);

  return (
    <div className={`absolute inset-0 pointer-events-none select-none z-0 ${className}`}>
      {/* ── LAYER 1: OUTER 8PX AMBIENT GLOW (SOFT RADIAL AURA) ── */}
      <div
        className={`absolute -inset-[8px] ${radii.outer}`}
        style={{
          filter: 'blur(8px)',
          opacity: intensity === 'vivid' ? 0.95 : 0.75,
        }}
      >
        <div
          className={`w-full h-full ${radii.outer} relative overflow-hidden`}
          style={{
            padding: '8px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 rounded-full animate-flow-glow-spin pointer-events-none"
            style={{
              width: 'max(260%, 1800px)',
              height: 'max(260%, 1800px)',
              aspectRatio: '1 / 1',
              background:
                'conic-gradient(from 0deg, #12BEF9 0%, #1A75F2 25%, #7544EC 50%, #BC5AFC 75%, #12BEF9 100%)',
            }}
          />
        </div>
      </div>

      {/* ── LAYER 2: MID-CORE 4PX VIVID LUMINOUS GLOW ── */}
      <div
        className={`absolute -inset-[4px] ${radii.mid}`}
        style={{
          filter: 'blur(3.5px)',
          opacity: intensity === 'vivid' ? 0.95 : 0.85,
        }}
      >
        <div
          className={`w-full h-full ${radii.mid} relative overflow-hidden`}
          style={{
            padding: '4px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 rounded-full animate-flow-glow-spin pointer-events-none"
            style={{
              width: 'max(260%, 1800px)',
              height: 'max(260%, 1800px)',
              aspectRatio: '1 / 1',
              background:
                'conic-gradient(from 0deg, #12BEF9 0%, #1A75F2 25%, #7544EC 50%, #BC5AFC 75%, #12BEF9 100%)',
            }}
          />
        </div>
      </div>

      {/* ── LAYER 3: SHARP NEON EDGE (1.5PX CRISP LINE) ── */}
      <div
        className={`absolute -inset-[1.5px] ${radii.inner}`}
        style={{
          filter: 'blur(0.8px)',
          opacity: 1,
        }}
      >
        <div
          className={`w-full h-full ${radii.inner} relative overflow-hidden`}
          style={{
            padding: '1.5px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 rounded-full animate-flow-glow-spin pointer-events-none"
            style={{
              width: 'max(260%, 1800px)',
              height: 'max(260%, 1800px)',
              aspectRatio: '1 / 1',
              background:
                'conic-gradient(from 0deg, #12BEF9 0%, #1A75F2 25%, #7544EC 50%, #BC5AFC 75%, #12BEF9 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
