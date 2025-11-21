/*
  # Add motivazione_raccomandazione field to analisi table

  1. Changes
    - Add `motivazione_raccomandazione` text column to `analisi` table
    - This field stores the detailed explanation of why a specific textbook is recommended
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'motivazione_raccomandazione'
  ) THEN
    ALTER TABLE analisi ADD COLUMN motivazione_raccomandazione text;
  END IF;
END $$;
