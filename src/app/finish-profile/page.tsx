'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';

export default function FinishProfilePage() {
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        setError('You must be logged in to complete your profile.');
        router.push('/login'); // Redirect to login if no user
      } else {
        setUser(currentUser);
        // Optionally, fetch existing profile data if user might revisit this page
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('description, avatar_url')
          .eq('user_id', currentUser.id)
          .single();

        if (profile) {
          setDescription(profile.description || '');
          setAvatarUrl(profile.avatar_url || '');
        }
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
             console.error('Error fetching profile:', profileError);
             setError('Could not load existing profile information.');
        }
      }
    };
    fetchUser();
  }, [supabase, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!user) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }

    // Basic validation for avatar_url (optional, could be more complex)
    if (avatarUrl && !avatarUrl.startsWith('http')) {
        setError('Avatar URL must be a valid URL (e.g., start with http or https).');
        setLoading(false);
        return;
    }
    
    const profileData = {
      user_id: user.id,
      description: description,
      avatar_url: avatarUrl || null, // Store null if empty
      updated_at: new Date().toISOString(),
    };

    // Upsert into profiles table
    // id is default uuid, created_at is default CURRENT_TIMESTAMP
    // if this is the first time, user_id must be set
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error saving profile:', upsertError);
      setError(`Failed to save profile: ${upsertError.message}`);
    } else {
      setMessage('Profile updated successfully!');
      // Optionally, redirect after a delay or on button click
      router.push('/'); // Redirect to home page or dashboard
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Finish Setting Up Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us a bit more about yourself.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleProfileSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="A short bio..."
              />
            </div>
            <div>
              <label htmlFor="avatar-url" className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <input
                id="avatar-url"
                name="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-center text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="text-sm text-center text-green-600">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 