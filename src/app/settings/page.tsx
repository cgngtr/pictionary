'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/utils';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const tabs = [
    { id: 'profile', label: 'Edit Profile', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { id: 'account', label: 'Account', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    )},
    { id: 'privacy', label: 'Privacy & Safety', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    )}
  ];

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User signed out successfully, redirecting to login...');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Saving profile data...');
    setTimeout(() => {
      setIsLoading(false);
      console.log('Profile data saved (simulated).');
    }, 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileSave} className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
            <div className="space-y-6 pt-8">
              <div>
                <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Personal Information</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Update your profile information. This will be displayed publicly.</p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    autoComplete="given-name"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Ada"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    autoComplete="family-name"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Lovelace"
                  />
                </div>
                
                <div className="sm:col-span-4">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                      pictionary.com/
                    </span>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      autoComplete="username"
                      className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="adalovelace"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Write a few sentences about yourself."
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Max 200 characters.</p>
                </div>
                
                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-x-3">
              <button
                type="button"
                className="rounded-md bg-white dark:bg-gray-700 px-3.5 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );
      case 'account':
        return (
          <div className="space-y-6 pt-8">
            <div>
              <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Account Management</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Sign Out</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sign out from your Pictionary account on this device. You will need to sign in again to access your pins and profile.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                  aria-label="Sign out of your account"
                >
                  <svg 
                    className="w-5 h-5 mr-2 -ml-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {isLoading ? 'Processing...' : 'Sign Out'}
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-medium text-red-600 dark:text-red-500">Delete Account</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md bg-transparent px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-500 shadow-sm ring-1 ring-inset ring-red-600 hover:bg-red-50 dark:hover:bg-red-700/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                  aria-label="Delete your account"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 -ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L11.252 5.79M11.252 5.79A48.068 48.068 0 0112 5.5c.333 0 .663.017.986.05M11.252 5.79L10.879 3.717A1.875 1.875 0 0112.755 2h.49a1.875 1.875 0 011.876 1.717l-.373 2.073M11.252 5.79l-1.622-.004M12.986 5.79l1.622-.004" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">Coming Soon!</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              The &quot;{tabs.find(t => t.id === activeTab)?.label || activeTab}&quot; settings are currently under construction.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700/50">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
          </div>

          <div className="md:flex">
            <nav className="md:w-64 md:flex-shrink-0 md:border-r md:border-gray-200 dark:md:border-gray-700/50" aria-label="Settings tabs">
              <div className="px-3 py-4 md:py-6 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium group
                      ${activeTab === tab.id
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="flex-1 px-6 py-6 sm:px-8 md:py-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 