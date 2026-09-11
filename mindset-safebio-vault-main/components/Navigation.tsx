
import React from 'react';
import { Home, MessageCircle, ShieldCheck, Palette, Activity, User } from 'lucide-react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isLightMode?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, isLightMode = false }) => {
  const navItems = [
    { id: Screen.HOME, icon: Home, label: 'Feed' },
    { id: Screen.CHAT, icon: MessageCircle, label: 'MindSet' },
    { id: Screen.LIVE, icon: Activity, label: 'Live' },
    { id: Screen.VAULT, icon: ShieldCheck, label: 'Vault' },
    { id: Screen.STUDIO, icon: Palette, label: 'Studio' },
    { id: Screen.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-between items-end z-50 rounded-t-3xl backdrop-blur-xl bg-charcoal/90 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        
        let containerClass = "bg-transparent hover:bg-white/5";
        let iconColor = "text-gray-400";
        let labelColor = "text-gray-400 opacity-0 translate-y-2";

        if (isActive) {
             containerClass = "bg-gradient-to-br from-saffron-500 to-red-500 shadow-lg shadow-saffron-500/30 -translate-y-6 scale-110 ring-4 ring-charcoal";
             iconColor = "text-white";
             labelColor = "text-white opacity-100 translate-y-0 font-bold";
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="group flex flex-col items-center justify-end h-16 min-w-[3.5rem] w-14 pb-2 relative flex-shrink-0"
          >
            <div className={`
                absolute top-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 btn-3d
                ${containerClass}
            `}>
              <Icon size={isActive ? 24 : 22} className={`transition-all duration-300 ${iconColor}`} />
            </div>
            
            <span className={`text-[10px] font-medium font-hindi transition-all duration-300 absolute bottom-1 ${labelColor}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
