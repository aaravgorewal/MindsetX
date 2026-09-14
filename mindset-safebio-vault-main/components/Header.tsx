
import React from 'react';
import { Menu, Bell, Search, User, PhoneCall, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick?: () => void;
  onEmergencyClick?: () => void;
  userName?: string | null;
  userAvatar?: string | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick, onEmergencyClick, userName, userAvatar }) => {
  return (
    <header className="h-16 flex-none bg-charcoal/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-8 z-50 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        
        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden sm:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10 focus-within:border-saffron-500/50 focus-within:ring-2 focus-within:ring-saffron-500/20 transition-all w-64">
          <Search size={16} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Permanent Quick-Access Emergency Support Button */}
        <button
          id="emergency-support-quick-btn"
          onClick={onEmergencyClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white transition-all font-semibold text-xs shadow-sm hover:shadow-red-500/20 group active:scale-95"
          title="Instant Crisis Helplines (Tele-MANAS: 14416 | KIRAN: 1800-599-0019)"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
          <PhoneCall size={13} className="text-red-400 group-hover:text-white transition-colors" />
          <span className="font-bold tracking-tight">Emergency Support</span>
        </button>

        <button className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-white truncate max-w-[180px]">{userName || "QuietStorm_99"}</div>
            <div className="text-xs text-gray-400">Student • Pro Member</div>
          </div>
          <div 
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-500 to-teal-500 p-0.5 shadow-md cursor-pointer hover:scale-105 transition-transform"
          >
             <div className="w-full h-full rounded-full bg-charcoal flex items-center justify-center overflow-hidden">
                 <img 
                    src={userAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                    alt={userName || "Profile"} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                 />
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
