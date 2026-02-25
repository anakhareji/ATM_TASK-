import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

const AnimatedParticlesBackground = () => {
    const canvasRef = useRef(null);

    // Particle Configuration
    const particleCount = 40;
    const connectionDistance = 150;

    // Generate initial particles
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }).map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5, // Velocity X
            vy: (Math.random() - 0.5) * 0.5, // Velocity Y
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(45, 212, 191, 0.5)' // Emerald-500 or Teal-400
        }));
    }, []);

    // Canvas Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and Draw Particles
            particles.forEach((p, i) => {
                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Draw Connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(52, 211, 153, ${0.15 * (1 - distance / connectionDistance)})`; // Emerald-400
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particles]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-slate-900">
            {/* Base Gradient - Emerald/Teal Dark */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 opacity-90" />

            {/* Large Floating Orbs (Framer Motion) */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[100px]"
            />

            {/* Particle Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-index-10 opacity-60 pointer-events-none"
            />

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        </div>
    );
};

export default AnimatedParticlesBackground;
