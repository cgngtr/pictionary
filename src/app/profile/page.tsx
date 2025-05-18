'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/utils';
// import { removeStorageRLS } from '@/lib/supabase/remove-storage-rls'; // Removed
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import PinterestModal from '@/components/PinterestModal';
import EditProfileModal from '@/components/EditProfileModal';

type ProfileData = {
  id: string;
  user_id: string;
  description: string;
  avatar_url: string;
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
        // Don't set an error here that overwrites storage setup errors
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

          // Prioritize Supabase getPublicUrl
          const { data: urlData } = await supabase.storage
            .from('images') // Bucket name
            .getPublicUrl(image.storage_path);

          if (urlData?.publicUrl) {
            urls[image.id] = urlData.publicUrl;
            console.log(`ProfilePage: Generated public URL for ${image.id} via Supabase SDK: ${urlData.publicUrl}`);
          } else {
            console.warn(`ProfilePage: Failed to get public URL for ${image.id} using Supabase SDK. storage_path: ${image.storage_path}`);
            // Fallback or error logging if NEXT_PUBLIC_SUPABASE_URL was intended
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
                const directUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${image.storage_path}`;
                urls[image.id] = directUrl; // Still set it for debugging, but with a warning
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
            // setError("Some image URLs could not be generated. Please check console."); // Optional: inform user
        }
      }
    } catch (err) {
      console.error('ProfilePage: Error in fetchUserImages function:', err);
      // setError("Failed to load image details."); // Optional: inform user
    }
  }, [supabase, bucketExists]);

  // Function to load user data after we confirm session exists
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Fetch user data
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

      // Fetch profile data
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
      
      // Check if essential data is missing and redirect or prompt
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

  // Setup bucket and fetch images
  const setupStorage = useCallback(async (userId: string) => {
    try {
      // Bucket ve RLS setup
      console.log('ProfilePage: Initializing storage setup...');
      // Skip the RLS on storage.buckets attempt as it causes permission issues
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
          // Only try to create if bucket explicitly not found
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

      // Fetch images if bucket setup was successful
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

  // Check session and initialize page
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        console.log("ProfilePage: User session found:", session.user.email);
        
        // Load user data first
        const userDataSuccess = await loadUserData(session.user.id);
        if (!userDataSuccess) {
          setIsLoading(false);
          return;
        }
        
        // Then set up storage and fetch images
        await setupStorage(session.user.id);
      } else {
        console.log("ProfilePage: No session, redirecting via router.refresh().");
        router.refresh(); // Let middleware handle redirect
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

  // Handle session recovery
  const recoverSession = useCallback(async () => {
    if (isLoading) return; // Don't try to recover while already loading

    console.log("ProfilePage: Attempting to recover session...");
    setIsLoading(true);
    
    try {
      // Check if session still exists and is valid
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("ProfilePage: No valid session found during recovery");
        setError('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }
      
      // Session exists, refresh user state
      console.log("ProfilePage: Valid session found during recovery");
      setUser(session.user);
      
      // Get fresh data if needed
      if (!userData || !profileData) {
        await loadUserData(session.user.id);
      }
      
      // Refresh images if needed
      if (userImages.length === 0 || Object.keys(imageUrls).length === 0) {
        await fetchUserImages(session.user.id);
      }
      
      // Clear any previous errors
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

    // Handle visibility change - check session when tab becomes visible again
    const handleVisibilityChange = () => {
      // Clear any existing timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = null;
      }
      
      if (document.visibilityState === 'visible' && isMounted) {
        // If the page was hidden for more than a brief moment and is now visible
        console.log("ProfilePage: Page visibility changed to visible");
        
        // Small delay to prevent multiple rapid rechecks
        visibilityTimeout = setTimeout(() => {
          recoverSession();
        }, 300);
      }
    };
    
    // Handle focus events for tab switching within the same site
    const handleFocus = () => {
      console.log("ProfilePage: Window focused");
      // Don't check session more than once every 10 seconds to prevent excessive API calls
      if (isMounted && !isLoading && lastSessionCheckRef.current + 10000 < Date.now()) {
        lastSessionCheckRef.current = Date.now();
        recoverSession();
      }
    };

    // Keep track of last session check time
    const lastSessionCheckRef = { current: Date.now() };
    
    // Add event listeners for tab visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Setup automatic session refresh every 9 minutes to prevent expiry
    // (assuming a 10 minute token lifetime)
    const sessionRefreshInterval = setInterval(() => {
      if (isMounted && user) {
        console.log("ProfilePage: Performing periodic session refresh");
        supabase.auth.refreshSession();
      }
    }, 9 * 60 * 1000); // 9 minutes

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`ProfilePage: Auth event: ${event}`);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.refresh();
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        checkSession();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just update the user, no need to reload everything
        setUser(session.user);
        
        // Update the last session check time
        lastSessionCheckRef.current = Date.now();
        
        // Also clear any session-related errors that might be displayed
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
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    stats: {
      pins: userImages.length
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) { // Display general page errors prominently
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => router.refresh()} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect in setupProfilePage or middleware
    // but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Redirecting to login...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }
  
  // For debugging imageUrls state during render:
  // console.log('ProfilePage: Rendering with imageUrls:', imageUrls);

  return (
    <>
      <div className="min-h-screen bg-gray-50 -mt-16">
        <div className="relative w-full h-[300px] md:h-[400px]">
          <Image
            src={userProfile.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Error display specific to image loading could be added here if needed */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-32 pb-8">
            <div className="relative z-10">
              <div className="relative w-40 h-40 mx-auto md:mx-0 rounded-full border-4 border-white overflow-hidden shadow-xl">
                <Image
                  src={userProfile.profileImage}
                  alt={userProfile.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="mt-6 text-center md:text-left md:flex md:justify-between md:items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{userProfile.name}</h1>
                <p className="mt-1 text-xl text-gray-600">{user.email}</p>
                <p className="mt-4 text-lg text-gray-800 max-w-2xl">{userProfile.bio}</p>

                <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-8">
                  <div className="text-center md:text-left">
                    <p className="text-3xl font-bold text-gray-900">{userProfile.stats.pins}</p>
                    <p className="text-sm font-medium text-gray-600">Pins</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0">
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Edit profile"
                  tabIndex={0}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Created Pins</h2>
            {userImages.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No pins created yet</p>
                <button 
                  onClick={() => router.push('/create')}
                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  Create Your First Pin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userImages.map((image) => (
                  <div 
                    key={image.id} 
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    onClick={() => handlePinClick(image)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinClick(image)}
                    aria-label={image.title || 'Open pin details'}
                  >
                    {imageUrls[image.id] ? (
                      <>
                        <img
                          src={imageUrls[image.id]}
                          alt={image.title || 'Pin image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.error(`ProfilePage: Error loading image ID ${image.id} from URL ${imageUrls[image.id]}`);
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Image+Load+Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
                        
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                          <button 
                            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-colors duration-300 text-sm"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              alert('Save clicked! (Not implemented on profile page yet)'); 
                            }}
                            aria-label="Save pin"
                          >
                            Save
                          </button>
                        </div>
                        
                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transform translate-y-[10px] group-hover:translate-y-0 transition-all duration-300 pointer-events-none w-[calc(100%-3rem)]">
                          {image.title && (
                            <p className="text-white font-bold text-md mb-1 truncate" title={image.title}>{image.title}</p>
                          )}
                          <div className="flex items-center">
                            {userProfile.profileImage && (
                              <img 
                                src={userProfile.profileImage} 
                                alt={userProfile.username || 'User'} 
                                className="w-6 h-6 rounded-full mr-2 border-2 border-white shadow-sm flex-shrink-0"
                              />
                            )}
                            {userProfile.username && (
                              <span className="text-white font-semibold text-xs truncate" title={userProfile.username}>{userProfile.username}</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="animate-pulse text-gray-400">Loading...</div>
                        {!image.storage_path && <p className="text-xs text-red-400">Missing storage_path</p>}
                        {image.storage_path && !bucketExists && <p className="text-xs text-red-400">Bucket not ready</p>}
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
            title: selectedPinForModal.title,
            description: selectedPinForModal.description || 'No description provided.',
            originalImageRecord: { storage_path: selectedPinForModal.storage_path }
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
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
} 