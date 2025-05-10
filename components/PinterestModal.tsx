'use client';

import React, { useState, useEffect } from 'react';
// Dynamically import Lucide React icons to avoid SSR issues
import dynamic from 'next/dynamic';

// Dynamically import icons with no SSR
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const Heart = dynamic(() => import('lucide-react').then(mod => mod.Heart), { ssr: false });
const Share2 = dynamic(() => import('lucide-react').then(mod => mod.Share2), { ssr: false });
const Download = dynamic(() => import('lucide-react').then(mod => mod.Download), { ssr: false });
const Bookmark = dynamic(() => import('lucide-react').then(mod => mod.Bookmark), { ssr: false });
const MessageCircle = dynamic(() => import('lucide-react').then(mod => mod.MessageCircle), { ssr: false });

export default function PinterestModal({ isOpen, setIsOpen, image }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close modal with Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Add event listener for Escape key
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore scrolling when modal is closed
        document.body.style.overflow = 'auto';
      };
    }
  }, []);

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e) => {
    // Only close if the backdrop itself is clicked, not its children
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-screen overflow-hidden flex flex-col md:flex-row shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Left: Image section */}
        <div className="relative w-full md:w-3/5 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img 
            src={image?.src || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131'} 
            alt={image?.alt || 'Pin image'} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Right: Content section */}
        <div className="w-full md:w-2/5 p-6 flex flex-col h-full dark:bg-gray-800 dark:text-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button 
                className={`rounded-full p-2 ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`}
                onClick={handleSave}
              >
                <Bookmark size={18} />
              </button>
              <button className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
                <Share2 size={18} />
              </button>
              <button className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
                <Download size={18} />
              </button>
            </div>
            <button 
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700" 
              onClick={handleClose}
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-2">{image?.title || 'Beautiful Minimalist Design'}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{image?.description || 'Create a stunning space with these minimalist design tips that blend functionality and aesthetics.'}</p>

          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
              <img
                src={image?.profileImage || 'https://randomuser.me/api/portraits/women/1.jpg'}
                alt="User avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{image?.username || 'Sarah Johnson'}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Designer</p>
            </div>
          </div>

          {/* Spacer to push the action buttons to the bottom */}
          <div className="flex-grow"></div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
            <div className="flex items-center gap-2 justify-between">
              <button 
                className={`flex items-center gap-1 px-3 py-2 rounded-full ${isLiked ? 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={handleLike}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> 
                <span className="text-sm">{isLiked ? '25' : '24'}</span>
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}
                onClick={handleSave}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
