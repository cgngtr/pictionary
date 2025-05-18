'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/utils';
import Image from 'next/image';

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    document.title = "Create New Pin | Pictionary";
    const setupStorage = async () => {
      setIsStorageReady(false);
      setError(null);
      try {
        console.log('CreatePage: Skipping RLS on storage.buckets setup (not needed)');
        
        console.log('CreatePage: Attempting to manage images bucket publicity...');
        const { data: rpcPublicityData, error: rpcPublicityError } = await supabase.rpc('manage_images_bucket_publicity');
        if (rpcPublicityError) {
          console.error('CreatePage: RPC call to manage_images_bucket_publicity failed:', rpcPublicityError);
          setError(`Storage setup error (RPC publicity): ${rpcPublicityError.message}`);
          return;
        }
        if (!rpcPublicityData || !rpcPublicityData.success) {
          console.error('CreatePage: RPC call manage_images_bucket_publicity did not succeed:', rpcPublicityData?.message);
          setError(`Storage setup error (RPC publicity): ${rpcPublicityData?.message || 'Unknown RPC error'}`);
          return;
        }
        console.log('CreatePage: RPC manage_images_bucket_publicity reported success:', rpcPublicityData.message);

        console.log('CreatePage: Checking if bucket "images" exists...');
        const { data: bucketInfo, error: getBucketError } = await supabase.storage.getBucket('images');
        
        if (getBucketError) {
          if (getBucketError.message?.toLowerCase().includes('bucket not found')) {
            console.log('CreatePage: Bucket "images" not found. Attempting to create it...');
            const { error: createError } = await supabase.storage.createBucket('images', { public: true });
            if (createError) {
              console.error('CreatePage: Could not create bucket "images":', createError);
              setError(`Storage setup error: Could not create bucket. ${createError.message}`);
              return;
            }
            console.log('CreatePage: Bucket "images" created successfully.');
          } else {
            console.error('CreatePage: Error getting bucket "images":', getBucketError);
            setError(`Storage setup error: Could not verify bucket. ${getBucketError.message}`);
            return;
          }
        } else {
          console.log('CreatePage: Bucket "images" exists:', bucketInfo);
          if (!bucketInfo.public) {
            console.log('CreatePage: Bucket "images" is not public. Attempting to update it...');
            const { error: updateError } = await supabase.storage.updateBucket('images', { public: true });
            if (updateError) {
              console.error('CreatePage: Could not update bucket "images" to public:', updateError);
              setError(`Storage setup error: Could not update bucket to public. ${updateError.message}`);
              return;
            }
            console.log('CreatePage: Bucket "images" updated to public successfully.');
          }
        }
        
        const { error: tableError } = await supabase.from('images').select('id', { count: 'exact', head: true });
        if (tableError) {
          console.error('CreatePage: Table check error on "images":', tableError);
          setError('Database table "images" may not be correctly configured.');
          return;
        }
        console.log('CreatePage: Storage and table checks passed. Storage is ready.');
        setIsStorageReady(true);
      } catch (err: any) {
        console.error('CreatePage: General error in setupStorage:', err);
        setError(`An unexpected error occurred during storage initialization: ${err.message}`);
      }
    };
    
    setupStorage();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStorageReady) {
      setError('Storage is not ready. Please wait or try refreshing the page.');
      console.warn('handleSubmit blocked because isStorageReady is false.');
      return;
    }
    
    if (!file) {
      setError('Please select an image to upload');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your pin');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      const userId = session.user.id;
      console.log('Authenticated user ID:', userId);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User validation error:', userError);
        setError('Authentication error. Please log in again.');
        setIsUploading(false);
        return;
      }
      
      console.log('Validated user:', userData.user.id);
      
      if (userData.user.id !== userId) {
        console.error('User ID mismatch! Session:', userId, 'Auth:', userData.user.id);
        setError('Session validation failed. Please log in again.');
        setIsUploading(false);
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log('Attempting to upload to path:', filePath);
      
      let uploadedFilePath;
      try {
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        uploadedFilePath = filePath;
        console.log('File uploaded successfully:', data);
      } catch (uploadError: any) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message?.includes('bucket not found')) {
          setError('Storage bucket not configured. Please contact administrator.');
        } else {
          setError(`Storage error: ${uploadError.message}`);
        }
        setIsUploading(false);
        return;
      }
      
      try {
        const imageRecord = {
          user_id: userData.user.id,
          storage_path: filePath,
          original_filename: file.name,
          is_public: isPublic,
          title,
          description
        };
        
        console.log('Inserting record with user_id (UUID):', userData.user.id);
        
        const { data: insertData, error: dbError } = await supabase
          .from('images')
          .insert(imageRecord)
          .select();
          
        if (dbError) {
          console.error('Database insert error details:', dbError);
          throw dbError;
        }
        
        console.log('Database record created:', insertData);
      } catch (dbError: any) {
        console.error('Database insert error:', dbError);
        try {
          await supabase.storage
            .from('images')
            .remove([uploadedFilePath]);
          console.log('Cleaned up orphaned file after database error');
        } catch (cleanupError) {
          console.error('Failed to clean up file after DB error:', cleanupError);
        }
        
        if (dbError.code === '42501') {
          setError('Permission denied. RLS policy prevents this operation.');
        } else if (dbError.message.includes('violates row-level security')) {
          setError('RLS policy violation. User ID may not match the authenticated user.');
        } else {
          setError(`Database error: ${dbError.message}`);
        }
        setIsUploading(false);
        return;
      }
      
      router.push('/');
      
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!isStorageReady && !isUploading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Preparing Uploader...</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait a moment while we initialize the image uploader. If this takes too long, try refreshing the page.
          </p>
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 text-center sm:text-left">Create New Pin</h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 p-4 rounded-lg mb-6 flex items-start">
            <svg className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.293a1 1 0 001.414-1.414L10 10.586l.707-.707a1 1 0 00-1.414-1.414L8.586 10l-.707.707a1 1 0 001.414 1.414L10 11.414l.707.707A1 1 0 0010 14z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Upload Image
            </label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${preview ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'} border-dashed rounded-xl cursor-pointer transition-colors duration-150 ease-in-out ${preview ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              onClick={() => document.getElementById('file-upload')?.click()}
              onDrop={(e) => { 
                e.preventDefault(); 
                if (e.dataTransfer.files && e.dataTransfer.files[0]) { 
                  setFile(e.dataTransfer.files[0]); 
                  handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                }
              }}
              onDragOver={(e) => e.preventDefault()} // Necessary for onDrop to work
            >
              {preview ? (
                <div className="relative w-full max-w-md mx-auto aspect-video sm:aspect-square rounded-lg overflow-hidden shadow-inner">
                  <Image
                    src={preview}
                    alt="Selected image preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="space-y-1 text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <span className="relative bg-white dark:bg-gray-800 rounded-md font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 focus-within:ring-red-500">
                      Click to upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG, GIF up to 10MB. Recommended: Square or Vertical.
                  </p>
                </div>
              )}
              <input
                id="file-upload"
                name="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g. Amazing Sunset Over Mountains"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Optional: Share more details about your pin..."
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center pt-2">
            <input
              id="is-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="is-public" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
              Make this pin public (discoverable by others)
            </label>
          </div>
            
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700/50">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              disabled={isUploading || !isStorageReady}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : 'Upload Pin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 