'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PinterestModal from '@/components/PinterestModal';
import type { HomePageImageData } from '@/app/page'; // Ensure this path is correct
import { createClient } from '@/lib/supabase/utils'; // Corrected import

const supabase = createClient(); // Initialize Supabase client

// Define your Supabase project's public storage URL
const SUPABASE_STORAGE_PUBLIC_URL = 'https://ozautaqmiyqlendcnrpd.supabase.co/storage/v1/object/public/';
const IMAGE_BUCKET_NAME = 'images'; // Define the image bucket name

async function fetchImageById(id: string): Promise<HomePageImageData | null> {
  if (!id) {
    console.error('fetchImageById called with no ID.');
    return null;
  }
  console.log(`Fetching actual image data from Supabase for id: ${id}`);

  try {
    const { data, error } = await supabase
      .from('images') // User updated table name
      .select(`
        id,
        title,
        description,
        storage_path,
        user_id,
        original_filename
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116: "Searched for a single row, but multiple rows were found" or "0 rows"
        console.warn(`Pin not found in Supabase for id: ${id} (or multiple found). Error:`, error.message);
      } else {
        console.error('Error fetching pin from Supabase:', error);
      }
      return null;
    }

    if (data) {
      // console.log('Fetched data from Supabase:', data); // Removed for cleanliness
      
      let username = 'User not found';
      let profileImage = 'https://randomuser.me/api/portraits/lego/1.jpg'; // Default avatar

      if (data.user_id) {
        // Fetch username from your custom 'users' table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user_id)
          .single();

        if (userError) {
          console.error(`Error fetching username for user_id ${data.user_id}:`, userError);
        } else if (userData) {
          username = userData.username;
        }

        // Fetch avatar_url from 'profiles' table
        // This assumes profiles.user_id is the auth.uid(), same as images.user_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', data.user_id) // Using images.user_id which is auth.uid()
          .single();

        if (profileError) {
          console.error(`Error fetching profile for user_id ${data.user_id}:`, profileError);
        } else if (profileData && profileData.avatar_url) {
          // Assuming avatar_url might be a full URL or a path that needs prefixing.
          // If it's a relative path in a specific bucket (e.g., 'avatars'), construct the full URL:
          // profileImage = `${SUPABASE_STORAGE_PUBLIC_URL}avatars/${profileData.avatar_url}`;
          // For now, let's assume it might be a full URL or needs to be handled by the component if it's a path.
          // If it's a path relative to the main image bucket, it might be: `${SUPABASE_STORAGE_PUBLIC_URL}${IMAGE_BUCKET_NAME}/${profileData.avatar_url}`
          // Let's try using it directly. If it doesn't work, we'll know it's a path.
          profileImage = profileData.avatar_url;
          // A common pattern is to check if it's already a full URL:
          if (!profileData.avatar_url.startsWith('http')) {
            // Assuming avatars are in a bucket named 'avatars'
            // Adjust BUCKET_NAME if it's different or stored alongside main images
            profileImage = `${SUPABASE_STORAGE_PUBLIC_URL}avatars/${profileData.avatar_url}`;
          }
        }
      }

      const imageUrl = data.storage_path 
        ? `${SUPABASE_STORAGE_PUBLIC_URL}${IMAGE_BUCKET_NAME}/${data.storage_path}` 
        : '';
      // console.log('Constructed imageUrl:', imageUrl); // Removed for cleanliness
      if (!imageUrl || !data.storage_path) { 
        console.error(`Image storage_path is missing or empty for pin id: ${id}. Cannot construct image URL.`);
      }
      
      const transformedData: HomePageImageData = {
        id: data.id,
        src: imageUrl,
        alt: data.title || 'Pin image',
        title: data.title || 'Untitled Pin',
        description: data.description || '',
        username: username,
        profileImage: profileImage,
        originalImageRecord: {
          id: data.original_filename || data.id,
          storage_path: data.storage_path,
        },
      };
      return transformedData;
    }
    console.warn(`No data returned from Supabase for pin id: ${id}, but no error reported.`);
    return null;
  } catch (e) {
    console.error('An unexpected error occurred in fetchImageById:', e);
    return null;
  }
}

// Placeholder for your actual pin deletion logic from this page
async function deletePinFromPage(imageId: string, storagePath: string): Promise<void> {
  console.log(`Attempting to delete pin from Supabase: ${imageId}, path: ${storagePath}`);
  // Implement actual deletion logic here using your Supabase client
  // e.g., await supabase.from('your_table_name').delete().match({ id: imageId });
  // And: await supabase.storage.from('your_bucket_name').remove([storagePath]);

  alert('Pin deletion from this page needs to be implemented with Supabase calls. This is a simulation.');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}


export default function PinPage() {
  const router = useRouter();
  const params = useParams();
  const [modalImage, setModalImage] = useState<HomePageImageData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal is open by default on this page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imageId = typeof params.id === 'string' ? params.id : null;

  useEffect(() => {
    if (imageId) {
      setIsLoading(true);
      setError(null);
      fetchImageById(imageId)
        .then((data) => {
          if (data) {
            setModalImage(data);
          } else {
            setError('Pin not found. You will be redirected to the homepage.');
            setTimeout(() => router.push('/'), 3000);
          }
        })
        .catch((err) => {
          console.error('Error fetching pin data:', err);
          setError('Failed to load pin. You will be redirected to the homepage.');
          setTimeout(() => router.push('/'), 3000);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!params.id && !isLoading) { // Handle case where ID might be missing after initial load check
        setError('No Pin ID provided. Redirecting to homepage.');
        setTimeout(() => router.push('/'), 3000);
    }
  }, [imageId, router]); // REMOVED isLoading from dependency array

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    router.push('/'); // Navigate to homepage when modal is closed
  }, [router]);

  const handleDeletePin = useCallback(async (pinId: string, storagePath: string) => {
    if (!modalImage) return;
    try {
      await deletePinFromPage(pinId, storagePath);
      alert('Pin successfully deleted. Redirecting to homepage.');
      router.push('/');
    } catch (err) {
      console.error('Error deleting pin from page:', err);
      alert('Failed to delete pin.');
      // Optionally, you might want to keep the modal open or handle UI differently
    }
  }, [modalImage, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading pin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900">
        <p className="text-lg text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!modalImage || !isModalOpen) {
    // This case should ideally be handled by redirection if modalImage is null after loading.
    // If modal is explicitly closed, redirection handled by handleCloseModal.
    // Adding a fallback message or redirect if somehow reached.
    if (!isLoading && !modalImage) { // ensure it's not during initial load
        router.push('/');
        return null; // Render nothing while redirecting
    }
    return null; 
  }

  return (
    <div className="w-full h-screen bg-black/10 dark:bg-black/30"> {/* Optional: faint background */}
      <PinterestModal
        isOpen={isModalOpen}
        setIsOpen={handleCloseModal} // This will navigate away
        image={modalImage}
        onDeletePin={handleDeletePin}
      />
    </div>
  );
} 