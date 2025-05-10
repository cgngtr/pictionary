import React, { useState } from 'react';
import NavItem from './NavItem';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { navigationItems } from '../src/constants/navigation';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={`hidden md:flex flex-col h-screen bg-[#050505] border-r border-[#1a1a1a] fixed left-0 top-[3.5rem] pt-0 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } shadow-xl z-40`}
    >
      <div className={`px-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-2 mt-8">
          {navigationItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </div>
      
      {/* Toggle button in the middle of the sidebar */}
      <div className="absolute left-0 right-0 mx-auto flex justify-center" style={{ top: 'calc(50% - 20px)' }}>
        <button
          onClick={toggleSidebar}
          className="bg-[#121212] border border-[#1a1a1a] shadow-lg rounded-full p-2 text-white hover:bg-[#1a1a1a] hover:text-red-400 transition-all duration-300"
          style={{ position: 'absolute', left: isCollapsed ? '12px' : '60px' }}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="relative">
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 