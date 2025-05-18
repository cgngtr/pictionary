'use client';

import { useState, useEffect, useCallback } from 'react';
import HomeClient from '@/components/HomeClient';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export type HomePageImageData = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  username?: string;
  profileImage?: string;
  height?: string;
  originalImageRecord?: any;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [allImages, setAllImages] = useState<HomePageImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<HomePageImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const getConsistentHeight = useCallback((id: string) => {
    const minHeight = 280;
    const maxHeight = 450;
    const range = maxHeight - minHeight;
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    
    const normalizedHash = Math.abs(hash) / 2147483647;
    
    const height = Math.floor(normalizedHash * range) + minHeight;
    return `${height}px`;
  }, []);

  const fetchAllImagesAndUsers = useCallback(async () => {
    console.log("HomePage: Starting to fetch all images and user data...");
    setPageError(null);
    try {
      const { data: imageRecords, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;
      if (!imageRecords || imageRecords.length === 0) {
        setAllImages([]);
        setIsLoading(false);
        return;
      }

      const userIds = [...new Set(imageRecords.map(img => img.user_id).filter(id => id))];
      let usersDataMap = new Map();
      let profilesDataMap = new Map();

      if (userIds.length > 0) {
          const [usersResult, profilesResult] = await Promise.all([
          supabase.from('users').select('id, username, first_name, last_name').in('id', userIds),
          supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds)
        ]);

        if (usersResult.error) {
          console.warn("HomePage: Error fetching users data:", usersResult.error);
        } else if (usersResult.data) {
          usersResult.data.forEach(u => usersDataMap.set(u.id, u));
        }

        if (profilesResult.error) {
          console.warn("HomePage: Error fetching profiles data:", profilesResult.error);
        } else if (profilesResult.data) {
          profilesResult.data.forEach(p => profilesDataMap.set(p.user_id, p));
        }
      }

      const imagePromises = imageRecords
        .filter(record => record.storage_path)
        .map(async (record) => {
          const { data: urlData } = await supabase.storage.from('images').getPublicUrl(record.storage_path);
          if (!urlData?.publicUrl) {
            console.warn(`HomePage: Could not get public URL for image ${record.id} with path ${record.storage_path}`);
            return null;
          }

          const userRecord = usersDataMap.get(record.user_id);
          const profileRecord = profilesDataMap.get(record.user_id);
          
          const imageHeight = getConsistentHeight(record.id);
          
          return {
            id: record.id,
            src: urlData.publicUrl,
            alt: record.title || 'Image pin',
            title: record.title || 'Untitled Pin',
            description: record.description,
            username: userRecord?.username || (userRecord ? `${userRecord.first_name} ${userRecord.last_name}` : 'Unknown User'),
            profileImage: profileRecord?.avatar_url,
            height: imageHeight,
            originalImageRecord: record
          };
        });

      const results = await Promise.all(imagePromises);
      const imagesWithUrls = results.filter(Boolean) as HomePageImageData[];
      setAllImages(imagesWithUrls);
    } catch (error: any) {
      console.error("HomePage: General error in fetchAllImagesAndUsers:", error);
      setPageError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, getConsistentHeight]);

  const handleDeletePin = useCallback(async (imageId: string, storagePath: string) => {
    if (!imageId || !storagePath) {
      console.error('Delete error: imageId or storagePath is missing.');
      alert('Could not delete pin due to missing information.');
      return;
    }

    try {
      const [storageResult, dbResult] = await Promise.all([
        supabase.storage.from('images').remove([storagePath]),
        supabase.from('images').delete().match({ id: imageId })
      ]);

      if (storageResult.error) {
        console.error('Storage deletion error:', storageResult.error);
      }

      if (dbResult.error) {
        console.error('Database deletion error:', dbResult.error);
        throw dbResult.error;
      }

      setAllImages(currentImages => currentImages.filter(img => img.id !== imageId));
      alert('Pin deleted successfully!');

    } catch (error: any) {
      console.error('Failed to delete pin:', error);
      alert(`Failed to delete pin: ${error.message}`);
    }
  }, [supabase]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredImages(allImages);
      return;
    }
    
    const lowerTerm = term.toLowerCase().trim();
    const filtered = allImages.filter(image => {
      const titleMatch = image.title?.toLowerCase().includes(lowerTerm);
      const descriptionMatch = image.description?.toLowerCase().includes(lowerTerm);
      return titleMatch || descriptionMatch;
    });
    
    setFilteredImages(filtered);
  }, [allImages]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredImages(allImages);
  }, [allImages]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [allImages, searchTerm, handleSearch]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);

    try {
      console.log("HomePage: Checking initial session...");
      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session } } = await sessionPromise;
      setUser(session?.user || null);
      console.log("HomePage: Initial session checked:", !!session, session?.user?.email);
      
      fetchAllImagesAndUsers().catch(error => {
        console.error("Error fetching images:", error);
        setPageError("Failed to fetch images: " + error.message);
        setIsLoading(false);
      });
    } catch (error: any) {
      console.error("Error during initial data load:", error);
      setPageError("Failed to initialize page: " + error.message);
      setIsLoading(false);
    }
  }, [supabase, fetchAllImagesAndUsers]);

  useEffect(() => {
    let isMounted = true;

    loadInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log("HomePage: Auth state change:", event);
      
      setUser(session?.user || null);
      
      if (event === 'SIGNED_IN') {
        fetchAllImagesAndUsers().catch(error => {
          console.error("Error after sign in:", error);
          if (isMounted) {
            setPageError("Failed to load data after sign in");
            setIsLoading(false);
          }
        });
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setAllImages([]);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, loadInitialData, fetchAllImagesAndUsers]);

  if (isLoading && allImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Pictionary...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <>
        <Navigation onSearch={handleSearch} />
        <div className="pt-20 min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 p-6 rounded-xl shadow-xl w-full max-w-lg text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/30 mb-4">
              {/* Heroicon: ExclamationTriangle */}
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Oops! Something went wrong.</h2>
            <p className="text-gray-600 dark:text-gray-400">{pageError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation onSearch={handleSearch} />
      <div className="pt-6 bg-gray-50 dark:bg-gray-900">
        <HomeClient 
          images={filteredImages} 
          onDelete={handleDeletePin} 
          searchTerm={searchTerm} 
          totalImages={allImages.length} 
          onClearSearch={clearSearch}
        />
      </div>
    </>
  );
}
