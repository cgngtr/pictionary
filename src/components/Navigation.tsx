'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Dispatch, SetStateAction, Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { Menu, Transition } from '@headlessui/react';

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

type NavigationProps = {
  onSearch?: (searchTerm: string) => void;
}

export default function Navigation({ onSearch }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const goToProfile = () => {
    console.log("Navigating to profile page");
    setIsMenuOpen(false);
    router.push('/profile');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
    }
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
      setIsMenuOpen(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User signed out successfully, redirecting...');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userProfile = {
    name: userData 
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Guest'
      : user?.email?.split('@')[0] || 'Guest',
    email: user?.email || '',
    profileImage: profileData?.avatar_url || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'
  };

  return (
    <>
      <nav className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 pb-3">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2 group" aria-label="Go to Pictionary homepage">
                <svg
                  className="h-8 w-auto text-red-500 group-hover:text-red-600 transition-colors duration-200"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
                <span className="font-semibold text-xl text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200">Pictionary</span>
              </Link>
            </div>

            {onSearch && (
              <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">
                    Search pins
                  </label>
                  <div className="relative text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-200">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors duration-200 shadow-sm hover:shadow"
                      placeholder="Search pins..."
                      type="search"
                      value={searchTerm}
                      onChange={handleSearch}
                      onKeyDown={handleKeyDown}
                      aria-label="Search pins"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 md:space-x-4 ml-auto">
               {user && (
                  <Link href="/create" legacyBehavior>
                    <a 
                      className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-200"
                      aria-label="Create new pin"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </a>
                  </Link>
              )}

              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              ) : user ? (
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button 
                      className="bg-white dark:bg-gray-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-200 hover:opacity-90"
                      aria-label="Open user menu"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      <Image
                        className="h-9 w-9 rounded-full object-cover border-2 border-transparent hover:border-red-500/50 dark:hover:border-red-400/50"
                        src={userProfile.profileImage}
                        alt={userProfile.name || 'User profile'}
                        width={36}
                        height={36}
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    show={isMenuOpen}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-52 rounded-3xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none py-1.5">
                      <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userProfile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile.email}</p>
                      </div>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={goToProfile}
                            className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-xl mx-1.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150`}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            My Profile
                          </button>
                        )}
                      </Menu.Item>
                       <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <Link href="/settings" legacyBehavior>
                            <a className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-xl mx-1.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                <circle cx="12" cy="12" r="7.5" />
                                <circle cx="12" cy="12" r="2.5" />
                              </svg>
                              Settings
                            </a>
                          </Link>
                        )}
                      </Menu.Item>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className={`${active ? 'bg-red-50 dark:bg-red-500/10' : ''} group flex w-full items-center rounded-xl mx-1.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-150`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <Link href="/login" legacyBehavior>
                  <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-200">
                    Login
                  </a>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
