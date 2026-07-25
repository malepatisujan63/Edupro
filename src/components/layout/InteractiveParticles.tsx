import React, { useEffect, useRef } from 'react';

// Koinexa gradient colors
const COLORS = ['#00CFFF', '#4169E1', '#9B5DE5'];

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    
    // Spread velocity to create a "cone" effect
    const spread = 1.5;
    this.vx = vx + (Math.random() - 0.5) * spread;
    this.vy = vy + (Math.random() - 0.5) * spread;
    
    this.size = Math.random() * 3 + 1.5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    this.maxLife = Math.random() * 60 + 60; // 60-120 frames
    this.life = this.maxLife;
  }

  update() {
    // Smooth curve math (slight constant force simulating anti-gravity/wind)
    // Friction (slow down initial burst)
    this.vx *= 0.92;
    this.vy *= 0.92;
    
    // Anti-gravity (float up)
    this.vy -= 0.03;

    // Add some organic wave motion
    this.x += Math.sin(this.life * 0.1) * 1.0;

    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const progress = this.life / this.maxLife;
    const currentSize = Math.max(0, this.size * progress);
    if (currentSize <= 0) return;
    const opacity = progress * 0.8; // Max opacity 0.8 for glow effect

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.color;
    
    // Add glow
    ctx.globalAlpha = opacity * 0.2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize * 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const InteractiveParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Track mouse
    let mouse = {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
      isActive: false,
      lastX: 0,
      lastY: 0,
      vx: 0,
      vy: 0
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
      
      // Calculate mouse velocity for emission direction
      mouse.vx = mouse.x - mouse.lastX;
      mouse.vy = mouse.y - mouse.lastY;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
    };

    // Initialize
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const render = () => {
      // Clear with slight trailing effect (optional, full clear is cleaner for these particles)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Emit particles if mouse is moving
      if (mouse.isActive && (Math.abs(mouse.vx) > 1 || Math.abs(mouse.vy) > 1)) {
        // Base emission opposite to mouse movement (cone shape backwards)
        // Normalize velocity
        const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
        const dirX = speed > 0 ? (mouse.vx / speed) : 0;
        const dirY = speed > 0 ? (mouse.vy / speed) : 0;
        
        // Emit multiple particles per frame
        for (let i = 0; i < 3; i++) {
          particles.push(new Particle(
            mouse.x, 
            mouse.y, 
            -dirX * (Math.random() * 2 + 1), // burst backwards
            -dirY * (Math.random() * 2 + 1)
          ));
        }
      } else if (mouse.isActive) {
        // Emit gently drifting particles if mouse is still but active (hovering)
        for (let i = 0; i < 1; i++) {
          particles.push(new Particle(
            mouse.x, 
            mouse.y, 
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5 - 1 // drift up slightly
          ));
        }
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Decay mouse velocity so it doesn't emit indefinitely if mouse stops firing events
      mouse.vx *= 0.9;
      mouse.vy *= 0.9;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1 // Above deep space background, below UI
      }}
    />
  );
};



