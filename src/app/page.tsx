'use client';

import { useState, useEffect, useCallback } from 'react';
import HomeClient from '@/components/HomeClient';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// ImageData tipini ProfilePage'den alabiliriz veya burada yeniden tanımlayabiliriz.
// Şimdilik ProfilePage'deki ile aynı olduğunu varsayalım ve HomeClient'ın bekleyeceği son veri yapısını düşünelim.
export type HomePageImageData = {
  id: string; // image.id
  src: string; // resolved public URL from storage
  alt: string;
  title: string;
  description?: string;
  username?: string; // from users table
  profileImage?: string; // from profiles table (avatar_url)
  // MasonryGrid veya ImageCard'ın ihtiyaç duyabileceği diğer alanlar (örn: height)
  height?: string; // Örneğin '300px', ImageCard bunu kullanıyor olabilir
  // Orijinal image verisini de saklayabiliriz gerekirse
  originalImageRecord?: any; // Supabase'den gelen ham image kaydı
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [allImages, setAllImages] = useState<HomePageImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchAllImagesAndUsers = useCallback(async () => {
    console.log("HomePage: Starting to fetch all images and user data...");
    setIsLoading(true);
    setPageError(null);
    try {
      const { data: imageRecords, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;
      if (!imageRecords) {
        setAllImages([]);
        setIsLoading(false);
        return;
      }

      const userIds = [...new Set(imageRecords.map(img => img.user_id).filter(id => id))];
      let usersDataMap = new Map();
      let profilesDataMap = new Map();

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', userIds);
        if (usersError) console.warn("HomePage: Error fetching users data:", usersError);
        else if (users) users.forEach(u => usersDataMap.set(u.id, u));

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds);
        if (profilesError) console.warn("HomePage: Error fetching profiles data:", profilesError);
        else if (profiles) profiles.forEach(p => profilesDataMap.set(p.user_id, p));
      }

      const imagesWithUrls: HomePageImageData[] = [];
      for (const record of imageRecords) {
        if (!record.storage_path) continue;
        const { data: urlData } = await supabase.storage.from('images').getPublicUrl(record.storage_path);
        if (urlData?.publicUrl) {
          const userRecord = usersDataMap.get(record.user_id);
          const profileRecord = profilesDataMap.get(record.user_id);
          const randomHeight = Math.floor(Math.random() * (450 - 280 + 1)) + 280;
          imagesWithUrls.push({
            id: record.id,
            src: urlData.publicUrl,
            alt: record.title || 'Image pin',
            title: record.title || 'Untitled Pin',
            description: record.description,
            username: userRecord?.username || (userRecord ? `${userRecord.first_name} ${userRecord.last_name}` : 'Unknown User'),
            profileImage: profileRecord?.avatar_url,
            height: `${randomHeight}px`,
            originalImageRecord: record
          });
        } else {
          console.warn(`HomePage: Could not get public URL for image ${record.id} with path ${record.storage_path}`);
        }
      }
      setAllImages(imagesWithUrls);
    } catch (error: any) {
      console.error("HomePage: General error in fetchAllImagesAndUsers:", error);
      setPageError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]); // supabase dependency

  const handleDeletePin = useCallback(async (imageId: string, storagePath: string) => {
    if (!imageId || !storagePath) {
      console.error('Delete error: imageId or storagePath is missing.');
      alert('Could not delete pin due to missing information.');
      return;
    }

    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage.from('images').remove([storagePath]);
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Decide if you want to proceed if storage deletion fails, or alert and stop.
        // For now, we'll log and attempt to delete from DB anyway.
        // throw storageError; // Or alert user and return
      }

      // 2. Delete from database table
      const { error: dbError } = await supabase.from('images').delete().match({ id: imageId });
      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError; // If DB deletion fails, this is more critical
      }

      // 3. Update frontend state
      setAllImages(currentImages => currentImages.filter(img => img.id !== imageId));
      alert('Pin deleted successfully!'); // Or use a more subtle notification

    } catch (error: any) {
      console.error('Failed to delete pin:', error);
      alert(`Failed to delete pin: ${error.message}`);
    }
  }, [supabase]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      console.log("HomePage: Checking initial session...");
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      console.log("HomePage: Initial session checked:", !!session, session?.user?.email);
      await fetchAllImagesAndUsers();
    } catch (error: any) {
      console.error("Error during initial data load:", error);
      setPageError("Failed to initialize page: " + error.message);
    } finally {
      // setIsLoading(false); // fetchAllImagesAndUsers handles its own isLoading
    }
  }, [supabase, fetchAllImagesAndUsers]);

  useEffect(() => {
    loadInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("HomePage: Auth state change:", event);
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        loadInitialData(); // Oturum açıldığında tüm veriyi yeniden yükle
      } else if (event === 'SIGNED_OUT') {
        setAllImages([]);
        // router.push('/login'); // Middleware halletmeli
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, loadInitialData]); // loadInitialData eklendi

  if (isLoading && allImages.length === 0) { // Sadece başlangıç yüklemesinde ve resim yokken tam ekran yükleme göster
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{pageError}</p>
        <button onClick={loadInitialData} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Try Again
        </button>
      </div>
    );
  }
  
  // Kullanıcı oturumu yoksa ve public içerik gösterilecekse bu kontrol farklı olabilir.
  // Şimdilik, eğer bir şekilde buraya gelinirse ve user yoksa (middleware yönlendirmemişse) bir mesaj gösterelim.
  // Ancak idealde, public ana sayfa için bu user kontrolü HomeClient'a devredilmeli veya hiç olmamalı.
  // if (!user && allImages.length === 0) { 
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
  //       <h1 className="text-xl font-semibold text-gray-700 mb-2">No content available.</h1>
  //       <p className="text-gray-600 mb-4">Please log in to see more.</p>
  //       <button onClick={() => router.push('/login')} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
  //         Login
  //       </button>
  //     </div>
  //   );
  // }

  return <HomeClient images={allImages} onDelete={handleDeletePin} />;
}
