'use client'

import { useState } from 'react'
import MasonryGrid from './MasonryGrid'
import PinterestModal from './PinterestModal'

export default function Gallery() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
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
  ])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <>
      <div className="py-6">
        <MasonryGrid images={images} />
      </div>
      
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
      
      {/* Pinterest Modal */}
      <PinterestModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen}
        image={selectedImage}
      />
    </>
  )
} 