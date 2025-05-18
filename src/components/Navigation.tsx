'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';

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

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const goToProfile = () => {
    console.log("Navigating to profile page");
    router.push('/profile');
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          performDataFetchForUser(currentSession.user.id).catch(console.error);
        } else {
          setUser(null);
          setUserData(null);
          setProfileData(null);
        }
      } catch (error) {
        console.error("Error during initial data load in Navigation:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const performDataFetchForUser = async (userId: string) => {
      try {
        const [userResult, profileResult] = await Promise.allSettled([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.from('profiles').select('*').eq('user_id', userId).single()
        ]);

        if (!isMounted) return;

        if (userResult.status === 'fulfilled' && userResult.value.data) {
          setUserData(userResult.value.data);
        } else if (userResult.status === 'fulfilled' && userResult.value.error && userResult.value.error.code !== 'PGRST116') {
          console.error('Error fetching user data:', userResult.value.error);
          setUserData(null);
        } else {
          setUserData(null);
        }

        if (profileResult.status === 'fulfilled' && profileResult.value.data) {
          setProfileData(profileResult.value.data);
        } else if (profileResult.status === 'fulfilled' && profileResult.value.error && profileResult.value.error.code !== 'PGRST116') {
          console.error('Error fetching profile data:', profileResult.value.error);
          setProfileData(null);
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error('Exception during data fetch in performDataFetchForUser:', error);
        if (isMounted) {
          setUserData(null);
          setProfileData(null);
        }
      }
    };

    setIsLoading(true);
    
    fetchInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Navigation Auth Event: ${event}`);
      
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserData(null);
        setProfileData(null);
        router.refresh();
      } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setUser(newSession.user);
        performDataFetchForUser(newSession.user.id).catch(console.error);
        router.refresh();
      } else if (event === 'INITIAL_SESSION') {
        if (newSession?.user) {
          setUser(newSession.user);
          performDataFetchForUser(newSession.user.id).catch(console.error);
        } else {
          setUser(null);
          setUserData(null);
          setProfileData(null);
        }
      }
      if (event === 'INITIAL_SESSION' && isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
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

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/explore' },
    { name: 'Create', href: '/create' },
  ];

  const userProfile = {
    name: userData 
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Guest'
      : user?.email?.split('@')[0] || 'Guest',
    email: user?.email || '',
    profileImage: profileData?.avatar_url || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-8 h-8">
                <svg
                  className="text-red-500 hover:text-red-600 transition-colors duration-200"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Pictionary</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="absolute inset-y-0 left-3 flex items-center">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* User Profile / Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={goToProfile}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  disabled={isLoading}
                  aria-label="Profile"
                >
                  <Image
                    src={userProfile.profileImage}
                    alt={userProfile.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>
                
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400"
              >
                Sign In
              </Link>
            )}
            {/* Settings Icon - Always Visible */} 
            <Link
              href="/settings"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="sr-only">Settings</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400"
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {user ? (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={goToProfile}
                    className="flex-shrink-0"
                    disabled={isLoading}
                  >
                    <Image
                      src={userProfile.profileImage}
                      alt={userProfile.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </button>
                  <div>
                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                      {userProfile.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.email}
                    </div>
                  </div>
                </div>
                
              </div>
              <div className="mt-3">
                <Link
                  href="/settings"
                  className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400"
                  aria-disabled={isLoading}
                  tabIndex={isLoading ? -1 : 0}
                >
                  Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/login"
                className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400"
              >
                Login
              </Link>
              <Link
                href="/settings"
                className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400"
              >
                Settings
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
