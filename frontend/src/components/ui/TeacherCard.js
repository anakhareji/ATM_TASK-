import React from 'react';

const TeacherCard = ({ name, role, image }) => {
    return (
        <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 text-center group">
            <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-10 scale-110 transition-all duration-300"></div>
                <img
                    src={image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"}
                    alt={name}
                    className="w-full h-full object-cover rounded-full border-4 border-white shadow-md relative z-10"
                />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">{name}</h4>
            <p className="text-emerald-600 font-medium text-sm mb-4">{role}</p>

            <div className="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                {['twitter', 'linkedin', 'mail'].map((icon) => (
                    <a key={icon} href="#" className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        <span className="sr-only">{icon}</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default TeacherCard;
