import React, { useState } from 'react';
import { Menu, X, User, Settings, HelpCircle, LogOut } from 'lucide-react';

const ResponsiveNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Profile', icon: User },
    { label: 'Settings', icon: Settings },
    { label: 'Help & Resources', icon: HelpCircle },
    { label: 'Logout', icon: LogOut, className: 'text-red-400' },
  ];

  return (
    <>
      {/* Desktop Navigation (Horizontal Bar) */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-charcoal/90 backdrop-blur-md border-b border-white/10 z-[60] px-8 items-center justify-between">
         <div className="font-bold text-xl bg-gradient-to-r from-saffron-400 to-teal-400 bg-clip-text text-transparent">
             MindSet X
         </div>
         <div className="flex gap-6">
             {menuItems.map((item, idx) => {
                 const Icon = item.icon;
                 return (
                    <button key={idx} className={`flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors ${item.className || ''}`}>
                        <Icon size={16} />
                        {item.label}
                    </button>
                 );
             })}
         </div>
      </div>

      {/* Mobile Hamburger Trigger (Visible on < md) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 glass-card rounded-full text-white hover:bg-white/10 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsOpen(false)}
            ></div>
            
            {/* Slide-in Drawer */}
            <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-xs bg-charcoal border-r border-white/10 p-6 flex flex-col shadow-2xl animate-slide-in-left">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-white">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-2 flex-1">
                    {menuItems.map((item, idx) => {
                         const Icon = item.icon;
                         return (
                            <button key={idx} className={`w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left ${item.className || 'text-gray-200'}`}>
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                         );
                    })}
                </div>

                <div className="pt-6 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center">Version 1.0.0 (Beta)</p>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ResponsiveNav;