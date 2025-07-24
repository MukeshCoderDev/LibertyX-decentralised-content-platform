import React from 'react';
import { Page, NavigationProps } from '../types';
import Logo from './icons/Logo';

interface HeaderProps extends NavigationProps {
    currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
    const navItems = [
        { page: Page.Explore, label: 'Explore' },
        { page: Page.Upload, label: 'Upload' },
        { page: Page.Dashboard, label: 'Dashboard' },
        { page: Page.Profile, label: 'Profile' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate(Page.Explore)}>
                       <Logo />
                    </div>
                    <nav className="hidden md:flex md:space-x-8">
                        {navItems.map(item => (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`font-satoshi text-lg font-medium transition-colors ${currentPage === item.page ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                     <div className="md:hidden">
                        {/* Mobile menu button could go here */}
                    </div>
                </div>
            </div>
             {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card p-2 flex justify-around md:hidden z-50 border-t border-gray-800">
                {navItems.map(item => (
                     <button
                        key={item.page}
                        onClick={() => onNavigate(item.page)}
                        className={`flex flex-col items-center font-satoshi text-xs font-medium transition-colors w-full p-1 rounded-md ${currentPage === item.page ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-white'}`}
                    >
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;
