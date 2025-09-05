-- Enable RLS on the avatars bucket
-- This should already be enabled if you're getting the RLS error

-- Policy to allow authenticated users to upload their own avatars
-- Users can only upload files with their user ID in the filename
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND starts_with(name, auth.uid()::text)
);

-- Policy to allow authenticated users to view all avatars
-- This allows users to see profile pictures of other users
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT 
TO authenticated 
USING (bucket_id = 'avatars');

-- Policy to allow users to update/delete their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND starts_with(name, auth.uid()::text)
);

-- Policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND starts_with(name, auth.uid()::text)
);

-- Optional: If you want to allow public access to avatars (recommended for profile pictures)
-- This allows unauthenticated users to view avatars too
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');
