'use client';

import { useState } from 'react';
import MasonryGrid from './MasonryGrid';
import UploadModal from './UploadModal';
import type { HomePageImageData } from '@/app/page';

interface HomeClientProps {
  images: HomePageImageData[];
  onDelete: (imageId: string, storagePath: string) => void;
  searchTerm?: string;
  totalImages?: number;
  onClearSearch?: () => void;
}

export default function HomeClient({ 
  images, 
  onDelete, 
  searchTerm = '', 
  totalImages,
  onClearSearch
}: HomeClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const isSearchResults = searchTerm && searchTerm.trim().length > 0;
  const resultsCount = images.length;
  const allImagesCount = totalImages || resultsCount;

  return (
    <>
      <div className="pb-2 px-6">
        {isSearchResults && (
          <div className="mb-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {resultsCount === 0 
                ? `No results found for "${searchTerm}"`
                : `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} for "${searchTerm}"`
              }
              {onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="ml-2 text-red-500 hover:text-red-600 text-sm font-medium"
                  aria-label="Clear search"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onClearSearch()}
                >
                  Clear
                </button>
              )}
            </p>
            {resultsCount === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Try another search term or explore our content
              </p>
            )}
          </div>
        )}
        
        {images && images.length > 0 ? (
          <MasonryGrid images={images} onDelete={onDelete} />
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">
              {isSearchResults 
                ? 'No matching images found.' 
                : 'No images to display.'
              }
            </p>
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