/*
  # Add classe_laurea_target column

  ## Changes
  - Add `classe_laurea_target` column to programmi_corso table
  - This stores the target degree class for matrix analysis
  - References the codice in classi_laurea table (not the old id)

  ## Notes
  - This allows the system to select the correct column from matrices during analysis
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programmi_corso' AND column_name = 'classe_laurea_target'
  ) THEN
    ALTER TABLE programmi_corso ADD COLUMN classe_laurea_target text;
  END IF;
END $$;