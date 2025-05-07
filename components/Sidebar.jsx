'use client';

import { useState } from 'react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`hidden md:flex flex-col h-screen bg-[#050505] border-r border-gray-700 fixed left-0 top-[3.5rem] pt-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className={`px-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <ul className="space-y-2 mt-4">
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-gray-800 hover:text-red-500 group justify-start"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-red-500"
                style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Home</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-gray-800 hover:text-red-500 group justify-start"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-red-500"
                style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Explore</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-gray-800 hover:text-red-500 group justify-start"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-red-500"
                style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Create Pin</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-gray-800 hover:text-red-500 group justify-start"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-red-500"
                style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Profile</span>
            </a>
          </li>
        </ul>
      </div>
      
      {/* Toggle button in the middle of the sidebar */}
      <div className="absolute left-0 right-0 mx-auto flex justify-center" style={{ top: 'calc(50% - 20px)' }}>
        <button
          onClick={toggleSidebar}
          className="bg-[#050505] border border-gray-700 rounded-r-md p-2 text-white hover:bg-gray-800 transition-all duration-300"
          style={{ position: 'absolute', left: isCollapsed ? '12px' : '60px' }}
        >
          {isCollapsed ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              ></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;