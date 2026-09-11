
import React from 'react';
import { Home, MessageCircle, Activity, ShieldCheck, Palette, X, LogOut, Settings, HelpCircle, Brain, User } from 'lucide-react';
import { Screen } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentScreen, onNavigate }) => {
  const navItems = [
    { id: Screen.HOME, icon: Home, label: 'Feed' },
    { id: Screen.PROFILE, icon: User, label: 'My Dashboard' },
    { id: Screen.CHAT, icon: MessageCircle, label: 'MindSet AI' },
    { id: Screen.SENTINEL, icon: Brain, label: 'AI Sentinel' },
    { id: Screen.LIVE, icon: Activity, label: 'Live Session' },
    { id: Screen.VAULT, icon: ShieldCheck, label: 'Bio Vault' },
    { id: Screen.STUDIO, icon: Palette, label: 'MindSet Studio' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings', action: () => onNavigate(Screen.SETTINGS) },
    { icon: HelpCircle, label: 'Help', action: () => {} },
    { icon: LogOut, label: 'Logout', className: 'text-red-400 hover:text-red-300', action: () => {} },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[70] w-64 bg-charcoal border-r border-white/10 transform transition-transform duration-300 ease-in-out shadow-xl
    md:translate-x-0 md:static md:inset-auto md:flex md:flex-col md:shadow-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <span className="text-xl font-bold bg-gradient-to-r from-saffron-500 to-teal-400 bg-clip-text text-transparent">
            MindSet X
          </span>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-saffron-500' : 'group-hover:text-teal-400'} />
                <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-saffron-500 shadow-[0_0_8px_rgba(255,153,51,0.8)]"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          {bottomItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button 
                key={idx} 
                onClick={() => {
                   if (item.action) item.action();
                   onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors ${item.className || ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
