'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const Upload = dynamic(() => import('lucide-react').then(mod => mod.Upload), { ssr: false });
const User2 = dynamic(() => import('lucide-react').then(mod => mod.User2), { ssr: false });

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentDescription: string;
  currentAvatarUrl: string;
  currentCoverImageUrl?: string | null;
  onProfileUpdate: () => void;
};

const EditProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  currentDescription, 
  currentAvatarUrl,
  currentCoverImageUrl,
  onProfileUpdate 
}: EditProfileModalProps) => {
  const [description, setDescription] = useState(currentDescription || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(currentCoverImageUrl || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setDescription(currentDescription || '');
    setAvatarPreview(currentAvatarUrl || null);
    setCoverPreview(currentCoverImageUrl || null);
    setAvatarFile(null);
    setCoverFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }, [currentDescription, currentAvatarUrl, currentCoverImageUrl, isOpen]);

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

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else if (file) {
      setError('Please select a valid JPG or PNG image for the cover.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      let avatarUrl = currentAvatarUrl;
      let coverUrl = currentCoverImageUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        console.log('EditProfile: Uploading avatar to images bucket...');
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true });
            
        if (uploadError) throw uploadError;
          
        const { data: urlData } = await supabase.storage
          .from('images')
          .getPublicUrl(filePath);
            
        if (urlData?.publicUrl) {
          avatarUrl = urlData.publicUrl;
          if (currentAvatarUrl && currentAvatarUrl.includes(supabase.storage.from('images').getPublicUrl('').data.publicUrl)) {
            const oldAvatarPath = currentAvatarUrl.substring(currentAvatarUrl.lastIndexOf('avatars/'));
            if (oldAvatarPath !== filePath) { // Don't delete if it's somehow the same path
                 await supabase.storage.from('images').remove([oldAvatarPath]);
                 console.log('EditProfile: Old avatar deleted:', oldAvatarPath);
            }
          }
        } else {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
          } else {
            throw new Error('Could not generate a public URL for the uploaded avatar');
          }
        }
      }

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `covers/${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        console.log('EditProfile: Uploading cover image to images bucket...');
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, coverFile, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          coverUrl = urlData.publicUrl;
          if (currentCoverImageUrl && currentCoverImageUrl.includes(supabase.storage.from('images').getPublicUrl('').data.publicUrl)) {
            const oldCoverPath = currentCoverImageUrl.substring(currentCoverImageUrl.lastIndexOf('covers/'));
             if (oldCoverPath !== filePath) {
                await supabase.storage.from('images').remove([oldCoverPath]);
                console.log('EditProfile: Old cover image deleted:', oldCoverPath);
             }
          }
        } else {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
          } else {
            throw new Error('Could not generate a public URL for the uploaded cover image');
          }
        }
      }
      
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
        const { error } = await supabase
          .from('profiles')
          .update({
            description,
            avatar_url: avatarUrl,
            cover_image_url: coverUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        updateError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            description,
            avatar_url: avatarUrl,
            cover_image_url: coverUrl,
            updated_at: new Date().toISOString()
          });
        
        updateError = error;
      }

      if (updateError) throw updateError;
      
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
            
            {/* Cover Image Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cover Picture
              </label>
              <div className="flex flex-col items-start gap-6">
                <div className="relative w-full aspect-[16/6] sm:aspect-[16/5] md:aspect-[16/4] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-md bg-gray-100 dark:bg-gray-700">
                  {coverPreview ? (
                    <Image
                      src={coverPreview}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start mt-4">
                  <button
                    type="button"
                    className="bg-indigo-600 text-white flex items-center gap-2 py-2 px-4 rounded-full shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-2"
                    onClick={() => coverFileInputRef.current?.click()}
                  >
                    {Upload && <Upload size={16} />}
                    Choose Cover Image
                  </button>
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    onChange={handleCoverFileChange}
                    accept="image/jpeg, image/png"
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">JPG or PNG. Recommended aspect ratio 16:9.</p>
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