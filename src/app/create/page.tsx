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
    const setupStorage = async () => {
      setIsStorageReady(false);
      setError(null);
      try {
        console.log('CreatePage: Attempting to ensure RLS on storage.buckets...');
        const { data: rlsBucketsData, error: rlsBucketsError } = await supabase.rpc('ensure_rls_on_storage_buckets');
        if (rlsBucketsError) {
          console.error('CreatePage: RPC call to ensure_rls_on_storage_buckets failed:', rlsBucketsError);
          setError(`Storage setup error (RPC rlsBuckets): ${rlsBucketsError.message}`);
          return;
        } 
        if (!rlsBucketsData || !rlsBucketsData.success) {
          console.warn('CreatePage: RPC ensure_rls_on_storage_buckets did not succeed:', rlsBucketsData?.message);
          setError(`Storage setup error (RPC rlsBuckets): ${rlsBucketsData?.message || 'Unknown RPC error'}`);
          return;
        }
        console.log('CreatePage: RPC ensure_rls_on_storage_buckets reported success:', rlsBucketsData.message);

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
    
    // Check if file is an image
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Create preview
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
      
      // 1. Get the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      const userId = session.user.id;
      console.log('Authenticated user ID:', userId);
      
      // Önce getUserInfo ile kullanıcının geçerli olduğunu doğrulayalım
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
      
      // 2. Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Tüm dosyaları tek düz klasöre koyalım - RLS'ye takılmamak için
      const filePath = `${fileName}`;
      
      console.log('Attempting to upload to path:', filePath);
      
      // Önce dosyayı yükleyelim
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
      
      // 3. Şimdi veritabanı kaydını oluşturalım
      try {
        // Images tablosunda user_id alanı auth.users(id) tablosuna (UUID) referans veriyor
        // Bu nedenle doğru ID türünü kullanmalıyız
        const imageRecord = {
          user_id: userData.user.id, // auth.users tablosundaki UUID
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
        // Dosyayı temizleyelim
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
      
      // 4. Başarılı! Ana sayfaya yönlendirelim
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

  return (
    <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Pin</h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Image
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
                  ${preview ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50' : 
                  'border-gray-300 hover:border-red-500 dark:border-gray-600 dark:hover:border-red-400'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {preview ? (
                  <div className="relative w-full max-w-sm mx-auto aspect-square">
                    <Image
                      src={preview}
                      alt="Image preview"
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
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
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                placeholder="Give your pin a title"
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                placeholder="Tell everyone what your pin is about"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center">
              <input
                id="is-public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="is-public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Make this pin public
              </label>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Pin'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 