import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import UploadModal from './UploadModal';

const Layout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="md:ml-64 pt-16 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      {/* Floating Create Pin button (mobile only) */}
      <div className="md:hidden fixed right-4 bottom-4">
        <button
          onClick={openModal}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-colors duration-300"
        >
          <svg
            className="w-6 h-6"
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
        </button>
      </div>
      
      {/* Upload Modal */}
      <UploadModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Layout;
