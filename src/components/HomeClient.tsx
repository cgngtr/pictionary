'use client';

import { useState } from 'react';
import MasonryGrid from './MasonryGrid';
import UploadModal from './UploadModal';
import type { HomePageImageData } from '@/app/page';

interface HomeClientProps {
  images: HomePageImageData[];
}

export default function HomeClient({ images }: HomeClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="py-6">
        {images && images.length > 0 ? (
          <MasonryGrid images={images} />
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">No images to display.</p>
          </div>
        )}
      </div>
      
      {/* Floating Create Pin button (mobile only) */}
      <div className="md:hidden fixed right-4 bottom-4">
        <button
          onClick={handleOpenModal}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-colors duration-300"
          aria-label="Create new pin"
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
      <UploadModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
} 