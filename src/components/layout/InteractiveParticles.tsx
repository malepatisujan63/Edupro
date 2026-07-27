import React, { useEffect, useRef } from 'react';

// Premium Koinexa Glow Colors
const COLORS = ['#00CFFF', '#4169E1', '#9B5DE5', '#F91880', '#00F0FF'];

class NodeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 2 + 0.5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  update(width: number, height: number, mouse: any) {
    // Mouse Interaction: Subtle repel
    if (mouse.isActive) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.vx -= (dx / dist) * force * 0.02;
        this.vy -= (dy / dist) * force * 0.02;
      }
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges gently
    if (this.x < 0) { this.x = 0; this.vx *= -1; }
    if (this.x > width) { this.x = width; this.vx *= -1; }
    if (this.y < 0) { this.y = 0; this.vy *= -1; }
    if (this.y > height) { this.y = height; this.vy *= -1; }
    
    // Friction to stabilize speed after mouse interaction
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    } else if (speed < 0.1) {
      this.vx *= 1.05;
      this.vy *= 1.05;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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
    let particles: NodeParticle[] = [];
    
    let mouse = { x: -1000, y: -1000, isActive: false };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Calculate density for constellation network
      const targetCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
      
      particles = [];
      for (let i = 0; i < targetCount; i++) {
        particles.push(new NodeParticle(canvas.width, canvas.height));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const target = e.target as HTMLElement;
      const isUI = target.closest('.kx-feed-card, .kx-resource-card, .kx-dsa-hud, .card, nav, header, button, a, input, textarea, .modal, .glass-panel');
      mouse.isActive = !isUI;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      // Clear canvas each frame for clean animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw dark background directly on canvas to ensure smooth transitions
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'screen';

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(155, 93, 229, ${0.2 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw connection to mouse
      if (mouse.isActive) {
        for (let i = 0; i < particles.length; i++) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 207, 255, ${0.3 * (1 - dist / 200)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach(p => {
        p.update(canvas.width, canvas.height, mouse);
        p.draw(ctx);
      });

      // Draw subtle ambient glow under the mouse
      if (mouse.isActive) {
        const coreGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
        coreGrad.addColorStop(0, 'rgba(0, 207, 255, 0.08)');
        coreGrad.addColorStop(0.5, 'rgba(155, 93, 229, 0.03)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 250, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }
      
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
      className="absolute inset-0 pointer-events-none z-0" 
      style={{ opacity: 1 }}
    />
  );
};
