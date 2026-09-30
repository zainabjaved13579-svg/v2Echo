import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithGoogle,
  clearAllCorruptCache,
  SapphireUser
} from '../services/authService';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import {
  UserCheck,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppTheme } from '../context/ThemeContext';

interface AuthProps {
  onLoginSuccess?: (user: SapphireUser) => void;
  onContinueAsGuest?: () => void;
}

// ========== NEURAL PARTICLE CLASS ==========
class Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  opacity: number;
  progress: number;
  speed: number;
  converged: boolean;
  color: string;
  phase: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      this.x = Math.random() * canvasWidth;
      this.y = -10;
    } else if (edge === 1) {
      this.x = canvasWidth + 10;
      this.y = Math.random() * canvasHeight;
    } else if (edge === 2) {
      this.x = Math.random() * canvasWidth;
      this.y = canvasHeight + 10;
    } else {
      this.x = -10;
      this.y = Math.random() * canvasHeight;
    }

    this.targetX = canvasWidth / 2 + (Math.random() - 0.5) * 400;
    this.targetY = canvasHeight / 2 + (Math.random() - 0.5) * 400;
    this.size = Math.random() * 2 + 1;
    this.opacity = 0;
    this.progress = 0;
    this.speed = 0.004 + Math.random() * 0.008;
    this.converged = false;
    this.color = Math.random() > 0.5 ? '217, 119, 87' : '230, 145, 118';
    this.phase = Math.random() * Math.PI * 2;
  }

  update(canvasWidth: number, canvasHeight: number) {
    if (!this.converged) {
      this.progress += this.speed;
      this.x = this.x + (this.targetX - this.x) * 0.02;
      this.y = this.y + (this.targetY - this.y) * 0.02;
      this.opacity = Math.min(1, this.progress * 2);
      if (this.progress >= 1) this.converged = true;
    } else {
      this.phase += 0.005;
      const time = Date.now() * 0.0003;
      const radius = 150 + Math.sin(time + this.phase) * 60;
      const angle = time + this.phase * 0.5;
      this.x = canvasWidth / 2 + Math.cos(angle) * radius;
      this.y = canvasHeight / 2 + Math.sin(angle) * radius;
      this.opacity = 0.4 + Math.sin(this.phase) * 0.3;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(${this.color}, 0.8)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const glowPosRef = useRef({ x: 0, y: 0 });
  const lastTrailTimeRef = useRef<number>(0);
  const isHoveringRef = useRef(false);
  const isClickingRef = useRef(false);
  const isLightThemeRef = useRef(!isMoon);

  // Update theme ref
  useEffect(() => {
    isLightThemeRef.current = !isMoon;
  }, [isMoon]);

  // ========== NEURAL CANVAS + CURSOR EFFECTS ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push(new Particle(canvas.width, canvas.height));
    }

    // ========== ANIMATE LOOP ==========
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear with trail
      ctx.fillStyle = isMoon ? 'rgba(21, 21, 21, 0.12)' : 'rgba(250, 247, 242, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update + draw particles
      particlesRef.current.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      // Draw connections
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const opacity = (1 - dist / 140) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(217, 119, 87, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // ========== MOUSE TRACKING ==========
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      // Create trail
      const now = Date.now();
      if (now - lastTrailTimeRef.current > 30) {
        createTrail(e.clientX, e.clientY);
        lastTrailTimeRef.current = now;
      }
    };

    // ========== CURSOR ANIMATION ==========
    const animateCursor = () => {
      const cursor = cursorRef.current;
      const glow = cursorGlowRef.current;

      if (cursor) {
        cursorPosRef.current.x += (mousePosRef.current.x - cursorPosRef.current.x) * 0.25;
        cursorPosRef.current.y += (mousePosRef.current.y - cursorPosRef.current.y) * 0.25;
        cursor.style.left = cursorPosRef.current.x + 'px';
        cursor.style.top = cursorPosRef.current.y + 'px';
      }

      if (glow) {
        glowPosRef.current.x += (mousePosRef.current.x - glowPosRef.current.x) * 0.08;
        glowPosRef.current.y += (mousePosRef.current.y - glowPosRef.current.y) * 0.08;
        glow.style.left = glowPosRef.current.x + 'px';
        glow.style.top = glowPosRef.current.y + 'px';
      }

      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // ========== MOUSE TRAIL ==========
    const createTrail = (x: number, y: number) => {
      const trail = document.createElement('div');
      trail.style.position = 'fixed';
      trail.style.width = '8px';
      trail.style.height = '8px';
      trail.style.borderRadius = '50%';
      trail.style.pointerEvents = 'none';
      trail.style.zIndex = '9998';
      trail.style.background = 'radial-gradient(circle, #d97757 0%, transparent 70%)';
      trail.style.transform = 'translate(-50%, -50%)';
      trail.style.left = x + 'px';
      trail.style.top = y + 'px';
      trail.style.opacity = '0.6';
      trail.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

      document.body.appendChild(trail);

      requestAnimationFrame(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'translate(-50%, -50%) scale(0.3)';
      });

      setTimeout(() => trail.remove(), 650);
    };

    // ========== CLICK EFFECTS ==========
    const handleMouseDown = (e: MouseEvent) => {
      isClickingRef.current = true;
      if (cursorRef.current) cursorRef.current.classList.add('clicking');

      // Ripple
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.border = '2px solid #d97757';
      ripple.style.borderRadius = '50%';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '9997';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.animation = 'rippleExpand 0.8s ease-out forwards';

      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);

      // Sparks
      for (let i = 0; i < 8; i++) {
        createSpark(e.clientX, e.clientY, i);
      }
    };

    const handleMouseUp = () => {
      isClickingRef.current = false;
      if (cursorRef.current) cursorRef.current.classList.remove('clicking');
    };

    // ========== SPARK PARTICLES ==========
    const createSpark = (x: number, y: number, index: number) => {
      const spark = document.createElement('div');
      spark.style.position = 'fixed';
      spark.style.width = '4px';
      spark.style.height = '4px';
      spark.style.background = '#d97757';
      spark.style.borderRadius = '50%';
      spark.style.pointerEvents = 'none';
      spark.style.zIndex = '9997';
      spark.style.transform = 'translate(-50%, -50%)';
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      spark.style.boxShadow = '0 0 10px #d97757';

      document.body.appendChild(spark);

      const angle = (Math.PI * 2 * index) / 8 + Math.random() * 0.5;
      const distance = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      spark.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out';

      requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        spark.style.opacity = '0';
      });

      setTimeout(() => spark.remove(), 650);
    };

    // ========== CURSOR VISIBILITY ==========
    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
      if (cursorGlowRef.current) cursorGlowRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
      if (cursorGlowRef.current) cursorGlowRef.current.style.opacity = '1';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMoon]);

  // ========== HOVER DETECTION ON BUTTONS ==========
  useEffect(() => {
    const buttons = document.querySelectorAll('.interactive-btn');
    const handleEnter = () => {
      isHoveringRef.current = true;
      if (cursorRef.current) cursorRef.current.classList.add('hovering');
    };
    const handleLeave = () => {
      isHoveringRef.current = false;
      if (cursorRef.current) cursorRef.current.classList.remove('hovering');
    };

    buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', handleEnter);
      btn.addEventListener('mouseleave', handleLeave);
    });

    return () => {
      buttons.forEach((btn) => {
        btn.removeEventListener('mouseenter', handleEnter);
        btn.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [loading]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      setError(err?.message || 'Google sign-in was closed or unavailable. You can retry or continue in Guest Mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCacheAndReload = () => {
    clearAllCorruptCache();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${
      isMoon ? 'bg-[#151515]' : 'bg-[#faf7f2]'
    } ${isMoon ? 'text-[#ede8e1]' : 'text-[#2a2620]'} p-4 sm:p-6 relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] auth-root`}>

      {/* ========== GLOBAL STYLES ========== */}
      <style>{`
        /* Custom cursor — hide default cursor */
        .auth-root, .auth-root * {
          cursor: none !important;
        }
        
        @media (max-width: 768px) {
          .auth-root, .auth-root * {
            cursor: auto !important;
          }
          .auth-cursor, .auth-cursor-glow {
            display: none !important;
          }
        }
        
        /* Ripple animation */
        @keyframes rippleExpand {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
            border-width: 2px;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
            border-width: 0.5px;
          }
        }
        
        /* Logo pulse */
        @keyframes logoPulse {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(217, 119, 87, 0.4); 
            transform: scale(1); 
          }
          50% { 
            box-shadow: 0 0 60px rgba(217, 119, 87, 0.7); 
            transform: scale(1.05); 
          }
        }
        
        .auth-logo-pulse {
          animation: logoPulse 3s ease-in-out infinite;
        }
        
        /* Typing text */
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes blink {
          50% { border-color: transparent; }
        }
        
        .auth-typing-text {
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #d97757;
          animation: typing 1.2s steps(30) 0.9s forwards, blink 1s step-end infinite;
          width: 0;
          margin: 0 auto;
          display: inline-block;
        }
        
        /* Grid background */
        .auth-grid-bg {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(217, 119, 87, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217, 119, 87, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
        }
        
        body:not(.theme-moon) .auth-grid-bg,
        .auth-root:not(.theme-moon) .auth-grid-bg {
          background-image: 
            linear-gradient(rgba(217, 119, 87, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217, 119, 87, 0.06) 1px, transparent 1px);
        }
        
        /* Center glow */
        @keyframes glowBreathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
        
        .auth-center-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 900px;
          height: 900px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(217, 119, 87, 0.12) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
          animation: glowBreathe 6s ease-in-out infinite;
        }
        
        /* Floating orbs */
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        .auth-orb { animation: float 7s ease-in-out infinite; }
        .auth-orb-2 { animation: float 9s ease-in-out infinite 1.5s; }
        .auth-orb-3 { animation: float 8s ease-in-out infinite 3s; }
        
        /* Floating particles */
        @keyframes particleFloat {
          0% { opacity: 0; transform: translateY(100vh) scale(0); }
          10% { opacity: 0.8; }
          50% { opacity: 0.8; transform: translateY(50vh) scale(1); }
          90% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-10vh) scale(0); }
        }
        
        .auth-particle {
          position: fixed;
          width: 3px;
          height: 3px;
          background: #d97757;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          box-shadow: 0 0 8px #d97757, 0 0 15px rgba(217, 119, 87, 0.5);
          opacity: 0;
          animation: particleFloat 10s ease-in-out infinite;
        }
        
        /* Corner brackets */
        @keyframes bracketPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        .auth-corner-bracket {
          position: fixed;
          width: 30px;
          height: 30px;
          border: 2px solid rgba(217, 119, 87, 0.2);
          z-index: 3;
          pointer-events: none;
          animation: bracketPulse 4s ease-in-out infinite;
        }
        
        /* Pulse rings */
        @keyframes pulseExpand {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 900px; height: 900px; opacity: 0; }
        }
        
        .auth-pulse-ring {
          position: fixed;
          top: 50%;
          left: 50%;
          border: 1px solid rgba(217, 119, 87, 0.15);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
          animation: pulseExpand 6s ease-out infinite;
        }
        
        /* Scan line */
        @keyframes scanDown {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        
        .auth-scan-line {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(217, 119, 87, 0.5), transparent);
          z-index: 5;
          pointer-events: none;
          animation: scanDown 8s linear infinite;
          box-shadow: 0 0 20px rgba(217, 119, 87, 0.5);
        }
        
        /* Custom AI Cursor */
        .auth-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease;
        }
        
        .auth-cursor-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          background: #d97757;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 
            0 0 10px #d97757,
            0 0 20px rgba(217, 119, 87, 0.6),
            0 0 40px rgba(217, 119, 87, 0.3);
          transition: all 0.3s ease;
        }
        
        .auth-cursor-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 36px;
          height: 36px;
          border: 1.5px solid rgba(217, 119, 87, 0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: cursorRotate 4s linear infinite;
          transition: all 0.3s ease;
        }
        
        .auth-cursor-crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
        }
        
        .auth-cursor-crosshair::before,
        .auth-cursor-crosshair::after {
          content: '';
          position: absolute;
          background: rgba(217, 119, 87, 0.4);
        }
        
        .auth-cursor-crosshair::before {
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          transform: translateY(-50%);
        }
        
        .auth-cursor-crosshair::after {
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          transform: translateX(-50%);
        }
        
        @keyframes cursorRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .auth-cursor.hovering .auth-cursor-inner {
          width: 10px;
          height: 10px;
          box-shadow: 
            0 0 15px #d97757,
            0 0 30px rgba(217, 119, 87, 0.6);
        }
        
        .auth-cursor.hovering .auth-cursor-ring {
          width: 56px;
          height: 56px;
          border-color: #d97757;
          border-width: 2px;
        }
        
        .auth-cursor.clicking .auth-cursor-ring {
          width: 20px;
          height: 20px;
          border-color: #d97757;
          border-width: 3px;
        }
        
        /* Cursor Glow */
        .auth-cursor-glow {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          background: radial-gradient(circle, rgba(217, 119, 87, 0.08) 0%, transparent 60%);
          transform: translate(-50%, -50%);
          transition: opacity 0.3s ease;
        }
      `}</style>

      {/* ========== CUSTOM AI CURSOR ========== */}
      <div ref={cursorRef} className="auth-cursor">
        <div className="auth-cursor-ring"></div>
        <div className="auth-cursor-crosshair"></div>
        <div className="auth-cursor-inner"></div>
      </div>

      {/* ========== CURSOR GLOW ========== */}
      <div ref={cursorGlowRef} className="auth-cursor-glow"></div>

      {/* ========== LAYER 1: GRID ========== */}
      <div className="auth-grid-bg"></div>

      {/* ========== LAYER 2: NEURAL CANVAS ========== */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ opacity: isMoon ? 0.7 : 0.5 }}
      />

      {/* ========== LAYER 3: CENTER GLOW ========== */}
      <div className="auth-center-glow"></div>

      {/* ========== LAYER 4: FLOATING ORBS ========== */}
      <div className={`auth-orb absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isMoon ? 'bg-[#d97757]/25' : 'bg-[#d97757]/15'}`} />
      <div className={`auth-orb-2 absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${isMoon ? 'bg-[#c86b4c]/20' : 'bg-[#c86b4c]/12'}`} />
      <div className={`auth-orb-3 absolute top-1/2 right-1/3 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${isMoon ? 'bg-[#e69176]/15' : 'bg-[#e69176]/10'}`} />

      {/* ========== LAYER 5: PULSE RINGS ========== */}
      <div className="auth-pulse-ring"></div>
      <div className="auth-pulse-ring" style={{ animationDelay: '2s' }}></div>
      <div className="auth-pulse-ring" style={{ animationDelay: '4s' }}></div>

      {/* ========== LAYER 6: FLOATING PARTICLES ========== */}
      <div className="auth-particle" style={{ left: '10%', animationDelay: '0s' }}></div>
      <div className="auth-particle" style={{ left: '25%', animationDelay: '1s' }}></div>
      <div className="auth-particle" style={{ left: '40%', animationDelay: '2s' }}></div>
      <div className="auth-particle" style={{ left: '55%', animationDelay: '3s' }}></div>
      <div className="auth-particle" style={{ left: '70%', animationDelay: '4s' }}></div>
      <div className="auth-particle" style={{ left: '85%', animationDelay: '5s' }}></div>
      <div className="auth-particle" style={{ left: '15%', animationDelay: '6s' }}></div>
      <div className="auth-particle" style={{ left: '50%', animationDelay: '7s' }}></div>
      <div className="auth-particle" style={{ left: '75%', animationDelay: '8s' }}></div>
      <div className="auth-particle" style={{ left: '90%', animationDelay: '9s' }}></div>

      {/* ========== LAYER 7: SCAN LINE ========== */}
      <div className="auth-scan-line"></div>

      {/* ========== LAYER 8: CORNER BRACKETS ========== */}
      <div className="auth-corner-bracket top-[20px] left-[20px] border-r-0 border-b-0"></div>
      <div className="auth-corner-bracket top-[20px] right-[20px] border-l-0 border-b-0"></div>
      <div className="auth-corner-bracket bottom-[20px] left-[20px] border-r-0 border-t-0"></div>
      <div className="auth-corner-bracket bottom-[20px] right-[20px] border-l-0 border-t-0"></div>

      {/* ========== MAIN CARD ========== */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-md ${
          isMoon ? 'bg-[#1c1c1b] border-[#2e2d2a]' : 'bg-white border-[#e8e2d8]'
        } border rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6`}
        style={{
          boxShadow: isMoon
            ? '0 0 80px rgba(217, 119, 87, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)'
            : '0 0 80px rgba(217, 119, 87, 0.1), 0 20px 60px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3">
          {/* Logo with pulse animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl bg-[#d97757] blur-xl"
            />
            <div className={`relative w-16 h-16 rounded-2xl bg-white p-2 border ${
              isMoon ? 'border-[#383633]' : 'border-[#d8d0c2]'
            } shadow-xl flex items-center justify-center auth-logo-pulse`}>
              <img
                src={SAPPHIRE_LOGO_URL}
                alt="Sapphire AI Logo"
                className="w-full h-full rounded-xl object-contain shadow-xs"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full ${
              isMoon ? 'bg-[#171716] border-[#383633] text-[#a19e97]' : 'bg-[#f5f1ea] border-[#d8d0c2] text-[#6b6459]'
            } border text-[11px] mb-2 font-medium`}>
              <Sparkles className="w-3 h-3 text-[#d97757]" />
              <span>Next-Gen Intelligent AI</span>
            </div>
            <h1 className={`text-2xl font-extrabold ${
              isMoon ? 'text-[#f5f2eb]' : 'text-[#1a1712]'
            } tracking-tight auth-typing-text`}>
              Welcome to {SAPPHIRE_APP_NAME}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className={`text-xs ${
                isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]'
              } mt-3 max-w-xs mx-auto leading-relaxed`}
            >
              Sign in with Google to sync your work, or enter immediately with ephemeral Guest Mode.
            </motion.p>
          </motion.div>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full p-3 rounded-2xl border text-xs flex items-center gap-2 text-left ${
              isMoon
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 ${isMoon ? 'text-rose-400' : 'text-rose-500'}`} />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Actions Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="w-full space-y-3 pt-1"
        >
          {/* Google Sign-In Button */}
          <motion.button
            id="google-signin-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`interactive-btn w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group ${
              isMoon
                ? 'bg-white hover:bg-slate-100 text-[#191817]'
                : 'bg-[#d97757] hover:bg-[#c86b4c] text-white'
            }`}
          >
            {loading ? (
              <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                isMoon ? 'border-slate-400 border-t-slate-900' : 'border-white/40 border-t-white'
              }`} />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill={isMoon ? '#4285F4' : '#ffffff'}
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill={isMoon ? '#34A853' : '#ffffff'}
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill={isMoon ? '#FBBC05' : '#ffffff'}
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.99 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill={isMoon ? '#EA4335' : '#ffffff'}
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className={`flex-1 h-px ${isMoon ? 'bg-[#2e2d2a]' : 'bg-[#e8e2d8]'}`} />
            <span className={`text-[11px] ${isMoon ? 'text-[#8e8c85]' : 'text-[#9a9186]'} font-semibold uppercase tracking-wider`}>
              or
            </span>
            <div className={`flex-1 h-px ${isMoon ? 'bg-[#2e2d2a]' : 'bg-[#e8e2d8]'}`} />
          </div>

          {/* Guest Mode Button */}
          <motion.button
            id="guest-signin-btn"
            type="button"
            disabled={loading}
            onClick={onContinueAsGuest}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`interactive-btn w-full py-3.5 px-4 ${
              isMoon
                ? 'bg-[#232321] hover:bg-[#2c2b28] text-[#ede8e1] border-[#383633]'
                : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#2a2620] border-[#d8d0c2]'
            } border rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md group`}
          >
            <UserCheck className="w-4 h-4 text-[#d97757] group-hover:scale-110 transition-transform" />
            <span>Continue as Guest</span>
            <ArrowRight className={`w-4 h-4 ${isMoon ? 'text-[#8e8c85]' : 'text-[#9a9186]'} ml-auto group-hover:translate-x-0.5 transition-transform`} />
          </motion.button>

          {/* Guest Mode Notice */}
          <div className={`p-3 rounded-2xl ${
            isMoon ? 'bg-[#171716] border-[#2a2926]' : 'bg-[#f5f1ea] border-[#e8e2d8]'
          } border text-left flex items-start gap-2.5 mt-2`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isMoon ? 'text-amber-400' : 'text-amber-500'}`} />
            <div className={`text-[11px] ${
              isMoon ? 'text-[#8e8c85]' : 'text-[#9a9186]'
            } leading-relaxed`}>
              <strong className={`${isMoon ? 'text-[#d8d5cd]' : 'text-[#2a2620]'} font-semibold block`}>Guest Mode (0 Data Saved):</strong>
              Nothing is saved to database or storage. When you refresh the page, the login screen will return so you can choose again.
            </div>
          </div>
        </motion.div>

        {/* Reset Cache */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="pt-2"
        >
          <button
            type="button"
            onClick={handleResetCacheAndReload}
            className={`text-[11px] ${
              isMoon ? 'text-[#666] hover:text-[#a19e97]' : 'text-[#b8b0a4] hover:text-[#6b6459]'
            } transition-colors flex items-center gap-1.5 cursor-pointer mx-auto`}
            title="Clean local cookies and refresh application"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Cache & Storage</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;