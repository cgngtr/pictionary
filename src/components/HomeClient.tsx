'use client';

import { useState } from 'react';
import MasonryGrid from './MasonryGrid';
import UploadModal from './UploadModal';

export default function HomeClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock data for our Pinterest-like grid
  const [images] = useState([
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
      alt: 'A cute cat',
      height: '300px',
      username: 'catlover',
      profileImage: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
      alt: 'Colorful architecture',
      height: '450px',
      username: 'traveler',
      profileImage: 'https://randomuser.me/api/portraits/men/2.jpg'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1505678261036-a3fcc5e884ee',
      alt: 'Food platter',
      height: '350px',
      username: 'foodie',
      profileImage: 'https://randomuser.me/api/portraits/women/3.jpg'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
      alt: 'Mountain landscape',
      height: '400px',
      username: 'naturelover',
      profileImage: 'https://randomuser.me/api/portraits/men/4.jpg'
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845',
      alt: 'Modern interior',
      height: '280px',
      username: 'designer',
      profileImage: 'https://randomuser.me/api/portraits/women/5.jpg'
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1584184924103-e310d9dc82fc',
      alt: 'Fitness workout',
      height: '320px',
      username: 'fitnessguru',
      profileImage: 'https://randomuser.me/api/portraits/men/6.jpg'
    },
    {
      id: 7,
      src: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6',
      alt: 'Coffee art',
      height: '380px',
      username: 'coffeelover',
      profileImage: 'https://randomuser.me/api/portraits/women/7.jpg'
    },
    {
      id: 8,
      src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
      alt: 'Beach sunset',
      height: '420px',
      username: 'beachbum',
      profileImage: 'https://randomuser.me/api/portraits/men/8.jpg'
    },
    {
      id: 9,
      src: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60',
      alt: 'Vintage car',
      height: '300px',
      username: 'carfan',
      profileImage: 'https://randomuser.me/api/portraits/women/9.jpg'
    },
    {
      id: 10,
      src: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
      alt: 'Food close-up',
      height: '350px',
      username: 'chefmaster',
      profileImage: 'https://randomuser.me/api/portraits/men/10.jpg'
    },
    {
      id: 11,
      src: 'https://images.unsplash.com/photo-1547586696-ea22b4d4235d',
      alt: 'City skyline',
      height: '400px',
      username: 'cityexplorer',
      profileImage: 'https://randomuser.me/api/portraits/women/11.jpg'
    },
    {
      id: 12,
      src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
      alt: 'Hiking trail',
      height: '380px',
      username: 'adventurer',
      profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'
    },
    {
      id: 13,
      src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
      alt: 'Road trip',
      height: '320px',
      username: 'roadtripper',
      profileImage: 'https://randomuser.me/api/portraits/women/13.jpg'
    },
    {
      id: 14,
      src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      alt: 'Gourmet dish',
      height: '340px',
      username: 'gourmetlover',
      profileImage: 'https://randomuser.me/api/portraits/men/14.jpg'
    },
    {
      id: 15,
      src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
      alt: 'Workspace setup',
      height: '300px',
      username: 'productivityguru',
      profileImage: 'https://randomuser.me/api/portraits/women/15.jpg'
    },
  ]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="py-6">
        <MasonryGrid images={images} />
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