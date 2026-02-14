
import React from 'react';
import { Home, History, Bookmark, User, Camera } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onScanClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onScanClick }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'placeholder', icon: null, label: '' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#162927]/90 backdrop-blur-md border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab, idx) => {
        if (tab.id === 'placeholder') {
          return (
            <div key={idx} className="relative w-12 h-12">
              <button
                onClick={onScanClick}
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"
              >
                <Camera className="text-black w-8 h-8" />
              </button>
            </div>
          );
        }

        const Icon = tab.icon!;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
