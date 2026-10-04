import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white pt-20 pb-8 border-t border-accent/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-3xl font-serif font-medium mb-6 tracking-tight">LuxeGem</h3>
                        <p className="text-gray-400 max-w-sm font-light leading-relaxed">
                            Discover the perfect piece that speaks to your soul. Use our AI-powered recommendation
                            engine to find jewelry matching your unique style and desires.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-accent">Quick Links</h4>
                        <ul className="space-y-4 text-gray-400 font-light">
                            <li><a href="#" className="hover:text-accent transition-colors duration-300">Search by Text</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors duration-300">Search by Image</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors duration-300">Collections</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-accent">Contact</h4>
                        <ul className="space-y-4 text-gray-400 font-light">
                            <li>info@luxegem.com</li>
                            <li>+1 (555) 123-4567</li>
                            <li>New York, NY</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-xs uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} LuxeGem. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
