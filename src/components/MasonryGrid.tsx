'use client';

import { useEffect, useState, useCallback } from 'react';
import ImageCard from './ImageCard';
import { HomePageImageData } from '@/app/page';

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

interface MasonryGridProps {
  images: HomePageImageData[];
  onDelete: (imageId: string, storagePath: string) => void;
}

const MasonryGrid = ({ images, onDelete }: MasonryGridProps) => {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const calculateColumns = () => {
      const innerWidth = window.innerWidth;
      if (innerWidth < 640) return 1;
      if (innerWidth < 768) return 2;
      if (innerWidth < 1024) return 3;
      if (innerWidth < 1280) return 4;
      return 5;
    };
    setColumns(calculateColumns());

    const handleResize = () => {
      const newColumnCount = calculateColumns();
      setColumns(currentColumns => newColumnCount !== currentColumns ? newColumnCount : currentColumns);
    };

    const debouncedHandleResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, []);

  const getColumnImages = useCallback(() => {
    if (!images || images.length === 0 || columns === 0) return [];
    const columnContainers: HomePageImageData[][] = Array.from({ length: columns }, () => []);
    images.forEach((image, index) => {
      const columnIndex = index % columns;
      columnContainers[columnIndex].push(image);
    });
    return columnContainers;
  }, [images, columns]);

  return (
    <div className="flex w-full gap-4">
      {getColumnImages().map((columnImgs, columnIndex) => (
        <div key={columnIndex} className="flex-1 flex flex-col gap-4">
          {columnImgs.map((image) => (
            <ImageCard 
              key={image.id}
              imageData={image}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
