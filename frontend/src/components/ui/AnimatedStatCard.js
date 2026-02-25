import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import GlassCard from './GlassCard';
import { cardEntrance } from '../../utils/motionVariants';

// Animated Counter Component with updated logic
const AnimatedNumber = ({ value }) => {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 40,    // Increased damping for less bounce
        stiffness: 100, // Reduced stiffness for smoother ramp-up
        duration: 2     // Target duration (approx)
    });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    useEffect(() => {
        const unsubscribe = springValue.on("change", (latest) => {
            setDisplayValue(Math.floor(latest));
        });
        return unsubscribe;
    }, [springValue]);

    return <span>{displayValue}</span>;
};

const AnimatedStatCard = ({ title, value, icon: Icon, color, description, index }) => {
    const tintClass = (color || '').split(' ')[0].replace('bg-', 'bg-').replace('500', '50');
    const iconClass = (color || '').split(' ')[0].replace('bg-', 'text-').replace('500', '600');
    return (
        <GlassCard
            hoverEffect={true}
            className="flex flex-col justify-between h-full group"
            variants={cardEntrance} // Assign the variant
            custom={index}         // Pass index if we need custom delays (handled by stagger usually)
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`
                    p-3 rounded-full 
                    ${tintClass} 
                    ring-1 ring-gray-100
                    group-hover:scale-105 transition-transform duration-300 ease-out
                `}>
                    <Icon size={24} className={iconClass} />
                </div>
            </div>

            <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">
                    <AnimatedNumber value={value} />
                </h3>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {description && (
                    <motion.p
                        initial={{ opacity: 0.6 }}
                        whileHover={{ opacity: 1, x: 2 }}
                        className="text-xs text-emerald-700 mt-2 font-medium bg-emerald-50 border border-emerald-100 inline-block px-2 py-1 rounded-lg"
                    >
                        {description}
                    </motion.p>
                )}
            </div>

            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-emerald-100 opacity-40 blur-3xl pointer-events-none group-hover:opacity-50 transition-opacity duration-500" />
        </GlassCard>
    );
};

export default AnimatedStatCard;
