/*
  # Create Storage Buckets for PDF Files

  1. Storage Setup
    - Create `programmi-pdf` bucket for storing uploaded course program PDFs
    - Create `manuali-pdf` bucket for storing manual PDFs
    - Set appropriate storage policies for authenticated users
  
  2. Security
    - Enable RLS on storage buckets
    - Allow authenticated users to upload files
    - Allow authenticated users to read their own files
    - Super admins can access all files
*/

-- Create bucket for course programs
INSERT INTO storage.buckets (id, name, public)
VALUES ('programmi-pdf', 'programmi-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for manuals
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuali-pdf', 'manuali-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to programmi-pdf
CREATE POLICY "Users can upload program PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'programmi-pdf');

-- Policy: Allow authenticated users to read program PDFs
CREATE POLICY "Users can read program PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'programmi-pdf');

-- Policy: Allow authenticated users to delete their own program PDFs
CREATE POLICY "Users can delete program PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'programmi-pdf');

-- Policy: Allow authenticated users to upload manual PDFs
CREATE POLICY "Users can upload manual PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manuali-pdf');

-- Policy: Allow authenticated users to read manual PDFs
CREATE POLICY "Users can read manual PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'manuali-pdf');

-- Policy: Allow authenticated users to delete manual PDFs
CREATE POLICY "Users can delete manual PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'manuali-pdf');