'use client';

import { useState } from 'react';
import PinterestModal from './PinterestModal';

const ImageCard = ({ image, username, profileImage }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div 
      className="relative mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={image.src} 
        alt={image.alt || 'Pin image'} 
        className="w-full object-cover cursor-pointer"
        style={{ height: `${image.height || 'auto'}` }}
        onClick={() => setIsModalOpen(true)}
      />
      
      {/* Hover overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col justify-between p-3">
          <div className="flex justify-end">
            <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-colors duration-300">
              Save
            </button>
          </div>
          
          <div className="flex items-center mt-auto">
            {profileImage && (
              <img 
                src={profileImage} 
                alt={username} 
                className="w-8 h-8 rounded-full mr-2 border border-white"
              />
            )}
            {username && (
              <span className="text-white font-medium text-sm">{username}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Pinterest Modal */}
      {isModalOpen && (
        <PinterestModal 
          isOpen={isModalOpen} 
          setIsOpen={setIsModalOpen} 
          image={{
            src: image?.src || '',
            alt: image?.alt || 'Pin image',
            height: image?.height || 'auto',
            username: username || 'User',
            profileImage: profileImage || 'https://randomuser.me/api/portraits/women/1.jpg',
            title: image?.title || 'Beautiful Image',
            description: image?.description || 'A stunning image worth saving to your collection.'
          }}
        />
      )}
    </div>
  );
};

export default ImageCard;
