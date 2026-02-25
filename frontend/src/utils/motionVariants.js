// Global Motion Variants

// Easing transition for smooth, non-bouncy feel
export const transition = { duration: 0.5, ease: "easeOut" };

// 1. Page / Section Transition
export const pageVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.6, -0.05, 0.01, 0.99],
            staggerChildren: 0.1
        }
    },
    exit: { opacity: 0, y: -15, transition: { duration: 0.4 } }
};

// 2. Stagger Container for lists/grids
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

// 3. Card Entrance Animation
export const cardEntrance = {
    hidden: { opacity: 0, y: 15, scale: 0.99 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    },
    hover: {
        y: -4,
        scale: 1.03,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { duration: 0.3 }
    }
};

// 4. Sidebar Item Animation
export const sidebarItemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.2 }
    }
};

// 5. Button Micro-interaction
export const buttonTap = { scale: 0.98 };
export const buttonHover = {
    scale: 1.02,
    boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
    transition: { type: "spring", stiffness: 400, damping: 10 }
};

// 6. Table Row Entrance
export const tableRowVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2 }
    },
    hover: {
        backgroundColor: "#F9FAFB", // gray-50
        scale: 1,
        transition: { duration: 0.1 }
    }
};
