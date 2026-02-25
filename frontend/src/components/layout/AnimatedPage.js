import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/motionVariants';

const AnimatedPage = ({ children, className = '' }) => {
    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPage;
