'use client';

import React, { useState, useEffect, MouseEvent, KeyboardEvent as ReactKeyboardEvent, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { HomePageImageData } from '@/app/page';

const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const Heart = dynamic(() => import('lucide-react').then(mod => mod.Heart), { ssr: false });
const Share2 = dynamic(() => import('lucide-react').then(mod => mod.Share2), { ssr: false });
const Download = dynamic(() => import('lucide-react').then(mod => mod.Download), { ssr: false });
const Bookmark = dynamic(() => import('lucide-react').then(mod => mod.Bookmark), { ssr: false });
const Trash2 = dynamic(() => import('lucide-react').then(mod => mod.Trash2), { ssr: false });
const Check = dynamic(() => import('lucide-react').then(mod => mod.Check), { ssr: false });

interface PinterestModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  image: HomePageImageData | null;
  onDeletePin: (imageId: string, storagePath: string) => Promise<void>;
}

export default function PinterestModal({ isOpen, setIsOpen, image, onDeletePin }: PinterestModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleClose = (e?: MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen, setIsOpen]);

  const handleSave = (e: MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleLike = (e: MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!image || !image.id) {
      console.error('Cannot copy link: image ID is missing.');
      alert('Could not copy link. Image ID is missing.');
      return;
    }
    const shareUrl = `${window.location.origin}/pin/${image.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!image || !image.id || !image.originalImageRecord?.storage_path) {
      console.error('Cannot delete: image data or storage path is missing.');
      alert('Could not delete pin. Required information is missing.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this pin?')) {
      try {
        await onDeletePin(image.id, image.originalImageRecord.storage_path);
        setIsOpen(false);
      } catch (error) {
        console.error('Error deleting pin from modal:', error);
        alert('Failed to delete pin. Please try again.');
      }
    }
  };

  const handleDownload = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!image || !image.src) {
      console.error('Cannot download: image source is missing.');
      alert('Could not download image. Source is missing.');
      return;
    }

    try {
      const response = await fetch(image.src);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = image.src.split('.').pop() || 'jpg';
      const fileName = image.title ? `${image.title}.${fileExtension}` : `download.${fileExtension}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  if (!isOpen || !image) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pinterest-modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image section */}
        <div className="relative w-full md:w-3/5 bg-gray-100 dark:bg-gray-700 overflow-hidden aspect-[3/4]">
          <img 
            src={image.src} 
            alt={image.alt || 'Pin image'} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Content section */}
        <div className="w-full md:w-2/5 p-6 flex flex-col dark:bg-gray-800 dark:text-white overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
              <button 
                type="button"
                title="Download"
                onClick={handleDownload}
                className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                {Download && <Download size={18} />}
              </button>
              <button 
                type="button"
                title="Share"
                onClick={handleShare}
                className="flex items-center gap-1 rounded-full p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                {isCopied ? (
                  Check && <Check size={18} className="text-green-500" />
                ) : (
                  Share2 && <Share2 size={18} />
                )}
                {isCopied && <span className="text-sm text-green-500 dark:text-green-400">Copied!</span>}
              </button>
              <button 
                type="button"
                title="Delete Pin"
                onClick={handleDelete}
                className="rounded-full p-2 bg-gray-100 hover:bg-red-100 text-red-500 dark:bg-gray-700 dark:hover:bg-red-800 dark:text-red-400"
              >
                {Trash2 && <Trash2 size={18} />}
              </button>
            </div>
            <button 
              type="button"
              title="Close"
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleClose}
              aria-label="Close modal"
            >
              {X && <X size={20} />}
            </button>
          </div>

          <h2 id="pinterest-modal-title" className="text-xl font-semibold mb-2 break-words">{image.title || 'Beautiful Minimalist Design'}</h2>
          {image.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 break-words text-sm">{image.description}</p>
          )}

          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 overflow-hidden flex-shrink-0">
              <img
                src={image.profileImage || 'https://randomuser.me/api/portraits/women/1.jpg'}
                alt={image.username || 'User avatar'}
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium break-words">{image.username || 'Sarah Johnson'}</p>
              {/* <p className="text-gray-500 dark:text-gray-400 text-sm">Designer</p> */}
            </div>
          </div>

          {/* Spacer to push the action buttons to the bottom */}
          <div className="flex-grow"></div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
            <div className="flex items-center gap-2 justify-between">
              <button 
                type="button"
                className={`flex items-center gap-1 px-3 py-2 rounded-full ${isLiked ? 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={handleLike}
              >
                {Heart && <Heart size={16} fill={isLiked ? "currentColor" : "none"} />} 
                <span className="text-sm">{isLiked ? '25' : '24'}</span>
              </button>
              <button 
                type="button"
                className={`px-4 py-2 rounded-full font-semibold ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
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
