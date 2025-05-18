'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

export default function FinishProfilePage() {
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        setError('You must be logged in to complete your profile.');
        router.push('/login');
      } else {
        setUser(currentUser);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('description, avatar_url')
          .eq('user_id', currentUser.id)
          .single();

        if (profile) {
          setDescription(profile.description || '');
          setAvatarUrl(profile.avatar_url || '');
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
        }
        if (profileError && profileError.code !== 'PGRST116') {
             console.error('Error fetching profile:', profileError);
             setError('Could not load existing profile information.');
        }
      }
    };
    fetchUser();
  }, [supabase, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAvatarUrl('');
    } else if (file) {
      setError('Please select a valid JPG or PNG image.');
    }
  };

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

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        
        console.log('FinishProfile: Using images bucket for avatar storage');
        
        try {
          console.log(`FinishProfile: Uploading file to images/${fileName}...`);
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, avatarFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('FinishProfile: Upload error:', uploadError);
            throw uploadError;
          }
          
          console.log('FinishProfile: File uploaded successfully, getting public URL');
          
          const { data: urlData } = await supabase.storage
            .from('images')
            .getPublicUrl(fileName);
            
          if (urlData?.publicUrl) {
            console.log(`FinishProfile: Public URL acquired: ${urlData.publicUrl}`);
            finalAvatarUrl = urlData.publicUrl;
          } else {
            console.warn('FinishProfile: No public URL returned from getPublicUrl');
            
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
              finalAvatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
              console.log(`FinishProfile: Manually constructed URL: ${finalAvatarUrl}`);
            } else {
              throw new Error('Could not generate a public URL for the uploaded avatar');
            }
          }
        } catch (uploadErr: any) {
          console.error('FinishProfile: Upload error:', uploadErr);
          throw new Error(`Failed to upload image: ${uploadErr.message}`);
        }
      }
    
      const profileData = {
        user_id: user.id,
        description: description,
        avatar_url: finalAvatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (upsertError) {
        throw new Error(`Failed to save profile: ${upsertError.message}`);
      }
      
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error in profile submission:', err);
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
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
          <div className="rounded-md shadow-sm space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar preview */}
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upload Profile Picture
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png"
                  className="hidden"
                />
                <p className="text-xs text-gray-500">JPG or PNG only</p>
                
                {/* Divider */}
                <div className="relative w-full py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-gray-50 text-sm text-gray-500">Or</span>
                  </div>
                </div>
                
                {/* URL input as alternative */}
                <div className="w-full">
                  <label htmlFor="avatar-url" className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <input
                    id="avatar-url"
                    name="avatar-url"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      if (e.target.value) {
                        setAvatarPreview(e.target.value);
                        setAvatarFile(null);
                      } else {
                        setAvatarPreview(null);
                      }
                    }}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-center text-red-600 p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {message && (
            <div className="text-sm text-center text-green-600 p-2 bg-green-50 rounded-md">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 