'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import icons with no SSR
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const Upload = dynamic(() => import('lucide-react').then(mod => mod.Upload), { ssr: false });
const User2 = dynamic(() => import('lucide-react').then(mod => mod.User2), { ssr: false });

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentDescription: string;
  currentAvatarUrl: string;
  onProfileUpdate: () => void;
};

const EditProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  currentDescription, 
  currentAvatarUrl,
  onProfileUpdate 
}: EditProfileModalProps) => {
  const [description, setDescription] = useState(currentDescription || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setDescription(currentDescription || '');
    setAvatarPreview(currentAvatarUrl || null);
  }, [currentDescription, currentAvatarUrl, isOpen]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError('Please select a valid JPG or PNG image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      let avatarUrl = currentAvatarUrl;

      // Upload new avatar if one was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Store in images bucket, in avatars subfolder

        // Log that we're using images bucket
        console.log('EditProfile: Using existing images bucket for avatar storage');
        
        // Skip bucket creation as we'll use the existing images bucket
        try {
          // Upload to images bucket
          console.log(`EditProfile: Uploading file to images/${filePath}...`);
          const { error: uploadError } = await supabase.storage
            .from('images') // Using images bucket instead of avatars
            .upload(filePath, avatarFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('EditProfile: Upload error:', uploadError);
            throw uploadError;
          }
          
          console.log('EditProfile: File uploaded successfully, getting public URL...');
          
          // Get the public URL from images bucket
          const { data: urlData } = await supabase.storage
            .from('images') // Using images bucket
            .getPublicUrl(filePath);
            
          if (urlData?.publicUrl) {
            console.log(`EditProfile: Public URL acquired: ${urlData.publicUrl}`);
            avatarUrl = urlData.publicUrl;
          } else {
            console.warn('EditProfile: No public URL returned from getPublicUrl');
            
            // Fallback - manually construct URL if we have NEXT_PUBLIC_SUPABASE_URL
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
              avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
              console.log(`EditProfile: Manually constructed URL: ${avatarUrl}`);
            } else {
              throw new Error('Could not generate a public URL for the uploaded avatar');
            }
          }
        } catch (uploadErr: any) {
          console.error('EditProfile: Upload error:', uploadErr);
          
          // If we're getting bucket not found with images bucket, this is a different problem
          if (uploadErr.message?.includes('bucket not found')) {
            console.error('EditProfile: Images bucket not found. This is unexpected as the app depends on this bucket.');
            setError('Could not upload profile picture: The storage bucket does not exist.');
            setIsLoading(false);
            return;
          } else {
            throw uploadErr; // Re-throw any other errors
          }
        }
      }

      // First check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileCheckError) {
        throw profileCheckError;
      }

      let updateError;

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            description,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        updateError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            description,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          });
        
        updateError = error;
      }

      if (updateError) throw updateError;
      
      // Success!
      onProfileUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header with close button */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 id="edit-profile-title" className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            {X && <X size={20} />}
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Profile picture upload section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Picture
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-md">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {User2 ? (
                        <User2 size={48} className="text-gray-400" />
                      ) : (
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center sm:items-start mt-4 sm:mt-0">
                  <button
                    type="button"
                    className="bg-indigo-600 text-white flex items-center gap-2 py-2 px-4 rounded-full shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {Upload && <Upload size={16} />}
                    Choose Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png"
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">JPG or PNG only</p>
                </div>
              </div>
            </div>
            
            {/* Bio/description section */}
            <div className="mb-8">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Tell everyone about yourself"
              ></textarea>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal; 