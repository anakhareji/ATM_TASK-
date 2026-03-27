import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star } from 'lucide-react';

const PremiumProfileBadge = ({ 
  tier = 'Gold', 
  xp = 2400, 
  followers = '12.7k',
  name = 'Emma Williams',
  avatar = null
}) => {
  const isGold = tier.toLowerCase() === 'gold';
  
  // Format avatar URL
  const avatarUrl = avatar 
    ? (avatar.startsWith('http') ? avatar : `http://localhost:8000${avatar}`)
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white min-h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-80 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 flex flex-col items-center pt-12 pb-8 px-6"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400/20 blur-[60px] rounded-full -z-10" />
        
        {/* Avatar Container */}
        <div className="relative mb-6">
          {/* Golden Ring with sparkles */}
          <div className="absolute inset-[-12px] rounded-full border-2 border-yellow-400/50 flex items-center justify-center">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0"
             >
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full" 
                        style={{ 
                            top: '50%', 
                            left: '50%', 
                            transform: `rotate(${i * 60}deg) translate(66px)` 
                        }} 
                    />
                ))}
             </motion.div>
          </div>
          
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
              alt={name} 
              className="w-full h-full object-cover bg-gray-100"
            />
          </div>

          {/* Shield Badge */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 p-2 rounded-xl shadow-lg border-2 border-white">
               <Shield size={24} className="text-white fill-white/20" />
               <Star size={10} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-white" />
            </div>
          </motion.div>
        </div>

        {/* User Info */}
        <div className="text-center mb-6 w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{name}</h2>
          <div className="inline-block px-6 py-1.5 bg-yellow-400/90 rounded-full shadow-sm">
            <span className="text-white text-sm font-bold tracking-wide">{tier} Member</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-8 w-full border-t border-gray-100 pt-6">
          <div className="text-center group cursor-pointer">
            <p className="text-gray-400 text-sm mb-1 font-medium">Followers</p>
            <p className="text-xl font-bold text-gray-800 group-hover:text-yellow-600 transition-colors uppercase tracking-tight">{followers}</p>
          </div>
          <div className="text-center group cursor-pointer relative">
            {/* Vertical Divider */}
            <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-[1px] h-10 bg-gray-100" />
            <p className="text-gray-400 text-sm mb-1 font-medium">XP Points</p>
            <p className="text-xl font-bold text-gray-800 group-hover:text-yellow-600 transition-colors uppercase tracking-tight">{xp}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumProfileBadge;
