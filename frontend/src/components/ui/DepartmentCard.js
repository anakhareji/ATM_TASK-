import React from 'react';

const DepartmentCard = ({ name, code, description, course_count, image }) => {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
            <div className="relative h-52 overflow-hidden bg-gray-100">
                <img
                    src={image || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                    <span className="bg-emerald-600/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wide shadow-sm">
                        {code || "DEPT"}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {name}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    {description || "Explore our comprehensive curriculum and dedicated faculty."}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 mt-auto">
                    <div className="flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {course_count || 0} Programs Available
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-600 uppercase tracking-wider">Active</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:translate-x-1 transition-transform cursor-pointer flex items-center gap-1">
                        Explore <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DepartmentCard;
