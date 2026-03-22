import React from 'react';
import { motion } from 'framer-motion';
import { cardEntrance } from '../../utils/motionVariants';

const GlassCard = ({ children, className = '', hoverEffect = false, variants, ...props }) => {
    // Determine animation props
    // We use the centralized 'cardEntrance' variant by default
    // If hoverEffect is true, we enable the 'hover' variant state from cardEntrance

    return (
        <motion.div
            variants={variants || cardEntrance} // Use passed variants or default
            // 'initial' and 'animate' are typically controlled by parent staggerContainer
            // But we can set default initial/animate if used standalone
            // maximizing flexibility: if parent is motion.div with stagger, these will be overridden/controlled

            whileHover={hoverEffect ? "hover" : undefined}

            {...props}

            className={`bg-[var(--surface)] border border-[var(--border)] shadow-[var(--card-shadow)] hover:shadow-md rounded-3xl p-6 relative overflow-hidden text-[var(--text)] font-sans transition-all duration-300 ${className}`}
        >
            {/* Content Container */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
