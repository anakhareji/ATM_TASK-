import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SearchBar from '../components/ui/SearchBar';
import FeatureIcon from '../components/ui/FeatureIcon';
import CourseCard from '../components/ui/CourseCard';
import TeacherCard from '../components/ui/TeacherCard';

const Landing = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            icon: "💻",
            title: "Online Learning",
            description: "Access high-quality lectures and resources from anywhere in the world."
        },
        {
            icon: "🏆",
            title: "Expert Certification",
            description: "Earn recognized certificates to boost your professional career."
        },
        {
            icon: "👥",
            title: "Community Access",
            description: "Join a global network of learners and share knowledge together."
        },
    ];

    const courses = [
        {
            title: "Machine Learning Masterclass 2026",
            category: "Data Science",
            rating: 4.9,
            students: "12k",
            lessons: 45,
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        },
        {
            title: "User Experience Design Fundamentals",
            category: "Design",
            rating: 4.8,
            students: "8.5k",
            lessons: 32,
            image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        },
        {
            title: "Financial Analysis & Valuation",
            category: "Business",
            rating: 4.7,
            students: "15k",
            lessons: 28,
            image: "https://images.unsplash.com/photo-1554224155-9726b3028d77?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        }
    ];

    const teachers = [
        { name: "Dr. Eleanor Pena", role: "Head of Data Science", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" },
        { name: "Marvin McKinney", role: "Senior UX Designer", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" },
        { name: "Savannah Nguyen", role: "Financial Consultant", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" },
    ];

    return (
        <div className="font-sans text-slate-800 bg-gray-50/50 selection:bg-emerald-100 selection:text-emerald-900">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                        className="w-full h-full object-cover object-center scale-105"
                        alt="Students studying"
                    />
                </div>

                {/* Modern Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900/60 mix-blend-multiply"></div>
                <div className="absolute inset-0 z-10 bg-black/20"></div>

                {/* Content */}
                <div className={`relative z-20 text-center max-w-5xl mx-auto px-4 mt-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-sm font-semibold tracking-wider mb-6">
                        EDUCATION REIMAGINED
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-md">
                        Start Learning <br /> With Us Today
                    </h1>
                    <p className="text-xl text-emerald-50 mb-12 max-w-2xl mx-auto font-light leading-relaxed opacity-90">
                        Trusted by over 10 million students worldwide. Master new skills with our expertly curated courses and professional certificates.
                    </p>

                    <SearchBar />

                    <div className="mt-12 flex items-center justify-center gap-8 text-white/80 text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Free Implementation
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Expert Instructors
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Lifetime Access
                        </span>
                    </div>
                </div>
            </section>

            {/* Feature Icons Section */}
            <section className="py-24 bg-white relative z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureIcon
                                key={index}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                delay={index * 100}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Courses Section */}
            <section id="courses" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-16">
                        <div>
                            <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">Top Rated</span>
                            <h2 className="text-4xl font-bold text-gray-900">Our Popular Courses</h2>
                        </div>
                        <button className="hidden md:flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                            Explore All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {courses.map((course, index) => (
                            <CourseCard key={index} {...course} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust/Stats Section */}
            <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center divide-x divide-white/10">
                        {[
                            { value: "500+", label: "Active Students" },
                            { value: "50+", label: "Expert Mentors" },
                            { value: "95%", label: "Satisfaction Rate" },
                            { value: "10+", label: "Years Experience" }
                        ].map((stat, i) => (
                            <div key={i} className="px-4">
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-emerald-200 font-medium uppercase tracking-wider text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Teachers Section */}
            <section id="teachers" className="relative py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">World Class Mentors</span>
                        <h2 className="text-4xl font-bold text-gray-900">Meet Our Expert Teachers</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto mt-4 text-lg">
                            Learn from the industry's best. Our instructors are passionate professionals dedicated to your success.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {teachers.map((teacher, index) => (
                            <TeacherCard key={index} {...teacher} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium CTA Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden group">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32 group-hover:scale-110 transition-transform duration-700"></div>

                        <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to Start Your Learning Journey?</h2>
                        <p className="text-emerald-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10 leading-relaxed">
                            Join thousands of students and start learning the skills that will shape your future today.
                        </p>

                        <button className="relative z-10 bg-white text-emerald-700 px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105">
                            Get Started for Free
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
