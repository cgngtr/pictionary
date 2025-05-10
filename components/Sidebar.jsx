'use client';

import { useState } from 'react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`hidden md:flex flex-col h-screen bg-[#050505] border-r border-[#1a1a1a] fixed left-0 top-[3.5rem] pt-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} shadow-xl z-40`}>
      <div className={`px-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-2 mt-8">
          <li>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-white rounded-xl hover:bg-gray-800/60 hover:text-red-400 group justify-start relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full"></div>
              <div className="z-10 flex items-center justify-center bg-[#121212] rounded-lg p-2 mr-3 group-hover:bg-[#1a1a1a] transition-all duration-300">
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300"
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
              </div>
              <span className={`font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 hidden' : 'opacity-100 translate-x-0'}`}>Home</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-white rounded-xl hover:bg-gray-800/60 hover:text-red-400 group justify-start relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full"></div>
              <div className="z-10 flex items-center justify-center bg-[#121212] rounded-lg p-2 mr-3 group-hover:bg-[#1a1a1a] transition-all duration-300">
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300"
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
              </div>
              <span className={`font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 hidden' : 'opacity-100 translate-x-0'}`}>Explore</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-white rounded-xl hover:bg-gray-800/60 hover:text-red-400 group justify-start relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full"></div>
              <div className="z-10 flex items-center justify-center bg-[#121212] rounded-lg p-2 mr-3 group-hover:bg-[#1a1a1a] transition-all duration-300">
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300"
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
              </div>
              <span className={`font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 hidden' : 'opacity-100 translate-x-0'}`}>Create Pin</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-white rounded-xl hover:bg-gray-800/60 hover:text-red-400 group justify-start relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full"></div>
              <div className="z-10 flex items-center justify-center bg-[#121212] rounded-lg p-2 mr-3 group-hover:bg-[#1a1a1a] transition-all duration-300">
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300"
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
              </div>
              <span className={`font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 hidden' : 'opacity-100 translate-x-0'}`}>Profile</span>
            </a>
          </li>
        </ul>
      </div>
      
      {/* Toggle button in the middle of the sidebar */}
      <div className="absolute left-0 right-0 mx-auto flex justify-center" style={{ top: 'calc(50% - 20px)' }}>
        <button
          onClick={toggleSidebar}
          className="bg-[#121212] border border-[#1a1a1a] shadow-lg rounded-full p-2 text-white hover:bg-[#1a1a1a] hover:text-red-400 transition-all duration-300"
          style={{ position: 'absolute', left: isCollapsed ? '12px' : '60px' }}
        >
          <div className="relative">
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
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;