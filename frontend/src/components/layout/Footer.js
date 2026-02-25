import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-green-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="bg-white/10 p-1.5 rounded-lg">
                                <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </span>
                            Academia
                        </h3>
                        <p className="text-green-100 text-sm leading-relaxed mb-6">
                            Empowering students and educators with world-class learning management tools. Bringing education to life online.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-green-100">
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">All Courses</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-green-100">
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Student Portal</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Faculty Login</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Library</a></li>
                            <li><a href="#" className="hover:text-teal-300 transition-colors">Events</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Newsletter</h4>
                        <p className="text-sm text-green-100 mb-4">Subscribe to our newsletter for the latest updates.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Your email" className="bg-green-800 text-white px-3 py-2 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder-green-400" />
                            <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-sm font-medium">
                                OK
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-green-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-green-300">
                    <p>© 2026 Academia Inc. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
