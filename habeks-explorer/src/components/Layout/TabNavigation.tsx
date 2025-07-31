import React from 'react';
import { AppTab } from '../../types';
import { MapIcon, ScanIcon, CameraIcon } from '../Icons';

interface TabNavigationProps {
  currentTab: AppTab['id'];
  onTabChange: (tabId: AppTab['id']) => void;
  isFloating?: boolean;
}

const tabs: AppTab[] = [
  {
    id: 'ownership',
    title: 'Карта владений',
    icon: 'map',
    component: () => null
  },
  {
    id: 'exploration',
    title: 'Исследование',
    icon: 'scan',
    component: () => null
  },
  {
    id: 'ar-collection',
    title: 'AR Сбор',
    icon: 'camera',
    component: () => null
  }
];

const iconComponents = {
  map: MapIcon,
  scan: ScanIcon,
  camera: CameraIcon
};

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, onTabChange, isFloating = false }) => {
  return (
    <nav className={`tab-navigation ${isFloating ? 'floating' : 'bottom'}`}>
      <div className={`flex ${isFloating ? 'justify-center space-x-3' : 'justify-around'} ${isFloating ? 'glass-panel bg-dark-secondary/90 backdrop-blur-lg border border-accent-primary/30 rounded-2xl px-4 py-3 shadow-neon' : 'bg-dark-secondary border-t border-accent-primary/30 px-4 py-3'}`}>
        {tabs.map((tab) => {
          const IconComponent = iconComponents[tab.icon as keyof typeof iconComponents];
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={`tab-button group transition-all duration-300 ${isActive ? 'active' : ''} ${isFloating ? 'px-4 py-3' : 'flex-1 py-2'}`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <IconComponent 
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isActive 
                        ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]' 
                        : 'text-text-secondary group-hover:text-accent-primary'
                    }`} 
                  />
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isActive 
                    ? 'text-accent-primary font-semibold' 
                    : 'text-text-secondary group-hover:text-text-primary'
                } ${isFloating ? 'hidden sm:block' : ''}`}>
                  {tab.title}
                </span>
              </div>
              {isActive && (
                <div className={`absolute ${isFloating ? 'top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-t-2xl' : 'bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent-primary rounded-t-full'}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;