'use client';

import { useEffect, useState } from 'react';
import ImageCard from './ImageCard';
import { HomePageImageData } from '@/app/page'; // Adjusted import path

const MasonryGrid = ({ images }: { images: HomePageImageData[] }) => {
  const [columns, setColumns] = useState(4);

  // Responsive column adjustment based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1);
      } else if (window.innerWidth < 768) {
        setColumns(2);
      } else if (window.innerWidth < 1024) {
        setColumns(3);
      } else if (window.innerWidth < 1280) {
        setColumns(4);
      } else {
        setColumns(5);
      }
    };

    handleResize(); // Set initial columns
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Distribute images into columns
  const getColumnImages = () => {
    const columnImages: HomePageImageData[][] = Array.from({ length: columns }, () => []);
    
    images.forEach((image: HomePageImageData, index: number) => {
      // Add each image to the column with the least height
      const columnIndex = index % columns;
      columnImages[columnIndex].push(image);
    });
    
    return columnImages;
  };

  return (
    <div className="flex w-full gap-4">
      {getColumnImages().map((columnImages: HomePageImageData[], columnIndex: number) => (
        <div key={columnIndex} className="flex-1 flex flex-col">
          {columnImages.map((image: HomePageImageData, imageIndex: number) => (
            <ImageCard 
              key={`${columnIndex}-${imageIndex}`}
              imageData={image}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
