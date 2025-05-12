'use client';

import { useState } from 'react';
import PinterestModal from './PinterestModal';

const ImageCard = ({ image, username, profileImage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div 
      className="relative mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
      <img 
        src={image.src} 
        alt={image.alt || 'Pin image'} 
        className="w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
        style={{ height: `${image.height || 'auto'}` }}
        onClick={() => setIsModalOpen(true)}
      />
      
      {/* Hover overlay - using only CSS for the hover effect */}
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
      
      {/* Save button */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
        <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-colors duration-300">
          Save
        </button>
      </div>
      
      {/* User info */}
      <div className="absolute bottom-3 left-3 flex items-center opacity-0 group-hover:opacity-100 transform translate-y-[10px] group-hover:translate-y-0 transition-all duration-300">
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
