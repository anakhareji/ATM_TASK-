import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-white"></div>

            {/* Floating Blob 1: Large Indigo circle */}
            <motion.div
                animate={{
                    x: [0, 50, -30, 0],
                    y: [0, -30, 20, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[100px]"
            />

            {/* Floating Blob 2: Blue Glow */}
            <motion.div
                animate={{
                    x: [0, -40, 30, 0],
                    y: [0, 40, -20, 0],
                }}
                transition={{
                    duration: 15,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: 2
                }}
                className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[80px]"
            />

            {/* Floating Blob 3: Subtle Purple/Pink Accent */}
            <motion.div
                animate={{
                    x: [0, 60, -20, 0],
                    y: [0, -50, 40, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 25,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: 5
                }}
                className="absolute top-[30%] right-[30%] w-[300px] h-[300px] bg-purple-300/10 rounded-full blur-[60px]"
            />

            {/* Optional: Subtle Grid or Dot Pattern Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            ></div>
        </div>
    );
};

export default AnimatedBackground;
