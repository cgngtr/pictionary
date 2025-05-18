'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import PinterestModal from '@/components/PinterestModal';
import EditProfileModal from '@/components/EditProfileModal';

type ProfileData = {
  id: string;
  user_id: string;
  description: string;
  avatar_url: string;
  cover_image_url?: string;
};

type UserData = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
};

type ImageData = {
  id: string;
  user_id: string;
  storage_path: string;
  original_filename: string;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userImages, setUserImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<{[key: string]: string}>({});
  const [bucketExists, setBucketExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPinForModal, setSelectedPinForModal] = useState<ImageData | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  const fetchUserImages = useCallback(async (userId: string) => {
    try {
      console.log(`ProfilePage: Fetching images for user ${userId}. Bucket exists state: ${bucketExists}`);
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('ProfilePage: Error fetching user images records:', error);
        return;
      }
      
      setUserImages(data || []);
      console.log('ProfilePage: User image records fetched:', data);
      
      if (data && data.length > 0) {
        const urls: {[key: string]: string} = {};
        let allUrlsGenerated = true;

        for (const image of data) {
          console.log(`ProfilePage: Processing image record ID: ${image.id}, Path: ${image.storage_path}`);
          if (!image.storage_path) {
            console.warn(`ProfilePage: Image ID ${image.id} has no storage_path. Skipping URL generation.`);
            allUrlsGenerated = false;
            continue;
          }

          const { data: urlData } = await supabase.storage
            .from('images')
            .getPublicUrl(image.storage_path);

          if (urlData?.publicUrl) {
            urls[image.id] = urlData.publicUrl;
            console.log(`ProfilePage: Generated public URL for ${image.id} via Supabase SDK: ${urlData.publicUrl}`);
          } else {
            console.warn(`ProfilePage: Failed to get public URL for ${image.id} using Supabase SDK. storage_path: ${image.storage_path}`);
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
                const directUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${image.storage_path}`;
                urls[image.id] = directUrl;
                console.warn(`ProfilePage: Using manually constructed URL for ${image.id} as fallback: ${directUrl}`);
            } else {
                console.error(`ProfilePage: NEXT_PUBLIC_SUPABASE_URL is not defined. Cannot construct manual URL for ${image.id}.`);
                allUrlsGenerated = false;
            }
          }
        }
        
        setImageUrls(urls);
        console.log('ProfilePage: Final imageUrls state set:', urls);
        if (!allUrlsGenerated) {
            console.warn("ProfilePage: Not all image URLs could be generated. Some images might not load.");
        }
      }
    } catch (err) {
      console.error('ProfilePage: Error in fetchUserImages function:', err);
    }
  }, [supabase, bucketExists]);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: userDataFromTable, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError && userError.code !== 'PGRST116') {
        console.error('ProfilePage: Error fetching from users table:', userError);
        throw userError;
      }
      setUserData(userDataFromTable);

      const { data: profileDataFromTable, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('ProfilePage: Error fetching from profiles table:', profileError);
        throw profileError;
      }
      setProfileData(profileDataFromTable);
      
      if (!userDataFromTable) {
        console.warn('ProfilePage: User data missing from \'users\' table. User may need to re-register or contact support.');
        setError('Critical user information is missing. Please try signing out and in, or contact support if the issue persists.');
        return false;
      }

      if (!profileDataFromTable && pathname !== '/finish-profile') {
        console.log('ProfilePage: Profile data missing, redirecting to /finish-profile');
        router.push('/finish-profile');
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError(error.message || 'Failed to load user data');
      return false;
    }
  }, [supabase, pathname, router]);

  const setupStorage = useCallback(async (userId: string) => {
    try {
      console.log('ProfilePage: Initializing storage setup...');
      console.log('ProfilePage: Skipping RLS on storage.buckets setup (not needed)');

      const { data: rpcPublicityData, error: rpcPublicityError } = await supabase.rpc('manage_images_bucket_publicity');
      if (rpcPublicityError) {
        console.error('ProfilePage: RPC manage_images_bucket_publicity failed (network/PostgREST error):', rpcPublicityError);
        setError(`Failed to configure storage (RPC error): ${rpcPublicityError.message}`);
        return false;
      } else if (rpcPublicityData && !rpcPublicityData.success) {
        console.error('ProfilePage: RPC manage_images_bucket_publicity did not succeed:', rpcPublicityData?.message || 'No message from RPC.');
        setError(`Failed to configure storage (RPC execution failed): ${rpcPublicityData?.message || 'Unknown RPC error'}`);
        return false;
      } else if (rpcPublicityData && rpcPublicityData.success) {
        console.log('ProfilePage: RPC manage_images_bucket_publicity reported success:', rpcPublicityData.message);
      }
      
      console.log('ProfilePage: Checking if bucket "images" exists...');
      const { data: bucketInfo, error: getBucketError } = await supabase.storage.getBucket('images');
      if (getBucketError) {
        if (getBucketError.message && getBucketError.message.toLowerCase().includes('bucket not found')) {
          console.log('ProfilePage: Bucket "images" not found. Attempting to create it...');
          const { error: createError } = await supabase.storage.createBucket('images', { public: true });
          if (createError) {
            console.error('ProfilePage: Could not create bucket "images" (RLS on storage.buckets?):', createError);
            setError(`Storage setup error: Could not create bucket. ${createError.message}`);
            return false;
          } else {
            console.log('ProfilePage: Bucket "images" created successfully.');
            setBucketExists(true);
          }
        } else {
          console.error('ProfilePage: Error getting bucket "images" (RLS on storage.buckets for SELECT?):', getBucketError);
          setError(`Storage setup error: Could not verify bucket. ${getBucketError.message}`);
          return false;
        }
      } else {
        console.log('ProfilePage: Bucket "images" exists.');
        if (!bucketInfo.public) {
          console.log('ProfilePage: Bucket "images" is not public. Attempting to update it...');
          const { error: updateError } = await supabase.storage.updateBucket('images', { public: true });
          if (updateError) {
            console.error('ProfilePage: Could not update bucket "images" to public:', updateError);
            setError(`Storage setup error: Could not update bucket. ${updateError.message}`);
            return false;
          }
        }
        setBucketExists(true);
      }

      if (bucketExists || (bucketInfo && bucketInfo.public)) {
        console.log('ProfilePage: Bucket ready, fetching user images for user ID:', userId);
        await fetchUserImages(userId);
      } else {
        console.warn('ProfilePage: Bucket not confirmed as ready. Skipping fetchUserImages.');
      }
      
      return true;
    } catch (error: any) {
      console.error('Error setting up storage:', error);
      setError(error.message || 'Failed to set up storage');
      return false;
    }
  }, [supabase, bucketExists, fetchUserImages]);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        console.log("ProfilePage: User session found:", session.user.email);
        
        const userDataSuccess = await loadUserData(session.user.id);
        if (!userDataSuccess) {
          setIsLoading(false);
          return;
        }
        
        await setupStorage(session.user.id);
      } else {
        console.log("ProfilePage: No session, redirecting via router.refresh().");
        router.refresh();
      }
    } catch (error: any) {
      console.error('ProfilePage: Error in checkSession:', error);
      setError(error.message || 'An unexpected error occurred.');
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
      setIsSessionChecked(true);
    }
  }, [supabase, router, loadUserData, setupStorage]);

  const recoverSession = useCallback(async () => {
    if (isLoading) return;

    console.log("ProfilePage: Attempting to recover session...");
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("ProfilePage: No valid session found during recovery");
        setError('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }
      
      console.log("ProfilePage: Valid session found during recovery");
      setUser(session.user);
      
      if (!userData || !profileData) {
        await loadUserData(session.user.id);
      }
      
      if (userImages.length === 0 || Object.keys(imageUrls).length === 0) {
        await fetchUserImages(session.user.id);
      }
      
      setError(null);
    } catch (error: any) {
      console.error('ProfilePage: Error recovering session:', error);
      
      if (error.message?.includes('JWT') || error.message?.includes('token') || 
          error.message?.includes('session')) {
        setError('Session error. Please log in again.');
        router.push('/login');
      } else {
        setError(`Error refreshing data: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading, supabase, router, userData, profileData, 
    userImages, imageUrls, loadUserData, fetchUserImages
  ]);

  useEffect(() => {
    let isMounted = true;
    let visibilityTimeout: NodeJS.Timeout | null = null;
    
    if (!isSessionChecked) {
      checkSession();
    }

    const handleVisibilityChange = () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = null;
      }
      
      if (document.visibilityState === 'visible' && isMounted) {
        console.log("ProfilePage: Page visibility changed to visible");
        
        visibilityTimeout = setTimeout(() => {
          recoverSession();
        }, 300);
      }
    };
    
    const handleFocus = () => {
      console.log("ProfilePage: Window focused");
      if (isMounted && !isLoading && lastSessionCheckRef.current + 10000 < Date.now()) {
        lastSessionCheckRef.current = Date.now();
        recoverSession();
      }
    };

    const lastSessionCheckRef = { current: Date.now() };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    const sessionRefreshInterval = setInterval(() => {
      if (isMounted && user) {
        console.log("ProfilePage: Performing periodic session refresh");
        supabase.auth.refreshSession();
      }
    }, 9 * 60 * 1000);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`ProfilePage: Auth event: ${event}`);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.refresh();
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        checkSession();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        
        lastSessionCheckRef.current = Date.now();
        
        if (error?.includes('session') || error?.includes('expired')) {
          setError(null);
        }
      }
    });

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      clearInterval(sessionRefreshInterval);
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, checkSession, isSessionChecked, user, recoverSession, isLoading, error]);

  const handlePinClick = (pin: ImageData) => {
    setSelectedPinForModal(pin);
    setIsModalOpen(true);
    console.log("ProfilePage: Pin clicked, opening modal for:", pin);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPinForModal(null);
    console.log("ProfilePage: Closing pin detail modal.");
  };

  const handleDeletePin = useCallback(async (imageId: string, storagePath: string) => {
    if (!imageId || !storagePath) {
      console.error('Delete error: imageId or storagePath is missing.');
      alert('Could not delete pin due to missing information.');
      return;
    }
    try {
      const { error: storageError } = await supabase.storage.from('images').remove([storagePath]);
      if (storageError) {
        console.warn('Storage deletion warning (proceeding with DB deletion):', storageError);
      }
      const { error: dbError } = await supabase.from('images').delete().match({ id: imageId });
      if (dbError) throw dbError;

      setUserImages(currentImages => currentImages.filter(img => img.id !== imageId));
      setImageUrls(currentUrls => {
        const newUrls = { ...currentUrls };
        delete newUrls[imageId];
        return newUrls;
      });
      alert('Pin deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete pin:', error);
      alert(`Failed to delete pin: ${error.message}`);
    }
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User signed out successfully, refreshing router...');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setProfileData(data);
      } catch (error: any) {
        console.error('Error refreshing profile data:', error);
      }
    }
  };

  const userProfile = {
    name: userData ? `${userData.first_name} ${userData.last_name}` : (user?.email || 'User'),
    username: userData?.username || user?.email?.split('@')[0] || '@user',
    bio: profileData?.description || 'No description available',
    profileImage: profileData?.avatar_url || 'https://source.unsplash.com/random/400x400/?portrait',
    coverImage: profileData?.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    stats: {
      pins: userImages.length
    }
  };

  if (isLoading && !isSessionChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Profile...</p>
      </div>
    );
  }
  
  if (error && !user) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 p-6 rounded-xl shadow-xl w-full max-w-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/30 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Oops! Profile Error.</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
            aria-label="Try again"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user && isSessionChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Redirecting to login...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500 dark:border-gray-400"></div>
      </div>
    );
  }

  const renderInlineError = () => (
    error && user && (
      <div className="my-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-md shadow">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {error} <button onClick={() => setError(null)} className="ml-2 font-medium underline hover:text-yellow-600 dark:hover:text-yellow-200">Dismiss</button>
            </p>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 -mt-16"> {/* Adjusted background slightly */}
        <div className="relative w-full h-[300px] md:h-[400px]">
          <Image
            src={userProfile.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" /> {/* Enhanced gradient */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderInlineError()}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-32 pb-8">
            <div className="relative z-10">
              <div className="relative w-36 h-36 md:w-40 md:h-40 mx-auto md:mx-0 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-xl group">
                <Image
                  src={userProfile.profileImage}
                  alt={userProfile.name}
                  fill
                  className="object-cover group-hover:brightness-90 transition-all duration-300"
                  priority
                />
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-sm font-medium"
                  aria-label="Edit profile picture"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-6 text-center md:text-left md:flex md:items-start md:justify-between"> {/* Changed to items-start */}
              <div className="md:flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{userProfile.name}</h1>
                <p className="mt-1 text-lg md:text-xl text-gray-600 dark:text-gray-400">{user?.email}</p> {/* Use optional chaining for user */}
                <p className="mt-3 text-md md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">{userProfile.bio}</p>

                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
                  <div className="text-center md:text-left">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{userProfile.stats.pins}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pins</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:mt-2 md:ml-6 flex-shrink-0">
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 shadow-md hover:shadow-lg"
                  aria-label="Edit profile details"
                  tabIndex={0}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pb-16">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6 sm:mb-8">My Creations</h2>
            {isLoading && userImages.length === 0 ? (
               <div className="flex justify-center items-center py-12">
                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
               </div>
            ) : userImages.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No pins created yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start by creating your first visual masterpiece!</p>
                <div className="mt-6">
                  <button 
                    onClick={() => router.push('/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create Pin
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6"> {/* Added xl, adjusted gap */}
                {userImages.map((image) => (
                  <div 
                    key={image.id} 
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gray-200 dark:bg-gray-800" // Added base bg for loading
                    onClick={() => handlePinClick(image)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinClick(image)}
                    aria-label={image.title || 'Open pin details'}
                  >
                    {imageUrls[image.id] ? (
                      <>
                        <Image
                          src={imageUrls[image.id]}
                          alt={image.title || 'Pin image'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.error(`ProfilePage: Error loading image ID ${image.id} from URL ${imageUrls[image.id]}`);
                            (e.target as HTMLImageElement).onerror = null;
                            e.currentTarget.parentElement?.classList.add('image-error-placeholder'); 
                            e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        
                        <div className="absolute top-2 right-2 md:top-3 md:right-3 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                          <button 
                            className="bg-white/90 hover:bg-white text-red-500 font-semibold py-1.5 px-3 md:py-2 md:px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-xs md:text-sm"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              alert('Save clicked! (Not implemented on profile page yet)'); 
                            }}
                            aria-label="Save pin"
                          >
                            Save
                          </button>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          {image.title && (
                            <p className="text-white font-bold text-sm md:text-md mb-1 truncate" title={image.title}>{image.title}</p>
                          )}
                          <div className="flex items-center">
                            {userProfile.profileImage && (
                              <img 
                                src={userProfile.profileImage} 
                                alt={userProfile.username || 'User'} 
                                className="w-5 h-5 md:w-6 md:h-6 rounded-full mr-2 border border-white/50 shadow-sm flex-shrink-0"
                              />
                            )}
                            {userProfile.username && (
                              <span className="text-white font-semibold text-xs md:text-sm truncate" title={userProfile.username}>{userProfile.username}</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg className="w-10 h-10 animate-pulse text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p className="mt-2 text-xs">Loading image...</p>
                        {!image.storage_path && <p className="text-xs text-red-400 dark:text-red-500 mt-1">Missing path</p>}
                        {image.storage_path && !bucketExists && <p className="text-xs text-red-400 dark:text-red-500 mt-1">Bucket issues</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinterest Modal */} 
      {isModalOpen && selectedPinForModal && imageUrls[selectedPinForModal.id] && (
        <PinterestModal 
          isOpen={isModalOpen} 
          setIsOpen={handleCloseModal}
          image={{
            id: selectedPinForModal.id,
            src: imageUrls[selectedPinForModal.id] || '',
            alt: selectedPinForModal.title || 'Pin image',
            height: 'auto',
            username: userProfile.username,
            profileImage: userProfile.profileImage,
            title: selectedPinForModal.title || 'Untitled Pin',
            description: selectedPinForModal.description || 'No description available.',
            originalImageRecord: { 
                storage_path: selectedPinForModal.storage_path, 
                user_id: selectedPinForModal.user_id,
                id: selectedPinForModal.id
            }
          }}
          onDeletePin={handleDeletePin}
          
        />
      )}

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          user={user}
          currentDescription={profileData?.description || ''}
          currentAvatarUrl={profileData?.avatar_url || ''}
          currentCoverImageUrl={profileData?.cover_image_url || null}
          onProfileUpdate={() => {
            handleProfileUpdate();
            if (user) loadUserData(user.id);
          }}
        />
      )}
    </>
  );
} 