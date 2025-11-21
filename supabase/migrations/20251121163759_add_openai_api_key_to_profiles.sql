/*
  # Add OpenAI API Key to Profiles

  1. Changes
    - Add `openai_api_key` column to `profiles` table
      - Type: text (nullable)
      - Purpose: Store OpenAI API key for each user
      - Encrypted at rest by Supabase
  
  2. Security
    - Column is nullable to allow gradual migration
    - Users can only read/update their own API key through RLS policies
    - API key is never exposed in public queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'openai_api_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN openai_api_key text;
  END IF;
END $$;