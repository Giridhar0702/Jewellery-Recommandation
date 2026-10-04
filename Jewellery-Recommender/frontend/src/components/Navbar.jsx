import React from 'react';
import { ShoppingBag, Search, Camera } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <ShoppingBag className="h-8 w-8 text-accent" />
                        <span className="ml-3 text-2xl font-serif font-bold text-primary tracking-tight">
                            LuxeGem
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-10">
                        <a href="#" className="text-secondary hover:text-accent transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">Collections</a>
                        <a href="#" className="text-secondary hover:text-accent transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">New Arrivals</a>
                        <a href="#" className="text-secondary hover:text-accent transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">About</a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-6">
                        <button className="p-2 text-secondary hover:text-accent transition-colors">
                            <Search className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-secondary hover:text-accent transition-colors">
                            <Camera className="h-5 w-5" />
                        </button>
                        <button className="bg-primary text-white border border-primary px-6 py-2 rounded-none text-xs font-semibold uppercase tracking-widest hover:bg-white hover:text-primary transition-all duration-300">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
