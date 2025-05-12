import React, { useState } from 'react';
import NavItem from './NavItem';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { navigationItems } from '../constants/navigation';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-800 dark:text-white">Pictionary</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 