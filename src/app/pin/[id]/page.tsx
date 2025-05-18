'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PinterestModal from '@/components/PinterestModal';
import type { HomePageImageData } from '@/app/page';
import { createClient } from '@/lib/supabase/utils';

const supabase = createClient();

const SUPABASE_STORAGE_PUBLIC_URL = 'https://ozautaqmiyqlendcnrpd.supabase.co/storage/v1/object/public/';
const IMAGE_BUCKET_NAME = 'images';

async function fetchImageById(id: string): Promise<HomePageImageData | null> {
  if (!id) {
    console.error('fetchImageById called with no ID.');
    return null;
  }
  console.log(`Fetching actual image data from Supabase for id: ${id}`);

  try {
    const { data, error } = await supabase
      .from('images')
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
      if (error.code === 'PGRST116') {
        console.warn(`Pin not found in Supabase for id: ${id} (or multiple found). Error:`, error.message);
      } else {
        console.error('Error fetching pin from Supabase:', error);
      }
      return null;
    }

    if (data) {
      
      let username = 'User not found';
      let profileImage = 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'; // Generic default avatar

      if (data.user_id) {
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

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', data.user_id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for user_id ${data.user_id}:`, profileError);
        } else if (profileData && profileData.avatar_url) {
          profileImage = profileData.avatar_url;
          profileImage = profileData.avatar_url;
          if (!profileData.avatar_url.startsWith('http')) {
            profileImage = `${SUPABASE_STORAGE_PUBLIC_URL}avatars/${profileData.avatar_url}`;
          }
        }
      }

      const imageUrl = data.storage_path 
        ? `${SUPABASE_STORAGE_PUBLIC_URL}${IMAGE_BUCKET_NAME}/${data.storage_path}` 
        : '';
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

async function deletePinFromPage(imageId: string, storagePath: string): Promise<void> {
  console.log(`Attempting to delete pin from Supabase: ${imageId}, path: ${storagePath}`);
  alert('Pin deletion from this page needs to be implemented with Supabase calls. This is a simulation.');
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
    } else if (!params.id && !isLoading) {
        setError('No Pin ID provided. Redirecting to homepage.');
        setTimeout(() => router.push('/'), 3000);
    }
  }, [imageId, router]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    router.push('/');
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
    if (!isLoading && !modalImage) {
        router.push('/');
        return null;
    }
    return null; 
  }

  return (
    <div className="w-full h-screen bg-black/10 dark:bg-black/30"> {/* Optional: faint background */}
      <PinterestModal
        isOpen={isModalOpen}
        setIsOpen={handleCloseModal}
        image={modalImage}
        onDeletePin={handleDeletePin}
      />
    </div>
  );
} 