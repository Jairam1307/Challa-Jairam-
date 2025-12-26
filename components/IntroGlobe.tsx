import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface IntroGlobeProps {
  onEnter: () => void;
}

const IntroGlobe: React.FC<IntroGlobeProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Setup D3 Projection
    const projection = d3.geoOrthographic()
      .scale(height / 2.5)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath(projection, context);

    // Create a sphere grid
    const graticule = d3.geoGraticule10();
    
    // Stars background
    const stars = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      opacity: Math.random()
    }));

    let rotation = 0;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      
      context.clearRect(0, 0, width, height);

      // Draw Stars
      stars.forEach(star => {
        context.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        context.beginPath();
        context.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
        context.fill();
      });

      // Update Rotation
      rotation += 0.2;
      projection.rotate([rotation, -15]);

      // Draw Globe Atmosphere Glow
      const gradient = context.createRadialGradient(
        width / 2, height / 2, height / 2.5,
        width / 2, height / 2, height / 2.2
      );
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      // Draw Globe Water (Background circle)
      context.beginPath();
      path({ type: 'Sphere' } as any);
      context.fillStyle = '#02040a';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#00f0ff';
      context.stroke();

      // Draw Graticule (Grid)
      context.beginPath();
      path(graticule as any);
      context.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      context.lineWidth = 1;
      context.stroke();

      // Draw Horizon Glow
      context.shadowBlur = 20;
      context.shadowColor = '#00f0ff';
      
      requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      projection.scale(height / 2.5).translate([width / 2, height / 2]);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center cursor-pointer group" onClick={onEnter}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      <div className="z-10 text-center select-none transition-transform duration-700 group-hover:scale-105">
        <h1 className="text-8xl md:text-9xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 tracking-wider mb-4 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
          ROTATER
        </h1>
        <p className="text-cyan-200 font-exo text-lg md:text-2xl tracking-[0.3em] uppercase opacity-80 mb-12">
          Turning Earth Data into Climate Intelligence
        </p>
        
        <div className="animate-pulse mt-8">
          <span className="font-orbitron text-cyan-400 border border-cyan-500/50 px-6 py-3 rounded-full bg-cyan-900/20 backdrop-blur-md hover:bg-cyan-500/20 transition-all">
            INITIALIZE SYSTEM
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-10 text-xs text-gray-500 font-mono">
        SYSTEM: ONLINE<br/>
        SATELLITE LINK: ACTIVE<br/>
        DATA STREAM: CONNECTED
      </div>
    </div>
  );
};

export default IntroGlobe;