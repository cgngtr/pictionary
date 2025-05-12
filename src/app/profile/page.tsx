'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          console.log("Profile page: User found", session.user.email);
        } else {
          console.log("Profile page: No session found, redirecting to login via middleware...");
          router.refresh();
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Profile page auth change: ${event}`);
      if (event === 'SIGNED_OUT') {
        router.refresh();
      } else {
        setUser(session?.user || null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

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
    name: user?.email?.split('@')[0] || 'User',
    username: user?.email || '@user',
    bio: user?.user_metadata?.bio || 'Digital artist and photographer | Creating beautiful moments',
    profileImage: user?.user_metadata?.avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg',
    coverImage: user?.user_metadata?.cover_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    stats: {
      pins: 245,
      following: 1234,
      followers: 5678
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    console.error("Profile page rendered without user despite checks. Middleware issue?");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">Could not verify user session. Redirecting...</p>
      </div>
    );
  }

  return (
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
            <p className="mt-1 text-xl text-gray-600">{userProfile.username}</p>
            <p className="mt-2 text-md font-medium text-indigo-600">Email: {user?.email}</p>
            <p className="mt-4 text-lg text-gray-800 max-w-2xl">{userProfile.bio}</p>

            <div className="mt-6">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Sign Out'}
              </button>
            </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-200"
              >
                <Image
                  src={`https://source.unsplash.com/random/600x800?sig=${i}`}
                  alt={`Pin ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 