'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/utils';
// import { removeStorageRLS } from '@/lib/supabase/remove-storage-rls'; // Removed
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import PinterestModal from '@/components/PinterestModal';

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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const setupProfilePage = async () => {
      setIsLoading(true);
      try {
        // Bucket ve RLS setup
        console.log('ProfilePage: Initializing storage setup...');
        const { data: rlsBucketsData, error: rlsBucketsError } = await supabase.rpc('ensure_rls_on_storage_buckets');
        if (rlsBucketsError) {
          console.error('ProfilePage: RPC ensure_rls_on_storage_buckets failed (network/PostgREST error):', rlsBucketsError);
        } else if (rlsBucketsData && !rlsBucketsData.success) {
          console.warn('ProfilePage: RPC ensure_rls_on_storage_buckets did not succeed:', rlsBucketsData.message);
        } else if (rlsBucketsData && rlsBucketsData.success) {
          console.log('ProfilePage: RPC ensure_rls_on_storage_buckets reported success:', rlsBucketsData.message);
        }

        const { data: rpcPublicityData, error: rpcPublicityError } = await supabase.rpc('manage_images_bucket_publicity');
        if (rpcPublicityError) {
          console.error('ProfilePage: RPC manage_images_bucket_publicity failed (network/PostgREST error):', rpcPublicityError);
          setError(`Failed to configure storage (RPC error): ${rpcPublicityError.message}`);
          // Return early if critical setup fails
        } else if (rpcPublicityData && !rpcPublicityData.success) {
          console.error('ProfilePage: RPC manage_images_bucket_publicity did not succeed:', rpcPublicityData?.message || 'No message from RPC.');
          setError(`Failed to configure storage (RPC execution failed): ${rpcPublicityData?.message || 'Unknown RPC error'}`);
          // Return early
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
            } else {
              console.log('ProfilePage: Bucket "images" created successfully.');
              setBucketExists(true);
            }
          } else {
            console.error('ProfilePage: Error getting bucket "images" (RLS on storage.buckets for SELECT?):', getBucketError);
            setError(`Storage setup error: Could not verify bucket. ${getBucketError.message}`);
          }
        } else {
          console.log('ProfilePage: Bucket "images" exists.');
          if (!bucketInfo.public) {
            console.log('ProfilePage: Bucket "images" is not public. Attempting to update it...');
            const { error: updateError } = await supabase.storage.updateBucket('images', { public: true });
            if (updateError) {
              console.error('ProfilePage: Could not update bucket "images" to public:', updateError);
              setError(`Storage setup error: Could not update bucket. ${updateError.message}`);
            }
          }
          setBucketExists(true);
        }

        // Auth and user data fetching
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          console.log("ProfilePage: User session found:", session.user.email);

          const { data: userDataFromTable, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (userError) throw userError;
          setUserData(userDataFromTable);

          const { data: profileDataFromTable, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id) // Assuming user_id in profiles matches auth.users.id
            .single();
          if (profileError && profileError.code !== 'PGRST116') throw profileError; // PGRST116: 0 rows
          setProfileData(profileDataFromTable);
          
          // Fetch images only if bucket setup was successful
          if (bucketExists || (bucketInfo && bucketInfo.public)) { // Check bucketExists OR if bucketInfo shows it's okay
             console.log('ProfilePage: Bucket ready, fetching user images for user ID:', session.user.id);
             await fetchUserImages(session.user.id);
          } else {
            console.warn('ProfilePage: Bucket not confirmed as ready. Skipping fetchUserImages.');
            // Optionally set an error or a specific state if images can't be loaded due to bucket issues
          }

        } else {
          console.log("ProfilePage: No session, redirecting via router.refresh().");
          router.refresh(); // Let middleware handle redirect
        }
      } catch (error: any) {
        console.error('ProfilePage: Error in setupProfilePage:', error);
        setError(error.message || 'An unexpected error occurred.');
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
            router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    setupProfilePage();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`ProfilePage: Auth event: ${event}`);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        router.refresh();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Re-fetch data on sign-in if necessary, or rely on initial setupProfilePage
        setupProfilePage(); 
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]); // bucketExists not needed in dep array as fetchUserImages is called conditionally within setup

  const fetchUserImages = async (userId: string) => {
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
  };

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

  const userProfile = {
    name: userData ? `${userData.first_name} ${userData.last_name}` : (user?.email || 'User'),
    username: userData?.username || user?.email?.split('@')[0] || '@user',
    bio: profileData?.description || 'No description available',
    profileImage: profileData?.avatar_url || 'https://source.unsplash.com/random/400x400/?portrait',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    stats: {
      pins: userImages.length,
      following: 0,
      followers: 0
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

            <div className="mt-6 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900">{userProfile.name}</h1>
              <p className="mt-1 text-xl text-gray-600">{user.email}</p>
              <p className="mt-4 text-lg text-gray-800 max-w-2xl">{userProfile.bio}</p>

              <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-8">
                <div className="text-center md:text-left">
                  <p className="text-3xl font-bold text-gray-900">{userProfile.stats.pins}</p>
                  <p className="text-sm font-medium text-gray-600">Pins</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-3xl font-bold text-gray-900">{userProfile.stats.following}</p>
                  <p className="text-sm font-medium text-gray-600">Following</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-3xl font-bold text-gray-900">{userProfile.stats.followers}</p>
                  <p className="text-sm font-medium text-gray-600">Followers</p>
                </div>
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <h3 className="text-white font-bold text-lg truncate">{image.title}</h3>
                          {image.description && (
                            <p className="text-white/90 text-sm line-clamp-2 mt-1">
                              {image.description}
                            </p>
                          )}
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
            src: imageUrls[selectedPinForModal.id],
            alt: selectedPinForModal.title || 'Pin image',
            height: 'auto',
            username: userData?.username || user?.email?.split('@')[0] || 'User',
            profileImage: profileData?.avatar_url || userProfile.profileImage,
            title: selectedPinForModal.title,
            description: selectedPinForModal.description || 'No description provided.'
          }}
        />
      )}
    </>
  );
} 