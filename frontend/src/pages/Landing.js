import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FeatureIcon from '../components/ui/FeatureIcon';
import DepartmentCard from '../components/ui/DepartmentCard';
import TeacherCard from '../components/ui/TeacherCard';
import axios from '../api/axios';
import { Laptop, Award, Users, ChevronRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [activeSection, setActiveSection] = useState('hero');

    useEffect(() => {
        setIsVisible(true);
        const fetchData = async () => {
            try {
                const [departmentsRes, teachersRes] = await Promise.all([
                    axios.get('/public/departments'),
                    axios.get('/public/teachers')
                ]);
                setDepartments(departmentsRes.data);
                setTeachers(teachersRes.data);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        fetchData();
    }, []);

    // Idle detection and auto-scroll
    useEffect(() => {
        let idleTimer;
        let scrollTimer;
        const sections = ['hero', 'courses', 'teachers'];

        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            clearInterval(scrollTimer);
            
            idleTimer = setTimeout(() => {
                scrollTimer = setInterval(() => {
                    setActiveSection(prev => {
                        const currentIndex = sections.indexOf(prev);
                        const nextIndex = (currentIndex + 1) % sections.length;
                        const nextSection = sections[nextIndex];
                        const element = document.getElementById(nextSection);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        return nextSection;
                    });
                }, 3000);
            }, 3000);
        };

        const events = ['mousemove', 'keydown', 'touchstart', 'click'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer));
        
        resetIdleTimer();

        return () => {
            clearTimeout(idleTimer);
            clearInterval(scrollTimer);
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        };
    }, []);

    const features = [
        {
            icon: <Laptop size={32} strokeWidth={1.5} />,
            title: "Online Learning",
            description: "Access high-quality lectures and resources from anywhere in the world."
        },
        {
            icon: <Award size={32} strokeWidth={1.5} />,
            title: "Expert Certification",
            description: "Earn recognized certificates to boost your professional career."
        },
        {
            icon: <Users size={32} strokeWidth={1.5} />,
            title: "Community Access",
            description: "Join a global network of learners and share knowledge together."
        },
    ];

    return (
        <div className="font-sans text-slate-800 bg-gray-50/50 selection:bg-blue-100 selection:text-blue-900">
            <Navbar />

            {/* Hero Section */}
            <section id="hero" className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                        className="w-full h-full object-cover object-center scale-105"
                        alt="Students studying"
                    />
                </div>

                {/* Professional Deep Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/95 via-slate-800/80 to-slate-900/60 mix-blend-multiply"></div>
                <div className="absolute inset-0 z-10 bg-black/10"></div>

                {/* Content */}
                <div className={`relative z-20 text-center max-w-5xl mx-auto px-4 mt-6 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                    <span className="inline-block py-1.5 px-4 rounded-none bg-white/10 backdrop-blur-md border border-white/20 text-slate-100 text-[10px] font-bold tracking-[0.2em] mb-8 uppercase">
                        Excellence in Higher Education
                    </span>

                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-md">
                        Start Learning <br /> With Us Today
                    </h1>
                    <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed opacity-90">
                        Trusted by over 10 million students worldwide. Master new skills with our expertly curated courses and professional certificates.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4 opacity-95">
                        <button className="px-10 py-4 bg-transparent border border-white/40 text-white font-medium tracking-widest uppercase text-xs hover:bg-white hover:text-slate-900 transition-all duration-500 backdrop-blur-sm">
                            Explore Catalog
                        </button>
                    </div>

                    <div className="mt-16 flex items-center justify-center gap-8 text-white/80 text-sm font-medium tracking-wide">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            Free Implementation
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            Expert Instructors
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            Lifetime Access
                        </span>
                    </div>
                </div>
            </section>

            {/* Feature Icons Section */}
            <section id="about-us" className="py-24 bg-white relative z-30 border-b border-gray-100">
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

            {/* Departments Section */}
            <section id="courses" className="py-24 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-16 border-b border-gray-200 pb-6">
                        <div>
                            <span className="text-blue-700 font-bold tracking-widest uppercase text-xs mb-3 block">Academic Structure</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">Our Academic Departments</h2>
                        </div>
                        <button className="hidden md:flex items-center gap-2 text-blue-800 font-semibold hover:text-blue-600 transition-colors uppercase tracking-wider text-sm">
                            Explore All
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {departments.map((dept, index) => (
                            <DepartmentCard key={index} {...dept} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust/Stats Section */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
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
                                <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{stat.value}</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Teachers Section */}
            <section id="teachers" className="relative py-28 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-blue-700 font-bold tracking-widest uppercase text-xs mb-3 block">Faculty</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-4">World Class Mentors</h2>
                        <div className="w-24 h-1 bg-blue-100 mx-auto mb-6"></div>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Learn from the industry's best. Our instructors are passionate professionals dedicated to your success and academic excellence.
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
            <section id="contact" className="py-24 bg-slate-50/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-slate-900 rounded-none border-t-[6px] border-blue-800 p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden group">
                        
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 relative z-10 tracking-tight">Ready to Start Your Learning Journey?</h2>
                        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-12 relative z-10 leading-relaxed font-light">
                            Join thousands of students and start learning the skills that will shape your future today alongside experienced researchers.
                        </p>

                        <button className="relative z-10 bg-blue-700 text-white px-10 py-4 font-bold text-sm tracking-widest uppercase shadow-lg hover:shadow-2xl hover:bg-blue-600 transition-all duration-300 transform">
                            Admissions Open
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
