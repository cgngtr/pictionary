'use client';

import { useState } from 'react';
import PinterestModal from './PinterestModal';
import type { HomePageImageData } from '@/app/page';

interface ImageCardProps {
  imageData: HomePageImageData;
  onDelete: (imageId: string, storagePath: string) => Promise<void>;
}

const ImageCard = ({ imageData, onDelete }: ImageCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    id,
    src, 
    alt, 
    height, 
    username, 
    profileImage, 
    title, 
    description,
    originalImageRecord
  } = imageData;

  const handleDeletePin = async (imageId: string, storagePath: string) => {
    return onDelete(imageId, storagePath);
  };

  return (
    <>
      <div 
        className="relative mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
        tabIndex={0}
        aria-label={alt || title || 'Open pin details'}
      >
        <img 
          src={src}
          alt={alt || title || 'Pin image'} 
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 align-bottom"
          style={{ height: `${height || 'auto'}` }}
        />
        
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
        
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
          <button 
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-colors duration-300 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              alert('Save clicked! (Not implemented)');
            }}
            aria-label="Save pin"
          >
            Save
          </button>
        </div>
        
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transform translate-y-[10px] group-hover:translate-y-0 transition-all duration-300 pointer-events-none w-[calc(100%-3rem)]">
          {title && (
            <p className="text-white font-bold text-md mb-1 truncate" title={title}>{title}</p>
          )}
          {(username || profileImage) && (
            <div className="flex items-center">
              {profileImage && (
                <img 
                  src={profileImage}
                  alt={username || 'User'} 
                  className="w-6 h-6 rounded-full mr-2 border-2 border-white shadow-sm flex-shrink-0"
                />
              )}
              {username && (
                <span className="text-white font-semibold text-xs truncate" title={username}>{username}</span>
              )}
            </div>
          )}
        </div>
      </div>
        
      <PinterestModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        image={imageData}
        onDeletePin={handleDeletePin}
      />
    </>
  );
};

export default ImageCard;
